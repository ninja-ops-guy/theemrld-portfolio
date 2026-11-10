// Invoked by test_comic_synthetic_integration.py, never against a real service.
// GitHub REST responses are synthetic; commits, trees, refs, CAS and main push are real local Git.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import {
  atomicFastForwardWithGit, assertNoOtherRun, claimRequest, hash, publishOrResume,
  readState, recordQualified, saveState, validateRequest,
} from '../../scripts/publisher-control.mjs';

const root = process.argv[2];
assert.equal(root, process.env.SYNTHETIC_ROOT, 'Only the synthetic fixture can invoke this helper');
const bare = path.join(root, 'remote.git');
const mraw = readFileSync(path.join(root, 'manifest.json'));
const manifest = JSON.parse(mraw);
const staged = JSON.parse(readFileSync(path.join(root, 'receipt.json')));
const repo = { owner: 'ninja-ops-guy', repo: 'theemrld-portfolio' };
const git = (args, input = undefined, extraEnv = {}) => execFileSync(process.env.SYNTHETIC_REAL_GIT,
  ['--git-dir', bare, ...args], { input, encoding: 'utf8', env: { ...process.env, ...extraEnv },
    stdio: ['pipe', 'pipe', 'pipe'] }).trim();
const optionalGit = args => { try { return git(args); } catch { return null; } };
const ref = name => optionalGit(['rev-parse', '--verify', `refs/heads/${name}`]);
const blob = bytes => git(['hash-object', '-w', '--stdin'], bytes);
const error = (status, message) => Object.assign(new Error(message), { status });
let stateWrites = 0, mainUpdates = 0, dispatchCalls = 0, retryCalls = 0;
let runs = [], busy = [], dispatchRejected = true;
const checkpointHistory = [];

function checkpointBlob(branch, filename) {
  return optionalGit(['rev-parse', `refs/heads/${branch}:${filename}`]);
}
const github = { rest: {
  git: {
    getRef: async ({ ref: name }) => {
      const sha = optionalGit(['rev-parse', '--verify', `refs/${name}`]);
      if (!sha) throw error(404, 'Missing local ref');
      return { data: { object: { sha } } };
    },
    createTree: async ({ tree }) => ({ data: { sha: git(['mktree'], tree.map(entry =>
      `${entry.mode} ${entry.type} ${blob(entry.content)}\t${entry.path}\n`).join('')) } }),
    createCommit: async ({ tree, parents, message }) => ({ data: {
      sha: git(['commit-tree', tree, ...parents.flatMap(p => ['-p', p])], message + '\n'),
    } }),
    createRef: async ({ ref: name, sha }) => {
      if (optionalGit(['rev-parse', '--verify', name])) throw error(422, 'Ref already exists');
      git(['update-ref', name, sha, '0'.repeat(40)]); return { data: {} };
    },
    getCommit: async ({ commit_sha }) => ({ data: { tree: { sha: git(['rev-parse', `${commit_sha}^{tree}`]) } } }),
  },
  repos: {
    getBranch: async ({ branch }) => ({ data: { commit: { sha: ref(branch) } } }),
    getCombinedStatusForRef: async ({ ref: head }) => {
      assert.equal(head, staged.head); return { data: { statuses: [] } };
    },
    getContent: async ({ path: filename, ref: branch }) => {
      const sha = checkpointBlob(branch, filename);
      if (!sha) throw error(404, 'Missing local checkpoint');
      const bytes = git(['show', `${branch}:${filename}`]);
      return { data: { type: 'file', size: Buffer.byteLength(bytes), sha,
        content: Buffer.from(bytes).toString('base64') } };
    },
    createOrUpdateFileContents: async ({ path: filename, branch, content, sha, message }) => {
      const before = ref(branch), existing = checkpointBlob(branch, filename);
      if ((sha || null) !== existing) throw error(409, 'Stale checkpoint blob');
      const bytes = Buffer.from(content, 'base64').toString();
      const identity = blob(bytes);
      const indexEnv = { GIT_INDEX_FILE: path.join(root, 'state-index') };
      git(['read-tree', before], undefined, indexEnv);
      git(['update-index', '--add', '--cacheinfo', `100644,${identity},${filename}`], undefined, indexEnv);
      const tree = git(['write-tree'], undefined, indexEnv);
      const commit = git(['commit-tree', tree, '-p', before], message + '\n');
      git(['update-ref', `refs/heads/${branch}`, commit, before]);
      stateWrites++;
      checkpointHistory.push(JSON.parse(bytes).phase);
      return { data: { content: { sha: identity } } };
    },
  },
  pulls: {
    get: async () => {
      const main = ref('main'), head = ref(manifest.target.branch);
      const merged = main === head;
      return { data: { state: merged ? 'closed' : 'open', merged, merge_commit_sha: merged ? head : null,
        draft: false, node_id: 'synthetic-pr',
        head: { sha: head, ref: manifest.target.branch, repo: { full_name: manifest.repository } },
        base: { ref: 'main' } } };
    },
  },
  checks: { listForRef: async ({ ref: head }) => {
    assert.equal(head, staged.head); return [{ conclusion: 'success' }];
  } },
  actions: {
    listWorkflowRuns: async ({ workflow_id }) => ({ data: { workflow_runs:
      workflow_id === 'comic-publisher.yml' ? busy : runs } }),
    createWorkflowDispatch: async args => {
      dispatchCalls++;
      assert.deepEqual(args.inputs, { release_id: manifest.id, expected_sha: staged.head, manifest_sha256: hash(mraw) });
      assert.equal(ref('main'), staged.head);
      const recorded = JSON.parse(git(['show', `publisher-state:releases/${manifest.id}.json`]));
      assert.equal(recorded.phase, 'MERGED_DEPLOYMENT_REQUESTED');
      assert.equal(recorded.dispatch_intent.merge_sha, staged.head);
      if (dispatchRejected) throw error(403, 'Synthetic dispatch rejected before execution');
      runs = [{ id: 99, head_sha: staged.head, event: 'workflow_dispatch',
        display_title: `Comic deployment · ${manifest.id} · ${staged.head}`,
        status: 'completed', conclusion: 'failure', run_attempt: 1 }];
      return { data: {} };
    },
    reRunWorkflowFailedJobs: async ({ run_id }) => {
      assert.equal(run_id, 99); retryCalls++;
      const recorded = JSON.parse(git(['show', `publisher-state:releases/${manifest.id}.json`]));
      assert.equal(recorded.phase, 'DEPLOYMENT_RETRY_REQUESTED');
      assert.equal(recorded.retry_intent.run_id, run_id);
      // Deliberately leave the failed run listing stale, as a real API can do.
      return { data: {} };
    },
  },
}, paginate: async (fn, args) => fn(args) };

