import {JOINTS,BONES,ANGLES,handAngles,distance,createZones,ZoneEngine} from './engine.mjs';
const $=id=>document.getElementById(id);
const canvas=$('view');
const zones=createZones(),engine=new ZoneEngine(zones);
const ZCOL=[[.38,.91,.69],[.94,.63,.45],[.57,.75,.97]];
const hands={left:null,right:null};
const jointCache={left:null,right:null};
let gl=null,program=null,buffer=null,loc=null;
let session=null,ref=null,mode='DESKTOP',ws=null,armed=false,authenticated=false,seq=0;
let nowMs=0,lastNet=0,lastTelemetry=0,lastFull=0,logEntries=[],recording=false,recordFrames=[];
let pointer={x:.23,y:-.28,z:-.54},fakeHand=true,zoneEvents=[],pendingEvent=[];
const log=message=>{logEntries.unshift(message);logEntries.length=Math.min(12,logEntries.length);$('log').textContent=logEntries.join('\n');};
if(document.documentElement.dataset.instrument==='on'){
  window.__pmSendPerformance=(packet)=>{
    if(!armed||!authenticated||ws?.readyState!==WebSocket.OPEN)return false;
    ws.send(JSON.stringify({type:'performance',seq:++seq,t_ms:Math.round(performance.now()),...packet}));
    return true;
  };
  window.__pmSendAtlas=(event)=>{
    const modes={
      music:['continuum','orbit','trace','dial'],
      culture:['jian','river','bagua','stars']
    };
    if(!armed||!authenticated||ws?.readyState!==WebSocket.OPEN)return false;
    if(!event||!modes[event.family]?.includes(event.lab))return false;
    ws.send(JSON.stringify({type:'atlas',seq:++seq,t_ms:Math.round(performance.now()),...event}));
    return true;
  };
  window.__pmSendStudy=(event)=>{
    if(!armed||!authenticated||ws?.readyState!==WebSocket.OPEN)return false;
    if(!event||!['score','tone','sigil'].includes(event.lab))return false;
    ws.send(JSON.stringify({type:'study',seq:++seq,t_ms:Math.round(performance.now()),...event}));
    return true;
  };
  window.__pmSendOrganic=(event)=>{
    if(!armed||!authenticated||ws?.readyState!==WebSocket.OPEN)return false;
    if(!event||!['ENTER','EXIT'].includes(event.kind))return false;
    const packet={type:'organic',seq:++seq,t_ms:Math.round(performance.now()),
      mode:event.mode,kind:event.kind,region:event.id,
      x:event.x,y:event.y,velocity:event.velocity};
    ws.send(JSON.stringify(packet));return true;
  };
}
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function setupGL(){
  gl=canvas.getContext('webgl2',{alpha:true,depth:true,antialias:false,xrCompatible:true})||
     canvas.getContext('webgl',{alpha:true,depth:true,antialias:false,xrCompatible:true});
  if(!gl){$('device').textContent='WebGL 不可用；不能运行。';return false;}
  const vert=`attribute vec3 aPos;attribute vec4 aColor;uniform mat4 uView,uProjection;uniform float uPointSize;varying vec4 vColor;
  void main(){vec4 eye=uView*vec4(aPos,1.);gl_Position=uProjection*eye;gl_PointSize=uPointSize;vColor=aColor;}`;
  const frag=`precision mediump float;uniform float uDots;varying vec4 vColor;
  void main(){if(uDots>.5 && length(gl_PointCoord-vec2(.5))>.48) discard;gl_FragColor=vColor;}`;
  function compile(type,source){
    const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;
  }
  program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vert));
  gl.attachShader(program,compile(gl.FRAGMENT_SHADER,frag));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  buffer=gl.createBuffer();
  loc={pos:gl.getAttribLocation(program,'aPos'),color:gl.getAttribLocation(program,'aColor'),
    view:gl.getUniformLocation(program,'uView'),proj:gl.getUniformLocation(program,'uProjection'),
    point:gl.getUniformLocation(program,'uPointSize'),dots:gl.getUniformLocation(program,'uDots')};
  gl.useProgram(program);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  return true;
}
const segments=[],dots=[];
function vertex(dst,p,c,a){dst.push(p[0],p[1],p[2],c[0],c[1],c[2],a);}
function line(p,q,c,a){vertex(segments,p,c,a);vertex(segments,q,c,a);}
function spot(p,c,a){vertex(dots,p,c,a);}
function rotate(q,v){
  // rotate vector by unit quaternion
  const [x,y,z,w]=q,[vx,vy,vz]=v;
  const tx=2*(y*vz-z*vy),ty=2*(z*vx-x*vz),tz=2*(x*vy-y*vx);
  return [vx+w*tx+(y*tz-z*ty),vy+w*ty+(z*tx-x*tz),vz+w*tz+(x*ty-y*tx)];
}
function geometry(){
  segments.length=0;dots.length=0;
  for(let i=0;i<zones.length;i++){
    const z=zones[i],c=ZCOL[i],active=[...engine.states.entries()].some(([key,s])=>key.endsWith(':'+z.id)&&s.inside);
    for(let axis=0;axis<3;axis++){
      const n=32;
      for(let j=0;j<n;j++){
        const a=j*2*Math.PI/n,b=(j+1)*2*Math.PI/n;
        function p(t){const x=Math.cos(t)*z.radius,y=Math.sin(t)*z.radius;
          if(axis===0)return [z.center[0]+x,z.center[1]+y,z.center[2]];
          if(axis===1)return [z.center[0]+x,z.center[1],z.center[2]+y];
          return [z.center[0],z.center[1]+x,z.center[2]+y];}
        line(p(a),p(b),c,active?.9:.37);
      }
    }
    spot(z.center,c,active?.85:.45);
  }
  for(const side of ['left','right']){
    const hand=hands[side];if(!hand)continue;
    const color=side==='left'?[.53,.98,.71]:[.99,.72,.49];
    for(const [a,b] of BONES){
      const pa=hand.positions[a],pb=hand.positions[b];if(pa&&pb)line(pa,pb,color,.98);
    }
    for(let i=0;i<JOINTS.length;i++){
      const p=hand.positions[i];if(!p)continue;
      const tip=JOINTS[i].endsWith('-tip');
      spot(p,tip?[1,1,.92]:color,tip?1:.86);
      if($('axes').checked && hand.quaternions[i]){
        const q=hand.quaternions[i],length=.013;
        for(const [axis,col] of [[[length,0,0],[.92,.33,.36]],[[0,length,0],[.38,.89,.46]],[[0,0,length],[.40,.63,.96]]]){
          const d=rotate(q,axis);line(p,[p[0]+d[0],p[1]+d[1],p[2]+d[2]],col,.62);
        }
      }
    }
  }
  // Minimal extra primitives only on performer page; same GL line buffer and
  // headset compositor. No second renderer or large particle allocations.
  const fx=document.documentElement.dataset.instrument==='on'?window.__pmInstrumentVisual:null;
  if(fx){
    const strength=Math.max(fx.gate?0.35:0,fx.flash||0);
    const tip=hands.right?.positions?.[9]||hands.left?.positions?.[9];
    if(tip && strength>0.02){
      const c=[.77,.88,.95],rad=.022+.042*strength;
      for(let i=0;i<16;i++){
        const a=i*Math.PI/8,b=(i+1)*Math.PI/8;
        line([tip[0]+rad*Math.cos(a),tip[1]+rad*Math.sin(a),tip[2]],
             [tip[0]+rad*Math.cos(b),tip[1]+rad*Math.sin(b),tip[2]],c,.28+.6*strength);
      }
      spot(tip,[1,.95,.75],Math.min(.95,strength));
    }
    const z=zones[2],rad=z.radius+Math.max(0,fx.flash||0)*.11;
    // XR-visible audio-state lamp. Green = running, amber = suspended,
    // dark red = deliberately muted/not initialized. Adds only 12 GL lines.
    if(mode!=='DESKTOP'){
      const status=window.__pmXRAudioStatus||'LOCKED';
      const indicator=status==='RUNNING'?[.45,.98,.64]:
        status==='SUSPENDED'?[1,.75,.18]:[.78,.26,.23];
      const x=.03,y=-.02,z=-.43,r=.014;
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6,b=(i+1)*Math.PI/6;
        line([x+Math.cos(a)*r,y+Math.sin(a)*r,z],
             [x+Math.cos(b)*r,y+Math.sin(b)*r,z],indicator,.82);
      }
    }
    if((fx.flash||0)>.02)for(let i=0;i<24;i++){
      const a=i*Math.PI/12,b=(i+1)*Math.PI/12;
      line([z.center[0]+Math.cos(a)*rad,z.center[1],z.center[2]+Math.sin(a)*rad],
           [z.center[0]+Math.cos(b)*rad,z.center[1],z.center[2]+Math.sin(b)*rad],
           [.89,.94,.70],.72*(fx.flash||0));
    }
  }
  // Organic Fields uses the existing joint/line renderer. Optional scene
  // receives only drawing functions, not GL state or raw camera data.
  if(document.documentElement.dataset.organic==='on' && typeof window.__pmOrganicDraw==='function'){
    try{window.__pmOrganicDraw({line,spot,now:nowMs,mode});}
    catch(e){console.error('Organic fields visualization',e);}
  }
}
function paint(vertices,modeGL,pointSize){
  if(!vertices.length)return;
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(loc.pos,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(loc.pos);
  gl.vertexAttribPointer(loc.color,4,gl.FLOAT,false,28,12);gl.enableVertexAttribArray(loc.color);
  gl.uniform1f(loc.dots,modeGL===gl.POINTS?1:0);gl.uniform1f(loc.point,pointSize);
  gl.drawArrays(modeGL,0,vertices.length/7);
}
function render(view,proj){
  gl.useProgram(program);
  gl.uniformMatrix4fv(loc.view,false,view);gl.uniformMatrix4fv(loc.proj,false,proj);
  paint(segments,gl.LINES,1);paint(dots,gl.POINTS,5);
}
const identity=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function perspective(aspect){
  const f=1/Math.tan(62*Math.PI/360),near=.01,far=30;
  const out=new Float32Array(16);
  out[0]=f/aspect;out[5]=f;out[10]=(far+near)/(near-far);out[11]=-1;
  out[14]=2*far*near/(near-far);return out;
}
// Convert WebXR's column-major rotation matrix to a quaternion, avoiding
// 25 getJointPose allocations when XRFrame.fillPoses is available.
function quatMatrix(m,off){
  const m00=m[off],m11=m[off+5],m22=m[off+10],tr=m00+m11+m22;
  let x=0,y=0,z=0,w=1,s;
  if(tr>0){s=2*Math.sqrt(tr+1);w=.25*s;x=(m[off+6]-m[off+9])/s;
    y=(m[off+8]-m[off+2])/s;z=(m[off+1]-m[off+4])/s;}
  else if(m00>m11&&m00>m22){s=2*Math.sqrt(1+m00-m11-m22);w=(m[off+6]-m[off+9])/s;
    x=.25*s;y=(m[off+4]+m[off+1])/s;z=(m[off+8]+m[off+2])/s;}
  else if(m11>m22){s=2*Math.sqrt(1+m11-m00-m22);w=(m[off+8]-m[off+2])/s;
    x=(m[off+4]+m[off+1])/s;y=.25*s;z=(m[off+9]+m[off+6])/s;}
  else{s=2*Math.sqrt(1+m22-m00-m11);w=(m[off+1]-m[off+4])/s;
    x=(m[off+8]+m[off+2])/s;y=(m[off+9]+m[off+6])/s;z=.25*s;}
  const norm=Math.hypot(x,y,z,w)||1;return [x/norm,y/norm,z/norm,w/norm];
}
function readHand(frame,source,side){
  if(!source.hand)return null;
  let cache=jointCache[side];
  if(!cache||cache.source!==source){
    const spaces=JOINTS.map(name=>source.hand.get(name));
    if(spaces.some(x=>!x))return null;
    cache={source,spaces,mat:new Float32Array(JOINTS.length*16),
      positions:JOINTS.map(()=>[0,0,0]),quaternions:JOINTS.map(()=>[0,0,0,1])};
    jointCache[side]=cache;
  }
  let filled=false;
  if(typeof frame.fillPoses==='function'){
    try{filled=frame.fillPoses(cache.spaces,ref,cache.mat);}catch(e){filled=false;}
  }
  if(filled){
    for(let i=0;i<JOINTS.length;i++){
      const k=i*16,p=cache.positions[i],q=quatMatrix(cache.mat,k);
      p[0]=cache.mat[k+12];p[1]=cache.mat[k+13];p[2]=cache.mat[k+14];
      for(let j=0;j<4;j++)cache.quaternions[i][j]=q[j];
    }
  }else{
    for(let i=0;i<JOINTS.length;i++){
      const pose=frame.getJointPose(cache.spaces[i],ref);if(!pose)return null;
      const {position:p,orientation:q}=pose.transform;
      cache.positions[i][0]=p.x;cache.positions[i][1]=p.y;cache.positions[i][2]=p.z;
      cache.quaternions[i][0]=q.x;cache.quaternions[i][1]=q.y;
      cache.quaternions[i][2]=q.z;cache.quaternions[i][3]=q.w;
    }
  }
  const h={positions:cache.positions,quaternions:cache.quaternions,
    angles:handAngles(cache.positions),pinch_m:distance(cache.positions[4],cache.positions[9]),valid:true};
  return h;
}
const fakeOffsets=[
  [-.068,-.106,.055],[-.095,-.07,.04],[-.10,-.035,.022],[-.082,-.008,.01],[-.045,.016,-.004],
  [-.003,-.073,.023],[.008,-.034,.012],[.015,-.01,.005],[.018,.027,0],[0,0,0],
  [.023,-.071,.025],[.034,-.03,.013],[.041,.008,.007],[.042,.043,.003],[.037,.076,0],
  [.045,-.083,.023],[.060,-.047,.013],[.072,-.009,.008],[.082,.026,.003],[.088,.052,0],
  [.064,-.105,.03],[.082,-.073,.014],[.105,-.047,.009],[.12,-.025,.004],[.139,-.012,0]
];
function makeFake(){
  return {positions:fakeOffsets.map(q=>[pointer.x+q[0],pointer.y+q[1],pointer.z+q[2]]),
    quaternions:JOINTS.map(()=>[0,0,0,1]),angles:{},pinch_m:.04,valid:true};
}
canvas.addEventListener('pointermove',e=>{
  if(session)return;const r=canvas.getBoundingClientRect();
  pointer.x=((e.clientX-r.left)/r.width-.5)*1.20;
  pointer.y=.08-(e.clientY-r.top)/r.height*.75;
});
function doZones(now){
  const events=[];
  for(const side of ['left','right']){
    const hand=hands[side];
    // Only index-finger-tip (joint 9) determines zones in v0.1.
    events.push(...engine.update(side,hand?.positions?.[9]||null,now));
  }
  for(const ev of events){
    log((ev.t_ms/1000).toFixed(2)+'  '+ev.hand.toUpperCase()+'  '+ev.zone+'  '+ev.type);
    pendingEvent.push({...ev,seq:++seq});
  }
}
function updateUI(now){
  if(now-lastTelemetry<130)return;lastTelemetry=now;
  const count=['left','right'].filter(s=>hands[s]).length;
  $('hud').textContent='HAND / SPACE / OSC\n'+mode+' · '+count+' TRACKED HAND(S)\n'+(armed?'OSC ARMED':'OSC DISARMED');
  $('zoneinfo').textContent=zones.map(z=>{
    const active=['left','right'].filter(h=>engine.states.get(h+':'+z.id)?.inside);
    return z.id+' / '+z.name+'\ncenter '+z.center.map(x=>x.toFixed(2)).join(',')+' m   radius '+z.radius.toFixed(3)+' m\n'+(active.length?'INSIDE: '+active.join('+'):'OUTSIDE');
  }).join('\n\n');
  const telemetry=[];
  for(const side of ['left','right']){
    const h=hands[side];if(!h){telemetry.push(side.toUpperCase()+' / NO DATA');continue;}
    telemetry.push(side.toUpperCase()+' / pinch '+(h.pinch_m*1000).toFixed(1)+'mm');
    telemetry.push('INDEX TIP '+h.positions[9].map(x=>x.toFixed(3)).join(', '));
    const a=h.angles;telemetry.push('BENDS° '+ANGLES.map(x=>x[0]+' '+(a[x[0]]??0).toFixed(0)).join(' · '));
  }
  $('telemetry').textContent=telemetry.join('\n');
}
function publish(now){
  if(recording&&recordFrames.length>=2400){
    recording=false;$('record').textContent='RECORD JSON';log('CAPTURE LIMIT / 2400 frames');$('download').disabled=false;
  }
  if(now-lastNet<33)return;
  const includeAll=$('full').checked&&now-lastFull>=100;
  if(includeAll)lastFull=now;
  const data={type:'frame',seq:++seq,t_ms:Math.round(now),mode,
    full:includeAll,hand_tracking:['left','right'].filter(k=>hands[k]).length>0,
    hands:Object.fromEntries(['left','right'].filter(k=>hands[k]).map(k=>{
      const h=hands[k];
      return [k,{
        wrist:h.positions[0],index_tip:h.positions[9],thumb_tip:h.positions[4],
        pinch_m:h.pinch_m,angles:h.angles,
        ...(includeAll?{positions:h.positions,orientations:h.quaternions}: {})
      }];
    }))};
  if(recording){recordFrames.push(JSON.parse(JSON.stringify(data)));$('download').disabled=false;}
  if(armed && authenticated && ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(data));
  lastNet=now;
}
function process(now){
  nowMs=now;
  doZones(now);
  // Optional performer layer: synchronous read-only feed. Baseline page has no
  // dataset.instrument flag and retains its original 25-joint XR performance.
  if(document.documentElement.dataset.instrument==='on' && window.__pmInstrumentFeed){
    try{
      window.__pmInstrumentFeed({hands,zoneEvents:pendingEvent,now,mode});
    }catch(err){console.error('Performance-layer error',err);}
  }
  while(pendingEvent.length){
    const ev=pendingEvent.shift();
    if(armed&&authenticated&&ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'zone',...ev}));
    if(recording)recordFrames.push({type:'zone',...ev});
  }
  publish(now);updateUI(now);geometry();
}
function desktopFrame(now){
  requestAnimationFrame(desktopFrame);
  if(session)return;
  mode='DESKTOP';
  hands.left=null;hands.right=fakeHand?makeFake():null;
  if(hands.right)hands.right.angles=handAngles(hands.right.positions);
  process(now);
  const dpr=Math.min(devicePixelRatio||1,1.5);
  const w=Math.max(1,Math.floor(canvas.clientWidth*dpr)),h=Math.max(1,Math.floor(canvas.clientHeight*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);
  gl.clearColor(.006,.009,.010,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  render(identity,perspective(w/h));
}
async function enterXR(type){
  if(!navigator.xr)return;
  try{
    // Trigger user-approved AudioContext unlock in the SAME user click as
    // WebXR requestSession. Do not await it before calling requestSession:
    // XR browsers may require the original transient activation.
    try{window.__pmBeforeEnterXR?.(type);}catch(audioError){
      log('XR AUDIO UNLOCK ERROR: '+audioError.message);
    }
    // To render fine hand lines, hand tracking must be granted. Never silently
    // launch a session where the user expects tracked joints but none are available.
    const s=await navigator.xr.requestSession(type,{requiredFeatures:['hand-tracking']});
    if(gl.makeXRCompatible)await gl.makeXRCompatible();
    const layer=new XRWebGLLayer(s,gl,{alpha:true,depth:true,antialias:false});
    s.updateRenderState({baseLayer:layer});
    ref=await s.requestReferenceSpace('local');
    session=s;mode=type==='immersive-ar'?'QUEST MR':'IMMERSIVE VR';
    window.__pmOnXRStart?.(mode);
    engine.reset();jointCache.left=null;jointCache.right=null;hands.left=null;hands.right=null;
    log('XR SESSION '+mode+' — JOINT DATA REQUESTED');
    s.addEventListener('end',()=>{
      session=null;ref=null;hands.left=null;hands.right=null;engine.reset();
      authenticated=Boolean(ws&&ws.readyState===WebSocket.OPEN&&authenticated);
      mode='DESKTOP';$('device').textContent='XR 已退出；桌面模拟恢复';log('XR SESSION END');
      window.__pmOnXREnd?.();
    });
    s.requestAnimationFrame(xrFrame);
  }catch(e){$('device').textContent='XR session error: '+e.message;log('XR ERROR: '+e.message);}
}
function xrFrame(time,frame){
  if(!session)return;
  session.requestAnimationFrame(xrFrame);
  hands.left=null;hands.right=null;
  for(const src of session.inputSources){
    if(!src.hand||!['left','right'].includes(src.handedness))continue;
    hands[src.handedness]=readHand(frame,src,src.handedness);
  }
  process(time);
  window.__pmXRAudioState?.(time);
  const pose=frame.getViewerPose(ref);if(!pose)return;
  const layer=session.renderState.baseLayer;
  gl.bindFramebuffer(gl.FRAMEBUFFER,layer.framebuffer);gl.enable(gl.SCISSOR_TEST);
  for(const v of pose.views){
    const vp=layer.getViewport(v);gl.viewport(vp.x,vp.y,vp.width,vp.height);
    gl.scissor(vp.x,vp.y,vp.width,vp.height);
    // Alpha = 0 is essential for Quest passthrough on immersive-ar.
    if(mode==='QUEST MR')gl.clearColor(0,0,0,0);else gl.clearColor(.003,.005,.006,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    render(v.transform.inverse.matrix,v.projectionMatrix);
  }
  gl.disable(gl.SCISSOR_TEST);
}
async function detect(){
  const ar=navigator.xr&&await navigator.xr.isSessionSupported('immersive-ar').catch(()=>false);
  const vr=navigator.xr&&await navigator.xr.isSessionSupported('immersive-vr').catch(()=>false);
  $('ar').disabled=!ar;$('vr').disabled=!vr;
  $('device').textContent='immersive-ar '+(ar?'YES':'NO')+' / immersive-vr '+(vr?'YES':'NO')+
    '. Quest MR 选 AR；Vision Pro 选择 VR。所有 XR 需要 HTTPS + hand-tracking 授权。';
}
$('ar').onclick=()=>enterXR('immersive-ar');
$('vr').onclick=()=>enterXR('immersive-vr');
$('hyst').oninput=e=>{
  const val=Number(e.target.value);engine.enterMargin=val/1000;
  engine.exitMargin=(val+5)/1000;
  $('hystvalue').textContent=val+' / '+(val+5);
};
$('dwell').oninput=e=>{engine.dwellMs=Number(e.target.value);$('dwellvalue').textContent=e.target.value;};
$('reset').onclick=()=>{engine.reset();log('ZONES RESET');};
$('panic').onclick=()=>{
  armed=false;$('arm').textContent='ARM OSC';
  if(authenticated&&ws?.readyState===WebSocket.OPEN){
    ws.send(JSON.stringify({type:'panic',seq:++seq,t_ms:Math.round(performance.now())}));
  }
  log('SOFT PANIC SENT / NOT PHYSICAL SAFETY');
};
$('connect').onclick=()=>{
  if(ws&&ws.readyState===WebSocket.OPEN){ws.close();return;}
  const url=$('endpoint').value.trim(),token=$('token').value;
  if(!/^wss?:\/\//.test(url)){$('wsstate').textContent='需要 wss://（开发 localhost 可 ws://）';return;}
  if(location.protocol==='https:'&&!url.startsWith('wss://')){$('wsstate').textContent='HTTPS 网页禁止 ws://；请使用受信任的 WSS';return;}
  if(!token){$('wsstate').textContent='先输入桥接令牌';return;}
  try{
    const socket=new WebSocket(url);ws=socket;authenticated=false;
    $('wsstate').textContent='CONNECTING…';
    socket.addEventListener('open',()=>socket.send(JSON.stringify({type:'hello',token})));
    socket.addEventListener('message',event=>{
      try{
        const data=JSON.parse(event.data);
        if(data.type==='ready'){
          authenticated=true;$('arm').disabled=false;
          $('wsstate').textContent='CONNECTED / OSC bridge ready; ARM to transmit';
          $('connect').textContent='DISCONNECT';
        } else if(data.type==='error')$('wsstate').textContent='ERROR: '+data.message;
      }catch(e){}
    });
    socket.addEventListener('close',()=>{
      authenticated=false;armed=false;$('arm').disabled=true;
      $('arm').textContent='ARM OSC';$('connect').textContent='CONNECT';
      $('wsstate').textContent='DISCONNECTED';
    });
    socket.addEventListener('error',()=>{$('wsstate').textContent='WSS failed: certificate / address / network';});
  }catch(e){$('wsstate').textContent=e.message;}
};
$('arm').onclick=()=>{
  if(!authenticated)return;
  armed=!armed;$('arm').textContent=armed?'DISARM OSC':'ARM OSC';
  log(armed?'OSC ARMED':'OSC DISARMED');
};
$('record').onclick=()=>{
  recording=!recording;
  if(recording){recordFrames=[];log('RECORD / max 2400 frames');$('download').disabled=true;}
  $('record').textContent=recording?'STOP RECORD':'RECORD JSON';
};
$('download').onclick=()=>{
  if(!recordFrames.length)return;
  const a=document.createElement('a'),b=new Blob([JSON.stringify({
    format:'performable-music-hand-osc-v0.1',note:'Desktop mode is simulated; XR mode contains actual WebXR API poses, which may include inferred joints.',frames:recordFrames},null,2)],{type:'application/json'});
  a.href=URL.createObjectURL(b);a.download='hand-space-osc-capture.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
// Human-editable zones before entering XR; live values are shared by the
// collision engine and the exact wireframe display.
const editor=$('zone-editor');
for(const z of zones){
  const wrap=document.createElement('div');
  wrap.style.cssText='border:1px solid #34403b;padding:8px;';
  const title=document.createElement('div');
  title.textContent=z.id+' / '+z.name;
  title.style.cssText='font-size:10px;color:#a9c0af;margin-bottom:5px;';
  wrap.appendChild(title);
  for(let k=0;k<4;k++){
    const label=document.createElement('label'),names=['x','y','z','radius'];
    label.textContent=names[k]+' (m)';
    label.style.cssText='display:inline-grid;width:50%;font-size:10px;gap:3px;';
    const inp=document.createElement('input');
    inp.type='number';inp.min=k===3?'.02':'-3';inp.max=k===3?'.5':'3';
    inp.step='.01';inp.value=String(k===3?z.radius:z.center[k]);
    inp.addEventListener('change',()=>{
      const value=Number(inp.value);
      if(!Number.isFinite(value))return;
      if(k===3)z.radius=clamp(value,.02,.5);
      else z.center[k]=clamp(value,-3,3);
      engine.reset();
      log('ZONE '+z.id+' GEOMETRY UPDATED');
    });
    label.appendChild(inp);wrap.appendChild(label);
  }
  editor.appendChild(wrap);
}
$('export-zones').onclick=()=>{
  const blob=new Blob([JSON.stringify({space:'local',units:'meters',zones},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='xr-regions.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
if(setupGL()){
  detect().catch(e=>$('device').textContent=e.message);
  requestAnimationFrame(desktopFrame);
}
