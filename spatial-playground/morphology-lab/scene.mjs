import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {description} from './experiments.mjs';

// Real WebGL geometry in metre-like world units. No billboard canvas masquerading as 3D.
// Slow continuous light envelopes are deliberately bounded; no full-field strobe.
const ink=0xbabfbb,ivory=0xe9e7df,secondary=0x737b76,gold=0xb9a991,pink=0xcfadb4;
const PI=Math.PI,TAU=PI*2;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const mix=(a,b,k)=>a+(b-a)*k;
const frac=v=>v-Math.floor(v);
const rnd=i=>frac(Math.sin(i*91.337+12.47)*31536.87);
const vec=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const pol=(r,a,y=0)=>vec(Math.cos(a)*r,y,Math.sin(a)*r);
const color=hex=>new THREE.Color(hex);
const sharedSphere=new THREE.SphereGeometry(1,12,8);
const mat=(hex=ivory,opacity=1)=>new THREE.MeshStandardMaterial({
  color:hex,roughness:.72,metalness:.15,transparent:opacity<1,opacity,depthWrite:opacity>=1
});
const lineMat=(hex=ink,alpha=.65)=>new THREE.LineBasicMaterial({color:hex,transparent:true,opacity:alpha,depthWrite:false});
function line(points,hex=ink,opacity=.64){
 const g=new THREE.BufferGeometry().setFromPoints(points);
 return new THREE.Line(g,lineMat(hex,opacity));
}
function tube(points,radius=.014,hex=ink,opacity=1){
 if(points.length<2)return null;
 const curve=new THREE.CatmullRomCurve3(points);
 return new THREE.Mesh(new THREE.TubeGeometry(curve,Math.min(64,points.length*3),radius,5,false),mat(hex,opacity));
}
function sphere(parent,r,pos,hex=ivory){
 const mesh=new THREE.Mesh(sharedSphere,mat(hex));
 mesh.position.copy(pos);mesh.scale.setScalar(r);parent.add(mesh);return mesh;
}
function lineLoop(parent,points,hex=ink,alpha=.55){parent.add(line([...points,points[0]],hex,alpha))}
function randVec(seed){
 const a=rnd(seed*13)*TAU,z=rnd(seed*17+1)*2-1,rr=Math.sqrt(1-z*z);
 return vec(Math.cos(a)*rr,z,Math.sin(a)*rr);
}
function temporal(type,t,index,count,rate){
 const ph=t*rate*TAU,offset=index/count*TAU;
 switch(type){
 case 'constant':return .54;
 case 'sine':return .5+.33*Math.sin(ph);
 case 'phase':return .48+.38*Math.sin(ph-offset);
 case 'alternate':return .5+.3*Math.cos(ph+(index%2)*PI);
 case 'ramp':return .24+.6*(.5-.5*Math.cos(ph));
 case 'impulse':{ // 100 BPM: ~1.67 rounded beat envelopes per second
  const beat=frac(t*1.6666667),pulse=Math.exp(-beat*5);
  return .22+.48*pulse;
 }
 case 'depth':return .5+.32*Math.sin(ph+(index%3)*2.1);
 case 'relay':return .22+.58*Math.exp(-Math.pow(Math.atan2(Math.sin(ph-offset),Math.cos(ph-offset))*2.0,2));
 case 'release':return .15+.6*(.5+.5*Math.cos(ph));
 default:return .45;
 }
}
function brightness(method,p,center,t){
 const d=p.distanceTo(center),r=p.length(),a=Math.atan2(p.z,p.x);
 switch(method){
 case 'distance':return 1/(1+d*d*1.9);
 case 'depth':return .20+.75*clamp((p.z+1.8)/3.6);
 case 'spot':return Math.pow(Math.max(0,p.clone().normalize().dot(vec(.25,.9,.4).normalize())),3);
 case 'rim':return .25+.75*Math.abs(Math.sin(a*2));
 case 'cluster':return .45+.5*Math.max(0,Math.cos(d*4));
 case 'emission':return (Math.sin(p.x*8+p.y*4)>0)?.78:.22;
 case 'occlusion':return p.y>0?.78:.22;
 case 'fog':return Math.exp(-Math.abs(p.z+.6)*1.9);
 case 'tone':return Math.sqrt(1/(1+d*.8));
 default:return .55;
 }
}
function gridGroup(){
 const g=new THREE.Group(),material=lineMat(0x535f56,.14);
 for(let i=-5;i<=5;i++){
  g.add(line([vec(i*.35,-1.52,-1.8),vec(i*.35,-1.52,1.8)],0x566058,.18));
  g.add(line([vec(-1.75,-1.52,i*.35),vec(1.75,-1.52,i*.35)],0x566058,.18));
 }
 return g;
}
function sectionArcs(parent,radius=.9,steps=26){
 for(let axis=0;axis<3;axis++){
  const pts=[];for(let i=0;i<=80;i++){
   const a=i*TAU/80;
   pts.push(axis===0?vec(radius*Math.cos(a),radius*Math.sin(a),0):
     axis===1?vec(0,radius*Math.cos(a),radius*Math.sin(a)):
     vec(radius*Math.cos(a),0,radius*Math.sin(a)));
  }
  parent.add(line(pts,axis===0?gold:ink,.20+axis*.07));
 }
}
export class MorphologyStage{
 constructor(canvas,onMetrics=()=>{}){
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
  this.renderer.setClearColor(0x090c0b);
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure=1.15;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x090c0b);
  this.scene.fog=new THREE.FogExp2(0x090c0b,.095);
  this.camera=new THREE.PerspectiveCamera(38,1,.02,80);
  this.camera.position.set(3.65,2.48,4.6);this.camera.lookAt(0,0,0);
  this.controls=new OrbitControls(this.camera,canvas);
  this.controls.enableDamping=true;this.controls.dampingFactor=.08;this.controls.minDistance=1.6;this.controls.maxDistance=12;
  this.controls.target.set(0,0,0);
  this.scene.add(new THREE.HemisphereLight(0xbac6bb,0x121915,1.25));
  this.key=new THREE.PointLight(0xdce7d5,25,11,1.7);this.key.position.set(-1.7,2.8,2);this.scene.add(this.key);
  this.fill=new THREE.PointLight(0xd0c0ad,16,8,1.8);this.fill.position.set(2,-.2,-2);this.scene.add(this.fill);
  this.floor=gridGroup();this.scene.add(this.floor);
  this.group=null;this.animated=[];this.selection=null;this.onMetrics=onMetrics;
  this.family='objects';this.index=0;this.energy=.52;this.complexity=.56;this.depth=.62;this.bpm=100;
  this.paused=false;this.last=0;this.stopped=false;this.seed=18;
  this._frame=(t)=>{if(this.stopped)return;requestAnimationFrame(this._frame);
    const delta=Math.min(.08,Math.max(0,(t-this.last)*.001));this.last=t;
    const rect=canvas.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height);
    const pixelW=Math.floor(w*Math.min(devicePixelRatio||1,1.7)),pixelH=Math.floor(h*Math.min(devicePixelRatio||1,1.7));
    if(canvas.width!==pixelW||canvas.height!==pixelH){this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
    this.controls.update();
    if(!this.paused){
      const seconds=t*.001;
      for(const action of this.animated)action(seconds,delta,this.energy);
    }
    this.renderer.render(this.scene,this.camera);
  };
  requestAnimationFrame(this._frame);
 }
 disposeGroup(){
  if(!this.group)return;
  this.scene.remove(this.group);
  const materials=new Set(),geometries=new Set();
  this.group.traverse(o=>{
   if(o.geometry&&o.geometry!==sharedSphere)geometries.add(o.geometry);
   if(o.material){
    const ms=Array.isArray(o.material)?o.material:[o.material];
    for(const m of ms)materials.add(m);
   }
  });
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  this.animated=[];this.group=null;
 }
 setStudy(family,index){
  const p=description(family,index);if(!p)return;
  this.family=family;this.index=index;this.selection=p;
  this.disposeGroup();this.additional=null;const g=this.group=new THREE.Group();
  g.scale.setScalar(.82+this.depth*.36);
  this.scene.add(g);
  if(family==='light')this.buildLight(g,p);
  if(family==='brightness')this.buildBrightness(g,p);
  if(family==='objects')this.buildObjects(g,p);
  if(family==='neuron')this.buildNeuron(g,p);
  if(family==='physarum')this.buildPhysarum(g,p);
  if(family==='sakura')this.buildSakura(g,p);
  const metrics={geometries:0,meshes:0,segments:0,vertices:0,lights:0};
  g.traverse(o=>{
   if(o.isMesh)metrics.meshes++;
   if(o.isLight)metrics.lights++;
   if(o.geometry){metrics.geometries++;metrics.vertices+=o.geometry.attributes?.position?.count||0;
    metrics.segments+=o.isLine?Math.max(0,(o.geometry.attributes?.position?.count||0)-1):0;}
  });
  this.onMetrics(metrics);
 }
 buildLight(g,p){
  const pods=[];sectionArcs(g,.84);
  const count=8+Math.round(this.complexity*12);
  for(let i=0;i<count;i++){
   const a=i/count*TAU,pos=pol(1.1,a,Math.sin(a*2)*.54);
   const housing=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.38,10),mat(0x344038));
   housing.position.copy(pos);housing.quaternion.setFromUnitVectors(vec(0,1,0),pos.clone().normalize());
   g.add(housing);
   const glow=new THREE.Mesh(new THREE.SphereGeometry(.085,12,8),new THREE.MeshStandardMaterial({
    color:ivory,emissive:0xd9d4c7,emissiveIntensity:.45,roughness:.75
   }));
   glow.position.copy(pos);g.add(glow);pods.push(glow);
   if(i>0)g.add(line([pods[i-1].position,glow.position],secondary,.24));
  }
  g.add(line([pods.at(-1).position,pods[0].position],secondary,.24));
  const a=p.params;
  this.animated.push((time,dt,energy)=>{
    pods.forEach((mesh,i)=>{
     const v=temporal(p.method,time,i,pods.length,a.rate);
     mesh.material.emissiveIntensity=.13+.65*v*energy;
     mesh.scale.setScalar(.65+.40*v);
    });
    g.rotation.y=Math.sin(time*.09)*.06;
  });
 }
 buildBrightness(g,p){
  const material=new THREE.MeshStandardMaterial({color:0x667168,metalness:.46,roughness:.34,flatShading:true});
  const body=new THREE.Mesh(new THREE.IcosahedronGeometry(.94,2),material);g.add(body);
  const wire=new THREE.LineSegments(new THREE.WireframeGeometry(body.geometry),lineMat(ivory,.23));g.add(wire);
  const samples=[];
  for(let i=0;i<25+Math.round(this.complexity*65);i++){
   const v=randVec(i+6).multiplyScalar(1.01);
   const dot=sphere(g,.027,v,gold);dot.material=new THREE.MeshStandardMaterial({
    color:0xa5a79f,emissive:0xe7e3cf,emissiveIntensity:.2,roughness:.45});
   samples.push(dot);
  }
  sectionArcs(g,1.27);
  const light=new THREE.PointLight(0xf1ead7,18,6,1.7);light.position.set(-1.2,1.5,2.1);g.add(light);
  this.animated.push((time,dt,energy)=>{
   for(const node of samples){
    const v=brightness(p.method,node.position,light.position,time);
    node.material.emissiveIntensity=.07+.93*v*energy;
    node.scale.setScalar(.015+.019*v);
   }
   wire.material.opacity=.10+.24*energy;
   light.intensity=8+energy*12;
   body.rotation.y=time*.045;
   wire.rotation.y=body.rotation.y;
   if(p.method==='occlusion')light.position.set(Math.cos(time*.23)*1.7,1.5,Math.sin(time*.23)*1.7);
  });
 }
 buildObjects(g,p){
  const choice=p.method,e=p.params.complexity;
  const ring=(r,tubeRadius,rx,ry,rz)=>{
   const mesh=new THREE.Mesh(new THREE.TorusGeometry(r,tubeRadius,12,96),mat(ivory));
   mesh.rotation.set(rx,ry,rz);g.add(mesh);return mesh;
  };
  if(choice==='shells'){
   for(let i=0;i<6;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(.38+i*.14,18,12),
     new THREE.MeshBasicMaterial({color:i%2?gold:ivory,wireframe:true,transparent:true,opacity:.08+i*.045,depthWrite:false}));
    g.add(m);
   }
  }else if(choice==='rings'){
   for(let i=0;i<8;i++)ring(.45+i*.07,.006,i*.47,i*.12,i*.32);
  }else if(choice==='ribs'){
   for(let i=0;i<22;i++){
    const x=(i-10.5)*.09,pts=[];
    for(let j=0;j<=32;j++){
     const a=j/32*PI;pts.push(vec(x,Math.cos(a)*(.6+.28*Math.sin(i/21*PI)),
       Math.sin(a)*(.4+.15*Math.sin(i/21*PI))));
    }g.add(tube(pts,.008,ivory,.73));
   }
  }else if(choice==='lattice'){
   for(let x=-3;x<=3;x++)for(let y=-3;y<=3;y++)for(let z=-3;z<=3;z++){
    if((x+y+z)%3===0){
     const pos=vec(x*.32,y*.32,z*.32);sphere(g,.028,pos,gold);
     if(x<3)g.add(line([pos,pos.clone().add(vec(.32,0,0))],ivory,.32));
     if(y<3)g.add(line([pos,pos.clone().add(vec(0,.32,0))],ivory,.32));
     if(z<3)g.add(line([pos,pos.clone().add(vec(0,0,.32))],ivory,.32));
    }
   }
  }else if(choice==='tubes'){
   for(let q=0;q<8;q++){
    const pts=[];for(let i=0;i<70;i++){
     const a=i/69*PI*4+q*TAU/8;
     pts.push(vec(Math.cos(a)*(.45+.04*q),-1+i/69*2,Math.sin(a)*(.45+.04*q)));
    }g.add(tube(pts,.014+q*.001,ivory,.75));
   }
  }else if(choice==='section'){
   const geo=new THREE.SphereGeometry(.95,28,19,0,PI*1.25,0,PI);
   g.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:ivory,wireframe:true,transparent:true,opacity:.40,side:THREE.DoubleSide})));
   for(let i=0;i<8;i++){
    const h=-.7+i*.21,rr=Math.sqrt(Math.max(0,.95*.95-h*h));
    const pts=[];for(let j=0;j<=80;j++){const a=j/80*TAU;pts.push(vec(rr*Math.cos(a),h,rr*Math.sin(a)));}
    g.add(line(pts,gold,.42));
   }
  }else if(choice==='sheets'){
   for(let k=0;k<11;k++){
    const pts=[];
    for(let i=0;i<=70;i++){
     const u=i/70*2-1;
     pts.push(vec(u,Math.sin(u*5+k*.65)*.12+k*.13-.72,Math.cos(u*2+k)*.3+k*.08-.4));
    }g.add(tube(pts,.008,ivory,.70));
   }
  }else if(choice==='cluster'){
   const movers=[];
   for(let i=0;i<30;i++){const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.07+rnd(i)*.08,1),mat(i%5===0?gold:ivory));
    g.add(mesh);movers.push(mesh);}
   this.animated.push((t,dt,energy)=>movers.forEach((m,i)=>{
    const a=i*2.4+t*(.12+.08*energy),r=.45+.6*rnd(i);
    m.position.set(Math.cos(a)*r,Math.sin(t*.32+i)*.5,Math.sin(a)*r);
   }));
  }else{
   const geo=new THREE.TorusKnotGeometry(.75,.20,320,22,3,5);
   const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:ivory,wireframe:true,transparent:true,opacity:.52}));
   g.add(mesh);this.animated.push((t)=>{mesh.scale.set(1+.12*Math.sin(t*.25),1+.1*Math.cos(t*.35),1)});
  }
  this.animated.push((t)=>{g.rotation.y=Math.sin(t*.14)*.12;});
 }
 buildNeuron(g,p){
  const source=vec(0,0,0),tips=[],segments=[],material=mat(ivory),countLimit=100+Math.round(this.complexity*230);
  const method=p.method,b=p.params;
  const count=method==='contact'?2:1;
  for(let cell=0;cell<count;cell++){
   const origin=vec(cell===0?-.4:.46,0,0);
   sphere(g,.115,origin,gold);
   let serial=0;
   const grow=(start,direction,length,depth,order)=>{
    if(depth<=0||serial++>countLimit)return;
    const endpoint=start.clone().addScaledVector(direction,length);
    segments.push({from:start.clone(),to:endpoint.clone(),order,cell});
    if(depth===1){tips.push(endpoint);return;}
    const childCount=method==='axon'&&order>1?1:
       (rnd(serial*7+cell*23)<b.branch?2:1);
    for(let child=0;child<childCount;child++){
      const axis=randVec(serial*4+child*13).multiplyScalar(.55);
      const dir=direction.clone().multiplyScalar(.77).add(axis.multiplyScalar(b.spread)).normalize();
      grow(endpoint,dir,length*(.72+.12*rnd(serial)),depth-1,order+1);
    }
   };
   const directions=method==='axon'?[vec(1,0,0),vec(-.4,.3,.1)]:
      [vec(1,.4,0),vec(-1,.2,.35),vec(.1,1,.5),vec(-.2,-1,-.6),vec(.2,.1,-1)];
   directions.forEach((d,i)=>grow(origin,d.normalize(),
    method==='axon'&&i===0?.55:.35,method==='soma'?3:method==='arbor'?7:6,0));
  }
  const parts=[];
  segments.forEach((seg,i)=>{
   if(method==='prune'&&i%5===0)return;
   const radius=Math.max(.004,.020*Math.pow(.75,seg.order));
   const mesh=tube([seg.from,seg.to],radius,seg.order<=1?gold:ivory,.8);
   if(mesh){g.add(mesh);parts.push({mesh,index:i,level:seg.order});}
  });
  if(method==='terminals'||method==='measure')tips.forEach(p=>sphere(g,.015,p,gold));
  sectionArcs(g,.58);
  this.animated.push((t,dt,energy)=>{
   const position=frac(t*.18)*(parts.length+1);
   for(let i=0;i<parts.length;i++){
    const v=parts[i];
    if(method==='travel'){
      v.mesh.material.emissive=new THREE.Color(ivory);
      v.mesh.material.emissiveIntensity=Math.max(0,1-Math.abs(i-position)/7)*energy*.8;
    }else v.mesh.material.emissiveIntensity=0;
    if(method==='prune'&&i%7===0)v.mesh.visible=frac(t*.05+i*.06)<.7;
   }
  });
  this.additional={branches:segments.length,terminalTips:tips.length};
 }
 buildPhysarum(g,p){
  // Original 3D path pursuit approximation. NOT a validated true Physarum chemo-field.
  const mode=p.method,c=p.params,targets=[];
  const count=mode==='dual'?2:mode==='colonies'?5:mode==='fusion'?4:3;
  for(let i=0;i<count;i++)targets.push(pol(.9,(i+.3)/count*TAU,Math.sin(i*2.4)*.42));
  targets.forEach((v,i)=>sphere(g,.045,v,i%2?gold:ivory));
  const paths=[];
  let branches=Math.round((mode==='explore'?45:mode==='colonies'?40:28)*(.45+this.complexity));
  for(let i=0;i<branches;i++){
   const origin=mode==='colonies'?pol(.35,Math.floor(i/8)*TAU/5,-.15):vec(0,-.5,0);
   const pts=[origin.clone()],target=targets[i%targets.length],steps=48;
   let direction=randVec(i+13).multiplyScalar(.08);
   for(let k=0;k<steps;k++){
     const pos=pts.at(-1),goal=target.clone().sub(pos).normalize();
     const wander=randVec(i*steps+k+8).multiplyScalar((1-c.attract)*.42+c.branch*.12);
     const radial=pos.clone().normalize().multiplyScalar(mode==='obstacle'&&pos.length()<.42?c.repel*.43:0);
     const swirl=vec(-pos.z,Math.sin(i*.4)*.07,pos.x).multiplyScalar(mode==='gradient'?.27:.06);
     direction.multiplyScalar(.65).addScaledVector(goal,.14*c.attract)
       .add(wander).add(radial).add(swirl).normalize().multiplyScalar(.035);
     pts.push(pos.clone().add(direction));
   }
   paths.push(pts);
  }
  const curves=[];
  for(let i=0;i<paths.length;i++){
   const pth=paths[i];
   const radius=(mode==='reinforce'?.012:.006)*(1+.4*rnd(i));
   const mesh=tube(pth,radius,i%7===0?gold:ivory,.43+.30*rnd(i));
   if(mesh){mesh.geometry.setDrawRange(0,0);curves.push({mesh,max:mesh.geometry.index?.count||mesh.geometry.attributes.position.count,seed:i});g.add(mesh);}
  }
  sectionArcs(g,1.12);
  this.animated.push((t,dt,energy)=>{
   const progression=frac(t*(mode==='retract'?.035:.035)+.01);
   for(const c of curves){
     const rate=mode==='retract'?1-progression:progression;
     c.mesh.geometry.setDrawRange(0,Math.max(3,Math.floor(c.max*clamp(rate*(.70+.3*rnd(c.seed))))));
     c.mesh.material.opacity=mode==='retract'?.3+.4*(1-progression):.38+.20*energy;
   }
  });
  this.additional={paths:paths.length,model:'3D attraction growth approximation'};
 }
 buildSakura(g,p){
  const method=p.method,b=p.params,twigs=[],branches=[];
  const twigMat=mat(0xb1a59a);
  const grow=(from,dir,length,depth,seed)=>{
   if(depth<=0||branches.length>270){twigs.push(from.clone());return;}
   const to=from.clone().addScaledVector(dir,length);
   branches.push({from,to,depth});
   const kids=depth>1?(rnd(seed)<.75?2:1):0;
   for(let k=0;k<kids;k++){
    const phi=(rnd(seed*5+k)-.5)*1.4;
    const turn=vec(Math.sin(phi+k*.9)*b.branch,.35+Math.cos(phi)*.25,
      Math.cos(phi+k*1.2)*b.branch).normalize();
    grow(to,dir.clone().multiplyScalar(.60).add(turn.multiplyScalar(.58)).normalize(),
       length*(.69+.1*rnd(seed*7+k)),depth-1,seed*2.3+k+1);
   }
   if(depth<=1)twigs.push(to.clone());
  };
  grow(vec(0,-1.12,0),vec(0,1,0),.66,method==='buds'?4:7,3);
  for(const item of branches){
   const mesh=tube([item.from,item.to],Math.max(.007,.025*(item.depth/7)),item.depth>3?0xbdb4a9:0xa99e95,.89);
   if(mesh)g.add(mesh);
  }
  // Actual 3D petal meshes: instanced overlapping curved 5-petal flowers,
  // not sprites or composited background particle textures.
  const petalShape=new THREE.Shape();
  petalShape.moveTo(0,0);petalShape.bezierCurveTo(-.034,.036,-.043,.09,0,.102);
  petalShape.bezierCurveTo(.05,.09,.036,.032,0,0);
  const petalGeo=new THREE.ShapeGeometry(petalShape,6);
  const petalMat=new THREE.MeshStandardMaterial({color:0xd6b7ba,side:THREE.DoubleSide,roughness:.86,metalness:0});
  const n=Math.round((method==='silence'?.04:b.flower)*(method==='layers'?1050:650)*(.55+this.complexity));
  const petals=new THREE.InstancedMesh(petalGeo,petalMat,n);petals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  g.add(petals);
  const dummy=new THREE.Object3D(),basePositions=Array.from({length:n},(_,i)=>{
   const twig=twigs[i%Math.max(1,twigs.length)]||vec(0,0,0);
   return twig.clone().add(vec((rnd(i*11)-.5)*.20,(rnd(i*3)-.5)*.18,(rnd(i*7)-.5)*.18));
  });
  this.animated.push((t,dt,energy)=>{
   for(let i=0;i<n;i++){
    const pos=basePositions[i],wind=b.wind*.5;
    const falling=['fall','vortex','cycle'].includes(method);
    let x=pos.x,y=pos.y,z=pos.z;
    if(falling){
     const shift=frac(t*(method==='cycle'?.018:.043)+rnd(i*7));
     y-=shift*2.25;
     x+=(method==='vortex'?Math.cos(t*.8+i)*.45:Math.sin(i+t*.5)*wind)*shift;
     z+=(method==='vortex'?Math.sin(t*.8+i)*.45:Math.cos(i+t*.5)*wind)*shift;
     if(y<-1.4)y+=2.5;
    }else{
     x+=Math.sin(t*.7+i)*wind*.11;z+=Math.cos(t*.6+i)*wind*.11;
    }
    dummy.position.set(x,y,z);
    dummy.rotation.set(t*.18+i,Math.sin(i+t*.13),i*.72+t*wind*.5);
    dummy.scale.setScalar(method==='buds'?.32:method==='layers'?1.25:.85);
    dummy.updateMatrix();petals.setMatrixAt(i,dummy.matrix);
   }
   petals.instanceMatrix.needsUpdate=true;
  });
  this.additional={branches:branches.length,petals:n};
 }
 snapshot(){
  return {family:this.family,variant:this.index+1,study:this.selection,
   energy:this.energy,complexity:this.complexity,depth:this.depth,
   camera:{position:this.camera.position.toArray(),target:this.controls.target.toArray()},
   resources:this.additional||null,source:'PROCEDURAL ORIGINAL',realXR:false,
   caution:'Scene is WebGL spatial study, not Quest hardware-validated.'};
 }
 setParameters(p){if(typeof p.energy==='number')this.energy=clamp(p.energy);
  if(typeof p.depth==='number'){
   this.depth=clamp(p.depth);
   if(this.group)this.group.scale.setScalar(.82+this.depth*.36);
   this.scene.fog.density=.045+(1-this.depth)*.09;
   this.floor.position.y=-.10+(this.depth-.5)*.10;
  }
  if(typeof p.complexity==='number')this.complexity=clamp(p.complexity);}
 resetCamera(){this.camera.position.set(3.65,2.48,4.6);this.controls.target.set(0,0,0);this.controls.update();}
 stop(){this.stopped=true;this.disposeGroup();this.controls.dispose();this.renderer.dispose();}
}
export {temporal,brightness};
