import test from 'node:test';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { atomicFastForwardWithGit, claimRequest, hash, inspectSource, publishOrResume as actualPublishOrResume, readState, recordLiveReceipt, recordQualified, saveState, validateRequest } from '../scripts/publisher-control.mjs';

const publishOrResume = (...args) => actualPublishOrResume(...args, args[0].atomicFastForward);
const A = 'a'.repeat(40), B = 'b'.repeat(40), C = 'c'.repeat(40), T = 'd'.repeat(40);
const manifest = { id: 'demo', repository: 'owner/repo', target: { pr: 1, branch: 'release/demo' } };
const raw = JSON.stringify(manifest), H = hash(raw);
const request = { release_id: 'demo', action: 'publish', request_id: 'publish-one', expected_head: A, manifest_sha256: H };
function fixture() {
  const f = { main: B, merged: false, mergeCalls: 0, dispatchCalls: 0, retryCalls: 0, saved: null, version: 0,
    runs: [], checks: [], statuses: [], currentHead: A, tree: T, branchExists: true };
  const fail404 = () => { throw Object.assign(new Error('not found'), { status: 404 }); };
  const github = { rest: {
    repos: {
      getContent: async () => f.saved ? { data: { type: 'file', size: 100, sha: String(f.version), content: Buffer.from(JSON.stringify(f.saved)).toString('base64') } } : fail404(),
      getBranch: async () => ({ data: { commit: { sha: f.main } } }),
      getCombinedStatusForRef: async () => ({ data: { statuses: f.statuses } }),
      createOrUpdateFileContents: async args => { assert.equal(args.sha || null, f.saved ? String(f.version) : null); f.saved = JSON.parse(Buffer.from(args.content, 'base64').toString()); f.version++; return { data: { content: { sha: String(f.version) } } }; },
    },
    git: {
      getRef: async () => f.branchExists ? { data: {} } : fail404(),
      createTree: async args => { assert.equal(args.tree.length, 1); assert.equal(args.tree[0].path, 'README.md'); assert.equal(args.tree[0].type, 'blob'); return { data: { sha: T } }; },
      createCommit: async args => { assert.deepEqual(args.parents, []); return { data: { sha: C } }; },
      createRef: async () => { f.branchExists = true; },
      getCommit: async () => ({ data: { tree: { sha: f.tree } } }),
    },
    pulls: {
      get: async () => ({ data: { head: { sha: f.currentHead, ref: 'release/demo', repo: { full_name: 'owner/repo' } }, base: { ref: 'main' }, state: f.merged ? 'closed' : 'open', merged: f.merged, merge_commit_sha: f.mergeCommit || C } }),

    },
    checks: { listForRef: async () => f.checks },
    actions: {
      listWorkflowRuns: async () => ({ data: { workflow_runs: f.runs } }),
      createWorkflowDispatch: async () => { f.dispatchCalls++; if (f.dispatchError) throw f.dispatchError; },
      reRunWorkflowFailedJobs: async () => { f.retryCalls++; },
    },
  }, paginate: async (fn, args) => fn(args) };
  github.atomicFastForward = async ({ base, head }) => {
    f.mergeCalls++;
    if (f.beforePush) f.beforePush();
    if (f.main !== base) throw new Error('lease rejected: base moved');
    if (f.pushRejected) throw new Error('branch protection rejected');
    f.main = head; f.mergeCommit = head; f.merged = !f.delayPR;
    if (f.mergeError) throw f.mergeError;
  };
  const record = claimRequest({ value: null, sha: null }, request, manifest, 10);
  record.value.qualification = { head: A, reviewed_head: A, base: B, tree: T, manifest_sha256: H, run_id: '10' };
  return { f, github, record };
}
const repo = { owner: 'owner', repo: 'repo' };
test('owner and exact manifest are mandatory for mutating requests', () => {
  assert.equal(validateRequest(request, manifest, raw, 'owner', 'owner').manifest_sha256, H);
  assert.throws(() => validateRequest(request, manifest, raw, 'other', 'owner'), /owner/);
  assert.throws(() => validateRequest({ ...request, manifest_sha256: 'bad' }, manifest, raw, 'owner', 'owner'), /manifest/);
  assert.throws(() => validateRequest(request, { ...manifest, retired: true }, raw, 'owner', 'owner'), /RELEASE_RETIRED/);
});
test('status does not require a request ID or mutate state', () => assert.equal(validateRequest({ release_id: 'demo', action: 'status' }, manifest, raw, 'reader', 'owner').action, 'status'));
test('same request is idempotent; changed request or release identity is rejected', () => {
  const { record } = fixture();
  claimRequest(record, request, manifest, 11);
  assert.equal(Object.keys(record.value.requests).length, 1);
  assert.throws(() => claimRequest(record, { ...request, expected_head: B }, manifest, 12), /REQUEST_ID_REUSED/);
  assert.throws(() => claimRequest(record, { ...request, manifest_sha256: 'x' }, manifest, 12), /RELEASE_ID_REUSED/);
});
test('checkpoint branch and file are created and read with compare-and-swap identity', async () => {
  const { f, github, record } = fixture(); f.branchExists = false;
  await saveState(github, repo, record, B);
  assert.equal(f.branchExists, true);
  assert.equal((await readState(github, repo, 'demo')).value.release_id, 'demo');
  await recordQualified(github, repo, record, { head: A, base: B, tree: T, runId: 10 });
  assert.equal(f.saved.phase, 'QUALIFIED_NOT_PUBLISHED');
});
test('successful publication persists merge and dispatch intent before dispatch', async () => {
  const { f, github, record } = fixture();
  await publishOrResume(github, repo, record, manifest, request, 10);
  assert.equal(f.mergeCalls, 1); assert.equal(f.dispatchCalls, 1);
  assert.equal(f.saved.merge_sha, A); assert.equal(f.saved.dispatch_intent.merge_sha, A);
});
test('lost merge response recovers existing merged PR without merging twice', async () => {
  const { f, github, record } = fixture(); f.mergeError = new Error('network lost');
  await assert.rejects(publishOrResume(github, repo, record, manifest, request, 10));
  assert.equal(f.saved.phase, 'MAIN_UPDATE_REQUESTED');
  const recovered = await readState(github, repo, 'demo');
  await publishOrResume(github, repo, recovered, manifest, { ...request, action: 'resume' }, 11);
  assert.equal(f.mergeCalls, 1); assert.equal(f.dispatchCalls, 1);
});
test('uncertain dispatch is not blindly repeated', async () => {
  const { f, github, record } = fixture(); f.dispatchError = new Error('response lost');
  await assert.rejects(publishOrResume(github, repo, record, manifest, request, 10));
  f.dispatchError = null;
  await assert.rejects(publishOrResume(github, repo, record, manifest, { ...request, action: 'resume' }, 11), /DISPATCH_UNCERTAIN/);
  assert.equal(f.dispatchCalls, 1);
});
test('definite dispatch rejection permits a later safe resume', async () => {
  const { f, github, record } = fixture(); f.dispatchError = Object.assign(new Error('forbidden'), { status: 403 });
  await assert.rejects(publishOrResume(github, repo, record, manifest, request, 10));
  assert.equal(f.saved.phase, 'DEPLOYMENT_DISPATCH_REJECTED');
  f.dispatchError = null;
  await publishOrResume(github, repo, record, manifest, { ...request, action: 'resume' }, 11);
  assert.equal(f.mergeCalls, 1); assert.equal(f.dispatchCalls, 2);
});
test('known running deployment is reused and failed run retried, never redispatched', async () => {
  const { f, github, record } = fixture();
  f.merged = true; f.main = C; f.runs = [{ id: 99, head_sha: C, event: 'workflow_dispatch', display_title: `Comic deployment · demo · ${C}`, status: 'in_progress' }];
  await publishOrResume(github, repo, record, manifest, { ...request, action: 'resume' }, 11);
  assert.equal(f.saved.phase, 'DEPLOYMENT_RUNNING');
  f.runs[0].status = 'completed'; f.runs[0].conclusion = 'failure';
  await publishOrResume(github, repo, record, manifest, { ...request, action: 'resume' }, 12);
  await publishOrResume(github, repo, record, manifest, { ...request, action: 'resume' }, 13);
  assert.equal(f.retryCalls, 1); assert.equal(f.dispatchCalls, 0); assert.equal(f.mergeCalls, 0);
});
test('main movement, candidate movement and changed merged tree block publication', async () => {
  for (const change of [f => { f.main = C; }, f => { f.currentHead = B; }, f => { f.merged = true; f.main = C; f.tree = B; }]) {
    const { f, github, record } = fixture(); change(f);
    await assert.rejects(publishOrResume(github, repo, record, manifest, request, 10));
    assert.equal(f.dispatchCalls, 0);
  }
});
test('failed or pending checks cannot merge', async () => {
  for (const conclusion of ['failure', null]) {
    const { f, github, record } = fixture(); f.checks = [{ conclusion }];
    await assert.rejects(publishOrResume(github, repo, record, manifest, request, 10), /checks/);
    assert.equal(f.mergeCalls, 0);
  }
});
test('successful workflow alone is not a live-hash receipt', async () => {
  const { f, github, record } = fixture(); f.merged = true; f.main = C;
  f.runs = [{ id: 99, head_sha: C, event: 'workflow_dispatch', display_title: `Comic deployment · demo · ${C}`, status: 'completed', conclusion: 'success' }];
  await publishOrResume(github, repo, record, manifest, { ...request, action: 'resume' }, 11);
  assert.equal(f.saved.phase, 'DEPLOYED_AWAITING_RECEIPT');
  await recordLiveReceipt(github, repo, 'demo', H, C, { status: 'PUBLISHED_HASH_VERIFIED', release_id: 'demo', commit: C }, 99);
  assert.equal(f.saved.phase, 'PUBLISHED_HASH_VERIFIED');
});
test('live receipt must match registered manifest and merged commit', async () => {
  const { github, record } = fixture(); await saveState(github, repo, record, B);
  await assert.rejects(recordLiveReceipt(github, repo, 'demo', H, C, { status: 'PUBLISHED_HASH_VERIFIED', release_id: 'demo', commit: C }, 99), /does not match/);
});

