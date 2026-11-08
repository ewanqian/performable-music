# Hand Seal Trainer / 掌诀训练器 V1

**Live page after GitHub Pages deploy:**  
https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/handseal-trainer.html

This is a new page layered on the existing LAB02 WebXR hand skeleton and 25-joint renderer. The original sensor baseline, PHALANX DIAL, music instruments and Gestural Atlas pages remain separate.

## What is implemented

1. **十二辰掌中认位** — 12 Chinese glyphs are rendered as camera-facing WebGL text sprites directly beside their corresponding 3D joint anchors. Labels follow the hand in desktop preview and immersive WebXR.
2. **拇指掐位 detector** — thumb-tip to target-joint distance, nearest-point selection, dwell, hysteresis, release/re-arm and tracking-loss neutralization. A contact is emitted once, not continuously while held.
3. **Guided routes** — all twelve positions in order, an index-finger four-point path and a pinky four-point path. Wrong targets are reported without advancing.
4. **剑指 pose coach** — five explainable checks: index straight, middle straight, ring curled, little finger curled, index/middle tips together. All must remain true for 500ms. First failing condition is shown.
5. **雷诀 source atlas** — six textual records from the 雷诀 section of 《道法会元》卷五十四, with a manual checklist. It deliberately does **not** claim automatic authentication of lineage-specific ritual poses.
6. **Desktop simulation and JSON session export** — simulated contacts/poses are visibly labeled as simulated and never reported as headset tracking.

## 十二辰 target map

The textual rule is: the thumb presses the named point. The branch glyphs are labels for the **target locations**, not 12 separate finger poses.

| 地支 | Traditional description | WebXR joint anchor |
|---|---|---|
| 子 | ring-finger root | 16 ring-finger-phalanx-proximal |
| 丑 | middle-finger root | 11 middle-finger-phalanx-proximal |
| 寅 | index-finger root | 6 index-finger-phalanx-proximal |
| 卯 | index finger, first/second segment crease | 7 index-finger-phalanx-intermediate |
| 辰 | index finger, second/third segment crease | 8 index-finger-phalanx-distal |
| 巳 | index fingertip | 9 index-finger-tip |
| 午 | middle fingertip | 14 middle-finger-tip |
| 未 | ring fingertip | 19 ring-finger-tip |
| 申 | little fingertip | 24 pinky-finger-tip |
| 酉 | little finger, second/third segment crease | 23 pinky-finger-phalanx-distal |
| 戌 | little finger, first/second segment crease | 22 pinky-finger-phalanx-intermediate |
| 亥 | little-finger root | 21 pinky-finger-phalanx-proximal |

These are a practical mapping of traditional crease/segment descriptions onto WebXR's standard 25 joint points. They are not a guarantee that a tracked joint point equals the exact skin crease for every hand. The user can adjust the contact threshold (default 34mm) and dwell (default 140ms). A future calibration wizard should learn each person's comfortable contact distance and per-joint offsets.

## Practice curriculum

Recommended progression:
1. **Recognize:** tap/inspect all twelve labels; learn finger names and roots/intermediate/distal/tips.
2. **Single-point contact:** practice 寅、卯、辰、巳 on the index finger; then 亥、戌、酉、申 on the little finger.
3. **Branch order:** 子 → 丑 → 寅 → 卯 → 辰 → 巳 → 午 → 未 → 申 → 酉 → 戌 → 亥.
4. **Sequence fluency:** complete the index and pinky paths in both directions.
5. **Static pose:** learn the simplified sword-finger posture.
6. **Source comparison:** read the six 雷诀 records and compare only with appropriately sourced diagrams/teacher guidance before attempting to create pose classifiers.
7. **Combined choreography:** only after the individual movements are stable, design an original sequence such as 起势 → 掐位 → 成诀 → 保持 → 收势. This is an interaction choreography, not a prescribed religious ritual.

## Sword-finger detector

The current recognizer is a deliberately simple training model:
- index PIP bend <= 43 degrees
- middle PIP bend <= 43 degrees
- ring PIP bend >= 48 degrees
- pinky PIP bend >= 48 degrees
- index/middle tip distance <= 68mm
- all five checks true continuously for 500ms

The angle is a geometric bend derived from 3D points, not an anatomically calibrated medical angle. The thresholds are initial heuristics and should be calibrated from real Quest samples. Thumb placement is not yet part of the detector. This is a basic sword-finger pose for interaction training, not a claim that every school uses one identical form.

