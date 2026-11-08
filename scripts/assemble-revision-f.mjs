import { createHash } from 'node:crypto';
import { readFile, writeFile, rm } from 'node:fs/promises';

// Reassemble the reviewed master without recompressing or changing the PDF.
// Each tracked part stays below GitHub's per-file limit.
const receipt = JSON.parse(await readFile(new URL('../docs/COMIC_CURRENT_RELEASE.json', import.meta.url), 'utf8'));
const parts = await Promise.all(receipt.parts.map(part => readFile(new URL(`../${part}`, import.meta.url))));
const master = Buffer.concat(parts);
if (master.length !== receipt.output_bytes || createHash('sha256').update(master).digest('hex') !== receipt.output_sha256) {
  throw new Error('Revision F PDF failed its integrity check');
}
await writeFile(new URL(`../public/${receipt.pdf_asset}`, import.meta.url), master);
// Remove only the obsolete generated download when rebuilding an existing checkout.
await rm(new URL('../public/techops-comic/TechOps-Hero-Revision-F-Final-Annotations-315-Pages.pdf', import.meta.url), { force: true });
