"""Eight direction prototypes, each ~3 minutes (96 bars), all original rule-based material rendered via real Surge XT.

Directions (research prototypes, not finished works; human listening PENDING):
  D01 LATTICE      sparse click grid + tonal pings, silence as material
  D02 GRAIN        dense micro-bursts and high test tones, delay-heavy
  D03 DRONE        slow chord drones, very long reverb
  D04 MACHINE      euclidean clocks (5:4-style), tom clock against 16th kick
  D05 RADIO HALL   vinyl/noise bed, electric-piano chords in a wide hall
  D06 GESTURE      contour-driven lead line (a stand-in for controller gesture data)
  D07 SEQUENCER    three independent 16-step voices regenerated every 4 bars
  D08 AFTERIMAGE   pads and sparse bells into a long feedback delay

Run: local-only/toolchains/production-python/bin/python studies/010-eight-directions/render_directions.py
"""
from pathlib import Path
import json, math, random, sys
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from engine import TAIL, SR, render_patch, section_points, gain_curve, feedback_delay, reverb, master, write_wav

R = Path(__file__).resolve().parent
OUT = R / 'outputs'
OUT.mkdir(exist_ok=True)

BARS = 96
E = [1, 25, 49, 73, 97]  # four 24-bar sections


def sec(bar):
    for i in range(4):
        if E[i] <= bar < E[i + 1]:
            return i
    raise ValueError(bar)


def at(bar, off=0.0):
    return (bar - 1) * 4 + off


def euclid(k, n):
    return [i for i in range(n) if (i * k) % n < k]


def lattice():
    r = random.Random(101)
    click, tone, sub = [], [], []
    dens = [0.3, 0.45, 0.7, 0.25]
    for bar in range(1, BARS + 1):
        s = sec(bar)
        for k in range(16):
            if r.random() < dens[s]:
                click.append((at(bar, k * 0.25), 60, 0.05, r.randint(40, 90)))
        if bar % 2 == 1:
            tone.append((at(bar), r.choice([74, 77, 79, 81, 86]), 1.0, 60))
            if s >= 1 and r.random() < 0.5:
                tone.append((at(bar, 2.5), r.choice([74, 77, 79, 81, 86]), 1.0, 70))
    for i in range(4):
        sub.append((at(E[i]), [26, 29, 26, 24][i], (E[i + 1] - E[i]) * 4 - 0.05, 90))
    return dict(
        bpm=120, edges=E,
        layers={
            'click': dict(patch='patches_factory/Percussion/Drum One.fxp', vol=-12, notes=click, levels=[-18, -14, -10, -18], delay=0.12, verb=0.1),
            'tone': dict(patch='patches_factory/Plucks/Bell 1.fxp', vol=-10, notes=tone, levels=[-14, -12, -12, -16], delay=0.25, verb=0.3),
            'sub': dict(patch='patches_factory/Basses/Eighties Drone.fxp', vol=-6, notes=sub, levels=[-12, -10, -8, -14]),
        },
        fx=dict(delay_s=0.375, fb=0.45, delay_ret=0.5, verb_tau=2.5, verb_ret=0.4),
    )


def grain():
    r = random.Random(202)
    burst, test = [], []
    pitches = [60, 64, 67, 72]
    pbusy = [0.35, 0.6, 0.85, 0.2]
    for bar in range(1, BARS + 1):
        s = sec(bar)
        if r.random() < pbusy[s]:
            off = r.choice([0, 1, 2, 3])
            hits = r.choice([4, 8, 16])
            p = r.choice(pitches)
            for k in range(hits):
                burst.append((at(bar, off + k * 0.125), p, 0.05, r.randint(30, 100)))
        if bar % 8 == 0:
            for n in (84, 88, 91):
                if r.random() < 0.7:
                    test.append((at(bar, r.choice([0, 2])), n, 0.5, 70))
    return dict(
        bpm=140, edges=E,
        layers={
            'grain': dict(patch='patches_factory/Percussion/Drum One.fxp', vol=-14, notes=burst, levels=[-16, -10, -8, -20], delay=0.15, verb=0.1),
            'test': dict(patch='patches_factory/Plucks/Comb Pluck.fxp', vol=-10, notes=test, levels=[-20, -14, -10, -22], delay=0.6, verb=0.3),
        },
        fx=dict(delay_s=0.3, fb=0.6, delay_ret=0.6, verb_tau=1.8, verb_ret=0.3),
    )


