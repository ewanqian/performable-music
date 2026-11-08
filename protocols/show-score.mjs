// Show Score v2 reference implementation: shared musical clock for audio,
// visuals and lighting. No DOM, no audio, no network.
//
// Why v2 exists: v1 carried only t_ms, so a 100 BPM set and a 128 BPM
// conductor could both be "correct" while disagreeing about where bar 1 is.
// v2 makes tempo and meter explicit and derives bar/beat/step from t_ms.

export const DEFAULT_CLOCK = Object.freeze({
  bpm: 100, beatsPerBar: 4, beatUnit: 4, stepsPerBeat: 4, originMs: 0
});

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function normalizeTempoMap(map = [], originMs = 0, bpm = 100, beatsPerBar = 4) {
  const points = [{ at_ms: originMs, bpm, beatsPerBar }]
    .concat(map.filter(p => Number.isFinite(p?.at_ms) && Number.isFinite(p?.bpm)))
    .sort((a, b) => a.at_ms - b.at_ms);
  // Drop duplicate timestamps, keep the last declaration.
  const out = [];
  for (const p of points) {
    if (out.length && out[out.length - 1].at_ms === p.at_ms) out[out.length - 1] = p;
    else out.push(p);
  }
  return out.map(p => ({
    at_ms: p.at_ms,
    bpm: clamp(p.bpm, 20, 320),
    beatsPerBar: clamp(p.beatsPerBar ?? beatsPerBar, 1, 16)
  }));
}

export class TransportClock {
  constructor(options = {}) {
    const o = { ...DEFAULT_CLOCK, ...options };
    this.beatUnit = o.beatUnit ?? 4;
    this.stepsPerBeat = clamp(o.stepsPerBeat ?? 4, 1, 16);
    this.originMs = o.originMs ?? 0;
    this.segments = normalizeTempoMap(o.tempoMap, this.originMs, o.bpm, o.beatsPerBar);
  }

  get bpm() { return this.segments[this.segments.length - 1].bpm; }
  get beatsPerBar() { return this.segments[this.segments.length - 1].beatsPerBar; }

  // Musical beats elapsed since origin, integrating every tempo segment.
  beatsAt(t_ms) {
    if (!Number.isFinite(t_ms) || t_ms <= this.originMs) return 0;
    let beats = 0;
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const next = this.segments[i + 1];
      const from = Math.max(seg.at_ms, this.originMs);
      const to = Math.min(t_ms, next ? next.at_ms : Infinity);
      if (to > from) beats += (to - from) / 60000 * seg.bpm;
    }
    return beats;
  }

  position(t_ms) {
    const beats = this.beatsAt(t_ms);
    const seg = this.segmentAt(t_ms);
    const stepsPerBar = seg.beatsPerBar * this.stepsPerBeat;
    const totalSteps = beats * this.stepsPerBeat;
    const stepIndex = Math.floor(totalSteps);
    const bar = Math.floor(stepIndex / stepsPerBar);
    const beat = Math.floor((stepIndex % stepsPerBar) / this.stepsPerBeat);
    const step = stepIndex % this.stepsPerBeat;
    return {
      bpm: seg.bpm,
      beats_per_bar: seg.beatsPerBar,
      beat_unit: this.beatUnit,
      steps_per_beat: this.stepsPerBeat,
      bar, beat, step,
      phase: totalSteps - stepIndex,
      origin_ms: this.originMs
    };
  }

  segmentAt(t_ms) {
    let seg = this.segments[0];
    for (const s of this.segments) if (t_ms >= s.at_ms) seg = s;
    return seg;
  }

  stepMs(t_ms) {
    return 60000 / this.segmentAt(t_ms).bpm / this.stepsPerBeat;
  }

  // Nearest grid position, used to quantise live gestures.
  quantize(t_ms, mode = 'nearest') {
    const step = this.stepMs(t_ms);
    const base = this.originMs;
    const n = (t_ms - base) / step;
    const k = mode === 'floor' ? Math.floor(n) : mode === 'ceil' ? Math.ceil(n) : Math.round(n);
    return base + k * step;
  }

  // All grid steps in (fromMs, toMs], capped so a suspended tab cannot flood
  // the receiver with thousands of late events.
  stepsBetween(fromMs, toMs, limit = 256) {
    const out = [];
    if (!(toMs > fromMs)) return out;
    let t = this.quantize(fromMs, 'ceil');
    while (t <= toMs && out.length < limit) {
      out.push(t);
      t += this.stepMs(t);
    }
    return out;
  }

  withTempo(bpm, atMs) {
    return new TransportClock({
      bpm: this.segments[0].bpm,
      beatsPerBar: this.segments[0].beatsPerBar,
      beatUnit: this.beatUnit,
      stepsPerBeat: this.stepsPerBeat,
      originMs: this.originMs,
      tempoMap: this.segments.slice(1).concat([{ at_ms: atMs, bpm }])
    });
  }

  toJSON() {
    return {
      bpm: this.bpm,
      beats_per_bar: this.beatsPerBar,
      beat_unit: this.beatUnit,
      steps_per_beat: this.stepsPerBeat,
      origin_ms: this.originMs,
      tempo_map: this.segments.slice(1)
    };
  }
}

