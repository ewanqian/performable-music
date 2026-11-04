# OpenCode Agent handoff — 2026-11-04

Read START_HERE_FOR_LOCAL_CODEX.md, AGENTS.md, PRODUCTION_STACK_DECISION_2026-11-04.md and this file. This handoff is for another user-operated OpenCode Agent. Its exact model (spoken as “high cool”) and local tool permissions are not verified; do not assume a model identity, DAW access or listening ability.

## Current decision

User finds the percussive/metallic direction promising, but production rough. No explicit blind01/02 preference or show-quality approval. Preserve musical material and improve one excerpt's tone/phrasing. Do not produce more generic piano loops or expand to16minutes.

Stack: Waveform Free14 selected; Surge XT1.3.4; plugdata0.9.3. Zero purchases. Actual latest local inventory finds **Waveform14.1.24 installed**, superseding earlier absence reports. Free entitlement, SaveAs, reopen and native export are **NOT TESTED**. Don't repeat the old claim “not installed”, nor infer it is unlocked.

## Where the usable work is

- studies/006-curated-production-ab: original128BPM16-bar A/B, real factory Surge presets with modifications, velocity dynamics, original plugdata effect, actual offline mix preparation, four reconstructing stems, saved synth states and prepared native Edit XML. Historical reports accurately retain prior failures. Five saved synth states reloaded to nonzero audio; low/high velocity RMS ratio3.58. Stems reconstruct within3.58e-7. Human quality pending.
- studies/007-form-and-finish: nine distinct eight-bar scores and MIDI; only concepts01 and07 have rendered audio. Existing B/previous blind01 received a finish trial, without claiming user selected it. Equal-level before/after−25.26LUFS; revised true peak−3.72dBTP; separate delivery experiment−21.08LUFS/−1.5dBTP. These are technical measurements, not quality scores.
- performances/2026-12-03-phase-01/pressure-test-001/runtime: actual SC+WebGL shared-event test, recorded-frame replay, duplicate suppression, terminal software KILL and sender-stall neutralization. ~92s actual capture retained locally. Exact event/hash receipts in TEST_RESULTS.json. No AVP, Jitter, venue multichannel or independent physical KILL pass.
- studies/agent-engine-compare: archived earlier SC keyboard research, not current production direction.

## Public repository vs same-Mac evidence

Tracked source, structured scores, sanitized technical results and original MIDI can be reproduced. Audio, plugin states, installers, private media, full machine logs/screenshots and credentials remain ignored/local. A fresh Git clone does NOT contain these WAVs or runtime receipts. Missing local evidence means NOT RUN, never reproduce a historical PASS merely by reading a JSON file.

Same-Mac base: performable-music checkout; `local-only/toolchains/production-python/bin/python` is the isolated prepared environment. Official SC app is under local-only/toolchains. Surge/plugdata user apps and VST3s are under ~/Applications and ~/Library/Audio/Plug-Ins; factory data under ~/Library/Application Support/Surge XT. Check paths rather than assuming installation on another machine.

Local audition files:

- studies/006-curated-production-ab/outputs/Blind_PREPARATION_01.wav and02.wav
- studies/006-curated-production-ab/outputs/{A,B}/stems/
- studies/006-curated-production-ab/outputs/Waveform-source-package/{A,B}/CF_16bar_{A,B}.tracktionedit
- studies/007-form-and-finish/outputs/BEFORE_EQUAL_LEVEL.wav, FINISH_EQUAL_LEVEL.wav, FINISH_DELIVERY_TRIAL.wav
- studies/007-form-and-finish/outputs/SKETCH_01.wav, SKETCH_07.wav
- runtime/evidence/audio_visual_event_demo.mp4 and conductor.ndjson

## First bounded task — local Agent

1. Inspect git status. Create your own branch/worktree if needed; preserve uncommitted work. Coordinate with Codex; never have two agents editing the same DAW session or shared source simultaneously. No reset/clean/stash-drop or overwriting audio history.
2. Verify Waveform actual14.1.24, edition/entitlement, SaveAs and WAV export. User handles passwords, email verification and any licence acceptance. No Pro trial or paid expansion requirement. Native GUI automation previously timed out on JUCE applications; a running process is not evidence of an actionable window. Do not repeatedly launch duplicate instances.
3. Copy the prepared source package to a new working version; open A or B in Waveform. Check128BPM, four tracks, media,30s musical range. Save a NEW native edit and reopen it. XML syntax/media checks from the previous run are not proof of native recovery. Inspect the binary's actual supported CLI before using documentation for14.1.22-beta render commands.
4. Keep the existing phrase. Compare the existing finish against the baseline at matching loudness. Make only one controlled refinement pass: low-end hierarchy, metallic attack/body balance, tail length and depth. No extra drum density/reverb carpet. Preserve source and parameter choices. Model unable to hear must not invent “what I heard”; request a human ear gate after exports.
5. Actually export new stereo24-bit48k WAVs and aligned independent stems, plus native saved/reopened project. Record exact command/UI procedure, versions, asset paths, warnings and failures. Verify nonzero audio, clipping, actual duration, stem reconstruction where linear, and loop/phrase boundaries. Master nonlinear processing must be accounted for before claiming exact stem-sum equality.
6. Deliver one anonymous level-matched comparison and report technical versus human results separately. Stop before full-song expansion. No claim of commercial/stage quality without human listening.

## If Agent has no local DAW/plugins

It can audit score/form, write testable note edits, improve MIDI generation, check JSON/schema, review source, add meaningful automated tests and prepare an integration checklist. It cannot certify local plugin state, entitlement, hardware, sound quality or venue operation. Do not synthesize substitute sine-wave “finals” to fake a completed Surge/Waveform render. Hand local execution back to Codex/user.

## Show progress and remaining gates

Dec3 is the music repo's Phase01 target. Parent Stage Casting handoff separately names Dec4/The Point; these are different recorded targets, not an automatically resolved booking. Confirm scheduling with the actual production brief before promising a date externally.

The musical engine/desktop event experiment is usable for further rehearsal, not the full show. P0: finish one strong60–90s signature scene, install-to-native-export/recovery proof, human A/B acceptance, independent physical KILL and real input/rehearsal. P1: verify actual bridge/Max/Live or selected replacement routing, venue output map and twice-repeatable cue run. P2: expand acts only after those gates. No percent-complete estimate: time/track count is not readiness evidence.

## Copy/paste starting prompt

> Read research/agent-music/OPENCODE_HANDOFF_2026-11-04.md and the current root handoff. Preserve existing work. First verify actual Waveform14.1.24 Free entitlement, SaveAs/reopen/export on this Mac, using a new copy of the prepared16-bar edit. Then refine only one existing excerpt's low-end, transient/body balance and depth; export a level-matched blind comparison, independent stems and a tested native recovery project. No purchases, reference copying, generic piano expansion or unsupported sound-quality claims. If no local DAW access, do only source/score/QA work and state the missing runtime gate. Report files, actual tests, failures, human-listening status and next single task.
