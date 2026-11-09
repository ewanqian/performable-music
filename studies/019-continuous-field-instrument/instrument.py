"""CURRENT: one continuously excited native Agent Synth instrument.

No note sequence, sampled source, random process or added drum/bass loop.
One held key excites a coupled Hz-FM / diode / foldback / moving-filter body.
The live patch has four native macro controls. The recorded take replaces their
CV sources with native 100-second custom curves, used only for the first90s.
"""
from pathlib import Path
import json

GESTURES = {
 'pressure':[(0,.24),(8,.31),(15,.46),(23,.39),(31,.57),(40,.63),(46,.53),
             (51,.42),(54,.53),(56.8,.79),(58.4,.96),(59.4,.81),(61.5,.68),
             (66,.56),(73,.38),(78,.26),(82,.16),(90,.12),(100,.24)],
 'motion':[(0,.10),(9,.23),(17,.52),(26,.43),(35,.68),(42,.78),(49,.51),
           (53,.27),(56.5,.61),(58.4,.92),(62,.77),(68,.53),(75,.32),
           (82,.08),(90,.04),(100,.10)],
 'open':[(0,.38),(10,.48),(18,.57),(27,.45),(36,.68),(43,.73),(48,.59),
         (53,.48),(56.5,.72),(58.4,.95),(60.8,.83),(66,.70),(73,.51),
         (79,.40),(84,.30),(90,.27),(100,.38)],
 'distance':[(0,.16),(10,.20),(21,.34),(32,.52),(41,.41),(49,.24),
             (54,.18),(58.4,.78),(61,.88),(66,.65),(73,.39),(80,.21),
             (85,.15),(90,.12),(100,.16)]}

