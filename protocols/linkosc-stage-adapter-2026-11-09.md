# LinkOSC → Performable Music: receiver and stage adapter

**Source of truth:** https://github.com/daitomanabe/link-osc-app/blob/main/OSC-SPEC.md (inspected spec version **7**, described as app v1.0.19).  
**State:** adaptation design, not a claim of running LinkOSC on the performer Mac.

## Different jobs

**Authoritative Show Score/DAW** = composition/transport, quantized cue identity, exact MIDI/percussion events and scene authorization.  
**LinkOSC** = live Ableton Link Audio signal-analysis and optional OSC tempo control.  
**Metal/GLIC** = image processing/render.  
**Syphon (optional)** = cross-application image transport, not an audio-analysis dependency.

## Wire protocol and receiver

OSC 1.0 over **lossy UDP**, 60Hz analysis sender, `/ping` every 500ms. Normal messages use `i`/`f` types. Optional `#bundle` mode must be parsed **only when enabled**, with bundles chunked <=1400 bytes. Streams have idle suppression, so an absent stream does NOT imply silence. Consider sender stale after **2s without any packets including /ping**.

Receiver pattern:
- A **latest-value store** overwrites continuous `/fft`, `/vol`, `/pfft`, `/pvol`, `/hpss`, `/novelty`, `/chroma` etc.
- A bounded **event queue** handles `/beat`, `/attack`, `/pattack`, `/section`. No blocking in render callback.
- Mark source/provenance and wall/monotonic receive time separately. Tolerate packet loss/reordering and avoid infinite buffering.
- Never use arrival of `/fft` as the render or musical beat clock.

| Address | Actual semantics | Permitted role |
| --- | --- | --- |
| `/pattack` | detected percussive onset, strength ≈1–8 | local transient accent; **not a guaranteed kick/snare label** |
| `/pvol` | normalized percussive energy | light/mesh envelope |
| `/hpss` | [harmonic energy, percussive energy] normalized | material balance |
| `/novelty` | short-term spectral novelty | bounded image transition suggestion |
| `/section` | detected bar-head arrangement difference with signed band deltas, after judge window | aid to manual chapter decision, **not automatic guaranteed downbeat** |
| `/beat` | integer 0–3 from Link beat timeline; **OFF by default** | beat-phase convenience after operator enables it |
| `/note` | only in sender **development mode** | never rely on it as live DAW MIDI input |
| `/ping` | 1 every 500ms | liveness |
| `/fft` / `/pfft` | 128 normalized linear bands | spatial density, NOT decorative frequency bars |

## Timing caveat

Link Audio network buffering may be ~100ms, and the 2048-sample analysis window is ~43ms at 48kHz. `/beat` is transport-based and is NOT delayed like analyzed audio. Do not use onset-analysis timestamps for sample-accurate sound triggering. Meter actual audiovisual offsets; manual authored cues should use a common musical clock.

## Internal mapping example

- `/pattack` → `audio.percussion_onset` with measured strength; do not mint a false `kick`.
- Actual DAW/MIDI kick → `music.drum.kick` / stable Show Score `session_id + seq`.
- Performer FOOT → authorized `OVERRIDE` state at a quantized boundary; one event changes sound arrangement and Metal visual state.
- Continuous `/novelty` and `/hpss` → smooth, clamp, dead-zone → visual shader uniforms only.
- Stale receiver → freeze or neutralize visuals; never change DAW master gain or master clock unexpectedly.

## Implementation instruction for OpenCode

Read the exact upstream OSC-SPEC.md first and use its local `tools/osc_monitor.py` for protocol comparison. Do not reimplement LinkOSC itself. Add an adapter to the existing `protocols/show-score.mjs` / stage conductor rather than inventing competing clock logic. Supply recorded, replayable synthetic OSC messages, expected values, packet-loss tests and one end-to-end real Mac capture. Preserve source truth distinctions (`MEASURED` / `RECORDED` / `SYNTHETIC`).
