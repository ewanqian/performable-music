# AGENTS.md

## Purpose

This repository is a long-term **performable-music research and creation system**. Agents should help turn listening and research into original, playable musical systems — not imitate reference works.

## Required workflow

1. Read `README.md` and `PUBLIC_RESEARCH_POLICY.md`.
2. Check `knowledge/` for current decisions.
3. For artist research, distinguish:
   - **documented fact** — directly supported by a source;
   - **analytical inference** — our interpretation;
   - **practice experiment** — an original reconstruction or test.
4. Never commit copyrighted reference audio or private correspondence.
5. Before copying third-party code, verify its license and preserve attribution.
6. Prefer derived data: timestamps, feature CSV/JSON, annotations, diagrams, original MIDI, original synthesis patches.
7. When creating music from a reference, extract a mechanism first, then rebuild it with original musical material.

## Music architecture

Preferred separation:

```text
Corpus / references
  -> analysis / annotations
  -> mechanism hypothesis
  -> structured plan (JSON/MIDI/score)
  -> Ableton / Max / WebAudio implementation
  -> performer controls
  -> audio + visual / spatial outputs
  -> evidence + reflection
```

Agents may generate structure, variants, annotations and code. They should not be trusted with unsafe real-time feedback, master gain, or destructive edits without an explicit bounded control layer.

## Current research priorities

1. KASHIWA Daisuke — `TITAN`: piano/electronics/bass/emergent form.
2. KASHIWA lineage: post-rock, glitch/electronica, programmatic form, jazz, noise and long-form arrangement.
3. Daito Manabe lineage: DJ/hip-hop/jazz -> Xenakis/mathematical generation -> IDM/juke/club physicality -> computation/body/data/AV systems.
4. Agent-assisted composition: Codex + Ableton + Max/MSP/Jitter + Web Audio.
5. Twelve playable mechanisms -> six prototypes -> three or four strong live works.

## Local Codex rule

When this repository is opened locally, do not start with broad research. Pick one testable task, create evidence, and update the relevant research note or issue.
