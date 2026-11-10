# Three independent Agent Synth compositions

P0, 2026-11-09. Artist rejected the preceding same-PCM A/B/C/D experiment. This
study makes three independent MIDI works through the real installed Agent Synth
VST3. It is **not an accepted live set**, The Agent Patch, or an AI music-quality
pass. Only artist listening decides keep/revise/reject.

Online reviewers: start with [audio downloads and review scope](../../review/2026-11-09-agent-synth/ONLINE_REVIEW.md).
Actual native Waveform edits and synth graphs/states are in `native-projects/`;
large original WAV/stem assets are attached to the linked review release.

| Work | Length | Musical premise | Decisive change | Remaining listening risk |
|---|---:|---|---|---|
| Prism Run / 棱线 | 72s | E-Lydian seven-note question; articulated low contour; counterphrase crosses boundaries | 48s displaced line aligns with a changed internal contour; 64.5s shortened return | 48s and 56s phrase entrances may feel too forceful; bass pulse may flatten breath |
| Hinge / 铰链 | 78s | Five-beat plucked phrase against a separate three-beat low pattern | 36s short cells become four 7.5-beat questions; original syntax returns in a lower register | 54s change of phrase has a measurable energy rise; string attacks remain very short |
| Air Current / 悬流 | 84s | Unequal ascending breaths, independently descending replies, sustained anchors | anchor begins before 46.36s high-register release; ending answers the ascent in two tones | register expansion may read as merely going higher; linear-FM voice remains monophonic |

These are compositional intentions and score/measurement-derived risks, **not
claims that a model has heard the music**. All four roles contributed; Codex alone
wrote the scores/native edits. No ordinary sampled drum loop, old four-minute PCM,
reference audio, cloud music generator or paid AI was used.

## Actual sources and editing

- `scores/*/v01.mid`, `v02.mid`, `v03.mid`: real editable multi-track MIDI history.
  V2 changes internal pitch/time syntax and endings; V3 fixes two critic-found
  same-pitch retrigger overlaps in Hinge. No original source is overwritten.
- The supplied `PM_MIDI_COMPOSER_V1.zip` was run locally with its real example MIDI
  as a baseline. Its 34–35-second four-cycle outputs remain local and unapproved.
  Its source has no supplied license and is not redistributed. The final music
  replaces that template with separately authored phrases and countervoices.
- `instruments.py`: original native Agent Synth DSP graphs. Mallet modal body,
  Pluck plus a separately enveloped triangle body, and actual linear-Hz FM using
  Poly MIDI/Math/oscillators. Native filter, envelopes, LFO, delay and reverb.
- `agentsynth_host.py`: real VST3 host interoperability, not a synthesizer.
- `outputs/*/final/*-EDITABLE.tracktionedit`: real MIDI clips plus embedded native
  plugin state, static native faders, explicit unity master and linear pan law.
- Native `.json` patch graphs and full plugin `.state` files accompany each voice.
  No runtime vendor source or plugin binary is copied into Git.

## Reproduce on the deployed Mac

Use the existing production Python environment with mido, numpy, soundfile and
pedalboard 0.9.26. Agent Synth v0.588.1 is installed in the user VST3/AU folders.
Waveform's GUI scan is required on a fresh machine; IDs come from its scan list.
Generated directories refuse overwrite. Run from repository root, on a fresh
output directory/checkout when regenerating:

```sh
python studies/018-agent-synth-compositions/verify_engine.py
python studies/018-agent-synth-compositions/compose.py
python studies/018-agent-synth-compositions/revise_midi.py
python studies/018-agent-synth-compositions/test_linear_fm.py
python studies/018-agent-synth-compositions/render.py 01_PRISM_RUN
python studies/018-agent-synth-compositions/render.py 02_HINGE
python studies/018-agent-synth-compositions/render.py 03_AIR_CURRENT
python studies/018-agent-synth-compositions/finalize.py 01_PRISM_RUN
python studies/018-agent-synth-compositions/finalize.py 02_HINGE
python studies/018-agent-synth-compositions/finalize.py 03_AIR_CURRENT
```

For each final edit, actual native rendering used:

```sh
"/Applications/Waveform 14.app/Contents/MacOS/Waveform 14" render EDIT.tracktionedit \
  -o OUTPUT.wav --format wav --sample-rate 48000 --bit-depth 24 \
  --channels stereo --start 0 --end SECONDS --no-tails --json
```

Aligned native stems use the same command with `--separate-files` and
`--name-pattern '$track'`; output points at a new directory. Exact executed
commands/logs and results are in the review packet and local delivery bundle.

## Verified boundaries

Real VST3 sound, MIDI note response, graph/state save and fresh-instance reload,
eight-note linear FM, native Waveform MIDI exports, and isolated GUI Save As,
close/reopen have actual evidence. The full three music projects have CLI reopen
and render evidence; their GUI save/reopen, synth canvas interaction, hardware
MIDI, real-time latency, stage soak and acoustic monitoring remain **NOT_TESTED**.
AU is installed/scanned; AU sound is **NOT_TESTED**. Standalone download timed out;
it is **not deployed**. Functioning VST3 route did not need Cardinal. Hosted AI,
new planning/control frameworks, visuals and vjbake are not part of this work.

Official dependency: [Agent Synth, Tal (Diabl0269), MIT](https://github.com/Diabl0269/agentsynth/tree/v0.588.1).
No affiliation with The Agent Patch by Daito Manabe, Sinan Bokesoy and sonicLAB.
