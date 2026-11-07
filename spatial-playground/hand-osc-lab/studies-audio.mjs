// Three sound lanes: a real user-stem player, proven procedural fallback,
// and a pinned, optional Tone.js synthesis engine. No fake studio connection.
import {OrganicAudio} from './organic-audio.mjs';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
export class StemTransport{
  constructor(){this.ctx=null;this.buffers=new Map();this.sources=new Map();this.mixes=new Map();
    this.master=null;this.running=false;this.startedAt=0;this.names=['PULSE','METAL','SHIMMER','DRONE'];}
  async start(){
    if(!this.ctx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)throw Error('Web Audio unavailable');
      this.ctx=new AC({latencyHint:'playback'});
      this.master=this.ctx.createGain();this.master.gain.value=.42;
      const compressor=this.ctx.createDynamicsCompressor();
      compressor.threshold.value=-15;compressor.ratio.value=12;compressor.attack.value=.005;
      this.master.connect(compressor);compressor.connect(this.ctx.destination);
    }
    await this.ctx.resume();
  }
  async importFile(slot,file){
    if(!this.names.includes(slot))throw Error('Unknown stem '+slot);
    if(!file||!file.type.startsWith('audio/'))throw Error('Select an audio file');
    if(file.size>36*1024*1024)throw Error('Each stem must be under 36 MB for headset memory safety');
    await this.start();
    const buffer=await this.ctx.decodeAudioData(await file.arrayBuffer());
    if(!Number.isFinite(buffer.duration)||buffer.duration<=0)throw Error('Invalid audio');
    this.buffers.set(slot,{buffer,name:file.name});
    return {slot,duration:buffer.duration,name:file.name};
  }
  play(){
    if(!this.ctx||!this.buffers.size)return false;
    this.stop();
    const t=this.ctx.currentTime+.10;this.startedAt=t;
    for(const [slot,{buffer}] of this.buffers){
      const src=this.ctx.createBufferSource(),g=this.ctx.createGain();
      src.buffer=buffer;src.loop=true;g.gain.value=.70;
      src.connect(g);g.connect(this.master);src.start(t);
      this.sources.set(slot,src);this.mixes.set(slot,g);
    }
    this.running=true;return true;
  }
  gain(slot,value){
    const g=this.mixes.get(slot);
    if(g)g.gain.setTargetAtTime(clamp(value),this.ctx.currentTime,.04);
  }
  stop(){
    for(const source of this.sources.values()){
      try{source.stop();source.disconnect()}catch{}
    }
    this.sources.clear();this.mixes.clear();this.running=false;
  }
  status(){return this.names.map(name=>({
    slot:name,loaded:this.buffers.get(name)?.name||null,
    duration:this.buffers.get(name)?.buffer.duration||0
  }));}
}
export class ProductionTone{
  constructor(){this.Tone=null;this.ready=false;this.muted=true;this.patch='ABYSS';
    this.lastError='';this.rendered=0;this.filter=null;this.synth=null;this.pad=null;this.percussion=null;
    this.limiter=null;this.reverb=null;this.delay=null;this.fx=null;this.bpm=100;}
  async start(){
    if(this.ready){await this.Tone.start();this.muted=false;this.volume.mute=false;return;}
    // Optional high-level instrument. Realtime playing never silently depends
    // on an undocumented, long-abandoned Strudel-to-Tone adapter.
    const Tone=await import('https://esm.sh/tone@15.1.22?bundle');
    this.Tone=Tone;
    await Tone.start();
    this.volume=new Tone.Volume(-14).toDestination();
    this.limiter=new Tone.Limiter(-8).connect(this.volume);
    this.volume.mute=false;
    const comp=new Tone.Compressor(-18,4).connect(this.limiter);
    this.reverb=new Tone.Reverb({decay:4.8,wet:.32}).connect(comp);
    await this.reverb.generate();
    this.delay=new Tone.PingPongDelay('8n',.28).connect(this.reverb);
    this.fx=new Tone.Distortion(.18).connect(this.delay);
    this.filter=new Tone.Filter({frequency:1500,type:'lowpass',rolloff:-24,Q:1.7}).connect(this.fx);
    this.synth=new Tone.PolySynth(Tone.FMSynth,{
      harmonicity:1.6,modulationIndex:12,
      oscillator:{type:'sine'},modulation:{type:'triangle'},
      envelope:{attack:.025,decay:.30,sustain:.25,release:1.6},
      modulationEnvelope:{attack:.02,decay:.18,sustain:.15,release:.85}
    }).connect(this.filter);
    this.pad=new Tone.PolySynth(Tone.AMSynth,{
      harmonicity:1.005,
      oscillator:{type:'sawtooth'},
      envelope:{attack:.55,decay:1.0,sustain:.45,release:3.4},
      modulation:{type:'sine'},
      modulationEnvelope:{attack:.3,decay:.65,sustain:.24,release:2.4}
    }).connect(this.reverb);
    this.percussion=new Tone.MembraneSynth({
      pitchDecay:.065,octaves:5,
      oscillator:{type:'sine'},
      envelope:{attack:.001,decay:.28,sustain:0,release:.25}
    }).connect(comp);
    this.ready=true;this.muted=false;
    this.Tone.getTransport().bpm.value=this.bpm;
  }
  setBpm(bpm){
    this.bpm=clamp(Number(bpm),45,220);
    if(this.ready)this.Tone.getTransport().bpm.rampTo(this.bpm,.05);
  }
  setPatch(p){if(['ABYSS','FERRO','CATHEDRAL'].includes(p))this.patch=p;}
  motion(x,y,energy){
    if(!this.ready||this.muted)return;
    const freq=110*Math.pow(10000/110,clamp(x));
    this.filter.frequency.rampTo(freq,.07);
    this.filter.Q.rampTo(1+clamp(energy)*12,.06);
    this.reverb.wet.rampTo(.15+clamp(y)*.58,.08);
    this.fx.distortion=clamp(.10+clamp(energy)*.55);
  }
  fire({digit=null,energy=.55,x=.5,y=.5}={}){
    if(!this.ready||this.muted)return false;
    this.motion(x,y,energy);
    const notes=['C2','G2','Bb2','D3','F3','Ab3'];
    const n=notes[(digit===null?Math.floor(clamp(x)*6):Math.max(0,digit-1))%6];
    const vel=.22+clamp(energy)*.55;
    if(this.patch==='FERRO'){
      this.synth.triggerAttackRelease(n,'16n',undefined,vel);
      this.percussion.triggerAttackRelease('C1','8n',undefined,.35+vel*.45);
    }else if(this.patch==='CATHEDRAL'){
      this.pad.triggerAttackRelease(['C3','Eb3','G3','Bb3'],'2n',undefined,vel*.28);
      this.synth.triggerAttackRelease(n,'4n',undefined,vel*.55);
    }else{
      this.synth.triggerAttackRelease([n,'C4'],'4n',undefined,vel*.38);
      this.pad.triggerAttackRelease(['C2','G2','Eb3'],'1n',undefined,vel*.20);
    }
    this.rendered++;return true;
  }
  stopAll(){
    if(!this.ready)return;
    this.synth.releaseAll();this.pad.releaseAll();
  }
  mute(){
    this.muted=true;
    if(this.ready){this.stopAll();this.volume.mute=true;}
  }
  async resume(){
    if(!this.ready)return this.start();
    await this.Tone.start();this.volume.mute=false;this.muted=false;
  }
}
export class NativeFallback{
  constructor(){this.engine=new OrganicAudio();this.started=false;}
  async start(){await this.engine.start();this.engine.setMode('electro');this.engine.quantized=false;this.started=true;}
  fire({energy=.5,x=.5}={}){
    if(!this.started)return false;
    const ids=['kick','hat','snare','acid','fm','rise'];
    this.engine.trigger({kind:'ENTER',id:ids[Math.min(5,Math.floor(clamp(x)*6))],
      mode:'electro',velocity:clamp(energy)});
    return true;
  }
  motion(x,y,v){if(this.started)this.engine.motion(x,y,v);}
  mute(){this.engine.panic();}
  async resume(){await this.engine.resume();}
}
