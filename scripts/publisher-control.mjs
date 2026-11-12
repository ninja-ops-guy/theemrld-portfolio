import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const STATE_BRANCH = 'publisher-state';
const idPattern = /^[a-z0-9][a-z0-9-]{0,79}$/;
const shaPattern = /^[a-f0-9]{40}$/;
function need(ok, message) { if (!ok) throw new Error(message); }
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function validateRequest(request, manifest, raw, actor, owner) {
  need(idPattern.test(request.release_id || '') && request.release_id === manifest.id, 'Invalid release identity');
  need(['status', 'prepare', 'stage', 'publish', 'resume'].includes(request.action), 'Invalid action');
  const identity = hash(raw);
  if (request.action !== 'status') {
    need(actor === owner, 'Only the repository owner may request a mutation');
    need(manifest.enabled !== false && !manifest.retired && manifest.lifecycle !== 'retired', 'RELEASE_RETIRED: register the approved revision instead');
    need(idPattern.test(request.request_id || ''), 'A durable request_id is required');
    need(request.manifest_sha256 === identity, 'STALE_REQUEST: exact manifest binding required');
  }
  if (['publish', 'resume'].includes(request.action)) need(shaPattern.test(request.expected_head || ''), 'Reviewed head is required');
  return { ...request, manifest_sha256: identity };
}

// Metadata is only a bounded availability check. Byte integrity is verified later by staging.
export async function inspectSource(github, repo, manifest) {
  const result = (phase, reason, release = null) => ({ phase, reason, source_url: release?.html_url || null, hash_verified: false });
  let release;
  try { release = (await github.rest.repos.getReleaseByTag({ ...repo, tag: manifest.source.tag })).data; }
  catch (error) {
    if (error.status !== 404) throw error;
    return result('AWAITING_SOURCE_UPLOAD', 'The registered source release does not exist.');
  }
  let found = [];
  for (let page = 1; page <= 10; page++) {
    const assets = (await github.rest.repos.listReleaseAssets({ ...repo, release_id: release.id, per_page: 100, page })).data;
    found.push(...assets.filter(asset => asset.name === manifest.source.asset));
    if (assets.length < 100) break;
    if (page === 10) return result('SOURCE_METADATA_MISMATCH', 'Asset listing exceeded the bounded inspection limit.', release);
  }
  if (!found.length) return result('AWAITING_SOURCE_UPLOAD', 'The exact registered ZIP is not attached.', release);
  if (found.length !== 1 || found[0].state !== 'uploaded' || found[0].size !== manifest.source.bytes)
    return result('SOURCE_METADATA_MISMATCH', 'The source asset identity, upload state or byte count differs.', release);
  if (release.draft) return result('SOURCE_DRAFT_NOT_PUBLIC', 'The verified source upload must be published as a prerelease before staging.', release);
  if (!release.prerelease) return result('SOURCE_METADATA_MISMATCH', 'The source release must be a prerelease, not a final release.', release);
  return result('SOURCE_AVAILABLE_NOT_YET_VERIFIED', 'ZIP metadata matches; source bytes have not yet been verified.', release);
}

export async function readState(github, repo, releaseId) {
  need(idPattern.test(releaseId), 'Invalid release identity');
  try {
    const file = (await github.rest.repos.getContent({ ...repo, path: `releases/${releaseId}.json`, ref: STATE_BRANCH })).data;
    need(file.type === 'file' && file.size < 256000, 'Invalid publisher checkpoint');
    const value = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    need(value.release_id === releaseId && value.schema_version === 1, 'Invalid publisher checkpoint identity');
    return { value, sha: file.sha };
  } catch (error) { if (error.status !== 404) throw error; return { value: null, sha: null }; }
}

export async function saveState(github, repo, record, base) {
  need(idPattern.test(record.value.release_id), 'Invalid checkpoint identity');
  try { await github.rest.git.getRef({ ...repo, ref: `heads/${STATE_BRANCH}` }); }
  catch (error) {
    if (error.status !== 404) throw error;
    // A metadata-only orphan tree keeps the ledger independent of application/media history.
    const tree = (await github.rest.git.createTree({ ...repo, tree: [{ path: 'README.md', mode: '100644', type: 'blob', content: '# Publisher receipts\n\nSmall release checkpoints only. No application or artwork files.\n' }] })).data;
    const commit = (await github.rest.git.createCommit({ ...repo, message: 'Initialize publisher receipts', tree: tree.sha, parents: [] })).data;
    try { await github.rest.git.createRef({ ...repo, ref: `refs/heads/${STATE_BRANCH}`, sha: commit.sha }); }
    catch (race) { if (race.status !== 422) throw race; await github.rest.git.getRef({ ...repo, ref: `heads/${STATE_BRANCH}` }); }
  }
  const result = await github.rest.repos.createOrUpdateFileContents({ ...repo,
    path: `releases/${record.value.release_id}.json`, branch: STATE_BRANCH,
    message: `Checkpoint ${record.value.release_id}: ${record.value.phase}`,
    content: Buffer.from(JSON.stringify(record.value, null, 2) + '\n').toString('base64'),
    ...(record.sha ? { sha: record.sha } : {}) });
  record.sha = result.data.content.sha;
  return record;
}

