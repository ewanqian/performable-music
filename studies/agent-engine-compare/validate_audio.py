"""Loudness-match real SC outputs; verify technical facts without grading the music."""
from pathlib import Path
import subprocess,json,re,hashlib,math,secrets,platform
import numpy as np
import soundfile as sf
ROOT=Path(__file__).resolve().parent
R=ROOT/'renders'; R.mkdir(exist_ok=True)
P=json.loads((ROOT/'parameters.json').read_text())['render']
def measure(path):
 cmd=['ffmpeg','-hide_banner','-nostats','-i',str(path),'-af','loudnorm=I=-20:TP=-2:LRA=11:print_format=json','-f','null','-']
 p=subprocess.run(cmd,capture_output=True,text=True,check=True)
 d=json.loads(re.findall(r'\{[\s\S]*?\}',p.stderr)[-1])
 return {'integrated_lufs':float(d['input_i']),'true_peak_dbtp':float(d['input_tp']),'lra_lu':float(d['input_lra'])}
raw={v:measure(R/f'Afterimage_{v}_raw.wav') for v in 'AB'}
# Constant gains only, same integrated loudness; retain the designed silence and dynamics.
target=min(-20.,min(d['integrated_lufs']-2-d['true_peak_dbtp'] for d in raw.values()))
versions={}; signals={}
for v in 'AB':
 path=R/f'Afterimage_{v}_raw.wav'; y,sr=sf.read(path,always_2d=True);signals[v]=y
 assert sr==48000 and y.shape[1]==2 and np.isfinite(y).all()
 assert np.max(np.abs(y))>1e-5 and np.max(np.abs(y))<.999
 expected=P['preroll_seconds']+64*60/P['bpm']+P['tail_seconds']
 assert abs(len(y)/sr-expected)<.002
 dest=R/f'Afterimage_{v}.wav';gain=target-raw[v]['integrated_lufs']
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(path),'-af',f'volume={gain:.6f}dB','-c:a','pcm_s24le',str(dest)],check=True)
 m=measure(dest);assert abs(m['integrated_lufs']-target)<=.2 and m['true_peak_dbtp']<=-1.8
 versions[v]={'path':str(dest.relative_to(ROOT)),'sample_rate':sr,'channels':2,'duration_seconds':len(y)/sr,'pcm_subtype':sf.info(dest).subtype,'raw_measurement':raw[v],'gain_db':gain,'matched_measurement':m,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()}
# Same original motif, sound and expression at the opening. Use RAW files before independent level matching.
frame_end=int((P['preroll_seconds']+8*60/P['bpm']-.06)*48000)
assert np.array_equal(signals['A'][:frame_end],signals['B'][:frame_end])
rests=[]
for a,b in [(28,32),(44,48)]:
 lo=int((P['preroll_seconds']+a*60/P['bpm']+.08)*48000)
 hi=int((P['preroll_seconds']+b*60/P['bpm']-.04)*48000)
 peak=float(np.max(np.abs(signals['B'][lo:hi])))
 assert peak<1e-5,peak
 rests.append({'bars':[int(a/4)+1,int(b/4)],'raw_peak_dbfs':None if peak==0 else 20*math.log10(peak),'below_minus_100_dbfs':peak<1e-5})
assert abs(versions['A']['matched_measurement']['integrated_lufs']-versions['B']['matched_measurement']['integrated_lufs'])<=.2
# Random anonymous aliases. Key remains separate; do not open it before listening.
order=['A','B'];secrets.SystemRandom().shuffle(order)
for alias,v in zip(['X','Y'],order):
 (R/f'Listening_{alias}.wav').write_bytes((R/f'Afterimage_{v}.wav').read_bytes())
(R/'BLIND_KEY.json').write_text(json.dumps(dict(zip(['X','Y'],order)),indent=2)+'\n')
report={'date':'2026-11-04','status':'PASS: technical render and file validation only','human_listening':'NOT REVIEWED','engine':'SuperCollider 3.14.1 / real scsynth NRT','versions':versions,'target_lufs':target,'same_opening_pcm':True,'B_measured_silence':rests,'errors':[],'scope_limits':['Synthesized struck-string/key tone; not a sampled acoustic piano','A/B comparison changes a compositional strategy, not a single isolated variable','No acoustic/subjective listening or musical self-score','No real-time latency, hardware or stage-safety test','Existing Ableton session not accessed or changed in this task']}
(ROOT/'TEST_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