test('a merged PR without qualification cannot be adopted as approved', async () => {
  const { f, github, record } = fixture(); f.merged = true; f.main = C; delete record.value.qualification;
  await assert.rejects(publishOrResume(github, repo, record, manifest, { ...request, action: 'resume' }, 10), /NO_QUALIFICATION/);
  assert.equal(f.dispatchCalls, 0);
});
test('status remains possible for retired registry entries but mutations fail', () => {
  const retired = { ...manifest, lifecycle: 'retired' };
  assert.equal(validateRequest({ release_id: 'demo', action: 'status' }, retired, raw, 'other', 'owner').action, 'status');
  assert.throws(() => validateRequest(request, retired, raw, 'owner', 'owner'), /RELEASE_RETIRED/);
});
test('different manifest or reviewed head cannot reuse a qualification', async () => {
  for (const changed of [{ ...request, manifest_sha256: 'x' }, { ...request, expected_head: B }]) {
    const { f, github, record } = fixture();
    await assert.rejects(publishOrResume(github, repo, record, manifest, changed, 10));
    assert.equal(f.mergeCalls, 0);
  }
});
test('original reviewed head can bind a staged head only through a saved qualification', async () => {
  const { f, github, record } = fixture(); f.currentHead = 'e'.repeat(40); record.value.qualification.head = f.currentHead;
  await publishOrResume(github, repo, record, manifest, request, 10);
  assert.equal(f.mergeCalls, 1);
});

