"""Verify saved receipts and actual recordings; fails instead of marking absent evidence PASS."""
from pathlib import Path
import json,hashlib
import soundfile as sf
import numpy as np
from jsonschema import Draft202012Validator
R=Path(__file__).resolve().parent
rows=[json.loads(s) for s in (R/'evidence/conductor.ndjson').read_text().splitlines()]
summary=json.loads((R/'TEST_RESULTS.json').read_text());sid=summary['session']
frames=[x for x in rows if x['kind']=='frame_sent' and x['frame']['session_id']==sid]
v=Draft202012Validator(json.loads((R.parents[3]/'protocols/show-score-v1.schema.json').read_text()))
for row in frames:
 v.validate(row['frame'])
 assert row['hash']==hashlib.sha256(json.dumps(row['frame'],sort_keys=True,separators=(',',':')).encode()).hexdigest()
event=next(x for x in frames if x['frame']['event'] and x['frame']['event']['type']=='OVERRIDE');eid=event['frame']['event']['id'];h=event['hash']
sc=[x for x in rows if x['kind']=='sc_receipt' and x['address']=='/critical/event_applied' and x['args'][0]==eid and x['args'][2]==h]
visual=[x for x in rows if x['kind']=='visual_event' and x['session']==sid and x['data']['id']==eid and x['data']['hash']==h]
assert len(sc)==len(visual)==1
x,sr=sf.read(R/f'evidence/{sid}-sc.wav');assert sr==48000 and len(x)/sr>=60 and np.max(np.abs(x))>.01
for name in ['manual-kill','disconnect']:
 result=json.loads((R/f'evidence/{name}.json').read_text());assert result['pass']
 audio,rate=sf.read(R/f"evidence/{result['session']}-sc.wav")
 assert np.sqrt(np.mean(audio[-int(.5*rate):]**2))<1e-6
print(f'PASS technical evidence: {len(frames)} schema-valid frames, same-event receipts, real SC audio, kill and disconnect silence. Human quality NOT graded.')
