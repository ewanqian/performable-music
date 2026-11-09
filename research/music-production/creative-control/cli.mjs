#!/usr/bin/env node
// Headless, offline-only, deterministic. No model calls, network, DAW or hardware writes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {validateContract, makeTrialMatrix, compileCueTimeline, makeMidiSkeleton, inspectVJBake} from './core.mjs';
import {inspectReview} from './review.mjs';
const [command,inputPath,outDir]=process.argv.slice(2);
function usage() {console.error('Usage: node cli.mjs validate|trials|compile|inspect-vjbake|review <json> [new-output-folder]');process.exit(2)}
if(!command || !inputPath || !['validate','trials','compile','inspect-vjbake','review'].includes(command))usage();
let input;
try {input=fs.readFileSync(inputPath,'utf8')}catch(e){console.error('READ_ERROR '+e.message);process.exit(2)}
let data;
try {data=JSON.parse(input)}catch(e){console.error('JSON_PARSE_ERROR '+e.message);process.exit(2)}
if(command==='review') {
  const result=inspectReview(data);
  console.log(JSON.stringify(result,null,2));
  if(!result.ok)process.exitCode=1;
} else if(command==='inspect-vjbake') {
  const result=inspectVJBake(data);
  console.log(JSON.stringify(result,null,2));
  if(!result.ok)process.exitCode=1;
} else {
  const result=validateContract(data);
  if(command==='validate') {
    console.log(JSON.stringify(result,null,2));
    if(!result.ok)process.exitCode=1;
  } else if(!result.ok) {
    console.error(JSON.stringify({status:'REJECTED_UNTRUSTED_PLAN',errors:result.errors},null,2));
    process.exitCode=1;
  } else if(command==='trials') {
    console.log(JSON.stringify(makeTrialMatrix(data),null,2));
  } else {
    if(!outDir)usage();
    const target=path.resolve(outDir);
    if(fs.existsSync(target)) {console.error('Refusing to overwrite existing directory '+target);process.exit(3)}
    const timeline=compileCueTimeline(data),midi=makeMidiSkeleton(data),matrix=makeTrialMatrix(data);
    fs.mkdirSync(target,{recursive:true});
    fs.writeFileSync(path.join(target,'show-score-v2.jsonl'),
      timeline.cues.map(x=>JSON.stringify(x.show_score_event)).join('\n')+'\n');
    fs.writeFileSync(path.join(target,'cue-ledger.json'),JSON.stringify(timeline,null,2)+'\n');
    fs.writeFileSync(path.join(target,'control-midi.mid'),midi);
    fs.writeFileSync(path.join(target,'trial-matrix.json'),JSON.stringify(matrix,null,2)+'\n');
    const manifest={
      format:'creative-control-compiled-0.1',status:'UNHEARD_OFFLINE_PLAN_ONLY',
      source_path:path.resolve(inputPath),source_sha256:crypto.createHash('sha256').update(input).digest('hex'),
      no_audio_rendered:true,no_live_osc_sent:true,requires_daw_validation:true,requires_human_audio_judgment:true,
      vjbake_requires_actual_approved_wav:true,transport_note:timeline.transport_note,
      files:['show-score-v2.jsonl','cue-ledger.json','control-midi.mid','trial-matrix.json']
    };
    fs.writeFileSync(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
    console.log(JSON.stringify({status:'COMPILED_UNHEARD',folder:target,bytes:midi.length,cues:timeline.cues.length,trials:matrix.length},null,2));
  }
}
