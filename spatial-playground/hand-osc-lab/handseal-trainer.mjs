// Hand Seal Trainer UI. Uses the existing LAB02 25-joint WebXR input and
// low-overhead WebGL renderer. Desktop controls are explicitly simulated.
import {
 BRANCHES,THUNDER_FORMS,PRACTICE_PATHS,PalmContactEngine,BranchLesson,
 SwordPoseCoach,assessSwordPose,branchDistances
} from './handseal-engine.mjs';

const $=id=>document.getElementById(id);
const contact=new PalmContactEngine();
const swordCoach=new SwordPoseCoach({holdMs:500});
let activeMode='branches',selectedBranch='zi',selectedPath='twelve',
 selectedThunder='tianlei',lesson=new BranchLesson(PRACTICE_PATHS[0].steps),
 lessonStarted=false,selectedHand='right',xrMode='DESKTOP',
 latestHands={left:null,right:null},contactState=null,poseState=null,
 lastUi=0,lastFrameTime=0,archive=[],thunderDone={},lastEvent='等待输入';
const branchById=id=>BRANCHES.find(x=>x.id===id);
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
const point=p=>Array.isArray(p)&&p.length>=3&&p.slice(0,3).every(Number.isFinite);
const dist=(a,b)=>point(a)&&point(b)?Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]):Infinity;
const color={normal:[.78,.84,.77],target:[1,.78,.36],candidate:[.37,.91,.89],active:[.97,.86,.55],pass:[.52,.94,.68],warn:[.96,.55,.42]};

