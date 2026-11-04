# Runtime audit — 2026-11-04 / Asia-Shanghai

STATUS: PARTIAL REAL RUN. Actual synth/effect/source/mix preparation tested; requested Waveform DAW completion blocked on installed/opened Free14 and reachable native UI. Do not mark entire task complete.

## Repository and preservation

Read root handoff and production selection document. The latter was absent locally, present on GitHub. Fetch and safe fast-forward to `ed6ebf4`; only START_HERE, LOCAL_AGENT_TASK and the new selection document changed upstream. All previous uncommitted work preserved. Current changes are additive under studies/006-curated-production-ab plus appended attribution/acceptance notes. Existing Ableton/Max sessions were not changed. No reference audio copied or uploaded; no push, no purchase.

## Installation facts

Initial Waveform/Surge XT/plugdata inventory: all absent in system and user Applications/Audio Plug-Ins. Installed official Surge XT1.3.4 app+AU+VST3 and factory resources in user directories; plugdata0.9.3 app+VST3 instrument/effect in user directories. Copied verified payloads without executing destructive global installer scripts. Existing files were not overwritten. Official packages passed Apple installer-signature/notarization checks; app signatures verified.

Official downloads and SHA256:

- Surge XT: https://github.com/surge-synthesizer/releases-xt/releases/download/1.3.4/surge-xt-macOS-1.3.4.dmg — `b56e8d51a8dc2382ae668c9ff4e96bae38dbd452af4e584d5a5ef50ab2d09b07`
- plugdata: https://github.com/plugdata-team/plugdata/releases/download/v0.9.3/plugdata-macOS-Universal.pkg — `44344723ec6b975d59823725277e886b5513a04cb397dff0a5ce8ad8e042564b`
- Tracktion official Download Manager1.5.3: https://downloads.tracktion.com/download-mgr/153/tracktion_download_manager_v1.5.3.pkg — signature/notarization verified; user also installed system copy.

The user replied “已领取，可继续安装”, later “okok” to manual installation instructions. Neither reply proves the application installed or opened. Browser inspection showed an email-verification page and a separate trial-download page; no Free entitlement or application export was inferred from those. No verification emails, passwords or licence tokens handled by the agent. Waveform itself was still absent at the latest filesystem/application inventory.

CUA native getApp for Surge/manager repeatedly timed out; Chrome UI was readable. Purpose-built local driver also reported no manager window. Process presence is not UI or functional proof. User handoff requested opening the installed manager, logging in and installing Free14. No application licence agreement accepted by agent.

## Audio evidence

Actual installed Surge VST3 processed MIDI into ten nonzero31.5s stereo48k dry voice files across A/B. Mature factory patches and modifications listed in source-render-tests.json. Source data is wholly original G-centred rhythmic material; no Listening_02 samples/notes read.

Five actual saved synth states reloaded into fresh plugin instances and produced nonzero sound. Velocity test after actual VCA mapping:48 velocity RMS0.004388,112 velocity RMS0.015710, ratio3.580×. Authored MIDI dynamics are effective; no claim of human recording.

Actual plugdata-fx loaded the original .pd patch through saved state. Impulse0.2 input → peak0.1700,55 nonzero samples, first output at164 for input at100:64-sample delay. State volume0.8 is measured unity dry calibration; earlier0.5 and1.0 settings were not unity and were corrected. Cross-channel filtered13/21ms reflections, no feedback. Full metal processing run and64-sample compensation applied. No Max/SC or audiovisual expansion performed this task.

Real preparation EQ/compression/gain/duck/pan/negative-space processing produced two previews with four aligned stems each. Both−25.26LUFS; true peak−2.20/−2.34dBTP. PCM24 stereo48k31.5s, musical range30s/16 bars. Stem sum max error3.576e−7. Files are PREVIEW/preparation, NOT Waveform exports. Prepared native master EQ/comp remains unrun XML.

## Observed failures, retained

1. MIDI host rejected raw mido.Message objects; converted to actual MIDI bytes.
2. Surge patch load is queued; immediate first note yielded zero. Prime30ms processing after load, then render; verified nonzero.
3. One factory patch's streamed XML contained numeric references to forbidden control characters. Metadata parser sanitizes those references for analysis only; preset DSP data preserved.
4. Original Rubber Bass velocity range was0dB;48 and112 produced identical output. Test failed as intended. Set explicit VCA velocity ranges; rerendered and test passed. First sources/logs preserved under evidence/before-velocity-mapping-*.
5. plugdata headless VST3 host emits JUCE parameter/assertion warnings and missing optional Gem config warning. Actual bounded DSP passes impulse/render tests; warnings are not erased, and GUI/DAW-host stability is NOT certified.
6. Native manager/Surge GUI automation failed as described. No invented screenshots or “saved successfully” claim.

## Outstanding

- Waveform Free14 version/licence/save/export: NOT RUN.
- Prepared Edit open/save/reopen/native processing/export: NOT RUN.
- Full portable package restored in Waveform: NOT RUN; syntax/media/hash/state checks passed only.
- Direct model hearing unavailable; human audition PENDING. No aesthetic or stage-quality PASS.
- Final blind WAV export and native stems: NOT RUN; preparation previews/stems are available locally.

NEXT: verify actually opened Waveform Free14, then use new versions of these prepared edits for real native mix/export/recovery tests. No full-song expansion.
