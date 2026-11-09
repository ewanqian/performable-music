# Cloud review packet — Agent Synth deployment and independent MIDI music

- Date: 2026-11-09, Asia/Shanghai. P0: December 3 CRITICAL FIELD.
- Repository: ewanqian/performable-music; branch work/critical-field-t00-t01; fetched main 61e7ed5 merged at 3995d53. Commit IDs are in this packet's Git history and distribution COMMIT.txt.
- Scope correction: preceding four PCM-processing variants are artist **REJECTED**. The current request is three independent 60–90-second MIDI compositions through actual free modular synthesis. Earlier dark-film/Club-first directions do not override it.
- Owner: Codex composer and sole native-DAW writer. Parallel read-only roles: music_audit (criticism), metal_compile (sound design), osc_audit (arrangement/native-host audit). No local Qwen or paid AI service used.
- Rights: original MIDI and patch graphs; Agent Synth MIT official binary; no external samples, reference recordings or original four-minute PCM input. Supplied MIDI tool retained locally, license unspecified, not redistributed.
- Input ZIP SHA256: fb827bca5db700c322d42403795fced1bfb716107af3a499b6ff0ae302318e51. Official plugin ZIP local SHA256: 27f0fbbb091a8fa3a19604b0a857e375db222e32d4bcd200597e5fe27f8deb00. Published checksum download timed out; published-checksum comparison **NOT_VERIFIED**. macOS codesign strict verification succeeded.

## Gate 1 — actual engine

- Installed: ~/Library/Audio/Plug-Ins/VST3/Agent Synth.vst3 and Components/Agent Synth.component, arm64 v0.588.1.
- Tested VST3 in Pedalboard: Mallet, Pluck, shallow-FM oscillator graphs, MIDI note-on/release, native JSON graph/state save and reload into a fresh plugin instance. Five nonzero WAVs and reopened renders; actual results in ENGINE_RESULTS.json.
- Native plugin import can reject a graph silently. Initial wrong MIDI Keyboard parameters caused the default graph to remain; those failed probes are retained under ignored local-only/agentsynth-test. The host now checks authored node identities in readback. Native modulation import may insert an attenuverter; that is recorded, not treated as rejection.
- Waveform GUI scanned both VST3/AU. Scan's VST3 uniqueId=7b56809f, uid=148b2043. Native editable MIDI test rendered nonzero 48k/24bit WAV. GUI Save As to AgentSynth-GUI-saved.tracktionedit, close and reopen observed: three MIDI notes plus Agent Synth remain. Saved file 11,924 bytes. AU sound and standalone application **NOT_TESTED** (standalone download timed out); no Cardinal fallback needed for the functioning VST3 route.
- Native master defaults to -3dB. Explicit MASTERVOLUME unity and linear-pan-law fader stages are measured separately before final production exports. Never treat the fader position as linear amplitude.
- Actual linear Hz FM additionally tested with eight different, non-overlapping MIDI notes; all eight produce nonzero output. Poly MIDI voice0 requires no legato/overlap; the air-thread score is checked against that constraint.
- Engineering gate is not artistic acceptance. Hardware listening, performance readiness and artist music approval **PENDING / NOT_TESTED**.

## Music gate — delivery technical checks complete; artist audition pending

- Sources: studies/018-agent-synth-compositions; old four-minute study015 and its revision preserved.
- The supplied baseline only creates 34–35-second four-cycle MIDI examples. They were not padded into music. Three original compositions have separate pitch/time syntax, countervoices and endings; v01/v02/v03 MIDI retained. Criticism caught two same-pitch overlap events in Hinge; v03 shortens those notes.
- Raw original multi-stem native synth renders exist. First mix measurement exposed excessive low-frequency voice level. A production revision reduces that level, foregrounds thematic replies, adds a native enveloped body to the plucked instrument, and replaces Air Current's shallow FM with tested linear Hz FM.
- Audio judgement source: no model audition. Arrangement/sound risks are score/measurement-derived hypotheses. Artist can reject all three.
- Visual, vjbake, LinkOSC, EEG, venue hardware and live-set expansion paused.
- Next one task: artist audio-only audition of the three complete, matched files.

## Delivery — actual evidence in the requested review-template fields

