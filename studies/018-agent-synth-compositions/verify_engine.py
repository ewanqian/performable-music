"""Actual native sound / MIDI / graph-save / fresh-instance reopen test."""
from pathlib import Path
import json, hashlib, time, argparse
import numpy as np, soundfile as sf
from pedalboard import load_plugin
from agentsynth_host import load_graph, graph_from_plugin, render, PLUGIN
from instruments import patches

args=argparse.ArgumentParser();args.add_argument('--run',default='engine-verification');args=args.parse_args()
R=Path(__file__).resolve().parent; O=R/'outputs'/args.run
O.mkdir(parents=True, exist_ok=False)
report={'plugin':str(PLUGIN),'host':'pedalboard real VST3; not Waveform',
        'hardware_audition':'NOT_TESTED','artist_acceptance':'PENDING','patches':{}}
for name, graph in patches().items():
    t=time.monotonic()
    try:
        p=load_graph(graph)
        actual=graph_from_plugin(p)
        (O/(name+'.json')).write_text(json.dumps(actual,indent=2)+'\n')
        state=p.raw_state; (O/(name+'.state')).write_bytes(state)
        notes=[(64,.2,.7,85),(71,2,.6,95),(76,3.4,.5,68)]
        a=render(p,notes,120,4.5)
        sf.write(O/(name+'.wav'),a,48000,subtype='PCM_24')
        q=load_plugin(str(PLUGIN));q.raw_state=state
        q([],duration=.03,sample_rate=48000,num_channels=2,reset=False)
        assert {(n['id'],n['type']) for n in graph_from_plugin(q)['nodes']}=={(n['id'],n['type']) for n in actual['nodes']}
        b=render(q,notes,120,4.5)
        sf.write(O/(name+'-reopened.wav'),b,48000,subtype='PCM_24')
        report['patches'][name]={'status':'PASS','peak':float(np.max(abs(a))),
            'rms':float(np.sqrt(np.mean(a*a))),'fresh_instance_peak':float(np.max(abs(b))),
            'native_graph_roundtrip':'PASS','state_sha256':hashlib.sha256(state).hexdigest(),
            'render_wall_seconds':time.monotonic()-t}
    except Exception as e:
        report['patches'][name]={'status':'FAIL','reason':str(e)}
    print(name,report['patches'][name],flush=True)
(O/'ENGINE_RESULTS.json').write_text(json.dumps(report,indent=2)+'\n')
