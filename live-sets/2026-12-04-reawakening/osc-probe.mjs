#!/usr/bin/env node
// Read-only OSC UDP diagnostics for the existing hand bridge. No forwarding,
// no MIDI support, no Live control, no persistent raw hand coordinates.
import dgram from 'node:dgram';
import assert from 'node:assert/strict';

function strAt(buf, offset) {
  if(offset >= buf.length) throw Error('truncated OSC string');
  const end = buf.indexOf(0, offset);
  if(end < 0 || end - offset > 1024) throw Error('bad OSC string');
  const value = buf.toString('utf8', offset, end);
  return [value, (end + 4) & ~3];
}
export function parseOsc(buf) {
  if(!Buffer.isBuffer(buf) || buf.length > 65507 || buf.length < 8) throw Error('bad packet');
  const [address, tagsOffset] = strAt(buf, 0);
  if(address === '#bundle') throw Error('OSC bundle not supported by this diagnostic');
  if(!address.startsWith('/pm/') || !/^\/[a-zA-Z0-9/_-]+$/.test(address)) throw Error('non-PM OSC address');
  const [tags, dataOffset] = strAt(buf, tagsOffset);
  if(!tags.startsWith(',') || tags.length > 32) throw Error('bad tags');
  const out=[]; let p=dataOffset;
  for(const tag of tags.slice(1)) {
    if(tag === 'i' || tag === 'f') {
      if(p + 4 > buf.length) throw Error('truncated number');
      out.push(tag==='i' ? buf.readInt32BE(p) : buf.readFloatBE(p));p += 4;
    } else if (tag === 's') {
      const [v,next] = strAt(buf,p);out.push(v);p=next;
    } else throw Error('unsupported OSC type '+tag);
  }
  if(p !== buf.length) throw Error('unexpected trailing OSC bytes');
  return {address,values:out};
}
function pack(s){const b=Buffer.from(s+'\0');return Buffer.concat([b,Buffer.alloc((4-(b.length%4))%4)]);}
export function encodeTest(address, values=[]) {
  const tags=','+values.map(v=>typeof v==='string'?'s':Number.isInteger(v)?'i':'f').join('');
  const parts=[pack(address),pack(tags)];
  for(const v of values){if(typeof v==='string'){parts.push(pack(v));continue;}const b=Buffer.alloc(4);if(Number.isInteger(v))b.writeInt32BE(v);else b.writeFloatBE(v);parts.push(b);}
  return Buffer.concat(parts);
}
function selftest(){
  assert.deepEqual(parseOsc(encodeTest('/pm/system/connected',[1])),{address:'/pm/system/connected',values:[1]});
  const v=parseOsc(encodeTest('/pm/hand/right/pinch-m',[0.034]));
  assert.ok(Math.abs(v.values[0]-0.034)<1e-6);
  assert.deepEqual(parseOsc(encodeTest('/pm/perf/event',['HOLD_RELEASE',0])).values,['HOLD_RELEASE',0]);
  assert.throws(()=>parseOsc(Buffer.from('#bundle\0')));
  assert.throws(()=>parseOsc(encodeTest('/nonpm/test',[1])));
  assert.throws(()=>parseOsc(encodeTest('/pm/x',[1]).subarray(0,8)));
  console.log('OSC probe parser self-test: PASS (6 checks)');
}
const args=process.argv.slice(2);
if(args.includes('--selftest')) { selftest(); process.exit(0); }
if(args.some(x=>x==='--help'||x==='-h')) {
  console.log('Usage: node osc-probe.mjs --port 9001 [--host 127.0.0.1]');
  console.log('Read-only local UDP inspector. Bridge must send to this free test port.');process.exit(0);
}
function arg(key,defaultValue){const i=args.indexOf(key);return i>=0?args[i+1]:defaultValue;}
const host=arg('--host','127.0.0.1');
const port=Number(arg('--port','9001'));
if(!/^(127\.0\.0\.1|localhost)$/.test(host)||!Number.isInteger(port)||port<1024||port>65535) { console.error('Use a loopback host and UDP port 1024–65535');process.exit(2); }
const sock=dgram.createSocket('udp4');
let last=Date.now();const counts=new Map();const states=new Map();let packets=0,rejected=0;
sock.on('message',buf=>{
  try {
    const {address,values}=parseOsc(buf);counts.set(address,(counts.get(address)||0)+1);packets++;
    const important=/^\/pm\/(system\/(connected|stale|soft-panic)|hand\/(left|right)\/tracked|perf\/(gate|hold)|zone\/[ABC]\/)/.test(address);
    const current=values.length===1?String(values[0]):values.map((v,i)=>typeof v==='number'?v.toFixed(3):String(v)).join(',');
    // Only status/event values, not raw joint xyz, are printed.
    if(important && current!==states.get(address)) {console.log(new Date().toISOString().slice(11,19),'STATUS',address,current);states.set(address,current);}
    last=Date.now();
  } catch(e){rejected++;}
});
const timer=setInterval(()=>{
  const top=[...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,7).map(([k,v])=>`${k}:${v}`).join(' ');
  console.log(new Date().toISOString().slice(11,19),`PACKETS ${packets} rejected ${rejected} idle ${((Date.now()-last)/1000).toFixed(1)}s`,top);
  counts.clear();packets=0;rejected=0;
},1000);
sock.on('error',e=>{console.error('OSC probe bind/read error:',e.message);clearInterval(timer);process.exitCode=1;sock.close();});
sock.bind(port,host,()=>console.log(`OSC read-only probe ${host}:${port} (no OSC/MIDI forwarding; Ctrl-C to exit)`));
process.on('SIGINT',()=>{clearInterval(timer);sock.close();});