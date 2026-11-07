import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {paintingAccess,crossesPainting,PAINTING,RETURN_POSE,sameVisit,ENDINGS} from '../public/k-world/ascended-access.mjs';
import {buildScene,isFree,findInteraction,moveCamera} from '../public/k-world/scenes.js';
import {WORLDS,zoneForWorld} from '../public/k-world/data.js';
import {createStore,U,expectedFrom} from '../public/see-world/linked-store.mjs';
import {newRun,choose} from '../public/see-world/engine.mjs';
import {CAMPAIGNS,nodeById} from '../public/see-world/campaigns.mjs';
import {allSource,grantAllSource,emptyEnvelope,fixture} from './ascended-k-fixture.mjs';

const assets={images:new Map([['cathedral',{naturalWidth:732,naturalHeight:732}]]),label:()=> 'label',ornament:()=> 'ornament',skyTexture:()=> 'sky',material:()=> 'material',floorTexture:()=> 'floor'};
const chamber=buildScene(assets,'ascended'),gallery=buildScene(assets,'gallery');
function paths(){const out=[],c=CAMPAIGNS.find(c=>c.id==='k');function walk(r){if(r.ended){out.push(r);return;}for(const ch of nodeById(c,r.node).choices){try{walk(choose(r,ch.id));}catch{}}}walk(newRun('k'));return out;}
function install(f,run){const s=U.readSource(f.st),e=emptyEnvelope(s);e.runs.k=run.history.map(step=>({...step,sourceSequence:s.sequence}));e.revision=1;f.st.setItem(U.KEYS.see+s.binding.playthroughId,JSON.stringify(e));return s;}

