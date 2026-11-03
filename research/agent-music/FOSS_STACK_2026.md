# Zero-Cost, Agent-Friendly Music Stack (November 2026)

**Decision:** Before buying any VST or switching all projects, test a genuinely code-first composing workflow with **SuperCollider**, plus **Bespoke Synth** as a hands-on modular/live control option. Use **Ardour 9** only if a zero-cost build or an otherwise legitimate ready-to-run installation is available; official ready-to-run builds are usually paid, and free demo releases periodically mute audio. Keep existing MIDI/stems portable.

## Tool comparison

| Tool | Cost / license | Mac | Agent editing | Strong role | Key limitation |
|---|---|---|---|---|---|
| SuperCollider | Free GPL-3 | Yes | Directly author .scd (SynthDef, Pbind, OSC, NRT render) | Algorithmic composition, original DSP and complex synthesis | Steeper music/signal vocabulary; not a timeline DAW |
| Bespoke Synth | Free GPL-3; optional donations do not unlock features | Yes | Python livecoding + MIDI/OSC + modular GUI | Live instrument, generative performance patch | Not a substitute for complete production/mastering DAW; scripts still need runtime tests |
| Ardour 9 | GPL, source free; official ready-to-run build normally paid | Yes | Lua scripts + OSC; MIDI/clip editing | Full production, recording, routing and mix | A true zero-cash macOS setup may require difficult source build |
| Csound | Free LGPL | Yes | .csd files and command-line render | Deterministic synthesis, analysis, compositions as code | Less immediate live-performance UI |
| Sonic Pi | Free/open | Yes | Code/live loops | Fast musical sketches, learning, reliable patterns | Not full multitrack DAW |
| LMMS | Free/open | Yes | MIDI and editable project files, code agent workflows require verification | Piano-roll and pattern arrangements | Less suitable as a complex live performance system |
| Cardinal | Free/open GPL | Yes | Patch-oriented, relatively weak autonomous code workflow | Modular analog-like instrument/FX inside a host | Visual patch editing requires inspection |
| Surge XT | Free/open GPL-3 | Yes | Export/share presets; editing automation depends on host | Mature free synthesizer | Doesn't compose or mix a song for you |
| Zrythm 2.x alpha | Free/open source | Yes | Theoretical, project format evolving | Interesting future DAW | Developers explicitly say alpha is not for production |

## Recommended architecture

```text
               Human composer / listener
                        |
                  music-brief.md
                        |
                   Codex agent
          +-------------+------------------+
          |                                |
 SuperCollider .scd                   MIDI / stems
 synthesis, pattern, OSC              versioned exports
          |                                |
         audio -------------------> Ardour / existing authorized DAW
          |
          +---- OSC / MIDI ----> Bespoke Synth or Max
                                  live performance and control
                        |
                       record
                        |
                 blind A/B decision
```

The LLM is **offline/development-time**. Do not let it make unsafe per-sample DSP/feedback decisions live. A running agent is not necessary during the performance.

## A 90-minute comparative test (instead of installing 20 tools)

1. Install SuperCollider from https://supercollider.github.io/ on Mac M-series; check speaker volume low before running.
2. Have Codex generate **one original 16-bar composition** from a defined 2-bar motif: A / A' / B / A''; use a basic SynthDef + deliberate expression rather than more notes.
3. Save source as `studies/agent-engine-compare/supercollider-afterimage.scd` locally. Run and record or use official Score NRT facilities. The agent must provide actual commands for the installed version, not claim rendered audio until verified.
4. Change exactly ONE musical rule (harmonic tension or rhythmic placement). Render version B.
5. Blind A/B listen. If no better identity, change composition, not plugins.
6. After a genuine musical pass, use Bespoke to map OSC/MIDI to 2-4 bounded controls and verify hand/foot fallback.
7. Keep sound evidence and decisions. Use GitHub for source/presets/documentation; keep raw third-party audio and private material outside the public repo.

## Trial prompts

**Composer prompt**

> Work within SuperCollider. Create two original 16-bar piano/electronic studies at 108 BPM using one 2-bar motif in D minor. Version A develops the contour and changes harmony; version B reframes the same motif through silence, altered register, syncopation and one timbral memory. Do not add endless drum tracks. Put synthesizer definitions, arrangement logic and parameter values in inspectable source files. Produce an audio render only if the local runtime is installed and confirm the output exists. Report sonic problems from actual listening when available. Do not claim the audio has been reviewed by a human.

**Instrument prompt**

> Create one Bespoke Synth modular instrument with a signature sound and four semantic controls (MEMORY/PRESSURE/DISTANCE/FRACTURE), plus safe neutral and MIDI/OSC mapping. Make an explicit test plan; prove the patch actually loads on my local version before calling it finished.

## Professional-quality gate

Tools are not quality credentials. Do not treat 96 bars, 2,033 notes, plugin count, multi-agent deliberation or any number of patterns as musical evidence.

Musical acceptance requires:
- memorable original motif;
- functional harmonic/rhythmic development;
- distinctive timbre and intentional silence;
- an A/B comparison the human has actually heard;
- safely saved/reopened/replayed performance assets.

## Verified primary references

- SuperCollider project: https://github.com/supercollider/supercollider
- SuperCollider NRT docs: https://doc.sccode.org/Guides/Non-Realtime-Synthesis.html
- Bespoke official: https://www.bespokesynth.com/
- Bespoke GitHub: https://github.com/BespokeSynth/BespokeSynth
- Ardour current: https://ardour.org/whatsnew.html
- Ardour Lua: https://manual.ardour.org/lua-scripting/
- Ardour payment model: https://ardour.org/faq.html
- Csound: https://github.com/csound/csound
- Sonic Pi: https://sonic-pi.net/
- LMMS: https://www.lmms.io/
- Cardinal: https://github.com/DISTRHO/Cardinal
- Surge XT: https://github.com/surge-synthesizer/surge
- Zrythm 2 alpha caution: https://forum.zrythm.org/t/zrythm-v2-0-0-alpha-1-released/596

**Status:** Evaluation and workflow design only. No software was installed or executed on the user's local machine by this research note.