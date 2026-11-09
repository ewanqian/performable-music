import * as T from 'three';
import {WarlockArena,SCHOOLS,aimAt,clamp,norm,add,mul} from './core.mjs';
import {HandInput,SchoolWheel} from './input.mjs';
import {WarlockView} from './view.mjs';
import {ElementAudio} from './audio.mjs';
const $=id=>document.getElementById(id);
const renderer=new T.WebGLRenderer({canvas:$('scene'),alpha:true,antialias:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight);renderer.setClearColor(0x0a101a,1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');
const scene=new T.Scene(),camera=new T.PerspectiveCamera(64,innerWidth/innerHeight,.015,60);camera.position.set(0,.08,1.65);
const view=new WarlockView(renderer,scene),arena=new WarlockArena(),audio=new ElementAudio(),input=new HandInput(),wheel=new SchoolWheel();
let session=null,mode='',anchored=false,hold=false,mockPalm=false,grip=false,pointer=new T.Vector2(.05,-.06),last=0,hudTime=0,fps=0,frames=0,fpsTime=0,audioMuted=false,pendingAudio=false;
let menu=wheel.update({},{},0),rightPose=null,handCount=0;
const raycaster=new T.Raycaster(),aimPlane=new T.Plane(new T.Vector3(0,0,1),2.55),cursorHit=new T.Vector3(),point=new T.Vector3(),direction=new T.Vector3(),q=new T.Quaternion(),up=new T.Vector3(0,1,0),inverse=new T.Quaternion();
function refresh(){
 const s=arena.spec;document.documentElement.style.setProperty('--accent','#'+s.color.toString(16).padStart(6,'0'));document.body.dataset.school=s.id;
 $('school-title').textContent=s.zh+' / '+s.name;$('school-hint').textContent=s.hint;$('primary').textContent=s.primary+' / 2';$('secondary').textContent=s.secondary+' / 3';
 for(const b of $('schools').children)b.setAttribute('aria-pressed',String(Number(b.dataset.index)===arena.school));
}
SCHOOLS.forEach((s,i)=>{const b=document.createElement('button');b.dataset.index=i;b.dataset.school=s.id;const strong=document.createElement('strong');strong.textContent=s.zh;const small=document.createElement('small');small.textContent=s.id.toUpperCase();b.append(strong,small);b.addEventListener('click',()=>select(i));$('schools').append(b);});
function select(i){arena.select(i);view.clear();hold=false;$('stream').setAttribute('aria-pressed','false');refresh();}
function audioUI(){ $('audio').textContent=audio.enabled?'声音 OFF':'声音 ON';$('audio').setAttribute('aria-pressed',String(audio.enabled));$('audio-status').textContent=audio.error?'声音启动失败：'+audio.error:audio.enabled?'声音已启动 · ORIGINAL SYNTH / 非原声':'声音已静音';}
function unlock(){if(audioMuted||audio.enabled||pendingAudio)return;pendingAudio=true;void audio.start().then(()=>{pendingAudio=false;audioUI();});}
$('audio').addEventListener('click',()=>{if(audio.enabled){audioMuted=true;audio.mute();audioUI();}else{audioMuted=false;unlock();}});
$('volume').addEventListener('input',e=>audio.level(e.target.value));
$('sound-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const slot=arena.spec.id+':'+$('sound-slot').value,duration=await audio.load(file,slot);$('audio-status').textContent='本地替换 '+slot+' · '+duration.toFixed(2)+'s；未上传';}catch(err){$('audio-status').textContent=String(err.message||err);}});
function desktop(){
 camera.updateMatrixWorld();raycaster.setFromCamera(pointer,camera);const hit=raycaster.ray.intersectPlane(aimPlane,cursorHit)||new T.Vector3(0,0,-2.55);
 const palm=mockPalm?[pointer.x*.7,pointer.y*.5,.22]:[.43,-.32,.18];const shaft=[-.13,.98,-.12];const kind=grip?'fist':hold?'sword':'neutral';
 const origin=arena.spec.id==='stasis'&&arena.equipped?add(palm,mul(norm(shaft),.79)):palm;
 const d=norm([hit.x-origin[0],hit.y-origin[1],hit.z-origin[2]]);
 return {right:{kind,point:palm.slice(),palm,shaft,direction:d,hand:'right',stale:false,facing:false},left:mockPalm?{kind:'open',point:[-.3,.04,.3],palm:[-.3,.04,.3],shaft:[0,1,0],direction:[0,0,-1],facing:true,hand:'left',stale:false}:null};
}
function muzzle(hand){if(!hand)return null;const p=hand.palm||hand.point,shaft=norm(hand.shaft||[0,1,0]);return arena.equipped&&arena.school===0?add(p,mul(shaft,.79)):arena.equipped&&arena.school===1?add(p,mul(shaft,.48)):hand.point;}
function feedback(events){view.events(events);for(const e of events)audio.event(e);}
function action(which){unlock();const h=rightPose||desktop().right;arena.events=[];if(which==='summon'){arena.summon(h.palm);hold=false;}else if(which==='primary'){arena.summon(h.palm);const actual=desktop().right;arena.primary(muzzle(session?h:actual),h.direction,true);}else arena.secondary(muzzle(h),true);feedback(arena.events);}
$('summon').addEventListener('click',()=>action('summon'));$('primary').addEventListener('click',()=>action('primary'));$('secondary').addEventListener('click',()=>action('secondary'));
$('stream').addEventListener('click',()=>{unlock();hold=!hold;$('stream').setAttribute('aria-pressed',String(hold));});
$('reset').addEventListener('click',()=>{arena.reset();view.clear();hold=false;refresh();});
$('mock-menu').addEventListener('click',()=>{mockPalm=!mockPalm;hold=false;grip=false;$('mock-menu').setAttribute('aria-pressed',String(mockPalm));});
function move(e){pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);}
$('scene').addEventListener('pointermove',move);$('scene').addEventListener('pointerdown',e=>{move(e);unlock();if(mockPalm){grip=true;$('scene').setPointerCapture(e.pointerId);}else action('primary');});
$('scene').addEventListener('pointerup',e=>{grip=false;try{$('scene').releasePointerCapture(e.pointerId);}catch{}});$('scene').addEventListener('pointercancel',()=>{grip=false;wheel.reset();});
addEventListener('keydown',e=>{if(e.repeat||/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;const k=e.code;if(k==='Digit1')action('summon');if(k==='Digit2')action('primary');if(k==='Digit3')action('secondary');if(/^Digit[4-9]$/.test(k))select(Number(k.at(-1))-4);if(k==='KeyM')$('mock-menu').click();if(k==='Space'){e.preventDefault();$('stream').click();}if(k==='Escape'){hold=false;grip=false;mockPalm=false;wheel.reset();}});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
function anchor(frame,ref){const pose=frame.getViewerPose(ref);if(!pose)return null;const p=pose.transform.position,r=pose.transform.orientation;q.set(r.x,r.y,r.z,r.w);direction.set(0,0,-1).applyQuaternion(q);if(!anchored){view.root.position.set(p.x+direction.x*.7,p.y-.06,p.z+direction.z*.7);view.root.quaternion.setFromAxisAngle(up,Math.atan2(-direction.x,-direction.z));view.root.updateMatrixWorld(true);anchored=true;}inverse.copy(view.root.quaternion).invert();return {position:view.root.worldToLocal(new T.Vector3(p.x,p.y,p.z)).toArray(),forward:direction.applyQuaternion(inverse).normalize().toArray()};}
function xrRead(frame,time){const ref=renderer.xr.getReferenceSpace();if(!frame||!ref)return {};const viewer=anchor(frame,ref);if(!viewer)return {};const transform={point:p=>view.root.worldToLocal(point.fromArray(p)).toArray(),direction:d=>direction.fromArray(d).applyQuaternion(inverse).normalize().toArray()};return input.read(frame,session,ref,transform,viewer,time);}
async function enter(which){if(!navigator.xr||session)return;let s=null;try{const request=navigator.xr.requestSession(which,{optionalFeatures:['hand-tracking']});unlock();s=await request;session=s;mode=which;anchored=false;input.reset();wheel.reset();arena.reset();view.clear();last=0;s.addEventListener('end',()=>{session=null;mode='';anchored=false;document.body.classList.remove('xr');renderer.setClearColor(0x0a101a,1);view.root.position.set(0,0,0);view.root.quaternion.identity();view.root.updateMatrixWorld(true);camera.position.set(0,.08,1.65);camera.quaternion.identity();input.reset();wheel.reset();arena.reset();view.clear();last=0;}, {once:true});await renderer.xr.setSession(s);renderer.setClearColor(0x000000,which==='immersive-ar'?0:1);document.body.classList.add('xr');$('xr-status').textContent='XR 已进入 · 放下控制器，展示双手';}catch(e){if(s)await s.end().catch(()=>{});session=null;document.body.classList.remove('xr');$('xr-status').textContent='无法进入 XR：'+String(e.message||e);}}
$('mr').addEventListener('click',()=>void enter('immersive-ar'));$('vr').addEventListener('click',()=>void enter('immersive-vr'));$('exit').addEventListener('click',()=>session?.end());
if(navigator.xr){Promise.all(['immersive-ar','immersive-vr'].map(m=>navigator.xr.isSessionSupported(m))).then(([ar,vr])=>{$('mr').disabled=!ar;$('vr').disabled=!vr;$('xr-status').textContent=ar?'MR 可用 · 支持手部追踪的 Quest Browser':vr?'VR 可用 · MR 不可用':'浏览器未报告沉浸式支持';}).catch(e=>{$('xr-status').textContent=String(e.message);});}else $('xr-status').textContent='桌面预览 · 请在 Quest Browser 打开同一网址';
refresh();
renderer.setAnimationLoop((time,frame)=>{
 const dt=last?clamp((time-last)/1000,0,.045):1/90;last=time;const hands=session?xrRead(frame,time):desktop();rightPose=hands.right||hands.left||null;handCount=Object.values(hands).filter(h=>h&&!h.stale).length;
 menu=wheel.update(hands.left,hands.right,time);if(menu.selected!==null){select(menu.selected);audio.tone(450,780,.18,.045);}
 const castHand=rightPose?{...rightPose,point:muzzle(rightPose)}:null;
 const events=arena.step(dt,castHand,{menu:menu.suppress,bothOpen:hands.left?.kind==='open'&&hands.right?.kind==='open'});feedback(events);
 const aim=castHand?aimAt(castHand.point,castHand.direction,arena.targets):null;
 view.draw(dt,arena,rightPose,aim,menu,Boolean(session),mode==='immersive-ar');
 frames++;if(time-fpsTime>1000){fps=frames;frames=0;fpsTime=time;}
 if(time-hudTime>120){hudTime=time;const frozen=arena.targets.filter(t=>t.freeze>0&&t.dead<=0).length;$('metrics').textContent=(session?'XR / REAL HANDS':'DESKTOP / MOCK')+'\n'+arena.spec.name+'\nSCORE '+arena.score+' · HITS '+arena.hits+'\nFROZEN '+frozen+' · SHATTER '+arena.shatters+'\nFPS '+fps+' · '+(session?'HANDS '+handCount:'KEYBOARD / POINTER')+(arena.school===5?'\nLIGHT '+Math.round(arena.light*100)+' / DARK '+Math.round(arena.dark*100):'');$('event').textContent=menu.active?'左掌菜单已打开 · 右拳六方向选择':arena.note;$('meter span').style.width=Math.round(arena.charge*100)+'%';document.body.dataset.equipped=String(arena.equipped);document.body.dataset.frozen=String(frozen);document.body.dataset.score=String(arena.score);document.body.dataset.menu=String(menu.active);document.body.dataset.school=arena.spec.id;}
 renderer.render(scene,camera);
});
