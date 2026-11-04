# Production Stack Selection Gate — 2026-11-04

**Decision:** STOP using bare SuperCollider synthesis as the entire production workflow. Keep one DAW production environment + mature sound sources + narrow purpose-built DSP engine. No purchases, no unlicensed workarounds, no speculative tool migrations before testing.

## Evidence base — a 26.04 s user-supplied listening clip

The latest private sample (**Listening_02.mp3**) has more distinct tactile, syncopated, percussive electronic language than the previously reviewed soft keyboard demo:
- short, elastic, pitched bass/percussion with groove;
- metallic transient motifs and discrete accents;
- a strong subtraction/re-entry contrast across sections;
- a sense of edited and staged phrasing, despite only 26 seconds of audio.

**Caveats:** This does not prove a commercial-grade master or a full mature composition. Its long quiet passages and subsequent recombination still need musical development. Its audio itself is NOT committed to the public repository. Don't copy its waveform or infer a sample licence.

The **important difference** is musical curation, sound selection, rhythmic dialogue, silence and deliberate editing — not software brand.

## Primary selection

**A. If the existing Ableton Live installation is lawfully authorized and can Save As / Export:** keep it as the professional arrangement and mixing desk. Do not throw away a working workflow that already produced music the user prefers. Codex can generate MIDI and stems, propose edits, and use permitted Ableton integration. The old screenshot showed an authorization warning, so verify this before relying on the project.

**B. If there is no licensed, savable Live setup:** choose **Tracktion Waveform Free 14** as the DAW. It is available at zero purchase cost on Apple Silicon Mac and Windows, has audio/MIDI tracks, plugin hosting (VST3/AU), racks, recording, mixing, export and free included synth/drum utilities. Some expansion features are paid, so do NOT build requirements around the paid Launcher/Synth Packs.

**Sound tools (free):**
1. **Surge XT** — fully free/open hybrid VST3/AU synthesizer with expressive professional patches and advanced envelopes/modulation/FX. Recommended as primary bass/metallic/pluck/harmonic synthesis.
2. **plugdata** — free/open modular Pd environment, standalone or VST3/AU plugin. Recommended as Max/MSP-like experimental effects/instrument/state bridge, with source-controlled text .pd patches.
3. **Valhalla Supermassive** — free proprietary spatial delays/reverbs; use on returns, not on everything. No purchase.
4. DAW's existing EQ, compressor, saturation and limiter for final audio production. Optionally TDR Nova Free only when needed.

**Optional high-Agent automation research:** REAPER + ReaScript Lua/Python/JSFX. Its full 60-day evaluation is legitimate but the application is NOT freeware beyond evaluation (discounted license currently US$60). Therefore NOT the permanent zero-cost default; do not depend on it for a long-term nonpaying workflow.

**Other alternatives:** GarageBand free on Mac can supply genuinely curated instruments/drummers/AU instruments but does not have comparable native API scripting; Ardour can be compiled freely and has Lua scripting but requires an implementation/setup investment on macOS. Don't confuse open-source with ready-to-install zero cost. The goal is to finish music rather than constantly rebuild a DAW.

## Comparison by required role

| Role | App | What Codex can reliably create | What requires runtime/GUI verification |
|---|---|---|---|
| Arrangement / mix (legit Live available) | Ableton | .mid, rendered stems, plans, mapped OSC/MIDI program, sometimes API actions | plugin availability, true device states, final WAV and quality |
| Arrangement / mix (free) | Waveform Free | .mid, .wav, score, cue/metadata and import/setup checklist | editor project, plugin routing, exports, live clips |
| Signature sound | Surge XT | patch plan, parameter tables, MIDI controller mappings | native patch programming, patch saved/reloaded, actual sound |
| Audition/SFX engine | SuperCollider | .scd scripts, NRT render, OSC events, sound stems | sonic impression, output system, DSP safety |
| Real-time/Max substitute | plugdata | .pd patch source, OSC/mapping/state plans | plugin version, voice/channel routing, CPU, actual musical response |
| Creative depth/delay | Supermassive | return bus guidance + named FX parameters | plugin UI state and resulting mix |
| Scriptable DAW trial | REAPER | Lua script for MIDI/items/routing/render; repeatable tests | account/license term, actual plugin GUI/reads |

## Required 90-minute A/B test: use what already sounded better

Do NOT ask Codex to invent a new melodic arpeggio. Test one **original 16-bar loop inspired by the reference's MUSICAL PROPERTIES**, not its exact notes or samples.

1. Identify the private clip's high-level mechanisms: percussive bass, ringing high elements, negative space, rhythmic call-and-response, and selective dropout.
2. Generate **one** original bass/percussion motif of 2 bars; export MIDI.
3. Use Surge XT to make 3 sound roles: elastic bass, bright pitched transient, sustained pressure/noise. A percussion sample or self-recorded sound can provide another independent layer if rights are clear.
4. Make two **meaningfully different 16-bar arrangements**:
   - A: sparse, groovy, with four deliberate rests and one variation of the central rhythm.
   - B: dislocated temporal layers that create tension, then a decisive impact; not simply a louder A.
5. Mix in the DAW with actual sound choices: transient sculpting, time/phase relationships, bass/kick avoidance, selective stereo, carefully controlled delay. Do not saturate everything.
6. Bounce A and B for **blind audition**, level matched, and annotate timestamps. No pass unless the actual audio is heard and the user prefers one.
7. Only then extract the 60–90 second signature scene into a 4-stem live system and add shared Show Score state / foot event.

## Current album/show target remains

**CRITICAL FIELD / 临界场** with 4-act 16-minute score on December 3; first gate is still a convincing 60–90 second audio/visual scene (no longer algorithmically bland). See `performances/2026-12-03-phase-01/DIRECTOR_SCORE.md`.

## Explicitly do not claim

- that Waveform Free has native REAPER-equivalent Agent scripting (not established);
- that a scripted sine/triangle wav equals professional tone or mix;
- that plugdata already communicates with the user's local SuperCollider/visual engine;
- that external plug-ins are installed or paid for;
- that a 26-second audio clip is a finished track/master;
- that the downloadable Mac/Windows tools were automatically installed;
- that a musical A/B listening preference has been recorded before a human audition.

## Official references

- Waveform Free: https://www.tracktion.com/products/waveform-free
- GarageBand Mac: https://www.apple.com/mac/garageband/
- Surge XT download: https://surge-synthesizer.github.io/downloads/
- plugdata official: https://plugdata.org/
- Valhalla Supermassive: https://valhalladsp.com/shop/reverb/valhalla-supermassive/
- TDR Nova Free: https://www.tokyodawn.net/tdr-nova/free/
- REAPER scripting: https://www.reaper.fm/sdk/reascript/reascript.php
- REAPER licensing: https://www.reaper.fm/purchase.php
- Ardour official free-vs-prebuilt clarification: https://ardour.org/faq.html

**This is a selection plan, not a claim of local installation or produced professional audio.**
