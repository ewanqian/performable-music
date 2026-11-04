"""Focused originals: replace only suspension and first four override bars.
Baseline render.py must run first. Generated audio stays local/ignored.
"""
from pathlib import Path
import json,math,subprocess,re
import numpy as np
import scipy.signal as sg
import soundfile as sf
ROOT=Path(__file__).resolve().parent;BASE=ROOT.parent;OUT=ROOT/'outputs'
OUT.mkdir(exist_ok=True);SR=44100;BEAT=60/128;BAR=4*BEAT
ref,sr=sf.read(BASE/'CRITICAL_FIELD_PRESSURE_TEST_preview.wav');assert sr==SR
base={k:sf.read(BASE/'stems'/f'{k}.wav')[0] for k in ['sub-impact','mechanism','harmonic','field']}
N=len(ref);start=31.875;end=52.5

def filt(x,hz,typ='lowpass'):
 return sg.sosfilt(sg.butter(2,hz,fs=SR,btype=typ,output='sos'),x)
def shape(n,attack=.003,release=.06):
 x=np.ones(n);a=min(n,int(attack*SR));r=min(n,int(release*SR))
 if a:x[:a]=np.linspace(0,1,a)
 if r:x[-r:]*=np.linspace(1,0,r)
 return x

def metal(midi,length,pressure=.7,seed=1203):
 t=np.arange(int(length*SR))/SR;f=440*2**((midi-69)/12)
 # Noninteger FM ratio and a damped split partial retain the original semitone/fifth cell.
 x=np.sin(2*np.pi*f*t+(1+pressure*6)*np.exp(-t*5)*np.sin(2*np.pi*f*1.618*t))
 x+=.31*np.sin(2*np.pi*f*3.873*t)*np.exp(-t*8)
 rng=np.random.default_rng(seed);x+=.09*filt(rng.normal(size=len(t)),2200,'highpass')*np.exp(-t*70)
 return filt(x,5800)*np.exp(-t*5.4)*shape(len(t),.002,.055)
def body(length=1.4,variant='A'):
 t=np.arange(int(length*SR))/SR;f=440*2**((14-69)/12) # D0 is not used: next octave D1
 f*=2
 phase=2*np.pi*np.cumsum(f+110*np.exp(-t*36))/SR
 x=.57*np.sin(phase)*np.exp(-t*4.5)+.23*np.sin(2*np.pi*2*f*t)*np.exp(-t*6)+.09*np.sin(2*np.pi*4*f*t)*np.exp(-t*9)
 noise=np.random.default_rng(4500 if variant=='A' else 4501).normal(size=len(t))
 shard=filt(filt(noise,650,'highpass'),6500)*np.exp(-t*45)
 x+=.19*shard
 if variant=='B':
  # A short high-impact fracture precedes the tuned body by 45ms; no continuous whoosh.
  x=np.concatenate([np.zeros(int(.045*SR)),x])[:len(t)]
  x+=.18*shard*np.sin(2*np.pi*83*t)**2
 return filt(x,25,'highpass')*shape(len(t),.001,.16)

def measure(p):
 r=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(p),'-af','loudnorm=I=-19:TP=-2:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 d=json.loads(re.findall(r'\{[\s\S]*?\}',r.stderr)[-1]);return {k:float(d[k]) for k in ['input_i','input_tp','input_lra']}
