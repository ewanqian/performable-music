# Critical Field: focused A/B and shared-event runtime

Experimental signature-scene revision; **human musical acceptance pending**. The baseline was rejected by the user because suspension did not establish expectation. No new piano loops, paid plugins, Ableton edits, or full-show expansion.

## Reproduce

Dependencies already present on the tested machine: Python 3, numpy, scipy, soundfile, aiohttp, jsonschema, FFmpeg; official SuperCollider 3.14.1. Python synthesis source is original. SC plays the generated original buffer, synthesizes the extended HOLD resonance, and applies bounded width/gain/mute. It is not an all-SC composition renderer.

From repository root:

```sh
python3 performances/2026-12-03-phase-01/pressure-test-001/render.py
python3 performances/2026-12-03-phase-01/pressure-test-001/runtime/render_ab.py
python3 performances/2026-12-03-phase-01/pressure-test-001/runtime/conductor.py
```

Separate terminal, using this machine's existing official workspace-local installation:

```sh
local-only/toolchains/SuperCollider.app/Contents/MacOS/sclang -D performances/2026-12-03-phase-01/pressure-test-001/runtime/audio.scd
```

The patch quotes its bundled scsynth path. For another installation, change only `appPath` in `audio.scd`. Default audio output is the machine's selected device. Tested: macOS 26.7.2, SC 3.14.1, 48 kHz, hardware buffer 256, stereo output `外置`, input buses 0. No venue multichannel output tested.

Lower listening level, then explicitly arm:

```sh
python3 performances/2026-12-03-phase-01/pressure-test-001/runtime/control.py arm
```

Open `http://127.0.0.1:18080/`. REC & START records SC WAV and WebGL canvas video separately. Press OVERRIDE during HOLD: event queues to a safe bar boundary, never before score time 45s. Score holds at 45 until a button event. STOP saves the video. This is a desktop button, not a physical footswitch or tracked hand.

REC & REPLAY reads a session's **saved frame log**, preserves event IDs, changes session ID and source to REPLAY, then replays recorded wall-time spacing. Its source session input refers to local ignored evidence; the default is the actual first live test. Regenerate a new session before using this on another checkout. The recorded material version is identified in the audit; replaying score against revised B audio is intentionally not a bit-identical audio replay.

Independent terminal software mute (works without browser or conductor):

```sh
python3 performances/2026-12-03-phase-01/pressure-test-001/runtime/control.py kill
```

Latch requires explicit terminal ARM. It shares the OS/audio process: **not an independent physical safety path**. SC checks frame freshness every 50ms and gates off after 750ms without accepted frames. Visual has its own 750ms check. Controls are clamped/smoothed, master bounded, limiter 0.7; no feedback path.

## A/B composition

Both 78.75s / 128 BPM. Edit region only 31.875–52.5; the raw source outside it is identical. Constant master gains for loudness matching necessarily change absolute levels elsewhere. Neither version is approved music.

A establishes D–Eb–A twice, then omits A, reduces register, leaves 0.9375s silence. OVERRIDE supplies the missing high A over tuned D bass; the first four bars use statement/gap/answer.

B remembers the same cell but progressively delays its answers; the last answer is absent. Silence 1.40625s, short fracture followed by bass 45ms later, fewer displaced responses. No reverb or drum-density buildup. Both use the same original FM/inharmonic voice identity, not random piano variations.

Outputs: `outputs/{A,B}.wav`, neutral preview files `Listening_01.mp3` and `Listening_02.mp3` (29–55s). Mapping is local `evidence/blind-key.json`. Matched integrated loudness −19.00 LUFS; true peaks −2.99/−3.09 dBTP. These measurements do not establish aesthetic quality.

## Evidence and testing

See `AUDIT.md`, `TEST_RESULTS.json`, `audio-tests.json`. Full ignored evidence: `evidence/conductor.ndjson`, SC WAV, WebGL WebM, muxed `audio_visual_event_demo.mp4`, failures and screenshots. Video is 92.5s because the live performer waited through the held score boundary; scene remains 78.75 score-seconds. Mux timing is approximate (recorder/capture startup receipt estimate); acoustic-to-display latency has not been measured.

```sh
python3 -m py_compile performances/2026-12-03-phase-01/pressure-test-001/runtime/*.py
node --check performances/2026-12-03-phase-01/pressure-test-001/runtime/visual.js
python3 performances/2026-12-03-phase-01/pressure-test-001/runtime/verify.py
```

Recovery tests require this owned runtime running and no current capture. `test_recovery.py manual` records a software KILL while fresh frames continue. `test_recovery.py disconnect` SIGSTOPs only the matching conductor and leaves it paused so visual SAFE can be inspected. Always follow with `test_recovery.py resume`, which mutes SC before resuming the process. Keep these development tests out of a performance run.

Shutdown this test engine with `control.py quit`; stop conductor with Ctrl-C. Existing Ableton sessions remain untouched.
