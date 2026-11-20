#!/usr/bin/env node
// Offline smoke tests only. Does not validate real Ableton/Quest/audio/MIDI.
'use strict';
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const root=__dirname;
const plan=JSON.parse(fs.readFileSync(path.join(root,'arrangement-master.json'),'utf8'));
const scenes=new Set(['INITIAL_CONDITION','FIELD','OVERRIDE','AFTERIMAGE']);
assert.equal(plan.sections.length,6);
assert.deepEqual(plan.sections.map(x=>x.target_start_s),[0,300,600,900,1200,1500]);
assert.deepEqual(plan.sections.map(x=>x.target_end_s),[300,600,900,1200,1500,1800]);
assert.ok(plan.sections.every(x=>scenes.has(x.scene)));
assert.equal(plan.budget_seconds.music_goal+plan.budget_seconds.exit_or_recovery,1800);
const html=fs.readFileSync(path.join(root,'rehearsal-console.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'HTML includes inline rehearsal script');
let nowMs=0;
function element(id){return {id,style:{},children:[],textContent:'',value:'',className:'',innerHTML:'',setAttribute(k,v){this[k]=v;},append(...c){this.children.push(...c);},replaceChildren(...c){this.children=[...c];}};}
const elements=new Map();
const document={getElementById(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id);},createElement(tag){return element(tag);},addEventListener(){},activeElement:{tagName:'BODY'}};
const context={document,window:{confirm(){return true;},addEventListener(){}},performance:{now(){return nowMs;}},setInterval(){},setTimeout(){},console,Math,Date,Blob,URL};
vm.createContext(context);vm.runInContext(script+'\nglobalThis.TEST={state,start,nextRequest,commit,setHold,toggleBlackout,softStop};',context);
const t=context.TEST;
assert.equal(elements.get('blocks').children.length,6);
t.start();assert.equal(t.state.running,true);
nowMs=1300;t.nextRequest();assert.equal(t.state.queued,true);
t.nextRequest();assert.equal(t.state.log.filter(e=>e.type==='next.duplicate_ignored').length,1);
t.commit();assert.equal(t.state.section,1);
t.setHold(true);t.nextRequest();t.commit();assert.equal(t.state.section,1);
t.setHold(false);t.commit();assert.equal(t.state.section,2);
t.toggleBlackout();assert.equal(t.state.blackout,true);
t.softStop();assert.equal(t.state.running,false);
assert.ok(t.state.log.some(e=>e.type==='software_stop.simulation_only'));
const probe=spawnSync(process.execPath,[path.join(root,'osc-probe.mjs'),'--selftest'],{encoding:'utf8'});
assert.equal(probe.status,0,probe.stderr||probe.stdout);
assert.match(probe.stdout,/PASS/);
console.log('PASS arrangement: six 5-minute targets, 28+2-minute budget and Show Score scene names');
console.log('PASS cue console simulation: NEXT dedupe, deferred acceptance, HOLD guard, visual-only blackout, software-only STOP');
console.log('PASS OSC probe decoder: simple /pm/ OSC messages; not a device-level test');