import * as T from 'three';
import {SCHOOLS} from './engine.mjs';
const mat=(color,emissive=0,metalness=.5,roughness=.33)=>new T.MeshStandardMaterial({color,emissive,metalness,roughness});
const glow=(color,opacity=1)=>new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity>=1});
const v=new T.Vector3(),q=new T.Quaternion(),dummy=new T.Object3D(),Y=new T.Vector3(0,1,0);
const MAX=2400;
function cylinder(a,b,r,material,parent,facets=8){const d=new T.Vector3().subVectors(b,a),m=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),facets),material);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(Y,d.normalize());parent.add(m);return m;}
function shard(parent,p,s,material,rotation=0){const m=new T.Mesh(new T.OctahedronGeometry(1,0),material);m.position.set(...p);m.scale.set(...s);m.rotation.z=rotation;parent.add(m);return m;}
export class VisualWorld{
 constructor(renderer,scene,root){
  this.renderer=renderer;this.scene=scene;this.root=root;this.school=SCHOOLS[0];this.fx=[];this.fieldViews=[];this.arcTime=0;this.arcPaths=[];
  scene.add(new T.HemisphereLight(0xc7dfff,0x101421,2));const key=new T.DirectionalLight(0xe2f0ff,3);key.position.set(-3,6,4);scene.add(key);const rim=new T.DirectionalLight(0x5777ef,2);rim.position.set(4,0,-5);scene.add(rim);
  this.targetViews=[];
  const iceMat=mat(0x9bd7ff,0x163b8c,.45,.16),darkMat=mat(0x152135,0x080d17,.7,.25);
  const baseMaterial=mat(0x101827,0,.7,.4);const floor=new T.Mesh(new T.CylinderGeometry(6.3,6.3,.07,96),baseMaterial);floor.position.set(0,-1.19,-3.8);root.add(floor);
  for(const radius of [1.6,3.2,5.0]){const ring=new T.Mesh(new T.TorusGeometry(radius,.004,3,128),glow(0x283f5a));ring.rotation.x=Math.PI/2;ring.position.set(0,-1.145,-3.8);root.add(ring);}
  for(let i=0;i<7;i++){
   const g=new T.Group(),core=new T.Mesh(new T.IcosahedronGeometry(.16,1),mat(0x294665,0x172c48,.75,.2));g.add(core);
   const shell=new T.Mesh(new T.IcosahedronGeometry(.225,0),new T.MeshBasicMaterial({color:0x597da5,wireframe:true}));g.add(shell);
   const rings=[];for(let j=0;j<2;j++){const r=new T.Mesh(new T.TorusGeometry(.29+j*.03,.005,3,56),glow(0x91bbde,.75));r.rotation.x=j*Math.PI/2;g.add(r);rings.push(r);}
   const crystals=new T.Group();for(let j=0;j<8;j++){const a=j*2.3999;shard(crystals,[Math.cos(a)*.16,Math.sin(a)*.15,Math.cos(j)*.09],[.07,.25+(j%3)*.06,.09],iceMat,a*.6);}g.add(crystals);crystals.visible=false;root.add(g);
   const pedestal=new T.Mesh(new T.CylinderGeometry(.30,.35,.035,32),darkMat);pedestal.position.y=-1.12;root.add(pedestal);
   this.targetViews.push({g,core,shell,rings,crystals,pedestal});
  }
  this.propRoot=new T.Group();root.add(this.propRoot);this.props={};
  // The ice staff is a new low-poly prop, not an extracted or advertised 1:1 game model.
  const staff=new T.Group(),metal=mat(0x26344a,0x071120,.85,.28),silver=mat(0x91b2c9,0x132d4d,.75,.19),ice=mat(0xa8e6ff,0x2946ac,.6,.14),energy=glow(0xb7ecff);
  cylinder(new T.Vector3(0,-.70,0),new T.Vector3(0,.53,0),.022,metal,staff,10);
  cylinder(new T.Vector3(0,-.67,0),new T.Vector3(0,.50,0),.008,energy,staff,6);
  for(let i=0;i<13;i++){const ring=new T.Mesh(new T.TorusGeometry(.031,.005,3,14),i%3?silver:energy);ring.rotation.x=Math.PI/2;ring.position.y=-.51+i*.065;staff.add(ring);}
  for(const sign of [-1,1]){cylinder(new T.Vector3(0,.33,0),new T.Vector3(sign*.11,.57,0),.018,silver,staff);shard(staff,[sign*.13,.64,0],[.052,.20,.06],ice,sign*-.20);}
  shard(staff,[0,.61,0],[.11,.25,.095],ice,-.07);shard(staff,[0,.62,.015],[.044,.19,.047],energy,.12);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;shard(staff,[Math.cos(a)*.16,.58+Math.sin(a)*.12,Math.sin(a)*.075],[.025,.10,.035],ice,-a);}
  this.staffLight=new T.PointLight(0x6dbaff,2.5,2);this.staffLight.position.set(0,.65,0);staff.add(this.staffLight);this.props.stasis=staff;
  const blade=new T.Group(),fire=mat(0xffce82,0xff6720,.45,.18);cylinder(new T.Vector3(0,-.17,0),new T.Vector3(0,.13,0),.028,metal,blade);cylinder(new T.Vector3(-.14,.12,0),new T.Vector3(.14,.12,0),.025,fire,blade);shard(blade,[0,.61,0],[.07,.50,.022],fire);shard(blade,[0,.62,.008],[.022,.47,.023],glow(0xffefbd));this.props.solar=blade;
  const orb=new T.Group();orb.add(new T.Mesh(new T.IcosahedronGeometry(.12,2),mat(0x1c0f38,0x481c91,.5,.1)));for(let i=0;i<3;i++){const r=new T.Mesh(new T.TorusGeometry(.17+i*.025,.004,3,70),glow(0xbc8bff,.8));r.rotation.set(i*.8,.5*i,.3*i);orb.add(r);}this.props.void=orb;
  const arc=new T.Group();for(let i=0;i<6;i++){const a=i*Math.PI/3;const r=new T.Mesh(new T.TorusGeometry(.11+i*.01,.0028,3,42),glow(0x9ce4ff));r.rotation.set(a,a*.5,0);arc.add(r);}this.props.arc=arc;
  const weave=new T.Group();for(let i=0;i<9;i++){const a=i*2.3999;const needle=new T.Mesh(new T.ConeGeometry(.012,.24,4),glow(0xbcffa5));needle.position.set(Math.cos(a)*.15,Math.sin(a)*.15,0);needle.rotation.x=Math.PI/2;weave.add(needle);}this.props.strand=weave;
  const prism=new T.Group();shard(prism,[0,.03,0],[.13,.18,.11],mat(0xf0bbff,0x63349b,.55,.16));const rimP=new T.Mesh(new T.TorusGeometry(.23,.004,3,64),glow(0xffb9e6));prism.add(rimP);this.props.prismatic=prism;
  for(const g of Object.values(this.props)){this.propRoot.add(g);g.visible=false;}staff.visible=true;
  const geometries={ice:new T.OctahedronGeometry(.055,0),blade:new T.OctahedronGeometry(.08,0),nova:new T.IcosahedronGeometry(.13,2),needle:new T.ConeGeometry(.018,.29,4),threadling:new T.IcosahedronGeometry(.052,1),seeker:new T.OctahedronGeometry(.04,0)};
  this.shots={};for(const [kind,geometry] of Object.entries(geometries)){const mesh=new T.InstancedMesh(geometry,glow(0xffffff),80);mesh.frustumCulled=false;mesh.count=0;root.add(mesh);this.shots[kind]=mesh;}
  this.positions=new Float32Array(MAX*3);this.colours=new Float32Array(MAX*3);this.sizes=new Float32Array(MAX);this.alphas=new Float32Array(MAX);this.vel=new Float32Array(MAX*3);this.life=new Float32Array(MAX);this.maxLife=new Float32Array(MAX);this.next=0;
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(this.positions,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('aColor',new T.BufferAttribute(this.colours,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('aSize',new T.BufferAttribute(this.sizes,1).setUsage(T.DynamicDrawUsage));geometry.setAttribute('aAlpha',new T.BufferAttribute(this.alphas,1).setUsage(T.DynamicDrawUsage));
  const material=new T.ShaderMaterial({uniforms:{uScale:{value:900}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:'attribute vec3 aColor;attribute float aSize;attribute float aAlpha;varying vec3 vColor;varying float vAlpha;uniform float uScale;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(aSize*uScale/max(.15,-p.z),1.,100.);vColor=aColor;vAlpha=aAlpha;}',fragmentShader:'precision mediump float;varying vec3 vColor;varying float vAlpha;void main(){vec2 d=gl_PointCoord-.5;float a=exp(-dot(d,d)*19.);if(a<.015)discard;gl_FragColor=vec4(vColor,vAlpha*a);}'});
  this.particles=new T.Points(geometry,material);this.particles.frustumCulled=false;root.add(this.particles);
  this.lineData=new Float32Array(4800*3);const lg=new T.BufferGeometry();lg.setAttribute('position',new T.BufferAttribute(this.lineData,3).setUsage(T.DynamicDrawUsage));lg.setDrawRange(0,0);this.lines=new T.LineSegments(lg,new T.LineBasicMaterial({color:0xb9dcff,transparent:true,opacity:.7,blending:T.AdditiveBlending,depthWrite:false}));this.lines.frustumCulled=false;root.add(this.lines);
  const starG=new T.BufferGeometry(),pos=new Float32Array(240*3);for(let i=0;i<240;i++){pos[3*i]=Math.sin(i*12.9)*13;pos[3*i+1]=Math.cos(i*8.1)*6;pos[3*i+2]=-8-Math.abs(Math.sin(i*2.7))*16;}starG.setAttribute('position',new T.BufferAttribute(pos,3));root.add(new T.Points(starG,new T.PointsMaterial({color:0x667e99,size:.014,transparent:true,opacity:.45})));
  const reticle=new T.Mesh(new T.TorusGeometry(.25,.004,3,64),glow(0xa1d5ff,.9));root.add(reticle);this.reticle=reticle;reticle.visible=false;
 }
 choose(id){this.school=SCHOOLS.find(s=>s.id===id)||SCHOOLS[0];for(const [k,g] of Object.entries(this.props))g.visible=k===id;this.lines.material.color.setHex(this.school.color);this.reticle.material.color.setHex(this.school.color);this.clear();}
 clear(){this.life.fill(0);this.alphas.fill(0);for(const e of this.fx){this.root.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();}this.fx=[];this.arcPaths=[];for(const g of this.fieldViews){this.root.remove(g);g.geometry.dispose();g.material.dispose();}this.fieldViews=[];}
 hand(point,direction,tracked=true,charge=0){
  this.propRoot.visible=tracked;this.propRoot.position.fromArray(point);
  const axis=new T.Vector3(direction[0]*.22,1+direction[1]*.18,direction[2]*.24).normalize();this.propRoot.quaternion.setFromUnitVectors(Y,axis);
  const scale=this.school.prop==='orb'||this.school.prop==='prism'?1+charge*.19:1;this.propRoot.scale.setScalar(scale);this.propRoot.updateMatrixWorld(true);
 }
 muzzle(){const isStaff=this.school.id==='stasis',isBlade=this.school.id==='solar';v.set(0,isStaff?.68:isBlade?.78:.04,0).applyMatrix4(this.propRoot.matrix);return v.toArray();}
 emit(p,count=16,color=this.school.color,speed=1.1,size=.045,life=.65,dir=null){const col=new T.Color(color);for(let n=0;n<count;n++){const i=this.next++%MAX,j=i*3,a=Math.random()*Math.PI*2,z=Math.random()*2-1,r=Math.sqrt(1-z*z),k=speed*(.3+Math.random()*.7);this.positions[j]=p[0];this.positions[j+1]=p[1];this.positions[j+2]=p[2];this.vel[j]=Math.cos(a)*r*k+(dir?.[0]||0);this.vel[j+1]=Math.sin(a)*r*k+(dir?.[1]||0);this.vel[j+2]=z*k+(dir?.[2]||0);this.colours[j]=col.r;this.colours[j+1]=col.g;this.colours[j+2]=col.b;this.sizes[i]=size*(.6+Math.random());this.life[i]=this.maxLife[i]=life*(.6+Math.random()*.4);}}
 wave(p,color,radius=1,ttl=.6){const mesh=new T.Mesh(new T.TorusGeometry(1,.008,3,80),glow(color,.8));mesh.position.fromArray(p);this.root.add(mesh);this.fx.push({mesh,age:0,ttl,radius});while(this.fx.length>18){const e=this.fx.shift();this.root.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();}}
 event(e){
  if(e.type==='cast')this.emit(e.p,14,this.school.color,.55,.042,.35,e.direction?.map(v=>v*.5));
  if(e.type==='freeze'){this.emit(e.p,42,0xb5eaff,1.05,.045,.75);this.wave(e.p,0x91cfff,.35,.33);}
  if(e.type==='shatter'){this.emit(e.p,95,0xa9e3ff,3.9,.072,1);this.wave(e.p,0xc1edff,1.2,.45);}
  if(e.type==='hit')this.emit(e.p,8,this.school.color,.9,.035,.25);
  if(e.type==='destroy')this.emit(e.p,40,this.school.color,2.2,.06,.7);
  if(e.type==='impact')this.emit(e.p,22,this.school.color,1.6,.04,.4);
  if(e.type==='nova'){this.emit(e.p,150,0xc6a1ff,4,.10,1.2);this.wave(e.p,0xc29cff,e.radius,.75);}
  if(e.type==='wave'){this.wave(e.p,this.school.color,Math.min(e.radius,5),.7);}
  if(e.type==='super'){this.wave(e.p,this.school.color,2.2,.7);this.emit(e.p,90,this.school.color,2,.065,.85);}
  if(e.type==='chain'){this.arcPaths=e.points;this.arcTime=.13;}
 }
 update(arena,dt,aim,time){
  const color=this.school.color;
  this.targetViews.forEach((view,i)=>{const target=arena.targets[i];view.g.position.fromArray(target.p);view.g.visible=target.dead<=0;view.g.rotation.y+=dt*.35;view.rings[0].rotation.z+=dt*.4;view.rings[1].rotation.y-=dt*.5;view.crystals.visible=target.frozen>0;view.shell.visible=target.frozen<=0;view.core.material.emissive.setHex(target.tint>0?color:target.frozen>0?0x609adf:0x152d49);view.pedestal.position.x=target.base[0];view.pedestal.position.z=target.base[2];});
  const counts={};for(const k of Object.keys(this.shots))counts[k]=0;
  let lineIndex=0;const line=(a,b)=>{if(lineIndex+6>this.lineData.length)return;this.lineData.set(a,lineIndex);this.lineData.set(b,lineIndex+3);lineIndex+=6;};
  for(const shot of arena.projectiles){const mesh=this.shots[shot.kind];if(!mesh)continue;const idx=counts[shot.kind]++;dummy.position.fromArray(shot.p);dummy.quaternion.setFromUnitVectors(Y,new T.Vector3(...shot.v).normalize());
   if(shot.kind==='ice')dummy.scale.set(.7,2.6,.7);else if(shot.kind==='blade')dummy.scale.set(3.8,2.4,.25);else if(shot.kind==='nova')dummy.scale.setScalar(.9+shot.power*.24);else if(shot.kind==='threadling')dummy.scale.set(.7,.8,2.1);else dummy.scale.set(1,1,1);dummy.updateMatrix();mesh.setMatrixAt(idx,dummy.matrix);
   const col=shot.kind==='ice'?0xa9e5ff:shot.kind==='blade'?0xffb55b:shot.kind==='nova'||shot.kind==='seeker'?0xbb8eff:0xb3ff9a;mesh.setColorAt(idx,new T.Color(col));
   for(let i=1;i<shot.trail.length;i++)line(shot.trail[i-1],shot.trail[i]);
   if(Math.random()<Math.min(1,dt*60))this.emit(shot.p,2,col,.11,shot.kind==='nova'?.10:.034,.38,shot.v.map(v=>-v*.10));
  }
  for(const [kind,mesh] of Object.entries(this.shots)){mesh.count=counts[kind];mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
  if(this.arcTime>0){this.arcTime-=dt;for(let n=1;n<this.arcPaths.length;n++){const a=this.arcPaths[n-1],b=this.arcPaths[n];let last=a;for(let i=1;i<=12;i++){const t=i/12,k=i===12?0:.09;const p=a.map((v,j)=>v+(b[j]-v)*t+Math.sin(i*13+j*9+time*40)*k);line(last,p);last=p;}}}
  this.lines.geometry.setDrawRange(0,lineIndex/3);this.lines.geometry.attributes.position.needsUpdate=true;
  this.reticle.visible=!!aim?.locked;if(aim?.locked){this.reticle.position.fromArray(aim.point);this.reticle.scale.setScalar(1+.07*Math.sin(time*6));}
  if(this.school.id==='void'||this.school.id==='arc'||this.school.id==='strand'||this.school.id==='prismatic')this.props[this.school.id].rotation.z+=dt*.55;
  const muzzle=this.muzzle();if(arena.charge>.05&&this.propRoot.visible)this.emit(muzzle,Math.min(5,Math.ceil(arena.charge)),color,.25,.04,.4);
  while(this.fieldViews.length<arena.fields.length){const m=new T.Mesh(new T.TorusGeometry(1,.012,3,96),glow(color,.7));m.rotation.x=Math.PI/2;this.root.add(m);this.fieldViews.push(m);}
  for(let i=0;i<this.fieldViews.length;i++){const m=this.fieldViews[i],f=arena.fields[i];m.visible=!!f;if(f){m.position.set(f.p[0],f.p[1]-.2,f.p[2]);m.scale.setScalar(f.radius);m.material.color.setHex(f.kind==='void'?0xbc8dff:f.kind==='solar'?0xffb65f:0xe4acff);const a=time*3+i;this.emit([f.p[0]+Math.cos(a)*f.radius*.7,f.p[1],f.p[2]+Math.sin(a)*f.radius*.7],2,m.material.color.getHex(),.4,.045,.6);}}
  for(let i=0;i<MAX;i++){if(this.life[i]<=0){this.alphas[i]=0;continue;}this.life[i]-=dt;const j=i*3;for(let a=0;a<3;a++){this.positions[j+a]+=this.vel[j+a]*dt;this.vel[j+a]*=Math.exp(-dt*.6);}this.alphas[i]=Math.max(0,this.life[i]/this.maxLife[i]);}
  for(const a of Object.values(this.particles.geometry.attributes))a.needsUpdate=true;
  for(let i=this.fx.length-1;i>=0;i--){const e=this.fx[i];e.age+=dt;const r=Math.min(1,e.age/e.ttl);e.mesh.scale.setScalar(.04+r*e.radius);e.mesh.material.opacity=(1-r)*.8;if(r>=1){this.root.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();this.fx.splice(i,1);}}
 }
}
