# References & Acknowledgements

This file records inspirations, software and research projects that inform Performable Music. Inclusion here does not imply endorsement or collaboration.

## Artists / research references

### KASHIWA Daisuke
Research reference for long-form composition, piano/electronic integration, low-frequency architecture, detailed editing and programmatic form.

Primary links:
- https://kashiwadaisuke.com/
- https://kashiwadaisuke.com/release/titan/
- https://virginbabylonrecords.bandcamp.com/album/titan

### Daito Manabe
Research reference for mathematical generation, club-music physicality, sensing, audiovisual systems, custom software and agent-assisted composition.

Primary links:
- https://www.daito.ws/en/
- https://projects.daito.ws/

## Open software / repositories

### ableton-live-mcp — wstierhout
- URL: https://github.com/wstierhout/ableton-live-mcp
- License checked: MIT
- Use: candidate local Codex ↔ Ableton Live control and DAW automation.

### live-agent — nonogv
- URL: https://github.com/nonogv/live-agent
- License checked: MIT
- Use: reference for agent interaction inside Ableton Extensions.

### Somax for Live — DYCI2
- URL: https://github.com/DYCI2/Somax-for-Live
- License checked: GPL-3.0
- Use: research reference for machine listening / co-improvisation in Live.

### Tone.js
- URL: https://tonejs.github.io/
- License: MIT (verify the exact version when vendoring)
- Use: browser-based composition and instrument prototypes.

### FluCoMa
- URL: https://www.flucoma.org/
- Use: corpus-based and data-driven music research in Max/Pd/SuperCollider. Check the license of the exact package/version used.

### librosa
- URL: https://librosa.org/
- Use: Python audio feature extraction.

### Essentia
- URL: https://essentia.upf.edu/
- Use: MIR / audio descriptor extraction and research workflows.

### music21
- URL: https://music21.org/
- License: BSD-style; verify exact distribution text when vendoring.
- Use: symbolic computational musicology.

### Sonic Visualiser
- URL: https://www.sonicvisualiser.org/
- License: GPL-2.0-or-later.
- Use: manual/visual audio inspection and Vamp analysis workflows.

## Attribution rule

When third-party code is actually copied, modified or vendored into this repository, add:
- exact commit/tag/version;
- original copyright notice;
- license text where required;
- files/paths that contain the reused code;
- what was changed.

Studying an architecture or technique does not require copying its implementation.


### Strudel — @strudel/repl 1.3.0
- Project: https://strudel.cc/
- Authors: Strudel contributors; credits: https://strudel.cc/technical-manual/credits/
- Version checked: 1.3.0, 2026-11-04 (UNPKG release endpoint).
- License: AGPL-3.0; official integration/license guidance: https://strudel.cc/technical-manual/project-start/
- Use: unmodified externally hosted browser REPL in `studies/005-strudel-preset-transitions/index.html`; no runtime source vendored.
- Integration source and original preset code: https://github.com/ewanqian/performable-music/tree/main/studies/005-strudel-preset-transitions


### SuperCollider — 3.14.1
- Project / contributors: https://supercollider.github.io/ ; https://github.com/supercollider/supercollider
- Version/date checked: 3.14.1, 2026-11-04.
- License: GNU GPL v3; preserve the official distribution's COPYING and notices.
- Use: unmodified official macOS universal binary, kept in ignored workspace-local tooling. Executes original `studies/agent-engine-compare/supercollider-afterimage.scd` with core UGens and Score NRT.
- No runtime source, sample library, third-party SynthDef or Quark is copied into tracked project source.
- NRT reference: https://doc.sccode.org/Guides/Non-Realtime-Synthesis.html


## Curated production preparation — 2026-11-04

- Surge XT1.3.4, Surge Synth Team, GPL-3.0: https://surge-synthesizer.github.io/downloads/ — actual installed VST3 and bundled factory presets as original music sound sources; factory authors/paths recorded in studies/006-curated-production-ab/source-render-tests.json. Modified states and assets kept local; no third-party preset files added to Git.
- plugdata0.9.3, Timothy Schoen and contributors, GPL-3.0: https://plugdata.org/download.html — actual effect plugin running original metal-memory.pd. State format inspected against official Source/PluginProcessor.cpp at tagv0.9.3; no DSP implementation copied.
- Pedalboard0.9.26, Spotify, GPL-3.0: https://github.com/spotify/pedalboard — isolated local VST3 audition/preparation host and standard EQ/compression; not represented as a Waveform DAW.
- JUCE state serialization reference: https://github.com/juce-framework/JUCE/blob/master/modules/juce_core/memory/juce_MemoryBlock.cpp — original interoperability encoder follows the public state format; no JUCE source vendored.
- Tracktion Waveform Free14, Tracktion Software Corporation, proprietary zero-purchase-cost edition: https://www.tracktion.com/products/waveform-free — selected final DAW; install/save/export not yet verified. Prepared Edit XML properties inspected against https://github.com/Tracktion/tracktion_engine (GPL/commercial engine); no engine source vendored or compiled. CLI reference https://tracktion.github.io/waveform_manual/14.1.22-beta/rendering-and-stems/ is version-specific and not proof that installed stable Free14 supports it.
