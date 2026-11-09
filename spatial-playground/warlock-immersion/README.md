# Sixfold / Warlock — spatial fan interaction study

A new independent WebXR page. Existing Gesture Dynamics and Spellcraft remain unchanged.

Entry after Pages publication: https://ewanqian.github.io/performable-music/spatial-playground/warlock-immersion/
Branch: `feat/warlock-six-fan-immersion-20261109`.

## What is implemented

Six **distinct representative mechanics**, not every subclass ability or a 1:1 recreation of Destiny 2:

- Stasis / Shadebinder: palm-bound original crystal staff, aimed freezing shard, persistent frozen target state, radial shatter action. This is the first complete interaction loop.
- Solar / Dawnblade: original held flame sword, traveling blades, damage-over-time scorch and a wave.
- Void / Voidwalker: chargeable slow homing nova, area detonation and manual remote detonation.
- Arc / Stormcaller: sustained branching lightning, separate from projectile effects, and a storm action.
- Strand / Broodweaver: seven homing needles that spawn short-lived pursuing threadlings, with a second tracking volley.
- Prismatic: alternating light/dark hit meters and a timed mixed burst state. This is a simplified fan translation, not the game's full Transcendence sandbox.

## Play

Desktop: mouse aims; 1 summons the held object; 2 fires; 3 performs the second action. HOLD maintains the pointing pose. 4–9 select schools. The default is Stasis. Freeze a target before trying shatter. The left-palm MOCK button opens a six-way wheel: hold the mouse on the canvas, move to a sector, then release to choose.

Quest 3 Browser: open the HTTPS page, use ENTER MR or ENTER VR, allow hand tracking, put down controllers. Hold a fist to summon/charge. Index and middle extended with the remaining two fingers curled constitutes sword pose, which fires. Open palm performs the second action. For the school menu, show your LEFT open palm toward the headset, move the RIGHT closed fist in six directions, release to select, then lower the left palm. In-headset panels show instructions without depending on DOM overlays. All world positions are in the same XR reference space. No room meshing or wall collision is claimed.

Desktop controls are mocks, not computer vision. The input stabilizer reuses the project's tested time hysteresis, adds palm/shaft geometry and ignores missing thumb joints when classifying the four fingers. Tracking loss cannot manufacture a release action. Actual Quest 3 pose precision, staff alignment, frame rate and audio need physical-device review.

## Sounds and rights

All bundled sound effects are synthesized by `audio.mjs`; they are **not Bungie recordings**. Ice, solar, void, arc, strand and prismatic actions use different original noise/oscillator envelopes. User gestures unlock audio, output has volume and mute, voice count is bounded, and a compressor controls peaks. This is an implementation detail, not a measured headset loudness safety certificate.

Optional replacement files are decoded from the user's local file picker, kept in memory, never uploaded or saved. Supply only sound recordings you have rights to use; attribution alone does not grant reuse permission. The current build contains no ripped game files, logos, game meshes, recordings, downloaded packs, or claimed official authorization. We did not locate and verify a permissively licensed original Destiny SFX pack.

Destiny, Warlock and ability names are used as references to Bungie's work. This is an unofficial non-commercial fan interaction research prototype. Do not imply endorsement, 1:1 asset fidelity, or an official Destiny product. Do not turn this into a paid branded pop-up without clearing the required permissions; public fan-content guidelines are not a project-specific license.

## Primary reference sources (checked 2026-11-09)

- Bungie, Stasis Spotlight: Warlock Shadebinder (freeze bolts + staff shatter): https://www.bungie.net/7/en/News/article/49482
- Bungie, Prismatic Deep Dive (cross-element Warlock abilities): https://www.bungie.net/7/en/News/Article/prismatic_deep_dive
- Bungie, Intellectual Property and Trademarks: https://help.bungie.net/hc/en-us/articles/360049201911-Intellectual-Property-and-Trademarks
- Three.js r180 / 0.180.0, MIT, renderer imported from jsDelivr: https://github.com/mrdoob/three.js/blob/r180/LICENSE

The visual and control mappings are this project's experiments. The intended feeling is hand-performed cosplay, but visual/audio fidelity to the game has not been validated. No history/religion authenticity claim is made.

## Reproducible QA

`node --test spatial-playground/warlock-immersion/core.test.mjs`

`.github/workflows/warlock-immersion.yml` checks syntax, deterministic state transitions, freeze/shatter, six-school distinction, collision, long-running bounds, and a real Chromium/SwiftShader session. Browser QA clicks summon/cast/shatter, verifies frozen targets and score, loops all six schools, checks user-gesture audio start/mute/restart, tests the selection wheel and mobile layout, and records PNGs.

**Desktop browser QA is not Quest hardware acceptance.** View screenshots and test logs before declaring the desktop build ready. Real audio capture/listening and strict motion-to-photon measurements are outside that automated evidence.