test('All legal K endings unlock after native return/anchor; gate is read-only',async()=>{
 const f=await allSource();await grantAllSource(f);const outcomes=new Set(),runs=paths();assert.equal(runs.length,187);
 for(const run of runs){install(f,run);const before=[...f.st.m.entries()];const a=paintingAccess(f.st);assert.equal(a.allowed,true,run.node);assert.ok(sameVisit(a,a.binding));assert.deepEqual([...f.st.m.entries()],before);outcomes.add(run.node);}
 assert.deepEqual([...outcomes].sort(),[...ENDINGS].sort());
});
test('Fresh native run, empty history, old preview and apparent completion cannot unlock',async()=>{
 const f=fixture();await f.init();assert.equal(paintingAccess(f.st).allowed,false);
 f.st.setItem('see-world:campaigns:v1',JSON.stringify({k:{ended:true,node:'record-end'}}));assert.equal(paintingAccess(f.st).allowed,false);
 const late=await allSource();await grantAllSource(late);install(late,{history:[]});assert.equal(paintingAccess(late.st).allowed,false);
 const s=U.readSource(late.st),e=JSON.parse(late.st.getItem(U.KEYS.see+s.binding.playthroughId));e.ended=true;e.unlocked=true;late.st.setItem(U.KEYS.see+s.binding.playthroughId,JSON.stringify(e));assert.equal(paintingAccess(late.st).allowed,false);
});
test('Preview context denies even a genuinely completed linked record; no writes',async()=>{
 const f=await allSource();await grantAllSource(f);install(f,paths()[0]);const before=[...f.st.m.entries()];assert.equal(paintingAccess(f.st,{preview:true}).allowed,false);assert.deepEqual([...f.st.m.entries()],before);
});
test('Malformed, wrong-run, unsupported and fabricated histories remain untouched and denied',async()=>{
 const f=await allSource();await grantAllSource(f);const s=install(f,paths()[0]),key=U.KEYS.see+s.binding.playthroughId,good=f.st.getItem(key);
 for(const transform of [()=>'{broken',e=>JSON.stringify({...e,schema:999}),e=>JSON.stringify({...e,binding:{...e.binding,playthroughId:'r_different000'}}),e=>JSON.stringify({...e,runs:{k:[{node:'shuttle',choice:'keep-log',sourceSequence:s.sequence}]}})]){
  const raw=transform(JSON.parse(good));f.st.setItem(key,raw);assert.equal(paintingAccess(f.st).allowed,false);assert.equal(f.st.getItem(key),raw);
 }
});
test('Native save drift or standalone mode revokes entry; old visit binding cannot follow a new run',async()=>{
 const f=await allSource();await grantAllSource(f);install(f,paths()[0]);const a=paintingAccess(f.st),key=U.KEYS.game,old=f.st.getItem(key),p=JSON.parse(old);
 p.extra=true;f.st.setItem(key,JSON.stringify(p));assert.equal(paintingAccess(f.st).allowed,false);
 f.st.setItem(key,old);p.meta._standaloneMode='gooddogs';f.st.setItem(key,JSON.stringify(p));assert.equal(paintingAccess(f.st).allowed,false);
 assert.equal(sameVisit(a,{...a.binding,playthroughId:'r_different000'}),false);
});
test('Missing native anchor cannot be bypassed by an otherwise completed K history',async()=>{
 const f=await allSource();const s=install(f,paths()[0]);assert.equal(s.milestones.returned,true);assert.equal(paintingAccess(f.st).allowed,false);
});
test('No storage access or unreadable source fails closed',()=>{
 assert.equal(paintingAccess({getItem(){throw Error('blocked');}}).allowed,false);
 assert.equal(paintingAccess({getItem(){return null;}}).allowed,false);
});
test('Painting crossing requires forward plane crossing within the aperture, not proximity',()=>{
 assert.equal(crossesPainting([4.4,1.7,-15.8],[4.4,1.7,-16.1]),true);
 for(const [a,b] of [[[4.4,1.7,-16.1],[4.4,1.7,-15.8]],[[0,1.7,-15.8],[0,1.7,-16.1]],[[4.4,1.7,-14],[4.4,1.7,-15]],[[4.4,9,-15],[4.4,9,-16]],[[NaN,1,-15],[4.4,1,-16]],[[1,2],[1,2,3]]])assert.equal(crossesPainting(a,b),false);
});
test('Scene is finite, spawn/return are safe, and the portal plane is physically reachable',()=>{
 assert(chamber.meshes.length>4);for(const m of chamber.meshes)assert(m.data.every(Number.isFinite));
 assert(isFree(chamber,...[chamber.spawn[0],chamber.spawn[2],.28,chamber.spawn[1]]));
 assert(isFree(gallery,RETURN_POSE.position[0],RETURN_POSE.position[2],.28,1.7));
 const c={position:[PAINTING.x,1.7,-15.5]};const before=[...c.position];moveCamera(gallery,c,0,-.65);assert(crossesPainting(before,c.position));
});
test('Both conversation and return painting are walk-reachable without climbing scenic stairs',()=>{
 const start=[0,9.5],todo=[start],seen=new Set(['0:9.5']);
 for(let i=0;i<todo.length;i++){const [x,z]=todo[i];for(const [dx,dz] of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){const nx=x+dx,nz=z+dz,k=nx+':'+nz;if(seen.has(k)||!isFree(chamber,nx,nz,.29,1.7))continue;seen.add(k);todo.push([nx,nz]);}}
 for(const item of chamber.interactions)assert(todo.some(([x,z])=>Math.hypot(x-item.position[0],z-item.position[2])<item.radius-.05),item.id);
 assert.equal(findInteraction(chamber,{position:[2.6,1.7,-3.4],yaw:0}).id,'ascended-k');
});
test('Chamber stays out of the atlas; gallery music authority remains unchanged',()=>{
 assert(!WORLDS.some(w=>w.id==='ascended'));assert.equal(zoneForWorld('ascended'),zoneForWorld('gallery'));
});
test('Pinned painting is excluded from look-away rotation and preview context reaches embedded world',()=>{
 const app=fs.readFileSync(new URL('../public/k-world/app.js',import.meta.url),'utf8');
 assert.match(app,/if\(slot==='cathedral'\)return/);assert.equal((app.match(/p.id!=='cathedral'/g)||[]).length,2);
 assert.match(app,/sameVisit\(portalAccess,visitBinding\)/);assert.match(app,/crossesPainting\(beforeMove,camera.position\)/);
 const see=fs.readFileSync(new URL('../public/see-world/app.mjs',import.meta.url),'utf8');assert.match(see,/preview\?'&preview=1'/);
});
