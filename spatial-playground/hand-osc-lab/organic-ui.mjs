// Organic Fields: swipe canvas for iPad/desktop; WebXR hands from LAB02 sensor feed.
// One performance engine, three sound worlds, zero copied artist audio packs.
import {MODES,PlaySpace,clamp} from './organic-engine.mjs';
import {OrganicAudio} from './organic-audio.mjs';
const $=id=>document.getElementById(id),pad=$('organic-pad');
const ctx=pad.getContext('2d',{alpha:true}),audio=new OrganicAudio();
const qs=new URLSearchParams(location.search);
let current=MODES[qs.get('mode')]?qs.get('mode'):'metal';
const space=new PlaySpace(current);
const trails=new Map(),touching=new Set(),eventsLog=[],capture=[];
const flashes=new Map();
let xrHands=0,lastTime=performance.now(),frameCount=0,renderMax=0;
let frameGaps=[],audioStartError='',demoActive=false,demoStart=0,stressResult=null;
let mobileView={w:1,h:1},sessionActive=false,playCount=0,visibleMode='DESKTOP';
let explicitlyMuted=false,xrBoot=null,lastAudioReport='';
// The XR button itself is a valid user gesture to unlock Web Audio.
// This runs synchronously BEFORE requestSession; no desktop/OSC bridge needed.
window.__pmBeforeEnterXR=()=>{
  if(explicitlyMuted){log('XR AUDIO: intentionally muted');return;}
  xrBoot=audio.start().then(()=>{
    $('organic-start').textContent='AUDIO ACTIVE';
    window.__pmXRAudioStatus=audio.ctx?.state==='running'?'RUNNING':'SUSPENDED';
    log('XR AUDIO '+window.__pmXRAudioStatus);
  }).catch(err=>log('XR AUDIO ERROR '+String(err?.message||err)));
};
window.__pmOnXRStart=(mode)=>{
  log('XR '+mode+' / Web Audio local');
  xrBoot?.then(()=>{
    const first=MODES[current].fields[0];
    if(audio.trigger({kind:'ENTER',id:first.id,mode:current,velocity:.60})){
      log('XR SOUND CHECK '+first.name+' / local synth');
    }
  });
};
window.__pmXRAudioState=()=>{
  const state=!audio.ready?'LOCKED':audio.muted?'MUTED':
    audio.ctx?.state==='running'?'RUNNING':'SUSPENDED';
  window.__pmXRAudioStatus=state;
  if(state!==lastAudioReport){lastAudioReport=state;log('XR AUDIO '+state);}
};
window.__pmOnXREnd=()=>log('XR SESSION END / audio '+window.__pmXRAudioStatus);

const color3=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
const posFromEvent=e=>{
  const rect=pad.getBoundingClientRect();
  return {x:clamp((e.clientX-rect.left)/rect.width),
    y:clamp((e.clientY-rect.top)/rect.height)};
};
function log(line){
  eventsLog.unshift(new Date().toLocaleTimeString()+'  '+line);
  if(eventsLog.length>14)eventsLog.length=14;
  $('organic-log').textContent=eventsLog.join('\n');
}
function currentFields(){return MODES[current].fields;}
function register(event){
  if(!event)return;
  playCount++;
  flashes.set(event.id,performance.now());
  const played=audio.trigger(event);
  if(event.kind==='ENTER')log(event.mode+'/'+event.id+' '+event.kind+
    (played?' / SOUND':' / MUTED'));
  if(capture.length<3200)capture.push({...event,audioEnabled:audio.ready&&!audio.muted,
    simulated:event.pointer==='demo',tracked:visibleMode!=='DESKTOP'});
  // Share *semantic* events with local WSS/OSC bridge, only when explicitly ARMED.
  window.__pmSendOrganic?.(event);
}
function processEvents(list){for(const e of list)register(e);}
function move(key,x,y,now){
  processEvents(space.move(key,x,y,now));
  const list=trails.get(key)||[];
  list.push({x,y,t:now});if(list.length>34)list.shift();
  trails.set(key,list);
  audio.motion(x,y,space.lastVelocity);
}
function release(key,now){
  processEvents(space.end(key,now));
  trails.delete(key);
}
function modeChange(mode){
  if(!MODES[mode])return;
  const previous=[...space.points.keys()];
  for(const p of previous)release(p,performance.now());
  space.reset(mode);trails.clear();flashes.clear();
  current=mode;audio.setMode(mode);
  $('organic-bpm').value=String(MODES[mode].bpm);
  $('organic-bpm-value').textContent=String(MODES[mode].bpm);
  $('organic-desc').textContent=MODES[mode].description;
  for(const key of Object.keys(MODES))$('mode-'+key).setAttribute('aria-pressed',String(key===mode));
  const next=new URL(location.href);next.searchParams.set('mode',mode);
  try{history.replaceState(null,'',next);}catch{}
  log('MODE → '+MODES[mode].title);
}
for(const m of Object.keys(MODES))
  $('mode-'+m).addEventListener('click',()=>modeChange(m));
