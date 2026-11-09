// Original fan-interaction simulation. No game binaries, meshes or audio are included.
export const SCHOOLS=Object.freeze([
 {id:'stasis',zh:'冰影',name:'SHADEBINDER',ref:'Winter’s Wrath',color:0x8cbfff,accent:0xc7e8ff,verb:'冻结 / 碎冰',hint:'握拳召出冰杖 · 剑指发射冻结弹 · 张掌震碎冰封目标',primary:'冻结弹',secondary:'碎冰冲击'},
 {id:'solar',zh:'烈日',name:'DAWNBLADE',ref:'Daybreak',color:0xffa348,accent:0xffe4aa,verb:'火刃 / 焚燃',hint:'握拳凝聚焰剑 · 剑指挥出火刃 · 张掌释放灼热波',primary:'火刃',secondary:'灼热波'},
 {id:'void',zh:'虚空',name:'VOIDWALKER',ref:'Nova Bomb',color:0xad7dff,accent:0xe1c9ff,verb:'蓄积 / 坍缩',hint:'握拳压缩引力 · 剑指投出追踪新星 · 张掌引爆场内新星',primary:'新星投掷',secondary:'引力坍缩'},
 {id:'arc',zh:'电弧',name:'STORMCALLER',ref:'Stormtrance',color:0x7be7ff,accent:0xe3fbff,verb:'导电 / 雷链',hint:'剑指持续引导电流 · 连锁至邻近目标 · 张掌释放雷暴',primary:'持续电流',secondary:'雷暴'},
 {id:'strand',zh:'缚丝',name:'BROODWEAVER',ref:'Needlestorm',color:0x83efa5,accent:0xdcffbc,verb:'编织 / 追踪',hint:'握拳编织丝线 · 剑指齐射追踪针 · 张掌召出追踪体',primary:'织针齐射',secondary:'追踪体'},
 {id:'prismatic',zh:'棱镜',name:'PRISMATIC',ref:'Transcendence study',color:0xf2a5d5,accent:0x9cd8ff,verb:'明暗 / 超凡',hint:'交替命中积累明暗能量 · 双掌展开进入超凡 · 剑指混合齐射',primary:'混合能量',secondary:'超凡 / 共振'}
]);
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
export const valid=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mul=(a,t)=>a.map(v=>v*t);
export const norm=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);};
export const dist=(a,b)=>Math.hypot(...sub(a,b));
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export function segmentDistance(p,a,b){const d=sub(b,a),n=dot(d,d),u=n>1e-9?clamp(dot(sub(p,a),d)/n,0,1):0;return dist(p,add(a,mul(d,u)));}
export function aimAt(origin,direction,targets,threshold=.92){
 const ray=norm(direction);let target=null,best=threshold;
 for(const t of targets){if(t.dead>0)continue;const c=dot(ray,norm(sub(t.p,origin)));if(c>best){best=c;target=t;}}
 return {target,direction:target?norm(add(mul(ray,.28),mul(norm(sub(target.p,origin)),.72))):ray};
}
function targets(){return Array.from({length:7},(_,i)=>{const p=[(i-3)*.67,Math.sin(i*1.8)*.33,-2.3-Math.cos(i*.8)*.44];return {id:i,home:p.slice(),p:p.slice(),health:1,freeze:0,burn:0,dead:0};});}
export class WarlockArena {
 constructor(){this.serial=0;this.school=0;this.reset();}
 reset(){this.time=0;this.score=0;this.hits=0;this.shatters=0;this.energy=0;this.equipped=false;this.charge=0;this.cooldown=0;this.secondaryCD=0;this.targets=targets();this.projectiles=[];this.events=[];this.beams=[];this.prev='neutral';this.lastHand=null;this.transcendent=0;this.light=0;this.dark=0;this.alternate=0;this.note='握拳召唤 · 剑指发射 · 张掌释放';this.activeSeconds=0;this.started=false;}
 get spec(){return SCHOOLS[this.school];}
 select(i){this.school=clamp(Math.floor(i),0,5);this.reset();this.note=this.spec.hint;}
 emit(type,data={}){const e={type,time:this.time,school:this.spec.id,...data};this.events.push(e);return e;}
 summon(point=[.3,-.25,.1]){if(!this.equipped){this.equipped=true;this.emit('summon',{point:point.slice()});}this.started=true;this.note=this.spec.id==='stasis'?'冰杖已召出 · 剑指冻结目标':'已就绪 · 指向目标';}
 hit(t,amount,kind,point=t.p){if(t.dead>0)return;this.hits++;t.health-=amount;this.score+=Math.round(amount*100);this.emit('hit',{point:point.slice(),kind,target:t.id});if(this.spec.id==='prismatic'){if(kind==='light')this.light=clamp(this.light+.22,0,1);else this.dark=clamp(this.dark+.22,0,1);}if(t.health<=0){t.dead=2.8;t.freeze=0;this.emit('defeat',{point:t.p.slice(),kind});}}
 freeze(t){if(t.dead>0)return;t.freeze=6;this.emit('freeze',{point:t.p.slice(),target:t.id});this.note='已冻结 · 张掌碎冰';}
 spawn(kind,p,d,power=1,target=null){if(this.projectiles.length>=96)this.projectiles.shift();const speed=kind==='nova'?2.4:kind==='threadling'?3.3:kind==='needle'?5.7:5.1;const q={id:++this.serial,kind,p:p.slice(),previous:p.slice(),v:mul(norm(d),speed),speed,ttl:kind==='nova'?5:3.3,power,target,side:(this.alternate++%2===0?'light':'dark')};this.projectiles.push(q);return q;}
 primary(origin=[.3,-.25,.1],direction=[0,0,-1],force=false){
 if(!valid(origin)||!valid(direction)||(!force&&this.cooldown>0))return false;
 this.summon(origin);const id=this.spec.id,power=1+this.charge*1.5,aim=aimAt(origin,direction,this.targets);this.charge=0;
 if(id==='arc'){
   const first=aim.target;if(first){const rest=this.targets.filter(t=>t!==first&&t.dead<=0).sort((a,b)=>dist(a.p,first.p)-dist(b.p,first.p)).slice(0,2);const chain=[first,...rest];this.beams.push({points:[origin.slice(),...chain.map(t=>t.p.slice())],ttl:.16});for(const t of chain)this.hit(t,.085,'arc');this.emit('arc',{point:origin.slice()});}else this.beams.push({points:[origin.slice(),add(origin,mul(norm(direction),3.6))],ttl:.12});
   this.cooldown=.11;this.note='电流持续引导';
 }else if(id==='strand'){
   for(let i=0;i<7;i++){const angle=i*Math.PI*2/7,p=add(origin,[Math.cos(angle)*.12,Math.sin(angle)*.12,0]);const candidates=this.targets.filter(t=>!t.dead);const target=candidates[(i+Math.floor(this.time))%Math.max(1,candidates.length)]||aim.target;this.spawn('needle',p,aim.direction,power,target?.id);}
   this.cooldown=.72;this.emit('cast',{point:origin.slice(),kind:'needle',power});this.note='织针追踪 · 命中孵生追踪体';
 }else{
   const kind=id==='stasis'?'ice':id==='solar'?'blade':id==='void'?'nova':'prism';
   this.spawn(kind,origin,aim.direction,power,aim.target?.id);
   if(id==='prismatic'&&this.transcendent>0)for(const dx of [-.11,.11])this.spawn('prism',add(origin,[dx,0,0]),aim.direction,power,aim.target?.id);
   this.cooldown=id==='void'?.8:id==='stasis'?.34:.4;this.emit('cast',{point:origin.slice(),kind,power});
 }
 return true;
 }
 secondary(origin=[.3,-.25,.1],force=false){
 if(!valid(origin)||(!force&&this.secondaryCD>0))return false;
 this.summon(origin);const id=this.spec.id;let count=0;
 if(id==='stasis'){
   for(const t of this.targets)if(t.freeze>0&&t.dead<=0){this.hit(t,1.4,'shatter');this.shatters++;count++;this.emit('shatter',{point:t.p.slice(),target:t.id});}
   this.note=count?'碎裂 '+count+' 个冰封目标':'尚无冰封目标 · 先发射冻结弹';
 }else if(id==='void'){
   for(const q of this.projectiles.filter(p=>p.kind==='nova')){this.nova(q.p,q.power);q.ttl=0;count++;}
   if(!count){this.emit('wave',{point:origin.slice(),kind:'void',radius:1.2});for(const t of this.targets)if(!t.dead&&dist(t.p,origin)<2.5)this.hit(t,.32,'void');}
 }else if(id==='strand'){
   const alive=this.targets.filter(t=>!t.dead);
   for(let i=0;i<6;i++)this.spawn('threadling',add(origin,[(i-2.5)*.13,-.22,0]),[0,0,-1],.8,alive[i%Math.max(1,alive.length)]?.id);
 }else if(id==='prismatic'){
   if(this.light>=.45&&this.dark>=.45){this.transcendent=9;this.light=0;this.dark=0;this.emit('transcend',{point:origin.slice()});this.note='超凡 · 9 秒混合三连发';}
   else{this.light=clamp(this.light+.12,0,1);this.dark=clamp(this.dark+.12,0,1);this.note='共振积蓄 · 继续交替命中';}
 }else{
   for(const t of this.targets)if(!t.dead){this.hit(t,id==='arc'?.42:.3,id);if(id==='solar')t.burn=2.5;}
 }
 this.emit('wave',{point:origin.slice(),kind:id,radius:id==='stasis'?3.8:2.6,count});this.secondaryCD=.75;return true;
 }
 nova(p,power=1){this.emit('nova',{point:p.slice(),radius:.9+power*.25});for(const t of this.targets)if(!t.dead&&dist(t.p,p)<1.15+power*.2)this.hit(t,.75*power,'void');}
 step(seconds,hand=null,{menu=false,bothOpen=false}={}){
 const dt=clamp(seconds,0,.045);this.time+=dt;this.events=[];
 if(this.started)this.activeSeconds+=dt;
 this.cooldown=Math.max(0,this.cooldown-dt);this.secondaryCD=Math.max(0,this.secondaryCD-dt);this.transcendent=Math.max(0,this.transcendent-dt);
 for(const t of this.targets){if(t.dead>0){t.dead=Math.max(0,t.dead-dt);if(!t.dead){t.health=1;t.burn=0;t.freeze=0;}continue;}t.freeze=Math.max(0,t.freeze-dt);t.burn=Math.max(0,t.burn-dt);if(t.burn>0)this.hit(t,dt*.045,'solar');if(!t.freeze)t.p=[t.home[0]+Math.sin(this.time*.65+t.id)*.09,t.home[1]+Math.cos(this.time*.55+t.id)*.06,t.home[2]];}
 const additions=[];
 for(const q of this.projectiles){q.ttl-=dt;if(q.ttl<=0)continue;q.previous=q.p.slice();
 if(['needle','nova','threadling','prism'].includes(q.kind)){
  let target=this.targets[q.target];if(!target||target.dead>0)target=aimAt(q.p,q.v,this.targets,.1).target;
  if(target){q.target=target.id;const desired=mul(norm(sub(target.p,q.p)),q.speed);const a=1-Math.exp(-dt*(q.kind==='nova'?2.4:7));q.v=q.v.map((v,i)=>v+(desired[i]-v)*a);}
 }
 q.p=add(q.p,mul(q.v,dt));
 for(const t of this.targets){if(t.dead>0||segmentDistance(t.p,q.previous,q.p)>.2+(q.kind==='nova'?.13:0))continue;
  if(q.kind==='ice'){this.freeze(t);this.score+=5;}
  else if(q.kind==='nova')this.nova(q.p,q.power);
  else {this.hit(t,q.kind==='blade'?.55:q.kind==='needle'?.19:q.kind==='threadling'?.26:.3,q.kind==='prism'?q.side:q.kind);if(q.kind==='blade')t.burn=2.5;if(q.kind==='needle')additions.push({p:q.p.slice(),d:q.v.slice(),target:this.targets.find(x=>x.dead<=0&&x.id!==t.id)?.id});}
  q.ttl=0;break;
 }
 }
 this.projectiles=this.projectiles.filter(q=>q.ttl>0);for(const a of additions)this.spawn('threadling',a.p,a.d,.6,a.target);
 this.beams=this.beams.filter(b=>(b.ttl-=dt)>0);
 if(menu){this.prev='neutral';this.lastHand=null;return this.events;}
 if(!hand||hand.stale||!valid(hand.point)||!valid(hand.direction)){this.lastHand=null;return this.events;}
 const kind=hand.kind;
 if(kind==='fist'){this.summon(hand.point);this.charge=clamp(this.charge+dt*.72,0,1);}
 if(kind==='sword')this.primary(hand.point,hand.direction);
 if(kind==='open'&&this.prev!=='open')this.secondary(hand.point);
 if(bothOpen&&this.spec.id==='prismatic')this.secondary(hand.point);
 this.prev=kind;this.lastHand=hand;return this.events;
 }
}
