#!/usr/bin/env bash
# Read-only: no sudo, plugins loaded, license tokens, network access or project writes.
set -u
echo "=== Performable Music / host audit (read only) ==="
date -u
uname -a
echo "--- Hardware (no serial shown) ---"
if command -v system_profiler >/dev/null; then
  system_profiler SPHardwareDataType 2>/dev/null | grep -E 'Chip:|Processor Name:|Memory:|Total Number of Cores:|Number of Cores:' || true
  system_profiler SPSoftwareDataType 2>/dev/null | grep -E 'System Version:|Kernel Version:' || true
fi
echo "--- Toolchain ---"
for x in node python3 xcodebuild swift ffmpeg ffprobe sox brew qwen ollama; do
  if command -v "$x" >/dev/null 2>&1; then echo "$x: $(command -v "$x")"; else echo "$x: NOT_FOUND"; fi
done
if command -v xcodebuild >/dev/null 2>&1; then xcodebuild -version 2>&1 || true; fi
if command -v node >/dev/null 2>&1; then node --version; fi
if command -v python3 >/dev/null 2>&1; then python3 --version; fi
echo "--- Audio plugin names only ---"
for root in "$HOME/Library/Audio/Plug-Ins/VST3" "/Library/Audio/Plug-Ins/VST3" "$HOME/Library/Audio/Plug-Ins/Components" "/Library/Audio/Plug-Ins/Components"; do
 if [ -d "$root" ]; then
   echo "FOUND $root"
   find "$root" -mindepth 1 -maxdepth 1 \( -type d -o -type f \) -print 2>/dev/null | sed 's!.*/!!' | sort | head -100
 else echo "MISSING $root"; fi
done
echo "--- Audio apps (names only) ---"
for d in "/Applications/Waveform.app" "/Applications/Ableton Live 12 Suite.app" "/Applications/REAPER.app"; do
 [ ! -e "$d" ] || echo "FOUND $d"
done
echo "--- Disk ---"
df -h "$HOME" | tail -1 || true
echo "NOT_TESTED: DAW GUI save/reopen, licenses, audio-device round trip, GPU, EEG, venue"
