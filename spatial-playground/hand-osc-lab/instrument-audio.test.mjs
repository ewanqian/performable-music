import test from 'node:test';
import assert from 'node:assert/strict';
import {FieldSynth,VOICES} from './instrument-audio.mjs';

// Observe AudioParam schedules and audio-context lifecycle. These are behavioral
// regressions, not claims about rendered PCM or physical headset listening.
function param(value=0){return {value,events:[],
  cancelScheduledValues(t){this.events=this.events.filter(e=>e.t<t);},
  setTargetAtTime(v,t,tau){this.events.push({kind:'target',v,t,tau});},
  setValueAtTime(v,t){this.events.push({kind:'set',v,t});},
  linearRampToValueAtTime(v,t){this.events.push({kind:'linear',v,t});},
  exponentialRampToValueAtTime(v,t){this.events.push({kind:'exponential',v,t});}
};}
function node(){return {connect(){},disconnect(){}};}
class Context {
  constructor(){this.state='running';this.currentTime=10;this.sampleRate=100;this.destination=node();this.oscillators=[];}
  async resume(){}
  async close(){this.state='closed';}
  createGain(){return {...node(),gain:param()};}
  createBiquadFilter(){return {...node(),frequency:param(),Q:param()};}
  createDelay(){return {...node(),delayTime:param()};}
  createStereoPanner(){return {...node(),pan:param()};}
  createDynamicsCompressor(){return {...node(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()};}
  createAnalyser(){return {...node(),fftSize:256,getByteTimeDomainData(d){d.fill(128);}};}
  createOscillator(){const o={...node(),frequency:param(),type:'sine',stops:[],start(){},stop(t){this.stops.push(t);}};this.oscillators.push(o);return o;}
  createBuffer(n,size){return {getChannelData(){return new Float32Array(size);}};}
  createBufferSource(){return {...node(),start(){}};}
}
async function configured(){globalThis.AudioContext=Context;const a=new FieldSynth();await a.start();return a;}
const positive=p=>p.events.some(e=>e.v>0);

test('arming audio and tracked idle hands stay silent',async()=>{
  const a=await configured();
  for(let i=0;i<300;i++){a.ctx.currentTime=10+i/60;a.update({gate:0,presence:1,energy:1},i*16.7);}
  assert.equal(a.source.gain.value,0);assert.equal(positive(a.source.gain),false);
  assert.equal(a.tailGate.gain.value,0);assert.equal(positive(a.tailGate.gain),false);
});
test('one held pinch produces a finite phrase without automatic retriggers',async()=>{
  const a=await configured();a.update({gate:1,presence:1,energy:.5},1000);
  const first=structuredClone(a.source.gain.events);
  assert.ok(positive(a.source.gain),'deliberate contact excites audio');
  const end=first.find(e=>e.kind==='set'&&e.v===0&&e.t>10);
  assert.ok(end&&end.t<13,'source has a finite zero deadline');
  for(let i=1;i<400;i++){a.ctx.currentTime=10+i/60;a.update({gate:1,presence:1,hold:1,energy:1},1000+i*16.7);}
  assert.deepEqual(a.source.gain.events,first,'held gesture cannot become an endless drone');
});
test('release inside a throttled frame still closes the source and delay tail',async()=>{
  const a=await configured();a.update({gate:1,presence:1},1000);a.ctx.currentTime=10.05;
  a.update({gate:0,presence:1},1005);
  assert.ok(a.source.gain.events.some(e=>e.v===0&&e.kind==='set'&&e.t<=10.18));
  assert.ok(a.tailGate.gain.events.some(e=>e.v===0&&e.kind==='set'&&e.t<=10.48));
  assert.equal(a.lastGate,0);
});
test('tracking loss releases even a bilateral HOLD',async()=>{
  const a=await configured();a.update({gate:1,presence:1,hold:1},1000);a.ctx.currentTime=10.3;
  a.update({gate:0,presence:0,hold:0},1300);
  assert.equal(a.lastGate,0);assert.equal(a.lastHold,0);
  assert.ok(a.source.gain.events.some(e=>e.v===0&&e.kind==='set'&&e.t===10.42));
});
test('after release another deliberate pinch may excite a new phrase',async()=>{
  const a=await configured();a.update({gate:1},1000);a.ctx.currentTime=10.2;a.update({gate:0},1200);
  a.ctx.currentTime=10.5;a.update({gate:1},1500);
  assert.equal(a.lastExcitation,10.5);assert.ok(a.source.gain.events.some(e=>e.v>0&&e.t>10.5));
});
test('mute and resume clear old envelopes while preserving volume',async()=>{
  const a=await configured();a.setVolume(.2);a.update({gate:1},1000);a.trigger('A');
  const ping=a.ctx.oscillators.at(-1);a.ctx.currentTime=10.2;await a.panic();
  assert.ok(Math.abs(ping.stops.at(-1)-10.21)<1e-8,'mute also cancels transient contacts');assert.equal(a.activePings,0);
  assert.equal(a.isMuted,true);assert.ok(a.output.gain.events.some(e=>e.v===0&&e.kind==='set'));
  await a.resume();assert.equal(a.isMuted,false);assert.equal(a.lastGate,0);
  assert.equal(a.output.gain.events.at(-1).v,.2);
  assert.ok(a.source.gain.events.some(e=>e.v===0&&e.kind==='set'&&e.t<=10.33));
});
test('a browser that stays suspended is never reported as ready',async()=>{
  class Locked extends Context {constructor(){super();this.state='suspended';}}
  globalThis.AudioContext=Locked;const a=new FieldSynth();await assert.rejects(a.start(),/suspended/);
  assert.equal(a.ready,false);assert.equal(a.isMuted,true);assert.equal(a.ctx,null);
});
test('manual mute during pending audio unlock cannot be undone by that startup',async()=>{
  let unlock;class Pending extends Context {async resume(){await new Promise(r=>{unlock=r;});}}
  globalThis.AudioContext=Pending;const a=new FieldSynth(),starting=a.start();await a.panic();unlock();
  await assert.rejects(starting,/cancelled/);assert.equal(a.ready,false);assert.equal(a.isMuted,true);
});
test('all three materials avoid a persistent sub oscillator and all contacts end',async()=>{
  const a=await configured();assert.ok(VOICES.every(v=>v.base>=150&&v.duration<=2.2));
  for(let i=0;i<3;i++){a.ctx.currentTime+=1;a.update({gate:0,timbre:i},i*1000+1000);}
  assert.deepEqual(a.osc.map(x=>x.osc.frequency.events.at(-1).v),VOICES[2].partials.map(p=>p*VOICES[2].base));
  assert.equal(a.trigger('C',true),false,'zone exit is silent');
  a.setVolume(10);assert.equal(a.volume,.65);a.setVolume(-5);assert.equal(a.volume,0);
});
