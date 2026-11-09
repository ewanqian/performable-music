import test from 'node:test';
import assert from 'node:assert/strict';
import {EnergyStream,MAX_PARTICLES,PARTICLE_KIND,POWER_MAX} from './gesture-stream-engine.mjs';
const hand=(kind,point=[0,0,.25],direction=[0,0,-1])=>({kind,point,direction});
const frames=(f,n,h,dt=1/90)=>{for(let i=0;i<n;i++)f.step(dt,h);};
const countKind=(f,k)=>Array.from(f.live).filter((v,i)=>v&&f.kind[i]===k).length;

test('fist grows stored energy and continuously gathers simulated intake energy',()=>{
  const f=new EnergyStream();
  frames(f,90,{right:hand('fist')});
  assert.ok(f.hands.right.charge>.3 && f.hands.right.charge<=POWER_MAX);
  assert.ok(f.totalEmitted>50);
  assert.ok(f.alive>0);
  assert.ok(countKind(f,PARTICLE_KIND.INTAKE)>0);
});
test('sword streams every frame instead of one orbiting blob',()=>{
  const f=new EnergyStream();
  const e=f.step(1/90,{right:hand('sword')});
  assert.equal(e.filter(x=>x.type==='pulse').length,0);
  frames(f,75,{right:hand('sword')});
  assert.ok(f.totalEmitted>110);
  assert.ok(countKind(f,PARTICLE_KIND.STREAM)>80);
});
test('fist to sword releases charge as stronger high-speed pulse, still streams',()=>{
  const f=new EnergyStream();
  frames(f,135,{right:hand('fist')});
  const charge=f.hands.right.charge;
  const e=f.step(.016,{right:hand('sword')});
  const pulse=e.find(x=>x.type==='pulse');
  assert.ok(pulse && pulse.power>.3 && Math.abs(pulse.power-charge)<.02);
  assert.ok(countKind(f,PARTICLE_KIND.PULSE)>25);
  frames(f,20,{right:hand('sword')});
  assert.ok(countKind(f,PARTICLE_KIND.STREAM)>0);
  assert.ok(f.fronts.length>0);
});
test('longer fist holding makes larger and faster pulse',()=>{
  const a=new EnergyStream('jet',77),b=new EnergyStream('jet',77);
  frames(a,35,{right:hand('fist')});frames(b,185,{right:hand('fist')});
  const x=a.step(.016,{right:hand('sword')}).find(e=>e.type==='pulse');
  const y=b.step(.016,{right:hand('sword')}).find(e=>e.type==='pulse');
  assert.ok(y.count>x.count);
  assert.ok(y.power>x.power);
  assert.ok(b.fronts[0].velocity[2]<a.fronts[0].velocity[2]);
});
test('hand sweeping emits independent aura and leaves a spatial trail',()=>{
  const f=new EnergyStream();
  for(let i=0;i<40;i++)f.step(1/90,{right:hand('neutral',[i*.016,0,.25])});
  assert.ok(f.totalEmitted>10);
  assert.ok(f.hands.right.motion>.1);
  assert.ok(countKind(f,PARTICLE_KIND.AURA)>0);
});
test('real-time sword pointing changes velocity of near particles',()=>{
  const base=new EnergyStream('jet',2),sweep=new EnergyStream('jet',2);
  const first=hand('sword',[0,0,.25],[0,0,-1]);
  frames(base,12,{right:first});frames(sweep,12,{right:first});
  for(let i=0;i<25;i++){
    base.step(.012,{right:hand('sword',[0,0,.25],[0,0,-1])});
    sweep.step(.012,{right:hand('sword',[.11,0,.25],[.9,0,-.43])});
  }
  const mx=f=>{
    let sum=0,n=0;
    for(let i=0;i<MAX_PARTICLES;i++)if(f.live[i]&&f.kind[i]===PARTICLE_KIND.STREAM){
      sum+=f.vel[3*i];n++;
    }
    return sum/Math.max(n,1);
  };
  assert.ok(mx(sweep)>mx(base)+.6);
});
test('one fist attracts nearby existing stream, absorbs particles and fills charge',()=>{
  const f=new EnergyStream();
  f.sample([.35,0,.2],[0,0,0],PARTICLE_KIND.STREAM,1,3);
  const initial=f.alive;
  frames(f,80,{right:hand('fist',[0,0,.2])});
  assert.ok(f.hands.right.charge>.2);
  assert.ok(f.totalEmitted>initial);
  assert.ok(f.alive<=MAX_PARTICLES);
});
test('open palm bursts once on entry, including nearby particles',()=>{
  const f=new EnergyStream();
  frames(f,45,{right:hand('fist')});
  const first=f.step(.016,{right:hand('open')});
  assert.equal(first.filter(e=>e.type==='blast').length,1);
  const power=first.find(e=>e.type==='blast').power;
  assert.ok(power>.1 && f.hands.right.charge===0);
  const next=f.step(.016,{right:hand('open')});
  assert.equal(next.filter(e=>e.type==='blast').length,0);
  assert.ok(countKind(f,PARTICLE_KIND.BURST)>30);
});
test('lost XR tracking preserves charge and never triggers a synthetic release',()=>{
  const f=new EnergyStream();
  frames(f,32,{right:hand('fist')});
  const p=f.hands.right.charge;
  const e=f.step(.016,{right:null});
  assert.ok(!e.some(x=>x.type==='pulse'||x.type==='blast'));
  assert.equal(f.hands.right.charge,p);
});
test('all three presets use physically advancing particles, with finite bounded state',()=>{
  for(const mode of ['jet','ribbon','vortex']){
    const f=new EnergyStream(mode);
    f.configure({turbulence:2.2,output:2});
    for(let i=0;i<1200;i++){
      const kind=i%180<65?'fist':i%180<110?'sword':'open';
      f.step(1/90,{right:hand(kind,[Math.sin(i*.03)*.35,Math.cos(i*.02)*.23,.3],
        [Math.sin(i*.04)*.6,0,-1])});
    }
    assert.ok(f.alive>=0 && f.alive<=MAX_PARTICLES);
    assert.ok(f.pos.every(Number.isFinite));
    assert.ok(f.vel.every(Number.isFinite));
    assert.ok(f.totalEmitted>500);
  }
});
