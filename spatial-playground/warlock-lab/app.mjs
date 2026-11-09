import * as T from 'three';
import {SCHOOLS,WarlockArena,PoseHold,GestureController,aim,V} from './engine.mjs';
import {VisualWorld} from './visuals.mjs';
import {ElementSound} from './audio.mjs';
import {JOINTS} from '../hand-osc-lab/engine.mjs';
const $=id=>document.getElementById(id),canvas=$('stage'),arena=new WarlockArena('stasis'),sound=new ElementSound();
const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.45));renderer.setSize(innerWidth,innerHeight);renderer.setClearColor(0x090c12,1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');
const scene=new T.Scene(),camera=new T.PerspectiveCamera(60,innerWidth/innerHeight,.015,70),root=new T.Group();scene.add(root);camera.position.set(0,.14,1.85);camera.lookAt(0,-.12,-3.5);const desktopCamera={p:camera.position.clone(),q:camera.quaternion.clone()};
const visuals=new VisualWorld(renderer,scene,root),control=new GestureController(),holds={left:new PoseHold(),right:new PoseHold()};
const raycaster=new T.Raycaster(),pointer=new T.Vector2(0,0),plane=new T.Plane(new T.Vector3(0,0,1),3.4),hit=new T.Vector3(),vec=new T.Vector3(),q=new T.Quaternion();
let session=null,sessionMode='',anchored=false,previousTime=0,desktopAction=null,queued=null,fps=0,frameCount=0,fpsAt=0,statusAt=0,tracked=0,menuOn=false,leftSince=null,leftLost=null,wheelAnchor=null,wheelChoice=-1,wheelCandidate=-1,wheelSince=0,lastMenuKey='',blockedUntil=0,lastHeld='neutral';
let handData={left:null,right:null};const viewer={p:[0,.14,1.85],forward:[0,0,-1],right:[1,0,0],up:[0,1,0],quat:new T.Quaternion()};
const caches={left:new Float32Array(25*16),right:new Float32Array(25*16)};
function failure(e){$('fatal').style.display='block';$('fatal').textContent='启动异常：'+String(e?.message||e)+'。请重新打开页面；本页需要 WebGL2 与网络加载 Three.js。';}
window.addEventListener('error',e=>failure(e.error||e.message));
function soundLabel(){const state=sound.diagnostics();$('sound').textContent=sound.enabled?'MUTE':'SOUND ON';$('sound').setAttribute('aria-pressed',String(sound.enabled));$('audio-state').textContent=sound.failed?'AUDIO: '+sound.failed:'SOUND: '+(sound.enabled?'ORIGINAL / RUNNING':'MUTED / CLICK TO START');}
function unlock(){if(!sound.enabled)void sound.start().then(soundLabel);}
$('sound').onclick=()=>{if(sound.enabled){sound.mute();soundLabel();}else unlock();};
function choose(id){arena.choose(id);visuals.choose(id);control.reset();desktopAction=null;queued=null;lastMenuKey='';document.documentElement.style.setProperty('--accent','#'+arena.school.color.toString(16).padStart(6,'0'));$('school-name').textContent=arena.school.role+' / '+arena.school.zh;$('chapter').textContent=String(SCHOOLS.findIndex(s=>s.id===id)+1).padStart(2,'0')+' / '+arena.school.chapter;$('reference').textContent=arena.school.reference+' · 手势转译';$('instruction').textContent=arena.school.hint+'。左掌打开六系轮盘；双拳蓄势后张开右掌释放超能。';for(const button of document.querySelectorAll('[data-school]'))button.setAttribute('aria-pressed',String(button.dataset.school===arena.school.id));hideResult();}
for(const [i,s] of SCHOOLS.entries()){const b=document.createElement('button');b.className='school';b.dataset.school=s.id;b.innerHTML='<span class="num">0'+(i+1)+' / ELEMENT</span><strong>'+s.zh+'</strong><small>'+s.role+'</small>';b.onclick=()=>{unlock();choose(s.id);};$('schools').append(b);}
function action(which){unlock();if(which==='collect'||which==='primary'){desktopAction=desktopAction===which?null:which;}else{queued=which;desktopAction=null;}for(const b of document.querySelectorAll('[data-action]'))b.setAttribute('aria-pressed',String(b.dataset.action===desktopAction));}
for(const b of document.querySelectorAll('[data-action]'))b.onclick=()=>action(b.dataset.action);
$('release').onclick=()=>{desktopAction=null;queued=null;};$('reset').onclick=()=>{arena.reset();visuals.clear();control.reset();desktopAction=null;queued=null;hideResult();};
function hideResult(){$('session-result').style.display='none';}
function trial(){arena.startSession();visuals.clear();desktopAction=null;queued=null;hideResult();}
$('trial').onclick=()=>{unlock();trial();};$('again').onclick=trial;$('sandbox').onclick=()=>{arena.reset();hideResult();};
$('asset').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;if(!$('rights').checked){$('sample-state').textContent='请先确认你有权使用这个音效';return;}try{const key=arena.school.id+':'+$('sample-slot').value;const seconds=await sound.load(key,file);$('sample-state').textContent=key+' · '+seconds.toFixed(2)+'s · 已在本地载入';unlock();}catch(err){$('sample-state').textContent=String(err.message||err);}});
window.addEventListener('keydown',e=>{if(e.repeat||/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||''))return;const map={Digit1:'collect',Digit2:'primary',Digit3:'secondary',Digit4:'super'};if(map[e.code])action(map[e.code]);if(e.code==='Digit0'){$('release').click();}if(e.code==='KeyR')$('reset').click();if(e.code==='Space'){e.preventDefault();action('secondary');}});
canvas.addEventListener('pointermove',e=>{pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);$('reticle').style.left=e.clientX+'px';$('reticle').style.top=e.clientY+'px';});
canvas.addEventListener('pointerdown',e=>{if(session)return;unlock();desktopAction='primary';try{canvas.setPointerCapture(e.pointerId);}catch{}});canvas.addEventListener('pointerup',()=>{desktopAction=null;});canvas.addEventListener('pointercancel',()=>{desktopAction=null;});
window.addEventListener('resize',()=>{if(session)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
// XR menus and tutorial are rendered in 3D; DOM overlays are not required.
function labelPlane(w,h,width,height){const c=document.createElement('canvas');c.width=w;c.height=h;const tex=new T.CanvasTexture(c),mesh=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide,depthWrite:false}));root.add(mesh);return {c,tex,mesh};}
const wheel=labelPlane(1024,1024,.85,.85),hud=labelPlane(1280,320,1.15,.2875);wheel.mesh.visible=false;hud.mesh.visible=false;let lastHud='';
const wheelCursor=new T.Mesh(new T.SphereGeometry(.018,8,6),new T.MeshBasicMaterial({color:0xe3eeff}));root.add(wheelCursor);wheelCursor.visible=false;
function paintWheel(){const key=arena.school.id+':'+wheelChoice+':'+wheelCandidate;if(lastMenuKey===key)return;lastMenuKey=key;const ctx=wheel.c.getContext('2d');ctx.clearRect(0,0,1024,1024);ctx.fillStyle='rgba(7,13,23,.91)';ctx.beginPath();ctx.arc(512,512,490,0,Math.PI*2);ctx.fill();ctx.textAlign='center';ctx.textBaseline='middle';
 for(let i=0;i<8;i++){const a=Math.PI/2-i*Math.PI/4,x=512+Math.cos(a)*324,y=512-Math.sin(a)*324,sel=i===wheelCandidate||i===wheelChoice;ctx.beginPath();ctx.arc(x,y,123,0,Math.PI*2);ctx.fillStyle=sel?'#b6d9fb':'#1b2c43';ctx.fill();ctx.strokeStyle=sel?'#fff':'#526982';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle=sel?'#0b1723':'#e5eff9';ctx.font='bold 37px sans-serif';ctx.fillText(i<6?SCHOOLS[i].zh:i===6?'超能':'重置',x,y-12);ctx.font='22px monospace';ctx.fillText(i<6?SCHOOLS[i].en:i===6?'SUPER':'RESET',x,y+35);}
 ctx.fillStyle='#d9eaff';ctx.font='30px sans-serif';ctx.fillText('右拳移动',512,480);ctx.fillText('松拳确认',512,530);wheel.tex.needsUpdate=true;}
