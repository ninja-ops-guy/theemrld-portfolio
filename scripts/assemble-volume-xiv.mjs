import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root = process.cwd();
const receipt = JSON.parse(await readFile(path.join(root, 'docs/COMIC_VOLUME_XIV_RELEASE.json'), 'utf8'));
const chunks = [];
for (let i = 0; i < receipt.parts.length; i++) {
  const file = receipt.parts[i];
  const part = await readFile(path.join(root, file));
  if (part.length !== receipt.part_sizes[i]) throw new Error('Volume XIV source part size mismatch: ' + file);
  chunks.push(part);
}
const pdf = Buffer.concat(chunks);
const hash = createHash('sha256').update(pdf).digest('hex');
if (pdf.length !== receipt.output_bytes || hash !== receipt.output_sha256) throw new Error('Volume XIV source PDF differs from corrected reviewed master');
const target = path.join(root, 'public', receipt.pdf_asset);
await mkdir(path.dirname(target), {recursive: true});
await writeFile(target, pdf);
console.log('Verified Volume XIV PDF', pdf.length, hash);
