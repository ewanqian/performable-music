# Non-destructive PowerShell preflight. No packages installed, Git history changed or agents spawned.
param([switch]$RunTests)
$ErrorActionPreference = 'Continue'
Write-Host 'SPATIAL PROGRAM / READ-ONLY DOCTOR / 2026-11-08' -ForegroundColor Cyan
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $root 'AGENTS.md'))) {
  Write-Error 'Run from a performable-music checkout with AGENTS.md'
  exit 2
}
Write-Host "REPO ROOT: $root"
Push-Location $root
try {
  foreach ($command in @('git','node','npm','opencode','blender')) {
    $found = Get-Command $command -ErrorAction SilentlyContinue
    if ($found) { Write-Host "$command : $($found.Source)" }
    else { Write-Host "$command : NOT FOUND / OPTIONAL" }
  }
  if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host ''
    Write-Host 'GIT WORKTREES:'
    git worktree list
    Write-Host 'GIT STATUS (do not erase user changes):'
    git status --short
    Write-Host 'BRANCH AND HEAD:'
    git branch --show-current
    git log -1 --format='%h %cs %s'
  }
  if (Get-Command opencode -ErrorAction SilentlyContinue) {
    Write-Host 'OPENCODE VERSION (NOT PROOF OF GO SUBSCRIPTION):'
    opencode --version
  }
  $lab = Join-Path $root 'spatial-playground/hand-osc-lab'
  if (Test-Path $lab) {
    Write-Host 'SOURCE FILE STATUS:'
    foreach ($file in @('app.mjs','score-map.mjs','archive/sigil-simulator.mjs','studies-ui.mjs','atlas-engine.mjs')) {
      Write-Host "$file : $(Test-Path (Join-Path $lab $file))"
    }
    if ($RunTests) {
      if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Error 'Node missing'; exit 3 }
      Push-Location $lab
      try {
        node --test engine.test.mjs instrument-gesture.test.mjs instrument-audio.test.mjs organic-engine.test.mjs studies-engine.test.mjs atlas-engine.test.mjs score-map.test.mjs
        if ($LASTEXITCODE -ne 0) { Write-Error 'Node unit tests failed'; exit $LASTEXITCODE }
      } finally { Pop-Location }
    }
  }
  Write-Host 'NO AGENTS SPAWNED. NO LOCAL FILES MODIFIED. READY FOR HUMAN QA.' -ForegroundColor Cyan
} finally { Pop-Location }
