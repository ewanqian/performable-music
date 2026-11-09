const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const base=process.env.WARLOCK_URL||'http://127.0.0.1:8879/spatial-playground/warlock-lab/';
 const errors=[],report={desktop:{},mobile:{},audio:{},notTested:['physical Quest 3 hands/controllers','motion-to-photon latency','perceptual audio quality','1:1 game fidelity']};
 fs.mkdirSync('warlock-qa',{recursive:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:1});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.__WARLOCK__);
  assert.equal(await page.locator('[data-school]').count(),6);
  assert.equal((await page.evaluate(()=>window.__WARLOCK__.snapshot())).school,'stasis');
  await page.screenshot({path:'warlock-qa/01-stasis-staff.png'});
  await page.locator('#sound').click();await page.waitForFunction(()=>window.__WARLOCK__.snapshot().sound.state==='running');
  await page.locator('[data-action=collect]').click();await page.waitForTimeout(1150);
  await page.locator('[data-action=primary]').click();
  await page.waitForFunction(()=>window.__WARLOCK__.snapshot().frozen>0,null,{timeout:15000});
  await page.locator('#release').click();await page.screenshot({path:'warlock-qa/02-stasis-frozen.png'});
  await page.locator('[data-action=secondary]').click();
  await page.waitForFunction(()=>window.__WARLOCK__.snapshot().shatters>0,null,{timeout:8000});
  await page.waitForTimeout(80);await page.screenshot({path:'warlock-qa/03-stasis-shatter.png'});
  report.desktop.stasis=await page.evaluate(()=>window.__WARLOCK__.snapshot());
  let peakRms=0;for(let i=0;i<8;i++){await page.waitForTimeout(60);peakRms=Math.max(peakRms,(await page.evaluate(()=>window.__WARLOCK__.snapshot())).sound.rms);}
  assert.ok(peakRms>0.00001,'Web Audio graph should produce non-zero output');report.audio={peakObservedRms:peakRms,originalSynthesis:true,realHeadsetListening:false};
  for(const id of ['solar','void','arc','strand','prismatic']){
   await page.locator('[data-school='+id+']').click();await page.locator('[data-action=collect]').click();await page.waitForTimeout(350);
   await page.locator('[data-action=primary]').click();await page.waitForTimeout(id==='void'?2600:1250);
   await page.locator('#release').click();await page.locator('[data-action=secondary]').click();await page.waitForTimeout(180);
   await page.locator('[data-action=super]').click();await page.waitForTimeout(160);
   const state=await page.evaluate(()=>window.__WARLOCK__.snapshot());assert.equal(state.school,id);assert.ok(state.superCooldown>0,id+' super should activate');assert.ok(state.score>0||state.projectiles>0||state.fields>0,id+' should be interactive');
   report.desktop[id]=state;await page.screenshot({path:'warlock-qa/'+id+'.png'});
  }
  await page.locator('#sound').click();assert.equal((await page.evaluate(()=>window.__WARLOCK__.snapshot())).sound.enabled,false);
  await page.locator('#trial').click();await page.waitForFunction(()=>window.__WARLOCK__.snapshot().session.active);
  await page.locator('#reset').click();assert.equal((await page.evaluate(()=>window.__WARLOCK__.snapshot())).session.active,false);
  assert.deepEqual(errors,[]);await context.close();
  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const p=await mobile.newPage();p.on('pageerror',e=>errors.push('mobile:'+e.message));await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.__WARLOCK__);
  await p.locator('[data-school=stasis]').click();await p.locator('[data-action=super]').click();await p.waitForTimeout(1000);
  report.mobile=await p.evaluate(()=>({...window.__WARLOCK__.snapshot(),overflow:document.documentElement.scrollWidth>innerWidth}));assert.equal(report.mobile.overflow,false);assert.ok(report.mobile.freezes>0);await p.screenshot({path:'warlock-qa/mobile.png'});assert.deepEqual(errors,[]);
  report.errors=errors;report.passed=true;fs.writeFileSync('warlock-qa/report.json',JSON.stringify(report,null,2));
  console.log('PASS: six distinct gameplay loops, default physical staff, freeze/shatter collision, nonzero WebAudio, mute, timed challenge and mobile controls.');
  console.log('NOT TESTED: physical Quest 3 hands/aim/latency, perceptual SFX or 1:1 fidelity.');
 }catch(e){report.errors=errors;report.failure=String(e.stack||e);fs.writeFileSync('warlock-qa/report.json',JSON.stringify(report,null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
