import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCurrentBookSources } from './finalize-comic-dist.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const EDITORIAL_PAGES = Object.freeze([2, 5, 33, 47, 54, 64, 90, 97, 109, 112, 117, 119]);

export function editorialAssetSpecs(manifest, receipt) {
  const sources = validateCurrentBookSources(manifest);
  const book = manifest.books.xiv;
  assert.equal(receipt.schemaVersion, 1, 'Unsupported XIV editorial receipt');
  assert.equal(receipt.edition, 'xiv');
  assert.equal(receipt.pageCount, 133);
  assert.equal(receipt.unchangedPageCount, 121);
  assert.equal(receipt.sourceMediaCommit, manifest.mediaCommit, 'Editorial base media commit differs');
  assert.equal(receipt.mediaCommit, sources.xiv.mediaCommit, 'Editorial image commit differs');
  assert.equal(receipt.releaseTag, sources.xiv.releaseTag, 'Editorial PDF release differs');
  assert.equal(receipt.contentRevision, book.contentRevision, 'Editorial content revision differs');
  assert.equal(receipt.compatibilityRevision, book.revision, 'Bookmark/soundtrack compatibility changed');
  assert.equal(receipt.pdf.filename, book.pdfFilename);
  assert.equal(receipt.pdf.bytes, book.pdfBytes);
  assert.equal(receipt.pdf.sha256, book.pdfSha256);
  assert.deepEqual(receipt.changedPages.map(item => item.page), EDITORIAL_PAGES, 'Expected exactly the 12 reviewed pages');
  const images = receipt.changedPages.map(item => {
    assert.equal(item.path, book.imagePath + String(item.page).padStart(3, '0') + '.webp', 'Wrong editorial page path');
    assert.equal(item.width, 2160);
    assert.equal(item.height, 3330);
    assert.ok(Number.isSafeInteger(item.bytes) && item.bytes > 0);
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
    assert.match(item.priorGitBlob, /^[a-f0-9]{40}$/);
    return { kind: 'image', page: item.page, url: book.imageBase + String(item.page).padStart(3, '0') + '.webp', bytes: item.bytes, sha256: item.sha256 };
  });
  return [...images, { kind: 'pdf', url: book.pdfUrl, bytes: book.pdfBytes, sha256: book.pdfSha256 }];
}

export async function verifyAsset(spec, { fetcher = fetch } = {}) {
  const response = await fetcher(spec.url, { signal: AbortSignal.timeout(240000) });
  if (!response.ok || !response.body) throw new Error(`Asset HTTP failure: ${spec.url} (${response.status})`);
  const hash = createHash('sha256');
  let bytes = 0;
  for await (const chunk of response.body) {
    bytes += chunk.byteLength;
    if (bytes > spec.bytes) throw new Error(`Asset exceeds expected size: ${spec.url}`);
    hash.update(chunk);
  }
  assert.equal(bytes, spec.bytes, `Asset size mismatch: ${spec.url}`);
  const sha256 = hash.digest('hex');
  assert.equal(sha256, spec.sha256, `Asset SHA-256 mismatch: ${spec.url}`);
  return { ...spec, bytes, sha256, result: 'PASS' };
}

export async function verifyEditorialRelease({ manifest, receipt, baseUrl = '', expectedCommit = '', fetcher = fetch }) {
  const specs = editorialAssetSpecs(manifest, receipt);
  if (baseUrl) {
    assert.match(expectedCommit, /^[a-f0-9]{40}$/, 'A live check needs the exact deployed commit');
    const url = new URL('techops-comic/publication.json', baseUrl.endsWith('/') ? baseUrl : baseUrl + '/');
    url.searchParams.set('verify', expectedCommit);
    const response = await fetcher(url.href, { signal: AbortSignal.timeout(60000) });
    assert.ok(response.ok, 'Live publication manifest is unavailable');
    const publication = await response.json();
    assert.equal(publication.sourceCommit, expectedCommit, 'Live publication is a different commit');
    assert.equal(publication.earlierEditionsPublic, false);
    const live = publication.books.find(book => book.id === 'xiv');
    assert.ok(live, 'Live XIV entry is missing');
    for (const key of ['pageCount', 'pdfUrl', 'pdfSha256', 'pdfBytes', 'imageBase', 'contentRevision', 'mediaCommit', 'releaseTag']) {
      assert.equal(live[key], manifest.books.xiv[key], `Live XIV ${key} differs`);
    }
  }
  const results = [];
  // Four small image transfers at a time; the complete PDF is streamed separately.
  for (let start = 0; start < 12; start += 4) {
    results.push(...await Promise.all(specs.slice(start, start + 4).map(spec => verifyAsset(spec, { fetcher }))));
  }
  results.push(await verifyAsset(specs[12], { fetcher }));
  return { result: 'PASS', checkedAt: new Date().toISOString(), sourceCommit: expectedCommit || null, baseUrl: baseUrl || null, contentRevision: receipt.contentRevision, mediaCommit: receipt.mediaCommit, releaseTag: receipt.releaseTag, imageCount: 12, fullPdfHashVerified: true, assets: results };
}

async function main() {
  const manifest = JSON.parse(await readFile(path.join(ROOT, 'src/data/comic-current-editions.json'), 'utf8'));
  const receipt = JSON.parse(await readFile(path.join(ROOT, 'docs/COMIC_XIV_EDITORIAL_RELEASE_20261110.json'), 'utf8'));
  const result = await verifyEditorialRelease({ manifest, receipt, baseUrl: process.env.COMIC_BASE_URL || '', expectedCommit: process.env.GITHUB_SHA || '' });
  if (process.env.COMIC_EDITORIAL_RECEIPT) {
    const target = path.resolve(process.env.COMIC_EDITORIAL_RECEIPT);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, JSON.stringify(result, null, 2) + '\n');
  }
  console.log(JSON.stringify(result, null, 2));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

