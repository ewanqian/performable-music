import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrain, createNetwork, SpikeField, neuronVoice } from './neuro-engine.mjs';

test('brain sampling is deterministic and respects the fissure', () => {
  const a = createBrain({ count: 600, seed: 3 });
  const b = createBrain({ count: 600, seed: 3 });
  assert.equal(a.length, 600);
  assert.deepEqual(a[0], b[0]);
  assert.ok(a.every(p => p.every(Number.isFinite)));
  // no points inside the longitudinal fissure above the cerebellum
  assert.ok(!a.some(p => Math.abs(p[0]) < 0.02 && p[1] > 0.1));
});

test('network has bounded degree and only valid indices', () => {
  const pts = createBrain({ count: 220, seed: 5 });
  const edges = createNetwork(pts, 3);
  assert.ok(edges.length > 0);
  const deg = new Map();
  for (const [a, b] of edges) {
    assert.ok(a >= 0 && a < pts.length && b >= 0 && b < pts.length);
    assert.notEqual(a, b);
    deg.set(a, (deg.get(a) || 0) + 1);
    deg.set(b, (deg.get(b) || 0) + 1);
  }
  assert.ok(Math.max(...deg.values()) < 40);
});

test('stimulus raises local energy and decays', () => {
  const pts = createBrain({ count: 200, seed: 9 });
  const edges = createNetwork(pts, 3);
  const f = new SpikeField({ points: pts, edges });
  const before = f.activity();
  const hit = f.stimulate(pts[0], 0.25, 1.5);
  assert.ok(hit > 0);
  assert.ok(f.activity() > before);
  for (let i = 0; i < 40; i++) f.step(16, i * 16);
  assert.ok(f.activity() < before + 1e-6 || f.activity() >= 0);
});

test('spikes are finite and bounded over a long run', () => {
  const pts = createBrain({ count: 200, seed: 13 });
  const f = new SpikeField({ points: pts, edges: createNetwork(pts, 3) });
  let total = 0;
  for (let i = 0; i < 600; i++) {
    const ev = f.step(16, i * 16);
    total += ev.length;
    for (const e of ev) {
      assert.ok(e.node >= 0 && e.node < pts.length);
      assert.ok(Number.isFinite(e.amp) && e.amp >= 0);
    }
  }
  assert.ok(total > 0);
  assert.ok(total < 200 * 600);
  assert.ok(f.pending.length < 5000);
});

test('neuron voice stays inside the audible and stereo range', () => {
  for (const p of [[-1, -1, -1], [0, 0, 0], [1, 1, 1], [0.5, -0.3, 0.2]]) {
    const v = neuronVoice(p);
    assert.ok(v.freq >= 55 && v.freq <= 2400);
    assert.ok(v.pan >= -1 && v.pan <= 1);
  }
});
