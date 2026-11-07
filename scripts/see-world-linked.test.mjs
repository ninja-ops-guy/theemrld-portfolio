import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { ACTIVE, SNAPSHOT, SOURCE, saveKey, nodeAccess, readLinked, linkedChoice, inspectImport, earnedSections, timeline } from '../public/see-world/linked.mjs';
import { encode, newRun, choose } from '../public/see-world/engine.mjs';
import { campaignById } from '../public/see-world/campaigns.mjs';

const FELICIA = ['act_3', 'violinist_revealed'];
const ORBITAL = ['act_6', 'duet_protocol_complete', 'orbital_signal_found'];
const PRISON = [...ORBITAL, 'cell_118_known', 'cell_118_reached', 'cell_1984_known', 'waldo_introduced'];
const locks = { request: async (key, write) => write() };
function setup(facts = []) {
  const data = new Map();
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const binding = { version: 1, profileId: randomUUID(), playthroughId: randomUUID() };
  const set = (milestones, sequence = 1, run = binding) => {
    const snapshot = { ...run, source: SOURCE, sequence, sourceRevision: { profile: sequence, campaign: sequence }, milestones };
    storage.setItem(ACTIVE, JSON.stringify({ ...run, sequence, sourceRevision: snapshot.sourceRevision }));
    storage.setItem(SNAPSHOT, JSON.stringify(snapshot));
    return snapshot;
  };
  set(facts);
  return { storage, set, binding };
}
function step(storage, id, option) {
  const expected = readLinked(storage);
  return linkedChoice(storage, locks, expected, id, option, expected.runs[id]?.node || campaignById(id).start);
}

test('fresh timeline reveals no character or reward; Felicia opens before Duet', () => {
  const { storage, set } = setup();
  assert.deepEqual(timeline(readLinked(storage)).map(entry => entry.state), Array(4).fill('undiscovered'));
  set(FELICIA, 2);
  assert.equal(nodeAccess(readLinked(storage).snapshot, 'felicia', 'rooftop'), true);
  assert.equal(nodeAccess(readLinked(storage).snapshot, 'k', 'cell'), false);
});

test('separate native prison beats gate discovery, both rescues, Warden and return', async () => {
  const { storage, set } = setup(PRISON);
  await step(storage, 'k', 'mark-wall');
  assert.equal(timeline(readLinked(storage)).find(entry => entry.id === 'k').title, 'Unidentified prisoner');
  await assert.rejects(step(storage, 'k', 'test-anchor'), /native story/);
  assert.equal(nodeAccess(readLinked(storage).snapshot, 'waldo', '1984'), false);
  let facts = [...PRISON, 'k_seen'];
  set(facts, 2);
  await step(storage, 'k', 'test-anchor');
  await step(storage, 'k', 'answer-plain');
  await assert.rejects(step(storage, 'k', 'give-space'), /native story/);
  assert.equal(nodeAccess(readLinked(storage).snapshot, 'waldo', 'freed'), false);
  facts = [...facts, 'k_freed', 'waldo_seen', 'waldo_freed', 'warden_null_active'];
  let snapshot = set(facts, 3);
  assert.match(timeline(readLinked(storage)).find(entry => entry.id === 'k').placement, /^Recollection/);
  assert.equal(nodeAccess(snapshot, 'waldo', 'freed'), true);
  assert.equal(nodeAccess(snapshot, 'k', 'shuttle'), false);
  snapshot = set([...facts, 'warden_null_defeated'], 4);
  assert.equal(nodeAccess(snapshot, 'k', 'shuttle'), true);
  assert.equal(nodeAccess(snapshot, 'k', 'quiet-end'), false);
  snapshot = set([...facts, 'warden_null_defeated', 'crew_returned_to_earth'], 5);
  assert.equal(nodeAccess(snapshot, 'k', 'quiet-end'), true);
});

