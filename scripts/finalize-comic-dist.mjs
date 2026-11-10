import { readdir, readFile, writeFile, rm, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
export function isRetiredComicAsset(relative) {
  const name = relative.replaceAll('\\', '/');
  return /^(revision-f|volume-xiii)\//.test(name)
    || /^volume-v\/(?:\d+\.webp|.*\.pdf)$/i.test(name)
    || /^\d+\.webp$/i.test(name)
    || (/\.pdf$/i.test(name) && !/^(revision-g|volume-xiii-r|volume-xiv)\//.test(name));
}
async function filesUnder(root, relative = '') {
  const output = [];
  for (const item of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const child = path.join(relative, item.name);
    if (item.isSymbolicLink()) throw new Error(`Unexpected symlink in publication: ${child}`);
    if (item.isDirectory()) output.push(...await filesUnder(root, child));
    else if (item.isFile()) output.push(child);
  }
  return output;
}
export async function retireEarlierComicAssets(distRoot) {
  const dist = path.resolve(distRoot);
  const comic = path.join(dist, 'techops-comic');
  if (!(await lstat(comic)).isDirectory()) throw new Error('Comic deployment directory is missing.');
  const removed = [];
  for (const file of await filesUnder(comic)) {
    if (!isRetiredComicAsset(file)) continue;
    const target = path.join(comic, file);
    const size = (await lstat(target)).size;
    await rm(target);
    removed.push({ path: `techops-comic/${file.replaceAll('\\', '/')}`, bytes: size });
  }
  for (const file of await filesUnder(comic)) {
    if (isRetiredComicAsset(file)) throw new Error(`Retired asset survived: ${file}`);
  }
  return removed;
}
export function validateBookPins(manifest, id) {
    const book = manifest.books[id];
    const mediaCommit = book.mediaCommit || manifest.mediaCommit;
    const releaseTag = book.releaseTag || manifest.releaseTag;
    if (!/^[a-f0-9]{40}$/.test(mediaCommit) || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,119}$/.test(releaseTag)) throw new Error(`Invalid media pin: ${id}`);
    if (book.pdfUrl !== `https://github.com/ninja-ops-guy/theemrld-portfolio/releases/download/${releaseTag}/${book.pdfFilename}`) throw new Error(`Unpinned PDF URL: ${id}`);
    if (book.imageBase !== `https://raw.githubusercontent.com/ninja-ops-guy/theemrld-portfolio/${mediaCommit}/${book.imagePath}`) throw new Error(`Unpinned image source: ${id}`);
    return { mediaCommit, releaseTag };
}
export function validateCatalogue(catalogue, manifest, labels) {
  if (catalogue.schemaVersion !== 1 || catalogue.publicationPolicy !== 'current-only' || !Array.isArray(catalogue.books) || !catalogue.books.length) throw new Error('Invalid publication catalogue');
  const ids = catalogue.books.map(b => b.id);
  if (new Set(ids).size !== ids.length || ids.some(id => !/^[a-z0-9][a-z0-9-]{0,79}$/.test(id))) throw new Error('Invalid catalogue IDs');
  for (const id of ['f', 'xiii', 'legacy']) if (ids.includes(id)) throw new Error('Retired edition cannot be registered');
  if (JSON.stringify([...ids].sort()) !== JSON.stringify(Object.keys(manifest.books).sort()) || JSON.stringify([...ids].sort()) !== JSON.stringify(Object.keys(labels).sort())) throw new Error('Catalogue, reader and labels differ');
  for (const {id, pageCount} of catalogue.books) {
    if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > 5000 || manifest.books[id].pageCount !== pageCount || !labels[id]?.label) throw new Error(`Invalid catalogue book: ${id}`);
  }
  if (manifest.imageCount !== catalogue.books.reduce((n,b) => n + b.pageCount, 0)) throw new Error('Catalogue image count differs');
  return Object.fromEntries(catalogue.books.map(b => [b.id, b.pageCount]));
}
export async function finalizePublication(distRoot = path.join(ROOT, 'dist')) {
  const manifest = JSON.parse(await readFile(path.join(ROOT, 'src/data/comic-current-editions.json'), 'utf8'));
  const labels = JSON.parse(await readFile(path.join(ROOT, 'src/data/comic-display-labels.json'), 'utf8'));
  const catalogue = JSON.parse(await readFile(path.join(ROOT, 'src/data/comic-publication-catalogue.json'), 'utf8'));
  const expected = validateCatalogue(catalogue, manifest, labels);
  for (const [id, count] of Object.entries(expected)) {
    const book = manifest.books[id];
    if (book?.pageCount !== count || !/^[a-f0-9]{64}$/.test(book.pdfSha256)) throw new Error(`Invalid current book: ${id}`);
    validateBookPins(manifest, id);
  }
  const removed = await retireEarlierComicAssets(distRoot);
  const publication = {
    schemaVersion: 1,
    publication: 'full-collection-20261110',
    sourceCommit: process.env.GITHUB_SHA || null,
    earlierEditionsPublic: false,
    imageCount: manifest.imageCount,
    books: Object.entries(expected).map(([id]) => ({ id, ...labels[id], pageCount: manifest.books[id].pageCount, pdfUrl: manifest.books[id].pdfUrl, pdfSha256: manifest.books[id].pdfSha256, pdfBytes: manifest.books[id].pdfBytes, mediaCommit: manifest.books[id].mediaCommit || manifest.mediaCommit, imageBase: manifest.books[id].imageBase, publisherRelease: manifest.books[id].publisherRelease || null, contentRevision: manifest.books[id].contentRevision || null })),
    removedAssetCount: removed.length,
    removedBytes: removed.reduce((sum, item) => sum + item.bytes, 0),
  };
  await writeFile(path.join(distRoot, 'techops-comic/publication.json'), JSON.stringify(publication, null, 2) + '\n');
  let deployedBytes = 0;
  for (const file of await filesUnder(distRoot)) deployedBytes += (await lstat(path.join(distRoot, file))).size;
  if (deployedBytes > 1000000000) throw new Error(`Deployment exceeds Pages budget: ${deployedBytes}`);
  console.log(JSON.stringify({ ...publication, deployedBytes, removed }, null, 2));
  return publication;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await finalizePublication();
