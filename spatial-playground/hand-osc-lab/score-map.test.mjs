import test from 'node:test';
import assert from 'node:assert/strict';
import {SCORE_ZONES,SpatialScoreMap,scoreWorldPosition,getScorePositionFromXR} from './score-map.mjs';
test('four real pads correspond to the four rhythm tracks',()=>{
 assert.deepEqual(SCORE_ZONES.map(v=>v.id),['pulse','metal','shimmer','chord']);
 assert.equal(new Set(SCORE_ZONES.map(v=>v.id)).size,4);
});
test('desktop tap triggers ENTER without waiting for dwell',()=>{
 const m=new SpatialScoreMap();
 const z=SCORE_ZONES[1];
 const e=m.move('touch',z.x,z.y,0,{immediate:true});
 assert.equal(e[0]?.kind,'ENTER');assert.equal(e[0]?.id,'metal');
 assert.equal(m.move('touch',z.x,z.y,100).length,0);
 assert.equal(m.end('touch',120)[0]?.kind,'EXIT');
});
test('XR fingertip must dwell 55ms, release threshold suppresses jitter',()=>{
 const m=new SpatialScoreMap();
 const z=SCORE_ZONES[2];
 assert.equal(m.move('left',z.x,z.y,0).length,0);
 assert.equal(m.move('left',z.x,z.y,40).length,0);
 assert.equal(m.move('left',z.x,z.y,65)[0]?.id,'shimmer');
 assert.equal(m.move('left',z.x+z.r+.012,z.y,90).length,0);
 assert.equal(m.move('left',z.x+.23,z.y,120)[0]?.kind,'EXIT');
});
test('two pointer captures remain independent and do not share gates',()=>{
 const m=new SpatialScoreMap();
 m.move('left',SCORE_ZONES[0].x,SCORE_ZONES[0].y,0,{immediate:true});
 m.move('right',SCORE_ZONES[3].x,SCORE_ZONES[3].y,0,{immediate:true});
 m.end('left',20);
 assert.deepEqual(m.active(),['chord']);
});
test('XR and browser target maps share exact pad center',()=>{
 for(const zone of SCORE_ZONES){
  const world=scoreWorldPosition(zone);
  const p=getScorePositionFromXR(world);
  assert.ok(Math.abs(p.x-zone.x)<1e-8);
  assert.ok(Math.abs(p.y-zone.y)<1e-8);
 }
 assert.equal(getScorePositionFromXR([0,0,-2]),null);
 assert.equal(getScorePositionFromXR(null),null);
});
test('two-second animation across all four nodes produces contact events',()=>{
 const m=new SpatialScoreMap({dwellMs:30});
 let hits=0,now=0;
 for(const z of SCORE_ZONES){
  m.move('right',z.x,z.y,now);
  hits+=m.move('right',z.x,z.y,now+50).filter(e=>e.kind==='ENTER').length;
  now+=190;
 }
 assert.equal(hits,4);
});
test('deterministic 20k pointer samples bounded with no repeated hit storm',()=>{
 const m=new SpatialScoreMap({dwellMs:20}),start=performance.now();
 for(let i=0;i<20000;i++){
  const x=.5+.45*Math.sin(i*.03),y=.5+.34*Math.sin(i*.06);
  for(const e of m.move('pointer',x,y,i*11)){
    assert.ok(['ENTER','EXIT'].includes(e.kind));
  }
 }
 assert.ok(m.totalHits>10&&m.totalHits<20000);
 console.log('score map 20k inputs, hits',m.totalHits,'ms',Math.round(performance.now()-start));
});
