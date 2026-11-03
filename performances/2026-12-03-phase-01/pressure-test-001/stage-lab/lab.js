// CRITICAL FIELD: original browser cue/stem mixer and reference field renderer.
// No external libraries. No AVP/OSC/network claims.
// Requires locally generated stems/*.wav and show-score-reference.json.
const configs = [
  {id:'A',name:'VACUUM / INITIAL FORCE',t:0},
  {id:'B',name:'MOTION / TWO CLOCKS',t:9.375},
  {id:'C',name:'SUSPENSION / FRACTURE',t:31.875},
  {id:'D',name:'OVERRIDE / CRITICAL MASS',t:45},
  {id:'E',name:'AFTERIMAGE / RETURN',t:67.5}
];
const stems=[['sub-impact','sub'],['mechanism','mech'],['harmonic','harm'],['field','fieldlvl']];
const el=q=>document.querySelector(q), buttons=[...document.querySelectorAll('.scene-btn')];
let ctx=null, master=null, buffers=null, nodes=[], playing=false, startClock=0, baseOffset=0, scoreFrames=[];
const DURATION=78.75;
function fmt(t){const mm=Math.floor(t/60).toString().padStart(2,'0');const ss=(t%60).toFixed(2).padStart(5,'0');return mm+':'+ss;}
async function preload(){
  if(!ctx){
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    const comp=ctx.createDynamicsCompressor();
    comp.threshold.value=-15;comp.knee.value=12;comp.ratio.value=6;comp.attack.value=.004;comp.release.value=.18;
    master=ctx.createGain();master.gain.value=.7;master.connect(comp);comp.connect(ctx.destination);
  }
  await ctx.resume();
  if(!buffers){
    el('#status').textContent='正在加载四条完整音轨…';
    buffers=await Promise.all(stems.map(async pair=>{
      const name=pair[0],res=await fetch('../stems/'+name+'.wav');
      if(!res.ok)throw new Error('音轨加载失败：'+name+'；先执行 python render.py');
      return await ctx.decodeAudioData(await res.arrayBuffer());
    }));
  }
  if(!scoreFrames.length){
    const r=await fetch('../show-score-reference.json');
    if(r.ok)scoreFrames=(await r.json()).frames;
  }
}
function timeNow(){return playing?Math.min(DURATION,Math.max(0,baseOffset+ctx.currentTime-startClock)):baseOffset;}
function halt(){
  for(const entry of nodes){try{entry.source.stop();}catch(e){}}
  nodes=[];playing=false;el('#stop').disabled=true;el('#safe').disabled=true;
}
function stop(){
  halt();baseOffset=0;
  if(master&&ctx)master.gain.setValueAtTime(.7,ctx.currentTime);
  el('#play').textContent='PLAY';el('#status').textContent='已停止';
}
async function playFrom(seconds){
  await preload();halt();baseOffset=seconds;
  startClock=ctx.currentTime+.065;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(.7,ctx.currentTime);
  nodes=stems.map((pair,index)=>{
    const name=pair[0],id=pair[1],source=ctx.createBufferSource(),gain=ctx.createGain();
    source.buffer=buffers[index];gain.gain.value=Number(el('#'+id).value);
    source.connect(gain);gain.connect(master);
    source.start(startClock,Math.min(seconds,source.buffer.duration-.01));
    return {source,gain,id};
  });
  playing=true;el('#play').textContent='RESTART';el('#stop').disabled=false;el('#safe').disabled=false;
  el('#status').textContent='PLAYING · 原创预制音轨 + 实时四 Stem 音量调整';
}
for(const pair of stems){
  const id=pair[1],input=el('#'+id);
  input.addEventListener('input',()=>{
    el('#'+id+'v').textContent=Number(input.value).toFixed(2);
    if(ctx){for(const n of nodes)if(n.id===id)n.gain.gain.setTargetAtTime(Number(input.value),ctx.currentTime,.045);}
  });
}
el('#play').addEventListener('click',async()=>{try{await playFrom(0)}catch(e){el('#status').textContent='ERROR: '+e.message}});
el('#stop').addEventListener('click',stop);
el('#safe').addEventListener('click',()=>{
  if(!ctx)return;
  const now=ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value,now);
  master.gain.linearRampToValueAtTime(0,now+.13);
  el('#status').textContent='SAFE：浏览器音频渐静，非物理急停';
});
buttons.forEach((button,i)=>button.addEventListener('click',async()=>{try{await playFrom(configs[i].t)}catch(e){el('#status').textContent='ERROR: '+e.message}}));
const canvas=el('#field'),g=canvas.getContext('2d');
let w=1,h=1,dpr=1;
function resize(){
  dpr=Math.min(devicePixelRatio||1,2);const r=canvas.getBoundingClientRect();
  w=r.width;h=r.height;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  g.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize',resize);resize();
function scoreAt(t){
  if(!scoreFrames.length)return {energy:.25,density:.3,tension:.5,space:.3};
  const idx=Math.min(scoreFrames.length-1,Math.max(0,Math.floor(t*20)));
  return scoreFrames[idx].score;
}
function render(){
  const tt=timeNow();
  if(playing&&tt>=DURATION){halt();el('#status').textContent='播放完成';}
  const scene=[...configs].reverse().find(s=>tt>=s.t)||configs[0];
  el('#time').textContent=fmt(tt)+' / 01:18.75\n128 BPM / 4/4 · 42 BARS';
  el('#sceneTitle').textContent=scene.id+' / '+scene.name;
  buttons.forEach((b,i)=>b.classList.toggle('active',configs[i].id===scene.id));
  const sc=scoreAt(tt),cx=w/2,cy=h/2;
  g.fillStyle='#030403';g.fillRect(0,0,w,h);
  const R=Math.min(w,h)*(.16+.24*sc.space);
  const n=Math.floor(70+500*sc.density),speed=.12+.26*sc.energy;
  const rupture=scene.id==='D'?1:0;
  g.save();g.translate(cx,cy);
  g.strokeStyle='rgba(226,225,218,'+(.08+.16*sc.tension)+')';
  g.lineWidth=.8;
  for(let k=0;k<8;k++){
    const off=k*2*Math.PI/8+tt*speed*.2,rr=R*(.6+k*.095);
    g.beginPath();g.ellipse(0,0,rr,rr*(.45+.35*sc.space),off,0,2*Math.PI);g.stroke();
  }
  for(let j=0;j<n;j++){
    const ph=j*2.39996+tt*speed*(j%3===0?-1:1);
    const radius=R*Math.sqrt((j+.5)/n)*(1+.45*rupture*Math.sin(j*.13+tt*1.4));
    const x=radius*Math.cos(ph),y=radius*.6*Math.sin(ph),size=(j%23===0?1.7:.7)+(rupture*.35);
    g.fillStyle='rgba(235,233,220,'+(.22+.65*sc.energy*(.55+.45*Math.sin(j)))+')';
    g.fillRect(x,y,size,size);
  }
  g.restore();requestAnimationFrame(render);
}
render();
