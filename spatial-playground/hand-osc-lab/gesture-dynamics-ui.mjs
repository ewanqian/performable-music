// Gesture Dynamics: Three.js rendering and native WebXR Hand Input adapter.
// Source of truth: this lab. Portfolio Apps is only a launcher.
// Three.js 0.180.0 (MIT) loaded via the HTML import map.
import * as THREE from 'three';
import { JOINTS } from './engine.mjs';
import { GestureGate, interpretHand, createField, advanceField, burst, PARTICLE_COUNT } from './gesture-dynamics-engine.mjs';

const $ = id => document.getElementById(id);
const canvas = $('view'), status = $('status'), shapeSelect = $('shape');
const arButton = $('enter-ar'), vrButton = $('enter-vr'), exitButton = $('exit-xr');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.01, 35);
camera.position.set(0, 0, 2.7);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local');
renderer.outputColorSpace = THREE.SRGBColorSpace;

const group = new THREE.Group();
scene.add(group);
let field = createField(PARTICLE_COUNT, shapeSelect.value);
const pointsGeo = new THREE.BufferGeometry();
function updateGeometry() {
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(field.pos, 3).setUsage(THREE.DynamicDrawUsage));
  const colors = new Float32Array(field.count * 3);
  for (let i = 0; i < field.count; i++) {
    const t = Math.pow(i / field.count, 1.1);
    const j = 3 * i;
    colors[j] = 0.77 + t * 0.20;
    colors[j + 1] = 0.84 - t * 0.16;
    colors[j + 2] = 0.95 - t * 0.32;
  }
  pointsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  pointsGeo.computeBoundingSphere();
}
updateGeometry();

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const cx = c.getContext('2d');
  const g = cx.createRadialGradient(32, 32, 0, 32, 32, 31);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(.21, 'rgba(255,255,255,.95)');
  g.addColorStop(.55, 'rgba(255,255,255,.30)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = g; cx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const points = new THREE.Points(pointsGeo, new THREE.PointsMaterial({
  size: .040, map: glowTexture(), transparent: true, opacity: .92,
  vertexColors: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
}));
points.frustumCulled = false;
group.add(points);

// A small number of physical-looking cores reveal motion, depth and inertia.
const cores = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.017, 1),
  new THREE.MeshBasicMaterial({ color: 0xe7e1d5, transparent: true, opacity: .88 }), 44);
cores.frustumCulled = false;
group.add(cores);
const dummy = new THREE.Object3D();
const rings = [];
for (let i = 0; i < 2; i++) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(.70, .0017, 3, 120),
    new THREE.MeshBasicMaterial({ color: i === 0 ? 0x9fa8b2 : 0xc39e78, transparent: true, opacity: .19, depthWrite: false }));
  mesh.rotation.x = i ? Math.PI / 2 : Math.PI / 6;
  group.add(mesh); rings.push(mesh);
}
const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 0),
  .37, 0xf1c08e, .055, .026);
group.add(arrow);
arrow.visible = false;

// Unlike screen-only DOM panels, this diagnostic is visible inside immersive XR.
const labCanvas = document.createElement('canvas');
labCanvas.width = 1024; labCanvas.height = 220;
const labelTexture = new THREE.CanvasTexture(labCanvas);
const label = new THREE.Mesh(new THREE.PlaneGeometry(.92, .198), new THREE.MeshBasicMaterial({
  map: labelTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide
}));
label.position.set(0, -.78, .12);
group.add(label);
let lastLabel = '';
function labelText(text) {
  if (text === lastLabel) return;
  lastLabel = text;
  const ctx = labCanvas.getContext('2d');
  ctx.clearRect(0, 0, 1024, 220);
  ctx.fillStyle = 'rgba(6,10,15,.72)'; ctx.fillRect(0, 0, 1024, 220);
  ctx.strokeStyle = 'rgba(200,207,210,.5)'; ctx.strokeRect(3, 3, 1018, 214);
  ctx.fillStyle = '#e9c7a5'; ctx.font = '34px Menlo,monospace';
  ctx.fillText('GESTURE DYNAMICS / LIVE FIELD', 30, 70);
  ctx.fillStyle = '#f2f2ef'; ctx.font = '28px Menlo,monospace';
  ctx.fillText(text.slice(0, 54), 30, 137);
  ctx.fillStyle = '#8e9ba9'; ctx.font = '21px Menlo,monospace';
  ctx.fillText('SWORD → DRIVE     PALM → BURST     FIST → ATTRACT', 30, 188);
  labelTexture.needsUpdate = true;
}

