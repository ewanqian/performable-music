# HAND / SPACE / OSC · Spatial Playground Lab 02

## Spellcraft Atelier / Two Game Lines (2026-11-09)

Two six-mechanic Quest 3 MR / VR browser experiments, implemented as original interactions (not game asset reproduction or verified religious ritual):

- [European Fantasy / West](./spellcraft.html?line=west): fireball, freezing beam, chain lightning, ward block, gravity well, rift portal
- [Chinese Fantasy / East](./spellcraft.html?line=east): draw-and-send talisman, nine flying swords, bimanual sword array, five-element target interactions, binding seal, seven-star sequence
- Each demo has visible spatial targets, hit events, scored challenges and original procedural responses. Some modes use abstract symbolic translations of historically documented motifs; none claims ritual efficacy.
- Desktop: choose any of six, move pointer to aim, press 1 sword / 2 open / 3 fist / 0 neutral, or use CAST for a direct test. In XR, left index-thumb pinch cycles the six modes except in the five-element selector. Quest hand pose is read from existing 25 joints using the same fast 42ms gate as Gesture Dynamics.
- Audio is optional local WebAudio started by a user action. No remote WebSocket, OSC or hand recording. Three.js 0.180.0 MIT is loaded over HTTPS.
- Node tests cover twelve mechanisms and input rules. **Real Quest hand-tracking and audio are unverified and must be observed on-device.**

### Design and playtest acceptance

1. Check both lines render six named modes and a real moving target, including one local score/feedback event per action.
2. Quest 3: verify AR entry, hand consent, pose update, left-hand pinch navigation, hand loss, and cursor direction while turning the head.
3. For draw-and-fire rune/portal, draw an actual closed circle then deliberately release and re-enter sword pose (or thrust) to fire. A circle alone should never auto-fire.
4. For sword volley / fireball / shield / freeze, capture 10 valid trials each and count false detections and misses. Only increase visual complexity after gameplay is reliable.
5. Confirm audio plays at safe level, no repeated loud trigger storms, sustained headset frame rate and independent XR exit/re-entry.

## Gesture Dynamics V3 / Turbulent Energy Flow (2026-11-09)

**Current live app:** [Gesture Dynamics](./gesture-dynamics.html). This V3 supersedes the V2 visually rigid orbital-leader effect and keeps the same URL/Portfolio launcher.

- **Sweep** — pose velocity continuously emits local spatial sparks/trails, preserving inertial velocity. In XR, pose and aim are sampled every XR animation frame, not from the slow HUD state.
- **Fist** — attracts previously flying particles into the palm and emits intake filaments. Charge increases with actual time and speed and is capped; a solo fist is sufficient. Left and right charges are independent.
- **Sword** — continuous small jet from actual index/middle fingertips, dynamically steered by latest finger direction and hand sweep. Previously accumulated charge fires one larger/faster impulse at sword entry; streaming continues until the pose ends.
- **Open palm** — one burst on entering open pose, with a charge-scaled wave and outward impulse on nearby particles. No phantom burst on tracking loss.
- **Simulation** — finite-lifetime Lagrangian 3D particles, drag, velocity-integrated streaks and analytic divergence-free curl forcing. This is **not a full Navier–Stokes fluid solve**. The default representation is *jet*, plus wide *ribbon/stripe* and stronger *vortex* presets. Turbulence and output are independently adjustable.
- **Performance** — bounded 1,536 CPU particles, typed arrays, pooled draw buffers, mobile resolution cap and no per-frame shape creation. Actual frame rate and perceptual quality still require physical Quest 3 testing.
- **Desktop fallback:** mouse movement models a hand sweep; press `3` for sustained fist charge, `1` for charged release/continuous stream, `2` for palm burst, `0` to release; `R` to reset. Desktop gestures are **MOCK**, not computer-vision tracking. Debug status shows both per-hand charges and simulated particle count.
- **Behavioral QA:** `node --test gesture-stream-engine.test.mjs`. Acceptance on Quest 3: fingertip vector left/right, rapid hand sweep (false trigger count), rate of sustained stream, charge duration versus emitted energy, near-hand steering in 3 axes, open-palm one-shot burst, hand loss and XR enter/exit.

Earlier V2 experimental leader/follower code and tests remain in `gesture-flight-engine.mjs` for reproducibility, but are not the runtime for the public app. No pose/audio data leaves the headset.

## Gesture Dynamics V2 / Fast Cast Flight (2026-11-09)

