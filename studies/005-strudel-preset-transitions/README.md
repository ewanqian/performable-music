# E05 — Strudel Preset Transition Lab

## Purpose

Use Strudel as a **fast audition layer** for Performable Music. The goal is not to finish the live set in Strudel; the goal is to hear composition mechanisms quickly, compare presets, and decide what deserves migration into Ableton / Max.

Strudel is well suited to this because it can run directly in the browser with WebAudio, supports live pattern replacement, synths/samples/effects, and `arrange()` for multi-cycle scene changes.

## Workflow

```text
mechanism hypothesis
    ↓
4 Strudel presets
    ↓
audition / mutate / transition
    ↓
keep 1–2
    ↓
rebuild in Ableton / Max
    ↓
make it performable
```

## Current preset families

1. **Piano Glass** — sparse piano/electronic state transitions.
2. **Machine Pulse** — precise drum/synth mechanism and density changes.
3. **Polyphase Field** — two rhythmic systems drifting against each other.
4. **Luminous Release** — bright harmonic/arp structure for release/finale language.

Each preset contains six local states:

`Idle → Seed → Build → Hold → Peak → Release`

The included `index.html` embeds four editable Strudel REPLs. Press Play in any panel, edit code, and re-evaluate it live.

## What to compare

Do not judge by “production quality”. Score each preset on:

- Want to hear again
- Musical identity
- State transitions feel meaningful
- Can one or two controls make it playable?
- Could the same state drive visuals?
- Is the mechanism worth rebuilding in Ableton/Max?

## Transition experiment

The first pass uses deterministic `arrange()` blocks. After a direction survives, replace fixed timing with performance input:

```text
button / foot / hand event
    ↓
state transition
    ↓
Seed / Build / Hold / Peak / Release
```

This means Strudel is the **composition sketch**, while the eventual show engine can still be Max/Ableton.

## References

- Strudel Getting Started: https://strudel.cc/learn/getting-started/
- Pattern factories / `arrange()`: https://strudel.cc/learn/factories/
- Time modifiers: https://strudel.cc/learn/time-modifiers/
- Effects: https://strudel.cc/learn/effects/
- Embedding Strudel: https://strudel.cc/technical-manual/project-start/
