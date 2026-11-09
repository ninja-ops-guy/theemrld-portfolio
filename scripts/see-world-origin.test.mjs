import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {GAME_URL,STORY_URL,gameUrl,isCustomHost,isNativeReader,portfolioUrl} from '../public/see-world/origin-routes.mjs';
const native=resolve(process.env.TECHOPS_SOURCE||'../native');
const read=p=>readFileSync(p,'utf8');
test('canonical game and reader preserve legacy save origin',()=>{
 assert.equal(new URL(GAME_URL).origin,new URL(STORY_URL).origin);
 assert.equal(new URL(STORY_URL).pathname,'/techops-hero/see-world/index.html');
 assert.equal(gameUrl('kterminal.site'),GAME_URL);
 assert.equal(gameUrl('ninja-ops-guy.github.io'),'/techops-hero/');
 assert.equal(gameUrl('localhost'),'/techops-hero/');
 assert.equal(isCustomHost('evil-kterminal.site'),false);
 assert.equal(isNativeReader('/techops-hero/see-world/index.html'),true);
 assert.equal(portfolioUrl('comic'),'https://kterminal.site/#/comic');
});
test('origin selection runs before storage owning app; no storage migration',()=>{
 const player=read('public/see-world/player.mjs'),routes=read('public/see-world/origin-routes.mjs');
 assert.ok(player.indexOf('await chooseSaveOrigin()')<player.indexOf("import('./linked-app.mjs')"));
 assert.match(routes,/link.target = '_top'/);
 assert.doesNotMatch(routes,/localStorage|sessionStorage|removeItem|setItem|\.clear\(/);
 assert.match(routes,/recover.onclick = resolve/);
});
test('native uses a local contract and top-level reader',()=>{
 const s=read(native+'/see_world_linked_native.mjs');
 assert.match(s,/from '\.\/see-world\/linked.mjs'/);
 assert.match(s,/a.href='\/techops-hero\/see-world\/index.html'/);
 assert.doesNotMatch(s,/theemrld-portfolio\/see-world/);
});
test('vendored reader matches candidate source and recorded hashes',()=>{
 const m=JSON.parse(read(native+'/see-world-manifest.json'));
 const files=readdirSync('public/see-world').sort();
 assert.deepEqual(Object.keys(m.files).sort(),files);
 for(const file of files){
  const source=readFileSync('public/see-world/'+file),copy=readFileSync(native+'/see-world/'+file);
  assert.deepEqual(copy,source,file);
  assert.equal(createHash('sha256').update(copy).digest('hex'),m.files[file],file);
 }
});
test('custom game shortcut has no storage operations',()=>{
 const s=read('public/techops-hero/index.html');
 assert.match(s,/location.replace\('https:\/\/ninja-ops-guy.github.io\/techops-hero\/'/);
 assert.doesNotMatch(s,/localStorage|setItem|removeItem/);
});
