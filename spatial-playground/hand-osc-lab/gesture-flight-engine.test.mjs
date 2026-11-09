import test from 'node:test';
import assert from 'node:assert/strict';
import {GestureCombo,FlightSwarm,FLIGHT_SPEED,FLIGHT_PARTICLES,RECALL_SECONDS} from './gesture-flight-engine.mjs';
const hand=(hand,kind,p=[0,0,.22],d=[0,0,-1])=>({hand,kind,point:p,direction:d});
test('sword casts immediately and held sword emits spaced leaders',()=>{
  const c=new GestureCombo(),r=hand('right','sword');
  assert.equal(c.update({right:r},1000,false)[0]?.type,'cast');
  assert.equal(c.update({right:r},1150,true).length,0);
  assert.equal(c.update({right:r},1600,true)[0]?.type,'cast');
});
test('open palm blasts only once while held and does not invent cast',()=>{
  const c=new GestureCombo(),p=hand('right','open');
  assert.equal(c.update({right:p},1000,true)[0]?.type,'burst');
  assert.equal(c.update({right:p},1200,true).length,0);
  c.update({right:hand('right','neutral')},1330,true);
  assert.equal(c.update({right:p},1400,true)[0]?.type,'burst');
});
test('recall requires right fist THEN a later left fist; no phantom recall on lost hand',()=>{
  const c=new GestureCombo();
  c.update({right:hand('right','fist')},1000,true);
  assert.equal(c.update({right:null,left:hand('left','fist')},1030,true).some(e=>e.type==='recall'),false);
  c.update({left:hand('left','neutral')},1080,true);
  const r=c.update({right:hand('right','fist',[.3,.2,.4]),left:hand('left','fist')},1120,true);
  assert.equal(r.filter(e=>e.type==='recall').length,1);
  assert.deepEqual(r.find(e=>e.type==='recall').point,[.3,.2,.4]);
  assert.equal(c.update({right:null,left:null},1200,true).length,0);
});
test('left-first or stale right-ready never recalls',()=>{
  const c=new GestureCombo();
  c.update({left:hand('left','fist')},100,true);
  assert.equal(c.update({right:hand('right','fist'),left:hand('left','fist')},200,true).some(e=>e.type==='recall'),false);
  c.update({left:hand('left','neutral')},290,true);
  assert.equal(c.update({left:hand('left','fist')},3300,true).some(e=>e.type==='recall'),false);
});
test('leader travels more than 10m in two seconds and never returns home',()=>{
  const f=new FlightSwarm('cloud');
  const s=f.launch([0,0,.25],[0,0,-1]);assert.equal(s.slot,0);
  for(let i=0;i<100;i++)f.step(.02,[0,0,0]);
  assert.ok(f.flights[0].position[2]<-11.5);
  assert.ok(f.flights[0].position[2]<.25-2*FLIGHT_SPEED+.2);
  assert.equal(f.activeCount,1);
  assert.equal(f.pos.length,FLIGHT_PARTICLES*3);
});
test('120 followers form tight cluster around a moving lead point',()=>{
  const f=new FlightSwarm('helix');f.launch([0,0,0],[1,0,0]);
  for(let i=0;i<24;i++)f.step(.016);
  const centre=f.flights[0].position;
  let near=0;
  for(let i=0;i<120;i++){
    const p=[f.pos[i*3],f.pos[i*3+1],f.pos[i*3+2]];
    if(Math.hypot(...p.map((v,j)=>v-centre[j]))<.9)near++;
  }
  assert.ok(near>100);
});
test('burst makes follower velocity diverge and does not switch to home spring',()=>{
  const f=new FlightSwarm();f.launch([.2,.1,.0],[0,0,-1]);
  for(let i=0;i<20;i++)f.step(.015);
  assert.equal(f.burst([.1,.0,0]),1);
  assert.equal(f.flights[0].mode,'scatter');
  const z=f.flights[0].position[2];
  for(let i=0;i<50;i++)f.step(.02);
  assert.ok(f.flights[0].position[2]<z-5);
  assert.ok(f.velocity.some(v=>Math.abs(v)>.5));
});
test('recall goes straight to latest hand position in 230ms without overshoot',()=>{
  const f=new FlightSwarm();f.launch([0,0,0],[0,0,-1]);
  for(let i=0;i<100;i++)f.step(.02);
  const z=f.flights[0].position[2];
  assert.ok(z < -10);
  assert.equal(f.recall(),1);
  const target=[.3,-.1,.5];
  for(let i=0;i<15;i++)f.step(RECALL_SECONDS/15,target);
  assert.equal(f.activeCount,0);
  assert.ok(f.pos.every(Number.isFinite));
  assert.ok(f.flights[0].mode==='idle');
});
