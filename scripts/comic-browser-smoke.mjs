import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const m=JSON.parse(await fs.readFile(process.env.MANIFEST,'utf8'));
if(!/^\/#\/comic\?edition=[a-z0-9-]+&page=\{page\}$/.test(m.reader_path)) throw new Error('Unapproved reader route template');
const require=createRequire(path.resolve('browser-tooling/package.json'));
const {chromium,webkit}=require('playwright');
const base=process.env.TEST_BASE || 'http://127.0.0.1:4173';
if(base!=='http://127.0.0.1:4173') throw new Error('This qualification smoke runs only against the local built candidate');
await fs.mkdir('browser-receipts',{recursive:true});
const results=[];
const marker = m.schema_version === 2 ? await (await fetch(base + '/publishing/deployment.json')).json() : null;
if (marker && (marker.release_id !== m.id || !/^[a-f0-9]{40}$/.test(marker.media_commit))) throw new Error('Wrong candidate release marker');
try {
  for(const [name,engine,viewport,mobile] of [
    ['desktop-chromium',chromium,{width:1280,height:800},false],
    ['phone-chromium',chromium,{width:390,height:844},true],
    ['phone-webkit',webkit,{width:390,height:844},true]
  ]) {
    const browser=await engine.launch();
    try {
      const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});
      const page=await context.newPage();
      for(const n of [...new Set([1,m.page_count])]) {
        await page.goto(base+m.reader_path.replace('{page}',String(n)),{waitUntil:'domcontentloaded',timeout:60000});
        const img=page.locator('.comic-page-image');
        await img.waitFor({state:'visible',timeout:30000});
        await page.waitForFunction(()=>{const i=document.querySelector('.comic-page-image');return i?.complete && i.naturalWidth>0;},{},{timeout:30000});
        const actual=await img.evaluate(i=>({src:i.currentSrc,width:i.naturalWidth,height:i.naturalHeight}));
        const expected=m.images[n-1];
        const expectedURL = m.schema_version === 2 ? `https://raw.githubusercontent.com/${m.repository}/${marker.media_commit}/${expected.path}` : base + '/' + expected.path.slice(7);
        if(new URL(actual.src).href !== expectedURL || actual.width!==expected.width || actual.height!==expected.height) throw new Error(`${name} page ${n}: wrong artwork or dimensions`);
        const pdf=m.schema_version === 2 ? m.pdf.filename : m.pdf.path.split('/').pop();
        const pdfLink = page.locator(`.comic-downloads a[href*="${pdf}"]`).first();
        await pdfLink.waitFor({state:'visible',timeout:30000});
        if (m.schema_version === 2 && await pdfLink.getAttribute('href') !== `https://github.com/${m.repository}/releases/download/${m.source.tag}/${pdf}`) throw new Error('Wrong master link');
        await page.screenshot({path:`browser-receipts/${name}-${n}.png`,fullPage:false});
        results.push({profile:name,page:n,result:'PASS',...actual});
      }
      await context.close();
    } finally {await browser.close();}
  }
} finally {
  await fs.writeFile('browser-receipts/result.json',JSON.stringify({release_id:m.id,physical_device_test:false,checks:results},null,2));
}
console.log(JSON.stringify({release_id:m.id,result:'PASS',checks:results.length,physical_device_test:false}));

