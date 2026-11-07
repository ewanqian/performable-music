# Spatial Instrument Studies 05 — Score / Tone / Sigil

**Status:** original code and browser entrypoints created. Hardware and audio listening QA remain open. Existing LAB02, V2 and Organic Fields are not replaced.

## Three live pages (same lightweight source and sensor)

- 01 SCORE / Studio Bridge: https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/studies.html?lab=score
- 02 TONE / advanced web synth: https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/studies.html?lab=tone
- 03 SIGIL / six-digit finger dial: https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/studies.html?lab=sigil

### Context for "Studio"

**Strudel** = browser algorithmic arrangement/live patterns, suitable for an accompaniment sketch. **Tone.js** = browser synthesis, effects, scheduling. **Ableton Live + Max/MSP** = production and live DAW. A prior `@strudel/tone` package is deprecated; do not base the system on it. Strudel provides its own sound engine, and official MIDI/OSC paths. Real live phase sync between browser and Strudel/Ableton has NOT been implemented here.

This build uses one shared, future-facing format: sensor features → performed semantic events → `Show Score` events/parameter mappings → pluggable audio engine and live OSC. Each demo can consume that same data but own its sound/visual design.

### SCORE — actual features

- Four-lane original browser arrangement: PULSE, METAL, SHIMMER, DRONE.
- 100 BPM default quarter-note clock and 1/16 scheduler. Intended for prototyping, not verified low-jitter hardware sync.
- Local file input for **four user-authored audio stems**. They are decoded in browser memory and started at the same Web Audio timestamp. Your files are not uploaded. Use bar-aligned same-length, same-BPM WAV files — **no live time-stretch, beat detection or Ableton Link** is implemented.
- Export an editable Strudel code fragment for use in https://strudel.cc/. This is a source handoff, **not bidirectional live integration**.
- Optional /pm/study/score/event to local authorized WSS/OSC bridge. Max can route to Ableton, Surge XT, or other instruments — bridge connection and OSC receiver still must be configured.

### TONE — actual features

- Optional Tone.js **15.1.22** loaded over pinned esm.sh CDN when ENABLE AUDIO is clicked; fallback to local Web Audio engine if unavailable or suspended.
- Three designed original sound patch families: ABYSS (dark resonant synth with pad), FERRO (FM metallic attack and synthesized membrane), CATHEDRAL (slow AM pad, long-tail FM harmonics).
- Morph 0–1 cutoff, space/reverb, intensity/modulation via pointer and tracked XR fingertip. All outputs pass through bounded limiter and explicit mute.
- This is a more sophisticated browser synth **prototype**, not a commercial VST3 port and not equivalent to sampled film-score orchestration.
- To reach stage sound quality, use free **Surge XT** on desktop/DAW or recorded source materials to author patches and export 24/48kHz stems that can be looped locally in Score. The browser does not directly host Surge XT VST3.

### SIGIL — actual features

- Right thumb to finger joints: 1=index PIP, 2=index DIP, 3=middle PIP, 4=middle DIP, 5=ring PIP, 6=ring DIP. Each joint indexes a sonic response.
- Entrance ≤28mm, release >46mm, dwell 90ms, rearm 45ms. **Requires lifting the thumb** for repeated digits: no accidental repetition while touching.
- Ten-number phrase `3345655643` activates a drawn sigil and bounded synthesis flourish. This is original artistic hand language, NOT a claim to faithfully replicate Taoist religious historical hand seals or divination.
- Desktop has six simulation buttons, autoreplay of the sequence and session event export. Quest real joint tracking can provide live input, but ergonomics / tracking errors / occlusion are pending.
- Current sigil is a lightweight 2D path plus XR six-ring guide, not a detailed animated talisman creature or 3D material system.

### OSC format (additive)

Messages are produced only after explicit WSS CONNECT + ARM:
`/pm/study/{score|tone|sigil}/event action:string code:int value:float x:float y:float`

Strict allowlisted lab/action keys; no arbitrary command execution; normalized params 0..1. The browser never directly sends UDP. A separate physical mute is needed for a stage setup.

## The next six practical tests (ordered)

1. **Audio first.** On desktop and then Quest, verify ENABLE AUDIO yields actual sound; compare native fallback vs pinned Tone engine. Report *suspended* contexts instead of claiming silence is user setup.
2. **Sonic A/B.** Record each of ABYSS/FERRO/CATHEDRAL for at least 30s. Compare to one exported Surge XT patch and a curated original stem, loudness-matched rather than merely louder. Do not publish a “professional timbre” claim before ear tests.
3. **Score stem alignment.** Import four own WAV stems recorded at 100 BPM with identical loop duration; measure first downbeat alignment and loop drift with a desktop audio capture.
4. **BPM → OSC.** Enable WSS→Max, route /pm/study/score/event into Ableton, confirm timing at 100 BPM, reconnect and panic neutral. Existing implementation is *event delivery*, not transport/Link synchronization.
5. **Six-point input.** Each of six joints: 20 deliberate contacts, 20 near misses. Record false positives, misses, tremor, bimanual combinations, successful 3345655643 completion rate.
6. **Stress.** Five-minute fast gestures, 10k synthetic logic frames, independent instrument voice count / dynamic compressor, background tab pause, headset low battery and audible glitches. No real Quest compositor or audio latency metrics are captured by the unit tests.

## Roadmap: avoid turning this into endless unrelated demos

- **Gate A, current prototype**: input correctness, local sound, 3 expressive vocabulary exercises, real-device QA and first 60–90-second documented performance. This takes roughly 4–7 bounded agent rounds plus physical testing, not a guarantee.
- **Gate B, 2–6 weeks after Gate A**: original recorded sound palette, dedicated sample/patch library, quantized scene management, one canonical Show Score and Ableton/Max OSC receiver; performance macro states (READY / ARM / PERFORM / HOLD / RELEASE / PANIC). About 8–15 agent rounds plus artist sound design and auditions.
- **Gate C, 2–4 months if stage experiments succeed**: spatial gesture instrument with replayable material, artist-authored scenes, clear instrument presets, downloadable session captures, versioned input protocol and measured headset latency; selectable stage engine (browser / Ableton / Surge XT). Scope about 15–30 additional rounds with device QA and sound mastering.
- **Longer term (6–18 months)**: a reusable open-source **Spatial Performance Instrument SDK**, a curated high-quality library of original playable compositions, and one finished performance piece using the instrument. An SDK or commercial toolkit only makes sense after **two** distinct pieces use the same stable API and other performers can rehearse without your support. The more valuable product is an authoring/performance system, not another skeletal-hand demo.

## Sources

- Strudel project / embed: https://strudel.cc/technical-manual/project-start/
- Strudel MIDI/OSC: https://strudel.cc/learn/input-output/
- Strudel deprecated tone binding: https://strudel.cc/technical-manual/packages/
- Tone.js API & transport: https://tonejs.github.io/
- Surge XT free synth (VST3/CLAP/Standalone): https://surge-synthesizer.github.io/downloads/

There is no imported copyrighted sample or historical ritual text in these prototypes.