## 雷诀 source records

《道法会元》卷五十四 contains concise descriptions of 天雷、地雷、云雷、水雷、妖雷、斗雷. The source text uses terms such as 掐寅、招丑、招亥、掐子, finger bending, pressing and crossing. The six descriptions are preserved in the page as reading cards.

**Why they are not auto-certified:** short textual descriptions do not uniquely specify all joint angles, hand orientation, thumb concealment, dorsal/palm facing, or lineage variants. Some actions refer to contact relations rather than static poses. Without a clear diagram and qualified contextual review, a generic 25-joint threshold classifier would invent precision. The current page therefore guides reading and manual comparison; it does not claim a validated pose detector or supernatural effect.

## Rendering / performance

- Existing WebGL line renderer gains an optional small CJK texture atlas and billboard quads. It is initialized only when data-labels="on" is set on the trainer page; other LAB02/performer pages do not pay this setup cost.
- 17 glyphs are pre-rendered to one atlas; no per-frame DOM text layout or per-label canvas allocation.
- Each XR frame builds a small dynamic vertex buffer for labels; the 12 branch positions are drawn with one batched glyph call.
- The text is camera-facing; joint anchors remain in the WebXR local reference space. Labels are not world-anchored and may need hand-specific offset tuning.
- The app continues to use the existing app.mjs and 25-joint sensor pipeline. No second XR session or second renderer is introduced.

## Known limitations

- WebXR has no standardized per-joint pressure or touch sensor. Contact is a geometric estimate.
- Joint locations differ by hand size, tracking provider, and pose; calibration is necessary.
- Occlusion and partial tracking can produce missing joints. Tracking loss is UNKNOWN and clears active contacts; it must not fabricate a success.
- The current sword-finger classifier is a simple rule set, not ML, not lineage-specific, and not hardware-validated.
- 雷诀 entries are a source atlas and manual checklist, not auto-recognition.
- No room anchors, hand-model ghost mesh, full body choreography, audio ritual score or physical prop simulation is included yet.
- Real Quest 3 / Quest 3S acceptance, CJK glyph readability, frame time, and contact false-positive rate are still pending.

## Acceptance tests

### Automated (CI)
- all 12 branch names map to the expected 25-joint indices
- contact waits for dwell, emits once, requires release, and supports sliding to a new point with a release event
- tracking loss clears active/candidate state without fabricating a contact
- guided lessons only advance on the expected branch
- sword pose returns five explainable checks, requires 500ms stability, and resets on posture change
- six 雷诀 records remain source-attributed and manual-only

### Real headset
- [ ] Test both hands; choose right, left and auto modes.
- [ ] Capture 20 contacts per target across all 12 positions.
- [ ] Record false positives between adjacent points and adjust thresholds.
- [ ] Confirm label glyphs stay attached to joints and do not overlap excessively at normal viewing distance.
- [ ] Confirm tracking loss resets the progress bar and does not advance the lesson.
- [ ] Capture 20 valid and 20 invalid sword-finger poses; compare each of the five rule outputs.
- [ ] Test five minutes of continuous rendering; measure Quest compositor FPS separately from JavaScript update timing.
- [ ] Review all six 雷诀 descriptions against a clear source diagram before enabling any automatic pose classification.

## References

- Daoist Cultural Information Database, **掐诀** — definitions, twelve earthly branch contact positions, and the distinction between 诀文 and 诀目: https://zh.daoinfo.org/index.php?title=%E8%A8%A3&variant=zh-hans
- Daoist Cultural Information Database, mobile/full text including all twelve contact descriptions: https://zh.daoinfo.org/index.php?mobileaction=toggle_view_mobile&title=%E6%8E%90%E8%A8%A3&variant=zh-hans
- 《道法会元》卷五十四, 论诀 / 雷诀: https://www.shidianguji.com/book/LSDZ1171/chapter/1mbjmdtschhrz
- Daoist Cultural Information Database, 金桥诀 example and bibliographic references: https://zh.daoinfo.org/index.php?title=%E9%87%91%E6%A9%8B%E8%A8%A3&variant=zh-hans

This is a contemporary educational and interactive interpretation of source material. It is not a religious lineage certification, a substitute for teacher instruction, or a claim of ritual efficacy.
