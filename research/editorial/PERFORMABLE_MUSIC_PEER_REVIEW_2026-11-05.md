# Performable Music / Public Writing — Editorial & Method Audit
**2026-11-05 · Source audit of portfolio Writing essays**

## Principle

Editorial status is based on the **published source document**, not on whether its thesis sounds ambitious. Historical facts require sources; musical observations require stated listening/score evidence; proposed methods must have a runnable or falsifiable test; code execution and human listening are separate gates.

## Findings in four original essays (reviewed on 2026-11-05)

### 01 — From sound objects to programmable music

**Defect:** The "six transfers of control" title suggested one linear progress of technology and human agency. It flattened parallel musique concrète / electronic studios / MIDI / live systems trajectories and jumped from a general historical overview to Agent concerns with no specific formal representation.

**Correction:** Added an explicit qualification that six periods are a teaching framework, not a standard chronology or hierarchy; distinguishes generating material, editing DAW and realtime performance; links to typed composition research.

**Still open:** A serious academic history needs fuller bibliographic citations and individual examples from primary archives, not just a few website links. Do not claim a historical discovery.

### 02 — Seven audiovisual lineages

**Defect:** Calling artists "precise", "brutal", "emotional", or "audiovisual" without analyzing timed excerpts can become rhetoric. No systematic comparison of which musical operations happen when, or competing explanation for their effect.

**Correction:** Added the same seven-question comparative listening schema for each artist: first event, invariant, first deviation, acoustic distance, leading voice, ending and performer choice. Explicitly notes artist techniques as hypotheses rather than a strict school.

**Still open:** No original artist audio was uploaded or timestamp-annotated. Do not fabricate bar/timecode-level transcription. This essay is a research guide, NOT a completed corpus analysis.

### 03 — Eight instruments, sixteen works

**Defect:** Sixteen catchy titles and instrument names created the impression of sixteen implemented works. Structural template reuse and randomized MIDI can yield similar-sounding tracks despite different presets.

**Correction:** Added SPECIFIED / RENDERED / AUDITIONED maturity levels, a 32-bar identity/expectation/omit/return example and links to machine-readable plan and event-level tests. Existing eight old Surge XT render reports must be audited before expanding.

**Still open:** No independent A/B audio, measured studio quality or proven audience response is supplied by this editorial pass.

### 04 — Human-agent music studio

**Defect:** The earlier SOP was action-oriented but not sufficiently executable: "give agents a problem" had no typed output schema, parameter limits, dependency model, verifiable DAW edits or device safety handoff.

**Correction:** Defined Task/Plan/Execution contract and four tests (Structure, Audio, Music, Performance); links to a concrete composition-plan example and an up-to-date software tool comparison.

**Still open:** Only a live local DAW/SC/Max run can test actual file reopening, synth timbres and real hand/foot latency.

## New content that addresses the gap

| Published essay | What it adds | Tested? |
| --- | --- | --- |
| [05 / Musical expectation](https://github.com/ewanqian/portfolio/blob/main/writings/performable-music/05-what-is-musical-expectation.md) | Predictability, uncertainty, information content, five operations, 32-bar A/B testing design | Literature grounded. Human experiment NOT run |
| [06 / Agent composition grammar](https://github.com/ewanqian/portfolio/blob/main/writings/performable-music/06-agent-composition-grammar.md) | Form/Motif/Operation/Timbre/Performance intermediate representation, invariants, diff and acceptance gates | Example manually checked; no actual DAW edit here |
| [07 / 2026 agentic tools](https://github.com/ewanqian/portfolio/blob/main/writings/performable-music/07-2026-agent-music-systems.md) | Tool-specific capability matrix: Live MCP, Extensions, Magenta Studio, Somax2, Magenta RT2, ACE-Step, IDyOM | Official/repository claims verified; users' runtime tests NOT done |

## Supporting code

- [Typed Composition Plan v1 JSON Schema + cross-reference checker](../../protocols/composition-plan-v1/README.md)
- [Experiment 011: two structurally different 32-bar MIDI versions](../../studies/011-musical-expectation/README.md)

The code distinguishes symbol-level semantics, audio-level quality and live show safety. **Neither formal validity nor timed MIDI generation qualifies a track as musically strong.**

## Readiness and publication

- All seven public articles have complete Markdown, registered Writing metadata, and project-scope links.
- The Writing site uses the `series` metadata to assemble the reading series. Source commits were verified. Site deploy must be verified separately; no claim that pages are already live is made by this file.
- Sources are primarily official artist/product docs, peer-reviewed articles, public code repositories. External visual/audio assets were not copied.
- Publication labels mean the **articles** are complete, not that corresponding **music works** are completed.

## Four immediate next tasks for local Haiku/Codex

1. Validate the new Composition Plan against the JSON schema and cross-reference checker on a clean local checkout. Record real tool versions and results.
2. Generate Experiment 011 two 60-second MIDI versions and import into the actual free synth/DAW setup. Keep an original A/B listening capture.
3. Test **Magenta RealTime 2 Small** on M1 Pro for sustained audio and continuous MIDI steering, recording actual CPU and end-to-end response; do not make the 2.4B Base model a show dependency.
4. Choose one real clip from the user's existing eight studies and audit audible expected events with timestamps, then submit a specific before/after version for human listening.

**Editorial verdict:** The four original essays were useful as orientation but insufficient as a high-quality computational music methods reader. New essays and code raise methodological value. Historical depth and actual musical corpus studies remain incomplete and should not be advertised as proven.
