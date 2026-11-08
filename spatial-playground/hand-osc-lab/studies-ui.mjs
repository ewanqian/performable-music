// Spatial Instrument Studies 05: three standalone experiments on the LAB02 WebXR hand feed.
import {FingerDial,ScoreTransport,INCANTATION,DIGIT_JOINTS,TRACKS,strudelScore,clamp}
  from './studies-engine.mjs';
import {StemTransport,ProductionTone,NativeFallback} from './studies-audio.mjs';
import {SCORE_ZONES,SpatialScoreMap,scoreWorldPosition,getScorePositionFromXR} from './score-map.mjs';

const $=id=>document.getElementById(id);
const canvas=$('study-pad'),pctx=canvas.getContext('2d',{alpha:false});
const glyph=$('glyph'),gctx=glyph.getContext('2d');
const stem=new StemTransport(),tone=new ProductionTone(),native=new NativeFallback();
const dial=new FingerDial(),clock=new ScoreTransport({bpm:100,lookaheadMs:12});
const scoreMap=new SpatialScoreMap(),scoreMix={pulse:.74,metal:.04,shimmer:.04,chord:.12};
const scoreHitUntil=Object.create(null);
let scoreFocus='pulse',scoreTouches=0,scoreGridStep=0,scoreLastMixUpdate=0;
const logs=[],capture=[],trails=new Map();
const valid=['score','tone','sigil'];
const qs=new URLSearchParams(location.search);
let study=valid.includes(qs.get('lab'))?qs.get('lab'):'score';
let mode='DESKTOP',ready=false,preferred='NATIVE',muted=false,mutedByUser=false;
let lastPointer={x:.5,y:.5},lastFire=-Infinity,lastDialActive=null;
let gestureCounter=0,scoreTimer=null,storyFlash=0,sealUntil=0,seq='',seqProgress=0,frameCount=0,maxFrameGap=0,lastFrame=0;
let audioBoot=null,importing=false,seqTestTimer=null,clockPlayStart=null;
let actualXRHands=0,scoreDemoTimer=null;
const clamp01=x=>clamp(x,0,1);
function log(message){
  const line=new Date().toLocaleTimeString()+'  '+message;
  logs.unshift(line);if(logs.length>15)logs.length=15;
  $('study-log').textContent=logs.join('\n');
}
function record(event){
  if(capture.length<4096)capture.push({...event,mode:study,time:new Date().toISOString()});
  gestureCounter++;
  if(event.type!=='BEAT')log(event.type+' '+(event.value??event.slot??''));
  window.__pmSendStudy?.({
    lab:study,action:event.type,code:Number(event.code)||0,
    value:clamp(Number(event.intensity)||0),
    x:clamp01(Number(event.x)||lastPointer.x),
    y:clamp01(Number(event.y)||lastPointer.y)
  });
}
function soundtrack(){
  if(!ready)return 'LOCKED';
  if(muted)return 'MUTED';
  if(study==='score')return 'NATIVE / '+native.engine.ctx?.state;
  return preferred==='TONE'&&tone.ready?'TONE / '+tone.Tone.getContext().state:
    'NATIVE / '+native.engine.ctx?.state;
}
function status(){
  const text=[
    'LAB '+study.toUpperCase()+' / '+(mode==='DESKTOP'?'DESKTOP SIMULATED':'TRACKED '+mode)+' / HANDS '+actualXRHands,
    'AUDIO '+soundtrack()+'  /  '+(muted?'MUTED':'ACTIVE'),
    'SCORE '+(clock.running?'PLAY':'STOP')+' / '+clock.bpm+' BPM / STEP '+String(scoreGridStep+1).padStart(2,'0')+'/16',
    'SPATIAL PADS '+scoreTouches+' hits | FOCUS '+scoreFocus.toUpperCase()+' | layers '+Object.entries(scoreMix).map(([k,v])=>k.toUpperCase()+':'+Math.round(v*100)+'%').join(' '),
    'TONE PATCH '+tone.patch+' / '+(tone.ready?'TONE.JS ENGINE':'NATIVE FALLBACK'),
    'SIGIL '+(seq||'—')+' / '+seqProgress+'/'+INCANTATION.length,
    'EVENTS '+gestureCounter+'  /  NO OSC REQUIRED FOR AUDIO',
    'XR actual audio latency & compositor FPS: NOT MEASURED'
  ].join('\n');
  $('study-status').textContent=text;
  window.__pmXRAudioStatus=!ready?'LOCKED':muted?'MUTED':
    preferred==='TONE'&&tone.ready?
      (tone.Tone.getContext().state==='running'?'RUNNING':'SUSPENDED'):
      (native.engine.ctx?.state==='running'?'RUNNING':'SUSPENDED');
}
async function enableAudio(){
  // Construct the local native audio graph immediately, in a real user click.
  // Tone.js is optional and requires a pinned external module download.
  if(!ready){
    await native.start();
    ready=true;
  }else await native.resume();
  muted=false;mutedByUser=false;
  if(study!=='score'&&!tone.ready){
    try{
      log('LOADING TONE.JS / PINNED 15.1.22');
      await tone.start();
      if(tone.Tone.getContext().state!=='running'){
        preferred='NATIVE';
        log('TONE.JS CONTEXT SUSPENDED / LOCAL SYNTH FALLBACK');
      }else{
        preferred='TONE';
        tone.setPatch(study==='sigil'?'CATHEDRAL':tone.patch);
        log('TONE.JS READY / FM + AM + MULTI FX');
      }
    }catch(e){
      preferred='NATIVE';
      log('TONE.JS UNAVAILABLE / NATIVE SYNTH FALLBACK: '+String(e.message||e).slice(0,85));
    }
  }else if(tone.ready){
    await tone.resume();
    preferred=tone.Tone.getContext().state==='running'?'TONE':'NATIVE';
  }
  $('study-audio').textContent='AUDIO ACTIVE';
  status();
}
function muteAll(){
  muted=true;mutedByUser=true;
  native.mute();tone.mute();stem.stop();clock.stop();
  clearInterval(scoreTimer);scoreTimer=null;
  $('score-play').textContent='PLAY ARRANGEMENT';
  $('study-audio').textContent='RESUME AUDIO';
  record({type:'MUTE'});
  status();
}
$('study-audio').addEventListener('click',()=>void enableAudio().catch(e=>log('AUDIO ERROR '+String(e))));
$('study-mute').addEventListener('click',muteAll);
window.__pmBeforeEnterXR=()=>{
  if(mutedByUser){log('XR AUDIO MANUALLY MUTED');return;}
  audioBoot=enableAudio().catch(e=>log('XR AUDIO ERROR '+String(e)));
};
window.__pmOnXRStart=xrMode=>{
  log('ENTER '+xrMode+' / LOCAL AUDIO, NOT OSC');
  audioBoot?.then(()=>{
    if(!muted)playSound({digit:3,x:.5,y:.5,energy:.45},true);
  });
};
window.__pmOnXREnd=()=>log('EXIT XR');
window.__pmXRAudioState=()=>{status();};

