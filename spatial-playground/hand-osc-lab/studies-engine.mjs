// Spatial Instrument Studies — pure semantic layer. No DOM, audio, WebXR or network.
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
export const DIGIT_JOINTS=Object.freeze([
  {digit:1,index:7,label:'食指 / 中节'},
  {digit:2,index:8,label:'食指 / 末节'},
  {digit:3,index:12,label:'中指 / 中节'},
  {digit:4,index:13,label:'中指 / 末节'},
  {digit:5,index:17,label:'无名指 / 中节'},
  {digit:6,index:18,label:'无名指 / 末节'}
]);
export const INCANTATION='3345655643';
export const TRACKS=Object.freeze([
  {id:'pulse',name:'PULSE',steps:[0,4,8,12],level:.74},
  {id:'metal',name:'METAL',steps:[4,12],level:.54},
  {id:'shimmer',name:'SHIMMER',steps:[0,2,3,6,8,10,11,14],level:.28},
  {id:'chord',name:'DRONE',steps:[0],level:.32}
]);
const validPoint=p=>Array.isArray(p)&&p.length>=3&&p.slice(0,3).every(Number.isFinite);
export function distance(a,b){
  return validPoint(a)&&validPoint(b)?Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]):null;
}
export class FingerDial{
  constructor({onDistance=.028,offDistance=.046,dwellMs=90,rearmMs=45}={}){
    this.onDistance=onDistance;this.offDistance=offDistance;
    this.dwellMs=dwellMs;this.rearmMs=rearmMs;this.reset();
  }
  reset(){
    this.active=null;this.candidate=null;this.since=0;this.releasedAt=-Infinity;
    this.sequence='';this.count=0;this.lastDigit=null;
  }
  update(positions,now){
    const events=[];
    if(!Array.isArray(positions)||positions.length<25||!validPoint(positions[4])){
      // Tracking loss is unknown input: release contact, never synthesize digits.
      if(this.active!==null)events.push({kind:'LOST',digit:this.active,t_ms:now});
      this.active=null;this.candidate=null;this.releasedAt=now;
      return {events,active:null,nearest:null,sequence:this.sequence,progress:this.progress()};
    }
    const d=DIGIT_JOINTS.map(slot=>({digit:slot.digit,d:distance(positions[4],positions[slot.index])}))
      .filter(v=>v.d!==null).sort((a,b)=>a.d-b.d);
    const nearest=d[0]||null;
    if(this.active!==null){
      // Must lift thumb before the next number; prevents spurious continuous repeats.
      const dd=d.find(v=>v.digit===this.active)?.d??Infinity;
      if(dd>this.offDistance){
        events.push({kind:'RELEASE',digit:this.active,t_ms:now});
        this.active=null;this.releasedAt=now;this.candidate=null;
      }
    }else if(nearest&&nearest.d<=this.onDistance && now-this.releasedAt>=this.rearmMs){
      if(this.candidate!==nearest.digit){this.candidate=nearest.digit;this.since=now;}
      else if(now-this.since>=this.dwellMs){
        this.active=nearest.digit;this.candidate=null;this.lastDigit=this.active;
        this.sequence=(this.sequence+String(this.active)).slice(-32);this.count++;
        events.push({kind:'DIGIT',digit:this.active,t_ms:now,sequence:this.sequence});
        if(this.sequence.endsWith(INCANTATION)){
          events.push({kind:'SEAL',value:INCANTATION,t_ms:now});
        }
      }
    }else if(this.active===null)this.candidate=null;
    return {events,active:this.active,nearest,sequence:this.sequence,
      progress:this.progress()};
  }
  progress(){
    // Longest suffix also matching target prefix (KMP-style recovery).
    for(let n=Math.min(this.sequence.length,INCANTATION.length);n>=1;n--)
      if(this.sequence.endsWith(INCANTATION.slice(0,n)))return n;
    return 0;
  }
}
export class ScoreClock{
  constructor({bpm=100,lookaheadMs=90}={}){
    this.bpm=clamp(bpm,45,220);this.lookaheadMs=lookaheadMs;
    this.running=false;this.tickIndex=0;this.originMs=0;this.lastIndex=-1;
  }
  start(nowMs=0){this.originMs=nowMs;this.tickIndex=0;this.lastIndex=-1;this.running=true;}
  stop(){this.running=false;}
  setBpm(bpm,nowMs=0){
    const next=clamp(bpm,45,220);
    if(this.running){
      const elapsed=Math.max(0,nowMs-this.originMs);
      const phase=elapsed/(60000/this.bpm/4);
      this.originMs=nowMs-phase*(60000/next/4);
    }
    this.bpm=next;
  }
  advance(nowMs){
    if(!this.running)return [];
    const stepMs=60000/this.bpm/4;
    const upto=Math.floor((nowMs+this.lookaheadMs-this.originMs)/stepMs);
    const result=[];
    // Never cause a massive event avalanche after a tab is suspended.
    const start=Math.max(this.lastIndex+1,upto-63);
    for(let index=start;index<=upto;index++){
      if(index<0)continue;
      const step=index%16,bar=Math.floor(index/16);
      for(const track of TRACKS){
        if(track.steps.includes(step)){
          result.push({type:'NOTE',track:track.id,step,bar,
            t_ms:this.originMs+index*stepMs,velocity:track.level});
        }
      }
    }
    this.lastIndex=Math.max(this.lastIndex,upto);
    return result;
  }
}
export function strudelScore(bpm=100){
  const rate=clamp(bpm,45,220);
  // A genuine editable Strudel pattern for its own runtime, not an OSC connection.
  return ['// Spatial Instrument Studies / editable arrangement',
    'setcps('+rate+'/240)',
    'stack(',
    '  s("bd ~ [bd ~] ~").gain(.72),',
    '  s("~ sd ~ sd").gain(.40),',
    '  s("hh*8").gain(.18),',
    '  note("<c3 ab2 bb2 g2>").s("sine").gain(.27).lpf(1450).room(.35)',
    ')'].join('\n');
}
