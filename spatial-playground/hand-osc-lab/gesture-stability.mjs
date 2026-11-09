// Quest 3 WebXR hand-pose stabilizer.
// State hysteresis protects sustained performance against noisy joints,
// short occlusions and isolated wrong classifications without hiding real changes.
// Input uses already normalized 25-joint measurements from interpretHand().
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const finite=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
const norm=p=>{const m=Math.hypot(...p)||1;return p.map(v=>v/m);};
const blend=(a,b,t)=>a.map((v,i)=>v*(1-t)+b[i]*t);
export const HAND_STABILITY={
  swordEnterMs:42,
  fistEnterMs:72,
  openEnterMs:96,
  neutralExitMs:340,
  occlusionHoldMs:180,
  hardLossMs:380,
  aimTauMs:28,
  positionTauMs:24
};
export function poseEvidence(measure,held='neutral'){
  if(!measure||!finite(measure.point)||!finite(measure.direction))return 'neutral';
  const b=measure.bends, gap=measure.tipGap;
  if(!b||!Number.isFinite(gap))return ['sword','open','fist'].includes(measure.kind)?measure.kind:'neutral';
  const all=['index','middle','ring','pinky'].every(k=>Number.isFinite(b[k]));
  if(!all)return 'neutral';
  // Relaxed continuation margin to tolerate partial ring/pinky occlusion.
  const swordKeep=held==='sword';
  const straight=swordKeep?69:62;
  const curled=swordKeep?38:49;
  const close=swordKeep?.112:.096;
  if(b.index<=straight&&b.middle<=straight&&
    b.ring>=curled&&b.pinky>=curled&&gap<=close)return 'sword';
  if([b.index,b.middle,b.ring,b.pinky].every(v=>v<45)&&gap>.070)return 'open';
  if([b.index,b.middle,b.ring,b.pinky].every(v=>v>68))return 'fist';
  return 'neutral';
}
export class StableHand {
  constructor(config={}){this.cfg={...HAND_STABILITY,...config};this.reset();}
  reset(){
    this.kind='neutral';this.candidate=null;this.candidateSince=0;this.lastSeen=-Infinity;
    this.lastTime=NaN;this.lastOutput=null;this.wasMissing=false;
    this.transitions=0;this.lostFrames=0;
  }
  update(measure,now){
    const valid=Boolean(measure&&finite(measure.point)&&finite(measure.direction));
    if(!Number.isFinite(now))throw new TypeError('monotonic timestamp required');
    const dt=Number.isFinite(this.lastTime)?clamp(now-this.lastTime,0,70):16;
    this.lastTime=now;
    if(!valid){
      this.lostFrames++;
      this.candidate=null;
      const elapsed=now-this.lastSeen;
      if(elapsed>this.cfg.hardLossMs){this.kind='neutral';this.lastOutput=null;return null;}
      if(elapsed<=this.cfg.occlusionHoldMs&&this.lastOutput){
        // Brief hand occlusion: continue gentle jet from last known real pose.
        return {...this.lastOutput,kind:this.kind,stale:true};
      }
      return null; // no fictitious palm blast / fist conversion after hard loss
    }
    this.lastSeen=now;this.wasMissing=false;
    const next=poseEvidence(measure,this.kind);
    if(next===this.kind){
      this.candidate=null;
    }else if(this.candidate!==next){
      this.candidate=next;this.candidateSince=now;
    }else{
      const wait=next==='sword'?this.cfg.swordEnterMs:
        next==='fist'?this.cfg.fistEnterMs:
        next==='open'?this.cfg.openEnterMs:this.cfg.neutralExitMs;
      if(now-this.candidateSince>=wait){
        this.kind=next;this.candidate=null;this.transitions++;
      }
    }
    const prev=this.lastOutput;
    const point=prev?.point?blend(prev.point,measure.point,
      1-Math.exp(-dt/this.cfg.positionTauMs)):measure.point.slice();
    const direction=prev?.direction?norm(blend(prev.direction,
      norm(measure.direction),1-Math.exp(-dt/this.cfg.aimTauMs))):
      norm(measure.direction);
    const sample={kind:this.kind,point,direction,stale:false,
      rawKind:next,confidence:this.kind===next?1:.6};
    this.lastOutput=sample;
    return sample;
  }
}
