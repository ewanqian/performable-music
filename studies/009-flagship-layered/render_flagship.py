"""Flagship layered piece: 240 bars at 128 BPM (~7.5 min), 12 layers, rendered via the real Surge XT VST3.

Form (bars, 4/4):
  INTRO 1-16 | GROOVE 17-48 | DIALOGUE 49-80 | WITHDRAW 81-112 | BUILD 113-144
  RUPTURE 145-160 | AFTERIMAGE 161-200 | OUTRO 201-240

Each layer is rendered as its own dry stem, given a bar-based gain envelope,
then summed with kick-triggered ducking of the low/pad layers and a simple master.
Deterministic: all random choices come from one seeded generator.
Human listening is still PENDING; no quality claim.

Run: local-only/toolchains/production-python/bin/python studies/009-flagship-layered/render_flagship.py
"""
from pathlib import Path
import sys, json, random, hashlib
import mido, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, lfilter
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '010-eight-directions'))
from engine import feedback_delay, reverb

R = Path(__file__).resolve().parent
sys.path.insert(0, str(R.parent / '006-curated-production-ab'))
from surge_host import load

SR = 48000
BPM = 128
BEAT = 60 / BPM
BAR_S = 4 * BEAT
TOTAL_BARS = 240
TOTAL = TOTAL_BARS * BAR_S
TAIL = 3.0
N = int((TOTAL + TAIL) * SR)
OUT = R / 'outputs'
OUT.mkdir(exist_ok=True)
rng = random.Random(20261104)

SECTIONS = [
    ('INTRO', 1, 16), ('GROOVE', 17, 48), ('DIALOGUE', 49, 80), ('WITHDRAW', 81, 112),
    ('BUILD', 113, 144), ('RUPTURE', 145, 160), ('AFTERIMAGE', 161, 200), ('OUTRO', 201, 240),
]


def section_of(bar):
    for name, a, b in SECTIONS:
        if a <= bar <= b:
            return name
    raise ValueError(bar)


LAYERS = {
    'sub': dict(patch='patches_factory/Basses/Eighties Drone.fxp', volume=-6.0),
    'bass': dict(patch='patches_factory/Basses/Rubber Bass.fxp', volume=-6.0),
    'pad': dict(patch='patches_factory/Pads/Ghost Pad.fxp', volume=-12.0),
    'noise': dict(patch='patches_factory/FX/Radio Noise.fxp', volume=-19.0),
    'shimmer': dict(patch='patches_factory/Pads/Bell Pad.fxp', volume=-12.0),
    'kick': dict(patch='patches_factory/Percussion/Kick Tech 1.fxp', volume=-8.0),
    'snare': dict(patch='patches_factory/Percussion/Snare Tight.fxp', volume=-13.0),
    'hat': dict(patch='patches_factory/Percussion/Drum One.fxp', volume=-14.0),
    'metal': dict(patch='patches_factory/FX/Metal Pluck.fxp', volume=-10.0),
    'bell': dict(patch='patches_factory/Plucks/Bell 1.fxp', volume=-10.0),
    'texture': dict(patch='patches_factory/FX/Unsettler.fxp', volume=-12.0),
    'impact': dict(patch='patches_factory/Percussion/Kick Tech 2.fxp', volume=-8.0),
}

