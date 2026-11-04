# Form and finish — nine compositional sketches

User steering: direction has interest; texture still feels rough and insufficiently mixed/mastered. User requested independent structural research, roughly eight/nine composition concepts and actual attempts without more input. This authorizes nine sketch scores, not nine approved stage tracks.

Read STRUCTURE_AND_FINISH.md for existing A/B structure and engineering hypotheses; CONCEPTS.md for nine distinct mechanisms; nine-scores.json for every original note. Nine MIDI files are in outputs. Each is eight bars/15 musical seconds at128BPM, three roles. No reference recording/note data read. These change musical causality: omission, hocket, phase, delayed answers, negative beats, register/role, unequal phrase lengths, accents and aftermath.

Actual audio proofs: SKETCH_01.wav (missing last note) and SKETCH_07.wav (7+9 beat dialogue),16s including tail, real Surge XT using the saved production states from study006. The other seven are MIDI only. These proofs are not loudness-matched final production bounces or nine finished songs.

Existing preparation B (previous blind01) is preserved and used only as a finish working copy; the user did not choose a preferred version. BEFORE_EQUAL_LEVEL.wav and FINISH_EQUAL_LEVEL.wav have matching integrated loudness. FINISH_DELIVERY_TRIAL.wav is a separate louder delivery experiment: do not use louder playback as evidence of better tone.

The finish revision is actual offline stem processing: restrained percussion peak shaping (65% dry +35% softly shaped), subtractive high-mid EQ, slightly narrower metallic side signal, modest bass balance change and mild bus compression. No reverb carpet, new drums or purchased plugins. Original files untouched. Processed pre-master stems are in outputs/finish-stems; master compression means they do not sum exactly to the final compressed master.

Runtime measurements are in RUN_RESULTS.json; quality remains human-listening PENDING. Waveform native open/save/export remains NOT RUN from study006; these are actual offline plugin renders, never claimed as Waveform exports or approved masters. Model did not directly hear the files.

From repository root:

```sh
local-only/toolchains/production-python/bin/python studies/007-form-and-finish/write_sketches.py
local-only/toolchains/production-python/bin/python studies/007-form-and-finish/render_trials.py
```

`--finish-only` revises the finish without rerendering audio sketches; `--one 01` renders only sketch01 and the finish. The two rendered sketches depend on the actual saved Surge states and installed plugin/factory data in study006. Keep prior audition files before intentional rerender.

Acceptance: human judges intentional silence, phrase memory, consequential returns and tone at equal level. Technical peak reduction alone cannot pass this gate. No automatic full-song expansion.
