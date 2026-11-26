# Performable Physics — 持续研究与实验循环 / Agent Mission

**2026-11-27 · 长期 R&D · independent P1 lane.** Read [architecture](README.md) and [current round](STATE.json) before working. This mission is for the visual particle runtime, not for music production, current performance scheduling, or automatic artist decisions. Only use public-safe research here. Do not publish private rehearsal URLs, correspondence, credentials, client or unreleased media.

## Outcome

Build a small Geometry Nodes-like runtime for authored, three-dimensional particle effects, in which state persists across frames; compute passes can be composed, tested and optimized; particle/flow physics can be played live; cameras and rendering are independent of simulation. LED illumination, reflections, audience-readable causality and audio feedback are independent adapters. Do not make a general game engine or an all-purpose visual node editor.

## One round = one falsifiable hypothesis

1. Read the accepted baseline, STATE.json, open tracking issue/PRs, existing source and latest evidence. If someone already owns a round, review evidence rather than start a duplicate. Preserve accepted snapshots.
2. Select **one** next experiment with explicit acceptance, baseline, limits, and failure criteria. Read authoritative documentation or inspect source; pin versions/license before reuse. Avoid research notes with no connection to implementation.
3. Implement a minimal, independently runnable demo or test. Keep simulation clock, state, input and render separate. Use the same seed, initial conditions, input sequence and view for comparison. Don't disguise noise, trajectories, or renders as physical computation.
4. Actually execute available tests. Record environment, command or method, git revision, seed, parameters, units, raw metrics, expected/observed, screenshots/video when actually produced, failure and scope. If hardware/browser/runner access is missing, mark BLOCKED or UNVERIFIED, supply the precise reproduction steps and do not report a pass. No generated dummy evidence.
5. Compare against the last accepted baseline; improvements require evidence and visual review if relevant. Preserve a failing result too. Fix or reject one hypothesis before moving to the next. Separate numerical, rendering, device, and artist acceptance.
6. Write a dated round record and evidence under experiments/Rxx-...; update proposed state and next task in the same draft PR. Never overwrite the baseline or auto-merge; if GitHub permissions are unavailable, deliver a patch or report and flag the blocker. Do not edit DAW, existing production, unrelated pages/workflows or deployed private sites.
7. Report a concise cycle result: what changed, demo/commit/PR, actual results, limitations, next single hypothesis, and any decision needed from the artist. This cycle is not a promise of continuous compute between scheduled runs.

## Scope & review gates

- One bounded experiment and at most one draft PR per round; no parallel competing agents editing the same lane; no repeated PR for an existing pending round. If the previous PR is awaiting review, inspect/reproduce it or record the blocking question, not another implementation branch.
- Changes after R00 use a branch from main such as research/physics-r01, with a draft PR. Do not auto-merge, change repo visibility, install unreviewed dependencies, publish new deployment or activate a show. The artist determines visual direction and acceptance. Proposed architecture and numeric test successes are not equivalent to artist-approved performance.
- If regression, numerical instability, browser incompatibility or cost exceeds scope, return to baseline. Use simple models before GPU optimization. Never claim continuous simulation unless actually run.
- Separate statuses: PROPOSED, IMPLEMENTED, NUMERIC_TESTED, BROWSER_TESTED, DEVICE_TESTED, ARTIST_ACCEPTED, BLOCKED. A record can have different status by dimension. No hardware pass inferred from source or software rendering.
- Stop expansion if a phase is accepted, blocked by a required human choice, or duplicates existing work; report that. This is a research loop, not an obligation to generate output every cycle.

## Queue (ordered; may change based on evidence)

| Round | Single objective | Minimum evidence / gate |
| --- | --- | --- |
| R00 | 3D periodic CPU reference | self-contained HTML, seven checks; browser/artist not yet verified |
| R01 | Reproducibility and actual browser validation of R00 | run browser if available; verify shader compilation, controls, camera invariance, 3D output; separate solver into reusable JS module or extract test runner only if needed; save repeatable test command and browser screenshot if possible; compare to evidence.json |
| R02 | Boundary response | one fixed spherical obstacle; wall normal velocity and penetration metric; no dynamic walls until fixed obstacle passes; compare same seed |
| R03 | Drop Flow injection | recorded local impulse/trajectory, compare procedural baseline vs actual persistent solver, opposing flows and force-off behavior |
| R04 | GPU compute parity | one WebGPU solver pass or small complete solver against CPU reference; declared tolerances and fixed-step reproducibility; capture real adapter/timing where available |
| R05 | Lightweight graph | typed state and operator contracts, resource dependencies, simple execution order and shader passes; no generic editor |
| R06 | LED and planar reflection | independent SceneForge-oriented sample, black/white and red/blue cases; verify screen-off-camera reflection; separate direct light from reflection |
| R07 | XYZ irradiance/area-light approximation | position/normal/occlusion and lighting cost; compare sampled light and probes; don't call approximation full GI |
| R08 | Audience mapping / performance | fixed reference camera, one authored visual/one music passage, blind directional A/B; real viewer evidence if available |
| R09 | OSC feedback + reliability | one bounded physical statistic, record bridge actually connected or blocked, controlled disconnect/recovery |
| R10 | Stress and artist review | staged 32³/64³ tests, frame percentiles, real-device thermal/memory; 90-min loop only when a real runner exists; artist selection |

R01 is next. Never run all rounds in one cycle. GPU, obstacle, SSR, lighting, and live devices remain unverified in R00. Visual quality is a distinct axis: maintain a fixed authored camera default, meaningful depth/occlusion, no automatic zoom, no overuse of bloom; keep stage composition and musical direction independent.

## Handoff format

Round ID / hypothesis / baseline commit / candidate branch and PR / test environment / executed command or method / metric and unit / observed vs criterion / status by dimension / failure and recovery / next single experiment. Use the tracking issue to summarize significant progress and link the record, not as an unbounded chat transcript. Keep STATE.json as machine-readable proposed work queue, update in PR and require review before promotion.
