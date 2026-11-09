// JSON evidence index validation; does not assert artist technique or sound quality.
// node research/music-production/validate-global-research-atlas.mjs
import fs from "node:fs";
const root=new URL("./",import.meta.url);
const read=n=>JSON.parse(fs.readFileSync(new URL(n,root),"utf8"));
const artists=read("2026-11-09-ARTIST-METHOD-ATLAS.json");
const tools=read("2026-11-09-TOOL-DECISION-ATLAS.json");
const concepts=read("2026-11-09-48-compositional-mechanisms.json");
const example=read("2026-11-09-COMPOSITION-CONTRACT-EXAMPLE.json");
const errors=[],cardIds=new Set(concepts.cards.map(x=>x.id));
if(artists.cards.length!==21)errors.push("Expected 21 artist records");
if(tools.tools.length!==35)errors.push("Expected 35 tool records");
const seenArtists=new Set(),seenTools=new Set();
for(const c of artists.cards){
 if(seenArtists.has(c.id))errors.push("Duplicate artist ID "+c.id);seenArtists.add(c.id);
 if(!/^https:\/\//.test(c.source))errors.push("Missing source URL "+c.id);
 if(!c.evidence||!c.transfer_experiment)errors.push("Missing evidence or original test "+c.id);
 for(const id of c.related_composition_cards)if(!cardIds.has(id))errors.push("Invalid concept link "+c.id+":"+id);
}
for(const t of tools.tools){
 if(seenTools.has(t.id))errors.push("Duplicate tool ID "+t.id); seenTools.add(t.id);
 if(!/^https:\/\//.test(t.url))errors.push("Missing tool URL "+t.id);
 if(!t.priority||!t.caveat||!t.local_test)errors.push("Missing decision caveat "+t.id);
}
if(!cardIds.has(example.concept_id))errors.push("Example references missing concept");
console.log(JSON.stringify({artist_count:artists.cards.length,tool_count:tools.tools.length,concept_count:cardIds.size,errors},null,2));
if(errors.length) process.exitCode=1;
