import test from 'node:test';
import assert from 'node:assert/strict';
import {FingerDial,ScoreClock,DIGIT_JOINTS,INCANTATION,strudelScore,distance} from './studies-engine.mjs';
function hand(digit=0,contact=.012){
 const p=Array.from({length:25},(_,i)=>[.16+i*.003, -.2, -.55]);
 p[4]=[.16,-.2,-.55];
 for(const s of DIGIT_JOINTS)p[s.index]=[.16+.060+s.digit*.014,-.2,-.55];
 if(digit)p[DIGIT_JOINTS[digit-1].index]=[.16+contact,-.2,-.55];
 return p;
}
test('all six positions are unique and valid',()=>{
 assert.equal(new Set(DIGIT_JOINTS.map(d=>d.index)).size,6);
 assert.deepEqual(DIGIT_JOINTS.map(d=>d.digit),[1,2,3,4,5,6]);
 assert.equal(distance(null,[0,0,0]),null);
});
test('90ms dwell, lift before next input, recognition of repeated digit 3',()=>{
 const e=new FingerDial();
 assert.equal(e.update(hand(3),0).events.length,0);
 let out=e.update(hand(3),100);
 assert.equal(out.events[0].digit,3);
 assert.equal(out.sequence,'3');
 assert.equal(e.update(hand(3),200).events.length,0);
 e.update(hand(0),250);e.update(hand(0),310);
 e.update(hand(3),360);out=e.update(hand(3),470);
 assert.equal(out.sequence,'33');
});
test('full ten-number mantra yields seal exactly once at completion',()=>{
 const e=new FingerDial(),seen=[];
 let t=0;
 for(const str of INCANTATION){
   const digit=Number(str);
   e.update(hand(digit),t);
   seen.push(...e.update(hand(digit),t+100).events);
   e.update(hand(0),t+130);
   e.update(hand(0),t+185);
   t+=240;
 }
 assert.equal(seen.filter(x=>x.kind==='DIGIT').length,10);
 assert.equal(seen.filter(x=>x.kind==='SEAL').length,1);
 assert.equal(e.progress(),10);
});
test('tracking loss does not fabricate a digit',()=>{
 const e=new FingerDial();
 e.update(hand(5),0);
 const r=e.update(null,110);
 assert.equal(r.events.filter(x=>x.kind==='DIGIT').length,0);
 assert.equal(r.active,null);
});
test('score clocks 16ths at given BPM and 4 tracks without repeated event',()=>{
 const s=new ScoreClock({bpm:100,lookaheadMs:0});
 s.start(0);
 const e=s.advance(0);assert.ok(e.some(x=>x.track==='pulse'&&x.step===0));
 assert.equal(s.advance(1).length,0);
 const t=s.advance(150);assert.ok(t.every(x=>x.step===1));
 const events=s.advance(600);
 assert.ok(events.some(x=>x.track==='pulse'&&x.step===4));
 assert.ok(events.some(x=>x.track==='metal'&&x.step===4));
 assert.ok(events.every(x=>x.t_ms>=0));
});
test('score survives 30s tab suspension without event storm',()=>{
 const s=new ScoreClock();s.start(0);
 const e=s.advance(30000);
 assert.ok(e.length<=64*4);
 assert.equal(s.advance(30000).length,0);
});
test('Strudel starter export is original editable source, no dependent live link',()=>{
 const code=strudelScore(127);
 assert.match(code,/setcps\(127\/240\)/);
 assert.match(code,/stack\(/);
 assert.ok(!code.includes('iframe'));
});
test('10000-frame score/dial simulation finite and bounded',()=>{
 const c=new ScoreClock(),e=new FingerDial();c.start(0);
 let notes=0,gestures=0;
 for(let i=0;i<10000;i++){
   const t=i*11.11;
   notes+=c.advance(t).length;
   const finger=i%80<12?((i>>3)%6)+1:0;
   gestures+=e.update(hand(finger),t).events.length;
 }
 assert.ok(notes>500&&notes<4000);
 assert.ok(gestures<400);
});
test('small tracking jitter does not restart the dwell timer',()=>{
  const d=new FingerDial({onDistance:.028,offDistance:.046,dwellMs:90,rearmMs:45});
  const pos=(mm)=>{const p=Array.from({length:25},()=>[0,0,0]);p[4]=[0,0,0];
    p[7]=[mm/1000,0,0];return p;};
  d.update(pos(10),0);      // inside, starts timer
  d.update(pos(31),40);     // jitter outside the band but inside retention
  const out=d.update(pos(12),100);
  assert.equal(out.events.filter(e=>e.kind==='DIGIT').length,1);
  assert.equal(d.sequence,'1');
});
