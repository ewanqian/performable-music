# Performable Music

## Music Systems for Stage, Interaction and Live Performance

**可表演音乐 —— 面向舞台、实时交互与现场表演的音乐系统研究**

This repository is not primarily a music asset library. It is a long-term self-education, composition, performance and research system for music that can **wait, react, transform, be interrupted, be extended, be layered and be performed**.

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
