// Gesture Dynamics V3 / Quest 3: continuous Lagrangian jet with curl turbulence.
// Every rendered frame advances real particle positions, sampled hand pose and kinetic state.
// Desktop is explicitly a mock. No hand coordinates leave the device.
import * as THREE from 'three';
import {JOINTS} from './engine.mjs';
import {interpretHand} from './gesture-dynamics-engine.mjs';
import {StableHand} from './gesture-stability.mjs';
import {GestureMusic} from './gesture-score-audio.mjs';
import {EnergyStream,MAX_PARTICLES,PARTICLE_KIND,POWER_MAX} from './gesture-stream-engine.mjs';
const $=id=>document.getElementById(id);
const canvas=$('view'),status=$('status'),shapeSelect=$('shape');
const arButton=$('enter-ar'),vrButton=$('enter-vr'),exitButton=$('exit-xr');
const renderer=new THREE.WebGLRenderer({
  canvas,alpha:true,antialias:false,powerPreference:'high-performance'
});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.setClearColor(0x000000,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.015,90);
// Desktop is a close-up art preview; immersive WebXR supplies its own true head camera.
camera.position.set(0,0,1.72);
const group=new THREE.Group();scene.add(group);
const flow=new EnergyStream('jet',727);
const music=new GestureMusic();
let soundMutedByUser=false;
function reflectMusic(){
  const btn=$('music-toggle'),hint=$('music-status');
  if(btn){
    btn.textContent=music.enabled?'暂停配乐 / MUTE':'开启配乐 / MUSIC ON';
    btn.setAttribute('aria-pressed',String(music.enabled));
  }
  if(hint)hint.textContent=music.lastError?('音频启动失败：'+music.lastError):
    music.enabled?'ORIGINAL SCORE · 96 BPM / LIVE GESTURE MIX':'点击开启原创实时配乐 · Quest 进入 MR 时自动尝试播放';
}
async function toggleMusic(){
  if(music.enabled){soundMutedByUser=true;music.stop();reflectMusic();return;}
  soundMutedByUser=false;
  await music.start();reflectMusic();
}
$('music-toggle')?.addEventListener('click',()=>void toggleMusic());
$('music-volume')?.addEventListener('input',e=>music.setVolume(Number(e.target.value)));
music.setVolume(Number($('music-volume')?.value||.65));
reflectMusic();
function startSoundOnGesture(){
  if(!music.enabled&&!soundMutedByUser)void music.start().then(reflectMusic);
}
const geo=new THREE.BufferGeometry();
const colors=new Float32Array(MAX_PARTICLES*3);
geo.setAttribute('position',new THREE.BufferAttribute(flow.pos,3).setUsage(THREE.DynamicDrawUsage));
geo.setAttribute('color',new THREE.BufferAttribute(colors,3).setUsage(THREE.DynamicDrawUsage));
geo.setDrawRange(0,MAX_PARTICLES);
function pointTexture(){
  const c=document.createElement('canvas');c.width=c.height=64;
  const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(.18,'rgba(255,255,255,1)');
  g.addColorStop(.50,'rgba(255,255,255,.45)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);
}
const particles=new THREE.Points(geo,new THREE.PointsMaterial({
  map:pointTexture(),size:.070,transparent:true,opacity:1,vertexColors:true,
  depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true
}));
particles.frustumCulled=false;group.add(particles);
const softGlow=new THREE.Points(geo,new THREE.PointsMaterial({
  map:pointTexture(),size:.16,transparent:true,opacity:.27,vertexColors:true,
  depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true
}));
softGlow.frustumCulled=false;group.add(softGlow);
// Velocity streaks are actual previous-to-current particle motion, not a canned spiral.
const streakCoords=new Float32Array(MAX_PARTICLES*6);
const streakColor=new Float32Array(MAX_PARTICLES*6);
const streakGeo=new THREE.BufferGeometry();
streakGeo.setAttribute('position',new THREE.BufferAttribute(streakCoords,3).setUsage(THREE.DynamicDrawUsage));
streakGeo.setAttribute('color',new THREE.BufferAttribute(streakColor,3).setUsage(THREE.DynamicDrawUsage));
const streaks=new THREE.LineSegments(streakGeo,new THREE.LineBasicMaterial({
  transparent:true,opacity:.65,vertexColors:true,depthWrite:false,
  blending:THREE.AdditiveBlending
}));
streaks.frustumCulled=false;group.add(streaks);
// Real broad ribbons: mesh quads derived from each sampled particle's current
// velocity, so they bend, spread and break with the simulated stream, not a fixed VFX loop.
const ribbonCoords=new Float32Array(MAX_PARTICLES*18);
const ribbonGeo=new THREE.BufferGeometry();
ribbonGeo.setAttribute('position',new THREE.BufferAttribute(ribbonCoords,3).setUsage(THREE.DynamicDrawUsage));
ribbonGeo.setDrawRange(0,0);
const ribbons=new THREE.Mesh(ribbonGeo,new THREE.MeshBasicMaterial({
  color:0xeed8b8,transparent:true,opacity:.22,
  side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending
}));
ribbons.frustumCulled=false;group.add(ribbons);
// Only strong collected pulses get a leading flare. The primary visual is the flowing jet.
const frontMeshes=new THREE.InstancedMesh(new THREE.OctahedronGeometry(.032,1),
  new THREE.MeshBasicMaterial({color:0xffeccd,transparent:true,opacity:.92}),8);
frontMeshes.frustumCulled=false;group.add(frontMeshes);
const dummy=new THREE.Object3D();
const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,-1),new THREE.Vector3(),
  .32,0xf3c692,.044,.02);
