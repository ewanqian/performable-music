// Dependency-free structural checks for the v0.2 author-led runtime.
// Static tests do NOT prove browser rendering or user-perceived quality.
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('./app.js',import.meta.url),'utf8');
function assert(test,msg){if(!test)throw new Error(msg)}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
assert(new Set(ids).size===ids.length,"Duplicate HTML element IDs");
const idsInJS=[...js.matchAll(/\bget\(['"]([^'"]+)['"]\)/g)].map(x=>x[1]);
for(const id of idsInJS)assert(ids.includes(id),"JavaScript references missing HTML ID: "+id);
for(const id of ['world','graphics','material','layer3d','layer2d','authored-media','author-asset','authored-image','authored-video','clear-asset','asset-opacity','record','replay','export']){
  assert(ids.includes(id),"Missing required author runtime control: "+id);
}
assert(js.includes('const CAMERA_SCALE ='),"Missing fixed-camera declaration");
assert(!js.includes('scene.scale'),"Per-scene auto zoom has reappeared");
assert(!js.includes('currentScale+='),"Implicit camera push/pull has reappeared");
assert(js.includes('theta=.12'),"Automatic camera rotation may have been restored");
assert(js.includes("motion: 0.00"),"Motion should default to 0");
assert(js.includes("auto: false"),"Auto chapter playback should be opt-in");
assert(js.includes("URL.createObjectURL(file)"),"Local authored asset preview missing");
assert(js.includes("URL.revokeObjectURL(assetURL)"),"Asset object URL cleanup missing");
assert(js.includes("VISUAL_MATERIALS"),"Independent material states missing");
assert(js.includes("material: state.material"),"Material decisions are not recorded");
assert(js.includes("layer3d: state.layer3d"),"3D layer decisions are not recorded");
assert(js.includes("layer2d: state.layer2d"),"2D layer decisions are not recorded");
console.log("STATIC CONTRACT PASS: "+ids.length+" unique elements, "+idsInJS.length+" literal JS DOM references, fixed camera, manual authored layers");
console.log("NOT TESTED: browser media codecs, projector fit, audio/OSC, devices, or venue performance.");
