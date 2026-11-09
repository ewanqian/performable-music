// Evaluate documented evidence and disagreement; never declare aesthetic truth automatically.
// This has no access to real audio or user accounts.
const categories = new Set(['LONG_FORM','SOUND_IDENTITY','ARTISTIC_MEANING','TECHNICAL']);
const decisions = new Set(['KEEP','REVISE','REJECT','UNDECIDED']);
const reviewers = new Set(['ARTIST','MODEL','TECHNICAL_ANALYZER','OTHER_HUMAN']);
const media = new Set(['REAL_WAV','DAW_SESSION','MIDI_OR_PLAN','NONE']);
export function inspectReview(log) {
  const errors=[];
  if(!log || typeof log!=='object' || Array.isArray(log)) return {ok:false,errors:['Expected review object']};
  if(typeof log.contract_id!=='string'||log.contract_id.length<3)errors.push('contract_id required');
  if(!Array.isArray(log.assessments)||log.assessments.length<2)errors.push('At least two perspectives required');
  else for(const [i,a] of log.assessments.entries()){
    if(!a || typeof a!=='object' || !categories.has(a.perspective)||!decisions.has(a.judgement)||
      !reviewers.has(a.reviewer)||!media.has(a.observed_media)||
      typeof a.reason!=='string'||a.reason.trim().length<12)errors.push('Invalid assessment '+i);
    if(a?.reviewer==='MODEL' && a?.observed_media==='NONE' && a?.judgement!=='UNDECIDED') errors.push('Model cannot score unheard media '+i);
    if(a?.reviewer==='TECHNICAL_ANALYZER' && a?.perspective!=='TECHNICAL')errors.push('Automated analyzer cannot claim artistic perspective '+i);
  }
  if(!['PENDING','KEEP','REVISE','REJECT'].includes(log.artist_final_decision))errors.push('Invalid artist final decision');
  if(log.artist_final_decision!=='PENDING'&&!log.assessments?.some(x=>x.reviewer==='ARTIST' && x.judgement===log.artist_final_decision))
    errors.push('Artist final decision must match recorded artist assessment');
  const vals=(log.assessments||[]).filter(x=>x && decisions.has(x.judgement)&&x.judgement!=='UNDECIDED').map(x=>x.judgement);
  return {ok:errors.length===0,errors,distinct_judgements:[...new Set(vals)],
    disagreement:new Set(vals).size>1,
    decision_status:log.artist_final_decision==='PENDING'?'NEEDS_ARTIST_DECISION':'REPORTED_ARTIST_DECISION_NOT_INDEPENDENTLY_AUTHENTICATED',
    note:'Evidence path and review author identity are self-reported; neither this function nor model scores prove subjective quality.'};
}
