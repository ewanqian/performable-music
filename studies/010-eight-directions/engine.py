"""Shared render helpers: Surge XT patch render, bar-based gain curves, feedback delay, convolution reverb, master.

Used by studies/010-eight-directions and studies/009-flagship-layered.
"""
from pathlib import Path
import sys
import mido, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '006-curated-production-ab'))
from surge_host import load

SR = 48000
TAIL = 3.0


def events_for(notes, beat_s):
    ev = []
    for beat, note, dur, vel in notes:
        ev.append((bytes(mido.Message('note_on', note=int(note), velocity=int(vel)).bytes()), beat * beat_s))
        ev.append((bytes(mido.Message('note_off', note=int(note)).bytes()), (beat + dur) * beat_s))
    ev.sort(key=lambda e: e[1])
    return ev


def render_patch(patch, notes, seconds, beat_s, volume):
    n = int(seconds * SR)
    if not notes:
        return np.zeros((2, n), np.float32)
    p = load(patch)
    p.fx_chain_bypass = 'All FX Off'
    p.global_volume = volume
    audio = p(events_for(notes, beat_s), duration=seconds, sample_rate=SR, num_channels=2, reset=False)
    assert np.isfinite(audio).all(), patch
    return audio.astype(np.float32)


def section_points(edges, levels):
    pts = []
    for i, lvl in enumerate(levels):
        pts.append((edges[i], lvl))
        pts.append((edges[i + 1] - 0.01, lvl))
    return pts


def gain_curve(points, n, beat_s):
    tb = np.arange(n) / SR / (4 * beat_s) + 1
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return (10 ** (np.interp(tb, xs, ys) / 20)).astype(np.float32)


def feedback_delay(x, d, fb):
    if d <= 0:
        return np.zeros_like(x)
    y = np.zeros_like(x)
    n = x.shape[1]
    for k in range(0, n, d):
        e = min(k + d, n)
        if k >= d:
            y[:, k:e] = x[:, k:e] + fb * y[:, k - d:e - d]
        else:
            y[:, k:e] = x[:, k:e]
    return y


def reverb(x, tau, seed=7):
    rng = np.random.default_rng(seed)
    length = int(4 * tau * SR)
    t = np.arange(length) / SR
    ir = rng.standard_normal((2, length)) * np.exp(-t / tau)
    ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True)) + 1e-12
    y = fftconvolve(x, ir, axes=1)[:, : x.shape[1]]
    return y.astype(np.float32)


def master(mix):
    sos = butter(2, 28, btype='highpass', fs=SR, output='sos')
    mix = sosfilt(sos, mix, axis=1).astype(np.float32)
    peak = float(np.max(np.abs(mix))) or 1.0
    return (np.tanh(mix / peak * 0.9) * 0.89).astype(np.float32)


def write_wav(path, x):
    sf.write(path, x.T, SR, subtype='PCM_24')
