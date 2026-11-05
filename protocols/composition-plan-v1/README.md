# Composition Plan v1 — Typed Agent Music Intent

This is a **proposed local project protocol**, not a validated music industry standard. Its purpose is to keep **musical form, expectation, invariants and live performance rights** separate from MIDI/DAW/SC/Max implementation.

## Run

```bash
python3 check_plan.py recoil-expectation-32bar.example.json
```

The **dependency-free** checker validates meaningful cross references, complete 1-based bar coverage, timing windows and identities. For full JSON Schema evaluation against `composition-plan.schema.json`, optionally install and use any maintained Draft 2020-12 JSON Schema validator (for example Python's `jsonschema`). The checker does NOT claim to implement every JSON Schema rule.

## Key contract

- `total_bars` and section boundaries are **1-based**, with `end_bar_exclusive`—32 bars means the final endpoint is 33.
- Every section references a known `motif_id`.
- `identity_rule` states what makes variation recognizably linked to the source.
- `expectations` describe an audible cue, target, predicted bar, intervention, and how the event is fulfilled.
- `review` must honestly remain `NOT_AUDITIONED` and `NOT_RENDERED` until real user listening and artifact verification.
- On a scene event in the performance environment, convert this planned intention into an actual [Show Score](../show-score-v1.schema.json) event; do not send an entire arrangement to sample-rate DSP.
- Every agent edit to an approved plan needs input/output version IDs and a meaningful diff.

## Human gate

A mathematically valid plan can produce banal music. The full workflow is `plan → MIDI/events → audible DSP/DAW A/B → human selection → performance mapping`, not `JSON valid = professional`.

## Read alongside

- [What is musical expectation?](https://github.com/ewanqian/portfolio/blob/main/writings/performable-music/05-what-is-musical-expectation.md)
- [Agent composition grammar](https://github.com/ewanqian/portfolio/blob/main/writings/performable-music/06-agent-composition-grammar.md)
- [2026 current project capabilities](https://github.com/ewanqian/portfolio/blob/main/writings/performable-music/07-2026-agent-music-systems.md)
