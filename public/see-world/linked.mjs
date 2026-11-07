import { CAMPAIGNS, campaignById, nodeById } from './campaigns.mjs';
import { newRun, choose, replay, REVISION } from './engine.mjs';
export const CONTRACT = 'see-world-linked/1';
export const ACTIVE_KEY = 'techops:linked:active:v1';
export const NATIVE_KEY = 'techops:linked:native:v1';
export const PROFILE_KEY = 'techops_save';
export const CAMPAIGN_KEY = 'techops_hero_campaign_v1';
export const LOCK = 'techops-linked-write-v1';
export const IDS = CAMPAIGNS.map(c=>c.id);
const record = x=>!!x&&typeof x==='object'&&!Array.isArray(x);
export const same = (a,b)=>!!a&&!!b&&a.profileId===b.profileId&&a.runId===b.runId;
export const identityOK = x=>record(x)&&/^[a-zA-Z0-9-]{8,80}$/.test(x.runId)&&/^[a-zA-Z0-9-]{3,80}$/.test(x.profileId);
export function fingerprint(text) { let h=2166136261;for(let i=0;i<(text||'').length;i++)h=Math.imul(h^(text.charCodeAt(i)),16777619);return (h>>>0).toString(16)+':'+(text||'').length; }
export function parse(raw,max=2000000) { if(typeof raw!=='string'||raw.length>max)throw Error('Missing or oversized record.');const x=JSON.parse(raw);if(!record(x))throw Error('Invalid record.');return x; }
export function sourceIdentity(profile,campaign){const a=profile?.meta?.seeWorldLink,b=campaign?.seeWorldLink;if(!identityOK(a)||!same(a,b))throw Error('These native saves are not linked to the same playthrough.');if(profile.meta?._standaloneMode||profile.meta?._v736?.campaignOrigin==='standalone')throw Error('Standalone progress is not linked story progress.');return a;}
const ACTS=['prologue','act_1','act_2','act_3','act_4','act_5','act_6','interlude','act_7','act_8','act_9','epilogue'];
export function milestones(profile,campaign) {
  sourceIdentity(profile,campaign);
  const completed=campaign.story?.completedActs||[],facts=campaign.story?.facts||{},p=campaign.p1||{};
  if(!Array.isArray(completed)||new Set(completed).size!==completed.length||completed.some((id,i)=>id!==ACTS[i]))throw Error('Out-of-order native acts.');
  const act=id=>completed.includes(id),g=profile.meta?.goodDogs||{};
  const m={violinist:act('act_3')&&facts.violinist_revealed===true,alliance:act('act_4')&&facts.felicia_alliance===true,duet:act('act_6')&&facts.duet_protocol_complete===true&&facts.orbital_signal_found===true};
  const returned=act('interlude')&&['k_freed','waldo_freed','warden_null_defeated','crew_returned_to_earth'].every(x=>facts[x]===true);
  // Only independently named checkpoints, never inferred from a runtime mission number.
  m.kSeen=m.duet&&(returned||g.cell_118_reached===true&&g.k_seen===true);
  m.kFreed=m.kSeen&&(returned||g.k_freed===true);
  m.ozFreed=m.kFreed&&(returned||g.waldo_freed===true);
  m.warden=m.ozFreed&&(returned||g.warden_null_defeated===true);
  m.returned=m.warden&&returned;
  m.ghostFork=m.returned&&act('act_7')&&facts.mike_meets_k===true;
  // This is an explicit player-facing recap acknowledgement, not Mike learning Iona's history.
  m.ionaAccount=m.ghostFork&&campaign.seeWorldDisclosures?.redArrestAccount?.version===1;
  m.complete=act('epilogue')&&facts.campaign_complete===true;
  return m;
}
export function makeSnapshot(profileRaw,campaignRaw,previous=null) {
  const profile=parse(profileRaw),campaign=parse(campaignRaw),id=sourceIdentity(profile,campaign);
  const sig={profile:fingerprint(profileRaw),campaign:fingerprint(campaignRaw)};
  if(previous&&same(previous,id)&&previous.source?.profile===sig.profile&&previous.source?.campaign===sig.campaign)return previous;
  return {contract:CONTRACT,...id,sequence:same(previous,id)?previous.sequence+1:1,source:sig,milestones:milestones(profile,campaign),completedActs:campaign.story?.completedActs||[],updatedAt:new Date().toISOString()};
}
export function context(storage=localStorage) {
  try {const s=parse(storage.getItem(NATIVE_KEY),50000);if(s.contract!==CONTRACT||!identityOK(s)||!Number.isSafeInteger(s.sequence)||s.sequence<1)throw Error('Unsupported linked snapshot.');
    const active=storage.getItem(ACTIVE_KEY);if(active&&!same(parse(active,1000),s))throw Error('A new playthrough is active.');
    const pr=storage.getItem(PROFILE_KEY),cr=storage.getItem(CAMPAIGN_KEY);
    if(s.source.profile!==fingerprint(pr)||s.source.campaign!==fingerprint(cr))throw Error('Return to TechOps Hero to synchronize the latest native save.');
    const p=parse(pr),c=parse(cr);if(!same(s,sourceIdentity(p,c)))throw Error('The active playthrough changed.');
    const m=milestones(p,c);if(JSON.stringify(m)!==JSON.stringify(s.milestones))throw Error('Snapshot does not match native story milestones.');
    return {ok:true,snapshot:s};
  } catch(error){return{ok:false,error:error.message||'Open TechOps Hero and link a story run.'};}
}
const reasons={violinist:'Complete the next character reveal in TechOps Hero.',alliance:'Continue the main investigation and establish the partnership.',duet:'Continue the main campaign to the orbital investigation.',kSeen:'Reach and identify the prisoner in the main campaign.',kFreed:'Complete the first cell release in TechOps Hero.',ozFreed:'Complete the second cell release in TechOps Hero.',warden:'Finish the custody-barrier encounter in TechOps Hero.',returned:'Complete the return journey in TechOps Hero.',ghostFork:'Complete the post-return meeting in TechOps Hero.',ionaAccount:'Read the earlier-perspective account in TechOps Hero’s Linked Story journal.'};
export function requirement(id,node) {
 if(id==='felicia')return ['handoff','countertest','release','joint-end','evidence-end','repair-end'].includes(node)?'alliance':'violinist';
 if(id==='iona')return 'ionaAccount';
 if(id==='k') {if(node.endsWith('-end'))return'returned';if(node==='shuttle')return'warden';if(['alcove','warden'].includes(node))return'ozFreed';if(node==='release')return'kFreed';return'kSeen';}
 if(id==='waldo') {if(node.endsWith('-end')||node==='return-choice')return'returned';if(node==='shuttle')return'warden';if(['freed','alcove','route','warden'].includes(node))return'ozFreed';if(node==='wait')return'kFreed';return'kSeen';}
 throw Error('Unknown viewpoint.');
}
export function gate(id,node,snapshot){const r=requirement(id,node);return{allowed:snapshot?.milestones?.[r]===true,reason:reasons[r],milestone:r};}
export function legalReplay(id,history,snapshot){let r=newRun(id);if(!Array.isArray(history)||history.length>128)throw Error('Invalid story history.');for(const h of history){if(!gate(id,r.node,snapshot).allowed)throw Error('History crosses an undiscovered story checkpoint.');const n=choose(r,h.choice,h.node);if(!gate(id,n.node,snapshot).allowed)throw Error('History jumps past native completion.');r=n;}return r;}
export const progressKey=s=>'techops:linked:story:v1:'+s.profileId+':'+s.runId;
export function emptyProgress(s){return{contract:CONTRACT,revision:REVISION,profileId:s.profileId,runId:s.runId,sequence:0,runs:{}};}
export function loadProgress(storage,s) {
 const raw=storage.getItem(progressKey(s));if(raw===null)return emptyProgress(s);const p=parse(raw,200000);
 if(p.contract!==CONTRACT||p.revision!==REVISION||!same(p,s)||!Number.isSafeInteger(p.sequence)||p.sequence<0||!record(p.runs)||Object.keys(p.runs).some(id=>!IDS.includes(id)))throw Error('Incompatible linked save. Original bytes preserved.');
 for(const [id,h]of Object.entries(p.runs))legalReplay(id,h,s);return p;
}
export const runsFrom=(p,s)=>Object.fromEntries(Object.entries(p.runs).map(([id,h])=>[id,legalReplay(id,h,s)]));
export async function locked(fn,locks=globalThis.navigator?.locks){if(!locks?.request)throw Error('Safe linked saving requires Web Locks. This browser is read-only; use a supported browser.');return locks.request(LOCK,{mode:'exclusive'},fn);}
export async function saveRuns(storage,expected,nextRuns,snapshot,locks){return locked(()=>{
 const c=context(storage);if(!c.ok||!same(c.snapshot,snapshot))throw Error('Native playthrough changed. Reload the linked view.');
 const current=loadProgress(storage,c.snapshot);if(current.sequence!==expected.sequence)throw Error('Another tab advanced this run. Reload before choosing.');
 const histories={};for(const id of Object.keys(nextRuns)){if(!IDS.includes(id))throw Error('Unknown campaign.');const h=nextRuns[id].history;legalReplay(id,h,c.snapshot);const old=current.runs[id]||[];
 if(h.length<old.length||JSON.stringify(h.slice(0,old.length))!==JSON.stringify(old))throw Error('Linked choices are append-only. Alternate replay cannot replace this run.');histories[id]=h;}
 if(Object.keys(current.runs).some(id=>!Object.hasOwn(histories,id)))throw Error('A linked campaign cannot be erased by import.');
 const next={...current,sequence:current.sequence+1,runs:histories};const raw=JSON.stringify(next);storage.setItem(progressKey(c.snapshot),raw);if(storage.getItem(progressKey(c.snapshot))!==raw)throw Error('Linked save verification failed.');return next;
 },locks);}
