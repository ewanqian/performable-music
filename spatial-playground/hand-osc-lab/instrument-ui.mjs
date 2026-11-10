// Optional LAB03 performer layer; app.mjs remains the LAB02 XR sensor engine.
// No additional WebGL context, camera access, downloaded audio samples, or telemetry.
import {GestureInstrument} from './instrument-gesture.mjs';
import {FieldSynth,VOICES} from './instrument-audio.mjs';

const $=id=>document.getElementById(id);
const mapper=new GestureInstrument();
const synth=new FieldSynth();
let lastTick=null,perfLast=0,uiLast=0,flashUntil=0,manualGate=false;
let frameCount=0,maxFrameGap=0,lagFrames=0,computeMs=0,maxComputeMs=0;
let gapSamples=[],eventsLog=[],eventsCount=0,lastOutput=null,lastMode='DESKTOP';
let explicitlyMuted=false,bootPromise=null,lastXRStatus='',lastXRStatusTime=0;
let lastFeedWall=0,staleReleased=false;
const audioState=()=>!synth.ready?'LOCKED':synth.isMuted?'MUTED':
  synth.ctx.state==='running'?'RUNNING':'SUSPENDED';
window.__pmXRAudioStatus='LOCKED';
const updateAudioStatus=()=>{
  const state=audioState();window.__pmXRAudioStatus=state;return state;
};
// Unlock sound while ENTER MR still has an authentic user activation.
// Crucially do NOT await AudioContext startup before WebXR requestSession.
window.__pmBeforeEnterXR=()=>{
  if(explicitlyMuted){addLog('XR AUDIO SKIPPED: manual MUTE active');return;}
  bootPromise=(synth.ready?synth.resume():synth.start()).then(()=>{
    synth.setBpm(Number($('bpm').value)||100);
    $('audio-start').textContent='AUDIO ACTIVE';
    addLog('XR AUDIO '+updateAudioStatus());
  }).catch(err=>{
    addLog('XR AUDIO START FAILED: '+String(err?.message||err));
    updateAudioStatus();
  });
};
window.__pmOnXRStart=(xrMode)=>{
  addLog('XR '+xrMode+' / SOUND '+updateAudioStatus());
  // Starting XR arms sound quietly; a deliberate pinch/contact excites it.
};
window.__pmXRAudioState=(now)=>{
  if(now-lastXRStatusTime<250)return;
  lastXRStatusTime=now;
  const state=updateAudioStatus();
  if(state!==lastXRStatus){lastXRStatus=state;addLog('XR AUDIO STATE '+state);}
};
window.__pmOnXREnd=()=>{
  manualGate=false;mapper.reset();synth.panic();$('audio-start').textContent='RESUME AUDIO';
  addLog('EXIT XR / AUDIO '+updateAudioStatus());
};

