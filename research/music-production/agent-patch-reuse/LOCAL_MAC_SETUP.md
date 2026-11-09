# Local M1 Pro quickstart for real audio DSP (not the original The Agent Patch)

**These commands are instructions for the local Codex operator, not verified executions on the user's Mac.** Review dependencies before running; do not install on the production system without isolating files and testing the audio device.

## 1. Directly build an ACTUAL published Manabe tool: vjbake

```bash
mkdir -p ~/Music/PM_External
cd ~/Music/PM_External
git clone https://github.com/daitomanabe/vjbake.git
cd vjbake
swift build -c release
.build/release/vjbake --version
.build/release/vjbake --selftest
```

On an **approved**, actual **metered** WAV with known BPM:
```bash
.build/release/vjbake "/absolute/path/to/approved-original.wav" --bpm 100
```

The official tool requires macOS 13+ and Apple Silicon; Swift Command Line Tools suffice. This bakes JSON and a 1024×64 ProRes data video at 60 fps. It does **NOT** compose or process new music. In free-time ambient music its artificial beat grid should not be used as measured tempo. See upstream DATA-SPEC.md and check input/output against actual audio.

## 2. Immediate genuine modular-synthesis alternatives

**A — Lowest friction Agent-operable DSP:** install [Pure Data vanilla](https://puredata.info/downloads/pure-data) and use [PureData-MCP](https://github.com/damagethundercat/PureData-MCP), MIT, Node 20+. After reviewing npm package/version, start the server:
```bash
npx -y @damagethundercat/puredata-mcp
```
Configure in local **Codex MCP** if supported. Use status/probe tools first. Pd vanilla and plugdata are related but not identical for MCP process discovery. Use a disposable patch with low gain; test actual Pd audio recording; no direct master outputs from an uncontrolled agent.

**B — Ready standalone and AU/VST3 modular synth:** [Agent Synth Releases](https://github.com/Diabl0269/agentsynth/releases), MIT, prebuilt Apple Silicon. Test standalone first, then one isolated Waveform host project. Built-in AI is experimental, so do not call it reliable autonomous patching.

**C — Stronger atmospheric processing, off-line:** [SuperCollider NRT Score](https://docs.supercollider.online/Guides/Non-Realtime-Synthesis.html). Use actual saved SynthDefs and effects with `recordNRT` to make music. Then inspect and edit the actual bounced sound. For sample resynthesis/corpus build consider [FluCoMa](https://www.flucoma.org/download/).

**D — Optional direct DAW Agent DSP:** [amorph for agents](https://github.com/Artists-in-DSP/amorph-for-agents), separate beta plugin, supports native Cmajor DSP and audio QA through MCP. Confirm vendor terms, beta version, Mac AU/VST3 and **actual Waveform** compatibility before production.

## 3. Things to clone only as **references**

```bash
git clone https://github.com/daitomanabe/midi_data_generator.git
git clone https://github.com/daitomanabe/objectspat-js-qwen.git
```

The former is archived C++ symbolic music examples, not an audio synthesizer. The latter is a Qwen-driven **lighting** tool; root LICENSE wasn't found in audit. Running a public reference app locally is different from obtaining permission to copy and redistribute its code. Do not start its OSC/DMX lighting outputs on show hardware.

## 4. Pass/fail of first usable test

- User-owned source sound and provenance.
- Real DSP graph or plugin patch that actually makes/changes sound.
- Exactly two independent 60–90 second transformed versions, with an intentional long musical line and one earned intense event.
- Saved/reopened DAW or stand-alone patch with repeatable 48k/24-bit output.
- Gain/headroom, silence/cuts and stem alignment checked.
- Actual user or independent human audition, with timestamped critique.
- vjbake from that real audio **only afterwards**, without invented EEG, tempo or exact drum identity.

Do not report P0 complete from JSON validation or MIDI bytes alone.
