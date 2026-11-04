# Actual run audit — 2026-11-04, Asia/Shanghai

STATUS: REAL RUN for technical integration. Musical acceptance PENDING.

SC VERSION + AUDIO CONFIG: official local 3.14.1; macOS 26.7.2; 48 kHz, 256 hardware samples, stereo `外置`, 0 input buses. Buffer assets are 44.1 kHz and resampled by BufRateScale. Browser WebGL used; Jitter/AVP/venue surround NOT RUN.

## Safe sync

Main safely synchronized to GitHub main `6797f539fbd79a2cda3b2125a5455d9e79c071ca`. Fetch then rebase skipped an equivalent deployment patch. Prior working files and ignored old audio were archived under `local-only/backups/before-pressure-test-20261103T172916Z/`. Backup branch and stash `e9a5db7d484a901ee31601ad6daeb2f16a6af95c` retained. Restore audit: 29 original files identical; one CSV original additionally preserved separately. Three previously untracked documents already existed upstream; those were not overwritten. Prior ACKNOWLEDGEMENTS edit and `studies/agent-engine-compare/` retained. No push.

## Baseline and musical finding

Ran the requested original render.py successfully: 78.75s, 44.1 kHz stereo reference WAV plus four aligned stems. Peak −3.93 dBFS, RMS −21.16 dBFS.

**Actual user listening:** “悬置不够悬，冲击没有被期待”; subsequent feedback: current result looks/feels bad and unlike human work. This is the authoritative rejection, not a passed review.

**Source/measurement inference:** original suspension continues regular 3.75s kick cues and stays near −25.3 dBFS RMS across most of its length; it reduces level without developing a clear incomplete proposition. Long tails bridge the impact. The first impact shares vocabulary with later repeated hits. These are hypotheses explaining the user's response, not claims of model hearing.

**WHAT I HEARD:** no direct model audition available. The attempted media input returned unsupported audio. Audio rendered, inspected numerically, and supplied for human audition. No claim that the revision sounds good.

A first sparse A/B was preserved under ignored `evidence/superseded-first-ab/`. Following user feedback, revised A/B establish and withhold an identifiable D–Eb–A answer. A uses stable repetition/omission; B delays the answers and extends silence. Only 31.875–52.5 changed before matching. No extra piano loops, reverb buildup or added drum-density buildup. The remaining reference material is still a sketch.

AUDIO A PATH: `outputs/A.wav`; AUDIO B PATH: `outputs/B.wav`. Two neutral previews cover source 29–55s; original 45s event is at preview 16s. Audition without video first. Loudness −19.00 LUFS each; peak −2.99/−3.09 dBTP.

## Actual integration

First capture failed due to SC recorder/server allocator collision. Preserved. Fixed Server.default and explicit RootNode(s). First successful live-button capture `cf-88b6960e25` used the earlier B material and original ring visual; it proved the event path but is not the final revision demo. A harmless attempt to free the already expired pre-event node produced `/n_free Node 1003 not found`; fixed node registration/onFree before replay.

Final replay `cf-7bc7e9cecb` uses the revised B buffer and ribbed-field WebGL, with 1,758 previously recorded score frames and no headset input. An extra explicit STOP adds the 1,759th verified frame. This proves score replay, not sample-identical audio replay.

SCORE EVENT SAME FOR SOUND AND VISUAL: yes, `cf-88b6960e25-override`, sequence 964, score time 45000ms. Canonical replay-frame SHA256 `c7cd343efc460564c2e2f43f20a3eb60775806834ccf9fc2c195494df651b4a3`. SC event-applied once; WebGL acknowledges once after issuing actual draw. Two repeated copies rejected by SC; browser deduplicates too. Receipts after send: SC ~0.445ms, visual ~28.899ms. These are loopback application timings, not acoustic/display latency measurements.

The event stops the held pre-event sound, starts the original OVERRIDE audio at buffer 45s, and expands/fractures the same visual field. Shared `space` controls SC stereo width and geometric extent. Audio is generated in SC, not secretly in the browser. Geometry is a technical spatial prototype, not approved stage art.

SC actual replay recording: 92.64s stereo48k, peak0.35993, RMS0.037997. Actual canvas VP8 capture muxed with SC recording into `evidence/audio_visual_event_demo.mp4`: 960×540 H264 + stereo48k AAC, 92.515s. Audio offset estimated +0.099969s from startup receipts; no sample-accurate AV claim. Raw WAV/WebM retained.

## DISCONNECT + MANUAL KILL

Terminal software kill session `cf-fc2ce0c2e5`: fresh sequence115→154 continued after independent terminal OSC KILL; latch observed; before RMS0.014524, final1.2s RMS0. Exact silence verified in recording. PASS for software path only.

Conductor SIGSTOP session `cf-88f462b438`: before RMS0.014550; final0.5s RMS0, independent SC watchdog logged SAFE. Browser observed SAFE/NEUTRAL while sender paused; screenshot `evidence/disconnect-safe.png`. Sender safely resumed after separate kill. PASS for process-stall protection. A hardware network disconnect and physical pedal/analog mute were NOT RUN. No physical safety acceptance.

Static Python compilation, JavaScript syntax and saved-evidence verifier passed. Latest SC run has no server FAILURE lines. Full receipt/audio logs local and ignored. Physical kill, venue system, actual hand/foot input, AVP, Jitter, multichannel, human quality remain NOT RUN/PENDING.

## Exact files changed

New runtime sources: `.gitignore`, `render_ab.py`, `audio.scd`, `conductor.py`, `control.py`, `index.html`, `visual.js`, `test_recovery.py`, `verify.py`; documentation/results: `README.md`, `AUDIT.md`, `REVIEW.md`, `TEST_RESULTS.json`, `audio-tests.json`. New research acceptance matrix, wrongbook and prototype scorecard record narrow technical scope. Original baseline render.py unchanged. Generated baseline WAV/stems and runtime outputs/evidence ignored. Prior unrelated changes preserved; no Ableton/Max session modified.

USER DECISION NEEDED: blind audition; does either create an expected arrival before the hit? “Neither” is valid. No automatic expansion after this test.

NEXT ONE TASK: develop only the preferred incomplete phrase and its first impact using the listener's timestamps; if neither works, replace the motif/voice identity before any larger arrangement.