**This replaces the initial spring-home field behavior.** The original technical test lab remains available, but the public `gesture-dynamics.html` now uses `gesture-flight-engine.mjs`: each sword pose spawns a moving lead particle followed by 120 orbiting points. A held sword can cast subsequent volleys at 580 ms intervals. The leader speed is 6.2 m/s; flight has no spring back to the original world position. Open palm sends the followers into ballistic scattering. Right fist arms a short recall window (2.6 seconds), then a later left fist recalls all active particles to the tracked right hand in ~230ms along direct straight paths. No automatic return or ring orbit on recall.

Gesture classification uses the already available 25 WebXR joints and a fingertip vector combining proximal-to-tip (82%) and distal-axis (18%) directions, plus a 42ms gesture onset gate. Both AR and VR use the XR frame loop; the status UI refreshes every ~145ms but **does not throttle joint sampling**. Real Quest tracking accuracy and actual motion-to-photon latency remain unverified.

Desktop fallback: `1` sword cast, `2` palm burst, `3` right fist arm, `4` left fist recall, `0` neutral, `R` reset. Change formation to cloud/torus/helix. Physical acceptance: test both hands and representative pointing directions including horizontal, vertical and head rotations; inspect false positives, frames per second, trajectory distance, one-shot palm and recall end position. No OSC or private data.

## Gesture Dynamics / Quest 3 Particle Dynamics (new, review branch)

- [Gesture Dynamics — desktop + Quest MR / VR](./gesture-dynamics.html): 480 seeded particles, three 3D arrangements, index+middle sword posture directing a particle stream, open-palm one-shot blast, fist attraction, spring/inertia/damping and automatic recovery.
- Pure physics/classification is in `gesture-dynamics-engine.mjs`; WebXR joint sampling, immersive AR/VR and desktop controls are in `gesture-dynamics-ui.mjs`. The existing `engine.mjs` supplies shared 25-joint definitions/angles.
- For desktop: use mouse + `1` sword / `2` burst / `3` fist / `0` neutral / `R` reset. Desktop mode is explicitly a **mock**, not verified hand tracking.
- On Quest 3 Browser: open the **HTTPS deployed URL**, enable hand tracking, select `ENTER MR` (or VR), then perform sword / palm / fist gestures. Real 25-joint tracking is required; if absent, the app does not pretend gestures were recognized.
- Each field is anchored approx. 0.95m in front of the first XR head pose using WebXR local reference space; physical space placement and comfort must be tested on device. No camera recording, room depth, remote OSC or uploaded hand coordinates.
- Source-level tests: `node --test gesture-dynamics-engine.test.mjs` in this folder. Desktop WebGL and Quest acceptance remain **NOT VERIFIED** until actually exercised.
- Renderer dependency: three.js 0.180.0, MIT, loaded from jsDelivr in `gesture-dynamics.html` (HTTPS/network required).

**Hardware acceptance:** verify MR passthrough and hand permission; 25 joints per tracked hand; sword vector follows real index/middle direction 10/10 trials; palm gives exactly one blast per held posture; fist pulls then releases; loss of tracking never triggers a phantom blast; test 72/90 FPS target with 480 particles; reset/exit/re-entry succeeds. Record Quest Browser and firmware versions, measured frame rate and false-positive count.


**Status:** Three separate pages exist (sensor baseline / sustained Web Audio synth / Organic Fields sound maps). Code and source-level tests have been committed; real Quest/AVP audio, hand latency and stage quality are **NOT yet hardware-verified**. No raw camera access, no room-scale anchor persistence, no physical KILL.

## P0 Stage Casting experiments (2026-11-08)

- [Spatial Waves 01](./spatial-waves.html): touch:waves-inspired but original four XYZ sound volumes, four HRTF sources, optional user-owned same-length audio stems and 100 BPM arrangement. Audio is intended, not a sensor-only page. It uses the existing LAB02 WebXR 25-joint input adapter.
- [Neural Field 01](./neural.html): schematic brain / section / sensor positions / synthetic signal stage, four hand-controlled modes, 60-second Show Score sketch and original audio. **Not real EEG or medically accurate reconstruction.**
- [Existing Neuro Field](./neuro-field.html): earlier independent 2,200-node abstract art prototype, preserved unchanged.
- [Spatial Stage V1 research and hardware gates](./SPATIAL_STAGE_V1.md): hardware, model license, local four stems, headset HRTF assumptions and Dec 3 stage priorities.

**Source and browser CI tests are separate from real Quest, Vision Pro or live DAW acceptance.** Neither page claims hardware validation or a finished performer-approved sound mix.

## Start