def drone():
    roots = [38, 41, 43, 36, 46, 45]
    p1, p3, sub = [], [], []
    for bar in range(1, BARS + 1, 8):
        root = roots[((bar - 1) // 8) % len(roots)]
        for n in (root + 12, root + 19, root + 24):
            p1.append((at(bar), n, 32 - 0.05, 70))
        for n in (root + 24, root + 31):
            p3.append((at(bar), n, 32 - 0.05, 60))
    for i in range(4):
        sub.append((at(E[i]), [26, 29, 26, 24][i], (E[i + 1] - E[i]) * 4 - 0.05, 90))
    return dict(
        bpm=92, edges=E,
        layers={
            'pad1': dict(patch='patches_factory/Pads/Pad 1.fxp', vol=-10, notes=p1, levels=[-16, -12, -10, -16], delay=0.1, verb=0.7),
            'pad3': dict(patch='patches_factory/Pads/Pad 3.fxp', vol=-10, notes=p3, levels=[-22, -20, -16, -24], delay=0.0, verb=0.7),
            'sub': dict(patch='patches_factory/Basses/Eighties Drone.fxp', vol=-6, notes=sub, levels=[-14, -12, -12, -16]),
        },
        fx=dict(delay_s=0.6, fb=0.3, delay_ret=0.25, verb_tau=6.0, verb_ret=0.7),
    )


def machine():
    kick, tom, bass, metal = [], [], [], []
    k_on = euclid(5, 16)
    k_on2 = euclid(7, 16)
    bass_notes = [31, 34, 36, 29]
    for bar in range(1, BARS + 1):
        s = sec(bar)
        pattern = k_on2 if s == 2 else k_on
        if s != 0 or bar % 4 == 1:
            for step in pattern:
                kick.append((at(bar, step * 0.25), 43, 0.1, 100 if step == 0 else 90))
        if s in (0, 1):
            t = 0.0
            while t < 4:
                tom.append((at(bar, t), 50, 0.2, 85))
                t += 0.75
        for i, step in enumerate(euclid(3, 8)):
            bass.append((at(bar, step * 0.5), bass_notes[(bar + i) % 4], 0.4, 95))
        if s in (1, 2) and bar % 8 == 0:
            metal.append((at(bar, 3.5), 79, 0.2, 80))
    return dict(
        bpm=124, edges=E,
        layers={
            'kick': dict(patch='patches_factory/Percussion/Kick Tech 1.fxp', vol=-8, notes=kick, levels=[-8, -6, -6, -10]),
            'tom': dict(patch='patches_factory/Percussion/Synth Tom 2.fxp', vol=-12, notes=tom, levels=[-20, -12, -14, -20], delay=0.1),
            'bass': dict(patch='patches_factory/Basses/Rubber Bass.fxp', vol=-6, notes=bass, levels=[-12, -8, -10, -16], delay=0.05),
            'metal': dict(patch='patches_factory/FX/Metal Pluck.fxp', vol=-10, notes=metal, levels=[-18, -12, -12, -18], delay=0.3, verb=0.2),
        },
        fx=dict(delay_s=0.375, fb=0.3, delay_ret=0.3, verb_tau=1.5, verb_ret=0.2),
    )


def radio_hall():
    r = random.Random(505)
    vinyl, noise, ep = [], [], []
    for i in range(4):
        vinyl.append((at(E[i]), 50, (E[i + 1] - E[i]) * 4 - 0.05, 80))
        noise.append((at(E[i]), 55, (E[i + 1] - E[i]) * 4 - 0.05, 60))
    roots = [57, 53, 55, 50]
    for bar in range(1, BARS + 1, 4):
        root = roots[((bar - 1) // 4) % 4]
        if r.random() < 0.8:
            for n in (root, root + 4, root + 7):
                ep.append((at(bar), n, 8 - 0.05, r.randint(65, 80)))
    return dict(
        bpm=100, edges=E,
        layers={
            'vinyl': dict(patch='patches_factory/FX/Vinyl.fxp', vol=-12, notes=vinyl, levels=[-24, -20, -18, -26], verb=0.5),
            'noise': dict(patch='patches_factory/FX/Radio Noise.fxp', vol=-19, notes=noise, levels=[-26, -22, -18, -28], verb=0.8),
            'ep': dict(patch='patches_factory/Keys/EP 1.fxp', vol=-10, notes=ep, levels=[-14, -12, -12, -16], delay=0.3, verb=0.6),
        },
        fx=dict(delay_s=0.2, fb=0.35, delay_ret=0.4, verb_tau=5.0, verb_ret=0.7),
    )


def gesture():
    scale = [62, 65, 67, 69, 72, 74, 77, 79, 81]
    lead, pad = [], []
    for bar in range(1, BARS + 1):
        for k in range(16):
            pos = (bar - 1) * 16 + k
            if pos % 5 == 0:
                continue
            idx = int(round(4 + 4 * math.sin(2 * math.pi * pos / 48)))
            vel = int(60 + 40 * (0.5 + 0.5 * math.sin(2 * math.pi * pos / 24)))
            lead.append((at(bar, k * 0.25), scale[idx], 0.22, vel))
    roots = [50, 46, 53, 48]
    for bar in range(1, BARS + 1, 8):
        root = roots[((bar - 1) // 8) % 4]
        for n in (root, root + 7, root + 12):
            pad.append((at(bar), n, 32 - 0.05, 70))
    return dict(
        bpm=128, edges=E,
        layers={
            'lead': dict(patch='patches_factory/Leads/Classic Lead 1.fxp', vol=-10, notes=lead, levels=[-16, -10, -8, -16], delay=0.4, verb=0.3),
            'pad': dict(patch='patches_factory/Pads/Ghost Pad.fxp', vol=-12, notes=pad, levels=[-22, -18, -16, -22], verb=0.4),
        },
        fx=dict(delay_s=0.375, fb=0.5, delay_ret=0.5, verb_tau=2.2, verb_ret=0.3),
    )


def sequencer():
    r = random.Random(707)
    a, b, c = [], [], []
    pA = [0.25, 0.4, 0.5, 0.2]
    pB = [0.1, 0.25, 0.4, 0.1]
    pC = [0.15, 0.25, 0.3, 0.15]
    for bar in range(1, BARS + 1):
        s = sec(bar)
        for k in range(16):
            if r.random() < pA[s]:
                a.append((at(bar, k * 0.25), r.choice([70, 72, 74, 77, 79]), 0.2, r.randint(70, 100)))
            if r.random() < pB[s]:
                b.append((at(bar, k * 0.25), 36, 0.15, r.randint(80, 110)))
            if r.random() < pC[s]:
                c.append((at(bar, k * 0.25), r.choice([84, 86, 88, 91]), 0.3, r.randint(50, 80)))
    return dict(
        bpm=132, edges=E,
        layers={
            'voiceA': dict(patch='patches_factory/FX/Metal Pluck.fxp', vol=-10, notes=a, levels=[-12, -8, -8, -14], delay=0.3),
            'voiceB': dict(patch='patches_factory/Percussion/Kick Tech 2.fxp', vol=-8, notes=b, levels=[-10, -6, -6, -12]),
            'voiceC': dict(patch='patches_factory/Plucks/Bell 2.fxp', vol=-10, notes=c, levels=[-16, -12, -12, -18], delay=0.5, verb=0.3),
        },
        fx=dict(delay_s=0.25, fb=0.35, delay_ret=0.35, verb_tau=1.5, verb_ret=0.2),
    )


def afterimage():
    r = random.Random(808)
    pad, bell, un = [], [], []
    roots = [48, 43, 45, 41]
    for bar in range(1, BARS + 1, 8):
        root = roots[((bar - 1) // 8) % 4]
        for n in (root + 12, root + 16, root + 19):
            pad.append((at(bar), n, 32 - 0.05, 70))
    for bar in range(1, BARS + 1, 2):
        if r.random() < 0.6:
            bell.append((at(bar), r.choice([74, 77, 81, 84]), 3.0, 60))
    un.append((at(1), 40, BARS * 4 - 0.05, 60))
    return dict(
        bpm=90, edges=E,
        layers={
            'pad': dict(patch='patches_factory/Pads/Ghost Pad.fxp', vol=-12, notes=pad, levels=[-18, -16, -14, -20], verb=0.5),
            'bell': dict(patch='patches_factory/Pads/Bell Pad.fxp', vol=-10, notes=bell, levels=[-16, -12, -14, -20], delay=0.9, verb=0.6),
            'unsettler': dict(patch='patches_factory/FX/Unsettler.fxp', vol=-10, notes=un, levels=[-26, -22, -20, -26], delay=0.3),
        },
        fx=dict(delay_s=0.75, fb=0.6, delay_ret=0.6, verb_tau=6.0, verb_ret=0.5),
    )


DIRECTIONS = [
    ('D01_LATTICE', lattice), ('D02_GRAIN', grain), ('D03_DRONE', drone), ('D04_MACHINE', machine),
    ('D05_RADIO_HALL', radio_hall), ('D06_GESTURE', gesture), ('D07_SEQUENCER', sequencer), ('D08_AFTERIMAGE', afterimage),
]


def render(spec):
    beat_s = 60 / spec['bpm']
    seconds = BARS * 4 * beat_s + TAIL
    n = int(seconds * SR)
    dry = np.zeros((2, n), np.float32)
    dsend = np.zeros((2, n), np.float32)
    vsend = np.zeros((2, n), np.float32)
    report = {}
    for name, l in spec['layers'].items():
        a = render_patch(l['patch'], l['notes'], seconds, beat_s, l['vol'])[:, :n]
        s = a * gain_curve(section_points(spec['edges'], l['levels']), n, beat_s)
        dry += s
        dsend += s * l.get('delay', 0.0)
        vsend += s * l.get('verb', 0.0)
        report[name] = dict(patch=l['patch'], notes=len(l['notes']), peak=float(np.max(np.abs(s))))
    fx = spec['fx']
    wet_d = feedback_delay(dsend, int(fx['delay_s'] * SR), fx['fb']) * fx['delay_ret']
    wet_v = reverb(vsend, fx['verb_tau']) * fx['verb_ret']
    return master(dry + wet_d + wet_v), report, seconds


if __name__ == '__main__':
    summary = {}
    for name, builder in DIRECTIONS:
        spec = builder()
        mix, layers, seconds = render(spec)
        write_wav(OUT / f'{name}.wav', mix)
        summary[name] = dict(bpm=spec['bpm'], seconds=round(seconds, 2), layers=layers,
                             master_peak=float(np.max(np.abs(mix))), master_rms=float(np.sqrt(np.mean(mix ** 2))))
        print(name, summary[name]['seconds'], summary[name]['master_peak'], flush=True)
    (R / 'render-report.json').write_text(json.dumps(summary, indent=2, ensure_ascii=False) + '\n')
