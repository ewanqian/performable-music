import test from 'node:test';
import assert from 'node:assert/strict';
import {BRANCHES,THUNDER_FORMS,PRACTICE_PATHS,PalmContactEngine,BranchLesson,
 assessSwordPose,SwordPoseCoach,branchDistances} from './handseal-engine.mjs';
function hand(){
 const p=Array.from({length:25},(_,i)=>[i*.001,0,0]);
 p[4]=[0,0,0];
 BRANCHES.forEach((b,i)=>p[b.joint]=[.25+i*.01,.10,0]);
 return p;
}
function swordHand(){
 const p=hand();
 const straight=(a,b,c,x)=>{p[a]=[x,0,0];p[b]=[x,1,0];p[c]=[x,2,0];};
 const curled=(a,b,c,x)=>{p[a]=[x,0,0];p[b]=[x,1,0];p[c]=[x+1,1,0];};
 straight(6,7,8,0);straight(11,12,13,.02);
 curled(16,17,18,.06);curled(21,22,23,.08);
 p[9]=[0,2,0];p[14]=[.02,2,0];
 return p;
}
test('twelve earthly branches map to the exact 25-joint anchors',()=>{
 assert.equal(BRANCHES.length,12);
 assert.deepEqual(BRANCHES.map(x=>x.name),'子丑寅卯辰巳午未申酉戌亥'.split(''));
 assert.deepEqual(BRANCHES.map(x=>x.joint),[16,11,6,7,8,9,14,19,24,23,22,21]);
 assert.equal(new Set(BRANCHES.map(x=>x.joint)).size,12);
 assert.ok(BRANCHES.every(x=>x.jointName));
});
test('branch contact waits for dwell, fires once, and requires lift before repeat',()=>{
 const p=hand(),e=new PalmContactEngine({onDistance:.03,offDistance:.05,dwellMs:100,rearmMs:40});
 p[4]=[0,0,0];p[16]=[.02,0,0];
 assert.equal(e.update(p,0).events.length,0);
 assert.equal(e.update(p,99).events.length,0);
 assert.equal(e.update(p,100).events[0].kind,'CONTACT');
 assert.equal(e.update(p,220).events.length,0);
 p[4]=[.10,0,0];
 assert.equal(e.update(p,230).events[0].kind,'RELEASE');
 p[4]=[0,0,0];
 e.update(p,270);assert.equal(e.update(p,370).events[0].id,'zi');
});
test('contact can slide to another target without fabricating repeated same target',()=>{
 const p=hand(),e=new PalmContactEngine({onDistance:.03,offDistance:.05,dwellMs:80,rearmMs:20});
 p[4]=[0,0,0];p[16]=[.01,0,0];
 e.update(p,0);e.update(p,80);
 assert.equal(e.active,'zi');
 p[4]=[.10,0,0];p[11]=[.11,0,0];
 const out=e.update(p,100);
 assert.ok(out.events.some(x=>x.kind==='RELEASE'));
 assert.equal(e.candidate,'chou');
});
test('tracking loss is unknown, not a fabricated release/contact',()=>{
 const p=hand(),e=new PalmContactEngine({dwellMs:40});
 p[4]=[0,0,0];p[16]=[.01,0,0];e.update(p,0);e.update(p,40);
 const out=e.update(null,60);
 assert.equal(out.events[0].kind,'LOST');
 assert.equal(out.active,null);
});
test('guided branch lesson advances only on the expected contact',()=>{
 const l=new BranchLesson(['zi','chou','yin']);
 assert.equal(l.consume('chou',10).kind,'WRONG');
 assert.equal(l.index,0);
 assert.equal(l.consume('zi',20).kind,'CORRECT');
 assert.equal(l.consume('chou',30).kind,'CORRECT');
 assert.equal(l.consume('yin',40).kind,'COMPLETE');
 assert.equal(l.completed,true);
});
test('sword pose exposes five explainable checks and accepts a held correct shape',()=>{
 const p=swordHand(),a=assessSwordPose(p);
 assert.equal(a.tracking,true);
 assert.equal(a.passed,5,JSON.stringify(a));
 const c=new SwordPoseCoach({holdMs:300});
 assert.equal(c.update(p,0).complete,false);
 assert.equal(c.update(p,299).complete,false);
 assert.equal(c.update(p,300).events[0].kind,'POSE_COMPLETE');
 const bad=swordHand();bad[8]=[1,1,0];
 assert.ok(assessSwordPose(bad).passed<5);
});
test('pose coach resets hold if posture changes and does not score missing joints',()=>{
 const p=swordHand(),c=new SwordPoseCoach({holdMs:200});
 c.update(p,0);const bad=swordHand();bad[8]=[1,1,0];
 assert.equal(c.update(bad,150).hold,0);
 assert.equal(c.update(null,300).tracking,false);
});
test('source guide includes six 雷诀 records and does not claim auto-certified ritual',()=>{
 assert.equal(THUNDER_FORMS.length,6);
 assert.ok(THUNDER_FORMS.every(x=>x.source&&x.steps.length>=2&&x.note));
 assert.equal(PRACTICE_PATHS.length,3);
 assert.deepEqual(branchDistances(hand()).map(x=>x.id).slice(0,2),['zi','chou']);
});
test('cross-palm root branches get a wider acceptance band than tips',()=>{
 const e=new PalmContactEngine({onDistance:.034,dwellMs:10,rearmMs:0});
 const chou=BRANCHES.find(b=>b.id==='chou');   // middle finger root
 const si=BRANCHES.find(b=>b.id==='si');       // index tip
 assert.ok(e.thresholdFor(chou)>e.thresholdFor(si));
 assert.ok(e.thresholdFor(chou)>0.040);        // 丑 is reachable at ~40mm
 assert.equal(e.thresholdFor(si),0.034);
 assert.ok(e.releaseFor(chou)>e.thresholdFor(chou));
});
test('one-hand calibration widens only the calibrated branch',()=>{
 const e=new PalmContactEngine({onDistance:.034});
 const chou=BRANCHES.find(b=>b.id==='chou');
 const si=BRANCHES.find(b=>b.id==='si');
 const before=e.thresholdFor(chou);
 e.calibrate('chou',.055);
 assert.ok(e.thresholdFor(chou)>before);
 assert.ok(e.thresholdFor(chou)>=.055*1.15-1e-9);
 assert.equal(e.thresholdFor(si),.034);
 assert.equal(e.calibration.size,1);
 e.clearCalibration();
 assert.equal(e.thresholdFor(chou),before);
});
test('calibration survives export and import, and ignores unknown branches',()=>{
 const a=new PalmContactEngine({onDistance:.034});
 a.calibrate('chou',.055);a.calibrate('si',.036);
 const blob=a.exportCalibration();
 assert.equal(blob.format,'pm-handseal-calibration');
 const b=new PalmContactEngine({onDistance:.034});
 assert.equal(b.importCalibration(blob),2);
 assert.ok(Math.abs(b.thresholdFor(BRANCHES.find(x=>x.id==='chou'))-a.thresholdFor(BRANCHES.find(x=>x.id==='chou')))<1e-9);
 const dirty={...blob,branches:{...blob.branches,notabranch:.09}};
 assert.equal(new PalmContactEngine().importCalibration(dirty),2);
 assert.equal(new PalmContactEngine().importCalibration({}),0);
});
