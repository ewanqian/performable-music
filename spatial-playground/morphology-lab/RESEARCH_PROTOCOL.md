# Spatial Morphology Lab / 54 controlled 3D visual experiments
2026-11-09 — Stage Casting 04 / Performable Music

## Why this is a research laboratory, not 54 finished artworks

Earlier decorative circles and glow/brightness toggles were insufficient for evaluating artistic 3D visuals. This independent Three.js WebGL lab includes SIX original procedural scene systems with NINE curated and documented comparable experiments in each. 54 parameterized states do not mean 54 different physics simulations.

Run: https://ewanqian.github.io/performable-music/spatial-playground/morphology-lab/

### Evidence protocol

1. Fix the camera, animation length (15–30 seconds), output resolution and beat reference (100 BPM).
2. Save experiment A, select B, compare at the **identical camera**, changing one visual variable at a time. Slider modifications may change geometry/draw calls and should be recorded.
3. Record geometry counts, browser render calls, memory/CPU, photosensitivity caution and 30-second capture. Browser WebGL is not proof of Quest compositor FPS or stage LED compatibility.
4. Score each 0–5: **spatial depth, distinctive morphology, hand→visual causal response, musical timing, stage readability**. Qualitative human review is mandatory.
5. Keep at most TWO variants per family, then select ONE 60–90 second piece. Do not mass-produce 54 disconnected videos and call this progress.
6. Distinguish SOURCE_TESTED / BROWSER_TESTED / QUEST_TESTED / DAW_TESTED / ARTIST_APPROVED.

## A. Light envelope — nine actual temporal rules

1. Steady State — reference for other envelopes.
2. Slow Breath — gentle continuous crescendo/decrescendo.
3. Orbit Chase — continuous phase propagation between 3D fixtures.
4. Interleaved — odd/even group crossfade.
5. Crescendo Hold — ramp & sustain.
6. Soft Impulse — shaped 100 BPM beat response.
7. Depth Offset — near/far phase difference.
8. Relay Trail — distributed illumination handoff.
9. Release to Dark — slow ending.

**Variable:** continuous light envelopes and phase on a 3D light-source array. Compare direction readability and sense of depth, not only brightness.
**Caution:** no full-field high-contrast rapid flashing, no red strobes or >3 large-contrast flashes/s. W3C reference: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html . This is a browser visual experiment and does not certify an actual fixture.

## B. Spatial brightness — nine world-space luminance fields

1. Distance Falloff. 2. Depth Slice. 3. Spot Focus.
4. Edge Rim. 5. Distributed Nodes. 6. Local Emission.
7. Occlusion Study. 8. Fog Depth. 9. Exposure Discipline.

**Variable:** relative luminous intensity by 3D distance, direction, depth, surface and occlusion. Compare edge/silhouette retention, near/far readability and saturation.
**Limit:** art-directed approximate surface luminance, not calibrated physical photometry.

## C. 3D object topology — nine types of geometry

1. Nested Shells. 2. Orbital Rings. 3. Rib Structure.
4. Crystalline Lattice. 5. Twisted Tube Corridors. 6. Sectioned Volume.
7. Layered Sheets. 8. Magnetic Assembly. 9. Inside-out Form.

**Variable:** actual surface/volume topology and occlusion. Camera orbit must reveal real depth change. First performance candidate: SECTION and RIB geometry that can be held and opened by hand.

## D. Neuron structure — nine morphology mechanisms

1. Soma Emergence. 2. Dendritic Arbor. 3. Axonal Projection.
4. Branch Order. 5. Artistic Propagation Along Edges.
6. Terminal Density. 7. Network Contact. 8. Prune / Regrow.
9. Morphometry.

**Current implementation:** original deterministic artistic branching. NOT a genuine neuronal tracing, not MRI and NOT real EEG/action potentials.
**Upgrade:** ingest one permitted neuron SWC, preserve x/y/z/radius/parent/type and source identity, build actual branch order/color/section and only then claim a morphology-based visualization.
- https://www.neuromorpho.org/ ; 8.7 released 2026-10-29; more than 300k digital reconstructions.
- https://www.neuromorpho.org/useterm.jsp ; CC BY 4.0 with detailed attribution to original paper, NeuroMorpho RRID and key citation.
- https://alleninstitute.github.io/AllenSDK/cell_types.html ; SWC coordinate and parent semantics.
- https://docs.blenderneuron.org/introduction.html ; BlenderNEURON morphology and simulated membrane variable rendering.

