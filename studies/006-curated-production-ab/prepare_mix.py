"""Actual plugin/DSP preparation mix; final Waveform save/export gate is separate.
No reference samples. All waveforms originate in the installed Surge XT VST3.
"""
from pathlib import Path
import json,subprocess,re
import numpy as np,soundfile as sf
from pedalboard import Pedalboard,HighpassFilter,LowpassFilter,PeakFilter,Compressor,Gain
from plugdata_host import load as load_memory
R=Path(__file__).resolve().parent;O=R/'outputs';SR=48000;BEAT=60/128
scores=json.loads((R/'score.json').read_text())
CHAINS={
 'bass':[HighpassFilter(28),PeakFilter(180,-2.5,0.8),LowpassFilter(2200),Compressor(-25,1.7,18,95),Gain(8)],
 'kick':[HighpassFilter(30),PeakFilter(145,-3.5,1),LowpassFilter(8500),Compressor(-15,2,12,65),Gain(-4)],
 'snare':[HighpassFilter(190),LowpassFilter(9000),Gain(8)],
 'metal':[HighpassFilter(420),PeakFilter(3200,-3,1),LowpassFilter(10000),Compressor(-20,2,6,75)],
 'pressure':[HighpassFilter(300),LowpassFilter(6000),Gain(18)]}
def measure(path):
 p=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(path),'-af','loudnorm=I=-18:TP=-2:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 d=json.loads(re.findall(r'\{[\s\S]*?\}',p.stderr)[-1]);return {k:float(d[k]) for k in ['input_i','input_tp','input_lra']}
report={'status':'REAL PREPARATION MIX; NOT A WAVEFORM DAW EXPORT','sample_rate':SR,'stem_names':['bass','percussion','metal','pressure'],'chains':{k:[str(p) for p in v] for k,v in CHAINS.items()},'versions':{},'human_audition':'PENDING','DAW_export':'NOT RUN'}
raws={};stem_sets={}
for version,score in scores.items():
 roles={}
 for role in CHAINS:
  x,sr=sf.read(O/version/'dry'/f'{role}.wav',dtype='float32');assert sr==SR
  x=Pedalboard(CHAINS[role])(x.T,SR).T
  if role in ['bass','kick']:x[:]=np.mean(x,axis=1)[:,None]
  roles[role]=x
 n=len(roles['bass']);t=np.arange(n)/SR
 # Bass/kick dialogue: narrow duck only at real kick onsets. No constant pumping.
 envelope=np.ones(n)
 for note in score['notes']['kick']:
  onset=note['beat']*BEAT;age=t-onset;window=(age>=0)&(age<.15)
  gain=np.ones(n);gain[window]=1-.30*(1-np.exp(-age[window]/.003))*np.exp(-age[window]/.055)
  envelope=np.minimum(envelope,gain)
 roles['bass']*=envelope[:,None]
 # Authored spatial reply, then bounded plugdata early reflections on metal only.
 mono=np.mean(roles['metal'],axis=1);pan=np.zeros(n)
 for j,note in enumerate(score['notes']['metal']):
  first=round(note['beat']*BEAT*SR);next_note=score['notes']['metal'][j+1]['beat']*BEAT if j+1<len(score['notes']['metal']) else n/SR
  last=min(n,round(next_note*SR));pan[first:last]=[-.22,.28,.10,-.30][j%4]
 smooth=1-np.exp(-1/(.02*SR))
 from scipy.signal import lfilter
 pan=lfilter([smooth],[1,-(1-smooth)],pan)
 metal=np.column_stack([mono*np.sqrt(1-pan),mono*np.sqrt(1+pan)]).astype('float32')
 memory=load_memory();metal=memory(metal.T,SR,reset=False).T
 # Actual impulse test found 64-sample plugdata pipeline delay. Compensate it.
 metal=np.pad(metal[64:],((0,64),(0,0)));roles['metal']=metal
 (O/version/'processed').mkdir(exist_ok=True)
 (O/version/'processed/metal-memory.state').write_bytes(memory.raw_state)
 # Phrase rests include sound tails; short ramps prevent clicks.
 mask=np.ones(n);fade=round(.008*SR)
 for a,b in score['rests_beats']:
  lo=round(a*BEAT*SR);hi=round(b*BEAT*SR)
  if b==64:hi=n
  mask[lo:hi]=0
  if lo>=fade:mask[lo-fade:lo]*=np.linspace(1,0,fade)
  if hi+fade<n:mask[hi:hi+fade]*=np.linspace(0,1,fade)
 stems={'bass':roles['bass'],'percussion':roles['kick']+roles['snare'],'metal':roles['metal'],'pressure':roles['pressure']}
 for k in stems:stems[k]*=mask[:,None]
 mix=sum(stems.values());raw=O/f'PREVIEW_{version}_raw.wav';sf.write(raw,mix,SR,subtype='FLOAT')
 for role,x in roles.items():sf.write(O/version/'processed'/f'{role}.wav',x*mask[:,None],SR,subtype='PCM_24')
 raws[version]=mix;stem_sets[version]=stems;report['versions'][version]={'before_matching':measure(raw)}
# A common integrated loudness target constrained by both true-peak headrooms.
target=min(-18.,min(d['before_matching']['input_i']-2.2-d['before_matching']['input_tp'] for d in report['versions'].values()))
for v in raws:
 gain=target-report['versions'][v]['before_matching']['input_i'];amp=10**(gain/20)
 out=O/f'PREVIEW_{v}.wav';sf.write(out,raws[v]*amp,SR,subtype='PCM_24')
 folder=O/v/'stems';folder.mkdir(exist_ok=True)
 for k,x in stem_sets[v].items():sf.write(folder/f'{k}.wav',x*amp,SR,subtype='PCM_24')
 report['versions'][v].update(gain_db=gain,measured=measure(out))
 assert report['versions'][v]['measured']['input_tp']<=-2.0
 # Stems reconstruct the exported prep mix within PCM24 rounding error.
 restored=sum(sf.read(folder/f'{k}.wav')[0] for k in stem_sets[v]);mix=sf.read(out)[0]
 error=float(np.max(np.abs(restored-mix)));assert error<1e-6
 report['versions'][v]['stem_reconstruction_max_error']=error
(R/'mix-preparation-tests.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
