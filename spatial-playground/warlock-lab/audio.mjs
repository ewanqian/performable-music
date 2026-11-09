// Original synthesis: no Destiny samples or third-party recordings are bundled.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const PALETTES={stasis:[196,587,1480],solar:[110,220,440],void:[49,74,147],arc:[165,660,1980],strand:[146,349,698],prismatic:[196,293,740]};
export class ElementSound{
 constructor(){this.ctx=null;this.enabled=false;this.volume=.48;this.voices=0;this.maxVoices=28;this.samples=new Map();this.last=new Map();this.school='stasis';this.failed='';this.level=0;}
 init(){
  const A=globalThis.AudioContext||globalThis.webkitAudioContext;if(!A)throw Error('Web Audio unavailable');
  const c=this.ctx=new A({latencyHint:'interactive'});this.bus=c.createGain();this.bus.gain.value=.58;
  const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=12;comp.ratio.value=5;comp.attack.value=.004;comp.release.value=.16;
  const limiter=c.createWaveShaper();const curve=new Float32Array(1024);for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1;curve[i]=Math.tanh(x*1.3)/1.3;}limiter.curve=curve;
  this.master=c.createGain();this.master.gain.value=0;this.analyser=c.createAnalyser();this.analyser.fftSize=256;
  this.bus.connect(comp);comp.connect(limiter);limiter.connect(this.master);this.master.connect(this.analyser);this.analyser.connect(c.destination);
  const delay=c.createDelay(.6),feedback=c.createGain(),wet=c.createGain();delay.delayTime.value=.19;feedback.gain.value=.16;wet.gain.value=.15;this.bus.connect(delay);delay.connect(feedback);feedback.connect(delay);delay.connect(wet);wet.connect(comp);
  this.noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const n=this.noise.getChannelData(0);let seed=99413;for(let i=0;i<n.length;i++){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;n[i]=(seed>>>0)/2147483648-1;}
  this.drone=[];for(const [hz,vol] of [[49,.008],[147,.004],[196.4,.003]]){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=hz;g.gain.value=vol;o.connect(g);g.connect(this.bus);o.start();this.drone.push({o,g});}
  this.airSource=c.createBufferSource();this.airSource.buffer=this.noise;this.airSource.loop=true;
  this.airFilter=c.createBiquadFilter();this.airFilter.type='bandpass';this.airFilter.frequency.value=650;this.airFilter.Q.value=.65;
  this.airGain=c.createGain();this.airGain.gain.value=.0001;this.airSource.connect(this.airFilter);this.airFilter.connect(this.airGain);this.airGain.connect(this.bus);this.airSource.start();
 }
 async start(){try{if(!this.ctx)this.init();await this.ctx.resume();this.enabled=this.ctx.state==='running';this.master.gain.setTargetAtTime(this.enabled?this.volume:0,this.ctx.currentTime,.06);this.failed=this.enabled?'':'AudioContext suspended';return this.enabled;}catch(e){this.failed=String(e.message||e);this.enabled=false;return false;}}
 mute(){this.enabled=false;if(this.ctx)this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.04);}
 spatial(node,p){const c=this.ctx,g=c.createStereoPanner();g.pan.value=clamp((p?.[0]||0)/2.5,-.9,.9);node.connect(g);g.connect(this.bus);return g;}
 tone(f,dur,gain,p,type='sine',slide=1,delay=0){
  if(!this.enabled||this.voices>=this.maxVoices)return;const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),env=c.createGain();this.voices++;
  o.type=type;o.frequency.setValueAtTime(Math.max(20,f),t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+dur);
  env.gain.setValueAtTime(.00001,t);env.gain.exponentialRampToValueAtTime(Math.max(.0001,gain),t+.008);env.gain.exponentialRampToValueAtTime(.00001,t+dur);o.connect(env);const pan=this.spatial(env,p);o.start(t);o.stop(t+dur+.03);o.onended=()=>{this.voices--;o.disconnect();env.disconnect();pan.disconnect();};
 }
 noiseHit(freq,dur,gain,p,q=1){
  if(!this.enabled||this.voices>=this.maxVoices)return;const c=this.ctx,t=c.currentTime,s=c.createBufferSource(),filter=c.createBiquadFilter(),env=c.createGain();this.voices++;
  s.buffer=this.noise;filter.type='bandpass';filter.frequency.setValueAtTime(freq,t);filter.frequency.exponentialRampToValueAtTime(Math.max(90,freq*.38),t+dur);filter.Q.value=q;
  env.gain.setValueAtTime(.00001,t);env.gain.exponentialRampToValueAtTime(gain,t+.006);env.gain.exponentialRampToValueAtTime(.00001,t+dur);s.connect(filter);filter.connect(env);const pan=this.spatial(env,p);s.start(t,0,dur);s.onended=()=>{this.voices--;s.disconnect();filter.disconnect();env.disconnect();pan.disconnect();};
 }
 event(e){
  if(!this.enabled||!e)return;const now=this.ctx.currentTime,key=e.school+':'+e.type;
  const spacing=e.type==='cast'?.10:e.type==='hit'?.065:e.type==='chain'?.12:.04;
  if(now-(this.last.get(key)||-10)<spacing)return;this.last.set(key,now);
  const custom=this.samples.get(e.school+':'+e.type);
  if(custom){if(this.voices>=this.maxVoices)return;const s=this.ctx.createBufferSource(),g=this.ctx.createGain();s.buffer=custom;g.gain.value=.38;s.connect(g);const p=this.spatial(g,e.p);this.voices++;s.start();s.onended=()=>{this.voices--;s.disconnect();g.disconnect();p.disconnect();};return;}
  const palette=PALETTES[e.school]||PALETTES.stasis,p=e.p||[0,0,-2];
  if(e.type==='cast'){this.tone(palette[0],.22,.035,p,'triangle',.6);this.tone(palette[2],.27,.014,p,'sine',.68,.016);this.noiseHit(e.school==='void'?240:1400,.16,.065,p,1.6);}
  if(e.type==='freeze'){for(const ratio of [1,1.414,2.7])this.tone(810*ratio,.5,.012,p,'sine',.97);this.noiseHit(3900,.21,.06,p,3);}
  if(e.type==='shatter'){this.noiseHit(4500,.42,.17,p,1.3);this.noiseHit(420,.55,.12,p,.7);this.tone(63,.50,.055,p,'sine',.65);for(let i=0;i<4;i++)this.tone(900+i*422,.28,.012,p,'sine',.77,i*.026);}
  if(e.type==='impact'||e.type==='destroy'){this.noiseHit(e.kind==='ice'?3200:780,.20,.07,p,1);this.tone(palette[1],.15,.018,p,'triangle',.7);}
  if(e.type==='nova'){this.tone(42,.95,.085,p,'sine',.55);this.noiseHit(270,.75,.18,p,1.4);this.tone(211,.6,.025,p,'triangle',.28);}
  if(e.type==='chain'){this.noiseHit(2400,.12,.06,p,3);this.tone(110,.10,.025,p,'sawtooth',1.7);}
  if(e.type==='super'){this.noiseHit(420,.8,.12,p,.7);for(let i=0;i<3;i++)this.tone(palette[i],.85,.04/(i+1),p,'triangle',1.9,i*.05);}
  if(e.type==='secondary'||e.type==='field'){this.tone(palette[0],.5,.035,p,'triangle',1.6);this.noiseHit(900,.3,.07,p);}
 }
 update(school,charge,moving=false){this.school=school;if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime,p=PALETTES[school]||PALETTES.stasis;
  this.drone.forEach((x,i)=>x.o.frequency.setTargetAtTime(p[0]*(i===0?.25:i===1?.5:1.003),t,.8));this.airGain.gain.setTargetAtTime(.0005+Math.min(3,charge)*.010+(moving?.007:0),t,.08);this.airFilter.frequency.setTargetAtTime(430+charge*690,t,.1);
 }
 async load(key,file){if(!this.ctx)this.init();if(!file||file.size>20*1024*1024)throw Error('请选择 20 MB 以下的音频');const buffer=await this.ctx.decodeAudioData(await file.arrayBuffer());if(buffer.duration>12)throw Error('音效请裁剪到 12 秒以内');this.samples.set(key,buffer);return buffer.duration;}
 diagnostics(){if(!this.analyser)return {enabled:false,state:'locked',rms:0,voices:0};const a=new Float32Array(this.analyser.fftSize);this.analyser.getFloatTimeDomainData(a);return {enabled:this.enabled,state:this.ctx.state,rms:Math.sqrt(a.reduce((sum,v)=>sum+v*v,0)/a.length),voices:this.voices};}
}
