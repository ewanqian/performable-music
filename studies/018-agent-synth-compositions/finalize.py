"""Production revision: foreground motifs, balanced lows, native editable mix.

Only newly composed Agent Synth stems are used. Initial renders remain intact.
New linear-FM and bodied-Pluck voices are re-rendered from final real MIDI.
"""
from pathlib import Path
import argparse,json,time,shutil
import numpy as np,soundfile as sf
from agentsynth_host import load_graph,graph_from_plugin,render
from instruments import linear_fm_air,bodied_pluck
from render import read_midi
from waveform_project import create
from compose import write_midi

R=Path(__file__).resolve().parent
MIX={
 '01_PRISM_RUN':{'glass':2.5,'reply':1.8,'ground':.31,'refraction':.23},
 '02_HINGE':{'tension_string':1.8,'tine_reply':1.4,'three_step':.30},
 '03_AIR_CURRENT':{'air_thread':.55,'orbit':2.2,'anchor':.32,'light':1.7}}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('piece');a=ap.parse_args()
    source=R/'outputs'/a.piece;out=source/'final';out.mkdir(exist_ok=False)
    for sub in ['stems','patches','midi','raw']:(out/sub).mkdir()
    score=json.loads((R/'scores'/a.piece/'v03-score.json').read_text())
    score['tracks']=read_midi(R/'scores'/a.piece/'v03.mid')
    states={};audio={};changes=[]
    for name,notes in score['tracks'].items():
        replacement=None
        if name=='air_thread':replacement=linear_fm_air()
        if name=='tension_string':replacement=bodied_pluck()
        if replacement:
            if name=='air_thread':
                ordered=sorted(notes,key=lambda n:n[1])
                assert all(a[1]+a[2]+.002*score['bpm']/60 < b[1] for a,b in zip(ordered,ordered[1:])), 'voice0 FM requires nonlegato'
            p=load_graph(replacement)
            state=p.raw_state
            graph=graph_from_plugin(p)
            x=render(p,notes,score['bpm'],score['seconds'])
            changes.append({'track':name,'operation':'linear Hz FM' if name=='air_thread' else 'native resonator plus enveloped body'})
        else:
            state=(source/'patches'/f'{name}.state').read_bytes()
            graph=json.loads((source/'patches'/f'{name}.json').read_text())
            x,sr=sf.read(source/'raw-stems'/f'{name}.wav',dtype='float32');assert sr==48000
        (out/'patches'/f'{name}.json').write_text(json.dumps(graph,indent=2)+'\n')
        states[name]=out/'patches'/f'{name}.state';states[name].write_bytes(state)
        audio[name]=x*MIX[a.piece][name]
        sf.write(out/'raw'/f'{name}.wav',x,48000,subtype='FLOAT')
        one=dict(score,tracks={name:notes});write_midi(one,out/'midi'/f'{name}.mid')
    rawmix=sum(audio.values())
    gain=10**(-2/20)/float(np.max(abs(rawmix)))
    total_gains={k:v*gain for k,v in MIX[a.piece].items()}
    fade=np.ones(len(rawmix),dtype=np.float32);fade[-24000:]=np.linspace(1,0,24000)
    for name,x in audio.items():
        sf.write(out/'stems'/f'{name}.wav',x*gain*fade[:,None],48000,subtype='PCM_24')
    sf.write(out/'LISTEN.wav',rawmix*gain*fade[:,None],48000,subtype='PCM_24')
    shutil.copy2(R/'scores'/a.piece/'v03.mid',out/'COMPOSITION.mid')
    create(score,states,out/(a.piece+'-EDITABLE.tracktionedit'),total_gains)
    report={'id':a.piece,'seconds':score['seconds'],'changes':changes,'mix_gains':MIX[a.piece],
        'static_master_gain':gain,'native_track_gains':total_gains,
        'mix_reference_peak_dbfs':float(20*np.log10(np.max(abs(rawmix*gain)))),
        'reference_rms_dbfs':float(20*np.log10(np.sqrt(np.mean((rawmix*gain)**2)))),
        'reference_tail_fade_seconds':.5,'native_tail_fade':'NOT_APPLIED; inspect native end level',
        'artist_acceptance':'PENDING','model_listening':'NOT_PERFORMED'}
    (out/'MIX_REVISION.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2),flush=True)

if __name__=='__main__':main()
