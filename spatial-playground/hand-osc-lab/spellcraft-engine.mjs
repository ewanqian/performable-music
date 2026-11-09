// Spellcraft Theatre — original lightweight fantasy interaction prototypes.
// No copyrighted spell assets, no religious efficacy claims, no tracking uploads.
// Gameplay data is deliberately pure: DOM/WebXR renderer lives in spellcraft-ui.mjs.
export const ELEMENTS = Object.freeze([
  { id:'wood', zh:'木', en:'WOOD', color:0x8ad7a2 },
  { id:'fire', zh:'火', en:'FIRE', color:0xff9a60 },
  { id:'earth', zh:'土', en:'EARTH', color:0xd8b87b },
  { id:'metal', zh:'金', en:'METAL', color:0xcce4ed },
  { id:'water', zh:'水', en:'WATER', color:0x78bce8 }
]);
export const SPELLS = Object.freeze({
  west:[
    {id:'ember',zh:'掌火 · 投掷',en:'PALM FIREBALL',detail:'张掌蓄火 → 握拳释放；也可手掌快速向前挥出。投中浮动靶。',how:'OPEN PALM → FIST / FLICK',color:0xff9a56,action:'蓄力投掷'},
    {id:'frost',zh:'冰脉 · 凝结',en:'FROST LATTICE',detail:'剑指持续指向目标令它结霜；松开后碎裂并计分。',how:'SWORD HOLD → RELEASE',color:0x9addfa,action:'凝结 / 碎裂'},
    {id:'arc',zh:'雷链 · 导流',en:'CHAIN LIGHTNING',detail:'剑指锁定一个目标，电弧自动跳向附近两个目标，形成连击。',how:'SWORD POINT / HOLD',color:0xe4c2fc,action:'连锁闪电'},
    {id:'ward',zh:'守护 · 护盾',en:'AEGIS WARD',detail:'张掌保持护盾，挡住迎面袭来的能量球。漏防会扣生命。',how:'OPEN PALM TO BLOCK',color:0x8de6d4,action:'格挡挑战'},
    {id:'gravity',zh:'念力 · 引力',en:'GRAVITY WELL',detail:'握拳聚拢空间球体；松拳把被吸引的物体发射出去。',how:'FIST HOLD → OPEN HAND',color:0xd0bdff,action:'聚拢 / 释放'},
    {id:'rift',zh:'环门 · 空间门',en:'RIFT CIRCLE',detail:'剑指在空中画一圈生成门，随后指向前方让能量穿门射出。',how:'SWORD DRAW ○ → POINT',color:0xe7bf92,action:'画环 / 穿门'}
  ],
  east:[
    {id:'talisman',zh:'画符 · 发遣',en:'TALISMAN FLIGHT',detail:'剑指画闭合圆形召出原创符形，再向前一指放出纸符。',how:'剑指画 ○ → 指向发射',color:0xe9bd7c,action:'绘符 / 发遣'},
    {id:'sword',zh:'御剑 · 齐射',en:'FLYING SWORDS',detail:'剑指停留聚起九柄飞剑，松开手势后一齐追踪目标。',how:'剑指蓄力 → 松开齐射',color:0xd6dce6,action:'召剑 / 齐射'},
    {id:'array',zh:'列阵 · 剑环',en:'SWORD ARRAY',detail:'两掌打开构成护体剑环，然后以剑指射出剑阵。',how:'双掌打开 → 剑指出阵',color:0xc4cfef,action:'双手列阵'},
    {id:'elements',zh:'五行 · 物性',en:'FIVE ELEMENTS',detail:'拇指接触不同手指或切换元素；木束缚、火爆散、土推开、金穿刺、水凝结，击中特定元素靶有加分。',how:'选元素 → 剑指释放',color:0xb5dfb2,action:'选态 / 克制'},
    {id:'seal',zh:'镇定 · 封印',en:'BINDING SEAL',detail:'张掌减缓目标，再改为剑指放出封印符，命中时暂时固定。',how:'张掌镇定 → 剑指封印',color:0xd2beef,action:'镇定 / 封印'},
    {id:'stars',zh:'七星 · 连势',en:'SEVEN-STAR ROUTE',detail:'依序剑指连接七个悬浮星位，全部连对才会触发星阵攻击。',how:'指向 1 → 2 → … → 7',color:0xd3e5ee,action:'依序连线'}
  ]
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
const vec=(x=0,y=0,z=0)=>[x,y,z];
const add=(a,b)=>a.map((n,i)=>n+b[i]);
const sub=(a,b)=>a.map((n,i)=>n-b[i]);
const scale=(v,n)=>v.map(x=>x*n);
const length=v=>Math.hypot(...v);
const norm=v=>scale(v,1/(length(v)||1));
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const distance=(a,b)=>length(sub(a,b));
const valid=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
export const STAR_POINTS=Object.freeze([
  [-.49,.36,-.94],[-.24,.54,-1.00],[.01,.32,-1.06],
  [-.10,.06,-.95],[.17,-.08,-1.04],[.39,-.28,-1.06],[.54,-.52,-.97]
]);
export function circleEvidence(points){
  if(!Array.isArray(points)||points.length<14||!points.every(valid))return null;
  const q=points.slice(-100);
  let travel=0;for(let i=1;i<q.length;i++)travel+=distance(q[i],q[i-1]);
  const centre=[0,0,0];
  for(const p of q)for(let a=0;a<3;a++)centre[a]+=p[a]/q.length;
  const radii=q.map(p=>Math.hypot(p[0]-centre[0],p[1]-centre[1]));
  const radius=radii.reduce((a,b)=>a+b,0)/q.length;
  if(radius<.065||radius>.50||travel<.42||distance(q[0],q[q.length-1])>Math.max(.13,radius*1.1))return null;
  let turn=0;
  for(let i=1;i<q.length;i++){
    const a=Math.atan2(q[i-1][1]-centre[1],q[i-1][0]-centre[0]);
    const b=Math.atan2(q[i][1]-centre[1],q[i][0]-centre[0]);
    let delta=b-a;
    if(delta>Math.PI)delta-=2*Math.PI;
    if(delta< -Math.PI)delta+=2*Math.PI;
    turn+=delta;
  }
  if(Math.abs(turn)<4.7)return null;
  const variation=radii.reduce((sum,r)=>sum+Math.abs(r-radius),0)/q.length;
  if(variation>radius*.58)return null;
  return {centre,radius,turn,travel};
}
export function fingerContact(points){
  if(!Array.isArray(points)||points.length!==25||!points.every(p=>valid(p)))return null;
  const thumb=points[4], tips=[9,14,19,24];
  const values=tips.map((j,i)=>({i,d:distance(thumb,points[j])})).sort((a,b)=>a.d-b.d);
  // A distinct single contact only, avoid conflating a full fist with pinches.
  if(values[0].d>.034||values[1].d<values[0].d+.010)return null;
  return values[0].i;
}
function targetSet(){
  const positions=[[-.58,.22,-.95],[-.30,-.10,-1.00],[0,.34,-.96],[.36,.12,-1.03],[.58,-.27,-.96]];
  return positions.map((p,i)=>({
    id:i,base:p.slice(),position:p.slice(),health:1,respawn:0,freeze:0,
    element:i,phase:i*.78,hitCount:0,restrained:0
  }));
}
function copyHand(h){
  return {hand:h?.hand==='left'?'left':'right',
    kind:['open','sword','fist','pinch','neutral'].includes(h?.kind)?h.kind:'neutral',
    point:valid(h?.point)?h.point.slice():[0,0,.40],
    direction:norm(valid(h?.direction)?h.direction:[0,0,-1]),
    speed:clamp(h?.speed||0,0,4),finger:Number.isInteger(h?.finger)?clamp(h.finger,0,3):null
  };
}
export class SpellArena {
  constructor(line='west'){
    this.line=line==='east'?'east':'west'; this.select(0);
  }
  select(index){
    this.index=clamp(Math.floor(index),0,5);this.spec=SPELLS[this.line][this.index];
    this.targets=targetSet();this.projectiles=[];this.events=[];this.score=0;this.combo=0;
    this.life=5;this.time=0;this.charge=0;this.cooldown=0;this.shield=0;
    this.armed=false;this.armedTime=0;this.formation=0;this.element=0;
    this.route=0;this.routeHold=0;this.trace=[];this.circle=null;this.frozenCount=0;
    this.prev={left:'neutral',right:'neutral'};this.note='准备好开始';
    this.lastCast=-9;this.lastIncoming=0;this.heldTime=0;this._lastPinch=-9;
    return this.spec;
  }
  emit(type,detail={}){const e={type,t:this.time,...detail};this.events.push(e);return e;}
  hint(note){this.note=note;this.emit('hint',{note});}
  reset(){return this.select(this.index);}
  setElement(i){
    this.element=clamp(Math.floor(i),0,4);
    this.hint('五行 · '+ELEMENTS[this.element].zh+' / '+ELEMENTS[this.element].en);
    return this.element;
  }
  _primary(hands){
    return hands.find(h=>h.hand==='right'&&h.kind!=='neutral')||
      hands.find(h=>h.kind!=='neutral')||hands[0]||copyHand(null);
  }
  _aim(p,d){
    let best=null,cos=.70;
    for(const t of this.targets){
      if(t.respawn>0)continue;
      const v=norm(sub(t.position,p)),c=dot(v,norm(d));
      if(c>cos){cos=c;best=t;}
    }
    return best;
  }
  cast(type,p=[0,0,.35],direction=[0,0,-1],extras={}){
    if(!valid(p)||!valid(direction))return null;
    const t=this._aim(p,direction);
    // Soft aim assistance corrects headset finger direction within a broad cone.
    const d=norm(t?add(scale(norm(direction),.35),scale(norm(sub(t.position,p)),.65)):direction);
    const speed=type==='sword'?4.8:type==='talisman'?2.4:3.6;
    const proj={id:this.time+'-'+this.projectiles.length,type,origin:p.slice(),position:p.slice(),
      velocity:scale(d,speed),life:2.8,element:this.element,...extras};
    this.projectiles.push(proj);
    this.emit('cast',{spell:type,point:p.slice(),direction:d.slice(),element:proj.element});
    this.lastCast=this.time;
    return proj;
  }
  strike(t,type='impact',amount=1){
    if(!t||t.respawn>0)return false;
    if(type==='freeze'){t.freeze=Math.max(t.freeze,2.4);this.emit('freeze',{position:t.position.slice()});return true;}
    if(type==='seal'){t.restrained=3.3;t.freeze=Math.max(t.freeze,1.8);}
    const bonus=type==='elemental' && this.element===t.element?25:0;
    this.score+=10+Math.min(this.combo,8)*2+bonus;this.combo+=1;
    t.health-=amount;t.hitCount++;
    this.emit('hit',{point:t.position.slice(),id:t.id,spell:type,bonus,score:this.score});
    if(t.health<=0){t.respawn=1.0;t.health=1;}
    return true;
  }
  _progress(dt){
    this.cooldown=Math.max(0,this.cooldown-dt);
    this.shield=Math.max(0,this.shield-dt);
    for(const t of this.targets){
      t.freeze=Math.max(0,t.freeze-dt);t.restrained=Math.max(0,t.restrained-dt);
      if(t.respawn>0){t.respawn=Math.max(0,t.respawn-dt);continue;}
      const v=(t.freeze||t.restrained)?0.13:1;
      const wobble=Math.sin(this.time*.81+t.phase);
      t.position=[t.base[0]+wobble*.05*v,t.base[1]+Math.cos(this.time*.67+t.phase)*.05*v,t.base[2]];
    }
    for(const p of this.projectiles){
      p.life-=dt;
      p.position=add(p.position,scale(p.velocity,dt));
      if(p.life<=0)continue;
      for(const t of this.targets){
        if(t.respawn>0||distance(p.position,t.position)>(p.type==='sword'?.17:.22))continue;
        if(p.type==='elemental'){
          this.strike(t,'elemental');
          if(this.element===0)t.restrained=2.4;
          if(this.element===4)t.freeze=2.4;
          if(this.element===2)t.base[0]=clamp(t.base[0]+Math.sign(t.position[0]||1)*.08,-.7,.7);
          if(this.element===1)for(const near of this.targets)if(near!==t&&distance(near.position,t.position)<.65)this.strike(near,'fire');
        }else if(p.type==='seal')this.strike(t,'seal');
        else this.strike(t,p.type);
        if(p.type!=='metal-pierce'){p.life=0;break;}
      }
    }
    this.projectiles=this.projectiles.filter(p=>p.life>0);
    if(this.projectiles.length>90)this.projectiles.splice(0,this.projectiles.length-90);
  }
  record(point){
    if(!valid(point))return null;
    if(this.trace.length && distance(point,this.trace[this.trace.length-1])<.006)return null;
    this.trace.push(point.slice());if(this.trace.length>100)this.trace.shift();
    const evidence=circleEvidence(this.trace);
    if(evidence){this.trace.length=0;this.circle=evidence;this.armed=true;
      this.armedTime=this.time;this.emit('circle',{point:evidence.centre,radius:evidence.radius});
      this.hint(this.spec.id==='talisman'?'符成 · 剑指前推放出':'空间门已开 · 指向放出');
    }
    return evidence;
  }
  _fireVolley(p,d,number=9){
    for(let i=0;i<number;i++){
      const angle=i*Math.PI*2/number,offset=[Math.cos(angle)*.19,Math.sin(angle)*.19,.04];
      this.cast('sword',add(p,offset),norm(add(d,[Math.cos(angle)*.05,Math.sin(angle)*.05,0])));
    }
    this.emit('volley',{count:number,point:p.slice()});
    this.hint('九剑齐出 · 再次蓄力');
  }
  _lightning(p,d){
    const t=this._aim(p,d);
    if(!t){this.hint('指向前方漂浮目标');return;}
    const victims=[t,...this.targets.filter(x=>x!==t&&x.respawn===0)
      .sort((a,b)=>distance(a.position,t.position)-distance(b.position,t.position)).slice(0,2)];
    const path=[p,...victims.map(x=>x.position.slice())];
    for(const v of victims)this.strike(v,'arc');
    this.emit('chain',{points:path});this.hint('雷链 · '+victims.length+' 段命中');
  }
  _frost(p,d){
    const t=this._aim(p,d);if(!t){this.hint('对准目标凝结');return;}
    t.freeze=2.7;this.frozenCount++;
    this.emit('freeze',{position:t.position.slice()});this.hint('霜凝 · 松开剑指碎裂');
  }
  _shatter(){
    let n=0;for(const t of this.targets)if(t.freeze>.01&&t.respawn===0){this.strike(t,'shatter');n++;}
    if(n){this.emit('shatter',{count:n});this.hint('寒晶碎裂 · '+n+' 个目标');}
    this.frozenCount=0;
  }
  manual(point=[0,0,.40],direction=[0,0,-1]){
    const id=this.spec.id;
    if(id==='ember')this.cast('fireball',point,direction);
    if(id==='frost'){this._frost(point,direction);this._shatter();}
    if(id==='arc')this._lightning(point,direction);
    if(id==='ward'){this.shield=3.5;this.emit('shield',{point});this.hint('护盾已展开');}
    if(id==='gravity'){for(const t of this.targets){t.freeze=.3;}this.emit('gravity',{point});this._fireVolley(point,direction,3);}
    if(id==='rift'){this.circle={centre:point.slice(),radius:.25};this.armed=true;this.armedTime=this.time;this.emit('circle',{point,radius:.25});this.cast('rift',point,direction);}
    if(id==='talisman'){this.circle={centre:point.slice(),radius:.18};this.armed=true;this.emit('circle',{point,radius:.18});this.cast('talisman',point,direction);}
    if(id==='sword')this._fireVolley(point,direction);
    if(id==='array'){this.formation=3;this.emit('array',{point});this._fireVolley(point,direction,6);}
    if(id==='elements')this.cast('elemental',point,direction);
    if(id==='seal'){const t=this._aim(point,direction);if(t)t.freeze=1.2;this.cast('seal',point,direction);}
    if(id==='stars'){this.route+=1;this.emit('star',{step:this.route,point:STAR_POINTS[this.route-1]});if(this.route>=7){this.emit('constellation',{points:STAR_POINTS});this.score+=70;this.route=0;}}
    this.hint('释放完成 · 继续试试不同手势');
    return this.events;
  }
  step(dt,hands=[],manual=false){
    dt=clamp(dt,0,.05);this.time+=dt;this.events=[];
    this._progress(dt);
    const items=hands.map(copyHand),h=this._primary(items),prev=this.prev[h.hand]||'neutral';
    const open=items.some(v=>v.kind==='open'),sword=items.some(v=>v.kind==='sword');
    const fist=items.some(v=>v.kind==='fist');
    const id=this.spec.id;
    const fromOpen=prev==='open'&&h.kind!=='open';
    const fromSword=prev==='sword'&&h.kind!=='sword';
    const fromFist=prev==='fist'&&h.kind!=='fist';
    if(manual===true)this.manual(h.point,h.direction);
    if(id==='ember'){
      if(open){this.charge=clamp(this.charge+dt*.85,0,1);
        this.emit('charge',{point:h.point,level:this.charge,color:0xff9a56});}
      if(this.charge>.22&&this.cooldown<=0&&((fromOpen&&!open)||(open&&h.speed>.95&&this.charge>.44))){
        this.cast('fireball',h.point,h.direction);this.charge=0;this.cooldown=.6;this.hint('火球已投出');}
    }else if(id==='frost'){
      if(sword&&this.cooldown<=0){this._frost(h.point,h.direction);this.cooldown=.55;}
      if(fromSword&&!sword&&this.frozenCount)this._shatter();
    }else if(id==='arc'){
      if(sword&&this.cooldown<=0){this._lightning(h.point,h.direction);this.cooldown=.88;}
    }else if(id==='ward'){
      if(open){this.shield=.26;this.emit('shield',{point:h.point});}
      if(this.time-this.lastIncoming>1.8){
        this.lastIncoming=this.time;
        if(this.shield>0){this.score+=12;this.emit('block',{point:h.point});this.hint('格挡成功 +12');}
        else{this.life=Math.max(0,this.life-1);this.emit('damage',{life:this.life});this.hint('漏防 · 尽快张掌格挡');}
      }
    }else if(id==='gravity'){
      if(fist){
        this.charge=clamp(this.charge+dt*.9,0,1);
        this.emit('gravity',{point:h.point,level:this.charge});
        for(const t of this.targets){if(t.respawn===0){
          t.position=add(t.position,scale(sub(h.point,t.position),Math.min(.04,dt*.75)));
        }}
      }
      if(fromFist&&this.charge>.22){this._fireVolley(h.point,h.direction,3);this.charge=0;}
    }else if(id==='rift'||id==='talisman'){
      if(sword&&!this.armed)this.record(h.point);
      if(this.armed&&sword&&this.time-this.armedTime>.5&&this.cooldown<=0){
        this.cast(id==='rift'?'rift':'talisman',h.point,h.direction);
        this.armed=false;this.cooldown=.8;this.hint('已发射 · 再画一次');
      }
    }else if(id==='sword'){
      if(sword){this.charge=clamp(this.charge+dt*.85,0,1);
        this.emit('charge',{point:h.point,level:this.charge,color:0xd4e7fa});}
      if(fromSword&&this.charge>.25){
        this._fireVolley(h.point,h.direction);this.charge=0;
      }
    }else if(id==='array'){
      const palms=items.filter(x=>x.kind==='open');
      if(palms.length>=2){
        this.formation=5;this.emit('array',{point:scale(add(palms[0].point,palms[1].point),.5)});
        this.hint('双掌剑阵已成');
      }
      this.formation=Math.max(0,this.formation-dt);
      if(this.formation>0&&sword&&this.cooldown<=0){
        this._fireVolley(h.point,h.direction,6);this.cooldown=1.2;
      }
    }else if(id==='elements'){
      const pinch=items.find(x=>x.kind==='pinch'&&x.finger!==null);
      if(pinch&&this.time-this._lastPinch>.65){this._lastPinch=this.time;this.setElement(pinch.finger);}
      if(sword&&this.cooldown<=0){this.cast('elemental',h.point,h.direction);this.cooldown=.65;}
    }else if(id==='seal'){
      if(open){
        this.emit('seal-field',{point:h.point});
        for(const t of this.targets)if(t.respawn===0)t.freeze=Math.max(t.freeze,.15);
      }
      if(sword&&prev!=='sword'&&this.cooldown<=0){
        this.cast('seal',h.point,h.direction);this.cooldown=.75;
      }
    }else if(id==='stars'){
      if(sword){
        const point=STAR_POINTS[this.route],aim=norm(sub(point,h.point));
        if(dot(aim,h.direction)>.94)this.routeHold+=dt;
        else this.routeHold=Math.max(0,this.routeHold-dt*1.5);
        if(this.routeHold>.22){
          this.route++;this.routeHold=0;
          this.emit('star',{step:this.route,point:point.slice()});this.hint('星位 '+this.route+'/7');
          if(this.route===7){this.emit('constellation',{points:STAR_POINTS});this.score+=70;this.route=0;this.hint('七星贯通 +70');}
        }
      }else this.routeHold=0;
    }
    for(const item of items)this.prev[item.hand]=item.kind;
    // A disappearing hand is never interpreted as a deliberate release.
    return this.events;
  }
}
