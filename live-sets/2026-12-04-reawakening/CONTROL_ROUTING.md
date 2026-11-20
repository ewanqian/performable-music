# Arrangement Master R0 — input ownership, arbitration and signal test

**Status: routing design / unverified physical map.** Do not activate all inputs against the current production `.als` at once. Audition one verified route at a time in a saved duplicate.

## Authority diagram

```text
Mac M1 Pro / Ableton (arrangement, audio, transport, scene authority)
    ↓ authored musical cue / actual MIDI / score → [existing Show Score v2 adapter]
    ├── safe bounded audio performance controls (M4L or verified MIDI mapping)
    └── Windows RTX 4080S / existing visual runtime (stone, lighting, HUD)

Quest 3 / OIC / WebXR hand joints → authorized WSS → existing hand bridge
    → OSC UDP /pm/... → input arbiter → bounded visual controls (primary)
                                            └→ one optional sound macro AFTER QA
Four-switch foot → Mac MIDI (actual notes/CC unknown) → manual request queue
APC mini → Mac MIDI → button/cue requests, NOT raw uncontrolled scene launch
Launch Control XL → Mac MIDI → designated sound-layer/FX only
Independent physical output mute → actual audio interface / mixer (NOT web)
```

### Source data already defined in existing bridge

`spatial-playground/hand-osc-lab/bridge.mjs` currently defaults to `127.0.0.1:8787` for its local WS listener and `127.0.0.1:9000` for outbound OSC. Messages include `/pm/hand/left|right/tracked`, `/pm/hand/*/pinch-m`, joint positions, `/pm/system/connected`, `/pm/system/stale`, `/pm/perf/{gate,cutoff,resonance,wet,spread,energy,drive,hold}`, and zone events. These are **existing code paths**, not evidence that Quest or Ableton received them. The web bridge can neutralize external `gate` and `hold` after stale; **do not use those raw paths to control the M3 long-tail Hold** unless an independent tested latch/arbitration policy is installed.

## Ownership matrix / first pass

| Performance intention | Primary owner | Backup, only when explicitly disarmed | Music | Visual | Collision rule |
| --- | --- | --- | --- | --- | --- |
| `NEXT_REQUEST` | Foot switch 1 (actual MIDI learn pending) | APC designated request pad or keyboard | Cue queued for **whole-phrase end**, not direct scene jump | visual chapter changes only upon actual accepted musical cue | One pending request ID; duplicates ignored |
| `TAIL_HOLD` / `TAIL_RELEASE` | Foot switch 2 (momentary vs latch must be measured) | APC/keyboard | Independent electronic tail only; never halt piano playhead | may follow actual status | Foot owns while active; headset cannot write this latch |
| `SUB_BODY` | XL fader 1, bounded trim | DAW automation with explicit takeover | Parallel low-frequency body, not master | may read value for intensity | Manual pickup/no sudden jumps |
| `PIANO_ELECTRONIC_RESPONSE` | XL fader 2 | DAW automation after takeover | M3 electronic reply gain | subtle distance response | Does not control piano dry gain |
| `TEXTURE` | XL fader 3 | DAW automation after takeover | Grain/rough component | texture image may follow | No duplicate Quest audio writer |
| `SPACE_SEND` | XL fader 4 | DAW automation after takeover | bounded return/send; low gain at soundcheck | separate visual space | Bounded and smoothed; no uncontrolled wet feedback |
| `VISUAL_SCAN` | Quest tracked right-hand position/gesture | Windows visual keyboard | **none** initially | scanner direction/trace | On tracking loss, neutralize scan; do not fire a new cue |
| `VISUAL_DISTANCE` | Quest left-hand movement | Windows visual automation | **none** initially | stone light/distance | Sensor smoothing/hysteresis; no camera teleport |
| `VISUAL_BLACKOUT` | Physical Windows keyboard / show output controller | local visual operator | **none** | all visual layers black at final output | Highest priority, must not change `safe.kill` |
| `SOFT_STOP` | Verified Mac audio button / accessible local UI | host keyboard | fade/stop configured music sends | optional separately-sent visual state | Not a substitute for physical kill |
| `HARDWARE_AUDIO_MUTE` | Independent actual output mute / interface / mixer | none | immediate actual output silence | independent | Remains available with network and app down |

