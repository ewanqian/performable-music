import test from 'node:test';
import assert from 'node:assert/strict';
import { ringSlots, assignSlots, minChord, overlaps, radiusFor } from './label-layout.mjs';

test('ring slots are evenly spaced and unique', () => {
  const s = ringSlots({ count: 12, radius: 0.1 });
  assert.equal(s.length, 12);
  const angles = s.map(v => v.angle);
  for (let i = 1; i < angles.length; i++) {
    assert.ok(Math.abs((angles[i] - angles[i - 1]) - Math.PI * 2 / 12) < 1e-9);
  }
});

test('chord spacing grows with radius and shrinks with count', () => {
  assert.ok(minChord(12, 0.1) > minChord(12, 0.05));
  assert.ok(minChord(28, 0.2) < minChord(12, 0.2));
});

test('radiusFor guarantees the requested gap', () => {
  const r = radiusFor(12, 0.03, 1.25);
  assert.ok(minChord(12, r) >= 0.03 * 1.25 - 1e-9);
});

test('assignment is unique and picks the nearest free slot', () => {
  const slots = ringSlots({ count: 12, radius: 0.1 });
  const items = [
    { id: 'a', dx: 0, dy: -0.1 },
    { id: 'b', dx: 0.1, dy: 0 },
    { id: 'c', dx: 0, dy: 0.1 }
  ];
  const out = assignSlots(slots, items);
  assert.equal(out.length, 3);
  const used = new Set(out.map(o => o.slot.index));
  assert.equal(used.size, 3);
  const a = out.find(o => o.id === 'a');
  assert.equal(a.slot.index, 0); // -PI/2 is the first slot
});

test('two items with the same angle cannot share a slot', () => {
  const slots = ringSlots({ count: 4, radius: 0.1 });
  const out = assignSlots(slots, [
    { id: 'x', dx: 0, dy: -1 },
    { id: 'y', dx: 0, dy: -0.9 }
  ]);
  assert.notEqual(out[0].slot.index, out[1].slot.index);
});

test('overlap check matches geometry', () => {
  assert.ok(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 4, y: 0, w: 10, h: 10 }));
  assert.ok(!overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 40, y: 0, w: 10, h: 10 }));
  assert.ok(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 12, y: 0, w: 10, h: 10 }, 4));
});
