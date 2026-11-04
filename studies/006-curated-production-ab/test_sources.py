"""Meaningful source checks: audible velocity response and saved-state reload."""
from pathlib import Path
import json,sys,mido,numpy as np
from pedalboard import load_plugin
from surge_host import load,PLUGIN,patch_metadata
R=Path(__file__).resolve().parent;results={}
for vel in [48,112]:
 p=load('patches_factory/Basses/Rubber Bass.fxp');p.fx_chain_bypass='All FX Off';p.global_volume=-6.0;p.a_filter_1_cutoff=620.0;p.a_filter_1_resonance=10.0;p.a_velocity_vca_gain=-22.0;p.b_velocity_vca_gain=-22.0
 events=[(bytes(mido.Message('note_on',note=31,velocity=vel).bytes()),.1),(bytes(mido.Message('note_off',note=31).bytes()),.4)]
 x=p(events,duration=.7,sample_rate=48000,num_channels=2,reset=False)
 results[str(vel)]={'rms':float(np.sqrt(np.mean(x*x))),'peak':float(np.max(np.abs(x)))}
ratio=results['112']['rms']/results['48']['rms'];assert ratio>1.2,results
restored=[]
for role in ['bass','metal','kick','snare','pressure']:
 p=load_plugin(str(PLUGIN));p.raw_state=(R/f'outputs/A/dry/{role}.state').read_bytes();p([],duration=.03,sample_rate=48000,num_channels=2,reset=False)
 pitch=31 if role=='bass' else 62
 x=p([(bytes(mido.Message('note_on',note=pitch,velocity=100).bytes()),.1),(bytes(mido.Message('note_off',note=pitch).bytes()),.3)],duration=.6,sample_rate=48000,num_channels=2,reset=False)
 assert np.max(np.abs(x))>1e-6,role
 restored.append({'role':role,'meta':patch_metadata(p),'peak':float(np.max(np.abs(x)))})
report={'status':'REAL RUN','velocity':results,'high_low_rms_ratio':ratio,'restore':restored,'DAW_save_reload':'NOT RUN','human_audition':'PENDING'}
(R/'source-recovery-tests.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
