# Hybrid Authoring Architecture — 2026-11-06
## Creative ownership stays with the artist; runtime handles composition, switching, synchronization and recovery

### Change request

The creator evaluated NINE / TRANSIT SIGNAL V0: the transport curves and grid are useful as an engineering primitive, but the procedural result is **not acceptable as final authored visual material**. In particular, automatically zooming the whole composition with scene changes was undesirable. Fixed four-step storytelling is too narrow. The creator will author the visual language and actual footage/geometry; the Runtime should **not generate an AI-designed stage visual aesthetic**.

This is not a prompt to generate 16 more similar scenes. It changes ownership and modularity.

### Immediately corrected in v0.2

- **Fixed camera**: V0 had a per-chapter `scale` and a SPACE parameter multiplying its camera scale. Both are removed. No implicit camera push/pull or continuous camera rotation. An authored camera move needs an explicit cue later.
- **Motion at rest**: MOTION defaults to 0; otherwise motion is intentional through the control and selected local material behavior.
- **Independent visual material selectors**: `COMPOSITE`, `GRID`, `ORBITS`, `ARCHITECTURE`, `POINTS`, `NONE`. These are *temporary built-in placeholders*, not a final visual language. Material choice is not locked to the four chapter states.
- **Independent overlay visibility**: 3D field, 2D information-graphics/typography can be toggled separately.
- **Local author media plate**: choose own PNG/JPG/WebP or MP4/WebM file; display without aspect-ratio crop, opacity manually adjustable, muted looping video. This is a browser-local input. It is **not** uploaded to GitHub and its raw pixels/bytes are not stored in event logs.
- **No new autonomous scene generation** and the optional auto chapter cycle stays off unless manually engaged.

This does not turn the V0 into a professional AV compositor. No GLB/FBX import, 3D camera editing, video output, LUT processing, NDI/Syphon, DMX, true audio sync or Vision Pro support has been implemented in this pass.

## 1. Distinct artistic and engineering layers

```text
AUTHOR / curatorial decisions
  ├── original compositions, photos, type, plates, graphic elements
  ├── Blender / Geometry Nodes / procedural mesh, animations
  ├── original videos, depth/point-cloud captures (only if actual data exists)
  ├── explicit material palette, intended composition and camera
  └── approved scene/cue timeline
                         |
                      MANIFEST
                         |
SHOW SCORE / musical conductor ── event_id, clock, performance control
                         |
                 RUNTIME / compositor
     ├── author asset renderer (2D images/video/3D geometry)
     ├── optional parametric shader / lines / points / simulation
     ├── camera rig (STILL by default, move only via cue)
     ├── typography/data overlay (as artwork, not uncontrolled telemetry)
     ├── layer mixer & transition manager
     └── recorder / replay / disconnect/fallback
```

Runtime owns **determinism, switching, layering, synchronization and recovery**. The artist owns **taste, subject matter, form, composition, motion decisions and final selection**. Agent can implement asset adapters and transformations but must not automatically replace approved content.

## 2. Six orthogonal state dimensions (NOT a single 4-chapter switch)

| Axis | Meaning | Examples | Scope |
| --- | --- | --- | --- |
| `narrative.scene` | where we are in the work | ARRIVAL / EXCHANGE / DEVIATION / TRANSFER; user may add others | story and lighting context |
| `material.active` | what content is visible | author video / original photo / glTF GN asset / procedural lines | material and source identity |
| `composition.layout` | how content is framed | full-screen / split layer / inset / precise matte / 1:1 region | stage composition |
| `motion.mode` | if/how the material moves | STILL / LOOP / PROCEDURAL / MANUAL_CUE / MIDI_DRIVEN | motion, not auto zoom |
| `camera.cue` | where/how it is viewed | HOLD / author keyframe / explicit orbit / transition | camera; default HOLD |
| `music.state` | what the audio is doing | SEED / BUILD / HOLD / PEAK / RELEASE | originates in Show Score |

**Transition verbs** must remain separate: `CUT`, `HOLD`, `FADE`, `REVEAL`, `SWAP`, `MORPH`, `FREEZE`, `RETURN`. No automatic selection of these verbs based solely on loudness or BPM.

An author can hold the camera for 90 seconds and switch only the text and one material; or preserve the same graphic composition across several music sections. A single narrative scene can contain multiple materials and composition states.

