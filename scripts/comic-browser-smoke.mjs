import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import { acknowledgeReaderAdvisory } from './comic-advisory-smoke.mjs';
const manifestBytes=await fs.readFile(process.env.MANIFEST);
const m=JSON.parse(manifestBytes);
if(!/^\/#\/comic\?edition=[a-z0-9-]+&page=\{page\}$/.test(m.reader_path)) throw new Error('Unapproved reader route template');
const base=process.env.TEST_BASE || 'http://127.0.0.1:4173';
if(base!=='http://127.0.0.1:4173') throw new Error('This qualification smoke runs only against the local built candidate');
const results=[];
const marker = m.schema_version === 2 ? await (await fetch(base + '/publishing/deployment.json', { redirect:'error' })).json() : null;
if (marker && (marker.release_id !== m.id || !/^[a-f0-9]{40}$/.test(marker.media_commit))) throw new Error('Wrong candidate release marker');
const privateAssets = process.env.PRIVATE_COMIC_PREFLIGHT_ROOT;
if (privateAssets) {
  const exact = /^[a-f0-9]{40}$/;
  if (!m.delivery || m.edition !== 'ixiv' || m.page_count !== 514 ||
      !path.isAbsolute(privateAssets) || !exact.test(process.env.PRIVATE_EXPECTED_HEAD ?? '') ||
      !exact.test(process.env.PRIVATE_EXPECTED_MEDIA ?? '') ||
      marker.status !== 'PRIVATE_BUILT_NOT_PUBLISHED' ||
      marker.commit !== process.env.PRIVATE_EXPECTED_HEAD ||
      marker.media_commit !== process.env.PRIVATE_EXPECTED_MEDIA ||
      marker.repository !== m.repository || marker.page_count !== m.page_count ||
      marker.pdf_sha256 !== m.pdf.sha256 ||
      marker.manifest_sha256 !== createHash('sha256').update(manifestBytes).digest('hex')) {
    throw new Error('Private browser preflight requires exact head, manifest, PDF and media pins');
  }
}
const require=createRequire(path.resolve('browser-tooling/package.json'));
const {chromium,webkit}=require('playwright');
await fs.mkdir('browser-receipts',{recursive:true});
async function mountPrivateImages(context) {
  if (!privateAssets) return;
  const inventory = new Map(m.images.map((spec, i) => {
    const expected = `techops-comic/volumes-i-xiv/${String(i+1).padStart(3,'0')}.webp`;
    if (spec.path !== expected) throw new Error('Invalid private image path');
    return [`https://raw.githubusercontent.com/${m.repository}/${marker.media_commit}/${expected}`,spec];
  }));
  await context.route('**/*', async route => {
    const url = route.request().url();
    const spec = inventory.get(url);
    if (spec) {
      try {
        const bytes = await fs.readFile(path.join(privateAssets,spec.path));
        if (bytes.length !== spec.bytes || createHash('sha256').update(bytes).digest('hex') !== spec.sha256) {
          throw new Error('Private image does not match exact manifest');
        }
        await route.fulfill({status:200,contentType:'image/webp',body:bytes});
      } catch {
        await route.abort('failed');
      }
      return;
    }
    // Do not send unpublished route context, local data, or any private bytes elsewhere.
    if (new URL(url).origin === base) await route.continue();
    else await route.abort('blockedbyclient');
  });
}
try {
  for(const [name,engine,viewport,mobile] of [
    ['desktop-chromium',chromium,{width:1280,height:800},false],
    ['phone-chromium',chromium,{width:390,height:844},true],
    ['phone-webkit',webkit,{width:390,height:844},true]
  ]) {
    const browser=await engine.launch();
    try {
      const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,...(privateAssets?{serviceWorkers:'block'}:{})});
      await mountPrivateImages(context);
      const page=await context.newPage();
      const advisoryRequired=m.edition==='ixiv';
      const samplePages=advisoryRequired?[1,377,m.page_count]:[1,m.page_count];
      const visits=[...new Set(samplePages)].map((n,i)=>({n, target:page, visit:i?'same-session':'first', expectation:advisoryRequired?(i?'already-acknowledged':'fresh'):'legacy'}));
      const freshLast=advisoryRequired?await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,...(privateAssets?{serviceWorkers:'block'}:{})}):null;
      if(freshLast) await mountPrivateImages(freshLast);
      if(freshLast) visits.push({n:m.page_count,target:await freshLast.newPage(),visit:'fresh-last',expectation:'fresh'});
      for(const {n,target,visit,expectation} of visits) {
        await target.goto(base+m.reader_path.replace('{page}',String(n)),{waitUntil:'domcontentloaded',timeout:60000});
        if (advisoryRequired && expectation==='fresh' && privateAssets) {
          const warning=target.getByRole('dialog',{name:'Parental advisory',exact:true});
          await warning.waitFor({state:'visible',timeout:30000});
          await target.keyboard.press('Escape');
          if (!(await warning.isVisible()) || await target.locator('.comic-page-image,audio').count()) {
            throw new Error('Advisory was bypassed or media mounted before consent');
          }
        }
        const advisoryAcknowledged=await acknowledgeReaderAdvisory(target,expectation);
        const img=target.locator('.comic-page-image');
        await img.waitFor({state:'visible',timeout:30000});
        await target.waitForFunction(()=>{const i=document.querySelector('.comic-page-image');return i?.complete && i.naturalWidth>0;},{},{timeout:30000});
        const expected=m.images[n-1];
        const expectedURL = m.schema_version === 2 ? `https://raw.githubusercontent.com/${m.repository}/${marker.media_commit}/${expected.path}` : base + '/' + expected.path.slice(7);
        if (m.schema_version === 2 && m.edition === 'g') {
          await target.getByRole('button', { name: 'Enlarge', exact: true }).click();
          await target.waitForFunction(url => {
            const image = document.querySelector('.comic-page-image');
            return image?.currentSrc === url && image.complete && image.naturalWidth > 0;
          }, expectedURL, { timeout: 30000 });
        }
        const actual=await img.evaluate(i=>{
          const rect=i.getBoundingClientRect();
          return {src:i.currentSrc,width:i.naturalWidth,height:i.naturalHeight,renderWidth:rect.width,renderHeight:rect.height};
        });
        if(new URL(actual.src).href !== expectedURL || actual.width!==expected.width || actual.height!==expected.height) throw new Error(`${name} page ${n}: wrong artwork or dimensions`);
        if (advisoryRequired && (actual.renderWidth<=0 || Math.abs(actual.renderHeight - actual.renderWidth*expected.height/expected.width)>1.5)) throw new Error(`${name} page ${n}: layout stretched native artwork`);
        const pdf=m.schema_version === 2 ? m.pdf.filename : m.pdf.path.split('/').pop();
        const pdfLink = target.locator(`.comic-downloads a[href*="${pdf}"]`).first();
        await pdfLink.waitFor({state:'visible',timeout:30000});
        if (m.schema_version === 2 && await pdfLink.getAttribute('href') !== `https://github.com/${m.repository}/releases/download/${m.delivery?.tag ?? m.source.tag}/${pdf}`) throw new Error('Wrong master link');
        if (advisoryRequired && n===m.page_count) {
          if (!(await target.getByRole('button',{name:'Next page',exact:true}).isDisabled()) ||
              await target.getByLabel('Jump to page',{exact:true}).locator('option').count() !== m.page_count) {
            throw new Error('Edition cutoff is not enforced');
          }
        }
        if (!privateAssets) await target.screenshot({path:`browser-receipts/${name}-${n}-${visit}.png`,fullPage:false});
        results.push({profile:name,page:n,visit,advisoryAcknowledged,result:'PASS',...actual});
      }
      if(freshLast) await freshLast.close();
      await context.close();
    } finally {await browser.close();}
  }
} finally {
  await fs.writeFile('browser-receipts/result.json',JSON.stringify({release_id:m.id,physical_device_test:false,scope:privateAssets?'PRIVATE_PREFLIGHT':'PUBLISHER_QUALIFICATION',checks:results},null,2));
}
console.log(JSON.stringify({release_id:m.id,result:'PASS',checks:results.length,physical_device_test:false}));
