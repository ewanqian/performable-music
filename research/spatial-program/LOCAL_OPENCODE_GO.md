# Local OpenCode Go — Windows / multi-repo handoff (2026-11-08)

This is a **local dispatch playbook**, not a claim that an external agent has been started or that the user has configured a provider. Project execution remains subordinate to the December 3 Critical Field P0 audio/Show Score commitment.

## One-time setup (you decide whether to connect)

- Use installed OpenCode Desktop or TUI. Open the existing Performable Music local checkout as a project.
- If not already connected, run **/connect** → **OpenCode Go** and paste your own Go API key; then **/models** and choose a currently available model. The list can change. No API keys or billing credentials in git, issue bodies, logs or AGENTS.md.
- OpenCode Go is one provider (currently advertised Go / Go Plus tiers) and does not include a shared always-running task manager or guaranteed agent orchestration. Official docs: https://dev.opencode.ai/docs/console/go/
- Run ./tools/spatial-doctor.ps1 from PowerShell (PowerShell 7 preferred). It reads status and dependencies; it NEVER resets files or installs packages. For one source-only test, invoke with -RunTests.
- Read the repo AGENTS.md and research/spatial-program/PROGRAM_2026-11-08.md first. The existing Haiku 5.5 PM runbook remains canonical.

## Recommended agent arrangement

One **PM agent**, three **read-only research subagents**, at most **one active code writer per repo/worktree**. Research outputs can be produced in parallel, but if they have no actual child session IDs their GitHub tickets remain READY_NOT_STARTED.

| Agent file | Responsibility | Can change source? | First ticket |
|---|---|---|---|
| .opencode/agents/spatial-pm.md | scope, source inventory, cross-review, dispatch and QA verdict | PM only with explicitly approved bounded issue | #20 + orchestration |
| .opencode/agents/research-audio.md | PolyNodes/SPATAI/Strudel/Needle facts and sound geometry architecture | NO | #19 |
| .opencode/agents/research-entropy.md | private archive asset/GLB/model audit and 3D world bridge | NO | private entropy #11 |
| .opencode/agents/research-lighting.md | independent environmental lighting performance design | NO | #21 |
| .opencode/agents/spatial-qa.md | synthetic vs actual XR checks, latency, licensing and changed-file review | NO | any proposed PR |

Agent specs use no pinned model because local Go model IDs/entitlements may change. If the local client does not recognize the V2 agent format, run its built-in Plan/Explore in read-only mode. Do not silently broaden permissions.

## Git worktrees before parallel coding

Clone the user's existing repositories once, into stable Windows folders (replace the paths with your real paths):

    git clone https://github.com/ewanqian/performable-music.git
    git clone https://github.com/ewanqian/atmospheric-escape-liveset.git

Private ENTROPY clone requires existing GitHub authorization. Never upload its original HTML, assets or models to a new public remote.

Inspect clean state first; don't discard user edits:

    git status --short
    git worktree list

For a **single approved** coding ticket, create separate worktree from an existing local branch. Example only:

    git fetch origin main
    git worktree add ../performable-music-audio -b work/audio-geometry origin/main

Separate code agents do not modify a shared DAW session, files outside their worktree, or the private source archive. Never use reset --hard, clean -fd, force-push, chown or auto-delete branches without explicit authorization.

## Paste this as the top-level PM instruction

> Read AGENTS.md, LOCAL_AGENT_TASK.json and research/spatial-program/PROGRAM_2026-11-08.md. Inspect local git state before anything else. Keep December 3 audio P0 protected. Dispatch ONLY read-only source audits for GitHub issues #19, private ENTROPY #11 and #21; if subagent execution is unavailable output three task cards marked READY_NOT_STARTED. Return real source citations, license flags, branch/commit (if any), FAIL or PASS tests, missing hardware evidence and ONE next priority. Do not write a new visual prototype before the artist selects source media and the ENTROPY model exists as an actual checked GLB.

## Preflight (operator)

1. Check whether Quest browser sound works on new Score and Sigil pages; attach real audio/video or mark NOT_TESTED.
2. Check currently running local DAW/Blender/other agent sessions before task launch.
3. Open only the tickets actually relevant to today's one highest-priority outcome.
4. Create one branch/PR per coding ticket. Label research-only work as research, not implementation.
5. Ask the human to reject weak musical/visual outputs rather than creating five more alternatives.
6. Optional: permit one short review and one corrective iteration. PR must pass its own CI, and Quest actual QA remains separate.

## Mandatory output per subagent

    ISSUE:
    SOURCE LINKS AND PUBLICATION DATES:
    WORKSPACE / BRANCH / ACTUAL SESSION ID:
    FILES READ / CHANGED:
    FACTS vs INFERENCES vs ORIGINAL EXPERIMENT:
    LICENSING:
    TEST RUN / RESULTS:
    HARDWARE/DAW QA: TESTED or NOT_TESTED
    WHAT DOES NOT WORK:
    RECOMMENDED SINGLE NEXT SLICE:
    STATUS: READY_NOT_STARTED | BLOCKED | QA_PENDING | ACCEPTED | REJECTED

No background agents are running merely because these files or GitHub issues were created.