export const SECTION_DEFS = [
 {id:'signal-check',actor:'felicia',title:'Signal / Independent Check',district:'industrial',requires:'alliance',checkpoint:'handoff',placement:'After the handoff; before or after Duet as a bounded retest.',steps:[['Observe the relay baseline','Record the quiet baseline','Interpret a response before measuring'],['Compare the source record','Preserve the disagreement','Discard the inconvenient comparison'],['Verify with a second operator','Let another operator enforce the stop','Accept the controller’s self-report']]},
 {id:'memory-anchor',actor:'k',title:'K / Physical Anchor',district:'home',requires:'returned',checkpoint:'alcove',placement:'After the orbital return; no origin revelation.',steps:[['Inspect the physical mark','Describe only what is visible','Treat familiarity as a verified memory'],['Separate feeling from evidence','Keep the origin uncertain','Declare the memory documentary proof'],['Choose the record’s boundary','Keep the account private by choice','Make disclosure the price of help']]},
 {id:'return-route',actor:'waldo',title:'Waldo / The Return Path',district:'home',requires:'returned',checkpoint:'alcove',placement:'After return; companionship is not an identity test.',steps:[['Check each companion','Listen to their different signals','Treat both dogs as one command'],['Verify the crossing','Account for every person and dog','Trust the status light alone'],['Leave a useful route record','Credit each participant and the limits','Describe one hero doing everything']]},
 {id:'low-quarter-burn',actor:'iona',title:'Low Quarter / After the Fire',district:'industrial',requires:'ionaAccount',depot:'burned',checkpoint:'fate',placement:'Earlier interlude continuation; selected Burn route only.',steps:[['Read the recovered custody entry','Preserve the address as a lead','Call the authorizer identified'],['Choose a rehearsal approach','Use the underground contact route','Assume public access is unchanged'],['Return a useful answer','Give the family the recorded address','Promise a rescue that has not happened']]},
 {id:'low-quarter-workshop',actor:'iona',title:'Low Quarter / Shared Workshop',district:'industrial',requires:'ionaAccount',depot:'workshop',checkpoint:'fate',placement:'Earlier interlude continuation; selected Take route only.',steps:[['Inspect the isolated archive','Keep stolen recordings private','Broadcast them as a trophy'],['Assign the defense shift','Share a bounded rota with the crew','Put every shift on Iona'],['Verify a handoff','Let the next person confirm their role','Treat possession as consent']]},
 {id:'low-quarter-witnesses',actor:'iona',title:'Low Quarter / On the Record',district:'industrial',requires:'ionaAccount',depot:'witnesses',checkpoint:'fate',placement:'Earlier interlude continuation; selected Witness route only.',steps:[['Prepare the evidence transfer','Keep the original ledger traceable','Replace it with an uncheckable summary'],['Accept independent review','Keep inconvenient facts in the account','Let Iona choose the only valid witnesses'],['Confirm the next public step','Record the hearing handoff','Declare the whole conspiracy solved']]}
];
export function sections(progress,snapshot){return SECTION_DEFS.map(d=>{let run=null;try{if(progress.runs[d.actor])run=legalReplay(d.actor,progress.runs[d.actor],snapshot);}catch{}const earned=!!run&&run.history.some(x=>x.node===d.checkpoint)&&(!d.depot||run.flags.depot===d.depot);return{...d,earned,available:earned&&snapshot.milestones[d.requires]===true};});}
export const nightKey=s=>'techops:linked:night:v1:'+s.profileId+':'+s.runId;
export function timeline(s,p){return CAMPAIGNS.map(c=>{const open=gate(c.id,c.start,s),run=p.runs[c.id]?legalReplay(c.id,p.runs[c.id],s):null;return{id:c.id,title:open.allowed?c.name+' — '+c.title:'Undiscovered perspective',state:!open.allowed?'Locked':run?.ended?'Completed':run?.history.length?'In progress':'Available',placement:open.allowed?(c.id==='iona'?'Earlier interlude: after Red’s arrest, before the voice-window contact.':c.chronology):'Continue the main story to reveal this perspective.',next:open.allowed&&run?gate(c.id,run.node,s).reason:open.reason};});}
