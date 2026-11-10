# Ableton-first production handoff / 2026-11-11

**Status: prepared work order; not an Ableton project, rendered music, verified local run, or stage-ready release.**

The current artist request makes Ableton on the Mac the intended production host and Performable Music the production source of truth. This package is additive: it does not overwrite any existing DAW project, audio, PR, or local producer's work.

## Start

Give the local Mac agent [LOCAL_AGENT_PROMPT.md](LOCAL_AGENT_PROMPT.md). Return a completed [REVIEW_RETURN.md](REVIEW_RETURN.md) with actual audio and project evidence. Use this branch directly for reading; no merge is necessary to start a separate local worktree.

## Verified baseline and conflicts

- Main was `3b550984e4e4fac97959535959d07e15dd2267c4` at inspection.
- [PR 50](https://github.com/ewanqian/performable-music/pull/50): three compositions rejected by the artist. Preserve source/tooling; do not request repeat acceptance of those recordings.
- [PR 53 artist review](https://github.com/ewanqian/performable-music/pull/53#pullrequestreview-5828684275): CURRENT rejected as stage music. The PR body saying pending is stale. Do not reuse rejected PCM as conditioning or manufacture cosmetic variants.
- The preceding review proposed two generators and 40 independent full-song candidates. That is a proposal, not evidence that those files exist. The new Ableton-host request does not prove that search has been cancelled or completed: inspect local progress and preserve it; do not launch a duplicate batch.
- Root entry documents retain historical Waveform and generic expansion instructions. Read them for evidence and constraints, not as proof of current installation or a mandate to restart production.
- A local Mac/Ableton session was not accessible to this cloud audit. Installation, version/edition, available instruments, saving/exporting, audio hardware and currently running producer all need local verification.
- The repository uses a December 3 milestone. A supplied SYNAPTICON reference poster shows December 4 at THE POINT. Confirm the user's own slot, rehearsal and technical deadline before revising dates. A reference artist's date is not the user's booking.
- Albert.DATA / SYNAPTICON reference research is separate and pending. Do not assert its EEG mapping, mimic its recordings, or claim a real EEG input exists in this project.

## What cloud does now / what requires Mac

Cloud: reconcile decisions and evidence; maintain this production brief; examine returned cue data and file metadata; review code and visual assets; propose bounded musical/visual alternatives. No claim of listening when only metrics were inspected.

Mac: inspect and preserve existing sessions; verify Ableton save/reopen/export; author and render the actual arrangement; test audio devices and physical controls; record the performance and recovery evidence.

The artist: make a small number of explicit listening decisions, ideally timecoded. No generated score, LUFS target, test suite or assistant confidence can substitute for approval.

## Gates, in order

### Gate 0: host and ownership
Inventory only relevant existing material. Choose one DAW writer. If another producer owns the open set, inspect read-only and coordinate; never overwrite it. Use a new named copy. Verify Ableton's edition and devices before proposing Suite-only or Max for Live functionality.

### Gate 1: one convincing excerpt
Build a continuous 60–90 second original excerpt with an identifiable sonic idea, development and a deliberate ending. Prefer the artist's previously liked, actually found Ableton material if reuse is authorized; otherwise use installed stock devices and authorized original material. Do not make generic piano loops, endless harsh drones, or forty EQ variants.

Make one primary render. A second render is justified only by a specific meaningful musical decision, not cosmetic variety. Give the artist the actual listening files, concise difference and at most three timecoded questions. Keep pre-master and matched comparison copies separate; document any gain change. Start playback quietly; do not auto-increase system/master volume.

### Gate 2: four-minute composition
Only after the excerpt's direction is accepted, develop one four-minute musical form. Use the existing memory/pressure/transformed-return premise only if it remains the artist's chosen concept. Four functional groups can start as SOURCE, BODY, PRESSURE, SPACE; these names are an organizational proposal, not a mandatory four-track restriction.

Deliver editable native project, collected authorized media, reference stereo bounce, common-start aligned group stems, cue sheet, dependencies, and recovery notes. If nonlinear/shared master processing prevents exact stem summing, state that limitation and provide an appropriate pre-master reconstruction reference. Do not claim exact reconstruction without testing.

### Gate 3: playable audiovisual proof
Expose a small number of meaningful controls (for example section advance, density, pressure, space, release), bounded and smoothed. No unbounded model-generated live DSP or master-gain control.

First prove a deliberate keyboard/MIDI event in Ableton and one visual runtime share the same event identity and produce a visible/audible consequence. Then test OSC/hand input only if the baseline is reliable. Existing Show Score/runtime interfaces should be inspected and reused, not replaced blindly.

Use original/authorized visuals, spatial scale and negative space; avoid generic spectrum bars and automatic camera zoom. Blackout, pause/restart, tracking/network loss, mute/resume and emergency stop need explicit tests. Real EEG must remain optional, source-qualified and separately consented; synthetic signals must be labeled synthetic.

### Gate 4: stage package
Confirm actual show length, screen mapping, audio routing and venue requirements. Keep a stereo WAV fallback independent of XR/network. Reopen the set, run twice, rehearse at intended duration, test recovery and preserve an offline copy. Hardware and venue evidence must be separate from desktop mock tests.

## Public/private boundary

This repository is public. Only publish source, sanitized setup notes, owned/generated assets with verified rights, derived research and relevant evidence. Keep reference recordings, client files, credentials, EEG/person-specific data, raw private paths and personal correspondence out of commits. Collect All and Save can gather licensed material; review redistribution rights before any upload. Do not merge, publish a release, contact external agents, buy software or grant persistent access merely because this work order exists.
