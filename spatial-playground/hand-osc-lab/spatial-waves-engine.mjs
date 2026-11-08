// Spatial Waves 01: original three-dimensional gesture-to-sound field.
// Shared local WebXR coordinates (meters): X horiz, Y vertical, Z away from user.
export const VOLUMES=Object.freeze([
 {id:'pulse',name:'PULSE / IMPULSE',center:[-.29,-.13,-.63],radius:.17,color:[.81,.90,.73],role:'sub rhythmic displacement'},
 {id:'mineral',name:'MINERAL / RESONATOR',center:[.27,-.13,-.63],radius:.17,color:[.85,.74,.51],role:'inharmonic metallic attacks'},
 {id:'air',name:'AIR / SPECTRUM',center:[-.22,.18,-.90],radius:.18,color:[.57,.80,.92],role:'noise / spatial pressure'},
 {id:'harmonic',name:'HARMONIC / BODY',center:[.24,.18,-.90],radius:.18,color:[.80,.67,.86],role:'harmonic texture / chord'}
]);
const finitePoint=p=>Array.isArray(p)&&p.length>=3&&p.slice(0,3).every(Number.isFinite);
export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,Number.isFinite(v)?v:a));
export const distance=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);
export const nearestVolume=p=>{
 if(!finitePoint(p))return null;
 let closest=null;
 for(const vol of VOLUMES){
  const d=distance(p,vol.center);
  if(!closest||d<closest.distance)closest={zone:vol,distance:d};
 }
 return closest;
};
export class VolumetricContact{
 constructor({dwellMs=60,hysteresis=.025,cooldownMs=75}={}){
  this.dwellMs=dwellMs;this.hysteresis=hysteresis;this.cooldownMs=cooldownMs;this.states=new Map();
 }
 reset(){this.states.clear();}
 update(hand,p,now){
  const prev=this.states.get(hand)||{active:null,candidate:null,since:now,lastTransition:-Infinity};
  const events=[];
  if(!finitePoint(p)){
   if(prev.active)events.push({kind:'EXIT',hand,zone:prev.active,t_ms:now,reason:'TRACK_LOST'});
   this.states.delete(hand);return events;
  }
  const nearest=nearestVolume(p);
  const activeZone=VOLUMES.find(x=>x.id===prev.active);
  const stillInside=activeZone&&distance(p,activeZone.center)<activeZone.radius+this.hysteresis;
  if(prev.active&&!stillInside){
   events.push({kind:'EXIT',hand,zone:prev.active,t_ms:now,reason:'OUTSIDE'});
   prev.active=null;prev.candidate=null;prev.lastTransition=now;
  }
  if(!prev.active&&nearest.distance<nearest.zone.radius-.012){
   if(prev.candidate!==nearest.zone.id){prev.candidate=nearest.zone.id;prev.since=now;}
   if(now-prev.since>=this.dwellMs&&now-prev.lastTransition>=this.cooldownMs){
    prev.active=nearest.zone.id;prev.candidate=null;prev.lastTransition=now;
    events.push({kind:'ENTER',hand,zone:prev.active,t_ms:now,position:p.slice(0,3),
      depth:clamp(1-nearest.distance/nearest.zone.radius)});
   }
  } else if(!prev.active)prev.candidate=null;
  this.states.set(hand,prev);return events;
 }
 active(){return [...new Set([...this.states.values()].map(x=>x.active).filter(Boolean))];}
}
export function controlFromHands(hands){
 const pts=[];
 for(const side of ['left','right']){
  const v=hands?.[side]?.positions?.[9];
  if(finitePoint(v))pts.push({side,p:v});
 }
 if(!pts.length)return {tracked:0,depth:0,spread:.4,energy:0,focus:0};
 const p=pts[0].p;
 const d=clamp((-p[2]-.32)/.8);
 const spread=pts.length===2?clamp((distance(pts[0].p,pts[1].p)-.10)/.72):.5;
 let pinch=Infinity;
 for(const {side} of pts){
  const hand=hands[side]?.positions;
  const thumb=hand?.[4],index=hand?.[9];
  if(finitePoint(thumb)&&finitePoint(index))pinch=Math.min(pinch,distance(thumb,index));
 }
 return {tracked:pts.length,depth:d,spread,energy:clamp((.052-pinch)/.042),
   focus:clamp((p[1]+.32)/.75),position:p.slice(0,3)};
}
export function visualGeometry(time,energy=0,spread=.5){
 const rings=[],bridges=[],shells=[];
 for(const vol of VOLUMES){
  const R=vol.radius*(1+energy*.32),n=32;
  for(let layer=0;layer<3;layer++){
   const rr=R*(.62+layer*.28);
   const pts=[];
   for(let k=0;k<=n;k++){
    const a=k*2*Math.PI/n,offset=Math.sin(time*.0004+a*4+layer)*.035*energy;
    // Three distinct orthogonal rings demonstrate actual depth.
    pts.push(layer===0?
      [vol.center[0]+(rr+offset)*Math.cos(a),vol.center[1]+(rr+offset)*Math.sin(a),vol.center[2]]:
      layer===1?[vol.center[0]+(rr+offset)*Math.cos(a),vol.center[1],vol.center[2]+(rr+offset)*Math.sin(a)]:
      [vol.center[0],vol.center[1]+(rr+offset)*Math.cos(a),vol.center[2]+(rr+offset)*Math.sin(a)]);
   }
   rings.push({zone:vol.id,color:vol.color,points:pts});
  }
  // Three-dimensional geodesic-like contours; not 2D screen-space overlays.
  // Keep sparse enough to preserve real headset frame budget.
  for(let latitude=1;latitude<=5;latitude++){
   const theta=latitude*Math.PI/6,points=[];
   for(let k=0;k<=28;k++){
    const phi=k*2*Math.PI/28;
    const pulse=1+energy*.055*Math.sin(time*.0007+phi*5+latitude);
    points.push([
     vol.center[0]+R*Math.sin(theta)*Math.cos(phi)*pulse,
     vol.center[1]+R*Math.cos(theta)*pulse,
     vol.center[2]+R*Math.sin(theta)*Math.sin(phi)*pulse
    ]);
   }
   shells.push({zone:vol.id,color:vol.color,points,kind:'LATITUDE'});
  }
  for(let meridian=0;meridian<7;meridian++){
   const phi=meridian*2*Math.PI/7,points=[];
   for(let k=0;k<=22;k++){
    const theta=k*Math.PI/22,phase=Math.sin(time*.0005+k*.25+meridian)*.017*energy;
    points.push([
     vol.center[0]+(R+phase)*Math.sin(theta)*Math.cos(phi),
     vol.center[1]+(R+phase)*Math.cos(theta),
     vol.center[2]+(R+phase)*Math.sin(theta)*Math.sin(phi)
    ]);
   }
   shells.push({zone:vol.id,color:vol.color,points,kind:'MERIDIAN'});
  }
 }
 const pair=[[0,2],[1,3],[0,1],[2,3]];
 for(const [a,b] of pair){
  const p=VOLUMES[a].center,q=VOLUMES[b].center;
  const steps=14,points=[];
  for(let j=0;j<=steps;j++){
   const t=j/steps,offset=Math.sin(t*Math.PI)*.13*(spread-.5);
   points.push([p[0]*(1-t)+q[0]*t,p[1]*(1-t)+q[1]*t+offset,
     p[2]*(1-t)+q[2]*t-.09*Math.sin(t*Math.PI)]);
  }
  bridges.push({a:VOLUMES[a].id,b:VOLUMES[b].id,points});
 }
 return {rings,bridges,shells};
}
