// Standalone six-phalanx dial: visible recognition process, not a blind sound button.
// WebXR receives 25 canonical joint points from LAB02; desktop input is simulated.
import {FingerDial,DIGIT_JOINTS} from '../studies-engine.mjs';
import {FieldSynth} from '../instrument-audio.mjs';
const $=id=>document.getElementById(id);
const canvas=$('sigil-canvas'),ctx=canvas.getContext('2d',{alpha:false});
const audio=new FieldSynth(),dial=new FingerDial();
const nodes=[
 {digit:1,name:'INDEX PIP',zh:'食指中节',x:.43,y:.51},
 {digit:2,name:'INDEX DIP',zh:'食指末节',x:.43,y:.34},
 {digit:3,name:'MIDDLE PIP',zh:'中指中节',x:.57,y:.51},
 {digit:4,name:'MIDDLE DIP',zh:'中指末节',x:.57,y:.30},
 {digit:5,name:'RING PIP',zh:'无名中节',x:.71,y:.53},
 {digit:6,name:'RING DIP',zh:'无名末节',x:.71,y:.37}
];
const events=[],history=[];
let target='3142',selected=3,simDistance=60,simHeld=false,simRelease=false,usingXR=false;
let xrMode='DESKTOP',side='NONE',lastPositions=null,lastOutput=null,entered='',match=0;
let lastFeedback='NO INPUT',audioEnabled=false,muted=true,explicitMute=false,audioBoot=null;
let autoTimer=null,stamp=0,frameNo=0,alertUntil=0,flash=0;
let lastXrUpdate=0;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,Number.isFinite(x)?x:a));
function say(t){
  events.unshift(new Date().toLocaleTimeString()+'  '+t);
  if(events.length>12)events.length=12;
  $('sigil-log').textContent=events.join('\n');
}
function feedback(){
  if(!lastOutput)return;
  const n=lastOutput.nearest,active=lastOutput.active;
  const candidate=dial.candidate;
  const percent=candidate!==null&&n?.d<=dial.onDistance?
    clamp((performance.now()-dial.since)/dial.dwellMs):active!==null?1:0;
  $('sigil-dwell-fill').style.width=Math.round(percent*100)+'%';
  const dists=lastPositions?DIGIT_JOINTS.map(v=>{
    const a=lastPositions[4],b=lastPositions[v.index];
    return a&&b&&a.every(Number.isFinite)&&b.every(Number.isFinite)?
      Math.round(Math.hypot(...a.map((t,i)=>t-b[i]))*1000):null;
  }):[];
  const nearest=n?String(n.digit)+' / '+Math.round(n.d*1000)+'mm':'—';
  const state=active!==null?'CONFIRMED '+active:
    candidate!==null?'CANDIDATE '+candidate+' / '+Math.round(percent*100)+'%':
      lastPositions?'READY / MOVE THUMB':'NO HAND TRACKING';
  $('sigil-status').textContent=[
    'SOURCE '+(usingXR?'REAL WEBXR / '+side:'DESKTOP SIMULATION')+' · '+xrMode,
    'STATE '+state,
    'NEAREST '+nearest,
    'CONTACT <= '+Math.round(dial.onDistance*1000)+'mm, RELEASE > '+Math.round(dial.offDistance*1000)+'mm',
    'DWELL '+Math.round(dial.dwellMs)+'ms, REARM '+Math.round(dial.rearmMs)+'ms',
    'DISTANCES '+DIGIT_JOINTS.map((j,i)=>j.digit+':'+(dists[i]===null?'—':dists[i]+'mm')).join(' · '),
    'LAST '+lastFeedback,
    'AUDIO '+(!audioEnabled?'LOCKED':muted?'MUTED':audio.ctx?.state.toUpperCase()),
    'SIMULATED TESTS ≠ XR ACCURACY'
  ].join('\n');
  for(const btn of $('sigil-buttons').querySelectorAll('button')){
    const digit=Number(btn.dataset.digit);
    btn.dataset.lit=String(active===digit||candidate===digit||n?.digit===digit&&n.d<.05);
  }
}
function signal(type,digit,source='SIMULATED'){
  if(events.length<2000){} // no unbounded event content
  history.push({type,digit,source,t_ms:Math.round(performance.now())});
  if(history.length>2500)history.shift();
  window.__pmSendStudy?.({
    lab:'sigil',action:type==='DIGIT'?'DIGIT':type==='SEAL'?'SEAL':'STOP',
    code:digit||0,value:type==='SEAL'?1:.7,x:digit/7,y:.5
  });
}
function matchLength(str,prefix){
  for(let n=Math.min(str.length,prefix.length);n>=1;n--)
    if(str.endsWith(prefix.slice(0,n)))return n;
  return 0;
}
function digitEvent(d,source){
  entered=(entered+String(d)).slice(-48);
  match=matchLength(entered,target);
  lastFeedback='DIGIT '+d+' / '+source;
  flash=performance.now()+270;
  signal('DIGIT',d,source);
  say('DIGIT '+d+' / '+source+' / '+match+'/'+target.length);
  if(audioEnabled&&!muted){
    audio.trigger(d<=2?'A':d<=4?'B':'C',false,.85);
  }
  if(target&&entered.endsWith(target)){
    alertUntil=performance.now()+1800;
    say('PATTERN COMPLETE / '+target);
    signal('SEAL',d,source);
    if(audioEnabled&&!muted)audio.soundCheck();
  }
  $('sigil-history').textContent=entered||'—';
  $('sigil-match').textContent='TARGET '+target+' / MATCH '+match+'/'+target.length+
    (entered.endsWith(target)?' · COMPLETE':'');
}
function syntheticHand(digit,distMm){
  const p=Array.from({length:25},(_,i)=>[.11+i*.003,.006,-.51]);
  p[4]=[0,0,-.51];
  for(const t of DIGIT_JOINTS)p[t.index]=[.080+t.digit*.009,.005,-.51];
  const j=DIGIT_JOINTS[digit-1];
  if(j)p[j.index]=[distMm/1000,.002,-.51];
  return p;
}
function processHand(positions,now,source='SIMULATED'){
  lastPositions=positions;
  const out=dial.update(positions,now);
  lastOutput=out;
  for(const e of out.events){
    if(e.kind==='DIGIT')digitEvent(e.digit,source);
    if(e.kind==='RELEASE'){lastFeedback='LIFT / REARM';say('RELEASE '+e.digit);}
    if(e.kind==='LOST'){lastFeedback='TRACKING LOST';say('TRACKING LOST / no digit fabricated');}
  }
  if(audioEnabled&&!muted){
    const active=out.active!==null;
    audio.update({gate:active?1:0,presence:0,energy:out.nearest?
      clamp(1-out.nearest.d/.10):0,cutoff:out.nearest?
      (out.nearest.digit-1)/5:.4,wet:.24,spread:.5,resonance:.32,drive:.22,timbre:1},
      now);
  }
}
async function soundStart(){
  if(!audio.ready)await audio.start();else await audio.resume();
  audioEnabled=true;muted=false;explicitMute=false;
  $('sigil-audio').textContent='AUDIO ACTIVE';
  say('LOCAL AUDIO ON / NO MAC OR OSC REQUIRED');
}
function silence(){
  muted=true;explicitMute=true;audio.panic();
  $('sigil-audio').textContent='RESUME AUDIO';
  say('MUTE / tracking continues');
}
$('sigil-audio').addEventListener('click',()=>void soundStart().catch(e=>say('AUDIO ERROR '+e.message)));
$('sigil-mute').addEventListener('click',silence);
window.__pmBeforeEnterXR=()=>{
  if(explicitMute){say('XR AUDIO SKIPPED / MANUAL MUTE');return;}
  audioBoot=soundStart().catch(e=>say('XR AUDIO ERROR '+e.message));
};
window.__pmOnXRStart=mode=>{
  xrMode=mode;usingXR=true;
  say('ENTER XR / tracking 25 joints');
  audioBoot?.then(()=>{if(!muted)audio.soundCheck()});
};
window.__pmOnXREnd=()=>{
  xrMode='DESKTOP';usingXR=false;lastPositions=null;
  processHand(null,performance.now(),'XR_LOST');
  side='NONE';say('XR END / INPUT RELEASED');
};
window.__pmXRAudioState=()=>{
  window.__pmXRAudioStatus=!audioEnabled?'LOCKED':muted?'MUTED':
    audio.ctx?.state==='running'?'RUNNING':'SUSPENDED';
};
window.__pmInstrumentFeed=({hands,now,mode})=>{
  xrMode=mode;if(mode==='DESKTOP')return;
  usingXR=true;lastXrUpdate=performance.now();
  const hand=hands.right||hands.left;
  side=hands.right?'RIGHT':hands.left?'LEFT':'NONE';
  processHand(hand?.positions||null,now,'REAL_XR_'+side);
};
window.__pmOrganicDraw=({line,spot})=>{
  if(!lastPositions||!usingXR)return;
  const thumb=lastPositions[4];
  for(const item of DIGIT_JOINTS){
    const center=lastPositions[item.index];
    if(!center||!center.every(Number.isFinite))continue;
    const near=lastOutput?.nearest?.digit===item.digit;
    const active=lastOutput?.active===item.digit;
    const c=active?[.96,.81,.43]:near?[.90,.65,.49]:[.53,.88,.73];
    const radius=active?.021:near?.018:.013;
    for(let i=0;i<14;i++){
      const a=i*Math.PI/7,b=(i+1)*Math.PI/7;
      line([center[0]+radius*Math.cos(a),center[1]+radius*Math.sin(a),center[2]],
           [center[0]+radius*Math.cos(b),center[1]+radius*Math.sin(b),center[2]],c,.72);
    }
    spot(center,c,.78);
    if(near&&thumb?.every(Number.isFinite)){
      line(thumb,center,c,.82);
    }
  }
};
$('sigil-sim-select').addEventListener('change',e=>{
  selected=Number(e.target.value);
  $('sigil-selected').textContent=String(selected);
  processHand(syntheticHand(selected,80),performance.now(),'SIMULATED');
});
$('sigil-distance').addEventListener('input',e=>{
  simDistance=Number(e.target.value);$('sigil-distance-label').textContent=simDistance+' mm';
});
$('sigil-threshold').addEventListener('input',e=>{
  dial.onDistance=Number(e.target.value)/1000;
  dial.offDistance=Math.max(dial.onDistance+.014,.046);
  $('sigil-threshold-label').textContent=e.target.value+' mm';
});
$('sigil-dwell-range').addEventListener('input',e=>{
  dial.dwellMs=Number(e.target.value);
  $('sigil-dwell-label').textContent=e.target.value+' ms';
});
function stopHold(){
  if(!simHeld)return;
  simHeld=false;simRelease=true;
  processHand(syntheticHand(selected,80),performance.now(),'SIMULATED');
}
const hold=$('sigil-hold');
hold.addEventListener('pointerdown',e=>{
  if(usingXR)return;
  e.preventDefault();hold.setPointerCapture?.(e.pointerId);
  simHeld=true;simRelease=false;say('SIMULATING '+selected+' AT '+simDistance+'mm');
});
for(const event of ['pointerup','pointercancel','lostpointercapture','pointerleave']){
  hold.addEventListener(event,stopHold);
}
$('sigil-release').addEventListener('click',stopHold);
$('sigil-target').addEventListener('input',e=>{
  target=e.target.value.replace(/[^1-6]/g,'').slice(0,16)||'3142';
  e.target.value=target;
  match=matchLength(entered,target);
  $('sigil-match').textContent='TARGET '+target+' / MATCH '+match+'/'+target.length;
});
$('sigil-clear').addEventListener('click',()=>{
  dial.reset();entered='';match=0;lastOutput=null;lastFeedback='RESET';
  $('sigil-history').textContent='—';$('sigil-match').textContent='TARGET '+target+' / MATCH 0/'+target.length;
  say('RESET DIAL');
});
$('sigil-auto').addEventListener('click',async()=>{
  if(autoTimer!==null)return;
  if(!audioEnabled)try{await soundStart()}catch(e){say('AUDIO ERROR '+e.message);}
  let i=0;const seq=target;
  say('AUTO SIMULATION / NOT XR');
  autoTimer=setInterval(()=>{
    digitEvent(Number(seq[i++]),'SIMULATED_AUTO');
    if(i>=seq.length){clearInterval(autoTimer);autoTimer=null;}
  },240);
});
for(const item of nodes){
  const b=document.createElement('button');b.dataset.digit=item.digit;
  b.textContent=item.digit+' / '+item.zh;
  b.addEventListener('click',()=>{
    selected=item.digit;$('sigil-sim-select').value=String(selected);
    $('sigil-selected').textContent=String(selected);
    digitEvent(selected,'SIMULATED_BUTTON');
    if(!audioEnabled){
      // Explicit action still records the digit without needing audio.
      void soundStart().catch(e=>say('AUDIO ERROR '+e.message));
    }
  });
  $('sigil-buttons').append(b);
}
function draw(now){
  requestAnimationFrame(draw);
  if(simHeld&&!usingXR)processHand(syntheticHand(selected,simDistance),now,'SIMULATED_HOLD');
  if(simRelease&&!usingXR){simRelease=false;processHand(syntheticHand(selected,80),now,'SIMULATED_RELEASE');}
  const rect=canvas.getBoundingClientRect(),ratio=Math.min(1.5,devicePixelRatio||1);
  if(rect.width<=0||rect.height<=0)return;
  const W=rect.width,H=rect.height,w=Math.round(W*ratio),h=Math.round(H*ratio);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  ctx.setTransform(ratio,0,0,ratio,0,0);
  ctx.fillStyle='#070d0c';ctx.fillRect(0,0,W,H);
  const unit=Math.min(W,H);
  ctx.strokeStyle='rgba(168,203,171,.12)';ctx.lineWidth=.8;
  for(let x=0;x<W;x+=unit*.09){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=unit*.09){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  const lines=[
    [[.27,.82],[.34,.66]],[[.34,.66],[.31,.48]],
    [[.47,.86],[.43,.51]],[[.43,.51],[.43,.34]],[[.43,.34],[.44,.17]],
    [[.58,.84],[.57,.51]],[[.57,.51],[.57,.30]],[[.57,.30],[.57,.12]],
    [[.69,.83],[.71,.53]],[[.71,.53],[.71,.37]],[[.71,.37],[.72,.21]],
    [[.47,.86],[.58,.84]],[[.58,.84],[.69,.83]],[[.69,.83],[.78,.90]]
  ];
  ctx.lineCap='round';ctx.strokeStyle='#38584f';ctx.lineWidth=Math.max(7,unit*.022);
  for(const [[x1,y1],[x2,y2]] of lines){
    ctx.beginPath();ctx.moveTo(x1*W,y1*H);ctx.lineTo(x2*W,y2*H);ctx.stroke();
  }
  const n=lastOutput?.nearest;
  for(const item of nodes){
    const isNearest=n?.digit===item.digit,active=lastOutput?.active===item.digit;
    const highlight=now<flash&&entered.endsWith(String(item.digit));
    const color=active||highlight?'#f1dca4':isNearest?'#e9ad7e':'#afe2c1';
    const x=item.x*W,y=item.y*H,r=Math.min(unit*.045,35);
    ctx.strokeStyle=color;ctx.lineWidth=active||highlight?4:2.2;
    ctx.fillStyle=active?'rgba(248,207,130,.15)':'rgba(24,54,39,.32)';
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle=color;ctx.font='600 '+Math.max(15,unit*.031)+'px ui-monospace,monospace';ctx.textAlign='center';
    ctx.fillText(String(item.digit),x,y+5);
    ctx.font='10px ui-monospace,monospace';
    ctx.fillText(item.name,x,y+r+17);
  }
  ctx.strokeStyle='#e3b780';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(.31*W,.48*H);
  const targetNode=nodes[selected-1];
  if(!usingXR&&simHeld&&targetNode){
    const alpha=1-simDistance/90;
    ctx.quadraticCurveTo(.30*W,.45*H,targetNode.x*W,targetNode.y*H);
    ctx.stroke();ctx.fillStyle='#f5e1af';ctx.font='12px monospace';
    ctx.fillText(simDistance+'mm',W*.32,H*.39);
  }
  ctx.fillStyle='#b6e0c5';ctx.textAlign='left';ctx.font='12px ui-monospace,monospace';
  ctx.fillText('THUMB → 6 INTERMEDIATE / DISTAL JOINTS',22,38);
  ctx.font='11px ui-monospace,monospace';
  ctx.fillText('GREEN > 46mm    AMBER ≤ 46mm    GOLD ≤ 28mm + DWELL',22,H-25);
  if(now<alertUntil){
    ctx.fillStyle='rgba(241,221,158,.18)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ffe7a6';ctx.textAlign='center';ctx.font='24px monospace';
    ctx.fillText('SEQUENCE COMPLETE',W/2,H*.75);
  }
  frameNo++;
  if(frameNo%6===0){feedback();window.__pmXRAudioState?.();}
  if(usingXR&&now-lastXrUpdate>1100){usingXR=false;side='NONE';processHand(null,now,'XR_LOST');}
}
canvas.addEventListener('pointerdown',e=>{
  if(usingXR)return;
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
  let found=null,best=.08;
  for(const item of nodes){
    const d=Math.hypot(x-item.x,y-item.y);
    if(d<best){found=item;best=d;}
  }
  if(found){
    selected=found.digit;$('sigil-sim-select').value=String(selected);
    $('sigil-selected').textContent=String(selected);
    digitEvent(selected,'SIMULATED_DIAGRAM');
    if(!audioEnabled)void soundStart().catch(err=>say('AUDIO ERROR '+err.message));
  }
});
$('sigil-export').addEventListener('click',()=>{
  const data={kind:'phalanx-dial-simulator-v1',target,entered,
    source:usingXR?'XR':'DESKTOP SIMULATION',thresholdMm:dial.onDistance*1000,
    dwellMs:dial.dwellMs,exportedAt:new Date().toISOString(),events:history,
    caveat:'Synthetic test cannot establish headset sensor precision or timing.'};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);
  link.download='phalanx-dial-session.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),1000);
});
$('sigil-test').addEventListener('click',()=>{
  const test=new FingerDial();let n=0;
  const start=performance.now();
  for(let i=0;i<10000;i++){
    const selected=1+(Math.floor(i/250)%6);
    const mm=i%250<80?22:80;
    n+=test.update(syntheticHand(selected,mm),i*11).events.filter(x=>x.kind==='DIGIT').length;
  }
  say('10K SYNTHETIC HAND FRAMES / '+n+' confirmed contacts / '+Math.round(performance.now()-start)+'ms; NOT Quest FPS');
});
window.addEventListener('pagehide',()=>{audio.panic();if(autoTimer!==null)clearInterval(autoTimer);});
feedback();
requestAnimationFrame(draw);
