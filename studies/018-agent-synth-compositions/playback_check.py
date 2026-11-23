"""Actual macOS file playback execution; not a claim of acoustic monitoring."""
from pathlib import Path
import subprocess,time,json
R=Path(__file__).resolve().parent
D=Path.home()/'Downloads/CRITICAL_FIELD_THREE_COMPOSITIONS_2026-11-09'
results=[]
for path in sorted(D.glob('0*.wav')):
    start=time.monotonic()
    run=subprocess.run(['/usr/bin/afplay','-v','0.15',str(path)],capture_output=True,text=True)
    result=dict(file=str(path),returncode=run.returncode,wall_seconds=time.monotonic()-start,
        playback_level_linear=.15,stderr=run.stderr,acoustic_monitoring='NOT_TESTED',
        human_listening='PENDING',music_acceptance='PENDING')
    results.append(result);print(json.dumps(result),flush=True)
(R/'outputs/PLAYBACK_RESULTS.json').write_text(json.dumps(results,indent=2)+'\n')
