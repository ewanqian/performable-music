# Expert Production Protocol — Composer × Sound Designer × Max/MSP × Critic

**Date:** 2026-11-04  
**Project:** Performable Music  
**Status:** documented protocol, NOT evidence of a finished song or a tested Max patch.

## What is being corrected

A coding agent can create tracks, 2,000 MIDI notes, 96 bars, markers, and device automation without producing a distinctive composition. Those counts measure editor activity, not musical quality.

From the user-supplied local Ableton screenshots of the working *Afterimage* sketch, the visible concerns are:
- many drum events on a repetitive fixed grid;
- named sections whose musical functions may not differ strongly;
- familiar instrument roles (piano, glass echo, pad, sub, basic drums);
- no actual audio file supplied for critical listening;
- the app warned that saving/exporting was disabled pending authorization.

The screenshots alone do **not** prove that the song is bad, that the patch is unstable, or that the final mix is deficient. Treat them as **hypotheses for the next listening test**, not final judgments. Do not publish screenshots or private runtime diagnostics in this public repository.

## The expert team is a sequence of gates, not a swarm

### 1. Composer / musical editor
Input: one 16–32 bar excerpt, original piano MIDI, optional licensed reference notes.
Output: contour graph, motif variants, counter-phrase, harmonic motion, intentional silence, 2 arrangements (A/B).
Hard question: Is there anything to remember, and is the transformation necessary?

### 2. Sound designer
Input: chosen musical material, aesthetic hypothesis.
Output: one **signature sound** (not a long preset list) with 3 named states, dry/wet audio print and parameter table.
Hard question: Could a listener identify this sound as belonging to the piece?

### 3. Max/MSP instrument designer
Input: bounded musical behavior specification, reference audio/midi generated in this repository.
Output: one focused Max for Live or Max patch, documentation, manual controls, saved state/presets, replay tests and safe fallback.
Core mechanisms: buffer~/play~ or groove~, poly~ or mc~ voice allocation, optional gen~, state machine, smoothing, transient detection, OSC or Live parameter interface.
Hard question: Does performer input make a better **musical decision**, or does it only wiggle parameters?

### 4. Mixer / sound engineer
Input: audible stems and stereo mix.
Output: level/headroom/routing checks, masking list, dynamics and depth comparison, dry vs processed exports, A/B print.
Must listen. Peak/RMS analyses are diagnostics, not musical quality scores.

### 5. Independent musical critic
Input: anonymous, level-matched A/B audio with no visuals and no technical description.
Output: 3 strengths, 3 audible defects with timestamps, one cut recommendation, and a clear PASS / REVISE / REJECT.
Never praise a track solely for agent complexity.

### 6. Verification / release engineer
Input: latest local Live and Max build.
Output: actual version numbers, save/export validation, project collect-all-and-save, device availability, replay and dropout tests, a concrete evidence path.
Never claim installation, sound quality, mix verification or license status without testing the real machine.

## Musical quality gate (human-rated 1–5 each)

- **Memorable musical material** (20%): identifiable original motif / tension question.
- **Large-scale form** (20%): sections have meaningful contrast, development and resolution.
- **Sound identity** (20%): timbral language cannot be reduced to generic presets.
- **Critical listening appeal** (20%): desire to hear again without watching the visual.
- **Performance value** (10%): live controls create choices that matter.
- **Engineering reliability** (10%): save/export, predictable CPU, fallback and clean routing.

Gate logic:
- If any of the first 4 dimensions is under 3/5, **REVISE** before new feature work.
- Score of 4+ on the musical first four AND real human blind listening is required before calling it a **show candidate**.
- Passing static JavaScript/Max patch JSON checks is NOT equivalent to audible/real-device acceptance.
- Never use Agent's self-score as the only score.

## Expert sound-making workflow: one sonic signature

Choose one source: a short ORIGINAL piano phrase (MIDI or personal recording).

Build 3 timbral identities:
1. **SOURCE** — original piano, intimate and identifiable.
2. **SHADOW** — spectral/granular derived material, recognizably related but psychologically distant.
3. **AFTERIMAGE** — delayed event memory; earlier note fragments return later with different spatial/spectral treatment.

Do not add 12 plugins at this point. A distinctive modulation mechanism, register, silence, and source treatment matter more.

The Max patch should expose **four semantic controls**, not dozens of raw parameters:
- memory: how long the event trace survives,
- pressure: spectral/saturation tension (bounded),
- distance: depth/stereo/decay behavior,
- fracture: chance of an audible edit/fragment, not uncontrolled random noise.

Use the same control values for visual coupling, with a different rendering function.

## Primary tools — install in this order

### First: included in Ableton Live 12 Suite, no paid third-party VST needed
- **Operator**: build custom FM percussion, metallic partials, sub elements.
- **Granulator III** (downloadable included Pack): transform user-owned recorded or rendered material.
- **Spectral Resonator**: tuned, playable spectral afterimage of piano.
- **Spectral Time**: freeze/echo and temporal memory.
- **Roar**: carefully bounded harmonic/saturation coloration.
- **Corpus / Hybrid Reverb / Echo / Utility**: object resonance, depth, delay, phase/level checking.
- **Max for Live**: routing, macro states, performer controls, one distinctive patch.

### Second: free/academic Max extensions
- **FluCoMa**: segmentation, descriptors, timbral corpus and data-driven instrument.
- **Data Knot**: optional performance-oriented ML after the basic corpus example works.
- **CataRT-MuBu**: advanced corpus-based concatenative resynthesis (more setup).
- **bach**: optional algorithmic score/notation experiments, not required for this piece.

Install one at a time. Record version/compatibility. Prefer Max Package Manager for listed packages.

### Third: optional paid plugins, ONLY after blind listening identifies a specific deficiency
Examples: specialized piano libraries or precision mixing processors. A new piano VST is not a substitute for original voicing, MIDI articulation or arrangement.

## Agent architecture

```text
User brief + one original motif + short A/B audio
                 |
                 v
        Composer / Critic gate
             A / B plans
                 |
          human selection
                 |
          source of truth
   music-plan.json + preset.json
                 |
       +---------+-----------+
       |                     |
 Ableton agent            Max DSP agent
 edit MIDI/arrangement    one focused patch
       |                     |
       +---------+-----------+
                 |
       dry/wet stem exports
                 |
            blind A/B
                 |
         human approve/reject
                 |
           show snapshot
```

**Important:** MCP edit tools can apply structural changes but cannot by themselves guarantee successful export or a qualified master. A tool that reports a parameter edit has not listened to the musical result.

## Source reading

- Robert Henke on small Max patches and music before tools: https://cycling74.com/articles/an-interview-with-robert-henke
- Monolake sound-design and modeling mistakes as sonic identity: https://www.ableton.com/en/blog/robert-henke-ghost/
- Dennis DeSantis, *Making Music*: https://makingmusic.ableton.com/about
- Ableton Live 12 audio effects manual: https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/
- Granulator III: https://www.ableton.com/en/packs/granulator-iii/
- Max FluCoMa package: https://cycling74.com/packages/fluidcorpusmanipulation
- Max package catalog: https://cycling74.com/products/packages
- Independent Ableton MCP: https://github.com/wstierhout/ableton-live-mcp

## Before doing more work

Finish *Afterimage*'s first **16-bar quality test** and save A/B listening evidence. Do not build extra tracks or preset packs until the musical editor accepts one.
