// Gesture Dynamics V3 — continuously advected spatial energy.
// Pure deterministic 3D particle simulation; no telemetry, engine dependency or XR imports.
// This is a stylized Lagrangian particle field with divergence-free curl forcing,
// NOT a Navier–Stokes fluid solver. Inputs and outputs are in WebXR local metres.

export const MAX_PARTICLES = 1536;
export const PARTICLE_KIND = Object.freeze({
  AURA: 0, STREAM: 1, PULSE: 2, INTAKE: 3, BURST: 4
});
export const POWER_MAX = 4.0;
const HIDDEN = -999;
const TAU = Math.PI*2;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number.isFinite(v)?v:a));
const valid=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
const length=v=>Math.hypot(v[0],v[1],v[2]);
const normalize=p=>{const d=length(p)||1;return p.map(v=>v/d);};
const seedRandom=s0=>{
  let s=(s0>>>0)||1;
  return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};
};
const makeHand=()=>({
  kind:'neutral',charge:0,motion:0,point:null,direction:[0,0,-1],
  velocity:[0,0,0],emitStream:0,emitAura:0,emitIntake:0,
  speed:0,present:false
});
const kindOf=hand=>['sword','open','fist','neutral'].includes(hand?.kind)?hand.kind:'neutral';

export class EnergyStream {
  constructor(mode='jet',seed=717){
    this.rng=seedRandom(seed);this.mode=mode;
    this.pos=new Float32Array(MAX_PARTICLES*3);
    this.previous=new Float32Array(MAX_PARTICLES*3);
    this.vel=new Float32Array(MAX_PARTICLES*3);
    this.age=new Float32Array(MAX_PARTICLES);
    this.ttl=new Float32Array(MAX_PARTICLES);
    this.kind=new Uint8Array(MAX_PARTICLES);
    this.owner=new Uint8Array(MAX_PARTICLES);
    this.live=new Uint8Array(MAX_PARTICLES);
    this.energy=new Float32Array(MAX_PARTICLES);
    this.hands={left:makeHand(),right:makeHand()};
    this.fronts=[];this.events=[];
    this.turbulence=.65;this.output=1.0;this.time=0;this.next=0;
    this.alive=0;this.totalEmitted=0;this.reset(mode);
  }
  reset(mode=this.mode){
    this.mode=['jet','ribbon','vortex'].includes(mode)?mode:'jet';
    this.live.fill(0);this.pos.fill(0);this.previous.fill(0);
    for(let i=0;i<MAX_PARTICLES;i++){
      this.pos[3*i+1]=HIDDEN;this.previous[3*i+1]=HIDDEN;
    }
    this.hands.left=makeHand();this.hands.right=makeHand();
    this.fronts.length=0;this.events=[];this.next=0;this.time=0;
    this.alive=0;this.totalEmitted=0;
  }
  configure({turbulence=this.turbulence,output=this.output}={}){
    this.turbulence=clamp(turbulence,0,2.2);
    this.output=clamp(output,.2,2.0);
  }
  sample(point,velocity,kind,owner=0,ttl=1,intensity=1){
    if(!valid(point)||!valid(velocity))return -1;
    const i=this.next;this.next=(i+1)%MAX_PARTICLES;const j=i*3;
    if(!this.live[i])this.alive++;
    this.live[i]=1;this.kind[i]=kind;this.owner[i]=owner;
    this.age[i]=0;this.ttl[i]=ttl;this.energy[i]=intensity;
    for(let a=0;a<3;a++){
      this.pos[j+a]=this.previous[j+a]=point[a];
      this.vel[j+a]=velocity[a];
    }
    this.totalEmitted++;
    return i;
  }
  kill(i){
    if(!this.live[i])return;
    this.live[i]=0;this.alive--;
    const j=3*i;this.pos[j]=0;this.pos[j+1]=HIDDEN;this.pos[j+2]=0;
    this.previous[j]=0;this.previous[j+1]=HIDDEN;this.previous[j+2]=0;
  }
  // Quick hand movement emits loose, physically moving sparks and stores kinetic energy.
  emitAura(side,h,count){
    const rnd=this.rng;
    for(let n=0;n<count;n++){
      const jitter=(rnd()-.5)*.085;
      const p=[h.point[0]+jitter,h.point[1]+(rnd()-.5)*.08,h.point[2]+(rnd()-.5)*.08];
      const v=[h.velocity[0]*.52+(rnd()-.5)*.55,
        h.velocity[1]*.52+(rnd()-.5)*.55,
        h.velocity[2]*.52+(rnd()-.5)*.55];
      this.sample(p,v,PARTICLE_KIND.AURA,side==='right'?1:0,.56+rnd()*.42,.45);
    }
  }
  // Stream emits EVERY frame while sword is detected: not one detached orbiting ball.
  emitStream(side,h,count,charged=false){
    const rnd=this.rng;
    const wide=this.mode==='ribbon'?1.75:this.mode==='vortex'?1.50:1;
    const speed=3.7+this.output*1.35+h.motion*.72;
    const dir=h.direction;
    const right=normalize(Math.abs(dir[1])>.84?[1,0,0]:[dir[2],0,-dir[0]]);
    const up=[dir[1]*right[2]-dir[2]*right[1],
      dir[2]*right[0]-dir[0]*right[2],
      dir[0]*right[1]-dir[1]*right[0]];
    for(let n=0;n<count;n++){
      const b=(rnd()-.5)*.018;
      const transverse=(rnd()-.5)*(this.mode==='ribbon'?4.5:2.65*wide);
      const transverse2=(rnd()-.5)*(this.mode==='ribbon'?.38:1.72*wide);
      const p=[
        h.point[0]+dir[0]*b+right[0]*b,
        h.point[1]+dir[1]*b+right[1]*b,
        h.point[2]+dir[2]*b+right[2]*b];
      const v=[
        dir[0]*(speed+rnd()*2.1)+right[0]*transverse+up[0]*transverse2+h.velocity[0]*.35,
        dir[1]*(speed+rnd()*2.1)+right[1]*transverse+up[1]*transverse2+h.velocity[1]*.35,
        dir[2]*(speed+rnd()*2.1)+right[2]*transverse+up[2]*transverse2+h.velocity[2]*.35];
      this.sample(p,v,charged?PARTICLE_KIND.PULSE:PARTICLE_KIND.STREAM,
        side==='right'?1:0,charged?1.8+rnd()*.8:1.32+rnd()*.68,
        charged?1.4:.92);
    }
  }
  // Sustained fist attracts the existing field AND creates converging energy filaments.
  emitIntake(side,h,count){
    const rnd=this.rng;
    for(let n=0;n<count;n++){
      const theta=rnd()*TAU,z=rnd()*2-1,r=Math.sqrt(1-z*z);
      const distance=.20+rnd()*.69;
      const radial=[r*Math.cos(theta),r*Math.sin(theta),z];
      const p=h.point.map((v,i)=>v+radial[i]*distance);
      const tangential=[-radial[1],radial[0],.35*Math.sin(theta)];
      const v=radial.map((v,i)=>-v*(1.6+rnd()*1.1)+tangential[i]*.8);
      this.sample(p,v,PARTICLE_KIND.INTAKE,side==='right'?1:0,.40+rnd()*.55,.72);
    }
  }
  pulse(side,h,charge){
    const power=clamp(charge,0,POWER_MAX);
    const count=Math.floor((22+power*58)*this.output);
    this.emitStream(side,h,Math.min(320,count),true);
    const travel=6.7+power*1.8;
    this.fronts.push({point:h.point.slice(),velocity:h.direction.map(v=>v*travel),
      life:.55+power*.12,strength:power,side});
    if(this.fronts.length>8)this.fronts.shift();
    this.events.push({type:'pulse',side,power,count,origin:h.point.slice()});
  }
  blast(side,h,charge){
    const power=clamp(charge,0,POWER_MAX);
    const strength=3.9+power*2.1;
    const rnd=this.rng;
    let affected=0;
    for(let i=0;i<MAX_PARTICLES;i++){
      if(!this.live[i])continue;
      const j=3*i,dx=this.pos[j]-h.point[0],dy=this.pos[j+1]-h.point[1],dz=this.pos[j+2]-h.point[2];
      const d=Math.hypot(dx,dy,dz);
      if(d>2.8)continue;
      const inv=1/(d||1);
      const impulse=(1-d/3.0)*strength;
      this.vel[j]+=(dx*inv+(rnd()-.5)*.65)*impulse;
      this.vel[j+1]+=(dy*inv+(rnd()-.5)*.65)*impulse;
      this.vel[j+2]+=(dz*inv+(rnd()-.5)*.65)*impulse;
      this.kind[i]=PARTICLE_KIND.BURST;
      this.ttl[i]=Math.max(this.ttl[i],this.age[i]+.85);affected++;
    }
    const generated=Math.floor((42+power*62)*this.output);
    for(let n=0;n<Math.min(330,generated);n++){
      const theta=rnd()*TAU,z=rnd()*2-1,r=Math.sqrt(1-z*z);
      const d=[Math.cos(theta)*r,Math.sin(theta)*r,z];
      const v=d.map(x=>x*(strength*(.6+rnd()*.4)));
      this.sample(h.point,v,PARTICLE_KIND.BURST,side==='right'?1:0,.75+rnd()*.65,1.5);
    }
    this.events.push({type:'blast',side,power,affected,generated});
  }
  processHand(side,sample,dt){
    const h=this.hands[side],old=h.kind;
    if(!sample||!valid(sample.point)||!valid(sample.direction)){
      h.present=false;h.kind='neutral';h.point=null;h.speed=0;
      h.velocity=[0,0,0];h.emitStream=0;h.emitAura=0;h.emitIntake=0;
      // Preserve stored charge on temporary tracking loss without triggering spells.
      return;
    }
    const next=kindOf(sample),p=sample.point,d=normalize(sample.direction);
    const vx=h.point&&dt>0?clamp((p[0]-h.point[0])/dt,-5,5):0;
    const vy=h.point&&dt>0?clamp((p[1]-h.point[1])/dt,-5,5):0;
    const vz=h.point&&dt>0?clamp((p[2]-h.point[2])/dt,-5,5):0;
    const smoothing=1-Math.exp(-18*dt);
    h.velocity=[
      h.velocity[0]+(vx-h.velocity[0])*smoothing,
      h.velocity[1]+(vy-h.velocity[1])*smoothing,
      h.velocity[2]+(vz-h.velocity[2])*smoothing];
    h.speed=clamp(length(h.velocity),0,4.5);
    // Directly use current hand direction: no 600ms chasing an older aim.
    h.direction=d;
    h.point=p.slice();h.kind=next;h.present=true;
    h.motion=clamp(h.motion*Math.exp(-1.2*dt)+Math.max(0,h.speed-.35)*dt*.85,0,1.8);
    if(h.speed>.34){
      h.emitAura+=dt*clamp(29+h.speed*38,0,180)*this.output;
      const count=Math.min(12,Math.floor(h.emitAura));h.emitAura-=count;
      this.emitAura(side,h,count);
      if(h.speed>1.1)this.events.push({type:'motion',side,speed:h.speed});
    }
    if(next==='fist'){
      // 0.4 s produces a small charge; ~2.5 s gives a strong jet.
      h.charge=clamp(h.charge+dt*(.51+h.speed*.25+h.motion*.25),0,POWER_MAX);
      h.emitIntake+=dt*(90+h.speed*24)*this.output;
      const count=Math.min(12,Math.floor(h.emitIntake));h.emitIntake-=count;
      this.emitIntake(side,h,count);
      if(old!=='fist')this.events.push({type:'collect',side});
    }else{
      h.emitIntake=0;
      if(next==='sword'){
        if(old!=='sword' && h.charge>.14){
          this.pulse(side,h,h.charge);h.charge=0;h.emitStream=0;
        }
        h.emitStream+=dt*(280+h.speed*60+this.output*55)*this.output;
        const count=Math.min(26,Math.floor(h.emitStream));
        h.emitStream-=count;this.emitStream(side,h,count);
      }else{
        h.emitStream=0;
        if(next==='open'&&old!=='open'){
          this.blast(side,h,h.charge);h.charge=0;h.motion*=.35;
        }
        // Absent an active fist, charged energy stays ready briefly.
        h.charge=Math.max(0,h.charge-dt*.10);
      }
    }
  }
  step(dt,hands={}){
    dt=clamp(dt,0,.05);this.events=[];
    if(dt===0)return this.events;
    this.time+=dt;
    this.processHand('left',hands.left||null,dt);
    this.processHand('right',hands.right||null,dt);
    for(let i=0;i<MAX_PARTICLES;i++){
      if(!this.live[i])continue;
      const j=3*i;
      this.age[i]+=dt;if(this.age[i]>this.ttl[i]){this.kill(i);continue;}
      let x=this.pos[j],y=this.pos[j+1],z=this.pos[j+2];
      let vx=this.vel[j],vy=this.vel[j+1],vz=this.vel[j+2];
      // Divergence-free 3D curl field (components depend on other axes).
      const k=this.mode==='vortex'?4.1:3.5;
      const strength=this.turbulence*(this.mode==='vortex'?4.2:2.3);
      let ax=-Math.cos(k*z-this.time*1.9)*strength;
      let ay=-Math.cos(k*x+this.time*1.6)*strength;
      let az=-Math.cos(k*y-this.time*1.4)*strength;
      for(const side of ['left','right']){
        const h=this.hands[side];if(!h.present||!h.point)continue;
        const dx=x-h.point[0],dy=y-h.point[1],dz=z-h.point[2];
        const d=Math.hypot(dx,dy,dz);
        if(h.kind==='fist'&&d<3.4){
          const fall=Math.pow(1-d/3.4,1.65);
          const pull=34*fall/(.28+d);
          ax-=dx/(d||1)*pull;ay-=dy/(d||1)*pull;az-=dz/(d||1)*pull;
          // Absorb close particles into a usable charge, rather than orbital trapping.
          if(d<.094){h.charge=clamp(h.charge+.009,0,POWER_MAX);this.kill(i);break;}
        }
        if(h.kind==='sword'&&d<1.65){
          const forward=dx*h.direction[0]+dy*h.direction[1]+dz*h.direction[2];
          const cone=Math.max(0,forward+.26);
          const fall=Math.pow(1-d/1.65,2);
          if(cone>0){
            const influence=fall*1.35;
            // Latest finger direction bends nearby stream, plus physically measured hand sweep.
            ax+=(h.direction[0]*5.6+h.velocity[0]*6.0-vx*.25)*influence;
            ay+=(h.direction[1]*5.6+h.velocity[1]*6.0-vy*.25)*influence;
            az+=(h.direction[2]*5.6+h.velocity[2]*6.0-vz*.25)*influence;
            // Moving hands create a local swirl, which fades with distance.
            ax+=(-dy*h.velocity[2]+dz*h.velocity[1])*fall*2.6;
            ay+=(-dz*h.velocity[0]+dx*h.velocity[2])*fall*2.6;
            az+=(-dx*h.velocity[1]+dy*h.velocity[0])*fall*2.6;
          }
        }
        if(h.kind==='open'&&d<1.6 && d>.001){
          const impulse=3.8*Math.pow(1-d/1.6,2);
          ax+=dx/d*impulse;ay+=dy/d*impulse;az+=dz/d*impulse;
        }
      }
      if(!this.live[i])continue;
      // Velocity-based dynamics + bounded integration. Trails are position history.
      const drag=Math.exp(-(this.kind[i]===PARTICLE_KIND.AURA?.95:.21)*dt);
      vx=clamp((vx+ax*dt)*drag,-18,18);
      vy=clamp((vy+ay*dt)*drag,-18,18);
      vz=clamp((vz+az*dt)*drag,-18,18);
      this.previous[j]=x;this.previous[j+1]=y;this.previous[j+2]=z;
      x+=vx*dt;y+=vy*dt;z+=vz*dt;
      if(!Number.isFinite(x+y+z)||Math.hypot(x,y,z)>45){this.kill(i);continue;}
      this.pos[j]=x;this.pos[j+1]=y;this.pos[j+2]=z;
      this.vel[j]=vx;this.vel[j+1]=vy;this.vel[j+2]=vz;
    }
    this.fronts=this.fronts.filter(f=>{
      f.life-=dt;if(f.life<=0)return false;
      for(let a=0;a<3;a++)f.point[a]+=f.velocity[a]*dt;
      return true;
    });
    return this.events;
  }
}
