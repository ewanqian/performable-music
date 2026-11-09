import test from 'node:test';
import assert from 'node:assert/strict';
import { createField, advanceField, burst, interpretHand, GestureGate } from './gesture-dynamics-engine.mjs';

function syntheticHand(type) {
  const p = Array.from({ length: 25 }, () => [0, 0, 0]);
  const base = [-.065, -.029, .004, .037];
  for (let f = 0; f < 4; f++) {
    const j = 5 + f * 5, x = base[f] * (type === 'open' ? 1.3 : 1);
    p[j] = [x, .05, 0]; p[j + 1] = [x, .08, 0]; p[j + 2] = [x, .11, 0];
    const folded = type === 'fist' || (type === 'sword' && f >= 2);
    p[j + 3] = folded ? [x, .11, .03] : [x, .14, 0];
    p[j + 4] = folded ? [x, .11, .06] : [x, .17, 0];
  }
  p[4] = [-.08, .07, .02];
  return p;
}
test('gesture classifier refuses incomplete tracking', () => {
  assert.equal(interpretHand(null), null);
  assert.equal(interpretHand(Array(24).fill([0, 0, 0])), null);
});
test('sword identifies two extended fingers and physical direction', () => {
  const g = interpretHand(syntheticHand('sword'));
  assert.equal(g.kind, 'sword');
  assert.ok(g.direction[1] > .95);
});
test('open palm and fist are different states', () => {
  assert.equal(interpretHand(syntheticHand('open')).kind, 'open');
  assert.equal(interpretHand(syntheticHand('fist')).kind, 'fist');
});
test('dwell suppresses short gesture flashes and gives one entry event', () => {
  const gate = new GestureGate(130, 130), sample = { kind: 'open' };
  assert.equal(gate.update(sample, 0).kind, 'neutral');
  assert.equal(gate.update(sample, 90).kind, 'neutral');
  assert.equal(gate.update(sample, 131).entered, 'open');
  assert.equal(gate.update(sample, 180).entered, null);
  assert.equal(gate.update({ kind: 'neutral' }, 220).kind, 'open');
  assert.equal(gate.update({ kind: 'neutral' }, 360).kind, 'neutral');
});
test('brief tracking dropout does not fabricate gesture changes', () => {
  const gate = new GestureGate(100, 100), sample = { kind: 'sword' };
  gate.update(sample, 0); gate.update(sample, 120);
  assert.equal(gate.update(null, 180).kind, 'sword');
  assert.equal(gate.update(null, 400).kind, 'sword');
  assert.equal(gate.update(null, 510).kind, 'neutral');
});
test('seeded field is reproducible, bounded and shape-dependent', () => {
  const a = createField(200, 'cloud', 12), b = createField(200, 'cloud', 12);
  assert.deepEqual([...a.pos], [...b.pos]);
  const torus = createField(200, 'torus', 12);
  assert.notDeepEqual([...torus.pos], [...a.pos]);
});
test('blast creates velocity, returns toward home with damping', () => {
  const field = createField(80), initial = [...field.pos];
  burst(field, [0, 0, 0], 3);
  assert.ok(field.vel.some(v => Math.abs(v) > .2));
  advanceField(field, .02);
  assert.notDeepEqual([...field.pos], initial);
  for (let n = 0; n < 1200; n++) advanceField(field, 1 / 90);
  assert.ok(field.pos.every(Number.isFinite));
  assert.ok(field.pos.every(v => Math.abs(v) <= 2));
  assert.ok(field.vel.every(v => Math.abs(v) < 1));
});
test('sword pushes the swarm and fist remains bounded', () => {
  const field = createField(90);
  const sword = { kind: 'sword', point: [0, 0, 0], direction: [0, 0, -1] };
  for (let n = 0; n < 80; n++) advanceField(field, 1 / 90, [sword]);
  assert.ok(field.offset[2] < -.25);
  const fist = { kind: 'fist', point: [.3, -.2, .2], direction: [0, 0, -1] };
  for (let n = 0; n < 180; n++) advanceField(field, 1 / 90, [fist]);
  assert.ok(field.pos.every(Number.isFinite));
});
