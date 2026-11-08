// Phalanx approach strategies: pure logic, no DOM / audio / WebXR.
// Compares three ways to decide which phalanx the thumb is contacting.
//
// strategy 'nearest'  : closest joint wins, single global threshold (legacy).
// strategy 'zoned'    : per-joint threshold scaled by that joint's reach from the
//                       wrist, so long fingers are not systematically penalised.
// strategy 'velocity' : absolute distance AND closing motion (or deep contact),
//                       which suppresses slow drift-through near misses.
//
// All distances are metres. Every rejected candidate carries a machine-readable
// reason so a headset user can be told WHY nothing fired.

export const TARGETS = Object.freeze([
  { digit: 1, index: 7, label: '食指 / 中节', finger: 'index' },
  { digit: 2, index: 8, label: '食指 / 末节', finger: 'index' },
  { digit: 3, index: 12, label: '中指 / 中节', finger: 'middle' },
  { digit: 4, index: 13, label: '中指 / 末节', finger: 'middle' },
  { digit: 5, index: 17, label: '无名 / 中节', finger: 'ring' },
  { digit: 6, index: 18, label: '无名 / 末节', finger: 'ring' }
]);

export const STRATEGIES = Object.freeze(['nearest', 'zoned', 'velocity']);

const finitePoint = p =>
  Array.isArray(p) && p.length >= 3 && p.slice(0, 3).every(Number.isFinite);

export function distance(a, b) {
  return finitePoint(a) && finitePoint(b)
    ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
    : null;
}

// Reach of each target from the wrist, used to normalise per-joint thresholds.
function reachMap(positions) {
  const wrist = positions[0];
  const out = {};
  for (const t of TARGETS) {
    const d = distance(wrist, positions[t.index]);
    out[t.digit] = d ?? null;
  }
  return out;
}

export class ApproachEngine {
  constructor(options = {}) {
    this.strategy = STRATEGIES.includes(options.strategy) ? options.strategy : 'zoned';
    this.onDistance = options.onDistance ?? 0.028;
    this.offDistance = options.offDistance ?? 0.046;
    this.dwellMs = options.dwellMs ?? 90;
    this.rearmMs = options.rearmMs ?? 45;
    this.ambiguousMm = options.ambiguousMm ?? 0.006;
    this.closingMmPerS = options.closingMmPerS ?? 0.02;
    this.reset();
  }

  setStrategy(name) {
    if (STRATEGIES.includes(name)) this.strategy = name;
    return this.strategy;
  }

  reset() {
    this.active = null;
    this.candidate = null;
    this.since = 0;
    this.releasedAt = -Infinity;
    this.sequence = '';
    this.count = 0;
    this.prevThumb = null;
    this.prevNow = null;
    this.closing = 0;
  }

