import test from 'node:test';
import assert from 'node:assert/strict';
import {StableHand,poseEvidence} from './gesture-stability.mjs';
const make=(kind='sword',override={})=>{
 const bends=kind==='sword'?{index:18,middle:22,ring:90,pinky:88}:
   kind==='open'?{index:12,middle:10,ring:19,pinky:22}:
   kind==='fist'?{index:86,middle:93,ring:87,pinky:91}:
   {index:78,middle:74,ring:26,pinky:30};
 return {kind,point:[.1,.2,.4],direction:[0,0,-1],
   bends,tipGap:kind==='sword'?.027:kind==='open'?.24:.08,...override};
};
const hold=(s,m,times)=>times.map(t=>s.update(m,t));
test('Sword enters after ~42ms and tolerates noisy ring bend',()=>{
 const g=new StableHand(),good=make();
 assert.equal(g.update(good,0).kind,'neutral');
 assert.equal(g.update(good,20).kind,'neutral');
 assert.equal(g.update(good,47).kind,'sword');
 for(let i=0;i<100;i++){
   const sample=i%3===0?make('neutral'):make('sword',{bends:{
     index:43,middle:46,ring:44,pinky:42}});
   assert.equal(g.update(sample,60+i*11).kind,'sword');
 }
});
test('isolated misclassified open does not cause instant palm blast',()=>{
 const g=new StableHand();
 hold(g,make('sword'),[0,15,50]);
 assert.equal(g.kind,'sword');
 assert.equal(g.update(make('open'),64).kind,'sword');
 assert.equal(g.update(make('sword'),78).kind,'sword');
 assert.equal(g.transitions,1);
});
test('sustained open and fist deliberately change without long sword exit',()=>{
 const g=new StableHand();
 hold(g,make('sword'),[0,20,50]);
 hold(g,make('open'),[80,120,190]);
 assert.equal(g.kind,'open');
 hold(g,make('fist'),[205,235,290]);
 assert.equal(g.kind,'fist');
});
test('neutral tracking jitter preserves sword for 340ms then releases',()=>{
 const g=new StableHand();
 hold(g,make('sword'),[0,20,50]);
 for(let t=62;t<=380;t+=22)assert.equal(g.update(make('neutral'),t).kind,'sword');
 assert.equal(g.update(make('neutral'),408).kind,'neutral');
});
test('brief tracking loss predicts same position and never invents open',()=>{
 const g=new StableHand();
 hold(g,make('sword'),[0,20,50]);
 const s=g.update(null,120);
 assert.equal(s.kind,'sword');assert.equal(s.stale,true);
 const absent=g.update(null,250);
 assert.equal(absent,null);
 const reacquired=g.update(make('sword'),275);
 assert.equal(reacquired.kind,'sword');
 assert.equal(reacquired.stale,false);
});
test('long tracking loss stops emission without synthetic gesture',()=>{
 const g=new StableHand();
 hold(g,make('fist'),[0,30,90]);
 assert.equal(g.kind,'fist');
 assert.equal(g.update(null,520),null);
 assert.equal(g.kind,'neutral');
 assert.equal(g.update(make('open'),530).kind,'neutral');
 assert.equal(g.update(make('open'),640).kind,'open');
});
test('aim changes immediately but filters single-frame jitter',()=>{
 const g=new StableHand();
 hold(g,make('sword'),[0,20,50]);
 const a=g.update(make('sword',{direction:[1,0,-1]}),61).direction;
 assert.ok(a[0]>.15&&a[0]<.45);
 for(let i=0;i<6;i++)g.update(make('sword',{direction:[1,0,-1]}),72+11*i);
 assert.ok(g.lastOutput.direction[0]>.58);
});
test('sword retention margin tolerates borderline occluded joints',()=>{
 const sample=make('neutral',{bends:{index:61,middle:62,ring:41,pinky:42},tipGap:.102});
 assert.equal(poseEvidence(sample,'neutral'),'neutral');
 assert.equal(poseEvidence(sample,'sword'),'sword');
});
