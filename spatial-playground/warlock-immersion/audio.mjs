// Original synthesis only. Optional replacements are user-selected local files, never uploaded.
const LIMIT=30;
export class ElementAudio {
 constructor(){this.ctx=null;this.enabled=false;this.volume=.45;this.voices=0;this.nodes=new Set();this.custom=new Map();this.lastArc=-10;this.lastHit=-10;}
 async start(){try{if(!this.ctx)this.init();await this.ctx.resume();this.enabled=true;this.master.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.06);return true;}catch(e){this.error=String(e.message||e);return false;}}
 init(){const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)throw Error('Web Audio unavailable');const c=this.ctx=new C({latencyHint:'interactive'});this.master=c.createGain();this.master.gain.value=0;this.limit=c.createDynamicsCompressor();this.limit.threshold.value=-18;this.limit.ratio.value=5;this.limit.attack.value=.003;this.limit.release.value=.2;this.bus=c.createGain();this.bus.gain.value=.6;this.bus.connect(this.limit);this.limit.connect(this.master);this.master.connect(c.destination);this.noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const data=this.noise.getChannelData(0);let s=12345;for(let i=0;i<data.length;i++){s^=s<<13;s^=s>>>17;s^=s<<5;data[i]=(s>>>0)/2147483648-1;}}
 mute(){this.enabled=false;if(this.ctx)this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.04);}
 level(v){this.volume=Math.max(0,Math.min(1,Number(v)||0));if(this.ctx&&this.enabled)this.master.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.04);}
 tone(freq,end,dur,gain=.12,type='sine',delay=0){if(!this.ctx||!this.enabled||this.voices>=LIMIT)return;const c=this.ctx,t=c.currentTime+.004+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(22,freq),t);o.frequency.exponentialRampToValueAtTime(Math.max(22,end),t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.001,gain),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(this.bus);this.voices++;o.onended=()=>{o.disconnect();g.disconnect();this.voices--;};o.start(t);o.stop(t+dur+.02);}
 air(hz,end,dur,gain=.1){if(!this.ctx||!this.enabled||this.voices>=LIMIT)return;const c=this.ctx,t=c.currentTime+.004,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noise;f.type='bandpass';f.Q.value=1.6;f.frequency.setValueAtTime(hz,t);f.frequency.exponentialRampToValueAtTime(end,t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(this.bus);this.voices++;s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();this.voices--;};s.start(t,.1,dur+.02);}
 async load(file,key){if(file.size>20*1024*1024)throw Error('文件上限 20 MB');if(!this.ctx)this.init();const data=await this.ctx.decodeAudioData(await file.arrayBuffer());if(data.duration>30)throw Error('单条音效请短于 30 秒');this.custom.set(key,data);return data.duration;}
 playCustom(key){const b=this.custom.get(key);if(!b||!this.enabled||this.voices>=LIMIT)return false;const s=this.ctx.createBufferSource(),g=this.ctx.createGain();s.buffer=b;g.gain.value=.25;s.connect(g);g.connect(this.bus);this.voices++;s.onended=()=>{s.disconnect();g.disconnect();this.voices--;};s.start();return true;}
 event(e){if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;
 const type=e.type==='cast'?'cast':e.type==='wave'?'burst':e.type==='shatter'?'shatter':e.type==='summon'?'summon':null;
 if(type&&this.playCustom(e.school+':'+type))return;
 const t=this.ctx.currentTime;
 if(e.type==='summon'){this.tone(90,210,.7,.06);this.air(300,2600,.65,.07);return;}
 if(e.type==='arc'){if(t-this.lastArc<.14)return;this.lastArc=t;this.air(1800,650,.13,.07);this.tone(110,75,.11,.035,'sawtooth');return;}
 if(e.type==='freeze'){this.tone(1350,620,.33,.07,'triangle');this.tone(2480,2300,.23,.035,'sine',.025);this.air(3400,1100,.22,.06);return;}
 if(e.type==='shatter'){if(t-this.lastHit<.07)return;this.lastHit=t;this.air(4200,400,.65,.2);this.tone(105,42,.45,.17);for(let i=0;i<4;i++)this.tone(1700+i*410,500+i*170,.3+i*.04,.02,'triangle',i*.025);return;}
 if(e.type==='nova'||e.type==='transcend'){this.tone(170,28,.85,.2);this.tone(55,62,1.1,.10);this.air(260,1600,.6,.13);return;}
 if(e.type==='wave'){this.tone(170,36,.5,.10);this.air(700,2300,.36,.06);return;}
 if(e.type==='cast'){
  if(e.school==='stasis'){this.tone(640,1500,.12,.065,'triangle');this.air(2800,800,.24,.10);this.tone(2700,1700,.31,.025);}
  if(e.school==='solar'){this.air(550,2700,.32,.14);this.tone(210,75,.26,.065,'sawtooth');}
  if(e.school==='void'){this.tone(150,36,.65,.17);this.tone(74,62,.73,.06,'triangle');this.air(300,70,.52,.07);}
  if(e.school==='strand'){for(let i=0;i<4;i++)this.tone(510+i*190,190+i*60,.14,.034,'triangle',i*.018);this.air(2600,1200,.17,.06);}
  if(e.school==='prismatic'){this.tone(390,780,.22,.055);this.tone(585,1100,.33,.035,'triangle');this.air(1700,3300,.23,.07);}
 }
 if(e.type==='hit'&&t-this.lastHit>.10){this.lastHit=t;this.tone(420,180,.09,.025);}
 }
}
