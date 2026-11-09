const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,args:[
    '--no-sandbox','--use-gl=angle','--use-angle=swiftshader',
    '--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'
  ]});
  const base='http://127.0.0.1:8879/spatial-playground/hand-osc-lab/spellcraft.html';
  const errors=[];
  try{
    const desktop=await browser.newContext({viewport:{width:1440,height:900}});
    for(const line of ['west','east']){
      const page=await desktop.newPage();
      page.on('pageerror',e=>errors.push(line+': '+e.message));
      await page.goto(base+'?line='+line,{waitUntil:'domcontentloaded'});
      await page.locator('#spell-list .spell').first().waitFor();
      assert.equal(await page.locator('#spell-list .spell').count(),6);
      assert.equal(await page.locator('#'+line).getAttribute('aria-pressed'),'true');
      assert.ok((await page.locator('canvas#view').boundingBox()).width>1000);
      for(let i=0;i<6;i++){
        await page.locator('#spell-list .spell').nth(i).click();
        assert.equal(await page.locator('#spell-list .spell').nth(i).getAttribute('aria-pressed'),'true');
        await page.locator('#cast').click();
        await page.waitForTimeout(85);
      }
      await page.locator('#spell-list .spell').nth(5).click();
      if(line==='east'){
        for(let n=0;n<7;n++)await page.locator('#cast').click();
        await page.waitForFunction(()=>document.querySelector('#right-panel').textContent.includes('SCORE 70'),
          {timeout:5000});
      }
      await page.screenshot({path:'spellcraft-'+line+'-desktop.png',animations:'disabled'});
      await page.close();
    }
    await desktop.close();
    // Narrow mobile route smoke is not a headset hand-tracking test.
    const mobile=await browser.newContext({viewport:{width:390,height:844},
      deviceScaleFactor:1,isMobile:true,hasTouch:true});
    const p=await mobile.newPage();
    p.on('pageerror',e=>errors.push('mobile: '+e.message));
    await p.goto(base+'?line=east',{waitUntil:'domcontentloaded'});
    await p.locator('#spell-list .spell').nth(1).click();
    await p.locator('#cast').click();
    await p.waitForTimeout(180);
    await p.screenshot({path:'spellcraft-east-mobile.png',animations:'disabled'});
    assert.deepEqual(errors,[]);
    console.log('PASS: 12 desktop spells, UI selector, WebGL scene, target/gameplay loop, east seven-star combo, mobile selection');
    console.log('NOT TESTED: Quest MR / real hand tracking, physical accuracy, motion-to-photon latency');
  }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||String(e));process.exit(1)});
