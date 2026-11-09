# The Agent Patch: direct-reuse decision (2026-11-09)

## Important correction

The earlier `creative-control` proof was **only** a JSON/MIDI/Show Score control scaffold, **NOT a modular synth, DSP engine, remix of source audio, deployment of the original The Agent Patch, or a sound-quality pass**. Do not tell the user otherwise.

## What the author actually published

Official project: https://projects.daito.ws/the-agent-patch/en/  
**The Agent Patch (sonicLAB, Daito Manabe × Sinan Bokesoy, 2026)** describes an **offline/headless** demonstrator. Input: stereo WAV/stems/Ableton .als. Six roles (ANALYST, SOUND DESIGNER, ARRANGER, HYPE, CRITIC, SPATIAL) propose DSP gestures; 62 processors, SuperCollider-generated sounds, optional spatial speaker rings and synchronized audio/modular/agent/VJ projections are emitted from measured **60fps JSON**. Real-time use and hardware CV are *future plans*, not a documented currently downloadable live build.

**Availability audit:** No public whole-system repository, published 62-module source package, downloadable binary or local installation manual found on the official case study or searched Daito GitHub repositories (2026-11-09). This is an **absence of publicly verified access**, not proof no private distribution is possible. Do not invent a clone URL or claim that the original can already be installed. The official case study is a **research source, not a source-code license**.

Suggested factual attribution in project notes: **“An independent sound-research system informed by the publicly documented The Agent Patch (sonicLAB, Daito Manabe and Sinan Bokesoy, 2026). This is not the original software and does not use its unreleased DSP source.”** Cite the official URL and date. Seek direct permission/access from the authors for the original.

## Readily reusable, separate software (distinct from the original The Agent Patch)

| Project | Status / license | Actual role | Important limit |
| --- | --- | --- | --- |
| https://github.com/daitomanabe/midi_data_generator | **MIT**, C++ archived repo | Original phrase Repeat/Reverse/Pingpong *ideas*; source can be copied with notices | Not a 62-DSP modular instrument or DAW |
| https://github.com/daitomanabe/vjbake | **MIT**, Swift, macOS 13+ Apple Silicon | **Direct build and execute** offline real audio → JSON + 60fps data video | Audio feature extraction, NOT synthesis; BPM is manually supplied |
| https://github.com/daitomanabe/objectspat-js-qwen | Source public, **root LICENSE not found** | Study local Ollama/Qwen → validated JSON → 3D lighting control | Not a music engine; do not assume redistribution/copying rights |
| https://github.com/damagethundercat/PureData-MCP | **MIT**, Node20+/Pure Data | Agent creates and controls actual Pd DSP graphs; best first agent-audio test | Pure Data vanilla; current plugdata install is not automatically sufficient |
| https://github.com/Diabl0269/agentsynth | **MIT**, Mac Apple Silicon AU/VST3/standalone | Install actual modular synth engine, save graph, audition in DAW | AI integration is explicitly experimental |
| https://github.com/supercollider/supercollider | Public audio platform | Actual synthesis, effects and offline Score/NRT rendering | No automatic claim of good music |
| https://www.flucoma.org/download/ | Public Max/SC/Pd/CLI suite | Slice, describe, classify and resynthesize *owned* sound sources | Not an autonomous arranger |
| https://github.com/Artists-in-DSP/amorph-for-agents | Public docs of separate beta plugin | Cmajor DSP in host, agent via MCP, audio safety probes | Vendor beta, licensing/host compatibility to verify |
| https://github.com/shortwavlabs/agent-skills | Public patch creation skill, **root license not confirmed** | Consult syntax and architecture for producing native .pd patches | Documentation/skills, not audio renderer |

Do not copy any artwork, third-party reference recording, the Agent Patch's 62 DSP implementation or graphical rack. Retain original MIT notices when applicable. An MIT license for vjbake does **not** extend to the complete The Agent Patch.

## Priority: deploy real audio DSP, not another fake MIDI proof

1. **P0: One actual DSP runtime** — test Pure Data + PureData-MCP, or licensed existing plugdata with manually generated tested .pd patches. Save/reopen original graph and render actual audio.
2. **P0: Atmospheric source** — controlled resonance, granulation, spectral mutation and spatial pressure from original sound/stems. Non-dance free time is valid. One musical idea must evolve continuously and have a meaningful high-intensity transformation.
3. **P0: Bounded agents** — Codex owns orchestration; local Qwen suggests validated DSP graph/parameter changes, but not unrestricted shell/eval/real-time master gain. Save audio for human A/B. At first **2 or 3 roles** are plenty; role names do not establish system validity.
4. **P1: Real native sound render** — Waveform Save As / close / reopen, actual 48k/24-bit WAV and stems with gain and quality evidence. User listens to two real versions, can reject both.
5. **P1: Manabe's actual vjbake** — use approved original WAV; build from source, run `--selftest`, use documented DATA-SPEC and externally known BPM (no automatic beat tracking). For true FREE_TIME sound, treat BPM/beat lanes as artificial grid; use real time and raw measured features for synchronization.
6. **P2: LinkOSC / Show Score** — test corresponding real-time analysis only after actual audio. The authoritative performance timer is existing Show Score/DAW, not Qwen.

## Ground truth and actual Mac requirements

The public The Agent Patch describes offline deterministic rendering on its author's setup. There is **no basis to assert its entire internal 62-processor pipeline runs on this user's M1 Pro**. Pure Data/SuperCollider and Swift vjbake can be attempted on M1 Pro (32GB); plugin/CPU, acoustic quality and Waveform behavior require real tests. Do not turn the next planning or schema exercise into a claim of deployed musical hardware.

## Codex entry task

- Verify local environment and unpushed work. Do not reset, reinstall or overwrite DAW.
- Test a real local DSP host (Pd-MCP or a legal AU/VST3 modular synth) and record actual sounds. Do not generate another abstract control schema.
- Deliver original source patch, 60–90s 24bit WAV, parameter changes and evidence, with real musical pros/cons. vjbake only after a real recorded file.
- Report **DEPLOYED / TESTED / BLOCKED / NOT_TESTED** separately for each component. Never call this the original The Agent Patch.
