"""Render actual Surge presets to dry production sources. These are not DAW bounces.
Final Waveform edits/exports and human audition remain separate required gates.
"""
from pathlib import Path
import json,hashlib,sys
import mido,numpy as np,soundfile as sf
from surge_host import load,patch_metadata
R=Path(__file__).resolve().parent;OUT=R/'outputs';E=R/'evidence';E.mkdir(exist_ok=True)
SCORES=json.loads((R/'score.json').read_text());SR=48000;BEAT=60/128;DURATION=64*BEAT+1.5
PARAMS={
'bass':{'a_velocity_vca_gain':-22.0,'b_velocity_vca_gain':-22.0,'fx_chain_bypass':'All FX Off','global_volume':-6.0,'a_filter_1_cutoff':620.0,'a_filter_1_resonance':10.0},
'metal':{'a_velocity_vca_gain':-18.0,'b_velocity_vca_gain':-18.0,'fx_chain_bypass':'All FX Off','global_volume':-10.0},
'kick':{'a_velocity_vca_gain':-12.0,'b_velocity_vca_gain':-12.0,'fx_chain_bypass':'All FX Off','global_volume':-8.0},
'snare':{'a_velocity_vca_gain':-24.0,'b_velocity_vca_gain':-24.0,'fx_chain_bypass':'All FX Off','global_volume':-13.0},
'pressure':{'a_velocity_vca_gain':-10.0,'b_velocity_vca_gain':-10.0,'fx_chain_bypass':'All FX Off','global_volume':-19.0}}
report={'status':'REAL SURGE VST3 SOURCE RENDER; not Waveform export','sample_rate':SR,'duration':DURATION,'versions':{},'roles':{}}
for version,score in SCORES.items():
 folder=OUT/version/'dry';folder.mkdir(parents=True,exist_ok=True);report['versions'][version]={}
 for role,patch in score['patches'].items():
  p=load(patch)
  metadata=patch_metadata(p)
  for key,value in PARAMS[role].items():setattr(p,key,value)
  report['roles'][role]={'factory_patch':patch,'metadata':metadata,'production_changes':{k:str(getattr(p,k)) for k in PARAMS[role]}}
  events=[]
  for note in score['notes'][role]:
   events.extend([(bytes(mido.Message('note_on',note=note['note'],velocity=note['velocity']).bytes()),note['beat']*BEAT),
     (bytes(mido.Message('note_off',note=note['note']).bytes()),(note['beat']+note['duration'])*BEAT)])
  for cc in score['controllers'][role]:events.append((bytes(mido.Message('control_change',control=cc['cc'],value=cc['value']).bytes()),cc['beat']*BEAT))
  events.sort(key=lambda e:e[1]);state=p.raw_state;(folder/f'{role}.state').write_bytes(state)
  audio=p(events,duration=DURATION,sample_rate=SR,num_channels=2,reset=False)
  assert np.isfinite(audio).all() and np.max(np.abs(audio))>1e-5,role
  sf.write(folder/f'{role}.wav',audio.T,SR,subtype='PCM_24')
  report['versions'][version][role]={'peak':float(np.max(np.abs(audio))),'rms':float(np.sqrt(np.mean(audio**2))),'notes':len(score['notes'][role]),'state_sha256':hashlib.sha256(state).hexdigest()}
  print(version,role,report['versions'][version][role],flush=True)
(R/'source-render-tests.json').write_text(json.dumps(report,indent=2)+'\n')
