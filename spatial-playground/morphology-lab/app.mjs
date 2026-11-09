import {FAMILIES,TOTAL,description,BEAT_BPM,LIGHT_FLASH_POLICY} from './experiments.mjs';
import {MorphologyStage} from './scene.mjs';
const $=id=>document.getElementById(id);
let family='light',index=0,reference=null,metrics=null,stage=null;
let selectedAt=new Date().toISOString();
let statusTimer=null,events=[];
const emit=(type,details={})=>{
 events.push({t_ms:Math.round(performance.now()),type,...details});
 if(events.length>300)events.shift();
};
function captureState(){
 return {family,index,study:description(family,index),
  parameters:{energy:Number($('energy').value)/100,
   depth:Number($('depth').value)/100,complexity:Number($('complexity').value)/100},
  camera:{position:stage.camera.position.toArray(),target:stage.controls.target.toArray()},
  metrics,recordedAt:selectedAt};
}
function updateAudit(){
 if(!reference){
  $('audit').textContent='REFERENCE A: NOT RECORDED\n\n1. Select a visual state.\n2. SAVE REF.\n3. Change the preset while preserving camera.\n4. Review two states, export data.';
  return;
 }
 const a=reference,study=description(family,index);
 $('audit').textContent=[
   'A / '+a.study.familyName+' / '+a.study.title,
   'B / '+study.familyName+' / '+study.title,
   'A METHOD: '+a.study.method+' | B METHOD: '+study.method,
   'A GEOMETRIES: '+(a.metrics?.geometries??'—')+
    ' | B GEOMETRIES: '+(metrics?.geometries??'—'),
   'COMPARE: camera retained; scene topology may change.',
   'Qualitative judgement: silhouette / depth / motion / hand causality'
 ].join('\n');
}
function updateFamily(){
 const root=$('families');root.replaceChildren();
 FAMILIES.forEach((f,i)=>{
  const btn=document.createElement('button');btn.className='family';btn.setAttribute('aria-pressed',String(f.id===family));
  const id=document.createElement('span');id.className='number';id.textContent=String(i+1).padStart(2,'0');
  const title=document.createElement('span');title.textContent=f.label;
  const n=document.createElement('span');n.className='amount';n.textContent='09';
  btn.append(id,title,n);btn.addEventListener('click',()=>select(f.id,0));
  root.append(btn);
 });
}
function updateVariants(){
 const root=$('variants');root.replaceChildren();
 const f=FAMILIES.find(f=>f.id===family);
 f.items.forEach((study,i)=>{
  const btn=document.createElement('button');btn.className='variant';
  btn.setAttribute('aria-pressed',String(index===i));btn.dataset.variant=i;
  const n=document.createElement('small');n.textContent=String(i+1).padStart(2,'0');
  const title=document.createElement('span');title.textContent=study[0];
  const glyph=document.createElement('small');glyph.textContent=index===i?'●':'○';
  btn.append(n,title,glyph);btn.addEventListener('click',()=>select(family,i));
  root.append(btn);
 });
}
function select(id,variant){
 const study=description(id,variant);if(!study)return;
 family=id;index=variant;
 selectedAt=new Date().toISOString();
 stage.setStudy(family,index);
 $('mode-title').textContent=study.title;
 $('method').textContent=study.en.toUpperCase()+' / '+study.method.toUpperCase();
 $('hypothesis').textContent=study.hypothesis;
 $('stage-name').textContent=study.familyName;
 const pos=FAMILIES.findIndex(f=>f.id===family)*9+index+1;
 $('stage-counter').textContent=String(pos).padStart(2,'0')+' / '+TOTAL;
 updateFamily();updateVariants();updateAudit();
 const loc=new URL(location.href);loc.searchParams.set('family',family);
 loc.searchParams.set('study',String(variant+1));
 try{history.replaceState(null,'',loc)}catch{}
 emit('SELECT_STUDY',{family,index});
}
function diagnostic(stats){
 metrics=stats;updateAudit();
 if(!stage)return;
 $('metric').textContent=[
  'OBJECTS   '+stats.meshes+' meshes / '+stats.geometries+' geometries',
  'VERTICES  '+stats.vertices+' (geometric count, not GPU timing)',
  'SEGMENTS  '+stats.segments+' (line object vertex estimate)',
  'LIGHTS    '+stats.lights+' experiment-local',
  'WEBGL DRAW CALLS: see runtime monitor below',
  'XR MEASUREMENTS: NOT RUN'
 ].join('\n');
}
function saveFile(name,content,mime){
 const blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=name;a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1600);
}
function setControl(key,value){
 const out=$(''+key+'-v');out.textContent=Math.round(value*100)+'%';
 stage.setParameters({[key]:value});emit('CONTROL',{key,value});
}
function bind(){
 for(const key of ['energy','depth','complexity']){
  $(key).addEventListener('input',e=>setControl(key,Number(e.target.value)/100));
 }
 $('complexity').addEventListener('change',()=>{stage.setStudy(family,index);emit('REBUILD_DENSITY',{value:stage.complexity});});
 $('compare').addEventListener('click',()=>{
  reference=captureState();
  $('compare').textContent='A / SAVED';
  $('compare').classList.add('active');emit('SAVE_REF',{family,index});
  updateAudit();
 });
 $('restore').addEventListener('click',()=>{
  if(!reference)return;
  const a=reference;
  for(const key of ['energy','depth','complexity']){
   $(key).value=Math.round(a.parameters[key]*100);
   setControl(key,a.parameters[key]);
  }
  select(a.family,a.index);
  stage.camera.position.fromArray(a.camera.position);
  stage.controls.target.fromArray(a.camera.target);stage.controls.update();
  emit('RESTORE_REF',{family:a.family,index:a.index});
 });
 $('toggle').addEventListener('click',()=>{
  stage.paused=!stage.paused;
  $('toggle').textContent=stage.paused?'RESUME':'PAUSE';
  $('toggle').classList.toggle('active',stage.paused);
  emit('PAUSE',{paused:stage.paused});
 });
 $('camera').addEventListener('click',()=>stage.resetCamera());
 $('next').addEventListener('click',()=>select(family,(index+1)%9));
 $('export').addEventListener('click',()=>{
  saveFile('spatial-morphology-'+family+'-'+String(index+1).padStart(2,'0')+'.json',
   JSON.stringify({version:'1.0',source:'ORIGINAL PROCEDURAL / NOT REAL EEG OR PHYSARUM',
    reference,selected:captureState(),scene:stage.snapshot(),
    testing:{liveXR:false,hardwareQA:'NOT_TESTED',
    temporalLightSafety:LIGHT_FLASH_POLICY,benchmarks:'TO BE MEASURED ON TARGET DEVICE'},events},null,2),
   'application/json');
 });
 $('capture').addEventListener('click',()=>{
  // Force an immediate frame so screenshot still works even after PAUSE.
  stage.renderer.render(stage.scene,stage.camera);
  const uri=stage.renderer.domElement.toDataURL('image/png');
  const a=document.createElement('a');a.href=uri;
  a.download='spatial-morphology-'+family+'-'+(index+1)+'.png';a.click();
 });
 window.addEventListener('keydown',e=>{
  if(e.target instanceof HTMLInputElement)return;
  if(e.key==='ArrowRight')select(family,(index+1)%9);
  if(e.key==='ArrowLeft')select(family,(index+8)%9);
  if(/^[1-9]$/.test(e.key))select(family,Number(e.key)-1);
  if(e.key===' '){e.preventDefault();$('toggle').click();}
 });
 window.addEventListener('pagehide',()=>{clearInterval(statusTimer);stage.stop();});
}
function start(){
 try{
  stage=new MorphologyStage($('world'),diagnostic);
  const p=new URLSearchParams(location.search);
  const initFamily=FAMILIES.some(f=>f.id===p.get('family'))?p.get('family'):'light';
  const v=Math.max(0,Math.min(8,(Number(p.get('study'))||1)-1));
  bind();select(initFamily,v);
  $('state').textContent='LIVE 3D / THREE.JS';
  statusTimer=setInterval(()=>{
   if(!stage)return;
   const info=stage.renderer.info;
   $('state').textContent='LIVE 3D  ·  '+info.render.calls+' CALLS  ·  '+info.render.triangles+
     ' TRIANGLES  ·  '+(stage.paused?'PAUSED':'ACTIVE');
  },500);
 }catch(err){
  console.error(err);
  $('state').textContent='ERROR / '+String(err.message||err);
 }
}
start();
