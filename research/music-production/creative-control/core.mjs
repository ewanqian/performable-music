// Creative Control Institution v0.1 — original implementation, no copied upstream code.
// Offline planning and replay only. NEVER runs a model or controls hardware itself.
import { TransportClock, makeScoreEvent, validateScoreEvent } from '../../../protocols/show-score.mjs';

export const CONTROL_CHANNELS = Object.freeze([
  'energy', 'density', 'tension', 'space', 'pressure', 'fracture'
]);
const SCENES = new Set(['INITIAL_CONDITION','FIELD','OVERRIDE','AFTERIMAGE']);
const STATES = new Set(['IDLE','SEED','BUILD','HOLD','PEAK','RELEASE','SAFE']);
const EVENTS = new Set(['ADVANCE','OVERRIDE','FREEZE','RELEASE','RESET']);
const SOURCES = new Set(['system','foot','hand','button','osc','clock']);
const MODES = new Set(['linear','repeat','reverse','pingpong']);
const isObject = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const finite = n => typeof n === 'number' && Number.isFinite(n);
const inRange = (n, lo, hi) => finite(n) && n >= lo && n <= hi;
const boundedInt = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;

export function validateContract(x) {
  const errors = [];
  const err = message => errors.push(message);
  if (!isObject(x)) return {ok:false,errors:['Plan must be a JSON object']};
  const topKeys = new Set(['contract_version','id','title','status','problem_space','search_space','evaluation','performance','midi_phrases','provenance']);
  for (const key of Object.keys(x)) if (!topKeys.has(key)) err('Unknown top-level property: '+key);
  if (x.contract_version !== 'creative-control-0.1') err('Invalid contract_version');
  if (typeof x.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(x.id)) err('Invalid id');
  if (typeof x.title !== 'string' || !x.title.trim()) err('Missing title');
  if (x.status !== 'DESIGN_ONLY') err('Design must remain DESIGN_ONLY until real verified evidence');
  if (!isObject(x.problem_space) || typeof x.problem_space.question !== 'string' || !x.problem_space.question.trim()
    || typeof x.problem_space.audience_experience !== 'string' || !x.problem_space.audience_experience.trim()
    || !Array.isArray(x.problem_space.non_goals)) err('problem_space requires question, audience_experience and non_goals[]');
  if (!isObject(x.search_space) || !Array.isArray(x.search_space.dimensions) ||
      x.search_space.dimensions.length < 1 || x.search_space.dimensions.length > 4 ||
      !boundedInt(x.search_space.max_trials,1,12)) err('search_space requires 1-4 dimensions and max_trials 1-12');
  else {
    const seen = new Set();
    for (const [i,d] of x.search_space.dimensions.entries()) {
      if (!isObject(d) || typeof d.name !== 'string' || !d.name.trim() || seen.has(d.name) ||
          !Array.isArray(d.values) || d.values.length < 2 || d.values.length > 4 ||
          !d.values.every(n=>inRange(n,0,1))) err('Invalid/duplicate search dimension '+i);
      else { seen.add(d.name); if (new Set(d.values).size !== d.values.length) err('Repeated dimension value '+d.name); }
    }
  }
  if (!isObject(x.evaluation) || !Array.isArray(x.evaluation.perspectives) ||
    x.evaluation.perspectives.length < 2 || !['PENDING','REJECT','REVISE','KEEP'].includes(x.evaluation.human_audio)) {
    err('evaluation requires >=2 perspectives and valid human_audio');
  } else {
    for (const [i,e] of x.evaluation.perspectives.entries()) {
      if (!isObject(e) || !['LONG_FORM','SOUND_IDENTITY','ARTISTIC_MEANING','TECHNICAL'].includes(e.id) ||
        typeof e.question !== 'string' || !e.question.trim()) err('Invalid perspective '+i);
    }
    if (x.evaluation.human_audio !== 'PENDING') err('LLM plan cannot preapprove or reject an unplayed audition');
  }
  if (!isObject(x.performance) || !boundedInt(x.performance.duration_ms,10000,1200000) ||
      !['FREE_TIME','METERED'].includes(x.performance.time_mode) ||
      !inRange(x.performance.reference_bpm,20,320) ||
      !Array.isArray(x.performance.cues) || x.performance.cues.length < 2 || x.performance.cues.length > 100) {
    err('performance must define duration_ms, time_mode, reference_bpm and 2-100 cues');
  } else {
    let last=-1; const ids=new Set();
    for (const [i,c] of x.performance.cues.entries()) {
      if (!isObject(c)) {err('Cue must be an object '+i); continue;}
      if (typeof c.id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(c.id) || ids.has(c.id)) err('Invalid/duplicate cue id '+i);
      else ids.add(c.id);
      if (!boundedInt(c.t_ms,0,x.performance.duration_ms) || c.t_ms<=last) err('Cues must be in increasing milliseconds at '+i);
      else last=c.t_ms;
      if (!SCENES.has(c.scene)||!STATES.has(c.state)||!EVENTS.has(c.event_type)||!SOURCES.has(c.source)) err('Invalid scene/state/event/source at '+i);
      if (typeof c.musical_reason !== 'string' || c.musical_reason.trim().length < 12) err('Missing specific musical reason at cue '+i);
      if (!isObject(c.controls) || Object.keys(c.controls).some(k=>!CONTROL_CHANNELS.includes(k)||!inRange(c.controls[k],0,1))) err('Unbounded/unknown control at cue '+i);
      if (c.event_type==='OVERRIDE' && c.source==='system') err('OVERRIDE must be a performer-authorized source at '+i);
      if (c.event_type==='RESET' && c.source==='system') err('RESET must be human-authorized');
    }
  }
  if (!Array.isArray(x.midi_phrases) || x.midi_phrases.length > 8) err('midi_phrases must be 0-8 items');
  else for (const [i,p] of x.midi_phrases.entries()) {
    if (!isObject(p) || typeof p.id !== 'string'|| !boundedInt(p.start_ms,0,x.performance?.duration_ms??0) ||
      !boundedInt(p.step_ms,15,5000) || !boundedInt(p.steps_per_cycle,1,128) ||
      !boundedInt(p.repeat,1,16) || !MODES.has(p.mode) || !boundedInt(p.channel,1,16) ||
      !Array.isArray(p.notes) || p.notes.length < 1 || p.notes.length > 128) {
      err('Invalid MIDI phrase '+i); continue;
    }
    if (p.start_ms + p.repeat*p.steps_per_cycle*p.step_ms > (x.performance?.duration_ms ?? 0)) err('MIDI phrase outside duration '+p.id);
    for (const n of p.notes) if(!boundedInt(n.pitch,0,127)||!boundedInt(n.step,0,p.steps_per_cycle-1)||
      !boundedInt(n.duration_steps,1,p.steps_per_cycle) || n.step+n.duration_steps>p.steps_per_cycle ||
      !boundedInt(n.velocity,1,127)) err('Invalid note in '+p.id);
  }
  if (!isObject(x.provenance) || !Array.isArray(x.provenance.source_urls) ||
      typeof x.provenance.input_kind !== 'string' ||
      !['SYNTHETIC','OWNED','LICENSED','UNVERIFIED'].includes(x.provenance.input_kind)) err('provenance missing or invalid');
  return {ok:errors.length===0,errors};
}