class Graph:
    def __init__(self):self.nodes=[];self.connections=[];self.next_id=100
    def node(self,i,kind,**params):
        # Native layout uses position, not top-level x/y.
        self.nodes.append(dict(id=i,type=kind,params=params,
            position={'x':float((len(self.nodes)%8)*310),'y':float((len(self.nodes)//8)*340)}))
        return i
    def wire(self,src,sp,dst,dp):
        self.connections.append(dict(src=src,srcPort=sp,dst=dst,dstPort=dp))
    def scale(self,src,sp,dst,dp,amount):
        i=self.next_id;self.next_id+=1
        self.node(i,'Attenuverter',amount=amount)
        self.wire(src,sp,i,0);self.wire(i,0,dst,dp)
        return i
    def stereo(self,src,dst,source_right=1,dest_right=1):
        self.wire(src,0,dst,0);self.wire(src,source_right,dst,dest_right)

def build(recorded=False, macros=None, dry=False):
    g=Graph()
    g.node(1,'Midi Input');g.node(2,'Audio Output')
    g.node(3,'Poly MIDI',voiceSteal='Oldest',velToGate=False)
    # Carrier and modulator receive absolute Hz CV; their Fine inputs are not used.
    g.node(4,'Oscillator',waveform='Sine',poly=True,level=.54,dualIO=True,
           octave=2,coarse=0,fine=0,randomPhase=0,phase=0)
    g.node(5,'Oscillator',waveform='Sine',poly=True,level=1,dualIO=True,
           octave=0,coarse=0,fine=0,randomPhase=0,phase=0)
    for i in [6,7,9,10,22,23,32,33,34,35,36]:g.node(i,'Math',clip='Off')
    g.node(8,'Attenuverter',amount=.12)
    # The octave body is a component of this single instrument, not a bass track.
    g.node(11,'Oscillator',waveform='Saw',poly=False,level=.105,dualIO=True,
           octave=-1,unison=3,detune=4.7,blend=.38,width=.45,randomPhase=0)
    g.node(12,'Ring Modulator',drive=1.35,mix=.035,character=.24,oversampling='4x')
    g.node(13,'Distortion',type='Foldback',drive=1.15,mix=.08,oversampling='4x',
           outputLevel=.88,dualIO=True,pan=0)
    g.node(14,'Filter',filterType='HPF12',cutoff=48,resonance=.055,drive=1,
           poly=False,dualIO=True,outputLevel=1,mix=1)
    g.node(15,'Filter',filterType='LPF12',cutoff=1250,resonance=.16,drive=1.1,
           poly=False,dualIO=True,outputLevel=.9,mix=1,pan=0)
    g.node(20,'LFO',shape='Sine',mode=False,rateHz=4.2,bipolar=False,retrig=False,level=1)
    g.node(21,'Attenuverter',amount=.08)
    g.node(24,'Amp Env',attack=.65,decay=2.3,sustain=.84,release=4.6)
    g.node(25,'VCA',gain=.67,poly=False,dualIO=True)
    g.node(37,'VCA',gain=.19,poly=False,dualIO=True)
    g.node(38,'Filter',filterType='LPF24',cutoff=680,resonance=.075,drive=1,
           poly=False,dualIO=True,outputLevel=1,mix=1)
    # All delay/predelay units below are milliseconds. Reverb dry .5 is unity
    # because this native module follows JUCE's internal dry*2 / wet*3 laws.
    g.node(26,'Delay',time=137,feedback=.23,mix=.09,tempoSync=False,pingPong=True,
           outputLevel=.97,pan=0,dualIO=True)
    g.node(27,'Reverb',roomSize=.55,damping=.48,wet=.046,dry=.5,width=.74,
           preDelay=18,outputLevel=.94,pan=0,dualIO=True)
    g.node(28,'LFO',shape='Sine',mode=False,rateHz=.11,bipolar=True,retrig=False,level=1,phase=37)
    g.node(29,'LFO',shape='Triangle',mode=False,rateHz=.17,bipolar=True,retrig=False,level=1,phase=123)
    # Utility constants are native CV, not Python-generated control/audio.
    g.node(30,'Macros',macroCount=2,macroBipolar=False,macro1=.66,macro2=.10)
    initial=[GESTURES[k][0][1] for k in GESTURES]
    values=initial if macros is None else macros
    g.node(31,'Macros',macroCount=4,macroBipolar=False,
           **{f'macro{i+1}':value for i,value in enumerate(values)})
    sources={k:(31,i) for i,k in enumerate(GESTURES)}
    if recorded:
        for i,(name,points) in enumerate(GESTURES.items()):
            ident=40+i
            g.node(ident,'LFO',shape='Custom',mode=False,rateHz=.01,bipolar=False,
                   retrig=True,level=1)
            g.nodes[-1]['state']={'version':1,'points':[{'x':t/100,'y':v,'bend':0} for t,v in points]}
            sources[name]=(ident,0);g.wire(1,-1,ident,-1)
    p,pp=sources['pressure'];m,mp=sources['motion'];o,op=sources['open'];s,sp=sources['distance']
    g.wire(1,-1,3,-1);g.wire(1,-1,11,-1);g.wire(1,-1,24,-1)
    # f_mod = f0*(1 + .45*pressure), then
    # f_carrier(t) = f0 + f0*mod(t)*(.12 + .70*pressure).
    g.wire(3,0,6,0);g.scale(p,pp,6,1,.45);g.wire(3,0,7,0);g.wire(6,4,7,1)
    g.wire(7,0,5,0);g.wire(5,0,8,0);g.scale(p,pp,8,1,.70)
    g.wire(3,0,9,0);g.wire(8,0,9,1);g.wire(3,0,10,0);g.wire(9,4,10,1)
    # External Poly pitch is absolute Hz and bypasses the oscillator's Octave
    # knob. Double twice in the native graph for an actual fourth-harmonic carrier.
    g.wire(10,0,34,0);g.wire(10,0,34,1);g.wire(34,0,35,0);g.wire(34,0,35,1);g.wire(35,0,4,0)
    # Native diode intermodulation and foldback, with their own bounded wet paths.
    g.wire(4,0,12,0);g.wire(5,0,12,1)
    g.scale(p,pp,12,2,.22);g.scale(p,pp,12,4,.28)
    g.stereo(12,13);g.scale(p,pp,13,2,.74);g.scale(p,pp,13,3,.46)
    g.stereo(13,14,1,11);g.stereo(14,15,11,11)
    g.scale(o,op,15,1,.70);g.scale(p,pp,15,2,.13)
    g.scale(29,0,15,1,.055);g.scale(28,0,15,34,.24)
    # Motor is smooth amplitude articulation of the sustained source; never a
    # note gate / drum sequence. The CV floor remains .66.
    g.scale(m,mp,20,0,.16);g.wire(20,0,21,0);g.scale(m,mp,21,1,.24)
    g.wire(30,0,22,0);g.wire(21,0,22,1)
    g.wire(24,0,23,0);g.wire(22,0,23,1)
    # The nonlinear module's own makeup attenuates high-pressure states heavily.
    # Bound the quieter/open state inside the instrument rather than chasing it
    # with a master gain jump at the decisive gesture.
    g.wire(p,pp,36,0);g.wire(p,pp,36,1)
    g.wire(30,1,32,0);g.scale(36,4,32,1,.9)
    g.wire(23,4,33,0);g.wire(32,0,33,1)
    g.stereo(15,25,11,16);g.scale(33,4,25,1,1)
    # Re-route the EXISTING octave oscillator around the nonlinear makeup, then
    # band-limit it and use the same envelope/motor. Harmonic stress can open
    # without stripping all low-body energy; no new oscillator or audio track.
    g.stereo(11,38,14,11);g.stereo(38,37,11,16);g.scale(23,4,37,1,1)
    if dry:
        g.stereo(25,2,16,1);g.stereo(37,2,16,1)
    else:
        g.stereo(25,26,16,1);g.stereo(37,26,16,1);g.scale(s,sp,26,4,.16)
        g.scale(29,0,26,2,.0035)
        g.stereo(26,27);g.scale(s,sp,27,4,.075);g.scale(s,sp,27,6,.18)
        g.stereo(27,2)
    return {'nodes':g.nodes,'connections':g.connections}

if __name__=='__main__':
    r=Path(__file__).resolve().parent;r.joinpath('patches').mkdir(exist_ok=True)
    for name,g in [('CURRENT_LIVE',build()),('CURRENT_90s_PERFORMANCE',build(recorded=True))]:
        p=r/'patches'/f'{name}.json'
        if p.exists():raise FileExistsError(p)
        p.write_text(json.dumps(g,indent=2)+'\n')
