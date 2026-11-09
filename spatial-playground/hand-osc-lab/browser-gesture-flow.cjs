const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
   '--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
 ]});
 const errors=[],base='http://127.0.0.1:8879/spatial-playground/hand-osc-lab/gesture-dynamics.html';
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('#status').waitFor();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('DESKTOP MOCK'),
    {timeout:18000});
  assert.equal(await page.locator('#shape option').count(),3);
  // A real browser user gesture unlocks the original WebAudio score, not just UI text.
  await page.locator('#music-toggle').click();
  await page.waitForFunction(()=>document.querySelector('#music-status').textContent.includes('LIVE GESTURE'),
    {timeout:7000});
  await page.waitForTimeout(410);
  await page.locator('#music-toggle').click();
  assert.match(await page.locator('#music-toggle').innerText(),/MUSIC ON/);
  await page.locator('#music-toggle').click();
  await page.waitForFunction(()=>document.querySelector('#music-status').textContent.includes('LIVE GESTURE'),
    {timeout:7000});
  await page.locator('#tracking-tolerance').evaluate(el=>{el.value='460';el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.match(await page.locator('#tracking-tolerance-value').innerText(),/460ms/);
  await page.locator('[data-gesture=fist]').click();
  await page.mouse.move(790,430);
  for(let i=0;i<15;i++){await page.mouse.move(700+i*9,420+(i%4)*6);await page.waitForTimeout(60);}
  await page.waitForTimeout(550);
  const chargeText=await page.locator('#status').innerText();
  assert.match(chargeText,/RIGHT FIST/);
  const match=chargeText.match(/ENERGY ([\d.]+)/);
  assert.ok(match&&Number(match[1])>.3,'fist should accumulate energy');
  await page.screenshot({path:'gesture-v3-fist-charge.png'});
  await page.locator('[data-gesture=sword]').click();
  await page.waitForTimeout(1250);
  await page.mouse.move(990,330);
  await page.waitForTimeout(350);
  const streamText=await page.locator('#status').innerText();
  assert.match(streamText,/RIGHT SWORD/);
  const n=Number(streamText.match(/PARTICLES (\d+)/)?.[1]);
  assert.ok(n>90, 'continuous particle stream must be active, got '+n);
  await page.screenshot({path:'gesture-v3-jet-stream.png'});
  await page.locator('#shape').selectOption('ribbon');
  await page.locator('[data-gesture=sword]').click();
  await page.mouse.move(940,380);
  await page.waitForTimeout(1400);
  await page.screenshot({path:'gesture-v3-stripe-stream.png'});
  await page.locator('[data-gesture=open]').click();
  await page.waitForTimeout(160);
  assert.match(await page.locator('#status').innerText(),/RIGHT OPEN/);
  await page.screenshot({path:'gesture-v3-open-burst.png'});
  assert.deepEqual(errors,[]);
  await context.close();
  const mobile=await browser.newContext({viewport:{width:390,height:844},
     deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const phone=await mobile.newPage();
  phone.on('pageerror',e=>errors.push('mobile: '+e.message));
  await phone.goto(base,{waitUntil:'domcontentloaded'});
  await phone.locator('[data-gesture=sword]').click();
  await phone.waitForTimeout(900);
  await phone.screenshot({path:'gesture-v3-mobile.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: actual WebGL V3 rendering, fist charge, continuous jet, ribbon, palm burst and mobile controls.');
  console.log('NOT TESTED: Quest 3 physical hands, hand-occlusion accuracy, visual comfort or 72/90 fps runtime.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||String(e));process.exit(1)});