APC mini remaining pads are optional *manual source preview / visual cue* slots only once no other source owns the same target. **Do not bind raw APC Scene Launch to M3 NEXT**: the tested NEXT behavior currently exists in a scripted deferred queue, and uncontrolled direct launch bypasses it. Do not infer that pedal keys 1–4 have particular MIDI values, polarity or latching behavior.

## Arbiter contract — before physical enablement

1. Each semantic target has **one active writer** and an explicit backup that requires manual handover. No `last packet wins` between XL/Quest/DAW.
2. Button actions carry `(source, event_id, session_id)`. Debounce foot bounce, dedupe the same request ID, and prevent a second `NEXT` until the first is accepted or canceled at a verified phrase boundary. Preserve the M3 phrase; neither global quantization nor a 5-minute mark defines that boundary.
3. Continuous XR signals use input confidence, hysteresis/dead zone, smoothing, 0–1 clamping and per-target safe min/max. When hand data stales, **fade/neutralize only XR-owned visual outputs**; don't automatically stop a music tail or transport. Respect bridge stale watchdog (~350ms source-side), and independently measure effective receiving timeout.
4. Source order for **music**: physical safety > explicitly-armed Mac manual control > foot request > APC backup > pre-authored automation; XR has no transport, master, kill or NEXT permission. For **visuals**: physical blackout > authored cue > tracked hand where assigned > neutral default.
5. If wanting a *single gesture* to influence image and sound later, create **one normalized semantic event** with one bounded fan-out, not two independent MIDI/OSC mappings. First stage test is **visual only**.
6. `safe.kill=true` in Show Score v2 means global kill. To black the image without stopping sound, route a separate local visual command/event; do not fake `safe.kill`.

## Mac + Quest signal-only smoke test

- Verify one private trusted WSS path from Quest HTTPS page to existing bridge; **never expose UDP or tokens publicly**. If Quest uses the published HTTPS page, plain `ws://192.168.*` is blocked by browser mixed-content policy; use a trusted WSS endpoint.
- Make a **temporary, unused test OSC port** (e.g. `9001`) rather than binding a second listener on the active `9000`. Start `node osc-probe.mjs --port 9001`; start the existing authorized bridge with `OSC_HOST=127.0.0.1 OSC_PORT=9001` only for this isolated test. This temporarily diverts OSC to the probe and **does not reach Ableton or Windows**.
- On Quest, verify `tracked 1`, joint/position messages, pinch values, deliberate zone event, then remove one hand/close the browser and verify `tracked 0`, `stale 1` and gate neutralization. Log observed version/latency; do not claim tests passed by reading a terminal alone.
- For pedal/APC/XL, use Ableton MIDI preferences and its incoming MIDI indicator on a duplicate set. Record exact `device/port/channel/message/number/value/release` for each foot press/release, plus whether it sends Note, CC or Program Change. **Probe does not listen to MIDI**.
- Only after each path works separately: enable the arbiter, test single-writer locks, disconnected Quest, foot double tap, an unplugged pedal and independent output mute. Measure click-to-Ableton, headset-to-visual and cue-to-frame latency independently.

## Source and time truth

Source names remain `hand`, `foot`, `button`, `osc`, `clock`, `system` as defined by [Show Score v2](../../protocols/show-score-v2.schema.json). Do not mark direct physical MIDI as `osc` unless it actually arrived by OSC. The stage adapter preserves physical MIDI origin in its private sidecar. Show Score `t_ms` measures monotonic session time; source clip time and render-frame time are separate according to [handoff contract](../../production/the-point-2026-12-04/HANDOFF_CONTRACT.md). No global 100/120/128 BPM assumption is allowed.