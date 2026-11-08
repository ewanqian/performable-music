// LAB05 spatial score: shared, testable geometry for desktop pointer and Quest XR.
// Coordinate contract: normalized x/y; XR working plane uses x=(x-.5)*1.2,
// y=.28-y*.72, z=-.61. A 2D canvas uses the exact same x/y centers.
import {hitSegmentCircle} from './organic-engine.mjs';
export const SCORE_ZONES=Object.freeze([
 {id:'pulse',name:'PULSE',x:.125,y:.42,r:.115,color:'#8ee5ad',sound:'Sub / Kick'},
 {id:'metal',name:'METAL',x:.375,y:.517,r:.115,color:'#e8bb81',sound:'Snare / Resonance'},
 {id:'shimmer',name:'SHIMMER',x:.625,y:.472,r:.115,color:'#a7c8ff',sound:'Hi-hats / Particles'},
 {id:'chord',name:'DRONE',x:.875,y:.351,r:.115,color:'#ddc3ff',sound:'Harmony / Field'}
]);
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,finite(v)?v:a));
export class SpatialScoreMap{
 constructor({dwellMs=55,releaseMargin=.023}={}){this.dwellMs=dwellMs;this.releaseMargin=releaseMargin;this.reset();}
 reset(){this.states=new Map();this.totalHits=0;}
 nearest(x,y){
   if(!finite(x)||!finite(y))return null;
   const found=SCORE_ZONES.map(z=>({zone:z,distance:Math.hypot(x-z.x,y-z.y)}))
      .sort((a,b)=>a.distance-b.distance)[0];
   return found;
 }
 move(pointer,x,y,now,{immediate=false}={}){
   const key=String(pointer);if(!finite(x)||!finite(y))return this.end(key,now);
   const pos={x:clamp(x),y:clamp(y)},prev=this.states.get(key);
   let state=prev||{selected:null,candidate:null,since:now,last:null};
   const near=this.nearest(pos.x,pos.y);
   const previousZone=state.selected&&SCORE_ZONES.find(z=>z.id===state.selected);
   const keep=previousZone&&Math.hypot(pos.x-previousZone.x,pos.y-previousZone.y)<previousZone.r+this.releaseMargin;
   const inside=near&&near.distance<near.zone.r-.010;
   const events=[];
   if(state.selected&&!keep){
     events.push({kind:'EXIT',id:state.selected,x:pos.x,y:pos.y,t_ms:now});
     state.selected=null;state.candidate=null;
   }
   if(!state.selected&&inside){
     if(state.candidate!==near.zone.id){state.candidate=near.zone.id;state.since=now;}
     const swept=state.last&&hitSegmentCircle(state.last.x,state.last.y,pos.x,pos.y,near.zone.x,near.zone.y,near.zone.r);
     if(immediate||now-state.since>=this.dwellMs||swept&&immediate){
       state.selected=near.zone.id;state.candidate=null;this.totalHits++;
       events.push({kind:'ENTER',id:near.zone.id,x:pos.x,y:pos.y,
         intensity:clamp(state.last?Math.hypot(state.last.x-pos.x,state.last.y-pos.y)*13:.55,.25,1),t_ms:now});
     }
   }else if(!inside)state.candidate=null;
   state.last=pos;this.states.set(key,state);
   return events;
 }
 end(pointer,now){
   const key=String(pointer),state=this.states.get(key),events=[];
   if(state?.selected)events.push({kind:'EXIT',id:state.selected,t_ms:now});
   this.states.delete(key);return events;
 }
 active(){return [...new Set([...this.states.values()].map(s=>s.selected).filter(Boolean))];}
}
export function getScorePositionFromXR(tip){
 if(!Array.isArray(tip)||tip.length<3||!tip.every(finite))return null;
 // Reject fingers clearly outside the local working slab; no false triggers
 // when reaching behind the head or to the controller/menu.
 if(tip[2]<-.93||tip[2]>-.29)return null;
 return {x:clamp(.5+tip[0]/1.2),y:clamp((.28-tip[1])/.72)};
}
export function scoreWorldPosition(zone){
 return [(zone.x-.5)*1.2,.28-zone.y*.72,-.61];
}
