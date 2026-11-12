import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function option(name) {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`${name} is required`);
  return process.argv[index + 1];
}

const source = path.resolve(option('--source'));
const portfolio = path.resolve(option('--portfolio'));
const output = path.resolve(option('--out'));
const commit = option('--commit');
if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('A full TechOps Hero commit SHA is required.');
if (fs.existsSync(output)) throw new Error(`Refusing to overwrite existing package: ${output}`);

const git = (cwd, args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();
const actual = git(source, ['rev-parse', 'HEAD']);
if (actual !== commit) throw new Error(`TechOps Hero revision mismatch: expected ${commit}, found ${actual}`);

const companion = fs.readFileSync(path.join(source, 'see_world_linked_native.mjs'), 'utf8');
if (!companion.includes("from './see-world/linked.mjs'")) {
  throw new Error('The pinned game does not use a local story contract; refusing an unverified path rewrite.');
}
for (const file of ['index.html', 'dogs.js', 'v732_hooks.js', 'campaign_act1.js', 'campaign_story.js']) {
  if (!fs.statSync(path.join(source, file), { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`Required TechOps Hero runtime file is missing: ${file}`);
  }
}

fs.mkdirSync(output, { recursive: true });
const archive = execFileSync('git', ['-C', source, 'archive', '--format=tar', commit], {
  maxBuffer: 512 * 1024 * 1024,
});
execFileSync('tar', ['-xf', '-', '-C', path.basename(output)], {
  cwd: path.dirname(output),
  input: archive,
  maxBuffer: 1024 * 1024,
});

// One reviewed story implementation owns both public URLs and the native import.
const storySource = path.join(portfolio, 'public', 'see-world');
const storyOutput = path.join(output, 'see-world');
fs.rmSync(storyOutput, { recursive: true, force: true });
fs.cpSync(storySource, storyOutput, { recursive: true });

function filesUnder(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory()
      ? filesUnder(path.join(directory, entry.name), relative)
      : [relative];
  });
}
const sha256 = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

// The pinned source contains one truncated, unreferenced legacy WebP (7,500
// actual bytes versus 54,208 declared). Active art uses KATRIN_MANCHEZ instead.
// Never exclude an asset that acquires a runtime reference in a future pin.
const retiredCorruptAsset = 'assets/v736/good_boys_ship/canonical_dogs.webp';
const corruptAssetReferences = filesUnder(output).filter(file =>
  /\.(?:html|css|js|mjs|json)$/.test(file) &&
  fs.readFileSync(path.join(output, file), 'utf8').includes('canonical_dogs.webp')
);
if (corruptAssetReferences.length) {
  throw new Error(`Legacy corrupt asset is still referenced: ${corruptAssetReferences.join(', ')}`);
}
fs.rmSync(path.join(output, retiredCorruptAsset), { force: true });

const storyHashes = {};
for (const file of filesUnder(storySource)) {
  const expected = sha256(path.join(storySource, file));
  const packaged = path.join(storyOutput, file);
  if (sha256(packaged) !== expected) throw new Error(`Packaged story byte mismatch: ${file}`);
  storyHashes[file] = expected;
}
for (const file of ['index.html', 'see_world_linked_native.mjs', 'v732_hooks.js', 'dogs.js']) {
  if (!fs.statSync(path.join(output, file), { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`Packaged game is incomplete: ${file}`);
  }
}

const receipt = {
  status: 'PACKAGED',
  nativeCommit: commit,
  portfolioCommit: git(portfolio, ['rev-parse', 'HEAD']),
  nativeRoute: '/techops-hero/',
  storyRoutes: ['/see-world/', '/techops-hero/see-world/'],
  excludedUnreferencedCorruptAssets: [retiredCorruptAsset],
  storySha256: storyHashes,
};
fs.writeFileSync(path.join(output, 'same-origin-deployment.json'), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ status: receipt.status, nativeCommit: commit, storyFiles: Object.keys(storyHashes).length }));
