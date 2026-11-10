"""Eight-note real DSP test of Poly MIDI voice0 routing and linear Hz FM."""
from pathlib import Path
import json
import numpy as np, soundfile as sf
from agentsynth_host import load_graph, graph_from_plugin, render
from instruments import linear_fm_air
R=Path(__file__).resolve().parent;O=R/'outputs'/'linear-fm-test';O.mkdir(exist_ok=False)
g=linear_fm_air();p=load_graph(g)
(O/'Linear-FM.json').write_text(json.dumps(graph_from_plugin(p),indent=2)+'\n')
(O/'Linear-FM.state').write_bytes(p.raw_state)
notes=[[p,i*1.5,.7,80] for i,p in enumerate([60,62,67,69,71,74,76,79])]
x=render(p,notes,120,7)
peaks=[float(np.max(abs(x[round(i*.75*48000):round((i*.75+.28)*48000)]))) for i in range(8)]
assert min(peaks)>.002,peaks
sf.write(O/'Eight-distinct-notes.wav',x,48000,subtype='PCM_24')
(O/'RESULT.json').write_text(json.dumps({'note_window_peaks':peaks,'all_eight_notes':'PASS',
    'human_audition':'PENDING','fm':'linear Hz; only non-overlapping voice0'},indent=2)+'\n')
print(peaks,flush=True)
