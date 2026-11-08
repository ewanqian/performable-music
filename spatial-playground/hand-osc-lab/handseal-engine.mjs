// Hand Seal Trainer — rule-based, explainable 25-joint practice engine.
// Historical branch placements follow the Daoist Cultural Information Database's
// 十二辰文 description. A joint anchor is an approximation of a tactile crease;
// WebXR joints are not pressure/contact sensors.
import {handAngles} from './engine.mjs';

export const BRANCHES=Object.freeze([
 {id:'zi',name:'子',ordinal:1,finger:'无名指',segment:'根部',joint:16,jointName:'ring-finger-phalanx-proximal',cue:'拇指掐无名指根部'},
 {id:'chou',name:'丑',ordinal:2,finger:'中指',segment:'根部',joint:11,jointName:'middle-finger-phalanx-proximal',cue:'拇指掐中指根部'},
 {id:'yin',name:'寅',ordinal:3,finger:'食指',segment:'根部',joint:6,jointName:'index-finger-phalanx-proximal',cue:'拇指掐食指根部'},
 {id:'mao',name:'卯',ordinal:4,finger:'食指',segment:'第一、二节之间',joint:7,jointName:'index-finger-phalanx-intermediate',cue:'拇指掐食指第一、二节之间'},
 {id:'chen',name:'辰',ordinal:5,finger:'食指',segment:'第二、三节之间',joint:8,jointName:'index-finger-phalanx-distal',cue:'拇指掐食指第二、三节之间'},
 {id:'si',name:'巳',ordinal:6,finger:'食指',segment:'指尖',joint:9,jointName:'index-finger-tip',cue:'拇指掐食指尖'},
 {id:'wu',name:'午',ordinal:7,finger:'中指',segment:'指尖',joint:14,jointName:'middle-finger-tip',cue:'拇指掐中指尖'},
 {id:'wei',name:'未',ordinal:8,finger:'无名指',segment:'指尖',joint:19,jointName:'ring-finger-tip',cue:'拇指掐无名指尖'},
 {id:'shen',name:'申',ordinal:9,finger:'小指',segment:'指尖',joint:24,jointName:'pinky-finger-tip',cue:'拇指掐小指尖'},
 {id:'you',name:'酉',ordinal:10,finger:'小指',segment:'第二、三节之间',joint:23,jointName:'pinky-finger-phalanx-distal',cue:'拇指掐小指第二、三节之间'},
 {id:'xu',name:'戌',ordinal:11,finger:'小指',segment:'第一、二节之间',joint:22,jointName:'pinky-finger-phalanx-intermediate',cue:'拇指掐小指第一、二节之间'},
 {id:'hai',name:'亥',ordinal:12,finger:'小指',segment:'根部',joint:21,jointName:'pinky-finger-phalanx-proximal',cue:'拇指掐小指根部'}
]);

export const THUNDER_FORMS=Object.freeze([
 {id:'tianlei',name:'天雷诀',source:'两手掐寅，五指藏甲。',steps:[
  '左右手分别以拇指掐本手食指根部（寅）',
  '其余手指收拢；“藏甲”的具体指形依传承图谱核验',
  '双手保持稳定，检查两侧寅位接触'
 ],note:'原文为简略诀目，不足以定义全部关节角度；本页不宣称自动认证。'},
 {id:'dilei',name:'地雷诀',source:'二指、三指、大指掐定，四指、五指押定，大指藏甲。',steps:[
  '辨认二指（食指）、三指（中指）与拇指的关系',
  '无名指、小指收拢并作辅助固定',
  '保持姿态，观察拇指与前两指的接触关系'
 ],note:'“掐定”“押定”的细节需要对照具体诀谱，不能仅凭文字推断唯一手型。'},
 {id:'yunlei',name:'云雷诀',source:'二指弓，大指招丑，三、四、五指押定，大指藏甲不见。',steps:[
  '食指弯曲成弓形',
  '拇指寻找中指根部（丑）',
  '中指、无名指、小指收拢固定'
 ],note:'本页提供关节弯曲与丑位距离的辅助观察，不作为宗教科仪的合格判定。'},
 {id:'shuilei',name:'水雷诀',source:'二、三、四指弓，大指招定亥，五指押定，大指藏甲。',steps:[
  '食指、中指、无名指弯曲',
  '拇指寻找小指根部（亥）',
  '小指收拢固定'
 ],note:'文字描述的“弓”“押定”仍需原始图谱或传承者核对。'},
 {id:'yaolei',name:'妖雷诀',source:'二、三、四、五指、大指押定，并不见甲。',steps:[
  '观察五指的收拢关系',
  '检查各指是否形成稳定的闭合形态',
  '对照具体来源，不自行补写缺失的指间关系'
 ],note:'名称与原文保留为文献研究条目；不提供法术功效说明。'},
 {id:'doule i'.replace(' ',''),name:'斗雷诀',source:'小指从四指背上过，中指勾定，大指掐定子，四指押定，大指不得见甲，二指直向。',steps:[
  '观察小指与无名指的交叉关系',
  '中指形成勾定形态，食指保持伸直',
  '拇指寻找无名指根部（子）'
 ],note:'交叉关系的方向与掌背朝向需参考原图；本页仅作文字引导，暂不自动识别。'}
]);

