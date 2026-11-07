// WebSocket -> UDP OSC bridge. The browser CANNOT send UDP directly.
// Node 20+, npm install. Run behind trusted WSS reverse proxy for Quest/GitHub Pages.
// No musical synthesis, low-level hardware shutdown, or internet telemetry here.
import {WebSocketServer} from 'ws';
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import dgram from 'node:dgram';

const host=process.env.BRIDGE_HOST||'127.0.0.1';
const port=Number(process.env.BRIDGE_PORT||8787);
const oscHost=process.env.OSC_HOST||'127.0.0.1';
const oscPort=Number(process.env.OSC_PORT||9000);
const token=process.env.HAND_OSC_TOKEN;
const allowedOrigins=(process.env.ALLOWED_ORIGINS||'https://ewanqian.github.io,http://localhost:8000,http://127.0.0.1:8000')
  .split(',').map(s=>s.trim()).filter(Boolean);
if(!token||token.length<16){console.error('Set HAND_OSC_TOKEN to a random 16+ character secret.');process.exit(1);}
const tls=process.env.TLS_CERT&&process.env.TLS_KEY;
const server=tls?https.createServer({
  cert:fs.readFileSync(process.env.TLS_CERT),key:fs.readFileSync(process.env.TLS_KEY)
}):http.createServer();
const wss=new WebSocketServer({server,maxPayload:256*1024,perMessageDeflate:false});
const udp=dgram.createSocket('udp4');
function padString(s){
  const raw=Buffer.from(s+'\0','utf8'),out=Buffer.alloc(Math.ceil(raw.length/4)*4);
  raw.copy(out);return out;
}
function message(addr,values=[]){
  const tags=','+values.map(v=>typeof v==='string'?'s':Number.isInteger(v)?'i':'f').join('');
  const parts=[padString(addr),padString(tags)];
  for(const value of values){
    if(typeof value==='string')parts.push(padString(value));
    else{
      const b=Buffer.alloc(4);
      if(Number.isInteger(value)){b.writeInt32BE(Math.max(-2147483648,Math.min(2147483647,value)),0);}
      else{b.writeFloatBE(Number.isFinite(value)?value:0,0);}
      parts.push(b);
    }
  }
  return Buffer.concat(parts);
}
function osc(addr,values){const b=message(addr,values);udp.send(b,oscPort,oscHost);}
function validVector(p){return Array.isArray(p)&&p.length===3&&p.every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<100);}
function oscHand(side,h,full){
  osc('/pm/hand/'+side+'/tracked',[1]);
  for(const [key,oscKey] of [['wrist','wrist'],['index_tip','index-tip'],['thumb_tip','thumb-tip']]){
    if(validVector(h[key]))osc('/pm/hand/'+side+'/'+oscKey,h[key]);
  }
  if(typeof h.pinch_m==='number'&&Number.isFinite(h.pinch_m))osc('/pm/hand/'+side+'/pinch-m',[h.pinch_m]);
  if(h.angles&&typeof h.angles==='object'){
    // 14 geometric bend angles, NOT calibrated anatomical measurements.
    for(const [k,v] of Object.entries(h.angles)){
      if(/^[a-z-]+$/.test(k)&&typeof v==='number'&&Number.isFinite(v))
        osc('/pm/hand/'+side+'/angle/'+k,[v]);
    }
  }
  if(!full||!Array.isArray(h.positions)||h.positions.length!==25)return;
  const names=[
    'wrist','thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip',
    'index-finger-metacarpal','index-finger-phalanx-proximal','index-finger-phalanx-intermediate','index-finger-phalanx-distal','index-finger-tip',
    'middle-finger-metacarpal','middle-finger-phalanx-proximal','middle-finger-phalanx-intermediate','middle-finger-phalanx-distal','middle-finger-tip',
    'ring-finger-metacarpal','ring-finger-phalanx-proximal','ring-finger-phalanx-intermediate','ring-finger-phalanx-distal','ring-finger-tip',
    'pinky-finger-metacarpal','pinky-finger-phalanx-proximal','pinky-finger-phalanx-intermediate','pinky-finger-phalanx-distal','pinky-finger-tip'];
  const quats=h.orientations||[];
  for(let i=0;i<25;i++){
    const p=h.positions[i];
    if(!validVector(p))continue;
    const q=quats[i];
    const args=q&&Array.isArray(q)&&q.length===4&&q.every(Number.isFinite)?[...p,...q]:p;
    osc('/pm/hand/'+side+'/joint/'+names[i],args);
  }
}
const live=new Set();
function neutral(reason){
  osc('/pm/system/connected',[0]);
  osc('/pm/system/stale',[1]);
  osc('/pm/hand/left/tracked',[0]);osc('/pm/hand/right/tracked',[0]);
  // Never leave an external synthesizer's sustained envelope latched after stale/disconnect/panic.
  osc('/pm/perf/gate',[0]);osc('/pm/perf/hold',[0]);
  if(reason)osc('/pm/system/reason',[reason]);
}
wss.on('connection',(socket,request)=>{
  const origin=request.headers.origin||'';
  if(!allowedOrigins.includes(origin)){socket.close(1008,'Origin denied');return;}
  const client={socket,ready:false,seq:-1,last:Date.now(),active:false};
  live.add(client);
  const helloTimer=setTimeout(()=>{if(!client.ready)socket.close(1008,'Hello required');},5000);
  socket.on('message',raw=>{
    let data;
    try{data=JSON.parse(raw.toString());}catch{socket.close(1007,'Invalid JSON');return;}
    if(!client.ready){
      if(data?.type==='hello'&&data.token===token){
        client.ready=true;client.last=Date.now();clearTimeout(helloTimer);
        socket.send(JSON.stringify({type:'ready',osc_host:oscHost,osc_port:oscPort}));
      }else{socket.close(1008,'Invalid token');}
      return;
    }
    if(data?.type==='panic'){
      osc('/pm/system/soft-panic',[1]);neutral('browser-soft-panic');
      client.active=false;client.last=Date.now();return;
    }
    if(data?.type==='zone'){
      if(!/^[ABC]$/.test(data.zone)||!['left','right'].includes(data.hand)||
         !['ENTER','EXIT','TRACKING_LOST'].includes(data.type))return;
      osc('/pm/zone/'+data.zone+'/'+data.type.toLowerCase(),[data.hand,Number.isSafeInteger(data.seq)?data.seq:0,Number.isFinite(data.t_ms)?Math.round(data.t_ms):0]);
      return;
    }
    if(data?.type==='performance'){
      if(!Number.isSafeInteger(data.seq)||data.seq<=client.seq)return;
      client.seq=data.seq;
      // A semantic control layer. Untrusted browser values are strictly bounded
      // before converting to OSC. Keep frame heartbeat as source of staleness.
      const params=data.params||{};
      const names=['gate','cutoff','resonance','wet','spread','energy','drive','hold'];
      for(const name of names){
        const v=params[name];
        if(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1)
          osc('/pm/perf/'+name,[v]);
      }
      if(Number.isInteger(params.timbre)&&params.timbre>=0&&params.timbre<=2)
        osc('/pm/perf/timbre',[params.timbre]);
      if(Number.isFinite(data.bpm)&&data.bpm>=40&&data.bpm<=220)
        osc('/pm/perf/bpm',[Number(data.bpm)]);
      if(data.quantized===0||data.quantized===1)osc('/pm/perf/quantized',[data.quantized]);
      const ev=data.event;
      if(ev&&['ZONE_ENTER','ZONE_EXIT'].includes(ev.kind)&&
         /^[ABC]$/.test(ev.zone)&&['left','right'].includes(ev.hand)){
        osc('/pm/perf/zone/'+ev.zone+'/'+ev.kind.toLowerCase(),[ev.hand]);
      }else if(ev&&['TIMBRE_CHANGE','HOLD_TOGGLE','HOLD_RELEASE'].includes(ev.kind)){
        osc('/pm/perf/event',[ev.kind,Number.isInteger(ev.value)?Math.max(0,Math.min(2,ev.value)):0]);
      }
      return;
    }
    if(data?.type!=='frame'||!Number.isSafeInteger(data.seq)||data.seq<=client.seq)return;
    client.seq=data.seq;client.last=Date.now();
    if(!client.active){client.active=true;osc('/pm/system/connected',[1]);osc('/pm/system/stale',[0]);}
    for(const side of ['left','right']){
      const h=data.hands?.[side];
      if(h&&typeof h==='object')oscHand(side,h,Boolean(data.full));
      else osc('/pm/hand/'+side+'/tracked',[0]);
    }
    if(typeof data.t_ms==='number'&&Number.isFinite(data.t_ms))osc('/pm/system/elapsed-ms',[data.t_ms]);
  });
  socket.on('close',()=>{
    clearTimeout(helloTimer);live.delete(client);
    // Show a neutral signal only if no other authorized sender remains active.
    if(![...live].some(c=>c.active))neutral('disconnect');
  });
  socket.on('error',()=>{});
});
setInterval(()=>{
  const now=Date.now();let lost=false;
  for(const c of live){
    if(c.ready&&c.active&&now-c.last>350){c.active=false;lost=true;}
  }
  if(lost&&![...live].some(c=>c.active))neutral('input-stale');
},50);
server.listen(port,host,()=>{
  console.log('Hand/OSC WS bridge '+(tls?'wss':'ws')+'://'+host+':'+port);
  console.log('OSC UDP -> '+oscHost+':'+oscPort);
  console.log(tls?'TLS configured.':'UNENCRYPTED DEV MODE: loopback only; HTTPS clients require trusted WSS.');
  console.log('Allowed browser origins: '+allowedOrigins.join(', '));
});
process.on('SIGINT',()=>{neutral('server-exit');server.close();udp.close();process.exit(0);});
