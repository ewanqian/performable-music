import test from 'node:test';
import assert from 'node:assert/strict';
import {WarlockMotion,CONTROL_THRESHOLDS} from './motion-grammar.mjs';
const h=(kind='neutral',p=[0,0,.25],dir=[0,0,-1])=>({kind,point:p,direction:dir,
  staffAxis:[0,0,-1],muzzle:[0,.6,-.12],stale:false});
const step=(m,t,right=null,left=null,extra={})=>m.advance(t,{right,left,...extra});
const events=(arr,type)=>arr.some(e=>e.type===type);
test('staff equipped by fist with single distinct super entry',()=>{
  const m=new WarlockMotion('stasis');
  assert.ok(events(step(m,0,h('fist')),'equip'));
  assert.equal(events(step(m,80,h('fist')),'equip'),false);
  assert.ok(events(step(m,100,h('neutral')),'super-enter'));
  assert.equal(events(step(m,110,h('neutral')),'super-enter'),false);
});
test('staff fires repeated ice bolts by shaft aim, not sword-finger state',()=>{
  const m=new WarlockMotion('stasis');
  step(m,0,h('fist'));
  step(m,60,h('neutral'));
  step(m,90,h('neutral'));
  assert.ok(events(step(m,275,h('neutral')),'freeze-bolt'));
  assert.equal(events(step(m,340,h('neutral')),'freeze-bolt'),false);
  assert.ok(events(step(m,600,h('neutral')),'freeze-bolt'));
});
test('staff pointed behind does not emit a freezing bolt',()=>{
  const m=new WarlockMotion('stasis');
  step(m,0,h('fist'));step(m,60,h('neutral'));
  for(let t=100;t<1000;t+=50)assert.equal(events(step(m,t,{...h('neutral'),staffAxis:[0,0,1]}),'freeze-bolt'),false);
});
test('raise alone arms shatter; explicit downward stroke releases; no double shatter',()=>{
  const m=new WarlockMotion('stasis');
  step(m,0,h('fist'));step(m,60,h('neutral'));
  step(m,110,h('neutral',[0,.02,.25]));
  step(m,160,h('neutral',[0,.10,.25]));
  const up=step(m,220,h('neutral',[0,.35,.25]));
  assert.ok(events(up,'shatter-armed'));
  assert.equal(events(up,'shatter-wave'),false);
  const down=step(m,290,h('neutral',[0,.08,.25]));
  assert.ok(events(down,'shatter-wave'));
  assert.equal(events(step(m,330,h('neutral',[0,.08,.25])),'shatter-wave'),false);
});
test('unraised staff open palm cannot trigger accidental global shatter',()=>{
  const m=new WarlockMotion('stasis');
  step(m,0,h('fist'));step(m,60,h('neutral'));
  for(let t=100;t<700;t+=30)assert.equal(events(step(m,t,h('open',[0,.01,.25])),'shatter-wave'),false);
});
test('Solar Daybreak requires actual fast arm slash, not held sword finger',()=>{
  const m=new WarlockMotion('solar','daybreak');
  step(m,0,h('neutral'),null,{superPressed:true});
  for(let t=40;t<360;t+=40){
    assert.equal(events(step(m,t,h('sword',[0,0,.25])),'sword-slash'),false);
  }
  const swingEvents=[];
  for(let i=0;i<5;i++)swingEvents.push(...step(m,400+i*30,h('open',[i*.09,0,.25])));
  swingEvents.push(...step(m,550,h('open',[.47,0,.25])));
  assert.equal(swingEvents.filter(e=>e.type==='sword-slash').length,1);
  assert.equal(events(step(m,580,h('open',[.54,0,.25])),'sword-slash'),false);
});
test('Arc Stormtrance continuously follows open hands, not rapid one-shot projectiles',()=>{
  const m=new WarlockMotion('arc','stormtrance');
  assert.ok(events(step(m,0,h('open')),'lightning-start'));
  assert.ok(events(step(m,125,h('open')),'chain-update'));
  assert.ok(events(step(m,240,h('open',null??[0,0,.25],[.2,0,-1])),'chain-update'));
  assert.ok(events(step(m,290,h('fist')),'lightning-stop'));
});
test('Arc Chaos Reach requires both hands stabilized, releases when posture ends',()=>{
  const m=new WarlockMotion('arc','chaos-reach');
  const l=h('open',[-.2,0,.2]);
  step(m,0,h('open',[.2,0,.2]),l);
  assert.equal(events(step(m,100,h('open',[.2,0,.2]),l),'beam-start'),false);
  assert.ok(events(step(m,170,h('open',[.2,0,.2]),l),'beam-start'));
  assert.ok(events(step(m,270,h('open',[.2,.02,.2]),l),'beam-update'));
  assert.ok(events(step(m,310,h('fist',[.2,0,.2]),l),'beam-stop'));
});
test('Void two-hand gather then release selects Cataclysm versus Vortex variant',()=>{
  for(const kind of ['cataclysm','vortex']){
    const m=new WarlockMotion('void',kind);
    const l=h('open',[-.1,0,.2]);
    step(m,0,h('fist',[.1,0,.2]),l);
    step(m,60,h('fist',[.1,0,.2]),l);
    step(m,160,h('fist',[.1,0,.05]),l);
    const e=step(m,230,h('open',[.1,0,-.26]),l);
    assert.ok(events(e,'nova-throw')||events(e,'nova-release'));
    assert.ok(e.some(x=>x.kind===kind));
  }
});
test('short pose dropouts never trigger throw, slash or ice shatter',()=>{
  for(const [school,variant] of [['stasis','default'],['solar','daybreak'],['void','vortex']]){
    const m=new WarlockMotion(school,variant);
    step(m,0,h('fist'),h('fist'));
    const e=step(m,100,null,null,{trackingLost:true});
    assert.ok(!e.some(x=>['shatter-wave','sword-slash','nova-throw'].includes(x.type)));
  }
});
test('lost tracking eventually emits safety end and prevents stale sounds',()=>{
  const m=new WarlockMotion('stasis');
  step(m,0,h('fist'));step(m,40,h('neutral'));
  assert.equal(events(step(m,170,null),'safe-end'),false);
  assert.ok(events(step(m,420,null),'safe-end'));
  assert.equal(m.phase,'RECOVER');
  assert.equal(events(step(m,530,null),'safe-end'),false);
});
test('menu suppresses all combat and deliberate hand exit requires rearming',()=>{
  const m=new WarlockMotion('stasis');
  step(m,0,h('fist'));
  const e=step(m,100,h('neutral'),null,{menu:true});
  assert.deepEqual(e,[]);
  assert.equal(m.phase,'MENU');
  assert.ok(!events(step(m,140,h('neutral')),'freeze-bolt'));
});
test('threshold constants represent distinct temporal events, not a shared sword toggle',()=>{
  assert.ok(CONTROL_THRESHOLDS.staffDwellMs<CONTROL_THRESHOLDS.shatterWindowMs);
  assert.ok(CONTROL_THRESHOLDS.slashDistanceM>.1);
});