arrow.visible=false;group.add(arrow);
// Fist displays a compact local charging nucleus; it must physically follow the palm.
const chargeViews={};
for(const side of ['left','right']){
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.07,1),
    new THREE.MeshBasicMaterial({color:0xffddb1,transparent:true,opacity:.1,
      depthWrite:false,blending:THREE.AdditiveBlending}));
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.12,.0026,3,56),
    new THREE.MeshBasicMaterial({color:0xe6d6b9,transparent:true,opacity:.25,
      side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  core.visible=halo.visible=false;
  group.add(core,halo);chargeViews[side]={core,halo};
}
const shockwaves=[];
function spawnShock(p,power){
  const geo=new THREE.RingGeometry(.99,1,72);
  const mat=new THREE.MeshBasicMaterial({
    color:0xffd7af,transparent:true,opacity:.67,
    depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending
  });
  const mesh=new THREE.Mesh(geo,mat);mesh.position.fromArray(p);
  mesh.scale.setScalar(.08);group.add(mesh);
  shockwaves.push({mesh,t:0,max:.38+power*.09});
  if(shockwaves.length>10){
    const old=shockwaves.shift();group.remove(old.mesh);
    old.mesh.geometry.dispose();old.mesh.material.dispose();
  }
}
function updateShock(dt){
  for(let i=shockwaves.length-1;i>=0;i--){
    const e=shockwaves[i];e.t+=dt;
    const ratio=Math.min(1,e.t/e.max);
    e.mesh.scale.setScalar(.10+(.72+e.max)*ratio);
    e.mesh.material.opacity=(1-ratio)*.62;
    if(ratio>=1){
      group.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();
      shockwaves.splice(i,1);
    }
  }
}

// XR does not display the DOM: a lightweight in-scene test status is intentional.
const hudCanvas=document.createElement('canvas');hudCanvas.width=1050;hudCanvas.height=250;
const hudTex=new THREE.CanvasTexture(hudCanvas);
const hud=new THREE.Mesh(new THREE.PlaneGeometry(1.18,.28),
  new THREE.MeshBasicMaterial({map:hudTex,transparent:true,side:THREE.DoubleSide,
    depthWrite:false}));
hud.position.set(0,-.82,.18);group.add(hud);
let lastHud='';
function drawHud(s){
  if(s===lastHud)return;lastHud=s;
  const g=hudCanvas.getContext('2d');
  g.clearRect(0,0,1050,250);
  g.fillStyle='rgba(7,10,15,.8)';g.fillRect(0,0,1050,250);
  g.strokeStyle='#555f68';g.strokeRect(2,2,1046,246);
  g.fillStyle='#edc79f';g.font='31px monospace';
  g.fillText('GESTURE DYNAMICS / TURBULENT ENERGY V3',25,62);
  g.fillStyle='#f2f1e9';g.font='26px monospace';g.fillText(s.slice(0,72),25,126);
  g.fillStyle='#aab1b8';g.font='23px monospace';
  g.fillText('SWEEP: AURA   FIST: CHARGE   SWORD: FLOW   PALM: BLAST',25,196);
  hudTex.needsUpdate=true;
}
const matrixCache={left:new Float32Array(JOINTS.length*16),
  right:new Float32Array(JOINTS.length*16)};
const handState={left:{tracker:new StableHand()},
  right:{tracker:new StableHand()}};
let heldHands=0;
$('tracking-tolerance')?.addEventListener('input',event=>{
  const ms=Number(event.target.value);
  for(const h of Object.values(handState))h.tracker.cfg.neutralExitMs=ms;
  if($('tracking-tolerance-value'))$('tracking-tolerance-value').textContent=ms+'ms';
});
const v0=new THREE.Vector3(),v1=new THREE.Vector3(),
  forward=new THREE.Vector3(),q=new THREE.Quaternion(),
  up=new THREE.Vector3(0,1,0);
const THREE_WHITE=new THREE.Color(0xffffff);
let session=null,anchored=false,tracked=0,cursor=[0,0];
let lastTime=0,statusAt=-1,fpsAt=0,fps=0,fpsCount=0,lastMessage='READY / SWEEP YOUR HAND';
let desktopKind='neutral';
const gestureButtons=[...document.querySelectorAll('[data-gesture]')];
function setDesktopKind(kind){
  if(session)return;
  desktopKind=kind;
  for(const b of gestureButtons)b.setAttribute('aria-pressed',String(b.dataset.gesture===kind));
}
for(const b of gestureButtons)b.addEventListener('click',()=>{startSoundOnGesture();setDesktopKind(b.dataset.gesture);});
document.addEventListener('keydown',e=>{
  if(e.repeat||/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||''))return;
  const key={Digit1:'sword',Digit2:'open',Digit3:'fist',Digit0:'neutral'};
  if(key[e.code]){startSoundOnGesture();setDesktopKind(key[e.code]);}
  if(e.code==='KeyR')resetFlow();
});
canvas.addEventListener('pointermove',e=>{
  cursor=[(e.clientX/innerWidth-.5)*2,(.5-e.clientY/innerHeight)*2];
});
shapeSelect.addEventListener('change',()=>resetFlow());
function readSlider(id,defaultValue){
  const element=$(id);
  if(!element)return defaultValue;
  const n=Number(element.value);
  return Number.isFinite(n)?n:defaultValue;
}
function syncConfig(){
  flow.configure({turbulence:readSlider('turbulence',.65),output:readSlider('output',1)});
  if($('turbulence-value'))$('turbulence-value').textContent=flow.turbulence.toFixed(2);
  if($('output-value'))$('output-value').textContent=flow.output.toFixed(2);
}
for(const id of ['turbulence','output'])$(id)?.addEventListener('input',syncConfig);
syncConfig();
function resetFlow(){
  flow.reset(shapeSelect.value);
  for(const h of Object.values(handState))h.tracker.reset();
  for(const e of shockwaves){group.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();}
  shockwaves.length=0;lastMessage='READY / SWEEP YOUR HAND';
}
addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
});
function readXR(source,frame,ref){
  if(!source.hand)return null;
  const spaces=JOINTS.map(j=>source.hand.get(j));
  if(spaces.some(s=>!s))return null;
  const matrix=matrixCache[source.handedness];
  if(matrix&&typeof frame.fillPoses==='function'){
    let ok=false;try{ok=frame.fillPoses(spaces,ref,matrix);}catch{}
    if(ok){
      const points=[];
      for(let i=0;i<JOINTS.length;i++){
        const j=i*16,p=[matrix[j+12],matrix[j+13],matrix[j+14]];
        if(!p.every(Number.isFinite))return null;points.push(p);
      }
      return points;
    }
  }
  const points=[];
  for(const s of spaces){
    const p=frame.getJointPose(s,ref)?.transform.position;
    if(!p)return null;points.push([p.x,p.y,p.z]);
  }
  return points;
}
function anchor(frame,ref){
  if(anchored)return;
  const pose=frame?.getViewerPose(ref);if(!pose)return;
  const p=pose.transform.position,r=pose.transform.orientation;
  q.set(r.x,r.y,r.z,r.w);forward.set(0,0,-1).applyQuaternion(q);
  group.quaternion.setFromAxisAngle(up,Math.atan2(-forward.x,-forward.z));
  group.position.set(p.x+forward.x*.95,p.y+forward.y*.95-.075,p.z+forward.z*.95);
  group.updateMatrixWorld(true);anchored=true;
}
function localMeasure(measure){
  v0.fromArray(measure.point);
  v1.fromArray(measure.point).add(forward.fromArray(measure.direction));
  group.worldToLocal(v0);group.worldToLocal(v1);
  return {point:v0.toArray(),direction:v1.sub(v0).normalize().toArray()};
}
function xrHands(frame,time){
  const hands={left:null,right:null},seen=new Set();tracked=0;heldHands=0;
  const ref=renderer.xr.getReferenceSpace();
  if(!frame||!ref)return hands;
  anchor(frame,ref);if(!anchored)return hands;
  for(const source of session?.inputSources||[]){
    const side=source.handedness;
    if(!source.hand||!['left','right'].includes(side))continue;
    seen.add(side);
    const p=readXR(source,frame,ref),measurement=interpretHand(p);
    if(measurement)tracked++;
    const transformed=measurement?{...localMeasure(measurement),
      kind:measurement.kind,bends:measurement.bends,tipGap:measurement.tipGap}:null;
    const stable=handState[side].tracker.update(transformed,time);
    if(stable){
      hands[side]={point:stable.point,direction:stable.direction,kind:stable.kind,
        stale:stable.stale,hand:side};
      if(stable.stale)heldHands++;
    }
  }
  for(const side of ['left','right'])if(!seen.has(side)){
    const stable=handState[side].tracker.update(null,time);
    if(stable){hands[side]={...stable,hand:side};if(stable.stale)heldHands++;}
  }
  return hands;
}
function desktopHands(){
  const p=[cursor[0]*.53,cursor[1]*.38,.48];
  const d=new THREE.Vector3(cursor[0]*.36,cursor[1]*.27,-1).normalize().toArray();
  return {right:{kind:desktopKind,point:p,direction:d,hand:'right'},left:null};
}
async function enterXR(mode){
  if(!navigator.xr||session)return;
  try{
    // XR request is initiated synchronously by the actual click. Music unlock is
    // started in that same user activation, before either asynchronous result.
    const request=navigator.xr.requestSession(mode,{optionalFeatures:['hand-tracking']});
    if(!soundMutedByUser && !music.enabled)void music.start().then(reflectMusic);
    const s=await request;
    session=s;anchored=false;resetFlow();lastTime=0;
    s.addEventListener('end',()=>{
      session=null;anchored=false;resetFlow();
      group.position.set(0,0,0);group.quaternion.identity();group.updateMatrixWorld(true);
      arButton.hidden=false;vrButton.hidden=false;exitButton.hidden=true;lastTime=0;
    },{once:true});
    await renderer.xr.setSession(s);
    arButton.hidden=true;vrButton.hidden=true;exitButton.hidden=false;
  }catch(error){
    status.textContent='XR FAILED\n'+String(error?.message||error);session=null;
  }
}
arButton.addEventListener('click',()=>enterXR('immersive-ar'));
vrButton.addEventListener('click',()=>enterXR('immersive-vr'));
exitButton.addEventListener('click',()=>session?.end());
async function detectXR(){
  if(!navigator.xr){$('help-xr').textContent='请使用 Quest Browser 打开 HTTPS 网址';return;}
  try{
    const [ar,vr]=await Promise.all([
      navigator.xr.isSessionSupported('immersive-ar'),
      navigator.xr.isSessionSupported('immersive-vr')]);
    arButton.disabled=!ar;vrButton.disabled=!vr;
    $('help-xr').textContent=ar?'MR 可用 · 需要启用手部追踪':vr?'仅 VR 可用':'未检测到沉浸式 XR';
  }catch(e){$('help-xr').textContent='XR 检查失败: '+String(e.message||e);}
}
detectXR();
function updateGeometry(){
  let ribbonCount=0;
  const ribbonMode=flow.mode==='ribbon';
  const p=flow.pos,v=flow.vel,prev=flow.previous;
  const t=flow.age,ttl=flow.ttl,live=flow.live,kind=flow.kind;
  for(let i=0;i<MAX_PARTICLES;i++){
    const j=3*i,k=6*i;
    if(!live[i]){
      colors[j]=colors[j+1]=colors[j+2]=0;
      streakCoords[k]=streakCoords[k+3]=0;
      streakCoords[k+1]=streakCoords[k+4]=-999;
      streakCoords[k+2]=streakCoords[k+5]=0;
      continue;
    }
    const fade=Math.max(.07,1-t[i]/ttl[i]);
    const energy=flow.energy[i]*fade;
    const aura=kind[i]===PARTICLE_KIND.AURA;
    const inhale=kind[i]===PARTICLE_KIND.INTAKE;
    const pulse=kind[i]===PARTICLE_KIND.PULSE;
    const flash=kind[i]===PARTICLE_KIND.BURST;
    const white=pulse||flash;
    colors[j]=Math.min(1.0,energy*(white?1.15:aura?.84:inhale?.58:.93));
    colors[j+1]=Math.min(1.0,energy*(white?.91:aura?.61:inhale?.78:.76));
    colors[j+2]=Math.min(1.0,energy*(white?.72:aura?.42:inhale?1.04:.45));
    streakCoords[k]=p[j];streakCoords[k+1]=p[j+1];streakCoords[k+2]=p[j+2];
    // A velocity aligned streak: the elongated rear follows the actual trajectory.
    const speed=Math.hypot(v[j],v[j+1],v[j+2]);
    const tail=Math.min(.36,.046+speed*.034);
    const inv=tail/Math.max(speed,.1);
    streakCoords[k+3]=p[j]-v[j]*inv;
    streakCoords[k+4]=p[j+1]-v[j+1]*inv;
    streakCoords[k+5]=p[j+2]-v[j+2]*inv;
    for(let a=0;a<3;a++){
      streakColor[k+a]=colors[j+a]*.14;
      streakColor[k+3+a]=colors[j+a]*.75;
    }
    if(ribbonMode && i%2===0 && speed>.8 &&
      (kind[i]===PARTICLE_KIND.STREAM||kind[i]===PARTICLE_KIND.PULSE) &&
      ribbonCount<MAX_PARTICLES){
      const inv=1/speed;
      const dx=v[j]*inv,dy=v[j+1]*inv,dz=v[j+2]*inv;
      // Lateral vector in stream space, not a camera-facing flat screenshot.
      let nx=-dz,ny=0,nz=dx;
      let nn=Math.hypot(nx,ny,nz);
      if(nn<.12){nx=0;ny=dz;nz=-dy;nn=Math.hypot(nx,ny,nz);}
      nx/=nn||1;ny/=nn||1;nz/=nn||1;
      const width=.012+Math.min(.07,speed*.004);
      const span=.13+Math.min(.35,speed*.043);
      const px=p[j],py=p[j+1],pz=p[j+2];
      const tailx=px-dx*span,taily=py-dy*span,tailz=pz-dz*span;
      const ax=px+nx*width,ay=py+ny*width,az=pz+nz*width;
      const bx=px-nx*width,by=py-ny*width,bz=pz-nz*width;
      const cx=tailx+nx*width,cy=taily+ny*width,cz=tailz+nz*width;
      const ex=tailx-nx*width,ey=taily-ny*width,ez=tailz-nz*width;
      const o=ribbonCount*18;
      ribbonCoords.set([ax,ay,az,bx,by,bz,cx,cy,cz,cx,cy,cz,bx,by,bz,ex,ey,ez],o);
      ribbonCount++;
    }
  }
  geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;
  streakGeo.attributes.position.needsUpdate=true;streakGeo.attributes.color.needsUpdate=true;
  ribbonGeo.setDrawRange(0,ribbonCount*6);
  ribbonGeo.attributes.position.needsUpdate=true;
}
function updateCharge(time){
  for(const side of ['left','right']){
    const h=flow.hands[side],view=chargeViews[side];
    const visible=Boolean(h.present&&h.point&&
      (h.kind==='fist'||h.charge>.15||h.motion>.22));
    view.core.visible=view.halo.visible=visible;
    if(!visible)continue;
    const level=Math.min(1,h.charge/POWER_MAX+h.motion*.12);
    view.core.position.fromArray(h.point);view.halo.position.fromArray(h.point);
    view.core.scale.setScalar(.35+level*1.75);
    view.core.material.opacity=.18+level*.65;
    view.halo.scale.setScalar(.65+level*1.8);
    view.halo.material.opacity=.20+level*.60;
    view.halo.rotation.set(time*.0002,time*.00047,time*.00035);
  }
}
function drawFronts(){
  for(let i=0;i<frontMeshes.count;i++){
    const f=flow.fronts[i];
    if(f){
      dummy.position.fromArray(f.point);
      dummy.scale.setScalar(.68+Math.min(2.0,f.strength)*.36);
      dummy.rotation.set(.2,0,0);
    }else{dummy.position.set(0,-999,0);dummy.scale.setScalar(.0001);}
    dummy.updateMatrix();frontMeshes.setMatrixAt(i,dummy.matrix);
  }
  frontMeshes.instanceMatrix.needsUpdate=true;
}
function draw(time,frame){
  const dt=lastTime?Math.min(Math.max((time-lastTime)/1000,0),.05):1/90;
  lastTime=time;
  const hands=session?xrHands(frame,time):desktopHands();
  const events=flow.step(dt,hands);
  music.update(flow.hands);
  for(const event of events){
    music.react(event);
    if(event.type==='pulse')lastMessage='CHARGED JET '+event.power.toFixed(1)+' / '+event.count+' PARTICLES';
    if(event.type==='collect')lastMessage='FIST / COLLECT ENERGY';
    if(event.type==='blast'){
      spawnShock(flow.hands[event.side].point||[0,0,0],event.power);
      lastMessage='PALM BLAST '+event.power.toFixed(1);
    }
  }
  updateGeometry();updateCharge(time);drawFronts();updateShock(dt);
  hud.visible=Boolean(session);
  const sword=hands.right?.kind==='sword'?hands.right:hands.left?.kind==='sword'?hands.left:null;
  arrow.visible=Boolean(sword);
  if(sword){arrow.position.fromArray(sword.point);arrow.setDirection(
    new THREE.Vector3(...sword.direction));}
  fpsCount++;
  if(time-fpsAt>1000){fps=fpsCount;fpsCount=0;fpsAt=time;}
  if(time-statusAt>145){
    statusAt=time;
    const right=hands.right?.kind?.toUpperCase()||'NO HAND';
    const left=hands.left?.kind?.toUpperCase()||'NO HAND';
    const power=flow.hands.right.charge.toFixed(1)+' / '+flow.hands.left.charge.toFixed(1);
    const mode=session?'REAL XR':'DESKTOP MOCK';
    const hudLine='R '+right+' / L '+left+' / CHARGE '+power;
    status.textContent=mode+'\nRIGHT '+right+' · LEFT '+left+
      '\nENERGY '+power+' / '+POWER_MAX+
      '\nPARTICLES '+flow.alive+' / '+MAX_PARTICLES+
      '\nFPS '+fps+(session?' · TRACKED '+tracked+' · HELD '+heldHands:'')+
      '\n'+lastMessage;
    drawHud(hudLine);
  }
  renderer.render(scene,camera);
}
renderer.setAnimationLoop(draw);
