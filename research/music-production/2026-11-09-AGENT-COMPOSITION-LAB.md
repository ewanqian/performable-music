# Agent Composition Laboratory — Evidence-to-Music Protocol (v1.0)

**As of:** 2026-11-09. **P0:** December 3 performance. **Music-only quality gates first.** These are operating rules, not completed 12/03 audio or a claim that local plugins have been installed.

## What the last failure teaches

The previous 24 short clips and their four-piece re-skin request were rejected for lack of an authored musical proposition, broken phrases, thin timbres and generic loop behaviour. The earlier review found shared automated silence on a fixed bar. We need **composition decisions backed by listening evidence**, not only a larger generative batch or more layers.

This document supplements `research/music-production/2026-11-09-DJ-AV-STRUCTURE.md` and `2026-11-09-48-compositional-mechanisms.json`. New research designs are **C01–C48**, distinct from rejected **M01–M24** audio drafts.

## An Agent game with skill modules, not rewards for output count

The unit of progress is **a tested, reusable skill** with sound evidence:

| Unlock | Capability | Required artifact / gate |
| --- | --- | --- |
| G1 / Pulse & Groove | Continuity, 2-bar question/answer, non-random timing/velocity | 16 bars solo drums+bass that a human actually finds compelling |
| G2 / Sound Identity | One recognisable source instrument with 3 controlled states | WAV dry+states, editable preset/patch, A/B without more arrangement layers |
| G3 / Form & Tension | Prepare, defer, answer, develop and close | 32-bar coherent excerpt, no unjustified full-stop hole |
| G4 / Performability | A performance action has a musical effect | MIDI/FOOT event changes next phrase, recorded fallback and replay |
| G5 / Spatial AV | One meaningfully connected sound-and-image gesture | **only after G1–G4**, original audiovisual score and real hardware testing |

Do not award points for 48 files, more VSTs, number of notes, loudness, CPU consumption, or genre tagging.

## Proof of work: seven necessary steps

1. **Reference research** (read-only parallel): one to two source-verified recordings/interviews per hypothesis. Note audible mechanism and original research transformation. Do not upload third-party audio.
2. **Material hypothesis** (one composer owner): derive one original small question (kick/bass interlock; three-note motif; constrained physical sound). Require one-line musical purpose and an *audible* identity.
3. **Groove cell** (DAW operator): 2–4 bars of rhythm core. Audition at matched level. Reject if it needs visual tricks or more layers to feel active. MIDI humanization only after testing raw groove.
4. **Instrument** (sound designer): design/record one source. Expose 3 timbre states; compare with same MIDI and same levels to isolate improvement.
5. **Form** (arranger): 16–32 bars, at least two full phrase cycles, development and return. No fixed global gap rule. Retain an audible pulse or clearly composed alternative in any breakdown.
6. **Print / quality** (release engineer): native DAW Save As + reopen + verified render to WAV and stems, no unreported limiter or clipping, precise MIDI align and controlled stereo.
7. **Blind music-only hearing** (artist/independent listener): hidden candidate IDs, equalized loudness, timestamped strengths/defects, explicit KEEP / REVISE / REJECT. Only approved sound may activate G4 and G5.

A/B should change exactly one meaningful property when testing *sound design*; for *musical form*, A/B may intentionally compare two fully distinct phrase logics. Label which experiment is being performed.

## Controller / state dependencies

```text
creative-question.json
       ↓
composition-card.json   [music-only idea, groove, source, explicit time form]
       ↓
MIDI + sound-preset + authorized sample manifest
       ↓
native DAW  ↔  controlled long-take recordings
       ↓
A/B WAV + aligned stems + sound-only notes
       ↓
human selection
       ↓
authoritative Show Score / time + performer hand/foot cues
       ↓
LinkOSC / vjbake (measurement lane) → visual/light adapter
```

The DAW is the **musical clock**; LinkOSC is a **live feature stream** and vjbake is an **offline analysis companion**. A beat onset does not reliably identify a kick vs snare; use real MIDI tracks for exact event identity. Never turn AI-generated simulated neural fields into claims of measured brain data.

## Automated diagnostics: allowed but limited

**Diagnostics with software evidence:** WAV exists and is playable; file duration; sample and true peak; clipped samples; integrated loudness; abrupt leading/trailing cuts; long zero-energy gaps; onset density/slope; spectral change; MIDI note overlaps and max polyphony; stage cue ID parity; save/reopen/export hash and playback.

