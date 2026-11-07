import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import * as L from '../public/see-world/linked.mjs';
import {newRun,choose} from '../public/see-world/engine.mjs';
import {campaignById,nodeById} from '../public/see-world/campaigns.mjs';
const require=createRequire(import.meta.url),native=path.resolve(process.env.TECHOPS_SOURCE||'../techops-hero');
const C=require(path.join(native,'campaign_act1.js')),T=require(path.join(native,'campaign_story.js'));
const id={profileId:'local-primary',runId:'aaaaaaaa-1111-4111-8111-111111111111'};
class Store{m=new Map();getItem(k){return this.m.get(k)??null;}setItem(k,v){this.m.set(k,String(v));}removeItem(k){this.m.delete(k);}}
function source(){const c=C.createInitialState();c.seeWorldLink=id;for(const a of T.ACTS){if(a.id==='act_4')c.story.facts.trust_investigation_reported=true;T.completeAct(c,a.id);if(a.id==='act_4')break;}return[JSON.stringify({meta:{seeWorldLink:id}}),JSON.stringify(c)];}
const sources=source();
function earned(){const s=L.makeSnapshot(...sources);let r=newRun('felicia');for(const c of ['capture-baseline','independent-clock','wait-sweep','bench-test','external-stop','share-packet'])r=choose(r,c);return{s,p:{...L.emptyProgress(s),sequence:6,runs:{felicia:r.history}}};}
const answers=[0,1,2].map(step=>({step,choice:0}));
for(const [label,edit]of [
 ['string sequence',s=>s.sequence='damaged'],['negative sequence',s=>s.sequence=-1],['fractional sequence',s=>s.sequence=1.5],
 ['counter overflow',s=>s.sequence=Number.MAX_SAFE_INTEGER],['wrong contract',s=>s.contract='future/99'],
 ['missing source',s=>delete s.source],['invalid milestones',s=>s.milestones={violinist:'yes'}],['invalid acts',s=>s.completedActs=['act_6']]
])test('snapshot rebuild: '+label,()=>{const prior=L.makeSnapshot(...sources);edit(prior);assert.equal(L.snapshotValid(prior),false);const next=L.makeSnapshot(...sources,prior);assert.equal(L.snapshotValid(next),true);assert.equal(next.sequence,1);assert.equal(next.milestones.alliance,true);});
test('healthy identical snapshot remains idempotent',()=>{const prior=L.makeSnapshot(...sources);assert.equal(L.makeSnapshot(...sources,prior),prior);});
test('valid-looking cache cannot supply invented story facts',()=>{const prior=L.makeSnapshot(...sources);prior.milestones.returned=true;const next=L.makeSnapshot(...sources,prior);assert.equal(next.milestones.returned,false);assert.equal(next.sequence,2);});
test('recovery copy is exact and failed recovery never alters original',()=>{const s=new Store(),raw='{damaged';s.setItem(L.NATIVE_KEY,raw);L.retainRecovery(s,L.NATIVE_KEY,raw);assert.equal(s.getItem(L.NATIVE_KEY+':recovery'),raw);s.setItem=()=>{throw Error('quota');};assert.throws(()=>L.retainRecovery(s,L.NATIVE_KEY,'bad2'),/quota/);assert.equal(s.getItem(L.NATIVE_KEY),raw);});
test('storage getter failure is caught inside context',()=>{const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('storage denied');}});try{assert.equal(L.context().ok,false);}finally{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;}});
test('v2 receipt binds exact section, run, history and rules revision',()=>{const {s,p}=earned(),r=L.makeNightReceipt('signal-check',answers,s,p);assert.equal(L.validNightReceipt(r,'signal-check',s,p),true);for(const override of [{sectionId:'memory-anchor'},{runId:'bbbbbbbb-1111-4111-8111-111111111111'},{revision:'future'},{sourceHistory:[]},{sourceSequence:7},{answers:[{step:0,choice:0}]}])assert.equal(L.validNightReceipt({...r,...override},'signal-check',s,p),false);});
test('valid legacy v1 receipt is retained but incomplete v1 is rejected',()=>{const {s,p}=earned(),v1={version:1,sourceSequence:6,answers,at:new Date().toISOString()};assert.equal(L.validNightReceipt(v1,'signal-check',s,p),true);for(const field of Object.keys(v1)){const invalid={...v1};delete invalid[field];assert.equal(L.validNightReceipt(invalid,'signal-check',s,p),false);}assert.equal(L.validNightReceipt({...v1,sourceSequence:-1},'signal-check',s,p),false);});
test('receipt answer order, count and evidence cannot be falsified',()=>{const {s,p}=earned(),r=L.makeNightReceipt('signal-check',answers,s,p);for(const bad of [[...answers,answers[0]],[answers[2],answers[1],answers[0]],answers.map(x=>({...x,choice:1})),answers.map(x=>({...x,step:String(x.step)}))])assert.equal(L.validNightReceipt({...r,answers:bad},'signal-check',s,p),false);});
test('invalid completion is filtered without erasing bytes or valid neighbors',()=>{const {s,p}=earned(),store=new Store();const receipt=L.makeNightReceipt('signal-check',answers,s,p),n={contract:L.CONTRACT,...id,sequence:2,completed:{'signal-check':receipt,'memory-anchor':{damaged:true}}},raw=JSON.stringify(n);store.setItem(L.nightKey(s),raw);const result=L.loadNight(store,s,p);assert.deepEqual(result.invalid,['memory-anchor']);assert.deepEqual(result.record.completed['signal-check'],receipt);assert.equal(store.getItem(L.nightKey(s)),raw);});
test('foreign-run and corrupt envelopes never count as completion',()=>{const {s,p}=earned(),store=new Store();for(const raw of ['null','{bad',JSON.stringify({contract:L.CONTRACT,...id,runId:'different',sequence:1,completed:{}})]){store.setItem(L.nightKey(s),raw);const loaded=L.loadNight(store,s,p);assert.deepEqual(loaded.record.completed,{});assert.deepEqual(loaded.invalid,['envelope']);assert.equal(store.getItem(L.nightKey(s)),raw);}});
test('completion requires an earned branch, not only three answers',()=>{const {s,p}=earned();assert.throws(()=>L.makeNightReceipt('low-quarter-burn',answers,s,p),/unearned/);assert.throws(()=>L.makeNightReceipt('signal-check',answers,s,{...p,runs:{}}),/unearned/);});

