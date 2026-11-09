# Warlock — movement-first ability grammar / 2026-11-09

## Scope and provenance

This is a **research specification**, not a 1:1 motion-capture reconstruction or a claim about exact in-game frames/timings. Distinguish (A) Bungie-documented actual behaviors, (B) motion in gameplay videos needing frame-by-frame annotation, (C) proposed WebXR control gestures that are **not** Bungie's game controls. Work with original procedural props and audio; never bundle ripped original Destiny game SFX/meshes in a public site. Root branch is \`feat/warlock-authentic-action-grammar-20261109\`. Keep the presently playable \`main\` unchanged until real Quest hand tests.

### Evidence
- Bungie: Shadebinder staff and its freeze/shatter pairing, https://www.bungie.net/7/en/News/article/49482
- Bungie: Arc 3.0, Stormtrance vs Chaos Reach distinct fantasy, https://www.bungie.net/7/en/News/article/51678
- Bungie: Void 3.0, Cataclysm vs Vortex vs Nova Warp, https://www.bungie.net/7/en/News/article/51021
- Bungie: Strand, Needlestorm wave-of-hand and seekers, https://www.bungie.net/7/en/News/article/inside-strand
- Bungie: Prismatic multiple selectable Supers and light/dark Transcendence, https://www.bungie.net/7/en/News/article/prismatic_deep_dive
- Bungie: 2025/26 abilities tuning, https://www.bungie.net/7/en/News/Article/abilities_tuning_renegades

## What went wrong in the existing Sixfold prototype

