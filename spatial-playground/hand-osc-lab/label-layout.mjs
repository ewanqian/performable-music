// Deterministic label placement. No DOM, no randomness.
//
// Labels on a joint cloud all want to sit on their joint, which is exactly how
// you get the current mess: overlapping glyphs at arbitrary offsets. Instead we
// put labels on a regular ring around the group and draw a leader line back to
// the anchor. Spacing is therefore constant, and nothing can overlap.

export function ringSlots({ count, radius, cx = 0, cy = 0, start = -Math.PI / 2 }) {
  if (!Number.isInteger(count) || count < 1) return [];
  const out = [];
  for (let i = 0; i < count; i++) {
    const angle = start + (i / count) * Math.PI * 2;
    out.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius, angle, index: i });
  }
  return out;
}

// Shortest distance between two adjacent slots. Used to assert that a ring is
// physically wide enough for the glyph size.
export function minChord(count, radius) {
  if (count < 2) return Infinity;
  return 2 * radius * Math.sin(Math.PI / count);
}

const angleOf = (dx, dy) => Math.atan2(dy, dx);
const norm = a => {
  let x = a;
  while (x < -Math.PI) x += Math.PI * 2;
  while (x > Math.PI) x -= Math.PI * 2;
  return x;
};

// Greedy but deterministic: items are sorted by angle, each takes the free slot
// whose angle is closest. No two items can land on the same slot.
export function assignSlots(slots, items) {
  const taken = new Set();
  const result = [];
  const ordered = [...items].sort((a, b) => angleOf(a.dx, a.dy) - angleOf(b.dx, b.dy));
  for (const item of ordered) {
    const target = angleOf(item.dx, item.dy);
    let best = -1, bestDelta = Infinity;
    for (let i = 0; i < slots.length; i++) {
      if (taken.has(i)) continue;
      const d = Math.abs(norm(slots[i].angle - target));
      if (d < bestDelta) { bestDelta = d; best = i; }
    }
    if (best < 0) continue;
    taken.add(best);
    result.push({ id: item.id, slot: slots[best], delta: bestDelta });
  }
  return result;
}

// True when two boxes overlap. Used by the tests and by the HUD debug view.
export function overlaps(a, b, pad = 0) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 + pad &&
         Math.abs(a.y - b.y) < (a.h + b.h) / 2 + pad;
}

// Ring radius needed so `count` glyphs of width `glyph` never touch.
export function radiusFor(count, glyph, gap = 1.25) {
  if (count < 2) return glyph;
  return (glyph * gap) / (2 * Math.sin(Math.PI / count));
}
