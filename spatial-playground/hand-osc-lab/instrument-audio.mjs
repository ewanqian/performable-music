// Dependency-free Web Audio subtractive / FM drone and transient field instrument.
// Designed for user-gesture control of ONE continuous synthesis voice, not a keyboard.
const bound=(x,a,b)=>Math.min(b,Math.max(a,Number.isFinite(x)?x:a));
const lerp=(a,b,t)=>a+(b-a)*t;
export class FieldSynth {
  constructor(){this.ctx=null;this.ready=false;this.output=null;this.filter=null;this.delay=null;
    this.osc=[];this.source=null;this.wetGain=null;this.dryGain=null;this.resonant=null;
    this.pan=null;this.analyser=null;this.levelData=null;this.activePings=0;
    this.bpm=100;this.quantized=false;this.origin=0;this.isMuted=true;
    this.lastGate=0;this.lastHold=0;this.lastFrameMs=0;this.lastOutput=0;}
  async start(){
    if(this.ready){if(this.ctx.state!=='running')await this.ctx.resume();this.isMuted=false;return;}
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)throw new Error('Web Audio is unavailable in this browser');
    const ctx=this.ctx=new AC({latencyHint:'interactive'});await ctx.resume();
    this.source=ctx.createGain();this.source.gain.value=0;
    this.filter=ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=420;this.filter.Q.value=2.4;
    this.delay=ctx.createDelay(0.7);this.delay.delayTime.value=.235;
    this.feedback=ctx.createGain();this.feedback.gain.value=.26;
    this.wetGain=ctx.createGain();this.wetGain.gain.value=.10;
    this.dryGain=ctx.createGain();this.dryGain.gain.value=.85;
    this.pan=ctx.createStereoPanner();this.pan.pan.value=0;
    const mix=ctx.createGain();mix.gain.value=.42;
    const limiter=ctx.createDynamicsCompressor();
    limiter.threshold.value=-19;limiter.knee.value=8;limiter.ratio.value=13;limiter.attack.value=.004;limiter.release.value=.14;
    this.output=ctx.createGain();this.output.gain.value=.36;
    this.analyser=ctx.createAnalyser();this.analyser.fftSize=256;this.levelData=new Uint8Array(this.analyser.frequencyBinCount);
    this.source.connect(this.filter);
    this.filter.connect(this.dryGain);this.dryGain.connect(mix);
    this.filter.connect(this.delay);this.delay.connect(this.wetGain);this.wetGain.connect(mix);
    this.delay.connect(this.feedback);this.feedback.connect(this.delay);
    mix.connect(this.pan);this.pan.connect(limiter);limiter.connect(this.output);
    this.output.connect(this.analyser);this.analyser.connect(ctx.destination);
    const base=73.42;
    for(const [type,mult,vol] of [['sawtooth',1,.31],['triangle',.5,.46],['sine',1.997,.12]]){
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type=type;osc.frequency.value=base*mult;gain.gain.value=vol;osc.connect(gain);gain.connect(this.source);osc.start();
      this.osc.push({osc,gain,mult});
    }
    // Low-speed internal motion; doesn't play a predetermined melody.
    this.lfo=ctx.createOscillator();this.lfo.frequency.value=.13;
    this.lfoGain=ctx.createGain();this.lfoGain.gain.value=7;
    this.lfo.connect(this.lfoGain);this.lfoGain.connect(this.osc[0].osc.detune);this.lfo.start();
    this.origin=ctx.currentTime+.015;this.ready=true;this.isMuted=false;
  }
  setBpm(bpm){this.bpm=bound(Number(bpm),40,220);}
  nextTime(){
    const ctx=this.ctx,now=ctx.currentTime+.008;
    if(!this.quantized)return now;
    const subdivision=(60/this.bpm)/4;
    return this.origin+Math.ceil((now-this.origin)/subdivision)*subdivision;
  }
  update(params={},nowMs=0){
    if(!this.ready||this.isMuted||this.ctx.state!=='running')return;
    if(nowMs-this.lastFrameMs<13)return;
    this.lastFrameMs=nowMs;
    const ctx=this.ctx,t=ctx.currentTime,sm=(param,value,ramp=.025)=>{
      param.setTargetAtTime(value,t,ramp);
    };
    const gate=bound(params.gate,0,1),energy=bound(params.energy,0,1);
    // Envelope is driven by pinch, not sequenced notes.
    sm(this.source.gain,gate?lerp(.12,.53,energy):0,gate?.022:.065);
    // Log frequency response; effect from 130Hz to 6kHz.
    const cutoff=bound(params.cutoff,0,1);
    sm(this.filter.frequency,130*Math.pow(6000/130,cutoff),.033);
    sm(this.filter.Q,lerp(.75,9, bound(params.resonance,0,1)),.033);
    sm(this.wetGain.gain,lerp(.025,.32,bound(params.wet,0,1)),.05);
    sm(this.pan.pan,lerp(-.9,.9,bound(params.spread,0,1)),.045);
    sm(this.feedback.gain,lerp(.12,.40,bound(params.drive,0,1)),.055);
    const timbre=[0,.42,.86][Number(params.timbre)||0]||0;
    sm(this.osc[0].gain.gain,lerp(.31,.12,timbre),.075);
    sm(this.osc[2].gain.gain,lerp(.09,.34,timbre),.075);
    sm(this.lfoGain.gain,lerp(5,29,bound(params.drive,0,1)),.05);
    this.lastGate=gate;this.lastHold=params.hold?1:0;
  }
  trigger(zone='A',exit=false,amp=1){
    if(!this.ready||this.isMuted||this.ctx.state!=='running'||this.activePings>=12)return false;
    const ctx=this.ctx,t=this.nextTime(),variant=zone==='A'?0:zone==='B'?1:2;
    const freq=[176,330,75][variant],dur=exit?.16:.29;
    const o=ctx.createOscillator(),g=ctx.createGain(),tone=ctx.createBiquadFilter(),
          p=ctx.createStereoPanner();
    o.type=variant===1?'sine':'triangle';
    o.frequency.setValueAtTime(freq*(exit?1.25:1.85),t);
    o.frequency.exponentialRampToValueAtTime(freq,t+Math.min(.17,dur*.7));
    tone.type=variant===2?'lowpass':'bandpass';tone.frequency.value=variant===2?500:1850;
    tone.Q.value=variant===1?8:1.4;
    p.pan.value=variant===0?-.4:variant===1?.4:0;
    const peak=bound(.022+amp*.065,.008,.11);
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(peak,t+.008);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(tone);tone.connect(g);g.connect(p);p.connect(this.output);
    this.activePings++;
    o.onended=()=>{this.activePings--;try{o.disconnect();tone.disconnect();g.disconnect();p.disconnect()}catch(e){}};
    o.start(t);o.stop(t+dur+.02);
    return true;
  }
  async panic(){
    if(!this.ctx||!this.output)return;
    const t=this.ctx.currentTime;
    this.isMuted=true;this.source?.gain.cancelScheduledValues(t);this.source?.gain.setTargetAtTime(0,t,.015);
    this.output.gain.cancelScheduledValues(t);this.output.gain.setTargetAtTime(0,t,.012);
  }
  async resume(){
    if(!this.ready)return this.start();
    await this.ctx.resume();this.output.gain.setTargetAtTime(.36,this.ctx.currentTime,.06);
    this.isMuted=false;
  }
  meter(){
    if(!this.analyser||!this.levelData)return 0;
    this.analyser.getByteTimeDomainData(this.levelData);
    let sum=0;for(const v of this.levelData){const d=(v-128)/128;sum+=d*d;}
    return Math.sqrt(sum/this.levelData.length);
  }
}
