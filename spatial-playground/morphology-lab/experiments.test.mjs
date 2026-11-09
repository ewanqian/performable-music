import test from 'node:test';
import assert from 'node:assert/strict';
import {FAMILIES,TOTAL,description,findStudy,BEAT_BPM,LIGHT_FLASH_POLICY} from './experiments.mjs';
const all=FAMILIES.flatMap(f=>f.items.map((p,i)=>({family:f.id,index:i,record:p})));
test('6 unique visual research mechanisms, each has exactly 9 hypotheses',()=>{
 assert.equal(FAMILIES.length,6);assert.equal(TOTAL,54);
 assert.deepEqual(FAMILIES.map(f=>f.items.length),[9,9,9,9,9,9]);
 assert.equal(new Set(FAMILIES.map(f=>f.id)).size,6);
 for(const f of FAMILIES){
  assert.equal(new Set(f.items.map(p=>p[3])).size,9,f.id+' nine distinct modes');
  for(const record of f.items){
   assert.ok(record[0].length>=3&&record[1].length>=3);
   assert.ok(record[2].length>=14,f.id+' research hypothesis must be substantive');
   assert.ok(record[3]&&typeof record[4]==='object');
   for(const val of Object.values(record[4]))assert.ok(Number.isFinite(val));
  }
 }
});
test('54 distinct titles and methods are retrievable',()=>{
 assert.equal(new Set(all.map(x=>x.family+'/'+x.record[3])).size,54);
 for(const st of all){
  const d=description(st.family,st.index);
  assert.equal(d.method,st.record[3]);
  assert.equal(d.title,st.record[0]);
  assert.equal(findStudy(st.family,st.index),st.record);
 }
 assert.equal(description('none',0),null);
 assert.equal(description('light',9),null);
});
test('light profiles are continuous safe envelope presets',()=>{
 const profiles=FAMILIES.find(f=>f.id==='light').items;
 assert.ok(profiles.every(p=>p[4].rate<=1.667));
 assert.match(LIGHT_FLASH_POLICY,/no full-frame red\/white strobes/);
 assert.equal(BEAT_BPM,100);
});
test('visual families maintain source/biophysical boundaries',()=>{
 assert.match(FAMILIES.find(f=>f.id==='neuron').model,/not medical anatomy/);
 assert.match(FAMILIES.find(f=>f.id==='physarum').model,/not validated/);
 assert.match(FAMILIES.find(f=>f.id==='sakura').model,/procedural 3D/);
});
