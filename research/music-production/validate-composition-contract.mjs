// Check the structural composition contract. Cannot judge sound quality.
// node research/music-production/validate-composition-contract.mjs [path-to-json]
import fs from "node:fs";
const path=process.argv[2]||new URL("./2026-11-09-COMPOSITION-CONTRACT-EXAMPLE.json",import.meta.url);
const d=JSON.parse(fs.readFileSync(path,"utf-8")); const errors=[];
if(!/^C(0[1-9]|[1-3][0-9]|4[0-8])$/.test(d.concept_id))errors.push("Concept id invalid");
if(!Number.isFinite(d.bpm)||d.bpm<=0)errors.push("BPM invalid");
if(!Array.isArray(d.sections)||!d.sections.length)errors.push("No sections");
let last=0;
for(const s of d.sections||[]){
 if(s.bar_start!==last+1)errors.push("Gap or overlap near "+s.bar_start);
 if(s.bar_end<s.bar_start)errors.push("Reversed section "+s.bar_start);
 if(!s.musical_action||!s.must_remain_audible)errors.push("Missing musical reason or continuity "+s.bar_start);
 last=s.bar_end;
}
if(last!==d.target_bars)errors.push("Sections do not cover target_bars");
if(!d.main_musical_question)errors.push("Missing musical question");
if(!d.what_is_new)errors.push("Missing distinct musical proposition");
if(d.audition?.status==="PASSED" && d.audition?.verdict!=="KEEP") errors.push("Unsupported pass");
console.log(JSON.stringify({id:d.concept_id,bars:d.target_bars,sections:d.sections?.length,errors},null,2));
if(errors.length)process.exitCode=1;
