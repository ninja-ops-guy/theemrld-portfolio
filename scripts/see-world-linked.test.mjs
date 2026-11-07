import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createStore,inspectLinkedSave,U,expectedFrom} from '../public/see-world/linked-store.mjs';
import {newRun,choose,encode} from '../public/see-world/engine.mjs';
import {CAMPAIGNS,nodeById} from '../public/see-world/campaigns.mjs';
const native=process.env.TECHOPS_SOURCE||new URL('../../techops/',import.meta.url).pathname;
function memory(){const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m};}
function locks(){const tails=new Map();return {request(name,options,cb){if(typeof options==='function')cb=options;const p=(tails.get(name)||Promise.resolve()).catch(()=>{}).then(cb);tails.set(name,p);return p;}};}
function fixture(){
 const st=memory(),q=locks(),root={console,localStorage:st,navigator:{locks:q},crypto:{randomUUID},URLSearchParams,location:{search:''},S:{day:1,meta:{}},setTimeout,clearTimeout,CustomEvent:class{},dispatchEvent(){}};
 root.window=root;root.globalThis=root;vm.createContext(root);
 for(const file of ['see-world/universe-core.js','universe-sections.js','universe-native.js','campaign_act1.js','campaign_story.js','campaign_act2.js'])vm.runInContext(readFileSync(join(native,file),'utf8'),root,{filename:file});
 const C=root.TechOpsCampaign,Story=root.TechOpsStory;
 function profile(){root.TechOpsUniverse.beforeProfile(root.S,st);root.S._saveRevision=(root.S._saveRevision||1000)+1;st.setItem(U.KEYS.game,JSON.stringify({_profileSchemaVersion:1,_saveRevision:root.S._saveRevision,meta:root.S.meta}));root.TechOpsUniverse.afterSave();}
 async function init(){const c=C.createInitialState();C.save(c,st);profile();await root.TechOpsUniverse.settled();return c;}
 async function advance(c,until){
  if(until){for(const id of U.ORDER){if(!(c.story?.completedActs||[]).includes(id)){if(id==='act_4')c.story.facts.trust_investigation_reported=true;Story.completeAct(c,id);}if(id===until)break;}C.save(c,st);}
  profile();await root.TechOpsUniverse.settled();return U.readSource(st);
 }
 return {root,st,q,C,Story,profile,init,advance};
}
async function allSource(){const f=fixture(),c=await f.init();await f.advance(c,'epilogue');c.universe.disclosures.iona_arrest='player-cutaway-v1';f.C.save(c,f.st);f.profile();await f.root.TechOpsUniverse.settled();return {...f,c};}
const emptyEnvelope=s=>({schema:2,rules:U.RULES,storyRevision:'2026-11-07-a',revision:0,binding:s.binding,runs:{}});
function completedPath(id){let r=newRun(id);while(!r.ended){const n=nodeById(CAMPAIGNS.find(c=>c.id===id),r.node);const ch=n.choices.find(c=>{try{choose(r,c.id);return true;}catch{return false;}});r=choose(r,ch.id);}return r;}
async function grantAllSource(f){
 const Q=f.root.TechOpsUniverseSections;
 for(const id of U.SECTION_IDS.filter(id=>!['iona_workshop','iona_witness'].includes(id))){let run=Q.replay(id,[]);while(!run.complete){const n=Q.definition(id).nodes.find(n=>n.id===run.node),ch=n.choices.find(c=>c.to!==n.id);run=Q.choose(id,run.history,ch.id).run;}f.c.universe.sections[id]={revision:Q.REVISION,binding:{schema:1,profileId:f.c.universe.profileId,playthroughId:f.c.universe.playthroughId},grant:{id,sourceSequence:1},history:run.history};}
 f.C.save(f.c,f.st);f.profile();await f.root.TechOpsUniverse.settled();
}
test('Fresh native run publishes no future character; source reads only matching native revisions',async()=>{
 const f=fixture(),c=await f.init(),s=U.readSource(f.st);assert.equal(s.status,'ready');for(const id of U.CAMPAIGNS)assert.equal(U.gate(id,U.ENTRIES[id],s).allowed,false);
 const changed=JSON.parse(f.st.getItem(U.KEYS.game));changed.meta.other=true;f.st.setItem(U.KEYS.game,JSON.stringify(changed));assert.equal(U.readSource(f.st).status,'stale');await f.root.TechOpsUniverse.publish();assert.equal(U.readSource(f.st).status,'ready');
 assert.ok(c.universe.playthroughId);assert.deepEqual(Object.keys(f.root.S.meta.universe).sort(),['playthroughId','profileId','schema']);
});
test('Felicia opens before Duet; reciprocal native completion gates the later See World scene',async()=>{
 const f=fixture(),c=await f.init();await f.advance(c,'act_3');const st=createStore(f.st,f.q);let r=await st.begin('felicia',expectedFrom(st.read()));
 assert.equal(r.source.milestones.duet,false);
 for(const ch of ['capture-baseline','independent-clock'])r=await st.decide('felicia',ch,r.runs.felicia.node,expectedFrom(r));
 assert.deepEqual(st.grants().map(g=>g.id),['felicia_signal']);
 await assert.rejects(st.decide('felicia','wait-sweep','crossing',expectedFrom(r)),/signal investigation/);
 const Q=f.root.TechOpsUniverseSections;let run=Q.replay('felicia_signal',[]);for(const ch of ['both','bounded','retest','file'])run=Q.choose('felicia_signal',run.history,ch).run;
 c.universe.sections.felicia_signal={revision:Q.REVISION,binding:r.source.binding,grant:{id:'felicia_signal',sourceSequence:r.source.sequence},history:run.history};f.C.save(c,f.st);f.profile();await f.root.TechOpsUniverse.settled();
 r=st.read();r=await st.decide('felicia','wait-sweep','crossing',expectedFrom(r));assert.equal(r.runs.felicia.node,'hangar');assert.equal(r.source.milestones.duet,false);
 assert.ok(!JSON.parse(f.st.getItem(U.KEYS.campaign)).story.facts.duet_protocol_complete);
});
test('K/Waldo disclosure and release stages are individually gated',async()=>{
 const f=fixture(),c=await f.init();let s=await f.advance(c,'act_6');assert.equal(U.gate('k','cell',s).allowed,false);assert.equal(U.gate('waldo','1984',s).allowed,false);
 f.root.S.meta.goodDogs={cell_1984_known:true};f.profile();await f.root.TechOpsUniverse.settled();s=U.readSource(f.st);assert.equal(U.gate('waldo','1984',s).allowed,false,'Waldo text cannot reveal K before discovery');
 f.root.S.meta.goodDogs={cell_1984_known:true,cell_118_reached:true,k_seen:true};f.profile();await f.root.TechOpsUniverse.settled();s=U.readSource(f.st);
 assert.equal(U.gate('k','cell',s).allowed,true);assert.equal(U.gate('k','release',s).allowed,false);assert.equal(U.gate('waldo','1984',s).allowed,true);assert.equal(U.gate('waldo','freed',s).allowed,false);
 f.root.S.meta.goodDogs.k_freed=true;f.profile();await f.root.TechOpsUniverse.settled();s=U.readSource(f.st);assert.equal(U.gate('k','release',s).allowed,true);assert.equal(U.gate('k','alcove',s).allowed,false);
 f.root.S.meta.goodDogs.waldo_freed=true;f.profile();await f.root.TechOpsUniverse.settled();s=U.readSource(f.st);assert.equal(U.gate('k','alcove',s).allowed,true);assert.equal(U.gate('k','shuttle',s).allowed,false);
});
test('Standalone profile cannot publish canonical rescue or overwrite the current source',async()=>{
 const f=fixture(),c=await f.init();await f.advance(c,'act_6');const before=f.st.getItem(U.KEYS.source);
 f.root.S.meta._standaloneMode='gooddogs';f.root.S.meta.goodDogs={k_seen:true,k_freed:true,waldo_freed:true,warden_null_defeated:true};await f.root.TechOpsUniverse.publish();assert.equal(f.st.getItem(U.KEYS.source),before);
 const p=JSON.parse(f.st.getItem(U.KEYS.game));p.meta._standaloneMode='gooddogs';f.st.setItem(U.KEYS.game,JSON.stringify(p));assert.equal(U.readSource(f.st).status,'unavailable');
});
test('Iona requires a player-viewpoint disclosure, not merely late-game percentages',async()=>{
 const f=fixture(),c=await f.init();let s=await f.advance(c,'epilogue');assert.equal(s.milestones.complete,true);assert.equal(U.gate('iona','rehearsal',s).allowed,false);
 c.universe.disclosures.iona_arrest='player-cutaway-v1';f.C.save(c,f.st);f.profile();await f.root.TechOpsUniverse.settled();s=U.readSource(f.st);assert.equal(U.gate('iona','rehearsal',s).allowed,true);assert.equal(c.story.facts.iona_arrest,undefined);
});
test('Cross-run imports, standalone previews, fabricated endings and competing-tab writes fail closed',async()=>{
 const f=await allSource();await grantAllSource(f);const st=createStore(f.st,f.q);let r=await st.begin('iona',expectedFrom(st.read()));const expected=expectedFrom(r);
 const result=await Promise.allSettled([st.decide('iona','hear-sister','rehearsal',expected),st.decide('iona','check-record','rehearsal',expected)]);assert.equal(result.filter(r=>r.status==='fulfilled').length,1);
 r=st.read();const e=JSON.parse(st.exportSave());e.binding.playthroughId='r_unrelated000000';await assert.rejects(st.importSave(JSON.stringify(e),expectedFrom(r)),/wrong-playthrough/);
 await assert.rejects(st.importSave(encode({iona:completedPath('iona')}),expectedFrom(r)),/Incompatible/);
 const corrupt=JSON.parse(st.exportSave());corrupt.runs.iona=[{node:'fate',choice:'burn',sourceSequence:r.source.sequence}];await assert.rejects(st.importSave(JSON.stringify(corrupt),expectedFrom(r)),/no longer available/);
});
test('Linked import preserves append-only branches and cannot roll back or union choices',async()=>{
 const f=await allSource();await grantAllSource(f);const st=createStore(f.st,f.q);let r=await st.begin('iona',expectedFrom(st.read()));const early=st.exportSave();
 r=await st.decide('iona','hear-sister','rehearsal',expectedFrom(r));const revision=r.envelope.revision;
 const conflict=JSON.parse(st.exportSave());conflict.runs.iona[0].choice='check-record';await assert.rejects(st.importSave(JSON.stringify(conflict),expectedFrom(r)),/Conflicting/);assert.equal(st.read().envelope.revision,revision);
 r=await st.importSave(early,expectedFrom(r));assert.equal(r.runs.iona.history.length,1);
});
test('Native New Game invalidates old source; an old run file can never grant the new run',async()=>{
 const f=await allSource();await grantAllSource(f);const st=createStore(f.st,f.q);let r=await st.begin('felicia',expectedFrom(st.read()));const old=st.exportSave(),id=r.source.binding.playthroughId;
 f.C.reset(f.st);f.st.removeItem(U.KEYS.game);f.root.S={day:1,meta:{}};assert.notEqual(U.readSource(f.st).status,'ready');const fresh=await f.init();assert.notEqual(fresh.universe.playthroughId,id);
 await assert.rejects(st.importSave(old,expectedFrom(st.read())),/wrong-playthrough/);
 assert.equal(st.grants().length,0);
});
test('Corrupt linked state is preserved; unsupported locks/storage do not create progress',async()=>{
 const f=await allSource();const st=createStore(f.st,f.q),s=st.source(),key=U.KEYS.see+s.binding.playthroughId;f.st.setItem(key,'{broken');assert.throws(()=>st.read());assert.equal(f.st.getItem(key),'{broken');
 f.st.removeItem(key);const noLocks=createStore(f.st,{});await assert.rejects(noLocks.begin('felicia',expectedFrom(noLocks.read())),/Web Locks/);assert.equal(f.st.getItem(key),null);
});
test('All seven native sections reject false conclusions and require real action histories',()=>{
 const f=fixture(),Q=f.root.TechOpsUniverseSections;assert.equal(Q.ids.length,7);
 for(const id of Q.ids){const d=Q.definition(id);let run=Q.replay(id,[]),count=0;assert.equal(run.complete,false);
  while(!run.complete){const n=d.nodes.find(n=>n.id===run.node);for(const wrong of n.choices.filter(c=>c.to===n.id)){const r=Q.choose(id,run.history,wrong.id);assert.ok(r.feedback);assert.equal(r.run.history.length,run.history.length);}const choice=n.choices.find(c=>c.to!==n.id);run=Q.choose(id,run.history,choice.id).run;count++;assert.ok(count<10);}
  assert.ok(count>=3);assert.throws(()=>Q.choose(id,run.history,'file'));
 }
});
test('Iona grants exactly one native branch and no ending choice writes native main acts',async()=>{
 const f=await allSource();await grantAllSource(f);const s=U.readSource(f.st),paths=[];
 const c=CAMPAIGNS.find(c=>c.id==='iona'),q=[newRun('iona')];while(q.length){const r=q.pop();if(r.ended){paths.push(r);continue;}for(const ch of nodeById(c,r.node).choices){try{q.push(choose(r,ch.id));}catch{}}}
 const mainBefore=f.st.getItem(U.KEYS.campaign);
 for(const r of paths){const grants=U.grants({iona:r},s);assert.equal(grants.length,1);assert.match(grants[0].id,/^iona_/);assert.ok(r.flags.allClear&&r.flags.ledger);}
 assert.equal(f.st.getItem(U.KEYS.campaign),mainBefore);
});
test('The graph is acyclic across native earned sections and See World chapter gates',()=>{
 // The only reverse edges enter after the checkpoint that earned the section.
 const edges=[['violinist','felicia.relay'],['felicia.relay','felicia_signal'],['felicia_signal','felicia.hangar'],['felicia.hangar','felicia.swarm'],['felicia.swarm','felicia_stop'],['returned','k_anchor'],['k.alcove','k_anchor'],['k_anchor','k.ending'],['returned','waldo_route'],['waldo.alcove','waldo_route'],['waldo_route','waldo.ending'],['ghostFork','iona.disclosure'],['iona.disclosure','iona.fate'],['iona.fate','iona.branch'],['iona.branch','iona.ending']];
 const visiting=new Set(),done=new Set();function visit(x){assert.ok(!visiting.has(x),'cycle at '+x);if(done.has(x))return;visiting.add(x);for(const [a,b]of edges)if(a===x)visit(b);visiting.delete(x);done.add(x);}for(const [x]of edges)visit(x);
});
