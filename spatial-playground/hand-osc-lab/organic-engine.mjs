// Organic Fields 03: deliberately PLAYABLE spaces, not buttons or a piano.
// Pure geometry/transport; no audio, browser, or headset dependency.
export const MODES=Object.freeze({
  metal:{
    title:'METAL KITCHEN',subtitle:'Inharmonic cookware / kinetic percussion',bpm:104,
    description:'玻璃、碗、钢板、锅与餐具：用八字运动串起不同金属共振。',
    fields:[
      {id:'pot',name:'POT',x:.24,y:.30,r:.117,color:'#a3f2d5',note:'deep wok'},
      {id:'lid',name:'LID',x:.49,y:.23,r:.093,color:'#e6ecd6',note:'steel lid'},
      {id:'cutlery',name:'CUTLERY',x:.74,y:.29,r:.119,color:'#e9bf8a',note:'shimmer'},
      {id:'bowl',name:'BOWL',x:.34,y:.57,r:.095,color:'#8fcce8',note:'ceramic'},
      {id:'glass',name:'GLASS',x:.68,y:.59,r:.10,color:'#cabdf4',note:'glass chime'},
      {id:'pan',name:'PAN',x:.51,y:.79,r:.116,color:'#edd8a7',note:'iron pan'},
    ]
  },
  electro:{
    title:'NEON REACTOR',subtitle:'Sub / industrial rhythm / FM synth',bpm:126,
    description:'穿越低频与鼓组，保持手指运动改变滤波与调制。',
    fields:[
      {id:'kick',name:'SUB',x:.25,y:.28,r:.125,color:'#8de2f9',note:'sub impact'},
      {id:'hat',name:'HAT',x:.53,y:.21,r:.10,color:'#bba6ff',note:'metal ticks'},
      {id:'snare',name:'SNARE',x:.75,y:.33,r:.115,color:'#ffb0ca',note:'snare grit'},
      {id:'acid',name:'ACID',x:.29,y:.64,r:.125,color:'#e2fb91',note:'filter stab'},
      {id:'fm',name:'FM',x:.68,y:.65,r:.115,color:'#a3aafd',note:'digital impact'},
      {id:'rise',name:'RISE',x:.50,y:.81,r:.095,color:'#f9e19a',note:'riser'},
    ]
  },
  orchestra:{
    title:'ORCHESTRAL FIELD',subtitle:'Original harmonic gestures / cinematic sections',bpm:92,
    description:'不是现成古典音乐采样：以原创和声进行把单个手势组织为管弦乐分句。',
    fields:[
      {id:'strings',name:'STRINGS',x:.24,y:.31,r:.142,color:'#d2c5ff',note:'bowed ensemble'},
      {id:'harp',name:'HARP',x:.73,y:.25,r:.107,color:'#bfece9',note:'bright plucks'},
      {id:'brass',name:'BRASS',x:.75,y:.62,r:.145,color:'#efca8d',note:'horn swell'},
      {id:'choir',name:'CHOIR',x:.29,y:.67,r:.133,color:'#cfe2ff',note:'vowels'},
      {id:'timpani',name:'TIMPANI',x:.51,y:.49,r:.104,color:'#f3a89d',note:'low drums'},
      {id:'tutti',name:'TUTTI',x:.50,y:.84,r:.113,color:'#fff0b0',note:'full chord'},
    ]
  }
});
export function clamp(v,a=0,b=1){return Math.min(b,Math.max(a,Number.isFinite(v)?v:a));}
export function hitSegmentCircle(ax,ay,bx,by,cx,cy,r){
  const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;
  if(l2<1e-12)return Math.hypot(ax-cx,ay-cy)<=r;
  const t=clamp(((cx-ax)*dx+(cy-ay)*dy)/l2);
  return Math.hypot(ax+t*dx-cx,ay+t*dy-cy)<=r;
}
export function nextGridTime(origin,now,bpm=100,division=4){
  if(!Number.isFinite(origin)||!Number.isFinite(now))return 0;
  const step=60/clamp(bpm,40,220)/clamp(division,1,16);
  return origin+Math.ceil(Math.max(0,now-origin)/step)*step;
}
export class PlaySpace{
  constructor(mode='metal',{cooldownMs=85}={}){this.cooldownMs=cooldownMs;this.reset(mode);}
  reset(mode='metal'){
    if(!MODES[mode])throw Error('Unknown mode '+mode);
    this.mode=mode;this.points=new Map();this.active=new Map();this.lastTrigger=new Map();
    this.totalEvents=0;this.pathLength=0;this.lastVelocity=0;this.lastAngle=0;
  }
  end(pointer,now=0){
    const key=String(pointer),events=[];
    const p=this.points.get(key);if(!p)return events;
    for(const field of MODES[this.mode].fields){
      const k=key+':'+field.id;
      if(this.active.get(k)){
        this.active.delete(k);
        events.push({kind:'EXIT',id:field.id,mode:this.mode,pointer:key,
          x:p.x,y:p.y,velocity:0,t_ms:now});
      }
    }
    this.points.delete(key);
    this.totalEvents+=events.length;
    return events;
  }
  move(pointer,x,y,now=0){
    const key=String(pointer),nx=clamp(x),ny=clamp(y),old=this.points.get(key);
    const events=[];
    const d=old?Math.hypot(nx-old.x,ny-old.y):0;
    const dt=old?Math.max(1,now-old.t):16;
    const speed=clamp(d/dt*135,0,1); // normalized, 0..1, invariant to device size
    if(old)this.pathLength+=d;
    const angle=old?Math.atan2(ny-old.y,nx-old.x):0;
    this.lastAngle=angle;this.lastVelocity=speed;
    for(const field of MODES[this.mode].fields){
      const regionKey=key+':'+field.id;
      const was=this.active.get(regionKey)||false;
      const dist=Math.hypot(nx-field.x,ny-field.y);
      const inside=was?dist<field.r+.020:dist<field.r-.010;
      const crossed=Boolean(old)&&hitSegmentCircle(old.x,old.y,nx,ny,field.x,field.y,field.r-.009);
      // Very fast swipe can traverse the whole region between frames.
      const swept=(!was&&!inside&&crossed);
      const last=this.lastTrigger.get(regionKey)??-Infinity;
      if((inside&&!was||swept)&&now-last>=this.cooldownMs){
        events.push({kind:'ENTER',id:field.id,mode:this.mode,pointer:key,
          x:nx,y:ny,velocity:speed,t_ms:now});
        this.lastTrigger.set(regionKey,now);
      }
      if(inside)this.active.set(regionKey,true);
      else{
        this.active.delete(regionKey);
        if(was||swept)events.push({kind:'EXIT',id:field.id,mode:this.mode,pointer:key,
          x:nx,y:ny,velocity:speed,t_ms:now});
      }
    }
    this.points.set(key,{x:nx,y:ny,t:now});
    this.totalEvents+=events.length;
    return events;
  }
  stats(){return {mode:this.mode,activePointers:this.points.size,events:this.totalEvents,
    pathLength:this.pathLength,speed:this.lastVelocity};}
}
