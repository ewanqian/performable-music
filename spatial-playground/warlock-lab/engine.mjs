// Original WebXR fan interaction study. Names identify references; timings and rules are adaptations.
export const SCHOOLS = Object.freeze([
 {id:'stasis',zh:'冰影',en:'STASIS',role:'SHADEBINDER',color:0x91cfff,accent:0x5265ff,prop:'staff',reference:'Winter’s Wrath',primary:'冻结冰弹',secondary:'震荡碎冰',super:'凛冬之怒 · 冻结后碎裂',hint:'握拳唤出冰杖 → 剑指冻结 → 张掌碎冰',chapter:'FREEZE / FRACTURE'},
 {id:'solar',zh:'烈日',en:'SOLAR',role:'DAWNBLADE',color:0xffc17a,accent:0xff6233,prop:'blade',reference:'Daybreak / Well of Radiance',primary:'炽焰飞刃',secondary:'炽光领域',super:'拂晓 · 七道火刃',hint:'握拳凝聚焰刃 → 剑指挥出 → 张掌展开光域',chapter:'IGNITE / RADIATE'},
 {id:'void',zh:'虚空',en:'VOID',role:'VOIDWALKER',color:0xccb3ff,accent:0x713dff,prop:'orb',reference:'Nova Bomb / Vortex',primary:'新星引力弹',secondary:'引力漩涡',super:'新星爆发 · 追踪碎片',hint:'握拳压缩虚空 → 剑指投出新星 → 张掌引力场',chapter:'COLLAPSE / DETONATE'},
 {id:'arc',zh:'电弧',en:'ARC',role:'STORMCALLER',color:0xc9f5ff,accent:0x53a5ff,prop:'arc',reference:'Stormtrance / Chaos Reach',primary:'持续连锁电弧',secondary:'雷霆脉冲',super:'混沌之触 · 持续光束',hint:'剑指持续导电 → 张掌扩散 → 超能释放光束',chapter:'CONDUCT / OVERLOAD'},
 {id:'strand',zh:'缚丝',en:'STRAND',role:'BROODWEAVER',color:0xbfffa9,accent:0x47d989,prop:'weave',reference:'Needlestorm / Threadlings',primary:'追踪奥术针',secondary:'召唤线虫',super:'织针风暴',hint:'握拳编织 → 剑指追踪针 → 张掌召唤线虫',chapter:'WEAVE / SEEK'},
 {id:'prismatic',zh:'棱镜',en:'PRISMATIC',role:'LIGHT + DARK',color:0xffc2eb,accent:0x998dff,prop:'prism',reference:'Transcendence / Freezing Singularity',primary:'明暗交替投射',secondary:'冻结奇点',super:'超越 · 混合能力',hint:'握拳积暗能、剑指积光能 → 超越 → 混合释放',chapter:'CONVERGE / TRANSCEND'}
]);
const C=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
export const V={add:(a,b)=>a.map((v,i)=>v+b[i]),sub:(a,b)=>a.map((v,i)=>v-b[i]),mul:(a,n)=>a.map(v=>v*n),dot:(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),len:a=>Math.hypot(...a)};
V.norm=a=>V.mul(a,1/(V.len(a)||1));
const finite=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
export function segmentDistance(p,a,b){const d=V.sub(b,a),n=V.dot(d,d),t=n>1e-10?C(V.dot(V.sub(p,a),d)/n,0,1):0;return V.len(V.sub(p,V.add(a,V.mul(d,t))));}
export function aim(origin,direction,targets,cone=.94){
 const d=V.norm(direction);let best=null,score=-1;
 for(const t of targets){if(t.dead>0)continue;const delta=V.sub(t.p,origin),distance=V.len(delta),unit=V.norm(delta),cos=V.dot(d,unit);if(cos<cone||distance<.1)continue;const s=cos-distance*.001;if(s>score){score=s;best=t;}}
 const target=best?best.p:V.add(origin,V.mul(d,5));
 // Preview and projectile share this exact direction; no invisible second correction.
 return {id:best?.id??null,point:target.slice(),direction:best?V.norm(V.sub(target,origin)):d,locked:!!best};
}
export class WarlockArena{
 constructor(id='stasis'){this.sequence=0;this.choose(id);}
 choose(id){this.school=SCHOOLS.find(s=>s.id===id)||SCHOOLS[0];this.reset();}
 reset(){
  this.t=0;this.charge=0;this.cooldown=0;this.altCooldown=0;this.superCooldown=0;this.transcendent=0;this.beam=0;this.light=0;this.dark=0;
  this.score=0;this.hits=0;this.freezes=0;this.shatters=0;this.casts=0;this.projectiles=[];this.fields=[];this.events=[];this.pending=[];this.notice='握拳召唤 · 剑指发射 · 张掌次级';
  this.targets=Array.from({length:7},(_,i)=>{const x=(i-3)*.79,z=-3.35-(i%2)*.7,y=-.08+Math.sin(i*1.6)*.25;return {id:i,base:[x,y,z],p:[x,y,z],hp:2,dead:0,frozen:0,burn:0,tint:0};});
  this.session={active:false,duration:90,elapsed:0,done:false};
 }
 emit(type,data={}){this.events.push({type,t:this.t,school:this.school.id,...data});}
 startSession(){this.reset();this.session.active=true;this.notice='90 秒挑战开始：冻结 → 碎冰';}
 get frozenCount(){return this.targets.filter(t=>t.frozen>0&&t.dead<=0).length;}
 collect(dt){this.charge=C(this.charge+dt*.72,0,3);if(this.school.id==='prismatic')this.dark=C(this.dark+dt*.24,0,1);}
 projectile(kind,p,d,extra={}){
  if(this.projectiles.length>=80||!finite(p)||!finite(d))return;
  const speed=kind==='nova'?2.4:kind==='threadling'?3.2:kind==='needle'?7.5:6.0;
  const item={id:++this.sequence,kind,p:p.slice(),previous:p.slice(),v:V.mul(V.norm(d),speed),ttl:5,power:1,homing:false,trail:[],...extra};
  this.projectiles.push(item);return item;
 }
 freeze(t,duration=4.6){if(!t||t.dead>0)return;if(t.frozen<=0){this.freezes++;this.emit('freeze',{p:t.p.slice(),target:t.id});}t.frozen=Math.max(t.frozen,duration);}
 damage(t,amount=1,kind='hit'){
  if(!t||t.dead>0)return;this.hits++;this.score+=10;t.hp-=amount;t.tint=.15;
  this.emit('hit',{p:t.p.slice(),kind,target:t.id});
  if(t.hp<=0){t.dead=2.3;t.hp=2;this.score+=30;this.emit('destroy',{p:t.p.slice(),kind});}
 }
 shatter(origin=[0,0,0],range=9){let count=0;for(const t of this.targets)if(t.dead<=0&&t.frozen>0&&V.len(V.sub(t.p,origin))<range){const p=t.p.slice();t.frozen=0;this.shatters++;this.score+=35;this.damage(t,3,'shatter');this.emit('shatter',{p,target:t.id});count++;}this.emit('wave',{p:origin.slice(),radius:range,kind:'ice'});this.notice=count?'碎裂 '+count+' 个目标':'先用冰弹冻结目标，再张掌碎冰';return count;}
 primary(p,d){
  if(this.cooldown>0||this.session.done)return false;
  const id=this.school.id,power=this.charge;this.charge=0;this.casts++;
  const lock=aim(p,d,this.targets),dir=lock.direction;
  if(id==='stasis'){for(let i=0;i<(power>1.3?3:1);i++)this.projectile('ice',V.add(p,[(i-1)*.025,0,0]),dir,{target:lock.id});this.cooldown=.34;this.notice='冰弹命中后，张掌碎冰';}
  if(id==='solar'){this.projectile('blade',p,dir,{power:1+power});this.cooldown=.36;}
  if(id==='void'){this.projectile('nova',p,dir,{power:1+power,homing:true,target:lock.id});this.cooldown=.7;}
  if(id==='arc'){this.chain(p,dir,this.beam>0?3:1);this.cooldown=.13;}
  if(id==='strand'){for(let i=0;i<3;i++)this.projectile('needle',V.add(p,[(i-1)*.08,.04,0]),dir,{homing:true,target:lock.id});this.cooldown=.42;}
  if(id==='prismatic'){this.light=C(this.light+.13,0,1);const k=this.casts%2?'ice':'blade';this.projectile(k,p,dir,{power:1.4,homing:true,target:lock.id});if(this.transcendent>0)for(const kind of ['nova','needle'])this.projectile(kind,p,dir,{power:1,homing:true,target:lock.id});this.cooldown=.38;}
  this.emit('cast',{p:p.slice(),direction:dir,power,kind:id});return true;
 }
 chain(p,d,power=1){
  const lock=aim(p,d,this.targets,.84);const first=this.targets.find(t=>t.id===lock.id);const path=[p.slice()];
  if(first){const others=this.targets.filter(t=>t!==first&&t.dead<=0).sort((a,b)=>V.len(V.sub(a.p,first.p))-V.len(V.sub(b.p,first.p))).slice(0,2);for(const t of [first,...others]){path.push(t.p.slice());this.damage(t,.14*power,'arc');}}
  else path.push(V.add(p,V.mul(d,4)));
  this.emit('chain',{points:path,power});
 }
 secondary(p,d){
  if(this.altCooldown>0||this.session.done)return false;this.altCooldown=.75;const id=this.school.id;
  const lock=aim(p,d,this.targets),centre=lock.locked?lock.point:V.add(p,V.mul(d,2.8));
  if(id==='stasis')this.shatter(p,9);
  if(id==='solar'){this.fields.push({kind:'solar',p:centre,ttl:3,radius:1.25,tick:0});this.emit('field',{p:centre,kind:'solar'});this.notice='炽光领域持续灼烧 · 体验转译';}
  if(id==='void'){this.fields.push({kind:'void',p:centre,ttl:3.1,radius:1.55,tick:0});this.emit('field',{p:centre,kind:'void'});this.notice='引力漩涡已展开';}
  if(id==='arc'){this.chain(p,d,5);this.emit('wave',{p:p.slice(),radius:3.2,kind:'arc'});}
  if(id==='strand'){for(let i=0;i<5;i++)this.projectile('threadling',V.add(p,[(i-2)*.1,-.35,0]),d,{homing:true,target:this.targets[i%7].id});this.notice='线虫追踪已召唤';}
  if(id==='prismatic'){this.dark=C(this.dark+.2,0,1);for(const t of this.targets)if(t.dead<=0&&V.len(V.sub(t.p,centre))<1.5)this.freeze(t,3);this.fields.push({kind:'prismatic',p:centre,ttl:2.8,radius:1.5,tick:0});this.emit('field',{p:centre,kind:'prismatic'});}
  this.emit('secondary',{p:p.slice(),kind:id});return true;
 }
 super(p,d){
  if(this.superCooldown>0||this.session.done)return false;this.superCooldown=7;const id=this.school.id;
  this.emit('super',{p:p.slice(),kind:id});this.notice=this.school.super;
  if(id==='stasis'){for(const t of this.targets)if(t.dead<=0)this.freeze(t,5);this.pending.push({at:this.t+.65,kind:'shatter',p:p.slice()});}
  if(id==='solar'){for(const t of this.targets)if(t.dead<=0)this.projectile('blade',p,V.sub(t.p,p),{power:3,target:t.id});this.fields.push({kind:'solar',p:[0,-.35,-2.7],ttl:4,radius:2.8,tick:0});}
  if(id==='void'){const lock=aim(p,d,this.targets);this.projectile('nova',p,lock.direction,{power:5,homing:true,target:lock.id});}
  if(id==='arc'){this.beam=3.2;}
  if(id==='strand'){for(let i=0;i<14;i++){const t=this.targets[i%7];this.projectile('needle',V.add(p,[(i%7-3)*.07,.1+Math.floor(i/7)*.1,0]),V.sub(t.p,p),{power:2,homing:true,target:t.id,spawnling:true});}}
  if(id==='prismatic'){this.transcendent=7;this.light=this.dark=1;for(const t of this.targets)if(t.dead<=0){this.projectile(t.id%2?'blade':'ice',p,V.sub(t.p,p),{target:t.id,power:2,homing:true});}}
  return true;
 }
 advance(dt,input={}){
  dt=C(dt,0,.05);this.events=[];this.t+=dt;
  for(const key of ['cooldown','altCooldown','superCooldown','transcendent','beam'])this[key]=Math.max(0,this[key]-dt);
  if(this.session.active){this.session.elapsed=Math.min(this.session.duration,this.session.elapsed+dt);if(this.session.elapsed>=this.session.duration){this.session.active=false;this.session.done=true;this.emit('complete',{score:this.score,hits:this.hits,freezes:this.freezes,shatters:this.shatters});}}
  for(const target of this.targets){target.dead=Math.max(0,target.dead-dt);target.tint=Math.max(0,target.tint-dt);target.frozen=Math.max(0,target.frozen-dt);if(target.dead<=0&&target.frozen<=0){target.p[0]+=((target.base[0]+Math.sin(this.t*.55+target.id)*.12)-target.p[0])*Math.min(1,dt*3);target.p[1]=target.base[1]+Math.cos(this.t*.45+target.id)*.06;target.p[2]+=(target.base[2]-target.p[2])*Math.min(1,dt*3);}}
  const p=finite(input.point)?input.point:[.5,-.28,.2],d=V.norm(finite(input.direction)?input.direction:[0,0,-1]);
  if(!input.paused&&!this.session.done){if(input.collect)this.collect(dt);if(input.primary)this.primary(p,d);if(input.secondary)this.secondary(p,d);if(input.super)this.super(p,d);if(this.beam>0&&this.cooldown<=0){this.chain(p,d,4);this.cooldown=.1;}}
  for(const action of this.pending.filter(a=>a.at<=this.t)){if(action.kind==='shatter')this.shatter(action.p,12);}this.pending=this.pending.filter(a=>a.at>this.t);
  const spawned=[];
  for(const shot of this.projectiles){shot.ttl-=dt;if(shot.ttl<=0)continue;shot.previous=shot.p.slice();shot.trail.unshift(shot.p.slice());if(shot.trail.length>8)shot.trail.pop();
   if(shot.homing){let target=this.targets.find(t=>t.id===shot.target&&t.dead<=0);if(!target){target=this.targets.filter(t=>t.dead<=0).sort((a,b)=>V.len(V.sub(a.p,shot.p))-V.len(V.sub(b.p,shot.p)))[0];shot.target=target?.id;}if(target){const desired=V.mul(V.norm(V.sub(target.p,shot.p)),V.len(shot.v));const a=1-Math.exp(-dt*(shot.kind==='nova'?2.1:7));shot.v=shot.v.map((v,i)=>v+(desired[i]-v)*a);}}
   shot.p=V.add(shot.p,V.mul(shot.v,dt));
   for(const target of this.targets){if(target.dead>0||segmentDistance(target.p,shot.previous,shot.p)>(shot.kind==='nova'?.31:.24))continue;
    if(shot.kind==='ice')this.freeze(target);
    else if(shot.kind==='nova'){const radius=1.2+shot.power*.22;this.emit('nova',{p:shot.p.slice(),radius});for(const t of this.targets)if(t.dead<=0&&V.len(V.sub(t.p,shot.p))<radius)this.damage(t,1+shot.power,'void');for(let i=0;i<3;i++){const t=this.targets[(target.id+i+1)%7];spawned.push({kind:'seeker',p:shot.p.slice(),d:V.sub(t.p,shot.p),extra:{homing:true,target:t.id}});}}
    else {this.damage(target,shot.kind==='blade'?1+shot.power*.35:.7*shot.power,shot.kind);if(shot.spawnling)spawned.push({kind:'threadling',p:shot.p.slice(),d:[0,0,-1],extra:{homing:true}});}
    this.emit('impact',{p:shot.p.slice(),kind:shot.kind});shot.ttl=0;break;
   }
  }
  this.projectiles=this.projectiles.filter(p=>p.ttl>0);
  for(const s of spawned)this.projectile(s.kind,s.p,s.d,s.extra);
  for(const field of this.fields){field.ttl-=dt;field.tick+=dt;
   for(const t of this.targets){if(t.dead>0)continue;const delta=V.sub(field.p,t.p),dist=V.len(delta);if(dist>field.radius)continue;
    if(field.kind==='void')t.p=V.add(t.p,V.mul(delta,Math.min(.15,dt*1.6)));
    if(field.tick>.32)this.damage(t,field.kind==='solar'?.35:.22,field.kind);
   }if(field.tick>.32)field.tick=0;
  }this.fields=this.fields.filter(f=>f.ttl>0).slice(-8);
  return this.events;
 }
}
// Session-local stable hand state. No menu/trigger event may be made from stale data.
export class PoseHold{
 constructor(){this.reset();}
 reset(){this.kind='neutral';this.pending=null;this.since=0;this.lastSeen=-Infinity;this.last=null;}
 update(sample,ms){
  if(!sample){if(this.last&&ms-this.lastSeen<130)return {...this.last,stale:true,kind:this.kind};this.kind='neutral';this.pending=null;return null;}
  this.lastSeen=ms;let next=sample.kind;
  if(next!==this.kind){if(this.pending!==next){this.pending=next;this.since=ms;}const wait=next==='neutral'?240:next==='open'?95:55;if(ms-this.since>=wait){this.kind=next;this.pending=null;}}else this.pending=null;
  const blend=this.last?.direction?V.norm(this.last.direction.map((v,i)=>v*.35+sample.direction[i]*.65)):sample.direction;
  this.last={...sample,direction:blend,kind:this.kind,stale:false};return this.last;
 }
}
export class GestureController{
 constructor(){this.reset();}
 reset(){this.last='neutral';this.bothAt=null;this.armed=false;this.blockedUntil=0;}
 update(hands,ms,menu=false){
  const right=hands.right,left=hands.left;
  const out={point:right?.point||[.5,-.28,.2],direction:right?.direction||[0,0,-1],collect:false,primary:false,secondary:false,super:false,paused:menu};
  if(menu){this.last='neutral';this.armed=false;this.bothAt=null;this.blockedUntil=ms+200;return out;}
  if(!right||right.stale||ms<this.blockedUntil){this.last=right?.kind||'neutral';return out;}
  if(right.kind==='fist'&&left?.kind==='fist'&&!left.stale){this.bothAt??=ms;if(ms-this.bothAt>650)this.armed=true;}else this.bothAt=null;
  out.collect=right.kind==='fist';out.primary=right.kind==='sword';
  if(right.kind==='open'&&this.last!=='open'){out.super=this.armed;out.secondary=!this.armed;this.armed=false;}
  this.last=right.kind;return out;
 }
}
