import test from 'node:test';
import assert from 'node:assert/strict';
import {MODES,PlaySpace,hitSegmentCircle,nextGridTime} from './organic-engine.mjs';

test('three original sound worlds have distinct playable fields',()=>{
  assert.deepEqual(Object.keys(MODES),['metal','electro','orchestra']);
  for(const [mode,scene] of Object.entries(MODES)){
    assert.equal(scene.fields.length,6);
    assert.equal(new Set(scene.fields.map(f=>f.id)).size,scene.fields.length);
    assert.ok(scene.bpm>=60&&scene.bpm<=180);
    for(const f of scene.fields){
      assert.ok(f.x>f.r&&f.x+f.r<1);
      assert.ok(f.y>f.r&&f.y+f.r<1);
    }
  }
});
test('quantization preserves a stable 16th grid',()=>{
  assert.ok(Math.abs(nextGridTime(0,0.148,100,4)-.15)<1e-8);
  assert.ok(Math.abs(nextGridTime(0,0.151,100,4)-.30)<1e-8);
  assert.equal(nextGridTime(3,2.8,100,4),3);
});
test('swept collision detects fast outside-to-outside path',()=>{
  assert.ok(hitSegmentCircle(0,.30,1,.30,.24,.30,.11));
  assert.equal(hitSegmentCircle(0,.90,1,.90,.24,.30,.11),false);
});
test('slow drag triggers once while in region and exit only at release',()=>{
  const space=new PlaySpace('metal');
  assert.equal(space.move('finger',.1,.3,0).length,0);
  const cross=space.move('finger',.22,.3,180);
  assert.deepEqual(cross.map(e=>e.kind),['ENTER']);
  assert.equal(cross[0].id,'pot');
  assert.equal(space.move('finger',.24,.30,240).filter(e=>e.id==='pot').length,0);
  const out=space.end('finger',260);
  assert.ok(out.some(e=>e.kind==='EXIT'&&e.id==='pot'));
});
test('figure-eight path naturally crosses multiple different sound fields',()=>{
  const p=new PlaySpace('electro');
  const played=new Set();
  let count=0;
  for(let i=0;i<=450;i++){
    const theta=2*Math.PI*i/450;
    const events=p.move('right',.5+.33*Math.sin(theta),
      .5+.29*Math.sin(2*theta),i*13);
    for(const e of events){
      if(e.kind==='ENTER')played.add(e.id);
      count++;
    }
  }
  assert.ok(played.size>=3,'figure eight should explore at least 3 regions: '+[...played]);
  assert.ok(count>5,'no gesture-driven music events');
});
test('rapid sweep through a field produces enter and exit without dropped zone',()=>{
  const p=new PlaySpace('metal');
  p.move('right',.01,.30,0);
  const events=p.move('right',.99,.30,100);
  assert.ok(events.some(e=>e.kind==='ENTER'&&e.id==='pot'));
  assert.ok(events.some(e=>e.kind==='EXIT'&&e.id==='pot'));
});
test('two pointers are independent, one release does not reset another',()=>{
  const p=new PlaySpace('metal');
  p.move('left',.24,.30,0);p.move('right',.74,.29,0);
  const releases=p.end('left',100);
  assert.equal(releases.some(e=>e.kind==='EXIT'&&e.pointer==='left'),true);
  assert.equal(p.stats().activePointers,1);
  assert.ok([...p.active.keys()].some(k=>k.startsWith('right:')));
});
test('no invalid values in 25k high-velocity, repeated mode reconfigurations',()=>{
  let all=0;const start=performance.now();
  for(const mode of Object.keys(MODES)){
    const p=new PlaySpace(mode);
    for(let i=0;i<25000;i++){
      const a=i*.097;
      const e=p.move('stress',.5+.45*Math.sin(a),.5+.45*Math.sin(2*a),
        i*11.111);
      all+=e.length;
      for(const evt of e){
        assert.equal(evt.mode,mode);
        assert.ok(Number.isFinite(evt.velocity)&&evt.velocity>=0&&evt.velocity<=1);
        assert.ok(Number.isFinite(evt.x)&&evt.x>=0&&evt.x<=1);
      }
    }
    assert.ok(p.stats().pathLength>0);
  }
  assert.ok(all>100);
  // Time is reported by CI; not a hard hardware performance guarantee.
  console.log('Organic stress 75k synthetic pointer frames, total events:',all,
    'execution ms:',Math.round(performance.now()-start));
});
