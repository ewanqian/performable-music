# Native Metal, authored media and lighting — bounded implementation

**Date:** 2026-11-09. **State:** architecture and test plan; Mac M1 Pro compilation, actual GPU timings and stage output are **NOT YET VERIFIED** by this document.

## Decision

Use **Swift + Metal** as an optional **native stage rendering lane**, not a replacement for existing WebXR inputs, OSC bridges, DAW or the validated browser baseline. The portable performance machine is an **M1 Pro MacBook with 32 GB unified memory**. Prioritize a full-screen native 1080p/60 test, and keep a simpler playable fallback.

Blender supplies authored/evaluated geometry, BVH extraction, pre-rendered plates, camera plans and reference frames. Python runs offline analysis/asset conversion; it should not own per-frame drawing. The native runtime receives the **existing** Show Score and bounded control values. Camera is **HOLD by default**, framing and aspect ratio remain author-controlled.

## Source boundaries

- Existing `spatial-playground/hand-osc-lab/neuro-field.html` and `neuro-engine.mjs`: procedural 2,200-node brain-like field and spikes. This is an **artistic model**, not individual-neuron data from EEG.
- Existing `spatial-playground/hand-osc-lab/neural.html`: schematic STRUCTURE/SECTION/ELECTRODES/SIGNAL scenes and 60-second score.
- Existing `visual-runtime-lab`: narrative states, manual media overlays, event record/replay, but **no proven DAW/OSC/XR integration**.
- Public `dropflow-biennale-mocap` supplies a Blender/BVH reference and access instructions. Confirm source rights and source frame time before any output; 33-bone retimed stage rig is not interchangeable with the raw BVH skeleton.
- `NEURAL_FIELD_METAL_POC` is currently a **separately downloaded local test project**. It has not been imported or run on this repository's Mac in this document. Do not claim hardware pass.

## Ordered rendering stack

`Source data / author media → OSC/Show Score adapter → scene state → Metal compute geometry → Metal draw → optional GLIC effect → final composite / labels → native fullscreen`.

For video plates: `AVFoundation / VideoToolbox → CVPixelBuffer / Metal textures`. Preallocate GPU resources; use bounded latest-frame queues. The live audio thread never waits for video processing.

## GLIC and Syphon rules

- Public algorithm source: https://github.com/daitomanabe/glic-metal (MIT, honor notices and underlying original GLIC credit).
- Distribution: https://github.com/daitomanabe/glic-metal-sdk. Current inspected **v0.1.0**, with **28** curated realtime-certified presets (14 Original, 8 Spatial, 6 Codec), **not** 144 certified live effects. Pin one SDK release and matching resources; read docs/AI_INTEGRATION.md.
- GLIC Metal processes textures. **Syphon is not required to make the glitch.**
- https://github.com/daitomanabe/syphon26 is a distinct developer-preview GPU inter-app transport **without classic Syphon compatibility**. Do not assume Resolume Arena accepts it. Prioritize native fullscreen; inspect an explicit classic-Syphon adapter only after required tests.

## Lighting families — audition before expansion

All are **independent authored axes**, not nine automatic presets:  
(1) KEY_SIDE, (2) RIM_BACK, (3) UPWARD, (4) DOWNWARD, (5) ORBIT, (6) SCAN_EDGE, (7) CHASE, (8) LOCAL_TRANSIENT, (9) WITHDRAW_BLACK.

For each candidate provide three contrasting tested envelopes: **HOLD / RISE / RELEASE**. Represent semantic controls `intensity, position, direction, decay, material, active` with bounded [0,1] values. Light direction and mesh motion are separate; large fields do not automatically respond to every beat. An authored cue/FOOT action overrides audio-feature convenience mappings.

**Safety:** no uncontrolled full-field flash / photosensitive strobe in the default preset. Venue-specific lighting and photosensitivity safety review are required for high-intensity sequences; ensure an operator can override to steady light/blackout.

## Baseline real-hardware QA

- Confirm Xcode/Swift toolchain, actual M1 Pro GPU configuration and display mode.
- Render at **1920×1080**, target **60 fps (16.67 ms period)**. 30fps fallback only if artist accepts it.
- Begin with ~2–3k visible neural points, bounded edge degree and 8–16 BVH time-sampled skeleton instances. These are **initial budgets, not hardware performance claims**.
- Log median / p95 / p99 frame time, missed frames, GPU utilization, memory, output latency and crashes across a 20–30-minute loop, including scene switching.
- Demonstrate a real linked audio event changes a 3D object and one light family. Record audio and video, event IDs and timing.
- Test lost OSC, disabled plugin, failed GLIC prepare, all media offline and performer panic/fallback.
- No performance-ready claim until repeated real rehearsal, independent physical audio mute, and stage projection pipeline check.

## Short first shot

Use ONE artist-selected 30–60s original percussive segment; three visual candidates on the *same* reference render: **neural contour**, **BVH temporal echo**, **image fracture**. Compare still frames and short videos with the SAME audio. Human selects one; do not grow every branch.