function record(type,data={}){
 const event={type,mode:activeMode,source:xrMode==='DESKTOP'?'SIMULATED':'WEBXR',
  t_ms:Math.round(performance.now()),...data};
 archive.push(event);if(archive.length>3500)archive.shift();
 lastEvent=type+(data.name?' / '+data.name:'');
 if(type==='CONTACT'&&data.ordinal){
  window.__pmSendStudy?.({lab:'sigil',action:'DIGIT',code:data.ordinal,
   value:.8,x:data.ordinal/13,y:.5});
 }
}
function setText(id,value){const el=$(id);if(el)el.textContent=value;}
function add(parent,tag,cls,text){
 const el=document.createElement(tag);if(cls)el.className=cls;
 if(text!==undefined)el.textContent=text;parent.append(el);return el;
}
function selectHand(hands){
 if(xrMode==='DESKTOP')return hands.right||hands.left||null;
 if(selectedHand==='auto')return hands.right||hands.left||null;
 return hands[selectedHand]||null;
}
function updateProgress(value){
 $('trainer-progress-fill').style.width=Math.round(clamp(value)*100)+'%';
}
function currentBranch(){
 if(activeMode==='lesson'&&lessonStarted)return branchById(lesson.current);
 if(activeMode==='branches')return branchById(selectedBranch);
 if(activeMode==='thunder'){
  const form=THUNDER_FORMS.find(x=>x.id===selectedThunder);
  const state=contactState?.nearest;
  return state?branchById(state.id):null;
 }
 return null;
}
function updateCurrent(){
 if(activeMode==='branches'){
  const b=branchById(selectedBranch);
  setText('trainer-current',b.name+' / '+b.finger+' '+b.segment+'\n'+b.cue+'\n请用拇指轻触对应关节位置，保持后松开。');
  updateProgress(contactState?.progress||0);
 }else if(activeMode==='lesson'){
  const b=lessonStarted?branchById(lesson.current):null;
  if(lesson.completed){
   setText('trainer-current','十二辰跟练完成。\n完成 '+lesson.index+'/'+lesson.steps.length+' · 错误输入 '+lesson.errors+' 次');
   updateProgress(1);
  }else if(b){
   setText('trainer-current','当前目标 '+b.name+' / '+b.finger+' '+b.segment+'\n'+b.cue+'\n完成接触并松开后进入下一位。');
   updateProgress(lesson.index/lesson.steps.length);
  }else{
   setText('trainer-current','十二辰跟练尚未开始。\n按“开始跟练”后从子位开始。');
   updateProgress(0);
  }
 }else if(activeMode==='sword'){
  const status=poseState;
  setText('trainer-current',status?.tracking?
   '剑指姿势 '+status.passed+'/'+status.total+' 项通过\n保持进度 '+Math.round((status.hold||0)*100)+'% · '+(status.complete?'姿势完成':status.feedback):
   '请进入 XR 并把手掌放在视野内。\n目标：食指、中指伸直并拢；无名指、小指收拢。');
  updateProgress(status?.complete?1:status?.hold||0);
 }else{
  const form=THUNDER_FORMS.find(x=>x.id===selectedThunder);
  const done=thunderDone[selectedThunder]||[];
  setText('trainer-current',form.name+' / 文献对照练习\n'+form.source+'\n人工勾选 '+done.filter(Boolean).length+'/'+form.steps.length+' 项');
  updateProgress(done.filter(Boolean).length/form.steps.length);
 }
}
function renderTabs(){
 for(const b of $('trainer-tabs').querySelectorAll('button')){
  b.setAttribute('aria-pressed',String(b.dataset.mode===activeMode));
 }
}
function renderBranches(parent){
 add(parent,'p','trainer-muted','选择一个地支，查看其关节位置。也可以点击卡片进行桌面模拟；真实接触只在 Quest / WebXR 中判定。');
 const grid=add(parent,'div','trainer-grid');
 for(const b of BRANCHES){
  const btn=add(grid,'button','',b.name);
  btn.dataset.active=String(b.id===selectedBranch);
  const small=add(btn,'small','',b.finger+' '+b.segment);
  btn.title=b.cue;
  btn.addEventListener('click',()=>{
   selectedBranch=b.id;renderWorkspace();updateCurrent();
   if(xrMode==='DESKTOP')simulateBranch(b.id);
  });
 }
 const cal=add(parent,'div','trainer-step');
 add(cal,'div','','个人校准：'+contact.calibration.size+' / 12 位');
 const calRow=add(cal,'div','trainer-grid');
 const rec=add(calRow,'button','','记录当前位');
 rec.style.gridColumn='span 2';
 rec.addEventListener('click',()=>{
  const n=contactState?.nearest;
  if(!n){setText('trainer-status','没有可记录的接触：先把拇指放到目标指节上');return;}
  const size=contact.calibrate(n.id,n.distance);
  setText('trainer-status','已记录 '+(branchById(n.id)?.name||n.id)+' / '+(n.distance*1000).toFixed(0)+'mm（共 '+size+' 位）');
  record('CALIBRATE',{id:n.id,distance:n.distance});
  renderWorkspace();updateCurrent();
 });
 const clr=add(calRow,'button','','清除校准');
 clr.style.gridColumn='span 2';
 clr.addEventListener('click',()=>{contact.clearCalibration();setText('trainer-status','个人校准已清除');renderWorkspace();updateCurrent();});
 add(parent,'p','trainer-muted','校准会为每个辰位记录你自己的可达距离，阈值至少放宽到该距离的 1.15 倍。它只解决“够不到”，不改变关节锚点。');
 add(parent,'p','trainer-muted','关节点上的中文字符会直接跟随 WebXR 手骨架显示。目标位置采用关节锚点近似，真实掌纹线不在 WebXR 25 点数据中。');
}
function renderLesson(parent){
 add(parent,'p','trainer-muted','先练顺序，再练局部路径。每次必须完成“触碰 → 停留 → 松开”；错误位置会提示，不会跳过当前目标。');
 const paths=add(parent,'div','trainer-grid');
 for(const p of PRACTICE_PATHS){
  const btn=add(paths,'button','',p.name);
  btn.style.gridColumn='span 2';btn.style.fontSize='11px';
  btn.dataset.active=String(p.id===selectedPath);
  btn.addEventListener('click',()=>{
   selectedPath=p.id;lesson=new BranchLesson(p.steps);lessonStarted=false;
   renderWorkspace();updateCurrent();
  });
 }
 const path=PRACTICE_PATHS.find(x=>x.id===selectedPath);
 add(parent,'div','trainer-step',path.description+'\n练习顺序：'+path.steps.map(id=>branchById(id).name).join(' → '));
 const p=add(parent,'p','trainer-muted','可以先在桌面用“模拟当前正确触点”走完整个流程，再进入 Quest 测试真实拇指接触。');
}
function renderSword(parent){
 add(parent,'p','trainer-muted','当前采用“基础剑指”的可解释几何模型：食指、中指伸直并拢，无名指、小指弯曲收拢。它是训练用的简化姿势，不代表所有门派剑诀只有这一种形态。');
 const steps=[
  ['食指伸直','index','≤ 43°'],
  ['中指伸直','middle','≤ 43°'],
  ['无名指收拢','ring','≥ 48°'],
  ['小指收拢','pinky','≥ 48°'],
  ['食指与中指并拢','tips','≤ 68 mm']
 ];
 const box=add(parent,'div','trainer-step');
 for(const [label,id,threshold] of steps){
  const row=add(box,'div','trainer-check');
  const dot=add(row,'span','', '○');dot.dataset.check=id;
  add(row,'span','',label+' / '+threshold);
  const value=add(row,'span','', '—');value.dataset.value=id;
 }
 add(parent,'p','trainer-muted','姿势正确后需要稳定保持 500ms。手部丢失或任何条件不满足都会中断计时。检测器会指出第一项未通过的条件。');
}
function renderThunder(parent){
 add(parent,'p','trainer-muted','《道法会元》卷五十四记载多种雷诀。以下保留原文要点，并把“文献文字”和“现代姿势练习”分开。各派诀谱、师承与动作细节可能不同。');
 const grid=add(parent,'div','trainer-grid');
 for(const form of THUNDER_FORMS){
  const btn=add(grid,'button','',form.name);
  btn.style.gridColumn='span 2';btn.style.fontSize='11px';
  btn.dataset.active=String(form.id===selectedThunder);
  btn.addEventListener('click',()=>{selectedThunder=form.id;renderWorkspace();updateCurrent();});
 }
 const form=THUNDER_FORMS.find(x=>x.id===selectedThunder);
 add(parent,'div','trainer-step','原文摘要：'+form.source+'\n\n'+form.note);
 const done=thunderDone[selectedThunder]||(thunderDone[selectedThunder]=[]);
 form.steps.forEach((step,i)=>{
  const row=add(parent,'label','trainer-check');
  const input=add(row,'input');input.type='checkbox';input.checked=Boolean(done[i]);
  input.addEventListener('change',()=>{
   done[i]=input.checked;record('THUNDER_STEP',{form:form.id,step:i,checked:input.checked});
   renderWorkspace();updateCurrent();
  });
  add(row,'span','',String(i+1)+'. '+step);
 });
 const link=add(parent,'a','','查看《道法会元》卷五十四原文');
 link.href='https://www.shidianguji.com/book/LSDZ1171/chapter/1mbjmdtschhrz';link.target='_blank';link.rel='noopener';
 add(parent,'p','trainer-muted','注意：雷诀条目当前提供逐项阅读和人工对照，不会自动判定“正宗”或声称具有法术效力。需要先取得清晰的原始诀图，再逐式建立关节模型。');
}
function renderWorkspace(){
 const parent=$('trainer-workspace');parent.replaceChildren();
 const title={
  branches:'PALM MAP / 十二辰位置图',
  lesson:'GUIDED PRACTICE / 顺序跟练',
  sword:'POSE COACH / 剑指姿势纠错',
  thunder:'SOURCE ATLAS / 雷诀文献图谱'
 }[activeMode];
 setText('trainer-mode-title',title);
 setText('trainer-mode-description',{
  branches:'将十二辰映射到指节位置；拇指触碰哪个位置，系统就显示哪个字。',
  lesson:'根据目标提示完成一条练习路径；每个触点都要停留并松开。',
  sword:'按照五个可解释条件摆出基础剑指；系统逐项指出偏差。',
  thunder:'查看天雷、地雷、云雷、水雷、妖雷、斗雷的文献描述，并逐项对照。'
 }[activeMode]);
 if(activeMode==='branches')renderBranches(parent);
 if(activeMode==='lesson')renderLesson(parent);
 if(activeMode==='sword')renderSword(parent);
 if(activeMode==='thunder')renderThunder(parent);
 $('trainer-start').textContent={
  branches:'开始十二辰跟练',lesson:lessonStarted?'重新开始':'开始当前路径',
  sword:'重置姿势检测',thunder:'清空本式勾选'
 }[activeMode];
 $('trainer-demo').textContent={
  branches:'模拟当前触点',lesson:'模拟当前正确触点',
  sword:'模拟正确剑指',thunder:'标记下一项'
 }[activeMode];
 $('trainer-demo').hidden=false;
 if(activeMode==='thunder')$('trainer-demo').hidden=true;
 renderTabs();updateCurrent();
}
function simulateBranch(id){
 const b=branchById(id);if(!b)return;
 record('CONTACT',{id:b.id,name:b.name,ordinal:b.ordinal,source:'DESKTOP_BUTTON'});
 if(activeMode==='lesson'&&lessonStarted){
  const result=lesson.consume(id,performance.now());
  record(result.kind,{expected:result.expected||id,actual:id,progress:result.progress});
  setText('trainer-status',result.kind==='WRONG'?
   '模拟输入错误：当前应为 '+branchById(result.expected).name+'，你选择了 '+b.name:
   '桌面模拟：'+b.name+' 完成 '+result.progress+'/'+result.total);
 }else{
  setText('trainer-status','DESKTOP SIMULATION / 已模拟 '+b.name+' / '+b.cue+'\n此按钮不代表真实关节接触。');
 }
 updateCurrent();
}
function makeSwordHand(){
 const p=Array.from({length:25},(_,i)=>[i*.001,0,0]);
 const straight=(a,b,c,x)=>{p[a]=[x,0,0];p[b]=[x,1,0];p[c]=[x,2,0];};
 const curled=(a,b,c,x)=>{p[a]=[x,0,0];p[b]=[x,1,0];p[c]=[x+1,1,0];};
 straight(6,7,8,0);straight(11,12,13,.02);
 curled(16,17,18,.06);curled(21,22,23,.08);
 p[9]=[0,2,0];p[14]=[.02,2,0];
 return p;
}
function simulateSword(){
 const p=makeSwordHand(),now=performance.now();
 poseState=swordCoach.update(p,now);
 poseState=swordCoach.update(p,now+520);
 record('POSE_COMPLETE',{source:'DESKTOP_SYNTHETIC',score:poseState.score});
 setText('trainer-status','DESKTOP SYNTHETIC POSE / 五项规则全部通过。\n这只是逻辑演示，不是摄像头或 Quest 的姿势识别结果。');
 updateCurrent();renderSwordStatus();
}
function renderSwordStatus(){
 const box=$('trainer-workspace');
 const dots=box.querySelectorAll('[data-check]');
 if(!poseState?.checks)return;
 for(const el of dots){
  const c=poseState.checks.find(x=>x.id===el.dataset.check);
  el.textContent=c?.ok?'●':'○';el.style.color=c?.ok?'#91e2a9':'#e7a178';
  el.title=c?c.label+' / '+(c.value===null?'—':c.value.toFixed(0)+c.unit):'';
 }
 for(const el of box.querySelectorAll('[data-value]')){
  const c=poseState.checks.find(x=>x.id===el.dataset.value);
  el.textContent=c&&Number.isFinite(c.value)?Math.round(c.value)+c.unit:'—';
  el.style.color=c?.ok?'#91e2a9':'#d3a58a';
 }
}
function handleContact(id,source,now){
 const b=branchById(id);if(!b)return;
 selectedBranch=id;
 record('CONTACT',{id,name:b.name,ordinal:b.ordinal,source});
 if(activeMode==='lesson'&&lessonStarted){
  const result=lesson.consume(id,now);
  if(result.kind==='WRONG'){
   setText('trainer-status','位置不匹配 / 当前应为 '+branchById(result.expected).name+
    '，检测到 '+b.name+'。请松开，再寻找目标位置。');
   record('WRONG',{expected:result.expected,actual:id});
  }else{
   setText('trainer-status',result.kind==='COMPLETE'?
    '十二辰练习完成 / '+result.total+' 个位置全部通过。':
    '正确 / '+b.name+' / '+result.progress+'/'+result.total+'。松开后继续。');
   if(result.kind==='COMPLETE')record('LESSON_COMPLETE',{total:result.total,errors:lesson.errors});
  }
 }else{
  setText('trainer-status',(source==='WEBXR'?'WEBXR CONTACT':'SIMULATED CONTACT')+
   ' / '+b.name+' / '+b.cue);
 }
 updateCurrent();renderWorkspace();
}
function processEvents(state,now){
 for(const e of state.events){
  if(e.kind==='CONTACT')handleContact(e.id,'WEBXR',now);
  else if(e.kind==='RELEASE'){
   record('RELEASE',{id:e.id,name:branchById(e.id)?.name});
   setText('trainer-status','已松开 '+(branchById(e.id)?.name||e.id)+'，可以寻找下一位。');
  }else if(e.kind==='LOST'){
   record('TRACKING_LOST',{id:e.id});
   setText('trainer-status','TRACKING LOST / 手部或拇指关节暂时不可见；本次接触不会被计为成功。');
  }
 }
}
function updateBranchState(hand,now,paint){
 contactState=contact.update(hand?.positions||null,now);
 processEvents(contactState,now);
 if(!paint)return;
 const state=contactState;
 if(state.tracking){
  const nearest=state.nearest,b=branchById(nearest?.id);
  const distanceMm=nearest?Math.round(nearest.distance*1000):null;
  if(state.active)setText('trainer-status','WEBXR / '+(selectedHand==='auto'?'AUTO':selectedHand.toUpperCase())+
   ' / 已确认 '+branchById(state.active).name+' / 请抬起拇指后再触碰下一位。');
  else if(state.candidate)setText('trainer-status','WEBXR / 候选 '+b?.name+' / '+
   Math.round(state.progress*100)+'% / 距离 '+distanceMm+'mm / 保持不动。');
  else if(nearest)setText('trainer-status','WEBXR / 最近 '+b?.name+' / '+distanceMm+
   'mm / 阈值 '+Math.round(contact.onDistance*1000)+'mm / 尚未接触。');
 }else setText('trainer-status','WEBXR / 未检测到所选手部。请将手掌放在头显可见范围内。');
 updateCurrent();
}
function updateSwordState(hand,now,paint){
 poseState=swordCoach.update(hand?.positions||null,now);
 if(poseState.events.length){
  for(const e of poseState.events)record(e.kind,{t_ms:e.t_ms});
  if(poseState.complete)lastEvent='剑指姿势通过 / 保持 500ms';
 }
 if(!paint)return;
 if(poseState.tracking)setText('trainer-status','WEBXR POSE / '+poseState.passed+'/'+poseState.total+
  ' 项通过 / '+(poseState.complete?'保持完成':poseState.feedback));
 else setText('trainer-status','WEBXR / 等待完整的 25 关节数据。');
 renderSwordStatus();updateCurrent();
}
function updateThunderState(hand,paint){
 if(!paint)return;
 if(!hand?.positions){
  setText('trainer-status','雷诀文献对照 / 等待手部数据；页面不自动认证科仪姿态。');return;
 }
 const angles=hand.angles||{};
 const bends=['index-pip','middle-pip','ring-pip','pinky-pip']
  .map(k=>k+' '+(Number.isFinite(angles[k])?Math.round(angles[k])+'°':'—')).join(' / ');
 const nearest=branchDistances(hand.positions)[0];
 setText('trainer-status','WEBXR 关节观察 / '+bends+
  '\n拇指最近位置：'+(nearest?nearest.name+' '+Math.round(nearest.distance*1000)+'mm':'—')+
  '\n这是动作辅助观察，不是雷诀正统性判定。');
}
window.__pmInstrumentFeed=({hands,now,mode})=>{
 xrMode=mode;latestHands=hands||{left:null,right:null};
 const hand=selectHand(latestHands);
 if(mode==='DESKTOP'){
  if(lastFrameTime!==0){contact.reset();swordCoach.reset();lastFrameTime=0;}
  return;
 }
 lastFrameTime=now;
 const paint=now-lastUi>110;
 if(paint)lastUi=now;
 if(activeMode==='branches'||activeMode==='lesson')updateBranchState(hand,now,paint);
 else if(activeMode==='sword')updateSwordState(hand,now,paint);
 else if(activeMode==='thunder')updateThunderState(hand,paint);
};
function normalized(v){
 const n=Math.hypot(...v)||1;return v.map(x=>x/n);
}
window.__pmOrganicDraw=({line,spot,label})=>{
 const hand=selectHand(latestHands);
 if(!hand?.positions)return;
 const p=hand.positions,thumb=p[4];
 const lateral=normalized([p[20][0]-p[5][0],p[20][1]-p[5][1],p[20][2]-p[5][2]]);
 const current=currentBranch();
 const nearest=contactState?.nearest;
 for(let i=0;i<BRANCHES.length;i++){
  const b=BRANCHES[i],anchor=p[b.joint];if(!point(anchor))continue;
  const isCurrent=current?.id===b.id;
  const isCandidate=contactState?.candidate===b.id;
  const isActive=contactState?.active===b.id;
  const c=isActive?color.active:isCandidate?color.candidate:isCurrent?color.target:color.normal;
  const alpha=(isCurrent||isCandidate||isActive)?0.98:0.70;
  // All labels on the same (ulnar) side, fanned along the finger by segment
  // rank so proximal / middle / tip names never overlap each other.
  const rank=b.segment==='根部'?0:b.segment==='指尖'?2:1;
  const out=.020+rank*.011,lift=.007+rank*.004;
  const offset=[lateral[0]*out,lateral[1]*out+lift,lateral[2]*out];
  const lp=[anchor[0]+offset[0],anchor[1]+offset[1],anchor[2]+offset[2]];
  line(anchor,lp,c,alpha*.65);spot(anchor,c,alpha);
  label(lp,b.name,c,alpha,isCurrent?0.030:0.021);
  if(isCurrent||isCandidate||isActive){
   const fingerAxis=normalized([p[14][0]-p[11][0],p[14][1]-p[11][1],p[14][2]-p[11][2]]);
   const radius=isCurrent?0.024:0.019;
   const fraction=isCandidate?Math.max(.05,contactState?.progress||0):1;
   const count=Math.max(2,Math.ceil(28*fraction));
   for(let k=0;k<count;k++){
    const a=k*Math.PI*2/28,bAngle=(k+1)*Math.PI*2/28;
    const v0=[anchor[0]+lateral[0]*Math.cos(a)*radius+fingerAxis[0]*Math.sin(a)*radius,
      anchor[1]+lateral[1]*Math.cos(a)*radius+fingerAxis[1]*Math.sin(a)*radius,
      anchor[2]+lateral[2]*Math.cos(a)*radius+fingerAxis[2]*Math.sin(a)*radius];
    const v1=[anchor[0]+lateral[0]*Math.cos(bAngle)*radius+fingerAxis[0]*Math.sin(bAngle)*radius,
      anchor[1]+lateral[1]*Math.cos(bAngle)*radius+fingerAxis[1]*Math.sin(bAngle)*radius,
      anchor[2]+lateral[2]*Math.cos(bAngle)*radius+fingerAxis[2]*Math.sin(bAngle)*radius];
    line(v0,v1,c,alpha*.9);
   }
  }
 }
 if(point(thumb)&&nearest&&nearest.distance<.14){
  const target=p[nearest.joint];
  const c=contactState?.active?color.active:contactState?.candidate?color.candidate:color.target;
  line(thumb,target,c,.92);spot(thumb,c,.9);
 }
 if(activeMode==='sword'){
  const wrist=p[0],a=p[9],b=p[14];
  if(point(wrist))label(wrist,'剑',poseState?.complete?color.pass:color.target,.98,.038,[0,.052,0]);
  if(point(a)&&point(b)){
   const ok=poseState?.checks?.find(x=>x.id==='tips')?.ok;
   line(a,b,ok?color.pass:color.warn,.95);
  }
  for(const id of ['index','middle','ring','pinky']){
   const joint={index:8,middle:13,ring:18,pinky:23}[id],pt=p[joint];
   const check=poseState?.checks?.find(x=>x.id===id);
   if(point(pt))spot(pt,check?.ok?color.pass:color.warn,.9);
  }
 }
 if(activeMode==='thunder'){
  if(point(p[0]))label(p[0],'雷',color.target,.95,.036,[0,.05,0]);
 }
};
function setMode(mode){
 if(!['branches','lesson','sword','thunder'].includes(mode))return;
 activeMode=mode;contact.reset();swordCoach.reset();contactState=null;poseState=null;
 renderWorkspace();record('MODE',{mode});
}
$('trainer-tabs').addEventListener('click',e=>{
 const button=e.target.closest('button[data-mode]');if(button)setMode(button.dataset.mode);
});
$('trainer-hand').addEventListener('change',e=>{
 selectedHand=e.target.value;contact.reset();swordCoach.reset();
 setText('trainer-status','训练手已切换：'+e.target.options[e.target.selectedIndex].text);
});
$('trainer-distance').addEventListener('input',e=>{
 contact.onDistance=Number(e.target.value)/1000;
 contact.offDistance=Math.max(contact.onDistance+.014,.05);
 setText('trainer-distance-value',e.target.value+' mm');
});
$('trainer-dwell').addEventListener('input',e=>{
 contact.dwellMs=Number(e.target.value);
 setText('trainer-dwell-value',e.target.value+' ms');
});
$('trainer-start').addEventListener('click',()=>{
 if(activeMode==='branches'){
  setMode('lesson');lessonStarted=true;lesson=new BranchLesson(PRACTICE_PATHS[0].steps);
  renderWorkspace();setText('trainer-status','开始十二辰跟练 / 第 1 位：子。');
 }else if(activeMode==='lesson'){
  const path=PRACTICE_PATHS.find(x=>x.id===selectedPath);
  lesson=new BranchLesson(path.steps);lessonStarted=true;contact.reset();
  renderWorkspace();setText('trainer-status','跟练开始 / '+path.steps.length+' 个位置。');
 }else if(activeMode==='sword'){
  swordCoach.reset();poseState=null;setText('trainer-status','剑指检测已重置。进入 XR 后开始摆姿势。');
 }else{
  thunderDone[selectedThunder]=[];renderWorkspace();setText('trainer-status','已清空本式的人工对照进度。');
 }
});
$('trainer-demo').addEventListener('click',()=>{
 if(activeMode==='branches')simulateBranch(selectedBranch);
 else if(activeMode==='lesson'){
  if(!lessonStarted){lessonStarted=true;lesson=new BranchLesson(PRACTICE_PATHS.find(x=>x.id===selectedPath).steps);}
  const id=lesson.current;if(id)simulateBranch(id);
  renderWorkspace();
 }else if(activeMode==='sword')simulateSword();
 else if(activeMode==='thunder'){
  const f=THUNDER_FORMS.find(x=>x.id===selectedThunder),done=thunderDone[selectedThunder]||(thunderDone[selectedThunder]=[]);
  const next=done.findIndex(x=>!x);const index=next<0?0:next;done[index]=true;
  record('THUNDER_STEP',{form:f.id,step:index,checked:true,source:'SIMULATED'});
  renderWorkspace();
 }
});
$('trainer-reset').addEventListener('click',()=>{
 contact.reset();swordCoach.reset();contactState=null;poseState=null;
 if(activeMode==='lesson'){lesson.reset();lessonStarted=false;}
 if(activeMode==='thunder')thunderDone[selectedThunder]=[];
 renderWorkspace();setText('trainer-status','当前练习已重置。');
});
$('trainer-export').addEventListener('click',()=>{
 const data={format:'hand-seal-trainer-v1',exportedAt:new Date().toISOString(),
  source:xrMode==='DESKTOP'?'DESKTOP_SIMULATION':'WEBXR',mode:activeMode,
  selectedHand,events:archive,thunderChecklist:thunderDone,
  caveat:'WebXR joint anchors are estimates, not pressure sensors. Desktop actions are simulated. Historical text is source-attributed and not a claim of ritual efficacy or lineage certification.'};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);
 a.download='hand-seal-training-session.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),1000);
});
renderWorkspace();
setText('trainer-status',window.__pmLabelRendererError?
 'CJK LABEL RENDERER ERROR / '+window.__pmLabelRendererError:
 'DESKTOP PREVIEW / 3D labels use the existing hand skeleton renderer. Enter MR on Quest to test real thumb contacts.');
