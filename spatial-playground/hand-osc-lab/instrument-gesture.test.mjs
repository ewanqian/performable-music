import test from 'node:test';
import assert from 'node:assert/strict';
import {GestureInstrument,d3,thumbDistance} from './instrument-gesture.mjs';

function hand(x,options={}){
  const p=Array.from({length:25},(_,i)=>[x+(i%5)*.016,-.20,-.6]);
  p[0]=[x,-.24,-.60];
  p[4]=[x,-.20,-.60];
  p[9]=[x+(options.index??.056),-.20,-.60];
  p[12]=[x+.10,-.20,-.60];
  p[14]=[x+(options.middle??.07),-.20,-.60];
  p[19]=[x+(options.ring??.07),-.20,-.60];
  p[24]=[x+(options.pinky??.08),-.20,-.60];
  if(options.cross)p[12]=[p[9][0]+.009,-.20,-.60];
  return {positions:p};
}
test('distance returns null, never NaN when tracking unavailable',()=>{
  assert.equal(d3(null,[0,0,0]),null);
  assert.equal(d3([NaN,0,0],[0,0,0]),null);
  assert.equal(thumbDistance(null,9),null);
});
test('pinch start/stop hysteresis prevents rapid toggling near threshold',()=>{
  const m=new GestureInstrument();
  assert.equal(m.update({right:hand(.2,{index:.027}),now:0}).params.gate,1);
  assert.equal(m.update({right:hand(.2,{index:.034}),now:16}).params.gate,1);
  assert.equal(m.update({right:hand(.2,{index:.045}),now:32}).params.gate,0);
  assert.equal(m.update({right:hand(.2,{index:.034}),now:48}).params.gate,0);
});
test('left index pinch maps cutoff, right index pinch maps sustained gate',()=>{
  const m=new GestureInstrument();
  const a=m.update({left:hand(-.2,{index:.017}),right:hand(.2,{index:.06}),now:0});
  assert.equal(a.params.gate,0);
  const b=m.update({left:hand(-.2,{index:.09}),right:hand(.2,{index:.02}),now:30});
  assert.equal(b.params.gate,1);
  assert.ok(b.params.cutoff>a.params.cutoff);
});
test('bilateral pinch hold toggles once per dwell, requires release to re-arm',()=>{
  const m=new GestureInstrument();
  m.update({left:hand(-.2,{index:.02}),right:hand(.2,{index:.02}),now:0});
  const r=m.update({left:hand(-.2,{index:.02}),right:hand(.2,{index:.02}),now:270});
  assert.equal(r.params.hold,1);
  assert.equal(r.events.filter(e=>e.type==='HOLD_TOGGLE').length,1);
  const again=m.update({left:hand(-.2,{index:.02}),right:hand(.2,{index:.02}),now:350});
  assert.equal(again.events.filter(e=>e.type==='HOLD_TOGGLE').length,0);
  m.update({left:hand(-.2,{index:.06}),right:hand(.2,{index:.06}),now:400});
  m.update({left:hand(-.2,{index:.02}),right:hand(.2,{index:.02}),now:440});
  const off=m.update({left:hand(-.2,{index:.02}),right:hand(.2,{index:.02}),now:730});
  assert.equal(off.params.hold,0);
  assert.equal(off.events.filter(e=>e.type==='HOLD_TOGGLE').length,1);
});
test('middle/ring/pinky touch creates independent resonant, wet, drive controls',()=>{
  const cold=new GestureInstrument().update({right:hand(.2),now:0}).params;
  const hot=new GestureInstrument().update({right:hand(.2,{middle:.020,ring:.019,pinky:.017}),now:0}).params;
  assert.ok(hot.resonance>cold.resonance);
  assert.ok(hot.wet>cold.wet);
  assert.ok(hot.drive>cold.drive);
});
test('index-to-middle PIP contact cycles timbre with cooldown',()=>{
  const m=new GestureInstrument();
  const a=m.update({right:hand(.2,{cross:true}),now:0});
  assert.equal(a.params.timbre,1);
  const b=m.update({right:hand(.2,{cross:true}),now:20});
  assert.equal(b.params.timbre,1);
  const c=m.update({right:hand(.2,{cross:true}),now:450});
  assert.equal(c.params.timbre,2);
});
test('zone EXIT is a meaningful release, TRACKING_LOST is never an EXIT',()=>{
  const m=new GestureInstrument();
  const r=m.update({right:hand(.2),now:100,zones:[
    {zone:'A',hand:'right',type:'ENTER'},
    {zone:'B',hand:'right',type:'EXIT'},
    {zone:'C',hand:'right',type:'TRACKING_LOST'}]});
  assert.deepEqual(r.events.filter(e=>e.type.startsWith('ZONE_')).map(e=>e.type),
    ['ZONE_ENTER','ZONE_EXIT','ZONE_LOST']);
});
test('missing hand turns gate off and releases held sound',()=>{
  const m=new GestureInstrument();
  m.update({left:hand(-.2,{index:.02}),right:hand(.2,{index:.02}),now:0});
  m.update({left:hand(-.2,{index:.02}),right:hand(.2,{index:.02}),now:290});
  const lost=m.update({left:null,right:null,now:400});
  assert.equal(lost.params.gate,0);
  assert.equal(lost.params.hold,0);
  assert.ok(lost.events.some(e=>e.type==='HOLD_RELEASE'));
});
test('deterministic 10k-frame exercise produces bounded params / no event storm',()=>{
  const m=new GestureInstrument();
  let events=0,gateCount=0;
  for(let i=0;i<10000;i++){
    const now=i*11.11;
    const l=hand(-.19,{index:.02+.04*(.5+.5*Math.sin(i*.011))});
    const r=hand(.18,{index:.019+.04*(.5+.5*Math.sin(i*.013)),
      middle:.015+.055*(.5+.5*Math.sin(i*.021)),
      ring:.015+.055*(.5+.5*Math.sin(i*.019))});
    const out=m.update({left:l,right:r,now});
    for(const [k,v] of Object.entries(out.params)){
      assert.ok(Number.isFinite(v),'non-finite '+k);
      if(k!=='timbre')assert.ok(v>=0&&v<=1,'unbounded '+k);
    }
    events+=out.events.length;gateCount+=out.params.gate;
  }
  assert.ok(events<250,'unexpected event storm '+events);
  assert.ok(gateCount>0);
});
