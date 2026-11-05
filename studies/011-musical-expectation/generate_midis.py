#!/usr/bin/env python3
"""Generate two ORIGINAL, 32-bar MIDI arrangement studies of musical expectation.

Dependency: pip install mido. No audio model, plugin or outside samples required.
Output: out/expectation_A.mid, out/expectation_B.mid, out/manifest.json
No claim that either version is musically compelling; audition them in a DAW.
"""
from __future__ import annotations

import json
from pathlib import Path
import mido

BPM = 128
BARS = 32
TPQ = 480
TICKS_PER_BAR = TPQ * 4
ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"

# Absolute onset in beats from song start; values are (beat, pitch, length_beats, velocity)
def add(notes, bar, beat, pitch, length, velocity):
    assert 1 <= bar <= BARS
    assert 0 <= beat < 4
    assert 0 < length <= 4
    notes.append(((bar - 1) * 4 + beat, pitch, length, velocity))


def make_data(version):
    bass, metal, pulse = [], [], []
    omissions, transformations = [], []

    for bar in range(1, BARS + 1):
        # Rhythmic grounding remains audible during the expected bass omission.
        # A miniature side pulse is not intended to simulate a professional kick sound.
        add(pulse, bar, 0.0, 36, 0.10, 72 if bar <= 16 else 60)
        add(pulse, bar, 2.0, 42, 0.08, 48)
        if bar % 4 == 0:
            add(pulse, bar, 3.50, 42, 0.06, 55)

        bass_is_omitted = version == "A" and 17 <= bar <= 24
        if bass_is_omitted:
            omissions.append(bar)
        else:
            # Two-bar question; register and articulation alter on return.
            if version == "A" and bar >= 25:
                root = 50 if bar <= 28 else 38
                attack = 108
                length = 0.42
            else:
                root = 38  # D2
                attack = 99
                length = 0.68
            add(bass, bar, 0.0, root, length, attack)
            if bar % 2 == 0:
                add(bass, bar, 1.50, root + 7, 0.34, 70)
                add(bass, bar, 2.75, root + (3 if bar >= 9 else 5), 0.35, 82)
            else:
                add(bass, bar, 2.25 if 9 <= bar <= 16 else 2.75, root + 7, 0.36, 78)
            if version == "A" and bar == 25:
                transformations.append({"bar": 25, "change": "bass returns one octave above, shorter attack/decay"})

        # All tracks share an initial rhythmic dialogue.
        if version == "B" and 17 <= bar <= 24:
            # B changes the response, NOT the expected bass: longer, displaced metal notes.
            add(metal, bar, 1.25, 77 if bar % 2 else 74, 1.05, 73)
            transformations.append({"bar": bar, "change": "metal answer widened in duration and shifted earlier"})
        elif version == "A" and 17 <= bar <= 24:
            # A deliberately preserves the metal cue so the absent bass is legible.
            add(metal, bar, 2.25, 74, 0.16, 82)
            add(metal, bar, 3.25, 79, 0.10, 62)
        else:
            add(metal, bar, 2.25, 74 if bar % 2 else 77, 0.16, 82)
            if bar % 2 == 0:
                add(metal, bar, 3.25, 79, 0.11, 63)

    return {"bass": bass, "metal": metal, "pulse": pulse,
            "omitted_bass_bars": omissions, "transformations": transformations}


def build_track(name, notes, channel, program=None):
    tr = mido.MidiTrack()
    tr.append(mido.MetaMessage("track_name", name=name, time=0))
    if program is not None:
        tr.append(mido.Message("program_change", channel=channel, program=program, time=0))
    messages = []
    for beat, pitch, length, velocity in notes:
        tick = round(beat * TPQ)
        end_tick = round((beat + length) * TPQ)
        messages.append((tick, 1, mido.Message("note_on", channel=channel, note=pitch, velocity=velocity, time=0)))
        messages.append((end_tick, 0, mido.Message("note_off", channel=channel, note=pitch, velocity=0, time=0)))
    messages.sort(key=lambda item: (item[0], item[1]))
    previous = 0
    for tick, _, msg in messages:
        tr.append(msg.copy(time=tick-previous))
        previous = tick
    tr.append(mido.MetaMessage("end_of_track", time=max(0, BARS*TICKS_PER_BAR-previous)))
    return tr


def build_midi(version, data):
    mid = mido.MidiFile(type=1, ticks_per_beat=TPQ)
    control = mido.MidiTrack()
    control.append(mido.MetaMessage("track_name", name="FORM / expectation "+version, time=0))
    control.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    control.append(mido.MetaMessage("time_signature", numerator=4, denominator=4, time=0))
    last = 0
    for bar, label in [(1, "ESTABLISH"), (9, "DEVELOP"),
                       (17, "WITHHOLD" if version == "A" else "REINTERPRET"),
                       (25, "RETURN_TRANSFORMED" if version == "A" else "RELEASE")]:
        tick = (bar - 1) * TICKS_PER_BAR
        control.append(mido.MetaMessage("marker", text=label, time=tick-last))
        last = tick
    control.append(mido.MetaMessage("end_of_track", time=BARS*TICKS_PER_BAR-last))
    mid.tracks.append(control)
    mid.tracks.append(build_track("BASS QUESTION / original MIDI", data["bass"], channel=0, program=38))
    mid.tracks.append(build_track("METAL ANSWER / original MIDI", data["metal"], channel=1, program=10))
    mid.tracks.append(build_track("PULSE GRID / GM drums", data["pulse"], channel=9))
    return mid


def note_bars(notes):
    return {int(beat//4)+1 for beat, _, _, _ in notes}


def main():
    OUT.mkdir(exist_ok=True)
    outputs = {}
    for version in ("A", "B"):
        data = make_data(version)
        if version == "A":
            assert not set(range(17,25)) & note_bars(data["bass"]), "A has unintended bass during withheld section"
            assert 25 in note_bars(data["bass"]), "A does not fulfil on bar 25"
        else:
            assert set(range(17,25)).issubset(note_bars(data["bass"])), "B must keep bass during the same window"
            assert any(17*4 <= beat < 24*4 for beat, _, _, _ in data["metal"]), "B response rewrite missing"
        path = OUT / f"expectation_{version}.mid"
        mid = build_midi(version, data)
        mid.save(path)
        # Re-open to validate the MIDI header and timing envelope.
        test = mido.MidiFile(path)
        assert len(test.tracks) == 4
        assert test.length > 59.8 and test.length < 60.2, f"unexpected duration: {test.length}"
        outputs[version] = {
            "midi_file": path.name,
            "duration_sec": round(test.length,3),
            "note_count": {k: len(data[k]) for k in ("bass", "metal", "pulse")},
            "omitted_bass_bars": data["omitted_bass_bars"],
            "transformations": data["transformations"],
            "status": "GENERATED_SYMBOLIC_ONLY_NOT_AUDITIONED"
        }
    report = {
        "title": "Original 32-bar expectation study",
        "bpm": BPM, "bars": BARS, "copyright": "original note/event study",
        "notes": "General MIDI program numbers are illustrative. Replace with purpose-made synths/recordings in a legitimate DAW. Musical value requires human listening.",
        "outputs": outputs
    }
    (OUT / "manifest.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n",encoding="utf-8")
    print(json.dumps({v: outputs[v]["midi_file"] for v in outputs}, indent=2))
    print("PASS: generated 2 original, structurally distinct MIDI studies; each 32 bars/60 seconds.")
    print("NOT TESTED: sound quality, plugin/DAW compatibility, actual human expectation.")


if __name__ == "__main__":
    main()
