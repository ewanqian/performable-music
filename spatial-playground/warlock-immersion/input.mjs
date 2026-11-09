import {JOINTS,bendDeg} from '../hand-osc-lab/engine.mjs';
import {StableHand} from '../hand-osc-lab/gesture-stability.mjs';
import {valid,norm,sub,add,mul,dist,clamp} from './core.mjs';
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function analyse(points,held='neutral'){
 if(!points||![0,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24].every(i=>valid(points[i])))return null;
 const bends={index:bendDeg(points[6],points[7],points[8]),middle:bendDeg(points[11],points[12],points[13]),ring:bendDeg(points[16],points[17],points[18]),pinky:bendDeg(points[21],points[22],points[23])};
 if(Object.values(bends).some(x=>!Number.isFinite(x)))return null;
 const extend=n=>bends[n]<58,curl=n=>bends[n]>52;
 const gap=dist(points[9],points[14]),spread=dist(points[9],points[24]);
 const sword=extend('index')&&extend('middle')&&curl('ring')&&curl('pinky')&&gap<.096;
 const open=Object.keys(bends).every(extend)&&spread>.075;
 const fist=Object.keys(bends).every(curl);
 const kind=sword?'sword':open?'open':fist?'fist':'neutral';
 const palm=[5,10,15,20].reduce((p,i)=>add(p,points[i]),[0,0,0]).map(v=>v/4);
 const fingertip=mul(add(points[9],points[14]),.5),base=mul(add(points[6],points[11]),.5);
 const direction=norm(sub(fingertip,base));
 const shaft=norm(sub(points[10],points[0])),across=norm(sub(points[20],points[5]));
 const normal=norm(cross(across,shaft));
 // The shared stabilizer uses a wide spread for OPEN, and index-middle separation for SWORD.
 return {kind,bends,tipGap:open?spread:gap,palm,shaft,normal,point:kind==='sword'||held==='sword'&&kind==='neutral'?fingertip:palm,direction};
}
export class HandInput {
 constructor(){this.tracks={left:new StableHand({neutralExitMs:260}),right:new StableHand({neutralExitMs:260})};this.buffers={left:new Float32Array(400),right:new Float32Array(400)};this.metadata={};}
 reset(){for(const t of Object.values(this.tracks))t.reset();this.metadata={};}
 read(frame,session,reference,transform,viewer,time){
 const output={left:null,right:null};const seen=new Set();
 for(const source of session.inputSources){const side=source.handedness;if(!source.hand||!this.tracks[side])continue;seen.add(side);
  const spaces=JOINTS.map(n=>source.hand.get(n)),points=Array(25).fill(null),buf=this.buffers[side];let bulk=false;
  try{if(spaces.every(Boolean)&&frame.fillPoses)bulk=frame.fillPoses(spaces,reference,buf);}catch{}
  if(bulk)for(let i=0;i<25;i++)points[i]=[buf[i*16+12],buf[i*16+13],buf[i*16+14]];
  else for(let i=0;i<25;i++){if(!spaces[i])continue;const p=frame.getJointPose(spaces[i],reference)?.transform.position;if(p)points[i]=[p.x,p.y,p.z];}
  const raw=analyse(points,this.tracks[side].kind);
  const sample=raw?{...raw,point:transform.point(raw.point),direction:transform.direction(raw.direction)}:null;
  const stable=this.tracks[side].update(sample,time);
  if(raw){const palm=transform.point(raw.palm),normal=transform.direction(raw.normal),shaft=transform.direction(raw.shaft),toEye=norm(sub(viewer.position,palm));this.metadata[side]={palm,normal,shaft,facing:Math.abs(dot(normal,toEye))>.45&&dot(norm(sub(palm,viewer.position)),viewer.forward)>.55};}
  if(stable)output[side]={...stable,...this.metadata[side],hand:side};
 }
 for(const side of ['left','right'])if(!seen.has(side)){const stable=this.tracks[side].update(null,time);if(stable)output[side]={...stable,...this.metadata[side],hand:side,facing:false};}
 return output;
 }
}
export class SchoolWheel {
 constructor(){this.reset();}
 reset(){this.active=false;this.since=null;this.lost=null;this.grip=null;this.choice=-1;this.candidate=-1;this.candidateAt=0;this.blockUntil=0;}
 update(left,right,time){let selected=null;
 const open=left?.kind==='open'&&left.facing&&!left.stale;
 if(open){this.lost=null;if(this.since===null)this.since=time;if(time-this.since>=180)this.active=true;}
 else{this.since=null;if(this.lost===null)this.lost=time;if(time-this.lost>240&&!this.grip)this.active=false;}
 if(this.active){
  if(right?.kind==='fist'&&!right.stale){
   if(!this.grip){this.grip=right.palm.slice();this.choice=-1;this.candidate=-1;}
   const dx=right.palm[0]-this.grip[0],dy=right.palm[1]-this.grip[1];
   const next=Math.hypot(dx,dy)<.07?-1:((Math.round((Math.PI/2-Math.atan2(dy,dx))/(Math.PI/3))%6)+6)%6;
   if(next!==this.candidate){this.candidate=next;this.candidateAt=time;}
   if(time-this.candidateAt>70)this.choice=next;
  }else if(this.grip){if(right&&!right.stale&&this.choice>=0)selected=this.choice;this.grip=null;this.choice=-1;this.candidate=-1;this.blockUntil=time+260;}
 }
 return {active:this.active,choice:this.choice,candidate:this.candidate,anchor:this.grip,selected,suppress:this.active||time<this.blockUntil};
 }
}