test('reload derives checkpoint with the commit provenance and never creates native flags', async () => {
  const { storage, set } = setup(FELICIA);
  await step(storage, 'felicia', 'capture-baseline');
  await step(storage, 'felicia', 'independent-clock');
  set([...FELICIA, ...ORBITAL], 2);
  const linked = readLinked(storage);
  assert.equal(linked.runs.felicia.node, 'crossing');
  assert.deepEqual(earnedSections(linked).map(g => [g.id, g.sequence]), [['felicia-signal', 1]]);
  assert.equal(linked.snapshot.sequence, 2);
  assert.equal(storage.getItem('techops_save'), null);
});

test('active profile or run switch isolates decisions and rejects stale callbacks', async () => {
  const { storage, set, binding } = setup(FELICIA);
  const old = await step(storage, 'felicia', 'capture-baseline');
  set(FELICIA, 1, { ...binding, profileId: randomUUID(), playthroughId: randomUUID() });
  assert.deepEqual(readLinked(storage).runs, {});
  await assert.rejects(linkedChoice(storage, locks, old, 'felicia', 'independent-clock', 'relay'), /another tab/);
  assert.throws(() => inspectImport(storage, old.raw), /identity/);
  set(FELICIA, 1, binding);
  assert.equal(readLinked(storage).runs.felicia.node, 'relay');
});

test('stale source sequence, source contract and blocked writes fail closed', async () => {
  const { storage, set } = setup(FELICIA);
  set(FELICIA, 3);
  const linked = await step(storage, 'felicia', 'capture-baseline');
  set(FELICIA, 2);
  assert.throws(() => readLinked(storage), /source revision/);
  const snapshot = set(FELICIA, 3);
  storage.setItem(SNAPSHOT, JSON.stringify({ ...snapshot, sequence: 2 }));
  assert.equal(readLinked(storage).snapshot, null);
  storage.setItem(SNAPSHOT, JSON.stringify({ ...snapshot, source: 'old' }));
  assert.equal(readLinked(storage).snapshot, null);
  set(FELICIA, 3);
  const blocked = { ...storage, setItem: () => { throw new Error('quota'); } };
  await assert.rejects(step(blocked, 'felicia', 'independent-clock'), /quota/);
  assert.equal(storage.getItem(saveKey(snapshot)), linked.raw);
});

test('imports reject standalone, corrupt, future and fabricated decisions', async () => {
  const { storage } = setup(FELICIA);
  const original = await step(storage, 'felicia', 'capture-baseline');
  for (const raw of ['{bad', encode({ felicia: newRun('felicia') }),
    JSON.stringify({ ...JSON.parse(original.raw), sequence: 99 }),
    JSON.stringify({ ...JSON.parse(original.raw), histories: { felicia: [...original.runs.felicia.history, { node: 'relay', choice: 'independent-clock' }] } })]) {
    assert.throws(() => inspectImport(storage, raw));
  }
  assert.equal(inspectImport(storage, original.raw).raw, original.raw);
});

test('Iona needs arrest disclosure; concurrent and imported depot branches cannot replace the winner', async () => {
  const { storage, set } = setup(['mike_meets_k']);
  assert.equal(nodeAccess(readLinked(storage).snapshot, 'iona', 'rehearsal'), false);
  set(['red_arrest_disclosed'], 2);
  const path = ['check-record','delegate','intercept','send-help','corridor','rescue-lift',
    'sidestep','open-cells','recover-ledger','record-director','leave-recording','verify-count'];
  for (const choice of path) await step(storage, 'iona', choice);
  const tab = readLinked(storage);
  await step(storage, 'iona', 'burn');
  await assert.rejects(linkedChoice(storage, locks, tab, 'iona', 'take', 'fate'), /another tab/);
  const burned = await step(storage, 'iona', 'burn-family');
  assert.deepEqual(earnedSections(burned).map(grant => grant.id), ['iona-coordination', 'iona-ledger', 'iona-burn']);
  let alternate = newRun('iona');
  for (const choice of [...path, 'take', 'take-roster']) alternate = choose(alternate, choice);
  assert.throws(() => inspectImport(storage, JSON.stringify({
    ...JSON.parse(burned.raw), histories: { iona: alternate.history }
  })), /committed history/);
});
