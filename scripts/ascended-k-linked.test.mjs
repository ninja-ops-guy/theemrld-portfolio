import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {paintingAccess,crossesPainting,PAINTING,RETURN_POSE,sameVisit,ENDINGS} from '../public/k-world/ascended-access.mjs';
import {buildScene,isFree,findInteraction,moveCamera} from '../public/k-world/scenes.js';
import {WORLDS,zoneForWorld} from '../public/k-world/data.js';
import * as L from '../public/see-world/linked.mjs';
import {newRun,choose} from '../public/see-world/engine.mjs';
import {CAMPAIGNS,nodeById} from '../public/see-world/campaigns.mjs';
import {createRequire} from 'node:module';import path from 'node:path';
const require=createRequire(import.meta.url),C=require(path.resolve(process.env.TECHOPS_SOURCE||'../techops-hero','campaign_act1.js')),Story=require(path.resolve(process.env.TECHOPS_SOURCE||'../techops-hero','campaign_story.js'));
const assets={images:new Map([['cathedral',{naturalWidth:732,naturalHeight:732}]]),label:()=> 'label',ornament:()=> 'ornament',skyTexture:()=> 'sky',material:()=> 'material',floorTexture:()=> 'floor'};
const chamber=buildScene(assets,'ascended'),gallery=buildScene(assets,'gallery');
function paths(){const out=[],c=CAMPAIGNS.find(c=>c.id==='k');function walk(r){if(r.ended){out.push(r);return;}for(const ch of nodeById(c,r.node).choices){try{walk(choose(r,ch.id));}catch{}}}walk(newRun('k'));return out;}
class Store{m=new Map;getItem(k){return this.m.get(k)??null;}setItem(k,v){this.m.set(k,String(v));}removeItem(k){this.m.delete(k);}}
function fixture(run=paths()[0],anchor=true){
 const st=new Store,id={profileId:'local-primary',runId:'11111111-1111-4111-8111-111111111111'},c=C.createInitialState();c.seeWorldLink=id;
 for(const a of Story.ACTS){if(a.id==='act_4')c.story.facts.trust_investigation_reported=true;Story.completeAct(c,a.id);if(a.id==='interlude')break;}
 st.setItem(L.PROFILE_KEY,JSON.stringify({meta:{seeWorldLink:id}}));st.setItem(L.CAMPAIGN_KEY,JSON.stringify(c));
 const s=L.makeSnapshot(st.getItem(L.PROFILE_KEY),st.getItem(L.CAMPAIGN_KEY));st.setItem(L.NATIVE_KEY,JSON.stringify(s));st.setItem(L.ACTIVE_KEY,JSON.stringify(id));
 const progress={...L.emptyProgress(s),sequence:1,runs:{k:run.history}};st.setItem(L.progressKey(s),JSON.stringify(progress));
 if(anchor){const receipt=L.makeNightReceipt('memory-anchor',[0,1,2].map(step=>({step,choice:0})),s,progress);st.setItem(L.nightKey(s),JSON.stringify({contract:L.CONTRACT,...id,sequence:1,completed:{'memory-anchor':receipt}}));}
 return {st,s,progress};
}
test('All 187 K paths and three endings unlock read-only with released native receipt',()=>{const outcomes=new Set;assert.equal(paths().length,187);for(const run of paths()){const {st}=fixture(run);const before=[...st.m];const a=paintingAccess(st);assert.equal(a.allowed,true,run.node);assert(sameVisit(a,a.binding));assert.deepEqual([...st.m],before);outcomes.add(run.node);}assert.deepEqual([...outcomes].sort(),[...ENDINGS].sort());});
test('Ending without native memory-anchor receipt stays locked',()=>{assert.equal(paintingAccess(fixture(paths()[0],false).st).allowed,false);});
test('Sandbox, old preview booleans, incomplete and malformed histories cannot grant entry',()=>{
 const {st,s}=fixture();assert.equal(paintingAccess(st,{preview:true}).allowed,false);
 for(const raw of ['{bad',JSON.stringify({...L.emptyProgress(s),runs:{}}),JSON.stringify({...L.emptyProgress(s),runs:{k:[{node:'shuttle',choice:'keep-log'}]}}),JSON.stringify({...L.emptyProgress(s),runId:'different-run'})]){
 st.setItem(L.progressKey(s),raw);st.setItem('see-world:campaigns:v1','{"k":{"ended":true}}');const before=[...st.m];assert.equal(paintingAccess(st).allowed,false);assert.deepEqual([...st.m],before);}
});
test('Forged, foreign, wrong-version and wrong-history memory receipts are rejected without writes',()=>{
 for(const mutate of [r=>({...r,runId:'foreign-run'}),r=>({...r,version:99}),r=>({...r,answers:[]}),r=>({...r,sourceHistory:[{node:'shuttle',choice:'keep-log'}]}),()=>true]){
 const {st,s}=fixture(),key=L.nightKey(s),n=JSON.parse(st.getItem(key));n.completed['memory-anchor']=mutate(n.completed['memory-anchor']);st.setItem(key,JSON.stringify(n));const before=[...st.m];assert.equal(paintingAccess(st).allowed,false);assert.deepEqual([...st.m],before);}
});
test('Native drift, standalone and new active runs revoke entry; old binding never follows',()=>{
 for(const kind of ['drift','standalone','reset']){const {st}=fixture(),a=paintingAccess(st);if(kind==='reset')st.setItem(L.ACTIVE_KEY,JSON.stringify({...a.binding,runId:'22222222-2222-4222-8222-222222222222'}));else {const p=JSON.parse(st.getItem(L.PROFILE_KEY));p.extra=true;if(kind==='standalone')p.meta._standaloneMode='gooddogs';st.setItem(L.PROFILE_KEY,JSON.stringify(p));}assert.equal(paintingAccess(st).allowed,false);assert.equal(sameVisit(a,{...a.binding,runId:'different-run'}),false);}
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
 const see=fs.readFileSync(new URL('../public/see-world/app.mjs',import.meta.url),'utf8');assert.match(see,/&preview=1/);
});
test('Browser review fixture is accepted by the released validators and remains read-only',()=>{
 const data=JSON.parse(fs.readFileSync(new URL('./ascended-review/fixture.json',import.meta.url),'utf8'));
 const st=new Store;for(const [k,v]of Object.entries(data))st.setItem(k,v);const before=[...st.m];
 assert.equal(L.context(st).ok,true);assert.equal(paintingAccess(st).allowed,true);assert.deepEqual([...st.m],before);
});
