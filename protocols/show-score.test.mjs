import test from 'node:test';
import assert from 'node:assert/strict';
import { TransportClock, makeScoreEvent, validateScoreEvent } from './show-score.mjs';

test('100 BPM at 4/4 puts bar 1 at 2400ms', () => {
  const c = new TransportClock({ bpm: 100, beatsPerBar: 4, stepsPerBeat: 4 });
  assert.equal(c.position(0).bar, 0);
  const p = c.position(2400);
  assert.equal(p.bar, 1);
  assert.equal(p.beat, 0);
  assert.equal(p.step, 0);
});

test('16th steps land every 150ms at 100 BPM', () => {
  const c = new TransportClock({ bpm: 100, stepsPerBeat: 4 });
  assert.ok(Math.abs(c.stepMs(0) - 150) < 1e-9);
  assert.equal(c.position(150).step, 1);
  assert.equal(c.position(300).step, 2);
});

test('tempo change keeps musical position continuous', () => {
  const c = new TransportClock({ bpm: 100, beatsPerBar: 4 });
  // 2400ms = 4 beats at 100 BPM.
  assert.ok(Math.abs(c.beatsAt(2400) - 4) < 1e-9);
  const faster = c.withTempo(128, 2400);
  assert.ok(Math.abs(faster.beatsAt(2400) - 4) < 1e-9);
  // 2400ms at 128 BPM = 5.12 beats later.
  assert.ok(Math.abs(faster.beatsAt(2400 + 2400) - (4 + 2400 / 60000 * 128)) < 1e-9);
});

test('the ENTROPY 100 vs conductor 128 conflict is now explicit', () => {
  const entropy = new TransportClock({ bpm: 100 });
  const conductor = new TransportClock({ bpm: 128 });
  assert.notEqual(entropy.position(6000).bar, conductor.position(6000).bar);
  // Same wall time, different musical position: v2 forces a declared tempo.
  assert.equal(entropy.position(6000).bpm, 100);
  assert.equal(conductor.position(6000).bpm, 128);
});

test('quantize snaps to the nearest 16th', () => {
  const c = new TransportClock({ bpm: 100 });
  assert.equal(c.quantize(140), 150);
  assert.equal(c.quantize(160), 150);
  assert.equal(c.quantize(70), 0);
  assert.equal(c.quantize(80), 150);
});

test('suspended tab does not flood late steps', () => {
  const c = new TransportClock({ bpm: 100 });
  const steps = c.stepsBetween(0, 60000, 256);
  assert.equal(steps.length, 256);
});

test('score event carries a valid clock block', () => {
  const c = new TransportClock({ bpm: 100 });
  const e = makeScoreEvent(c, {
    t_ms: 3750, seq: 7, session_id: 's1', scene: 'FIELD', state: 'BUILD',
    event: { type: 'HAND_ENTER', source: 'hand', hand: 'right', intensity: 0.7 },
    tracking: { hands: 1 }, safe: { armed: true, kill: false }
  });
  const v = validateScoreEvent(e);
  assert.equal(v.ok, true, v.errors.join(', '));
  assert.equal(e.clock.bar, 1);
  assert.equal(e.clock.beat, 2);
  assert.equal(e.clock.step, 1);
});

test('validator rejects the mistakes that actually happen', () => {
  const c = new TransportClock({ bpm: 100 });
  const base = makeScoreEvent(c, { t_ms: 0, safe: { armed: false, kill: false } });
  assert.equal(validateScoreEvent({ ...base, schema_version: '1.0' }).ok, false);
  assert.equal(validateScoreEvent({ ...base, t_ms: -1 }).ok, false);
  assert.equal(validateScoreEvent({ ...base, clock: { ...base.clock, bpm: 900 } }).ok, false);
  assert.equal(validateScoreEvent({ ...base, safe: undefined }).ok, false);
  assert.equal(validateScoreEvent({ ...base, event: { type: 'X', source: 'clock', intensity: 3 } }).ok, false);
});

test('clock round-trips through JSON', () => {
  const c = new TransportClock({ bpm: 104, beatsPerBar: 4, stepsPerBeat: 4 });
  const back = new TransportClock({ ...c.toJSON() });
  assert.equal(back.bpm, 104);
  assert.ok(Math.abs(back.beatsAt(3000) - c.beatsAt(3000)) < 1e-9);
});
