# Executed commands

Run from repository root. `PY` here denotes the actual existing interpreter:

```sh
PY='/Users/ewanqian/Documents/Sync/1102 演出系统/performable-music/local-only/toolchains/production-python/bin/python'
```

Plugin installation was from the official0.588.1 arm64 plugin ZIP, downloaded to
ignored local-only/toolchains/agentsynth-0.588.1. It was copied into previously
absent user AU/VST3 paths. Actual macOS checks:

```sh
codesign --verify --deep --strict "$HOME/Library/Audio/Plug-Ins/VST3/Agent Synth.vst3"
codesign --verify --deep --strict "$HOME/Library/Audio/Plug-Ins/Components/Agent Synth.component"
shasum -a 256 "$HOME/Downloads/PM_MIDI_COMPOSER_V1.zip"
shasum -a 256 local-only/toolchains/agentsynth-0.588.1/AgentSynth-macOS-arm64-Plugins.zip
"$PY" studies/018-agent-synth-compositions/verify_engine.py
"$PY" studies/018-agent-synth-compositions/verify_engine.py --run engine-verification-02
"$PY" studies/018-agent-synth-compositions/test_linear_fm.py
"$PY" studies/018-agent-synth-compositions/compose.py
"$PY" studies/018-agent-synth-compositions/revise_midi.py
```

Supplied tool actual baseline run:

```sh
"$PY" local-only/toolchains/midi-composer-v1/PM_MIDI_COMPOSER_V1/music_variations.py \
 --input local-only/toolchains/midi-composer-v1/PM_MIDI_COMPOSER_V1/EXAMPLE_001/00_SOURCE_MOTIF.mid \
 --out local-only/agentsynth-test/midi-tool-baseline
```

For each ID `01_PRISM_RUN`, `02_HINGE`, `03_AIR_CURRENT`, the following actual
source commands ran once. They refuse existing output directories.

```sh
"$PY" studies/018-agent-synth-compositions/render.py ID
"$PY" studies/018-agent-synth-compositions/finalize.py ID
```

Actual Waveform command pattern for native original master and stems:

```sh
"/Applications/Waveform 14.app/Contents/MacOS/Waveform 14" render \
 "studies/018-agent-synth-compositions/outputs/ID/final/ID-EDITABLE.tracktionedit" \
 -o "studies/018-agent-synth-compositions/outputs/ID/final/WAVEFORM_NATIVE.wav" \
 --format wav --sample-rate 48000 --bit-depth 24 --channels stereo \
 --start 0 --end SECONDS --no-tails --json

# Same edit, exact range, separate aligned stems:
# replace -o path with final/native-stems, add:
# --separate-files --name-pattern '$track'
```

SECONDS was72/78/84 respectively. Native gate4.5s rendered from
outputs/waveform-gate/{AgentSynth-MIDI-test,calibrated,AgentSynth-GUI-saved}.tracktionedit.
GUI actions: scan two newly detected plugins; open test folder project; open MIDI
edit; File > Save edit as AgentSynth-GUI-saved; close; open saved edit. Saved file
has11924bytes and preserved notes/plugin, and was rerendered through CLI.

```sh
/opt/homebrew/bin/ffmpeg -hide_banner -i ACTUAL.wav \
 -filter_complex ebur128=peak=true -f null -
"$PY" studies/018-agent-synth-compositions/verify_delivery.py
"$PY" studies/018-agent-synth-compositions/package_review.py
"$PY" studies/018-agent-synth-compositions/playback_check.py
```

Exact matched-file native command arrays are saved in MATCHED_DELIVERY.json and
in Downloads/CRITICAL_FIELD_THREE_COMPOSITIONS_2026-11-09/DELIVERY.json. Playback
uses `/usr/bin/afplay -v 0.15 FILE` sequentially; it proves decoder/playback-command
execution only, not artist/acoustic monitoring or live MIDI performance.
