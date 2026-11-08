# HAND / SPACE / OSC · Spatial Playground Lab 02

**Status:** Three separate pages exist (sensor baseline / sustained Web Audio synth / Organic Fields sound maps). Code and source-level tests have been committed; real Quest/AVP audio, hand latency and stage quality are **NOT yet hardware-verified**. No raw camera access, no room-scale anchor persistence, no physical KILL.

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
