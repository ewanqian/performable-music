# Principle 01 — Performability

A piece is not “performable” merely because it can be launched in Ableton or mapped to a controller.

## Definition

A performable musical system has three layers:

1. **musical identity** — the piece still sounds intentional if the performer briefly does nothing;
2. **meaningful intervention** — a small number of controls can change timing, density, timbre, space or formal state in musically legible ways;
3. **recoverability** — the system has neutral states, bounded ranges and safe recovery when input disappears or the performer stops.

## Minimum test

A study passes when it can answer yes to all of these:

- Can it run for 60 seconds without continuous intervention and still sound composed?
- Can one gesture produce a change that is musically meaningful rather than merely louder/brighter?
- Can the performer return it to a neutral state?
- Can it be extended or shortened without breaking the form?
- Can the same semantic state be shared with visuals/lighting without resorting to generic FFT reactivity?
- Can a failure or dropout be recovered without restarting the entire piece?

## Preferred control hierarchy

```text
Discrete events
  section / capture / reset / transition

Continuous semantic controls
  energy / density / tension / space / brightness / motion

Raw sensors
  hand joints / EMG / MIDI / OSC / CV / button
```

Raw sensors should normally be interpreted before they touch musical parameters.

## Performance object metadata

Every study, loop, stem, instrument or track should progressively gain:

- Energy 1–5
- Density 1–5
- Tension 1–5
- Loopable
- Extendable
- Interruptible
- Layerable
- Accepted inputs
- Available states
- Visual coupling mode
- Neutral state
- Failure / safe state

## Composition principle

Do not create interactivity after finishing a fixed track.

Whenever possible, compose with the question:

> Which parts are fixed because they define identity, and which parts are variable because a performer can shape them without destroying identity?
