# Visual Atlas A02 — STATE / SPACE / TIME

A02 extends A01 without replacing the R00 reference, changing the engine research queue, or claiming 48 works are complete. [Open/download single HTML](index.html) · [Test evidence](evidence.json).

Four mechanisms, three compositions each:
- 02-01 Distance Script: RIB / SEAM / MARK. Arc-length sampled curve, transported local frame and generated cross sections. Pre-rolled procedural path is an original test trajectory, not actual motion capture.
- TIMER Phase Clock (derived from 05-01 and 05-03): RING / FOLD / SPOKE. A bounded history of phase values mapped onto ordered cross-sections. Different mechanism from distance sampling; a pulse changes phase velocity.
- 03-03 Flow Loom: SHEET / CROSS / COLUMN. 12³ periodic staggered velocity grid, pressure projection and 1,440 ordered tracers. Render material lines between adjacent tracer seeds; avoid connecting across periodic jumps. No solid collider or free-surface claim.
- 06-01 Autonomous Lattice: WAVE / DUAL / GATE. Damped neighbor-coupled graph waves, with different initial sources or removed neighbor edges. Geometry reflects actual state, not prerecorded animation. This is a graph model, not fluid or neural measurement.

WebGL2 with depth test is the intended GPU drawing path; this environment returned no WebGL2 context. A02 includes a real CPU 3D raster fallback using per-pixel inverse depth and projected lines, points and triangles. Actual Chromium fallback rendered all 12 and validated front/behind occlusion; GPU shader compile, GPU parity, timing and device compatibility are still unverified. Fixed default camera; view controls don't alter exposed simulation state. Fallback tested under headless Chromium with local HTML set_content, not public deployment. Artist acceptance remains pending.

## Controls and music / XR contract
Select candidate, pause/step/reset, drag to input stage XY, pulse, rotate view without resetting. Local `window.atlas.cue({type:'pulse',p:[x,y,z]})` accepts finite normalized coordinates; export includes step-indexed manual events. This is not an implemented replay, OSC transport or XR device adapter. Next: separate input event recording/replay from UI, align the existing Show Score/OSC and Quest tracking → stage coordinates, measure actual latency. No autonomous audio, no changes to authored music.

## Reproduce
Open the single HTML in a compatible desktop browser. In console: `atlas.pause(); atlas.select(6); atlas.advance(20); atlas.info()`. Change yaw, call draw and compare snapshots. `atlas.cue({type:'pulse',p:[0.4,0,0]})` records one event; invalid nonfinite input throws. `sampler(.046)` samples a straight line from -0.8 to 0.8, 10 vs 100 input segments should give 35 points. Refer to evidence for numerical results and environment. Render checks are short-run only.

## Next gates
Artist compares RIB, MARK, FOLD, CROSS and GATE against A01, keeps/rejects based on visual quality and causality. Improve a selected family before expanding remaining briefs; build actual WebGL2 device evidence, a deterministic cue replay and one genuine music phrase interface. Keep independent technical R01/R02 queue; preserve failure results. No auto-merge/deployment.
