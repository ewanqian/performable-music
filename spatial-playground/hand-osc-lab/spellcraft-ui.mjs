// Spellcraft Atelier — two distinct six-gameplay lines, one Quest/desktop renderer.
// Works without OSC or remote services; all visuals and sounds are original procedural studies.
import * as THREE from 'three';
import {JOINTS} from './engine.mjs';
import {interpretHand} from './gesture-dynamics-engine.mjs';
import {StableHand} from './gesture-stability.mjs';
import {SpellHandMenu,assistedAim,palmAim} from './spellcraft-controls.mjs';
import {SpellArena,SPELLS,ELEMENTS,STAR_POINTS,fingerContact} from './spellcraft-engine.mjs';

const $=id=>document.getElementById(id);
const canvas=$('view'),state=$('right-panel');
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const norm=p=>{const d=Math.hypot(...p)||1;return p.map(x=>x/d);};
const getLine=()=>new URL(location.href).searchParams.get('line')==='east'?'east':'west';
let line=getLine(),arena=new SpellArena(line),handMenu=new SpellHandMenu();
let menuSnapshot=handMenu.snapshot(),currentAim=null,mockLeftPalm=false,mockLeftShift=0,mockMenuGrip=false;
let nowHands=[];
let xrSession=null,anchored=false,desktopGesture='neutral',lastTime=0;
let fps=0,frames=0,fpsStart=0,statsAt=0,tracked=0,castCount=0;
let cursor=[0,0],lastStatus='',audio=null,pointing=null;
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.setSize(innerWidth,innerHeight);renderer.setClearColor(0x000000,0);
renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.015,45);camera.position.z=2.3;
const group=new THREE.Group();scene.add(group);
const up=new THREE.Vector3(0,1,0),temp=new THREE.Vector3(),tmp2=new THREE.Vector3(),look=new THREE.Vector3(),orient=new THREE.Quaternion();
const white=new THREE.Color(0xffffff);
const targetMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.105,1),
  new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.95}),5);
targetMesh.frustumCulled=false;group.add(targetMesh);
const targetGlows=new THREE.InstancedMesh(new THREE.OctahedronGeometry(.032,0),
  new THREE.MeshBasicMaterial({color:0xffffff}),5);
targetGlows.frustumCulled=false;group.add(targetGlows);
const projectileGeo=new THREE.IcosahedronGeometry(.055,1);
const projectiles=new THREE.InstancedMesh(projectileGeo,
  new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.91}),90);
projectiles.frustumCulled=false;group.add(projectiles);
const cursorArrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,-1),
  new THREE.Vector3(),.40,0xf1b676,.055,.026);group.add(cursorArrow);cursorArrow.visible=false;
