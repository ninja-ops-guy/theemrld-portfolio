// Native-API fixtures for tests only. Never imported by the application.
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

export {fixture,allSource,grantAllSource,emptyEnvelope};