export const PRACTICE_PATHS=Object.freeze([
 {id:'twelve',name:'十二辰逐位',description:'按子、丑、寅……亥依次完成拇指掐位。每一位都需要接触、保持、松开。',steps:BRANCHES.map(x=>x.id)},
 {id:'index-run',name:'食指四位',description:'在食指根部、两道指节线与指尖之间移动，练习位置辨识。',steps:['yin','mao','chen','si']},
 {id:'pinky-run',name:'小指四位',description:'从小指根部向指尖移动，再反向复习。',steps:['hai','xu','you','shen']}
]);

const validPoint=p=>Array.isArray(p)&&p.length>=3&&p.slice(0,3).every(Number.isFinite);
export function pointDistance(a,b){
 if(!validPoint(a)||!validPoint(b))return Infinity;
 return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
}
export function branchDistances(positions){
 if(!Array.isArray(positions)||positions.length<25||!validPoint(positions[4]))return [];
 return BRANCHES.map(branch=>({
  id:branch.id,name:branch.name,joint:branch.joint,
  distance:pointDistance(positions[4],positions[branch.joint])
 })).filter(x=>Number.isFinite(x.distance)).sort((a,b)=>a.distance-b.distance);
}

export class PalmContactEngine{
 constructor({onDistance=.034,offDistance=.052,dwellMs=140,rearmMs=55}={}){
  this.onDistance=onDistance;this.offDistance=offDistance;
  this.dwellMs=dwellMs;this.rearmMs=rearmMs;this.reset();
 }
 reset(){this.active=null;this.candidate=null;this.since=0;this.releasedAt=-Infinity;this.lastSeen=0;}
 update(positions,now){
  const events=[];
  if(!Array.isArray(positions)||positions.length<25||!validPoint(positions[4])){
   if(this.active||this.candidate)events.push({kind:'LOST',id:this.active||this.candidate,t_ms:now});
   this.active=null;this.candidate=null;this.releasedAt=now;
   return {events,active:null,candidate:null,nearest:null,progress:0,tracking:false};
  }
  const distances=branchDistances(positions),nearest=distances[0]||null;
  if(!nearest){
   if(this.active||this.candidate)events.push({kind:'LOST',id:this.active||this.candidate,t_ms:now});
   this.active=null;this.candidate=null;this.releasedAt=now;
   return {events,active:null,candidate:null,nearest:null,progress:0,tracking:false};
  }
  this.lastSeen=now;
  if(this.active){
   const current=distances.find(x=>x.id===this.active);
   const switched=nearest.id!==this.active&&nearest.distance<=this.onDistance&&
    nearest.distance+0.008<(current?.distance??Infinity);
   const released=(current?.distance??Infinity)>this.offDistance||switched;
   if(released){
    const old=this.active;
    events.push({kind:'RELEASE',id:old,t_ms:now,distance:current?.distance??Infinity});
    this.active=null;this.releasedAt=now;this.candidate=null;
   }
  }
  if(!this.active&&nearest.distance<=this.onDistance&&now-this.releasedAt>=this.rearmMs){
   if(this.candidate!==nearest.id){this.candidate=nearest.id;this.since=now;}
   else if(now-this.since>=this.dwellMs){
    this.active=nearest.id;this.candidate=null;
    const branch=BRANCHES.find(x=>x.id===this.active);
    events.push({kind:'CONTACT',id:this.active,name:branch.name,ordinal:branch.ordinal,
     joint:branch.joint,distance:nearest.distance,t_ms:now});
   }
  }else if(!this.active)this.candidate=null;
  const progress=this.candidate?Math.min(1,Math.max(0,(now-this.since)/this.dwellMs)):this.active?1:0;
  return {events,active:this.active,candidate:this.candidate,nearest,progress,tracking:true};
 }
}

