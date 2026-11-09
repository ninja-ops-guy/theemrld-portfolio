import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const component = fs.readFileSync(path.join(root, 'src/sections/KBandSprite.tsx'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/k-world/assets/manifest.json'), 'utf8'));

test('K Terminal band sprite points to a deployed sprite sheet', () => {
  const match = component.match(/backgroundImage:\s*`url\(\$\{import\.meta\.env\.BASE_URL\}([^)]*)\)`/);
  assert.ok(match, 'sprite must resolve from Vite base URL');
  const relativeUrl = match[1];
  const absoluteAsset = path.join(root, 'public', relativeUrl);
  assert.ok(fs.existsSync(absoluteAsset), `missing band sprite asset: ${relativeUrl}`);
  const band = manifest.find(item => item.id === 'k-band');
  assert.ok(band, 'K band must be registered in the asset manifest');
  assert.equal(relativeUrl, `k-world/assets/${band.file}`);
  assert.equal(band.width / 6, band.height / 4, '6x4 sprite cells must be square');
});