export function makeScoreEvent(clock, fields) {
  const t_ms = fields.t_ms ?? 0;
  return {
    schema_version: '2.0',
    session_id: fields.session_id ?? 'local',
    seq: fields.seq ?? 0,
    t_ms,
    clock: { ...clock.position(t_ms), origin_ms: clock.originMs },
    scene: fields.scene ?? 'FIELD',
    state: fields.state ?? 'HOLD',
    controls: fields.controls ?? {},
    event: {
      type: fields.event?.type ?? 'TICK',
      source: fields.event?.source ?? 'clock',
      ...(fields.event?.hand ? { hand: fields.event.hand } : {}),
      ...(fields.event?.target ? { target: fields.event.target } : {}),
      ...(Number.isFinite(fields.event?.value) ? { value: fields.event.value } : {}),
      ...(Number.isFinite(fields.event?.intensity) ? { intensity: fields.event.intensity } : {})
    },
    tracking: { hands: fields.tracking?.hands ?? 0, ...(fields.tracking?.lost ? { lost: true } : {}) },
    safe: { armed: Boolean(fields.safe?.armed), kill: Boolean(fields.safe?.kill), ...(fields.safe?.reason ? { reason: fields.safe.reason } : {}) }
  };
}

// Minimal runtime check. The JSON Schema is authoritative; this catches the
// mistakes that actually happen on the wire (missing clock, negative time,
// out-of-range intensity) without pulling in a validator dependency.
export function validateScoreEvent(e) {
  const errors = [];
  if (!e || typeof e !== 'object') return { ok: false, errors: ['not an object'] };
  if (e.schema_version !== '2.0') errors.push('schema_version must be 2.0');
  if (typeof e.session_id !== 'string' || !e.session_id) errors.push('session_id required');
  if (!Number.isInteger(e.seq) || e.seq < 0) errors.push('seq must be a non-negative integer');
  if (!Number.isFinite(e.t_ms) || e.t_ms < 0) errors.push('t_ms must be a non-negative number');
  const c = e.clock;
  if (!c || typeof c !== 'object') errors.push('clock required');
  else {
    if (!(c.bpm >= 20 && c.bpm <= 320)) errors.push('clock.bpm out of range');
    if (!(c.beats_per_bar >= 1)) errors.push('clock.beats_per_bar out of range');
    if (!(c.bar >= 0 && c.beat >= 0 && c.step >= 0)) errors.push('clock bar/beat/step must be >= 0');
    if (!(c.phase >= 0 && c.phase < 1)) errors.push('clock.phase must be in [0,1)');
  }
  if (e.event?.intensity !== undefined && !(e.event.intensity >= 0 && e.event.intensity <= 1)) {
    errors.push('event.intensity must be in [0,1]');
  }
  if (!e.safe || typeof e.safe.armed !== 'boolean' || typeof e.safe.kill !== 'boolean') {
    errors.push('safe.armed and safe.kill are required booleans');
  }
  return { ok: errors.length === 0, errors };
}
