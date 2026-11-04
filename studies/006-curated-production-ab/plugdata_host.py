"""Load an original .pd patch through plugdata's documented-by-source saved state.
No third-party DSP code is copied. State format checked against v0.9.3 source.
"""
from pathlib import Path
import struct,xml.etree.ElementTree as ET
import numpy as np
from pedalboard import load_plugin
from surge_host import encode,decode
R=Path(__file__).resolve().parent

def binary_xml(root):
 xml=ET.tostring(root,encoding='utf-8');return b'VC2!'+struct.pack('<I',len(xml))+xml+b'\0'
def load():
 plugin=next((p for p in [Path.home()/'Library/Audio/Plug-Ins/VST3/plugdata-fx.vst3',Path('/Library/Audio/Plug-Ins/VST3/plugdata-fx.vst3')] if p.exists()),None)
 if plugin is None:raise FileNotFoundError('Install the official plugdata-fx VST3 first')
 p=load_plugin(str(plugin))
 raw=p.raw_state;wrapper=ET.fromstring(raw[8:-1]);component=decode(wrapper.find('IComponent').text)
 assert component[:16]==bytes(16) and component[20:24]==b'VC2!'
 size=struct.unpack('<I',component[24:28])[0];state=ET.fromstring(component[28:28+size])
 patches=state.find('Patches');patches.clear()
 ET.SubElement(patches,'Patch',{'Content':(R/'metal-memory.pd').read_text(),'Location':str(R/'metal-memory.pd'),'PluginMode':'1','PluginModeScale':'100','SplitIndex':'0'})
 state.find("PARAM[@id='volume']").set('value','0.8')
 xml=binary_xml(state)
 # Zero legacy patches, latency, oversampling and tail; XML is authoritative.
 component=bytes(16)+struct.pack('<I',len(xml))+xml
 wrapper.find('IComponent').text=encode(component);p.raw_state=binary_xml(wrapper)
 p(np.zeros((2,4800),np.float32),48000,reset=False)
 return p
if __name__=='__main__':
 import json,soundfile as sf
 (R/'evidence').mkdir(exist_ok=True)
 p=load();x=np.zeros((2,12000),np.float32);x[0,100]=.2;x[1,500]=.2
 y=p(x,48000,reset=False);assert np.isfinite(y).all()
 indices=np.flatnonzero(np.max(np.abs(y),axis=0)>1e-5)
 result={'name':p.name,'nonzero_samples':len(indices),'peak':float(np.max(np.abs(y))),'first_sample':int(indices[0]) if len(indices) else None,'input_peak':.2}
 assert len(indices)>10 and result['peak']<.9,result
 sf.write(R/'evidence/plugdata-impulse.wav',y.T,48000,subtype='PCM_24');(R/'evidence/plugdata-loaded.state').write_bytes(p.raw_state)
 (R/'evidence/plugdata-test.json').write_text(json.dumps(result,indent=2));print(result)
