// NINE / TRANSIT SIGNAL — original 2D/3D narrative runtime experiment.
// Standalone desktop WebGL1 + Canvas2D, no dependencies or sample music.
// It DOES NOT claim OSC, VR hardware, sound generation or 3D-camera tracking.
const get = (id) => document.getElementById(id);
const world = get('world');
const graphics = get('graphics');
const stage = get('stage');
const gl = world.getContext('webgl', { antialias: true, alpha: false });
const ctx = graphics.getContext('2d');
if (!gl || !ctx) {
  throw new Error('WebGL and Canvas2D are required for this experiment.');
}
const scenes = [
  { id: 'ARRIVAL', status: 'WAITING', label: '01 / ARRIVAL', color: [0.80, 0.91, 0.82], tint: '#cce1c9', bg: [0.020, 0.039, 0.034], amplitude: 0.04, scale: 0.72 },
  { id: 'EXCHANGE', status: 'IN TRANSIT', label: '02 / EXCHANGE', color: [0.96, 0.74, 0.61], tint: '#f4bb9c', bg: [0.038, 0.052, 0.046], amplitude: 0.20, scale: 1.00 },
  { id: 'DEVIATION', status: 'UNRESOLVED', label: '03 / DEVIATION', color: [0.83, 0.78, 0.96], tint: '#d5c9ef', bg: [0.025, 0.029, 0.046], amplitude: 0.38, scale: 0.58 },
  { id: 'TRANSFER', status: 'RECONSTRUCTION', label: '04 / TRANSFER', color: [0.97, 0.87, 0.64], tint: '#f7dd9f', bg: [0.051, 0.050, 0.034], amplitude: 0.58, scale: 1.32 }
];
const state = { scene: 0, density: 0.55, motion: 0.50, space: 0.45, seq: 0, auto: false };
const clamp = (n, lo=0, hi=1) => Math.min(hi, Math.max(lo, n));
let dimensions = { w: 1, h: 1, dpr: 1 };
let logs = [];
let recording = false;
let recordStart = 0;
let playback = null;
let autoDue = performance.now() + 17000;
let lastFrame = performance.now();
let elapsed = 0;
let lastStatus = 0;
let frameCounter = 0;
let frameMeterStart = performance.now();
let measuredFPS = 0;
let lastSliderLog = 0;
let currentScale = 0.72;
let currentWarp = 0.04;
let currentDensity = 0.55;
let transferPulse = 0;

const vertexSource = [
  'attribute vec3 aPosition;',
  'uniform float uTime, uWarp, uScale, uAspect;',
  'varying float vStrength;',
  'void main(){',
  '  vec3 q=aPosition;',
  '  q.y+=sin(q.x*2.6+q.z*1.2+uTime*.35)*uWarp*.12;',
  '  q.x+=sin(q.y*3.5+uTime*.25)*uWarp*.07;',
  '  float theta=.17*sin(uTime*.13);',
  '  float x=q.x*cos(theta)-q.z*sin(theta);',
  '  float z=q.x*sin(theta)+q.z*cos(theta);',
  '  float depth=4.6+z*.40;',
  '  gl_Position=vec4(x*uScale/(depth*uAspect),q.y*uScale/depth,0.0,1.0);',
  '  vStrength=.30+.65*(.5+.5*sin(q.z*2.1+q.x*1.9));',
  '}'
].join('\n');
const fragmentSource = [
  'precision mediump float;',
  'uniform vec3 uColor;',
  'varying float vStrength;',
  'void main(){ gl_FragColor=vec4(uColor*vStrength,1.0); }'
].join('\n');
function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}
const program = gl.createProgram();
gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexSource));
gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  throw new Error(gl.getProgramInfoLog(program));
}
gl.useProgram(program);

const attributes = { position: gl.getAttribLocation(program, 'aPosition') };
const uniforms = Object.fromEntries(['uTime','uWarp','uScale','uAspect','uColor']
  .map((name) => [name, gl.getUniformLocation(program, name)]));
