// Gestural Atlas UI — music and cultural research intentionally separate.
// One XR sensor (LAB02), one cheap WebGL line renderer, two distinct interfaces.
import {COLLECTIONS,LUOSHU,LUOSHU_LINES,HETU,TRIGRAMS,STARS,TRACE_NODES,
 SwordLatch,Hexagram,RiverGrammar,StarRoute,TraceRoute,bimanual,FingerDial,clamp}
 from './atlas-engine.mjs';
import {FieldSynth} from './instrument-audio.mjs';
import {OrganicAudio} from './organic-audio.mjs';
const $=id=>document.getElementById(id);
const pad=$('atlas-pad'),ctx=pad.getContext('2d',{alpha:true});
const family=document.body.dataset.family==='culture'?'culture':'music';
const labs=COLLECTIONS[family];const params=new URLSearchParams(location.search);
const field=new FieldSynth(),hits=new OrganicAudio();
const sword=new SwordLatch(),river=new RiverGrammar(),hex=new Hexagram(),
  stars=new StarRoute(),trace=new TraceRoute(),dial=new FingerDial();
const logs=[],archive=[],pointers=new Map(),trails=new Map(),swordStroke=[];
let active=labs.find(x=>x.id===params.get('lab'))?.id||labs[0].id;
let audioReady=false,muted=true,explicitMute=false,headsetMode='DESKTOP';
let lastFrame=0,frameGaps=[],frameCount=0,lastSend=0,lastImpact=-1e9;
let gate=false,handDetected=0,swordActive=false,filmBeat=0,filmTrace=0;
let selectedPair=null,rayTarget='',sequence='',sequenceTarget='3142',lastPhrase='',progress=0;
let lastXR={left:null,right:null},orbit=null,traceBank='metal',lastMotion={x:.5,y:.5,speed:.2};
let flashUntil=0,demoTimer=null,needsStatus=true;

