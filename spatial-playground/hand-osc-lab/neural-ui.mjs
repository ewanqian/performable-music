// Neural Field 01: live visual/sound instrument, backed by the existing LAB02 XR feed.
// EEG is never claimed unless device and dataset source have been validated.
// Brain surface geometry is schematic; lines are NOT single-neuron spikes.
import {INITIAL,MODES,BANDS,REGIONS,SURFACE,ELECTRODES,
 assignState,mapJointGesture,signalSnapshot} from './neural-engine.mjs';
import {FieldSynth} from './instrument-audio.mjs';
const $=id=>document.getElementById(id);
const canvas=$('neural-pad'),ctx=canvas.getContext('2d',{alpha:false});
const audio=new FieldSynth();
const color={structure:'#b8c9bd',dim:'#3c5449',signal:'#e5d6b4',
 selected:'#eff4e6',electrodes:'#90bfbe'};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
let state={...INITIAL},headset='DESKTOP',tracked=0;
let yaw=-.32,pitch=.12,drag=null,frame=0,lastUI=0,lastEvent=0;
let soundReady=false,silenced=false,audioBoot=null,scoreTimer=null,scoreAt=0;
let sessionStart=performance.now(),events=[],hasXR=false,pinchAt=null,latch=false;
let pulseUntil=0,listener=null;
const performanceCues=[
 {t:0,mode:'STRUCTURE',band:'theta',region:'frontal',intensity:.28,label:'00 / ACQUIRE · STRUCTURE'},
 {t:12,mode:'SECTION',band:'alpha',region:'parietal',intensity:.42,label:'01 / SECTION · INTERROGATE'},
 {t:27,mode:'ELECTRODES',band:'beta',region:'temporal',intensity:.55,label:'02 / SIGNAL SOURCES · ELECTRODES'},
 {t:43,mode:'SIGNAL',band:'gamma',region:'occipital',intensity:.73,label:'03 / NETWORK · CONVERGENCE'},
 {t:55,mode:'STRUCTURE',band:'alpha',region:'frontal',intensity:.22,label:'04 / RELEASE · RETURN'}
];
function note(line){
 const out=new Date().toLocaleTimeString()+'  '+line;
 events.unshift({t_ms:Math.round(performance.now()),text:line});
 if(events.length>250)events.length=250;
 $('neural-log').textContent=events.slice(0,11).map(e=>e.text).join('\n');
}
function sourceStatus(){
 return !soundReady?'LOCKED':silenced?'MUTED':audio.ctx?.state?.toUpperCase()||'UNKNOWN';
}
function emit(kind,value=0){
 if(performance.now()-lastEvent<40&&kind==='MORPH')return;
 lastEvent=performance.now();
 // Reuse the already authenticated, opt-in performance WSS→OSC bridge.
 // Actual scene labels remain local; only normalized sonic controls go to Max.
 const snapshot=signalSnapshot(state,performance.now());
 window.__pmSendPerformance?.({bpm:100,params:{
   gate:!silenced&&state.active?1:0,cutoff:snapshot.cutoff,
   wet:snapshot.wet,spread:state.spread,energy:snapshot.activity,
   resonance:state.focus,drive:state.intensity,
   timbre:state.band==='theta'?0:state.band==='alpha'?1:2
 }});
 if(['MODE','REGION','BAND','SCORE','PANIC'].includes(kind))note(kind+' / '+String(value));
}
function setState(action,{quiet=false}={}){
 const next=assignState(state,action);
 if(next===state)return;
 state=next;
 if(!quiet)emit(action.type,action.mode||action.band||action.region||action.value);
 refreshButtons();
}
function refreshButtons(){
 for(const b of document.querySelectorAll('[data-neural-mode]')){
  b.classList.toggle('active',b.dataset.neuralMode===state.mode);
  b.setAttribute('aria-pressed',String(b.dataset.neuralMode===state.mode));
 }
 for(const b of document.querySelectorAll('[data-neural-band]')){
  b.classList.toggle('active',b.dataset.neuralBand===state.band);
  b.setAttribute('aria-pressed',String(b.dataset.neuralBand===state.band));
 }
 for(const b of document.querySelectorAll('[data-neural-region]')){
  b.classList.toggle('active',b.dataset.neuralRegion===state.region);
  b.setAttribute('aria-pressed',String(b.dataset.neuralRegion===state.region));
 }
 for(const k of ['focus','spread','intensity']){
  $( 'neural-'+k).value=Math.round(state[k]*100);
  $( 'neural-'+k+'-value').textContent=Math.round(state[k]*100)+'%';
 }
}
for(const b of document.querySelectorAll('[data-neural-mode]'))
 b.addEventListener('click',()=>setState({type:'MODE',mode:b.dataset.neuralMode}));