## E. Physarum-inspired structure — nine original growth controls

1. Single Attractor. 2. Dual Nutrient. 3. Obstacle Avoidance.
4. Network Fusion. 5. Tube Reinforcement. 6. Exploration.
7. Retraction. 8. Nutrient Gradient. 9. Colonies.

**Current implementation:** world-space tube growth by 3D target pursuit with path variation, NOT a validated Physarum multi-agent chemo-field. Real 3D chemical-field study will separately need deposit, diffusion, sensing, heading angle and nutrient/obstacle interactions.
References:
- https://entagma.com/physarum-slime-mold/ — Houdini 3D neighbor-sensing adaptation.
- https://fes.kyoto.jp/wp-content/themes/washiback2020/gpu-io-main/examples/physarum/index.html — GPU agents/diffusion reference.
- https://pmc.ncbi.nlm.nih.gov/articles/PMC5539195/ — network mechanism research and distinction from observed living slime mould.
- https://onlinelibrary.wiley.com/doi/10.1111/cgf.15075 — PhysOM pattern research.

## F. Sakura / Botanical time — nine procedural 3D forms

1. Bud Emergence. 2. Fractal Crown. 3. Bloom Cluster.
4. Petal Layers. 5. Soft Wind. 6. Falling Petals.
7. Local Petal Vortex. 8. Lifecycle. 9. Seasonal Silence.

**Current implementation:** true 3D recursive branch skeleton and individually transformable instanced petal meshes, not a flat image/particle overlay. Future work should bind a shared physical wind field to branch bending + blossom motion, then model aerodynamic drag and random reorientation.
References:
- https://www.sidefx.com/docs/houdini/nodes/sop/lsystem.html — recursion of branching morphology.
- https://research.setjapan.co.jp/en/%E6%A1%9C%E3%81%AE%E3%83%97%E3%83%AD%E3%82%B7%E3%83%BC%E3%82%B8%E3%83%A3%E3%83%AB%E3%83%A2%E3%83%87%E3%83%AA%E3%83%B3%E3%82%B0/ — Blender procedural cherry blossoms.
- https://github.com/Leonxlnx/sakura-realm — MIT, procedural Three.js branch / canopy / petals / wind technical reference; no code copied.
- https://pmc.ncbi.nlm.nih.gov/articles/PMC8987840/ — plant/trees reconstruction and procedural modelling review.

## Local model/research asset hygiene

Create on the user's selected actual Windows drive (not automatically E:) a single library:
XR_ASSETS/neurons_swc/ ; physarum_sources/ ; sakura_procedural/ ; original_meshes/ ; three_live_trial/ ; licenses/

Record for each file:
filename, source_url, author, license, access_date, related_paper, units, format, transforms, attribution, approval_status.
Do not claim downloads were copied to the user's machine from this GitHub-only operation. No commercial film/model packs are bundled in this repo.

Three-Live: Google research / developer-preview project, explicitly not an officially supported Google product; useful as an isolated model portability benchmark, not a replacement of stage-safe Three.js input/OSC/Show Score. https://github.com/google/three-live

## Before December 3

**P0**: Neural Branch Order / Propagation combined with Spatial Brightness Focus / Rim; connect actual stable LAB02 hand joint semantic events to existing Spatial Waves HRTF audio, rehearse a SINGLE coherent 3–5 minute sequence with panic/reset. High-quality recorded artist-owned audio replaces test oscillator sounds.

**P1**: Physarum true 3D sensing/deposition and Sakura spatial wind, each as independent original work AFTER the neural hand instrument passes real QA. Do not prioritize decorative Sakura over the show.

## Required test log

- Study A/B; fixed camera and resolution;
- Real desktop browser & GPU model;
- Hand input REAL_XR or SIMULATED;
- geometry/draw calls, FPS and audio onset evidence;
- depth legibility 0–5, originality 0–5, sonic causality 0–5, stage readability 0–5;
- source license, photosensitivity notes, human KEEP/REVISE/REJECT verdict;
- next one corrective action.