  // Per-digit contact threshold. 'nearest' keeps one global value.
  thresholdFor(digit, reach) {
    if (this.strategy !== 'zoned') return this.onDistance;
    const r = reach[digit];
    if (!Number.isFinite(r)) return this.onDistance;
    const values = Object.values(reach).filter(Number.isFinite);
    const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)] || r;
    const scale = Math.min(1.35, Math.max(0.8, r / median));
    return this.onDistance * scale;
  }

  update(positions, now) {
    const lost = !Array.isArray(positions) || positions.length < 25 || !finitePoint(positions[4]);
    if (lost) {
      // Loss is unknown input. Release contact, never invent a digit.
      const events = this.active !== null
        ? [{ kind: 'LOST', digit: this.active, t_ms: now }]
        : [];
      this.active = null;
      this.candidate = null;
      this.releasedAt = now;
      this.prevThumb = null;
      this.prevNow = null;
      return {
        events, active: null, nearest: null, sequence: this.sequence,
        targets: TARGETS.map(t => ({
          digit: t.digit, label: t.label, distance: null, threshold: this.onDistance,
          state: 'NO_DATA', progress: 0, reason: 'TRACKING_LOST'
        })),
        closing: 0, strategy: this.strategy
      };
    }

    const thumb = positions[4];
    const reach = reachMap(positions);
    const dt = this.prevNow === null ? 0 : Math.max(1, now - this.prevNow);
    const rawClosing = this.prevThumb
      ? (distance(this.prevThumb, positions[7]) - distance(thumb, positions[7])) / dt
      : 0;
    this.prevThumb = thumb;
    this.prevNow = now;
    this.closing = Number.isFinite(rawClosing) ? rawClosing : 0;

    const rows = TARGETS.map(t => {
      const d = distance(thumb, positions[t.index]);
      const threshold = this.thresholdFor(t.digit, reach);
      return { digit: t.digit, label: t.label, distance: d, threshold, state: 'FAR', progress: 0, reason: 'FAR' };
    }).filter(r => r.distance !== null)
      .sort((a, b) => a.distance - b.distance);

    const nearest = rows[0] || null;
    const events = [];

    // Release must happen before the next digit; prevents a held thumb from
    // repeating numbers while it rests on the same joint.
    if (this.active !== null) {
      const held = rows.find(r => r.digit === this.active);
      if (!held || held.distance > this.offDistance) {
        events.push({ kind: 'RELEASE', digit: this.active, t_ms: now });
        this.active = null;
        this.releasedAt = now;
        this.candidate = null;
      } else {
        held.state = 'CONTACT';
        held.progress = 1;
        held.reason = 'OK';
      }
    }

    if (this.active === null && nearest) {
      const ambiguous = rows.length > 1 && (rows[1].distance - nearest.distance) < this.ambiguousMm;
      const withinThreshold = nearest.distance <= nearest.threshold;
      const armed = now - this.releasedAt >= this.rearmMs;
      const deepContact = nearest.distance <= nearest.threshold * 0.7;
      const movingIn = this.closing >= this.closingMmPerS;
      const velocityOk = this.strategy !== 'velocity' || deepContact || movingIn;

      if (ambiguous) {
        nearest.reason = 'AMBIGUOUS';
        nearest.state = 'BLOCKED';
      } else if (!withinThreshold) {
        nearest.reason = 'FAR';
        nearest.state = 'FAR';
      } else if (!armed) {
        nearest.reason = 'NEED_RELEASE';
        nearest.state = 'BLOCKED';
      } else if (!velocityOk) {
        nearest.reason = 'NO_CLOSING_MOTION';
        nearest.state = 'BLOCKED';
      } else if (this.candidate !== nearest.digit) {
        this.candidate = nearest.digit;
        this.since = now;
        nearest.reason = 'DWELL';
        nearest.state = 'DWELL';
        nearest.progress = 0;
      } else {
        const elapsed = now - this.since;
        const progress = Math.min(1, elapsed / this.dwellMs);
        nearest.progress = progress;
        if (progress >= 1) {
          this.active = nearest.digit;
          this.candidate = null;
          this.sequence = (this.sequence + String(nearest.digit)).slice(-32);
          this.count++;
          nearest.state = 'CONTACT';
          nearest.reason = 'OK';
          events.push({ kind: 'DIGIT', digit: nearest.digit, t_ms: now, sequence: this.sequence });
        } else {
          nearest.state = 'DWELL';
          nearest.reason = 'DWELL';
        }
      }
    }

    // A different joint becomes the candidate: report the switch, do not confirm.
    if (this.candidate !== null && nearest && nearest.digit !== this.candidate && this.active === null) {
      this.candidate = nearest.digit;
      this.since = now;
    }

    return {
      events,
      active: this.active,
      nearest,
      sequence: this.sequence,
      targets: rows,
      closing: this.closing,
      strategy: this.strategy
    };
  }

  // Human-readable explanation for the UI and for the OSC/JSON event log.
  explain(row) {
    if (!row) return '没有可用手部数据';
    const mm = v => (v * 1000).toFixed(1);
    switch (row.reason) {
      case 'OK': return '已确认 ' + row.digit;
      case 'TRACKING_LOST': return '追踪丢失：不产生数字';
      case 'FAR': return '距离 ' + mm(row.distance) + 'mm，超过阈值 ' + mm(row.threshold) + 'mm';
      case 'AMBIGUOUS': return '两个指节距离接近，无法唯一判断';
      case 'NEED_RELEASE': return '需要先抬起拇指，再接触下一位';
      case 'NO_CLOSING_MOTION': return '距离够近但没有接近动作，可能是擦过';
      case 'DWELL': return '已进入阈值，确认进度 ' + Math.round(row.progress * 100) + '%';
      default: return row.reason;
    }
  }
}
