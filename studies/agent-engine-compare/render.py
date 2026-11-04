"""Run the real SuperCollider NRT renderer. No alternate/fake audio renderer."""
from pathlib import Path
import argparse,os,subprocess,json,datetime,hashlib,re,signal,sys
ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--sc-app',type=Path,default=REPO/'local-only/toolchains/SuperCollider.app')
parser.add_argument('--timeout',type=int,default=90)
parser.add_argument('--variant',choices=['A','B'])
parser.add_argument('--output-dir',type=Path)
args=parser.parse_args()
sclang=args.sc_app/'Contents/MacOS/sclang'
scsynth=args.sc_app/'Contents/Resources/scsynth'
if not sclang.exists():
 sys.exit('SuperCollider absent. See README.md official free install steps or pass --sc-app /Applications/SuperCollider.app')
logs=ROOT/'renders/logs';logs.mkdir(parents=True,exist_ok=True)
stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
env=os.environ.copy();env['AFTERIMAGE_SCSYNTH']=str(scsynth.resolve())
if args.variant:env['AFTERIMAGE_VARIANT']=args.variant
if args.output_dir:
 args.output_dir.mkdir(parents=True,exist_ok=True)
 env['AFTERIMAGE_OUTPUT_DIR']=str(args.output_dir.resolve())
command=[str(sclang.resolve()),'-D',str(ROOT/'supercollider-afterimage.scd')]
p=subprocess.Popen(command,cwd=ROOT,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,start_new_session=True)
timed_out=False
try:out,_=p.communicate(timeout=args.timeout)
except subprocess.TimeoutExpired:
 timed_out=True;os.killpg(p.pid,signal.SIGTERM)
 try:out,_=p.communicate(timeout=5)
 except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);out,_=p.communicate()
logfile=logs/f'sclang-{stamp}.txt';logfile.write_text(out)
errors=[line for line in out.splitlines() if re.search(r'(^ERROR|^FAILURE|exception|Parse error|syntax error|FAILURE IN SERVER)',line,re.I)]
report={'attempt_utc':stamp,'sclang_exit':p.returncode,'timed_out':timed_out,'errors':errors,'log':str(logfile.relative_to(ROOT)),'real_sc_renderer':True,'completed_marker':'AFTERIMAGE_ALL_RENDERS_DONE' in out,'output_files':[]}
for v in ([args.variant] if args.variant else ['A','B']):
 f=(args.output_dir or ROOT/'renders')/f'Afterimage_{v}_raw.wav'
 report['output_files'].append({'path':str(f.relative_to(ROOT)),'exists':f.exists(),'bytes':f.stat().st_size if f.exists() else 0})
report['status']='PASS' if p.returncode==0 and not errors and report['completed_marker'] and all(x['bytes']>100 for x in report['output_files']) else 'FAIL'
reports=ROOT/'render-attempts.json'
prior=json.loads(reports.read_text()) if reports.exists() else []
prior.append(report);reports.write_text(json.dumps(prior,indent=2)+'\n')
print(out[-7000:]);print(json.dumps(report,indent=2))
if report['status']!='PASS':sys.exit(1)
