# Experiment 011 — Musical Expectation A/B

This project implements a deliberately small **original symbolic composition** demonstrating what a typed music brief means when executed as two inspectable MIDI arrangements.

It is not a finished track, a mature groove library, or a psychoacoustic proof. The key contribution is testable **structural difference** rather than new preset names.

## Run

```bash
python3 -m pip install mido
python3 generate_midis.py
```

Outputs:
- `out/expectation_A.mid` — **A:** 32 bars at 128 BPM, 17–24 contain no bass MIDI events while the metal response continues; bass returns in bar 25 with changed register and attack.
- `out/expectation_B.mid` — **B:** bass remains in 17–24, but the metal answers become longer and displaced.
- `out/manifest.json` — programmatic checks plus note counts and known changes.

Both have three sounding tracks: BASS QUESTION, METAL ANSWER, and PULSE GRID. The files contain **no real audio**. GM program changes are placeholders. Import MIDI into a DAW with a free/properly licensed synth such as Surge XT and add original sound design to listen to the difference.

## Listening procedure

1. **Baseline:** listen to bars 1–16; note the bass/question and metal/answer timing.
2. **Blind A/B:** listen to the whole 60s files at similar playback loudness, without seeing markers.
3. **Checkpoint:** bar 17 = 30.000s. A withholds bass; B keeps bass but changes metal response.
4. **Fulfilment:** bar 25 = 45.000s. A returns a changed bass line; B resolves metal role.
5. Give exact timestamps and a critical note: which version actually makes you wait, and whether the return feels earned.
6. Replace the illustrative GM voices with purpose-made sounds and redo the test. A changed sound can change the sense of musical expectation.

This script asserts note events and structure, but **does not measure listener expectation or rate music quality**.

## Follow-up into real performance

A future real-time controller can hold the anticipated bass entry and quantize a foot-triggered fulfilment event to a bar. Use the shared [Show Score](../../protocols/show-score-v1.schema.json) schema and independently test tracking loss / SAFE. Do not equate an automated bar-25 MIDI event with actual interactive performance.

## References

- [Expectation composition essay](https://github.com/ewanqian/portfolio/blob/main/writings/performable-music/05-what-is-musical-expectation.md)
- [Agent composition grammar](https://github.com/ewanqian/portfolio/blob/main/writings/performable-music/06-agent-composition-grammar.md)
- [Composition Plan v1](../../protocols/composition-plan-v1/README.md)
