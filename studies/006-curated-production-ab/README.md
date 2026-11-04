# Curated production gate: original 16-bar A/B

**Status: real Surge/plugdata preparation render; Waveform Free 14 open/save/export NOT RUN. Human audition PENDING.** Do not label these Waveform bounces or stage-quality tracks.

Read `../../START_HERE_FOR_LOCAL_CODEX.md` and `../../research/agent-music/PRODUCTION_STACK_DECISION_2026-11-04.md` first. Current stack is Waveform Free 14 + Surge XT + plugdata, zero purchase cost. No alternative paid/trial DAW is selected.

## Actual local setup

Initially none of those three products was installed. `/Applications/Surge.app` is the unrelated network proxy. Official, signed/notarized Surge XT 1.3.4 and plugdata 0.9.3 packages were downloaded; user-local app/VST3 installation verified. Surge factory data is in `~/Library/Application Support/Surge XT`. Download Manager1.5.3 installed, but its launch/inspection returned no actionable window. The user reported claiming the product; installation of **Waveform Free 14 itself remains unverified**. No Pro trial was activated. No password, verification token or licence agreement was entered/accepted by the agent. No purchase.

`inventory.json` records versions; `AUDIT.md` records actual results and failures. Existing Ableton project and all previous studies remain untouched. Source/downloads/evidence stay local, no GitHub push.

## What is original here

No reference waveform or reference note file is read by any composition/render script. The supplied Listening_02 contributes only high-level research mechanisms: syncopated pitched low percussion, metallic attacks, purposeful silence and recombination. Neither its actual audio nor the earlier procedural sketch is sampled.

`score.json` contains an original G-centred two-bar bass proposition and two manually edited 16-bar arrangements, 128BPM /64 beats /30s, plus1.5s aligned export tail.

- A: sparse dialogue, four phrase-ending rests, middle withdrawal, return with altered answer.
- B: displaced bass entries against three-beat metal spacing, withheld arrivals, longer pre-return absence and a decisive bar13 arrival. Fewer kick/snare hits; not merely a louder A.

MIDI velocity, note length and selected 7–11ms answer delays are authored. **No claim of a human-recorded performance.** A test caught that factory Rubber Bass originally ignored velocity; both scene VCA velocity ranges were explicitly set, and 48-vs112 velocity RMS now differs3.58×. Unverified CC modulation is omitted.

Mature factory presets are the starting points: Rubber Bass, Metal Pluck, Kick Tech1, Snare Tight, Radio Noise. Preset authors and actual production parameter changes are recorded in `source-render-tests.json`. The synths are the real installed VST3 instruments, not recreated waveforms.

## Processing actually run

Surge preset effects disabled to make selective processing explicit. Real source preparation uses high/low cuts, subtractive bell EQ, modest compression, role-specific gain, mono bass/kick, brief kick-triggered bass attenuation, authored metal panning, and the original `metal-memory.pd` patch running inside actual plugdata-fx. Its cross-channel13/21ms early reflections have no feedback; they are applied only to metal. The measured64-sample plugdata pipeline delay is compensated. Short fade ramps preserve four deliberate rests including tails. No reverb wash, drum-density ramp, or master saturation substitute.

`PREVIEW_A.wav` / `PREVIEW_B.wav` are **preparation mixes, not final Waveform exports**. Both measured−25.26LUFS integrated; true peaks−2.20/−2.34dBTP. Sparse transients retain a large crest factor; raising loudness has not been used as a quality claim. Four aligned stems reconstruct each preview within3.58e−7 amplitude. Human audibility, groove and tone quality remain to be judged.

## Recovery package

`outputs/Waveform-source-package/{A,B}/` contains four frozen original stems, ten total original MIDI parts, the actual five Surge states per version, actual plugdata state and original .pd patch. `CF_16bar_A.tracktionedit` and `CF_16bar_B.tracktionedit` are **prepared native XML, not runtime-validated DAW projects**. Each uses four tracks split into four 4-bar blocks. A mild native master shelf/compressor chain is prepared in XML; it has NOT yet been run. Do not call it applied processing.

After relocating the package, run `python3 relocate.py` inside it. The script updates only its media references. Hash manifest is provided. Frozen stem data and source VST3 states have actual verification; Waveform GUI save/reopen/render is still the outstanding gate.

## Reproduce preparation

Use the isolated environment already created under `local-only/toolchains/production-python`. Dependencies: pedalboard0.9.26, mido1.3.3, numpy, scipy, soundfile, FFmpeg; official Surge/plugdata plugins and Surge factory data must be installed.

From repository root:

```sh
local-only/toolchains/production-python/bin/python studies/006-curated-production-ab/compose.py
local-only/toolchains/production-python/bin/python studies/006-curated-production-ab/render_sources.py
local-only/toolchains/production-python/bin/python studies/006-curated-production-ab/test_sources.py
local-only/toolchains/production-python/bin/python studies/006-curated-production-ab/plugdata_host.py
local-only/toolchains/production-python/bin/python studies/006-curated-production-ab/prepare_mix.py
local-only/toolchains/production-python/bin/python studies/006-curated-production-ab/build_waveform_edit.py
local-only/toolchains/production-python/bin/python studies/006-curated-production-ab/verify_package.py
```

Back up an existing output folder before intentionally regenerating an audition. The current first failed pre-velocity renders and failures are preserved in ignored evidence. Preparation processing is offline and does not touch the Live session or audio-device routing.

## Required completion gate

1. User finishes own account verification/login and opens **Waveform Free14**, not Pro trial; any licence acceptance is done by user.
2. Verify actual installed version, Free entitlement, Save As and WAV export capability.
3. Open each prepared edit; verify128BPM, media, 30s range, four tracks, safe output; save a NEW native version and reopen it.
4. Verify native master processing, make necessary mix/structure edits, actually export final24-bit WAVs and aligned stems. The official14.1.22-beta manual describes CLI render; **do not assume installed14.0 supports it**. Inspect the actual binary/help first.
5. Measure final bounces, make neutral blind copies, then submit for user audition. User may choose either or neither. No further expansion before that decision.