$('organic-start').addEventListener('click',async()=>{
  explicitlyMuted=false;
  try{
    await audio.start();
    $('organic-start').textContent='AUDIO ACTIVE';
    audioStartError='';log('WEB AUDIO ENABLED · lower volume before headset use');
  }catch(e){audioStartError=String(e.message||e);log('AUDIO ERROR: '+audioStartError);}
});
$('organic-mute').addEventListener('click',()=>{
  explicitlyMuted=true;
  audio.panic();$('organic-start').textContent='RESUME AUDIO';
  log('LOCAL AUDIO MUTED / OSC independent');
});
$('organic-bpm').addEventListener('input',e=>{
  audio.setBpm(Number(e.target.value));
  $('organic-bpm-value').textContent=String(audio.bpm);
});
$('organic-quantize').addEventListener('change',e=>{
  audio.quantized=e.target.checked;
  log(audio.quantized?'1/16 QUANTIZATION ON':'FREE RHYTHM');
});
$('organic-demo').addEventListener('click',async()=>{
  if(demoActive){
    demoActive=false;release('demo',performance.now());
    $('organic-demo').textContent='PLAY ∞ PATH';return;
  }
  if(!audio.ready){
    try{await audio.start();$('organic-start').textContent='AUDIO ACTIVE';}
    catch(e){log('AUDIO ERROR '+e.message);return;}
  }
  demoStart=performance.now();demoActive=true;
  $('organic-demo').textContent='STOP ∞ PATH';
  log('DEMO PATH / synthetic input, not headset evidence');
});
$('organic-reset').addEventListener('click',()=>{
  for(const p of [...space.points.keys()])release(p,performance.now());
  space.reset(current);trails.clear();flashes.clear();
  demoActive=false;$('organic-demo').textContent='PLAY ∞ PATH';
  log('RESET FIELD (audio tails decay; MUTE stops output)');
});
$('organic-export').addEventListener('click',()=>{
  const report={
    kind:'organic-fields-v1',time:new Date().toISOString(),mode:current,
    bpm:audio.bpm,quantized:audio.quantized,device:navigator.userAgent,
    context:visibleMode,frameGapMeanMs:frameGaps.reduce((a,b)=>a+b,0)/Math.max(1,frameGaps.length),
    renderMaxMs:renderMax,events:playCount,audioVoices:audio.active,voicesDropped:audio.dropped,
    simulatedStress:stressResult,
    note:'JS frame interval ≠ compositor FPS; no measured audio latency or real headset QA.',
    history:capture
  };
  const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='organic-fields-'+current+'-session.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
});
$('organic-stress').addEventListener('click',async()=>{
  const test=new PlaySpace(current);let total=0;
  const start=performance.now();
  // Chunked synthetic stress: 12k samples, no audio/network, keeps page interactive.
  for(let offset=0;offset<12000;offset+=500){
    for(let i=offset;i<offset+500;i++){
      const theta=i*.074;
      total+=test.move('bench',.5+.32*Math.sin(theta),
        .5+.32*Math.sin(2*theta),i*11.11).length;
    }
    await new Promise(resolve=>setTimeout(resolve,0));
  }
  stressResult={samples:12000,events:total,
    elapsedMs:Number((performance.now()-start).toFixed(1)),
    synthetic:true,mode:current};
  log('STRESS PASS 12K SIMULATED FRAMES / events '+total+
    ' / '+stressResult.elapsedMs+'ms');
});
pad.addEventListener('pointerdown',e=>{
  if(visibleMode!=='DESKTOP')return;
  e.preventDefault();
  pad.setPointerCapture?.(e.pointerId);
  const p=posFromEvent(e),key='touch-'+e.pointerId;
  touching.add(key);move(key,p.x,p.y,performance.now());
});
pad.addEventListener('pointermove',e=>{
  const key='touch-'+e.pointerId;if(!touching.has(key)||visibleMode!=='DESKTOP')return;
  e.preventDefault();
  const p=posFromEvent(e);move(key,p.x,p.y,performance.now());
});
for(const t of ['pointerup','pointercancel','lostpointercapture'])
  pad.addEventListener(t,e=>{
    const key='touch-'+e.pointerId;
    if(touching.has(key)){touching.delete(key);release(key,performance.now());}
  });
