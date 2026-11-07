import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGNS, SCENES, campaignById, nodeById } from '../public/see-world/campaigns.mjs';
import { newRun, choose, availability, replay, encode, decode } from '../public/see-world/engine.mjs';
const allPaths = new Map();
for (const campaign of CAMPAIGNS) {
  test(`${campaign.id}: manifest integrity`, () => {
    const ids = new Set(campaign.nodes.map(n => n.id));
    assert.equal(ids.size, campaign.nodes.length);assert.ok(ids.has(campaign.start));
    for (const n of campaign.nodes) {
      assert.ok(SCENES.includes(n.scene));assert.ok(n.text.length);assert.ok(n.quote);
      assert.equal(new Set(n.choices.map(c=>c.id)).size,n.choices.length);
      assert.ok(n.ending ? n.choices.length===0 : n.choices.length>0);
      for (const c of n.choices) { assert.ok(ids.has(c.to),`${n.id}->${c.to}`);for(const key of Object.keys(c.effects||{}))assert.ok(Object.hasOwn(campaign.stats,key)); }
    }
  });
  test(`${campaign.id}: every legal route terminates; every scene and ending is reachable`, () => {
    const visited=new Set(),endings=new Set(),queue=[newRun(campaign.id)],finished=[];let count=0;
    while(queue.length){const run=queue.pop();count++;assert.ok(count<100000,'unbounded state graph');visited.add(run.node);assert.ok(run.history.length<70);
      const n=nodeById(campaign,run.node);
      if(run.ended){endings.add(run.node);finished.push(run);continue;}
      const allowed=n.choices.filter(c=>availability(run,c).allowed);assert.ok(allowed.length,`dead end ${run.node}`);
      for(const c of allowed)queue.push(choose(run,c.id));
    }
    assert.equal(visited.size,campaign.nodes.length);assert.equal(endings.size,campaign.nodes.filter(n=>n.ending).length);
    allPaths.set(campaign.id,finished);console.log(`${campaign.id}: ${count} states; ${finished.length} completed paths; ${endings.size} endings`);
  });
  test(`${campaign.id}: every completed route round-trips through validated event replay`, () => {
    for(const run of allPaths.get(campaign.id)){assert.deepEqual(replay(campaign.id,run.history),run);assert.deepEqual(decode(encode({[campaign.id]:run}))[campaign.id],run);}
  });
  test(`${campaign.id}: stale, missing, and post-ending decisions rejected`, () => {
    const start=newRun(campaign.id),first=nodeById(campaign,start.node).choices[0];
    assert.throws(()=>choose(start,'invalid'));assert.throws(()=>choose(start,first.id,'wrong-node'));
    const after=choose(start,first.id);assert.throws(()=>choose(after,first.id,start.node));
    assert.throws(()=>choose(allPaths.get(campaign.id)[0],first.id));
  });
}
test('Iona: every depot outcome requires independently established count, rescue and ledger',()=>{
  for(const run of allPaths.get('iona')){
    assert.equal(run.flags.allClear,true);assert.equal(run.flags.ledger,true);assert.equal(run.flags.rescue,true);assert.equal(run.flags.countWitness,true);
    const index=run.history.findIndex(x=>x.node==='fate');assert.ok(index>0);
    const before=replay('iona',run.history.slice(0,index));
    const option=nodeById(campaignById('iona'),'fate').choices.find(c=>c.id===run.history[index].choice);
    for(const flag of ['allClear','ledger','rescue'])assert.equal(availability({...before,flags:{...before.flags,[flag]:false}},option).allowed,false);
  }
});
test('Iona: all flight/power/depot combinations terminate and retain North Intake as a lead',()=>{
  const combinations=new Set(allPaths.get('iona').map(r=>[r.flags.flight,r.flags.power,r.flags.depot].join('/')));assert.equal(combinations.size,12);
  for(const r of allPaths.get('iona')){assert.equal(r.flags.northIntake,true);if(r.flags.power==='corridor')assert.equal(r.flags.liftRescued,true);if(r.flags.flight==='intercept')assert.equal(r.flags.pilotHelp,true);}
});
test('Felicia: joint briefing is gated by evidence, shared records and independent control',()=>{
  for(const r of allPaths.get('felicia').filter(r=>r.node==='joint-end')){assert.ok(r.stats.evidence>=5);assert.ok(r.stats.trust>=3);assert.equal(r.flags.shared,true);assert.equal(r.flags.independentStop,true);}
});
test('K and Waldo: every ending preserves release and rescue order',()=>{
  for(const id of ['k','waldo'])for(const r of allPaths.get(id)){assert.equal(r.flags.kFreed,true);assert.equal(r.flags.ozFreed,true);}
  for(const r of allPaths.get('waldo')){assert.equal(r.flags.kFirst,true);assert.equal(r.flags.allAboard,true);}
});
test('Invalid, foreign, oversized, future-version and injected saves are rejected',()=>{
  for(const value of ['null','[]','{',JSON.stringify({schema:2,revision:'2026-11-07-a',runs:{}}),'x'.repeat(200001),JSON.stringify({schema:1,revision:'2026-11-07-a',runs:{unknown:[]}}),'{"schema":1,"revision":"2026-11-07-a","runs":{"__proto__":[]}}'])assert.throws(()=>decode(value));
  assert.throws(()=>decode(JSON.stringify({schema:1,revision:'2026-11-07-a',runs:{iona:[{node:'fate',choice:'burn'}]}})));
  assert.throws(()=>replay('iona',Array(129).fill({node:'rehearsal',choice:'hear-sister'})));
});
test('Runs are independent and encode only decisions, not trusted stat or unlock claims',()=>{
  const before=newRun('iona'),second=newRun('felicia'),after=choose(before,'hear-sister');assert.deepEqual(second,newRun('felicia'));assert.equal(before.history.length,0);
  const saved=JSON.parse(encode({iona:{...after,stats:{care:9999},flags:{allClear:true}}}));assert.ok(Array.isArray(saved.runs.iona));assert.equal(decode(JSON.stringify(saved)).iona.stats.care,2);assert.equal(decode(JSON.stringify(saved)).iona.flags.allClear,undefined);
});