const base = ref('main'), head = staged.head, tree = git(['rev-parse', `${head}^{tree}`]);
const publish = validateRequest({ release_id: manifest.id, action: 'publish', request_id: 'synthetic-publish',
  expected_head: head, manifest_sha256: hash(mraw) }, manifest, mraw, repo.owner, repo.owner);
let record = claimRequest(await readState(github, repo, manifest.id), publish, manifest, 10);
await saveState(github, repo, record, base);
await recordQualified(github, repo, record, { head, base, tree, runId: 10, reviewedHead: base });
record = await readState(github, repo, manifest.id);
assert.equal(record.value.phase, 'QUALIFIED_NOT_PUBLISHED');
assert.equal(record.value.qualification.tree, tree);
const staleRecord = structuredClone(record);
await saveState(github, repo, record, base);
// Exact same bytes preserve a blob SHA. Change phase to exercise real blob CAS rejection.
record.value.phase = 'QUALIFIED_CHECKPOINT_RELOADED';
await saveState(github, repo, record, base);
await assert.rejects(saveState(github, repo, staleRecord, base), /Stale checkpoint blob/);
assert.equal(ref('main'), base);

for (const status of ['in_progress', 'waiting', 'pending']) {
  busy = [{ id: 11, status }];
  await assert.rejects(assertNoOtherRun(github, repo, 10), /PUBLISHER_BUSY/);
}
busy = [{ id: 10, status: 'in_progress' }, { id: 9, status: 'completed' }];
await assertNoOtherRun(github, repo, 10);
busy = [];
const atomic = async identity => {
  const saved = JSON.parse(git(['show', `publisher-state:releases/${manifest.id}.json`]));
  assert.equal(saved.phase, 'MAIN_UPDATE_REQUESTED');
  atomicFastForwardWithGit(identity); mainUpdates++;
};
await assert.rejects(publishOrResume(github, repo, record, manifest, publish, 10, atomic), /Synthetic dispatch rejected/);
assert.equal(ref('main'), head);
record = await readState(github, repo, manifest.id);
assert.equal(record.value.phase, 'DEPLOYMENT_DISPATCH_REJECTED');
assert.equal(record.value.merge_sha, head);
assert.equal(record.value.dispatch_intent, undefined);
dispatchRejected = false;
const resume = validateRequest({ ...publish, action: 'resume', request_id: 'synthetic-resume' },
  manifest, mraw, repo.owner, repo.owner);
record = claimRequest(record, resume, manifest, 11);
await saveState(github, repo, record, head);
await publishOrResume(github, repo, record, manifest, resume, 11, atomic);
record = await readState(github, repo, manifest.id);
await publishOrResume(github, repo, record, manifest, resume, 12, atomic);
record = await readState(github, repo, manifest.id);
assert.equal(record.value.phase, 'DEPLOYMENT_RETRY_REQUESTED');
await publishOrResume(github, repo, record, manifest, resume, 13, atomic);
assert.equal(retryCalls, 1);
assert.equal(mainUpdates, 1);
assert.equal(dispatchCalls, 2);
runs[0].status = 'in_progress';
record = await readState(github, repo, manifest.id);
await publishOrResume(github, repo, record, manifest, resume, 14, atomic);
assert.equal(record.value.phase, 'DEPLOYMENT_RUNNING');
runs[0].status = 'completed'; runs[0].conclusion = 'success';
record = await readState(github, repo, manifest.id);
await publishOrResume(github, repo, record, manifest, resume, 15, atomic);
assert.equal(record.value.phase, 'DEPLOYED_AWAITING_RECEIPT');
const roots = git(['rev-list', '--max-parents=0', 'publisher-state']).split('\n');
assert.equal(roots.length, 1);
assert.equal(git(['ls-tree', '--name-only', roots[0]]), 'README.md');
assert.equal(optionalGit(['merge-base', 'main', 'publisher-state']), null);
assert.ok(checkpointHistory.indexOf('MAIN_UPDATE_REQUESTED') < checkpointHistory.indexOf('MERGED_DEPLOYMENT_REQUESTED'));
const report = { main_updates: mainUpdates, dispatch_calls: dispatchCalls, retry_calls: retryCalls,
  checkpoint_writes: stateWrites, checkpoint_is_orphan_history: true,
  phase: record.value.phase, qualification: record.value.qualification };
writeFileSync(path.join(root, 'controller-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
