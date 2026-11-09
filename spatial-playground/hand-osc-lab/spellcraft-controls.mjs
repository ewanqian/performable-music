// Spellcraft Atelier V2 — coherent two-hand spatial menu and aiming mathematics.
// Pure JS so the same hand logic can be exercised without a Quest headset.
// The left open palm summons the menu; the right fist navigates eight radial slots.
// A brief occlusion never commits a skill or acts as a deliberate release.
const finite=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const scale=(v,n)=>v.map(x=>x*n);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const len=p=>Math.hypot(...p);
const norm=p=>scale(p,1/(len(p)||1));
const mix=(a,b,weight)=>norm(add(scale(a,1-weight),scale(b,weight)));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const RADIAL_LABELS=Object.freeze([
  '技能 1','技能 2','技能 3','技能 4','技能 5','技能 6',
  '切换门派','重置关卡'
]);
export function sector8(dx,dy,deadzone=.085){
  if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)<deadzone)return -1;
  return ((Math.round((Math.PI/2-Math.atan2(dy,dx))/(Math.PI/4))%8)+8)%8;
}
export function palmAim(points,measure,viewer){
  if(!Array.isArray(points)||points.length!==25||!points.every(finite)||!measure)return null;
  const eye=finite(viewer?.position)?viewer.position:[0,0,0];
  const forward=norm(finite(viewer?.forward)?viewer.forward:[0,0,-1]);
  const centre=[5,10,15,20].reduce((a,i)=>add(a,points[i]),[0,0,0]).map(v=>v*.25);
  let plane=norm(cross(sub(points[5],points[20]),sub(points[10],points[0])));
  const towardsEye=norm(sub(eye,centre));
  const toPalm=sub(centre,eye),dist=len(toPalm);
  const inView=dist>.14&&dist<1.20&&dot(norm(toPalm),forward)>.43;
  // Normal from bone plane can flip handedness; facing measurement is symmetric.
  const palmFacingViewer=Math.abs(dot(plane,towardsEye))>.48&&inView;
  if(dot(plane,forward)<0)plane=scale(plane,-1);
  const tip=scale(add(points[9],points[14]),.5);
  const proximal=scale(add(points[6],points[11]),.5);
  const swordDir=norm(sub(tip,proximal));
  const sword=measure.kind==='sword';
  const fingerDir=dot(swordDir,forward)>.02?mix(swordDir,forward,.10):swordDir;
  const direction=sword?fingerDir:mix(plane,forward,.20);
  return {
    point:sword?tip:centre,direction,
    palmNormal:plane,palmFacingViewer,inView,
    aimKind:sword?'FINGER':'PALM',palmCentre:centre
  };
}
export function assistedAim(origin,direction,targets=[],minDot=.56){
  if(!finite(origin)||!finite(direction))return null;
  const raw=norm(direction);
  let match=null,rank=-Infinity;
  for(const target of targets){
    if(target?.respawn>0||!finite(target?.position))continue;
    const delta=sub(target.position,origin),distance=len(delta);
    if(distance<.12)continue;
    const toward=norm(delta),alignment=dot(raw,toward);
    if(alignment<minDot)continue;
    // Front targets are favored by alignment, slightly penalizing large range.
    const score=alignment-distance*.022;
    if(score>rank){rank=score;match={id:target.id,point:target.position.slice(),
      alignment,distance,toward};}
  }
  if(!match)return {target:null,direction:raw,point:add(origin,scale(raw,1.65)),lock:false};
  return {
    target:match.id,direction:mix(raw,match.toward,.72),
    point:match.point,alignment:match.alignment,lock:true
  };
}
export class SpellHandMenu {
  constructor(){this.reset();}
  reset(){
    this.active=false;this.leftOpenSince=null;this.leftGoneSince=null;
    this.leftAnchor=null;this.rightWheel=null;this.events=[];
    this.cooldownUntil=-Infinity;this.lastChoice=-Infinity;
  }
  update({left=null,right=null,now=0}={}){
    this.events=[];
    const open=left?.kind==='open'&&left.palmFacingViewer===true&&left.inView===true&&!left.stale;
    if(!this.active){
      if(open){
        if(this.leftOpenSince===null)this.leftOpenSince=now;
        if(now-this.leftOpenSince>=175){
          this.active=true;this.leftAnchor=left.point.slice();this.leftGoneSince=null;
          this.events.push({type:'menu-open',point:left.point.slice()});
        }
      }else this.leftOpenSince=null;
    }
    if(!this.active)return this.snapshot();
    if(open){
      this.leftGoneSince=null;
      if(!this.leftAnchor)this.leftAnchor=left.point.slice();
      const dx=left.point[0]-this.leftAnchor[0];
      if(Math.abs(dx)>.125&&now-this.lastChoice>380){
        const line=dx>0?'east':'west';
        this.leftAnchor=left.point.slice();this.lastChoice=now;
        this.events.push({type:'line',line});
      }
    }else if(this.leftGoneSince===null)this.leftGoneSince=now;
    // A wheel is only valid in MENU mode, so gameplay fists remain usable.
    const fist=right?.kind==='fist'&&!right.stale;
    if(fist){
      if(!this.rightWheel){
        this.rightWheel={anchor:right.point.slice(),selected:-1,
          candidate:-1,candidateSince:now,openedAt:now};
        this.events.push({type:'wheel-open',point:right.point.slice()});
      }
      const wheel=this.rightWheel;
      const dx=right.point[0]-wheel.anchor[0],dy=right.point[1]-wheel.anchor[1];
      const candidate=sector8(dx,dy);
      if(candidate!==wheel.candidate){
        wheel.candidate=candidate;wheel.candidateSince=now;
      }else if(candidate!==-1&&now-wheel.candidateSince>=70)wheel.selected=candidate;
      if(candidate===-1)wheel.selected=-1;
    }else if(this.rightWheel){
      const wheel=this.rightWheel;
      this.rightWheel=null;
      if(right&&!right.stale&&wheel.selected>=0&&now-wheel.openedAt>=130){
        const idx=wheel.selected;
        if(idx<6)this.events.push({type:'skill',index:idx});
        else if(idx===6)this.events.push({type:'toggle-line'});
        else this.events.push({type:'reset'});
        this.cooldownUntil=now+220;
        this.lastChoice=now;
      }else this.events.push({type:'wheel-cancel'});
    }
    if(this.leftGoneSince!==null&&now-this.leftGoneSince>=280&&!this.rightWheel){
      this.active=false;this.leftOpenSince=null;this.leftAnchor=null;
      this.events.push({type:'menu-close'});
    }
    return this.snapshot();
  }
  snapshot(){
    return {
      active:this.active,
      wheel:this.rightWheel?{
        anchor:this.rightWheel.anchor.slice(),
        selected:this.rightWheel.selected,
        candidate:this.rightWheel.candidate
      }:null,
      palm:this.leftAnchor?.slice()||null,
      events:this.events.slice(),
      suppress:this.active,
      cooldownUntil:this.cooldownUntil
    };
  }
}
