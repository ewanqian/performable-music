"""Record the actual continuous native instrument, not a new MIDI composition.

One held D3 (note50) is an exciter/gate. Four native CV gesture curves carry the
performance; all audio and control synthesis runs in Agent Synth VST3.
"""
from pathlib import Path
import sys,json,time,argparse,hashlib,copy
import numpy as np,soundfile as sf
R=Path(__file__).resolve().parent
sys.path.insert(0,str(R.parent/'018-agent-synth-compositions'))
from agentsynth_host import load_graph,graph_from_plugin,render,PLUGIN
from instrument import build,GESTURES

def assert_native(g,native):
    observed={n['id']:n for n in native['nodes']}
    for node in g['nodes']:
        assert observed[node['id']]['type']==node['type']
        for key,want in node['params'].items():
            got=observed[node['id']]['params'][key]
            if isinstance(want,(bool,str)):assert got==want,(node['id'],key,want,got)
            else:assert abs(got-want)<max(.011,abs(want)*.001),(node['id'],key,want,got)
    for ident in [26,27]:
        assert observed[ident]['params']['dualIO'] is True
    assert abs(observed[26]['params']['time']-137)<.01
    assert abs(observed[27]['params']['preDelay']-18)<.01
    if any(n['id']==40 for n in g['nodes']):
        assert all(observed[i].get('state') for i in range(40,44)), 'native custom curves lost'
    return observed

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--test',action='store_true');ap.add_argument('--run',default='take-01');args=ap.parse_args()
    out=R/'outputs'/args.run;out.mkdir(parents=True,exist_ok=False)
    if args.test:
        report={}
        for label,values in [('open',[.18,.4,.62,.22]),('pressure',[.9,.4,.62,.22])]:
            g=build(macros=values,dry=True);p=load_graph(g);native=graph_from_plugin(p);assert_native(g,native)
            t=time.monotonic();x=render(p,[[50,.1,9,90]],60,12)
            sf.write(out/(label+'-dry.wav'),x,48000,subtype='PCM_24')
            (out/(label+'.native.json')).write_text(json.dumps(native,indent=2)+'\n')
            report[label]={'peak':float(np.max(abs(x))),'rms':float(np.sqrt(np.mean(x*x))),
                'wall_seconds':time.monotonic()-t}
            print(label,report[label],flush=True)
        (out/'TEST.json').write_text(json.dumps(report,indent=2)+'\n');return
    g=build(recorded=True);p=load_graph(g);native=graph_from_plugin(p);assert_native(g,native)
    # Save BEFORE processing, so a fresh reload starts from the recorded trajectory.
    (out/'CURRENT_90s.native.json').write_text(json.dumps(native,indent=2)+'\n')
    (out/'CURRENT_90s.state').write_bytes(p.raw_state)
    (out/'GESTURES.json').write_text(json.dumps(GESTURES,indent=2)+'\n')
    t=time.monotonic();audio=render(p,[[50,.1,81.4,90]],60,90)
    sf.write(out/'RAW_CONTINUOUS_INSTRUMENT.wav',audio,48000,subtype='FLOAT')
    result={'engine':str(PLUGIN),'seconds':90,'sample_rate':48000,'channels':2,
        'excitation':'one held D3; no note sequence, arpeggio or bass loop',
        'performance':'programmed native CV gestures, not a human realtime recording',
        'raw_peak':float(np.max(abs(audio))),'raw_rms':float(np.sqrt(np.mean(audio*audio))),
        'render_wall_seconds':time.monotonic()-t,'artist_acceptance':'PENDING',
        'model_audition':'NOT_PERFORMED','native_parameter_readback':'PASS',
        'reverb_predelay_ms':native['nodes'][[n['id'] for n in native['nodes']].index(27)]['params']['preDelay']}
    (out/'RECORD_RESULTS.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2),flush=True)

if __name__=='__main__':main()
