import { CAMPAIGN_IDS, campaignById } from './campaigns.mjs';
import { REVISION, newRun, choose, availability } from './engine.mjs';

export const RULES = 'see-world/linked-1';
export const SOURCE = 'techops-hero/native-milestones/1';
export const ACTIVE = 'techops:linked:active:v1';
export const SNAPSHOT = 'techops:linked:snapshot:v1';
const PREFIX = 'see-world:linked:v1:';
const LIMIT = 200000;
const MAX_STEPS = 128;
const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const validId = value => typeof value === 'string' && UUID.test(value);
const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
const count = (n, min = 0) => Number.isSafeInteger(n) && n >= min;
const sameRun = (a, b) => validId(a?.profileId) && validId(a?.playthroughId) &&
  a.profileId === b?.profileId && a.playthroughId === b?.playthroughId;
export const saveKey = snapshot => PREFIX + snapshot.profileId + ':' + snapshot.playthroughId;
const has = (snapshot, ...facts) => !!snapshot && facts.every(fact => snapshot.milestones.includes(fact));

const K = {
  cell: 'cell_118_reached', sequence: 'cell_118_reached', return: 'cell_118_reached',
  vent: 'k_seen', dogs: 'k_seen', release: 'k_freed', alcove: 'waldo_freed',
  warden: 'warden_null_active', shuttle: 'warden_null_defeated',
  'record-end': 'crew_returned_to_earth', 'shared-end': 'crew_returned_to_earth', 'quiet-end': 'crew_returned_to_earth'
};
const PRISON_ORDER = ['cell_118_known', 'cell_118_reached', 'k_seen', 'k_freed',
  'waldo_seen', 'waldo_freed', 'warden_null_active', 'warden_null_defeated', 'crew_returned_to_earth'];
const WALDO = {
  '1984': 'k_seen', vent: 'k_seen', wait: 'k_freed', freed: 'waldo_freed',
  alcove: 'waldo_freed', route: 'waldo_freed', warden: 'warden_null_active',
  shuttle: 'warden_null_defeated', 'return-choice': 'crew_returned_to_earth',
  'shelter-end': 'crew_returned_to_earth', 'introduction-end': 'crew_returned_to_earth', 'record-end': 'crew_returned_to_earth'
};

export function readSnapshot(storage) {
  const active = JSON.parse(storage.getItem(ACTIVE));
  const snapshot = JSON.parse(storage.getItem(SNAPSHOT));
  if (active?.version !== 1 || active.disabled || snapshot?.version !== 1 ||
    snapshot.source !== SOURCE || !sameRun(active, snapshot) || !count(snapshot.sequence, 1) ||
    active.sequence !== snapshot.sequence || active.sourceRevision?.profile !== snapshot.sourceRevision?.profile ||
    active.sourceRevision?.campaign !== snapshot.sourceRevision?.campaign ||
    !count(snapshot.sourceRevision?.profile, 1) || !count(snapshot.sourceRevision?.campaign) ||
    !Array.isArray(snapshot.milestones) || snapshot.milestones.length > 100 ||
    snapshot.milestones.some(fact => typeof fact !== 'string') ||
    new Set(snapshot.milestones).size !== snapshot.milestones.length) return null;
  return snapshot;
}

export function nodeAccess(snapshot, id, node) {
  if (!campaignById(id)?.nodes.some(entry => entry.id === node)) return false;
  if (id === 'felicia') return has(snapshot, 'act_3', 'violinist_revealed');
  if (id === 'iona') return has(snapshot, 'red_arrest_disclosed');
  if (!has(snapshot, 'act_6', 'duet_protocol_complete', 'orbital_signal_found')) return false;
  const stage = PRISON_ORDER.indexOf((id === 'k' ? K : WALDO)[node]);
  if (stage < 0 || !has(snapshot, ...PRISON_ORDER.slice(0, stage + 1))) return false;
  return id === 'k' || has(snapshot, 'waldo_introduced', 'cell_1984_known');
}

