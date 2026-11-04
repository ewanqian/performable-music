// Real WebGL geometry; same validated frame/hash that SC receives through OSC.
// No FFT, browser synth, third-party libraries or strobe.
const $=id=>document.getElementById(id),canvas=$('field');
const gl=canvas.getContext('webgl',{preserveDrawingBuffer:true,antialias:true});
if(!gl)throw new Error('WebGL unavailable; do not claim a visual pass.');
const vs=`precision mediump float;attribute vec3 point;uniform float space;uniform float energy;uniform float time;uniform float impact;void main(){float angle=time*.07;vec3 p=point;float x=p.x*cos(angle)-p.z*sin(angle);float z=p.x*sin(angle)+p.z*cos(angle);float scale=.16+space*1.05+impact*.12; x+=sign(p.x)*impact*.22;float depth=2.5+z*.35;gl_Position=vec4(x*scale/depth,p.y*scale/depth,0.,1.);gl_PointSize=1.0+energy*1.7;}`;
const fs=`precision mediump float;uniform float energy;void main(){float a=.04+energy*.72;gl_FragColor=vec4(vec3(a),1.);}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
const points=[];
// A single ribbed field: compressed into a seam in HOLD; opens into two wings.
function point(u,v){return [u*2.15,v*1.32,Math.sin(u*2.1)*.45+v*.14];}
function line(a,b){points.push(...a,...b);}
for(let row=0;row<23;row++)for(let col=0;col<64;col++){
 const v=row/22*2-1,u=col/64*2-1;line(point(u,v),point(u+2/64,v));
}
for(const u of [-1,-.5,0,.5,1])for(let row=0;row<22;row++)line(point(u,row/22*2-1),point(u,(row+1)/22*2-1));
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'point');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,0,0);
const uniforms=Object.fromEntries(['space','energy','time','impact'].map(k=>[k,gl.getUniformLocation(program,k)]));
let frame=null,hash='',lastAt=0,impact=0,energy=0,space=.12,session='',safe=true,video=null,chunks=[],pendingEvents=[],lastDraw=performance.now(),lastSafe=null;
const ids=new Set();
const ws=new WebSocket(`ws://${location.host}/ws`);
function send(v){if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(v));}
ws.onopen=()=>{$('status').textContent='WebGL / WS 已连接；先由本地终端 ARM SC。';send({type:'visual_ready',webgl:gl.getParameter(gl.VERSION)});};
ws.onmessage=e=>{const packet=JSON.parse(e.data);if(packet.type!=='score')return;
 frame=packet.frame;hash=packet.hash;lastAt=performance.now();
 if(frame.session_id!==session){session=frame.session_id;ids.clear();}
 const event=frame.event;if(event&&!ids.has(event.id)){ids.add(event.id);if(event.type==='OVERRIDE')impact=1;pendingEvents.push({id:event.id,seq:frame.seq,hash,event:event.type,t_ms:frame.t_ms});}
 $('debug').textContent=`session ${session}\nseq ${frame.seq} / score time ${(frame.t_ms/1000).toFixed(3)} s\nevent ${event?.id||'—'} / hash ${hash}\nAudio is produced by SC; this canvas records video only.`;
};
ws.onclose=()=>{$('status').textContent='连接中断：视觉本地超时进入 SAFE；SC 有独立超时。';lastAt=0;};
function draw(now){
 const dt=Math.min(.1,(now-lastDraw)/1000);lastDraw=now;
 safe=!frame||!lastAt||now-lastAt>750||frame.safe.neutral||frame.safe.manual_kill;
 const e=safe?0:frame.controls.energy,s=safe?.12:frame.controls.space;
 energy+=(e-energy)*Math.min(1,dt*9);space+=(s-space)*Math.min(1,dt*8);impact=safe?0:impact*Math.exp(-dt*2);
 gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
 gl.uniform1f(uniforms.energy,energy);gl.uniform1f(uniforms.space,space);gl.uniform1f(uniforms.time,(frame?.t_ms||0)/1000);gl.uniform1f(uniforms.impact,impact);gl.drawArrays(gl.LINES,0,points.length/3);
 $('phase').textContent=safe?'SAFE':`${frame.scene} / ${frame.state}`;$('health').textContent=safe?'NEUTRAL':`SCORE ${(frame.t_ms/1000).toFixed(2)} s`;
 // Acknowledge after issuing the real GL draw, with the exact event payload hash.
 for(const event of pendingEvents)send({type:'visual_event',...event,applied_ms:now,draw_calls:1});pendingEvents=[];
 if(safe!==lastSafe){send({type:'visual_safe',safe,seq:frame?.seq??-1,applied_ms:now});lastSafe=safe;}
 requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
async function command(name){const r=await fetch('/api/'+name,{method:'POST'});const d=await r.json();if(!r.ok)throw Error(d.error||r.status);return d;}
async function begin(replay=false){
 if(video&&video.state!=='inactive')throw Error('Capture already active');
 const stream=canvas.captureStream(20);chunks=[];
 video=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:1400000});
 video.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 video.onstop=async()=>{
  const blob=new Blob(chunks,{type:'video/webm'}),url=URL.createObjectURL(blob);$('download').href=url;$('download').download=session+'-webgl.webm';$('download').hidden=false;$('download').textContent='下载本地 WebGL 录像';
  try{const r=await fetch('/capture?session='+encodeURIComponent(session),{method:'POST',body:blob});if(!r.ok)throw Error(r.status);$('status').textContent='Capture saved: '+JSON.stringify(await r.json());}catch(e){$('status').textContent='录像尚未上传本地服务，可使用下载链接保留：'+e.message;}
  stream.getTracks().forEach(t=>t.stop());
 };
 video.start(500);send({type:'capture_start',browser_ms:performance.now()});
 try{if(replay){const r=await fetch('/api/replay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session:$('replay-session').value})});const d=await r.json();if(!r.ok)throw Error(d.error);}else await command('start');$('status').textContent='录制中。HOLD 后按 OVERRIDE；事件等待安全小节边界。';}catch(e){video.stop();throw e;}
}
$('replay').onclick=()=>begin(true).catch(e=>$('status').textContent=e.message);
$('start').onclick=()=>begin().catch(e=>$('status').textContent=e.message);
$('override').onclick=()=>command('override').then(d=>$('status').textContent='OVERRIDE 已排队：'+JSON.stringify(d.state)).catch(e=>$('status').textContent=e.message);
$('kill').onclick=()=>command('kill').catch(e=>$('status').textContent=e.message);
$('stop').onclick=async()=>{try{await command('stop');}catch(e){$('status').textContent=e.message;}finally{if(video&&video.state!=='inactive')video.stop();}};
