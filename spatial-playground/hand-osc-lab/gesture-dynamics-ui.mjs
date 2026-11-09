// Gesture Dynamics V2: real-time 25-joint XR sampling, event combo and leader/follower flights.
// One simulation core is shared by desktop MOCK and Quest WebXR hand tracking.
import * as THREE from 'three';
import { JOINTS } from './engine.mjs';
import { GestureGate, interpretHand } from './gesture-dynamics-engine.mjs';
import { GestureCombo, FlightSwarm, FLIGHT_SLOTS } from './gesture-flight-engine.mjs';

const $ = id => document.getElementById(id);
const canvas=$('view'),status=$('status'),shapeSelect=$('shape');
const arButton=$('enter-ar'),vrButton=$('enter-vr'),exitButton=$('exit-xr');
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.setClearColor(0x000000,0);
renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(64,innerWidth/innerHeight,.012,80);
camera.position.set(0,0,2.7);
const group=new THREE.Group();scene.add(group);
let swarm=new FlightSwarm(shapeSelect.value);
let combo=new GestureCombo();
const geometry=new THREE.BufferGeometry();
geometry.setAttribute('position',new THREE.BufferAttribute(swarm.pos,3).setUsage(THREE.DynamicDrawUsage));
const color=new Float32Array(swarm.pos.length);
for(let i=0;i<swarm.pos.length/3;i++){
  const t=i%120/120, j=i*3;
  color[j]=.75+t*.23;color[j+1]=.83-t*.17;color[j+2]=.97-t*.28;
}
geometry.setAttribute('color',new THREE.BufferAttribute(color,3));
function texture(){
  const c=document.createElement('canvas');c.width=c.height=64;
  const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(.2,'rgba(255,255,255,.96)');
  g.addColorStop(.55,'rgba(255,255,255,.24)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(c);
}
const particles=new THREE.Points(geometry,new THREE.PointsMaterial({
  map:texture(),size:.046,vertexColors:true,transparent:true,opacity:.94,
  depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true
}));
particles.frustumCulled=false;group.add(particles);
const leaders=new THREE.InstancedMesh(
  new THREE.IcosahedronGeometry(.044,1),
  new THREE.MeshBasicMaterial({color:0xf5debd}),FLIGHT_SLOTS
);
leaders.frustumCulled=false;group.add(leaders);
const dummy=new THREE.Object3D();
const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,-1),new THREE.Vector3(),.38,0xf0ac73,.06,.03);
group.add(arrow);arrow.visible=false;
// Inside XR the desktop DOM is not visible: place the state readout in the world.
const hudCanvas=document.createElement('canvas');hudCanvas.width=1000;hudCanvas.height=230;
const hudTexture=new THREE.CanvasTexture(hudCanvas);
const hudMesh=new THREE.Mesh(new THREE.PlaneGeometry(1.10,.25),new THREE.MeshBasicMaterial({
  map:hudTexture,transparent:true,side:THREE.DoubleSide,depthWrite:false
}));
hudMesh.position.set(0,-.83,.16);group.add(hudMesh);
let hudLast='';
function drawHud(line){
  if(line===hudLast)return;hudLast=line;
  const x=hudCanvas.getContext('2d');x.clearRect(0,0,1000,230);
  x.fillStyle='rgba(8,11,16,.76)';x.fillRect(0,0,1000,230);
  x.strokeStyle='#58616b';x.strokeRect(2,2,996,226);
  x.fillStyle='#f1bf91';x.font='32px monospace';
  x.fillText('GESTURE DYNAMICS / COMBO V2',25,62);
  x.fillStyle='#f1f0ec';x.font='27px monospace';
  x.fillText(line.slice(0,60),25,125);
  x.fillStyle='#9da8b5';x.font='24px monospace';
  x.fillText('SWORD: CAST   PALM: BURST   R FIST + L FIST: RECALL',25,187);
  hudTexture.needsUpdate=true;
}

const jointsCache={left:new Float32Array(JOINTS.length*16),right:new Float32Array(JOINTS.length*16)};
const handState={
  left:{gate:new GestureGate(42,45),measure:null,last:null,point:null},
  right:{gate:new GestureGate(42,45),measure:null,last:null,point:null}
};
const tempA=new THREE.Vector3(),tempB=new THREE.Vector3(),worldDir=new THREE.Vector3();
const q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0);
let xrSession=null,anchored=false,lastTime=0,lastStatusTime=0,fps=0,fpsFrames=0,fpsStart=0;
let cursor=[0,0],lastMessage='READY',lastEventTime=0,trackedHands=0;
const desktop={right:'neutral',left:'neutral'};
function setDesktopGesture(kind){
  if(xrSession)return;
  if(kind==='right-fist'){desktop.right='fist';desktop.left='neutral';}
  else if(kind==='left-fist'){desktop.left='fist';}
  else{desktop.right=kind;desktop.left='neutral';}
  document.querySelectorAll('[data-gesture]').forEach(
    b=>b.setAttribute('aria-pressed',String(b.dataset.gesture===kind)));
}
document.querySelectorAll('[data-gesture]').forEach(
  b=>b.addEventListener('click',()=>setDesktopGesture(b.dataset.gesture)));
