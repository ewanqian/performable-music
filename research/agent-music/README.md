# Agent Music Research

## Goal

Use agents to accelerate composition and analysis **without putting an LLM directly in the unsafe real-time control loop**.

Preferred pattern:

```text
analysis / intent
    -> agent proposes structured plan
    -> JSON / MIDI / automation / patch changes
    -> human audition / approval
    -> Ableton / Max / WebAudio executes deterministically
    -> performance gestures alter bounded parameters
```

## Current setup candidates

### 1. Ableton Live MCP — local Codex control

Repository: https://github.com/wstierhout/ableton-live-mcp

Current public repository description states that it exposes a large typed tool set for controlling a running Ableton Live 12 session, including building/editing MIDI, mixing and mastering. License: **MIT**.

Use case here:
- create tracks/scenes/clips;
- insert or mutate MIDI;
- inspect set structure;
- generate A/B/C arrangement variants;
- automate repetitive editing;
- let Codex work on a disposable/versioned Live Set.

Start read-only or on a disposable Set before allowing destructive edits.

### 2. Ableton Extensions SDK

Official: https://www.ableton.com/en/live/extensions/

The current SDK is an open JavaScript toolkit for Live 12 Suite Beta 12.4.5+ and can read/edit tracks, clips, MIDI, devices, tempo and Set structure. It is especially suitable for **one-shot structural transformations**, analysis helpers and agent-assisted editing.

Do not use Extensions as the continuous DSP/performance core. Keep real-time synthesis and gesture processing in Max / Max for Live / WebAudio as appropriate.

### 3. live-agent

Repository: https://github.com/nonogv/live-agent

An MIT-licensed Ableton Extensions experiment for controlling a session with GPT/Claude/Gemini. Treat as a reference implementation for in-Live agent interaction and UI patterns.

### 4. Max / Max for Live

Use for:
- continuous gesture processing;
- synthesis and effects;
- smoothing / hysteresis / state machines;
- OSC/WebSocket bridges;
- deterministic safety behavior;
- audiovisual parameter sharing.

### 5. FluCoMa

https://www.flucoma.org/

Fluid Corpus Manipulation is a data-driven music-making toolkit across Max, Pure Data and SuperCollider. This is highly relevant for:
- segmenting a personal sound corpus;
- descriptor extraction;
- similarity search;
- timbral spaces;
- corpus-based playable interfaces.

This can become the bridge between KASHIWA-style listening analysis and an original performable instrument without copying source audio.

### 6. Somax for Live

Repository: https://github.com/DYCI2/Somax-for-Live
License: **GPL-3.0**.

Research it as a co-improvisation / machine-listening reference. Do not make it a show dependency until latency, stability and musical usefulness are tested.

### 7. Tone.js / Web Audio

https://tonejs.github.io/

Use browser prototypes for fast listening tests, generative sequencing, GrainPlayer, FMSynth, effects, and reproducible parameter experiments. Browser prototypes are ideal for sharing research mechanisms before moving a survivor into Ableton/Max.

## Agent roles worth testing

Do not start with a swarm. Test these roles separately:

- **ANALYST** — reads annotations/features and proposes mechanism hypotheses.
- **COMPOSER** — creates MIDI/event structure under explicit constraints.
- **SOUND** — proposes bounded synthesis/device parameters.
- **ARRANGER** — creates section variants and transitions.
- **CRITIC** — compares versions against stated musical goals.
- **ARCHIVIST** — writes experiment log, sources and decisions.

## Required output format

Whenever possible, agent decisions should resolve to inspectable artifacts:

```text
plan.json
midi/*.mid
presets/*.json
analysis/*.csv
notes/*.md
```

Avoid unlogged “magic” changes inside a DAW.