const dummy=new THREE.Object3D();
const color=new THREE.Color();
const effects=[];
let projectileColours=new Float32Array(90*3);
function ring(point,c,rad=.20,ttl=.45,orientation=null){
  const geo=new THREE.TorusGeometry(rad,.005,3,72);
  const mat=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.84,
    side:THREE.DoubleSide,depthWrite:false});
  const mesh=new THREE.Mesh(geo,mat);
  mesh.position.fromArray(point);
  if(orientation)mesh.quaternion.copy(orientation);
  else mesh.rotation.x=Math.PI*.11;
  group.add(mesh);effects.push({mesh,ttl,max:ttl,kind:'ring'});
}
function lineEffect(path,c,ttl=.35){
  if(!Array.isArray(path)||path.length<2)return;
  const geo=new THREE.BufferGeometry().setFromPoints(path.map(p=>new THREE.Vector3(...p)));
  const mat=new THREE.LineBasicMaterial({color:c,transparent:true,opacity:.93,depthWrite:false});
  const mesh=new THREE.Line(geo,mat);group.add(mesh);
  effects.push({mesh,ttl,max:ttl,kind:'line'});
}
function particleFlare(point,c,n=18,ttl=.36){
  const pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    const t=i*2.39996,r=.015+Math.sqrt(i/n)*.16;
    pos[i*3]=point[0]+Math.cos(t)*r;
    pos[i*3+1]=point[1]+Math.sin(t)*r;
    pos[i*3+2]=point[2]+Math.sin(t*2)*r*.6;
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const mat=new THREE.PointsMaterial({color:c,size:.025,transparent:true,opacity:1,depthWrite:false});
  const mesh=new THREE.Points(geo,mat);group.add(mesh);effects.push({mesh,ttl,max:ttl,kind:'flare'});
}
function clearEffects(){
  for(const e of effects){group.remove(e.mesh);e.mesh.geometry?.dispose();e.mesh.material?.dispose();}
  effects.length=0;
}
function effectStep(dt){
  for(let i=effects.length-1;i>=0;i--){
    const e=effects[i];e.ttl-=dt;e.mesh.material.opacity=clamp(e.ttl/e.max,0,1)*.92;
    if(e.kind==='ring')e.mesh.scale.multiplyScalar(1+dt*.90);
    if(e.kind==='flare')e.mesh.scale.multiplyScalar(1+dt*1.9);
    if(e.ttl<=0){
      group.remove(e.mesh);e.mesh.geometry?.dispose();e.mesh.material?.dispose();effects.splice(i,1);
    }
  }
  // Keep allocations bounded during rapid hand gesture events.
  while(effects.length>48){
    const e=effects.shift();group.remove(e.mesh);e.mesh.geometry?.dispose();e.mesh.material?.dispose();
  }
}
function audioEnable(){
  try{
    audio ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audio.state==='suspended')void audio.resume();
  }catch{audio=null;}
}
function blip(f=380,dur=.11,volume=.024){
  if(!audio||audio.state!=='running')return;
  const now=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();
  o.type='triangle';o.frequency.setValueAtTime(f,now);
  o.frequency.exponentialRampToValueAtTime(Math.max(70,f*.68),now+dur);
  g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(volume,now+.012);
  g.gain.exponentialRampToValueAtTime(.0001,now+dur);
  o.connect(g);g.connect(audio.destination);o.start(now);o.stop(now+dur+.01);
  o.onended=()=>{o.disconnect();g.disconnect();};
}

