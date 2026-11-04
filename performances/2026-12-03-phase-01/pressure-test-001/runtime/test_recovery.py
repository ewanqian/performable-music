"""Exercise the owned loopback runtime; never touches other audio applications."""
from pathlib import Path
import json,time,subprocess,urllib.request,sys,os,signal
import numpy as np,soundfile as sf
R=Path(__file__).resolve().parent

def api(cmd):
 req=urllib.request.Request('http://127.0.0.1:18080/api/'+cmd,method='GET' if cmd=='state' else 'POST')
 return json.load(urllib.request.urlopen(req))
def ctl(cmd):subprocess.run([sys.executable,str(R/'control.py'),cmd],check=True,capture_output=True)
def rms(x):return float(np.sqrt(np.mean(x*x)))
mode=sys.argv[1]
if mode=='manual':
 ctl('arm');sid=api('start')['session'];time.sleep(6)
 before=api('state');at=time.monotonic();ctl('kill');time.sleep(2)
 after=api('state');api('stop');time.sleep(.5)
 x,sr=sf.read(R/'evidence'/f'{sid}-sc.wav')
 result={'test':'independent_terminal_software_kill','session':sid,'kill_at_monotonic':at,'seq_before':before['seq'],'seq_after':after['seq'],'fresh_frames_continued':after['seq']>before['seq'],'conductor_reports_latched':after['killed'],'before_rms':rms(x[int(2*sr):int(5.5*sr)]),'after_rms':rms(x[-int(1.2*sr):]),'physical_kill':'NOT RUN'}
 result['pass']=result['fresh_frames_continued'] and result['conductor_reports_latched'] and result['before_rms']>1e-5 and result['after_rms']<1e-6
 (R/'evidence/manual-kill.json').write_text(json.dumps(result,indent=2));print(result)
elif mode=='disconnect':
 ctl('arm');sid=api('start')['session'];time.sleep(6)
 candidates=[]
 for line in subprocess.check_output(['ps','-axo','pid=,command='],text=True).splitlines():
  pid,command=line.strip().split(None,1)
  if 'python' in command.lower() and command.rstrip().endswith('runtime/conductor.py'):candidates.append(int(pid))
 assert len(candidates)==1,candidates
 pid=candidates[0];at=time.monotonic();os.kill(pid,signal.SIGSTOP);time.sleep(1.5)
 ctl('stop_record');time.sleep(.3)
 x,sr=sf.read(R/'evidence'/f'{sid}-sc.wav')
 result={'test':'conductor_SIGSTOP_stale_input','session':sid,'pid':pid,'disconnect_at_monotonic':at,'before_rms':rms(x[int(2*sr):int(5.5*sr)]),'after_rms':rms(x[-int(.5*sr):]),'watchdog_limit_seconds':.75,'pid_still_paused':True}
 result['pass']=result['before_rms']>1e-5 and result['after_rms']<1e-6
 (R/'evidence/disconnect.json').write_text(json.dumps(result,indent=2));print(result)
elif mode=='resume':
 d=json.loads((R/'evidence/disconnect.json').read_text());ctl('kill');os.kill(d['pid'],signal.SIGCONT);time.sleep(.25);api('stop');d['pid_still_paused']=False;(R/'evidence/disconnect.json').write_text(json.dumps(d,indent=2))