for(const b of document.querySelectorAll('[data-neural-band]'))
 b.addEventListener('click',()=>setState({type:'BAND',band:b.dataset.neuralBand}));
for(const b of document.querySelectorAll('[data-neural-region]'))
 b.addEventListener('click',()=>setState({type:'REGION',region:b.dataset.neuralRegion}));
for(const key of ['focus','spread','intensity'])
 $('neural-'+key).addEventListener('input',e=>setState({type:key.toUpperCase(),value:Number(e.target.value)/100},{quiet:true}));
async function enableAudio(){
 if(!audio.ready)await audio.start();else await audio.resume();
 soundReady=true;silenced=false;
 setState({type:'ACTIVE',value:true},{quiet:true});
 $('neural-audio').textContent='AUDIO RUNNING';
 note('AUDIO RUNNING / LOCAL SYNTH / NOT EEG');
}
$('neural-audio').addEventListener('click',()=>{
 void enableAudio().catch(e=>note('AUDIO ERROR '+String(e.message||e)));
});
$('neural-soundcheck').addEventListener('click',()=>{
 // Run initiation during the user gesture, never after a delayed XR promise.
 if(!audio.ready){void enableAudio().then(()=>audio.soundCheck()).catch(e=>note('AUDIO ERROR '+e.message));}
 else{void audio.resume().then(()=>{soundReady=true;silenced=false;audio.soundCheck();}).catch(e=>note('SOUND CHECK ERROR '+e.message));}
});
function stopScore(){
 if(scoreTimer!==null){clearInterval(scoreTimer);scoreTimer=null;}
 $('neural-perform').textContent='PLAY 60s CUES';
}
function panic(){
 stopScore();silenced=true;audio.panic();
 setState({type:'PANIC'},{quiet:true});
 $('neural-audio').textContent='RESUME AUDIO';
 emit('PANIC',0);
 note('PANIC / AUDIO NEUTRAL / FRAMEWORK RUNNING');
}
$('neural-panic').addEventListener('click',panic);
$('neural-perform').addEventListener('click',()=>{
 if(scoreTimer!==null){stopScore();return;}
 if(!soundReady&&!silenced)void enableAudio().catch(e=>note('AUDIO ERROR '+e.message));
 scoreAt=performance.now();
 let lastCue=-1;
 $('neural-perform').textContent='STOP PERFORMANCE';
 function tick(){
  const sec=(performance.now()-scoreAt)/1000;
  for(let i=performanceCues.length-1;i>=0;i--){
   if(sec>=performanceCues[i].t&&lastCue!==i){
    const cue=performanceCues[i];
    for(const [type,key] of [['MODE','mode'],['BAND','band'],['REGION','region'],['INTENSITY','intensity']])
     setState({type,[key]:cue[key],value:cue.intensity},{quiet:true});
    note(cue.label+' / SYNTHETIC SHOW SCORE');
    audio.trigger(i%2?'B':'A',false,.45);
    emit('SCORE',i);
    lastCue=i;
    break;
   }
  }
  if(sec>=60){stopScore();setState({type:'ACTIVE',value:false},{quiet:true});note('END 60s / READY FOR REHEARSAL');}
 }
 tick();scoreTimer=setInterval(tick,60);
});
$('neural-reset').addEventListener('click',()=>{
 stopScore();state={...INITIAL};yaw=-.32;pitch=.12;refreshButtons();
 note('RESET VISUAL / SYNTHETIC SOURCE');
});
$('neural-export').addEventListener('click',()=>{
 const data={version:'neural-field-01',source:'SYNTHETIC',timestamp:new Date().toISOString(),
  state,events,limitation:'Illustrative cortex not an anatomical mesh. No recorded or live EEG data. Audio quality and real Quest behavior not hardware certified.'};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);
 a.download='neural-field-demo-session.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),1300);
});
window.__pmBeforeEnterXR=()=>{
 if(silenced){note('XR AUDIO MUTED BY USER');return;}
 // Start audio in same user activation as requestSession.
 audioBoot=enableAudio().catch(e=>note('XR AUDIO ERROR '+String(e.message||e)));
};
window.__pmOnXRStart=mode=>{
 headset=mode;hasXR=true;note('ENTER XR / TRACKING REQUIRED / SYNTHETIC');
 audioBoot?.then(()=>{if(!silenced)audio.soundCheck()});
};
window.__pmOnXREnd=()=>{
 headset='DESKTOP';hasXR=false;tracked=0;pinchAt=null;latch=false;
 setState({type:'ACTIVE',value:false},{quiet:true});
 note('EXIT XR / GATE NEUTRAL');
};
window.__pmXRAudioState=()=>{
 window.__pmXRAudioStatus=!soundReady?'LOCKED':silenced?'MUTED':
   audio.ctx?.state==='running'?'RUNNING':'SUSPENDED';
};
window.__pmInstrumentFeed=({hands,now,mode})=>{
 headset=mode;
 if(mode==='DESKTOP')return;
 hasXR=true;
 const gesture=mapJointGesture(hands);
 tracked=gesture.tracked;
 if(!tracked){
  pinchAt=null;latch=false;
  setState({type:'ACTIVE',value:false},{quiet:true});
  return;
 }
 if(gesture.pinched){
  if(pinchAt===null)pinchAt=now;
  if(now-pinchAt>135&&!latch){
   latch=true;
   setState({type:'ACTIVE',value:true},{quiet:true});
   // A deliberate held pinch selects a region based on fingertip position.
   const x=gesture.x,y=gesture.y;
   const id=x<.38?'frontal':x>.70?'occipital':y<.44?'parietal':'temporal';
   if(state.region!==id)setState({type:'REGION',region:id});
   audio.trigger('B',false,.45);
  }
 }else{
  pinchAt=null;latch=false;
  setState({type:'ACTIVE',value:false},{quiet:true});
 }
 setState({type:'FOCUS',value:gesture.focus},{quiet:true});
 if(gesture.spread!==null)setState({type:'SPREAD',value:gesture.spread},{quiet:true});
};
const proj=(p,W,H)=>{
 const x=p[0],y=p[1],z=p[2]+.77;
 const cy=Math.cos(yaw),sy=Math.sin(yaw);
 const rx=x*cy-z*sy,rz=x*sy+z*cy;
 const cp=Math.cos(pitch),sp=Math.sin(pitch);
 const ry=y*cp-rz*sp,dz=y*sp+rz*cp;
 const scale=Math.min(W,H)*1.96/(1.55-dz);
 return {x:W*.50+rx*scale,y:H*.54-ry*scale,z:dz};
};
function colorForPoint(index,snapshot){
 const selectedIndex=REGIONS.findIndex(r=>r.id===state.region);
 const activity=(.42+.58*Math.sin(index*.13+snapshot.envelope*10))*.7;
 return index%8===selectedIndex?color.signal:state.mode==='SIGNAL'?
   activity>.55?color.structure:color.dim:color.structure;
}
function draw(t){
 requestAnimationFrame(draw);
 const r=canvas.getBoundingClientRect(),W=r.width,H=r.height;
 if(W<2||H<2)return;
 const dpr=Math.min(1.45,devicePixelRatio||1),w=Math.round(W*dpr),h=Math.round(H*dpr);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.fillStyle='#020506';ctx.fillRect(0,0,W,H);
 ctx.lineWidth=.65;ctx.strokeStyle='rgba(174,192,178,.065)';
 for(let x=0;x<W;x+=41){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
 for(let y=0;y<H;y+=41){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
 const snapshot=signalSnapshot(state,t);
 const points=SURFACE.vertices.map(p=>proj(p,W,H));
 const stride=state.mode==='SECTION'?2:1;
 const ncut=state.mode==='SECTION'?.032:-100;
 const drawEdges=(indices,stroke,opacity=1,width=.8)=>{
  ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.globalAlpha=opacity;
  ctx.beginPath();
  for(const [a,b] of indices){
   if(state.mode==='SECTION'&&((SURFACE.vertices[a][0]>ncut)!==(SURFACE.vertices[b][0]>ncut)))continue;
   if(state.mode==='SECTION'&&SURFACE.vertices[a][0]>ncut)continue;
   ctx.moveTo(points[a].x,points[a].y);ctx.lineTo(points[b].x,points[b].y);
  }
  ctx.stroke();ctx.globalAlpha=1;
 };
 drawEdges(SURFACE.edges,color.structure,
   state.mode==='STRUCTURE'?.38:state.mode==='SIGNAL'?.17:.26);
 if(state.mode==='SIGNAL'){
  ctx.strokeStyle='#d7c9a8';ctx.lineWidth=1.4;ctx.globalAlpha=.28+snapshot.envelope*.58;
  ctx.beginPath();
  for(let i=0;i<points.length-7;i+=7){
   const b=(i+31)%points.length;
   ctx.moveTo(points[i].x,points[i].y);
   ctx.lineTo(points[b].x,points[b].y);
  }
  ctx.stroke();ctx.globalAlpha=1;
 }
 if(state.mode==='ELECTRODES'||state.mode==='SIGNAL'){
  for(let i=0;i<ELECTRODES.length;i++){
   const e=ELECTRODES[i],p=proj(e.position,W,H),radius=2.8+snapshot.envelope*3;
   ctx.strokeStyle=state.mode==='ELECTRODES'?color.electrodes:color.signal;
   ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.stroke();
   if(state.mode==='ELECTRODES'){
    ctx.fillStyle='#aabfbe';ctx.font='9px ui-monospace,monospace';
    ctx.fillText(e.id,p.x+5,p.y-5);
   }
  }ctx.globalAlpha=1;
 }
 if(state.mode==='SECTION'){
  ctx.strokeStyle='#b3bfa9';ctx.setLineDash([4,8]);ctx.lineWidth=1.3;ctx.globalAlpha=.65;
  const x=W*.50+Math.sin(yaw)*W*.05;
  ctx.beginPath();ctx.moveTo(x,H*.17);ctx.lineTo(x,H*.87);ctx.stroke();
  ctx.setLineDash([]);ctx.globalAlpha=1;
 }
 const focusRegion=REGIONS.find(x=>x.id===state.region);
 if(focusRegion){
  const p=proj([focusRegion.x,focusRegion.y,focusRegion.z-.77],W,H);
  const radius=13+state.focus*20+snapshot.envelope*7;
  ctx.strokeStyle='#eedcba';ctx.globalAlpha=.88;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#dce6dd';ctx.font='11px ui-monospace,monospace';
  ctx.fillText(focusRegion.name,p.x+radius+9,p.y-4);
  ctx.globalAlpha=1;
 }
 // An actual legible side-band monitor distinct from a pretend neural firing trace.
 ctx.strokeStyle='#b4ccbf';ctx.globalAlpha=.40;ctx.lineWidth=1;
 ctx.beginPath();for(let i=0;i<100;i++){
  const x=W*.08+i*W*.0039,y=H*.79+
     Math.sin(i*.21+t*.0012*(BANDS.find(b=>b.id===state.band)?.hz||10))*
     (6+snapshot.activity*14);
  i?ctx.lineTo(x,y):ctx.moveTo(x,y);
 }ctx.stroke();ctx.globalAlpha=1;
 ctx.font='11px ui-monospace,monospace';
 ctx.fillStyle='#cbd9cf';ctx.textAlign='left';
 ctx.fillText('CORTICAL SCHEMATIC / '+state.mode,W*.08,H*.12);
 ctx.fillText('SYNTHETIC '+state.band.toUpperCase()+' PRESET · VISUAL ENVELOPE '+snapshot.envelope.toFixed(2),
  W*.08,H*.89);
 if(frame++%15===0||t-lastUI>300){
  lastUI=t;
  $('neural-status').textContent=[
   'INPUT '+headset+' / HANDS '+tracked,
   'MODE '+state.mode+' / SELECTED '+state.region.toUpperCase(),
   'AUDIO '+sourceStatus()+' / OSC OPTIONAL / NO COMPUTER NEEDED FOR LOCAL AUDIO',
   'SYNTHETIC BAND '+state.band.toUpperCase()+' / ENVELOPE '+snapshot.envelope.toFixed(2),
   'FOCUS '+state.focus.toFixed(2)+' / SPREAD '+state.spread.toFixed(2)+
      ' / INTENSITY '+state.intensity.toFixed(2),
   'SCHEMATIC POINTS '+SURFACE.vertices.length+' / EDGES '+SURFACE.edges.length,
   'EEG DEVICE: NOT CONNECTED · REAL COMPOSITOR FPS: NOT MEASURED'
  ].join('\n');
 }
 if(soundReady&&!silenced){
  audio.update({gate:state.active?1:0,presence:scoreTimer!==null?.28:0,
   energy:state.intensity,cutoff:snapshot.cutoff,resonance:state.focus,
   wet:snapshot.wet,spread:state.spread,drive:state.intensity,
   timbre:state.band==='theta'?0:state.band==='alpha'?1:2},t);
  if(frame%6===0)emit('MORPH',snapshot.activity);
 }
}
function drawXR({line,spot,now}){
 const snapshot=signalSnapshot(state,now);
 const step=state.mode==='SECTION'?2:1;
 for(let i=0;i<SURFACE.edges.length;i+=step){
  const [a,b]=SURFACE.edges[i];
  const pa=SURFACE.vertices[a],pb=SURFACE.vertices[b];
  if(state.mode==='SECTION'&&(pa[0]>.032||pb[0]>.032))continue;
  const c=state.mode==='SIGNAL'?
    [.67+.17*snapshot.activity,.68+.1*snapshot.activity,.55]:
    [.60,.82,.70];
  line(pa,pb,c,state.mode==='SIGNAL'?.36+.27*snapshot.envelope:.37);
 }
 if(state.mode==='ELECTRODES'||state.mode==='SIGNAL')
  for(const e of ELECTRODES)spot(e.position,[.8,.76,.63],.72);
 const r=REGIONS.find(x=>x.id===state.region);
 if(r){
  const p=[r.x,r.y,r.z-.77];spot(p,[.99,.90,.64],1);
  const radius=.033+.035*state.focus;
  for(let j=0;j<18;j++){
   const a=j*Math.PI/9,b=(j+1)*Math.PI/9;
   line([p[0]+Math.cos(a)*radius,p[1]+Math.sin(a)*radius,p[2]],
     [p[0]+Math.cos(b)*radius,p[1]+Math.sin(b)*radius,p[2]],[.91,.80,.57],.65);
  }
 }
}
window.__pmOrganicDraw=drawXR;
canvas.addEventListener('pointerdown',e=>{
 e.preventDefault();canvas.setPointerCapture?.(e.pointerId);
 drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,id:e.pointerId,moved:false};
});
canvas.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>8)drag.moved=true;
 if(drag.moved){yaw+=dx*.006;pitch=clamp(pitch+dy*.006,-.65,.65);}
 drag.x=e.clientX;drag.y=e.clientY;
});
function pointerEnd(e){
 if(!drag||drag.id!==e.pointerId)return;
 if(!drag.moved){
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,
    y=(e.clientY-r.top)/r.height;
  // Choose the nearest projected *visible* schematic region; avoid invisible tap zones.
  const W=r.width,H=r.height;
  let selected=null,dist=45;
  for(const point of REGIONS){
   const pr=proj([point.x,point.y,point.z-.77],W,H);
   const d=Math.hypot(e.clientX-r.left-pr.x,e.clientY-r.top-pr.y);
   if(d<dist){dist=d;selected=point.id;}
  }
  if(selected){setState({type:'REGION',region:selected});pulseUntil=performance.now()+280;
   if(soundReady&&!silenced)audio.trigger('A',false,.65);}
 }
 drag=null;
}
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,pointerEnd);
canvas.addEventListener('wheel',e=>{
 e.preventDefault();
 setState({type:'FOCUS',value:clamp(state.focus+Math.sign(-e.deltaY)*.045)},{quiet:true});
},{passive:false});
window.addEventListener('pagehide',()=>{stopScore();audio.panic();});
window.addEventListener('blur',()=>{if(hasXR)return;setState({type:'ACTIVE',value:false},{quiet:true});});
refreshButtons();note('SCHEMATIC NEURAL FIELD READY / SYNTHETIC, NOT EEG');
requestAnimationFrame(draw);
