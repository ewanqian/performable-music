// Spatial OSC Lab: data and zone engine, zero dependencies.
// WebXR Hand Input has 25 joints per hand. Finger flexion is DERIVED from 3D points.
export const JOINTS=[
  "wrist",
  "thumb-metacarpal","thumb-phalanx-proximal","thumb-phalanx-distal","thumb-tip",
  "index-finger-metacarpal","index-finger-phalanx-proximal","index-finger-phalanx-intermediate","index-finger-phalanx-distal","index-finger-tip",
  "middle-finger-metacarpal","middle-finger-phalanx-proximal","middle-finger-phalanx-intermediate","middle-finger-phalanx-distal","middle-finger-tip",
  "ring-finger-metacarpal","ring-finger-phalanx-proximal","ring-finger-phalanx-intermediate","ring-finger-phalanx-distal","ring-finger-tip",
  "pinky-finger-metacarpal","pinky-finger-phalanx-proximal","pinky-finger-phalanx-intermediate","pinky-finger-phalanx-distal","pinky-finger-tip"
];
export const BONES=[
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],[8,9],
  [0,10],[10,11],[11,12],[12,13],[13,14],
  [0,15],[15,16],[16,17],[17,18],[18,19],
  [0,20],[20,21],[21,22],[22,23],[23,24],
  [5,10],[10,15],[15,20]
];
export const ANGLES=[
  ["thumb-proximal",1,2,3],["thumb-distal",2,3,4],
  ["index-mcp",5,6,7],["index-pip",6,7,8],["index-dip",7,8,9],
  ["middle-mcp",10,11,12],["middle-pip",11,12,13],["middle-dip",12,13,14],
  ["ring-mcp",15,16,17],["ring-pip",16,17,18],["ring-dip",17,18,19],
  ["pinky-mcp",20,21,22],["pinky-pip",21,22,23],["pinky-dip",22,23,24]
];
// Coordinates are [x,y,z] in the SAME XRReferenceSpace as the zones.
// Angles: 0 means a collinear/straight three-point chain, 180 is fully reversed.
// This is geometric bend, NOT an anatomically calibrated joint angle.
export function bendDeg(a,b,c){
  if(!a||!b||!c)return null;
  const x=a.map((v,i)=>v-b[i]),y=c.map((v,i)=>v-b[i]);
  const n=Math.hypot(...x)*Math.hypot(...y);
  if(n<1e-8)return null;
  const cos=Math.max(-1,Math.min(1,x.reduce((s,v,i)=>s+v*y[i],0)/n));
  return 180-Math.acos(cos)*180/Math.PI;
}
export function handAngles(positions){
  const result={};
  for(const [name,a,b,c] of ANGLES)result[name]=bendDeg(positions[a],positions[b],positions[c]);
  return result;
}
export function distance(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
export function createZones(){
 return [
   {id:"A",name:"LEFT FIELD",center:[-.27,-.28,-.55],radius:.135},
   {id:"B",name:"RIGHT FIELD",center:[.27,-.28,-.55],radius:.135},
   {id:"C",name:"CENTER TRIGGER",center:[0,-.19,-.79],radius:.12}
 ];
}
export class ZoneEngine {
  constructor(zones=createZones(), options={}){
    this.zones=zones;
    this.enterMargin=options.enterMargin??.009; // default enter needs 9mm deeper
    this.exitMargin=options.exitMargin??.014;  // default exit needs 14mm farther
    this.dwellMs=options.dwellMs??34;         // about 3 frames at 90Hz
    this.missingMs=options.missingMs??150;
    this.states=new Map();
  }
  update(hand,point,now){
    const events=[];
    for(const z of this.zones){
      const key=hand+":"+z.id;
      let s=this.states.get(key);
      if(!s){s={inside:false,pending:null,since:now,lastSeen:now};this.states.set(key,s);}
      if(!point){
        if(now-s.lastSeen>=this.missingMs){
          // Loss of tracking is UNKNOWN, never fabricate an EXIT.
          if(s.inside||s.pending!==null)events.push({zone:z.id,hand,type:"TRACKING_LOST",t_ms:now});
          s.inside=false;s.pending=null;s.lastSeen=now;
        }
        continue;
      }
      s.lastSeen=now;
      const d=distance(point,z.center);
      const goal=s.inside ? d<(z.radius+this.exitMargin) : d<(z.radius-this.enterMargin);
      if(goal===s.inside){s.pending=null;continue;}
      if(s.pending!==goal){s.pending=goal;s.since=now;continue;}
      if(now-s.since>=this.dwellMs){
        s.inside=goal;s.pending=null;
        events.push({zone:z.id,hand,type:goal?"ENTER":"EXIT",t_ms:now,distance_m:+d.toFixed(4)});
      }
    }
    return events;
  }
  reset(){this.states.clear();}
}