function select(name){
  if(!valid.includes(name))return;
  if(seqTestTimer!==null){clearInterval(seqTestTimer);seqTestTimer=null;}
  if(scoreDemoTimer!==null){clearInterval(scoreDemoTimer);scoreDemoTimer=null;}
  if(clock.running)stopScore();
  study=name;dial.reset();seq='';seqProgress=0;scoreMap.reset();scoreGridStep=0;
  // Study switching does not replace or reset the original sensor baseline.
  for(const k of valid){
    $('mode-'+k).classList.toggle('active',k===name);
    $('panel-'+k).classList.toggle('active',k===name);
  }
  const next=new URL(location.href);next.searchParams.set('lab',name);
  try{history.replaceState(null,'',next);}catch{}
  if(tone.ready)tone.setPatch(name==='sigil'?'CATHEDRAL':tone.patch);
  log('STUDY → '+name.toUpperCase());status();
}
for(const k of valid)$('mode-'+k).addEventListener('click',()=>select(k));

function playSound({digit=null,x=.5,y=.5,energy=.55}={},diagnostic=false){
  if(!ready||muted)return false;
  const args={digit,energy,x,y};
  let ok=false;
  if(study!=='score'&&preferred==='TONE'&&tone.ready&&tone.Tone.getContext().state==='running'){
    try{ok=tone.fire(args)}catch(e){log('TONE ISSUE / FALLBACK '+e.message);preferred='NATIVE';}
  }
  if(!ok)ok=native.fire(args);
  if(ok&&!diagnostic){storyFlash=performance.now()+190;}
  return ok;
}
function moveSound(x,y,v=0.4){
  lastPointer={x:clamp01(x),y:clamp01(y)};
  if(tone.ready&&!tone.muted)tone.motion(lastPointer.x,lastPointer.y,v);
  native.motion(lastPointer.x,lastPointer.y,v);
  if(stem.running){applyScoreMix();}
}
function scorePadEnter(zoneEvent){
  const zoneId=zoneEvent.id;
  const cfg=SCORE_ZONES.find(z=>z.id===zoneId);if(!cfg)return;
  scoreFocus=zoneId;scoreTouches++;
  scoreMix[zoneId]=Math.min(.98,Math.max(.82,scoreMix[zoneId]+.25));
  scoreHitUntil[zoneId]=performance.now()+380;
  // Audible immediate feedback independent from a clock loop / Web Audio stems.
  if(ready&&!muted){
    const engine=native.engine;
    const sound=zoneId==='chord'?{bank:'orchestra',id:'strings'}:
      {bank:'electro',id:{pulse:'kick',metal:'snare',shimmer:'hat'}[zoneId]};
    engine.setMode(sound.bank);
    engine.trigger({kind:'ENTER',id:sound.id,mode:sound.bank,
      velocity:Math.max(.48,zoneEvent.intensity||.65)});
  }
  record({type:'ZONE',code:SCORE_ZONES.findIndex(z=>z.id===zoneId)+1,
    slot:zoneId,intensity:zoneEvent.intensity||.7,x:zoneEvent.x,y:zoneEvent.y});
  log('PAD '+cfg.name+' / '+Math.round(scoreMix[zoneId]*100)+'% MIX / hit '+scoreTouches);
  applyScoreMix();
}
function handleScoreEvents(events){for(const e of events)if(e.kind==='ENTER')scorePadEnter(e);}
function applyScoreMix(){
  if(!stem.running)return;
  for(const [slot,key] of [['PULSE','pulse'],['METAL','metal'],['SHIMMER','shimmer'],['DRONE','chord']])
    stem.gain(slot,scoreMix[key]);
}
function resetScoreMix(){
  Object.assign(scoreMix,{pulse:.74,metal:.04,shimmer:.04,chord:.12});
  scoreFocus='pulse';scoreTouches=0;scoreMap.reset();
  applyScoreMix();log('SCORE MIX RESET / baseline pulse + low drone');
}
function scoreNote(e){
  if(!clock.running)return;
  // Procedural accompaniment. Imported stems remain the quality path.
  const engine=native.engine;
  const level=scoreMix[e.track]||0;
  if(ready&&!muted&&!stem.running&&level>.09){
    engine.setMode(e.track==='chord'?'orchestra':'electro');
    const id={pulse:'kick',metal:'snare',shimmer:'hat',chord:'strings'}[e.track];
    engine.trigger({kind:'ENTER',id,mode:engine.mode,velocity:e.velocity*level});
  }
  if(e.step===0){record({type:'BAR',code:e.bar,value:e.velocity});}
}
function scoreTick(){
  const now=performance.now(),events=clock.advance(now);
  if(clock.running){
    scoreGridStep=clock.position(now).step;
  }
  for(const e of events)scoreNote(e);
  if(events.length)status();
}
async function startScore(){
  await enableAudio();
  clock.setBpm(Number($('score-bpm').value),performance.now());
  clock.start(performance.now()+50);
  if(scoreTimer!==null)clearInterval(scoreTimer);
  scoreTimer=setInterval(scoreTick,25);
  $('score-play').textContent='PLAYING';
  record({type:'PLAY',code:clock.bpm});
}
function stopScore(){
  clock.stop();clearInterval(scoreTimer);scoreTimer=null;
  $('score-play').textContent='PLAY ARRANGEMENT';status();
}
$('score-play').addEventListener('click',()=>void startScore().catch(e=>log('PLAY FAILED '+e.message)));
$('score-stop').addEventListener('click',stopScore);
$('score-reset-mix')?.addEventListener('click',()=>{
  resetScoreMix();
  scoreHitUntil.pulse=scoreHitUntil.metal=scoreHitUntil.shimmer=scoreHitUntil.chord=0;
  status();
});
$('score-demo')?.addEventListener('click',async()=>{
  if(scoreDemoTimer!==null)return;
  try{await enableAudio();if(!clock.running)await startScore();}
  catch(e){log('DEMO ERROR '+String(e.message||e));return;}
  let i=0;
  scoreDemoTimer=setInterval(()=>{
    const z=SCORE_ZONES[i%SCORE_ZONES.length];
    scorePadEnter({id:z.id,x:z.x,y:z.y,intensity:.66});
    if(++i>=12){clearInterval(scoreDemoTimer);scoreDemoTimer=null;}
  },390);
  log('DEMO / 12 synthetic pad crossings / NOT XR');
});
$('score-bpm').addEventListener('input',e=>{
  const bpm=Number(e.target.value);
  clock.setBpm(bpm,performance.now());tone.setBpm(bpm);
  $('score-bpm-value').textContent=String(bpm);status();
});
$('score-stems').addEventListener('change',async e=>{
  if(importing)return;importing=true;
  const files=[...e.target.files].slice(0,4);
  try{
    let n=0;
    for(const file of files){
      const data=await stem.importFile(stem.names[n++],file);
      log('STEM '+data.slot+' '+data.name+' '+data.duration.toFixed(2)+'s');
    }
    $('stem-list').textContent=stem.status().map(x=>x.slot+' : '+(x.loaded||'—')).join(' / ')+
      ' · Files must be pre-aligned and share BPM. No time-stretching.';
  }catch(err){log('STEM LOAD FAILED '+err.message)}finally{importing=false;}
});
$('score-stem-play').addEventListener('click',async()=>{
  try{
    await stem.start();
    if(!stem.play()){log('IMPORT STEMS FIRST');return;}
    applyScoreMix();
    record({type:'STEMS_PLAY'});
    log('STEMS RUN ON THE SAME WEB AUDIO START CLOCK; NOT ABLETON LINK');
  }catch(e){log('STEMS ERROR '+e.message)}
});
$('score-stem-stop').addEventListener('click',()=>{stem.stop();record({type:'STEMS_STOP'})});
function download(name,text,type='application/json'){
  const blob=new Blob([text],{type}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
$('score-strudel').addEventListener('click',()=>{
  const source=strudelScore(clock.bpm);
  download('spatial-instrument-strudel.js',source,'text/javascript');
  log('STRUDEL SOURCE EXPORTED: paste in strudel.cc REPL (not linked playback)');
});
$('score-osc').addEventListener('click',()=>{
  const details=[...document.querySelectorAll('details')].find(d=>d.textContent.includes('BROWSER OSC BRIDGE'));
  if(details){details.open=true;details.scrollIntoView({behavior:'smooth',block:'start'})}
  log('OSC requires authenticated WSS bridge + ARM; audio remains local');
});

for(const btn of document.querySelectorAll('[data-patch]')){
  btn.addEventListener('click',()=>{
    tone.setPatch(btn.dataset.patch);
    for(const b of document.querySelectorAll('[data-patch]'))b.classList.toggle('active',b===btn);
    if(ready&&!muted)playSound({x:.5,y:.5,energy:.65});
    log('PATCH → '+btn.dataset.patch);status();
  });
}
$('tone-strike').addEventListener('click',async()=>{
  await enableAudio();
  playSound({x:Number($('tone-x').value)/100,y:Number($('tone-y').value)/100,
    energy:Number($('tone-energy').value)/100});
});
$('tone-hold').addEventListener('click',async()=>{
  await enableAudio();
  let n=0;
  const timer=setInterval(()=>{
    playSound({digit:n%6+1,x:(n%6)/5,y:.62,energy:.48+.05*(n%4)});
    if(++n>=8)clearInterval(timer);
  },260);
});
for(const id of ['tone-x','tone-y','tone-energy']){
  $(id).addEventListener('input',()=>{
    moveSound(Number($('tone-x').value)/100,Number($('tone-y').value)/100,
      Number($('tone-energy').value)/100);
    status();
  });
}
function traceGlyph(sequence,seal=false){
  const c=gctx,w=glyph.width,h=glyph.height;
  c.fillStyle='#050807';c.fillRect(0,0,w,h);
  c.strokeStyle='rgba(221,230,208,.17)';c.lineWidth=1;
  c.beginPath();c.arc(w/2,h/2,42,0,Math.PI*2);c.stroke();
  const points=[
    [95,30],[166,93],[245,22],[329,103],[402,26],[474,96]
  ];
  c.lineWidth=seal?5:2.2;
  c.strokeStyle=seal?'#f3d8a4':'#b9dbc6';
  c.beginPath();
  [...sequence].forEach((digit,i)=>{
    const p=points[Number(digit)-1];
    if(!p)return;
    if(i===0)c.moveTo(...p);else c.lineTo(...p);
  });
  c.stroke();
  for(let i=0;i<points.length;i++){
    const [x,y]=points[i];
    c.fillStyle='#b8dbd1';c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.fill();
    c.font='12px monospace';c.fillText(String(i+1),x+8,y-6);
  }
  if(seal){
    c.strokeStyle='#f6dcac';c.lineWidth=2.5;
    c.beginPath();c.arc(w/2,h/2,57,0,Math.PI*2);c.stroke();
  }
}
function enterDigit(digit,simulated=false){
  const d=Number(digit);if(d<1||d>6)return;
  seq=(seq+String(d)).slice(-32);
  seqProgress=0;
  for(let n=Math.min(INCANTATION.length,seq.length);n>=1;n--){
    if(seq.endsWith(INCANTATION.slice(0,n))){seqProgress=n;break;}
  }
  record({type:'DIGIT',code:d,value:.75});
  playSound({digit:d,x:d/7,y:.5,energy:.58});
  traceGlyph(seq.slice(-14),false);
  $('sigil-sequence').textContent=seq;
  $('sigil-progress').textContent='TARGET / '+INCANTATION+' · '+seqProgress+'/10'+
    (simulated?' · DESKTOP TEST':' · XR JOINT INPUT');
  if(seq.endsWith(INCANTATION)){
    sealUntil=performance.now()+2100;
    traceGlyph(INCANTATION,true);
    record({type:'SEAL',code:10,value:1});
    // Dramatic but bounded chord response, no looping sound trap.
    if(tone.ready&&!tone.muted){
      const old=tone.patch;
      tone.setPatch('CATHEDRAL');
      tone.fire({x:.5,y:.7,energy:.8});
      tone.setPatch(old);
    }
  }
}
document.querySelectorAll('.sigil-digit').forEach(button=>
  button.addEventListener('click',async()=>{
    if(!ready)await enableAudio();
    enterDigit(Number(button.dataset.digit),true);
  }));
$('sigil-play').addEventListener('click',async()=>{
  if(!ready)await enableAudio();
  if(seqTestTimer!==null)clearInterval(seqTestTimer);
  let i=0;
  seqTestTimer=setInterval(()=>{
    enterDigit(Number(INCANTATION[i++]),true);
    if(i>=INCANTATION.length){clearInterval(seqTestTimer);seqTestTimer=null;}
  },240);
  log('SIMULATED MANTRA / not sensor precision evidence');
});
$('sigil-reset').addEventListener('click',()=>{
  seq='';seqProgress=0;dial.reset();traceGlyph('');status();
  $('sigil-sequence').textContent='—';
  $('sigil-progress').textContent='TARGET / '+INCANTATION+' · 0/10';
});
$('study-export').addEventListener('click',()=>{
  download('spatial-study-'+study+'.json',JSON.stringify({
    version:'spatial-instrument-studies-0.1',
    study,mode,source:'local-browser',recordedAt:new Date().toISOString(),
    events:capture,sequence:seq,bpm:clock.bpm,engine:preferred,
    soundPatches:tone.ready?['ABYSS','FERRO','CATHEDRAL']:['Native fallback'],
    stemFiles:stem.status(),
    warning:'No proven real Quest tracking FPS, audiovisual latency or DAW/Strudel live sync.'
  },null,2));
});
$('study-test').addEventListener('click',()=>{
  const bench=new ScoreClock({bpm:108,lookaheadMs:0});bench.start(0);
  let count=0;
  for(let i=0;i<10000;i++)count+=bench.advance(i*11.11).length;
  log('10K SYNTHETIC CLOCK FRAMES / '+count+' scheduled events / NOT headset FPS');
});
function pointerMove(key,x,y,now,{immediate=false}={}){
  const old=trails.get(key)||[],prev=old[old.length-1];
  const velocity=prev?Math.min(1,Math.hypot(x-prev.x,y-prev.y)*22):.5;
  old.push({x,y});if(old.length>36)old.shift();trails.set(key,old);
  moveSound(x,y,velocity);
  if(study==='score'){
    handleScoreEvents(scoreMap.move(key,x,y,now,{immediate}));
  }else if(study==='tone'&&now-lastFire>=130&&ready&&!muted){
    playSound({x,y,energy:velocity});lastFire=now;
  }
}
canvas.addEventListener('pointerdown',e=>{
  if(mode!=='DESKTOP')return;
  e.preventDefault();
  canvas.setPointerCapture?.(e.pointerId);
  // Immediate hit feedback. Never wait for a CDN/audio promise before
  // registering pointer capture or hit testing a circle.
  const r=canvas.getBoundingClientRect(),key='p'+e.pointerId;
  const x=clamp((e.clientX-r.left)/r.width),y=clamp((e.clientY-r.top)/r.height);
  trails.set(key,[]);
  pointerMove(key,x,y,performance.now(),{immediate:true});
  if(!ready){
    void enableAudio().then(()=>{
      if(study==='score'&&scoreMap.active().length){
        const zone=scoreMap.active().at(-1);
        const item=SCORE_ZONES.find(z=>z.id===zone);
        if(item){
          const bank=zone==='chord'?'orchestra':'electro';
          const id=zone==='chord'?'strings':{pulse:'kick',metal:'snare',shimmer:'hat'}[zone];
          native.engine.setMode(bank);
          native.engine.trigger({kind:'ENTER',id,mode:bank,velocity:.70});
        }
      }
    }).catch(err=>log('AUDIO BLOCKED '+err.message));
  }
});
canvas.addEventListener('pointermove',e=>{
  const key='p'+e.pointerId;if(!trails.has(key)||mode!=='DESKTOP')return;
  e.preventDefault();
  const r=canvas.getBoundingClientRect();
  pointerMove(key,clamp((e.clientX-r.left)/r.width),
    clamp((e.clientY-r.top)/r.height),performance.now());
});
for(const event of ['pointerup','pointercancel','lostpointercapture']){
  canvas.addEventListener(event,e=>{
    const key='p'+e.pointerId;
    if(study==='score')scoreMap.end(key,performance.now());
    trails.delete(key);
  });
}
window.__pmInstrumentFeed=({hands,now,mode:xrMode})=>{
  mode=xrMode;
  if(xrMode==='DESKTOP')return;
  actualXRHands=(hands.left?1:0)+(hands.right?1:0);
  for(const side of ['left','right']){
    const hand=hands[side],key='xr-'+side;
    const tip=hand?.positions?.[9];
    const pos=getScorePositionFromXR(tip);
    if(study==='score'){
      if(pos)pointerMove(key,pos.x,pos.y,now);
      else{scoreMap.end(key,now);trails.delete(key);}
    }else if(study==='tone'&&pos){
      pointerMove(key,pos.x,pos.y,now);
    }else{trails.delete(key);}
  }
  if(study==='sigil'){
    const hand=hands.right||hands.left;
    const out=dial.update(hand?.positions||null,now);
    for(const ev of out.events){
      if(ev.kind==='DIGIT')enterDigit(ev.digit,false);
      if(ev.kind==='LOST')log('HAND TRACKING LOST / no fabricated digit');
    }
  }
};
window.__pmOrganicDraw=({line,spot,now})=>{
  if(study==='sigil'){
    const positions=[
      [-.36,-.22,-.63],[-.23,-.12,-.63],[-.1,-.22,-.63],
      [.08,-.12,-.63],[.24,-.22,-.63],[.37,-.12,-.63]
    ];
    const active=dial.active;
    positions.forEach((p,i)=>{
      const c=active===i+1?[.96,.81,.46]:[.46,.87,.71];
      spot(p,c,.7);
      for(let j=0;j<12;j++){
        const a=j*Math.PI/6,b=(j+1)*Math.PI/6,r=.022;
        line([p[0]+r*Math.cos(a),p[1]+r*Math.sin(a),p[2]],
          [p[0]+r*Math.cos(b),p[1]+r*Math.sin(b),p[2]],c,.55);
      }
    });
    return;
  }
  if(study==='score'){
    for(const z of SCORE_ZONES){
      const [x,y,depth]=scoreWorldPosition(z);
      const r=z.r*.84,c=z.id===scoreFocus?[.90,.97,.72]:[.50,.83,.72];
      const alpha=scoreMap.active().includes(z.id)?.95:.53;
      for(let n=0;n<28;n++){
        const a=n*Math.PI/14,b=(n+1)*Math.PI/14;
        line([x+Math.cos(a)*r*1.2,y+Math.sin(a)*r*.72,depth],
          [x+Math.cos(b)*r*1.2,y+Math.sin(b)*r*.72,depth],c,alpha);
      }
      spot([x,y,depth],c,alpha);
    }
  }else{
    const c=[.84,.62,.99];
    for(let i=0;i<4;i++){
      const x=(i-1.5)*.21,y=-.16,z=-.65,r=.052;
      for(let n=0;n<16;n++){
        const a=n*Math.PI/8,b=(n+1)*Math.PI/8;
        line([x+r*Math.cos(a),y+r*Math.sin(a),z],
          [x+r*Math.cos(b),y+r*Math.sin(b),z],c,.35);
      }
    }
  }
};
function draw(now){
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.4);
  const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  pctx.setTransform(dpr,0,0,dpr,0,0);
  const W=rect.width,H=rect.height;
  pctx.fillStyle='#030706';pctx.fillRect(0,0,W,H);
  pctx.strokeStyle='#1c2926';pctx.lineWidth=.7;
  for(let x=0;x<W;x+=36){pctx.beginPath();pctx.moveTo(x,0);pctx.lineTo(x,H);pctx.stroke();}
  for(let y=0;y<H;y+=36){pctx.beginPath();pctx.moveTo(0,y);pctx.lineTo(W,y);pctx.stroke();}
  const labels=study==='score'?['PULSE','METAL','SHIMMER','DRONE']:
    study==='tone'?['ABYSS','FERRO','CATHEDRAL','MORPH']:
      ['1','2','3','4','5','6'];
  const size=study==='sigil'?6:4;
  if(study==='score'){
    const current=scoreMap.active(),timestamp=performance.now();
    for(const z of SCORE_ZONES){
      const x=z.x*W,y=z.y*H,r=z.r*Math.min(W,H);
      const lit=current.includes(z.id),flashing=timestamp<(scoreHitUntil[z.id]||0);
      const intensity=scoreMix[z.id];
      pctx.strokeStyle=z.color;
      pctx.globalAlpha=lit||flashing?1:.58;
      pctx.lineWidth=lit?4:flashing?3:1.7;
      pctx.beginPath();pctx.ellipse(x,y,z.r*W,z.r*H,0,0,Math.PI*2);pctx.stroke();
      pctx.globalAlpha=.09+intensity*.22;pctx.fillStyle=z.color;pctx.fill();
      pctx.globalAlpha=1;
      pctx.fillStyle=z.color;pctx.font='600 14px ui-monospace,monospace';pctx.textAlign='center';
      pctx.fillText(z.name,x,y-8);
      pctx.font='10px ui-monospace,monospace';
      pctx.fillText(z.sound+' / '+Math.round(intensity*100)+'%',x,y+14);
      pctx.strokeStyle=z.color;pctx.globalAlpha=.4;
      pctx.beginPath();pctx.arc(x,y+34,6+intensity*8,0,Math.PI*2);pctx.stroke();
      pctx.globalAlpha=1;
    }
    const stepW=Math.min(W-48,520)/16;
    for(let i=0;i<16;i++){
      pctx.fillStyle=i===scoreGridStep?'#d9edcd':'#39564c';
      pctx.fillRect(W/2-stepW*8+i*stepW,H*.87,stepW-3,6);
    }
    pctx.fillStyle='#e2eee5';pctx.font='11px ui-monospace,monospace';
    pctx.textAlign='center';
    pctx.fillText('ENTER PAD → SOUND ACCENT + LAYER IN  /  PLAY → ARRANGEMENT CLOCK',W/2,H*.80);
  }else for(let i=0;i<size;i++){
    const x=(i+.5)/size*W,y=H*(.42+.1*Math.sin(i*1.3)),r=Math.min(W/size*.32,72);
    const c=study==='tone'?'#d0b7ff':'#e2d5b8';
    pctx.strokeStyle=c;pctx.globalAlpha=.48;pctx.lineWidth=1.4;
    pctx.beginPath();pctx.arc(x,y,r,0,Math.PI*2);pctx.stroke();
    pctx.globalAlpha=.78;pctx.font='12px ui-monospace,monospace';pctx.textAlign='center';
    pctx.fillStyle=c;pctx.fillText(labels[i],x,y+5);pctx.globalAlpha=1;
  }
  for(const trail of trails.values()){
    pctx.strokeStyle='#f3f3e2';pctx.lineWidth=2;pctx.beginPath();
    trail.forEach((p,i)=>i?pctx.lineTo(p.x*W,p.y*H):pctx.moveTo(p.x*W,p.y*H));
    pctx.stroke();
  }
  if(now<sealUntil||now<storyFlash){
    pctx.strokeStyle='#d9bb89';pctx.lineWidth=2;
    pctx.beginPath();pctx.arc(W/2,H/2,70+(Math.sin(now*.01)+1)*10,0,Math.PI*2);pctx.stroke();
  }
  pctx.textAlign='left';pctx.font='11px monospace';pctx.fillStyle='#a5bfb1';
  pctx.fillText('PERFORMABLE MUSIC / '+study.toUpperCase(),22,40);
  pctx.fillText('DRAW · TOUCH · PINCH · SCORE',22,H-20);
  frameCount++;
  if(frameCount%14===0)status();
  requestAnimationFrame(draw);
}
window.addEventListener('pagehide',()=>{
  muteAll();
  if(scoreDemoTimer!==null)clearInterval(scoreDemoTimer);
});
select(study);traceGlyph('');
requestAnimationFrame(draw);