const short=(x)=>Number.isFinite(x)?Number(x).toFixed(3):'—';
function addLog(txt){
  eventsCount++;eventsLog.unshift(new Date().toLocaleTimeString()+'  '+txt);
  if(eventsLog.length>22)eventsLog.length=22;
  if($('instrument-events'))$('instrument-events').textContent=eventsLog.join('\n');
}
$('audio-start').addEventListener('click',async()=>{
  explicitlyMuted=false;
  try{
    if(synth.ready&&synth.isMuted)await synth.resume();
    else await synth.start();
    synth.setBpm(Number($('bpm').value)||100);
    $('audio-start').textContent='AUDIO ACTIVE';
    addLog('AUDIO ARMED / pinch, release, listen');updateAudioStatus();
  }catch(e){$('instrument-meter').textContent='Audio startup failed: '+String(e.message||e);$('audio-start').textContent='RETRY AUDIO';updateAudioStatus();}
});
$('audio-panic').addEventListener('click',()=>{
  explicitlyMuted=true;
  manualGate=false;synth.panic();$('audio-start').textContent='RESUME AUDIO';
  addLog('LOCAL AUDIO MUTED / OSC must be disarmed separately');
});
$('audio-volume').addEventListener('input',()=>{
  const value=Number($('audio-volume').value);synth.setVolume(value/100);
  $('audio-volume-value').textContent=value+'%';
});
$('voice-select').addEventListener('change',()=>{
  synth.release();addLog('VOICE '+($('voice-select').value==='auto'?'HAND TIMBRE':VOICES[Number($('voice-select').value)].name));
});
$('quantize').addEventListener('change',()=>{
  synth.quantized=$('quantize').checked;addLog('QUANTIZE '+(synth.quantized?'ON':'OFF'));
});
$('bpm').addEventListener('change',()=>{
  const bpm=Math.max(40,Math.min(220,Number($('bpm').value)||100));
  $('bpm').value=String(bpm);synth.setBpm(bpm);addLog('BPM '+bpm);
});
function setManualGate(isDown){
  manualGate=isDown;
  if(isDown){addLog('SIMULATED GATE ON');}
  else addLog('SIMULATED GATE OFF');
}
$('test-gate').addEventListener('pointerdown',e=>{e.preventDefault();setManualGate(true);$('test-gate').setPointerCapture?.(e.pointerId);});
for(const name of ['pointerup','pointercancel','lostpointercapture','pointerleave']){
  $('test-gate').addEventListener(name,()=>{if(manualGate)setManualGate(false)});
}
$('test-gate').addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();setManualGate(true)}});
$('test-gate').addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){setManualGate(false)}});
$('test-zone').addEventListener('click',()=>{const ok=synth.trigger('C');addLog('SIMULATED ZONE C ENTER'+(ok?' / AUDIO':' / AUDIO LOCKED'));flashUntil=performance.now()+250;});
$('audio-check')?.addEventListener('click',async()=>{
  try{
    explicitlyMuted=false;
    if(!synth.ready)await synth.start();
    else await synth.resume();
    const ok=synth.soundCheck();
    $('audio-start').textContent='AUDIO ACTIVE';
    addLog('SOUND CHECK: '+(ok?'SOFT D4 CONTACT / NO OSC':'FAILED / '+audioState()));
    updateAudioStatus();
  }catch(e){addLog('SOUND CHECK ERROR: '+String(e?.message||e));}
});
$('test-double').addEventListener('click',()=>{
  // Separate deterministic mapper: no spoofed XR hand measurements.
  const m=new GestureInstrument({holdMs:260});
  function hand(x){
    const p=Array.from({length:25},()=>[x,0,-.6]);
    p[4]=[x,0,-.6];p[9]=[x+.012,0,-.6];p[0]=[x,-.1,-.6];
    p[12]=[x+.1,0,-.6];return {positions:p};
  }
  m.update({left:hand(-.1),right:hand(.1),now:0});
  const result=m.update({left:hand(-.1),right:hand(.1),now:300});
  addLog('SIMULATED BILATERAL HOLD → '+(result.params.hold?'PASS':'FAIL'));
});
$('diag-export').addEventListener('click',()=>{
  const result={
    kind:'hand-synth-lab03-diagnostics-v1',date:new Date().toISOString(),
    device: navigator.userAgent,mode:lastMode,frames:frameCount,
    maxFrameGapMs:maxFrameGap,framesOver22Ms:lagFrames,
    avgInstrumentComputeMs:computeMs/Math.max(1,frameCount),
    maxInstrumentComputeMs:maxComputeMs,events:eventsCount,
    lastParams:lastOutput?.params||null,
    // No raw joints, no secrets, no hand images.
    notes:'Runtime-derived metrics; actual audio roundtrip latency and XR compositor FPS are NOT measured by this file.'
  };
  const blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='hand-synth-diagnostics.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
});
function outgoing(params,event=null,now=0){
  if(typeof window.__pmSendPerformance!=='function')return;
  window.__pmSendPerformance({
    params:{gate:params.gate,cutoff:params.cutoff,resonance:params.resonance,
      wet:params.wet,spread:params.spread,energy:params.energy,
      drive:params.drive,hold:params.hold,timbre:params.timbre},
    bpm:synth.bpm,quantized:synth.quantized?1:0,
    ...(event?{event}: {})
  });
}
window.__pmInstrumentFeed=({hands,zoneEvents,now,mode})=>{
  const start=performance.now();lastFeedWall=start;staleReleased=false;
  lastMode=mode;frameCount++;
  if(lastTick!==null){
    const gap=now-lastTick;
    if(gap>0&&gap<1000){
      maxFrameGap=Math.max(gap,maxFrameGap);if(gap>22)lagFrames++;
      gapSamples.push(gap);if(gapSamples.length>160)gapSamples.shift();
    }
  }
  lastTick=now;
  const output=mapper.update({left:hands.left,right:hands.right,zones:zoneEvents,now});
  lastOutput=output;const params={...output.params};
  // Presence is a diagnostic only; it never opens the local audio gate.
  params.presence=mode!=='DESKTOP'&&output.diagnostics.trackedHands>0?1:0;
  // A visible, explicitly simulated desktop gate for checking synthesis without a headset.
  if(mode==='DESKTOP')params.gate=manualGate?1:0;
  const localParams={...params,timbre:$('voice-select').value==='auto'?params.timbre:Number($('voice-select').value)};
  if(synth.ready)synth.update(localParams,now);
  for(const e of output.events){
    if(e.type==='ZONE_ENTER'||e.type==='ZONE_EXIT'){
      const ok=synth.trigger(e.zone,e.type==='ZONE_EXIT');
      addLog(e.hand.toUpperCase()+' '+e.zone+' '+e.type+(ok?' / SOUND':''));
      flashUntil=now+220;
      outgoing(params,{kind:e.type,zone:e.zone,hand:e.hand},now);
    }else if(e.type==='TIMBRE_CHANGE'||e.type==='HOLD_TOGGLE'||e.type==='HOLD_RELEASE'){
      addLog(e.type+(e.value===undefined?'':' '+e.value));
      flashUntil=now+180;outgoing(params,{kind:e.type,value:e.value??0},now);
    }else if(e.type==='ZONE_LOST'){
      addLog('TRACKING LOST '+e.zone+' / neutral only');
    }
  }
  if(now-perfLast>=55){perfLast=now;outgoing(params,null,now)}
  // Low-cost wireframe-only visual signal in the baseline XR renderer.
  window.__pmInstrumentVisual={
    gate:params.gate,
    flash:Math.max(0,Math.min(1,(flashUntil-now)/220)),
    timbre:params.timbre
  };
  if(now-uiLast>=120){
    uiLast=now;
    const avg=gapSamples.reduce((a,b)=>a+b,0)/Math.max(1,gapSamples.length);
    $('instrument-meter').textContent=[
      'AUDIO / '+(synth.ready?(synth.isMuted?'MUTED':synth.ctx.state.toUpperCase()):'LOCKED')+
        '    MODE / '+mode,
      'GATE '+(params.gate?'ON':'OFF')+'  XR PRESENCE '+(params.presence?'ON':'OFF')+
        '  HOLD '+(params.hold?'ON':'OFF')+'  VOICE '+VOICES[localParams.timbre].name+
        '  BPM '+synth.bpm+(synth.quantized?' QUANTIZED':' FREE'),
      'FILTER '+Math.round(650*Math.pow(4400/650,params.cutoff))+'Hz'+
        '  Q '+(.45+params.resonance*1.75).toFixed(1)+
        '  WET '+(params.wet*100).toFixed(0)+'%',
      'SPREAD '+params.spread.toFixed(2)+'  ENERGY '+params.energy.toFixed(2)+
        '  DRIVE '+params.drive.toFixed(2),
      'TRACKED '+output.diagnostics.trackedHands+
        '  HAND DIST '+short(output.diagnostics.interHandM)+'m',
      'FRAME GAP AVG '+avg.toFixed(1)+'ms / est '+(avg>0?Math.round(1000/avg):'—')+'fps'+
        '  >22ms '+lagFrames+'  MAX '+maxFrameGap.toFixed(1)+'ms',
      'AUDIO RMS '+synth.meter().toFixed(3)+
        '  PINGS '+synth.activePings+
        '  LAYER CPU MAX '+maxComputeMs.toFixed(2)+'ms',
      'OSC semantic performance events only when CONNECT + ARM OSC'
    ].join('\n');
  }
  const spent=performance.now()-start;
  computeMs+=spent;maxComputeMs=Math.max(maxComputeMs,spent);
};
// Disconnected sensor stream or headset exit must not leave a sustained note.
window.addEventListener('pagehide',()=>{manualGate=false;synth.panic()});
window.addEventListener('blur',()=>{manualGate=false;synth.release()});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){manualGate=false;mapper.reset();synth.panic();$('audio-start').textContent='RESUME AUDIO';updateAudioStatus();}
});
// A stopped render/sensor stream must release even before the finite phrase ends.
setInterval(()=>{
  if(lastFeedWall&&!staleReleased&&performance.now()-lastFeedWall>320){
    staleReleased=true;manualGate=false;mapper.reset();synth.release();
  }
},160);
