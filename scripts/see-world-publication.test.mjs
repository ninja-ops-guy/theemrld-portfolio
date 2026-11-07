import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import * as L from '../public/see-world/linked.mjs';
import {newRun,choose} from '../public/see-world/engine.mjs';
const require=createRequire(import.meta.url),native=path.resolve(process.env.TECHOPS_SOURCE||'../techops-hero');
const C=require(path.join(native,'campaign_act1.js')),T=require(path.join(native,'campaign_story.js'));
const id={profileId:'local-primary',runId:'aaaaaaaa-1111-4111-8111-111111111111'};
class Store{m=new Map();getItem(k){return this.m.get(k)??null;}setItem(k,v){this.m.set(k,String(v));}removeItem(k){this.m.delete(k);}}
const c=C.createInitialState();c.seeWorldLink=id;
for(const a of T.ACTS){if(a.id==='act_4')c.story.facts.trust_investigation_reported=true;T.completeAct(c,a.id);if(a.id==='act_4')break;}
const sources=[JSON.stringify({meta:{seeWorldLink:id}}),JSON.stringify(c)];

const serialLocks={request:(_key,_options,fn)=>fn()};
function sourceStore(){const st=new Store();st.setItem(L.PROFILE_KEY,sources[0]);st.setItem(L.CAMPAIGN_KEY,sources[1]);const snapshot=L.makeSnapshot(...sources);st.setItem(L.NATIVE_KEY,JSON.stringify(snapshot));st.setItem(L.ACTIVE_KEY,JSON.stringify(id));return{st,snapshot};}
test('queued choice waits outside the lock for same-run snapshot recovery',async()=>{const {st,snapshot}=sourceStore(),p=L.emptyProgress(snapshot),r=choose(newRun('felicia'),'capture-baseline');st.setItem(L.NATIVE_KEY,'{broken');const update=setTimeout(()=>st.setItem(L.NATIVE_KEY,JSON.stringify(L.makeSnapshot(...sources))),70);try{const result=await L.saveRuns(st,p,{felicia:r},snapshot,serialLocks);assert.equal(result.runs.felicia.length,1);assert.equal(result.sequence,1);}finally{clearTimeout(update);}});
test('queued choice cannot cross a New Game during snapshot recovery',async()=>{const {st,snapshot}=sourceStore(),p=L.emptyProgress(snapshot),r=choose(newRun('felicia'),'capture-baseline');st.setItem(L.NATIVE_KEY,'{broken');const update=setTimeout(()=>st.setItem(L.ACTIVE_KEY,JSON.stringify({...id,runId:'bbbbbbbb-1111-4111-8111-111111111111'})),30);try{await assert.rejects(L.saveRuns(st,p,{felicia:r},snapshot,serialLocks),/playthrough changed/);assert.equal(st.getItem(L.progressKey(snapshot)),null);}finally{clearTimeout(update);}});
test('queued choice cannot overwrite a competing valid choice after recovery',async()=>{const {st,snapshot}=sourceStore(),p=L.emptyProgress(snapshot),r=choose(newRun('felicia'),'capture-baseline');st.setItem(L.NATIVE_KEY,'{broken');const update=setTimeout(()=>{const other=choose(newRun('felicia'),'change-position');st.setItem(L.progressKey(snapshot),JSON.stringify({...p,sequence:1,runs:{felicia:other.history}}));st.setItem(L.NATIVE_KEY,JSON.stringify(L.makeSnapshot(...sources)));},30);try{await assert.rejects(L.saveRuns(st,p,{felicia:r},snapshot,serialLocks),/Another tab/);assert.equal(L.loadProgress(st,snapshot).runs.felicia[0].choice,'change-position');}finally{clearTimeout(update);}});
test('near-limit healthy sequence never creates an unreadable replacement',()=>{const prior=L.makeSnapshot(...sources);prior.sequence=Number.MAX_SAFE_INTEGER-1;const changed=JSON.stringify({...JSON.parse(sources[0]),extra:'saved'}),next=L.makeSnapshot(changed,sources[1],prior);assert.equal(L.snapshotValid(next),true);assert.equal(next.sequence,1);});