export function claimRequest(record, request, manifest, runId) {
  const value = record.value || { schema_version: 1, release_id: manifest.id,
    manifest_sha256: request.manifest_sha256, requests: {}, phase: 'REGISTERED' };
  need(value.manifest_sha256 === request.manifest_sha256, 'RELEASE_ID_REUSED: source manifest changed; use a new release ID');
  const binding = { action: request.action, expected_head: request.expected_head || null, manifest_sha256: request.manifest_sha256 };
  if (value.requests[request.request_id]) need(JSON.stringify(value.requests[request.request_id].binding) === JSON.stringify(binding), 'REQUEST_ID_REUSED: request content changed');
  else {
    need(Object.keys(value.requests).length < 200, 'Request ledger limit reached; archive through a reviewed maintenance change');
    value.requests[request.request_id] = { binding, first_run: String(runId) };
  }
  value.last_request = request.request_id;
  value.last_run = String(runId);
  return { ...record, value };
}

export async function assertNoOtherRun(github, repo, runId) {
  const { data } = await github.rest.actions.listWorkflowRuns({ ...repo, workflow_id: 'comic-publisher.yml', per_page: 100 });
  need(!data.workflow_runs.some(r => String(r.id) !== String(runId) && ['in_progress', 'waiting', 'pending'].includes(r.status)), 'PUBLISHER_BUSY: another publisher is active');
}

export async function recordQualified(github, repo, record, { head, base, tree, runId, reviewedHead = head }) {
  need([head, base, tree].every(s => shaPattern.test(s)), 'Invalid qualified commit identity');
  record.value.qualification = { head, base, tree, reviewed_head: reviewedHead, run_id: String(runId), manifest_sha256: record.value.manifest_sha256 };
  record.value.phase = 'QUALIFIED_NOT_PUBLISHED';
  return saveState(github, repo, record, base);
}

