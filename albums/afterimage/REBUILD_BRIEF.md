# Afterimage — 16-Bar Rebuild Brief

**Working hypothesis:** 108 BPM, D minor, original piano-led electronic / performable composition.  
**Current status:** local Agent reports an eight-track, 96-bar arrangement. **No exported audio has been reviewed in this repository**; no finished Live Set is committed. Do not claim audition or live QA.

## First local-machine prerequisite

The screenshot showed an Ableton Live authorization warning saying Save and Export were disabled. Before destructive edits:
1. confirm an authorized Live installation using Ableton's official authorization flow;
2. validate Save As on a disposable/new project;
3. preserve the existing session as an immutable baseline (where saving is permitted);
4. do not close a potentially unsaved session assuming the Agent saved it.

Do not bypass licensing. If authorization cannot be resolved today, limit the session to non-destructive analysis and maintain an external original MIDI/parameter log, without promising it will restore the full Live Set.

## Objective

The goal is **NOT** to finish 96 bars with more MIDI notes.

Make the best possible 16 bars. Compare to the existing 16-bar excerpt without visuals, matching playback loudness. Then decide whether the musical idea deserves a 3–5 minute form.

## What to preserve

- Piano as the identifiable narrative source.
- D-minor tonal center as a working constraint, not a reason to avoid harmonic color.
- Concept of an afterimage: earlier material returns transformed.
- Clear progression from intimacy to scale.

## What to challenge

- Does the piano contain a memorable 3–6 note motif?
- Are piano velocities and note lengths shaped into phrases, not uniform ticks?
- Is there an answer or reinterpretation of the motif after eight bars?
- Can a section change without adding more drum hits?
- Does the beat *comment* on the piano, or just keep time?
- Does a return of the source material produce new emotional meaning?

## Revision sequence

### P0 — Melody/harmony before DSP
1. Mute rhythm, pad and FX; listen only to piano.
2. Select a 2-bar motif, or write one new original 2-bar motif.
3. Build **A**: statement (bars 1–4).
4. Build **A'**: contour or register mutation (bars 5–8).
5. Build **B**: answer / surprise or harmonic destabilization (bars 9–12).
6. Build **A''**: return of the original idea in changed harmonic context (bars 13–16).
7. Remove unnecessary notes. Export dry piano A/B if possible.

### P1 — Design one sound with a reason to exist
Take a clean original piano bounce and build:
- natural piano (dry, intimacy);
- processed echo/shadow via Spectral Resonator or Granulator III;
- decaying afterimage / time-memory via Max or Spectral Time.

Select ONE signature effect chain; commit settings with preset JSON or screenshot / description.

### P2 — Make percussion less generic
- Identify one rhythmic signature (not endless 8th-note hats).
- Add fills as structural **sentences**, not every bar.
- Drop out drums for a meaningful interval.
- A kick should enter/change because the harmony/form needs a new kind of pressure.
- Introduce displacement/swing only when it reinforces the idea; humanization alone does not create composition.

### P3 — Develop actual contrast
Compare two musical futures:
- **A / intimate:** dry piano and sparse resonant memory, low sound pressure.
- **B / unstable:** fragmented motif, altered register, spectral pressure and interrupted drum grid.

The second version may have fewer notes yet higher tension.

### P4 — Performance interface after musical approval
Map four semantic controls to a Max for Live device:
- MEMORY / PRESSURE / DISTANCE / FRACTURE.
Use preset snapshots and smoothing. Pinch/foot can trigger state transitions. Neutral state must sound good; stale input must not leave runaway feedback.

## Deliverables

```text
albums/afterimage/
  REBUILD_BRIEF.md
  reviews/
    2026-11-04-A-vs-B.md      # create on actual listening
  arrangement/
    motif-map.csv             # create with original notes
  presets/
    afterimage-engine.json    # create after testing actual DSP
  manifests/
    local-session.json        # device/software versions, no secrets
```

Never create dummy WAV/ALS files and pass them off as final results.

## First two listening tests

- **Test 1: dry piano only**. Which version makes you curious about what happens after bar 8?
- **Test 2: piano + one processed layer**, loudness matched. Does the process make the piano more expressive or merely more ambient?

If neither passes, do not add Granulator, Max or new tracks: rewrite the music.

## Suggested local Codex task

> Read AGENTS.md, research/agent-music/EXPERT_PRODUCTION_PROTOCOL.md and this brief. Audit my currently open Ableton Live set READ-ONLY. First check Live authorization and save capability; make no destructive changes. Write down the actual instrument/effect devices and examine the first 16 bars' piano motif, harmony, register and rhythm. Propose two *meaningfully different* musical revisions that do not rely on adding tracks or reverb. After I select one, implement it in a separately versioned set and make A/B audio available for listening. Only then design one small Max for Live Afterimage Engine using my own piano as source. Do not claim anything has been heard or saved until it was tested and verified.

## Exit gate

PASS requires: a versioned local project, an A/B audio comparison the human has actually heard, a documented motif/arrangement change and a reason to develop the material further.

NO PASS for a large MIDI count or automated “mix completed” message alone.