**Live page** (when GitHub Pages build succeeds):
https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/

Quest 3/3S Browser: HTTPS page → ENTER MR / AR → hand-tracking consent. The compositor shows real hands via color passthrough; WebGL overlays fine line skeletons and zone rings.

Vision Pro Safari: HTTPS page → ENTER VR → hand-tracking consent. Current browser WebXR does not provide true immersive AR passthrough; in VR the lines are a virtual representation.

Desktop fallback: from the repository root run python3 -m http.server 8000; open http://localhost:8000/spatial-playground/hand-osc-lab/. Move pointer to simulate right fingertip. Desktop poses are not actual hardware tracking.

## Which page should have sound?

| URL (relative) | Purpose | Expected Web Audio |
| --- | --- | --- |
| [index.html](./index.html) | Lab02: hand joints / spatial zones / OSC input diagnostics | **SILENT BY DESIGN** |
| [instrument.html](./instrument.html) | Hand / Synth / Space V2: sustained subtractive voice and space-triggered tones | **YES**; press START AUDIO or ENTER MR; tracking alone now opens a quiet drone, pinch increases loudness |
| [playground.html](./playground.html) | Organic Fields: METAL / ELECTRO / ORCHESTRA map-driven sound fields | **YES**; press ENABLE AUDIO or ENTER MR, then move fingers through rings |

**No Mac, bridge, WSS or OSC connection is required for local browser sound.** The bridge is only for forwarding semantic control events to another program.

### Quick XR sound diagnosis

1. On V2, lower the headset volume, tap **SOUND CHECK**. It plays a standalone 440→660 Hz cue that does not depend on hand tracking.
2. Tap and hold **TEST GATE** on the 2D page to hear the continuous synth. This is a simulated control, not a headset hand test.
3. Tap **ENTER MR / AR**. That user click explicitly attempts to unlock Web Audio, without awaiting and losing transient XR activation.
4. Listen for an entry sound-check cue. Once the hand tracking is valid, a quiet sustained drone should play **even without pinch**; thumb-index pinch boosts it.
5. Inside V2 XR, **green audio-state dot** means running; **amber** means AudioContext suspended (browser/permission problem); **red** means locked or manually muted. If amber, exit XR and tap START AUDIO / SOUND CHECK again.
6. If the XR cue plays but no drone follows, verify that the WebXR interface reports 1–2 tracked hands and 25 joint poses rather than missing hand input.
7. Entering MR never requires Mac OSC. If headset sound still fails, capture browser version, headset model, audio-state dot, and whether SOUND CHECK works *outside* XR.

This addresses the difference between “can synthesize sound,” “has permission to output sound,” and “has tracked hand input to modulate sound.” Do not claim an actual headset fix has been confirmed until it is tested on device.

## What's implemented

- 25 WebXR joint poses **per hand**, 27 line segments, optional miniature joint orientation axes. No mesh, textures, skinning or CDN; transparent WebGL layer in AR.
- Attempts bulk XRFrame.fillPoses() each frame, falls back to getJointPose(). Missing or blocked joints are treated as unavailable.
- 14 derived 3-point bend angles per hand, distances of thumb/index pinch, every joint quaternion orientation in the opt-in full stream. These angles are geometric, not anatomical calibration.
- 3 spherical zones fixed to XR local reference coordinates (meters); index fingertip controls ENTER/EXIT. Different thresholds for entry/exit (9/14 mm initial defaults) and 34ms dwell; both tunable. Tracking lost after 150ms is TRACKING_LOST, never a fabricated EXIT.
- Zone checks occur every tracked XR frame; normal network messages roughly 30Hz, optional full joint stream 10Hz, zone events immediately.
- Locally recorded JSON, no automatic uploads.
- Authenticated WebSocket → Node.js bridge → UDP OSC. Browser cannot send UDP directly.

## Zones

| ID | Center (x,y,z) meters | Radius | Function |
| --- | --- | --- | --- |
| A | (-0.27, -0.28, -0.55) | 0.135m | LEFT FIELD |
| B | (0.27, -0.28, -0.55) | 0.135m | RIGHT FIELD |
| C | (0, -0.19, -0.79) | 0.120m | CENTER TRIGGER |

Values are in **XR local reference space established at session start**, not absolute room coordinates. Change createZones() in engine.mjs to modify them. Anchors and in-headset calibration are future tasks.

## OSC bridge setup (on Mac, Node 20+)

From spatial-playground/hand-osc-lab:

    npm install
    export HAND_OSC_TOKEN="$(openssl rand -hex 16)"
    export OSC_HOST=127.0.0.1
    export OSC_PORT=9000
    npm run bridge