const handState = {
  left: { gate: new GestureGate(), measure: null },
  right: { gate: new GestureGate(), measure: null }
};
const matrixCaches = {
  left: new Float32Array(JOINTS.length * 16),
  right: new Float32Array(JOINTS.length * 16)
};
const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), forward = new THREE.Vector3();
const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
let xrSession = null, anchored = false, desktopGesture = 'neutral', lastExplosion = -Infinity;
let cursor = [0, 0], lastTime = 0, lastStatusTime = -Infinity, lastStatus = '';
let trackedHands = 0, frames = 0, fpsCount = 0, fpsTime = 0, fps = 0;
const pressed = kind => document.querySelectorAll('[data-gesture]').forEach(
  b => b.setAttribute('aria-pressed', String(b.dataset.gesture === kind))
);
function setDesktopGesture(kind) {
  if (xrSession) return;
  desktopGesture = kind;
  pressed(kind);
  if (kind === 'open') burst(field, [cursor[0] * .5, cursor[1] * .4, 0], 2.8);
}
document.querySelectorAll('[data-gesture]').forEach(button =>
  button.addEventListener('click', () => setDesktopGesture(button.dataset.gesture))
);
document.addEventListener('keydown', event => {
  if (event.repeat || /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || '')) return;
  const mapping = { Digit1: 'sword', Digit2: 'open', Digit3: 'fist', Digit0: 'neutral' };
  if (mapping[event.code]) setDesktopGesture(mapping[event.code]);
  if (event.code === 'KeyR') resetField();
});
canvas.addEventListener('pointermove', event => {
  cursor = [(event.clientX / innerWidth - .5) * 2, (.5 - event.clientY / innerHeight) * 2];
});
function resetField() {
  field = createField(PARTICLE_COUNT, shapeSelect.value);
  updateGeometry();
}
shapeSelect.addEventListener('change', resetField);
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function readXRHand(input, frame, space) {
  if (!input?.hand) return null;
  const spaces = JOINTS.map(name => input.hand.get(name));
  if (spaces.some(s => !s)) return null;
  const points = [];
  if (typeof frame.fillPoses === 'function') {
    const matrices = matrixCaches[input.handedness] || new Float32Array(JOINTS.length * 16);
    let ok = false;
    try { ok = frame.fillPoses(spaces, space, matrices); } catch { /* older implementations */ }
    if (ok) {
      for (let i = 0; i < JOINTS.length; i++) {
        const j = i * 16;
        const p = [matrices[j + 12], matrices[j + 13], matrices[j + 14]];
        if (!p.every(Number.isFinite)) return null;
        points.push(p);
      }
      return points;
    }
  }
  for (const s of spaces) {
    const pose = frame.getJointPose(s, space);
    if (!pose) return null;
    const p = pose.transform.position;
    points.push([p.x, p.y, p.z]);
  }
  return points;
}
function toFieldCoordinates(measure) {
  v0.fromArray(measure.point);
  v1.copy(v0).add(forward.fromArray(measure.direction));
  group.worldToLocal(v0); group.worldToLocal(v1);
  return { kind: measure.kind, point: v0.toArray(), direction: v1.sub(v0).normalize().toArray() };
}
function anchorField(frame, referenceSpace) {
  if (anchored) return;
  const pose = frame.getViewerPose(referenceSpace);
  if (!pose) return;
  const p = pose.transform.position, r = pose.transform.orientation;
  q.set(r.x, r.y, r.z, r.w);
  forward.set(0, 0, -1).applyQuaternion(q);
  const yaw = Math.atan2(-forward.x, -forward.z);
  group.quaternion.setFromAxisAngle(up, yaw);
  group.position.set(p.x + forward.x * .95, p.y + forward.y * .95 - .09, p.z + forward.z * .95);
  group.updateMatrixWorld(true);
  anchored = true;
}
function getXRControls(frame, time) {
  const controls = [], seen = new Set();
  trackedHands = 0;
  const ref = renderer.xr.getReferenceSpace();
  if (!ref || !frame) return controls;
  anchorField(frame, ref);
  if (!anchored) return controls;
  for (const source of xrSession?.inputSources || []) {
    if (!source.hand || !['left', 'right'].includes(source.handedness)) continue;
    const side = source.handedness;
    seen.add(side);
    const hand = handState[side];
    const positions = readXRHand(source, frame, ref);
    const measure = interpretHand(positions);
    if (measure) trackedHands++;
    const state = hand.gate.update(measure, time);
    hand.measure = measure;
    if (!measure) continue;
    const local = toFieldCoordinates(measure);
    if (state.entered === 'open' && time - lastExplosion > 430) {
      burst(field, local.point, 2.9); lastExplosion = time;
    }
    if (['sword', 'fist'].includes(state.kind) && measure.kind === state.kind)
      controls.push({ ...local, kind: state.kind });
  }
  for (const side of ['left', 'right']) if (!seen.has(side)) {
    handState[side].gate.update(null, time);
    handState[side].measure = null;
  }
  return controls;
}
function getDesktopControls() {
  const point = [cursor[0] * .53, cursor[1] * .40, .30];
  const direction = new THREE.Vector3(cursor[0] * .40, cursor[1] * .34, -1).normalize().toArray();
  if (desktopGesture === 'sword' || desktopGesture === 'fist') return [{ kind: desktopGesture, point, direction }];
  return [];
}

