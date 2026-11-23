"""Measurements of actual exported audio; never an artistic quality test."""
from pathlib import Path
import json,re,hashlib
import numpy as np,soundfile as sf
from scipy.signal import welch
R=Path(__file__).resolve().parent;O=R/'outputs/final-06'
x,sr=sf.read(O/'CURRENT_90s.wav');info=sf.info(O/'CURRENT_90s.wav')
assert sr==48000 and info.subtype=='PCM_24' and x.shape==(4320000,2)
assert np.isfinite(x).all() and 0<np.max(abs(x))<1

def segment(a,b):
    z=x[int(a*sr):int(b*sr)].mean(axis=1);f,p=welch(z,sr,nperseg=8192)
    band=lambda lo,hi:float(p[(f>=lo)&(f<hi)].sum()/p.sum())
    return dict(seconds=[a,b],rms_dbfs=float(20*np.log10(np.sqrt(np.mean(z*z))+1e-15)),
        power_centroid_hz=float(np.dot(f,p)/p.sum()),low_30_500_fraction=band(30,500),
        lowmid_120_500_fraction=band(120,500),high_2000_8000_fraction=band(2000,8000))

mid=x.mean(axis=1);stereo_rms=float(np.sqrt(np.mean(x*x)))
result={'format':{'seconds':90,'sample_rate':sr,'channels':2,'subtype':info.subtype},
    'finite':'PASS','clipped_samples':int((abs(x)>=1).sum()),
    'sample_peak_dbfs':float(20*np.log10(np.max(abs(x)))),
    'rms_dbfs':float(20*np.log10(stereo_rms)),
    'stereo_correlation':float(np.corrcoef(x.T)[0,1]),
    'mono_fold_rms_difference_db':float(20*np.log10(np.sqrt(np.mean(mid*mid))/stereo_rms)),
    'end_100ms_peak':float(np.max(abs(x[-4800:]))),
    'before_critical':segment(52,56),'critical':segment(58,62),
    'weakest_candidate_early':segment(29,31),'weakest_candidate_late':segment(39,41),
    'weakest_candidate_seconds':[29,41],
    'weakest_basis':'read-only critic: lowest central 12s spectral-change candidate, not human listening',
    'artist_acceptance':'PENDING','model_audition':'NOT_PERFORMED',
    'wav_sha256':hashlib.sha256((O/'CURRENT_90s.wav').read_bytes()).hexdigest()}
sf.write(O/'WEAKEST_CANDIDATE_29-41s.wav',x[29*sr:41*sr],sr,subtype='PCM_24')
(O/'AUDIO_AUDIT.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
