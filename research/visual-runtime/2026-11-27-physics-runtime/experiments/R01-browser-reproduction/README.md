# R01 — Immutable R00 browser reproduction

2026-11-27 · One hypothesis: R00 is numerically reproducible in Chromium and the actual WebGL2 renderer/controls can be verified without modifying simulation state through camera operations.

Result: **partial pass; round BLOCKED**. R00 remains the baseline. The CPU numerical subgate passed all seven checks in a real Chromium page in both default and requested SwiftShader launch configurations, with the same reported values as R00. WebGL2 context creation returned null in both; no 3D draw, shader compilation, live controls, camera invariance or hardware claim. No new solver or artistic preset. Separate creative PR #73 remains untouched.

[Exact R00 HTML](../R00-periodic-fluid/index.html) · [Evidence](evidence.json) · [Reproduction harness](reproduce.py). The HTML blob is 48c9e539570f08d04c3ac77b12d8e41934ca8607 (11,735 bytes), identical to source commit cf9bf0bc31256dfc40cf8f1b7cafea7f88d3ecc5. No solver changes. The runner only executes the existing page and generates evidence and screenshots. Source verification: MDN [getContext](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext) explains null context; [WebGL drawing-buffer behavior](https://registry.khronos.org/webgl/specs/latest/1.0/) describes why delayed readPixels is not a reliable frame capture. No external code copied.

## Executed command

Run from this research directory, with Python and Playwright already available, and a trusted Chromium installed (choose your actual executable):
```sh
python experiments/R01-browser-reproduction/reproduce.py experiments/R00-periodic-fluid/index.html --chromium /usr/bin/chromium --output r01-output
```
The initial file:// navigation attempt was blocked by environment policy; the actual successful run used page.set_content with hash-verified unmodified HTML. Two screenshots show the numeric report and absence of render output. No binary artifact was uploaded. Runner exit 0 represents only the numeric/UI subgate, NOT complete R01.

## Next single gate: actual renderer and camera invariance

On a trusted WebGL2-capable browser, open the existing HTML locally. Confirm the CPU status rather than the no-WebGL or Renderer error message. Record browser/OS/adapter and actual frame; test reset, pause, positive/negative impulses, single step and projection toggle. For reproducible camera A/B, create two test-only instrumented page instances (do not change baseline): capture live tracer arrays and metrics before/after paused yaw/pitch, compare exact arrays and step counts, then apply the same single step to both and compare results. Test-only hook must not write to solver state. Require nonblank visual render and camera-dependent image change; do not infer from source. Capture screenshots and errors, note shader compile/link status and distinguish software vs hardware. Until this is exercised, mark all those checks BLOCKED/UNVERIFIED. Do not advance to R02 obstacle until this gate is reviewed or explicitly waived. Artist review: accept the numerical baseline and supply a supported browser run or authorize a documented waiver; no new artistic approval inferred.

No changes to production, music, existing deployment, workflows, other repos, R00, or A03. No auto-merge.
