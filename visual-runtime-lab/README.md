> **Author-led v0.2 update (2026-11-06):** [Hybrid Authoring Architecture](HYBRID_AUTHORING_ARCHITECTURE.md). Following artist feedback, camera scale is now fixed and auto camera zoom/rotation removed; MOTION defaults to 0. Scene chapter, material type, 2D/3D layer visibility and author media are independently controlled. A local image/MP4 plate can be loaded directly from the browser without being uploaded. This is a **manual compositing proof**, not a complete mixed-media timeline or 3D asset import pipeline.

# NINE / TRANSIT SIGNAL — Narrative Runtime Lab 01

**Status:** original, dependency-free **desktop visual demonstration** (WebGL1 + Canvas2D). It is **not** a completed music video, OSC music link, Vision Pro app, physical camera tracker, true 3D scan, or venue-proven runtime.

## Purpose

A narrative event (ARRIVAL → EXCHANGE → DEVIATION → TRANSFER) changes a three-dimensional transportation/architecture field **and** a two-dimensional information graphics/typography layer. This is an experiment in *shared world state*, not FFT-reactive visualization. Visuals and labels are original and deliberately avoid copying capsule, Ghibli, Michel Gondry, Autechre, or Daito Manabe works.

**Online route (once GitHub Pages deployment succeeds):**  
https://ewanqian.github.io/performable-music/visual-runtime-lab/

**Local run** from repository root:

```sh
python3 -m http.server 8000
# open http://127.0.0.1:8000/visual-runtime-lab/
```

## What actually works

- Real WebGL1 drawing with static vertex buffers and uniforms for scene warp / camera scale; GPU line drawing for a 3D transportation lattice, orbits and station towers
- Canvas2D graphic overlay for large type, color blocks, captions, small schematic “transport path” and telemetry
- Four named narrative states, manual scene events, auto cycle (17s), keyboard 1–4 and space
- Continuous control: DENSITY, MOTION, SPACE, bounded [0,1] and interpolated visually
- JSON local event recording, deterministic state transitions, replay and export (does **not** capture bit-identical video frames or live sound)
- Actual browser animation loop frame-rate estimate (not the GPU's verified refresh rate)

## Important technical limits

1. **The overlay is deliberately Canvas2D, not yet PixiJS**. Zero-dependency proof first; upgrade to PixiJS only if text/layout/animation complexity and profiling justify it. This also avoids browser restrictions on CDN/module loading.
2. **The 3D content uses native WebGL1, not yet Three.js or WebGPU.** Its only purpose is to prove scene/world event separation with minimum source and compatibility burden. Upgrade to a Three.js scene graph + glTF once actual asset, camera and lighting requirements exist.
3. The “transport path” is a generative graphic signal, *not camera or sensor data*.
4. No WebAudio, synchronized Ableton, OSC, WSS bridge, WebXR or sensor measurements are integrated here. The existing [hand OSC lab](../spatial-playground/hand-osc-lab/) and [Critical Field runtime](../performances/2026-12-03-phase-01/pressure-test-001/runtime/) are separate verified codebases, with their own unfinished hardware gates.
5. JSON replay stores state-event timing but does not yet capture global performance score clock or full visual frame precision; animation includes local elapsed time.
6. There is **no hardware KILL**, no audio output and no true stage safety validation. This is a creative coding sandbox.

## Narrative experiment

| State | Graphic | Spatial | Auditory intention (not implemented) |
| --- | --- | --- | --- |
| ARRIVAL | minimal platform / data labels | restrained, sparse orbital station | rare synth signals |
| EXCHANGE | letters/panels slide, signal pathways | multiple routes unfold | original bass/metal call-response |
| DEVIATION | one arrival remains unfulfilled | field compresses / bends | expected bass event is withheld |
| TRANSFER | large high-contrast title | station geometry expands into next region | an explicit foot/event triggers structural return |

The music should remain composed and interesting when visuals are off; the visuals should remain narratively legible with sound off. Shared musical event identity is the bridge.

## Next implementation contract — not part of this first build

```text
Conductor (one authoritative musical clock, seq + event_id)
  ├── 3D / narrative renderer
  ├── 2D / typography renderer
  ├── Sound engine (existing SC / Ableton / Max)
  └── Replay + audit (no fabricated sensor streams)

WebXR hands / pedal / MIDI  ──> bounded semantic action  ──> conductor
```

Recommended next test, **not a second huge rewrite**:

- Add an OSC/WebSocket adapter from existing `pressure-test-001/runtime/conductor.py` or the `hand-osc-lab` bridge
- Map the same `event.id` to one musical transformation and a matching visual-world event. Log matching seq, scene, event ID, send time, receive time
- Run a 60–90 second authored scene with dry/wet audio
- Capture two full runs from the same score and compare cue time alignment
- Test disconnect + neutral fallback, CPU/GPU frame pacing, browser memory, no clipped display content
- For hardware safety, independent physical audio mute/kill belongs outside this browser app

## Blender Geometry Nodes — realistic interoperability

Blender can generate original assets through Geometry Nodes. Export evaluated static geometry/animation as glTF (verify modifiers/instances/baking on the actual asset), then load in a Three.js scene. **There is no automatic export of Geometry Nodes' procedural computation graph into JavaScript/WebGPU code.** For dynamic rules:
- reimplement mathematical generation as JS/GPU compute/shader code, or
- render live through an independent Blender OSC → Geometry Nodes/EEVEE pipeline, then capture video frames into the stage media system (added latency and resource costs)

The 2025 Blender Studio OK Go “Impulse Purchase” production is a real example of live Blender OSC/GN/EEVEE operation, not proof the same scene will reach headset refresh rates.

## Source-supported research

- [The detailed essay: music video, narrative and live world systems](https://github.com/ewanqian/portfolio/blob/main/writings/performable-music/08-narrative-mv-and-live-runtime.md)
- [Visual runtime implementation specification](./AGENT_RUNTIME_BUILD_BRIEF.md)
- [Original four-act music show direction](../performances/2026-12-03-phase-01/DIRECTOR_SCORE.md)
- [Shared Show Score v1](../protocols/show-score-v1.schema.json)

## Acceptance

Run `node --check visual-runtime-lab/app.js`; open the website locally. Confirm changing each scene modifies both graphic and WebGL field; sliders have bounded response; auto and recording work; export contains state and unique event IDs; replay revisits previous states; check in an actual browser and record results. **No test means no hardware/performance claim.**
