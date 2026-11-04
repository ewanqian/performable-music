# CRITICAL FIELD — Immersive WebXR Spatial Playground

Performable Music × Stage Casting 04
Status: v0.1 source prototype; NOT tested on a physical Apple Vision Pro.

## HTTPS entry point (only after Pages deploy succeeds)

https://ewanqian.github.io/performable-music/spatial-playground/

This version is a self-contained, dependency-free immersive WebXR field viewer. Desktop browser runs WebGL preview; compatible headsets can request a stereoscopic immersive-vr session. The code requires no external library, CDN or build step.

## Apple Vision Pro

1. Open the HTTPS link in Safari on the headset.
2. Click ENTER IMMERSIVE XR and approve the WebXR session.
3. Hand tracking is optional; approve if prompted and you want hand-position controls.
4. Turn your head to inspect the virtual field. Safari gaze+pinch produces a transient WebXR select event; each select advances to the next scene.
5. Tracked left index position maps to SPACE; right index position maps to ENERGY. If no hands are available, head motion and select can still work.
6. Exit through the headset session UI.

Apple WebXR on visionOS supports immersive-vr, NOT a dependable immersive-ar passthrough mode. This viewer is NOT real-world-anchored AR.

## Scenes and controls

01 INITIAL CONDITION / source field
02 FIELD / multiple temporal orbits
03 OVERRIDE / compression and spatial expansion
04 AFTERIMAGE / slow traces and release

Desktop: keys 1–4 change scenes; Space toggles HOLD; TRIGGER enters OVERRIDE; Escape sets simulated SAFE; drag the viewport to orbit. Show Score sliders control ENERGY, DENSITY, SPACE and TENSION.

## Score export

Recording produces an approximately 20-Hz set of normalized JSON score frames, with scene, event IDs, state, tracking validity and simulated SAFE. In this published one-file version, REPLAY uses the current in-memory recording. Raw hand joints, microphone and camera data are never uploaded or included in the exported JSON. Each frame is modeled on the parent repository protocol at protocols/show-score-v1.schema.json.

## Extended archive

The complete standalone downloadable ZIP linked in the original ChatGPT conversation includes an expanded multi-file prototype: local WAV/MP3 input, Show Score-driven WebAudio filter/stereo-pan/gain, JSON file replay input, more developed spatial geometry and documentation.

The GitHub Pages variant here is a lightweight reference viewer, not an identical deployed copy of the expanded ZIP.

## Safety and validation

- UI SAFE is NOT an independent physical emergency audio KILL.
- No Max/SC/OSC bridge, venue speakers, or spatial-audio mix have been validated.
- The live XR/headset path and hand tracking need real-device testing.
- No music files or commercial copyrighted assets are bundled.
- No strobe program; headset users should remain stationary and exit if uncomfortable.

## Real-device acceptance checklist

- [ ] HTTPS page launches an immersive-vr session.
- [ ] Correct binocular render/head movement, no discomfort or unexpected scale.
- [ ] Gaze+pinch select changes exactly one scene.
- [ ] Hand-tracking permission and left/right controls tested.
- [ ] Tracking loss neutralizes stale movement.
- [ ] Score capture/export/replay operates in Safari.
- [ ] CPU/GPU and thermal behavior acceptable.
- [ ] Independent physical audio KILL exists before any show use.

## Official references

- https://webkit.org/blog/15865/webkit-features-in-safari-18-0/
- https://webkit.org/blog/15162/introducing-natural-input-for-webxr-in-apple-vision-pro/
- https://developer.apple.com/forums/thread/756850
- https://developer.apple.com/videos/play/wwdc2024/10066/
