import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(await readFile(path.join(root, 'docs/COMIC_VOLUME_XIV_RELEASE.json'), 'utf8'));
const entries = manifest.web_render?.pages;
if (!Array.isArray(entries) || entries.length !== 133) {
  throw new Error('Volume XIV: all 133 page assets and the complete hashed manifest must be uploaded before build');
}
const expectedWidth = manifest.web_render.width;
const expectedHeight = manifest.web_render.height;
const seen = new Set();
let totalBytes = 0;
for (const entry of entries) {
  if (!Number.isInteger(entry.page) || entry.page < 1 || entry.page > 133 || seen.has(entry.page)) throw new Error('Volume XIV: duplicate or invalid page index');
  seen.add(entry.page);
  const expectedPath = 'public/techops-comic/volume-xiv/' + String(entry.page).padStart(3, '0') + '.webp';
  if (entry.path !== expectedPath) throw new Error('Volume XIV: unexpected image path: ' + entry.path);
  const absolute = path.join(root, expectedPath);
  const bytes = await readFile(absolute);
  const size = (await stat(absolute)).size;
  if (size !== entry.bytes || createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new Error('Volume XIV: corrupt or unexpected image page ' + entry.page);
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') throw new Error('Volume XIV: invalid WebP format ' + entry.page);
  if (bytes.toString('ascii', 12, 16) !== 'VP8 ') throw new Error('Volume XIV: unsupported WebP frame format ' + entry.page);
  if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) throw new Error('Volume XIV: invalid WebP frame marker ' + entry.page);
  const width = bytes.readUInt16LE(26) & 0x3fff;
  const height = bytes.readUInt16LE(28) & 0x3fff;
  if (width !== expectedWidth || height !== expectedHeight) throw new Error('Volume XIV: invalid page dimensions ' + entry.page);
  totalBytes += size;
}
if (manifest.web_render.optimized_bytes && totalBytes !== manifest.web_render.optimized_bytes) throw new Error('Volume XIV: unexpected aggregate image bytes');
console.log('Volume XIV integrity PASS: 133 WebPs / ' + totalBytes + ' bytes / ' + expectedWidth + 'x' + expectedHeight);