export function makeTrialMatrix(plan) {
  const check=validateContract(plan); if(!check.ok) throw Error(check.errors.join('\n'));
  const dimensions=plan.search_space.dimensions;
  const baseline=Object.fromEntries(dimensions.map(x=>[x.name,x.values[0]]));
  const out=[{id:'BASE',dimensions:baseline,changed:'none'}];
  for (const d of dimensions) for (const v of d.values.slice(1)) {
    if(out.length>=plan.search_space.max_trials) break;
    out.push({id:'V'+String(out.length).padStart(2,'0'),dimensions:{...baseline,[d.name]:v},changed:d.name});
  }
  return out;
}

export function compileCueTimeline(plan) {
  const check=validateContract(plan); if(!check.ok) throw Error(check.errors.join('\n'));
  const clock=new TransportClock({bpm:plan.performance.reference_bpm,beatsPerBar:4,originMs:0});
  const events=plan.performance.cues.map((c,i)=>{
    const event=makeScoreEvent(clock,{session_id:plan.id,seq:i,t_ms:c.t_ms,scene:c.scene,
      state:c.state,controls:c.controls,event:{type:c.event_type,source:c.source,target:c.id}});
    const valid=validateScoreEvent(event);
    if(!valid.ok) throw Error('Show Score v2 compatibility: '+valid.errors.join(','));
    return event;
  });
  return {
    format:'creative-control-compiled-0.1',
    status:'OFFLINE_SCORE_NOT_AUDITIONED',
    input_id:plan.id,
    transport_note:plan.performance.time_mode==='FREE_TIME'
      ? 'Reference BPM is an encoding coordinate only, not a heard beat or proof of rhythmic music'
      : 'DAW must confirm tempo alignment',
    authoritative_timing:'t_ms',
    show_score_version:'2.0',
    cues:plan.performance.cues.map((cue,i)=>({
      id:cue.id, t_ms:cue.t_ms, musical_reason:cue.musical_reason, 
      join_key:plan.id+':'+i, show_score_event:events[i]
    }))
  };
}

