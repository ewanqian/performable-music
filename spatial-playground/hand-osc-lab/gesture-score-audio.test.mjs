import test from 'node:test';
import assert from 'node:assert/strict';
import {SCORE_BPM,SCORE_STEP_SECONDS,HARMONY,midiHz,scoreStep,musicActivity,GestureMusic} from './gesture-score-audio.mjs';
test('original 96 BPM soundtrack has stable audio-clock divisions and distinct harmony',()=>{
 assert.equal(SCORE_BPM,96);
 assert.equal(SCORE_STEP_SECONDS,60/96/4);
 assert.equal(HARMONY.length,4);
 assert.equal(new Set(HARMONY.map(c=>c.bass)).size,4);
 for(const c of HARMONY)assert.equal(c.notes.length,4);
});
test('four repeating bars have bass, pads, percussion and nonempty arpeggios',()=>{
 const beats=Array.from({length:64},(_,i)=>scoreStep(i));
 assert.equal(beats.filter(x=>x.inBar===0).length,4);
 assert.equal(beats.filter(x=>x.kick).length,8);
 assert.equal(beats.filter(x=>x.snare).length,8);
 assert.equal(beats.filter(x=>x.hat).length,16);
 assert.ok(beats.filter(x=>x.arp!==null).length>=32);
 assert.equal(beats[0].chord.name,'E minor add9');
 assert.equal(beats[16].chord.name,'C major7 #11');
 assert.equal(beats[32].chord.name,'G add9');
 assert.equal(beats[48].chord.name,'D suspended');
 assert.ok(midiHz(69)>0&&Math.abs(midiHz(69)-440)<1e-10);
});
test('musical intensity follows jet, speed and fist charge while bounded',()=>{
 const info=musicActivity({right:{kind:'sword',speed:9,charge:13}});
 assert.equal(info.jet,1);assert.equal(info.motion,1);assert.equal(info.charge,4);
 assert.equal(musicActivity({left:{kind:'fist',speed:0}}).fist,1);
 assert.deepEqual(musicActivity({}),{charge:0,motion:0,jet:0,fist:0});
});
test('audio engine is silent until user starts it and tolerates absent WebAudio',()=>{
 const m=new GestureMusic();
 assert.equal(m.enabled,false);
 assert.equal(m.context,null);
 m.stop();
 m.setVolume(4);
 assert.equal(m.gain,1);
 m.setVolume(-1);assert.equal(m.gain,0);
 m.update({right:{kind:'sword',speed:2,charge:1}});
 assert.equal(m.energy.jet,1);
 assert.equal(m.energy.charge,1);
 m.react({type:'blast',power:3});
});
