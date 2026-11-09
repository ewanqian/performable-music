// Gesture Dynamics / Quest MR. Original lightweight, deterministic gesture + particle engine.
// All coordinates are metres in one reference space. No telemetry or network output.
import { handAngles } from './engine.mjs';

export const PARTICLE_COUNT = 480;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, Number.isFinite(v) ? v : a));
export const length3 = p => Math.hypot(p[0], p[1], p[2]);
const valid = p => Array.isArray(p) && p.length >= 3 && p.slice(0, 3).every(Number.isFinite);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const normalize = p => { const n = length3(p) || 1; return p.map(v => v / n); };

export function interpretHand(points) {
  if (!Array.isArray(points) || points.length !== 25 || !points.every(valid)) return null;
  const a = handAngles(points);
  const bend = (name) => a[name];
  if (['index-pip', 'middle-pip', 'ring-pip', 'pinky-pip'].some(name => !Number.isFinite(bend(name)))) return null;
  const extended = name => bend(name + '-pip') < 44;
  const curled = name => bend(name + '-pip') > 62;
  const sword = extended('index') && extended('middle') &&
    curled('ring') && curled('pinky') && dist(points[9], points[14]) < 0.092;
  const open = ['index', 'middle', 'ring', 'pinky'].every(extended) &&
    dist(points[9], points[24]) > 0.09;
  const fist = ['index', 'middle', 'ring', 'pinky'].every(curled);
  // Use BOTH extended fingers, not Quest's generic targetRay (usually aimed at UI).
  const start = [(points[7][0] + points[12][0]) * 0.5,
    (points[7][1] + points[12][1]) * 0.5, (points[7][2] + points[12][2]) * 0.5];
  const tip = [(points[9][0] + points[14][0]) * 0.5,
    (points[9][1] + points[14][1]) * 0.5, (points[9][2] + points[14][2]) * 0.5];
  return { kind: sword ? 'sword' : open ? 'open' : fist ? 'fist' : 'neutral',
    point: sword ? tip : points[0], direction: normalize(tip.map((v, i) => v - start)) };
}

export class GestureGate {
  constructor(dwellMs = 130, releaseMs = 130) {
    this.dwellMs = dwellMs;
    this.releaseMs = releaseMs;
    this.reset();
  }
  reset() { this.kind = 'neutral'; this.candidate = null; this.since = 0; this.lastSeen = -Infinity; }
  update(sample, now) {
    if (sample) this.lastSeen = now;
    if (!sample && now - this.lastSeen < 180) return { kind: this.kind, entered: null, stale: false };
    const next = sample?.kind ?? 'neutral';
    if (next === this.kind) { this.candidate = null; return { kind: this.kind, entered: null, stale: !sample }; }
    if (this.candidate !== next) { this.candidate = next; this.since = now; return { kind: this.kind, entered: null, stale: !sample }; }
    const wait = next === 'neutral' ? this.releaseMs : this.dwellMs;
    if (now - this.since < wait) return { kind: this.kind, entered: null, stale: !sample };
    this.kind = next;
    this.candidate = null;
    return { kind: this.kind, entered: next, stale: !sample };
  }
}

function seeded(seed = 42) {
  let x = seed >>> 0;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; };
}
export function createField(count = PARTICLE_COUNT, shape = 'cloud', seed = 42) {
  const rand = seeded(seed);
  const home = new Float32Array(count * 3), pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count, theta = i * 2.3999632;
    const h = 1 - 2 * u, r = Math.sqrt(Math.max(0, 1 - h * h));
    let x, y, z;
    if (shape === 'torus') {
      const a = theta, b = (i * 0.1274) % (Math.PI * 2);
      const tube = 0.13 + rand() * 0.06;
      x = (0.48 + tube * Math.cos(b)) * Math.cos(a);
      y = tube * Math.sin(b);
      z = (0.48 + tube * Math.cos(b)) * Math.sin(a) * 0.7;
    } else if (shape === 'helix') {
      const t = u * Math.PI * 10;
      x = (0.22 + rand() * 0.14) * Math.cos(t);
      y = (u - 0.5) * 1.0;
      z = (0.22 + rand() * 0.14) * Math.sin(t);
    } else {
      const radius = (0.18 + 0.5 * Math.cbrt(rand()));
      x = Math.cos(theta) * r * radius;
      y = h * radius * 0.85;
      z = Math.sin(theta) * r * radius;
    }
    const j = i * 3;
    home[j] = pos[j] = x;
    home[j + 1] = pos[j + 1] = y;
    home[j + 2] = pos[j + 2] = z;
  }
  return { count, shape, home, pos, vel, offset: [0, 0, 0], energy: 0 };
}

