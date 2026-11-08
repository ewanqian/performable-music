// Neural field: procedural brain geometry and spike propagation.
// Pure logic, no DOM, no audio, no WebGL. Deterministic for a given seed.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A brain-ish surface: two lobes with a longitudinal fissure, a little
// cerebellum at the back, and sinusoidal folds so it does not read as a ball.
export function createBrain({ count = 3200, seed = 7 } = {}) {
  const rnd = mulberry32(seed);
  const pts = [];
  let guard = 0;
  while (pts.length < count && guard < count * 40) {
    guard++;
    const u = rnd() * 2 - 1;
    const theta = rnd() * Math.PI * 2;
    const r = Math.cbrt(rnd());
    const s = Math.sqrt(1 - u * u);
    let x = r * s * Math.cos(theta);
    let y = r * u;
    let z = r * s * Math.sin(theta);

    // elongate front-back, flatten top-bottom
    x *= 0.78; y *= 0.66; z *= 1.05;

    // longitudinal fissure
    const fissure = Math.abs(x) < 0.055 && y > -0.1;
    if (fissure) continue;

    // cortical folds
    const fold = 1 + 0.045 * Math.sin(x * 22 + z * 17) * Math.cos(y * 19 - z * 11);
    x *= fold; y *= fold; z *= fold;

    // cerebellum
    if (z < -0.42 && y < 0.02) {
      const k = 1.15;
      x *= 0.72 * k; y *= 0.5 * k; z = -0.55 + (z + 0.55) * 0.7;
    }
    pts.push([x, y, z]);
  }
  return pts;
}

// Connect each neuron to its k nearest neighbours. Small, bounded degree keeps
// the spike field readable and the line count drawable on a Quest.
export function createNetwork(points, k = 3, candidates = 140) {
  const edges = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const near = [];
    for (let c = 0; c < candidates; c++) {
      // deterministic pseudo-random candidate, so the graph is stable per seed
      const j = (i * 7919 + c * 104729 + c * c * 31) % n;
      if (j === i) continue;
      const b = points[j];
      const d = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
      near.push([d, j]);
    }
    near.sort((p, q) => p[0] - q[0]);
    for (const [, j] of near.slice(0, k)) if (j > i) edges.push([i, j]);
  }
  return edges;
}

// Spike field: nodes fire spontaneously and propagate along edges with a delay.
// A stimulus injects energy into a region, which is what the hand controls.
export class SpikeField {
  constructor({ points, edges, seed = 11, rate = 0.55, speed = 2.4 } = {}) {
    this.points = points;
    this.edges = edges;
    this.rnd = mulberry32(seed);
    this.rate = rate;
    this.speed = speed;
    this.energy = new Float32Array(points.length);
    this.pending = []; // {at, node, amp}
    this.adj = Array.from({ length: points.length }, () => []);
    for (const [a, b] of edges) { this.adj[a].push(b); this.adj[b].push(a); }
    this.events = 0;
  }

  // Stimulate around a world point: the closer a neuron is, the more energy.
  stimulate(center, radius = 0.35, amount = 1.6) {
    let hit = 0;
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const d = Math.hypot(p[0] - center[0], p[1] - center[1], p[2] - center[2]);
      if (d < radius) {
        this.energy[i] = Math.min(2.2, this.energy[i] + amount * (1 - d / radius));
        hit++;
      }
    }
    return hit;
  }

  step(dtMs, now) {
    const dt = Math.max(0, Math.min(120, dtMs)) / 1000;
    const out = [];

    // spontaneous firing
    const spontaneous = this.rate * dt * this.points.length * 0.045;
    let n = spontaneous;
    while (n > 0) {
      if (this.rnd() < n) {
        const i = Math.floor(this.rnd() * this.points.length);
        this.energy[i] = Math.min(2.2, this.energy[i] + 0.8);
        out.push({ node: i, amp: 0.6 + this.rnd() * 0.4, kind: 'spontaneous' });
      }
      n -= 1;
    }

    // propagate from energised nodes
    for (let i = 0; i < this.points.length; i++) {
      if (this.energy[i] <= 0.02) continue;
      const e = this.energy[i];
      this.energy[i] = Math.max(0, e - dt * 1.7);
      if (e > 0.75 && this.rnd() < 0.5) {
        const targets = this.adj[i];
        if (!targets.length) continue;
        const j = targets[Math.floor(this.rnd() * targets.length)];
        this.pending.push({ at: now + (0.6 + this.rnd() * 0.7) / this.speed * 1000, node: j, amp: e * 0.55 });
        this.energy[i] = e * 0.72;
      }
    }

    // deliver delayed spikes
    const ready = [];
    for (const p of this.pending) {
      if (p.at <= now) {
        this.energy[p.node] = Math.min(2.2, this.energy[p.node] + p.amp);
        ready.push({ node: p.node, amp: p.amp, kind: 'propagated' });
      }
    }
    this.pending = this.pending.filter(p => p.at > now);
    out.push(...ready);
    this.events += out.length;
    return out;
  }

  activity() {
    let sum = 0;
    for (let i = 0; i < this.energy.length; i++) sum += this.energy[i];
    return sum / this.energy.length;
  }
}

// Map a neuron position to an audible pitch and stereo position.
export function neuronVoice(point) {
  const [, y, z] = point;
  const freq = 110 * Math.pow(2, (y + 1) * 1.6 + (z + 1) * 0.35);
  const pan = Math.max(-1, Math.min(1, point[0] * 1.4));
  return { freq: Math.max(55, Math.min(2400, freq)), pan };
}
