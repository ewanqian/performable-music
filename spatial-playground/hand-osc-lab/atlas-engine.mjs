// Gestural Atlas — 8 experiments in TWO separate collections.
// Historical diagrams are data, NOT a claim of religious ritual reconstruction.
// WebXR 25-point inputs can be mapped to semantic gestures; pure tests run in Node.
import {handAngles} from './engine.mjs';
import {FingerDial} from './studies-engine.mjs';
import {hitSegmentCircle} from './organic-engine.mjs';
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
export const COLLECTIONS=Object.freeze({
  music:[
    {id:'continuum',name:'Continuum / 持续音色',type:'continuous',gesture:'单手捏合＋位置',
      purpose:'从无声到持续发声：捏合控制音量，指尖左右改变滤波，上下改变反馈。'},
    {id:'orbit',name:'Orbit / 双手声场',type:'bimanual',gesture:'双手距离＋相位',
      purpose:'双手间距控制开合，两手相对旋转控制声场与渐强。'},
    {id:'trace',name:'Trace Score / 运动谱',type:'trajectory',gesture:'八字轨迹＋区域穿越',
      purpose:'连续划动穿越六个声音区域，把路径变成可重复的节奏与配器。'},
    {id:'dial',name:'Phalanx Sequencer / 指节音序',type:'contact',gesture:'拇指触碰 1–6 指节',
      purpose:'六个触点像可移动控制器；通过几位数字构成原创短乐句。'}
  ],
  culture:[
    {id:'jian',name:'剑诀 / 空间符形',type:'posture-trajectory',gesture:'剑指形态＋路径',
      purpose:'参考道教剑诀和港片的起势、画符、收势视觉，生成原创数字墨迹。'},
    {id:'river',name:'河图洛书 / 数字空间',type:'numeric-path',gesture:'数字成对＋九宫三连',
      purpose:'河图相配数和洛书九宫的空间规则，构造当代数理交互。'},
    {id:'bagua',name:'八卦 / 六爻构成',type:'binary-composition',gesture:'阴阳选择＋自下向上叠加',
      purpose:'三爻对应八卦，六爻产生六十四种组合；不编造占卜断语。'},
    {id:'stars',name:'北斗 / 七星连线',type:'ordered-route',gesture:'指向七星＋顺序路径',
      purpose:'采用七星名称与星图连线作为声音与空间导航，不假称步罡仪轨。'}
  ]
});
export const LUOSHU=Object.freeze([[4,9,2],[3,5,7],[8,1,6]]);
export const LUOSHU_LINES=Object.freeze([
 [4,9,2],[3,5,7],[8,1,6],[4,3,8],[9,5,1],[2,7,6],[4,5,6],[2,5,8]
]);
export const HETU=Object.freeze([
 {a:1,b:6,element:'水',direction:'北'},
 {a:2,b:7,element:'火',direction:'南'},
 {a:3,b:8,element:'木',direction:'东'},
 {a:4,b:9,element:'金',direction:'西'},
 {a:5,b:10,element:'土',direction:'中'}
]);
export const TRIGRAMS=Object.freeze([
 {bits:'000',name:'坤',symbol:'☷',image:'地'},
 {bits:'001',name:'艮',symbol:'☶',image:'山'},
 {bits:'010',name:'坎',symbol:'☵',image:'水'},
 {bits:'011',name:'巽',symbol:'☴',image:'风'},
 {bits:'100',name:'震',symbol:'☳',image:'雷'},
 {bits:'101',name:'离',symbol:'☲',image:'火'},
 {bits:'110',name:'兑',symbol:'☱',image:'泽'},
 {bits:'111',name:'乾',symbol:'☰',image:'天'}
]); // bits are BOTTOM -> TOP; not a hexagram's textual interpretation
export const STARS=Object.freeze([
 {id:1,name:'天枢',x:.24,y:.28},
 {id:2,name:'天璇',x:.38,y:.20},
 {id:3,name:'天玑',x:.50,y:.35},
 {id:4,name:'天权',x:.42,y:.51},
 {id:5,name:'玉衡',x:.57,y:.58},
 {id:6,name:'开阳',x:.71,y:.69},
 {id:7,name:'摇光',x:.83,y:.81}
]);
export const TRACE_NODES=Object.freeze([
 {id:'SUB',x:.25,y:.33,r:.09},
 {id:'GLASS',x:.51,y:.19,r:.083},
 {id:'METAL',x:.74,y:.32,r:.09},
 {id:'BASS',x:.30,y:.65,r:.095},
 {id:'GRAIN',x:.68,y:.64,r:.095},
 {id:'CHORD',x:.51,y:.81,r:.08}
]);
const valid=p=>Array.isArray(p)&&p.length>=3&&p.slice(0,3).every(Number.isFinite);
export const dist=(a,b)=>valid(a)&&valid(b)?
 Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]):Infinity;
