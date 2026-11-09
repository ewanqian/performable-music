import test from 'node:test';
import assert from 'node:assert/strict';
import {sector8,SpellHandMenu,palmAim,assistedAim,RADIAL_LABELS} from './spellcraft-controls.mjs';
const h=(hand,kind,point,extras={})=>({hand,kind,point,direction:[0,0,-1],
  palmFacingViewer:hand==='left',inView:true,...extras});
const left=(kind='open',x=-.2)=>h('left',kind,[x,.02,.22]);
const right=(kind='neutral',x=.23,y=-.1)=>h('right',kind,[x,y,.24]);
test('eight radial directions are stable and center is a dead zone',()=>{
 assert.deepEqual([[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]]
   .map(([x,y])=>sector8(x*.22,y*.22)),[0,1,2,3,4,5,6,7]);
 assert.equal(sector8(.025,.02),-1);
 assert.equal(sector8(NaN,0),-1);
 assert.equal(RADIAL_LABELS.length,8);
});
test('showing left palm opens explicit menu after short dwell, not on a glance',()=>{
 const m=new SpellHandMenu();
 assert.equal(m.update({left:left(),now:0}).active,false);
 assert.equal(m.update({left:left(),now:130}).active,false);
 const s=m.update({left:left(),now:190});
 assert.equal(s.active,true);
 assert.ok(s.events.some(e=>e.type==='menu-open'));
});
test('left palm horizontal swipes choose wizard or Chinese sorcerer, without repeated toggling',()=>{
 const m=new SpellHandMenu();
 m.update({left:left(),now:0});m.update({left:left(),now:200});
 const chinese=m.update({left:left('open',-.02),now:610});
 assert.ok(chinese.events.some(e=>e.type==='line'&&e.line==='east'));
 assert.equal(m.update({left:left('open',-.02),now:640}).events.some(e=>e.type==='line'),false);
 const wizard=m.update({left:left('open',-.28),now:1100});
 assert.ok(wizard.events.some(e=>e.type==='line'&&e.line==='west'));
});
test('right fist held and shifted into sector 2 selects skill on deliberate release',()=>{
 const m=new SpellHandMenu();
 m.update({left:left(),now:0});m.update({left:left(),now:200});
 const a=m.update({left:left(),right:right('fist'),now:260});
 assert.equal(a.wheel?.selected,-1);
 assert.equal(m.update({left:left(),right:right('fist',.43,-.1),now:320}).wheel?.candidate,2);
 assert.equal(m.update({left:left(),right:right('fist',.43,-.1),now:420}).wheel?.selected,2);
 const released=m.update({left:left(),right:right('open',.43,-.1),now:500});
 assert.deepEqual(released.events.filter(e=>e.type==='skill').map(e=>e.index),[2]);
 assert.equal(released.cooldownUntil,720);
});
test('skill wheel slots six and seven switch tradition/reset, never fake skills',()=>{
 for(const [slot,expected] of [[6,'toggle-line'],[7,'reset']]){
  const m=new SpellHandMenu();m.update({left:left(),now:0});m.update({left:left(),now:200});
  const theta=Math.PI/2-slot*Math.PI/4;
  const x=.23+Math.cos(theta)*.23,y=-.1+Math.sin(theta)*.23;
  m.update({left:left(),right:right('fist'),now:260});
  m.update({left:left(),right:right('fist',x,y),now:300});
  m.update({left:left(),right:right('fist',x,y),now:390});
  const result=m.update({left:left(),right:right('neutral',x,y),now:510});
  assert.ok(result.events.some(e=>e.type===expected));
 }
});
test('lost tracking must cancel wheel and must never select a spell',()=>{
 const m=new SpellHandMenu();
 m.update({left:left(),now:0});m.update({left:left(),now:200});
 m.update({left:left(),right:right('fist'),now:300});
 m.update({left:left(),right:right('fist',.48,-.1),now:350});
 m.update({left:left(),right:right('fist',.48,-.1),now:450});
 const result=m.update({left:left(),right:null,now:550});
 assert.equal(result.wheel,null);
 assert.ok(result.events.some(e=>e.type==='wheel-cancel'));
 assert.equal(result.events.some(e=>e.type==='skill'),false);
});
test('right fist when left palm is absent never opens a menu, gameplay stays active',()=>{
 const m=new SpellHandMenu();
 for(let t=0;t<=320;t+=40){
  assert.equal(m.update({left:null,right:right('fist'),now:t}).active,false);
 }
});
test('lowering left palm exits menu without accidental casts',()=>{
 const m=new SpellHandMenu();
 m.update({left:left(),now:0});m.update({left:left(),now:200});
 m.update({left:null,now:260});
 const result=m.update({left:null,now:560});
 assert.equal(result.active,false);
 assert.ok(result.events.some(e=>e.type==='menu-close'));
});
test('assisted aiming picks a visible nearby forward target but not one behind',()=>{
 const targets=[
  {id:0,position:[0,0,-1]},
  {id:1,position:[1.0,0,-1]},
  {id:2,position:[0,0,1]}
 ];
 const origin=[0,0,.35];
 const r=assistedAim(origin,[.20,0,-1],targets);
 assert.equal(r.target,0);assert.equal(r.lock,true);
 assert.ok(r.direction[2]<-.95);
 const miss=assistedAim(origin,[0,0,1],targets.filter(t=>t.id!==2));
 assert.equal(miss.lock,false);
});
test('palm aiming builds a real bone-plane normal and sword extends fingertip',()=>{
 const points=Array.from({length:25},()=>[0,0,-.5]);
 // palm faces viewer; spread knuckles and middle extends vertically from wrist
 points[0]=[0,-.20,-.45];
 points[5]=[-.09,0,-.50];points[10]=[-.02,.03,-.50];
 points[15]=[.04,.02,-.50];points[20]=[.095,-.01,-.50];
 points[6]=[-.09,.08,-.50];points[11]=[-.01,.08,-.5];
 points[9]=[-.09,.20,-.67];points[14]=[-.01,.20,-.67];
 const viewer={position:[0,0,0],forward:[0,0,-1]};
 const palm=palmAim(points,{kind:'open'},viewer);
 assert.equal(palm.inView,true);
 assert.equal(palm.palmFacingViewer,true);
 assert.equal(palm.aimKind,'PALM');
 assert.ok(palm.direction[2]<0);
 const sword=palmAim(points,{kind:'sword'},viewer);
 assert.equal(sword.aimKind,'FINGER');
 assert.ok(sword.direction[2]<-.20);
});
