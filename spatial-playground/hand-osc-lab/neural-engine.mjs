// Neural Field 01. Schematic cortical-surface scaffold and ORIGINAL simulated signal.
// Scalp EEG = large-scale synchronized population potentials, NOT observed single-neuron firings.
export const BANDS=Object.freeze([
 {id:'theta',range:'4–8 Hz',hz:6,role:'slow envelope'},
 {id:'alpha',range:'8–13 Hz',hz:10,role:'spatial breathing'},
 {id:'beta',range:'13–30 Hz',hz:18,role:'short modulations'},
 {id:'gamma',range:'30–80 Hz',hz:38,role:'display-only spectral texture'}
]);
export const MODES=Object.freeze(['STRUCTURE','SIGNAL','SECTION','ELECTRODES']);
export const REGIONS=Object.freeze([
 {id:'frontal',name:'FRONTAL / 前部',x:0,y:.18,z:.17},
 {id:'parietal',name:'PARIETAL / 顶部',x:0,y:.25,z:-.08},
 {id:'temporal',name:'TEMPORAL / 侧部',x:.22,y:-.065,z:.02},
 {id:'occipital',name:'OCCIPITAL / 后部',x:0,y:.03,z:-.26}
]);
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const seeded=n=>{const v=Math.sin(n*127.135+13.73)*9387.37;return v-Math.floor(v);};
const center=[0,.00,-.77];
export function generateSurface({rings=11,segments=18}={}){
  if(rings<4||segments<8||rings>32||segments>72)throw Error('bounded wire mesh only');
  const vertices=[],edges=[];
  for(const side of [-1,1]){
    const start=vertices.length;
    for(let v=0;v<=rings;v++){
      const phi=Math.PI*(.06+.88*v/rings);
      for(let u=0;u<segments;u++){
        const theta=2*Math.PI*u/segments;
        const ripple=1+.055*Math.sin(theta*6+phi*11)+.033*Math.sin(theta*13-phi*7);
        const x=side*(.038+.22*Math.sin(phi)*Math.max(.07,Math.abs(Math.cos(theta)))*ripple);
        const yy=.195*Math.cos(phi)+.02*Math.sin(theta*3+phi*4);
        const zz=.245*Math.sin(phi)*Math.sin(theta)*ripple;
        // Designed geometry, not a real anatomy mesh or electrode localization.
        vertices.push([center[0]+x,center[1]+yy,center[2]+zz]);
        if(u>0)edges.push([start+v*segments+u-1,start+v*segments+u]);
        if(v>0)edges.push([start+(v-1)*segments+u,start+v*segments+u]);
      }
      edges.push([start+v*segments+segments-1,start+v*segments]);
    }
  }
  return {vertices,edges};
}
export const SURFACE=generateSurface();
export const ELECTRODES=Object.freeze(Array.from({length:16},(_,i)=>{
  const a=i*Math.PI*2/16;
  return {id:'S'+String(i+1).padStart(2,'0'),
    position:[Math.cos(a)*.256,Math.sin(a)*.168,center[2]+.045*Math.cos(a*2)]};
})); // illustrative positions ONLY; not a standard 10-20 montage
export function fakeBand(t,band='alpha',seed=0){
 const b=BANDS.find(x=>x.id===band);
 if(!b)throw Error('Unknown band');
 // Deterministic simulation, slowed visualization envelope: not a sampled EEG trace.
 const p=t*.001;
 return clamp(.52+
    .28*Math.sin(p*(.25+b.hz*.035)+seed*.73)+
    .13*Math.sin(p*(.82+b.hz*.009)+seed*2.7));
}
export function assignState(previous,action){
 const state={...previous};
 switch(action.type){
  case 'MODE':
    if(!MODES.includes(action.mode))return previous;
    state.mode=action.mode;break;
  case 'BAND':
    if(!BANDS.some(x=>x.id===action.band))return previous;
    state.band=action.band;break;
  case 'REGION':
    if(!REGIONS.some(x=>x.id===action.region))return previous;
    state.region=action.region;break;
  case 'FOCUS':state.focus=clamp(action.value);break;
  case 'SPREAD':state.spread=clamp(action.value);break;
  case 'INTENSITY':state.intensity=clamp(action.value);break;
  case 'ACTIVE':state.active=Boolean(action.value);break;
  case 'PANIC':state.active=false;state.intensity=0;break;
  default:return previous;
 }
 return state;
}
export const INITIAL=Object.freeze({mode:'STRUCTURE',band:'alpha',region:'frontal',
 focus:.35,spread:.52,intensity:.45,active:false,source:'SYNTHETIC'});
export function signalSnapshot(state,t){
 const envelope=fakeBand(t,state.band,REGIONS.findIndex(r=>r.id===state.region)+1);
 return {source:'SYNTHETIC',band:state.band,region:state.region,
  envelope,brightness:clamp(.15+state.intensity*.40+envelope*.43),
  cutoff:clamp(.15+state.focus*.65+envelope*.12),
  wet:clamp(.08+state.spread*.67),
  activity:clamp(envelope*state.intensity),t_ms:t};
}
export function mapJointGesture(hands){
 const right=hands?.right?.positions,left=hands?.left?.positions;
 const hand=right||left;const tip=hand?.[9],thumb=hand?.[4];
 if(!Array.isArray(tip)||!tip.slice(0,3).every(Number.isFinite))return {tracked:0};
 const pinch=Array.isArray(thumb)&&thumb.slice(0,3).every(Number.isFinite)?
 Math.hypot(tip[0]-thumb[0],tip[1]-thumb[1],tip[2]-thumb[2]):Infinity;
 const other=(hand===right?left:right)?.[9];
 const spread=Array.isArray(other)&&other.slice(0,3).every(Number.isFinite)?
 clamp((Math.hypot(tip[0]-other[0],tip[1]-other[1],tip[2]-other[2])-.13)/.65):null;
 return {tracked:(right?1:0)+(left?1:0),pinched:pinch<.035,
  focus:clamp((.045-pinch)/.033),
  x:clamp(.5+tip[0]/1.0),y:clamp((.27-tip[1])/.56),
  spread,world:tip};
}
export function nearestRegion(x,y){
 const flat=[
 {id:'frontal',x:.40,y:.36},{id:'parietal',x:.55,y:.29},
 {id:'temporal',x:.68,y:.58},{id:'occipital',x:.53,y:.73}
 ];
 let found=null,best=.155;
 for(const r of flat){const d=Math.hypot(x-r.x,y-r.y);if(d<best){best=d;found=r.id;}}
 return found;
}
