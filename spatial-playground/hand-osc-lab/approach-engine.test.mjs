import test from 'node:test';
import assert from 'node:assert/strict';
import { ApproachEngine, TARGETS, distance } from './approach-engine.mjs';

// Synthetic 25-joint hand. Targets are placed at increasing reach from the
// wrist so the 'zoned' strategy has something real to normalise against.
function hand(thumbTip, overrides = {}) {
  const p = Array.from({ length: 25 }, (_, i) => [0, 0, -0.10 - i * 0.001]);
  p[0] = [0, 0, 0];
  const at = {
    7: [-0.030, -0.020, -0.090], 8: [-0.040, 0.030, -0.120],
    12: [0.000, -0.010, -0.100], 13: [0.000, 0.050, -0.130],
    17: [0.030, -0.020, -0.100], 18: [0.040, 0.030, -0.130]
  };
  for (const [k, v] of Object.entries(at)) p[Number(k)] = v;
  for (const [k, v] of Object.entries(overrides)) p[Number(k)] = v;
  p[4] = thumbTip;
  return p;
}

test('six targets, canonical joint indices', () => {
  assert.equal(TARGETS.length, 6);
  assert.deepEqual(TARGETS.map(t => t.index), [7, 8, 12, 13, 17, 18]);
});

test('far thumb produces no digit and reports FAR', () => {
  const e = new ApproachEngine({ strategy: 'nearest' });
  const out = e.update(hand([0, 0.5, 0]), 0);
  assert.equal(out.events.length, 0);
  assert.equal(out.nearest.reason, 'FAR');
  assert.equal(out.sequence, '');
});

test('contact needs dwell before it becomes a digit', () => {
  const e = new ApproachEngine({ strategy: 'nearest', dwellMs: 90, rearmMs: 0 });
  const pos = hand([-0.030, -0.020, -0.090]); // on joint 7
  e.update(pos, 0);
  const mid = e.update(pos, 40);
  assert.equal(mid.events.length, 0);
  assert.equal(mid.nearest.reason, 'DWELL');
  const done = e.update(pos, 100);
  assert.equal(done.events.filter(v => v.kind === 'DIGIT').length, 1);
  assert.equal(done.sequence, '1');
});

test('thumb must be released before the next digit', () => {
  const e = new ApproachEngine({ strategy: 'nearest', dwellMs: 20, rearmMs: 45 });
  const on = hand([-0.030, -0.020, -0.090]);
  e.update(on, 0);
  e.update(on, 30);
  assert.equal(e.sequence, '1');
  // Still holding: no repeat.
  e.update(on, 60);
  e.update(on, 90);
  assert.equal(e.sequence, '1');
  // Lift, then approach again.
  e.update(hand([0, 0.5, 0]), 100);
  e.update(on, 200);
  e.update(on, 240);
  assert.equal(e.sequence, '11');
});

test('ambiguous neighbouring joints are blocked, not guessed', () => {
  const e = new ApproachEngine({ strategy: 'nearest', dwellMs: 10, rearmMs: 0, ambiguousMm: 0.006 });
  // Thumb equidistant from joint 7 and joint 8 (2mm apart in distance).
  const pos = hand([-0.035, 0.005, -0.105]);
  const out = e.update(pos, 0);
  assert.equal(out.events.length, 0);
  assert.ok(['AMBIGUOUS', 'DWELL'].includes(out.nearest.reason));
  const later = e.update(pos, 500);
  assert.equal(later.events.filter(v => v.kind === 'DIGIT').length, 0);
});

test('tracking loss never fabricates a digit and releases contact', () => {
  const e = new ApproachEngine({ strategy: 'nearest', dwellMs: 10, rearmMs: 0 });
  const on = hand([-0.030, -0.020, -0.090]);
  e.update(on, 0);
  e.update(on, 20);
  assert.equal(e.sequence, '1');
  const lost = e.update(null, 40);
  assert.equal(lost.events.filter(v => v.kind === 'DIGIT').length, 0);
  assert.equal(lost.events.filter(v => v.kind === 'LOST').length, 1);
  assert.equal(lost.active, null);
  assert.equal(lost.targets[0].reason, 'TRACKING_LOST');
});

test('zoned strategy scales thresholds by joint reach', () => {
  const e = new ApproachEngine({ strategy: 'zoned', onDistance: 0.028 });
  const pos = hand([0.5, 0.5, 0]);
  const out = e.update(pos, 0);
  const byDigit = Object.fromEntries(out.targets.map(t => [t.digit, t.threshold]));
  // Joint 18 is the farthest from the wrist, joint 7 the nearest.
  assert.ok(byDigit[6] > byDigit[1]);
  assert.ok(byDigit[1] >= 0.028 * 0.8 && byDigit[6] <= 0.028 * 1.35);
});

test('velocity strategy rejects a slow drift-through', () => {
  const e = new ApproachEngine({ strategy: 'velocity', dwellMs: 10, rearmMs: 0, closingMmPerS: 0.05 });
  // Sit just inside the threshold with no closing motion at all.
  const near = hand([-0.030, -0.020, -0.065]);
  e.update(near, 0);
  const out = e.update(near, 100);
  assert.equal(out.events.filter(v => v.kind === 'DIGIT').length, 0);
  assert.equal(out.nearest.reason, 'NO_CLOSING_MOTION');
});

test('engine explains rejection in millimetres', () => {
  const e = new ApproachEngine({ strategy: 'nearest' });
  const out = e.update(hand([0.2, 0.2, -0.09]), 0);
  assert.equal(out.nearest.reason, 'FAR');
  const text = e.explain(out.nearest);
  assert.match(text, /mm/);
  assert.match(text, /阈值/);
});
