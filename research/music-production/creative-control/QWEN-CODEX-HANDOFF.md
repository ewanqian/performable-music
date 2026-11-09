# Qwen → Codex → Performable Music / controlled local handoff

## Scope
The **local Codex** is the task owner and reviewer; local **Qwen** proposes structured original **creative-control-0.1** objects; Waveform/Surge/plugdata remain the human-auditioned audio renderer. **No model controls audio-thread DSP, MIDI hardware, lighting, OSC or master volume directly.**

## First read, in exact order

1. `AGENTS.md` and `START_HERE_FOR_LOCAL_CODEX.md`.
2. `performances/2026-12-03-phase-01/DIRECTOR_SCORE.md`.
3. `research/music-production/creative-control/README.md`, `SOURCES.md` and existing example.
4. `research/music-production/2026-11-09-AGENT-COMPOSITION-LAB.md` (read for past failures; Groove-first gate is superseded by current artistic correction).
5. Existing original audio or authorized source assets. Do not restart 24 rejected clips.

## Recommended Qwen Code headless structured output

As supported by the [Qwen Code Structured Output docs](https://github.com/QwenLM/qwen-code/blob/main/docs/users/features/structured-output.md), pass the JSON Schema from a **trusted local file**. First confirm `qwen --help` advertises `--json-schema` in your installed version.

```bash
ROOT=research/music-production/creative-control
qwen -p "$(cat "$ROOT/QWEN-CREATIVE-BRIEF.md")" --json-schema @./$ROOT/schemas/creative-control-0.1.schema.json > /tmp/pm-qwen-draft.json
node "$ROOT/cli.mjs" validate /tmp/pm-qwen-draft.json
node "$ROOT/cli.mjs" trials /tmp/pm-qwen-draft.json
node "$ROOT/cli.mjs" compile /tmp/pm-qwen-draft.json /tmp/pm-qwen-proof-001
```

If Qwen Code isn't installed but Ollama serves a local Qwen model, Codex may use the documented Ollama `/api/generate` request with the JSON Schema as `format`, `stream:false` to save its `response` field. **Codex must independently validate** the output. Never assume either tool is already present.

### Strict division of labor

| Stage | Who | Input | Output | Failure state |
|---|---|---|---|---|
| P0 source inventory | Codex (read-only) | Mac audio/DAW state | verified app/plugin report | NOT_TESTED |
| Artistic problem | Artist + Codex | concept and director score | approved problem_space | NEEDS_ARTIST_REVIEW |
| Bounded proposals | local Qwen | schema + authorized inputs | candidate JSON | INVALID_SCHEMA |
| Independent validation | Codex + CLI | candidate JSON | safe trial matrix / cue ledger | REJECTED |
| Sound design | DAW operator | *one* approved idea + original material | original processed audio, stems, editable session | BLOCKED |
| Music judgement | Artist/independent listener | level-matched real WAVs | keep/revise/reject with timecodes | UNHEARD |
| Audio→AV measurement | vjbake or LinkOSC | approved real WAV or live input | measured events labelled by source | NOT_VERIFIED |
| AV stage | approved stage operator | v2 Show Score + audio | safe replay and stage fallbacks | NOT_TESTED |

Parallelize read-only research and diagnostics; never four agents writing one DAW GUI session. A Qwen proposed action is not a real audio change until Waveform saves and reopens the project and WAV/stem tests pass.

## Review packet per iteration

Send: contract_id, schema hash, prompt hash, original source assets/permissions, three-variable trial matrix, MIDI/check statuses, one recorded audio A/B, two distinct evaluator perspectives, reviewer disagreement, DAW reopen confirmation, actual WAV duration/technical results, and one next narrowly scoped musical operation. **Do not request style/vibe scores from a model without actual audio input.**

Do not erase unselected candidates. Value disagreements can be studied later; no automatic weighted aggregate decides what is artistically right.

## Priority correction

**The December 3 goal is NOT DJ Groove maximization.** Your first physical proof should be a sustained electroacoustic timbre → accumulated tension → one sharp musical transformation → meaningful fading afterimage. No forced beat or 16-bar drop. If beat occurs, justify it through the artistic system and sound material.
