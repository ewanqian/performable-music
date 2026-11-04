"""Original unattended piece, 32 bars at 128 BPM (~60 s), rendered through the real Surge XT VST3.

Form: A 1-8 groove | B 9-16 call/response with rests | C 17-24 withdrawal + pressure | D 25-32 return + release.
No live input, no WebGL, no foot event. Dry stems plus a simple master. Human listening is still PENDING.
Run: local-only/toolchains/production-python/bin/python studies/008-unattended-piece/render_piece.py
"""
from pathlib import Path
import sys, json, hashlib
import mido, numpy as np, soundfile as sf

R = Path(__file__).resolve().parent
sys.path.insert(0, str(R.parent / '006-curated-production-ab'))
from surge_host import load, patch_metadata

SR = 48000
BPM = 128
BEAT = 60 / BPM
BARS = 32
TOTAL = BARS * 4 * BEAT
TAIL = 2.0
OUT = R / 'outputs'
OUT.mkdir(exist_ok=True)

PATCHES = {
    'bass': 'patches_factory/Basses/Rubber Bass.fxp',
    'metal': 'patches_factory/FX/Metal Pluck.fxp',
    'kick': 'patches_factory/Percussion/Kick Tech 1.fxp',
    'snare': 'patches_factory/Percussion/Snare Tight.fxp',
    'pressure': 'patches_factory/FX/Radio Noise.fxp',
}
PARAMS = {
    'bass': {'a_velocity_vca_gain': -22.0, 'b_velocity_vca_gain': -22.0, 'fx_chain_bypass': 'All FX Off', 'global_volume': -6.0, 'a_filter_1_cutoff': 620.0, 'a_filter_1_resonance': 10.0},
    'metal': {'a_velocity_vca_gain': -18.0, 'b_velocity_vca_gain': -18.0, 'fx_chain_bypass': 'All FX Off', 'global_volume': -10.0},
    'kick': {'a_velocity_vca_gain': -12.0, 'b_velocity_vca_gain': -12.0, 'fx_chain_bypass': 'All FX Off', 'global_volume': -8.0},
    'snare': {'a_velocity_vca_gain': -24.0, 'b_velocity_vca_gain': -24.0, 'fx_chain_bypass': 'All FX Off', 'global_volume': -13.0},
    'pressure': {'a_velocity_vca_gain': -10.0, 'b_velocity_vca_gain': -10.0, 'fx_chain_bypass': 'All FX Off', 'global_volume': -19.0},
}
ROLE_GAIN = {'bass': 1.0, 'metal': 0.9, 'kick': 1.0, 'snare': 0.8, 'pressure': 0.7}


def bar_start(b):
    return (b - 1) * 4


def notes_for_bars(bars, offsets):
    return [(bar_start(b) + off, note, dur, vel) for b in bars for (off, note, dur, vel) in offsets]


A_BARS = range(1, 9)
B_BARS = range(9, 17)
C_BARS = range(17, 25)
D_BARS = range(25, 33)

score = {r: [] for r in PATCHES}

score['kick'] += notes_for_bars(A_BARS, [(0, 43, 0.13, 105), (2, 43, 0.13, 92)])
score['kick'] += notes_for_bars(B_BARS, [(0, 43, 0.13, 100)])
score['kick'] += notes_for_bars(D_BARS, [(0, 43, 0.13, 108), (2, 43, 0.13, 96)])

score['snare'] += notes_for_bars(B_BARS, [(2, 62, 0.12, 80)])
score['snare'] += notes_for_bars(D_BARS, [(2, 62, 0.12, 84), (3.5, 62, 0.1, 60)])

riff_a = [(0, 31, 0.4, 109), (1.5, 31, 0.25, 80), (2.5, 34, 0.3, 90), (3.5, 31, 0.25, 75)]
score['bass'] += notes_for_bars(A_BARS, riff_a)
score['bass'] += notes_for_bars(B_BARS, [(0, 31, 0.5, 100), (2, 29, 0.5, 92)])
score['bass'] += notes_for_bars(D_BARS, [(0, 31, 0.4, 109), (1.5, 31, 0.25, 80), (2.5, 34, 0.3, 90), (3.5, 36, 0.25, 85)])

score['metal'] += notes_for_bars([9, 11, 13, 15], [(0.5, 70, 0.16, 68), (1.75, 74, 0.16, 88)])
score['metal'] += notes_for_bars([10, 12, 14, 16], [(3.25, 67, 0.16, 80)])
score['metal'] += notes_for_bars([17, 19, 21, 23], [(2.5, 79, 0.2, 90)])
score['metal'] += notes_for_bars([25, 27, 29, 31], [(0.5, 70, 0.16, 74), (1.75, 74, 0.16, 92), (3.25, 77, 0.16, 84)])
score['metal'] += notes_for_bars([32], [(0, 81, 1.5, 100)])

score['pressure'] += [(bar_start(17), 55, 15.5, 45)]
score['pressure'] += [(bar_start(25), 55, 27.5, 58)]

events = {}
for role, notes in score.items():
    ev = []
    for start, note, dur, vel in notes:
        ev.append((bytes(mido.Message('note_on', note=note, velocity=vel).bytes()), start * BEAT))
        ev.append((bytes(mido.Message('note_off', note=note).bytes()), (start + dur) * BEAT))
    ev.sort(key=lambda e: e[1])
    events[role] = ev

stems = {}
report = {'bpm': BPM, 'bars': BARS, 'sample_rate': SR, 'duration_s': TOTAL + TAIL, 'roles': {}, 'status': 'REAL SURGE VST3 RENDER; no DAW export; no human listening'}
for role, patch in PATCHES.items():
    p = load(patch)
    for key, value in PARAMS[role].items():
        setattr(p, key, value)
    state = p.raw_state
    audio = p(events[role], duration=TOTAL + TAIL, sample_rate=SR, num_channels=2, reset=False)
    assert np.isfinite(audio).all() and np.max(np.abs(audio)) > 1e-5, role
    stems[role] = audio * ROLE_GAIN[role]
    report['roles'][role] = {
        'patch': patch,
        'notes': len(score[role]),
        'peak': float(np.max(np.abs(stems[role]))),
        'state_sha256': hashlib.sha256(state).hexdigest(),
    }
    sf.write(OUT / f'stem-{role}.wav', stems[role].T, SR, subtype='PCM_24')
    print(role, report['roles'][role], flush=True)

mix = sum(stems.values())
peak = float(np.max(np.abs(mix)))
master = np.tanh(mix / max(peak, 1e-9) * 0.9) * 0.89
sf.write(OUT / 'PIECE_01_master.wav', master.T, SR, subtype='PCM_24')
report['master'] = {'peak': float(np.max(np.abs(master))), 'rms': float(np.sqrt(np.mean(master ** 2)))}
(R / 'render-report.json').write_text(json.dumps(report, indent=2) + '\n')
print('master', report['master'], flush=True)
