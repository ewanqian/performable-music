// Motion-first Warlock WebXR control prototype, intentionally NOT wired into public gameplay.
// Adapted movement thresholds, not a claim about original Destiny animation frames.
// Accepts stable root-local metres and explicit monotonic milliseconds.
const valid=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const norm=a=>{const d=Math.hypot(...a)||1;return a.map(v=>v/d);};
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const len=p=>Math.hypot(...p);
const copy=h=>h&&valid(h.point)?{...h,point:h.point.slice(),direction:valid(h.direction)?norm(h.direction):[0,0,-1]}:null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const CONTROL_THRESHOLDS=Object.freeze({
  staffDwellMs:160,shotIntervalMs:290,raiseDistanceM:.19,raiseSpeedMps:.48,
  shatterWindowMs:1100,slashDistanceM:.24,slashSpeedMps:.8,slashCooldownMs:340,
  beamDwellMs:150,throwDistanceM:.22,throwSpeedMps:.65,
  shortLossMs:160,longLossMs:380
});
export class WarlockMotion {
  constructor(school='stasis',variant='default'){this.setSchool(school,variant);}
  setSchool(school,variant='default'){
    this.school=school;this.variant=variant;this.phase='IDLE';
    this.events=[];this.last=NaN;this.lastValid=-Infinity;this.points=[];
    this.staffAimSince=null;this.lastShot=-Infinity;this.raiseOrigin=null;
    this.raiseAt=-Infinity;this.lastSlash=-Infinity;
    this.beamSince=null;this.lastBeam=-Infinity;
    this.chargeOrigin=null;this.lastThrow=-Infinity;this.energy=0;
    this.lastPose=null;this.armed=false;
  }
  emit(type,at,data={}){this.events.push({type,at,school:this.school,variant:this.variant,...data});}
  _travel(p,time){
    this.points.push({p:p.slice(),time});
    while(this.points.length>40||this.points.length>2&&time-this.points[0].time>280)this.points.shift();
    const from=this.points[0],v=this.points.length>1?sub(p,from.p):[0,0,0];
    const dt=Math.max(.001,(time-from.time)/1000);
    return {distance:len(v),speed:len(v)/dt,delta:v};
  }
  advance(now,{left=null,right=null,menu=false,superPressed=false,trackingLost=false}={}){
    if(!Number.isFinite(now))throw Error('Expected monotonic time');
    this.events=[];
    const dt=Number.isFinite(this.last)?clamp((now-this.last)/1000,0,.05):0;
    this.last=now;
    if(menu){
      this.points=[];this.staffAimSince=null;this.beamSince=null;
      this.phase='MENU';this.lastPose=null;
      return this.events;
    }
    const hand=copy(right),second=copy(left);
    const available=hand&&!hand.stale&&!trackingLost;
    if(!available){
      this.points=[];this.beamSince=null;this.staffAimSince=null;
      if(now-this.lastValid>CONTROL_THRESHOLDS.longLossMs){
        if(this.phase!=='RECOVER')this.emit('safe-end',now);
        this.phase='RECOVER';this.armed=false;this.raiseOrigin=null;
      }
      return this.events; // never commit on a tracking gap
    }
    this.lastValid=now;
    if(this.phase==='MENU'||this.phase==='RECOVER')this.phase='IDLE';
    const movement=this._travel(hand.point,now),kind=hand.kind;
    const secondOk=second&&!second.stale;
    if(superPressed&&this.phase==='IDLE'){
      this.phase='SUMMONING';this.emit('super-prepare',now,{p:hand.point.slice()});
      this.armed=true;
    }
    if(this.school==='stasis'){
      if((kind==='fist'||superPressed)&&!this.armed){
        this.armed=true;this.phase='SUMMONING';
        this.emit('equip',now,{p:hand.point.slice(),prop:'staff'});
      }
      if(this.armed&&this.phase==='SUMMONING'&&kind!=='fist'){
        this.phase='ARMED';this.emit('super-enter',now,{prop:'staff'});
      }
      // Staff pointing is derived from its physical shaft axis supplied by hand pose,
      // not the sword-finger semantic label.
      const direction=valid(hand.staffAxis)?norm(hand.staffAxis):hand.direction;
      const forwards=dot(direction,[0,0,-1])>.36;
      if(this.armed&&this.phase!=='SUMMONING'&&kind!=='open'&&forwards){
        this.staffAimSince??=now;
        if(now-this.staffAimSince>=CONTROL_THRESHOLDS.staffDwellMs &&
          now-this.lastShot>=CONTROL_THRESHOLDS.shotIntervalMs){
          this.emit('freeze-bolt',now,{point:hand.muzzle?.slice()||hand.point.slice(),direction});
          this.lastShot=now;this.phase='CHANNELING';
        }
      }else this.staffAimSince=null;
      // A deliberate upward raise arms the shockwave. A following downward sweep
      // or open palm commits it, never the lift alone.
      if(this.armed&&!this.raiseOrigin)this.raiseOrigin=hand.point.slice();
      if(this.armed&&this.raiseOrigin&&!Number.isFinite(this.raiseAt))this.raiseAt=-Infinity;
      if(this.armed&&this.raiseOrigin&&!this.raiseReady&&
        hand.point[1]-this.raiseOrigin[1]>CONTROL_THRESHOLDS.raiseDistanceM&&
        movement.delta[1]>.12&&movement.speed>CONTROL_THRESHOLDS.raiseSpeedMps){
        this.raiseReady=true;this.raiseAt=now;
        this.emit('shatter-armed',now);
      }
      if(this.raiseReady&&(now-this.raiseAt>CONTROL_THRESHOLDS.shatterWindowMs)){
        this.raiseReady=false;this.raiseOrigin=hand.point.slice();
      }
      if(this.raiseReady&&
        (kind==='open'||movement.delta[1]<-.12&&movement.speed>.48)){
        this.emit('shatter-wave',now,{point:hand.point.slice()});
        this.phase='BURST';this.raiseReady=false;this.raiseOrigin=hand.point.slice();
      }
    }else if(this.school==='solar'&&this.variant==='daybreak'){
      // A slash is a trajectory, not a pose. It needs substantial displacement,
      // speed and lateral or vertical travel, then a cooldown.
      if(this.armed||superPressed){
        this.armed=true;this.phase='ARMED';
        const d=movement.delta;
        if(movement.distance>=CONTROL_THRESHOLDS.slashDistanceM&&
           movement.speed>=CONTROL_THRESHOLDS.slashSpeedMps&&
           Math.hypot(d[0],d[1])>.19&&now-this.lastSlash>CONTROL_THRESHOLDS.slashCooldownMs){
          this.emit('sword-slash',now,{point:hand.point.slice(),vector:norm(d),strength:movement.speed});
          this.lastSlash=now;this.points=[];
        }
      }
    }else if(this.school==='arc'&&this.variant==='chaos-reach'){
      const both=secondOk&&['open','neutral'].includes(kind)&&['open','neutral'].includes(second.kind);
      const v=both?norm(sub(hand.point,second.point)):null;
      if(both&&len(sub(hand.point,second.point))>.15&&dot(hand.direction,[0,0,-1])>.45){
        this.beamSince??=now;
        if(now-this.beamSince>=CONTROL_THRESHOLDS.beamDwellMs){
          if(this.phase!=='CHANNELING')this.emit('beam-start',now,{point:hand.point.slice()});
          this.phase='CHANNELING';
          if(now-this.lastBeam>75){
            this.emit('beam-update',now,{direction:norm([
              (hand.direction[0]+second.direction[0])*.5,
              (hand.direction[1]+second.direction[1])*.5,
              (hand.direction[2]+second.direction[2])*.5
            ])});this.lastBeam=now;
          }
        }
      }else{
        this.beamSince=null;
        if(this.phase==='CHANNELING'){this.emit('beam-stop',now);this.phase='RECOVER';}
      }
    }else if(this.school==='arc'&&this.variant==='stormtrance'){
      if(kind==='open'&&this.phase!=='CHANNELING'){
        this.phase='CHANNELING';this.emit('lightning-start',now);
      }
      if(kind==='open'&&this.phase==='CHANNELING'){
        if(now-this.lastBeam>80){this.emit('chain-update',now,{direction:hand.direction});this.lastBeam=now;}
      }else if(this.phase==='CHANNELING'){this.emit('lightning-stop',now);this.phase='RECOVER';}
    }else if(this.school==='void'&&['cataclysm','vortex'].includes(this.variant)){
      const near=secondOk&&len(sub(hand.point,second.point))<.32;
      if(near&&this.chargeOrigin===null){
        this.chargeOrigin=hand.point.slice();this.emit('nova-charge-start',now);
      }
      if(near)this.energy=Math.min(1,this.energy+dt*.7);
      if(this.chargeOrigin&&movement.distance>.12&&
        movement.delta[2]<-CONTROL_THRESHOLDS.throwDistanceM&&
        movement.speed>CONTROL_THRESHOLDS.throwSpeedMps&&
        now-this.lastThrow>500){
          this.emit('nova-throw',now,{kind:this.variant,charge:this.energy,
            point:hand.point.slice(),direction:hand.direction});
          this.energy=0;this.chargeOrigin=null;this.lastThrow=now;this.points=[];
        }
      if(!near&&this.chargeOrigin&&now-this.lastThrow>500&&kind==='open'){
        this.emit('nova-release',now,{kind:this.variant,charge:this.energy,
          point:hand.point.slice(),direction:hand.direction});
        this.energy=0;this.chargeOrigin=null;this.lastThrow=now;this.points=[];
      }
    }else if(this.school==='strand'&&this.variant==='needlestorm'){
      if(kind==='fist'){this.energy=Math.min(1,this.energy+dt*.8);this.phase='SUMMONING';}
      if(this.phase==='SUMMONING'&&kind==='open'&&movement.speed>.7){
        this.emit('needle-volley',now,{point:hand.point.slice(),direction:hand.direction,
          charge:this.energy});this.energy=0;this.phase='BURST';
      }
    }
    this.lastPose=hand;return this.events;
  }
}