Desktop local page: bridge address ws://127.0.0.1:8787, paste the temporary token; CONNECT, then ARM OSC. Do not make tokens public.

A Quest browsing this GitHub Pages HTTPS URL **cannot connect to ws://192.168.x.x** because of mixed-content restrictions. Use a trusted wss:// endpoint with an authenticated TLS reverse proxy/tunnel that forwards to localhost:8787. Keep the UDP OSC port private. Optional environment settings: BRIDGE_HOST (defaults 127.0.0.1), BRIDGE_PORT (8787), OSC_HOST, OSC_PORT, ALLOWED_ORIGINS, TLS_CERT and TLS_KEY (for direct trusted WSS). If using a proxy, maintain HTTPS/WSS end-to-end and avoid accidentally publishing the bridge.

Max patch routing example:

    udpreceive 9000
       ↓
    oscparse
       ↓
    route pm

Selected OSC addresses:
- /pm/system/connected 1/0, /pm/system/stale 1/0, /pm/system/soft-panic 1
- /pm/hand/left/tracked 1/0
- /pm/hand/right/index-tip x y z
- /pm/hand/right/wrist x y z
- /pm/hand/right/pinch-m meters
- /pm/hand/right/angle/index-pip degrees
- /pm/hand/right/joint/index-finger-tip x y z qx qy qz qw (opt-in full)
- /pm/zone/A/enter "left", /pm/zone/B/exit "right", /pm/zone/C/tracking_lost "left"

For SuperCollider use OSCdef on these addresses. Route one bounded event into audio and visual using the same Show Score payload. Do not map raw position to uncontrolled master gain or unbounded feedback.

## Core safety and performance constraints

- Native XR hand tracking accuracy is not guaranteed by software frame rate or rendering rate. There is no general purpose per-joint confidence in standardized WebXR Hand Input.
- 25 joints != 26 joints; Meta native API may have additional conventions.
- Use headset-refresh-rate acquisition and collision; no artificial smoothing on raw positions before zone tests. Adjust hysteresis and dwell to control jitter/false positives.
- Browser WSS/OSC can become stale; bridge sends stale neutral after 350ms. A physical independent audio emergency mute is still mandatory.
- Quest WebXR Depth Sensing is not currently available under Meta's published web guidance, so physical hand occlusion of rendered lines will not always be accurate.
- No show-readiness claims until Quest and/or AVP real-device testing, latency measurement and independent KILL pass.

## G1 device acceptance

1. Query immersive-ar/immersive-vr support; enter with hand permission.
2. Check both hands show 25 joints and bone lines; compare virtual alignment with visible real fingers.
3. Move index tip slowly across A, B, C at least 10 times and test false events near the boundary.
4. Occlude fingers: tracking lost must NOT emit a fake EXIT.
5. Turn full joint OSC on, verify Max receives positions, bend degrees and zone events.
6. Test 350ms stale watchdog, reconnect, and a genuinely independent hardware panic/mute.
7. Measure actual capture → Mac OSC latency, packet loss and headset framerate. **Not yet measured.**

## Primary sources

- Meta Quest WebXR guidance: https://github.com/meta-quest/2d-web-v0-template/blob/main/docs/QUEST_GUIDELINES.md
- Meta Quest 3/3S hardware: https://developers.meta.com/horizon/essentials/compare-devices/
- WebXR Hand Input 2026 W3C draft: https://www.w3.org/TR/2026/WD-webxr-hand-input-1-20261029/
- Apple WebXR hands: https://developer.apple.com/videos/play/wwdc2024/10066/
- W3C hand bulk API optimization: https://github.com/immersive-web/webxr-hand-input/blob/main/explainer.md


## Hand Seal Trainer / 掌诀训练器

**New independent page:** https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/handseal-trainer.html

- 12 earthly-branch labels are rendered beside the corresponding 25-joint anchors in the existing WebGL hand view.
- Thumb-to-joint contact uses dwell, hysteresis, release/re-arm and tracking-loss reset.
- Guided lessons: all 12 branches, index-finger four-point route, pinky four-point route.
- Sword-finger coach: five explainable pose checks and 500ms stable hold.
- Six 雷诀 source cards from 《道法会元》卷五十四; manual reading checklist only, no lineage or ritual certification.
- Desktop actions are simulated; Quest/AVP hardware accuracy and CJK glyph readability remain unverified.

Technical and source notes: [HAND_SEAL_TRAINER.md](./HAND_SEAL_TRAINER.md).
