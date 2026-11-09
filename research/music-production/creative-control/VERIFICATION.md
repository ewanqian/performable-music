# Creative Control Institution / Verification Record

Date: 2026-11-09. Candidate branch: feat/creative-control-institution-20261109.

## Verified in current tool runtime

- JSON example loaded and validated against the original JS semantic validator.
- One-factor matrix: 4 trials (baseline plus three single-variable changes).
- Show Score v2 adapter: 5 cues produced; cue ids and timestamp join keys preserved.
- Binary MIDI sketch: Type 1 header and two track chunks; 163 bytes under a Buffer-compatible stub.
- Rejected unsafe/non-human OVERRIDE, unknown master-gain control, model judgement without observed audio, malformed vjbake metadata.
- Independent review example preserved status PENDING and evaluator differences.
- CLI module parses as JS after removing Node imports and shebang in a code-mode check.
- Qwen contract schema parsed; FREE_TIME and status DESIGN_ONLY present.

These are **in-process logical smoke checks**, using lightweight stand-ins for Node Buffer and the existing Show Score clock. They **do not constitute** a real Node CLI invocation, a JSON Schema engine validation, a native M1 Pro integration run or DAW/audio playback verification.

## Mandatory local acceptance (not done here)

```bash
node research/music-production/creative-control/tests/test.mjs
node research/music-production/creative-control/tests/review.test.mjs
node research/music-production/creative-control/cli.mjs validate research/music-production/creative-control/example/critical-field-study.json
node research/music-production/creative-control/cli.mjs compile research/music-production/creative-control/example/critical-field-study.json /tmp/pm-control-local-first
bash research/music-production/creative-control/tools/mac-audit.sh > ~/Downloads/PM_HOST_AUDIT.txt
```

- Confirm MIDI file opens in a verified DAW and that phrase timing and original source patch are independently correct.
- Verify a native Waveform isolate can Save As, close, reopen, re-export 48 kHz 24-bit, and run real audio with stems.
- Verify any local Qwen schema result against this CLI; record invalid attempts rather than auto-repairing them into success.
- Run vjbake only on an artist-approved WAV, with explicit BPM; compare frame/event metadata with LinkOSC on M1 Pro and record actual offsets.
- Only then test Show Score/OSC/hand-foot on real hardware, with manual kill and a separate fallback.
- Never mark the sample as a finished work or real EEG system.

## Recorded known open risks

- Show Score v2's reference musical clock is a compatibility coordinate for FREE_TIME. Meaningful composition time is t_ms and authored cue ledger, **not** a fabricated fixed dance beat.
- No physical local DAW/project/GPU status was discoverable in this environment; developer files are public code but local 74a4aae and private exports are unavailable unless the artist synchronizes them.
- MIDI phrase modes are original simplified reconstructions of symbolic operations, **not** a port of third-party C++ APIs.
- Qwen can generate schema-valid but musically poor choices. Only real audio listening can decide merit.
- Prior local Waveform GUI save/reopen remains unverified according to current artist report.

## Correct success language

This feature provides **an offline composition planning and bounded-control prototype with programmatic smoke checks**. It does **not** provide a completed music generation engine or production-ready live performance system.
