// Original, dependency-free Web Audio gesture instrument.
// One deliberate contact excites one finite resonant phrase. Tracking is silent.
const bound=(x,a,b)=>Math.min(b,Math.max(a,Number.isFinite(x)?x:a));
const lerp=(a,b,t)=>a+(b-a)*t;
export const VOICES=Object.freeze([
  {name:'PORCELAIN / 瓷',base:261.626,partials:[1,2.756,4.07],levels:[.52,.12,.045],types:['sine','sine','sine'],noise:0,attack:.012,duration:1.65},
  {name:'STRING / 弦',base:220,partials:[1,2,3],levels:[.43,.13,.055],types:['triangle','sine','sine'],noise:0,attack:.022,duration:2.2},
  {name:'AIR / 息',base:349.228,partials:[1,1.5,2],levels:[.18,.07,.03],types:['sine','sine','sine'],noise:.10,attack:.09,duration:1.5}
]);
const silence=(param,t,seconds=.12)=>{
  param.cancelScheduledValues(t);
  param.setTargetAtTime(0,t,Math.max(.008,seconds/6));
  param.setValueAtTime(0,t+seconds);
};
export class FieldSynth {
  constructor(){
    this.ctx=null;this.ready=false;this.isMuted=true;this.output=null;
    this.osc=[];this.source=null;this.wetGain=null;this.dryGain=null;
    this.pan=null;this.analyser=null;this.levelData=null;this.activePings=0;this.pings=new Set();
    this.bpm=100;this.quantized=false;this.origin=0;this.volume=.36;
    this.lastGate=0;this.lastHold=0;this.lastFrameMs=-Infinity;
    this.lastExcitation=-Infinity;this.voice=0;this.startPromise=null;this.generation=0;
  }
  async start(){
    if(this.ready)return this.resume();
    if(this.startPromise)return this.startPromise;
    this.startPromise=this._start();
    try{return await this.startPromise;}finally{this.startPromise=null;}
  }
  async _start(){
    const AC=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!AC)throw new Error('Web Audio is unavailable in this browser');
    const generation=this.generation,ctx=this.ctx=new AC({latencyHint:'interactive'});
    try{
      await ctx.resume();
      if(generation!==this.generation)throw new Error('Audio startup cancelled. Tap START AUDIO to resume.');
      if(ctx.state!=='running')throw new Error('Audio remains suspended. Tap START AUDIO again.');
      this.source=ctx.createGain();this.source.gain.value=0;
      this.highpass=ctx.createBiquadFilter();this.highpass.type='highpass';this.highpass.frequency.value=150;this.highpass.Q.value=.6;
      this.filter=ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=1900;this.filter.Q.value=.7;
      this.delay=ctx.createDelay(.7);this.delay.delayTime.value=.19;
      this.feedback=ctx.createGain();this.feedback.gain.value=.10;
      this.wetGain=ctx.createGain();this.wetGain.gain.value=.08;
      this.dryGain=ctx.createGain();this.dryGain.gain.value=.85;
      this.tailGate=ctx.createGain();this.tailGate.gain.value=0;
      this.pan=ctx.createStereoPanner();this.pan.pan.value=0;
      const mix=ctx.createGain();mix.gain.value=.52;
      const limiter=ctx.createDynamicsCompressor();
      limiter.threshold.value=-19;limiter.knee.value=8;limiter.ratio.value=10;limiter.attack.value=.004;limiter.release.value=.14;
      this.output=ctx.createGain();this.output.gain.value=this.volume;
      this.analyser=ctx.createAnalyser();this.analyser.fftSize=256;this.levelData=new Uint8Array(this.analyser.fftSize);
      this.source.connect(this.highpass);this.highpass.connect(this.filter);
      this.filter.connect(this.dryGain);this.dryGain.connect(mix);
      this.filter.connect(this.delay);this.delay.connect(this.wetGain);this.wetGain.connect(mix);
      this.delay.connect(this.feedback);this.feedback.connect(this.delay);
      mix.connect(this.tailGate);this.tailGate.connect(this.pan);this.pan.connect(limiter);limiter.connect(this.output);
      this.output.connect(this.analyser);this.analyser.connect(ctx.destination);
      for(let i=0;i<3;i++){
        const osc=ctx.createOscillator(),gain=ctx.createGain();
        osc.type='sine';gain.gain.value=0;osc.connect(gain);gain.connect(this.source);osc.start();
        this.osc.push({osc,gain});
      }
      // Quiet breath material for AIR only, gated by the same finite envelope.
      const buffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),data=buffer.getChannelData(0);
      let seed=173;for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=seed/2147483648-1;}
      this.noise=ctx.createBufferSource();this.noise.buffer=buffer;this.noise.loop=true;
      this.noiseGain=ctx.createGain();this.noiseGain.gain.value=0;
      const breath=ctx.createBiquadFilter();breath.type='bandpass';breath.frequency.value=1550;breath.Q.value=.65;
      this.noise.connect(breath);breath.connect(this.noiseGain);this.noiseGain.connect(this.source);this.noise.start();
      this.origin=ctx.currentTime+.015;this.lastGate=0;this.lastFrameMs=-Infinity;
      this.ready=true;this.isMuted=false;this._voice(0,ctx.currentTime);
    }catch(error){
      this.ready=false;this.isMuted=true;
      try{await ctx.close();}catch{}
      this.ctx=null;this.osc=[];throw error;
    }
  }
  _voice(index,t){
    this.voice=Math.round(bound(Number(index),0,2));const v=VOICES[this.voice];
    this.osc.forEach(({osc,gain},i)=>{
      osc.type=v.types[i];osc.frequency.setTargetAtTime(v.base*v.partials[i],t,.04);
      gain.gain.setTargetAtTime(v.levels[i],t,.04);
    });
    this.noiseGain.gain.setTargetAtTime(v.noise,t,.04);
  }
  setVolume(value){
    this.volume=bound(Number(value),0,.65);
    if(this.ready&&!this.isMuted)this.output.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.025);
  }
  setBpm(bpm){this.bpm=bound(Number(bpm),40,220);}
  nextTime(){
    const now=this.ctx.currentTime+.008;
    if(!this.quantized)return now;
    const subdivision=(60/this.bpm)/4;
    return this.origin+Math.ceil((now-this.origin)/subdivision)*subdivision;
  }
  _excite(energy,t){
    // No re-trigger while a pinch or bilateral HOLD remains latched.
    const v=VOICES[this.voice],peak=lerp(.21,.46,energy),g=this.source.gain;
    g.cancelScheduledValues(t);g.setValueAtTime(0,t);
    g.linearRampToValueAtTime(peak,t+v.attack);
    g.exponentialRampToValueAtTime(.0001,t+v.duration);
    g.setValueAtTime(0,t+v.duration+.025);
    const tail=this.tailGate.gain;tail.cancelScheduledValues(t);tail.setValueAtTime(1,t);
    tail.setValueAtTime(1,t+v.duration);tail.linearRampToValueAtTime(0,t+v.duration+.65);
    this.lastExcitation=t;
  }
  release(){
    if(!this.ready)return;
    const t=this.ctx.currentTime;this.lastGate=0;this.lastHold=0;
    silence(this.source.gain,t,.12);silence(this.tailGate.gain,t,.42);
  }
  update(params={},nowMs=0){
    if(!this.ready||this.isMuted||this.ctx.state!=='running')return;
    // Always process gate edges. A frame throttle must never swallow a release.
    const ctx=this.ctx,t=ctx.currentTime;
    const gate=bound(params.gate,0,1),active=this.lastGate?gate>.20:gate>=.35;
    const voice=Math.round(bound(Number(params.timbre)||0,0,2));
    if(voice!==this.voice)this._voice(voice,t);
    if(active&&!this.lastGate&&t-this.lastExcitation>.07)this._excite(bound(params.energy,0,1),t);
    else if(!active&&this.lastGate)this.release();
    this.lastGate=active?1:0;this.lastHold=params.hold?1:0;
    if(nowMs-this.lastFrameMs<13)return;this.lastFrameMs=nowMs;
    const sm=(param,value,ramp=.04)=>param.setTargetAtTime(value,t,ramp);
    sm(this.filter.frequency,650*Math.pow(4400/650,bound(params.cutoff,0,1)));
    sm(this.filter.Q,lerp(.45,2.2,bound(params.resonance,0,1)));
    sm(this.wetGain.gain,lerp(.035,.18,bound(params.wet,0,1)));
    sm(this.pan.pan,lerp(-.8,.8,bound(params.spread,0,1)));
    sm(this.feedback.gain,lerp(.07,.17,bound(params.drive,0,1)));
  }
  trigger(zone='A',exit=false,amp=1){
    // Exits release visual/OSC state; they do not add another low-frequency hit.
    if(exit||!this.ready||this.isMuted||this.ctx.state!=='running'||this.activePings>=12)return false;
    const ctx=this.ctx,t=this.nextTime(),variant=zone==='A'?0:zone==='B'?1:2;
    const freq=[293.665,391.995,440][variant],dur=.42+variant*.08;
    const o=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner();
    o.type='sine';o.frequency.value=freq;p.pan.value=[-.4,0,.4][variant];
    const peak=bound(.025+amp*.045,.008,.08);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.009);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);g.gain.setValueAtTime(0,t+dur+.01);
    o.connect(g);g.connect(p);p.connect(this.output);this.activePings++;this.pings.add(o);
    o.onended=()=>{if(this.pings.delete(o))this.activePings--;o.disconnect();g.disconnect();p.disconnect();};
    o.start(t);o.stop(t+dur+.025);return true;
  }
  soundCheck(){
    if(!this.ready||this.isMuted||this.ctx.state!=='running')return false;
    return this.trigger('A',false,.6);
  }
  async panic(){
    this.generation++;this.isMuted=true;
    if(!this.ctx||!this.output)return;
    const t=this.ctx.currentTime;this.release();silence(this.output.gain,t,.05);
    for(const ping of this.pings){try{ping.stop(t+.01);}catch{}}
    this.pings.clear();this.activePings=0;
  }
  async resume(){
    if(!this.ready)return this.start();
    const generation=this.generation;
    await this.ctx.resume();
    if(generation!==this.generation)return;
    if(this.ctx.state!=='running'){
      this.isMuted=true;throw new Error('Audio remains suspended. Tap START AUDIO again.');
    }
    // Resume quietly. Old held gestures and delay tails cannot restart a drone.
    this.release();this.output.gain.cancelScheduledValues(this.ctx.currentTime);
    this.output.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.04);this.isMuted=false;
  }
  meter(){
    if(!this.analyser||!this.levelData)return 0;
    this.analyser.getByteTimeDomainData(this.levelData);
    let sum=0;for(const v of this.levelData){const d=(v-128)/128;sum+=d*d;}
    return Math.sqrt(sum/this.levelData.length);
  }
}