export class BranchLesson{
 constructor(steps=BRANCHES.map(x=>x.id)){this.steps=[...steps];this.reset();}
 reset(){this.index=0;this.errors=0;this.completed=false;this.history=[];}
 get current(){return this.steps[this.index]||null;}
 consume(id,now=0){
  if(this.completed)return {kind:'ALREADY_COMPLETE',progress:this.index,total:this.steps.length};
  const expected=this.current;
  if(id!==expected){
   this.errors++;this.history.push({kind:'WRONG',expected,actual:id,t_ms:now});
   return {kind:'WRONG',expected,actual:id,progress:this.index,total:this.steps.length};
  }
  this.history.push({kind:'CORRECT',id,t_ms:now});this.index++;
  this.completed=this.index>=this.steps.length;
  return {kind:this.completed?'COMPLETE':'CORRECT',id,progress:this.index,total:this.steps.length};
 }
}

function bend(angles,key){const n=angles?.[key];return Number.isFinite(n)?n:null;}
export function assessSwordPose(positions){
 if(!Array.isArray(positions)||positions.length<25||positions.some(p=>!validPoint(p))){
  return {tracking:false,score:0,checks:[],feedback:'等待完整的手部关节数据'};
 }
 const a=handAngles(positions);
 const index=bend(a,'index-pip'),middle=bend(a,'middle-pip'),
  ring=bend(a,'ring-pip'),pinky=bend(a,'pinky-pip');
 const tipGap=pointDistance(positions[9],positions[14]);
 const checks=[
  {id:'index',label:'食指伸直',ok:index!==null&&index<=43,value:index,unit:'°',hint:'把食指再伸直一点',pass:'食指已伸直'},
  {id:'middle',label:'中指伸直',ok:middle!==null&&middle<=43,value:middle,unit:'°',hint:'把中指再伸直一点',pass:'中指已伸直'},
  {id:'ring',label:'无名指收拢',ok:ring!==null&&ring>=48,value:ring,unit:'°',hint:'将无名指向掌心收拢',pass:'无名指已收拢'},
  {id:'pinky',label:'小指收拢',ok:pinky!==null&&pinky>=48,value:pinky,unit:'°',hint:'将小指向掌心收拢',pass:'小指已收拢'},
  {id:'tips',label:'食指与中指并拢',ok:Number.isFinite(tipGap)&&tipGap<=.068,value:tipGap*1000,unit:'mm',hint:'让食指和中指指尖靠近',pass:'两指已并拢'}
 ];
 const passed=checks.filter(x=>x.ok).length;
 return {tracking:true,score:passed/checks.length,passed,total:checks.length,checks,
  feedback:checks.find(x=>!x.ok)?.hint||'姿势符合当前基础剑指模型'};
}
export class SwordPoseCoach{
 constructor({holdMs=500}={}){this.holdMs=holdMs;this.reset();}
 reset(){this.since=null;this.complete=false;}
 update(positions,now){
  const assessment=assessSwordPose(positions),events=[];
  if(!assessment.tracking||assessment.passed!==assessment.total){
   if(this.complete)events.push({kind:'POSE_RESET',t_ms:now});
   this.since=null;this.complete=false;
   return {...assessment,hold:0,complete:false,events,
    step:assessment.tracking?Math.min(3,assessment.passed):0};
  }
  if(this.since===null)this.since=now;
  const hold=Math.min(1,(now-this.since)/this.holdMs);
  if(hold>=1&&!this.complete){this.complete=true;events.push({kind:'POSE_COMPLETE',t_ms:now});}
  return {...assessment,hold,complete:this.complete,events,step:3};
 }
}
