> ARCHIVED / PAUSED: early SC keyboard study. Retained research history; do not resume piano expansion. Current work: studies/006-curated-production-ab and studies/007-form-and-finish.

# Afterimage — SuperCollider 16-bar A/B study

Original composition experiment, 2026-11-04. Musical status: **NOT REVIEWED**. Technical render results are in `TEST_RESULTS.json`. This task sends no commands to Ableton Live and changes no Live Set, instruments, MIDI or automation.

## Listen first

Anonymous, loudness-matched local files:

- `renders/Listening_X.wav`
- `renders/Listening_Y.wav`

Use `REVIEW_TEMPLATE.md`; do not open `renders/BLIND_KEY.json` until writing initial judgments. Named versions are `renders/Afterimage_A.wav` and `renders/Afterimage_B.wav`. Raw SuperCollider outputs are also retained. Audio and full machine logs are ignored by Git to avoid accidental publication; the files exist in this checkout.

These are a synthesized struck-string/key timbre, not an acoustic-piano sample library. The experiment tests original musical development with one instrument. There are no drum voices, pads, reverb, paid plugins, sample packs or runtime Quarks.

## The shared object

108 BPM, 4/4, D minor. MIDI 60 is written C4 here (some DAWs call it C3).

Two-bar motif:

| Note | A4 | C5 | E5 | F5 | E5 | D5 |
|---|---|---|---|---|---|---|
| MIDI | 69 | 72 | 76 | 77 | 76 | 74 |
| Beat from start | 0 | 1.5 | 2.5 | 4 | 5.75 | 6.5 |
| Length in beats | .7 | .4 | .7 | 1.2 | .45 | 1.1 |
| Velocity | 73 | 64 | 68 | 80 | 60 | 67 |

Both versions have the same opening melody, accompaniment, articulation and raw PCM. A low D anchors the opening; the motif's E→F half step is its pressure point. The raw opening equivalence is checked before independent loudness gains are applied.

## Two musical futures

| Bars | A — melodic/harmonic development | B — interruption and memory |
|---|---|---|
| 1–4 | State the motif, then answer downwards. Dm(add9) → Bbmaj7/D. | Same two-bar opening; repeat enters half a beat late and omits its final answer. D remains the tonal field. |
| 5–8 | Sequence the motif lower over Fadd9; move through Gm7 → A7, using C# as a directed leading tone. | Isolate E–F; separate statements with gaps. Earlier E returns once in a darker key timbre. Bar 8 is silent. |
| 9–12 | Lower-register counter-phrase, then climb towards G5. Gm7 → Bbadd9 → A7 prepares the return. | Reframe the kernel an octave lower and three-quarters of a beat late. One old C returns; bar 12 is silent. |
| 13–16 | Original contour returns over D, then compresses into a descending D-centered ending. | Return to the original register, but withhold F until late in bar 14. D arrives in bar 15; quiet A/D fragments survive in bar 16. |

B's memory is four explicit re-voicings of earlier motif pitches, with thinner partials and a slower hammer envelope. It is not an ambient wash or an automatic delay/reverb. Sustained notes and memory tails are constrained so the designated empty bars really become silent.

The prompt asks for two contrasting strategies, so this is not a controlled single-variable scientific comparison. A changes harmonic/contour behavior; B changes omission, placement and memory. Prefer one future by listening, then isolate its next revision.

## Free official installation / runtime

Initial check found no `sclang`/`scsynth` in PATH and no SuperCollider app in standard system/user Applications folders. The official 3.14.1 universal macOS app was downloaded and unpacked **inside `local-only/toolchains/SuperCollider.app`**, not installed globally. Both binaries were executed successfully. No purchase or account authorization is needed for this workflow.

For a normal macOS installation:

1. Visit https://supercollider.github.io/downloads . Download the stable universal macOS build for Apple Silicon or Intel (3.14.1 was current when checked).
2. Open the official DMG and drag `SuperCollider.app` to `/Applications`.
3. Run `/Applications/SuperCollider.app/Contents/MacOS/sclang -v` and `/Applications/SuperCollider.app/Contents/Resources/scsynth -v`.
4. Use the commands below with `--sc-app /Applications/SuperCollider.app`. No SC3 plugins or Quarks are required.

Official release used:
https://github.com/supercollider/supercollider/releases/tag/Version-3.14.1

DMG SHA-256, verified against the official release asset digest:
`ed264b32752d27fc86e506dd0a7eb36de7c19ebce73c3fdf2ed5514f8c73f02e`

The unmodified app stays outside the tracked source. Its shipped GPL license/notices remain inside the official distribution. `INSTALLATION_TEST.json` records the tested runtime, platform and signature checks without private account data.

## Reproduce

From repository root, using the workspace-local app already prepared:

```sh
python3 studies/agent-engine-compare/compose.py
python3 studies/agent-engine-compare/render.py
python3 studies/agent-engine-compare/validate_audio.py
```

For a normal app install:

```sh
python3 studies/agent-engine-compare/render.py --sc-app /Applications/SuperCollider.app
```

Composition and render wrappers require Python's standard library only. `validate_audio.py` additionally uses locally installed NumPy, soundfile and FFmpeg for PCM inspection and constant-gain loudness matching. They were already present on the tested machine. An optional fresh Python environment can install the two free Python packages using `python3 -m pip install numpy soundfile`; obtain FFmpeg from https://ffmpeg.org/download.html or a normal package manager. Raw WAV rendering itself does not require these analysis packages.

Direct SuperCollider execution after generating the data files:

```sh
AFTERIMAGE_SCSYNTH=/Applications/SuperCollider.app/Contents/Resources/scsynth \
  /Applications/SuperCollider.app/Contents/MacOS/sclang -D \
  studies/agent-engine-compare/supercollider-afterimage.scd
```

`AFTERIMAGE_VARIANT=A` or `B` renders one version. `AFTERIMAGE_OUTPUT_DIR` selects a new output folder. The Python wrapper also exposes `--variant` and `--output-dir`; use a new folder to preserve earlier audio. NRT uses file-based OSC scores, does not boot an audio-device server and does not require a live agent during playback. There is no speaker playback as part of rendering.

`compose.py` is the compositional source: edit its PARAMS/MOTIF declarations or musical rules, then regenerate. `parameters.json` is the exported parameter snapshot. Generated JSON/CSV/SC data files are overwritten on regeneration. `compose.py` emits inspectable JSON, CSV and numeric `.scd` data; no JSON Quark is needed in SuperCollider. The `.scd` renderer owns the actual synthesis and real NRT WAV output. It exits with an error if the SC renderer fails; there is no substitute audio generator.

## What was and was not verified

- Real sclang class compilation and real scsynth NRT server exits.
- Nonempty stereo PCM_24 WAVs at 48 kHz; expected 16-bar duration plus 50 ms preroll and 3 s tail (about 38.607 s total).
- Shared original opening, finite samples, no full-scale clipping, deliberate B silence and matched integrated loudness.
- Constant gains only for loudness matching; no compression or reverb added by the analysis step. B's larger pauses and internal dynamics remain.
- Logs and all attempts, including failures if any, are retained. No human audition or musical self-score is claimed.
- Real-time interaction, stage safety, acoustic monitoring and DAW integration were not tested.

Two types of result remain distinct: successful audio-file generation is technical evidence; a memorable or convincing piece requires the listening worksheet.

Primary documentation:
https://doc.sccode.org/Guides/Non-Realtime-Synthesis.html
