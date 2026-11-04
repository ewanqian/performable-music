"""Render two score proofs and one stem-level finish revision; no DAW-quality claim."""
from pathlib import Path
import sys,json,subprocess,re,struct
import numpy as np,soundfile as sf,mido
from pedalboard import load_plugin,Pedalboard,HighpassFilter,LowpassFilter,PeakFilter,Compressor,Gain
R=Path(__file__).resolve().parent;BASE=R.parent/'006-curated-production-ab';O=R/'outputs';O.mkdir(exist_ok=True)
sys.path.insert(0,str(BASE));from surge_host import PLUGIN
SR=48000

def measure(p):
 x=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(p),'-af','loudnorm=I=-21:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 d=json.loads(re.findall(r'\{[\s\S]*?\}',x.stderr)[-1]);return {k:float(d[k]) for k in ['input_i','input_tp','input_lra']}
report={'status':'REAL offline render; Waveform native export NOT RUN','human_listening':'PENDING','trials':{}}
# Existing 01 is B: use its real aligned stems, preserve the source and its rests.
stems={k:sf.read(BASE/'outputs/B/stems'/f'{k}.wav',dtype='float32')[0] for k in ['bass','percussion','metal','pressure']}
new={}
new['bass']=Pedalboard([PeakFilter(280,-1.5,.8),Compressor(-20,1.35,20,100),Gain(.8)])(stems['bass'].T,SR).T
# Catch isolated needle peaks on the percussion bus, before any mastering gain.
p=stems['percussion'];new['percussion']=.65*p+.35*.28*np.tanh(p/.28)
new['percussion']=Pedalboard([PeakFilter(2600,-1.5,.9),Compressor(-19,1.5,9,85)])(new['percussion'].T,SR).T
new['metal']=Pedalboard([PeakFilter(3400,-2.2,1.1),LowpassFilter(8700),Gain(-1)])(stems['metal'].T,SR).T
mid=new['metal'].mean(axis=1);side=(new['metal'][:,0]-new['metal'][:,1])*.5*.75
new['metal']=np.column_stack([mid+side,mid-side]);new['pressure']=stems['pressure']*.8
folder=O/'finish-stems';folder.mkdir(exist_ok=True)
for k,v in new.items():sf.write(folder/f'{k}.wav',v,SR,subtype='PCM_24')
x=sum(new.values());x=Pedalboard([Compressor(-17,1.2,30,130)])(x.T,SR).T
sf.write(O/'finish_raw.wav',x,SR,subtype='FLOAT');before=measure(BASE/'outputs/PREVIEW_B.wav');after=measure(O/'finish_raw.wav')
gain=before['input_i']-after['input_i'];sf.write(O/'FINISH_EQUAL_LEVEL.wav',x*10**(gain/20),SR,subtype='PCM_24')
sf.write(O/'BEFORE_EQUAL_LEVEL.wav',sf.read(BASE/'outputs/PREVIEW_B.wav')[0],SR,subtype='PCM_24')
# Separate delivery-volume experiment; level-matched comparison above is the tonal test.
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(O/'finish_raw.wav'),'-af',f"volume={-21-after['input_i']}dB,aresample=192000,alimiter=limit=0.841395:attack=5:release=100:level=false,aresample=48000",'-c:a','pcm_s24le',str(O/'FINISH_DELIVERY_TRIAL.wav')],check=True)
report['finish']={'before':before,'equal_level':measure(O/'FINISH_EQUAL_LEVEL.wav'),'delivery_trial':measure(O/'FINISH_DELIVERY_TRIAL.wav'),'note':'Per-bus tone/peak revision plus mild glue. Equal-level audition required; delivery loudness is a separate test. Not an approved master.'}
if (R/'RUN_RESULTS.json').exists():report['trials']=json.loads((R/'RUN_RESULTS.json').read_text())['trials']
for score in json.loads((R/'nine-scores.json').read_text()):
 if '--finish-only' in sys.argv:break
 if score['id'] not in ['01','07']:continue
 if '--one' in sys.argv and score['id']!=sys.argv[sys.argv.index('--one')+1]:continue
 buses={}
 for role,events in score['notes'].items():
  p=load_plugin(str(PLUGIN));p.raw_state=(BASE/f'outputs/A/dry/{role}.state').read_bytes();p([],duration=.03,sample_rate=SR,num_channels=2,reset=False)
  msgs=[]
  for n in events:msgs.extend([(bytes(mido.Message('note_on',note=n['note'],velocity=n['velocity']).bytes()),n['beat']*60/128),(bytes(mido.Message('note_off',note=n['note']).bytes()),(n['beat']+n['duration'])*60/128)])
  x=p(sorted(msgs,key=lambda m:m[1]),duration=16,sample_rate=SR,num_channels=2,reset=False).T
  if role=='bass':x=Pedalboard([HighpassFilter(28),Gain(5)])(x.T,SR).T
  if role=='kick':x=.12*np.tanh(x/.12)*.7
  if role=='metal':x=Pedalboard([HighpassFilter(420),PeakFilter(3400,-2,1),Gain(-2)])(x.T,SR).T
  buses[role]=x
 mix=sum(buses.values());peak=np.max(np.abs(mix));assert peak>1e-5 and np.isfinite(mix).all()
 mix*=min(3.,.6/peak);path=O/f"SKETCH_{score['id']}.wav";sf.write(path,mix,SR,subtype='PCM_24')
 report['trials'][score['id']]={'name':score['name'],'seconds':16,'bars':8,'measured':measure(path),'engine':'actual Surge XT saved production states','status':'sonic score proof; not final mix'}
(R/'RUN_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
