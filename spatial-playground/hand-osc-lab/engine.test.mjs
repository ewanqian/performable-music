import test from 'node:test';
import assert from 'node:assert/strict';
import {ZoneEngine,createZones,bendDeg,handAngles,JOINTS,BONES} from './engine.mjs';

test('canonical WebXR hand is 25 joints, lightweight line skeleton',()=>{
 assert.equal(JOINTS.length,25);
 assert.ok(BONES.length>=24);
});
test('3-point geometric bend: straight = 0 degrees, right angle = 90 degrees',()=>{
 assert.ok(Math.abs(bendDeg([0,0,0],[1,0,0],[2,0,0]))<.0001);
 assert.ok(Math.abs(bendDeg([0,0,0],[1,0,0],[1,1,0])-90)<.0001);
 assert.equal(bendDeg(null,[1,0,0],[2,0,0]),null);
});
test('zones require dwell, use two distinct enter/exit thresholds',()=>{
 const engine=new ZoneEngine(createZones(),{dwellMs:35,enterMargin:.01,exitMargin:.015,missingMs:150});
 const inside=[-.27,-.28,-.55],outside=[.1,-.28,-.55];
 assert.deepEqual(engine.update('left',inside,0),[]);
 let e=engine.update('left',inside,40);
 assert.equal(e.length,1);assert.equal(e[0].zone,'A');assert.equal(e[0].type,'ENTER');
 assert.deepEqual(engine.update('left',inside,42),[]);
 // Hovering just across the geometric nominal radius must not oscillate.
 assert.deepEqual(engine.update('left',[-.27+.137,-.28,-.55],52),[]);
 assert.deepEqual(engine.update('left',outside,60),[]);
 e=engine.update('left',outside,100);assert.equal(e.filter(v=>v.zone==='A'&&v.type==='EXIT').length,1);
 assert.deepEqual(engine.update('left',outside,130),[]);
});
test('loss is not EXIT and gets one tracking-lost event',()=>{
 const engine=new ZoneEngine(createZones(),{dwellMs:20,missingMs:120});
 const pos=[.27,-.28,-.55];
 engine.update('right',pos,0);
 assert.equal(engine.update('right',pos,25).filter(e=>e.type==='ENTER').length,1);
 assert.deepEqual(engine.update('right',null,60),[]);
 const e=engine.update('right',null,160);
 assert.equal(e.length,1);assert.equal(e[0].type,'TRACKING_LOST');
 assert.deepEqual(engine.update('right',null,200),[]);
});
test('14 named bend channels',()=>{
 const points=Array.from({length:25},(_,i)=>[0,i*.03,0]);
 const angles=handAngles(points);
 assert.equal(Object.keys(angles).length,14);
 assert.ok(Object.values(angles).every(v=>v!==null));
});
