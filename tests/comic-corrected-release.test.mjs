import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { GUIDED_EDITIONS, emptyGuidedScore, resolveGuidedCue } from '../public/k-world/guided.js';
import { validateCurrentBookSources } from '../scripts/finalize-comic-dist.mjs';
import { EDITORIAL_PAGES, editorialAssetSpecs, verifyAsset } from '../scripts/verify-comic-xiv-editorial.mjs';
const manifest=JSON.parse(readFileSync(new URL('../src/data/comic-current-editions.json',import.meta.url)));
const prior=JSON.parse(readFileSync(new URL('../docs/COMIC_CORRECTED_RELEASE_20261110.json',import.meta.url)));
const editorial=JSON.parse(readFileSync(new URL('../docs/COMIC_XIV_EDITORIAL_RELEASE_20261110.json',import.meta.url)));
const hashes={g:'c18407af88e9ba6dbb5ed4707fc998bd19e12d31c59b2f92b87f58d8a0bfa50b','xiii-r':'85c2fbd8c80b8704c884cdfe2f1771f2bbd856bbfaabde57ca855112c4580637',xiv:'b7390c69652886ee88ed9af2e69f9dcf7eff7338bc731bce7e393914b8259353'};
test('corrected masters retain exact identities and counts',()=>{for(const [id,count] of Object.entries({g:316,'xiii-r':49,xiv:133})){const b=manifest.books[id];assert.equal(b.pageCount,count);assert.equal(b.pdfSha256,hashes[id]);assert.match(b.imageBase,new RegExp(`/[a-f0-9]{40}/techops-comic/`));assert.match(b.pdfUrl,/^https:\/\/github\.com\/ninja-ops-guy\/theemrld-portfolio\/releases\/download\//);}});
test('every source page is covered once by ordered sections',()=>{for(const b of Object.values(manifest.books)){const pages=b.sections.flatMap(s=>Array.from({length:s.end-s.start+1},(_,i)=>s.start+i));assert.deepEqual(pages,Array.from({length:b.pageCount},(_,i)=>i+1));}});
test('contents links and bookmarks stay within each edition',()=>{for(const b of Object.values(manifest.books)){for(const s of b.scenes)assert.ok(s.page>=1&&s.page<=b.pageCount);for(const [page,links]of Object.entries(b.links)){assert.ok(Number(page)>=1&&Number(page)<=b.pageCount);for(const l of links){assert.ok(l.page>=1&&l.page<=b.pageCount);assert.ok(l.rect.every(v=>Number.isFinite(v)&&v>=-0.01&&v<=100.01));assert.ok(l.rect[2]>l.rect[0]&&l.rect[3]>l.rect[1]);}}}});
test('soundtrack registrations match corrected editions without remapping old cues',()=>{for(const [id,b]of Object.entries(manifest.books)){assert.equal(GUIDED_EDITIONS[id].revision,b.revision);assert.equal(GUIDED_EDITIONS[id].pageCount,b.pageCount);assert.equal(resolveGuidedCue(emptyGuidedScore(),{edition:id,page:1,revision:b.revision}),null);}assert.equal(GUIDED_EDITIONS.f.pageCount,316);assert.equal(GUIDED_EDITIONS.xiii.pageCount,40);});
test('retired routes redirect rather than expose superseded readers',()=>{const text=readFileSync(new URL('../src/pages/TechOpsComic.tsx',import.meta.url),'utf8');assert.ok(!text.includes('LegacyTechOpsComic'));assert.ok(text.includes('<Navigate replace'));assert.ok(text.includes("edition === 'xiii' ? 'xiii-r' : 'g'"));assert.ok(text.includes("params.get('from') === 'world'"));assert.ok(!text.includes('comic-revision-f.json'));});

function mixedSourceFixture() {
  const data=structuredClone(manifest), receipt=structuredClone(editorial);
  const book=data.books.xiv;
  book.mediaCommit='1234567890123456789012345678901234567890';
  book.releaseTag='test-xiv-editorial';
  book.imageBase=`https://raw.githubusercontent.com/ninja-ops-guy/theemrld-portfolio/${book.mediaCommit}/${book.imagePath}`;
  book.pdfUrl=`https://github.com/ninja-ops-guy/theemrld-portfolio/releases/download/${book.releaseTag}/${book.pdfFilename}`;
  receipt.mediaCommit=book.mediaCommit; receipt.releaseTag=book.releaseTag;
  return {data,receipt};
}

test('current publication has complete exact per-book source pins',()=>{
  validateCurrentBookSources(manifest);
  editorialAssetSpecs(manifest,editorial);
});
test('per-book source pins support independent XIV while retaining G and XIII',()=>{
  const {data}=mixedSourceFixture(); const pins=validateCurrentBookSources(data);
  assert.deepEqual(pins.g,{mediaCommit:prior.mediaCommit,releaseTag:prior.releaseTag});
  assert.deepEqual(pins['xiii-r'],pins.g);
  assert.equal(pins.xiv.mediaCommit,data.books.xiv.mediaCommit);
  assert.equal(pins.xiv.releaseTag,data.books.xiv.releaseTag);
  assert.notEqual(pins.xiv.mediaCommit,pins.g.mediaCommit);
  assert.notEqual(pins.xiv.releaseTag,pins.g.releaseTag);
  for(const id of ['g','xiii-r']) assert.deepEqual(manifest.books[id],prior.books[id]);
});
test('incorrect source origin, commit, release and explicit missing pins are rejected',()=>{
  const changes=[
    b=>b.imageBase=b.imageBase.replace('raw.githubusercontent.com','example.invalid'),
    b=>b.imageBase=b.imageBase.replace(b.mediaCommit,'0'.repeat(40)),
    b=>b.imageBase+='?unreviewed=1',
    b=>b.pdfUrl=b.pdfUrl.replace('github.com','example.invalid'),
    b=>b.pdfUrl=b.pdfUrl.replace(b.releaseTag,'wrong-release'),
    b=>b.pdfUrl+='/wrong.pdf',
    b=>b.mediaCommit=null,
    b=>b.releaseTag='',
    b=>b.imagePath='../volume-xiv/'
  ];
  for(const change of changes){const {data}=mixedSourceFixture();change(data.books.xiv);assert.throws(()=>validateCurrentBookSources(data));}
});
test('XIV editorial changes retain pagination, bookmarks and soundtrack compatibility',()=>{
  for(const key of ['id','revision','pageCount','width','height','imagePath','sections','scenes','links']) assert.deepEqual(manifest.books.xiv[key],prior.books.xiv[key],key);
  assert.equal(manifest.books.xiv.contentRevision,'editorial-b7390c696528');
  assert.equal(manifest.books.xiv.pdfBytes,223339631);
  assert.equal(manifest.originalPdfsUnchanged,false);
  assert.equal(GUIDED_EDITIONS.xiv.revision,editorial.compatibilityRevision);
});
test('editorial receipt binds all 12 revised pages and the complete master',()=>{
  const {data,receipt}=mixedSourceFixture(); const specs=editorialAssetSpecs(data,receipt);
  assert.equal(specs.length,13);
  assert.deepEqual(specs.filter(x=>x.kind==='image').map(x=>x.page),EDITORIAL_PAGES);
  assert.equal(new Set(specs.map(x=>x.url)).size,13);
  assert.equal(specs.at(-1).kind,'pdf'); assert.equal(specs.at(-1).sha256,hashes.xiv);
  assert.equal(specs.at(-1).bytes,223339631);
  for(const alter of [r=>r.sourceMediaCommit='0'.repeat(40),r=>r.changedPages.pop(),r=>r.changedPages[1].page=2,r=>r.changedPages[0].path='techops-comic/volume-xiv/003.webp',r=>r.pdf.sha256=hashes.g]){
    const changed=structuredClone(receipt);alter(changed);assert.throws(()=>editorialAssetSpecs(data,changed));
  }
});
test('streamed publication readback rejects truncated, extra and corrupt asset bytes',async()=>{
  const content='RIGHT'; const spec={url:'https://example.invalid/test',bytes:5,sha256:createHash('sha256').update(content).digest('hex')};
  const ok=await verifyAsset(spec,{fetcher:async()=>new Response(content)});
  assert.equal(ok.result,'PASS');
  for(const value of ['RIGH','RIGHT!','WRONG']) await assert.rejects(verifyAsset(spec,{fetcher:async()=>new Response(value)}));
});

