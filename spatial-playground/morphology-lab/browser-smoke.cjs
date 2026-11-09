const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const base='http://127.0.0.1:8893/spatial-playground/morphology-lab/index.html';
(async()=>{
 const browser=await chromium.launch({
  headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']
 });
 const errs=[];
 try{
  const page=await browser.newPage({viewport:{width:1450,height:900},deviceScaleFactor:1});
  page.on('pageerror',e=>errs.push(e.message));
  page.on('console',msg=>{if(msg.type()==='error'&&/WebGL|Failed|TypeError/.test(msg.text()))errs.push(msg.text())});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.querySelector('#state')?.textContent?.includes('LIVE 3D'),{timeout:60000});
  assert.equal(await page.locator('.family').count(),6);
  assert.equal(await page.locator('.variant').count(),9);
  const families=['light','brightness','objects','neuron','physarum','sakura'];
  for(let i=0;i<families.length;i++){
   await page.locator('.family').nth(i).click();
   for(let k=0;k<9;k++){
    await page.locator('.variant').nth(k).click();
    const txt=await page.locator('#stage-counter').textContent();
    assert.equal(txt,(i*9+k+1).toString().padStart(2,'0')+' / 54');
    await page.waitForTimeout(65);
   }
   await page.locator('.variant').nth(i===0?2:i===1?3:i===2?5:i===3?4:i===4?6:5).click();
   await page.waitForTimeout(180);
   await page.screenshot({path:'morphology-'+families[i]+'-desktop.png'});
  }
  await page.locator('.family').nth(0).click();
  await page.locator('#compare').click();
  await page.locator('.variant').nth(4).click();
  assert.match(await page.locator('#audit').textContent(),/A \/.*B \//s);
  await page.locator('#depth').evaluate(el=>{
   el.value='80';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await page.locator('#depth-v').textContent(),'80%');
  await page.locator('#complexity').evaluate(el=>{
   el.value='90';el.dispatchEvent(new Event('input',{bubbles:true}));
   el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.locator('#restore').click();
  assert.match(await page.locator('#audit').textContent(),/A \/.*B \//s);
  const btn=page.locator('#export');
  const pending=page.waitForEvent('download');
  await btn.click();
  const dl=await pending;assert.match(dl.suggestedFilename(),/spatial-morphology.*json/);
  await page.locator('#toggle').click();
  assert.equal(await page.locator('#toggle').textContent(),'RESUME');
  await page.locator('#toggle').click();
  const info=await page.locator('#metric').textContent();
  assert.match(info,/VERTICES/);
  await page.close();
  // Mobile checks without declaring headset XR compatibility.
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  mobile.on('pageerror',e=>errs.push(e.message));
  await mobile.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await mobile.waitForFunction(()=>document.querySelector('#state')?.textContent?.includes('LIVE 3D'),{timeout:60000});
  await mobile.locator('.family').nth(5).click();
  await mobile.locator('.variant').nth(6).click();
  await mobile.waitForTimeout(300);
  await mobile.screenshot({path:'morphology-sakura-mobile.png',fullPage:true});
  if(errs.length)throw new Error('Browser runtime errors: '+errs.join('; '));
  console.log('PASS: all 54 selectable WebGL scenes, A/B reference, three sliders, reset, JSON export and 7 screenshots.');
  console.log('These are desktop/mobile software checks, not physical Quest or live EEG/Physarum validations.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||String(e));process.exit(1)});
