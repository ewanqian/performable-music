"""Native Waveform Edit with editable MIDI and actual Agent Synth plugin state.

Plugin metadata comes from Waveform's own completed scan, never invented IDs.
"""
from pathlib import Path
import math
import xml.etree.ElementTree as ET
from agentsynth_host import encode, PLUGIN

def plugin_description():
    known=Path.home()/'Library/Application Support/Tracktion/Waveform/knownPluginList64.settings'
    return next(n.attrib for n in ET.parse(known).getroot() if n.get('name')=='Agent Synth' and n.get('format')=='VST3')

def create(score, states, path, gains=None):
    desc=plugin_description();duration=score['seconds']
    root=ET.Element('EDIT',name=score['title'],appVersion='14.1.24',projectID='0/0')
    ET.SubElement(root,'TRANSPORT',position='0',loopPoint1='0',loopPoint2=str(duration),looping='0')
    seq=ET.SubElement(root,'TEMPOSEQUENCE')
    ET.SubElement(seq,'TEMPO',startBeat='0',bpm=str(score['bpm']),curve='1')
    ET.SubElement(seq,'TIMESIG',startBeat='0',numerator=str(score['meter'][0]),denominator=str(score['meter'][1]))
    master=ET.SubElement(root,'MASTERVOLUME')
    ET.SubElement(master,'PLUGIN',type='volume',id='9000',enabled='1',
        volume=str(math.exp(-6/20)),pan='0',panLaw='0',applyToMidi='0')
    for channel,(name,notes) in enumerate(score['tracks'].items()):
        track=ET.SubElement(root,'TRACK',id=str(1001+channel),name=name,mute='0',solo='0',height='130')
        clip=ET.SubElement(track,'MIDICLIP',id=str(2001+channel),name=name,start='0',length=str(duration),offset='0',volDb='0',mute='0')
        sequence=ET.SubElement(clip,'SEQUENCE',ver='1',channelNumber='1')
        for p,t,d,v in notes:ET.SubElement(sequence,'NOTE',p=str(p),b=str(t),l=str(d),v=str(v),c='0')
        ET.SubElement(track,'PLUGIN',type='vst',id=str(10000+channel*10),enabled='1',filename=desc['file'],
            name=desc['name'],manufacturer=desc['manufacturer'],uniqueId=desc['uniqueId'],uid=desc['uid'],
            wet='1',dry='0',state=encode(Path(states[name]).read_bytes()))
        if gains:
            # Three static native fader stages support up to +18dB without an
            # out-of-range fader. Explicit linear pan law avoids default -3dB.
            value=gains[name]**(1/3)
            position=math.exp((20*math.log10(value)-6)/20) if value>0 else 0
            if position>1:raise ValueError(f'Gain exceeds three fader stages: {gains[name]}')
            for k in range(3):
                ET.SubElement(track,'PLUGIN',type='volume',id=str(10001+channel*10+k),enabled='1',
                    volume=str(position),pan='0',panLaw='0',applyToMidi='0')
    ET.indent(root);ET.ElementTree(root).write(path,encoding='utf-8',xml_declaration=True)
    return root

if __name__=='__main__':
    R=Path(__file__).resolve().parent;out=R/'outputs'/'waveform-gate';out.mkdir(exist_ok=False)
    score={'title':'Agent Synth native host test','bpm':120,'seconds':4.5,'meter':[4,4],
        'tracks':{'glass':[[64,.2,.7,85],[71,2,.6,95],[76,3.4,.5,68]]}}
    create(score,{'glass':R/'outputs/engine-verification-02/prism_glass.state'},out/'AgentSynth-MIDI-test.tracktionedit')