const vertices = [];
function line(x1, y1, z1, x2, y2, z2) {
  vertices.push(x1, y1, z1, x2, y2, z2);
}
// A station/track grid. World units are abstract, not meters.
for (let k = -14; k <= 14; k++) {
  line(-3.4, -1.08, k * 0.17, 3.4, -1.08, k * 0.17);
}
for (let k = -18; k <= 18; k++) {
  line(k * 0.17, -1.08, -2.45, k * 0.17, -1.08, 2.45);
}
// Interconnected elliptical orbital transit routes.
for (let track = 0; track < 4; track++) {
  const r = 0.62 + track * 0.36;
  for (let i = 0; i < 160; i++) {
    const a = i / 160 * Math.PI * 2;
    const b = (i + 1) / 160 * Math.PI * 2;
    const y1 = Math.sin(a * 3 + track) * 0.18 + track * 0.08 - 0.08;
    const y2 = Math.sin(b * 3 + track) * 0.18 + track * 0.08 - 0.08;
    line(Math.cos(a) * r, y1, Math.sin(a) * r * 0.8,
         Math.cos(b) * r, y2, Math.sin(b) * r * 0.8);
  }
}
// Architectural profiles, with several different tower heights.
for (let i = 0; i < 64; i++) {
  const x = (i % 16 - 7.5) * 0.38;
  const z = (Math.floor(i / 16) - 1.5) * 0.73;
  const height = 0.15 + (0.5 + 0.5 * Math.sin(i * 3.79)) * 1.36;
  const hw = 0.06 + (i % 4) * 0.012;
  const y = -1.08;
  line(x-hw,y,z,x-hw,y+height,z);
  line(x+hw,y,z,x+hw,y+height,z);
  line(x-hw,y+height,z,x+hw,y+height,z);
  if (i % 3 === 0) line(x,y+height,z,x,y+height+0.16,z+0.09);
}
// Fine short line stars / data points distributed in three dimensions.
for (let i = 0; i < 700; i++) {
  const fx = Math.sin(i * 78.234) * 29481.73;
  const fy = Math.sin(i * 18.729) * 18534.17;
  const fz = Math.sin(i * 36.951) * 34517.18;
  const x = ((fx - Math.floor(fx)) * 2 - 1) * 3.7;
  const y = ((fy - Math.floor(fy)) * 2 - 1) * 1.6 + 0.4;
  const z = ((fz - Math.floor(fz)) * 2 - 1) * 2.5;
  line(x,y,z,x+0.008,y+0.012,z);
}
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
gl.enableVertexAttribArray(attributes.position);
gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, 0, 0);

