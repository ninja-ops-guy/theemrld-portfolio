import './universe-core.js';
import {CAMPAIGN_IDS,campaignById,nodeById} from './campaigns.mjs';
import {REVISION,newRun,choose,replay} from './engine.mjs';
const U=globalThis.TechOpsUniverseCore;
export {U};
const missing=()=>({schema:2,rules:U.RULES,storyRevision:REVISION,revision:0,runs:{}});
function decode(raw,source){
 if(typeof raw!=='string'||raw.length>250000)throw Error('Invalid or oversized linked save.');
 const e=JSON.parse(raw);
 if(!U.object(e)||e.schema!==2||e.rules!==U.RULES||e.storyRevision!==REVISION||!U.same(e.binding,source.binding)||!Number.isSafeInteger(e.revision)||e.revision<0||!U.object(e.runs))throw Error('Incompatible or wrong-playthrough save. Standalone preview saves cannot grant linked progress.');
 const runs={};
 for(const [id,history] of Object.entries(e.runs)){
  if(!CAMPAIGN_IDS.includes(id)||!Array.isArray(history)||history.length>128)throw Error('Invalid campaign history.');
  let r=newRun(id);
  for(const step of history){
   if(!U.object(step)||!Number.isSafeInteger(step.sourceSequence)||step.sourceSequence<1||step.sourceSequence>source.sequence)throw Error('Invalid source checkpoint.');
   if(!U.gate(id,r.node,source).allowed)throw Error('This history exceeds the active native chronology.');
   r=choose(r,step.choice,step.node);
   if(!U.gate(id,r.node,source).allowed)throw Error('A saved scene is beyond the active native chronology.');
  }
  if(!U.gate(id,r.node,source).allowed)throw Error('This perspective is not available in the active run.');
  runs[id]=r;
 }
 return {envelope:e,runs};
}
export function createStore(storage=globalThis.localStorage,locks=globalThis.navigator?.locks){
 const source=()=>U.readSource(storage);
 function read(s=source()){
  if(!U.validateSource(s))throw Error(s.reason||'Native progression is unavailable.');
  const raw=storage.getItem(U.KEYS.see+s.binding.playthroughId);
  if(raw===null)return {envelope:{...missing(),binding:U.clone(s.binding)},runs:{},source:s};
  return {...decode(raw,s),source:s};
 }
 async function write(expected,action){
  if(!locks?.request)throw Error('This browser cannot safely coordinate linked saves. Use a browser with Web Locks support; progress has not changed.');
  if(!U.binding(expected.binding))throw Error('No linked playthrough selected.');
  return locks.request('see-world:'+expected.binding.playthroughId,{mode:'exclusive'},()=>{
   const s=source();if(!U.validateSource(s)||!U.same(s.binding,expected.binding))throw Error('The native playthrough changed. Reload before continuing.');
   const current=read(s);
   if(current.envelope.revision!==expected.revision)throw Error('Another tab advanced this playthrough. Refresh to continue from its saved decision.');
   const next=action(current,s);next.revision=current.envelope.revision+1;
   const text=JSON.stringify(next);decode(text,s); // Replay and gates, never caller-supplied completion booleans.
   const key=U.KEYS.see+s.binding.playthroughId;storage.setItem(key,text);
   if(storage.getItem(key)!==text)throw Error('Browser storage could not confirm the save.');
   return read();
  });
 }
 function begin(id,expected){return write(expected,(current,s)=>{if(!CAMPAIGN_IDS.includes(id)||!U.gate(id,U.ENTRIES[id],s).allowed)throw Error('This perspective is not available.');const e=U.clone(current.envelope);if(!e.runs[id])e.runs[id]=[];return e;});}
 function decide(id,choiceId,expectedNode,expected){return write(expected,(current,s)=>{
  const run=current.runs[id]||newRun(id),g=U.gate(id,run.node,s);if(!g.allowed)throw Error(g.reason);
  const next=choose(run,choiceId,expectedNode),to=U.gate(id,next.node,s);if(!to.allowed)throw Error(to.reason);
  const e=U.clone(current.envelope);e.runs[id]=[...(e.runs[id]||[]),{node:run.node,choice:choiceId,sourceSequence:s.sequence}];return e;
 });}
 function importSave(raw,expected){return write(expected,(current,s)=>{
  const incoming=decode(raw,s).envelope,e=U.clone(current.envelope);
  for(const id of CAMPAIGN_IDS){
   const a=e.runs[id]||[],b=incoming.runs[id]||[];
   for(let i=0;i<Math.min(a.length,b.length);i++)if(a[i].node!==b[i].node||a[i].choice!==b[i].choice)throw Error('Conflicting choices cannot replace the active linked branch. Use sandbox replay instead.');
   if(b.length>a.length)e.runs[id]=b;
  }
  return e;
 });}
 return {source,read,begin,decide,importSave,exportSave:()=>JSON.stringify(read().envelope,null,2),grants:()=>{const r=read();return U.grants(r.runs,r.source);}};
}
export function inspectLinkedSave(storage,source){
 const raw=storage.getItem(U.KEYS.see+source.binding.playthroughId);
 return raw===null?{runs:{},envelope:{...missing(),binding:source.binding}}:decode(raw,source);
}
export function expectedFrom(record){return {binding:record.envelope.binding,revision:record.envelope.revision};}
export const definitions={campaignById,nodeById,newRun,replay};