function log(t){
 logs.unshift(new Date().toLocaleTimeString()+'  '+t);
 logs.length=Math.min(logs.length,16);
 $('atlas-event-log').textContent=logs.join('\n');
}
function emit(kind,id=0,value=0,x=.5,y=.5,description=''){
 const event={family,lab:active,kind,id:Number(id)||0,value:clamp(value),x:clamp(x),y:clamp(y),t_ms:Math.round(performance.now()),source:headsetMode==='DESKTOP'?'SIMULATED':'WEBXR'};
 if(archive.length<2800)archive.push(event);
 if(description)log(description);
 window.__pmSendAtlas?.(event);
 needsStatus=true;
}
const getActive=()=>labs.find(x=>x.id===active);
function currentAudioBank(){
 return family==='culture'?'metal':active==='dial'?'electro':active==='trace'?traceBank:'orchestra';
}
function chooseBank(bank){
 if(hits.mode!==bank)hits.setMode(bank);
}
async function soundStart(){
 // Invoke BOTH context resume/start paths synchronously from a real button or XR
 // activation, before any awaits that could consume the browser user gesture.
 const a=field.ready?field.resume():field.start();
 const b=hits.ready?hits.resume():hits.start();
 await Promise.all([a,b]);
 audioReady=true;muted=false;explicitMute=false;
 chooseBank(currentAudioBank());
 $('atlas-enable').textContent='AUDIO ACTIVE';
 log('WEB AUDIO RUNNING / independent of computer or OSC');
 updateStatus();
}
function stopAudio(){
 explicitMute=true;muted=true;gate=false;
 field.panic();hits.panic();
 $('atlas-enable').textContent='RESUME AUDIO';
 emit('MUTE',0,0,.5,.5,'LOCAL AUDIO MUTED');
 updateStatus();
}
$('atlas-enable').addEventListener('click',()=>void soundStart().catch(e=>log('AUDIO ERROR '+String(e.message||e))));
$('atlas-mute').addEventListener('click',stopAudio);
window.__pmBeforeEnterXR=()=>{
 if(explicitMute){log('XR: audio intentionally muted');return;}
 void soundStart().catch(e=>log('XR AUDIO ERROR '+String(e.message||e)));
};
window.__pmOnXRStart=mode=>{
 log('XR '+mode+' / Web Audio local / not OSC');
 if(field.ready&&!muted)field.soundCheck();
};
window.__pmOnXREnd=()=>{
 handDetected=0;gate=false;swordActive=false;
 log('EXIT XR; headset input released');
};
window.__pmXRAudioState=()=>{
 window.__pmXRAudioStatus=!audioReady?'LOCKED':muted?'MUTED':
  field.ctx?.state==='running'&&hits.ctx?.state==='running'?'RUNNING':'SUSPENDED';
};
function updateStatus(){
 window.__pmXRAudioState?.();
 const fps=frameGaps.length?Math.round(1000/(frameGaps.reduce((a,b)=>a+b,0)/frameGaps.length)):0;
 $('atlas-status').textContent=[
   'COLLECTION '+family.toUpperCase()+' / '+active.toUpperCase(),
   'INPUT '+headsetMode+' / '+handDetected+' tracked hands',
   'AUDIO '+window.__pmXRAudioStatus+' / '+(muted?'MUTED':'LOCAL WEB AUDIO'),
   'OSC '+(typeof window.__pmSendAtlas==='function'?'OPTIONAL BRIDGE':'OFFLINE')+' / never needed for sound',
   'EVENTS '+archive.length+' / UI RAF '+fps+' FPS estimate (NOT compositor FPS)',
   'XR audio latency and real gesture accuracy: NOT MEASURED'
 ].join('\n');
 needsStatus=false;
}
function impact(index=0,velocity=.5,onceBank=null){
 flashUntil=performance.now()+220;
 if(!audioReady||muted)return false;
 const bank=onceBank||currentAudioBank();
 chooseBank(bank);
 const pool=bank==='metal'?['pot','lid','cutlery','bowl','glass','pan']:
  bank==='electro'?['kick','hat','snare','acid','fm','rise']:
  ['strings','harp','brass','choir','timpani','tutti'];
 const idx=Math.min(5,Math.max(0,Math.floor(index)));
 return hits.trigger({kind:'ENTER',mode:bank,id:pool[idx],velocity:clamp(velocity,.20,1)});
}
function soundMotion(x,y,speed=.4,gateValue=0){
 lastMotion={x:clamp(x),y:clamp(y),speed:clamp(speed)};
 if(!audioReady||muted)return;
 field.update({
   gate:gateValue,presence:gateValue?.15:0,
   energy:clamp(speed),cutoff:clamp(x),resonance:.20+.55*clamp(speed),
   wet:clamp(y),spread:clamp(x),drive:clamp(y),timbre:0
 },performance.now());
 hits.motion(x,y,speed);
}
function releaseSound(){soundMotion(lastMotion.x,lastMotion.y,0,0);}
function cleanMode(){
 gate=false;releaseSound();
 tracesClear();sword.reset();river.reset();hex.reset();stars.reset();
 trace.reset();dial.reset();sequence='';progress=0;selectedPair=null;
 swordActive=false;filmBeat=0;filmTrace=0;swordStroke.length=0;orbit=null;
 clearInterval(demoTimer);demoTimer=null;
}
function tracesClear(){pointers.clear();trails.clear();}
function modeSelect(id){
 if(!labs.find(x=>x.id===id))return;
 cleanMode();active=id;
 const url=new URL(location.href);url.searchParams.set('lab',id);
 try{history.replaceState(null,'',url)}catch{}
 renderControls();
 for(const button of $('atlas-tabs').querySelectorAll('button'))
  button.setAttribute('aria-pressed',String(button.dataset.lab===active));
 if(audioReady&&!muted)chooseBank(currentAudioBank());
 log('STUDY '+active.toUpperCase()+' / '+family.toUpperCase());
 updateStatus();
}
function reset(){
 cleanMode();renderControls();
 emit('RESET',0,0,.5,.5,'RESET '+active.toUpperCase());
}
$('atlas-reset').addEventListener('click',reset);
function makeButton(label,onClick,parent=$('atlas-extra'),classes=''){
 const b=document.createElement('button');b.textContent=label;b.type='button';
 if(classes)b.className=classes;
 b.addEventListener('click',onClick);parent.append(b);return b;
}
function renderControls(){
 const info=getActive();
 $('atlas-title').textContent=info.name;
 $('atlas-brief').textContent=info.purpose;
 const instructions={
 continuum:'1. 按住画布，或在 Quest 里捏拇指＋食指。\n2. 手左右移动改变滤波；上下移动改变湿声与反馈。\n3. 释放即关掉持续音。先听声音，再研究表演力度。',
 orbit:'1. iPad 上双指分别触碰，向两边拉开形成宽度。\n2. Quest 上双手食指在空间内移动，保持两只手都有追踪。\n3. 双手间距控制开合，横向相位改变立体声声场；桌面单指为模拟。',
 trace:'1. 按住屏幕连续划动，试着画横向八字 ∞。\n2. 快速扫过区域仍会检测线段碰撞，并触发不同声音。\n3. 切换金属/电子/交响素材，保留同一运动乐谱。',
 dial:'1. 触碰拇指到六个不同指节，生成 1–6。\n2. 需要短暂停留（90ms）再抬起，降低误触发。\n3. 设置任意原创短句；重复数字必须有真正松开动作。',
 jian:'1. 剑诀形态：食指、中指并拢伸直，其余手指屈曲。\n2. 起势 → 结诀 → 空中运笔 → 收势；完成后得到原创数字墨迹。\n3. 桌面按住画布可模拟路径；Quest 需姿态稳定后绘制。\n本页是电影动作与交互转译，不是符箓法本。',
 river:'1. 选择「洛书九宫」或「河图数对」研究方式。\n2. 洛书：连接一横、一竖或一条对角线的三个数字，和为 15。\n3. 河图：连接对应数字 1–6 / 2–7 / 3–8 / 4–9 / 5–10。\n4. 触摸节点或在 Quest 内以指尖靠近节点。',
 bagua:'1. 阴爻是断线，阳爻是实线。\n2. 从下往上输入三条得到一卦；六条形成上下两卦的组合。\n3. 共 64 种六爻组合；这里仅做符号构成，不解卦断命。',
 stars:'1. 以北斗七星的常见星图名称设置七个位置。\n2. 按天枢→天璇→天玑→天权→玉衡→开阳→摇光依次连线。\n3. 这只是空间星图导航实验，不是复原步罡踏斗或真实法事。'
 };
 $('atlas-instructions').textContent=instructions[active]||'';
 const extra=$('atlas-extra');extra.replaceChildren();
 if(active==='continuum'){
  const line=document.createElement('p');line.textContent='SUSTAIN GATE · X / FILTER · Y / ECHO';extra.append(line);
  makeButton('TEST CONTINUOUS GATE (hold)',()=>{},extra).addEventListener('pointerdown',e=>{
    e.preventDefault();gate=true;emit('GATE',1,1);
  });
  const b=extra.querySelector('button:last-child');
  for(const ev of ['pointerup','pointercancel','pointerleave','lostpointercapture'])
    b.addEventListener(ev,()=>{gate=false;releaseSound();emit('GATE',0,0);});
 }else if(active==='orbit'){
  const p=document.createElement('p');p.textContent='双手间距 = 空间宽度；方位角 = 横向空间；姿态没有硬性捏合要求。';extra.append(p);
  makeButton('TEST OPEN → CLOSE',()=>{
    demoAnimate((i,n)=>{const x=.22+.56*(.5-.5*Math.cos(i/n*Math.PI*2));soundMotion(x,1-x,.65,1);});
  },extra);
 }else if(active==='trace'){
  const select=document.createElement('select');
  for(const [id,name] of [['metal','器物打击 METAL'],['electro','工业电子 ELECTRO'],['orchestra','合成管弦 ORCHESTRA']]){
    const o=document.createElement('option');o.value=id;o.textContent=name;select.append(o);
  }
  select.value=traceBank;select.addEventListener('change',()=>{
    traceBank=select.value;if(audioReady)chooseBank(traceBank);
    emit('SELECT',0,0,.5,.5,'TONE BANK '+traceBank);
  });extra.append(select);
 }else if(active==='dial'){
  const p=document.createElement('p');p.textContent='拇指接触指节序号，组成一个可以自由改写的短音序。';extra.append(p);
  const input=document.createElement('input');input.value=sequenceTarget;
  input.maxLength=12;input.setAttribute('aria-label','Target phrase digits 1-6');
  input.addEventListener('input',()=>{sequenceTarget=input.value.replace(/[^1-6]/g,'').slice(0,12)||'3142';});
  extra.append(input);
  const grid=document.createElement('div');grid.className='pair-buttons';extra.append(grid);
  for(let i=1;i<=6;i++)makeButton(String(i),()=>enterDigit(i,true),grid);
 }else if(active==='jian'){
  const p=document.createElement('p');p.textContent='电影动作节拍：起势 / 结诀 / 运笔 / 落定。这里生成的是原创图形，不是传统符文。';extra.append(p);
  makeButton('起势 → 结诀 → 运笔 → 收势',()=>cinemaBeat(),extra);
 }else if(active==='river'){
  const row=document.createElement('div');row.className='atlas-two';extra.append(row);
  makeButton('洛书九宫',()=>{river.setMode('luoshu');renderControls();},row);
  makeButton('河图数对',()=>{river.setMode('hetu');renderControls();},row);
  const grid=document.createElement('div');grid.className='pair-buttons';extra.append(grid);
  const vals=river.mode==='hetu'?[1,2,3,4,5,6,7,8,9,10]:LUOSHU.flat();
  for(const n of vals)makeButton(String(n),()=>riverPick(n),grid);
 }else if(active==='bagua'){
  const row=document.createElement('div');row.className='atlas-two';extra.append(row);
  makeButton('阴 · 断线',()=>inputLine(0),row);
  makeButton('阳 · 实线',()=>inputLine(1),row);
  makeButton('清空六爻',()=>{hex.reset();emit('RESET');},extra);
 }else if(active==='stars'){
  const grid=document.createElement('div');grid.className='pair-buttons';extra.append(grid);
  STARS.forEach((s,i)=>makeButton(String(i+1)+' '+s.name,()=>starPick(i),grid));
 }
 redrawProgress();
}
function redrawProgress(){
 const box=$('atlas-progress');
 let text='';
 if(active==='continuum')text='GATE '+(gate?'OPEN':'CLOSED')+' / FILTER '+lastMotion.x.toFixed(2)+' / ECHO '+lastMotion.y.toFixed(2);
 if(active==='orbit')text=orbit?'SPREAD '+orbit.spread.toFixed(2)+' / ANGLE '+(orbit.phase*180/Math.PI).toFixed(0)+'°':'双手各提供一个有效指尖位置后开始';
 if(active==='trace')text='TRACE '+traceBank.toUpperCase()+' / 6 ZONES / 八字路径与区域穿越';
 if(active==='dial')text='SEQUENCE '+(sequence||'—')+'\nTARGET '+sequenceTarget+'\nMATCH '+progress+'/'+sequenceTarget.length;
 if(active==='jian')text='POSE '+(swordActive?'SWORD-FINGER RECOGNIZED':'NOT CONFIRMED')+
  '\nMOVEMENT '+['起势','结诀','运笔','落定'][Math.min(3,filmBeat)]+'\nSTROKE POINTS '+swordStroke.length;
 if(active==='river')text=(river.mode==='hetu'?'河图 · 五方数对':'洛书 · 九宫十五')+
  '\nSELECT '+(river.selected.join(' → ')||'—')+'\nCOMPLETED '+river.completions;
 if(active==='bagua'){
  const h=hex.describe();
  text='BOTTOM → TOP / '+(h.bits||'—')+'\nCOUNT '+h.count+'/6'+
   (h.lower?'\n下卦：'+h.lower.symbol+' '+h.lower.name+'（'+h.lower.image+'）':'')+
   (h.upper?'\n上卦：'+h.upper.symbol+' '+h.upper.name+'（'+h.upper.image+'）\n64组合之二进制序号：'+h.ordinal:'');
 }
 if(active==='stars')text='NEXT '+(STARS[stars.index]?.name||'天枢')+
  '\nPROGRESS '+stars.index+'/7\nCOMPLETED '+stars.completed;
 box.textContent=text;
}
function enterDigit(d,simulated=false){
 d=Number(d);if(!Number.isInteger(d)||d<1||d>6)return;
 sequence=(sequence+String(d)).slice(-24);
 progress=0;
 for(let i=Math.min(sequence.length,sequenceTarget.length);i>0;i--){
  if(sequence.endsWith(sequenceTarget.slice(0,i))){progress=i;break;}
 }
 emit('CONTACT',d,d/6,.5,.5,(simulated?'SIMULATED':'XR')+' FINGER '+d);
 impact(d-1,.72,'electro');
 if(sequence.endsWith(sequenceTarget)){
  emit('COMPLETE',d,1,.5,.5,'PHRASE COMPLETE / '+sequenceTarget);
  impact(5,.75,'orchestra');
 }
 redrawProgress();
}
function cinemaBeat(){
 filmBeat=(filmBeat+1)%4;
 if(filmBeat===3&&swordStroke.length>=3)finishSword();
 emit('STEP',filmBeat,.5,.5,.5,'FILM ACTION / '+['起势','结诀','运笔','落定'][filmBeat]);
 redrawProgress();
}
function finishSword(){
 if(swordStroke.length<3)return;
 emit('COMPLETE',1,1,.5,.5,'ORIGINAL TRACE SEALED / NOT AN AUTHENTIC TALISMAN');
 impact(4,.45,'metal');
 filmTrace=performance.now()+1800;
}
function riverPick(n){
 const out=river.add(n);
 for(const evt of out){
  if(evt.kind==='LINE'||evt.kind==='PAIR'){
   emit('COMPLETE',n,1,.5,.5,(evt.kind==='LINE'?'LUOSHU SUM 15':'HETU '+evt.element+' / '+evt.direction));
   impact(n%6,.5,'metal');
  }else emit('SELECT',n,.4,.5,.5);
 }
 redrawProgress();
}
function inputLine(bit){
 const out=hex.add(bit);
 emit('SELECT',out.count,bit,.5,.5,bit?'YANG / 阳':'YIN / 阴');
 if(out.lower&&out.count===3){emit('STEP',3,.5,.5,.5,'TRIGRAM '+out.lower.name+' '+out.lower.symbol);impact(2,.4,'metal');}
 if(out.completed){emit('COMPLETE',out.ordinal,1,.5,.5,'HEXAGRAM '+out.lower.name+' / '+out.upper.name);impact(5,.7,'orchestra');}
 redrawProgress();
}
function starPick(index){
 for(const ev of stars.add(index)){
  if(ev.kind==='COMPLETE'){emit('COMPLETE',7,1,.5,.5,'SEVEN STAR ROUTE COMPLETE');impact(5,.6,'orchestra');}
  else if(ev.kind==='RESET')emit('RESET',index+1,0,.5,.5,'STAR ROUTE RESTART');
  else{emit('STEP',index+1,ev.progress/7,.5,.5,STARS[index].name);impact(index%6,.3,'metal');}
 }
 redrawProgress();
}
function demoAnimate(fn,steps=65,interval=28){
 clearInterval(demoTimer);let i=0;
 demoTimer=setInterval(()=>{
  fn(i,steps);if(++i>=steps){clearInterval(demoTimer);demoTimer=null;gate=false;releaseSound();}
 },interval);
}
$('atlas-demo').addEventListener('click',()=>{
 emit('SELECT',0,0,.5,.5,'SIMULATED INPUT; NOT A HEADSET TEST');
 if(active==='dial'){for(const d of sequenceTarget)enterDigit(Number(d),true);return;}
 if(active==='bagua'){for(const b of [1,0,1,0,1,1])inputLine(b);return;}
 if(active==='river'){
  for(const n of river.mode==='hetu'?[1,6,2,7]:[4,9,2,3,5,7])riverPick(n);return;
 }
 if(active==='stars'){STARS.forEach((s,i)=>starPick(i));return;}
 if(active==='jian'){filmBeat=2;demoAnimate((i,n)=>{
   const x=.5+.26*Math.sin(i/n*Math.PI*2),y=.5+.22*Math.sin(i/n*Math.PI*4);
   swordStroke.push({x,y});if(swordStroke.length>85)swordStroke.shift();
   if(i===n-1)finishSword();
 });return;}
 if(active==='orbit'){demoAnimate((i,n)=>{
   const t=i/n*2*Math.PI;
   orbit={spread:.5+.43*Math.sin(t),phase:t,center:[0,0,0]};
   soundMotion(orbit.spread,(Math.sin(t)+1)/2,.6,1);redrawProgress();
 });return;}
 if(active==='continuum'){gate=true;demoAnimate((i,n)=>{
   const t=i/n*2*Math.PI;
   soundMotion(.5+.43*Math.sin(t),.5+.38*Math.cos(t),.62,1);
   redrawProgress();
 });return;}
 if(active==='trace'){
  trace.end('demo');demoAnimate((i,n)=>{
   const t=i/n*Math.PI*2;
   const x=.5+.34*Math.sin(t),y=.5+.28*Math.sin(2*t);
   for(const ev of trace.move('demo',x,y,performance.now()))strike(ev);
  });return;
 }
});
function strike(ev){
 const idx=TRACE_NODES.findIndex(x=>x.id===ev.id);
 emit('STRIKE',idx+1,ev.velocity,.5,.5,ev.id+' / '+traceBank.toUpperCase());
 impact(idx,ev.velocity);
}
function normalized(e){
 const r=pad.getBoundingClientRect();
 return {x:clamp((e.clientX-r.left)/r.width),y:clamp((e.clientY-r.top)/r.height)};
}
function nearestNode(nodes,p,r=.12){
 let winner=-1,best=Infinity;
 nodes.forEach((n,i)=>{
  const d=Math.hypot(n.x-p.x,n.y-p.y);
  if(d<best&&d<r){winner=i;best=d;}
 });
 return winner;
}
function riverNodeAt(p){
 const nodes=river.mode==='luoshu'?
  LUOSHU.flat().map((n,i)=>({n,x:.27+(i%3)*.23,y:.26+Math.floor(i/3)*.25})):
  Array.from({length:10},(_,i)=>({n:i+1,x:.17+(i%5)*.165,y:.40+Math.floor(i/5)*.23}));
 const i=nearestNode(nodes,p,.092);
 return i<0?null:nodes[i].n;
}
function pointerAction(p,key,now){
 if(active==='continuum'){gate=true;soundMotion(p.x,p.y,.5,1);}
 else if(active==='orbit'){
  const arr=[...pointers.values()];
  if(arr.length>=2){
    const a=arr[0],b=arr[1],dx=b.x-a.x,dy=b.y-a.y;
    orbit={spread:clamp((Math.hypot(dx,dy)-.06)/.75),phase:Math.atan2(dy,dx),center:[(a.x+b.x)/2,(a.y+b.y)/2,0]};
    soundMotion(orbit.spread,clamp((orbit.phase+Math.PI)/(Math.PI*2)),.6,1);
  }else{orbit={spread:p.x,phase:(p.y-.5)*Math.PI*2};soundMotion(p.x,p.y,.4,1);}
 }
 else if(active==='trace'){for(const ev of trace.move(key,p.x,p.y,now))strike(ev);}
 else if(active==='dial'){
  const d=Math.min(6,1+Math.floor(p.x*6));
  if(!pointers.get(key)?.dialled){pointers.get(key).dialled=true;enterDigit(d,true);}
 }
 else if(active==='jian'){
  filmBeat=2;
  swordStroke.push({x:p.x,y:p.y,t:now});if(swordStroke.length>90)swordStroke.shift();
  if(swordStroke.length%12===0)emit('PATH',0,.3,p.x,p.y);
 }
 else if(active==='river'){
  if(!pointers.get(key)?.chosen){
   const n=riverNodeAt(p);if(n!==null){riverPick(n);pointers.get(key).chosen=true;}
  }
 }
 else if(active==='bagua'){
  if(!pointers.get(key)?.chosen){inputLine(p.x>=.5?1:0);pointers.get(key).chosen=true;}
 }
 else if(active==='stars'){
  if(!pointers.get(key)?.chosen){
   const n=nearestNode(STARS,p,.11);
   if(n>=0){starPick(n);pointers.get(key).chosen=true;}
  }
 }
 redrawProgress();
}
pad.addEventListener('pointerdown',e=>{
 if(headsetMode!=='DESKTOP')return;
 e.preventDefault();pad.setPointerCapture?.(e.pointerId);
 const key='mouse-'+e.pointerId,p=normalized(e);
 pointers.set(key,{...p,chosen:false,dialled:false});
 const tr=[];trails.set(key,tr);
 pointerAction(p,key,performance.now());
});
pad.addEventListener('pointermove',e=>{
 const key='mouse-'+e.pointerId,cur=pointers.get(key);
 if(!cur||headsetMode!=='DESKTOP')return;
 const p=normalized(e),n=performance.now();
 const velocity=clamp(Math.hypot(cur.x-p.x,cur.y-p.y)*23,.1,1);
 cur.x=p.x;cur.y=p.y;
 const tr=trails.get(key)||[];tr.push({...p});if(tr.length>34)tr.shift();trails.set(key,tr);
 if(active==='continuum')soundMotion(p.x,p.y,velocity,1);
 else if(active==='orbit')pointerAction(p,key,n);
 else if(active==='trace'||active==='jian')pointerAction(p,key,n);
 redrawProgress();
});
for(const evt of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(evt,e=>{
 const key='mouse-'+e.pointerId;if(!pointers.has(key))return;
 if(active==='jian')finishSword();
 if(active==='continuum'||active==='orbit'){gate=false;releaseSound();}
 trace.end(key);pointers.delete(key);trails.delete(key);redrawProgress();
});
function xrPointer(positions,side,now){
 const tip=positions?.[9],thumb=positions?.[4];
 const key='xr-'+side;
 if(!tip||!tip.every(Number.isFinite)){trace.end(key);trails.delete(key);return;}
 const x=clamp(.5+tip[0]/1.2),y=clamp((.28-tip[1])/.72);
 const tr=trails.get(key)||[];const old=tr.at(-1);
 const velocity=old?clamp(Math.hypot(x-old.x,y-old.y)*19,.10,1):.3;
 tr.push({x,y});if(tr.length>32)tr.shift();trails.set(key,tr);
 if(family==='music'){
  if(active==='continuum'){
   const pinch=thumb&&Math.hypot(tip[0]-thumb[0],tip[1]-thumb[1],tip[2]-thumb[2])<.045;
   const oldGate=gate;gate=Boolean(pinch);
   soundMotion(x,y,velocity,gate?1:0);
   if(oldGate!==gate)emit('GATE',gate?1:0,gate?1:0,x,y,gate?'XR PINCH ON':'XR PINCH OFF');
  }else if(active==='trace'){for(const ev of trace.move(key,x,y,now))strike(ev);}
  else if(active==='dial'&&side==='right'){
   const output=dial.update(positions,now);
   for(const evt of output.events)if(evt.kind==='DIGIT')enterDigit(evt.digit,false);
  }
 }
 if(family==='culture'){
  if(active==='jian'&&side==='right'){
    const pose=sword.update(positions,now),was=swordActive;
    swordActive=pose.active;
    if(was!==swordActive){
      emit(swordActive?'POSE_ON':'POSE_OFF',swordActive?1:0,swordActive?1:0,x,y,
        swordActive?'XR SWORD FORM HELD':'XR SWORD FORM RELEASED');
      if(!swordActive)finishSword();
    }
    if(swordActive){
      filmBeat=2;swordStroke.push({x,y,t:now});if(swordStroke.length>90)swordStroke.shift();
    }
  }else if(active==='river'||active==='stars'){
    // Node dwell instead of per-frame re-trigger; must exit 9cm radius before new pick.
    const p={x,y},idx=active==='river'?riverNodeAt(p):nearestNode(STARS,p,.085);
    const node=idx===null||idx===-1?null:idx;
    const trackingKey='hover-'+side,last=pointers.get(trackingKey);
    if(node===null){pointers.delete(trackingKey);}
    else if(!last||last.value!==node)pointers.set(trackingKey,{value:node,since:now});
    else if(!last.triggered&&now-last.since>=130){
      last.triggered=true;
      if(active==='river')riverPick(node);else starPick(node);
    }
  }else if(active==='bagua'&&side==='right'){
    // Thumb-index pinch picks yin (left) / yang (right) and requires release.
    const pinch=thumb&&Math.hypot(tip[0]-thumb[0],tip[1]-thumb[1],tip[2]-thumb[2])<.029;
    const state=pointers.get('bagua-contact')||{held:false};
    if(pinch&&!state.held){inputLine(x>=.5?1:0);state.held=true;}
    if(!pinch)state.held=false;
    pointers.set('bagua-contact',state);
  }
 }
 redrawProgress();
}
window.__pmInstrumentFeed=({hands,now,mode})=>{
 headsetMode=mode;
 if(mode==='DESKTOP')return;
 handDetected=(hands.left?1:0)+(hands.right?1:0);
 if(family==='music'&&active==='orbit'){
  orbit=bimanual(hands.left,hands.right);
  if(orbit){soundMotion(orbit.spread,(orbit.phase+Math.PI)/(2*Math.PI),.6,1);}
  else{releaseSound();}
 }
 if(hands.left?.positions)xrPointer(hands.left.positions,'left',now);
 else{trace.end('xr-left');trails.delete('xr-left');}
 if(hands.right?.positions)xrPointer(hands.right.positions,'right',now);
 else{trace.end('xr-right');trails.delete('xr-right');gate=false;releaseSound();}
};
$('atlas-export').addEventListener('click',()=>{
 const data={name:'Gestural Atlas / '+family,lab:active,
  recordedAt:new Date().toISOString(),events:archive,mode:headsetMode,
  notes:'Desktop gestures are simulated; Quest headset tracking precision and audio latency have not been independently verified; symbol exercises are contemporary reconstructions.'};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const link=document.createElement('a');link.href=URL.createObjectURL(blob);
 link.download='gestural-atlas-'+family+'-'+active+'.json';link.click();
 setTimeout(()=>URL.revokeObjectURL(link.href),1000);
});
$('atlas-stress').addEventListener('click',()=>{
 const a=new TraceRoute();let n=0;
 for(let i=0;i<10000;i++){
  const t=i*.069;
  n+=a.move('stress',.5+.43*Math.sin(t),.5+.37*Math.sin(2*t),i*11).length;
 }
 log('10K SYNTHETIC TRAJECTORY FRAMES / '+n+' hits / NOT QUEST FPS');
});
function drawCircle(x,y,r,color,alpha=.5){
 ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=1.4;
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
}
function drawNode(n,index,w,h,r,color,label){
 const x=n.x*w,y=n.y*h;
 drawCircle(x,y,r,color,.58);
 ctx.fillStyle=color;ctx.textAlign='center';ctx.font='13px ui-monospace,monospace';
 ctx.fillText(label??String(index+1),x,y+5);
}
function drawCanvas(now){
 const bounds=pad.getBoundingClientRect(),dpr=Math.min(1.6,devicePixelRatio||1);
 if(!bounds.width||!bounds.height){requestAnimationFrame(drawCanvas);return;}
 const w=Math.floor(bounds.width*dpr),h=Math.floor(bounds.height*dpr);
 if(pad.width!==w||pad.height!==h){pad.width=w;pad.height=h;}
 ctx.setTransform(dpr,0,0,dpr,0,0);
 const W=bounds.width,H=bounds.height;
 ctx.clearRect(0,0,W,H);
 ctx.fillStyle=family==='culture'?'#100d0a':'#050b0a';ctx.fillRect(0,0,W,H);
 ctx.strokeStyle=family==='culture'?'rgba(205,171,113,.095)':'rgba(137,224,179,.08)';
 ctx.lineWidth=.6;
 for(let x=0;x<W;x+=47){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
 for(let y=0;y<H;y+=47){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
 const c=family==='culture'?'#dbc49f':'#b8e5c8';
 ctx.fillStyle=c;ctx.font='11px ui-monospace,monospace';ctx.textAlign='left';
 ctx.fillText('GESTURAL ATLAS / '+family.toUpperCase()+' / '+active.toUpperCase(),20,34);
 if(active==='continuum'||active==='orbit'){
   for(let i=0;i<6;i++)drawCircle(W/2,H/2,45+i*34,c,.11+.02*i);
   const x=(active==='continuum'?lastMotion.x:orbit?.spread??.5)*W;
   const y=(active==='continuum'?lastMotion.y:.5)*H;
   drawCircle(x,y,24,gate||orbit?.spread?.toFixed(1)?c:'#617b67',.9);
   ctx.fillStyle=c;ctx.textAlign='center';ctx.font='13px monospace';
   ctx.fillText(active==='continuum'?'PINCH → GATE / MOVE → TIMBRE':'TWO HANDS → SPREAD / ORBIT → PHASE',W/2,H*.81);
 }
 if(active==='trace'){
   TRACE_NODES.forEach((n,i)=>drawNode(n,i,W,H,Math.min(W,H)*n.r*.9,c,n.id));
   ctx.setLineDash([3,8]);ctx.strokeStyle='#536e61';ctx.beginPath();
   for(let k=0;k<80;k++){
    const t=k/79*Math.PI*2,x=(.5+.35*Math.sin(t))*W,y=(.5+.27*Math.sin(2*t))*H;
    if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }ctx.stroke();ctx.setLineDash([]);
 }
 if(active==='dial'){
  for(let i=0;i<6;i++)drawNode({x:(i+.5)/6,y:.52},i,W,H,Math.min(W/13,42),c,String(i+1));
 }
 if(active==='jian'){
  ctx.textAlign='center';ctx.font='14px serif';ctx.fillStyle=c;
  ctx.fillText('起势   →   结诀   →   运笔   →   收势',W/2,H*.13);
  ctx.strokeStyle='#bd634d';ctx.lineWidth=3;
  ctx.beginPath();
  swordStroke.forEach((p,i)=>i?ctx.lineTo(p.x*W,p.y*H):ctx.moveTo(p.x*W,p.y*H));
  ctx.stroke();
  if(now<filmTrace){
   drawCircle(W/2,H/2,Math.min(W,H)*.22,'#d3b884',.8);
   ctx.font='15px serif';ctx.fillText('原创数字符形 / CONTEMPORARY TRACE',W/2,H*.82);
  }
 }
 if(active==='river'){
  const nodes=river.mode==='hetu'?
   Array.from({length:10},(_,i)=>({n:i+1,x:.17+(i%5)*.165,y:.40+Math.floor(i/5)*.23})):
   LUOSHU.flat().map((n,i)=>({n,x:.27+(i%3)*.23,y:.26+Math.floor(i/3)*.25}));
  if(river.mode==='luoshu'){
   ctx.strokeStyle='#8b6e4b';ctx.lineWidth=.9;
   for(let i=0;i<4;i++){
    const x=(.155+i*.23)*W,y=(.135+i*.25)*H;
    ctx.beginPath();ctx.moveTo(x,.135*H);ctx.lineTo(x,.885*H);ctx.stroke();
    ctx.beginPath();ctx.moveTo(.155*W,y);ctx.lineTo(.845*W,y);ctx.stroke();
   }
  }
  nodes.forEach((n,i)=>drawNode(n,i,W,H,Math.min(W,H)*.068,c,String(n.n)));
 }
 if(active==='bagua'){
  const bits=hex.describe().bits;
  for(let i=0;i<6;i++){
   const y=H*.82-i*H*.105,x=W/2,width=Math.min(W*.40,280);
   if(i>=bits.length){ctx.strokeStyle='#564d40';ctx.setLineDash([4,7]);}
   else{ctx.strokeStyle='#e3c89b';ctx.setLineDash([]);}
   ctx.lineWidth=9;ctx.lineCap='butt';
   ctx.beginPath();
   if(bits[i]==='0'){
    ctx.moveTo(x-width/2,y);ctx.lineTo(x-width*.08,y);
    ctx.moveTo(x+width*.08,y);ctx.lineTo(x+width/2,y);
   }else{ctx.moveTo(x-width/2,y);ctx.lineTo(x+width/2,y);}
   ctx.stroke();ctx.setLineDash([]);
  }
  ctx.fillStyle=c;ctx.font='12px monospace';ctx.textAlign='center';
  ctx.fillText('YIN ← SWIPE / TAP → YANG   ·   BOTTOM TO TOP',W/2,H*.13);
 }
 if(active==='stars'){
  ctx.strokeStyle='#9eaece';ctx.lineWidth=1.1;
  ctx.beginPath();STARS.forEach((s,i)=>{
    if(i===0)ctx.moveTo(s.x*W,s.y*H);else ctx.lineTo(s.x*W,s.y*H);
  });ctx.stroke();
  STARS.forEach((s,i)=>drawNode(s,i,W,H,Math.min(W,H)*.035,
    i<stars.index?'#ecd09a':c,String(i+1)));
 }
 for(const tr of trails.values()){
  ctx.beginPath();ctx.strokeStyle='#f4ebd2';ctx.lineWidth=2;
  tr.forEach((p,i)=>i?ctx.lineTo(p.x*W,p.y*H):ctx.moveTo(p.x*W,p.y*H));ctx.stroke();
 }
 if(now<flashUntil){
  drawCircle(W*.5,H*.5,Math.min(W,H)*.22,c,.35);
 }
 if(lastFrame>0&&now-lastFrame<600){
  frameGaps.push(now-lastFrame);if(frameGaps.length>90)frameGaps.shift();
 }
 lastFrame=now;frameCount++;
 if(frameCount%13===0||needsStatus)updateStatus();
 requestAnimationFrame(drawCanvas);
}
function drawDigitsGL(line,n,x,y,z,size,color){
 const segs=[
  [0,0,1,0],[1,0,1,.5],[1,.5,1,1],[0,1,1,1],
  [0,.5,0,1],[0,0,0,.5],[0,.5,1,.5]
 ];
 const digits={0:[0,1,2,3,4,5],1:[1,2],2:[0,1,6,4,3],3:[0,1,6,2,3],
  4:[5,6,1,2],5:[0,5,6,2,3],6:[0,5,4,3,2,6],7:[0,1,2],
  8:[0,1,2,3,4,5,6],9:[0,1,2,3,5,6]};
 const chars=String(n).split('');
 chars.forEach((d,idx)=>{
  for(const k of digits[Number(d)]||[]){
    const [a,b,c,e]=segs[k],off=idx*(size*1.35);
    line([x+(a-.5)*size+off,y+(b-.5)*size*1.55,z],
         [x+(c-.5)*size+off,y+(e-.5)*size*1.55,z],color,.8);
  }
 });
}
window.__pmOrganicDraw=({line,spot,now})=>{
 const c=family==='culture'?[.83,.65,.39]:[.45,.88,.68];
 const nodes=active==='trace'?TRACE_NODES:
 active==='river'?(river.mode==='hetu'?
  Array.from({length:10},(_,i)=>({x:.16+(i%5)*.17,y:.40+Math.floor(i/5)*.22,n:i+1})):
  LUOSHU.flat().map((n,i)=>({x:.28+(i%3)*.22,y:.29+Math.floor(i/3)*.22,n}))):
 active==='stars'?STARS:active==='dial'?
 Array.from({length:6},(_,i)=>({x:(i+.5)/6,y:.52,n:i+1})):[];
 for(let i=0;i<nodes.length;i++){
  const item=nodes[i],x=(item.x-.5)*1.15,y=.20-item.y*.72,z=-.60,r=.032;
  for(let j=0;j<16;j++){
   const a=j*Math.PI/8,b=(j+1)*Math.PI/8;
   line([x+r*Math.cos(a),y+r*Math.sin(a),z],
        [x+r*Math.cos(b),y+r*Math.sin(b),z],c,.50);
  }
  drawDigitsGL(line,item.n??i+1,x,y,z,.015,c);
 }
 if(active==='jian'&&swordStroke.length>2){
  for(let i=1;i<swordStroke.length;i++){
   const a=swordStroke[i-1],b=swordStroke[i];
   line([(a.x-.5)*1.15,.20-a.y*.72,-.60],
        [(b.x-.5)*1.15,.20-b.y*.72,-.60],
        swordActive?[.98,.80,.55]:c,.74);
  }
 }
 if(active==='bagua'){
  const bits=hex.describe().bits;
  for(let i=0;i<bits.length;i++){
   const y=-.24+i*.073,x=0,z=-.6;
   const positions=bits[i]==='0'?[[x-.16,x-.027],[x+.027,x+.16]]:[[x-.16,x+.16]];
   positions.forEach(([a,b])=>line([a,y,z],[b,y,z],c,.94));
  }
 }
 window.__pmInstrumentVisual={
  gate:gate||swordActive?1:0,flash:now<flashUntil?.4:0,timbre:0
 };
};
window.addEventListener('pagehide',()=>{field.panic();hits.panic();});
window.addEventListener('blur',()=>{tracesClear();gate=false;releaseSound();});
for(const lab of labs){
 const btn=document.createElement('button');btn.type='button';btn.dataset.lab=lab.id;
 btn.innerHTML='<strong>'+lab.name+'</strong><span style="display:block;font-size:10px;opacity:.8;margin-top:4px">'+lab.gesture+'</span>';
 btn.setAttribute('aria-pressed',String(lab.id===active));
 btn.addEventListener('click',()=>modeSelect(lab.id));
 $('atlas-tabs').append(btn);
}
modeSelect(active);
requestAnimationFrame(drawCanvas);
