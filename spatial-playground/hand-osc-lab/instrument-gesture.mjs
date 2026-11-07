// Pure hand-to-instrument mapping. No DOM, XR or audio dependencies.
const IDX={wrist:0,thumb:4,index:9,indexPip:7,middle:14,ring:19,pinky:24};
export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,Number.isFinite(v)?v:a));
export function d3(a,b){
  if(!Array.isArray(a)||!Array.isArray(b)||a.length<3||b.length<3||
     !a.slice(0,3).every(Number.isFinite)||!b.slice(0,3).every(Number.isFinite))return null;
  return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
}
export function thumbDistance(hand,index){
  if(!hand||!Array.isArray(hand.positions))return null;
  return d3(hand.positions[IDX.thumb],hand.positions[index]);
}
export class GestureInstrument {
  constructor(options={}){
    this.press=options.press??.028;
    this.release=options.release??.043;
    this.holdMs=options.holdMs??260;
    this.cooldownMs=options.cooldownMs??380;
    this.state={gate:false,leftPinch:false,rightPinch:false,hold:false,
      candidate:null,comboReady:true,lastTimbre:-Infinity, timbre:0,lastTime:null,
      cutoff:.45,wet:.14,spread:.5,energy:.25,drive:.12};
  }
  reset(){this.state={...this.state,gate:false,leftPinch:false,rightPinch:false,
    hold:false,candidate:null,comboReady:true,lastTimbre:-Infinity,timbre:0,
    lastTime:null,cutoff:.45,wet:.14,spread:.5,energy:.25,drive:.12};}
  update({left=null,right=null,zones=[],now=0}={}){
    const s=this.state,events=[];
    const pinch=(side,prior)=>{
      const d=thumbDistance(side,IDX.index);
      return d!==null && (prior?d<this.release:d<=this.press);
    };
    s.leftPinch=pinch(left,s.leftPinch);
    s.rightPinch=pinch(right,s.rightPinch);
    const both=s.leftPinch&&s.rightPinch;
    if(!both){s.candidate=null;s.comboReady=true;}
    else if(s.comboReady){
      if(s.candidate===null)s.candidate=now;
      if(now-s.candidate>=this.holdMs){
        s.hold=!s.hold;s.comboReady=false;s.candidate=null;
        events.push({type:'HOLD_TOGGLE',value:s.hold?1:0,t_ms:now});
      }
    }
    const tracked=Boolean(left||right);
    s.gate=tracked && (s.rightPinch || (!right&&s.leftPinch) || s.hold);
    if(!tracked && s.hold){s.hold=false;events.push({type:'HOLD_RELEASE',t_ms:now});}
    const controlling=right||left;
    const finger=(index)=>thumbDistance(controlling,index);
    const contact=(dist)=>dist===null?0:clamp((.058-dist)/.038);
    const middle=contact(finger(IDX.middle)),ring=contact(finger(IDX.ring)),
      pinky=contact(finger(IDX.pinky));
    const indexDist=thumbDistance(left||right,IDX.index);
    const rawCutoff=indexDist===null?.45:clamp((indexDist-.016)/.10);
    const lindex=left?.positions?.[IDX.index],rindex=right?.positions?.[IDX.index];
    const handsDistance=d3(lindex,rindex);
    const rawSpread=handsDistance===null?.5:clamp((handsDistance-.10)/.73);
    const wrist=controlling?.positions?.[IDX.wrist];
    const rawEnergy=Array.isArray(wrist)&&Number.isFinite(wrist[1])?
      clamp((wrist[1]+.50)/.85):.25;
    const targets={cutoff:rawCutoff,wet:.08+ring*.44,
      spread:rawSpread,energy:rawEnergy,drive:.12+.68*pinky};
    const dt=s.lastTime===null?16:clamp(now-s.lastTime,0,200);
    s.lastTime=now;
    const alpha=1-Math.exp(-dt/45);
    for(const key of Object.keys(targets))s[key]+=alpha*(targets[key]-s[key]);
    const touch=d3(controlling?.positions?.[IDX.index],controlling?.positions?.[IDX.indexPip]);
    // Cross-finger contact is index-tip to OTHER finger's intermediate joint (middle PIP, joint 12).
    const cross=d3(controlling?.positions?.[IDX.index],controlling?.positions?.[12]);
    if(cross!==null&&cross<=.026&&now-s.lastTimbre>=this.cooldownMs){
      s.timbre=(s.timbre+1)%3;s.lastTimbre=now;
      events.push({type:'TIMBRE_CHANGE',value:s.timbre,t_ms:now});
    }
    for(const ev of zones){
      if(!['A','B','C'].includes(ev?.zone)||!['left','right'].includes(ev?.hand))continue;
      if(ev.type==='ENTER'||ev.type==='EXIT'){
        events.push({type:'ZONE_'+ev.type,zone:ev.zone,hand:ev.hand,t_ms:now});
      }else if(ev.type==='TRACKING_LOST'){
        events.push({type:'ZONE_LOST',zone:ev.zone,hand:ev.hand,t_ms:now});
      }
    }
    return {params:{gate:s.gate?1:0,cutoff:clamp(s.cutoff),wet:clamp(s.wet),
      spread:clamp(s.spread),energy:clamp(s.energy),drive:clamp(s.drive),
      resonance:clamp(.16+middle*.78),hold:s.hold?1:0,timbre:s.timbre},
      events,diagnostics:{
        leftPinch:s.leftPinch,rightPinch:s.rightPinch,interHandM:handsDistance,
        thumbIndexM:thumbDistance(controlling,IDX.index),middleM:finger(IDX.middle),
        ringM:finger(IDX.ring),pinkyM:finger(IDX.pinky),crossM:cross,
        trackedHands:Number(Boolean(left))+Number(Boolean(right))
      }};
  }
}
