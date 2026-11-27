# A03 — MATTER / DEPTH / LIGHT

**2026-11-27 · Render reference, not stage-ready.** [Single HTML](index.html) · [Executed test evidence](evidence.json) · [48-study editorial review](STUDY-REVIEW.md) · [machine-readable review](STUDY-REVIEW.json).

A03 deliberately changes presentation without altering the engine baseline or production. Three distinct generators from the existing practice:
- TIMER Phase Corridor: 24 phase-dependent rectangular cross-sections, ribs and connecting strips.
- Drop Flow Material Loom: A02 periodic staggered-grid 12³ reference, 30×48 ordered tracers; edges/faces only while local adjacency is continuous. Not free-surface water, rigid collision or accurate cloth.
- NFIR Autonomous Lattice: damped neighbor-coupled state evolving in a 7×5×9 grid; slabs have generated thickness. Not a claim to reproduce private original work.

Fixed reference audience camera and 4 presentation levels: points, wire, faces, material. Switch without resetting exposed simulation state; do not force realism for concept pieces. 16:9 and 32:11 independent composition tests, not actual site projection calibration. Each renderer layer can be turned off or adjusted. Real raster depth and occlusion are CPU-based, not a flat Canvas animation. GGX/Cook–Torrance terms are evaluated per triangle, not complete production PBR. Dither is a screen-space ordered coverage test (depth-writing), not order-independent transparency or temporal accumulation. Distance fog attenuates geometry by depth, not true participating-medium scattering with shadows. Floor mirror is a separate mirrored XYZ geometry raster pass and coarse roughness-dependent screen filtering, not SSR.

## Video-driven spatial lighting

Use a locally decoded video frame or test pattern, sampled to 4×3 RGB values; convert approximate sRGB to linear and treat each cell as a world-space emitter at a fixed virtual audience-side panel (z=-3.65). Evaluate angle, distance, receiving normal and material BRDF terms for surfaces and a coarse floor grid. Approximate directional reflection toward source plane, plus analytic ambient/key lighting and mirror floor. Actual WebM red→blue decoded test passed, not merely a video-shaped animated color uniform. This is direct-light and reflection approximation, **not** multi-bounce GI, measured lux, shadowed irradiance volume, LTCGI implementation or a calibrated physical LED simulator.

## Reproduce

Open the single HTML offline in a desktop browser. Select a scene and pause, then console `a03.select(0); a03.advance(25); a03.snapshot()`. For levels 0..3 call `a03.level(level); a03.draw()` and compare snapshots; repeat scenes 1 and 2. Turn grain to 0 for screenshot A/B, toggle pattern black vs warm/cool, reflection, fog and dither. The test was run via Chromium headless page.set_content with exact HTML, 1024×950 viewport / 840 px raster width, not an online deployment. Browser file: choose a local synthetic VP8 WebM. Recreate it using ffmpeg:
```sh
ffmpeg -f lavfi -i "color=c=red:s=128x96:r=12:d=1" -f lavfi -i "color=c=blue:s=128x96:r=12:d=1" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" -map "[v]" -c:v libvpx -b:v 120k video-test.webm
```
Seek paused video to 0.25s and 1.25s, call `a03.draw(); a03.sourceTest()`, compare sample RGB and lighting-off values. The video is synthetic test media, not a user asset. No upload occurs. All 12 short render cases and snapshot comparisons passed, no page JS errors, source blob verified identical to local tested file. WebGL2 probe false; CPU render timings 30.2–68 ms (single draw at 840 px, excludes simulation/complete frame). No claims about GPU performance or actual sustained playback.

## Next bounded GPU experiment

1. Preserve geometry/state and this CPU reference; implement one WebGL2 or WebGPU backend that draws the same mesh with true vertex normals, depth buffer and HDR scene target. Shader unit parity + visual comparison on actual hardware. WebGPU compute port is separate from rendering.
2. Add GPU-local video texture downsample in linear color; use filtered rect area lights (LTC candidate) and/or static-scene irradiance transfer/probe volume; validate with opposite-side red/blue and occlusion. Probe interpolation is a separate indirect approximation. Explicitly separate source lighting, rough reflections, shadow visibility and actual GI.
3. Add planar mirror render target with clipping, roughness-filtered reflection mip chain; SSR optional, separate test for off-screen miss. Build normals/depth for AO/contact shadow; add depth fog first, then occluded volumetric scattering only if necessary.
4. GPU post pass: restrained grain, optional blue-noise/dither with temporal stability; avoid obscuring weak geometry. Tone-map and exposure under author control. Compare anti-aliasing and projection on actual LED, not only monitor.
5. Fix reference audience-eye projection/frustum for each screen; no camera auto-zoom. Stage twin lighting and LED visual camera are separate outputs. Test authored glTF/Blender material scene with real shadows, and later one authorized point-cloud or Gaussian splat asset with compatible depth/composite behavior. Do not infer that procedural geometry is captured photorealism.

Use the same source scene and one authored musical phrase for point→line→surface→material cues, holding the camera unless explicitly authored otherwise. A03 exposes bounded local pulse and event list, not implemented cue replay, MIDI, WebXR, Max or Ableton integration. Preserve R00–R10 technical queue and A01/A02, no production/deployment changes or auto-merge.