function onEvents(list){
  for(const e of list){
    if(e.type==='hit'){particleFlare(e.point,arena.spec.color,26,.4);ring(e.point,0xf1f3f6,.07,.30);blip(600+arena.combo*17,.08);}
    if(e.type==='cast'){
      castCount++;ring(e.point,arena.spec.color,.11,.25);blip(260+castCount%6*70,.12);
    }
    if(e.type==='circle'){ring(e.point,arena.spec.color,e.radius||.2,1.2);blip(490,.18);}
    if(e.type==='volley'){ring(e.point,arena.spec.color,.36,.5);blip(900,.19);}
    if(e.type==='chain'){lineEffect(e.points,arena.spec.color,.35);blip(880,.15);}
    if(e.type==='freeze'){ring(e.position,0x94d7fc,.11,.38);}
    if(e.type==='shatter'){blip(1150,.14);}
    if(e.type==='block'){ring(e.point,0xa4eadf,.50,.44);blip(570,.20);}
    if(e.type==='damage'){blip(90,.25);}
    if(e.type==='shield' && Math.random()<.09)ring(e.point,0x9de6d2,.35,.19);
    if(e.type==='array'&&Math.random()<.05)ring(e.point,0xd5d3ff,.28,.20);
    if(e.type==='star'){particleFlare(e.point,0xe2e9fc,18,.45);blip(370+e.step*58,.16);}
    if(e.type==='constellation'){lineEffect(e.points,0xe0dcfc,1.8);blip(990,.30);}
    if(e.type==='charge' && Math.random()<.018)particleFlare(e.point,0xffa267,8,.15);
  }
}
// World-readable instruction board, visible in immersive sessions.
const uiCanvas=document.createElement('canvas');uiCanvas.width=1120;uiCanvas.height=280;
const uiTexture=new THREE.CanvasTexture(uiCanvas);
const uiPanel=new THREE.Mesh(new THREE.PlaneGeometry(1.22,.30),
  new THREE.MeshBasicMaterial({map:uiTexture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
uiPanel.position.set(0,-.74,.28);group.add(uiPanel);
let lastPanel='';
function paintPanel(){
  const s=arena.spec;
  const text=line.toUpperCase()+' / '+s.en+' / SCORE '+arena.score+' / '+arena.note;
  if(text===lastPanel)return;lastPanel=text;
  const g=uiCanvas.getContext('2d');g.clearRect(0,0,1120,280);
  g.fillStyle='rgba(8,10,15,.83)';g.fillRect(0,0,1120,280);
  g.strokeStyle='#5d636d';g.strokeRect(2,2,1116,276);
  g.fillStyle='#e6bd8b';g.font='29px monospace';g.fillText('SPELLCRAFT ATELIER / '+(arena.index+1)+'/6',26,62);
  g.fillStyle='#eeeae2';g.font='33px monospace';g.fillText(s.en,26,111);
  g.fillStyle='#bdc7d2';g.font='25px monospace';
  g.fillText(s.how.slice(0,62),26,161);
  g.fillStyle='#efd6b2';g.font='23px monospace';
  g.fillText(('SCORE '+arena.score+'  ·  '+arena.note).slice(0,72),26,222);
  uiTexture.needsUpdate=true;
}
// This pair of UI planes is readable *inside* the headset, unlike HTML overlays.
// Left: palm-held tradition selector. Right: eight-way fist-controlled spell wheel.
function textCanvas(width,height){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  return {canvas,texture:new THREE.CanvasTexture(canvas)};
}
const palmPaint=textCanvas(1024,360),wheelPaint=textCanvas(1024,1024);
const palmPanel=new THREE.Mesh(new THREE.PlaneGeometry(.78,.28),
  new THREE.MeshBasicMaterial({map:palmPaint.texture,transparent:true,
    side:THREE.DoubleSide,depthWrite:false}));
const wheelPanel=new THREE.Mesh(new THREE.PlaneGeometry(.89,.89),
  new THREE.MeshBasicMaterial({map:wheelPaint.texture,transparent:true,
    side:THREE.DoubleSide,depthWrite:false}));
group.add(palmPanel,wheelPanel);palmPanel.visible=wheelPanel.visible=false;
const menuOrb=new THREE.Mesh(new THREE.IcosahedronGeometry(.067,1),
  new THREE.MeshBasicMaterial({color:0xe8bd90,wireframe:true,
    transparent:true,opacity:.85,depthWrite:false}));
group.add(menuOrb);menuOrb.visible=false;
const aimGeo=new THREE.BufferGeometry();
aimGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3).setUsage(THREE.DynamicDrawUsage));
const aimRay=new THREE.Line(aimGeo,new THREE.LineBasicMaterial({
  color:0xf7d49d,transparent:true,opacity:.62,depthWrite:false
}));
aimRay.frustumCulled=false;group.add(aimRay);
const aimRing=new THREE.Mesh(new THREE.TorusGeometry(.13,.003,3,64),
  new THREE.MeshBasicMaterial({color:0xf3d09e,transparent:true,opacity:.88,depthWrite:false}));
group.add(aimRing);aimRing.visible=aimRay.visible=false;
let lastWheelKey='',lastPalmKey='';
function paintPalm(){
  const key=line;if(lastPalmKey===key)return;lastPalmKey=key;
  const ctx=palmPaint.canvas.getContext('2d');
  ctx.clearRect(0,0,1024,360);
  ctx.fillStyle='rgba(8,10,14,.90)';ctx.fillRect(0,0,1024,360);
  ctx.strokeStyle='#b59972';ctx.strokeRect(4,4,1016,352);
  ctx.textAlign='center';
  ctx.fillStyle='#e6bd8b';ctx.font='bold 37px sans-serif';
  ctx.fillText('LEFT PALM / CHOOSE YOUR PATH',512,78);
  const choices=[['← WIZARD','west',254],['SORCERER →','east',770]];
  for(const [text,mode,x] of choices){
    const active=mode===line;
    ctx.fillStyle=active?'#e6bd8b':'#3a3b42';
    ctx.fillRect(x-224,115,448,115);
    ctx.fillStyle=active?'#131313':'#ddd4c9';
    ctx.font='bold 43px sans-serif';ctx.fillText(text,x,186);
  }
  ctx.fillStyle='#bbb5aa';ctx.font='27px sans-serif';
  ctx.fillText('PRESENT PALM · SWIPE LEFT / RIGHT · HOLD RIGHT FIST',512,310);
  palmPaint.texture.needsUpdate=true;
}
function paintWheel(selected=-1,candidate=-1){
  const key=line+'|'+selected+'|'+candidate;
  if(lastWheelKey===key)return;lastWheelKey=key;
  const ctx=wheelPaint.canvas.getContext('2d'),w=1024;
  ctx.clearRect(0,0,w,w);
  ctx.fillStyle='rgba(7,9,13,.86)';
  ctx.beginPath();ctx.arc(512,512,483,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#9b886d';ctx.lineWidth=4;
  ctx.beginPath();ctx.arc(512,512,474,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(512,512,148,0,Math.PI*2);ctx.stroke();
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(let i=0;i<8;i++){
    const angle=Math.PI/2-i*Math.PI/4;
    const cx=512+Math.cos(angle)*305,cy=512-Math.sin(angle)*305;
    const active=selected===i||candidate===i;
    ctx.beginPath();ctx.arc(cx,cy,138,0,Math.PI*2);
    ctx.fillStyle=active?'#e6bd8b':'rgba(52,60,68,.84)';ctx.fill();
    ctx.strokeStyle=active?'#fff0d9':'#6c7580';ctx.lineWidth=3;ctx.stroke();
    const text=i<6?SPELLS[line][i].zh:i===6?'切换门派':'重置关卡';
    ctx.fillStyle=active?'#12131a':'#f1ede5';
    ctx.font='bold 33px sans-serif';ctx.fillText(text,cx,cy+17,260);
    ctx.fillStyle=active?'#363a41':'#dac5a7';ctx.font='bold 27px sans-serif';
    ctx.fillText(String(i+1).padStart(2,'0'),cx,cy-34);
  }
  ctx.fillStyle='#e6bd8b';ctx.font='bold 35px sans-serif';
  ctx.fillText('MOVE FIST',512,483);
  ctx.font='29px sans-serif';ctx.fillText('RELEASE TO SELECT',512,537);
  wheelPaint.texture.needsUpdate=true;
}
function visualHandMenu(snapshot,hands,time){
  const left=hands.find(x=>x.hand==='left');
  const right=hands.find(x=>x.hand==='right');
  palmPanel.visible=Boolean(snapshot.active&&left?.point);
  if(palmPanel.visible){
    palmPanel.position.set(left.point[0],left.point[1]+.22,left.point[2]-.09);
    paintPalm();
  }
  wheelPanel.visible=Boolean(snapshot.active&&snapshot.wheel&&right?.point);
  menuOrb.visible=Boolean(snapshot.active&&snapshot.wheel&&right?.point);
  if(wheelPanel.visible){
    const anchor=snapshot.wheel.anchor;
    wheelPanel.position.set(anchor[0]+.18,anchor[1]+.15,anchor[2]-.19);
    paintWheel(snapshot.wheel.selected,snapshot.wheel.candidate);
    menuOrb.position.fromArray(anchor);
    menuOrb.rotation.set(time*.0007,time*.0003,0);
    menuOrb.scale.setScalar(1+.16*Math.sin(time*.006));
  }
}
function visualAim(hand,aim,time){
  const on=Boolean(hand&&aim);
  aimRay.visible=on;aimRing.visible=on&&Boolean(aim.lock);
  if(!on)return;
  const a=hand.point,b=aim.point,arr=aimGeo.attributes.position.array;
  for(let i=0;i<3;i++){arr[i]=a[i];arr[i+3]=b[i];}
  aimGeo.attributes.position.needsUpdate=true;
  aimRing.position.fromArray(b);
  aimRing.scale.setScalar(1+.10*Math.sin(time*.006));
  aimRay.material.color.setHex(aim.lock?0xffd89e:0x8e969e);
  aimRay.material.opacity=aim.lock?.74:.36;
}

function updateMenu(){
  $('west').setAttribute('aria-pressed',String(line==='west'));
  $('east').setAttribute('aria-pressed',String(line==='east'));
  $('spell-list').replaceChildren();
  SPELLS[line].forEach((s,i)=>{
    const b=document.createElement('button');b.className='spell';
    b.setAttribute('aria-pressed',String(i===arena.index));b.type='button';
    const n=document.createElement('span');n.className='n';n.textContent=String(i+1).padStart(2,'0');
    const t=document.createElement('span'),strong=document.createElement('strong');
    strong.textContent=s.zh;const small=document.createElement('small');small.textContent=s.en;
    t.append(strong,small);b.append(n,t);b.addEventListener('click',()=>selectSpell(i));$('spell-list').append(b);
  });
  $('spell-name').textContent=arena.spec.zh+' / '+arena.spec.en;
  $('how').textContent=arena.spec.how;
  $('spell-detail').textContent=arena.spec.detail;
  $('elements').classList.toggle('visible',arena.spec.id==='elements');
  $('elements').replaceChildren();
  if(arena.spec.id==='elements')ELEMENTS.forEach((el,i)=>{
    const b=document.createElement('button');b.textContent=el.zh+' '+el.en;
    b.setAttribute('aria-pressed',String(arena.element===i));b.addEventListener('click',()=>{
      audioEnable();arena.setElement(i);updateMenu();});$('elements').append(b);
  });
  lastPanel='';paintPanel();
}
function selectSpell(i){
  arena.select(i);clearEffects();updateMenu();lastStatus='';
}
function switchLine(next){
  line=next;arena=new SpellArena(line);clearEffects();updateMenu();
  const url=new URL(location.href);url.searchParams.set('line',line);history.replaceState(null,'',url);
}
$('west').addEventListener('click',()=>switchLine('west'));
$('east').addEventListener('click',()=>switchLine('east'));
$('next').addEventListener('click',()=>selectSpell((arena.index+1)%6));
$('reset').addEventListener('click',()=>{arena.reset();clearEffects();updateMenu();});
$('cast').addEventListener('click',()=>{
  audioEnable();
  const p=[cursor[0]*.48,cursor[1]*.4,.5],d=norm([cursor[0]*.45,cursor[1]*.3,-1]);
  arena.events=[];arena.manual(p,d);onEvents(arena.events);updateMenu();
});
$('elements').addEventListener('pointerdown',audioEnable);
document.querySelectorAll('[data-gesture]').forEach(b=>b.addEventListener('click',()=>{
  audioEnable();desktopGesture=b.dataset.gesture;for(const x of document.querySelectorAll('[data-gesture]'))
    x.setAttribute('aria-pressed',String(x===b));
}));
document.addEventListener('keydown',e=>{
  if(e.repeat||/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||''))return;
  const g={Digit1:'sword',Digit2:'open',Digit3:'fist',Digit0:'neutral'};
  if(g[e.code]){desktopGesture=g[e.code];for(const b of document.querySelectorAll('[data-gesture]'))
    b.setAttribute('aria-pressed',String(b.dataset.gesture===desktopGesture));}
  if(e.code==='Space'){e.preventDefault();$('cast').click();}
  if(e.code==='KeyN')selectSpell((arena.index+1)%6);
});
canvas.addEventListener('pointermove',e=>{
  cursor=[(e.clientX/innerWidth-.5)*2,(.5-e.clientY/innerHeight)*2];
});
canvas.addEventListener('pointerdown',()=>{$('cast').click();});
updateMenu();
addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
});

