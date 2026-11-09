# Warlock / Six Elements — original WebXR fan interaction study

Independent lane, requested 2026-11-09. Entry: `spatial-playground/warlock-lab/index.html`. Default is **Stasis / Shadebinder**, with a visible hand-held crystal staff and the complete freeze → shatter loop. Existing Gesture Dynamics and Spellcraft are left untouched. Branch: `feat/warlock-six-fan-immersion-20261109`.

## What is actually implemented

| Reference family | Implemented original interaction | Fidelity boundary |
| --- | --- | --- |
| Stasis / Winter's Wrath | Crystal staff attached to hand; aimed ice shards freeze actual targets; open-palm shockwave shatters them; super freezes then shatters in two stages | Core action sequence preserved; prop geometry, timing, damage and sound are new |
| Solar / Daybreak | Hand-held flame blade, projectile blades, radiant burning field, seven-blade burst | Not a faithful simulation of healing Well of Radiance; field is a sandbox attack adaptation |
| Void / Nova Bomb | Charge-scaled slow homing nova, area explosion and three seeking fragments; spatial pull field | Reduced physics/targets, not the complete subclass |
| Arc / Stormtrance / Chaos Reach | Sustained hand-directed chain lightning, radial chain burst, temporary strong beam | Core continuous-lightning behavior, simplified damage and targeting |
| Strand / Needlestorm | Homing needles, independent threadling seekers, 14-needle volley that spawns seekers | Seekers move in 3D; not navmesh/ground-based original game AI |
| Prismatic / Transcendence | Light/dark counters, alternating freeze/fire shots, freezing field and temporary mixed ability state | Sandbox always permits super after cooldown; not the game's unlock/buildcraft/economy |

This is **not a 1:1 replica**, a complete port of Destiny 2, or an official Bungie project. No Bungie executable code, extracted models, animations, textures, UI icons or recordings are distributed. Original geometric targets are used instead of game characters. Ability names identify the design references. The experiment is not offered as a licensed commercial pop-up product.

## Controls

Desktop: move mouse to aim; `1` toggles summoning/charge, `2` toggles firing, `3` secondary, `4` super, `0` release, `R` reset. Holding the pointer on the canvas also fires. Ice staff is visible at launch so the prototype has a useful first frame.

Quest 3: HTTPS → ENTER MR or VR → consent to hand tracking. Right fist collects energy, sword fingers **or a single extended index finger** fire; right open palm performs secondary. Hold **both fists** for about 0.7s, then open right palm for super. A hand returning from occlusion cannot use stale geometry to trigger a new release.

School selection: look at your open left palm to present an eight-way wheel. While it is open, right fist moves in eight directions and a fresh release confirms: top/right-clockwise first six slots are six schools, last two super/reset. Lower left palm to resume. Selection and combat are isolated. World-space wheel and tutorial remain visible inside XR, unlike the HTML launcher. Basic controller trigger/squeeze support is also provided; controller button mapping remains device-dependent.

Camera/reference-space alignment: the desktop camera is explicitly reset to identity before binding an XR session. Initial XR viewer pose anchors the study; hand joints and viewer directions are all transformed into that same root-local coordinate system. The ray, soft-lock reticle and projectile use the same aim solution. Fast projectiles use swept-segment collisions. No room geometry/depth occlusion or physical wall collision is claimed.

## Sound and source rights

`audio.mjs` synthesizes original layered ice chimes, crackle, impacts, low-frequency nova body, arc noise, strand-like tones and a low ambient bed. Gain staging, a compressor, bounded voices and a soft limiter are used. Stereo panning is spatially suggestive, **not full headset-rotating HRTF**. Audio starts on an actual user action or in the same click as XR entry. Mute and restart are supported.

A local file loader accepts user-authorized audio (up to 20 MB / 12 seconds) into per-school cast/impact/shatter/super slots. The rights checkbox is an acknowledgment, **not a license grant**. Audio stays in memory and is never uploaded. Original game sound is not included; crediting Bungie alone is not treated as sufficient authorization. External open-license sound can be used only after checking the asset-specific license, author and required credit. No unverified sound pack is labeled CC0.

## Primary sources / attribution (checked 2026-11-09)

- Bungie, Stasis Spotlight: Warlock Shadebinder (2020-09-01): https://www.bungie.net/7/en/News/Article/49482 — documents the staff, freeze projectile and shatter shockwave sequence.
- Bungie, Dev Insights: Prismatic Deep Dive (2024-04-10): https://www.bungie.net/7/en/News/Article/prismatic_deep_dive — Warlock abilities and Light/Dark Transcendence.
- Bungie, Intellectual Property and Trademarks: https://help.bungie.net/hc/en-us/articles/360049201911-Intellectual-Property-and-Trademarks — the policy does not establish a blanket license for this project. Paid event/pop-up use and original asset distribution require separate rights review.
- Three.js 0.180.0, MIT: https://github.com/mrdoob/three.js/blob/r180/LICENSE — renderer dependency loaded from pinned jsDelivr package; not copied into this repo.
- Existing lab `../hand-osc-lab/engine.mjs`: only the 25-joint name list is imported; no original working demo is modified.

## Verification

`node --test spatial-playground/warlock-lab/engine.test.mjs` covers all six elemental loops, freeze/shatter ordering, target tunneling, super cooldowns, stale-hand/menu guards, challenge reset and bounded state.

`node spatial-playground/warlock-lab/browser-qa.cjs` uses Chromium/Playwright at local HTTP. It checks real WebGL startup, six school controls, ice freeze and shatter, **nonzero WebAudio RMS**, mute, timed trial and mobile controls. Screenshots/report are saved under `warlock-qa/`. Nonzero signal is not proof of perceptual mix quality.

**Physical Quest QA is still pending.** Record headset/browser version, frame rate, 20 aim trials, false open-palm triggers, left-wheel selection, visibility interruptions, hand occlusion, XR exit/re-entry, spatial comfort and actual audio. Desktop tests must never be reported as headset validation or 1:1 fidelity.

## Pop-up translation

A 90-second challenge is built in: zero-input opening shows the staff; an operator can start the challenge, teach three actions, let the player freeze/shatter and get a score; completion/reset uses the same existing scene. This is a prototype of the interaction sequence only, not confirmation of venue deployment, hygiene, physical boundary management, commercial licensing or throughput testing.
