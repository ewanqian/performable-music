> **NOV 6 EXECUTION PLAN:** [Ranked 16 study/sprint plan](../research/visual-runtime/2026-11-06-16-study-plan/MASTER_PLAN.md) · [Exact daily timetable](../research/visual-runtime/2026-11-06-16-study-plan/DAILY_TIMEBLOCKS_2026-11-06_TO_2026-12-03.csv). The runtime is an **artist asset compositor and controlled performance scene**, not an autonomous aesthetic generator. Camera is held by default. See PM Issue #9.

> **PRIORITY CORRECTION / 2026-11-06:** The creator rejected AI-authored default visual identity and automatic camera zoom. Read [Hybrid Authoring Architecture](HYBRID_AUTHORING_ARCHITECTURE.md) first. This system must become **artist-authored source material + procedural overlay + explicitly cued runtime**, with fixed framing unless the author has designed a camera cue. Do NOT make dozens of automatically generated new scenes. Use the new v0.2 independent material/layer controls and local media plate for one chosen authored source. Implement glTF/Geometry Nodes and audio interoperability only when asset and test requirements are concrete.

# Runtime Build Brief for local Haiku / Codex
## P1 Creative-coding research lane; never displace P0 12/03 music rehearsal

You are creating a **narrative audiovisual performance runtime** based on the existing `visual-runtime-lab/`, `spatial-playground/` and `performances/2026-12-03-phase-01/pressure-test-001/runtime/`. You are not building another random FFT visualizer. Do not overwrite the local DAW project.

### Creative objective

One authored music event (for example a withheld bass return, an arrival, a transfer) changes:
(1) a **musical structure**, (2) a **narrative/world state**, and (3) both a **graphic 2D layer** and **spatial 3D layer**. The audience can recognize the consequence even without understanding the event JSON or how it was computed. This combines capsule × Yoshiyuki Momose's cross-MV world continuity, Michel Gondry's arrangement/scene mapping, Alex Rutterford's sonic sculpture, and Nosaj Thing/Daito/TAKCOM's performance-to-world relationship **as method research, not a style clone**.

### Environment & source of truth

- First inspect git status and existing tools, never reset/clean another Agent's uncommitted local work.
- Read `visual-runtime-lab/README.md` and `app.js`.
- Read `protocols/show-score-v1.schema.json` and `spatial-playground/hand-osc-lab/README.md`.
- Read existing `pressure-test-001/runtime/{conductor.py,visual.js,README.md}`; this has an already existing *audio+visual shared event concept* and must not be needlessly rewritten.
- Read [portfolio article 08](https://github.com/ewanqian/portfolio/blob/main/writings/performable-music/08-narrative-mv-and-live-runtime.md).

### Technical trajectory

**Gate V0** (this repo): native WebGL1 + Canvas2D, 4 scenes, time, graphic/spatial layers and JSON event record/replay. Verify in browser. No external dependencies yet.

**Gate V1:** Create a `world-state-v1` schema that maps from existing Show Score, not a second conductor. Include event.id, scene, transition, data snapshot, timestamps and source. Make export + replay emit exactly the same event schema. Two unit tests: duplicate event id ignored; stale tracking causes neutral data.

**Gate V2:** Make a bridge into the *existing* musical conductor and real SC/Ableton sound stems. One OVERRIDE event must (a) change real sound, (b) change world/typography and (c) be recorded with matching ID. Capture runtime evidence. Only this gate can be marked AUDIOVISUAL_POC.

**Gate V3:** Upgrade 3D to a Three.js scene graph / instanced draw where useful; optionally adopt PixiJS for graphics and animation. Profile before replacing native proof: frame pacing, CPU/GPU load, draw calls, DOM/Canvas usage, font loading. Support WebGL baseline. Only use WebGPU after browser/device verification.

**Gate V4:** Asset pipeline from Blender Geometry Nodes with original procedural geometry to evaluated glTF 2.0. Keep GN live in Blender as an *optional independent OSC renderer* when it adds value, not as a browser dependency. Add no implicit claims of node graph export into Web.

**Gate V5:** Device acceptance: run desktop first, then browser/Quest/AVP only in modes that are actually supported. Measure input-to-event-to-visible change/audio onset latency. Add real neutral fallback and physical independent audio kill. No venue-ready claim until two complete rehearsals.

### Twelve focused creative-coding drills

| ID | Exercise | Acceptance |
| --- | --- | --- |
| V01 | Bass vs metal sound roles become two graphical objects | same event IDs; color alone insufficient |
| V02 | A continuous travel camera makes a passage through geometry | stable horizon, authored 20s route |
| V03 | Omitted predicted bass leaves a spatial missing node | compare A/B 32-bar scores |
| V04 | Typography reflects a chapter without debug-number overload | readable from simulated stage distance |
| V05 | GN-authored tower exported as evaluated glTF | no unexpected missing geometry or materials |
| V06 | Dry near sound and far return correspond to graphical depth | staged A/B with real audio |
| V07 | OSC/Show Score transfer switches music and spatial region | one event ID on both systems |
| V08 | Data recorder replays chapter/state/controls | two runs produce same structural transitions |
| V09 | GPU instancing of a 3D information field | benchmark at two pixel resolutions |
| V10 | Camera subject from an authorized 2D video | label it 2D, do not claim 3D scan |
| V11 | Silent visual narrative | viewable without audio or explanatory UI |
| V12 | Full 60–90s performance replay and failure recovery | archived event log, captured output and QA |

### Deliverables

- `visual-runtime-lab/` code, docs, test results and screenshots (screenshots can stay local if not public-safe).
- One authoritative `world-state-v1.schema.json` derived from Show Score.
- 12 independent small experiments in numbered subdirectories, not 12 incompatible new engines.
- One original 60–90s narrative scene (working name **NINE / TRANSIT SIGNAL**) with a real audio link by Gate V2, while the simple browser demo remains available.
- Update the [public Writing essay](https://github.com/ewanqian/portfolio/blob/main/writings/performable-music/08-narrative-mv-and-live-runtime.md) **only** when a new result has been validated; distinguish FACT / INTERPRETATION / EXPERIMENT.

### Response contract

Report `FILES_CHANGED`, `TESTS_RUN`, `ACTUAL_VISUAL_OUTPUT`, `ACTUAL_AUDIO_OUTPUT`, `CURRENT_DEVICE`, `FPS_MEASURED`, `EVENT_IDS_MATCHED`, `LATENCY_MEASURED`, `BLOCKERS`, and `NEXT_SINGLE_TASK`. Do not mark a gate done just because implementation notes were written. No paid plugins or borrowed unlicensed visuals/music.
