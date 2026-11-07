import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readLinked, linkedChoice, earnedSections, timeline } from '../public/see-world/linked.mjs';
import * as consumer from '../public/see-world/linked.mjs';

if (!process.argv[2]) throw new Error('Usage: node scripts/see-world-native-bridge.mjs /path/to/techops-hero');
const checkout = resolve(process.argv[2]);
const load = name => import(pathToFileURL(resolve(checkout, name)).href);
const { default: story } = await load('campaign_story.js');
const { default: campaign } = await load('campaign_act1.js');
const { default: act2 } = await load('campaign_act2.js');
const night = await load('see_world_night.mjs');
const native = globalThis.TechOpsLinkedProgression;
const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, raw) => storage.set(key, raw),
  removeItem: key => storage.delete(key)
};
globalThis.document = {};
const local = globalThis.localStorage;
const persistProfile = () => {
  const live = globalThis.S;
  const linked = native.requireCurrent(local, live, 'techops_save');
  live._linked = { ...linked, revision: linked.revision + 1 };
  local.setItem('techops_save', JSON.stringify(live));
  return native.publish(local);
};
globalThis.S = { _linked: native.begin(local), meta: {} };
const first = persistProfile();
assert.equal(first.sequence, 1);
assert.equal(timeline(readLinked(local)).every(entry => entry.state === 'undiscovered'), true);

const run = campaign.load(local);
for (const [ticket, owner] of [['shipping_cannot_print', 'mike'], ['plating_workstation_down', 'amit'], ['impossible_access_event', 'security']]) campaign.assignTicket(run, ticket, owner);
campaign.completeStandup(run);
campaign.completeWorkstation(run, { redInTheMirrorHeard: true, feliciaVideoSeen: true });
campaign.recordGhostEvidence(run, { id: 'badge_impossible_access', perspective: 'delegated_verified', discoveredBy: 'security' });
campaign.enterSector04(run);
campaign.insightAccessGuard(run);
campaign.severAccessController(run);
campaign.transitionToTuesday(run);
story.syncAct1State(run);
act2.beginGhostFrequency(run);
act2.recordBadgeClonerEvidence(run, { physicalArtifact: true, auditContradiction: true, perspective: 'delegated_verified' });
act2.firstDaylightFeliciaConversation(run, { approach: 'professional' });
act2.recordMorningstarTrace(run, { component: 'telemetry', source: 'trace_bay', verified: true });
act2.recordRooftopViolinEvidence(run, { signalObserved: true, corroborated: true });
campaign.save(run, local);
const stale = campaign.load(local);
act2.revealViolinist(run);
campaign.save(run, local);
assert.throws(() => campaign.save(stale, local), /stale/);
assert.equal(native.current(local).milestones.includes('duet_protocol_complete'), false);
assert.equal(timeline(readLinked(local)).find(entry => entry.id === 'felicia').state, 'available');

const locks = { request: async (key, save) => save() };
const beforeProfile = local.getItem('techops_save');
const beforeCampaign = local.getItem(campaign.SAVE_KEY);
await linkedChoice(local, locks, readLinked(local), 'felicia', 'capture-baseline', 'rooftop');
await linkedChoice(local, locks, readLinked(local), 'felicia', 'independent-clock', 'relay');
assert.deepEqual(earnedSections(readLinked(local)).map(grant => grant.id), ['felicia-signal']);
const inspect = state => night.inspect(state, local, async () => consumer);
const result = await inspect(globalThis.S);
assert.deepEqual(result.sections.map(section => [section.id, section.nativeReady, section.available]), [['felicia-signal', true, false]]);
assert.equal(local.getItem('techops_save'), beforeProfile);
assert.equal(local.getItem(campaign.SAVE_KEY), beforeCampaign);
assert.equal(await inspect({ ...globalThis.S, meta: { _standaloneMode: 'nightcrawler' } }), null);
assert.equal(await night.inspect(globalThis.S, local, async () => ({ ...consumer, RULES: 'old' })), null);
assert.equal(native.startDogs(globalThis.S, local), false);

// Advanced native act prerequisites and rescue transitions are fixtures here.
run.story.facts.trust_investigation_reported = true;
for (const id of ['act_4', 'act_5', 'act_6']) story.completeAct(run, id);
campaign.save(run, local);
globalThis.S.meta._v736 = { m: 1 };
assert.equal(native.startDogs(globalThis.S, local), true);
native.recordDogs(globalThis.S, ['waldo_freed', 'crew_returned_to_earth']);
assert.equal(persistProfile().milestones.includes('waldo_freed'), false);
native.recordDogs(globalThis.S, ['cell_118_known', 'cell_1984_known', 'cell_118_reached', 'k_seen', 'k_freed']);
const partial = persistProfile();
assert.equal(partial.milestones.includes('k_freed'), true);
assert.equal(partial.milestones.includes('waldo_freed'), false);
assert.equal(native.canImportDogs(globalThis.S, run), false);
native.recordDogs(globalThis.S, ['waldo_seen', 'waldo_freed', 'warden_null_active', 'warden_null_defeated', 'crew_returned_to_earth']);
const returned = persistProfile();
assert.equal(native.canImportDogs(globalThis.S, run), true);
assert.equal(returned.milestones.includes('crew_returned_to_earth'), true);
assert.equal(returned.milestones.includes('mike_meets_k'), false);

const saved = JSON.parse(local.getItem('techops_save'));
local.setItem('techops_save', JSON.stringify({ ...saved, _linked: { ...saved._linked, playthroughId: randomUUID() } }));
assert.equal(native.publish(local), null);
assert.equal(readLinked(local).snapshot, null);
local.setItem('techops_save', JSON.stringify({ meta: { _v736: { done: true, k: true, waldo: true } } }));
assert.equal(native.publish(local), null);
assert.equal(readLinked(local).snapshot, null);
const old = globalThis.S;
const next = native.begin(local);
assert.equal(next.profileId, old._linked.profileId);
assert.notEqual(next.playthroughId, old._linked.playthroughId);
assert.throws(() => native.requireCurrent(local, old, 'techops_save'), /different playthrough/);
const commit = directory => execFileSync('git', ['rev-parse', 'HEAD'], { cwd: directory, encoding: 'utf8' }).trim();
console.log(JSON.stringify({
  status: 'passed',
  native: commit(checkout),
  portfolio: commit(new URL('..', import.meta.url)),
  scope: 'Actual modules from both repositories with fixture storage and a simulated native profile writer. Campaign reducer/save, ordered publisher, linked replay and Night validation exercised together. No browser or mission completion.'
}, null, 2));
