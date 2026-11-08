import test from 'node:test';
import assert from 'node:assert/strict';
import {COLLECTIONS,LUOSHU,LUOSHU_LINES,HETU,TRIGRAMS,STARS,
 Hexagram,RiverGrammar,StarRoute,SwordLatch,swordPose,TraceRoute,bimanual} from './atlas-engine.mjs';
function swordHand(){
 const p=Array.from({length:25},()=>[0,0,0]);
 const straight=(i,x)=>{p[i+1]=[x,.00,0];p[i+2]=[x,.04,0];p[i+3]=[x,.08,0];p[i+4]=[x,.12,0];};
 const curled=(i,x)=>{p[i+1]=[x,.00,0];p[i+2]=[x,.04,0];p[i+3]=[x+.037,.04,0];p[i+4]=[x+.04,.014,0];};
 straight(5,0);straight(10,.022);curled(15,.06);curled(20,.08);
 p[4]=[.052,.018,0];
 return p;
}
test('eight isolated methods in two four-item collections',()=>{
 assert.equal(COLLECTIONS.music.length,4);
 assert.equal(COLLECTIONS.culture.length,4);
 assert.equal(new Set([...COLLECTIONS.music,...COLLECTIONS.culture].map(x=>x.id)).size,8);
});
test('sword posture checks dual extended and curled ring/pinky, with dwell',()=>{
 const p=swordHand(),s=swordPose(p);
 assert.equal(s.active,true,JSON.stringify(s));
 const d=new SwordLatch({dwellMs:140,releaseMs:100});
 assert.equal(d.update(p,0).active,false);
 assert.equal(d.update(p,150).active,true);
 assert.equal(d.update(null,180).active,true);
 assert.equal(d.update(null,290).active,false);
 p[18]=[.06,.08,0];p[19]=[.06,.12,0];
 assert.equal(swordPose(p).active,false);
});
test('Luo Shu is 1-9 exactly and each of 8 lines sums to 15',()=>{
 assert.deepEqual(LUOSHU.flat().slice().sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9]);
 assert.equal(LUOSHU_LINES.length,8);
 for(const line of LUOSHU_LINES)assert.equal(line.reduce((a,b)=>a+b),15);
});
test('River maps two numeric systems without mixing',()=>{
 const r=new RiverGrammar();
 assert.equal(r.add(4).length,1);r.add(9);
 const result=r.add(2);assert.equal(result.some(e=>e.kind==='LINE'&&e.sum===15),true);
 r.setMode('hetu');
 r.add(1);assert.equal(r.add(6).find(e=>e.kind==='PAIR')?.element,'水');
 r.add(2);assert.equal(r.add(7).find(e=>e.kind==='PAIR')?.element,'火');
 assert.equal(r.add(11).length,0);
 assert.equal(HETU.length,5);
});
test('all 8 trigrams and 64 hexagram bit combinations reachable',()=>{
 assert.equal(TRIGRAMS.length,8);
 const codes=new Set();
 for(let i=0;i<64;i++){
   const h=new Hexagram();
   const bits=i.toString(2).padStart(6,'0');
   let result;for(const b of bits)result=h.add(Number(b));
   assert.ok(result.lower&&result.upper&&result.completed);
   codes.add(result.lower.name+result.upper.name);
 }
 assert.equal(codes.size,64);
 const h=new Hexagram();
 assert.equal(h.add(1).lower,null);h.add(0);assert.equal(h.add(1).lower?.name,'离');
});
test('seven sequential star steps form a route; out-of-order does not complete',()=>{
 assert.equal(STARS.length,7);
 const r=new StarRoute();
 for(const index of [0,1,2,4,5,6])r.add(index);
 assert.equal(r.completed,0);
 for(let i=0;i<7;i++)r.add(i);
 assert.equal(r.completed,1);
});
test('fast traced path does not skip invisible sound region',()=>{
 const route=new TraceRoute();
 route.move('left',.01,.33,0);
 const hit=route.move('left',.99,.33,120);
 assert.ok(hit.some(e=>e.id==='SUB'));
 assert.ok(hit.some(e=>e.id==='METAL'));
 route.end('left');
 assert.equal(route.points.size,0);
});
test('bimanual mapping is bounded and absent hands do not fabricate a second',()=>{
 const l={positions:Array.from({length:25},()=>[0,0,0])};
 const r={positions:Array.from({length:25},()=>[0,0,0])};
 l.positions[9]=[-.26,.2,-.5];r.positions[9]=[.26,.1,-.5];
 assert.ok(bimanual(l,r).spread>0);
 assert.ok(Math.abs(bimanual(l,r).center[0])<.01);
 assert.equal(bimanual(l,null),null);
});
test('25k frames of gesture lines remain numeric and bounded',()=>{
 const r=new TraceRoute();let total=0;
 for(let i=0;i<25000;i++){
   const t=i*.061;
   const events=r.move('hand',.5+.4*Math.sin(t),.5+.4*Math.sin(2*t),i*11);
   total+=events.length;
   for(const e of events)assert.ok(e.velocity>=0&&e.velocity<=1);
 }
 assert.ok(total>100);
 console.log('Atlas path test 25k samples:',total,'hits');
});
