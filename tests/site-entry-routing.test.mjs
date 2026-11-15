import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

// Exercise the actual pre-React entry script: a reload must respect an explicit
// portfolio destination while a bare custom-domain visit still opens Terminal.
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const entryScript = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
assert.ok(entryScript, 'entry routing script is present');

function redirect({ hostname = 'kterminal.site', pathname = '/', search = '', hash = '' } = {}) {
  let destination = null;
  const location = { hostname, pathname, search, hash, replace: value => { destination = value; } };
  runInNewContext(entryScript, { window: { location } });
  return destination;
}

test('bare custom-domain visits retain the Terminal default', () => {
  for (const hostname of ['kterminal.site', 'www.kterminal.site', 'KTERMINAL.SITE']) {
    for (const pathname of ['/', '/index.html']) {
      for (const hash of ['', '#']) {
        assert.equal(redirect({ hostname, pathname, hash }), `${pathname}#/terminal`);
      }
    }
  }
});

test('explicit portfolio, Contact, comic and world routes survive reload', () => {
  for (const hostname of ['kterminal.site', 'www.kterminal.site']) {
    for (const hash of ['#/', '#/#contact', '#/terminal', '#/comic?edition=g&page=88', '#/k/city', '#/see-world']) {
      assert.equal(redirect({ hostname, hash }), null, `${hostname}/${hash}`);
    }
  }
});

test('entry redirect preserves query parameters', () => {
  assert.equal(redirect({ search: '?source=link' }), '/?source=link#/terminal');
});

test('other hosts and static pages are not redirected', () => {
  for (const hostname of ['localhost', 'preview.example', 'ninja-ops-guy.github.io']) {
    assert.equal(redirect({ hostname }), null);
  }
  for (const pathname of ['/privacy.html', '/ads.txt', '/k-world/index.html']) {
    assert.equal(redirect({ pathname }), null);
  }
});
