> **Sound engine clarification:** The Agent Patch official case study documents a working offline multi-agent **DSP** system, but its complete code/download has not been located. Read [direct-use and credit audit](../agent-patch-reuse/README.md) and [Mac setup](../agent-patch-reuse/LOCAL_MAC_SETUP.md) before extending this folder. This directory **does not render audio or contain 62 DSP modules**; it only compiles validated intent, MIDI sketches and Show Score events.

# Creative Control Institution / 创作控制机构 v0.1

**Purpose**: an auditable, offline-first bridge between Ewan's artistic intent, Qwen-proposed musical structure, Codex execution, native DAW editing and the existing Show Score v2. **Not a synthesizer, audio renderer, AI music evaluator, live controller or existing performance system.**

## Three kinds of truth

1. **Intent** (this contract): author-defined problem/question, constraints, search variables, evaluation perspectives and specific musical reason for every cue.
2. **Timing** (existing `protocols/show-score.mjs`): monotonic millisecond clock and scene/control event structure; *not* a new duplicate musical clock.
3. **Measurement** (`vjbake` / LinkOSC): real audio-derived features with provenance. Do not let model-written numbers masquerade as sensor measurements.

For **FREE_TIME** music, the reference BPM is only a serialization coordinate to fit the existing Show Score v2. Every authoritative cue uses `t_ms`. It is **not** evidence of an audible beat. This design intentionally supports sustained electroacoustic / ambient composition and one-off high-intensity events.

## Files

- `schemas/creative-control-0.1.schema.json`: Qwen/headless schema restriction; JSON schema guards shape, semantic validator guards cross-field bounds.
- `core.mjs`: independent validator, one-factor trial matrix, Show Score v2 adaptor, original MIDI sketch writer, vjbake metadata inspector.
- `cli.mjs`: validate/trials/compile/inspect-vjbake commands. Never invokes the model or plays a sound.
- `example/critical-field-study.json`: a design-only 90-second ambient→rupture→afterimage sample, **not a finished work**.
- `tests/test.mjs` and `tests/review.test.mjs`: programmatic smoke tests.
- `review.mjs` + `example/review-pending.json`: divergent evaluations and data provenance, no automatic musical approval.
- `QWEN-CODEX-HANDOFF.md`: local human/agent division, structured prompt and actual tool usage.
- `tools/mac-audit.sh`: read-only inventory. Do not paste license tokens, serial numbers or personal data into a public PR.
- `SOURCES.md`: verified third-party references and limitations.

## Offline usage (Node 20+ recommended)

From the repository root:

```bash
node research/music-production/creative-control/tests/test.mjs
node research/music-production/creative-control/tests/review.test.mjs
node research/music-production/creative-control/cli.mjs validate research/music-production/creative-control/example/critical-field-study.json
node research/music-production/creative-control/cli.mjs trials research/music-production/creative-control/example/critical-field-study.json
node research/music-production/creative-control/cli.mjs compile research/music-production/creative-control/example/critical-field-study.json /tmp/critical-field-control-study-001
```

Compilation creates a **new output directory**, refusing to overwrite any previous evidence. Outputs: `show-score-v2.jsonl`, `cue-ledger.json`, `control-midi.mid`, `trial-matrix.json`, `manifest.json`. The MIDI is a **sketch or control carrier only**. Not a final music file; not tested in Waveform unless separately documented.

To review divergent assessments without collapsing them into one arbitrary score:

```bash
node research/music-production/creative-control/cli.mjs review research/music-production/creative-control/example/review-pending.json
```

To check an actual upstream vjbake JSON:

```bash
node research/music-production/creative-control/cli.mjs inspect-vjbake /absolute/path/to/approved-track.vjbake.json
```

Before the very first use of vjbake, verify its installed version, [DATA-SPEC](https://github.com/daitomanabe/vjbake/blob/main/DATA-SPEC.md), sample rate, source WAV and exact supplied BPM. The vjbake utility **does not infer BPM**. Do not bake from hypothetical JSON; first approve actual audible sound.

## Mac preflight

```bash
bash research/music-production/creative-control/tools/mac-audit.sh > ~/Downloads/PM_HOST_AUDIT.txt
```

Review the audit locally; do not upload identifiers or license material. Follow with actual GUI tests on isolated Waveform projects, reproducible 24-bit WAVs and plugin scan logs. Script output alone is **not** proof of DAW compatibility.

## Hard creative rules

- **P0** sound identity, long-form temporal continuity, sustained atmosphere, earned rupture and coherent return. Club Groove is optional, not a success criterion.
- AI produces **bounded proposals**, not self-approvals; keep disagreement between long-form, sound-design, artistic and technical evaluators.
- No automatic full-spectrum silence on global fixed bars, stock preset parade, generic risers, background drum loop or forced genre template.
- One local DAW writer and no unverified model code execution. If the local DAW is blocked, return BLOCKED and preserve source.
- Audio feedback is based on actual files and human audition. No release/stage PASS from the MIDI or JSON contract alone.

## One-test-at-a-time search

Start with one original resonance source and three independent dimensions: harmonic motion, material grain and spatial pressure. `trials` uses a baseline and one-factor changes; it does not explode into a Cartesian grid. Compare A/B at matched output level using actual recorded results, then edit the contract based on the *reason for the judgement*.

## Implementation state

- Contract shape + event and MIDI sketch compiler: source in this folder.
- Mac native Waveform GUI, Qwen CLI, actual vjbake binary, MIDI synth rendering, live LinkOSC and venue outputs: **NOT_VERIFIED** by this folder.
- No full-length master or accepted electroacoustic music has been produced by this feature.

For related project status and credits, refer to the existing `performances/2026-12-03-phase-01/DIRECTOR_SCORE.md` and `AGENTS.md`.
