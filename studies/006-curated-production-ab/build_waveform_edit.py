"""Prepare native Tracktion Edit XML and a portable source package.
Opening, saving and exporting in Waveform are REQUIRED runtime gates, not inferred.
The project uses frozen original Surge/plugdata stems; MIDI and synth state remain available.
"""
from pathlib import Path
import shutil,json,math,xml.etree.ElementTree as ET,hashlib
R=Path(__file__).resolve().parent;O=R/'outputs';P=O/'Waveform-source-package';P.mkdir(exist_ok=True)
for version in ['A','B']:
 folder=P/version;media=folder/'media';source=folder/'source';media.mkdir(parents=True,exist_ok=True);source.mkdir(exist_ok=True)
 for stem in ['bass','percussion','metal','pressure']:shutil.copy2(O/version/'stems'/f'{stem}.wav',media/f'{stem}.wav')
 for role in ['bass','metal','kick','snare','pressure']:
  shutil.copy2(O/f'{version}-{role}.mid',source/f'{role}.mid');shutil.copy2(O/version/'dry'/f'{role}.state',source/f'{role}.state')
 shutil.copy2(O/version/'processed/metal-memory.state',source/'metal-memory.state');shutil.copy2(R/'metal-memory.pd',source/'metal-memory.pd')
 root=ET.Element('EDIT',{'name':f'Critical Field 16-bar {version}','appVersion':'14.0.50','projectID':'0/0'})
 ET.SubElement(root,'TRANSPORT',{'position':'0','loopPoint1':'0','loopPoint2':'30','looping':'0'})
 tempo=ET.SubElement(root,'TEMPOSEQUENCE');ET.SubElement(tempo,'TEMPO',{'startBeat':'0','bpm':'128','curve':'1'});ET.SubElement(tempo,'TIMESIG',{'startBeat':'0','numerator':'4','denominator':'4'})
 master=ET.SubElement(root,'MASTERPLUGINS')
 ET.SubElement(master,'PLUGIN',{'type':'4bandEq','id':'100','enabled':'1','loFreq':'45','loGain':'-1.5','loQ':'0.5','midFreq1':'350','midGain1':'0','midQ1':'0.7','midFreq2':'3200','midGain2':'0','midQ2':'0.7','hiFreq':'10000','hiGain':'-0.5','hiQ':'0.5'})
 ET.SubElement(master,'PLUGIN',{'type':'compressor','id':'101','enabled':'1','threshold':str(10**(-12/20)),'ratio':str(1/1.2),'attack':'30','release':'120','outputDb':'0','sidechainTrigger':'0'})
 ET.SubElement(master,'PLUGIN',{'type':'volume','id':'102','enabled':'1','volume':str(math.exp(-6/20)),'pan':'0'})
 for j,stem in enumerate(['bass','percussion','metal','pressure']):
  track=ET.SubElement(root,'TRACK',{'id':str(1000+j),'name':stem.title(),'mute':'0','solo':'0','height':'110'})
  for k,(start,length) in enumerate([(0,7.5),(7.5,7.5),(15,7.5),(22.5,7.5)]):
   ET.SubElement(track,'AUDIOCLIP',{'id':str(2000+j*10+k),'name':f'{stem} / bars {k*4+1}-{k*4+4}','start':str(start),'length':str(length),'offset':str(start),'source':str((media/f'{stem}.wav').resolve()),'gainDB':'0','pan':'0','speed':'1','autoTempo':'0','sync':'0'})
  ET.SubElement(track,'PLUGIN',{'type':'volume','id':str(3000+j),'enabled':'1','volume':str(math.exp(-6/20)),'pan':'0'})
 ET.indent(root);ET.ElementTree(root).write(folder/f'CF_16bar_{version}.tracktionedit',encoding='utf-8',xml_declaration=True)
shutil.copy2(R/'score.json',P/'score.json')
manifest={'status':'PREPARED; Waveform open/save/export NOT RUN','schema':'original portable-source manifest v1','bpm':128,'bars':16,'musical_seconds':30,'stem_seconds':31.5,'files':{str(p.relative_to(P)):hashlib.sha256(p.read_bytes()).hexdigest() for p in P.rglob('*') if p.is_file()},'relocate':'Run build_waveform_edit.py after relocation to regenerate absolute media paths. Full synth source is in version/source, with matching MIDI and actual saved VST3 states. Original factory data must be installed for Surge wavetable dependencies.'}
(P/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(P)
