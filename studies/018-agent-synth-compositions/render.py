"""Render editable v03 MIDI through real Agent Synth DSP, save native graphs/states.

Python only hosts, applies documented static mix gains and a short ending fade,
and writes files. No old PCM, generated oscillators, samples or cloud audio.
"""
from pathlib import Path
import json, time, argparse, hashlib
import numpy as np, soundfile as sf, mido
from agentsynth_host import load_graph, graph_from_plugin, render
from instruments import patches
from compose import write_midi
from waveform_project import create

R=Path(__file__).resolve().parent

def read_midi(path):
    mf=mido.MidiFile(path,charset='utf8');tracks={}
    for track in mf.tracks[1:]:
        name=next(m.name for m in track if m.type=='track_name');notes=[];active={};tick=0
        for m in track:
            tick+=m.time
            if m.type=='note_on' and m.velocity:
                assert (m.channel,m.note) not in active, (name,m.note,tick)
                active[(m.channel,m.note)]=(tick,m.velocity)
            elif m.type=='note_off' or (m.type=='note_on' and m.velocity==0):
                start,velocity=active.pop((m.channel,m.note))
                notes.append([m.note,start/mf.ticks_per_beat,(tick-start)/mf.ticks_per_beat,velocity])
        assert not active
        tracks[name]=sorted(notes,key=lambda n:(n[1],n[0]))
    return tracks

def main():
    ap=argparse.ArgumentParser();ap.add_argument('piece');a=ap.parse_args()
    folder=R/'scores'/a.piece;score=json.loads((folder/'v03-score.json').read_text())
    score['tracks']=read_midi(folder/'v03.mid')
    out=R/'outputs'/a.piece;out.mkdir(exist_ok=False)
    for sub in ['raw-stems','stems','patches','midi']:(out/sub).mkdir()
    (out/'COMPOSITION.mid').write_bytes((folder/'v03.mid').read_bytes())
    report={'id':a.piece,'seconds':score['seconds'],'bpm':score['bpm'],'engine':'Agent Synth VST3 0.588.1',
        'native_host':'pedalboard 0.9.26','native_daw_render':'NOT_TESTED',
        'human_listening':'PENDING','model_listening':'NOT_PERFORMED','stems':{}}
    rendered={};states={};library=patches();total_start=time.monotonic()
    for name,notes in score['tracks'].items():
        t=time.monotonic();instrument=score['patches'][name];graph=library[instrument]
        plugin=load_graph(graph)
        native=graph_from_plugin(plugin)
        (out/'patches'/f'{name}.json').write_text(json.dumps(native,indent=2)+'\n')
        state_path=out/'patches'/f'{name}.state';state_path.write_bytes(plugin.raw_state);states[name]=state_path
        one=dict(score,tracks={name:notes});write_midi(one,out/'midi'/f'{name}.mid')
        audio=render(plugin,notes,score['bpm'],score['seconds'])
        sf.write(out/'raw-stems'/f'{name}.wav',audio,48000,subtype='FLOAT')
        rendered[name]=audio*score['gains'][name]
        report['stems'][name]={'instrument':instrument,'notes':len(notes),
            'raw_peak':float(np.max(abs(audio))),'raw_rms':float(np.sqrt(np.mean(audio**2))),
            'render_wall_seconds':time.monotonic()-t,'mix_gain':score['gains'][name]}
        print(a.piece,name,report['stems'][name],flush=True)
    # All files start together, end together, and share the same gain and fade.
    mix=sum(rendered.values());ceiling=10**(-1.5/20)
    gain=ceiling/float(np.max(abs(mix)))
    fade=np.ones(len(mix),dtype=np.float32)
    fade[:576]=np.linspace(0,1,576)
    fade[-24000:]=np.linspace(1,0,24000)
    for name,audio in rendered.items():
        rendered[name]=audio*gain*fade[:,None]
        sf.write(out/'stems'/f'{name}.wav',rendered[name],48000,subtype='PCM_24')
    mix=sum(rendered.values());sf.write(out/'LISTEN.wav',mix,48000,subtype='PCM_24')
    report.update(static_master_gain=gain,peak_dbfs=float(20*np.log10(np.max(abs(mix)))),
        rms_dbfs=float(20*np.log10(np.sqrt(np.mean(mix*mix)))),frames=len(mix),
        no_old_pcm_input=True,render_wall_seconds=time.monotonic()-total_start,
        final_midi_sha256=hashlib.sha256((out/'COMPOSITION.mid').read_bytes()).hexdigest())
    # MIDI+native plugin state, not an audio-only shell.
    create(score,states,out/(score['id']+'-EDITABLE.tracktionedit'))
    (out/'RENDER_RESULTS.json').write_text(json.dumps(report,indent=2)+'\n')
    (out/'TIMECODES.json').write_text(json.dumps(score['cues'],ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,indent=2),flush=True)

if __name__=='__main__':main()
