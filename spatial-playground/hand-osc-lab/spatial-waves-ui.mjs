import {VOLUMES,VolumetricContact,controlFromHands,visualGeometry,clamp} from './spatial-waves-engine.mjs';
import {SpatialWavesAudio} from './spatial-waves-audio.mjs';
const $=id=>document.getElementById(id),canvas=$('waves-pad'),ctx=canvas.getContext('2d',{alpha:false});
const contact=new VolumetricContact(),audio=new SpatialWavesAudio();
let yaw=-.32,pitch=.16,drag=null,mode='DESKTOP',xrTracked=0,hasXR=false,explicitMute=false,boot=null;
let params={focus:.5,spread:.5,energy:.4},highlights=new Map(),log=[],record=[],frame=0,lastStatus=0,simTimer=null,simIndex=0;
let cachedGeo=null,lastEvent=0,lastOSC=0,lastHands=null,worldEvents=0,scoreAt=null;
function say(msg){
 const text=new Date().toLocaleTimeString()+' '+msg;
 log.unshift(text);if(log.length>13)log.length=13;
 $('waves-event-log').textContent=log.join('\n');
}
function recordEvent(event,source){
 record.push({...event,source,t_ms:Math.round(performance.now())});
 if(record.length>2000)record.shift();
}
function applyEvents(events,source){
 for(const ev of events){
  if(ev.kind==='ENTER'){
   worldEvents++;
   highlights.set(ev.zone,performance.now()+370);
   if(!audio.muted)audio.raise(ev.zone);
   say('ENTER '+ev.zone+' / '+source);
  }else if(ev.kind==='EXIT')say('EXIT '+ev.zone+' / '+source+' / '+ev.reason);
  recordEvent(ev,source);
 }
 audio.setActive(contact.active());
 for(const b of document.querySelectorAll('[data-volume]'))
  b.classList.toggle('active',contact.active().includes(b.dataset.volume));
 emitControls();
}
function emitControls(){
 const now=performance.now();if(now-lastOSC<65)return;
 lastOSC=now;
 // Bounded event mapping into opt-in authenticated WSS→OSC; not raw UDP.
 window.__pmSendPerformance?.({bpm:audio.bpm,params:{
  gate:contact.active().length?1:0,cutoff:params.focus,
  wet:params.spread*.68,spread:params.spread,
  energy:params.energy,resonance:params.focus,
  drive:params.energy,hold:contact.active().length?1:0,timbre:2
 }});
}
async function bootAudio(){
 await audio.start();
 explicitMute=false;
 $('waves-enable').textContent='AUDIO ACTIVE';
 say('AUDIO RUNNING / 4 HRTF PANNER NODES');
}
$('waves-enable').addEventListener('click',()=>void bootAudio().catch(e=>say('AUDIO ERROR '+e.message)));
$('waves-soundcheck').addEventListener('click',()=>{
 // Distinguish sound permissions from 3D hand hit testing.
 if(!audio.ready)void bootAudio().then(()=>audio.soundCheck()).catch(e=>say('SOUND ERROR '+e.message));
 else void audio.start().then(()=>audio.soundCheck()).catch(e=>say('SOUND ERROR '+e.message));
});
$('waves-stems').addEventListener('change',async e=>{
 const files=[...e.target.files||[]];
 const status=$('waves-stems-status');
 if(files.length!==4){status.textContent='SELECT EXACTLY FOUR FILES';return;}
 status.textContent='DECODING LOCAL STEMS / NOT UPLOADED';
 try{
  const duration=await audio.loadStems(files);
  status.textContent='STEMS READY / '+duration.toFixed(2)+'s / 4 independent HRTF sources. Press PLAY 100 BPM.';
  say('STEMS LOADED / VALIDATED EQUAL LENGTH / LOCAL ONLY');
 }catch(err){
  status.textContent='STEMS REJECTED / '+String(err.message||err);
  say('STEM ERROR '+String(err.message||err));
 }
});
function stopDemo(){
 if(simTimer!==null){clearInterval(simTimer);simTimer=null;}
 $('waves-test').textContent='SIMULATE 4 VOLUMES';
}
$('waves-test').addEventListener('click',async()=>{
 if(simTimer!==null){stopDemo();return;}
 if(!audio.ready)try{await bootAudio()}catch(e){say('SOUND ERROR '+e.message);}
 let k=0;
 $('waves-test').textContent='STOP SIMULATION';
 simTimer=setInterval(()=>{
  const z=VOLUMES[k%VOLUMES.length];
  // Deliberate simulated pointer; does not establish XR sensor correctness.
  const start=performance.now();
  contact.update('sim',null,start);
  contact.update('sim',z.center,start);
  applyEvents(contact.update('sim',z.center,start+85),'SIMULATED');
  k++;if(k>=12)stopDemo();
 },430);
 say('SIMULATED 12 HITS / NOT HEADSET TRACKING');
});
$('waves-play').addEventListener('click',async()=>{
 if(audio.transport){audio.stop();scoreAt=null;$('waves-play').textContent='PLAY 100 BPM';return;}
 if(!audio.ready)try{await bootAudio()}catch(e){say('AUDIO ERROR '+e.message);return;}
 if(audio.play()){scoreAt=performance.now();$('waves-play').textContent='STOP 100 BPM';
  say('16 STEPS / WEB AUDIO CLOCK / ORIGINAL SOUNDS');}
});
function panic(){
 stopDemo();audio.panic();explicitMute=true;
 applyEvents(contact.update('left',null,performance.now()),'PANIC');
 applyEvents(contact.update('right',null,performance.now()),'PANIC');
 applyEvents(contact.update('sim',null,performance.now()),'PANIC');
 $('waves-enable').textContent='RESUME AUDIO';
 $('waves-play').textContent='PLAY 100 BPM';
 say('PANIC / AUDIO NEUTRAL / SENSOR CONTINUES');
}
$('waves-panic').addEventListener('click',panic);
$('waves-reset').addEventListener('click',()=>{
 audio.resetLayers();contact.reset();highlights.clear();
 params={focus:.5,spread:.5,energy:.4};refreshSliders();
 say('LAYER RESET / PHYSICAL POSITIONS UNCHANGED');
});
$('waves-export').addEventListener('click',()=>{
 const data={version:'spatial-waves-v1',source:mode==='DESKTOP'?'SIMULATED_BROWSER':'WEBXR_TRACKED',
  exportedAt:new Date().toISOString(),params,bpm:audio.bpm,events:record,
  audio:audio.status(),sourceCredit:'Original synthesis + geometry; touch:waves is conceptual reference',
  accuracy:'Web Audio HRTF PannerNode is real; XR listener pose tracking not implemented or verified. No physical headset QA claimed.'};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);
 a.download='spatial-waves-performance.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),1000);
});
for(const key of ['focus','spread','energy'])
 $('waves-'+key).addEventListener('input',e=>{
  params[key]=Number(e.target.value)/100;refreshSliders();audio.update(params);emitControls();
 });