export function burst(field, point = [0, 0, 0], strength = 2.4) {
  if (!valid(point)) return;
  const { pos, vel, count } = field;
  for (let i = 0; i < count; i++) {
    const j = 3 * i;
    let x = pos[j] - point[0], y = pos[j + 1] - point[1], z = pos[j + 2] - point[2];
    let n = Math.hypot(x, y, z);
    if (n < 0.025) { x = Math.sin(i * 9.17); y = Math.cos(i * 2.71); z = Math.sin(i * 5.31); n = Math.hypot(x, y, z); }
    const power = strength * (0.52 + 0.48 / (1 + n * 1.8));
    vel[j] += x / n * power;
    vel[j + 1] += y / n * power;
    vel[j + 2] += z / n * power;
  }
  field.energy = Math.max(field.energy, 1);
}

export function advanceField(field, seconds, controls = []) {
  const dt = clamp(seconds, 0, 0.04);
  if (dt === 0) return field;
  const active = controls.filter(c => c && ['sword', 'fist'].includes(c.kind) &&
    valid(c.point) && valid(c.direction));
  const sword = active.find(c => c.kind === 'sword');
  let desired = [0, 0, 0];
  if (sword) desired = sword.point.map((v, i) => v + sword.direction[i] * 0.60);
  const dn = length3(desired);
  if (dn > 0.66) desired = desired.map(v => v / dn * 0.66);
  const easing = 1 - Math.exp(-4.5 * dt);
  for (let a = 0; a < 3; a++) field.offset[a] += (desired[a] - field.offset[a]) * easing;

  const { count, pos, vel, home, offset } = field;
  const drag = Math.exp(-1.75 * dt);
  for (let i = 0; i < count; i++) {
    const j = i * 3;
    let ax = (home[j] + offset[0] - pos[j]) * 2.0;
    let ay = (home[j + 1] + offset[1] - pos[j + 1]) * 2.0;
    let az = (home[j + 2] + offset[2] - pos[j + 2]) * 2.0;
    // Tiny autonomous motion prevents a frozen simulation without random thrashing.
    ax += Math.sin(i * 0.071 + pos[j + 1] * 7) * 0.09;
    az += Math.cos(i * 0.083 + pos[j] * 6) * 0.09;
    for (const c of active) {
      if (c.kind === 'sword') {
        const dx = pos[j] - c.point[0], dy = pos[j + 1] - c.point[1], dz = pos[j + 2] - c.point[2];
        const along = dx * c.direction[0] + dy * c.direction[1] + dz * c.direction[2];
        const px = dx - along * c.direction[0], py = dy - along * c.direction[1], pz = dz - along * c.direction[2];
        const weight = 1 / (1 + 3 * (px * px + py * py + pz * pz));
        ax += c.direction[0] * 4.4 * weight - px * 2.4 * weight;
        ay += c.direction[1] * 4.4 * weight - py * 2.4 * weight;
        az += c.direction[2] * 4.4 * weight - pz * 2.4 * weight;
      } else {
        ax += (c.point[0] - pos[j]) * 5.5;
        ay += (c.point[1] - pos[j + 1]) * 5.5;
        az += (c.point[2] - pos[j + 2]) * 5.5;
      }
    }
    vel[j] = clamp((vel[j] + ax * dt) * drag, -5, 5);
    vel[j + 1] = clamp((vel[j + 1] + ay * dt) * drag, -5, 5);
    vel[j + 2] = clamp((vel[j + 2] + az * dt) * drag, -5, 5);
    pos[j] = clamp(pos[j] + vel[j] * dt, -2, 2);
    pos[j + 1] = clamp(pos[j + 1] + vel[j + 1] * dt, -2, 2);
    pos[j + 2] = clamp(pos[j + 2] + vel[j + 2] * dt, -2, 2);
  }
  field.energy *= Math.exp(-1.25 * dt);
  return field;
}
