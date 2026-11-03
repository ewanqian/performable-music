# Study 001 — One Sound / Six States

## Goal

Learn **musical state** before learning more devices, genres, plug-ins, or synthesis tricks.

Create a 45–90 second study using **one original sound source only** and six states:

```text
Idle → Seed → Build → Hold → Peak → Release
```

The source can be:
- one synthesized oscillator/voice;
- one piano note/chord you recorded or programmed;
- one self-recorded impact/noise;
- one short original sample.

Do not import a finished loop.

## Constraint

You may change only these dimensions:

1. event density;
2. register / pitch relation;
3. duration / envelope;
4. spectral brightness;
5. space / delay / reverb;
6. repetition / silence.

Do not solve the exercise by adding new instruments.

## State definitions

### 0 — Idle
The system is alive but almost inactive. It must be safe to wait here indefinitely.

### 1 — Seed
The listener can identify the basic musical object or rule.

### 2 — Build
Add expectation. Increase one or two dimensions only.

### 3 — Hold
Maintain a recognisable state for 10–30 seconds without obvious looping fatigue. Add bounded variation, not constant escalation.

### 4 — Peak
Maximum structural activation. This is not automatically the loudest state.

### 5 — Release
Remove pressure in a way that feels intentional. Do not just fade the master channel.

## Three implementation routes

### Route A — Ableton Live

Minimum tracks:

```text
01_SOURCE
02_RETURN_SPACE
03_RETURN_DELAY
04_STATE_CONTROL
```

Use one Instrument Rack / Simpler / Operator source. Map a small number of Macros:

```text
M1 DENSITY
M2 BRIGHTNESS
M3 SPACE
M4 TENSION
M5 EVENT
```

Create six Scenes or six named Macro snapshots. Record a performance switching through them.

### Route B — Max/MSP

Use one source voice and one state machine.

Suggested structure:

```text
[state]
  ↓
parameter targets
  ↓
line~ / slide~ / ramps
  ↓
voice + filter + delay/reverb
```

Keep a manual SAFE state and master KILL.

### Route C — Web Audio / Tone.js

Use one synth/sample and a transport/state object. Each state changes only a few bounded parameters. The page should expose one button for `NEXT STATE` and one `RESET`.

## Performance version

After the fixed 45–90 second version works, make it **performable**:

- one button: advance state;
- optional hold: stay in Build/Hold;
- optional gesture/MIDI: vary one semantic parameter inside the current state;
- KILL/RESET: return to Idle.

The performer should not need to touch more than 2–3 controls.

## Deliverables

Create inside this folder or the related local project:

```text
preview.wav
performance-metadata.yaml
state-score.json
notes.md
```

If Ableton/Max binary files are too large or private, keep them locally and commit a build note / relative path instead.

## Pass / fail

PASS only if:
- all six states are audible without looking at the screen;
- Hold can last at least 10 seconds without sounding broken;
- Peak is structurally different from Build;
- Release is composed, not only volume automation;
- you can perform the state sequence without mouse hunting;
- the piece still sounds intentional if you stop moving for a moment.

## Reflection questions

1. Which state was easiest to make?
2. Which state sounded fake or forced?
3. Did you use loudness as a shortcut for energy?
4. What was the smallest change that produced the largest musical effect?
5. Which parameter would be worth giving to a hand gesture later?
6. Would you actually want to hear this again tomorrow?

## Time box

First version: **90 minutes maximum**.

Do not polish the mix. The learning target is state architecture.