## 3. Asset/ownership contract (proposal, not implemented loader)

Before developing another procedural city, **ask the artist to prepare ONE authored visual source**, even a single PNG or 4-second silent clip, and build a robust pipeline around it. Possible assets:

- PNG/WebP: graphics, masks, original art
- MP4/WebM: rendered Blender/Geometry Nodes scene, authored loops, precomposed effects
- glTF/glb: evaluated Blender procedural mesh, camera/animation where export supports it
- PLY/point-cloud: only when actual scan/capture and appropriate loader exists
- custom JS/Shaders: original procedural language, clearly declared inputs/outputs

Each source has a record:
```json
{
  "id": "asset-my-original-001",
  "type": "image",
  "uri": "assets/artist-supplied-placeholder.png",
  "rights": "original-or-authorized",
  "fit": "contain",
  "authored_frame": {"width": 1920, "height": 1080},
  "loop": false,
  "controls": ["opacity", "visibility", "position"],
  "notes": "placeholder only, file not present in repository"
}
```

This is an **example only**; a path does not make an absent image available. Original-source media should remain offline or go to a properly licensed, explicit asset folder after the user chooses.

## 4. Hybrid visual production modes

**Mode A / Authored first:** full-resolution original film/image/geometry and controlled simple graphic overlay. Lowest stage risk; valuable for commercial portfolio polish and authored composition. Pre-render hard-to-reproduce complex materials, keep important scene choices interactive.

**Mode B / Real-time code first:** particles, lines, typography, flow fields and shader-generated space based on author-written algorithms. Best for sustained dynamic identity and controls. Do not require any new asset.

**Mode C / Mixed scene:** authored content + real-time projection/occlusion/curves/labels. A material can be swapped while motion/camera remain fixed; a voice can drive a single spatial parameter without controlling all visuals.

**Mode D / Dual-engine live:** Blender/Geometry Nodes/EEVEE runs independently with explicit OSC control; stage runtime composites its video and real-time graphical overlay. Use only when Blender's live node logic materially beats an evaluated glTF asset; stage capture latency and CPU/GPU must be measured.

Modes are production routes, not visual styles or automatically inferred aesthetics.

## 5. Author-controlled camera rule

**CAMERA HOLD is the default for every new scene.** No audio-driven camera zoom or scene preset automatic scale. When an artist wants movement, it should be explicit:
```json
{
  "cue_id": "camera-push-01",
  "source": "AUTHOR",
  "trigger": "FOOT_OR_TIMELINE",
  "verb": "CAMERA_MOVE",
  "parameters": {
    "from": "cam-still-a",
    "to": "cam-close-b",
    "duration_ms": 1800,
    "ease": "cubic_in_out"
  }
}
```

This shape is a proposal, not yet accepted by the runtime parser.

## 6. Correct next build

**Do not** generate more placeholder content. Instead:

1. Use V0.2 visual lab to test a local author-supplied plate plus the optional `ORBITS` or `GRID` layer. Ensure it is not stretched or cropped and the camera never zooms without an explicit action.
2. Separate chapter from visual material in event log. Check record/replay of material and 2D/3D layer toggles. Note browser-local image/video is *not* serialized or replayed.
3. Add an asset manifest, reference resolver and a type-safe `CUE_SET` that does not force a chapter to dictate materials, camera or transitions.
4. Only after the artist supplies a **single selected asset**, implement its real-time controls; do not invent an image-generation prerequisite.
5. Integrate existing Show Score/OSC conductor for one music event and **one** authored visual change. Capture and compare two full runs.
6. Next consider Three.js glTF/instancing, optional PixiJS/Hydra, Blender live OSC and headset/venue deployment. Nothing before a measurable benefit.

### Acceptance

- V0.2 page loads with default MOTION=0 and AUTO OFF.
- Every chapter holds identical camera magnification and orientation.
- A user can select only `ORBITS`, or only `POINTS`, and can hide typography independently.
- An image or silent video can be inserted with `object-fit:contain`, opacity adjusted and cleared without upload.
- Scene, material and layer decisions serialize in the event log and replay; imported media content is not in that log.
- Asset is not required to show the built-in visual field.
- No fabricated music, headset, scan or performance claims.

**Current status:** files committed to GitHub, syntax/Pages CI to be checked; real browser interaction and hardware validation must still be recorded.