# bar -> dB envelope per layer (linear between breakpoints)
ENV = {
    'sub': [(1, -18), (17, -14), (49, -16), (81, -18), (113, -12), (145, -10), (161, -16), (201, -18), (240, -30)],
    'bass': [(1, -60), (17, -14), (49, -18), (81, -60), (113, -10), (145, -8), (161, -14), (201, -60), (240, -60)],
    'pad': [(1, -24), (17, -18), (49, -16), (81, -22), (113, -16), (145, -12), (161, -18), (201, -24), (240, -40)],
    'noise': [(1, -30), (17, -30), (49, -26), (81, -22), (113, -16), (145, -12), (161, -22), (201, -30), (240, -60)],
    'shimmer': [(1, -24), (17, -26), (49, -28), (81, -20), (113, -24), (145, -20), (161, -18), (201, -26), (240, -60)],
    'kick': [(1, -6), (240, -6)],
    'snare': [(1, -10), (240, -10)],
    'hat': [(1, -18), (17, -16), (113, -14), (145, -12), (201, -40), (240, -60)],
    'metal': [(1, -10), (240, -10)],
    'bell': [(1, -12), (240, -12)],
    'texture': [(113, -40), (137, -6), (145, -60), (240, -60)],
    'impact': [(1, -4), (240, -4)],
}
BALANCE_DB = {'sub': 4, 'pad': 6, 'noise': 16, 'shimmer': 8, 'snare': 10, 'hat': 14, 'metal': 4, 'bell': 8, 'texture': 12}
DUCKED = {'sub', 'bass', 'pad', 'noise'}
DELAY_SEND = {'pad': 0.25, 'shimmer': 0.45, 'bell': 0.5, 'metal': 0.3, 'texture': 0.2, 'impact': 0.1, 'snare': 0.1}
VERB_SEND = {'pad': 0.45, 'shimmer': 0.5, 'bell': 0.4, 'metal': 0.2, 'texture': 0.5, 'impact': 0.15, 'snare': 0.1, 'sub': 0.1}
DELAY_S = 0.4375
DELAY_FB = 0.42
VERB_TAU = 2.5

score = {k: [] for k in LAYERS}  # (beat, note, dur_beats, velocity)


def add(layer, bar, off, note, dur, vel):
    score[layer].append(((bar - 1) * 4 + off, note, dur, vel))


def sec_bars(name):
    for n, a, b in SECTIONS:
        if n == name:
            return range(a, b + 1)
    raise ValueError(name)


def build_sub():
    names = {'INTRO': 26, 'GROOVE': 26, 'DIALOGUE': 24, 'WITHDRAW': 26, 'BUILD': 22, 'RUPTURE': 26, 'AFTERIMAGE': 24, 'OUTRO': 26}
    for name, a, b in SECTIONS:
        add('sub', a, 0, names[name], (b - a + 1) * 4 - 0.05, 90)


