# Organic Fields — PlayGround-Inspired Three-Instrument Study

Status: independent playable prototype, NOT a copy or port of HLO's historic app. Real Quest 3 audio latency and hand-tracking behavior are not verified.

## Three deep-linkable sound worlds

- METAL KITCHEN — https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/playground.html?mode=metal
- NEON REACTOR — https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/playground.html?mode=electro
- ORCHESTRAL FIELD — https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/playground.html?mode=orchestra

All live in one lightweight page with on-screen mode switches, the original Lab02 XR hand skeleton and optional OSC.

## Historical research

Herrmutt Lobby / HLO released iOS PlayGround Organic Remix in 2015; its final listed version is from May 2019. Official BEATSURFING material confirms BEATSURFING2 is the successor. DJ TechTools described carefully structured musical maps controlled by gliding continuously over elements rather than repeated button presses. An Apple editorial specifically described drawing figure-eight paths. Historic packs included various electronic artists, so an official classical music pack collection cannot be assumed without further evidence.

Sources:
- https://djtechtools.com/2016/01/22/playground-an-ios-song-instrument/
- https://apps.apple.com/us/iphone/story/id1409994796
- https://beatsurfing.com/about-us/
- https://appshunter.io/ios/app/playground-organic-remix/id963753435

No old app art, code, score, sounds or commercial artist packs are copied.

## How this version plays

The stage is a spatial score, NOT a 12-key virtual piano. Each user pointer or WebXR index tip traces a continuous path. An optimized swept-segment-to-circle intersection identifies both ordinary slow entry/exit and fast outside-to-outside crossings. Individual touches and two Quest hands are processed independently. Events are optionally quantized to the next sixteenth at the mode BPM; continuous X/Y/speed adjusts the motion voice filter, gain modulation and echo. Every mode uses an original Web Audio synthesized palette without pre-recorded samples.

### 01 Metal Kitchen / 104 BPM
Regions: pot, lid, cutlery, bowl, glass, pan. Inharmonic oscillator partials, metallic decay and brief filtered-noise attacks. Distinct spectral colors emulate percussion on cookware and glass.

### 02 Neon Reactor / 126 BPM
Regions: sub kick, hi-hat, snare, acid, FM, riser. Synthetic industrial drum kit, resonant acid swipes and a gesture-driven continuous bass/filter layer.

### 03 Orchestral Field / 92 BPM
Regions: strings, harp, brass, choir, timpani, tutti. Coherent original four-chord progression and multi-oscillator ensemble sections triggered as pre-arranged *phrases*. This is a procedural synthetic orchestral **mockup**, not a high-fidelity orchestral sample library or a mastered film score.

### Input

- Desktop: press and drag mouse. iPad: multiple independent touch contacts.
- PLAY ∞ PATH is an explicitly **simulated** gesture demo.
- Quest: start audio by touching the ENABLE AUDIO control, enter MR and move index tips into 3D region rings. Projection maps XR local coordinates from a 1.2m-wide, .72m-high plane .3–.94m forward. Not physical room anchored; headset QA is required.
- Vision Pro: WebXR immersive VR may be available; no claims of native MR anchoring.
- M mutes, 1/2/3 select modes; enabling audio requires a user activation.
- Optional authenticated, ARMED WSS→OSC bridge carries semantic event messages; there is no browser UDP.

## OSC channels

The bridge checks all values and allowlists modes/region IDs. New:
- /pm/playground/region/REGION/enter mode x y velocity
- /pm/playground/region/REGION/exit mode x y velocity
- /pm/playground/gesture/xy x y
- /pm/playground/gesture/speed velocity

The existing /pm/hand, /pm/perf, /pm/zone and /pm/system/stale channels remain intact. Audio emergency mute stays independent; no uncontrolled master gain from gestures.

## 12 acceptance exercises

1. Metal: cross each item 20 times; count misses, false events, decay and distinct sound identities.
2. Electro: sweep kick→hat→snare→acid; compare 1/16 quantization and free triggering.
3. Orchestra: cross strings→brass→tutti; verify chord coherence and crescendo rather than random key-playing.
4. Drag a figure-eight. Continuous high-speed geometry must catch crossed sound regions.
5. Use two separate iPad touches; releasing one must not reset the other.
6. Run automatic ∞ demo; label it as simulated, not hardware tracking.
7. Change modes 20 times, mute/resume repeatedly; check voice buildup, output gain and click-free audio.
8. Authenticate a local WSS/OSC bridge and check mapped event addresses. Network loss must not leave a held master gate.
9. Quest 3 MR visual alignment, hand-join feedback, perceived latency, wrist ergonomics and authentic headset FPS — PENDING.
10. 12,000-frame browser synthetic swipe stress and 75,000-frame CI mapping stress. These prove logic only, not compositor FPS.
11. Long performance: 30-minute thermal and audio-glitch test, operator mute and reconnect — PENDING.
12. Export session JSON and inspect that simulated gestures are labeled and no credentials or raw hand position stream leaked.

## Known limits and sound-quality progression

Current orchestral mode uses only Web Audio oscillators/noise. It is structurally musical but will sound synthetic; recording or licensing proper instrumental multisamples is a follow-up. Original cookware samples, immersive reverb, physically carried objects and true audio→OSC roundtrip profiling are not implemented yet. Current Quest field is unanchored; hand interactions require real device testing.

## Reproducibility

From the hand-osc-lab directory run npm test. CI covers the original joint engine, V2 bimanual instrument mapper, and organic swipe/multitouch/figure-eight plus 75k synthetic frames. The Performable Music Pages workflow copies the whole spatial-playground directory.