#!/usr/bin/env python3
"""Composition Plan v1: zero-dependency cross-reference and form validator.

Checks practical invariants beyond JSON Schema; does NOT score musical quality or audio.
Full structural JSON Schema validation can be added with the optional 'jsonschema' package.
Usage: python3 check_plan.py recoil-expectation-32bar.example.json
"""
import json
import sys
from pathlib import Path


def check(data):
    errors = []
    for key in ("schema_version", "plan_id", "tempo_bpm", "meter", "total_bars", "motifs", "sections", "expectations", "constraints", "performance", "review"):
        if key not in data:
            errors.append(f"required top-level field missing: {key}")
    if errors:
        return errors

    if data["schema_version"] != "1.0":
        errors.append("schema_version must equal 1.0")
    bpm = data["tempo_bpm"]
    if not isinstance(bpm, (float, int)) or isinstance(bpm, bool) or not 0 < bpm <= 300:
        errors.append("tempo_bpm out of range")
    bars = data["total_bars"]
    if not isinstance(bars, int) or isinstance(bars, bool) or not 2 <= bars <= 1024:
        errors.append("total_bars out of range")
        return errors

    meter = data["meter"]
    if not isinstance(meter, list) or len(meter) != 2 or meter[1] not in (2, 4, 8, 16) or meter[0] < 1:
        errors.append("meter invalid")
    motifs = data["motifs"]
    ids = [x.get("id") for x in motifs]
    if not ids or len(ids) != len(set(ids)):
        errors.append("motif ids must be unique and nonempty")
    if any(not x.get("identity_rule") for x in motifs):
        errors.append("each motif needs an identity_rule")

    sections = data["sections"]
    next_bar = 1
    section_ids = []
    for section in sections:
        section_ids.append(section.get("id"))
        begin, end = section.get("start_bar"), section.get("end_bar_exclusive")
        if not isinstance(begin, int) or not isinstance(end, int):
            errors.append(f"non-integer section boundary: {section.get('id')}")
            continue
        if begin != next_bar:
            errors.append(f"gap/overlap before {section.get('id')}: expected start {next_bar}, got {begin}")
        if end <= begin or end > bars + 1:
            errors.append(f"invalid section end: {section.get('id')}")
        if section.get("motif_id") not in ids:
            errors.append(f"section references missing motif: {section.get('id')}")
        if not section.get("operations"):
            errors.append(f"section has no operations: {section.get('id')}")
        next_bar = end
    if next_bar != bars + 1:
        errors.append(f"sections must end at bar {bars + 1} exclusive")
    if len(section_ids) != len(set(section_ids)):
        errors.append("section ids must be unique")

    expectation_ids = []
    for expectation in data["expectations"]:
        eid = expectation.get("id")
        expectation_ids.append(eid)
        if expectation.get("motif_id") not in ids:
            errors.append(f"expectation {eid}: missing motif")
        introduced = expectation.get("established_by_bars", [])
        window = expectation.get("operation_range", [])
        fulfil = expectation.get("fulfilment", {})
        predicted = expectation.get("predicted_bar")
        f_bar = fulfil.get("bar")
        if len(introduced) != 2 or len(window) != 2:
            errors.append(f"expectation {eid}: invalid windows")
            continue
        if not (1 <= introduced[0] <= introduced[1] <= bars):
            errors.append(f"expectation {eid}: establish window out of range")
        if not isinstance(predicted, int) or not (1 <= predicted <= bars):
            errors.append(f"expectation {eid}: predicted bar out of range")
        if not (1 <= window[0] < window[1] <= bars + 1):
            errors.append(f"expectation {eid}: operation window out of range")
        if not isinstance(f_bar, int) or not (1 <= f_bar <= bars):
            errors.append(f"expectation {eid}: fulfilment out of range")
        elif predicted is not None and f_bar < predicted:
            errors.append(f"expectation {eid}: fulfilment before predicted event")
        if introduced[1] >= window[0]:
            errors.append(f"expectation {eid}: establishment must precede the intervention")
        if not expectation.get("audible_cue"):
            errors.append(f"expectation {eid}: audible_cue missing")
    if len(expectation_ids) != len(set(expectation_ids)):
        errors.append("expectation ids must be unique")
    return errors


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 check_plan.py <plan.json>", file=sys.stderr)
        return 2
    path = Path(sys.argv[1])
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"ERROR reading plan: {exc}", file=sys.stderr)
        return 2
    errors = check(data)
    if errors:
        print("PLAN REJECTED (cross-reference / structure checks):")
        for error in errors:
            print("- " + error)
        return 1
    duration = data["total_bars"] * data["meter"][0] * (4 / data["meter"][1]) * 60 / data["tempo_bpm"]
    print(f"CROSS-REFERENCE CHECK PASS: {data['plan_id']}")
    print(f"{data['total_bars']} bars, {duration:.3f}s at {data['tempo_bpm']} BPM")
    print("Not verified: JSON Schema full constraints, actual MIDI edit, DAW export, listening quality, physical instrument.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