function paintHud(ms){const state=arena.session.done?'COMPLETE / '+arena.score+' POINTS':menuOn?'右拳选方向 · 松拳确认 · 放下左掌继续':arena.notice;const text=arena.school.zh+'|'+state+'|'+Math.round(arena.charge*10)+'|'+fps+'|'+arena.score+'|'+sound.enabled;if(text===lastHud)return;lastHud=text;const c=hud.c.getContext('2d');c.clearRect(0,0,1280,320);c.fillStyle='rgba(5,12,22,.8)';c.fillRect(0,0,1280,320);c.strokeStyle='#536f8d';c.strokeRect(2,2,1276,316);c.fillStyle='#c8e5ff';c.font='34px sans-serif';c.fillText(arena.school.role+' / '+arena.school.zh,32,58);c.fillStyle='#fff';c.font='29px sans-serif';c.fillText(state.slice(0,58),32,118);c.fillStyle='#abbcce';c.font='24px sans-serif';c.fillText('拳：召唤/蓄力   指：发射   掌：次级   双拳→右掌：超能',32,174);c.fillText('左掌：六系菜单   '+(sound.enabled?'SOUND ON':'SOUND OFF')+'   '+fps+' FPS   '+arena.score+' PT',32,222);c.fillStyle='#91cfff';c.fillRect(32,265,Math.max(2,arena.charge/3*1200),5);hud.tex.needsUpdate=true;}
function valid(p){return Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);}
function bend(a,b,c){if(!valid(a)||!valid(b)||!valid(c))return null;const u=V.sub(a,b),v=V.sub(c,b),n=V.len(u)*V.len(v);if(n<1e-8)return null;return 180-Math.acos(Math.max(-1,Math.min(1,V.dot(u,v)/n)))*180/Math.PI;}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function readHand(source,frame,ref){
 const spaces=JOINTS.map(n=>source.hand.get(n)),matrices=caches[source.handedness];let ok=false;
 if(frame.fillPoses&&spaces.every(Boolean)){try{ok=frame.fillPoses(spaces,ref,matrices);}catch{}}
 const p=spaces.map((space,i)=>{if(ok)return [matrices[i*16+12],matrices[i*16+13],matrices[i*16+14]];if(!space)return null;const pose=frame.getJointPose(space,ref);return pose?[pose.transform.position.x,pose.transform.position.y,pose.transform.position.z]:null;});
 for(let i=0;i<p.length;i++)if(valid(p[i])){vec.fromArray(p[i]);root.worldToLocal(vec);p[i]=vec.toArray();}
 // Partial occlusion of an unused joint does not discard the entire hand.
 const knuckles=[5,10,15,20].map(i=>p[i]).filter(valid);if(knuckles.length<2||!valid(p[0]))return null;
 const palm=knuckles.reduce((a,b)=>V.add(a,b),[0,0,0]).map(v=>v/knuckles.length),angles=[6,11,16,21].map(i=>bend(p[i],p[i+1],p[i+2]));
 const extended=angles.map(a=>a!==null&&a<59),curled=angles.map(a=>a!==null&&a>57);const open=extended.filter(Boolean).length>=3&&extended[0];const fist=curled.filter(Boolean).length>=3;
 const pointer=extended[0]&&(extended[1]||curled[1])&&(curled[2]||curled[3]);let kind=fist?'fist':open?'open':pointer?'sword':'neutral';
 let direction=viewer.forward;const finger=valid(p[9])&&valid(p[6])?V.norm(V.sub(p[9],p[6])):null;
 if(finger){direction=finger;if(extended[1]&&valid(p[14])&&valid(p[11]))direction=V.norm(V.add(finger,V.norm(V.sub(p[14],p[11]))));}
 const across=valid(p[5])&&valid(p[20])?V.sub(p[5],p[20]):null,long=V.sub(palm,p[0]);let normal=across?V.norm(cross(across,long)):viewer.forward;
 const toEye=V.norm(V.sub(viewer.p,palm)),facing=Math.abs(V.dot(normal,toEye))>.65,visible=V.dot(V.norm(V.sub(palm,viewer.p)),viewer.forward)>.72&&V.len(V.sub(palm,viewer.p))<1.1;
 if(V.dot(normal,viewer.forward)<0)normal=normal.map(v=>-v);if(kind!=='sword')direction=V.norm(V.add(V.mul(normal,.75),V.mul(viewer.forward,.25)));
 return {kind,point:palm,direction,menuFacing:facing&&visible,stale:false};
}
function localViewer(pose){const p=pose.transform.position,r=pose.transform.orientation;vec.set(p.x,p.y,p.z);root.worldToLocal(vec);viewer.p=vec.toArray();q.set(r.x,r.y,r.z,r.w);viewer.quat.copy(root.quaternion).invert().multiply(q);viewer.forward=new T.Vector3(0,0,-1).applyQuaternion(viewer.quat).toArray();viewer.right=new T.Vector3(1,0,0).applyQuaternion(viewer.quat).toArray();viewer.up=new T.Vector3(0,1,0).applyQuaternion(viewer.quat).toArray();}
function xrInput(frame,ms){const hands={left:null,right:null},ref=renderer.xr.getReferenceSpace();tracked=0;if(!frame||!ref)return hands;const view=frame.getViewerPose(ref);if(!view)return hands;
 if(!anchored){const p=view.transform.position,r=view.transform.orientation;q.set(r.x,r.y,r.z,r.w);vec.set(0,0,-1).applyQuaternion(q);root.position.set(p.x,p.y,p.z);root.rotation.set(0,Math.atan2(-vec.x,-vec.z),0);root.updateMatrixWorld(true);anchored=true;}
 localViewer(view);const seen=new Set();for(const source of session.inputSources){if(!['left','right'].includes(source.handedness))continue;const side=source.handedness;seen.add(side);if(source.hand){const sample=readHand(source,frame,ref);if(sample)tracked++;hands[side]=holds[side].update(sample,ms);}else{const pose=frame.getPose(source.targetRaySpace,ref);if(pose){const p=pose.transform.position,r=pose.transform.orientation;vec.set(p.x,p.y,p.z);root.worldToLocal(vec);const point=vec.toArray();q.set(r.x,r.y,r.z,r.w);const dir=new T.Vector3(0,0,-1).applyQuaternion(q);dir.transformDirection(new T.Matrix4().copy(root.matrixWorld).invert());const buttons=source.gamepad?.buttons||[];hands[side]={point,direction:dir.toArray(),kind:buttons[1]?.pressed?'fist':buttons[0]?.pressed?'sword':buttons[4]?.pressed?'open':'neutral',stale:false,menuFacing:false};tracked++;}}}
 for(const side of ['left','right'])if(!seen.has(side))hands[side]=holds[side].update(null,ms);return hands;
}
function updateMenu(hands,ms){const l=hands.left,r=hands.right,show=l?.kind==='open'&&l.menuFacing&&!l.stale;
 if(show){leftLost=null;leftSince??=ms;if(ms-leftSince>170)menuOn=true;}else{leftSince=null;leftLost??=ms;if(ms-leftLost>230&&!wheelAnchor)menuOn=false;}
 wheel.mesh.visible=menuOn;wheelCursor.visible=menuOn&&!!r&&!r.stale;
 if(!menuOn){wheelAnchor=null;wheelChoice=wheelCandidate=-1;lastHeld=r?.kind||'neutral';return false;}
 const centre=l?.point||V.add(viewer.p,V.add(V.mul(viewer.forward,.55),V.mul(viewer.right,-.25)));
 wheel.mesh.position.fromArray(V.add(centre,V.add(V.mul(viewer.up,.18),V.mul(viewer.forward,.12))));wheel.mesh.quaternion.copy(viewer.quat);
 if(r&&!r.stale){if(r.kind==='fist'){
   if(!wheelAnchor){wheelAnchor=r.point.slice();wheelChoice=wheelCandidate=-1;}
   const delta=V.sub(r.point,wheelAnchor),dx=V.dot(delta,viewer.right),dy=V.dot(delta,viewer.up),sector=Math.hypot(dx,dy)<.075?-1:((Math.round((Math.PI/2-Math.atan2(dy,dx))/(Math.PI/4))%8)+8)%8;
   if(sector!==wheelCandidate){wheelCandidate=sector;wheelSince=ms;}else if(ms-wheelSince>75)wheelChoice=sector;
   const marker=V.add(wheel.mesh.position.toArray(),V.add(V.mul(viewer.right,dx*1.35),V.mul(viewer.up,dy*1.35)));wheelCursor.position.fromArray(marker);wheelCursor.position.addScaledVector(new T.Vector3(...viewer.forward),-.01);
  }else if(wheelAnchor){const selected=wheelChoice;wheelAnchor=null;wheelChoice=wheelCandidate=-1;if(selected>=0){if(selected<6)choose(SCHOOLS[selected].id);else if(selected===6)queued='super';else{arena.reset();visuals.clear();}menuOn=false;leftSince=null;blockedUntil=ms+350;control.reset();}}}
 else {wheelAnchor=null;wheelChoice=wheelCandidate=-1;}
 paintWheel();return menuOn||show||ms<blockedUntil;
}
async function enter(mode){if(!navigator.xr||session)return;let s=null;try{const request=navigator.xr.requestSession(mode,{optionalFeatures:['hand-tracking']});unlock();s=await request;session=s;sessionMode=mode;anchored=false;previousTime=0;holds.left.reset();holds.right.reset();control.reset();menuOn=false;
 // The desktop camera transform must NOT be added to WebXR reference-space poses.
 camera.position.set(0,0,0);camera.quaternion.identity();camera.updateMatrixWorld(true);renderer.setClearColor(0x090c12,mode==='immersive-ar'?0:1);
 s.addEventListener('end',()=>{session=null;sessionMode='';anchored=false;root.position.set(0,0,0);root.quaternion.identity();root.updateMatrixWorld(true);camera.position.copy(desktopCamera.p);camera.quaternion.copy(desktopCamera.q);camera.updateMatrixWorld(true);renderer.setClearColor(0x090c12,1);document.body.classList.remove('xr');menuOn=false;wheel.mesh.visible=hud.mesh.visible=false;control.reset();previousTime=0;});
 s.addEventListener('visibilitychange',()=>{if(s.visibilityState!=='visible'){holds.left.reset();holds.right.reset();control.reset();desktopAction=null;}});
 await renderer.xr.setSession(s);document.body.classList.add('xr');
 }catch(e){$('readiness').textContent='XR FAILED: '+String(e.message||e);if(s)void s.end();session=null;camera.position.copy(desktopCamera.p);camera.quaternion.copy(desktopCamera.q);}}