function vlq(n) {
  n=Math.max(0,Math.floor(n));
  if (n>0x0fffffff) throw Error('MIDI delta too large');
  const bytes=[n&0x7f]; while ((n>>=7)>0) bytes.unshift((n&0x7f)|0x80);
  return Buffer.from(bytes);
}
const bigEndian16=n=>Buffer.from([(n>>>8)&255,n&255]);
const bigEndian32=n=>Buffer.from([(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255]);
const trackChunk=data=>Buffer.concat([Buffer.from('MTrk'),bigEndian32(data.length),data]);
function midiTrack(events) {
  events.sort((a,b)=>a.tick-b.tick || a.order-b.order || a.pitch-b.pitch);
  const out=[]; let last=0;
  for (const e of events) {
    if (e.tick<last) throw Error('MIDI event time order failure');
    out.push(vlq(e.tick-last),e.data); last=e.tick;
  }
  out.push(Buffer.from([0,0xff,0x2f,0]));
  return trackChunk(Buffer.concat(out));
}
export function makeMidiSkeleton(plan) {
  const check=validateContract(plan); if(!check.ok) throw Error(check.errors.join('\n'));
  const ppq=960, ticksPerMs=ppq/500; // 120 BPM reference only; actual time is milliseconds.
  const tempo=[{tick:0,order:0,pitch:0,data:Buffer.from([0xff,0x51,3,0x07,0xa1,0x20])}];
  const chunks=[midiTrack(tempo)];
  for(const p of plan.midi_phrases){
    const events=[];
    for(let cycle=0;cycle<p.repeat;cycle++) {
      const reverse=p.mode==='reverse'||(p.mode==='pingpong' && cycle%2===1);
      for(const n of p.notes) {
        const startStep=reverse ? p.steps_per_cycle-(n.step+n.duration_steps) : n.step;
        const startMs=p.start_ms + (cycle*p.steps_per_cycle + startStep)*p.step_ms;
        const endMs=startMs+n.duration_steps*p.step_ms;
        const ch=(p.channel-1)&15;
        const t0=Math.round(startMs*ticksPerMs),t1=Math.round(endMs*ticksPerMs);
        events.push({tick:t0,order:1,pitch:n.pitch,data:Buffer.from([0x90|ch,n.pitch,n.velocity])});
        events.push({tick:t1,order:0,pitch:n.pitch,data:Buffer.from([0x80|ch,n.pitch,0])});
      }
    }
    chunks.push(midiTrack(events));
  }
  const header=Buffer.concat([Buffer.from('MThd'),bigEndian32(6),bigEndian16(1),bigEndian16(chunks.length),bigEndian16(ppq)]);
  return Buffer.concat([header,...chunks]);
}

// vjbake input is measured audio analysis, not an instruction to the composition model.
export function inspectVJBake(meta) {
  const errors=[];
  if(!isObject(meta)||meta.format!=='vjbake-1') errors.push('Not vjbake-1');
  if(!boundedInt(meta?.fps,1,240)||!boundedInt(meta?.frames,1,1e8)||!inRange(meta?.duration_sec,0.001,100000))errors.push('Invalid frame metadata');
  else if(Math.abs(Math.ceil(meta.duration_sec*meta.fps)-meta.frames)>1)errors.push('Frame/duration mismatch');
  if(!isObject(meta?.tempo)||!inRange(meta?.tempo?.bpm,20,320))errors.push('Missing supplied BPM; vjbake does not auto-track');
  return {ok:errors.length===0,errors,
    format:meta?.format??null,
    frames:meta?.frames??null,
    fps:meta?.fps??null,
    duration_sec:meta?.duration_sec??null,
    measured_bpm: false,
    metadata_note:'Tempo supplied by creator; analysis lanes measured from sound; never infer exact MIDI kick or EEG.'};
}
