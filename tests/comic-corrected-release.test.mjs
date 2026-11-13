import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUIDED_EDITIONS, emptyGuidedScore, resolveGuidedCue } from '../public/k-world/guided.js';
const manifest=JSON.parse(readFileSync(new URL('../src/data/comic-current-editions.json',import.meta.url)));
const hashes={g:'c18407af88e9ba6dbb5ed4707fc998bd19e12d31c59b2f92b87f58d8a0bfa50b','xiii-r':'d9a88cae0217cc0ece73955b96e187a93b0e33f0d0da092cea0588e14db2047d',xiv:'97f16edf9df072863bb7af69d7b52e0ffee77fef6ace7e64936facff5cdcbfae'};
test('corrected masters retain exact identities and counts',()=>{for(const [id,count] of Object.entries({g:316,'xiii-r':49,xiv:133})){const b=manifest.books[id];assert.equal(b.pageCount,count);if (b.publisherRelease) {
  assert.match(b.publisherRelease, /^[a-z0-9][a-z0-9-]{0,79}$/);
  const approved=JSON.parse(readFileSync(new URL(`../publishing/releases/${b.publisherRelease}.json`,import.meta.url)));
  assert.equal(approved.schema_version,2); assert.notEqual(approved.lifecycle,'retired');
  assert.equal(approved.edition,id); assert.equal(approved.page_count,count);
  assert.equal(b.pdfSha256,approved.pdf.sha256); assert.equal(b.pdfBytes,approved.pdf.bytes);
  assert.equal(b.pdfFilename,approved.pdf.filename); assert.equal(b.contentRevision,approved.content_revision);
  assert.equal(b.revision,approved.compatibility_revision); assert.equal(b.releaseTag,approved.source.tag);
  assert.ok(approved.corrections.length>0 && approved.corrections.every(c=>['included','not_applicable'].includes(c.status) && c.evidence));
} else assert.equal(b.pdfSha256,hashes[id]);assert.match(b.imageBase,new RegExp(`/[a-f0-9]{40}/techops-comic/`));assert.match(b.pdfUrl,/^https:\/\/github\.com\/ninja-ops-guy\/theemrld-portfolio\/releases\/download\//);}});
test('Volume XIII PDF download uses independently verified grandfather-corrected release',()=>{
  const book=manifest.books['xiii-r'];
  const published=JSON.parse(readFileSync(new URL('../public/techops-comic/current-editions.json',import.meta.url)));
  const original='techops-corrected-20261110-c18407af-97f16edf';
  const pdfTag='techops-xiii-grandfather-pdf-20261113';
  const name='TechOps-Hero-Volume-XIII-The-Last-Launch-Grandfather-Corrected.pdf';
  assert.equal(book.releaseTag,pdfTag);
  assert.equal(book.pdfFilename,name);
  assert.equal(book.pdfSha256,'d9a88cae0217cc0ece73955b96e187a93b0e33f0d0da092cea0588e14db2047d');
  assert.equal(book.pdfBytes,66806862);
  assert.equal(book.pdfUrl,'https://github.com/ninja-ops-guy/theemrld-portfolio/releases/download/'+pdfTag+'/'+name);
  assert.deepEqual(published.books['xiii-r'],book);
  assert.equal(book.pageCount,49);
  assert.equal(book.revision,'corrected-85c2fbd8c80b');
  assert.equal(manifest.books.g.pdfUrl.includes(original),true);
  assert.equal(manifest.books['xiii-r'].imageBase.includes('/aa8c132035a46e73fb47ee14e05e371909799d64/'),true);
});

test('every source page is covered once by ordered sections',()=>{for(const b of Object.values(manifest.books)){const pages=b.sections.flatMap(s=>Array.from({length:s.end-s.start+1},(_,i)=>s.start+i));assert.deepEqual(pages,Array.from({length:b.pageCount},(_,i)=>i+1));}});
test('contents links and bookmarks stay within each edition',()=>{for(const b of Object.values(manifest.books)){for(const s of b.scenes)assert.ok(s.page>=1&&s.page<=b.pageCount);for(const [page,links]of Object.entries(b.links)){assert.ok(Number(page)>=1&&Number(page)<=b.pageCount);for(const l of links){assert.ok(l.page>=1&&l.page<=b.pageCount);assert.ok(l.rect.every(v=>Number.isFinite(v)&&v>=-0.01&&v<=100.01));assert.ok(l.rect[2]>l.rect[0]&&l.rect[3]>l.rect[1]);}}}});
test('soundtrack registrations match corrected editions without remapping old cues',()=>{for(const [id,b]of Object.entries(manifest.books)){assert.equal(GUIDED_EDITIONS[id].revision,b.revision);assert.equal(GUIDED_EDITIONS[id].pageCount,b.pageCount);assert.equal(resolveGuidedCue(emptyGuidedScore(),{edition:id,page:1,revision:b.revision}),null);}assert.equal(GUIDED_EDITIONS.f.pageCount,316);assert.equal(GUIDED_EDITIONS.xiii.pageCount,40);});
test('retired routes redirect rather than expose superseded readers',()=>{const text=readFileSync(new URL('../src/pages/TechOpsComic.tsx',import.meta.url),'utf8');assert.ok(!text.includes('LegacyTechOpsComic'));assert.ok(text.includes('<Navigate replace'));assert.ok(text.includes("edition === 'xiii' ? 'xiii-r' : 'g'"));assert.ok(text.includes("params.get('from') === 'world'"));assert.ok(!text.includes('comic-revision-f.json'));});

