# Spatial Hand Lab — repository split handoff (2026-11-09)

## Intent / status

Separate the growing WebXR hand/gesture application experiments from the **Performable Music** research identity and the artist's Portfolio. **The new repository does not exist yet**: the connected GitHub toolset can create branches, commits, files and PRs inside existing repositories, but cannot create repositories. This document prepares the split without claiming the transfer has happened.

**Proposed destination:** `ewanqian/spatial-hand-lab` (name reserved only in this plan; no repository creation has been performed). Scope: Quest/WebXR hand tracking, gesture classification, six/eight-way selectors, OSC bridges, debugging tools, spatial particles, magic/fan experiments, authored procedural effects and UI. Exclude private user data, cached authorized audio recordings, compiled original game assets, other contributors' proprietary materials.

Keep `ewanqian/performable-music` focused on **score, composition, playable music, show control, Ableton/Max/OSC integration and stage performance**. The new lab should become the canonical place for *future* hand/XR experimentation only after links, licenses, build and CI are independently working.

## Two featured Portfolio entries (public art/CV hygiene)

In `ewanqian/portfolio` the curated Applications page should show exactly:

1. **Hand / Space / OSC** — https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/ 
2. **Hand / Synth / Space V2** — https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/instrument.html

These are the existing early externally circulated core interfaces. Do not change their URLs, file names, output or identifiers. The user mentioned an earlier **“OIC”** link; available code identifies **OSC** as the working name, but the exact user-posted URL should still be confirmed from the original post before retiring *any* redirect.

### Additional externally potentially circulated / keep serving

- **Organic Fields** early third experiment: https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/playground.html
- Main spatial scene: https://ewanqian.github.io/performable-music/spatial-playground/
- Gesture Dynamics: https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/gesture-dynamics.html
- Original Spellcraft variants: https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/spellcraft.html?line=east and ?line=west
- New fan experiences: https://ewanqian.github.io/performable-music/spatial-playground/warlock-lab/ and https://ewanqian.github.io/performable-music/spatial-playground/warlock-immersion/

All original URLs in the `spatial-playground/**` static GitHub Pages deployment remain reachable by leaving the existing files and deployment workflow intact. A Portfolio listing removal is **not** a link removal.

## Research stages to move into the independent repository

**Protected published legacy:** `hand-osc-lab/index.html`, `instrument.html`, and the early `playground.html` third demo; keep serving the original copies for indefinite public link compatibility.

**New development after demo 02/03:** `hand-osc-lab/gesture-*`, `spellcraft-*`, `warlock-lab/**`, `warlock-immersion/**`, `atlas-*`, `handseal-*`, `neural-*`, `neuro-*`, `spatial-waves-*`, `studies-*`, `phalanx-*`, `xr-cast-*`, and hand-tracking-specific test fixtures. This grouping is an inventory, **not** an authorization to remove files before they have been independently copied, built, linked and audited.

**Dependencies to inspect and copy as needed:** `spatial-playground/hand-osc-lab/engine.mjs`, bridge scripts, `protocols/**`, `spatial-playground/**` shared imports, root-scoped fonts/images, test runners and GitHub Actions. Browser pages importing `../hand-osc-lab/engine.mjs` or other relative modules must resolve in the new host. Keep the Three.js dependency pinned. Beware absolute `/performable-music/` paths in JavaScript and site-specific CSP.

**Music-related crossovers:** preserve references in Performable Music to downstream instrument studies, but do not duplicate them as separate completed artwork/CV cards. If a realtime audio project logically belongs to the music repository, link to the reusable tracking library instead of importing the whole experimental gallery.

## Non-destructive cutover checklist

- [x] Retain all old published static files.
- [x] Curate the Portfolio Applications display to two representative entries in a separate reviewable branch; registry and original URLs remain unchanged.
- [x] Inventory known early public links, including third-demo and later deep links.
- [ ] Create public `ewanqian/spatial-hand-lab` repository (requires the user's GitHub UI or tool granting repository creation).
- [ ] Copy research sources and shared dependencies to the new repository **without removing old files**.
- [ ] Deploy the independent Pages site and verify each new URL loads under HTTPS and Quest Browser.
- [ ] Smoke test real WebGL + desktop, mobile and audio; restore original navigation, relative asset resolution, and JSON/audio import.
- [ ] Test actual Quest 3 hand tracking, MR launch, 25-joint inputs, palm menu, SFX unlock, frame time and disconnect recovery.
- [ ] Change *only future research links* to the new repository. Keep early demo 01/02/03 permanent at their old paths.
- [ ] Once the new paths are verified, decide whether old **later** pages remain frozen mirrors or use a clearly labeled forward link. Never remove the published files blindly.

## Proposed new repository top level

```
spatial-hand-lab/
  README.md                         # landing, scope, QA state, original license ledger
  apps/                             # independently playable work-in-progress
    gesture-dynamics/
    spellcraft/
    warlock/
    handseal/
    spatial-waves/
  runtime/
    webxr-input/                     # joints, state hysteresis, loss/recovery
    gesture-recognizers/             # motions, fingers, movement grammar
    spatial-effects/                 # simulation, shaders, particle rendering
    osc-bridge/                      # explicitly opt-in forwarding and security
  studies/                           # isolated tests with known input/output
  public-link-compat/                # inventories of previously published links
  licenses/                          # verified third-party source attribution
  .github/workflows/                # regressions and Pages
```

Use a copy-first transition; do **not** wholesale move every music/AV instrument into this new repository. Store shared algorithms with explicit module boundaries and preserve original Git commit history via documented upstream SHA references. No assertion of final artwork completion should be made just because source files were reorganized.

## Source-of-truth rules

- **Portfolio:** selected completed/public-facing work and at most two confirmed published research entrances — not every prototype.
- **Performable Music:** musical systems, scores, performance runtime and active stage/music research.
- **Spatial Hand Lab (planned):** hand input middleware, spatial interactions, tools, experiments, playful prototypes and fan-study branches.
- **Art-works:** artistic lineage, finalized project descriptions, conceptual framing; an experiment remains a draft until curated.

## Exact quick-start after destination repository is created

Once the empty repository exists and this connection can access it, copy source code via GitHub tree/commit actions (or locally clone, `rsync` relevant source paths, `git add`, and push) **rather than changing early public URLs**. Enable Pages from GitHub Actions and build an adapter/landing page; only then update new experiment links. Do not run destructive `git mv` in Performable Music. Preserve independent PR provenance via links to the source commits.