The original \`core.mjs\` maps \`kind === 'sword'\` directly to primary attacks across all six subclasses, and \`kind === 'open'\` directly to secondary. It conflates the **activation**, **armed super mode**, **aim**, **primary**, **secondary**, **recovery**, and **idle** states. A staff emitter should be aligned to the **staff shaft**, not the finger ray; a blade swing should require angular/linear velocity across an arc, and an area blast should require an upward raise with a positive confirmation so normal repositioning does not explode. The existing 6-school menu should suppress every attack during selection.

## Provisional experiential motion grammar

Names and behaviors from Bungie; gestures and threshold timings below are **our design proposal**, not in-game canonical animations.

| Subclass and variant | Super activation | Aiming/attack during active state | Secondary/finish | Sonics (separate events) |
| --- | --- | --- | --- | --- |
| Stasis / Winter's Wrath | Closed fist gathers staff, staff crystallizes upward in-hand | Hold staff extended: its **long axis** predicts shot direction; pulse every ~250–350 ms while held and oriented outward, with moderate target-cone adhesion | Raise staff above shoulder with vertical rising velocity and arm elevation, then sweep down/open palm to send a **shatter shockwave**; only frozen targets score | activation rising icy chord → repeated sharp brittle bolt transients → glassy freeze dwell → massive wide shatter, low-end impact |
| Solar / Daybreak | Raise dominant arm and summon flame sword; floating stance is conveyed as body aura, not actual locomotion | **Arm slash** crossing a speed/arc threshold generates one fire blade along tangential sword tip travel; alternating slash directions can combo | Ability end/cooldown; no mandatory open-palm explosion | sword unsheathe → fiery whoosh tied to swing velocity → blade launch → hot impact/scorch |
| Solar / Well of Radiance | Both hands collect/raise, materialize a sword above hand | **Deliberate downward planting** gesture toward the floor, creates stationary healing/empowerment field; *not a projectile* | Sustained luminous zone | uplifting activation → floor plunge impact → sustained radiant bed |
| Solar / Song of Flame | Open arms / release radial solar surge to enter empowerment | While empowered, repeated throwing motions produce sentient flame wisps; snap/short strike triggers enhanced melee | End of empowerment timer | vocal/tonal ignition → repeating wisp launches → flare impacts |
| Void / Nova Bomb Cataclysm | Bring hands together and compress a growing orb | One **two-hand forward throw** with velocity threshold launches a slow seeking Nova; it splits into seekers after impact | After throw, recover; no forced continuous sword pose | immense suction build → bass transient on throw → seeking hum → multiple small seeker pitches |
| Void / Nova Bomb Vortex | Same charge and throw | On impact generate a long-lived **pulling vortex** instead of Cataclysm seekers | Persistent pull field | descending tone → soft vortex whirl → persistent low-frequency pull |
| Void / Nova Warp | Enter all-body Void mode; don't reuse the Nova Bomb orb | Bring both hands inward to charge **radial AoE**, open rapidly to release; repeated charge/explode cycles and a separate blink gesture | Warp end | pressure buildup → sub-heavy radial thump → spatial vacuum/teleport |
| Arc / Stormtrance | Two hands draw outward, ignition arcs around body | **Open hands directed outward**, sustained hand tracking continuously steers branching lightning (not finger-gun shots). Time under target raises damage/charge intensity | Deliberate overhead/grounding pulse or release | intense energize → continuous noisy electrical current → per-target relay crackles |
| Arc / Chaos Reach | Two palms gather then thrust forward to channel | **Two-arm forward stable beam**; while active, steer using both wrists/hand centers, beam width energy-depleting, not rapid discrete shots | Release to stop and recover | rising electrical whine → constant thick beam → descending discharge cut-off |
| Strand / Needlestorm | Both hands weave several floating green needles across a fan | **Sweep the arm** to launch a single fan of tracking spikes | Impact turns needles into threadlings; unspent threadlings perch on Warlock in some Strand mechanics (do not claim universal behavior for all Needlestorm hits) | tense thread-weaving → cascading needle volley → impacts → distinct threadling chatter |
| Prismatic / mixed state | Build light/dark counters via different actions, then synchronized two-palm opening to enter Transcendence | Continue using **selected** super grammar above, augmented by hybrid ability behavior; do not invent a unique generic Prismatic beam as Bungie's exact Super | Transcendence has own activation and expiration, distinct from selecting the equipped Super | spectral chord/dual tone → rhythmic hybrid triggers → release tail |

## Input separations

\`MODE_SELECT\` (left palm facing headset + right fist radial wheel) is isolated from combat; \`IDLE\`, \`SUMMONING\`, \`ARMED\`, \`CHANNELING\`, \`BURST\`, \`RECOVER\` are mutually explicit state names. Global gestures (two-hand charge / left palm menu) are resolved before subclass-specific actions.

- **Stasis staff axis**: wrist–middle knuckle or palm normal defines weapon frame; staff shaft transform includes calibration offset. Only aim **forward** if forearm alignment and muzzle are stable; soft-lock candidate must be in front of staff (never behind). Do not infer actual sword-finger gesture.
- **Slash**: integrate hand/weapon-tip trajectory over ~120–240 ms, require spatial displacement >=0.24m and speed >=0.75 m/s and direction change appropriate to a real swing. Cooldown 220–400ms and hysteresis to avoid double-fires.
- **Staff raise**: palm/shaft Y ascends >=0.20m relative to shoulder/eye reference with rising speed >=0.5m/s, then a clear second motion (downward sweep or deliberate hand opening) triggers shatter. Raising alone should not explode. These are starting thresholds requiring calibration.
- **Vortex throw**: two hands near (<0.28m) build energy, then separate/translate forward (>0.22m) and release; do not use a generic sword pose.
- **Beam**: two palms directed into the scene and wrists relatively stable for ~150ms enter a continuous beam. End on measured release (not a single missing hand frame).
- **Sound grammar**: \`super_prepare\`, \`super_enter\`, \`equip\`, \`launch\`, \`travel_loop\`, \`freeze\`, \`impact\`, \`shatter\`, \`super_end\`. Super-entry must have its own once-only prominent cue, unlike the light shot loop.
- **Loss handling**: 100–180ms short joint dropout may preserve previous weapon aim, but must not **commit** throw/plant/slash/shatter from stale positions. 300–400ms loss moves into safe \`RECOVER\` and gracefully fades audio and particles. Enter/exit thresholds separate for every state.

## Acceptance on Quest 3

1. For Stasis, 20 attempts each: summon, aim 5 targets, shoot at least 3 consecutive bolts, raise-then-shatter. Track successful first tries, false shatters, momentary tracking losses, and aim error in degrees. Goal is **measured**, not falsely assumed: >85% successful intended gestures, <5% accidental triggers, no single-frame abrupt interruption.
2. Solar slash: 20 slashes with alternating arm directions, plus 10 ordinary tracking/repositioning motions. Slashes register; repositioning doesn't.
3. Void Cataclysm/Vortex: verify separate projectile aftermath—seeker split versus sustained inward field—not just a color change.
4. Arc Stormtrance versus Chaos Reach: visibly distinguish independent continuously chained arcs from a unified stable beam and distinct sound beds.
5. Audio: listen in-headset at controlled output level. Confirm startup, super-init cue, layers during sustained beam and no retained stale sound after state exit. No game sound files distributed in source.
6. Non-commercial study: do not claim 1:1 animation fidelity until you have side-by-side captures with licensed reference footage; original motion needs per-action frame annotation with camera, hands, emitter, audio onset, impact time.

## Implementation sequence

P0: Stasis state-machine & calibrated staff local axis (raise-to-arm, shatter-on-second-action), original sound event map; prototype on separate branch only.
P1: Solar Daybreak slash recognizer, Arc Stormtrance continuous hands, Chaos Reach stable dual-arm beam.
P2: Void Cataclysm/Vortex/Nova Warp variants; Strand weaving/needle volley; Solar Well/Song; Prismatic build system.
P3: Playtest and user-selectable comfort thresholds before merging into live Warlock page.
