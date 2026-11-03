# START HERE FOR LOCAL CODEX — Performable Music / Critical Field

**Last decision:** 2026-11-04  
**Phase 01 public deadline:** 2026-12-03 (not automatically 12/04)  
**Priority:** P0 — AUDIO QUALITY + ONE AUDIO/VISUAL CLOSED LOOP  
**Current status:** research/code and a stereo procedural demo exist; full show/audio quality/hardware tests have NOT passed.

## Read these in order — before making another note

1. `START_HERE_FOR_LOCAL_CODEX.md` (this file).
2. `performances/2026-12-03-phase-01/CRITICAL_FIELD_DIRECTION.md`
3. `performances/2026-12-03-phase-01/DIRECTOR_SCORE.md`
4. `protocols/show-score-v1.schema.json`
5. `performances/2026-12-03-phase-01/pressure-test-001/README.md`
6. `research/music-reviews/Listening_Y_critical_review.md`
7. `research/agent-music/EXPERT_PRODUCTION_PROTOCOL.md`
8. `albums/afterimage/REBUILD_BRIEF.md`
9. GitHub Issue #6.

## Immediate course correction

**STOP** extending the generic 108 BPM D-minor piano/electronic sketch.
A 38.61-second 48 kHz stereo WAV from local SuperCollider (named Listening_Y) was supplied privately in a ChatGPT conversation. Actual listening found: a pleasant repeating soft electronic keyboard motif, minor lower-register variation, little development, narrow timbral contrast, no obvious impact event, and no legible live control. It's a valid early sketch, NOT a successful stage track.

Do not upload that private WAV to public GitHub. The listening review is a sanitized note.

The user wants **a no-explanation-impact performance**: strong low end and spatial scale; audibly original synthesis; choreography between music, live performer, visual field and space; sophisticated sound design and structural contrast. Influences include KASHIWA Daisuke's long-form piano/electronics, Daito Manabe's algorithmic/bodily/agent systems, plus scene direction from Amon Tobin / Ryoji Ikeda / Robert Henke. These are conceptual sources, NOT templates to clone.

## The stage concept

**CRITICAL FIELD / 临界场** — one performer plays an evolving audio/visual field that begins as a controlled instrument, becomes unstable, then must be overridden by deliberate bodily action.

Target **16 minutes across four playable systems**, but this is a **show architecture**, not a statement that four songs are done:

I. INITIAL CONDITION (0–3m): minimal original sonic identity; the field first appears.
II. FIELD (3–7m): polyrhythmic geometry and spatial movement; increasing scale.
III. OVERRIDE (7–12m): withdrawal / strong tension / a precisely earned release event.
IV. AFTERIMAGE (12–16m): return of the source motif with altered emotional/sonic context.

Target can be shortened to 12 minutes if quality or reliability cannot pass.

## Immediate production target (DO NOW, not 16 minutes)

One **60–90 second signature scene** at 128 BPM:
- use the reference `pressure-test-001/render.py` to generate four original aligned WAV stems and its `show-cues.csv` and scripted `show-score-reference.json`;
- establish 31.875–45.000s **SUSPENSION** into 45.000s **OVERRIDE** as a truly impressive transition;
- do one **A/B revision** of composition/sound design rather than simply more layers/louder master;
- make 1 foot/button event drive both a clearly distinct sound transformation and a directly related visual spatial transformation;
- use one shared structured state/event envelope (see `protocols/show-score-v1.schema.json`).
- produce 60s+ of capture **with evidence** in the local runtime; replay offline with headset disconnected.
- explicit SAFE/manual independent KILL; no uncontrolled feedback.

**No new preset packs, no extra 12 songs, no untested plugin installation, no clone of a named artist, no buying software or plugins.**

## SuperCollider: YES, but use it as a professional DSP engine

SC is capable of multichannel synthesis, OSC server control, buffer/spectral/feedback DSP, generative sequencing, and NRT WAV rendering. It is not a composition critic or a visual director.

Use it for:
- original custom audio voices and their source code;
- long-form composition structure / set of strong variations;
- stems for a live scene;
- replayable OSC-controlled performance parameters;
- optional multichannel panning after the venue speaker map is confirmed.

Avoid creating music that consists solely of bland sine/triangle notes and algorithmically repeated 4-bar patterns. Add complexity only when it creates an audible identity or meaning.

Mac local environment is NOT accessible from this GitHub repository or this browser chat. Codex must inspect actual SC/DAW/Max installs rather than claim integration.

## Agent team — one controlled chain

- **Music director/critic**: audits actual sound without visuals. Rejects weak motifs and generic dynamics.
- **Composer**: distinct motif, gesture, harmonic form, intentional silence.
- **Sound designer/SC**: unique timbral system; no paid plugins.
- **Stage director/visual**: makes spatial transformation perceptible and tied to music events.
- **Systems/QA**: clock alignment, real OSC receipts, recoverability, capture, emergency behavior.

Agents work sequentially and supply evidence; they do NOT vote on music quality instead of the user.

## Required report from local Codex after next run

```
STATUS: NOT RUN / BLOCKED / REAL RUN
SC VERSION + AUDIO CONFIG:
EXACT FILES MODIFIED:
AUDIO A PATH:
AUDIO B PATH:
WHAT IS DIFFERENT MUSICAL/SONICALLY:
SCORE EVENT SAME FOR SOUND AND VISUAL (yes/no + evidence):
DISCONNECT + MANUAL KILL RESULTS:
WHAT I HEARD (if actual audible playback was inspected):
USER DECISION NEEDED:
NEXT ONE TASK:
```

## Public GitHub rule

Repo is public. Put original code, ideas, synthetic reference scores, sanitized findings and attribution here. Keep copyrighted reference recordings, private conversations, private recordings, licensed sample packs, secrets and unapproved collaborator materials offline. No false “finished” badges.

## Commands

```bash
git clone https://github.com/ewanqian/performable-music.git
cd performable-music
python3 -m pip install numpy scipy soundfile
cd performances/2026-12-03-phase-01/pressure-test-001
python3 render.py
```

This recreates original WAV guide/stems and programmatic Show Score **from source** without a downloadable ChatGPT ZIP. This is a reproducible reference sketch, not proof of a finished song. Check version requirements and use a Python venv locally.

### Stop condition

Do not start Act II until the 60–90s audition and sound/visual event test is demonstrably better than the original soft piano sketch and has an actual saved, replayable, recoverable runtime.
