import test from 'node:test';
import assert from 'node:assert/strict';
import {BANDS,MODES,REGIONS,SURFACE,ELECTRODES,generateSurface,
 INITIAL,assignState,fakeBand,signalSnapshot,mapJointGesture,nearestRegion} from './neural-engine.mjs';
test('brain surface deterministic and small enough for standalone WebXR line budget',()=>{
 const one=generateSurface(),two=generateSurface();
 assert.deepEqual(one,two);assert.equal(one.vertices.length,2*12*18);
 assert.ok(one.edges.length<1200);
 for(const p of one.vertices)assert.ok(p.length===3&&p.every(Number.isFinite));
 assert.equal(SURFACE.vertices.length,one.vertices.length);
});
test('an illustrative cortical scaffold is NEVER labeled as a measured anatomy mesh',()=>{
 assert.equal(ELECTRODES.length,16);
 assert.equal(REGIONS.length,4);
 assert.equal(INITIAL.source,'SYNTHETIC');
});
test('four distinct render modes and four frequency-band PRESETS',()=>{
 assert.equal(MODES.length,4);assert.equal(BANDS.length,4);
 let s=INITIAL;
 for(const m of MODES)s=assignState(s,{type:'MODE',mode:m});
 assert.equal(s.mode,'ELECTRODES');
 for(const b of BANDS){
  const y=fakeBand(12345,b.id);assert.ok(y>=0&&y<=1);
 }
 assert.equal(assignState(s,{type:'MODE',mode:'unknown'}),s);
});
test('sensor mapping cannot invent tracked hands',()=>{
 assert.equal(mapJointGesture({left:null,right:null}).tracked,0);
 const r={positions:Array.from({length:25},(_,i)=>[0,.1,-.7])};
 r.positions[9]=[.12,.15,-.5];
 r.positions[4]=[.14,.15,-.5];
 const out=mapJointGesture({right:r,left:null});
 assert.equal(out.tracked,1);assert.equal(out.pinched,true);
 assert.ok(out.focus>=0&&out.focus<=1);
 const other={positions:Array.from({length:25},()=>[0,.1,-.7])};
 other.positions[9]=[-.2,.12,-.5];
 assert.ok(mapJointGesture({right:r,left:other}).spread!==null);
});
test('selected model region derives from cursor with unambiguous miss',()=>{
 assert.equal(nearestRegion(.4,.36),'frontal');
 assert.equal(nearestRegion(.68,.58),'temporal');
 assert.equal(nearestRegion(0,0),null);
});
test('synthetic envelope never asserts LIVE EEG or explicit neuron spikes',()=>{
 for(let i=0;i<10000;i+=11){
  const n=signalSnapshot({...INITIAL,intensity:.99},i);
  assert.equal(n.source,'SYNTHETIC');
  assert.ok(n.envelope>=0&&n.envelope<=1);
  assert.ok(n.cutoff>=0&&n.cutoff<=1);
 }
});
test('safety neutralizes musical gate without erasing scene mode',()=>{
 let s=assignState(INITIAL,{type:'ACTIVE',value:true});
 s=assignState(s,{type:'PANIC'});
 assert.equal(s.active,false);assert.equal(s.intensity,0);
 assert.equal(s.mode,'STRUCTURE');
});