function refreshSliders(){
 for(const key of ['focus','spread','energy']){
  $('waves-'+key).value=Math.round(params[key]*100);
  $('waves-'+key+'-value').textContent=Math.round(params[key]*100)+'%';
 }
}
function simulatedHit(id){
 const z=VOLUMES.find(x=>x.id===id);
 const t=performance.now();
 contact.update('sim',null,t);
 contact.update('sim',z.center,t);
 applyEvents(contact.update('sim',z.center,t+105),'SIMULATED_BUTTON');
 setTimeout(()=>{
  applyEvents(contact.update('sim',null,performance.now()),'SIMULATED_RELEASE');
 },320);
 if(!audio.ready)void bootAudio().then(()=>audio.accent(id,.62)).catch(e=>say('AUDIO ERROR '+e.message));
}
for(const button of document.querySelectorAll('[data-volume]'))
 button.addEventListener('click',()=>simulatedHit(button.dataset.volume));
window.__pmBeforeEnterXR=()=>{
 if(explicitMute){say('XR AUDIO SUPPRESSED / EXPLICIT USER MUTE');return;}
 boot=bootAudio().catch(e=>say('XR AUDIO ERROR '+e.message));
};
window.__pmOnXRStart=next=>{
 hasXR=true;mode=next;contact.reset();say('XR HAND VOLUME TEST / '+next);
 boot?.then(()=>{if(!audio.muted)audio.soundCheck()});
};
window.__pmOnXREnd=()=>{
 hasXR=false;mode='DESKTOP';xrTracked=0;
 applyEvents(contact.update('left',null,performance.now()),'XR_LOST');
 applyEvents(contact.update('right',null,performance.now()),'XR_LOST');
 say('EXIT XR / HANDS RELEASED');
};
window.__pmXRAudioState=()=>{
 window.__pmXRAudioStatus=!audio.ready?'LOCKED':audio.muted?'MUTED':
  audio.ctx?.state==='running'?'RUNNING':'SUSPENDED';
};
window.__pmInstrumentFeed=({hands,now,mode:next})=>{
 mode=next;if(next==='DESKTOP')return;
 hasXR=true;lastHands=hands;
 const control=controlFromHands(hands),left=hands.left?.positions?.[9],right=hands.right?.positions?.[9];
 xrTracked=control.tracked;
 const events=[
  ...contact.update('left',left||null,now),
  ...contact.update('right',right||null,now)
 ];
 if(events.length)applyEvents(events,'REAL_XR');
 if(xrTracked){
  params.focus=control.focus;
  params.spread=control.spread;
  params.energy=Math.max(control.energy,.15);
  audio.update(params);
  emitControls();
 }
};
window.__pmOrganicDraw=({line,spot,now})=>{
 const geo=visualGeometry(now,params.energy,params.spread),active=contact.active();
 for(const ring of geo.rings){
  const strong=active.includes(ring.zone),hot=now<(highlights.get(ring.zone)||0);
  for(let i=1;i<ring.points.length;i++)line(ring.points[i-1],ring.points[i],
    ring.color,strong?.85:hot?.7:.28);
 }
 for(const b of geo.bridges)
  for(let i=1;i<b.points.length;i++)
   line(b.points[i-1],b.points[i],[.48,.61,.52],.18+params.spread*.33);
 for(const z of VOLUMES){
  const c=active.includes(z.id)?[.95,.95,.76]:z.color;
  spot(z.center,c,active.includes(z.id)?1:.65);
 }
 // Tie the playable zone to real hand pose in 3D instead of floating 2D indicators.
 for(const side of ['left','right']){
  const tip=lastHands?.[side]?.positions?.[9];
  if(!tip?.every?.(Number.isFinite))continue;
  let nearest=null,dist=Infinity;
  for(const z of VOLUMES){
   const d=Math.hypot(...tip.map((v,i)=>v-z.center[i]));
   if(d<dist){dist=d;nearest=z;}
  }
  if(nearest&&dist<.30)line(tip,nearest.center,nearest.color,.4+params.energy*.4);
 }
};
function project(point,W,H){
 let [x,y,z]=point,zr=z+.77;
 const cy=Math.cos(yaw),sy=Math.sin(yaw);
 const xx=x*cy-zr*sy,zz=x*sy+zr*cy;
 const cp=Math.cos(pitch),sp=Math.sin(pitch);
 const yy=y*cp-zz*sp,z2=y*sp+zz*cp;
 const f=Math.min(W,H)*1.35/(1.65-z2);
 return {x:W*.50+xx*f,y:H*.52-yy*f};
}
function draw(t){
 requestAnimationFrame(draw);
 const rect=canvas.getBoundingClientRect(),W=rect.width,H=rect.height;
 if(W<2||H<2)return;
 const dpr=Math.min(devicePixelRatio||1,1.5),w=Math.round(W*dpr),h=Math.round(H*dpr);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#020706';ctx.fillRect(0,0,W,H);
 ctx.strokeStyle='rgba(161,188,169,.085)';ctx.lineWidth=.7;
 for(let x=0;x<W;x+=35){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
 for(let y=0;y<H;y+=35){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
 const g=visualGeometry(t,params.energy,params.spread),active=contact.active();
 function path(points,stroke,alpha,width=1){
  ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.globalAlpha=alpha;
  ctx.beginPath();
  points.forEach((p,i)=>{
   const v=project(p,W,H);
   if(!i)ctx.moveTo(v.x,v.y);else ctx.lineTo(v.x,v.y);
  });ctx.stroke();ctx.globalAlpha=1;
 }
 for(const b of g.bridges)path(b.points,'#789b88',.20+params.spread*.3,1.1);
 for(const ring of g.rings){
  const z=VOLUMES.find(v=>v.id===ring.zone);
  const h=active.includes(z.id)||t<(highlights.get(z.id)||0);
  const c=h?'#dcebd1':'#97b5a1';
  path(ring.points,c,h?.86:.30,h?2.1:1);
 }
 for(const z of VOLUMES){
  const p=project(z.center,W,H),on=active.includes(z.id)||t<(highlights.get(z.id)||0);
  const radius=on?9:5;
  ctx.strokeStyle=on?'#e1efcf':'#8fac98';ctx.lineWidth=on?3:1.2;
  ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle=on?'#e6efdf':'#b7cbbd';ctx.font='11px ui-monospace,monospace';ctx.textAlign='center';
  ctx.fillText(z.name,p.x,p.y-22);
  ctx.font='9px ui-monospace,monospace';
  ctx.fillText(z.center.map(n=>n.toFixed(2)).join(' / ')+'m',p.x,p.y+28);
 }
 ctx.fillStyle='#bcd1c3';ctx.font='11px ui-monospace,monospace';ctx.textAlign='left';
 ctx.fillText('SPATIAL WAVES / TRUE XYZ + HRTF',22,40);
 ctx.fillText('DRAG ROTATE · CLICK SOUND VOLUME · QUEST INDEX TIP = WORLD CONTACT',22,H-29);
 if(frame++%14===0||t-lastStatus>280){
  lastStatus=t;
  const s=audio.status();
  $('waves-status').textContent=[
   'INPUT '+mode+' / REAL HANDS '+xrTracked,
   'AUDIO '+s.context+(s.muted?' (MUTED)':'')+' / 4 INDEPENDENT HRTF PANNERS',
   'XYZ CONTACT '+(active.join(' + ')||'NONE')+' / TOTAL ENTER '+worldEvents,
   'FOCUS '+params.focus.toFixed(2)+' · SPREAD '+params.spread.toFixed(2)+
     ' · ENERGY '+params.energy.toFixed(2),
   'CLOCK '+audio.bpm+' BPM / STEP '+String(s.step%16+1).padStart(2,'0')+'/16',
   'LAYER GAINS '+Object.entries(s.layers).map(([k,v])=>k+':'+v.toFixed(2)).join(' '),
   'LISTENER '+s.listener+' / REAL QUEST COMPOSITOR FPS: NOT MEASURED'
  ].join('\n');
  $('timeline-head').style.position='absolute';
  $('timeline-head').style.left=(audio.step%16*6.25)+'%';
 }
 if(audio.ready&&!audio.muted)audio.update(params);
}
canvas.addEventListener('pointerdown',e=>{
 e.preventDefault();canvas.setPointerCapture?.(e.pointerId);
 drag={id:e.pointerId,x:e.clientX,y:e.clientY,initialX:e.clientX,initialY:e.clientY,moved:false};
});
canvas.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(Math.hypot(e.clientX-drag.initialX,e.clientY-drag.initialY)>7)drag.moved=true;
 if(drag.moved){yaw+=dx*.0057;pitch=clamp(pitch+dy*.0057,-.8,.8);canvas.classList.add('dragging');}
 drag.x=e.clientX;drag.y=e.clientY;
});
function release(e){
 if(!drag||drag.id!==e.pointerId)return;
 if(!drag.moved){
  const r=canvas.getBoundingClientRect();
  let nearest=null,dist=42;
  for(const z of VOLUMES){
   const p=project(z.center,r.width,r.height);
   const d=Math.hypot(e.clientX-r.left-p.x,e.clientY-r.top-p.y);
   if(d<dist){nearest=z.id;dist=d;}
  }
  if(nearest)simulatedHit(nearest);
 }
 canvas.classList.remove('dragging');drag=null;
}
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,release);
window.addEventListener('pagehide',()=>{stopDemo();audio.panic();});
say('READY / FOUR VOLUMETRIC ZONES / SOUND DISABLED UNTIL CLICK');
requestAnimationFrame(draw);