// Exercise the exact native core block in isolation. Browser tests also execute
// its real parser path and the legacy instance wrapper with the companion down.
const dogs=fs.readFileSync(path.join(native,'dogs.js'),'utf8');
const core=dogs.slice(dogs.indexOf('// Native persistence must not depend'),dogs.indexOf('// Install core ownership before'));
assert.ok(core.includes('TechOpsLinkedSaveCore'));
function nativeTab(shared=new Map()){
 const handlers={},events=[];
 class Storage{getItem(k){return shared.get(k)??null;}setItem(k,v){shared.set(k,String(v));}removeItem(k){shared.delete(k);}}
 const storage=new Storage();
 const root={Storage,localStorage:storage,crypto:{randomUUID},URLSearchParams,location:{search:''},S:null,
  document:{getElementById:key=>({addEventListener:(event,fn)=>{handlers[key+':'+event]=fn;}})},dispatchEvent:e=>events.push(e),CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail;}},newState:()=>({meta:{}})};
 root.window=root;root.globalThis=root;const ctx=vm.createContext(root);
 vm.runInContext(fs.readFileSync(path.join(native,'campaign_act1.js'),'utf8'),ctx);
 vm.runInContext(core,ctx);root.TechOpsLinkedSaveCore.install();
 return{root,storage,events,shared,click:id=>handlers[id+':click'](),start(){this.click('btn-start');root.S=root.newState();const c=root.TechOpsCampaign.reset(storage);root.TechOpsCampaign.save(c,storage);storage.setItem('techops_save',JSON.stringify(root.S));return root.S.meta.seeWorldLink;},resume(){this.click('btn-continue');root.S=JSON.parse(storage.getItem('techops_save'));}};
}
test('native New Game persists both primaries without a companion module',()=>{const n=nativeTab(),binding=n.start();assert.equal(n.root.TechOpsLinked,undefined);assert.equal(n.root.TechOpsLinkedSaveCore.selectedRun(),true);assert.deepEqual(JSON.parse(n.storage.getItem('techops_hero_campaign_v1')).seeWorldLink,JSON.parse(JSON.stringify(binding)));});
test('native Continue recovers ownership when companion import is absent',()=>{const a=nativeTab(),binding=a.start(),b=nativeTab(a.shared);b.resume();assert.equal(b.root.TechOpsLinkedSaveCore.selectedRun(),true);assert.equal(b.root.S.meta.seeWorldLink.runId,binding.runId);b.root.S.extra='saved offline';b.storage.setItem('techops_save',JSON.stringify(b.root.S));assert.equal(JSON.parse(b.storage.getItem('techops_save')).extra,'saved offline');});
test('stale native tab cannot overwrite either primary during companion outage',()=>{const a=nativeTab();a.start();const old=a.storage.getItem('techops_save'),oldCampaign=a.storage.getItem('techops_hero_campaign_v1');const b=nativeTab(a.shared);b.resume();assert.throws(()=>a.storage.setItem('techops_save',old),/Linked save refused/);assert.throws(()=>a.storage.setItem('techops_hero_campaign_v1',oldCampaign),/Linked save refused/);});
test('new native run replaces identity and rejects old-run persistence',()=>{const a=nativeTab(),old=a.start(),raw=a.storage.getItem('techops_save'),b=nativeTab(a.shared),next=b.start();assert.notEqual(old.runId,next.runId);assert.throws(()=>a.storage.setItem('techops_save',raw),/Linked save refused/);assert.equal(JSON.parse(b.storage.getItem('techops_save')).meta.seeWorldLink.runId,next.runId);});
test('unbound existing save is not silently converted by the core',()=>{const n=nativeTab();n.root.S={meta:{}};n.storage.setItem('techops_save',JSON.stringify(n.root.S));assert.equal(n.root.TechOpsLinkedSaveCore.selectedRun(),false);assert.equal(n.storage.getItem('techops:linked:active:v1'),null);});