function resize() {
  const rect = stage.getBoundingClientRect();
  dimensions = {
    w: Math.max(1, rect.width),
    h: Math.max(1, rect.height),
    dpr: Math.min(window.devicePixelRatio || 1, 2)
  };
  for (const canvas of [world, graphics]) {
    canvas.width = Math.round(dimensions.w * dimensions.dpr);
    canvas.height = Math.round(dimensions.h * dimensions.dpr);
  }
  ctx.setTransform(dimensions.dpr, 0, 0, dimensions.dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function snapshot() {
  return { scene: state.scene, density: state.density, motion: state.motion,
    space: state.space, seq: state.seq };
}
function logEvent(type, payload) {
  if (recording && !playback) {
    logs.push({ t_ms: Math.max(0, Math.round(performance.now() - recordStart)),
      type: type, payload: payload, state: snapshot() });
  }
}
function updateUI() {
  const scene = scenes[state.scene];
  get('scene-caption').textContent = scene.label + ' · ' + scene.status;
  document.querySelectorAll('.act').forEach((b, i) => b.classList.toggle('active', i === state.scene));
  for (const id of ['density', 'motion', 'space']) {
    get(id).value = state[id].toFixed(2);
    get(id + '-v').textContent = state[id].toFixed(2);
  }
  get('auto').textContent = state.auto ? 'AUTO · ON' : 'AUTO · OFF';
  get('auto').classList.toggle('active', state.auto);
  get('record').textContent = recording ? '■ STOP RECORD' : '● RECORD';
  get('record').classList.toggle('active', recording);
  get('replay').disabled = logs.length < 1;
  get('export').disabled = logs.length < 1;
}
function setScene(index, source='BUTTON', cause='SCENE_ADVANCE', fromReplay=false) {
  const old = state.scene;
  state.scene = clamp(Math.floor(index), 0, scenes.length - 1);
  state.seq += 1;
  transferPulse = 1;
  autoDue = performance.now() + 17000;
  if (!fromReplay) {
    logEvent('WORLD_EVENT', {
      event_id: 'nine-event-' + String(state.seq).padStart(5, '0'),
      source: source, cause: cause, previous_scene: scenes[old].id,
      next_scene: scenes[state.scene].id
    });
  }
  updateUI();
}
function reset() {
  state.scene = 0;
  state.density = 0.55;
  state.motion = 0.5;
  state.space = 0.45;
  state.seq += 1;
  transferPulse = 0;
  elapsed = 0;
  playback = null;
  autoDue = performance.now() + 17000;
  logEvent('RESET', { source: 'BUTTON' });
  updateUI();
}
get('step').addEventListener('click', () => setScene((state.scene + 1) % scenes.length, 'BUTTON', 'TRANSFER'));
document.querySelectorAll('.act').forEach((b) =>
  b.addEventListener('click', () => setScene(Number(b.dataset.act), 'BUTTON', 'SCENE_SELECT')));
get('auto').addEventListener('click', () => {
  state.auto = !state.auto;
  autoDue = performance.now() + 17000;
  logEvent('AUTO_MODE', { enabled: state.auto });
  updateUI();
});
get('reset').addEventListener('click', reset);
for (const id of ['density', 'motion', 'space']) {
  const inp = get(id);
  function setControl(final=false) {
    state[id] = clamp(Number(inp.value));
    get(id + '-v').textContent = state[id].toFixed(2);
    if (final || performance.now() - lastSliderLog > 75) {
      logEvent('CONTROL', { id: id, value: state[id] });
      lastSliderLog = performance.now();
    }
  }
  inp.addEventListener('input', () => setControl(false));
  inp.addEventListener('change', () => setControl(true));
}

get('record').addEventListener('click', () => {
  if (!recording) {
    playback = null;
    logs = [];
    recording = true;
    recordStart = performance.now();
    logEvent('INITIAL_STATE', { note: 'Original visual world state; no audio or sensor captured.' });
  } else {
    logEvent('RECORD_STOP', {});
    recording = false;
  }
  updateUI();
});
function replay() {
  if (!logs.length) return;
  recording = false;
  state.auto = false;
  playback = { events: logs.slice(), index: 0, started: performance.now() };
  updateUI();
}
get('replay').addEventListener('click', replay);
get('export').addEventListener('click', () => {
  if (!logs.length) return;
  const data = {
    schema: 'performable-music/nine-events/0.1', type: 'original-visual-only',
    exported_at: new Date().toISOString(),
    limits: ['no audio capture', 'no OSC', 'no hardware tracking'],
    events: logs
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'nine-transit-events.json';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.addEventListener('keydown', (event) => {
  const name = event.target && event.target.tagName;
  if (name === 'INPUT' || event.metaKey || event.ctrlKey || event.altKey) return;
  if ('1234'.includes(event.key) && event.key.length === 1) {
    setScene(Number(event.key)-1,'KEYBOARD','SCENE_SELECT');
  } else if (event.code === 'Space') {
    event.preventDefault();
    setScene((state.scene+1)%scenes.length,'KEYBOARD','TRANSFER');
  } else if (event.key.toLowerCase() === 'r') get('record').click();
});
function applyReplayEvent(entry) {
  state.scene = entry.state.scene;
  state.density = entry.state.density;
  state.motion = entry.state.motion;
  state.space = entry.state.space;
  state.seq = entry.state.seq;
  transferPulse = entry.type === 'WORLD_EVENT' ? 1 : transferPulse;
  updateUI();
}
function paintHUD(scene, seconds) {
  const w=dimensions.w, h=dimensions.h;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  const edge=Math.max(18,Math.min(45,w*.036));
  ctx.font = '11px ui-monospace, Menlo, monospace';
  ctx.textBaseline='alphabetic';
  const bandY=h*.73;
  ctx.fillStyle='rgba(9,17,14,.79)';
  ctx.fillRect(0,bandY,w,h*.23);
  ctx.fillStyle=scene.tint;
  const count=4+Math.round(18*state.density);
  for(let i=0;i<count;i++){
    const u=i/Math.max(1,count-1);
    const swell=Math.abs(Math.sin(i*.76+seconds*(.35+state.motion)));
    const size=4+25*swell;
    const x=edge+u*(w-2*edge);
    const y=bandY+16+Math.cos(i*.92+seconds*.28)*12;
    ctx.globalAlpha=.38+.55*swell;
    ctx.fillRect(x,y,size*.42,3+size*.2);
  }
  ctx.globalAlpha=1;
  ctx.font='500 '+Math.min(42,Math.max(21,w*.053))+'px ui-sans-serif, system-ui';
  ctx.fillText(scene.label,edge,bandY+74,Math.max(100,w-2*edge));
  ctx.font='11px ui-monospace, monospace';
  ctx.fillStyle='#c5d1c6';
  ctx.fillText('NARRATIVE WORLD STATE / '+scene.status,edge,bandY+99);
  ctx.fillStyle='#788b81';
  ctx.fillText('SPACE  '+state.space.toFixed(2)+'     DENSITY  '+state.density.toFixed(2),edge,bandY+119);
  const top=Math.max(55,h*.17);
  ctx.save();
  ctx.translate(w-edge,top);
  ctx.rotate(-Math.PI/2);
  ctx.fillStyle=scene.tint;
  ctx.font='10px ui-monospace, monospace';
  ctx.fillText('SEQUENCE / '+String(state.seq).padStart(4,'0'),0,0);
  ctx.restore();
  // Small graphic annotation, *not* an actual measured network/OSC telemetry.
  const traceY=Math.max(160,h*.32);
  ctx.strokeStyle='rgba(213,225,215,.26)';
  ctx.lineWidth=1;
  ctx.beginPath();
  for(let i=0;i<120;i++){
    const x=edge+i*(Math.min(240,w*.40)/119);
    const y=traceY+Math.sin(i*.24+seconds*.65)*5+Math.cos(i*.07+seconds*.13)*10*state.motion;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.stroke();
  ctx.fillStyle='#9bab9b';
  ctx.font='10px ui-monospace, monospace';
  ctx.fillText('SIMULATED TRANSPORT PATH',edge,traceY-24);
  ctx.restore();
}
function render(now) {
  const dt=clamp((now-lastFrame)/1000,0,.05);
  lastFrame=now;
  elapsed+=dt;
  if(playback){
    const t=now-playback.started;
    while(playback.index<playback.events.length && playback.events[playback.index].t_ms<=t){
      applyReplayEvent(playback.events[playback.index++]);
    }
    if(playback.index>=playback.events.length) playback=null;
  } else if(state.auto && now>=autoDue) {
    setScene((state.scene+1)%scenes.length,'AUTO','AUTO_ADVANCE');
  }
  const scene=scenes[state.scene];
  currentScale+=(scene.scale*(.70+state.space*.55)-currentScale)*Math.min(1,dt*2.8);
  currentWarp+=(scene.amplitude-currentWarp)*Math.min(1,dt*2.1);
  currentDensity+=(state.density-currentDensity)*Math.min(1,dt*2.6);
  transferPulse*=Math.exp(-dt*3);
  const warp=currentWarp+transferPulse*.12;
  gl.viewport(0,0,world.width,world.height);
  gl.clearColor(...scene.bg,1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(uniforms.uTime,elapsed*(.16+state.motion*1.85));
  gl.uniform1f(uniforms.uWarp,warp);
  gl.uniform1f(uniforms.uScale,currentScale*5.5);
  gl.uniform1f(uniforms.uAspect,dimensions.w/dimensions.h);
  gl.uniform3f(uniforms.uColor,...scene.color);
  const count=Math.max(100,Math.floor(vertices.length/3*(.28+.72*currentDensity)));
  gl.drawArrays(gl.LINES,0,count-count%2);
  paintHUD(scene,elapsed);
  frameCounter++;
  if(now-frameMeterStart>=1000){
    measuredFPS=frameCounter*1000/(now-frameMeterStart);
    frameCounter=0;frameMeterStart=now;
  }
  if(now-lastStatus>220){
    lastStatus=now;
    get('telemetry').textContent =
      'SCENE   '+scene.id+' / '+scene.status+
      '\nEVENT   '+String(state.seq).padStart(5,'0')+
      '\nFRAME   '+measuredFPS.toFixed(1)+' fps (measured browser draw loop)'+
      '\nLOG     '+logs.length+' events / '+(recording?'RECORDING':playback?'REPLAY':'IDLE')+
      '\nAUTO    '+(state.auto?'ON':'OFF')+
      '\nSOURCE  internal scene controls (not OSC or live music)';
  }
  requestAnimationFrame(render);
}
updateUI();
requestAnimationFrame(render);
