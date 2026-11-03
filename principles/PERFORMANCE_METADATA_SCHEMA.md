# Performance Metadata Schema

This repository does not treat music as a fixed audio file only. Every reusable musical object should describe how it behaves in performance.

## Minimal YAML

```yaml
id: pm-example-001
title: Example
version: 0.1
bpm: 100
key: null

energy: 1-5
density: 1-5
tension: 1-5

loopable: true
extendable: true
interruptible: true
layerable: true

inputs:
  - Button
  - MIDI
  - Gesture
  - OSC

states:
  - Idle
  - Seed
  - Build
  - Hold
  - Peak
  - Release

visual_coupling:
  - Event
  - Envelope
  - Structure
  - Position
  - SharedState

safe_state:
  description: Return to neutral texture / stop dangerous feedback
  manual_kill: true

implementation:
  ableton: false
  max_msp: false
  webaudio: false

artifacts:
  preview: null
  live_set: null
  patch: null
  state_json: null

notes: ""
```

## Required interpretation

### Energy
Perceived activation / force of the section. Do not reduce it to volume.

### Density
How much simultaneous musical information is present: events, voices, layers, grains, notes.

### Tension
Instability / expectation / unresolved pressure. Can come from harmony, rhythm, timbre, repetition, register, noise, or silence.

### Loopable
Can the object repeat without obvious structural damage?

### Extendable
Can a performer remain in the state longer without the piece collapsing?

### Interruptible
Can the performer exit early and still create a coherent transition?

### Layerable
Can it coexist with another system or stem without losing identity?

## State rule

A state is not just a timestamp. It describes a musical condition.

Example:

```text
Seed
= one pulse + one tonal object + low density

Build
= more events + wider register + increasing harmonic/spectral pressure

Hold
= maintain identity indefinitely with bounded variation

Peak
= maximum structural activation, not necessarily maximum loudness

Release
= intentionally remove constraints/layers/tension
```

## Visual coupling rule

Prefer semantic shared state:

```text
performance input
   -> musical state
   -> shared value
   -> sound + image
```

Avoid treating FFT amplitude as the default audiovisual relationship.

## Versioning

Whenever a study becomes performance-ready, save:
- metadata YAML/JSON;
- preview render;
- implementation source;
- mapping diagram;
- SAFE/fallback behavior;
- one short reflection after rehearsal.
