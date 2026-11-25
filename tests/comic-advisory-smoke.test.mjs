import test from 'node:test';
import assert from 'node:assert/strict';
import {acknowledgeReaderAdvisory as run} from '../scripts/comic-advisory-smoke.mjs';
function fixture({warn=true, art=!warn, copy='Contains violence, mature language, and mature themes.'}={}) {
 let clicks=0;
 const image={waitFor:async()=>{if(!art) throw Error('no art')}, count:async()=>+art};
 const modal={waitFor:async({state})=>{if(warn!==(state==='visible'))throw Error('bad visibility')},isVisible:async()=>warn,innerText:async()=>copy,or:()=>({first:()=>({waitFor:async()=>{if(!warn&&!art)throw Error('nothing available')}})}),getByRole:()=>({click:async()=>{clicks++; warn=false; art=true;}})};
 return {page:{getByRole:()=>modal,locator:()=>image},clicks:()=>clicks};
}
test('fresh direct link confirms acknowledgment before art',async()=>{const f=fixture(); assert.equal(await run(f.page,'fresh'),true);assert.equal(f.clicks(),1);assert.equal(await run(f.page,'already-acknowledged'),false)});
test('legacy without advisory remains eligible',async()=>assert.equal(await run(fixture({warn:false}).page,'legacy'),false));
test('required advisory cannot be skipped',async()=>await assert.rejects(run(fixture({warn:false}).page,'fresh')));
test('image already exposed rejects',async()=>await assert.rejects(run(fixture({art:true}).page,'fresh'),/before advisory/));
test('wrong notice rejects',async()=>await assert.rejects(run(fixture({copy:'different'}).page,'fresh'),/Wrong parental/));
test('repeat alert rejects',async()=>await assert.rejects(run(fixture({art:true}).page,'already-acknowledged'),/repeated/));
