# CURRENT / 向流 — one continuous electronic instrument

**Artist approval PENDING.** The artist rejected all three PR50 music candidates.
Their synthesis/export capability is reused; their MIDI scores, plucked notes,
audio and preset designs are not this work's musical source. Visuals stay paused.

This is one instrument and one90-second recorded performance. A held D3 excites
the oscillator network; there is no new MIDI song, arpeggio, bass loop, random
variation or added track. Performance mode uses four saved native CV curves,
not a claim of human real-time playing. Live mode has four native macro knobs.

[Online listening and review entry point](../../review/2026-11-09-current-instrument/ONLINE_REVIEW.md).

## Instrument and reason for each stage

- Absolute-Hz FM: a fourth-harmonic carrier, a continuously changing modulator
  ratio and modulation index. The fourth harmonic is implemented by native Math
  nodes; external Poly pitch bypasses the oscillator's Octave knob.
- Native diode ring modulation followed by4x-oversampled Foldback changes the
  same source's harmonic structure, not an unrelated climax noise layer.
- Moving low-pass cutoff/resonance, a DC/low-frequency filter and smooth motor
  articulation produce continuous microscopic movement without repeated gates.
- The existing octave oscillator is band-limited and keeps the same envelope
  and motor. It bypasses the nonlinear makeup and its pressure compensation to
  retain low-body energy as the upper spectrum opens. No new oscillator/track
  was added to make the critical moment louder.
- Correct137ms delay,18ms reverb pre-delay, slow pan and small delay-time motion
  articulate space. Stereo legs are explicitly enabled. Reverb dry=.5 gives
  unity dry because this module uses JUCE's dry*2/wet*3 laws.

| Native Macros node31 | What it changes |
|---|---|
| M1 Pressure | FM ratio/index, diode/foldback amount, resonance, bounded internal level compensation |
| M2 Motion | Smooth motor rate/depth; no note sequencing |
| M3 Open | Spectral aperture; slow independent filter motion remains |
| M4 Distance | Delay/reverb balance and width; core remains identifiable |

Node30 is a utility constants bank. It is not the performer panel. All graph
positions are saved in the actual native `position` format. Hardware CC mapping
and hands-on macro GUI operation remain **NOT_TESTED**; native manual value
changes, graph/state reload and audio response have been exercised.

## Actual files

- `outputs/final-06/CURRENT_90s.wav`: actual Waveform48k/24bit stereo export.
- `outputs/final-06/CURRENT_90s_EDITABLE.tracktionedit`: one native synth track,
  embedded native performance state and one sustained key, not an audio-only shell.
- `patches/CURRENT_LIVE_R2.json` / `.state`: manual-macro instrument.
- `patches/CURRENT_PERFORMANCE_R2.json` / `.state`: same instrument with recorded
  native parameter gestures.100-second nominal curves use only the first90s.
- `outputs/take-06/RAW_CONTINUOUS_INSTRUMENT.wav`: raw unmastered instrument take.
- `outputs/final-06/WEAKEST_CANDIDATE_29-41s.wav` and `AUDIO_AUDIT.json`.

The exported master only uses constant gain toward-20LUFS. No dynamic master
gain, clip limiter or automatic artistic scoring. Native LFO phase is accumulated
in single precision; the programmed58.4s pressure peak was measured near59.8s.
Use actual audio/control measurements for timecodes, not nominal curve points.

## Reproduce in this repository

Use the existing production Python with mido/numpy/scipy/soundfile/pedalboard.
Agent Synth0.588.1 VST3 and Waveform14.1.24 remain the engines. Fresh output
directories refuse overwrite. No paid software, AI service or new clock/framework.

```sh
python studies/019-continuous-field-instrument/record.py --run take-06
python studies/019-continuous-field-instrument/export_waveform.py --take take-06 --out final-06
python studies/019-continuous-field-instrument/audit.py
```

Direct re-render of the saved native edit requires only Waveform and Agent Synth:

```sh
"/Applications/Waveform 14.app/Contents/MacOS/Waveform 14" render CURRENT_90s_EDITABLE.tracktionedit \
  -o NEW_OUTPUT.wav --format wav --sample-rate 48000 --bit-depth 24 \
  --channels stereo --start 0 --end 90 --no-tails --json
```

Exact executed argument arrays are in `outputs/final-06/EXPORT.json`.

## Review limits

29–41s is a **weakest candidate from measurements**, not the weakest section heard
by a model. Its controls rise but timbre development is restrained. Around60s,
the spectrum opens while mean level falls slightly; low-body preservation improved,
but120–500Hz still loses energy. Whether this creates compelling tension is for
the artist to hear. No professional-quality, accepted-music or stage-ready pass.

Native JSON/full-state fresh-instance reopening and Waveform export are tested.
Full-work GUI reopen, hands-on macro performance, hardware MIDI, latency/soak and
acoustic monitoring remain NOT_TESTED. The optional standalone download was
retrieved but extraction/signature validation failed; it is not deployed or used.
All old projects and discarded technical takes are retained.