$('ar').onclick=()=>void enter('immersive-ar');$('vr').onclick=()=>void enter('immersive-vr');
if(navigator.xr){Promise.all(['immersive-ar','immersive-vr'].map(m=>navigator.xr.isSessionSupported(m))).then(([ar,vr])=>{$('ar').disabled=!ar;$('vr').disabled=!vr;}).catch(()=>{});}
function draw(ms,frame){const dt=previousTime?Math.max(0,Math.min(.05,(ms-previousTime)/1000)):1/90;previousTime=ms;
 let input,blocked=false;handData=session?xrInput(frame,ms):{left:null,right:{kind:desktopAction==='collect'?'fist':desktopAction==='primary'?'sword':'neutral',point:[.53,-.39,.25],direction:[0,0,-1],stale:false}};
 if(session){blocked=updateMenu(handData,ms);input=control.update(handData,ms,blocked);}else input={collect:desktopAction==='collect',primary:desktopAction==='primary'};
 const hand=handData.right;visuals.hand(hand?.point||[.53,-.39,.25],hand?.direction||[0,0,-1],!session||!!hand,arena.charge);
 const muzzle=visuals.muzzle();let direction=hand?.direction||[0,0,-1];if(!session){camera.updateMatrixWorld(true);raycaster.setFromCamera(pointer,camera);if(raycaster.ray.intersectPlane(plane,hit))direction=V.norm(V.sub(hit.toArray(),muzzle));}
 const lock=aim(muzzle,direction,arena.targets);input.point=muzzle;input.direction=lock.direction;input.paused=blocked;
 if(queued&&!blocked){input[queued]=true;queued=null;}
 const events=arena.advance(dt,input);for(const e of events){visuals.event(e);sound.event(e);if(e.type==='complete'&&!session){$('session-result').style.display='block';$('result-values').textContent=arena.score+' 分 · 命中 '+arena.hits+' · 冻结 '+arena.freezes+' · 碎冰 '+arena.shatters;}}
 sound.update(arena.school.id,arena.charge,!!input.primary);visuals.update(arena,dt,blocked?null:lock,ms/1000);
 frameCount++;if(ms-fpsAt>1000){fps=Math.round(frameCount*1000/(ms-fpsAt));fpsAt=ms;frameCount=0;}
 hud.mesh.visible=!!session;if(session){hud.mesh.position.fromArray(V.add(viewer.p,V.add(V.mul(viewer.forward,1.25),V.mul(viewer.up,-.56))));hud.mesh.quaternion.copy(viewer.quat);}
 if(ms-statusAt>130){statusAt=ms;const gesture=hand?.kind||'NO HAND';$('readiness').textContent=(session?'QUEST XR · '+tracked+' INPUTS':'DESKTOP MOCK')+' / '+arena.school.en;$('stats').textContent='SCORE '+arena.score+'\nFROZEN '+arena.frozenCount+' / SHATTER '+arena.shatters+'\nCHARGE '+arena.charge.toFixed(1)+' / 3\n'+fps+' FPS'+(arena.session.active?'\nTIME '+Math.ceil(90-arena.session.elapsed)+'s':'');$('live-msg').textContent=menuOn?'选择六系 · 右拳方向 / 松拳确认':control.armed?'超能已就绪 · 张开右掌':arena.notice;$('reticle').classList.toggle('locked',lock.locked);$('reticle').style.display=session?'none':'block';paintHud(ms);}
 renderer.render(scene,camera);
}
choose('stasis');renderer.setAnimationLoop(draw);
// Read-only QA snapshot; desktop controls are the same public controls the user can click.
window.__WARLOCK__={choose,action,snapshot:()=>({school:arena.school.id,score:arena.score,hits:arena.hits,freezes:arena.freezes,shatters:arena.shatters,frozen:arena.frozenCount,projectiles:arena.projectiles.length,fields:arena.fields.length,charge:arena.charge,superCooldown:arena.superCooldown,beam:arena.beam,transcendent:arena.transcendent,sound:sound.diagnostics(),xr:!!session,menu:menuOn,session:{...arena.session}})};
