// node research/music-production/validate-48-mechanisms.mjs
// Data-level consistency checks only. Not evidence of musical quality.
import fs from "node:fs";
const p = new URL("./2026-11-09-48-compositional-mechanisms.json", import.meta.url);
const d=JSON.parse(fs.readFileSync(p,"utf8"));
const errors=[];
if(d.cards?.length!==48)errors.push("Expected exactly 48 cards");
const ids=new Set(),signatures=new Set(),mechanisms=new Set();
const count={}; 
for(const c of (d.cards||[])){
 if(!/^C[0-9]{2}$/.test(c.id))errors.push("Bad concept ID (must be C01-C48): "+c.id); if(ids.has(c.id))errors.push("Duplicate ID "+c.id); ids.add(c.id);
 if(signatures.has(c.unique_musical_promise))errors.push("Duplicate unique promise "+c.id);signatures.add(c.unique_musical_promise);
 const signature=[c.groove_core,c.source_and_timbre,c.tension_development,c.phrase_story,c.performer_decision].join("|");
 if(mechanisms.has(signature))errors.push("Duplicate full mechanism "+c.id);mechanisms.add(signature);
 if(!c.groove_core||!c.phrase_story||!c.reject_if||!c.performer_decision)errors.push("Missing musical mechanism "+c.id);
 if(c.status!=="DESIGN_ONLY_NOT_RENDERED")errors.push("Unsupported completion state "+c.id);
 if(c.tempo_range_bpm?.length!==2||c.tempo_range_bpm[0]>c.tempo_range_bpm[1])errors.push("Invalid tempo "+c.id);
 count[c.family]=(count[c.family]||0)+1;
}
for(const f of d.families){if(count[f.id]!==4)errors.push("Family count mismatch "+f.id);}
console.log(JSON.stringify({cards:d.cards.length,families:Object.keys(count).length,counts:count,errors},null,2));
if(errors.length)process.exitCode=1;
