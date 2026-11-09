# Global tool ecology → Performable Music, 2026-11-09

**Status:** research decision matrix. External docs checked, not proof that the software or model is installed or tested on the performer's Mac. The official hardware matrix and license terms are critical to the choice.

## Essential findings

1. **M1 Pro / Magenta RealTime 2:** Official matrix: `mrt2_small` (230M) supports real-time streaming on M1 Pro; `mrt2_base` (2.4B) **does not**. Treat high-quality base as offline only on this machine until independently demonstrated. [model requirements](https://github.com/magenta/magenta-realtime/blob/main/docs/models.md). Code Apache-2.0, weights CC BY 4.0 (with responsible-use terms): [model card](https://github.com/magenta/magenta-realtime/blob/main/MODEL.md).
2. **vjbake + LinkOSC:** The most practical reproducible offline→live bridge. [vjbake](https://github.com/daitomanabe/vjbake) bakes 60fps aligned JSON and ProRes pixel-data video from artist audio; [LinkOSC](https://github.com/daitomanabe/link-osc-app) supplies a corresponding real-time OSC stream. vjbake uses supplied tempo, not automatic beat tracking. Music/control clock remains the DAW. `/beat` must be enabled in LinkOSC.
3. **No model grants musical quality automatically.** ACE-Step 1.5 and Stable Audio 3 are plausible idea/sound-source tools, while the DAW remains responsible for final editable structure, low-end, dynamics and audio-only audition. Check model-specific weights and licensing.
4. **Human drumming evidence:** [Groove MIDI Dataset](https://magenta.withgoogle.com/datasets/groove) contains 1,150 MIDI examples with actual performance timing, velocity and tempo. The MIDI-only bundle is small. Do not apply uncorrelated random timing across every instrument.
5. **Difference in jobs:** `Syntheon` infers **Vital** synth presets from audio (Dexed experimental), not a Surge XT preset. `beat-link-cpp` works with actual Pioneer DJ Link hardware and is not required for a software-only Ableton/Link show. `GLIC` is video processing, not music production. `Syphon26` moves video frames and is not classic Syphon.

## Triage: what can materially affect composition now?

| Priority | Name | Role | Practical expected contribution / blocking caveat | Source |
|---|---|---|---|---|
| **P0** | Magenta Groove MIDI Dataset | human drum microtiming and velocity | Extract timing/velocity distributions from human performances; compare to original groove; **caveat:** midi reference analysis only; 3.11MB MIDI-only; CC BY 4.0; not a direct club-techno corpus | [source](https://magenta.withgoogle.com/datasets/groove) |
| **P0** | Essentia | music information retrieval and QC | Machine-check gaps, tonal changes, transient coverage; NOT perceived musical quality; **caveat:** onsets, beat/loudness, tonal/spectral features, dropouts; license/check installation separately | [source](https://essentia.upf.edu/python_examples.html) |
| **P0** | FluCoMa | sound corpus slicing and feature-driven instrument | Create one 30-60-source original percussion corpus with 3 distinct sound states; **caveat:** Max/SC/Pd and CLI; verify local build and corpus permissions | [source](https://www.flucoma.org/download/) |
| **P0** | Surge XT | production synth / editable MIDI | Build differentiated low-end/percussion sources with saved editable presets; **caveat:** Local agent previously reported install; re-inventory actual version and factory state | [source](https://surge-synthesizer.github.io/) |
| **P0** | Waveform Free / Pro | DAW arrangement and actual audio export | One writer. Prove native session open/reopen, stems and 24-bit WAV; **caveat:** Prior local report opened Waveform 14 and exported WAV; GUI save/reopen, license remain unverified | [source](https://www.tracktion.com/products/waveform-free) |
| **P0** | plugdata | focused DSP patch and state machine | One unique custom delay / resonant instrument; keep to four semantic macros; **caveat:** Previously reported installed; verify version, patch state and export | [source](https://plugdata.org/) |
| **P1** | GrooVAE / Magenta Groove | groove transfer and humanization baseline | A/B quantized vs human performance vs manually designed timing; **caveat:** historical implementation; compatibility with Waveform or current Ableton not established | [source](https://magenta.withgoogle.com/groovae) |
| **P1** | vjbake | offline audio-to-visual event bake | Once an approved WAV exists, bake exactly calibrated LinkOSC-like offline data; **caveat:** Apple Silicon macOS13+; 60fps JSON/ProRes data video; requires BPM input; unrelated to sound generation | [source](https://github.com/daitomanabe/vjbake) |
| **P1** | LinkOSC | live audio features to OSC | Compare offline baked streams to live analysis on original approved audio; **caveat:** GPL-2.0-or-later; latency and controls; no exact live kick/snare identity; `/beat` OFF by default | [source](https://github.com/daitomanabe/link-osc-app) |
| **P1** | Magenta RealTime 2 SMALL | real-time guided AI instrument | Audio-only 60s steering with MIDI/hand control, no primary sound dependency on stage; **caveat:** mrt2_small 230M works real-time on M1 Pro per model matrix, base 2.4B does not; actual host load test required; weights CC BY 4.0, code Apache-2.0 | [source](https://github.com/magenta/magenta-realtime) |
| **P1** | ACE-Step 1.5 | full-track/timbre moodboard and offline source generation | Use only as A/B ideas; rebuild accepted material in editable DAW and user-owned original sources; **caveat:** MIT project; verify individual model weight licenses and actual outputs; likely Windows 4080S optional; do not claim commercial quality from benchmarks | [source](https://github.com/ace-step/ACE-Step-1.5) |
| **P1** | Stable Audio 3 Small/Medium | offline music/sound source generation | Use to test one-shot/timbre hypothesis, not as a replacement for compositional audition; **caveat:** model-dependent Community License and revenue/use restrictions, terms and memory to be verified | [source](https://stability.ai/news-updates/meet-stable-audio-3-the-model-family-built-for-artistic-experimentation-with-open-weight-models) |
| **P1** | CLAP | audio embedding and coarse similarity triage | Flag strongly similar candidate sound worlds and request blind ear review; **caveat:** embedding similarity is not proof of duplicated composition, style copying, or musical quality | [source](https://github.com/LAION-AI/CLAP) |
| **P1** | librosa | portable Python audio features | Find long unexplained silence, rhythm density and timbral novelty; **caveat:** onsets, tempo/spectral features; must measure against fixed samples | [source](https://librosa.org/doc/latest/index.html) |
| **HOLD** | Magenta RealTime 2 BASE | higher-quality generative stream | Test offline only if a later dedicated need exists; **caveat:** official matrix M1 Pro no real-time, though may run offline; don't deploy live | [source](https://github.com/magenta/magenta-realtime/blob/main/docs/models.md) |
| **P2** | Syntheon | audio -> synthesizer preset inference | Resynthesize a user-owned novel percussion sound into editable Vital preset; **caveat:** README confirms Vital, Dexed WIP; **not** Surge XT support; dependency audit first | [source](https://github.com/daitomanabe/syntheon) |
| **P2** | RAVE | neural source resynthesis / custom timbral instrument | Train on short original sound corpus only if time and rights permit; **caveat:** training/packaging and beta VST work; not fast enough to depend on this week's stage score without test | [source](https://github.com/acids-ircam/RAVE) |
| **P2** | Somax2 | corpus-memory improvisation in Max | Record a phrase, generate a constrained response, compare to hand-edited answer; **caveat:** Max integration and nontrivial setup; licenses and real Mac test needed | [source](https://github.com/DYCI2/Somax2) |
| **P2** | TidalCycles | symbolic rhythm transformations | Export controllable rhythmic patterns that are rendered through professional local sources; **caveat:** Haskell/Tidal current source on Codeberg; GPLv3 code; output OSC/MIDI; not a final mixer | [source](https://tidalcycles.org/docs/) |
| **P2** | Strudel | browser pattern grammar for ideation | Generate candidate note-event scores and export, not synth-only masters; **caveat:** current upstream on Codeberg; do not confuse WebAudio sounds with mature production | [source](https://strudel.cc/technical-manual/project-start/) |
| **P2** | Sardine | Python pattern/MIDI/OSC livecoding | Generate controllable counter-rhythm while main clock remains DAW; **caveat:** can be a local composition tool; additional runtime maintenance | [source](https://sardine.raphaelforment.fr/) |
| **CONDITIONAL** | beat-link-cpp | Pioneer DJ hardware beat/bar tracking | Only enable when show includes Pioneer DJ Link gear; **caveat:** EPL-2.0; not needed for Ableton-only; must have actual CDJ/DJM hardware | [source](https://github.com/daitomanabe/beat-link-cpp) |
| **CONDITIONAL** | beatlink-max | Max external for Pioneer DJ beat info | Tempo/beat messages into Max only when DJ hardware present; **caveat:** depends on beat-link-cpp; real Pioneer gear required | [source](https://github.com/daitomanabe/beatlink-max) |
| **HOLD** | oflike-metal | Metal C++ creative coding interface | One tiny isolated 1080p experiment; not alternative music engine; **caveat:** macOS13+/Xcode; source notes MIT; use only after native renderer compile issue solved | [source](https://github.com/daitomanabe/oflike-metal) |
| **HOLD** | GLIC Metal SDK | post-process image texture | After music pass, one selective visual effect using same Show Score; **caveat:** 28 certified live presets, not full original 144; effects are separate from music creation | [source](https://github.com/daitomanabe/glic-metal-sdk) |
| **HOLD** | Syphon26 | Metal-to-Metal video transfer | No urgency unless native inter-app transport is actually needed; **caveat:** BSD-3; developer preview; not classic Syphon compatible | [source](https://github.com/daitomanabe/syphon26) |
| **P1_METHOD** | ObjectSpat JS Qwen | LLM -> constrained math functions with schemas | Adapt prompt-to-validated-action+evaluation pattern to musical states; do not run generated code unsandboxed; **caveat:** Ollama/Qwen for production, Claude offline dataset; original system controls actual lights, not music | [source](https://github.com/daitomanabe/objectspat-js-qwen) |
| **P2** | Midi Data Generator | symbolic sequencer/pattern code example | Extract scheduling and phrase morph principles; avoid same-rule loop generation; **caveat:** archived lightweight C++ source; no evidence it produced any named current set | [source](https://github.com/daitomanabe/midi_data_generator) |
| **RESEARCH_ONLY** | MusicGen AudioCraft | audio-to-music experiment/reference | No performance usage without specific licensing review; **caveat:** source MIT but model weights CC BY-NC 4.0; no default commercial stage reuse | [source](https://github.com/facebookresearch/audiocraft) |
| **P2_RESEARCH** | IDyOM | computational melodic expectation | Compare motif predictability vs withheld answer C44; artist listening decides; **caveat:** probabilistic symbolic prediction; not real brain responses; specialized setup | [source](https://www.marcus-pearce.com/idyom/) |
| **P2** | Groove feature note export | expanded human drumming dataset | Use only a small authorized subset if initial GMD inadequate; **caveat:** E-GMD 444h; dataset usage/license needs independent recheck; larger than needed | [source](https://magenta.withgoogle.com/datasets/e-gmd) |
| **CONDITIONAL** | ReaScript | scriptable arrangement/export automation | Only if objective Waveform automation dead-end is verified; **caveat:** REAPER is not free indefinitely; do not swap working Waveform just for automation | [source](https://www.reaper.fm/sdk/reascript/reascript.php) |
| **CONDITIONAL** | Ableton Live Max for Live API | native clip, devices and mixer control | When available, exactly scoped DAW scene control + Show Score; **caveat:** requires lawfully authorized Live/Max, not guaranteed installed or saved | [source](https://help.ableton.com/hc/en-us/articles/5402681764242-Controlling-Live-using-Max-for-Live) |
| **RESEARCH_ONLY** | Demucs | audio stem decomposition for analysis | Study owned audio arrangements; do not publish stems from protected reference; **caveat:** archived and unmaintained; separation does not create sampling rights | [source](https://github.com/facebookresearch/demucs) |
| **P1_METHOD** | James Holden Group Humanizer concept | correlated microtiming across instruments | Design original correlated microtiming that respects an anchor, no raw random humanize; **caveat:** interview describes method; no verified current distributable patch here | [source](https://www.ableton.com/en/blog/james-holden-modular-mind/) |

## Manabe repositories: their respective purposes

| Code base | Verified purpose | Adopt decision |
|---|---|---|
| [vjbake](https://github.com/daitomanabe/vjbake) | Offline audio features → 60fps JSON/data-video; `DATA-SPEC.md` for generated receivers | **P1 immediately after music approved** |
| [link-osc-app](https://github.com/daitomanabe/link-osc-app) | Realtime audio features to OSC, Link transport and keepalive; GPL-2.0-or-later | **P1** bridge, spec adapter |
| [objectspat-js-qwen](https://github.com/daitomanabe/objectspat-js-qwen) | Natural-language→validated math→light control; local Qwen/Ollama, offline stronger model creates gold data | **P0 method reference**; adapt *contracts and evaluation*, not uncontrolled stage code |
| [syntheon](https://github.com/daitomanabe/syntheon) | Audio sample→editable Vital synthesizer parameters | **P2** when original sample + Vital availability confirmed |
| [midi_data_generator](https://github.com/daitomanabe/midi_data_generator) | Archived C++ MIDI phrase/pattern experiments | **P2** symbolic method only |
| [beat-link-cpp](https://github.com/daitomanabe/beat-link-cpp) / [beatlink-max](https://github.com/daitomanabe/beatlink-max) | Pioneer hardware sync/meters/cues; EPL-2.0 for C++ core | **conditional** actual CDJ |
| [oflike-metal](https://github.com/daitomanabe/oflike-metal) | Creative C++ API atop native Metal | **HOLD** while music P0 |
| [glic-metal-sdk](https://github.com/daitomanabe/glic-metal-sdk) | 28 certified real-time image glitch effects | **HOLD** until actual visual need |
| [syphon26](https://github.com/daitomanabe/syphon26) | GPU inter-app transport, developer preview, no classic Syphon bridge | **HOLD** |

**Source warning:** public code and a public artist's performance are two separate evidence claims. None of these repos proves the actual sound/rendering implementation of any named concert unless supported by performance-specific documentation.

## Licenses and safety

- AudioCraft code MIT, model weights **CC BY-NC 4.0**; not a default commercial sound source.
- Magenta RealTime 2 code Apache 2.0 / weights CC BY 4.0 plus model use terms.
- ACE-Step 1.5 GitHub project MIT but confirm the exact selected model file terms and third-party dependencies.
- Stable Audio 3 open weights: Community License; check latest account/attribution/revenue limits before commercial release.
- Clips/stems separated from copyrighted recordings remain copyrighted. Do not use third-party audio as unrestricted training material or sample-library source.
- Local GPU hardware and real VST performance measurements should be reported, not extrapolated from cloud/server benchmarks.

## Decision impact before December 3

**Adopt now:** instrument inventory + Waveform native save/reopen; original groove/humanizing research on GMD; Essentia/FluCoMa on owned sound; capture/compare live material, then DAW edit.

**Explore in bounded P1 test:** Magenta RealTime 2 SMALL on M1 Pro, ACE-Step as an offline source on Windows if resource permits, Syntheon only if Vital installed, and vjbake once real approved WAV exists.

**Stop:** more browser synth mockups as stage masters, 24-way cosmetic preset swap, 2.4B MRT2 live on M1 Pro, beatlink without Pioneer equipment, GLIC/syphon before a music pass.
