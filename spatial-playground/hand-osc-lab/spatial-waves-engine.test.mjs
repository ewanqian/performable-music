import test from 'node:test';
import assert from 'node:assert/strict';
import {VOLUMES,VolumetricContact,controlFromHands,visualGeometry,nearestVolume,distance} from './spatial-waves-engine.mjs';
test('four independent XYZ zones, two distinct depth layers',()=>{
 assert.equal(VOLUMES.length,4);
 assert.equal(new Set(VOLUMES.map(z=>z.id)).size,4);
 assert.equal(new Set(VOLUMES.map(z=>z.center[2])).size,2);
 assert.ok(VOLUMES.every(z=>z.center.length===3&&z.center.every(Number.isFinite)));
});
test('actual volumetric distance matters, projected XY is not sufficient',()=>{
 const a=VOLUMES[0],near=nearestVolume(a.center);
 assert.equal(near.zone.id,'pulse');
 const sameXYOtherDepth=[a.center[0],a.center[1],a.center[2]-.55];
 assert.ok(distance(a.center,sameXYOtherDepth)>a.radius*2);
});
test('dwell and hysteresis suppress sensor jitter but permit explicit release',()=>{
 const t=new VolumetricContact({dwellMs:55,hysteresis:.025});
 const z=VOLUMES[1],p=z.center;
 assert.deepEqual(t.update('left',p,0),[]);
 assert.equal(t.update('left',p,57)[0].zone,'mineral');
 assert.deepEqual(t.update('left',[p[0]+z.radius+.012,p[1],p[2]],70),[]);
 const ev=t.update('left',[p[0]+z.radius+.08,p[1],p[2]],160);
 assert.equal(ev[0].kind,'EXIT');assert.equal(t.active().length,0);
});
test('tracking-loss explicitly neutralizes active contact',()=>{
 const t=new VolumetricContact();
 const z=VOLUMES[2];
 t.update('right',z.center,0);t.update('right',z.center,80);
 const ev=t.update('right',null,95);
 assert.equal(ev[0].reason,'TRACK_LOST');assert.deepEqual(t.active(),[]);
});
test('two hands independent, so one lost hand cannot clear other sound layer',()=>{
 const t=new VolumetricContact();
 t.update('right',VOLUMES[0].center,0);t.update('right',VOLUMES[0].center,99);
 t.update('left',VOLUMES[3].center,0);t.update('left',VOLUMES[3].center,99);
 t.update('right',null,110);
 assert.deepEqual(t.active(),['harmonic']);
});
test('pinch and bimanual distance drive continuous normalized synthesis parameters',()=>{
 assert.equal(controlFromHands({}).tracked,0);
 const a={positions:Array.from({length:25},()=>[0,0,-.7])};
 a.positions[9]=[.21,.13,-.7];a.positions[4]=[.224,.135,-.7];
 const b={positions:Array.from({length:25},()=>[0,0,-.7])};
 b.positions[9]=[-.26,.06,-.9];
 const c=controlFromHands({left:b,right:a});
 assert.equal(c.tracked,2);assert.ok(c.energy>.5);
 for(const k of ['spread','energy','focus','depth'])assert.ok(c[k]>=0&&c[k]<=1);
});
test('3D geometry uses genuine xyz changes with no flat screen-space overlays',()=>{
 const a=visualGeometry(0,.3,.2),b=visualGeometry(120,.9,.8);
 assert.equal(a.rings.length,12);assert.equal(a.bridges.length,4);
 const lengths=a.rings.map(x=>x.points.length);
 assert.ok(lengths.every(n=>n===33));
 assert.notDeepEqual(a.rings[0].points,b.rings[0].points);
 const zvals=new Set(a.rings.flatMap(r=>r.points.map(p=>p[2].toFixed(3))));
 assert.ok(zvals.size>50);
});
test('deterministic 10k hand poses do not generate an unbounded contact event storm',()=>{
 const t=new VolumetricContact(),z=VOLUMES[0],out=[];
 for(let i=0;i<10000;i++){
  const p=i%160<110?z.center:[z.center[0]+.34,z.center[1],z.center[2]];
  out.push(...t.update('test',p,i*10));
 }
 assert.ok(out.length<1000);
 assert.ok(out.some(x=>x.kind==='ENTER'));
});