- DATE (Asia/Shanghai): 2026-11-09.
- SOURCE_REPO / BRANCH / COMMIT: ewanqian/performable-music / work/critical-field-t00-t01 / engine gate c1055cb; final source/evidence commit in distribution COMMIT.txt. Local commits are not pushed.
- OPEN_CODE_SESSION_ID: unavailable; Codex local execution, no OpenCode provider invoked.
- Unique objective: three independent 60–90s original MIDI compositions, three actual instrument identities, working native synthesis and editable projects; no same-PCM FX variants.
- Original work / rights: original study018 MIDI and native graphs. Supplied tool baseline and software licenses described above. Original study015 MIDI inventory is empty: its note events existed in renderer source/Surge states, not a saved MIDI file. Its existing four-minute revision SHA256 remains e7da1f657ded1a49098aced9897be71ac3b3a421e0f45d43807a6aef000ed565.
- Changed paths: studies/018-agent-synth-compositions/{agentsynth_host,instruments,compose,revise_midi,render,finalize,waveform_project,verify_engine,test_linear_fm,verify_delivery,package_review,playback_check}.py; original scores and MIDI history under scores/; review/2026-11-09-agent-synth/; references/ACKNOWLEDGEMENTS.md. Existing unrelated untracked work preserved.
- Actual audio root: /Users/ewanqian/Downloads/CRITICAL_FIELD_THREE_COMPOSITIONS_2026-11-09. Root files 01_PRISM_RUN.wav (72s), 02_HINGE.wav (78s), 03_AIR_CURRENT.wav (84s). These are actual Waveform exports with constant master attenuation, all measured -22.0 LUFS. Original louder native exports preserved in evidence/native-originals/.
- Actual stems / editable sources: each matching ID folder contains STEMS/, COMPOSITION.mid, MIDI_HISTORY/, patches/*.json and *.state, and ID-EDITABLE.tracktionedit. 4+3+4 native stems; all48k stereo PCM24, lengths match their full file. Matched stem reconstruction max error <=7.153e-7. SOURCE/ contains source and actual dependency versions. No video/frame capture generated; UI save/reopen observations remain in tool transcript, no saved screenshot asserted.
- Blind listening: **PENDING_ARTIST**. File playback execution is logged separately and does not constitute model or acoustic listening. No automatic KEEP judgement.
- At least three timecodes requiring listening: Prism47–48s measured one-second RMS rise7.01dB; Prism55–56s rise10.01dB; Hinge53–54s rise6.88dB. These are phrase/transient energy differences, not proof of a master-gain jump or a defect. Air46.36s high-register release and57.27s descending reply need musical verification. No dynamic master-gain ramp or added foreign noise climax was used.
- Other listening risks: Prism low-pattern articulation may flatten the melody's breath; Hinge short attacks may remain too plinky; Air register ascent may not create a convincing response. These are hypotheses from score/timbre design, **not heard findings**.
- Visual issues / three visual timecodes: **NOT_TESTED**, visuals paused, no video. No invented visual defects or frame logs.
- Remove: preceding study015 four-PCM timbre experiment from candidate selection (**artist REJECTED**); preserve files as history.
- Metal build / GPU p50,p95,p99 / memory /20min soak: **NOT_TESTED this iteration**. No new performance claim.
- OSC source/address/timestamp/event_id/loss/disconnect: **NOT_TESTED**, paused.
- Show Score shared audio/visual event.id: **NOT_TESTED**, paused; no new clock/control framework.
- AVP / Quest / foot / real EEG: all **NOT_TESTED**.
- RIGHTS/LICENSE: Agent Synth0.588.1 MIT, Tal (Diabl0269), official source linked in ACKNOWLEDGEMENTS. Pedalboard GPL3, no source vendored. Artist ZIP redistribution license **UNCONFIRMED**, tool source not redistributed. No external samples or copyrighted reference media used.
- Commands actually run: see COMMANDS.md and actual native JSON job logs. Engine/patch state reopen, eight-note FM, MIDI consistency, native full/stem exports, PCM format/finite/headroom/reconstruction and preserved-old-master-hash checks **PASS**. First graph imports **FAIL** (wrong module params); initial comparison **FAIL** due legitimate native inserted node; first MIDI write **FAIL** latin-1 Chinese markers, corrected to explicit UTF-8 and failed file retained locally. Standalone download **FAIL** timeout. AU audio/hardware MIDI/realtime latency/full-piece GUI save-close-reopen **NOT_TESTED**.
- Candidate KEEP / REVISE / REJECT: all three **PENDING_ARTIST**. Previous ABCD all **REJECTED**. No stage-ready or accepted music claim.
- Next minimum task: artist listens to all three without screen; keep/revise/reject with one timecoded reason. No additional composition/tool generation before that judgement.

Final playback execution: all three matched files completed sequential `afplay -v0.15`
with exit0; wall times72.391/78.850/84.520seconds, stderr empty. This is file/audio
playback-command evidence, not acoustic monitoring, model hearing or artist approval.
Matched EBU128 results: all-22.0LUFS; true peaks-5.1/-1.9/-4.8dBTP. No limiter or
time-varying master gain used. AU scan's version field reports2.76.1 while bundle
metadata is0.588.1; AU sound remains untested, so no AU compatibility pass inferred.
