"""Check real audio, frame-aligned stems, MIDI bar count and packaged media refs."""
from pathlib import Path
import json,hashlib,xml.etree.ElementTree as ET
import numpy as np,soundfile as sf,mido
R=Path(__file__).resolve().parent;O=R/'outputs';report={}
for version in ['A','B']:
 x,sr=sf.read(O/f'PREVIEW_{version}.wav');assert sr==48000 and len(x)==1512000
 assert np.isfinite(x).all() and np.max(np.abs(x))<1
 total=np.zeros_like(x)
 for role in ['bass','percussion','metal','pressure']:
  y,rate=sf.read(O/version/'stems'/f'{role}.wav');assert rate==sr and y.shape==x.shape;total+=y
 error=float(np.max(np.abs(total-x)));assert error<1e-6
 for role in ['bass','metal','kick','snare','pressure']:
  mid=mido.MidiFile(O/f'{version}-{role}.mid');assert sum(m.time for m in mid.tracks[0])==64*960
 tree=ET.parse(O/'Waveform-source-package'/version/f'CF_16bar_{version}.tracktionedit')
 clips=list(tree.getroot().iter('AUDIOCLIP'));assert len(clips)==16
 for c in clips:assert Path(c.get('source')).exists()
 report[version]={'format':'PCM24 stereo48k','seconds':len(x)/sr,'bars':16,'source_note_data':'original score.json','peak':float(np.max(np.abs(x))),'stems_reconstruction_error':error,'prepared_edit_media_references':len(clips),'Waveform_open_save_export':'NOT RUN'}
v=json.loads((R/'source-recovery-tests.json').read_text());assert v['high_low_rms_ratio']>1.2 and len(v['restore'])==5
p=json.loads((R/'evidence/plugdata-test.json').read_text());assert p['nonzero_samples']>10 and p['peak']<.9
report['source_velocity_restore']='PASS actual VST3 render/reload';report['plugdata_impulse']='PASS actual FX process; 64 samples latency';report['human_audition']='PENDING';report['Waveform_DAW']='NOT RUN'
(R/'package-tests.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