function checkedRun(snapshot, id, history) {
  if (!Array.isArray(history) || history.length > MAX_STEPS) throw new Error('Invalid linked decision history.');
  let run = newRun(id);
  if (!nodeAccess(snapshot, id, run.node)) throw new Error('This chapter has not been revealed.');
  for (const step of history) {
    if (!object(step) || typeof step.node !== 'string' || typeof step.choice !== 'string')
      throw new Error('Malformed linked decision.');
    const next = choose(run, step.choice, step.node);
    if (!nodeAccess(snapshot, id, next.node)) throw new Error('This chapter requires more native story progress.');
    run = next;
  }
  return run;
}

function decodeLinked(raw, snapshot) {
  if (typeof raw !== 'string' || raw.length > LIMIT) throw new Error('Invalid linked save size.');
  const data = JSON.parse(raw);
  if (data?.version !== 1 || data.rules !== RULES || data.content !== REVISION || data.source !== SOURCE ||
    !sameRun(snapshot, data) || !count(data.revision, 1) || !count(data.sequence, 1) ||
    data.sequence > snapshot.sequence || !count(data.sourceRevision?.profile, 1) ||
    !count(data.sourceRevision?.campaign) || data.sourceRevision.profile > snapshot.sourceRevision.profile ||
    data.sourceRevision.campaign > snapshot.sourceRevision.campaign ||
    (data.sequence === snapshot.sequence && (data.sourceRevision.profile !== snapshot.sourceRevision.profile ||
      data.sourceRevision.campaign !== snapshot.sourceRevision.campaign)) || !object(data.histories))
    throw new Error('Linked save has an incompatible identity or source revision.');
  const runs = {};
  for (const [id, history] of Object.entries(data.histories)) {
    if (!CAMPAIGN_IDS.includes(id) || !Array.isArray(history) || !history.length) throw new Error('Invalid linked campaign.');
    runs[id] = checkedRun(snapshot, id, history);
  }
  return { revision: data.revision, anchor: { sequence: data.sequence, sourceRevision: data.sourceRevision }, runs };
}

export function readLinked(storage, snapshot = readSnapshot(storage)) {
  if (!snapshot) return { snapshot: null, raw: null, revision: 0, runs: {} };
  const raw = storage.getItem(saveKey(snapshot));
  return { snapshot, raw, ...(raw === null ? { revision: 0, runs: {} } : decodeLinked(raw, snapshot)) };
}

export function linkedChoice(storage, locks, expected, id, choice, node) {
  if (!locks || !expected.snapshot) throw new Error('Linked saving is unavailable in this browser.');
  const key = saveKey(expected.snapshot);
  return locks.request(key, () => {
    const fresh = readLinked(storage);
    if (!sameRun(fresh.snapshot, expected.snapshot) || fresh.snapshot.sequence !== expected.snapshot.sequence ||
      fresh.raw !== expected.raw) throw new Error('Progress changed in another tab. Review the current chapter.');
    const snapshot = fresh.snapshot;
    const run = fresh.runs[id] || checkedRun(snapshot, id, []);
    const next = choose(run, choice, node);
    if (!nodeAccess(snapshot, id, next.node)) throw new Error('This chapter requires more native story progress.');
    const runs = { ...fresh.runs, [id]: next };
    const histories = Object.fromEntries(Object.entries(runs).map(([id, run]) => [id, run.history]));
    const raw = JSON.stringify({ version: 1, rules: RULES, content: REVISION, source: SOURCE,
      profileId: snapshot.profileId, playthroughId: snapshot.playthroughId, sequence: snapshot.sequence,
      sourceRevision: snapshot.sourceRevision, revision: fresh.revision + 1, histories });
    storage.setItem(key, raw);
    if (storage.getItem(key) !== raw) throw new Error('Linked progress could not be saved.');
    return { snapshot, raw, runs, anchor: { sequence: snapshot.sequence, sourceRevision: snapshot.sourceRevision }, revision: fresh.revision + 1 };
  });
}

