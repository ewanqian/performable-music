// Organic Fields: three original instrument designs made entirely with Web Audio.
// No third-party audio packs. Pads are orchestrated scenes, not virtual keys.
import {clamp,nextGridTime,MODES} from './organic-engine.mjs';
const midi=n=>440*2**((n-69)/12);
const chordSets=[
  [48,55,60,63,67], // Cm9-ish
  [44,51,56,60,63], // AbM7
  [46,53,58,62,65], // Bbmaj7
  [43,50,55,59,62]  // G7sus -> dramatic pull to Cm
];
export class OrganicAudio{
  constructor(){
    this.ctx=null;this.mode='metal';this.ready=false;this.muted=true;
    this.bpm=104;this.quantized=true;this.origin=0;this.active=0;this.maxActive=64;
    this.events=0;this.dropped=0;this.lastX=.5;this.lastY=.5;this.lastSpeed=0;
  }
  async start(){
    if(this.ready)return this.resume();
    const AC=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!AC)throw Error('This browser does not support Web Audio');
    const c=this.ctx=new AC({latencyHint:'interactive'});
    await c.resume();
    this.master=c.createGain();this.master.gain.value=.30;
    const comp=c.createDynamicsCompressor();comp.threshold.value=-20;comp.ratio.value=12;
    comp.attack.value=.004;comp.release.value=.18;
    this.analyser=c.createAnalyser();this.analyser.fftSize=256;
    this.master.connect(comp);comp.connect(this.analyser);this.analyser.connect(c.destination);
    this.data=new Uint8Array(this.analyser.fftSize);
    const delay=c.createDelay(.8);delay.delayTime.value=.23;
    const echo=c.createGain();echo.gain.value=.24;
    const wet=c.createGain();wet.gain.value=.17;
    this.master.connect(delay);delay.connect(wet);wet.connect(comp);
    delay.connect(echo);echo.connect(delay);
    this.echo=echo;this.wet=wet;this.delay=delay;
    this.motionFilter=c.createBiquadFilter();this.motionFilter.type='lowpass';this.motionFilter.frequency.value=440;
    this.motionGain=c.createGain();this.motionGain.gain.value=0;
    this.motionOsc=c.createOscillator();this.motionOsc.type='sawtooth';this.motionOsc.frequency.value=55;
    this.motionOsc.connect(this.motionFilter);this.motionFilter.connect(this.motionGain);
    this.motionGain.connect(this.master);this.motionOsc.start();
    this.noiseBuffer=c.createBuffer(1,c.sampleRate*.5,c.sampleRate);
    const a=this.noiseBuffer.getChannelData(0);
    // Deterministic fast pseudo-random noise for consistent restarts.
    let seed=1234567;
    for(let i=0;i<a.length;i++){seed=(seed*1664525+1013904223)>>>0;a[i]=(seed/2147483648)-1;}
    this.origin=c.currentTime+.02;this.ready=true;this.muted=false;this.setMode(this.mode);
    return true;
  }
  async resume(){
    if(!this.ready)return this.start();
    await this.ctx.resume();
    this.master.gain.setTargetAtTime(.30,this.ctx.currentTime,.04);
    this.muted=false;return true;
  }
  panic(){
    this.muted=true;
    if(!this.ready)return;
    const t=this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0,t,.015);
    this.motionGain.gain.setTargetAtTime(0,t,.015);
  }
  setMode(mode){
    if(!MODES[mode])throw Error('Unknown mode');
    this.mode=mode;this.bpm=MODES[mode].bpm;
    if(!this.ready)return;
    this.echo.gain.setTargetAtTime(mode==='orchestra'?.29:mode==='electro'?.34:.18,this.ctx.currentTime,.08);
    this.wet.gain.setTargetAtTime(mode==='orchestra'?.25:mode==='electro'?.18:.12,this.ctx.currentTime,.08);
    this.motionGain.gain.setTargetAtTime(0,this.ctx.currentTime,.025);
  }
  setBpm(bpm){this.bpm=clamp(Number(bpm),40,220);}
  when(){
    const now=this.ctx.currentTime+.01;
    return this.quantized?nextGridTime(this.origin,now,this.bpm,4):now;
  }
  allocate(){
    if(this.active>=this.maxActive){this.dropped++;return false;}
    this.active++;return true;
  }
  osc(t,f,d,volume,{type='sine',endFreq=f,attack=.008,release=d,pan=0,
      cutoff=0,q=1}={}){
    if(!this.allocate())return;
    const c=this.ctx,src=c.createOscillator(),env=c.createGain();
    const p=c.createStereoPanner();
    src.type=type;
    src.frequency.setValueAtTime(Math.max(12,f),t);
    if(endFreq!==f)src.frequency.exponentialRampToValueAtTime(Math.max(12,endFreq),t+Math.min(d*.70,.40));
    env.gain.setValueAtTime(.0001,t);
    env.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+Math.max(.004,Math.min(attack,d*.35)));
    env.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.02,release));
    p.pan.value=clamp(pan,-1,1);
    let filter=null;
    if(cutoff){
      filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=cutoff;filter.Q.value=q;
      src.connect(filter);filter.connect(env);
    }else src.connect(env);
    env.connect(p);p.connect(this.master);
    src.onended=()=>{
      this.active--;try{src.disconnect();filter?.disconnect();env.disconnect();p.disconnect()}catch{}
    };
    src.start(t);src.stop(t+d+.04);
  }
  noise(t,d,volume,{freq=2500,q=.9,pan=0,kind='highpass'}={}){
    if(!this.allocate())return;
    const c=this.ctx,s=c.createBufferSource(),filter=c.createBiquadFilter(),
        g=c.createGain(),p=c.createStereoPanner();
    s.buffer=this.noiseBuffer;filter.type=kind;filter.frequency.value=freq;filter.Q.value=q;
    p.pan.value=clamp(pan,-1,1);
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.005);
    g.gain.exponentialRampToValueAtTime(.0001,t+d);
    s.connect(filter);filter.connect(g);g.connect(p);p.connect(this.master);
    s.onended=()=>{this.active--;try{s.disconnect();filter.disconnect();g.disconnect();p.disconnect()}catch{}};
    s.start(t);s.stop(t+d+.015);
  }
  metal(field,t,v,exit){
    const cfg={
      pot:[155,.79,1.46,2.08,3.13],lid:[380,1,1.49,2.03,2.70],
      cutlery:[840,1,1.53,2.62,4.0],bowl:[420,1,1.22,2.08,2.77],
      glass:[690,1,1.995,2.63,3.58],pan:[208,1,1.38,2.41,3.9]
    }[field]||[320,1,1.42,2.20,3.18];
    const [base,...ratios]=cfg,vel=clamp(v,.16,1);
    ratios.forEach((ratio,i)=>{
      this.osc(t,base*ratio*(exit?1.14:1),.20+.49*(1-i*.19),
        (.042+.071*vel)/(1+i*.47),{type:'sine',attack:.004,
          release:.19+.4*(1-i*.19),pan:i%2?-.23:.22});
    });
    if(!exit)this.noise(t,.035+.045*vel,.06*vel,{freq:field==='pot'?850:3800});
  }
  electro(field,t,v,exit){
    const vel=clamp(v,.15,1);
    if(field==='kick'){
      this.osc(t,178,.42,.32*vel,{endFreq:42,release:.38,type:'sine'});
      this.osc(t,71,.16,.09*vel,{endFreq:42,release:.15,type:'triangle'});
    }else if(field==='snare'){
      this.noise(t,.19,.22*vel,{freq:1350,kind:'bandpass'});
      this.osc(t,190,.12,.08*vel,{endFreq:134,release:.1});
    }else if(field==='hat'){
      this.noise(t,exit?.045:.11,.13*vel,{freq:6500,q:1.3,pan:.35});
    }else if(field==='acid'){
      this.osc(t,exit?196:147,.31,.13*vel,{type:'sawtooth',endFreq:exit?131:98,
        cutoff:5200,attack:.007,pan:-.29});
    }else if(field==='fm'){
      this.osc(t,392,.29,.12*vel,{type:'square',endFreq:270,attack:.008,pan:.3});
      this.osc(t,780,.15,.055*vel,{type:'sine',endFreq:550,pan:-.3});
    }else if(field==='rise'){
      this.noise(t,.46,.08*vel,{freq:1600,kind:'highpass'});
      this.osc(t,98,.40,.07*vel,{endFreq:392,type:'sawtooth',cutoff:3800});
    }
  }
  harmonicSet(t){
    const bar=60/this.bpm*4;
    const index=Math.floor(Math.max(0,t-this.origin)/bar)%chordSets.length;
    return chordSets[index];
  }
  ensemble(t,notes,d,volume,{type='strings',attack=.1,pan=0}={}){
    // This is purposefully a *synthesized* orchestral impression; not real sampled strings.
    const chord=notes.slice(0,5);
    for(let i=0;i<chord.length;i++){
      const f=midi(chord[i]+(type==='choir'?-12:0));
      const amp=volume/chord.length;
      if(type==='strings'){
        this.osc(t,f*.998,d,amp,{type:'sawtooth',cutoff:1450,attack,release:d*.92,pan:-.30+i*.14});
        this.osc(t,f*1.004,d,amp*.54,{type:'triangle',attack,release:d*.94,pan:.33-i*.12});
      }else if(type==='brass'){
        this.osc(t,f*.998,d,amp,{type:'sawtooth',cutoff:2500,attack,release:d*.90,pan});
        this.osc(t,f*1.006,d,amp*.4,{type:'triangle',attack,release:d*.93,pan});
      }else if(type==='choir'){
        this.osc(t,f,d,amp,{type:'sine',attack,release:d*.96,pan:-.2+i*.10});
        this.osc(t,f*2.01,d,amp*.32,{type:'triangle',cutoff:2200,attack,release:d*.92,pan});
      }
    }
  }
  orchestra(field,t,v,exit){
    const chord=this.harmonicSet(t),vel=clamp(v,.20,1);
    const dur=(60/this.bpm)*(exit?.65:1.8);
    if(field==='strings'){
      this.ensemble(t,chord,dur*1.5,.31*vel,{type:'strings',attack:.13});
    }else if(field==='brass'){
      this.ensemble(t,chord.slice(0,4),dur,.37*vel,{type:'brass',attack:.08});
    }else if(field==='choir'){
      this.ensemble(t,chord,dur*1.7,.29*vel,{type:'choir',attack:.19});
    }else if(field==='harp'){
      chord.slice(1).forEach((n,i)=>this.osc(t+i*.08,midi(n+12),.72,.092*vel,
        {type:'triangle',attack:.006,release:.67,pan:-.35+i*.23}));
    }else if(field==='timpani'){
      this.osc(t,midi(chord[0]+12)*1.8,.7,.26*vel,
        {endFreq:midi(chord[0]),attack:.006,release:.66});
      this.noise(t,.12,.055*vel,{freq:480});
    }else if(field==='tutti'){
      this.ensemble(t,chord,dur*1.45,.25*vel,{type:'strings',attack:.08});
      this.ensemble(t,chord.slice(0,3),dur*.8,.23*vel,{type:'brass',attack:.05});
      this.osc(t,midi(chord[0]),.75,.19*vel,{endFreq:midi(chord[0]-12),release:.70});
    }
  }
  trigger(evt){
    if(!this.ready||this.muted||this.ctx.state!=='running')return false;
    if(!evt||evt.kind!=='ENTER'&&evt.kind!=='EXIT')return false;
    if(evt.mode!==this.mode)return false;
    const field=MODES[this.mode].fields.find(o=>o.id===evt.id);
    if(!field)return false;
    const t=this.when(),v=clamp(evt.velocity,.18,1);
    if(this.mode==='metal')this.metal(evt.id,t,v,evt.kind==='EXIT');
    else if(this.mode==='electro')this.electro(evt.id,t,v,evt.kind==='EXIT');
    else this.orchestra(evt.id,t,v,evt.kind==='EXIT');
    this.events++;return true;
  }
  motion(x,y,speed){
    this.lastX=clamp(x);this.lastY=clamp(y);this.lastSpeed=clamp(speed);
    if(!this.ready||this.muted||this.ctx.state!=='running')return;
    const t=this.ctx.currentTime;
    this.motionOsc.frequency.setTargetAtTime(this.mode==='electro'?49:
      this.mode==='orchestra'?65:112,t,.08);
    this.motionFilter.frequency.setTargetAtTime(150*Math.pow(5000/150,clamp(x)),t,.05);
    this.motionGain.gain.setTargetAtTime(this.mode==='electro'?
      .018+.095*clamp(speed):this.mode==='orchestra'? .014*clamp(speed):0,t,.07);
    this.delay.delayTime.setTargetAtTime(.08+.31*clamp(y),t,.10);
  }
  meter(){
    if(!this.ready)return 0;
    this.analyser.getByteTimeDomainData(this.data);
    let sum=0;for(const n of this.data){const v=(n-128)/128;sum+=v*v;}
    return Math.sqrt(sum/this.data.length);
  }
}
