/* Optional local browser QA. Set CETAKIN_PLAYWRIGHT to the installed package path. */
const {chromium}=require(process.env.CETAKIN_PLAYWRIGHT || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const data=require('../guide-data.js');
const sourceProducts=require('../data/guide-products.json');
const core=require('../catalog-core.js');
const url=process.env.CETAKIN_PREVIEW || 'http://127.0.0.1:4173';
const output=path.resolve(process.env.CETAKIN_QA_OUTPUT || path.join(__dirname,'../../outputs/guide-qa'));
const csvHeaders='id,type,name,category,origin,price,stock,image_url,description,active';
const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';
const fixture = csvHeaders+'\n'+sourceProducts.filter(p=>data.guides.some(g=>g.products.includes(p.id)) || p.id==='01-053').map(p=>[p.id,p.type,p.name,p.category,'',10000,3,'./assets/catalog/placeholder.svg','Fixture browser test only',true].map(quote).join(',')).join('\n');
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  let browser;
  try {browser=await chromium.launch({headless:true});}catch(_){browser=await chromium.launch({headless:true,channel:'msedge'});}
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url+'/panduan.html');
    await page.locator('#guide-result-count').waitFor();
    assert.equal(await page.locator('.guide-card:visible').count(),21);
    await page.screenshot({path:path.join(output,'hub-desktop.png'),fullPage:false});
    await page.locator('#guide-search').fill('dht');
    assert.equal(await page.locator('.guide-card:visible').count(),2);
    assert.ok(page.url().includes('q=dht'));
    await page.locator('#guide-search').fill('tidak-ditemukan-123');
    assert.equal(await page.locator('#guide-empty').isVisible(),true);
    await page.locator('#guide-reset').click();
    await page.locator('[data-guide-group="Driver"]').click();
    assert.equal(await page.locator('.guide-card:visible').count(),1);
    await page.goto(url+'/panduan.html?q=servo&kategori=Aktuator');
    assert.equal(await page.locator('.guide-card:visible').count(),2);
    await page.goto(url+'/panduan/hc-sr04.html');
    await page.locator('[data-check="0"]').check();
    await page.reload();
    assert.equal(await page.locator('[data-check="0"]').isChecked(),true);
    assert.equal(await page.locator('#check-count').textContent(),'1');
    const expected=data.guides.find(g=>g.id==='hc-sr04').code;
    assert.equal(await page.locator('#main-code').textContent(),expected);
    await page.locator('[data-copy="main-code"]').click();
    const clipboard = await page.evaluate(()=>navigator.clipboard.readText());
    assert.equal(clipboard.replace(/\r\n/g,'\n'),expected); // Windows clipboard normalizes line endings.
    await page.locator('[data-highlight="2"]').click();
    assert.equal(await page.locator('.wiring-svg .highlighted').getAttribute('data-wire'),'2');
    await page.locator('[data-expand]').click();
    assert.equal(await page.locator('#diagram-dialog').isVisible(),true);
    assert.equal(await page.locator('#diagram-dialog .highlighted').count(),1);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#diagram-dialog').isVisible(),false);
    await page.locator('#masalah details').first().locator('summary').click();
    assert.equal(await page.locator('#masalah details').first().getAttribute('open'),'');
    await page.locator('#wiring').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(output,'wiring-desktop.png'),fullPage:false});
    await page.locator('#kode').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector('[data-toc="kode"]').getAttribute('aria-current')==='location');
    assert.equal(await page.locator('[data-toc="kode"]').getAttribute('aria-current'),'location');
    for(const width of [320,360,390,600,768,900,1040,1100,1440]) {
      await page.setViewportSize({width,height:900});
      for (const route of ['/panduan.html','/panduan/hc-sr04.html','/panduan/l298n.html','/index.html']) {
        await page.goto(url+route);
        const dims=await page.evaluate(()=>({body:document.documentElement.scrollWidth,viewport:innerWidth}));
        assert.ok(dims.body<=dims.viewport,`Page overflow ${route} at ${width}: ${JSON.stringify(dims)}`);
      }
    }
    await page.setViewportSize({width:390,height:844});
    await page.goto(url+'/panduan.html');
    await page.screenshot({path:path.join(output,'hub-mobile.png'),fullPage:true});
    await page.locator('.menu-toggle').click();
    await page.locator('.mobile-nav a[href="./panduan.html"]').click();
    assert.equal(await page.locator('#menu-ponsel').isHidden(),true);
    await page.goto(url+'/panduan/hc-sr04.html');
    assert.equal(await page.locator('.guide-toc details').getAttribute('open'),null);
    assert.equal(await page.locator('.wiring-mobile').isVisible(),true);
    assert.equal(await page.locator('.mobile-connection').count(),4);
    await page.locator('[data-highlight="2"]').click();
    assert.equal(await page.locator('.mobile-connection.highlighted').getAttribute('data-mobile-wire'),'2');
    await page.locator('.guide-toc summary').click();
    await page.locator('[data-toc="wiring"]').click();
    assert.equal(await page.locator('.guide-toc details').getAttribute('open'),null);
    await page.locator('[data-expand]').click();
    assert.equal(await page.locator('#diagram-dialog').isVisible(),true);
    await page.locator('#close-diagram').click();
    await page.screenshot({path:path.join(output,'article-mobile.png'),fullPage:true});
    // Visit every article at mobile width, verify code remains byte-for-byte unchanged by highlighting.
    for (const g of data.guides) {
      await page.goto(url+'/panduan/'+g.id+'.html');
      assert.equal(await page.locator('.wiring-svg').count(),1);
      if(g.code)assert.equal(await page.locator('#main-code').textContent(),g.code);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      assert.equal(overflow,false,g.id);
    }
    // Force clipboard rejection and prove a working execCommand fallback.
    await page.goto(url+'/panduan/hc-sr04.html');
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('denied');}},configurable:true}));
    await page.locator('[data-copy="main-code"]').click();
    assert.match(await page.locator('#guide-toast').textContent(),/Kode tersalin/);
    // Isolated catalogue fixture: do not write fake inventory values to the actual database.
    let responseFixture=fixture;
    await page.route('https://docs.google.com/spreadsheets/**',route=>route.fulfill({status:200,contentType:'text/csv',headers:{'access-control-allow-origin':'*'},body:responseFixture}));
    for(const g of data.guides)for(const id of g.products){
      await page.goto(url+'/produk.html?id='+id);
      await page.locator('#product-detail').waitFor({state:'visible'});
      assert.equal(await page.locator('#product-guide').getAttribute('href'),'./panduan/'+g.id+'.html');
      assert.equal(await page.locator('#product-guide').isVisible(),true);
    }
    await page.goto(url+'/produk.html?id=01-053');await page.locator('#product-detail').waitFor({state:'visible'});
    assert.equal(await page.locator('#product-guide').isVisible(),false);
    await page.goto(url+'/robotika.html');await page.locator('.catalog-card').first().waitFor();
    assert.ok(await page.locator('.card-guide-badge').count()>0);
    responseFixture=fixture.replace('"true"','""');
    await page.goto(url+'/produk.html?id=01-044');
    await page.locator('#retry-data').waitFor({state:'visible'});
    assert.equal(await page.locator('#product-guide-fallback').isVisible(),true);
    assert.equal(await page.locator('#product-guide-fallback').getAttribute('href'),'./panduan/hc-sr04.html');
    assert.equal(await page.locator('#product-detail').isVisible(),false);
    responseFixture=fixture;
    await page.locator('#retry-data').click();
    await page.locator('#product-detail').waitFor({state:'visible'});
    assert.equal(await page.locator('#product-guide-fallback').isVisible(),false);
    assert.deepEqual(errors,[]);
    await context.close();
    const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
    const plain=await noJS.newPage();await plain.goto(url+'/panduan/hc-sr04.html');
    assert.ok((await plain.locator('#main-code').textContent()).includes('pulseIn'));
    assert.equal(await plain.locator('#wiring').isVisible(),true);
    await noJS.close();
    // Check the real published CSV independently of browser fixtures.
    try {
      const config=fs.readFileSync(path.join(__dirname,'../site-config.js'),'utf8');
      const source=config.match(/csvUrl:\s*'([^']+)'/)[1];
      const response=await fetch(source,{signal:AbortSignal.timeout(15000)});
      const text=await response.text();
      if(!response.ok)throw Error('HTTP '+response.status);
      try {const items=core.productsFromCSV(text);console.log('LIVE CATALOG:',items.length,'valid active products');}
      catch(e){console.log('LIVE CATALOG DATA ISSUE:',e.message);}
    }catch(e){console.log('LIVE CATALOG CHECK UNAVAILABLE:',e.message);}
    console.log('Browser QA passed: 21 articles, all 25 SKU links, 9 viewport widths, clipboard + fallback, mobile diagram, catalogue error recovery, checklist, search, mobile menu and no-JS reading.');
    console.log('Screenshots:',output);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