export function inspectImport(storage, raw) {
  const fresh = readLinked(storage);
  if (!fresh.snapshot) throw new Error('No active linked playthrough.');
  decodeLinked(raw, fresh.snapshot);
  // A portable file is not evidence of play. Only an already committed local
  // record can be reopened. This also prevents branch replacement or union.
  if (raw !== fresh.raw) throw new Error('This file differs from the active playthrough’s committed history.');
  return fresh;
}

export function earnedSections(state) {
  const { snapshot, runs, anchor } = state;
  if (!snapshot || !anchor) return [];
  const visited = (id, node) => runs[id]?.history.some(step => step.node === node);
  const grants = [];
  const add = (id, campaign, checkpoint) => grants.push({
    id, campaign, checkpoint, rules: RULES, content: REVISION, source: SOURCE,
    profileId: snapshot.profileId, playthroughId: snapshot.playthroughId,
    sourceRevision: anchor.sourceRevision, sequence: anchor.sequence, decisionRevision: state.revision
  });
  if (visited('felicia', 'relay')) add('felicia-signal', 'felicia', 'relay');
  if (visited('felicia', 'hangar')) add('felicia-preparation', 'felicia', 'hangar');
  if (has(snapshot, 'k_seen') && visited('k', 'sequence')) add('k-memory', 'k', 'sequence');
  if (runs.k?.ended) add('k-boundary', 'k', runs.k.node);
  if (visited('waldo', 'vent')) add('waldo-companion', 'waldo', 'vent');
  if (runs.waldo?.ended) add('waldo-recovery', 'waldo', runs.waldo.node);
  if (runs.iona?.flags.maraAssigned) add('iona-coordination', 'iona', 'mara');
  if (runs.iona?.flags.ledger) add('iona-ledger', 'iona', 'ledger');
  if (runs.iona?.ended) {
    const branch = { burned: 'iona-burn', workshop: 'iona-workshop', witnesses: 'iona-witness' }[runs.iona.flags.depot];
    if (branch) add(branch, 'iona', runs.iona.node);
  }
  return grants;
}

const ORDER = ['felicia', 'k', 'waldo', 'iona'];
const PLACEMENT = {
  felicia: 'Felicia’s viewpoint · After The Violinist reveal and before formal Duet.',
  k: 'Prisoner viewpoint · Detention after orbital discovery.',
  waldo: 'Waldo / Oz’s viewpoint · Parallel to Cell 118, then the second rescue and return.',
  iona: 'Iona’s viewpoint · Earlier interlude after the arrest and before voice-window contact.'
};
export function timeline(state) {
  const { snapshot, runs } = state;
  const grants = earnedSections(state);
  return ORDER.map((id, index) => {
    const campaign = campaignById(id), run = runs[id];
    if (!nodeAccess(snapshot, id, campaign.start)) return {
      id, title: 'Undiscovered story ' + (index + 1), placement: '', state: 'undiscovered',
      next: 'Continue the native story.', earned: []
    };
    const node = campaign.nodes.find(node => node.id === (run?.node || campaign.start));
    const progress = run || newRun(id);
    const waiting = !node.ending && node.choices.filter(choice => availability(progress, choice).allowed)
      .every(choice => !nodeAccess(snapshot, id, choice.to));
    const recollection = id === 'k' && has(snapshot, 'k_freed') &&
      PRISON_ORDER.indexOf(K[node.id]) < PRISON_ORDER.indexOf('k_freed');
    return { id, title: id === 'k' && !has(snapshot, 'k_seen') ? 'Unidentified prisoner' : campaign.title,
      placement: (recollection ? 'Recollection · ' : '') + PLACEMENT[id], chapter: node.title, state: run?.ended ? 'completed' : waiting ? 'locked' : run?.history.length ? 'in progress' : 'available',
      next: waiting ? 'Continue the native story to reveal the next chapter.' : '',
      earned: grants.filter(grant => grant.campaign === id) };
  });
}