results={};raws={}
for version in ['A','B']:
 new={k:np.zeros_like(ref) for k in base}
 def stamp(k,x,t,level=1,pan=0):
  off=round(t*SR);m=min(len(x),N-off)
  if m>0:new[k][off:off+m]+=level*np.column_stack([x[:m]*np.cos((pan+1)*np.pi/4),x[:m]*np.sin((pan+1)*np.pi/4)])
 # Both versions remove the regular 3.75s kick skeleton; time can genuinely feel held.
 if version=='A':
  # Establish one recognizable three-note sentence twice. The third sentence loses
  # its expected A; the last Eb is left hanging. The hit completes that missing A.
  gesture=[(32.109375,62,.055),(32.578125,63,.044),(33.515625,69,.035),
           (35.859375,62,.049),(36.328125,63,.042),(37.265625,69,.031),
           (39.609375,62,.044),(40.078125,63,.041),
           (42.890625,62,.032),(43.359375,63,.027)]
  for j,(t,p,level) in enumerate(gesture):
   stamp('harmonic',metal(p,1.0,.28,90+j),t,level,(-1)**j*.2)
  # Low D disappears with the final incomplete sentence: registral expectation.
  t=np.arange(round(7.5*SR))/SR
  tone=(np.sin(2*np.pi*146.832*t)+.22*np.sin(2*np.pi*220.248*t))
  stamp('field',tone*.004*shape(len(t),.25,.8),start)
  silence=44.0625
 else:
  # Same sentence remembered through rhythm: two clear calls, then delayed/absent
  # answers. Stable pitch identity remains while the phrase stops predicting time.
  gesture=[(32.109375,62,.049),(32.578125,63,.042),(33.515625,69,.032),
           (35.859375,62,.045),(36.5625,63,.040),(37.734375,69,.027),
           (40.078125,62,.038),(40.78125,63,.033),
           (43.125,63,.021)]
  for j,(t,p,level) in enumerate(gesture):
   x=metal(p,.85 if j<6 else .48,.32+j*.035,190+j)
   stamp('harmonic',x,t,level,[-.35,.35,0][j%3])
  silence=43.59375
 # Distinct first attack, then a statement / gap / answer, not uninterrupted four-on-the-floor.
 stamp('sub-impact',body(1.6,version),45,.67)
 stamp('mechanism',metal(69,.68,.72,810),45,.17,0)
 stamp('harmonic',metal(62,1.15,.25,811),45+.5*BEAT,.09,-.2)
 phrase=([(45+1.5*BEAT,51),(45+2.75*BEAT,45),(46.875+.75*BEAT,50),(48.75,50),(48.75+1.5*BEAT,51),(48.75+3*BEAT,45),(50.625+2*BEAT,50)] if version=='A'
 else [(45+1.5*BEAT,63),(46.875+1.75*BEAT,57),(48.75+.25*BEAT,50),(48.75+2.5*BEAT,51),(50.625+.5*BEAT,45)])
 for j,(t,p) in enumerate(phrase):
  stamp('harmonic',metal(p,.54,.85 if version=='A' else 1.1,900+j),t,.18 if j%3==0 else .13,[-.35,.35,0][j%3])
 for j,t in enumerate(([46.875,48.75,50.625] if version=='A' else [47.578125,49.921875])):
  stamp('sub-impact',body(.65,version),t,.25 if j%2 else .31)
 for j,t in enumerate(([46.40625,49.6875,51.5625] if version=='A' else [46.640625,49.21875])):
  stamp('mechanism',metal(74,.13,.9,1010+j),t,.09,(-1)**j*.65)
 # Tight neutral interval before the common 45.000 event across every stem.
 for k in new:new[k][int(silence*SR):int(45*SR)]=0
 mask=np.zeros(N);lo=round(start*SR);hi=round(end*SR);mask[lo:hi]=1
 fade=round(.025*SR);mask[lo:lo+fade]=np.linspace(0,1,fade);mask[hi-fade:hi]=np.linspace(1,0,fade)
 stems={k:base[k]*(1-mask[:,None])+new[k]*mask[:,None] for k in base}
 replacement=np.tanh(sum(new.values())*1.25)/1.25
 master=ref*(1-mask[:,None])+replacement*mask[:,None]
 raw=OUT/f'{version}_raw.wav';sf.write(raw,master,SR,subtype='PCM_24');raws[version]=master
 folder=OUT/f'stems-{version}';folder.mkdir(exist_ok=True)
 for k,x in stems.items():sf.write(folder/f'{k}.wav',x,SR,subtype='PCM_24')
 results[version]={'raw':measure(raw),'pre_event_silence_seconds':45-silence,'edited_interval_seconds':[start,end]}
# Both futures have byte-identical floating-point source outside the focused replacement.
assert np.array_equal(raws['A'][:round(start*SR)],raws['B'][:round(start*SR)])
assert np.array_equal(raws['A'][round(end*SR):],raws['B'][round(end*SR):])
target=min(-19,min(x['raw']['input_i']-2-x['raw']['input_tp'] for x in results.values()))
for v in results:
 gain=target-results[v]['raw']['input_i']
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(OUT/f'{v}_raw.wav'),'-af',f'volume={gain}dB','-c:a','pcm_s24le',str(OUT/f'{v}.wav')],check=True)
 results[v]['gain_db']=gain;results[v]['matched']=measure(OUT/f'{v}.wav')
 assert results[v]['matched']['input_tp']<=-1.8
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss','29','-i',str(OUT/f'{v}.wav'),'-t','26','-c:a','pcm_s24le',str(OUT/f'{v}_29-55.wav')],check=True)
(ROOT/'audio-tests.json').write_text(json.dumps({'status':'REAL RUN: technical only','human_listening':'PENDING','bpm':128,'sample_rate':SR,'seconds':len(ref)/SR,'versions':results,'outside_edit_region_identical_before_matching':True,'notes':'A/B are original hypotheses. No claim of better music without human audition.'},indent=2)+'\n')
print(json.dumps(results,indent=2))