const cache={left:new Float32Array(25*16),right:new Float32Array(25*16)};
const handState={
  left:{gate:new GestureGate(42,45),last:null,point:null,time:0,pinch:false},
  right:{gate:new GestureGate(42,45),last:null,point:null,time:0,pinch:false}
};
function readJoints(source,frame,ref){
  if(!source.hand)return null;
  const js=JOINTS.map(j=>source.hand.get(j));if(js.some(x=>!x))return null;
  const out=[];
  if(frame.fillPoses){
    const matrices=cache[source.handedness];let ok=false;
    try{ok=frame.fillPoses(js,ref,matrices);}catch{}
    if(ok){
      for(let i=0;i<25;i++){
        const j=i*16,p=[matrices[j+12],matrices[j+13],matrices[j+14]];
        if(!p.every(Number.isFinite))return null;out.push(p);
      }
      return out;
    }
  }
  for(const joint of js){
    const t=frame.getJointPose(joint,ref)?.transform.position;
    if(!t)return null;out.push([t.x,t.y,t.z]);
  }return out;
}
function anchor(frame,ref){
  if(anchored)return;
  const pose=frame.getViewerPose(ref);if(!pose)return;
  const p=pose.transform.position,r=pose.transform.orientation;
  orient.set(r.x,r.y,r.z,r.w);look.set(0,0,-1).applyQuaternion(orient);
  group.quaternion.setFromAxisAngle(up,Math.atan2(-look.x,-look.z));
  group.position.set(p.x+look.x*.95,p.y+look.y*.95-.03,p.z+look.z*.95);
  group.updateMatrixWorld(true);anchored=true;
}
function toLocal(sample,side){
  temp.fromArray(sample.point);tmp2.fromArray(sample.point).add(look.fromArray(sample.direction));
  group.worldToLocal(temp);group.worldToLocal(tmp2);
  return {hand:side,kind:sample.kind,point:temp.toArray(),
    direction:tmp2.sub(temp).normalize().toArray()};
}
function getHands(frame,time){
  const hands=[];tracked=0;
  const ref=renderer.xr.getReferenceSpace();if(!frame||!ref)return hands;
  anchor(frame,ref);if(!anchored)return hands;
  const found=new Set();
  for(const source of xrSession?.inputSources||[]){
    const side=source.handedness;if(!source.hand||!['left','right'].includes(side))continue;
    found.add(side);const s=handState[side],points=readJoints(source,frame,ref);
    const base=interpretHand(points);
    if(!base){s.gate.update(null,time);continue;}
    tracked++;
    const tip=fingerContact(points);
    if(base.kind==='neutral'&&tip!==null)base.kind='pinch';
    const stable=s.gate.update(base,time).kind;
    const p=toLocal(base,side);
    p.kind=stable;p.finger=tip;
    p.speed=s.point&&time>s.time?Math.min(4,Math.hypot(...p.point.map((v,i)=>v-s.point[i]))*1000/(time-s.time)):0;
    s.point=p.point.slice();s.time=time;
    hands.push(p);
    // Index pinch on the left is a tactile way to cycle spell choices inside XR.
    const toggled=stable==='pinch'&&tip===0;
    if(side==='left'&&arena.spec.id!=='elements'&&toggled&&!s.pinch&&time-lastNext>850){
      lastNext=time;selectSpell((arena.index+1)%6);
    }
    s.pinch=toggled;
  }
  for(const side of ['left','right'])if(!found.has(side)){
    const s=handState[side];s.gate.update(null,time);s.point=null;s.pinch=false;
  }
  return hands;
}
function mockHands(){
  const p=[cursor[0]*.48,cursor[1]*.40,.5];
  const d=norm([cursor[0]*.44,cursor[1]*.34,-1]);
  return [{hand:'right',kind:desktopGesture,point:p,direction:d,speed:0}];
}
async function enterXR(mode){
  if(!navigator.xr||xrSession)return;
  audioEnable();
  try{
    const session=await navigator.xr.requestSession(mode,{optionalFeatures:['hand-tracking']});
    xrSession=session;anchored=false;arena.reset();
    for(const h of Object.values(handState)){h.gate.reset();h.point=null;h.pinch=false;}
    session.addEventListener('end',()=>{
      xrSession=null;anchored=false;arena.reset();
      group.position.set(0,0,0);group.quaternion.identity();
      clearEffects();updateMenu();
      $('enter-ar').hidden=false;$('enter-vr').hidden=false;$('exit-xr').hidden=true;
    },{once:true});
    await renderer.xr.setSession(session);
    $('enter-ar').hidden=true;$('enter-vr').hidden=true;$('exit-xr').hidden=false;
  }catch(e){state.textContent='XR FAILED\n'+String(e?.message||e);xrSession=null;}
}
$('enter-ar').addEventListener('click',()=>enterXR('immersive-ar'));
$('enter-vr').addEventListener('click',()=>enterXR('immersive-vr'));
$('exit-xr').addEventListener('click',()=>xrSession?.end());
async function support(){
  if(!navigator.xr)return;
  try{
    const [ar,vr]=await Promise.all([
      navigator.xr.isSessionSupported('immersive-ar'),navigator.xr.isSessionSupported('immersive-vr')]);
    $('enter-ar').disabled=!ar;$('enter-vr').disabled=!vr;
  }catch(e){state.textContent='WebXR unsupported: '+String(e?.message||e);}
}
support();
function render(time,frame){
  const dt=lastTime?clamp((time-lastTime)/1000,0,.05):1/90;lastTime=time;
  const hands=xrSession?getHands(frame,time):mockHands();
  const events=arena.step(dt,hands);
  onEvents(events);effectStep(dt);
  // Target and projectile meshes are real world-space objects, not 2D HUD art.
  for(let i=0;i<5;i++){
    const t=arena.targets[i],active=t.respawn<=0;
    dummy.position.fromArray(t.position);dummy.rotation.set(time*.0003+i,.30*time*.001,0);
    dummy.scale.setScalar(active?.91:0.0001);dummy.updateMatrix();
    targetMesh.setMatrixAt(i,dummy.matrix);
    dummy.scale.setScalar(active?1:.0001);dummy.updateMatrix();
    targetGlows.setMatrixAt(i,dummy.matrix);
    const col=ELEMENTS[t.element].color;
    targetMesh.setColorAt(i,color.setHex(col));targetGlows.setColorAt(i,color.setHex(col));
  }
  targetMesh.instanceMatrix.needsUpdate=true;targetGlows.instanceMatrix.needsUpdate=true;
  if(targetMesh.instanceColor)targetMesh.instanceColor.needsUpdate=true;
  if(targetGlows.instanceColor)targetGlows.instanceColor.needsUpdate=true;
  for(let i=0;i<projectiles.count;i++){
    const p=arena.projectiles[i];
    if(p){dummy.position.fromArray(p.position);dummy.scale.setScalar(p.type==='sword'?1.0:.9);
      const c=p.type==='elemental'?ELEMENTS[p.element]?.color||arena.spec.color:arena.spec.color;
      projectiles.setColorAt(i,color.setHex(c));}
    else{dummy.position.set(0,-100,0);dummy.scale.setScalar(.0001);}
    dummy.rotation.set(time*.0008,0,0);dummy.updateMatrix();projectiles.setMatrixAt(i,dummy.matrix);
  }
  projectiles.instanceMatrix.needsUpdate=true;
  if(projectiles.instanceColor)projectiles.instanceColor.needsUpdate=true;
  pointing=hands.find(h=>h.kind==='sword')||null;
  cursorArrow.visible=Boolean(pointing);
  if(pointing){cursorArrow.position.fromArray(pointing.point);
    cursorArrow.setDirection(new THREE.Vector3(...pointing.direction));}
  frames++;if(time-fpsStart>1000){fps=frames;frames=0;fpsStart=time;}
  if(time-statsAt>160){
    statsAt=time;paintPanel();
    const msg=(xrSession?'QUEST XR / REAL HANDS':'DESKTOP / SIMULATED')+
      '\n'+(line==='east'?'CHINESE FANTASY / 术师':'EUROPEAN FANTASY / 巫师')+
      '\n'+arena.spec.en+'\nSCORE '+arena.score+'  COMBO '+arena.combo+
      '  HP '+arena.life+'  FPS '+fps+(xrSession?'\nHANDS '+tracked:'')+
      '\n'+arena.note;
    if(msg!==lastStatus){state.textContent=msg;lastStatus=msg;}
  }
  renderer.render(scene,camera);
}
renderer.setAnimationLoop(render);
