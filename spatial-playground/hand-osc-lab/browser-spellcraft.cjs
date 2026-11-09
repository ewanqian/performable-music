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
      // Exercise the same two-hand menu state machine through desktop pointer mock.
      await page.locator('#mock-palm').click();
      await page.waitForFunction(()=>document.querySelector('#right-panel').textContent.includes('MENU'),{timeout:5000});
      await page.mouse.move(750,490);
      await page.mouse.down();
      await page.waitForTimeout(170);
      await page.mouse.move(1060,490,{steps:9});
      await page.waitForTimeout(140);
      await page.screenshot({path:'spellcraft-'+line+'-eight-way-wheel.png',animations:'disabled'});
      await page.mouse.up();
      await page.waitForFunction(()=>document.querySelector('#spell-list .spell:nth-child(3)').getAttribute('aria-pressed')==='true',{timeout:5000});
      // Select traditions using the raised left palm's horizontal movement.
      if(line==='west'){
        await page.waitForTimeout(440);
        await page.locator('#mock-east').click();
        await page.waitForFunction(()=>document.querySelector('#east').getAttribute('aria-pressed')==='true',{timeout:5000});
        await page.waitForTimeout(440);
        await page.locator('#mock-west').click();
        await page.waitForFunction(()=>document.querySelector('#west').getAttribute('aria-pressed')==='true',{timeout:5000});
      }
      await page.locator('#mock-palm').click();
      await page.waitForTimeout(330);
      await page.mouse.move(720,490);
      await page.locator('[data-gesture=sword]').click();
      await page.waitForFunction(()=>document.querySelector('#right-panel').textContent.includes('AIM'),{timeout:5000});
      await page.locator('[data-gesture=neutral]').click();
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
    console.log('PASS: 12 desktop spells, left-palm class selector, 8-way fist wheel, aim indicator, 3D hit scoring, mobile controls');
    console.log('NOT TESTED: Quest MR / real hand tracking, physical accuracy, motion-to-photon latency');
  }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||String(e));process.exit(1)});
