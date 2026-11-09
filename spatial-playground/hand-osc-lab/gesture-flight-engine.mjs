// Gesture Dynamics V2 — event driven leader/follower flights.
// Particles are born at the fingertip and never spring back to their original scene.
// Manual dual-fist recall is a 0.23s direct hand-target transfer (no orbiting on return).
const finite3 = p => Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
const add = (a,b) => a.map((v,i)=>v+b[i]);
const sub = (a,b) => a.map((v,i)=>v-b[i]);
const scale = (a,k) => a.map(v=>v*k);
const len = v => Math.hypot(v[0],v[1],v[2]);
const unit = v => scale(v,1/(len(v)||1));
const lerp = (a,b,t) => a+(b-a)*t;
const smooth = t => t*t*(3-2*t);
export const FLIGHT_PARTICLES = 480;
export const FLIGHT_SLOTS = 4;
export const FLIGHT_PER_SLOT = FLIGHT_PARTICLES / FLIGHT_SLOTS;
export const FLIGHT_SPEED = 6.2;
export const RECALL_SECONDS = .23;
const HIDDEN = 1e3;

export class GestureCombo {
  constructor(){this.reset();}
  reset(){
    this.prev = {left:'neutral',right:'neutral'};
    this.lastCast = -Infinity; this.lastBurst = -Infinity;
    this.rightReadyAt = -Infinity; this.ready=false;
  }
  update(hands,now,hasFlights=false){
    const events = [];
    const right = hands?.right ?? null, left=hands?.left ?? null;
    const sword = right?.kind==='sword'?right:left?.kind==='sword'?left:null;
    if(sword && (!hasFlights || now-this.lastCast>=580) && now-this.lastCast>=280){
      events.push({type:'cast',point:sword.point.slice(),direction:sword.direction.slice(),hand:sword.hand});
      this.lastCast=now;
    }
    for(const hand of [right,left]){
      if(!hand)continue;
      const side=hand.hand,prev=this.prev[side];
      if(hand.kind==='open' && prev!=='open' && hasFlights && now-this.lastBurst>240){
        events.push({type:'burst',point:hand.point.slice(),hand:side});
        this.lastBurst=now;
      }
      if(side==='right' && hand.kind==='fist' && prev!=='fist'){
        this.ready=true;this.rightReadyAt=now;
        events.push({type:'ready',point:hand.point.slice()});
      }
      if(side==='left' && hand.kind==='fist' && prev!=='fist' &&
        this.ready && now-this.rightReadyAt>=50 && now-this.rightReadyAt<=2600 && hasFlights){
        events.push({type:'recall',point:(right?.point||hand.point).slice()});
        this.ready=false;
      }
      this.prev[side]=hand.kind;
    }
    if(this.ready && now-this.rightReadyAt>2600)this.ready=false;
    return events;
  }
}
function seeded(seed){
  let s = (seed||1)>>>0;
  return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};
}
export class FlightSwarm {
  constructor(shape='cloud'){
    this.shape=shape; this.pos=new Float32Array(FLIGHT_PARTICLES*3);
    this.velocity=new Float32Array(FLIGHT_PARTICLES*3);
    this.start=new Float32Array(FLIGHT_PARTICLES*3);
    this.flights=Array.from({length:FLIGHT_SLOTS},()=>({
      active:false,mode:'idle',position:[0,0,0],direction:[0,0,-1],
      age:0,recallElapsed:0,recallStart:[0,0,0],speed:FLIGHT_SPEED
    }));
    this.next=0;this.sequence=0;this.clear();
  }
  clear(){
    for(let i=0;i<FLIGHT_PARTICLES;i++){
      const j=i*3;this.pos[j]=0;this.pos[j+1]=-HIDDEN;this.pos[j+2]=0;
      this.velocity[j]=this.velocity[j+1]=this.velocity[j+2]=0;
    }
    for(const f of this.flights){f.active=false;f.mode='idle';f.age=0;}
    this.next=0;
  }
  get activeCount(){return this.flights.filter(f=>f.active).length;}
  _hideSlot(slot){
    for(let i=slot*FLIGHT_PER_SLOT;i<(slot+1)*FLIGHT_PER_SLOT;i++){
      const j=i*3;this.pos[j]=0;this.pos[j+1]=-HIDDEN;this.pos[j+2]=0;
    }
    this.flights[slot].active=false;
    this.flights[slot].mode='idle';
  }
  launch(point,direction){
    if(!finite3(point)||!finite3(direction)||len(direction)<.1)return null;
    const slot=this.next++%FLIGHT_SLOTS,f=this.flights[slot];
    f.active=true; f.mode='flight'; f.age=0; f.recallElapsed=0;
    f.position=point.slice(); f.direction=unit(direction);
    f.speed=FLIGHT_SPEED;
    const rnd=seeded(++this.sequence);
    for(let i=slot*FLIGHT_PER_SLOT;i<(slot+1)*FLIGHT_PER_SLOT;i++){
      const j=i*3;
      const angle=(i-slot*FLIGHT_PER_SLOT)*2.39996;
      const r=.035+.04*rnd();
      this.pos[j]=point[0]+Math.cos(angle)*r;
      this.pos[j+1]=point[1]+Math.sin(angle)*r;
      this.pos[j+2]=point[2]+(rnd()-.5)*.05;
      this.velocity[j]=this.velocity[j+1]=this.velocity[j+2]=0;
    }
    return {slot,point:point.slice(),direction:f.direction.slice()};
  }
  burst(point){
    if(!finite3(point))return 0;
    let hit=0;
    for(let slot=0;slot<FLIGHT_SLOTS;slot++){
      const f=this.flights[slot];if(!f.active||f.mode==='recall')continue;
      f.mode='scatter';hit++;
      const rnd=seeded(slot+31+this.sequence);
      for(let i=slot*FLIGHT_PER_SLOT;i<(slot+1)*FLIGHT_PER_SLOT;i++){
        const j=i*3;
        const radial=unit([
          this.pos[j]-f.position[0]+(rnd()-.5)*.30,
          this.pos[j+1]-f.position[1]+(rnd()-.5)*.30,
          this.pos[j+2]-f.position[2]+(rnd()-.5)*.30]);
        const v=add(scale(radial,4.5+rnd()*3),scale(f.direction,FLIGHT_SPEED*.7));
        this.velocity[j]=v[0];this.velocity[j+1]=v[1];this.velocity[j+2]=v[2];
      }
    }
    return hit;
  }
  recall(){
    let count=0;
    for(let slot=0;slot<FLIGHT_SLOTS;slot++){
      const f=this.flights[slot];if(!f.active)continue;
      f.mode='recall';f.recallElapsed=0;f.recallStart=f.position.slice();count++;
      for(let i=slot*FLIGHT_PER_SLOT;i<(slot+1)*FLIGHT_PER_SLOT;i++){
        const j=i*3;
        this.start[j]=this.pos[j];this.start[j+1]=this.pos[j+1];this.start[j+2]=this.pos[j+2];
      }
    }
    return count;
  }
  step(dt,handPoint=[0,0,0]){
    dt=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
    if(!dt)return;
    const target=finite3(handPoint)?handPoint:[0,0,0];
    for(let slot=0;slot<FLIGHT_SLOTS;slot++){
      const f=this.flights[slot];if(!f.active)continue;
      if(f.mode==='recall'){
        f.recallElapsed=Math.min(RECALL_SECONDS,f.recallElapsed+dt);
        const t=smooth(f.recallElapsed/RECALL_SECONDS);
        f.position=f.recallStart.map((v,i)=>lerp(v,target[i],t));
        for(let i=slot*FLIGHT_PER_SLOT;i<(slot+1)*FLIGHT_PER_SLOT;i++){
          const j=i*3;
          this.pos[j]=lerp(this.start[j],target[0],t);
          this.pos[j+1]=lerp(this.start[j+1],target[1],t);
          this.pos[j+2]=lerp(this.start[j+2],target[2],t);
        }
        if(f.recallElapsed>=RECALL_SECONDS)this._hideSlot(slot);
        continue;
      }
      f.age+=dt;
      // Projectiles are intentionally not home-constrained: >12m after 2s.
      f.position=add(f.position,scale(f.direction,f.speed*dt));
      const first=slot*FLIGHT_PER_SLOT, scatter=f.mode==='scatter';
      const drag=Math.exp(-.18*dt),alpha=1-Math.exp(-24*dt);
      // Basis is constant for a flight, not recomputed 120 times per frame.
      const ref=Math.abs(f.direction[1])>.85?[1,0,0]:[0,1,0];
      const a=unit([f.direction[1]*ref[2]-f.direction[2]*ref[1],
        f.direction[2]*ref[0]-f.direction[0]*ref[2],
        f.direction[0]*ref[1]-f.direction[1]*ref[0]]);
      const b=[f.direction[1]*a[2]-f.direction[2]*a[1],
        f.direction[2]*a[0]-f.direction[0]*a[2],
        f.direction[0]*a[1]-f.direction[1]*a[0]];
      for(let i=first;i<first+FLIGHT_PER_SLOT;i++){
        const j=i*3,k=i-first;
        if(scatter){
          for(let axis=0;axis<3;axis++){
            this.velocity[j+axis]*=drag;
            this.pos[j+axis]+=this.velocity[j+axis]*dt;
          }
          continue;
        }
        const theta=k*2.3999632+f.age*4.5;
        const radius=this.shape==='torus'?.32:this.shape==='helix'?.18+(k/FLIGHT_PER_SLOT)*.16:.10+Math.sqrt(k/FLIGHT_PER_SLOT)*.15;
        const axial=this.shape==='helix'?(k/FLIGHT_PER_SLOT-.5)*.64:(k/FLIGHT_PER_SLOT-.5)*.20;
        const s=Math.sin(theta)*radius,c=Math.cos(theta)*radius;
        this.pos[j]+= (f.position[0]+a[0]*c+b[0]*s+f.direction[0]*axial-this.pos[j])*alpha;
        this.pos[j+1]+= (f.position[1]+a[1]*c+b[1]*s+f.direction[1]*axial-this.pos[j+1])*alpha;
        this.pos[j+2]+= (f.position[2]+a[2]*c+b[2]*s+f.direction[2]*axial-this.pos[j+2])*alpha;
      }
      // Past practical view distance it disappears, never reverses.
      if(f.age>5.0)this._hideSlot(slot);
    }
  }
}
