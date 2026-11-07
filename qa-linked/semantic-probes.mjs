// Independent expectations against unchanged product sources. Revision 2 includes
// BOTH native Good Dogs authorities; the earlier semantic-only fixture was incomplete.
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import * as L from '../../portfolio/public/see-world/linked.mjs';
import {CAMPAIGNS,nodeById} from '../../portfolio/public/see-world/campaigns.mjs';
import {newRun,choose} from '../../portfolio/public/see-world/engine.mjs';
const require=createRequire(import.meta.url),C=require('../../techops-hero/campaign_act1.js'),T=require('../../techops-hero/campaign_story.js');
const identity={profileId:'local-primary',runId:'11111111-1111-4111-8111-111111111111'};const results=[];
function test(name,fn){try{const detail=fn();results.push({name,status:'PASS',detail});}catch(e){results.push({name,status:'FAIL',error:e.message,stack:e.stack});}}
function pair(last='act_6'){const c=C.createInitialState();c.seeWorldLink={...identity};for(const act of T.ACTS){if(act.id==='act_4')c.story.facts.trust_investigation_reported=true;T.completeAct(c,act.id);if(act.id===last)break;}return{c,p:{inDialog:true,meta:{seeWorldLink:{...identity},goodDogs:{},_v736:{m:1,k:false,waldo:false,done:false,campaignOrigin:'campaign'}},story:structuredClone(c.story)}};}
test('Complete Good Dogs persistence composition imports the return without a test-only act award',()=>{
 const {c,p}=pair();let profileRaw=JSON.stringify({meta:p.meta}),campaignRaw=JSON.stringify(c);
 const s={S:p,TechOpsStory:T,TechOpsCampaign:{load(){return JSON.parse(campaignRaw);},save(st){C.validate(st);campaignRaw=JSON.stringify(st);return true;}},console:{log(){},warn(){}},Date,setInterval:()=>1,clearInterval(){},setTimeout(){},save(){profileRaw=JSON.stringify({meta:this.S.meta});return true;}};s.globalThis=s;vm.createContext(s);
 vm.runInContext(fs.readFileSync(new URL('../../techops-hero/good_dogs_campaign_state.js',import.meta.url),'utf8'),s);
 for(let i=1;i<8;i++){s.S.meta._v736.m=i+1;if(i>=4)s.S.meta._v736.k=true;if(i>=6)s.S.meta._v736.waldo=true;s.TechOpsGoodDogsCampaignState.markTransition(i,i+1);}
 s.S.meta._v736.done=true;s.TechOpsGoodDogsCampaignState.completeReturn();assert.equal(s.__goodDogsMainCampaignBridge.canonicalImported,true);
 const before=L.makeSnapshot(profileRaw,campaignRaw);
 vm.runInContext(fs.readFileSync(new URL('../../techops-hero/chapters_vii_x.js',import.meta.url),'utf8'),s);
 s.TechOpsLateGameCampaign.syncGoodBoysFacts();
 const snapshot=L.makeSnapshot(profileRaw,campaignRaw);assert.equal(snapshot.milestones.returned,true);
 assert.equal(JSON.parse(campaignRaw).story.completedActs.filter(x=>x==='interlude').length,1);
 return{beforeLateImporter:before.milestones.returned,afterLateImporter:snapshot.milestones.returned,correction:'The initial reproduction omitted the late-game importer and left its required lower-runtime rescue flags false. It was not a valid complete-pipeline defect.'};
});
test('Malformed disposable snapshot sequence recovers from valid persisted native sources',()=>{
 const {c,p}=pair();const pr=JSON.stringify(p),cr=JSON.stringify(c),prior=L.makeSnapshot(pr,cr);prior.sequence='corrupt';p.day=2;
 const next=L.makeSnapshot(JSON.stringify(p),cr,prior);assert.ok(Number.isSafeInteger(next.sequence)&&next.sequence>0,'Snapshot sequence remains poisoned: '+next.sequence);
});
test('No cross-run or standalone source union',()=>{const {c,p}=pair();p.meta.seeWorldLink.runId='22222222-2222-4222-8222-222222222222';assert.throws(()=>L.makeSnapshot(JSON.stringify(p),JSON.stringify(c)));p.meta.seeWorldLink={...identity};p.meta._standaloneMode='gooddogs';assert.throws(()=>L.makeSnapshot(JSON.stringify(p),JSON.stringify(c)));});
test('Every completed path selects only its permitted branch return section',()=>{const {c,p}=pair('epilogue');c.seeWorldDisclosures={redArrestAccount:{version:1,audience:'player'}};const snap=L.makeSnapshot(JSON.stringify(p),JSON.stringify(c));let total=0,counts={};for(const campaign of CAMPAIGNS){let q=[newRun(campaign.id)],n=0;while(q.length){let r=q.pop();if(r.ended){n++;total++;L.legalReplay(campaign.id,r.history,snap);let earned=L.sections({...L.emptyProgress(snap),runs:{[campaign.id]:r.history}},snap).filter(s=>s.available);assert.equal(earned.length,1);assert.equal(earned[0].actor,campaign.id);if(campaign.id==='iona')assert.equal(earned[0].depot,r.flags.depot);continue;}for(const option of nodeById(campaign,r.node).choices){try{q.push(choose(r,option.id));}catch{}}}counts[campaign.id]=n;}assert.equal(total,1293);return{total,counts};});
test('Mutually exclusive Iona fates cannot be combined by one legal history',()=>{const {c,p}=pair('epilogue');c.seeWorldDisclosures={redArrestAccount:{version:1}};const snap=L.makeSnapshot(JSON.stringify(p),JSON.stringify(c));let found={};const q=[newRun('iona')];while(q.length&&Object.keys(found).length<3){const r=q.pop();if(r.ended){found[r.flags.depot]=r;continue;}for(const option of nodeById(CAMPAIGNS[0],r.node).choices){try{q.push(choose(r,option.id));}catch{}}}assert.equal(Object.keys(found).length,3);for(const a of Object.values(found))for(const b of Object.values(found)){if(a.flags.depot===b.flags.depot)continue;assert.throws(()=>L.legalReplay('iona',[...a.history,...b.history],snap));}});
test('Discovery and rescue flags alone do not open return endings',()=>{const {c,p}=pair();p.meta.goodDogs={cell_118_reached:true,k_seen:true,k_freed:true,waldo_freed:true,warden_null_defeated:true,crew_returned_to_earth:true};const snap=L.makeSnapshot(JSON.stringify(p),JSON.stringify(c));assert.equal(snap.milestones.kSeen,true);assert.equal(snap.milestones.ozFreed,true);assert.equal(L.gate('k','record-end',snap).allowed,false);});
console.log(JSON.stringify({runnerRevision:2,productHeads:{portfolio:'0a6f9bf6481f321b52d7a496da02cf62cc193820',native:'b8b2378f3cf0b84bfc94e1472b8e26d7043a7445'},results},null,2));process.exitCode=results.some(r=>r.status==='FAIL')?1:0;
