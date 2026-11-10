"""Original Agent Synth graphs. Parameters are raw native module units."""
import copy

def node(i, kind, x, y, **params):
    return dict(id=i, type=kind, x=x, y=y, params=params)

def wire(src, sp, dst, dp):
    return dict(src=src, srcPort=sp, dst=dst, dstPort=dp)

def resonator(kind='glass', wet=.12):
    """Excited resonators, stereo native delay and reverb; no external samples."""
    if kind == 'glass':
        instrument = node(3,'Mallet',280,100,material='Glockenspiel',level=.28,
                          decay=1.25,damping=.49,brightness=.76,hardness=.48,release=.28,velBright=.5)
    else:
        instrument = node(3,'Pluck',280,100,level=.32,decay=1.1,decayTrack=.72,
                          brightness=.68,pickPosition=.23,pickHardness=.61,body=.35,
                          stiffness=.08,release=.16,velBright=.5)
    nodes = [node(1,'Midi Input',30,100),node(2,'Audio Output',1120,100),instrument,
             node(4,'Delay',560,100,time=.1875 if kind=='glass' else .225,
                  feedback=.19,mix=.16,tempoSync=False,pingPong=True,outputLevel=.75,pan=0),
             node(5,'Reverb',840,100,roomSize=.57,damping=.45,wet=wet,dry=.88,width=.85,
                  preDelay=.012,outputLevel=.85)]
    connections = [wire(1,-1,3,-1)]
    for a,b in [(3,4),(4,5),(5,2)]:
        connections += [wire(a,0,b,0),wire(a,1,b,1)]
    return dict(nodes=nodes,connections=connections)

def fm(air=False, bass=False):
    """MIDI carrier + audio-rate exponential FM, filter, Amp Env/VCA, LFO, FX.

    This is shallow exponential FM of the native Fine input, not linear-Hz FM.
    """
    nodes = [node(1,'Midi Input',20,130),node(2,'Audio Output',1500,130),
             node(3,'Oscillator',280,80,waveform='Triangle' if air else 'Sine',
                  octave=0,level=.48,poly=False),
             node(4,'Filter',780,80,cutoff=2300 if bass else (5700 if air else 8500),
                  resonance=.17 if air else .12,filterType='LPF12',poly=False),
             node(5,'VCA',1030,80,gain=.43),
             node(6,'Amp Env',780,400,attack=.06 if air else .006,
                  decay=.62 if air else .23,sustain=.43 if air else .24,
                  release=.85 if air else .19),
             node(7,'Oscillator',280,400,waveform='Sine',octave=1 if air else 2,
                  coarse=7 if air else 0,level=1,poly=False),
             node(8,'Attenuverter',540,400,amount=.23 if bass else (.55 if air else 2.0)),
             node(9,'LFO',20,540,mode=False,rateHz=.13 if air else .23),
             node(10,'Attenuverter',540,640,amount=.08 if air else .025),
             node(11,'Delay',1250,80,time=.327 if air else .15,feedback=.22,mix=.2 if air else .1,
                  tempoSync=False,pingPong=True,outputLevel=.8,pan=0),
             node(12,'Reverb',1250,400,roomSize=.68 if air else .4,damping=.53,
                  wet=.19 if air else .07,dry=.9,width=.9,preDelay=.019,outputLevel=.8)]
    # Attenuverter native amount is bounded -1..1.
    nodes[7]['params']['amount'] = min(1.,nodes[7]['params']['amount'])
    connections = [wire(1,-1,i,-1) for i in [3,4,6,7]] + [
        wire(7,0,8,0),wire(8,0,3,4),wire(3,0,4,0),wire(4,0,5,0),wire(6,0,5,1),
        wire(9,0,10,0),wire(10,0,4,1),wire(5,0,11,0),wire(5,0,11,1),
        wire(11,0,12,0),wire(11,1,12,1),wire(12,0,2,0),wire(12,1,2,1)]
    return dict(nodes=nodes,connections=connections)

def patches():
    return {'prism_glass':resonator('glass'), 'hinge_pluck':resonator('pluck',.08),
            'air_current':fm(air=True), 'pulse_fm':fm(), 'low_fm':fm(bass=True)}

def linear_fm_air():
    """Actual linear Hz FM: f0 + f0*(0.65*modulator), not the Fine CV path.

    Voice0 only: this instrument requires non-overlapping, non-legato MIDI.
    Poly MIDI releases voice0 on note-off, allowing each next note to reuse it.
    """
    g=fm(air=True)
    nodes={n['id']:n for n in g['nodes']}
    nodes[3]['params'].update(waveform='Sine',poly=True,level=.4)
    nodes[7]['params'].update(octave=-1,coarse=0)
    nodes[8]['params']['amount']=.65
    nodes[6]['params'].update(attack=.025,decay=.65,sustain=.46,release=.72)
    nodes[4]['params'].update(cutoff=7200,resonance=.1)
    g['nodes'] += [node(20,'Poly MIDI',20,300),node(21,'Math',280,650,clip='Off'),
                   node(22,'Math',540,650,clip='Off')]
    g['connections']=[c for c in g['connections'] if not
        ((c['src']==1 and c['dst']==3) or (c['src']==8 and c['dst']==3))]
    g['connections'] += [wire(1,-1,20,-1),wire(20,0,21,0),wire(8,0,21,1),
                          wire(20,0,22,0),wire(21,4,22,1),wire(22,0,3,0)]
    return g

def bodied_pluck():
    """Plucked resonator plus a separately enveloped octave body.

    The short string attack stays recognizable while a triangle body carries the
    written note duration. All layers are native DSP, driven by the same MIDI.
    """
    g=resonator('pluck',.1)
    g['nodes'] += [node(20,'Oscillator',280,430,waveform='Triangle',octave=-1,level=.13,poly=False),
        node(21,'Amp Env',550,430,attack=.003,decay=.28,sustain=.16,release=.17),
        node(22,'VCA',800,430,gain=.42)]
    g['connections'] += [wire(1,-1,20,-1),wire(1,-1,21,-1),wire(20,0,22,0),
        wire(21,0,22,1),wire(22,0,4,0),wire(22,0,4,1)]
    return g