async function enterXR(mode) {
  if (!navigator.xr || xrSession) return;
  try {
    // Session request MUST originate from this actual click, not from an asynchronous preflight.
    const session = await navigator.xr.requestSession(mode, { optionalFeatures: ['hand-tracking'] });
    xrSession = session;
    anchored = false; lastExplosion = -Infinity;
    for (const hand of Object.values(handState)) { hand.gate.reset(); hand.measure = null; }
    session.addEventListener('end', () => {
      xrSession = null; anchored = false;
      group.position.set(0, 0, 0); group.quaternion.identity();
      group.updateMatrixWorld(true);
      exitButton.hidden = true; arButton.hidden = false; vrButton.hidden = false;
      lastStatus = '';
    }, { once: true });
    await renderer.xr.setSession(session);
    arButton.hidden = true; vrButton.hidden = true; exitButton.hidden = false;
  } catch (error) {
    status.textContent = 'XR START FAILED\n' + String(error?.message || error);
    xrSession = null;
  }
}
arButton.addEventListener('click', () => enterXR('immersive-ar'));
vrButton.addEventListener('click', () => enterXR('immersive-vr'));
exitButton.addEventListener('click', () => xrSession?.end());
async function detectXR() {
  if (!navigator.xr) {
    $('help-xr').textContent = '未检测到 WebXR。请使用 Quest Browser 打开 HTTPS 地址。';
    return;
  }
  try {
    const [ar, vr] = await Promise.all([
      navigator.xr.isSessionSupported('immersive-ar'),
      navigator.xr.isSessionSupported('immersive-vr')
    ]);
    arButton.disabled = !ar; vrButton.disabled = !vr;
    $('help-xr').textContent = ar ? 'MR 透视可用 · 请启用 Quest 手部追踪' :
      vr ? '设备支持 VR，但未报告 MR 透视支持' : '此浏览器没有可用的沉浸式会话';
  } catch (error) { $('help-xr').textContent = 'WebXR 检测失败：' + String(error.message || error); }
}
detectXR();

function render(time, xrFrame) {
  const dt = lastTime ? Math.min((time - lastTime) / 1000, .04) : .016;
  lastTime = time;
  const controls = xrSession ? getXRControls(xrFrame, time) : getDesktopControls();
  advanceField(field, dt, controls);
  pointsGeo.attributes.position.needsUpdate = true;
  for (let i = 0; i < cores.count; i++) {
    const p = (i * 11 % field.count) * 3;
    dummy.position.set(field.pos[p], field.pos[p + 1], field.pos[p + 2]);
    const scale = .72 + .38 * (1 + Math.sin(time * .0017 + i * 2.3));
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    cores.setMatrixAt(i, dummy.matrix);
  }
  cores.instanceMatrix.needsUpdate = true;
  rings[0].rotation.y += dt * .035;
  rings[1].rotation.z -= dt * .025;
  const sword = controls.find(c => c.kind === 'sword');
  arrow.visible = Boolean(sword);
  if (sword) {
    arrow.position.fromArray(sword.point);
    arrow.setDirection(new THREE.Vector3().fromArray(sword.direction));
  }
  if (time - fpsTime >= 1000) { fps = fpsCount; fpsCount = 0; fpsTime = time; }
  fpsCount++;
  frames++;
  if (time - lastStatusTime > 230) {
    lastStatusTime = time;
    let detail;
    if (xrSession) {
      const left = handState.left.gate.kind, right = handState.right.gate.kind;
      detail = 'LIVE XR · ' + trackedHands + ' HAND(S)\nLEFT ' + left.toUpperCase() +
        '  /  RIGHT ' + right.toUpperCase();
      if (!trackedHands) detail += '\nNO VALID JOINTS · CHECK HAND TRACKING';
    } else detail = 'DESKTOP MOCK · ' + desktopGesture.toUpperCase() + '\nNO DEVICE HAND TRACKING';
    detail += '\n' + fps + ' FPS  /  ' + field.count + ' PARTICLES';
    if (detail !== lastStatus) { status.textContent = detail; lastStatus = detail; }
    labelText(xrSession ? ('LEFT ' + handState.left.gate.kind.toUpperCase() +
      ' / RIGHT ' + handState.right.gate.kind.toUpperCase() +
      ' / TRACKED ' + trackedHands) : 'DESKTOP SIMULATION / NOT XR TRACKING');
  }
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(render);
