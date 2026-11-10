# Hand / Synth / Space — quiet idle and finite resonance

Date: 2026-11-11 (Asia/Shanghai)
Source baseline: `0e57c53601892c24b87bcabad1101b8addb34879`
Scope: `instrument.html` and its shared FieldSynth Web Audio layer. The sensor-only `index.html`, OSC bridge, hand geometry and performance parameter names retain their behavior. Gestural Atlas, Neural Field and archived Sigil import the same FieldSynth and inherit its finite envelopes and sound materials; their shared API remains compatible. Their other audio engines, where present, are unchanged. Gesture Dynamics uses a separate score engine.

## Root cause and change

The previous `Math.max(gate, presence * .40)` opened the audio envelope as soon as a hand was tracked, feeding a sawtooth and a 55 Hz lower oscillator. Relaxing the hand therefore did not silence the instrument.

The local audio now requires an intentional gate edge or zone entry. Each pinch excites one bounded resonant phrase: porcelain (inharmonic clear partials), string (soft harmonic partials), or air (filtered breath and pitched partials). The longest source envelope is 2.2 seconds, with an additional 0.65 second bounded delay window. A release closes the source within 0.12 seconds and the delay window within 0.42 seconds. Continuous hand presence does not trigger or sustain sound. A bilateral OSC HOLD does not convert the local voice into an endless drone.

Zone entry plays soft D/G/A contacts; zone exit retains the visual and OSC event without an extra low thump. XR entry arms audio quietly. SOUND CHECK remains an explicit audible test. Volume is user controlled (default 36%, maximum 65% of this app's master gain); it is independent of system volume.

Audio startup checks the actual AudioContext state. A failed or still-suspended context is not labeled ready. An in-progress unlock cannot override a later mute. Hidden pages and XR exit mute the output; a stopped sensor stream releases after approximately 320–480 ms. The phrase also has an audio-clock end, so a stalled rendering loop cannot leave continuous excitation running.

## Verification performed

- `node --check instrument-audio.mjs` and `node --check instrument-ui.mjs`: passed.
- `node --test instrument-audio.test.mjs instrument-gesture.test.mjs`: 18 passed, 0 failed.
- Nine audio regressions cover tracked idle silence, finite held contact, release inside a throttled frame, lost tracking, re-trigger after release, mute/resume, suspended startup, mute during startup, and bounded materials/volume.
- Existing hand geometry and OSC-facing mapping tests still pass.

The 18 unit tests inspect AudioParam scheduling and lifecycle in an instrumented context. They do not by themselves render PCM or prove sound quality.

The root reviewer additionally ran the temporary validation page in a real browser: **7/7 native OfflineAudioContext PCM checks passed**, 48 kHz, stereo, 5 seconds per case. A thin adapter supplies only offline lifecycle and scheduling time; oscillators, filters, gain envelopes, compressor, delay and output rendering are real browser DSP.

| Actual PCM case | Absolute peak | Whole-buffer RMS | RMS from 4 s onward |
| --- | ---: | ---: | ---: |
| Tracked idle | 0 | 0 | 0 |
| Porcelain held | 0.0882074 | 0.00718763 | 0 |
| String held | 0.0656304 | 0.00608062 | 0 |
| Air held | 0.0387459 | 0.00259594 | 0 |
| Release and tracking loss | 0.0896747 | 0.01404997 | 0 |
| Panic twice then resume | 0.0896751 | 0.01386594 | 0 |
| Cancel future zone then resume | 0 | 0 | 0 |

All samples were finite and below clipping. The held materials reached exact zero in the measured final second. A cancelled, future-scheduled zone note stayed exactly silent after resume. This is machine PCM verification, **not artist listening approval or physical headset verification**. Browser console inspection found only an extension metadata error, not an application exception.

## Browser and headset listening procedure

1. Open `instrument.html`, click START AUDIO: no background tone.
2. Press PLAY once, release; repeat for 瓷 / 弦 / 息. Listen for clearly distinct materials, no clicks and a quiet gap.
3. Hold PLAY for five seconds: the phrase finishes by itself and does not retrigger. Release and press again to make a new phrase.
4. Move into A/B/C; each entrance gives a soft contact. Leaving does not thump.
5. During a phrase press MUTE, hide the page, or exit XR: output closes. Resume does not replay the previous held note.
6. On Quest/AVP, compare relaxed tracked hands, a deliberate pinch, bilateral HOLD and temporary tracking loss. Verify sound unlock, click-free transitions, actual comfort and per-device performance.

Physical Quest/AVP listening, perceived audio quality and roundtrip latency remain unverified in this change. Gesture Dynamics' optional 96 BPM backing score is a separate demo and has not been silently rewritten as part of this repair.

Verified synthesis source SHA-256: `29161f66b0a50bf52e22f65a6d87c96b9800d2289dc18fbbaeb31e91ed7c7227`.
# Publication dependency correction

The XR catalogue audit checked 20 HTML entry URLs and followed the local import graph of the 19 Performable Music entrances (63 reachable source files). All HTML titles matched, but the published `protocols/show-score.mjs` returned HTTP 404. Spatial Studies and both Gestural Atlas pages import it through `studies-engine.mjs`. The Pages workflow now copies this exact public module and watches it for changes. Deployment and live verification must confirm a JavaScript response; an HTML 200 alone is not an application check.