export function swordPose(positions){
 if(!Array.isArray(positions)||positions.length<25||positions.some(p=>!valid(p)))return null;
 const angles=handAngles(positions);
 const index=angles['index-pip']??180,middle=angles['middle-pip']??180;
 const ring=angles['ring-pip']??0,little=angles['pinky-pip']??0;
 const close=dist(positions[9],positions[14])<.068;
 return {active:index<43&&middle<43&&ring>58&&little>58&&close,
   index,middle,ring,little,tipGap:dist(positions[9],positions[14])};
}
export class SwordLatch {
 constructor({dwellMs=140,releaseMs=100}={}){this.dwellMs=dwellMs;this.releaseMs=releaseMs;this.reset();}
 reset(){this.active=false;this.candidate=null;this.lostAt=null;}
 update(positions,now){
  const pose=swordPose(positions),target=Boolean(pose?.active);
  const events=[];
  if(target){
    this.lostAt=null;
    if(!this.active){
      if(this.candidate===null)this.candidate=now;
      else if(now-this.candidate>=this.dwellMs){this.active=true;events.push({kind:'POSE_ENTER',t_ms:now});}
    }
  }else{
    this.candidate=null;
    if(this.active){
      if(this.lostAt===null)this.lostAt=now;
      else if(now-this.lostAt>=this.releaseMs){
        this.active=false;events.push({kind:'POSE_EXIT',t_ms:now});
      }
    }
  }
  return {active:this.active,pose,events};
 }
}
export class Hexagram {
 constructor(){this.reset();}
 reset(){this.bits='';}
 add(bit){
  if(![0,1].includes(bit))throw Error('yin/yang only');
  if(this.bits.length>=6)this.bits='';
  this.bits+=String(bit);
  return this.describe();
 }
 describe(){
  const n=this.bits.length,lower=n>=3?TRIGRAMS.find(t=>t.bits===this.bits.slice(0,3)):null;
  const upper=n>=6?TRIGRAMS.find(t=>t.bits===this.bits.slice(3,6)):null;
  return {bits:this.bits,count:n,lower,upper,completed:n===6,
    ordinal:n===6?parseInt(this.bits,2)+1:null}; // ordinal is binary index, NOT King Wen ordering
 }
}
export class RiverGrammar{
 constructor(){this.mode='luoshu';this.reset();}
 reset(){this.selected=[];this.completions=0;}
 setMode(mode){if(!['luoshu','hetu'].includes(mode))throw Error('mode');this.mode=mode;this.reset();}
 add(value){
  if(!Number.isInteger(value)||value<1||value>(this.mode==='hetu'?10:9))return [];
  this.selected.push(value);
  this.selected=this.selected.slice(-(this.mode==='hetu'?2:3));
  const result=[{kind:'SELECT',value}];
  if(this.mode==='hetu'&&this.selected.length===2){
    const pair=HETU.find(p=>[p.a,p.b].every(n=>this.selected.includes(n)));
    if(pair){result.push({kind:'PAIR',...pair});this.completions++;this.selected=[];}
  }else if(this.mode==='luoshu'&&this.selected.length===3){
    const line=LUOSHU_LINES.find(l=>l.every((n,i)=>n===this.selected[i])||
      l.every((n,i)=>n===this.selected[2-i]));
    if(line){result.push({kind:'LINE',line:[...this.selected],sum:15});this.completions++;this.selected=[];}
  }
  return result;
 }
}
export class StarRoute{
 constructor(){this.reset();}
 reset(){this.index=0;this.completed=0;this.last=null;}
 add(index){
  if(!Number.isInteger(index)||index<0||index>=STARS.length)return [];
  if(index===this.last)return [];
  this.last=index;
  const events=[];
  if(index!==this.index){
    if(index===0){this.index=1;events.push({kind:'START',star:1});}
    else{this.index=0;events.push({kind:'RESET',star:index+1});}
    return events;
  }
  this.index++;
  events.push({kind:'STEP',star:index+1,name:STARS[index].name,progress:this.index});
  if(this.index===7){this.completed++;this.index=0;this.last=null;events.push({kind:'COMPLETE',completed:this.completed});}
  return events;
 }
}
export class TraceRoute{
 constructor(nodes=TRACE_NODES){this.nodes=nodes;this.points=new Map();this.hit=new Map();}
 reset(){this.points.clear();this.hit.clear();}
 end(pointer){this.points.delete(String(pointer));this.hit.delete(String(pointer));}
 move(pointer,x,y,now){
  const key=String(pointer),a=this.points.get(key),b={x:clamp(x),y:clamp(y),t:now},events=[];
  for(const n of this.nodes){
   const was=this.hit.get(key+':'+n.id)??false;
   const inside=Math.hypot(b.x-n.x,b.y-n.y)<(was?n.r+.018:n.r-.012);
   const swept=a&&!was&&!inside&&hitSegmentCircle(a.x,a.y,b.x,b.y,n.x,n.y,n.r);
   if((inside&&!was)||swept)events.push({kind:'STRIKE',id:n.id,velocity:a?clamp(Math.hypot(a.x-b.x,a.y-b.y)*15,.15,1):.4,now});
   if(inside)this.hit.set(key+':'+n.id,true);
   else this.hit.delete(key+':'+n.id);
  }
  this.points.set(key,b);return events;
 }
}
export function bimanual(left,right){
 const l=left?.positions?.[9],r=right?.positions?.[9];
 if(!valid(l)||!valid(r))return null;
 const dx=r[0]-l[0],dy=r[1]-l[1],d=dist(l,r);
 return {distance:d,spread:clamp((d-.13)/.65),phase:Math.atan2(dy,dx),
   center:[(l[0]+r[0])/2,(l[1]+r[1])/2,(l[2]+r[2])/2]};
}
export {FingerDial};