test('atomic publication proves ancestry and tree then uses an exact main lease', () => {
  const calls = [];
  const run = args => { calls.push(args); if (args[0] === 'remote') return 'https://github.com/owner/repo'; if (args[0] === 'rev-parse') return T; return ''; };
  atomicFastForwardWithGit({ base: B, head: A, tree: T, repository: 'owner/repo' }, run);
  assert.deepEqual(calls[2], ['merge-base', '--is-ancestor', B, A]);
  assert.deepEqual(calls.at(-1), ['push', '--porcelain', `--force-with-lease=refs/heads/main:${B}`, 'origin', `${A}:refs/heads/main`]);
});
test('non-ancestor candidate or wrong tree prevents all pushes', () => {
  for (const failure of ['ancestry', 'tree']) {
    const calls = [];
    const run = args => {
      calls.push(args);
      if (args[0] === 'remote') return 'https://github.com/owner/repo';
      if (args[0] === 'merge-base' && failure === 'ancestry') throw new Error('not an ancestor');
      if (args[0] === 'rev-parse') return B;
      return '';
    };
    assert.throws(() => atomicFastForwardWithGit({ base: B, head: A, tree: T, repository: 'owner/repo' }, run));
    assert.equal(calls.some(args => args[0] === 'push'), false);
  }
});
test('base movement between preflight and publication fails the lease before our update', async () => {
  const { f, github, record } = fixture(); f.beforePush = () => { f.main = C; };
  await assert.rejects(publishOrResume(github, repo, record, manifest, request, 10), /lease rejected/);
  assert.equal(f.main, C); assert.equal(f.merged, false); assert.equal(f.dispatchCalls, 0);
});
test('branch protection rejection never falls back to the merge API', async () => {
  const { f, github, record } = fixture(); f.pushRejected = true;
  await assert.rejects(publishOrResume(github, repo, record, manifest, request, 10), /branch protection/);
  assert.equal(f.main, B); assert.equal(f.merged, false); assert.equal(f.dispatchCalls, 0);
});
test('no atomic helper means publication is disabled before a main update', async () => {
  const { f, github, record } = fixture();
  await assert.rejects(actualPublishOrResume(github, repo, record, manifest, request, 10), /ATOMIC_PUBLICATION_UNAVAILABLE/);
  assert.equal(f.mergeCalls, 0);
});
test('delayed PR recognition resumes after rereading main and PR, never repeats the update', async () => {
  const { f, github, record } = fixture(); f.delayPR = true;
  await assert.rejects(publishOrResume(github, repo, record, manifest, request, 10), /PR_MERGE_UNCONFIRMED/);
  assert.equal(f.main, A); assert.equal(f.saved.phase, 'MAIN_UPDATED_AWAITING_PR');
  await assert.rejects(publishOrResume(github, repo, record, manifest, { ...request, action: 'resume' }, 11), /PR_MERGE_UNCONFIRMED/);
  assert.equal(f.mergeCalls, 1);
  f.merged = true;
  await publishOrResume(github, repo, record, manifest, { ...request, action: 'resume' }, 12);
  assert.equal(f.mergeCalls, 1); assert.equal(f.dispatchCalls, 1);
});

