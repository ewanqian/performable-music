# Arrangement Master R0 ·《复苏》/ Reawakening

**2026-11-18 | Rehearsal design, not a finished 30-minute audio performance.** Linked to [The Point production](../../production/the-point-2026-12-04/README.md), [musical direction](../../production/the-point-2026-12-04/MUSICAL_DIRECTION.md), [Mac evidence receipt](../../production/the-point-2026-12-04/receipts/mac-awakening-20261118.md) and [issue #57](https://github.com/ewanqian/performable-music/issues/57).

## What you can actually run today

1. Open **[rehearsal-console.html](./rehearsal-console.html)** (download the HTML and open locally, or serve with `python3 -m http.server 8000` from the repository root). It is a **local-only, silent cue timer**; it does not connect to Live/Quest and **does not transmit MIDI, OSC, or panic**. Press `Start`, then `N` for next, hold `H` to rehearse a sustained tail, `V` to log a visual blackout, `S` for a *simulated* software stop. Export the JSON event log.
2. On Mac, open an independent `Save As` of the **actual M3 source or its portable Audio-only Set**, not the current production `.als`; audition the full piano and the alternative scripted NEXT recordings before committing to a section.
3. In the same copy or a *separate* safe set, audition the actual M0 150-second source with its 47-second sustained body. **Do not claim the M0 derived ALS reopens natively until it has been observed.**
4. Do a first **4–6-minute sound rehearsal** using one accepted material, changing Hold/Release and phrase timing. Record both early and late choices. Use the console to mark cues, not to drive the DAW. Do not loop stems merely to reach 30 minutes.
5. Then run the six chapter cue plan as a **30-minute operator timing exercise**; unapproved material can be silent/mocked as long as the rehearsal log says so. A 30-minute *music* pass requires accepted sounds and transitions.

## Working six-block operator grid (five minutes each as a budget, not clip length)

| Budget | Function | Today's source | Music action | Visual action | Real decision |
| --- | --- | --- | --- | --- | --- |
| 00–05 | 低频 / 进入 | M0 | A few events; room for silence | Existing stone/light: near still | Next strike or omit |
| 05–10 | 钢琴 / 近景 | M3 | Bare whole phrase, then response | Remain quiet | Queue NEXT only at phrase end |
| 10–15 | 残响 / 漂移 | M3 tails / M0 texture | Hold/Release a derived tail | Quest can scan/trace visual only | How long is the tail worth keeping? |
| 15–20 | 压力 / 接近 | M0 | Build pressure without pushing master | Narrow the space/light | When may the next strike enter? |
| 20–25 | 主峰 / 撤除 | M0 (M1 only if accepted) | One earned intensity core and subtraction | One major material/light state | When to withdraw? |
| 25–30 | 回返 / 离场 | M3 | Another whole phrase, optional silence | Clear HUD to blackout | Final phrase or leave space |

The show budget is **28 minutes of possible music + 2 minutes of contingency / natural exit**, consistent with the current proposal. Do not fill empty time artificially. The presented window **21:00–21:30** remains subject to organizer confirmation. These are rehearsal functions, not six new compositions or a replacement for the five long-form passages in the canonical musical brief.

## What source material exists

- **M3**: real 120-second local source with four programmed piano phrases (38 notes), early/late scripted NEXT recordings, Hold/Release, four aligned stems, and a private portable v002 package. Artist listening decision, native portable ALS reopen and physical button integration still pending. The coordinate BPM recorded in the package **does not require quantizing the piano**.
- **M0**: real 150-second four-stem low-frequency source with seven deliberate strikes; audio-engine resampling verified. Native independent ALS reopen, artist acceptance and PA translation still pending.
- **Renew/Windows** visuals and the original R0 Drop Flow report are tracked separately in Atmospheric Escape. Neither the public repository nor this cue plan contains licensed/private source media. Rejected audio candidates are not quietly reintroduced.

## Control ownership

- **Music clock / audio**: Mac Ableton Live is authoritative. Existing DAW owner is the sole writer of the active production `.als`.
- **Audio performance**: APC mini = explicit *requests*, foot = reliable NEXT/HOLD once verified, Launch Control XL = physical sound-layer and effect macros with bounded ranges. No device directly sets master gain by default.
- **Visual**: Windows RTX 4080S existing renderer consumes authored music cues and optional Quest spatial inputs; Quest does not need to make or stop music. Its failure must not interrupt sound.
- **Safety**: a **real independent audio output mute** must exist outside WebXR, Wi-Fi and the cue console. `VISUAL_BLACKOUT` is different from stopping music. `safe.kill` in Show Score v2 is *global* and must not be used as a visual-only flag.

See [CONTROL_ROUTING.md](CONTROL_ROUTING.md) for ownership and collision rules and [REHEARSAL_RUNBOOK.md](REHEARSAL_RUNBOOK.md) for Ableton/Quest/foot commissioning.

## Evidence and release gate

`arrangement-master.json` is an **operator plan, not a Show Score v2 runtime event**. No fabricated BPM, packet latency, pedal MIDI Note/CC, IP or verified plugin setup. The optional OSC probe is **listen-only**, has no MIDI access, and must be used on a free port. All real messages need their actual source, software versions and measured results before live mapping.

A rehearsal passes only when **two recordings using the same accepted musical material** show different duration/entry/release, both arrive at a natural end, XR loss is nonfatal, and operator can regain a safe state without network connectivity. A console-log export alone is **not** evidence of these physical tests.