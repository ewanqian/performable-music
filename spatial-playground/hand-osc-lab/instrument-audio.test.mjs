import test from 'node:test';
import assert from 'node:assert/strict';
import {FieldSynth} from './instrument-audio.mjs';

const param=()=>({
  values:[],
  setTargetAtTime(v){this.values.push(v)},
  last(){return this.values.at(-1)}
});
function configured(){
  const a=new FieldSynth();
  a.ready=true;a.isMuted=false;a.ctx={state:'running',currentTime:10};
  a.source={gain:param()};
  a.filter={frequency:param(),Q:param()};
  a.wetGain={gain:param()};a.pan={pan:param()};
  a.feedback={gain:param()};
  a.lfoGain={gain:param()};
  a.osc=Array.from({length:3},()=>({gain:{gain:param()}}));
  return a;
}
test('MR tracked hand without pinch opens an audible drone',()=>{
  const a=configured();a.update({gate:0,presence:1,energy:.5,cutoff:.5,wet:.2,
    spread:.5,drive:.2,resonance:.2,timbre:0},1000);
  assert.ok(a.source.gain.last()>.03,'non-zero presence voice expected');
});
test('tracking loss releases presence voice rather than leaving a held note',()=>{
  const a=configured();
  a.update({gate:0,presence:1,energy:.5},1000);
  a.update({gate:0,presence:0,energy:.5},1100);
  assert.equal(a.source.gain.last(),0);
});
test('pinch boosts expression beyond presence-only layer',()=>{
  const a=configured();
  a.update({gate:0,presence:1,energy:.5},1000);
  const baseline=a.source.gain.last();
  a.update({gate:1,presence:1,energy:.5},1100);
  assert.ok(a.source.gain.last()>baseline);
});
test('desktop no-hand starts silent, despite test page existing',()=>{
  const a=configured();
  a.update({gate:0,presence:0,energy:.5},1000);
  assert.equal(a.source.gain.last(),0);
});
test('locked or deliberately muted Web Audio does not update synthesis',()=>{
  const a=configured();a.isMuted=true;
  a.update({gate:1,presence:1},1000);
  assert.equal(a.source.gain.values.length,0);
  a.isMuted=false;a.ctx.state='suspended';
  a.update({gate:1,presence:1},1100);
  assert.equal(a.source.gain.values.length,0);
});
