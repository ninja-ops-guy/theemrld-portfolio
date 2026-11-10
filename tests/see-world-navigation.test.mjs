import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const game='https://ninja-ops-guy.github.io/techops-hero/';
const html=readFileSync('public/techops-hero/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
test('game link targets the existing save origin',()=>{
 const media=readFileSync('src/pages/MediaLinks.tsx','utf8');
 assert.equal(media.split(`href="${game}"`).length-1,1);
 assert.equal(media.includes('href="/techops-hero/"'),false);
});
for(const [search,hash] of [['',''],['?mode=day','#continue'],['?next=https%3A%2F%2Fexample.com','#safe']]){
 test(`bookmark redirect preserves query/hash without touching storage: ${search}${hash}`,()=>{
  let target; const context={location:{search,hash,replace:u=>target=u}};
  Object.defineProperty(context,'localStorage',{get(){throw Error('Storage access forbidden');}});
  vm.runInNewContext(script,context);assert.equal(target,game+search+hash);
  assert.equal(new URL(target).origin,new URL(game).origin);
 });
}
test('smoke retains deployed reader byte checks and fails on wrong destinations',()=>{
 const smoke=readFileSync('scripts/see-world-public-smoke.py','utf8');
 assert.ok(smoke.includes("assert actual==expected"));
 assert.ok(smoke.includes("assert actual==digest"));
 assert.ok(smoke.includes("parsed.netloc not in ['ninja-ops-guy.github.io','kterminal.site']"));
 assert.ok(smoke.includes('assert game.url==GAME'));
 assert.ok(smoke.includes('Locked in this playthrough'));
 assert.ok(smoke.includes('assert not report[\'page_errors\']'));
});

test('native title preference exception never accepts save or progression keys',()=>{
 const allowed=keys=>keys.every(k=>k==='techops_settings');
 assert.equal(allowed([]),true);assert.equal(allowed(['techops_settings']),true);
 for(const key of ['techops_save','techops_save_bak','techops_day_checkpoint_v1','techops_hero_campaign_v1','techops:linked:native:v1','techops:linked:story:v1:synthetic:run','unknown'])assert.equal(allowed(['techops_settings',key]),false);
 const smoke=readFileSync('scripts/see-world-public-smoke.py','utf8');
 assert.equal(smoke.split("Object.keys(localStorage).every(k=>k==='techops_settings')").length-1,2);
});
