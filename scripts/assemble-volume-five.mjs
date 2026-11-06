import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

// Keep the print master byte-identical while storing it in two upload-sized pieces.
const parts = await Promise.all([0, 1].map(index => readFile(new URL(
  `../print-source/volume-five.part${index}`, import.meta.url
))));
const master = Buffer.concat(parts);
if (createHash('sha256').update(master).digest('hex') !== 'ddf0b34747f7b57e47b47e8f887b2383513e5d5dc83c19473ee209d531bc82f8') {
  throw new Error('Volume V print PDF failed its integrity check');
}
await writeFile(new URL('../public/techops-comic/volume-v/TechOps-Hero-Volume-5.pdf', import.meta.url), master);
