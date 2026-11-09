"""Save this ONE instrument's native performance as an editable Waveform edit.

The one MIDI note is a sustained exciter/gate; there is no written note sequence
and no exported MIDI song. Recorded native CV curves contain the performance.
"""
from pathlib import Path
import sys,re,json,math,subprocess,shutil,argparse
R=Path(__file__).resolve().parent;REPO=R.parents[1]
sys.path.insert(0,str(R.parent/'018-agent-synth-compositions'))
from waveform_project import create

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--take',default='take-06');ap.add_argument('--out',default='final-06');a=ap.parse_args()
    source=R/'outputs'/a.take;out=R/'outputs'/a.out;out.mkdir(exist_ok=False)
    measurement=subprocess.run(['/opt/homebrew/bin/ffmpeg','-hide_banner','-i',str(source/'RAW_CONTINUOUS_INSTRUMENT.wav'),
        '-filter_complex','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,check=True)
    (out/'RAW_LOUDNESS.log').write_text(measurement.stdout+measurement.stderr)
    rawlog=measurement.stderr.rsplit('Summary:',1)[-1]
    lufs=float(re.search(r'I:\s+(-?[\d.]+) LUFS',rawlog).group(1))
    truepeak=float(re.search(r'Peak:\s+(-?[\d.]+) dBFS',rawlog).group(1))
    change=min(-20-lufs,-2-truepeak)
    gain=10**(change/20)
    score={'title':'CURRENT - continuous electronic instrument','seconds':90,'bpm':60,'meter':[4,4],
           'tracks':{'CURRENT':[[50,.1,81.4,90]]}}
    edit=out/'CURRENT_90s_EDITABLE.tracktionedit'
    create(score,{'CURRENT':source/'CURRENT_90s.state'},edit,{'CURRENT':gain})
    for src,name in [(source/'CURRENT_90s.native.json','CURRENT_PERFORMANCE_R2.json'),
                     (source/'CURRENT_90s.state','CURRENT_PERFORMANCE_R2.state')]:
        dst=R/'patches'/name
        if dst.exists():raise FileExistsError(dst)
        shutil.copy2(src,dst)
    cmd=['/Applications/Waveform 14.app/Contents/MacOS/Waveform 14','render',str(edit),'-o',str(out/'CURRENT_90s.wav'),
         '--format','wav','--sample-rate','48000','--bit-depth','24','--channels','stereo',
         '--start','0','--end','90','--no-tails','--json']
    job=subprocess.run(cmd,capture_output=True,text=True)
    (out/'WAVEFORM_RENDER.log').write_text(job.stdout+job.stderr)
    assert job.returncode==0,job.stdout+job.stderr
    (out/'EXPORT.json').write_text(json.dumps({'source':a.take+' native continuous take',
        'native_command':cmd,'raw_lufs':lufs,'raw_true_peak':truepeak,'static_master_change_db':change,
        'dynamic_master_gain':'NONE','tracks':1,'note_events':'one note-on and one note-off only',
        'artistic_acceptance':'PENDING','model_audition':'NOT_PERFORMED'},indent=2)+'\n')
    print(out/'CURRENT_90s.wav',flush=True)

if __name__=='__main__':main()
