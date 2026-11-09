// Gesture Dynamics V4 — original, entirely local four-part audiovisual score.
// Not an existing composition, licensed recording, or note-for-note cover.
// Audio only starts after explicit user gesture (desktop MUSIC / Quest ENTER MR).
export const SCORE_BPM=96;
export const SCORE_STEP_SECONDS=60/SCORE_BPM/4;
export const HARMONY=Object.freeze([
  {name:'E minor add9',bass:40,notes:[52,55,59,66]},
  {name:'C major7 #11',bass:36,notes:[48,55,59,66]},
  {name:'G add9',bass:43,notes:[55,59,62,69]},
  {name:'D suspended',bass:38,notes:[50,57,62,64]}
]);
export const midiHz=n=>440*Math.pow(2,(n-69)/12);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
export function scoreStep(step){
  const s=Math.max(0,Math.floor(step));
  const inBar=s%16,bar=Math.floor(s/16),chord=HARMONY[bar%4];
  const arp=[0,2,1,3,2,1,0,3][Math.floor(inBar/2)%8];
  return {
    bar,beat:inBar/4,chord, inBar,
    bass:inBar===0||inBar===8,
    kick:inBar===0||inBar===8,
    snare:inBar===4||inBar===12,
    hat:inBar%4===2,
    arp:inBar%2===0?chord.notes[arp]+12:null,
    shimmer:inBar===7||inBar===15
  };
}
export function musicActivity(hands={}){
  const members=Object.values(hands).filter(Boolean);
  const charge=Math.max(0,...members.map(h=>h.charge||0));
  const motion=Math.max(0,...members.map(h=>h.speed||0));
  return {
    charge:clamp(charge,0,4),
    motion:clamp(motion/3,0,1),
    jet:members.some(h=>h.kind==='sword')?1:0,
    fist:members.some(h=>h.kind==='fist')?1:0
  };
}
export class GestureMusic {
  constructor(){
    this.context=null;this.enabled=false;this.master=null;
    this.bus=null;this.noiseBuffer=null;this.air=null;this.airFilter=null;
    this.airSource=null;this.stepIndex=0;this.nextTime=0;
    this.gain=.62;this.energy={charge:0,motion:0,jet:0,fist:0};
    this.lastTick=0;this.playStart=0;this.lastError='';
  }
  _noiseBuffer(){
    const c=this.context,len=Math.round(c.sampleRate*2),buffer=c.createBuffer(1,len,c.sampleRate);
    const data=buffer.getChannelData(0);
    // Stable original algorithmic noise rather than any sampled library.
    let seed=0x81419c;for(let i=0;i<len;i++){
      seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
      data[i]=((seed>>>0)/2147483648-1)*.48;
    }
    return buffer;
  }
  _init(){
    const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!Context)throw new Error('This browser does not support Web Audio');
    const c=this.context=new Context({latencyHint:'interactive'});
    const compressor=c.createDynamicsCompressor();
    compressor.threshold.value=-20;compressor.knee.value=14;
    compressor.ratio.value=3;compressor.attack.value=.012;compressor.release.value=.2;
    this.master=c.createGain();this.master.gain.value=0;
    this.bus=c.createGain();this.bus.gain.value=.75;
    this.bus.connect(compressor);compressor.connect(this.master);this.master.connect(c.destination);
    this.noiseBuffer=this._noiseBuffer();
    const src=this.airSource=c.createBufferSource();src.buffer=this.noiseBuffer;src.loop=true;
    const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=270;
    this.airFilter=c.createBiquadFilter();this.airFilter.type='lowpass';this.airFilter.frequency.value=950;
    this.air=c.createGain();this.air.gain.value=.0001;
    src.connect(hp);hp.connect(this.airFilter);this.airFilter.connect(this.air);
    this.air.connect(this.bus);
    src.start();
    // Low sustained ground note: evolving color via the other parts, not a flat alarm.
    this.drone=[];
    for(const [frequency,type,gainValue] of [[midiHz(28),'sine',.028],[midiHz(40),'triangle',.009]]){
      const osc=c.createOscillator(),gain=c.createGain();
      osc.type=type;osc.frequency.value=frequency;gain.gain.value=gainValue;
      osc.connect(gain);gain.connect(this.bus);osc.start();
      this.drone.push({osc,gain});
    }
  }
  async start(){
    try{
      if(!this.context)this._init();
      await this.context.resume();
      this.enabled=true;this.nextTime=this.context.currentTime+.065;this.stepIndex=0;
      this.master.gain.setTargetAtTime(.57*this.gain,this.context.currentTime,.08);
      this.lastError='';return true;
    }catch(e){
      this.lastError=String(e?.message||e);this.enabled=false;return false;
    }
  }
  stop(){
    if(!this.context)return;
    this.enabled=false;
    this.master.gain.setTargetAtTime(0,this.context.currentTime,.065);
    // Preserve the AudioContext for an immediate restart without creating more nodes.
  }
  setVolume(v){
    this.gain=clamp(v,0,1);
    if(this.context)this.master.gain.setTargetAtTime(
      this.enabled?.57*this.gain:0,this.context.currentTime,.04);
  }
  _tone(freq,t,dur,volume,type='triangle',filterHz=null,attack=.012){
    if(!this.context||!Number.isFinite(freq)||freq<=0)return;
    const c=this.context,o=c.createOscillator(),env=c.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);
    env.gain.setValueAtTime(.00001,t);
    env.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+Math.min(attack,dur*.4));
    env.gain.exponentialRampToValueAtTime(.00001,t+dur);
    o.connect(env);
    if(filterHz){
      const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=filterHz;
      env.connect(f);f.connect(this.bus);
      o.onended=()=>{o.disconnect();env.disconnect();f.disconnect();};
    }else{
      env.connect(this.bus);
      o.onended=()=>{o.disconnect();env.disconnect();};
    }
    o.start(t);o.stop(t+dur+.014);
  }
  _drum(t,kind,level=.6){
    const c=this.context;
    if(kind==='kick'){
      const o=c.createOscillator(),g=c.createGain();
      o.type='sine';o.frequency.setValueAtTime(102,t);
      o.frequency.exponentialRampToValueAtTime(43,t+.16);
      g.gain.setValueAtTime(.0001,t);
      g.gain.exponentialRampToValueAtTime(level*.19,t+.008);
      g.gain.exponentialRampToValueAtTime(.0001,t+.23);
      o.connect(g);g.connect(this.bus);o.start(t);o.stop(t+.25);
      o.onended=()=>{o.disconnect();g.disconnect();};
      return;
    }
    const src=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain();
    src.buffer=this.noiseBuffer;filter.type=kind==='hat'?'highpass':'bandpass';
    filter.frequency.value=kind==='hat'?4400:1700;
    filter.Q.value=kind==='hat'?.75:1.3;
    const dur=kind==='hat'?.075:.18;
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(level*(kind==='hat'?.023:.054),t+.005);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    src.connect(filter);filter.connect(g);g.connect(this.bus);
    src.start(t,(this.stepIndex%50)*.025,dur+.012);
    src.onended=()=>{src.disconnect();filter.disconnect();g.disconnect();};
  }
  _pad(t,chord){
    for(let i=0;i<chord.notes.length;i++){
      const base=midiHz(chord.notes[i]);
      const gain=i===0?.016:.009;
      this._tone(base,t,2.48,gain,'sine',null,.38);
      this._tone(base*1.004,t+.022,2.36,gain*.42,'triangle',1550,.43);
    }
  }
  _schedule(step,t){
    const info=scoreStep(step);
    const motion=this.energy.motion,jet=this.energy.jet,charge=this.energy.charge;
    if(info.inBar===0)this._pad(t,info.chord);
    if(info.bass)this._tone(midiHz(info.chord.bass),t,.52,.055,
      'triangle',600,.012);
    if(info.kick)this._drum(t,'kick',.52+jet*.12);
    if(info.snare)this._drum(t,'snare',.35);
    if(info.hat||jet&&info.inBar%2===1)this._drum(t,'hat',.42+motion*.2);
    if(info.arp!==null){
      const dynamics=.012+jet*.014+motion*.009+charge*.0016;
      this._tone(midiHz(info.arp),t,.22,dynamics,'sine',null,.014);
    }
    if(info.shimmer && (jet||charge>.7)){
      this._tone(midiHz(info.chord.notes[3]+24),t,.48,.008,
        'sine',null,.018);
    }
  }
  update(hands={}){
    this.energy=musicActivity(hands);
    if(!this.context||!this.enabled)return;
    const c=this.context,now=c.currentTime;
    if(!Number.isFinite(now)||c.state!=='running')return;
    // Continuous sound layers follow the pose without creating extra oscillators.
    const activity=this.energy;
    const targetGain=.001+activity.jet*.033+activity.motion*.021+activity.fist*.010;
    this.air.gain.setTargetAtTime(targetGain,now,.07);
    this.airFilter.frequency.setTargetAtTime(
      600+activity.jet*1400+activity.motion*1900+activity.charge*390,now,.10);
    // Schedule on audio clock in small chunks, independent of frame rate.
    let scheduled=0;
    if(this.nextTime<now-.5)this.nextTime=now+.045;
    while(this.nextTime<now+.145 && scheduled<5){
      this._schedule(this.stepIndex,this.nextTime);
      this.nextTime+=SCORE_STEP_SECONDS;
      this.stepIndex++;scheduled++;
    }
  }
  react(event){
    if(!this.enabled||!this.context||this.context.state!=='running'||!event)return;
    const t=this.context.currentTime+.01;
    if(event.type==='pulse'){
      const power=clamp(event.power,0,4);
      this._tone(midiHz(76),t,.34+power*.12,.017+power*.008,'sawtooth',1800,.018);
      this._tone(midiHz(88),t+.07,.45,.012+power*.005,'sine',null,.012);
    }
    if(event.type==='blast'){
      const power=clamp(event.power,0,4);
      this._drum(t,'kick',.8+power*.10);
      this._tone(midiHz(35),t,.52,.075+power*.017,'triangle',380,.012);
      this._tone(midiHz(83),t,.36,.018+power*.004,'sine',null,.012);
    }
    if(event.type==='collect')this._tone(midiHz(52),t,.34,.014,'triangle',900,.1);
  }
}
