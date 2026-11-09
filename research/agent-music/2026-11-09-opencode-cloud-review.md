# OpenCode local implementation → ChatGPT evidence review

**As of:** 2026-11-09. This is a reusable handoff contract and work order, **not** proof that OpenCode has started or modified a computer.

## First read, before coding

1. Repository `AGENTS.md` and `START_HERE_FOR_LOCAL_CODEX.md`.
2. `research/music-production/2026-11-09-club-audition-gate.md`.
3. `research/visual-runtime/2026-11-09-metal-lighting-reuse.md`.
4. `protocols/linkosc-stage-adapter-2026-11-09.md`.
5. Existing `performances/2026-12-03-phase-01/DIRECTOR_SCORE.md` and `protocols/show-score-v1.schema.json` / `show-score.mjs`.

## Repository ownership

- [art-works](https://github.com/ewanqian/art-works): creative identities and lineages, not source-code ingestion.
- **performable-music**: sonic composition, stage clock, native GPU integration and December 3 show.
- [portfolio](https://github.com/ewanqian/portfolio): only reviewed/published work; no auto-promotion.
- Individual private works, ENTROPY archive and Drop Flow data stay with their own canonical sources.

## Parallelization boundary

Run research-only read tasks in parallel: `MUSIC inventory + listening plan`, `METAL/GLIC integration/licensing` and `LINKOSC adapter specification`. Each must return actual files read, tests, exclusions and a proposed next action.

**One code writer per worktree, one owner of the actual DAW session, one authoritative clock.** No simultaneous source writers to the same DAW/live render or forced merges. Never reset or discard the artist's unsaved work.

## Ordered tickets

- **T00 INVENTORY:** local git status; find actual A/B WAV, stems and source; plugin/DAW version; test whether downloaded `NEURAL_FIELD_METAL_POC` exists. Missing files are **MISSING/NOT TESTED**, not finished.
- **T01 MUSIC QUALITY P0:** listen to existing 16-bar A/B with user, collect blind verdict, improve one winning original rhythm, export aligned four-stem 60–90s audio and show why it is better. No new unrelated 16 songs.
- **T02 VISUAL P0:** compile local Metal POC on M1 Pro, log actual frame stats and capture a short video. Preserve 1080p fullscreen and a fallback.
- **T03 INTEROP:** enable LinkOSC `/beat` if needed; parse actual protocol, use stable Show Score state; one genuine note/FOOT event drives both sound and image. `/pattack` is merely analysis, not exact MIDI snare.
- **T04 LOOK DEVELOPMENT:** choose up to three light families and one of the neural contour/BVH echo/image fracture studies, render side-by-side candidates, then artist selects. Keep scene authorship and source provenance.
- **T05 SHOW HARDEN:** record replay, headless backup audio/video, fault injection, independent audio kill and stable real-show rehearsal.

Each ticket is blocked when its prerequisites are missing. Existing source/CI passes never substitute for real Mac audio, GPU, XR or venue evidence.

## Required review packet

`REVIEW_PACKET.md`:
- timestamp, task ID, repository/worktree, branch, commit SHA;
- changed source files, exactly what was executed and versions;
- actual WAV/video/screenshots (local files or explicitly permitted links), human audition result;
- frame median/p95/p99 if GPU tested; latency if tested; DO NOT guess;
- source provenance and rights status;
- discrepancies, rejected options, what does not work;
- one next bounded change; verdict `PASS / REVISE / BLOCKED`.

Do not paste confidential private sources or media into a public PR. OpenCode does local work; ChatGPT review only operates on files or commits actually shared in a subsequent conversation.
