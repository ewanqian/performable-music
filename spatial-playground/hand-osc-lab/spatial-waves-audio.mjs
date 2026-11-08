// Spatial Waves local synth: independent spatial PannerNode HRTF sources.
// No copied samples or claims of measured ambisonic decoding.
import {VOLUMES,clamp} from './spatial-waves-engine.mjs';
const PATTERNS={
 pulse:[1,0,0,.32,1,0,.46,0,1,0,0,.35,1,.46,0,.52],
 mineral:[0,0,.65,0,0,.35,0,.70,0,0,.65,0,0,.35,0,.9],
 air:[.2,.15,.25,.18,.2,.15,.25,.18,.2,.15,.25,.18,.2,.15,.25,.18],
 harmonic:[.1,0,0,0,.42,0,0,0,.15,0,.2,0,.6,0,0,0]
};
const bound=(a,b,c)=>clamp(a,b,c);
export class SpatialWavesAudio{
 constructor(){
  this.ctx=null;this.voices=new Map();this.layers=new Map(VOLUMES.map(v=>[v.id,v.id==='pulse'?.32:.10]));
  this.ready=false;this.muted=true;this.bpm=100;this.swing=0;this.active=new Set();
  this.transport=false;this.timer=null;this.nextBeat=0;this.step=0;this.attackCount=0;this.maxAttacks=18;
  this.listenerPose='FIXED_ORIGIN_NOT_XR_TRACKED';this.stems=new Map();this.stemPlayers=[];this.stemGains=new Map();
 }
 async start(){
  if(this.ready){await this.ctx.resume();this.muted=false;this.master.gain.setTargetAtTime(.58,this.ctx.currentTime,.08);return;}
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)throw Error('AudioContext unavailable');
  this.ctx=new AC({latencyHint:'interactive'});
  await this.ctx.resume();
  const c=this.ctx;
  this.master=c.createGain();this.master.gain.value=.0;
  this.limiter=c.createDynamicsCompressor();
  this.limiter.threshold.value=-18;this.limiter.ratio.value=10;this.limiter.attack.value=.003;
  this.master.connect(this.limiter);this.limiter.connect(c.destination);
  for(let i=0;i<VOLUMES.length;i++){
   const v=VOLUMES[i],pan=c.createPanner(),filter=c.createBiquadFilter();
   pan.panningModel='HRTF';pan.distanceModel='inverse';
   pan.refDistance=.28;pan.maxDistance=6;pan.rolloffFactor=.65;
   const volume=c.createGain();volume.gain.value=0;
   const osc1=c.createOscillator(),osc2=c.createOscillator(),g1=c.createGain(),g2=c.createGain();
   const fundamentals=[55,147,240,165];
   osc1.type=['sine','triangle','sawtooth','sine'][i];
   osc2.type=['triangle','sine','sine','sawtooth'][i];
   osc1.frequency.value=fundamentals[i];osc2.frequency.value=fundamentals[i]*[1.5,2.73,1.04,1.5][i];
   g1.gain.value=[.40,.25,.08,.22][i];g2.gain.value=[.12,.13,.045,.11][i];
   osc1.connect(g1);osc2.connect(g2);g1.connect(filter);g2.connect(filter);
   filter.type='lowpass';filter.frequency.value=650+i*420;filter.Q.value=i===1?4:1.25;
   filter.connect(volume);volume.connect(pan);pan.connect(this.master);
   pan.positionX.value=v.center[0];pan.positionY.value=v.center[1];pan.positionZ.value=v.center[2];
   osc1.start();osc2.start();
   this.voices.set(v.id,{panner:pan,filter,volume,osc1,osc2,position:v.center.slice()});
  }
  this.ready=true;this.muted=false;
  this.master.gain.setTargetAtTime(.58,c.currentTime,.08);
 }
 setActive(zones){
  const active=new Set(zones.filter(x=>this.voices.has(x)));
  for(const id of active)if(!this.active.has(id))this.accent(id,.65);
  this.active=active;this.update();
 }
 update({spread=.5,energy=.4,focus=.5}={}){
  if(!this.ready||this.muted||this.ctx.state!=='running')return;
  const c=this.ctx,t=c.currentTime;
  for(const [id,v] of this.voices){
   const source=VOLUMES.find(x=>x.id===id);
   const on=this.active.has(id);
   const layer=this.layers.get(id)||0;
   const level=Math.min(.22,layer*(on?.32:.10)+.018*energy);
   v.volume.gain.setTargetAtTime(level,t,on?.025:.085);
   const freq=160+Math.pow(focus,1.8)*6100;
   v.filter.frequency.setTargetAtTime(freq*(id==='pulse'?.52:1.0),t,.045);
   const spatialScale=.75+spread*.84;
   const pos=source.center;
   v.panner.positionX.setTargetAtTime(pos[0]*spatialScale,t,.08);
   v.panner.positionY.setTargetAtTime(pos[1]+(.08*energy),t,.08);
   v.panner.positionZ.setTargetAtTime(pos[2]-.15*spread,t,.08);
   v.position=[pos[0]*spatialScale,pos[1]+.08*energy,pos[2]-.15*spread];
   const stemGain=this.stemGains.get(id);
   if(stemGain)stemGain.gain.setTargetAtTime((this.layers.get(id)||0)*.30*(on?1:.38),t,.050);
  }
 }
 accent(id,velocity=.6,when=null){
  if(!this.ready||this.muted||this.ctx.state!=='running'||this.attackCount>=this.maxAttacks)return false;
  const c=this.ctx,t=Math.max(c.currentTime+.004,when??c.currentTime+.005),voice=this.voices.get(id);
  if(!voice)return false;this.attackCount++;
  const i=VOLUMES.findIndex(v=>v.id===id);
  const osc=c.createOscillator(),env=c.createGain();
  osc.type=['sine','triangle','square','triangle'][i];
  osc.frequency.setValueAtTime([54,490,1500,275][i]*1.65,t);
  osc.frequency.exponentialRampToValueAtTime([47,160,620,208][i],t+.17);
  const amp=.015+bound(velocity,0,1)*.060;
  env.gain.setValueAtTime(.0001,t);
  env.gain.exponentialRampToValueAtTime(amp,t+.009);
  env.gain.exponentialRampToValueAtTime(.0001,t+.22);
  osc.connect(env);env.connect(voice.panner);
  osc.start(t);osc.stop(t+.24);
  osc.onended=()=>{this.attackCount--;try{osc.disconnect();env.disconnect()}catch{}};
  return true;
 }
 async loadStems(files){
  if(!this.ready)await this.start();
  if(!Array.isArray(files)||files.length!==4)throw Error('Choose exactly four files in PULSE / MINERAL / AIR / HARMONIC order');
  if(this.transport)this.stop();
  const decoded=[];
  for(let i=0;i<4;i++){
   const file=files[i];
   if(!file||file.size>32*1024*1024)throw Error('Each local audio file must be 32 MB or smaller');
   if(!/audio\/|\.wav$|\.mp3$|\.aif$|\.ogg$/i.test(file.type+' '+file.name))
    throw Error('Unsupported file; choose WAV/MP3/AIFF/Ogg');
   const bytes=await file.arrayBuffer();
   decoded.push(await this.ctx.decodeAudioData(bytes));
  }
  const duration=decoded[0].duration;
  if(!Number.isFinite(duration)||duration<.5||duration>360)
   throw Error('Stems must be between 0.5 and 360 seconds');
  if(decoded.some(buffer=>Math.abs(buffer.duration-duration)>.065))
   throw Error('Four stems must have matching duration within 65ms');
  this.stems.clear();
  for(let i=0;i<4;i++)this.stems.set(VOLUMES[i].id,decoded[i]);
  return duration;
 }
 startStems(time){
  if(this.stems.size!==4)return;
  this.stopStems();
  for(const vol of VOLUMES){
   const voice=this.voices.get(vol.id),buffer=this.stems.get(vol.id);
   if(!voice||!buffer)continue;
   const src=this.ctx.createBufferSource(),gain=this.ctx.createGain();
   src.buffer=buffer;src.loop=true;gain.gain.value=(this.layers.get(vol.id)||0)*.33;
   src.connect(gain);gain.connect(voice.panner);
   src.start(time);
   this.stemPlayers.push({src,gain,id:vol.id});
   this.stemGains.set(vol.id,gain);
  }
 }
 stopStems(){
  for(const {src,gain} of this.stemPlayers){
   try{src.stop()}catch{}
   try{src.disconnect();gain.disconnect()}catch{}
  }
  this.stemPlayers=[];this.stemGains.clear();
 }
 setBpm(bpm){this.bpm=bound(bpm,40,160);}
 play(){
  if(!this.ready||this.muted)return false;
  this.stop();
  this.transport=true;this.step=0;this.nextBeat=this.ctx.currentTime+.04;
  // AudioContext clock—not setInterval timing—owns each note onset.
  this.startStems(this.nextBeat);
  this.timer=setInterval(()=>this.schedule(),25);
  return true;
 }
 schedule(){
  if(!this.transport||!this.ready||this.muted)return;
  const horizon=this.ctx.currentTime+.120,interval=60/this.bpm/4;
  while(this.nextBeat<horizon){
   for(const id of VOLUMES.map(v=>v.id)){
    const amount=PATTERNS[id][this.step%16];
    if(amount>0.05 && (this.layers.get(id)||0)>.09){
     this.accent(id,amount*(this.layers.get(id)||.2),this.nextBeat);
    }
   }
   this.step++;this.nextBeat+=interval;
  }
 }
 raise(id){
  if(!this.voices.has(id))return;
  this.layers.set(id,clamp((this.layers.get(id)||0)+.19));
 }
 resetLayers(){
  this.layers=new Map([['pulse',.45],['mineral',.12],['air',.14],['harmonic',.16]]);
  this.active.clear();
 }
 stop(){if(this.timer!==null){clearInterval(this.timer);this.timer=null;}this.stopStems();this.transport=false;}
 panic(){
  this.stop();this.muted=true;this.active.clear();
  if(!this.ready)return;
  const t=this.ctx.currentTime;
  this.master.gain.cancelScheduledValues(t);this.master.gain.setTargetAtTime(0,t,.015);
  for(const v of this.voices.values())v.volume.gain.setTargetAtTime(0,t,.015);
 }
 soundCheck(){
  if(!this.ready||this.muted)return false;
  this.accent('mineral',.8);this.accent('harmonic',.6,this.ctx.currentTime+.25);
  return true;
 }
 status(){return {ready:this.ready,muted:this.muted,context:this.ctx?.state||'uninitialized',
   transport:this.transport,bpm:this.bpm,step:this.step,active:[...this.active],
   listener:this.listenerPose,stems:this.stems.size===4?'4 SYNCED LOCAL STEMS':'ORIGINAL SYNTH',layers:Object.fromEntries(this.layers),
   positions:Object.fromEntries([...this.voices].map(([key,v])=>[key,v.position]))};}
}
