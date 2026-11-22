# Signal, pedal and authored-space plan

**Status: original implementation proposal, not installed or hardware-tested.** Read after README.md. The artist's current scope retains EEG and ECG as possible inputs, Ableton as the audio center, Quest / Vision Pro hand interaction, and an existing four-button foot controller whose model and protocol are not yet verified.

## Hardware audit before mapping

Record exact sensor/controller model, available output protocol, driver, sample/update rate, clock, licensing and current working example. Confirm whether the pedal emits MIDI CC, notes, HID keys or proprietary messages. Inspect actual notes/CCs and down/up behavior rather than assuming four buttons correspond to four MIDI channels.

A brain/heart device is not inferred from a neural visual. No EEG/ECG acquisition, data upload or claims of mental-state inference are implied. If the performer chooses real biosignals, process locally by default; keep identifiable raw recordings out of this public repo. Record consent and purpose in private, and publish only sanitized derived technical results.

## Feasible architecture

```
approved biosignal device OR labeled replay/synthetic source
Quest/AVP hand input OR desktop test input
four-button pedal
    -> source adapters, quality/freshness gate, normalized bounded controls
    -> explicit performance state + event identity
    -> Ableton-approved macros and authored cue transitions
    -> visual scene parameters driven by same event identity
```

Use a source label, monotonically increasing sequence, monotonic capture/receive timestamps, quality value and unit metadata. Gate bad/stale/disconnected signals; smooth and clamp after normalization. Timestamp and log the accepted control event, not only incoming sensor data. Do not equate measured heart/EEG features with emotion, attention, disease or a causal neurological claim.

Proposed roles:
- **Hands:** directly legible spatial choices such as spread, density or position, with tracked/neutral states.
- **EEG:** optional slowly changing timbral or spatial bias after verified preprocessing and signal quality checks; never direct master gain or arbitrary section changes.
- **ECG:** optional beat-event or rate-derived modulation, bounded and debounced; artifact rejection is required. Do not label a simulated pulse as a measured heartbeat.
- **Pedal:** dependable intentional structure and recovery, usable even when headset/sensors fail.

No raw EEG/ECG-to-note novelty is accepted automatically. The authored music must stand on its own; input should make one audible structural decision clearer.

## Four-button proposal, verify and rehearse

| Button | Proposed function | Constraint |
|---|---|---|
| 1 | Next authored cue | Edge-trigger, debounce, quantize only where musically appropriate; no repeated advances while held |
| 2 | Hold / alternate phrase | Explicit reversible state; no hidden toggle after source reconnect |
| 3 | Release / return to calm | Known bounded ramp/cue, not random reset |
| 4 | Software emergency mute | Latch; resume requires deliberate separate re-arm and neutral input |

This mapping is only a proposal. Confirm controller protocol and artist comfort first. A pedal-to-computer mute is **not** an independent physical kill: retain a separate accessible interface/mixer mute or output control, and test it. Do not require a long press before emergency mute. Never permit recovery to trigger a held note/gesture unexpectedly.

## Visual fallback hierarchy

1. One authored original spatial structure and fixed readable camera.
2. A licensed anatomical brain model or reconstructed neuronal morphology, clearly an artistic visualization.
3. Tokamak-like original geometry derived from public factual references rather than copying a model of unknown rights.
4. A pre-rendered video synchronized to the approved stereo master when realtime systems fail.

The fallback must preserve intentional form, contrast and source identity; no default spectrum bars, constant camera zoom or perpetual maximal effects. Audio and visual version/cue IDs must match.

## Candidate assets and dependency gates

- **Lost and Found:** reported official requirement Live 12 Suite 12.0+, approximately 1.38 GB download / 2.67 GB installed, 28 instruments and seven racks. Verify current Pack page and actual entitlement on the Mac before installing. A fresh Ableton install does not prove Suite availability.
- **DM ARP 2600 Drums:** candidate for a lower-edition percussion route; reported minimum Live 9 Intro 9.0.1+. Verify installed edition and official listing. Do not silently purchase missing content.
- Use authorized Ableton sounds in original composition under applicable terms; do not redistribute raw Pack libraries or demo songs.
- [Brain for Blender](https://brainder.org/research/brain-for-blender/): anatomical OBJ/PLY candidate, CC BY-SA 3.0; retain provenance and attribution and meet share-alike obligations for adapted assets. Not neural activity data.
- [NeuroMorpho terms](https://neuromorpho.org/useterm.jsp): morphology candidates, CC BY 4.0; preserve per-neuron dataset/citation. SWC geometry is not a functional neural signal.
- ITER printable model archive has been located, but performance/commercial reuse rights are not yet verified. Do not include it as an open-licensed production asset without permission or a verified license.

The pack/asset researcher should append exact checked page/version/license evidence before production use. Never infer the artist's intended Chinese music reference from uncertain transcription; ask for a link or exact name while continuing independent sound production.

## Headset caveat

Quest WebXR immersive-ar supports passthrough on supported versions. Vision Pro native visionOS and Safari WebXR have different capabilities; do not assume a Safari immersive-vr hand session exposes passthrough or that a native experience is already implemented. Verify actual OS/browser, session mode, hand permissions, room visibility, stereo and recovery on each device. Canvas2D/mock results do not pass XR.

## Minimum proof

One 60–90 second accepted audio excerpt; one intentional pedal event visibly and audibly changes the same authored state; unplug each optional source and confirm neutral behavior; mute/re-arm cannot retrigger stale input; stereo/video fallback starts without the headset. Only then expand biosignal complexity.

## Existing hand tracking and parallel ownership

The artist confirms Quest hand tracking already works; the current gap is interaction detail. Do not rebuild the recognition baseline or describe it as wholly absent. Inspect the existing Hand Lab input and stability code and current open work. Capture the working version before changing behavior.

Parallel work is useful only with isolated ownership:
- DAW owner: Ableton set, instruments, arrangement and audio exports. Only this owner writes the active set.
- Interaction worker: existing hand/pedal mapping, held-input release, quality/freshness, mute/re-arm and recovery tests in a separate branch. No changes to DAW content.
- Visual worker: one licensed/authored scene and shared cue adapter, with desktop evidence first and headset-specific claims separately.
- Integrator/reviewer: pin source commits, combine accepted branches, exercise one shared event and fallback, then assemble one review package. Do not mark success from individual workers' reports alone.

The initial parallel outputs should be a real listening render, tested mapping/recovery behavior, and a visible original spatial scene. A task list is not any of those outputs. Do not block actual DAW production on speculative biosignal gear or another general framework.

## Existing bridge preflight findings (source audit, not runtime reproduction)

A parallel read-only audit reported the existing Hand Lab bridge already handles semantic performance gate/cutoff/resonance/wet/spread/energy/drive/hold messages, with stale input handling. Reuse the viable V2 performance-event route after checking current source rather than rebuilding transport.

Reproduce these findings against the exact branch chosen for integration before claiming a fix:
1. Legacy zone event construction may overwrite the transport type with ENTER/EXIT, while the bridge checks incompatible type conditions. Confirm actual serialized payload and route.
2. Held TIMBRE_CHANGE input may retrigger after its cooldown because release re-arm is absent.
3. Local audio mute may leave OSC output armed. Ensure latched panic disarms the entire performance route; neutral input and explicit re-arm are required before resuming.

Ableton remains musical clock authority. Do not describe a browser timer as verified Link synchronization. Coordinate fixes with the current interaction worker; this document does not modify those modules or assert hardware tests passed.
