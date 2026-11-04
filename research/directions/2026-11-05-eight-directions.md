# Eight direction prototypes — 2026-11-05

Status: research prototypes rendered locally (Surge XT via real VST3). **No human listening yet. No quality claim.** Each file needs an audition and a written verdict before it counts as evidence.

## 1. What was built

| ID | Direction | Rule idea | Patches (Surge XT factory) | Length |
|---|---|---|---|---|
| D01 | LATTICE | sparse 16th-grid clicks + tonal pings; silence as material | Drum One, Bell 1, Eighties Drone | 3:15 |
| D02 | GRAIN | dense 8/16-hit micro-bursts + high test tones, delay-heavy | Drum One, Comb Pluck | 2:48 |
| D03 | DRONE | slow 8-bar chord drones, very long reverb | Pad 1, Pad 3, Eighties Drone | 4:13 |
| D04 | MACHINE | Euclidean clocks: E(5,16) → E(7,16) kick, 0.75-beat tom clock against 16ths | Kick Tech 1, Synth Tom 2, Rubber Bass, Metal Pluck | 3:09 |
| D05 | RADIO HALL | vinyl/noise bed, EP chords in a wide hall | Vinyl, Radio Noise, EP 1 | 3:53 |
| D06 | GESTURE | 16th-note contour from a sine path (a stand-in for controller gesture data) | Classic Lead 1, Ghost Pad | 3:03 |
| D07 | SEQUENCER | three independent 16-step voices with per-section gate probability | Metal Pluck, Kick Tech 2, Bell 2 | 2:58 |
| D08 | AFTERIMAGE | pads + sparse bells into a long feedback delay (0.75 s, fb 0.6) | Ghost Pad, Bell Pad, Unsettler | 4:19 |

Files: `studies/010-eight-directions/outputs/D0x_*.wav` (24-bit, 48 kHz, not committed). Scripts: `render_directions.py`, shared DSP in `engine.py`. Report: `render-report.json`.

Honest limits:
- Material is rule-generated and seeded. It is a test of mechanisms, not composition.
- Delay and reverb are my own numpy processes (feedback delay line, synthetic-IR convolution), not Waveform/Valhalla plugins.
- Drum One / Kick Tech note mapping is assumed to be GM-like; check the audio.

## 2. Flagship update

`studies/009-flagship-layered/` now has a shared delay (0.4375 s, fb 0.42) and convolution reverb (τ 2.5 s) send. Sends are per layer (pad, shimmer, bell, metal, texture heavy; sub/kick light). Still 12 layers, 7:30. The "dry" complaint should be checked by ear, not by numbers.

## 3. Lineage — what to learn (documented fact vs. inference)

Facts checked via search:
- **Daito Manabe**: an Ableton Loop 2017 live set with Nosaj Thing ("No Reality") is listed with Manabe on visuals; the video description mentions an Apple Vision Pro DJ performance. *Verify the exact Vision Pro workflow in the primary source before relying on it.*
- **Daito Manabe, body data**: a Vice profile describes him attaching electrodes to his face and syncing them to music. This is documented.
- **Ryoichi Kurokawa "Read" (2004)**: listed as electronic / abstract / experimental on Discogs.
- **Alva Noto & Ryuichi Sakamoto "Xerrox Vol.1"** and **Ryoji Ikeda "Test Pattern" (2008)**: both listed on the same Discogs page. Their label context (Raster-Noton) is commonly cited but I did not verify it in this session.

Not verified (do not cite until checked):
- The arm-EMG video you remember (a muscle-signal arm controlling reverb/feedback). I could not find it. Keep it as your memory, and find the source before we build on it.
- Byetone's early catalogue. My search returned nothing usable.

Inference (for us, not for them):
- Learn the **constraint**, not the surface: Alva Noto/Ikeda keep a small number of signal types and let silence, clicks and frequency shifts carry the form (D01, D02).
- Kurokawa and Manabe: slow mass plus a clear process rule (D03, D04).
- Manabe's body-data work supports the rule that a few semantic controls drive many parameters, not raw sensor → parameter maps (AGENTS.md section 3).

## 4. Your portfolio → chosen directions

From `research/taste-map/`: Manabe (process, polyrhythm, body as input), Kashiwa (long-form, programmatic form), YMO and CAPSULE (pop-structure, playful surfaces), and this repo's Critical Field arc (tension → override → afterimage).

I picked eight that cover calm / loud / narrative / micro-sound and that map to a live instrument:
- Calm and micro: D01, D02
- Slow mass: D03
- Process and body clock: D04, D07
- Narrative and mood: D05, D08
- Gesture-to-sound (Vision Pro-style control): D06

## 5. Next batch (16-demo plan, not rendered yet)

Two variants per direction, ~4 minutes each, grouped into four albums of four:
- **Album A — stillness**: D01a, D01b, D03a, D03b (calm and mass)
- **Album B — density**: D02a, D02b, D04a, D04b
- **Album C — narrative**: D05a, D05b, D08a, D08b
- **Album D — control**: D06a, D06b, D07a, D07b

Each variant changes one thing only (e.g., D01b: remove the tonal layer; D04b: swap the metal voice for a Surge bell). That lets us compare cleanly.

## 6. Evaluation sheet (fill in after listening)

For each file: 60-second rating on *memorable / stuck / too busy / too dry / reverb helps or hides / would I play it live*. Record the timestamps and the verdict in `research/acceptance-matrix.csv`.

## 7. Tooling research (what to try next)

- **Waveform Free 14** is still not verified for save/reopen/export (see the OpenCode handoff).
- **Custom synthesizer**: the realistic path is a plugdata patch with exposed parameters (`.pd` source, versioned), not a new VST. Map 3–5 semantic controls, not every knob.
- **Vision Pro / WebXR**: keep the browser as the input layer, normalize to the Show Score schema, and log every frame for replay. No direct raw-gaze mapping (AGENTS.md section 4).

## 8. Open questions

1. Which direction do you want to hear first?
2. Is "dry" a mix problem or a sound-design problem? Compare FLAGSHIP_02 and FLAGSHIP_01 blind.
3. Which Manabe/Kurokawa/Ikeda period (early album or later) should be the reference, and what exactly do you hear in it?
