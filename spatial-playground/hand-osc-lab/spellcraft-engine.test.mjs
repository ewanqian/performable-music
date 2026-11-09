import test from 'node:test';
import assert from 'node:assert/strict';
import {SpellArena,SPELLS,ELEMENTS,STAR_POINTS,circleEvidence,fingerContact} from './spellcraft-engine.mjs';
const h=(kind='neutral',hand='right',point=[0,0,.4],direction=[0,0,-1],extra={})=>
 ({kind,hand,point,direction,...extra});
const has=(events,type)=>events.some(e=>e.type===type);
test('two independently playable lines contain six non-duplicate spells',()=>{
  assert.equal(SPELLS.west.length,6);assert.equal(SPELLS.east.length,6);
  assert.equal(new Set([...SPELLS.west,...SPELLS.east].map(s=>s.id)).size,12);
  for(const s of [...SPELLS.west,...SPELLS.east])
    assert.ok(s.zh&&s.en&&s.detail&&s.how&&Number.isInteger(s.color));
});
test('a closed stroke is required to conjure circle, not a straight line',()=>{
  const points=Array.from({length:36},(_,i)=>[Math.cos(i/35*Math.PI*2)*.19,
    Math.sin(i/35*Math.PI*2)*.19,.13]);
  const e=circleEvidence(points);
  assert.ok(e&&Math.abs(e.turn)>5.5);
  assert.equal(circleEvidence(points.slice(0,10)),null);
  assert.equal(circleEvidence(Array.from({length:35},(_,i)=>[i*.015,0,.1])),null);
});
test('thumb contact selects a unique fingertip, refuses ambiguity',()=>{
  const p=Array.from({length:25},(_,i)=>[i*.02,0,0]);
  p[4]=[.180,.006,0];p[9]=[.180,0,0];
  assert.equal(fingerContact(p),0);
  p[14]=p[9].slice();assert.equal(fingerContact(p),null);
});
test('west 1: open palm charge, close release fires projectile',()=>{
  const a=new SpellArena('west');
  for(let i=0;i<28;i++)a.step(1/60,[h('open')]);
  const events=a.step(1/60,[h('fist')]);
  assert.ok(has(events,'cast'));assert.equal(a.projectiles.length,1);
});
test('west 2: sword holds frost then release shatters',()=>{
  const a=new SpellArena('west');a.select(1);
  assert.ok(has(a.step(.04,[h('sword')]),'freeze'));
  assert.ok(has(a.step(.04,[h('neutral')]),'shatter'));
});
test('west 3: chain lightning jumps to several targets',()=>{
  const a=new SpellArena('west');a.select(2);
  const out=a.step(.02,[h('sword')]);assert.ok(has(out,'chain'));
  assert.ok(a.score>=30);
});
test('west 4: open palm shield blocks an incoming periodic challenge',()=>{
  const a=new SpellArena('west');a.select(3);
  let blocks=0;
  for(let i=0;i<125;i++)blocks+=a.step(.02,[h('open')]).filter(e=>e.type==='block').length;
  assert.ok(blocks>=1);assert.equal(a.life,5);
  const b=new SpellArena('west');b.select(3);
  for(let i=0;i<110;i++)b.step(.02,[h('neutral')]);
  assert.ok(b.life<5);
});
test('west 5: fist attraction then release launches a controlled volley',()=>{
  const a=new SpellArena('west');a.select(4);
  for(let i=0;i<33;i++)a.step(.02,[h('fist')]);
  assert.ok(has(a.step(.02,[h('open')]),'volley'));
  assert.equal(a.projectiles.length,3);
});
test('west 6: a drawn gate must be rearmed by release before firing',()=>{
  const a=new SpellArena('west');a.select(5);
  for(let i=0;i<36;i++)a.record([Math.cos(i/35*Math.PI*2)*.2,
    Math.sin(i/35*Math.PI*2)*.2,.2]);
  assert.equal(a.armed,true);
  for(let i=0;i<8;i++)a.step(.03,[h('sword')]);
  assert.equal(a.projectiles.length,0);
  a.step(.03,[h('neutral')]);
  assert.ok(has(a.step(.03,[h('sword')]),'cast'));
});
test('east 1: circle builds paper talisman, second sword casts it',()=>{
  const a=new SpellArena('east');
  for(let i=0;i<36;i++)a.record([.2*Math.cos(i*Math.PI*2/35),.2*Math.sin(i*Math.PI*2/35),.15]);
  assert.equal(a.armed,true);
  for(let i=0;i<8;i++)a.step(.03,[h('sword')]);
  assert.equal(a.projectiles.length,0);
  a.step(.03,[h('neutral')]);
  const evt=a.step(.03,[h('sword')]);
  assert.ok(has(evt,'cast'));assert.equal(a.projectiles[0].type,'talisman');
});
test('east 2: sword charges nine projectiles and fires on explicit release',()=>{
  const a=new SpellArena('east');a.select(1);
  for(let i=0;i<22;i++)a.step(.03,[h('sword')]);
  assert.ok(has(a.step(.03,[h('neutral')]),'volley'));
  assert.equal(a.projectiles.length,9);
});
test('east 3: open both palms forms sword array, sword invokes it',()=>{
  const a=new SpellArena('east');a.select(2);
  a.step(.03,[h('open','left',[-.2,0,.2]),h('open','right',[.2,0,.2])]);
  assert.ok(a.formation>0);
  const evt=a.step(.03,[h('sword','right')]);
  assert.ok(has(evt,'volley'));assert.equal(a.projectiles.length,6);
});
test('east 4: five material choices, correct match earns bonus',()=>{
  const a=new SpellArena('east');a.select(3);
  assert.equal(ELEMENTS.length,5);
  a.setElement(4);
  assert.equal(a.element,4);
  a.targets[4].respawn=0;
  assert.equal(a.strike(a.targets[4],'elemental'),true);
  assert.ok(a.score>=35);
});
test('east 5: palm restrains and sword launches a binding seal',()=>{
  const a=new SpellArena('east');a.select(4);
  assert.ok(has(a.step(.04,[h('open')]),'seal-field'));
  assert.ok(has(a.step(.04,[h('sword')]),'cast'));
});
test('east 6: ordered seven-star route reaches constellation finale',()=>{
  const a=new SpellArena('east');a.select(5);
  assert.equal(STAR_POINTS.length,7);
  for(let i=0;i<6;i++){a.manual();assert.equal(a.route,i+1);}
  a.events=[];
  a.manual();
  assert.ok(has(a.events,'constellation'));assert.equal(a.route,0);
  assert.ok(a.score>=70);
});
test('fast projectile crossing a target between frames still scores via swept collision',()=>{
  const a=new SpellArena('west');
  const t=a.targets[2];
  t.base=[0,0,-.96];t.position=t.base.slice();t.phase=0;
  const p=a.cast('fireball',[0,0,.22],[0,0,-1]);
  p.velocity=[0,0,-38]; // A single 50ms step travels nearly 2 metres.
  const before=a.score;
  a.step(.05,[]);
  assert.ok(a.score>before,'swept collision should register the crossed target');
});
test('projectiles and hit feedback remain bounded during 6,000 frames',()=>{
  const a=new SpellArena('east');a.select(1);
  for(let i=0;i<6000;i++){
    a.step(.016,[h(i%7===0?'sword':'neutral')]);
    if(i%45===0)a.manual();
  }
  assert.ok(a.projectiles.length<=90);
  for(const p of a.projectiles)assert.ok(p.position.every(Number.isFinite));
});
