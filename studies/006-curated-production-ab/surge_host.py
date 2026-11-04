"""Offline Surge XT preset audition, using the real installed VST3 processor.
This supports preparation, not a claim of a Waveform DAW export.
JUCE XML state/MemoryBlock encoding verified against JUCE's official format.
"""
from pathlib import Path
import struct,re,xml.etree.ElementTree as ET
from pedalboard import load_plugin
ALPHABET='.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+'
PLUGIN=next((p for p in [Path.home()/'Library/Audio/Plug-Ins/VST3/Surge XT.vst3',Path('/Library/Audio/Plug-Ins/VST3/Surge XT.vst3')] if p.exists()),Path.home()/'Library/Audio/Plug-Ins/VST3/Surge XT.vst3')
DATA=next((p for p in [Path.home()/'Library/Application Support/Surge XT',Path('/Library/Application Support/Surge XT')] if (p/'patches_factory').exists()),Path.home()/'Library/Application Support/Surge XT')

def encode(data):
 acc=bits=0;out=[]
 for byte in data:
  acc|=byte<<bits;bits+=8
  while bits>=6:out.append(ALPHABET[acc&63]);acc>>=6;bits-=6
 if bits:out.append(ALPHABET[acc&63])
 return str(len(data))+'.'+''.join(out)
def decode(s):
 n,s=s.split('.',1);acc=bits=0;out=bytearray()
 for c in s:
  acc|=ALPHABET.index(c)<<bits;bits+=6
  while bits>=8:out.append(acc&255);acc>>=8;bits-=8
 return bytes(out[:int(n)])
def load(patch):
 p=load_plugin(str(PLUGIN));raw=p.raw_state;root=ET.fromstring(raw[8:-1])
 fxp=(DATA/patch).read_bytes();assert fxp[:4]==b'CcnK' and fxp[8:12]==b'FPCh' and fxp[60:64]==b'sub3'
 chunk=fxp[60:];assert len(chunk)==struct.unpack('>I',fxp[56:60])[0]
 assert decode(encode(chunk))==chunk
 root.find('IComponent').text=encode(chunk)
 xml=ET.tostring(root,encoding='utf-8');p.raw_state=b'VC2!'+struct.pack('<I',len(xml))+xml+b'\0'
 # The first process block applies the queued Surge patch; prime before note-on.
 p([],duration=.03,sample_rate=48000,num_channels=2,reset=False)
 return p

def patch_metadata(plugin):
 raw=plugin.raw_state;root=ET.fromstring(raw[8:-1]);chunk=decode(root.find('IComponent').text)
 n=struct.unpack('<I',chunk[4:8])[0];text=chunk[32:32+n].rstrip(b'\0')
 def valid_ref(m):
  number=m.group()[2:-1].decode();value=int(number[1:],16) if number.startswith('x') else int(number)
  return m.group() if value in [9,10,13] or value>=32 else b''
 text=re.sub(rb'&#(?:x[0-9a-fA-F]+|[0-9]+);',valid_ref,text)
 xml=ET.fromstring(text)
 return {'patch':xml.attrib,'meta':[dict(x.attrib) for x in xml if x.tag in ['meta','meta_data']]}
if __name__=='__main__':
 import mido,numpy as np,soundfile as sf,json
 r=Path(__file__).resolve().parent;(r/'evidence').mkdir(exist_ok=True)
 p=load('patches_factory/Basses/Rubber Bass.fxp')
 audio=p([(bytes(mido.Message('note_on',note=31,velocity=100).bytes()),0.),(bytes(mido.Message('note_off',note=31).bytes()),.3)],duration=1.0,sample_rate=48000,num_channels=2,reset=False)
 sf.write(r/'evidence/rubber-bass-audition.wav',audio.T,48000,subtype='PCM_24')
 print(json.dumps(patch_metadata(p),indent=2));print('peak',float(np.max(np.abs(audio))))
 (r/'evidence/rubber-bass-loaded.state').write_bytes(p.raw_state)
