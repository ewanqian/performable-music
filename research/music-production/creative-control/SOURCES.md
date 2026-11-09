# Source and method boundaries — 2026-11-09

This is an original implementation using architecture patterns; no Manabe source code or audio is copied.

| Reference | Verified method | Adaptation | Limit |
| --- | --- | --- | --- |
| [MIDI Data Generator](https://github.com/daitomanabe/midi_data_generator) | C++ phrase Linear/Repeat/Pingpong/Reverse and symbolic MIDI; MIT | Original tiny MIDI sketch exporter | MIDI is not sound production |
| [vjbake](https://github.com/daitomanabe/vjbake) / [DATA-SPEC](https://github.com/daitomanabe/vjbake/blob/main/DATA-SPEC.md) | 60fps JSON + ProRes data video, LinkOSC-compatible calibration; MIT | Metadata guard and future offline analysis | BPM supplied, not beat-tracked |
| [ObjectSpat JS Qwen](https://github.com/daitomanabe/objectspat-js-qwen) | Local Qwen/Ollama, JSON validation, offline gold dataset | Model proposes data; independent validator rejects unsafe/invalid fields | Lighting project, not music generator |
| [Beyond Generation](https://projects.daito.ws/beyond-generation/) | Separates problem, search and evaluation | Separate contract parts and disagreement preservation | Artistic argument, not execution code |
| [The Agent Patch](https://projects.daito.ws/the-agent-patch/en/) | Multi-agent offline remix, 62 DSP processors, measured 60fps event truth | Deterministic offline cue ledger and MIDI event idea skeleton | Our scaffold does not recreate DSP or agent discussions |
| [AI Production and Human Experience](https://projects.daito.ws/ai-production-and-human-experience/) | Headless operation, primary source archive, local licenses and specialized machines | CLI first, explicit Mac inventory | Local plugin license status is unknown |
| [Show Score v2](../../../protocols/show-score.mjs) | Existing shared transport and event serialization | Import existing module rather than invent another clock | FREE_TIME reference BPM is only timing notation |

## Guardrails
- Ambient FREE_TIME works without forcing a kick. MIDI output is an optional sketch, not a master performance recording.
- Output is design-only until real DAW save/reopen, WAV, stems and human hearing pass.
- VJBake and LinkOSC analysis do not infer actual MIDI instrument identity or physiological/EEG state.
- No direct model-to-DMX, model-to-audio-thread, unrestricted scripts, eval or unsafe master gain.
- License terms apply before incorporating any actual source code, plugins or third-party audio.