**Cannot be established by software alone:** pleasing Groove, personal taste, emotional tension, artistic authorship, hook memorability, stage-level atmosphere. Audio embeddings and classifiers are only *triage* features and never an independent judging panel.

## Human-rated gate

| Dimension | Scale | Minimum for artist-selectable stage candidate |
| --- | --- | --- |
| Groove / bodily continuity | 1–5 | >= 4 for club-oriented lane |
| Sound identity | 1–5 | >= 4 |
| Phrase coherence / transitions | 1–5 | >= 4 |
| Motif, question / answer | 1–5 | >= 3 |
| Desire to play again, with eyes closed | 1–5 | >= 4 |
| Live control meaning | 1–5 | can be >=3 after music-only selection |
| Audio technical verification | PASS/FAIL/NOT TESTED | PASS before stage |

**Important:** a subjective score is given by the listener only. Model generated scores are merely reviewer hypotheses. If Groove, phrase coherence, sound identity or replay desire fails, no amount of impressive visual design may promote it.

## Diversity gate: use 48 hypotheses, render no more than four first

1. Run `validate-48-mechanisms.mjs` for JSON shape/IDs and audit text collisions.
2. Select up to 12 *mechanistically orthogonal* concept cards based on five fields: `groove_core`, `source_and_timbre`, `tension_development`, `phrase_story`, `performer_decision`.
3. Reject an idea with >=3 semantically duplicated axes if it has no audibly different reason to exist. Text similarity is an insufficient proxy.
4. **Initial four music-first proofs:** C02, C05, C17, C44 unless an actual local dependency is absent. This is a default engineering starting choice, not an artist endorsement.
5. Listen to all four once and allow all four to fail. Select **at most two** for real 60–90s refinement before the stage.
6. Preserve rejected ideas and why they failed. Retrying requires a hypothesis of *what changes*.

## Parallel execution: safe lanes

- **READ-ONLY research can run concurrently**: source verification, audio-file metadata/feature diagnostics, source/license audit, prior failures and diversity check.
- **Composer** owns musical phrase logic and master score; **sound designer** prepares candidate patch/stem in isolated folder.
- **One DAW writer**, one project master clock, one authorized change set per session. Never let four GUI agents modify Waveform concurrently.
- **Critical listener** hears export only, blinded, level matched. There is no way to simulate a trustworthy user listening preference with an Agent's own score.
- **Release engineer** verifies actual artifacts. Any unverified local test remains NOT_TESTED.
- **Visual stage** remains HOLD until sound-only admission.

## Estimate and gating (planning ranges, not guarantees)

| Work unit | Rough effort range / assumptions | Deliverable |
| --- | --- | --- |
| Literature/source card | 20–45 min each, source already accessible | citation + one original mechanism + exclusion |
| Existing-song analysis | 15–30 min listening plus local features per 3–5min track | timestamp map, audio-only interpretation |
| 2–4 bar credible groove | 1–3 focused hours with working local sounds | MIDI and low-end WAV; edit and audition |
| One 16–32 bar high-fidelity proof | 3–8 focused hours after instruments/DAW validated, not from scratch | DAW native session, A/B, stems and QA |
| 60–90sec strong musical passage | 1–3 days of focused listening/edit passes per selected candidate | real musical development, verified exports |
| M1 Pro show integration | separately measured hardware time, no global assurance | MIDI/OSC replay and venue fallback tests |

These are planning **ranges**, not claims the work has been completed or that aesthetic results are predictable in hours. Stop extra experimentation immediately if it endangers December 3 rehearsals.

## Minimal repeatable data

Machine-readable planning record: `2026-11-09-COMPOSITION-CONTRACT-EXAMPLE.json`. Every generated asset's source license, device version, energy/music section intent, and acceptance state must be explicit. The data contract is not an excuse to force algorithmically uniform composition.

## OpenCode immediate message

> Continue local T00/T01 only; use C02/C05/C17/C44 as four independent *musical hypotheses*. Inspect actual Waveform licenses and project, use mature local sources, export real music. Do not generate 48 WAV files or add another generic break rule. Return four neutral audio-only proof packages with one source list, editable project, human-audition-needed state and meaningful change logs. I will accept or reject by ear.

