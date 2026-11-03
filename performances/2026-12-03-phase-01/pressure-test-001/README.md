# PRESSURE TEST 001 — Reproducible reference, not mastered performance

This folder contains an **original, reproducible 78.75s stereo musical sketch** for the Critical Field director's score, including its generator and cue/Show Score output.

There are NO WAV/MP3 binaries checked into GitHub yet. The renderer produces them on any local machine with Python 3, NumPy, SciPy and SoundFile. This avoids reliance on a ChatGPT sandbox download. Do not say the audio has been uploaded or mastered.

## Generate from GitHub

```bash
git clone https://github.com/ewanqian/performable-music.git
cd performable-music/performances/2026-12-03-phase-01/pressure-test-001
python3 -m venv .venv
source .venv/bin/activate
pip install numpy scipy soundfile
python render.py
```

Expected originals:
- `CRITICAL_FIELD_PRESSURE_TEST_preview.wav` — 44.1k/16bit stereo, 128 BPM, 42 bars / 78.75s.
- `stems/sub-impact.wav`
- `stems/mechanism.wav`
- `stems/harmonic.wav`
- `stems/field.wav`
- `show-cues.csv`
- `show-score-reference.json` — 20Hz **scripted scene score, not real sensor data**.

The Numpy seeded noise source means the script is mostly deterministic in a fixed software environment; different software dependency versions may cause slight numeric differences. Do not treat it as a sample-accurate render specification across all systems.

## Musical form / cues

| Bars (0-indexed) | Time | Name | Meaning |
|---|---|---|---|
| 0–5 | 0–9.375s | VACUUM | sparse field, sub pressure |
| 5–17 | 9.375–31.875s | MOTION | accumulate rhythmic machinery |
| 17–24 | 31.875–45.000s | SUSPENSION | subtract, expose tension |
| 24–36 | 45.000–67.500s | OVERRIDE | foot-trigger concept, sudden scale |
| 36–42 | 67.500–78.750s | AFTERIMAGE | motif return / decay |

### Explicit limitations

- Only stereo audio is rendered, NO actual 3D spatial audio.
- No physical foot or AVP sensor was captured; there is only a cue *plan*.
- Audio synthesis is made in Python to make the *reference* reproducible; downstream productions may be done in SuperCollider and Max.
- Master sum uses bounded nonlinear shaping; individual stem sum is a sketch, not exactly identical to post-master waveform.
- Review with headphones and a listening partner before using in a stage show. No objective measure can prove aesthetic merit.

## Source / rights

The source was written for this study; no copyrighted tracks, sampled artist recordings or other creators' code are embedded. Do not treat the artist references in the director's score as permission to copy their audio.

## Read next

- `../DIRECTOR_SCORE.md`
- `../../../../START_HERE_FOR_LOCAL_CODEX.md`
- `../../../../protocols/show-score-v1.schema.json`
