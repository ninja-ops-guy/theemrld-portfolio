import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { isRetiredComicAsset, retireEarlierComicAssets } from '../scripts/finalize-comic-dist.mjs';
const read = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8');

test('reader-facing labels contain only the three current books', async () => {
  const labels = JSON.parse(await read('src/data/comic-display-labels.json'));
  assert.deepEqual(Object.keys(labels), ['g', 'xiii-r', 'xiv']);
  assert.equal(labels.g.label, 'Full collection');
  assert.equal(labels.g.title, 'Volumes I–XII');
  assert.equal(labels['xiii-r'].label, 'Volume XIII');
  assert.equal(labels.xiv.label, 'Volume XIV');
});
test('reader removes earlier-edition links and production wording', async () => {
  const text = await read('src/pages/LatestComicReader.tsx');
  assert.ok(text.includes('comic-display-labels.json'));
  assert.ok(!/Earlier Revision|legacy readers|LATEST CORRECTED|REVISED NOVEMBER|edition=f/.test(text));
  assert.ok(text.includes('TechOps Hero · Full collection'));
  assert.ok(text.includes('aria-label="Choose book"'));
});
test('retirement precisely separates earlier assets from current and shared artwork', () => {
  for (const name of ['001.webp', 'revision-f/034.webp', 'volume-xiii/040.webp', 'volume-v/001.webp', 'volume-v/TechOps-Hero-Volume-5.pdf', 'TechOps-Hero-Revision-11.pdf', 'TechOps-Hero-Revision-11.1.pdf', 'TechOps-Hero-Revision-F-Complete.pdf', 'TechOps-Hero-Revision-F-Annotation-Update-315-Pages.pdf']) assert.equal(isRetiredComicAsset(name), true, name);
  for (const name of ['dock.webp', 'intro-panels-hq.webp', 'volume-I.webp', 'volume-v/cover.webp', 'revision-g/001.webp', 'volume-xiii-r/049.webp', 'volume-xiv/133.webp', 'volume-xiv/current.pdf', 'publication.json']) assert.equal(isRetiredComicAsset(name), false, name);
});
test('deployment cleanup removes actual old files and is idempotent', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'comic-final-'));
  try {
    const old = ['001.webp', 'revision-f/034.webp', 'volume-xiii/040.webp', 'volume-v/001.webp', 'TechOps-Hero-Revision-F-Complete.pdf'];
    const keep = ['dock.webp', 'intro-panels-hq.webp', 'revision-g/001.webp', 'volume-xiii-r/049.webp', 'volume-xiv/133.webp'];
    for (const item of [...old, ...keep]) { const file=path.join(root, 'techops-comic', item); await mkdir(path.dirname(file), {recursive:true}); await writeFile(file, 'fixture'); }
    const receipt = await retireEarlierComicAssets(root);
    assert.equal(receipt.length, old.length);
    for (const item of old) await assert.rejects(access(path.join(root, 'techops-comic', item)));
    for (const item of keep) await access(path.join(root, 'techops-comic', item));
    assert.deepEqual(await retireEarlierComicAssets(root), []);
  } finally { await rm(root, {recursive:true, force:true}); }
});
test('production Pages build always applies retirement before upload', async () => {
  const workflow = await read('.github/workflows/pages.yml');
  assert.ok(workflow.indexOf('node scripts/finalize-comic-dist.mjs') > workflow.indexOf('run: npm run build'));
  assert.ok(workflow.indexOf('node scripts/finalize-comic-dist.mjs') < workflow.indexOf('uses: actions/upload-pages-artifact@v3'));
});

test('Pages deployment accepts only verified 404/410 after bounded 503 retry', async () => {
  const workflow = await read('.github/workflows/pages.yml');
  assert.ok(workflow.includes('for attempt in 1 2 3; do'));
  assert.ok(workflow.includes('if [ "$code" = 404 ] || [ "$code" = 410 ]; then break; fi'));
  assert.ok(workflow.includes('if [ "$code" = 503 ] && [ "$attempt" -lt 3 ]; then'));
  assert.ok(workflow.includes('Retired asset not confirmed absent'));
  assert.ok(workflow.includes('exit 1'));
});