document.addEventListener('keydown',e=>{
  if(e.repeat||/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||''))return;
  const map={Digit1:'sword',Digit2:'open',Digit3:'right-fist',Digit4:'left-fist',Digit0:'neutral'};
  if(map[e.code])setDesktopGesture(map[e.code]);
  if(e.code==='KeyR')reset();
});
canvas.addEventListener('pointermove',e=>{
  cursor=[(e.clientX/innerWidth-.5)*2,(0.5-e.clientY/innerHeight)*2];
});
function reset(){
  swarm=new FlightSwarm(shapeSelect.value);
  geometry.attributes.position.array=swarm.pos;geometry.attributes.position.needsUpdate=true;
  combo=new GestureCombo();lastMessage='RESET / READY';
  for(const h of Object.values(handState)){h.gate.reset();h.measure=null;h.last=null;h.point=null;}
  desktop.right='neutral';desktop.left='neutral';
}
shapeSelect.addEventListener('change',reset);
addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
});
function readXRHand(source,frame,ref){
  if(!source?.hand)return null;
  const spaces=JOINTS.map(name=>source.hand.get(name));
  if(spaces.some(s=>!s))return null;
  const points=[];
  if(typeof frame.fillPoses==='function'){
    const matrices=jointsCache[source.handedness];
    if(matrices){
      let ok=false;try{ok=frame.fillPoses(spaces,ref,matrices);}catch{}
      if(ok){
        for(let i=0;i<25;i++){
          const j=i*16,p=[matrices[j+12],matrices[j+13],matrices[j+14]];
          if(!p.every(Number.isFinite))return null;points.push(p);
        }
        return points;
      }
    }
  }
  for(const s of spaces){
    const p=frame.getJointPose(s,ref)?.transform.position;
    if(!p)return null;points.push([p.x,p.y,p.z]);
  }
  return points;
}
function anchor(frame,ref){
  if(anchored)return;
  const pose=frame?.getViewerPose(ref);
  if(!pose)return;
  const p=pose.transform.position,r=pose.transform.orientation;
  q.set(r.x,r.y,r.z,r.w);
  worldDir.set(0,0,-1).applyQuaternion(q);
  const yaw=Math.atan2(-worldDir.x,-worldDir.z);
  group.quaternion.setFromAxisAngle(up,yaw);
  group.position.set(p.x+worldDir.x*.95,p.y+worldDir.y*.95-.06,p.z+worldDir.z*.95);
  group.updateMatrixWorld(true);anchored=true;
}
function localSample(measure,side){
  tempA.fromArray(measure.point);
  tempB.fromArray(measure.point).add(worldDir.fromArray(measure.direction));
  group.worldToLocal(tempA);group.worldToLocal(tempB);
  return {hand:side,kind:measure.kind,point:tempA.toArray(),
    direction:tempB.sub(tempA).normalize().toArray()};
}
function xrHands(frame,time){
  const result={left:null,right:null},seen=new Set();
  trackedHands=0;
  const ref=renderer.xr.getReferenceSpace();
  if(!frame||!ref)return result;
  anchor(frame,ref);if(!anchored)return result;
  for(const input of xrSession?.inputSources||[]){
    const side=input.handedness;
    if(!['left','right'].includes(side)||!input.hand)continue;
    seen.add(side);
    const points=readXRHand(input,frame,ref);
    const measurement=interpretHand(points);
    const record=handState[side];
    const state=record.gate.update(measurement,time);
    if(!measurement){record.measure=null;continue;}
    trackedHands++;
    const local=localSample(measurement,side);
    record.measure={...local,kind:state.kind};
    result[side]=record.measure;
  }
  for(const side of ['left','right'])if(!seen.has(side)){
    handState[side].gate.update(null,time);handState[side].measure=null;
  }
  return result;
}
function desktopHands(){
  const p=[cursor[0]*.45,cursor[1]*.35,.4];
  const d=new THREE.Vector3(cursor[0]*.32,cursor[1]*.25,-1).normalize().toArray();
  return {
    right:{hand:'right',kind:desktop.right,point:p,direction:d},
    left:{hand:'left',kind:desktop.left,
      point:[p[0]-.32,p[1],p[2]],direction:d}
  };
}
function applyEvents(events){
  for(const e of events){
    if(e.type==='cast'){swarm.launch(e.point,e.direction);lastMessage='CAST / 6.2 M/S';}
    if(e.type==='burst'){swarm.burst(e.point);lastMessage='BURST / SCATTER';}
    if(e.type==='ready')lastMessage='RIGHT FIST READY · NOW LEFT FIST';
    if(e.type==='recall'){swarm.recall();lastMessage='RECALL / RETURN TO HAND';}
    lastEventTime=performance.now();
  }
}
async function enterXR(mode){
  if(!navigator.xr||xrSession)return;
  try{
    const session=await navigator.xr.requestSession(mode,{optionalFeatures:['hand-tracking']});
    xrSession=session;anchored=false;reset();
    session.addEventListener('end',()=>{
      xrSession=null;anchored=false;reset();
      group.position.set(0,0,0);group.quaternion.identity();group.updateMatrixWorld(true);
      arButton.hidden=false;vrButton.hidden=false;exitButton.hidden=true;
    },{once:true});
    await renderer.xr.setSession(session);
    arButton.hidden=true;vrButton.hidden=true;exitButton.hidden=false;
  }catch(err){status.textContent='XR START FAILED\n'+String(err?.message||err);xrSession=null;}
}
arButton.addEventListener('click',()=>enterXR('immersive-ar'));
vrButton.addEventListener('click',()=>enterXR('immersive-vr'));
exitButton.addEventListener('click',()=>xrSession?.end());
async function detectXR(){
  if(!navigator.xr){$('help-xr').textContent='WebXR unavailable — open HTTPS in Quest Browser';return;}
  try{
    const [ar,vr]=await Promise.all([
      navigator.xr.isSessionSupported('immersive-ar'),navigator.xr.isSessionSupported('immersive-vr')]);
    arButton.disabled=!ar;vrButton.disabled=!vr;
    $('help-xr').textContent=ar?'Quest MR possible · grant hand tracking':
      vr?'VR supported · AR unavailable':'No immersive XR available';
  }catch(err){$('help-xr').textContent='XR support check failed: '+String(err);}
}
detectXR();
function draw(time,frame){
  const dt=lastTime?Math.min(Math.max((time-lastTime)/1000,0),.05):1/90;
  lastTime=time;
  const hands=xrSession?xrHands(frame,time):desktopHands();
  const live=swarm.activeCount>0;
  applyEvents(combo.update(hands,time,live));
  const recallTarget=hands.right?.point||hands.left?.point||[0,0,.2];
  swarm.step(dt,recallTarget);
  geometry.attributes.position.needsUpdate=true;
  for(let i=0;i<FLIGHT_SLOTS;i++){
    const f=swarm.flights[i];
    dummy.position.fromArray(f.position);
    dummy.scale.setScalar(f.active && f.mode!=='recall' ? 1.0 : .0001);
    dummy.updateMatrix();
    leaders.setMatrixAt(i,dummy.matrix);
  }
  leaders.instanceMatrix.needsUpdate=true;
  const sword=hands.right?.kind==='sword'?hands.right:hands.left?.kind==='sword'?hands.left:null;
  arrow.visible=Boolean(sword);
  if(sword){
    arrow.position.fromArray(sword.point);
    arrow.setDirection(new THREE.Vector3().fromArray(sword.direction));
  }
  fpsFrames++;
  if(time-fpsStart>=1000){fps=fpsFrames;fpsFrames=0;fpsStart=time;}
  if(time-lastStatusTime>145){
    lastStatusTime=time;
    const mode=xrSession?'QUEST XR / REAL JOINTS':'DESKTOP / MOCK';
    const right=hands.right?.kind?.toUpperCase()||'NO HAND';
    const left=hands.left?.kind?.toUpperCase()||'NO HAND';
    const statusLine=mode+'\nR '+right+'  /  L '+left+
      '\nACTIVE '+swarm.activeCount+' / '+FLIGHT_SLOTS+'  ·  FPS '+fps+
      (xrSession?'\nTRACKED HANDS '+trackedHands:'')+
      '\n'+lastMessage;
    status.textContent=statusLine;
    drawHud('R '+right+' / L '+left+' · '+lastMessage);
  }
  renderer.render(scene,camera);
}
renderer.setAnimationLoop(draw);