// The lease makes main's expected base atomic. The ancestry check makes this strictly
// fast-forward despite using the lease flag. Repository protections remain authoritative.
export function atomicFastForwardWithGit({ base, head, tree, repository }, run = (args) => execFileSync('git', args, { encoding: 'utf8', timeout: 120000, maxBuffer: 1048576, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' } }).trim()) {
  need([base, head, tree].every(s => shaPattern.test(s)), 'Invalid atomic publication identity');
  need(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository), 'Invalid repository');
  const remote = run(['remote', 'get-url', 'origin']);
  need([`https://github.com/${repository}`, `https://github.com/${repository}.git`].includes(remote), 'Unexpected publication remote');
  run(['fetch', '--no-tags', 'origin', base, head]);
  run(['merge-base', '--is-ancestor', base, head]);
  need(run(['rev-parse', `${head}^{tree}`]) === tree, 'Qualified tree changed');
  run(['push', '--porcelain', `--force-with-lease=refs/heads/main:${base}`, 'origin', `${head}:refs/heads/main`]);
}

export async function publishOrResume(github, repo, record, manifest, request, runId, atomicFastForward = null) {
  need(['publish', 'resume'].includes(request.action), 'Publication authorization is required');
  const q = record.value?.qualification;
  need(q && q.manifest_sha256 === request.manifest_sha256, 'NO_QUALIFICATION: stage and qualify this exact manifest first');
  need([q.head, q.reviewed_head].includes(request.expected_head), 'STALE_REQUEST: publish the exact qualified head');
  let pr = (await github.rest.pulls.get({ ...repo, pull_number: manifest.target.pr })).data;
  need(pr.head.repo.full_name === manifest.repository && pr.head.ref === manifest.target.branch && pr.base.ref === 'main', 'PR identity changed');
  need(pr.head.sha === q.head, 'STALE_QUALIFICATION: candidate moved');
  const base = (await github.rest.repos.getBranch({ ...repo, branch: 'main' })).data.commit.sha;
  if (!pr.merged) {
    const alreadyUpdated = base === q.head && ['MAIN_UPDATE_REQUESTED', 'MAIN_UPDATED_AWAITING_PR'].includes(record.value.phase);
    if (!alreadyUpdated) {
      need(request.action === 'publish', 'NOT_MERGED: use publish after qualification');
      need(pr.state === 'open' && base === q.base, 'STALE_QUALIFICATION: main moved or PR closed');
      const checks = await github.paginate(github.rest.checks.listForRef, { ...repo, ref: q.head, per_page: 100 });
      need(checks.every(c => ['success', 'skipped', 'neutral'].includes(c.conclusion)), 'Exact-head checks failed or unfinished');
      const statuses = (await github.rest.repos.getCombinedStatusForRef({ ...repo, ref: q.head })).data.statuses;
      need(statuses.every(s => s.state === 'success'), 'Exact-head statuses failed or unfinished');
      need(typeof atomicFastForward === 'function', 'ATOMIC_PUBLICATION_UNAVAILABLE: no safe base-bound update method');
      // Persist intent before the side effect. A lost response is reconciled through main and PR.
      record.value.phase = 'MAIN_UPDATE_REQUESTED';
      await saveState(github, repo, record, base);
      if (pr.draft) await github.graphql('mutation($id:ID!){markPullRequestReadyForReview(input:{pullRequestId:$id}){pullRequest{id}}}', { id: pr.node_id });
      await atomicFastForward({ base: q.base, head: q.head, tree: q.tree, repository: manifest.repository });
    }
    record.value.phase = 'MAIN_UPDATED_AWAITING_PR';
    record.value.merge_sha = q.head;
    await saveState(github, repo, record, q.head);
    pr = (await github.rest.pulls.get({ ...repo, pull_number: manifest.target.pr })).data;
    need(pr.merged && pr.head.sha === q.head && pr.merge_commit_sha === q.head,
      'PR_MERGE_UNCONFIRMED: main update is recorded; wait for GitHub PR reconciliation, do not push again');
  }
  // Includes a completed update whose response/checkpoint was lost. Never infer approval from an unrelated merge.
  record.value.merge_sha = pr.merge_commit_sha;
  const mergedCommit = (await github.rest.git.getCommit({ ...repo, commit_sha: record.value.merge_sha })).data;
  need(mergedCommit.tree.sha === q.tree, 'MERGED_TREE_CHANGED: refusing deployment');
  const currentMain = (await github.rest.repos.getBranch({ ...repo, branch: 'main' })).data.commit.sha;
  need(currentMain === record.value.merge_sha, 'MAIN_ADVANCED: do not redeploy an older tree over newer work');
  if (record.value.phase === 'PUBLISHED_HASH_VERIFIED') return record.value;
  const { data } = await github.rest.actions.listWorkflowRuns({ ...repo, workflow_id: 'pages.yml', head_sha: record.value.merge_sha, per_page: 100 });
  const runs = data.workflow_runs.filter(r => r.head_sha === record.value.merge_sha && r.event === 'workflow_dispatch' && r.display_title === `Comic deployment · ${manifest.id} · ${record.value.merge_sha}`);
  if (runs.length) {
    const run = runs.sort((a, b) => b.id - a.id)[0];
    record.value.deployment_run = run.id;
    record.value.phase = run.status === 'completed' ? (run.conclusion === 'success' ? 'DEPLOYED_AWAITING_RECEIPT' : 'DEPLOYMENT_FAILED') : 'DEPLOYMENT_RUNNING';
    await saveState(github, repo, record, currentMain);
    if (run.status === 'completed' && run.conclusion !== 'success' && request.action === 'resume') {
      // One retry side effect per durable request, even while GitHub's run listing lags.
      if (record.value.retry_intent?.request_id === request.request_id && record.value.retry_intent.run_id === run.id) return record.value;
      record.value.retry_intent = { request_id: request.request_id, run_id: run.id, attempt: run.run_attempt || 1 };
      record.value.phase = 'DEPLOYMENT_RETRY_REQUESTED';
      await saveState(github, repo, record, currentMain);
      // Retry the known failed run, never create a second deployment request.
      await github.rest.actions.reRunWorkflowFailedJobs({ ...repo, run_id: run.id });
      record.value.phase = 'DEPLOYMENT_RETRY_REQUESTED';
      await saveState(github, repo, record, currentMain);
    }
    return record.value;
  }
  need(!record.value.dispatch_intent, 'DISPATCH_UNCERTAIN: no matching run is visible yet; inspect later rather than duplicate the request');
  record.value.phase = 'MERGED_DEPLOYMENT_REQUESTED';
  record.value.dispatch_intent = { run_id: String(runId), merge_sha: currentMain };
  await saveState(github, repo, record, currentMain);
  try {
    await github.rest.actions.createWorkflowDispatch({ ...repo, workflow_id: 'pages.yml', ref: 'main', inputs: {
      release_id: manifest.id, expected_sha: currentMain, manifest_sha256: request.manifest_sha256,
    } });
  } catch (error) {
    // A definite client rejection is safe to retry; network/5xx outcomes remain uncertain.
    if ([400, 401, 403, 404, 422].includes(error.status)) {
      delete record.value.dispatch_intent;
      record.value.phase = 'DEPLOYMENT_DISPATCH_REJECTED';
      await saveState(github, repo, record, currentMain);
    }
    throw error;
  }
  return record.value;
}

export async function recordLiveReceipt(github, repo, releaseId, manifestHash, commit, receipt, runId) {
  const record = await readState(github, repo, releaseId);
  need(record.value && record.value.manifest_sha256 === manifestHash && record.value.merge_sha === commit, 'Live receipt does not match recorded publication');
  need(receipt.status === 'PUBLISHED_HASH_VERIFIED' && receipt.commit === commit && receipt.release_id === releaseId, 'Invalid live receipt');
  record.value.phase = 'PUBLISHED_HASH_VERIFIED';
  record.value.deployment_run = Number(runId);
  record.value.live_receipt = receipt;
  await saveState(github, repo, record, commit);
}
