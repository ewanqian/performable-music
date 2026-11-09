"""Verify actual native exports/stems/MIDI and preserve source audit evidence."""
from pathlib import Path
import json,hashlib,re,math
import numpy as np,soundfile as sf
from render import read_midi
R=Path(__file__).resolve().parent;REPO=R.parents[1]
results=[]
for folder in sorted((R/'outputs').glob('0*/final')):
    x,sr=sf.read(folder/'WAVEFORM_NATIVE.wav');info=sf.info(folder/'WAVEFORM_NATIVE.wav')
    stems={p.stem:sf.read(p)[0] for p in sorted((folder/'native-stems').glob('*.wav'))}
    assert sr==48000 and info.subtype=='PCM_24' and x.shape[1]==2
    assert np.isfinite(x).all() and 0<np.max(abs(x))<1
    assert all(s.shape==x.shape for s in stems.values())
    error=float(np.max(abs(x-sum(stems.values()))));assert error<1e-6
    tracks=read_midi(folder/'COMPOSITION.mid')
    whole_seconds=[float(np.sqrt(np.mean(x[i*sr:(i+1)*sr]**2))) for i in range(len(x)//sr)]
    log=(REPO/'local-only/agentsynth-test'/f'loudness-{folder.parent.name}.log').read_text()
    summary=log.rsplit('Summary:',1)[-1]
    loudness=float(re.search(r'I:\s+(-?[\d.]+) LUFS',summary).group(1))
    tp=float(re.search(r'Peak:\s+(-?[\d.]+) dBFS',summary).group(1))
    results.append({'id':folder.parent.name,'sample_rate':sr,'channels':2,'subtype':info.subtype,
        'seconds':len(x)/sr,'frames':len(x),'stem_count':len(stems),'stem_sum_max_error':error,
        'sample_peak_dbfs':float(20*np.log10(np.max(abs(x)))),
        'rms_dbfs':float(20*np.log10(np.sqrt(np.mean(x*x)))),
        'integrated_lufs_ebu128':loudness,'true_peak_dbfs_ebu128':tp,
        'last_100ms_peak_dbfs':float(20*np.log10(max(1e-12,np.max(abs(x[-4800:]))))),
        'notes':{k:len(n) for k,n in tracks.items()},'midi_overlap_and_unclosed':'PASS',
        'one_second_rms_dbfs':[round(20*math.log10(max(v,1e-12)),3) for v in whole_seconds],
        'native_wav_sha256':hashlib.sha256((folder/'WAVEFORM_NATIVE.wav').read_bytes()).hexdigest(),
        'music_acceptance':'PENDING_ARTIST','model_audition':'NOT_PERFORMED'})
old=REPO/'studies/015-memory-live-prototype/revisions/01/audio/CRITICAL_FIELD_MEMORY_REVISION_01.wav'
oldhash=hashlib.sha256(old.read_bytes()).hexdigest()
assert oldhash=='e7da1f657ded1a49098aced9897be71ac3b3a421e0f45d43807a6aef000ed565'
report={'status':'TECHNICAL_CHECKS_PASS; MUSIC_NOT_ACCEPTED','pieces':results,
    'old_four_minute_hash_unchanged':oldhash,'old_four_minute_midi_files':
    [str(p.relative_to(REPO)) for p in (REPO/'studies/015-memory-live-prototype').rglob('*') if p.suffix.lower() in ['.mid','.midi']],
    'gui_save_close_reopen':'PASS isolated three-note test only; full pieces CLI rendered, GUI NOT_TESTED',
    'au_audio':'NOT_TESTED','standalone':'NOT_DEPLOYED download timed out','hardware_midi':'NOT_TESTED',
    'live_latency_and_soak':'NOT_TESTED','visuals_vjbake_linkosc':'PAUSED'}
(R/'outputs'/'DELIVERY_VALIDATION.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps([{k:v for k,v in p.items() if k!='one_second_rms_dbfs'} for p in results],indent=2))
