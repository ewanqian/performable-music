# CRITICAL FIELD — Director's Score, Version 0.1

## Artistic promise

**One body changes a large field of sound, light and space.** The audience should not need a lecture, a software explanation or a monitor full of UI to perceive cause and effect.

No permanently maximal visuals; impact comes from tension and contrast. No generic spectrum bars, generic cyberpunk look or plug-in preset parade.

## Four performance systems (not four finished tracks)

| Act | Working length | Musical identity | Performance action | Visual/spatial identity | Exit |
|---|---|---|---|---|---|
| I — INITIAL CONDITION | 0–3 min | original three-tone cell, rare sub impulses, intimate resonance | one gesture reveals source; foot reset | a single structure born from near-black | first large intentional silence |
| II — FIELD | 3–7 min | two temporal lattices, FM/metal percussion, low-frequency architecture | two hands control clock divergence/density | lattices drift and realign in shared scene coordinates | rigid rhythm ruptures |
| III — OVERRIDE | 7–12 min | subtract the pulse, hold tension, violent but bounded low-end + rhythmic return | foot launch / held control makes one big structural decision | field contracts/blackout → expansion with same event | drastic withdrawal |
| IV — AFTERIMAGE | 12–16 min | return of earlier cell transformed by processing, harmony and memory | performer lets go; machine echoes earlier choices | traces/refracted space, then darkness | an ending, not an infinite loop |

## Signature first scene: SUSPENSION -> OVERRIDE

The first “festival worthy” test is the **one cause, two consequences** scene:
1. At bar 17 (31.875s of demo), remove drum clutter; keep an unstable resonance and almost no sub.
2. Let performer hold the structural field. The audience sees that time is being suspended.
3. A deliberate *foot/button* event at the next musically safe boundary enters OVERRIDE (bar 24, 45.000s in fixed-score demo).
4. The exact same `event.id` and Show Score state drives SC synth/transient/low frequency AND WebGL/Jitter geometry/camera/scale AND any supported spatial panner.
5. Follow with a few **contrasting phrases**, not 23s of repeated identical pounding.
6. End with source material returning in a new form.

The offline reference uses fixed cue times. **Fixed time alone is not an interactive instrument.**

## Quality gates

### Musical
- Audio alone has an identifiable idea, phrasing and contrast.
- Dynamics and density serve a narrative, not merely loudness.
- Has one identifiable sound nobody would mistake for a stock soft-piano preset.
- A/B blind comparison with short, timestamped criticism.
- Reference track inspiration is documented without cloning melodies/code.

### Direction
- At least one clear bodily action produces a perceptible audiovisual spatial response.
- Both audio and visual respond to a SINGLE event/state payload.
- Large spatial elements are legible on stage from a distance.
- No overuse of strobes; any flashing requires production/venue safety review.

### Engineering
- Captured and rerun from saved source/configuration.
- Stereo fallback exists; multichannel requires real venue speaker map.
- Local physical manual KILL is independent of browser/AVP/network.
- Stale hand tracking has bounded neutral behavior, no runaway feedback.
- Operator can make this run twice with same major cues.

## Production logic

```
musical idea
    -> original sound materials
    -> one form with contrast and repetition that changes meaning
    -> one explicit set of performance choices
    -> typed Show Score + OSC
       -> SC audio
       -> WebGL / Jitter visuals
       -> spatial/audio output if available
    -> record/replay/correct/rehearse
```

## Stage operator protocol

- Player chooses section transitions; Agent supplies editable options but does not make unpredictable live decisions on the audio thread.
- Each act has one independent fallback stereo bounce.
- Foot provides scene advance and a physically independent KILL (requires separate hardware/audio path design, not just OSC mute).
- Venue speaker count, screen dimensions, brightness and playback system need confirmation in a technical rider.

## Status and anti-claims

Only Phase 01 demo audio, source code, conceptual director score and synthetic Show Score exist now. The 16-minute set is NOT rendered or rehearsed. No surround audio has been produced. Live AVP and venue are NOT tested.
