"""Local audition delivery: actual native WAVs at matched integrated loudness.

Keep original native masters as evidence. Match only with constant attenuation;
no limiter, new DSP version, generated PCM source or automatic artistic ranking.
"""
from pathlib import Path
import json,math,hashlib,shutil,subprocess,sys,xml.etree.ElementTree as ET
import importlib.metadata as metadata
import numpy as np,soundfile as sf
R=Path(__file__).resolve().parent;REPO=R.parents[1]
DEST=Path.home()/'Downloads/CRITICAL_FIELD_THREE_COMPOSITIONS_2026-11-09'
TARGET=-22.
WAVEFORM='/Applications/Waveform 14.app/Contents/MacOS/Waveform 14'

def main():
    DEST.mkdir(exist_ok=False)
    (DEST/'evidence').mkdir();(DEST/'evidence/native-originals').mkdir()
    result=json.loads((R/'outputs/DELIVERY_VALIDATION.json').read_text())
    delivery=[]
    for piece in result['pieces']:
        name=piece['id'];source=R/'outputs'/name/'final';out=DEST/name;out.mkdir()
        gain=10**((TARGET-piece['integrated_lufs_ebu128'])/20)
        assert gain<=1 # attenuation only; retain transients/headroom
        root=ET.parse(source/(name+'-EDITABLE.tracktionedit'))
        root.getroot().set('name',name+' audition -22 LUFS')
        root.find('./MASTERVOLUME/PLUGIN').set('volume',str(math.exp((20*math.log10(gain)-6)/20)))
        edit=out/(name+'-EDITABLE.tracktionedit');root.write(edit,encoding='utf-8',xml_declaration=True)
        wav=DEST/(name+'.wav')
        cmd=[WAVEFORM,'render',str(edit),'-o',str(wav),'--format','wav','--sample-rate','48000',
             '--bit-depth','24','--channels','stereo','--start','0','--end',str(piece['seconds']),'--no-tails','--json']
        run=subprocess.run(cmd,capture_output=True,text=True)
        (DEST/'evidence'/(name+'-native-render.log')).write_text(run.stdout+run.stderr)
        assert run.returncode==0,(name,run.returncode)
        shutil.copy2(source/'WAVEFORM_NATIVE.wav',DEST/'evidence/native-originals'/(name+'.wav'))
        for sub in ['patches','midi']:shutil.copytree(source/sub,out/sub)
        shutil.copy2(source/'COMPOSITION.mid',out/'COMPOSITION.mid')
        shutil.copytree(R/'scores'/name,out/'MIDI_HISTORY')
        stems=out/'STEMS';stems.mkdir()
        for p in (source/'native-stems').glob('*.wav'):
            a,sr=sf.read(p);sf.write(stems/p.name,a*gain,sr,subtype='PCM_24')
        mix,sr=sf.read(wav)
        stemmix=sum(sf.read(p)[0] for p in stems.glob('*.wav'))
        error=float(np.max(abs(mix-stemmix)));assert error<1e-6,error
        assert np.max(abs(mix))<1 and sr==48000
        d=dict(id=name,seconds=piece['seconds'],target_integrated_lufs=TARGET,
            constant_match_gain=gain,match_gain_db=20*math.log10(gain),
            stem_sum_max_error=error,sample_peak_dbfs=float(20*np.log10(np.max(abs(mix)))),
            native_render_command=cmd,artist_approval='PENDING',
            wav_sha256=hashlib.sha256(wav.read_bytes()).hexdigest())
        delivery.append(d);print(json.dumps(d,ensure_ascii=False),flush=True)
    source=DEST/'SOURCE';source.mkdir()
    for p in R.glob('*.py'):shutil.copy2(p,source/p.name)
    shutil.copy2(R/'README.md',source/'README.md')
    shutil.copytree(R/'scores',source/'scores')
    (source/'requirements-actual.txt').write_text('\n'.join(f'{p}=={metadata.version(p)}' for p in ['mido','numpy','soundfile','pedalboard'])+'\n')
    review=REPO/'review/2026-11-09-agent-synth'
    for p in review.glob('*.md'):shutil.copy2(p,DEST/'evidence'/p.name)
    shutil.copytree(review/'engine',DEST/'evidence/engine')
    shutil.copy2(R/'outputs/DELIVERY_VALIDATION.json',DEST/'evidence/DELIVERY_VALIDATION.json')
    (DEST/'DELIVERY.json').write_text(json.dumps(delivery,ensure_ascii=False,indent=2)+'\n')
    (R/'outputs/MATCHED_DELIVERY.json').write_text(json.dumps(delivery,ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__':main()
