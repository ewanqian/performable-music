> **ARTIST DIRECTOR CORRECTION / 2026-11-06:** [Hybrid Authoring Architecture](visual-runtime-lab/HYBRID_AUTHORING_ARCHITECTURE.md) supersedes the idea that the runtime should automatically create visual content. The artist authors composition, original Blender/GN/film/photography assets, and camera cues; the engine is responsible for switching, compositing, event IDs and deterministic replay. [NINE v0.2 online](https://ewanqian.github.io/performable-music/visual-runtime-lab/) removes implicit scene zoom, starts still, and exposes independent built-in visual layers + temporary local media upload. It has **not** become an AVP/DAW/Blender glTF runtime yet.

> **NEW / 2026-11-06 · NARRATIVE RUNTIME:** [NINE / TRANSIT SIGNAL — source and setup](visual-runtime-lab/) · [Online demo (after Pages deployment)](https://ewanqian.github.io/performable-music/visual-runtime-lab/) · [Local Agent build brief](visual-runtime-lab/AGENT_RUNTIME_BUILD_BRIEF.md). Original dependency-free WebGL/Canvas2D visual world, four narrative states and event log/replay. **Not** integrated with audio, OSC or XR yet. Public Writing: [Music video narrative & creative coding](https://github.com/ewanqian/portfolio/blob/main/writings/performable-music/08-narrative-mv-and-live-runtime.md).

> **NEW XR LAB 02 (2026-11-05):** [HAND / SPACE / OSC](spatial-playground/hand-osc-lab/) — Quest passthrough WebXR hand skeleton (25 joints/hand), 14 geometric finger bend channels, editable 3D spatial zones, event hysteresis, JSON record, and WSS→OSC UDP bridge for Max/SuperCollider. [Open the HTTPS page](https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/) (deployment and headsets still require verification). See [setup + safety](spatial-playground/hand-osc-lab/README.md).\n\n> **NEW / 2026-11-05:** [CRITICAL FIELD XR Playground source](spatial-playground/) — an immersive WebXR four-act field viewer with a desktop fallback, WebXR select / optional hand pose input, and Show Score capture. [Expected GitHub Pages route](https://ewanqian.github.io/performable-music/spatial-playground/) (confirm Pages workflow succeeds). Real Vision Pro testing and OSC/Max integration are still pending.

> **CURRENT / 2026-11-04:** The Dec 3 show is now **CRITICAL FIELD / 临界场**. The local music Agent must read [START_HERE_FOR_LOCAL_CODEX.md](START_HERE_FOR_LOCAL_CODEX.md) and the [director's score](performances/2026-12-03-phase-01/DIRECTOR_SCORE.md) before generating more tracks. The previous soft-piano sketch is **not a passed show track**. A [reproducible original 78.75s sound + AV cue reference](performances/2026-12-03-phase-01/pressure-test-001/) is now in the repository **as source code**; WAV/stems can be generated locally. No final 16-minute show or real AVP integration has been completed.\n\n> **RESEARCH & DELEGATION / 2026-11-05:** [Haiku 5.5 Orchestrator Runbook](research/agent-music/HAIKU55_ORCHESTRATOR_RUNBOOK_2026-11-05.md) · [DeepSeek Pro multi-agent mission](research/agent-music/DEEPSEEK_PRO_MULTI_AGENT_MISSION_2026-11-05.md) · [16 distinct composition briefs](albums/critical-field-study-16/) · [Personal Writing series](https://github.com/ewanqian/portfolio/tree/main/writings/performable-music). The existing 8 Surge XT prototype directions in `studies/010-eight-directions` are for audit/revision; 16 compositions are specified, NOT all rendered or listened to. Preserve the Dec 3 live-set P0 lane.

# Performable Music

## Music Systems for Stage, Interaction and Live Performance

**可表演音乐 —— 面向舞台、实时交互与现场表演的音乐系统研究**

This repository is not primarily a music asset library. It is a long-term self-education, composition, performance and research system for music that can **wait, react, transform, be interrupted, be extended, be layered and be performed**.

## Online audition

Open [Strudel Preset Lab](https://ewanqian.github.io/performable-music/) to audition and edit the four current presets. Playback requires a user click and access to the external Strudel runtime / sample hosts.

Publishing: `.github/workflows/pages.yml` deploys the lab on changes to its source on `main`. The root redirects to `studies/005-strudel-preset-transitions/`; research notes and local show files are not packaged into the website.

## Core research question

> What kinds of music are structurally suited to live control, spatial input, state changes, audiovisual coupling and human–agent co-creation?

The goal is to develop a repeatable method for creating music that remains musically coherent on its own, while exposing a small number of meaningful parameters for live performance.

## Relationship to Stage Casting

- **Stage Casting** studies how performance systems are controlled and staged.
- **Performable Music** studies what kinds of musical structures are worth controlling and performing.

The two projects meet in live sets such as Stage Casting 04 / Spatial Performance Instrument.

## Repository map

```text
principles/              core theory: performability, states, tension, AV coupling
curriculum/              self-education syllabus and practice schedule
studies/                 numbered repeatable exercises / mechanisms
library/                 reusable original loops, stems, textures, transitions
instruments/             Ableton / Max / WebAudio / MIDI / OSC systems
albums/                  album-scale original works
performances/            performance-ready versions and show packages
research/
  album-lab/              12 mechanism research pool
  kashiwa-titan/          TITAN paper + track analysis
  lineages/               historical / aesthetic lineages
  taste-map/              public-safe reference cards for collaborators and influences
  agent-music/            human-agent music workflows
  data-pipeline/          metadata + computational analysis methods
knowledge/               durable, sanitized decisions and project memory
journal/                 dated public-safe research logs
references/              sources, acknowledgements, licenses
```

## Performance Metadata

Every reusable musical object should eventually describe more than `genre / bpm / key`.

```yaml
Energy: 1-5
Density: 1-5
Tension: 1-5

Loopable: true
Extendable: true
Interruptible: true
Layerable: true

Input:
  - Button
  - MIDI
  - Gesture
  - OSC

States:
  - Idle
  - Seed
  - Build
  - Hold
  - Peak
  - Release

VisualCoupling:
  - Event
  - Envelope
  - Structure
  - Position
  - SharedState
```

## Current Phase 01

**Deadline: 2026-12-03**

Target: one coherent **interactive / performable album-live-set** that can be performed without a separate musician and contains a clear large-scale narrative arc.

The working album arc is:

```text
I   SEED / ORIENTATION
II  EXPANSION / SYSTEM
III MUTATION / PEAK
IV  RELEASE / AFTERIMAGE
```

Each piece may also expose its own local states:

`Idle → Seed → Build → Hold → Peak → Release`

See `curriculum/PHASE_01_2026-12-03.md`.

## Research method

```text
listen / read / observe
        ↓
annotate and extract mechanisms
        ↓
build a small original study
        ↓
make it playable
        ↓
rehearse and record
        ↓
critique / reject / keep
        ↓
archive the method
```

The project learns from KASHIWA Daisuke, Daito Manabe, YMO, CAPSULE, collaborators and contemporary NIME / interactive-music research, but does not attempt to clone any artist.

## Public boundary

This is a public repository. Do not commit copyrighted reference audio, private correspondence, personal identifiers, credentials, confidential project files or unlicensed third-party source code.

Read `PUBLIC_RESEARCH_POLICY.md` and `AGENTS.md` before publishing or letting an agent edit the repository.