window.addEventListener('keydown',e=>{
  if(e.target?.matches?.('input,textarea,select'))return;
  if(['1','2','3'].includes(e.key)){modeChange(['metal','electro','orchestra'][Number(e.key)-1]);}
  if(e.key.toLowerCase()==='m'){audio.panic();$('organic-start').textContent='RESUME AUDIO';}
});
window.addEventListener('pagehide',()=>audio.panic());
window.addEventListener('blur',()=>{
  for(const id of touching)release(id,performance.now());touching.clear();
});
window.__pmInstrumentFeed=({hands,now,mode})=>{
  visibleMode=mode;
  if(mode==='DESKTOP')return; // desktop baseline fake hand is NOT hardware input
  let tracked=0;
  for(const side of ['left','right']){
    const hand=hands[side],tip=hand?.positions?.[9],key='xr-'+side;
    if(tip&&tip.length===3&&tip.every(Number.isFinite)&&
       tip[2]>-.94&&tip[2]<-.30){
      tracked++;
      // XR local physical working field: 1.2m wide × 0.72m high,
      // 0.30-0.94m forward. Device/pose alignment MUST be verified.
      const x=clamp(.5+tip[0]/1.2),y=clamp((.28-tip[1])/.72);
      move(key,x,y,now);
    }else if(space.points.has(key))release(key,now);
  }
  xrHands=tracked;
};
// Draw six lightweight play regions directly in existing WebXR WebGL compositor.
// The HTML touchscreen canvas does not render inside immersive WebXR.
window.__pmOrganicDraw=({line,spot,now})=>{
  const fields=currentFields();
  const depth=-.61;
  for(const region of fields){
    const c=color3(region.color);
    const x=(region.x-.5)*1.2,y=.28-region.y*.72,r=region.r*.8;
    const since=now-(flashes.get(region.id)??-10000);
    const flare=clamp(1-since/290);
    const alpha=.33+.61*flare;
    for(let i=0;i<30;i++){
      const a=i*2*Math.PI/30,b=(i+1)*2*Math.PI/30;
      line([x+r*Math.cos(a),y+r*Math.sin(a),depth],
        [x+r*Math.cos(b),y+r*Math.sin(b),depth],c,alpha);
    }
    spot([x,y,depth],c,.6+.35*flare);
  }
};
function canvasSize(){
  const box=pad.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.6);
  const w=Math.max(1,Math.floor(box.width*dpr)),
    h=Math.max(1,Math.floor(box.height*dpr));
  if(pad.width!==w||pad.height!==h){pad.width=w;pad.height=h;}
  mobileView={w:box.width,h:box.height};
  // All drawing code uses CSS pixel coordinates regardless of DPR.
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return mobileView;
}
function draw(now){
  const {w,h}=canvasSize();
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#080c0d';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='rgba(150,170,162,.09)';ctx.lineWidth=.7;
  const unit=Math.min(w,h)*.08;
  for(let x=0;x<w;x+=unit){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  for(let y=0;y<h;y+=unit){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  // A barely-there figure-eight path guide; it is a gesture score, not auto-play.
  ctx.strokeStyle='rgba(213,226,208,.16)';ctx.lineWidth=1;ctx.setLineDash([3,9]);
  ctx.beginPath();
  for(let k=0;k<=90;k++){
    const a=k/90*Math.PI*2,x=(.5+.29*Math.sin(a))*w,
      y=(.5+.24*Math.sin(2*a))*h;
    if(!k)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.stroke();ctx.setLineDash([]);
  const field=currentFields();
  for(const region of field){
    const x=region.x*w,y=region.y*h,r=region.r*Math.min(w,h)*1.20;
    const passed=now-(flashes.get(region.id)??-10000);
    const strength=clamp(1-passed/390);
    ctx.save();
    ctx.globalAlpha=.38+.58*strength;
    ctx.strokeStyle=region.color;ctx.lineWidth=1.25+strength*2.5;
    ctx.fillStyle=region.color;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
    if(strength>0){
      ctx.globalAlpha=.07+.13*strength;ctx.fill();
      ctx.globalAlpha=.45*strength;
      ctx.beginPath();ctx.arc(x,y,r*(1+.28*(1-strength)),0,Math.PI*2);ctx.stroke();
    }
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.globalAlpha=.95;ctx.fillStyle='#eaf3ed';
    ctx.font='600 '+Math.max(10,Math.min(14,w*.014))+'px ui-monospace,monospace';
    ctx.fillText(region.name,x,y-5);
    ctx.globalAlpha=.65;ctx.font='10px ui-monospace,monospace';
    ctx.fillText(region.note,x,y+12);
    ctx.restore();
  }
  for(const [key,trail] of trails){
    if(!trail.length)continue;
    ctx.lineWidth=key.startsWith('xr-')?3:2.4;
    ctx.strokeStyle=key.includes('left')?'#ffc5a8':key.includes('right')?'#bce9fc':'#d5f7d8';
    ctx.beginPath();for(let i=0;i<trail.length;i++){
      const p=trail[i],x=p.x*w,y=p.y*h;
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }ctx.stroke();
    const tip=trail[trail.length-1];
    ctx.fillStyle='#f9fff1';ctx.beginPath();
    ctx.arc(tip.x*w,tip.y*h,5,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle='rgba(216,229,218,.65)';ctx.font='11px ui-monospace,monospace';
  ctx.fillText('ORGANIC FIELDS / '+current.toUpperCase(),16,28);
  ctx.textAlign='right';ctx.fillText('SWIPE · TRACE · CROSS · REPEAT',w-18,h-24);
}
function metrics(now){
  const gap=now-lastTime;
  if(gap>0&&gap<1000){frameGaps.push(gap);if(frameGaps.length>180)frameGaps.shift();}
  lastTime=now;frameCount++;
  if(frameCount%9===0){
    const mean=frameGaps.reduce((a,b)=>a+b,0)/Math.max(1,frameGaps.length);
    $('organic-meter').textContent=[
      'PACK '+current.toUpperCase()+' / '+MODES[current].title,
      'AUDIO '+(audio.ready?(audio.muted?'MUTED':audio.ctx.state.toUpperCase()):'LOCKED')+
      '  BPM '+audio.bpm+(audio.quantized?' / 1/16':' / FREE'),
      'ACTIVE VOICES '+audio.active+' / 64   DROPPED '+audio.dropped+
      '    RMS '+audio.meter().toFixed(3),
      'INPUT '+visibleMode+'  HANDS '+xrHands+'  POINTERS '+space.points.size,
      'EVENTS '+playCount+'  PATH '+space.pathLength.toFixed(1)+
        '  SPEED '+space.lastVelocity.toFixed(2),
      'JS LOOP '+(mean?Math.round(1000/mean):'—')+'FPS est. / max draw '+renderMax.toFixed(1)+'ms',
      'OSC optional · CONNECT and ARM below · no raw coordinates uploaded'
    ].join('\n');
  }
}
function frame(now){
  requestAnimationFrame(frame);
  if(demoActive){
    const t=(now-demoStart)/1000,theta=t*Math.PI*.85;
    move('demo',.5+.32*Math.sin(theta),.5+.29*Math.sin(2*theta),now);
  }
  const start=performance.now();
  draw(now);renderMax=Math.max(renderMax,performance.now()-start);
  metrics(now);
}
modeChange(current);
requestAnimationFrame(frame);