test('saved requests never mutate main and source uploads do not auto-stage', () => {
  const workflow = readFileSync(new URL('../.github/workflows/comic-publisher.yml', import.meta.url), 'utf8');
  assert.match(workflow, /push:\n    branches: \[publisher-requests\]\n    paths: \[publishing\/request.json\]/);
  assert.doesNotMatch(workflow, /^  release:/m);
  assert.doesNotMatch(workflow, /context.eventName === 'release'/);
  assert.match(workflow, /path:'publishing\/request.json',ref:context.sha/);
  assert.match(workflow, /ref: main\n          persist-credentials: false/);
  assert.match(workflow, /--expected-head "\$HEAD"/);
});

for (const race of [false, true]) test(`real local Git lease ${race ? 'rejects concurrent ancestor advance' : 'fast-forwards exact base'}`, () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'publisher-lease-'));
  try {
    const bare = path.join(dir, 'remote.git'), work = path.join(dir, 'work');
    const git = (args, cwd = dir) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    git(['init', '--bare', '--initial-branch=main', bare]);
    git(['clone', bare, work]);
    git(['config', 'user.name', 'Publisher Test'], work); git(['config', 'user.email', 'test@example.invalid'], work);
    writeFileSync(path.join(work, 'file'), 'base'); git(['add', 'file'], work); git(['commit', '-m', 'base'], work);
    const base = git(['rev-parse', 'HEAD'], work); git(['push', 'origin', 'main'], work);
    git(['checkout', '-b', 'release/demo'], work);
    writeFileSync(path.join(work, 'file'), 'intermediate'); git(['commit', '-am', 'intermediate'], work);
    const concurrent = git(['rev-parse', 'HEAD'], work);
    writeFileSync(path.join(work, 'file'), 'qualified'); git(['commit', '-am', 'qualified'], work);
    const head = git(['rev-parse', 'HEAD'], work), tree = git(['rev-parse', 'HEAD^{tree}'], work);
    git(['push', 'origin', 'release/demo'], work);
    const run = args => {
      if (args[0] === 'remote') return 'https://github.com/owner/repo'; // Only the test transport is local.
      if (args[0] === 'push' && race) git(['--git-dir', bare, 'update-ref', 'refs/heads/main', concurrent, base]);
      return git(args, work);
    };
    if (race) assert.throws(() => atomicFastForwardWithGit({ base, head, tree, repository: 'owner/repo' }, run));
    else atomicFastForwardWithGit({ base, head, tree, repository: 'owner/repo' }, run);
    assert.equal(git(['--git-dir', bare, 'rev-parse', 'main']), race ? concurrent : head);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

function sourceFixture(release = { id: 1, draft: false, prerelease: true, html_url: 'https://github.com/owner/repo/releases/tag/source' }, assets = [{ name: 'source.zip', state: 'uploaded', size: 42 }]) {
  let calls = 0;
  return { github: { rest: { repos: {
    getReleaseByTag: async () => { if (release === null) throw Object.assign(new Error('missing'), { status: 404 }); return { data: release }; },
    listReleaseAssets: async () => { calls++; return { data: assets }; },
  } } }, manifest: { source: { tag: 'source', asset: 'source.zip', bytes: 42 } }, calls: () => calls };
}
test('missing release and absent ZIP report awaiting source without claiming verification', async () => {
  for (const f of [sourceFixture(null), sourceFixture(undefined, [])]) {
    const result = await inspectSource(f.github, repo, f.manifest);
    assert.equal(result.phase, 'AWAITING_SOURCE_UPLOAD'); assert.equal(result.hash_verified, false);
  }
});
test('draft, wrong-sized, unfinished and final-release sources cannot stage', async () => {
  const cases = [
    [sourceFixture({ id: 1, draft: true, prerelease: true }), 'SOURCE_DRAFT_NOT_PUBLIC'],
    [sourceFixture(undefined, [{ name: 'source.zip', state: 'uploaded', size: 41 }]), 'SOURCE_METADATA_MISMATCH'],
    [sourceFixture(undefined, [{ name: 'source.zip', state: 'starter', size: 42 }]), 'SOURCE_METADATA_MISMATCH'],
    [sourceFixture({ id: 1, draft: false, prerelease: false }), 'SOURCE_METADATA_MISMATCH'],
  ];
  for (const [f, phase] of cases) assert.equal((await inspectSource(f.github, repo, f.manifest)).phase, phase);
});
test('matching source metadata is explicitly not hash verification', async () => {
  const f = sourceFixture(); const result = await inspectSource(f.github, repo, f.manifest);
  assert.equal(result.phase, 'SOURCE_AVAILABLE_NOT_YET_VERIFIED'); assert.equal(result.hash_verified, false); assert.equal(f.calls(), 1);
});
test('source metadata inspection is bounded and fails closed on oversized listing', async () => {
  const f = sourceFixture(undefined, Array.from({ length: 100 }, (_, i) => ({ name: `other-${i}`, state: 'uploaded', size: 1 })));
  const result = await inspectSource(f.github, repo, f.manifest);
  assert.equal(result.phase, 'SOURCE_METADATA_MISMATCH'); assert.equal(f.calls(), 10);
});