def build_pad():
    roots = [50, 46, 53, 48]
    for bar in range(1, TOTAL_BARS + 1, 4):
        root = roots[((bar - 1) // 4) % 4]
        for n in (root, root + 7, root + 12):
            add('pad', bar, 0, n, 16 - 0.05, 70)


def build_noise():
    for name, a, b in SECTIONS:
        add('noise', a, 0, 55, (b - a + 1) * 4 - 0.05, 50)


SCALE = [62, 65, 67, 69, 72, 74, 77, 79, 81]


def build_shimmer():
    every = {'INTRO': 2, 'GROOVE': 4, 'DIALOGUE': 4, 'WITHDRAW': 1, 'BUILD': 4, 'RUPTURE': 8, 'AFTERIMAGE': 2, 'OUTRO': 4}
    for bar in range(1, TOTAL_BARS + 1):
        step = every[section_of(bar)]
        if bar % step == 1 % step:
            add('shimmer', bar, rng.choice([0, 2]), rng.choice(SCALE), 6, 60)


def build_kick():
    for bar in range(1, TOTAL_BARS + 1):
        s = section_of(bar)
        if s == 'GROOVE':
            for off, vel in ((0, 105), (2, 92)):
                add('kick', bar, off, 43, 0.13, vel)
        elif s == 'DIALOGUE':
            add('kick', bar, 0, 43, 0.13, 100)
        elif s == 'WITHDRAW' and bar % 8 == 1:
            add('kick', bar, 0, 43, 0.13, 90)
        elif s == 'BUILD':
            offs = [0, 2] if bar <= 128 else [0, 1, 2, 3]
            vel = 90 + (bar - 113) * 1
            for off in offs:
                add('kick', bar, off, 43, 0.13, min(vel, 112))
        elif s == 'RUPTURE':
            for off in (0, 2):
                add('kick', bar, off, 43, 0.13, 110)
        elif s == 'AFTERIMAGE' and bar % 4 == 1:
            add('kick', bar, 0, 43, 0.13, 85)
        elif s == 'OUTRO' and bar % 8 == 1:
            add('kick', bar, 0, 43, 0.13, 80)


def build_snare():
    for bar in range(1, TOTAL_BARS + 1):
        s = section_of(bar)
        if s == 'GROOVE':
            add('snare', bar, 2, 62, 0.12, 80)
        elif s == 'DIALOGUE' and bar % 2 == 1:
            add('snare', bar, 2, 62, 0.12, 80)
        elif s == 'BUILD' and bar >= 129:
            for k in range(8):
                add('snare', bar, k * 0.5, 62, 0.08, 60 + k * 6)
        elif s == 'RUPTURE':
            add('snare', bar, 2, 62, 0.12, 110)
        elif s == 'AFTERIMAGE' and bar % 8 == 1:
            add('snare', bar, 2, 62, 0.12, 60)


def build_hat():
    for bar in range(1, TOTAL_BARS + 1):
        s = section_of(bar)
        if s == 'GROOVE':
            for off in (0.5, 1.5, 2.5, 3.5):
                add('hat', bar, off, 60, 0.05, 50 + rng.randint(0, 12))
        elif s == 'BUILD' and bar >= 129:
            for k in range(16):
                add('hat', bar, k * 0.25, 60, 0.04, 40 + k * 3)
        elif s == 'RUPTURE':
            for off in (0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5):
                add('hat', bar, off, 60, 0.05, 70)


def build_bass():
    riff = [(0, 31, 0.4, 109), (1.5, 31, 0.25, 80), (2.5, 34, 0.3, 90), (3.5, 31, 0.25, 75)]
    for bar in range(1, TOTAL_BARS + 1):
        s = section_of(bar)
        if s == 'GROOVE':
            for off, note, dur, vel in riff:
                n = note + 5 if (bar - 17) % 4 == 3 and off == 3.5 else note
                add('bass', bar, off, n, dur, vel)
        elif s == 'DIALOGUE' and bar % 2 == 0:
            add('bass', bar, 0, 31, 0.5, 100)
            add('bass', bar, 2, 29, 0.5, 92)
        elif s == 'BUILD':
            for k in range(8):
                vel = 70 + int((bar - 113) * 40 / 31)
                add('bass', bar, k * 0.5, 31, 0.4, min(vel, 110))
        elif s == 'RUPTURE':
            for off, note, dur, vel in riff:
                add('bass', bar, off, note - 12, dur, min(vel + 10, 120))
        elif s == 'AFTERIMAGE' and bar % 2 == 1:
            add('bass', bar, 0, 31, 1.5, 95)
            add('bass', bar, 2.5, 34, 0.9, 80)
        elif s == 'OUTRO' and bar % 4 == 1 and bar < 225:
            add('bass', bar, 0, 31, 2.0, 80)


def build_metal():
    for bar in range(1, TOTAL_BARS + 1):
        s = section_of(bar)
        if s == 'GROOVE' and bar % 8 == 0:
            add('metal', bar, 2.5, 79, 0.2, 90)
        elif s == 'DIALOGUE':
            if bar % 2 == 1:
                add('metal', bar, 0.5, 70, 0.16, 68)
                add('metal', bar, 1.75, 74, 0.16, 88)
            else:
                add('metal', bar, 3.25, 67, 0.16, 80)
        elif s == 'WITHDRAW' and rng.random() < 0.25:
            add('metal', bar, rng.choice([0.5, 2.5]), rng.choice([79, 81, 74]), 0.2, 70)
        elif s == 'BUILD' and bar % 4 == 1:
            add('metal', bar, 0.5, 70, 0.16, 74)
            add('metal', bar, 1.75, 74, 0.16, 92)
            add('metal', bar, 3.25, 77, 0.16, 84)
        elif s == 'RUPTURE':
            add('metal', bar, 0, 81, 0.5, 110)
            add('metal', bar, 2, 79, 0.25, 100)
        elif s == 'AFTERIMAGE' and bar % 8 == 1:
            add('metal', bar, 0, 74, 1.5, 80)
        elif s == 'OUTRO' and bar in (201, 225):
            add('metal', bar, 0, 69, 2.0, 70)


def build_bell():
    for bar in range(1, TOTAL_BARS + 1):
        s = section_of(bar)
        if s == 'DIALOGUE' and bar % 2 == 0:
            add('bell', bar, 2, 77, 0.5, 72)
        elif s == 'AFTERIMAGE' and bar % 4 == 1:
            add('bell', bar, 0, 77, 3.0, 70)
            add('bell', bar, 2, 74, 2.0, 64)


def build_texture():
    add('texture', 113, 0, 50, 32 * 4 - 0.05, 90)


def build_impact():
    for bar in (113, 145, 161, 201):
        add('impact', bar, 0, 36, 0.5, 110)


for fn in [build_sub, build_pad, build_noise, build_shimmer, build_kick, build_snare, build_hat,
           build_bass, build_metal, build_bell, build_texture, build_impact]:
    fn()


def env_gain(layer):
    bars = [b for b, _ in ENV[layer]]
    dbs = [d for _, d in ENV[layer]]
    tb = np.arange(N, dtype=np.float64) / SR / BAR_S + 1
    db = np.interp(tb, bars, dbs) + BALANCE_DB.get(layer, 0)
    return (10 ** (db / 20)).astype(np.float32)


def kick_env():
    imp = np.zeros(N, dtype=np.float64)
    for beat, _, _, _ in score['kick']:
        idx = int(beat * BEAT * SR)
        if idx < N:
            imp[idx] += 1.0
    a = np.exp(-1 / (0.12 * SR))
    env = lfilter([1 - a], [1, -a], imp)
    return np.clip(env, 0, 1).astype(np.float32)


KENV = kick_env()
DUCK = (1 - 0.35 * KENV).astype(np.float32)

mix = np.zeros((2, N), dtype=np.float32)
dsend = np.zeros((2, N), dtype=np.float32)
vsend = np.zeros((2, N), dtype=np.float32)
report = {
    'bpm': BPM, 'total_bars': TOTAL_BARS, 'duration_s': TOTAL + TAIL, 'sample_rate': SR,
    'sections': [{'name': n, 'start_bar': a, 'end_bar': b} for n, a, b in SECTIONS],
    'status': 'REAL SURGE VST3 RENDER; no DAW export; no human listening',
    'layers': {},
}
score_json = {}
for layer, cfg in LAYERS.items():
    events = []
    for beat, note, dur, vel in score[layer]:
        events.append((bytes(mido.Message('note_on', note=note, velocity=vel).bytes()), beat * BEAT))
        events.append((bytes(mido.Message('note_off', note=note).bytes()), (beat + dur) * BEAT))
    events.sort(key=lambda e: e[1])
    score_json[layer] = [{'beat': b, 'note': n, 'dur_beats': d, 'velocity': v} for b, n, d, v in score[layer]]
    p = load(cfg['patch'])
    p.fx_chain_bypass = 'All FX Off'
    p.global_volume = cfg['volume']
    if not events:
        report['layers'][layer] = {'patch': cfg['patch'], 'notes': 0, 'status': 'NO NOTES'}
        continue
    audio = p(events, duration=TOTAL + TAIL, sample_rate=SR, num_channels=2, reset=False).astype(np.float32)
    assert np.isfinite(audio).all(), layer
    g = env_gain(layer)
    if layer in DUCKED:
        g = g * DUCK
    stem = audio * g
    sf.write(OUT / f'layer-{layer}.wav', stem.T, SR, subtype='PCM_24')
    mix += stem
    dsend += stem * DELAY_SEND.get(layer, 0.0)
    vsend += stem * VERB_SEND.get(layer, 0.0)
    report['layers'][layer] = {
        'patch': cfg['patch'],
        'notes': len(score[layer]),
        'peak': float(np.max(np.abs(stem))),
        'rms': float(np.sqrt(np.mean(stem ** 2))),
        'state_sha256': hashlib.sha256(p.raw_state).hexdigest(),
    }
    print(layer, report['layers'][layer], flush=True)

mix = mix + feedback_delay(dsend, int(DELAY_S * SR), DELAY_FB) * 0.5 + reverb(vsend, VERB_TAU) * 0.35
sos = butter(2, 28, btype='highpass', fs=SR, output='sos')
mix = sosfilt(sos, mix, axis=1).astype(np.float32)
peak = float(np.max(np.abs(mix)))
master = np.tanh(mix / max(peak, 1e-9) * 0.9) * 0.89
sf.write(OUT / 'FLAGSHIP_01_master.wav', master.T, SR, subtype='PCM_24')
report['master'] = {'peak': float(np.max(np.abs(master))), 'rms': float(np.sqrt(np.mean(master ** 2)))}
(R / 'render-report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
(R / 'score.json').write_text(json.dumps(score_json, indent=2, ensure_ascii=False) + '\n')
print('master', report['master'], flush=True)
