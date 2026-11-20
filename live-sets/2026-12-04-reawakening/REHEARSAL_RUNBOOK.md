# Arrangement Master R0 — real Ableton build + three rehearsals

## Build in an independently saved Mac Live Set (sole current DAW owner)

1. Record real Live version, license status, audio interface, sample rate, connected device names and exact current source hashes. Copy `FUSU` to a **separately named rehearsal Set** using Save As, or use the existing portable Audio-only Set; never overwrite the active owner’s production master. Private audio stays private.
2. Set an auditionable audio-only skeleton with tracks `01_M0_SUB`, `02_M0_BODY`, `03_M0_TEXTURE`, `04_M3_PIANO_DRY`, `05_M3_ELECTRONIC`, `06_M3_TAIL_HOLD`, `07_CUE_GUIDE (muted/not sent to PA)`, `08_REF/SAFETY`. Actual names and stem counts may differ; use these **roles** rather than fabricate nonexistent files. If reusing M0/M3 4-stem sources, keep known package alignment, common t=0 and intended Warp Off.
3. In Session View prepare **logical cue names** `S1 IN`, `S2 PIANO`, `S3 TAIL`, `S4 PRESSURE`, `S5 IMPACT`, `S6 RETURN`, `SAFE`. These are cue *labels*, not permission to play all scenes. Put one-shot full piano phrases in non-looping audio clips with Warp Off; electronic sustain uses its own separately tested loop or an actual rendered longer source.
4. Route cue controls: `FOOT 1 → NEXT_REQUEST (deferred queue)`, `FOOT 2 → tail Hold/Release`, `APC → explicit fallback/preset preview`, `XL faders → individual bus/FX controls`. Until the scripted NEXT queue receives external requests reliably, **make next a human-operated request in rehearsal**. Do not map APC directly to a playing piano Scene.
5. Keep **one true musical time authority**: Ableton. Arrangement/Session positions must be reconciled before writing any shared Show Score cue. Current M3's nominal `120 BPM` is an engineering coordinate, **not a requirement that the piano be beat-warped**. Use the scene strings already in Show Score v2: `INITIAL_CONDITION`, `FIELD`, `OVERRIDE`, `AFTERIMAGE`.
6. Prepare named **music-only** stereo fallback bounce and physical audio mute check. Prepare visual-only blackout at the final Windows output; ensure Show Score `safe.kill` is not misused as visual blackout. No audio/visual engine rewrite.

## Rehearsal A — now: musical identity (approx 4–6 minutes)

- Play M3 dry/with electronics **and** M0, independently, without visuals. Mark one exact portion `KEEP / REVISE / REJECT` with source package and timecode. Listen to M3's original full phrases, not just a new synthetic short loop; M0 focus around its sustained 80–110s region.
- Choose **only one accepted source** for a first real live demonstration. Play it twice with different tail durations/entry spacing. Record actual audible two takes and a cue log. Compare, for instance, the existing M3 *early 110.028s* and *late 140.968s* system examples as technical evidence, not artist-approved performance.
- Pass: two differences are audible and musical, a natural end, no burst/glitch or accidental piano cutoff. Otherwise revise the source; do not multiply styles to compensate.

## Rehearsal B — after you attach Quest / pedal / MIDI (isolated 10–15 minute commissioning)

- First pedal on Mac only, next APC only, then XL; note exact device and MIDI messages. If foot is latching, normalize it to idempotent commands rather than assuming momentary Hold.
- Quest WSS → existing WebXR bridge → **free diagnostic UDP port** → OSC probe: verify connected, tracked, pinch/zone, lost and neutral states. Do not run two listeners on the same port. First route Quest to **visual only**.
- During M3 full phrase, press NEXT early, twice, hold and release; it must change only at the **end of the complete phrase**, or queue safely. Check a single owner when foot and APC are pressed simultaneously. Test unplugged Quest and Wi-Fi interruption; music should continue and XR visual should neutralize.
- Test real independent audio mute with actual speakers safely attenuated and a separate visual-only blackout. A browser `panic` or software stop is not an independently verified physical KILL.

## Rehearsal C — six-block operator run (30-minute budget)

- Use `rehearsal-console.html` to follow **six ~5-minute targets**. Music may legitimately be shorter: if the available approved source is <30 minutes, mark missing chapters as **silent cue/operator drill** instead of calling it a finished concert.
- Change sections **manually**, never via a timer. Preserve one substantial bare piano appearance, one sparse low-body region, one earned principal intensity core, and a return to near stillness.
- Log real start, section transitions, Hold/Release, lost tracking, manual recovery, musical exit, actual performance duration, audio recording path, audio package hash and visual build hash in the private rehearsal receipt. The browser console log only proves operator decisions in its own simulation.
- Run a second pass with different Hold/NEXT choices. Compare changes in form, not just brightness or a filter sweep. Keep one known-safe fallback `stereo full-set bounce` on a separate playback route only after it exists and has actually been checked.

## November 18–25 sequencing (no extra plugins required)

| Window | Primary output | Gate |
| --- | --- | --- |
| Nov 18 | M3/M0 listening, portable set reopen, A rehearsal | Confirm actual local sources; M3 artist listening, M0 native reopen |
| Nov 19–20 | Foot/APC/XL MIDI readback; Quest isolated OSC signal, first visual-only mapped gesture | No collision, no false scene cut, real fail-safe |
| Nov 21–23 | One 4–6 minute live version from **accepted** material with two audible takes | Musical KEEP + reproducible control |
| Nov 24–25 | Expand accepted material and transitions, draft full cue rehearsal | Preserve 28+2 budget without fake looping |
| Nov 26–Dec 02 | Longer rehearsals, actual Windows sync, loudspeaker checks, failover and freeze | Show-readiness evidence required |

## Actual device evidence form (private; not commit IP/tokens)

```
Date / operator:
Live / Max / bridge versions:
Mac audio device / sample rate / buffer:
M3 package + SHA-256:
M0 package + SHA-256:
Foot pedal model / port / Note-CC / channel / press / release / latch?:
APC model / port / assigned cue pad / last tested?:
LCXL model / port / parameter pickup behavior?:
Quest model / browser / XR mode / WSS success / hand-loss test?:
Music scene/clip NEXT queue result:
Tracked-to-visual latency measured by:
Foot-to-musical-cue latency measured by:
Independent hardware audio mute tested?:
Visual-only blackout tested?:
Take A duration / file / audible verdict:
Take B duration / file / audible verdict:
Recovery / failure notes:
Decision: KEEP / REVISE / REJECT / BLOCKED
```