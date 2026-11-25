// Read-only split-source intake. No credentials, byte downloads or public mutations here.
const repoName='ninja-ops-guy/theemrld-portfolio';
const numericId = n => Number.isSafeInteger(n) && n > 0;
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const tag = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,99}$/.test(value);
const need=(ok,message)=>{if(!ok) throw new Error('PRIVATE_SOURCE_HOLD: '+message);};

export async function inspectPrivateSplit(api, repo, manifest, pins) {
  need([repo.owner,repo.repo].join('/')===repoName && manifest.repository===repoName, 'wrong repository');
  const {source,delivery,pdf}=manifest;
  need(manifest.schema_version===2 && manifest.edition==='ixiv' && manifest.page_count===514,
       'wrong release scope');
  need(tag(source?.tag) && tag(delivery?.tag) && source.tag!==delivery.tag, 'distinct release tags required');
  const sourceId=delivery.source_release_id, sourceAsset=delivery.source_asset_id;
  const pdfId=pins?.delivery_release_id, pdfAsset=pins?.delivery_asset_id;
  need([sourceId,sourceAsset,pdfId,pdfAsset].every(numericId) && sourceId!==pdfId && sourceAsset!==pdfAsset, 'distinct exact release and asset IDs required');
  const check = async (id, expectedTag, draft, pre, assetId, expectedName, approved) => {
    const release=(await api.getRelease({...repo,release_id:id})).data;
    need(release.id===id && release.tag_name===expectedTag && release.draft===draft && release.prerelease===pre, 'release identity or privacy changed');
    const rows=(await api.listReleaseAssets({...repo,release_id:id,per_page:2,page:1})).data;
    need(Array.isArray(rows) && rows.length===1, 'each release must have exactly its sole permitted asset');
    const a=rows[0];
    need(a.id===assetId && a.name===expectedName && a.state==='uploaded' && a.size===approved.bytes &&
         hash(approved.sha256) && a.digest==='sha256:'+approved.sha256, 'attached asset identity or digest changed');
  };
  await check(sourceId,source.tag,true,true,sourceAsset,source.asset,source);
  await check(pdfId,delivery.tag,true,false,pdfAsset,pdf.filename,pdf);
  return {phase:'PRIVATE_DRAFTS_MATCH_METADATA', byte_readback_verified:false,
          source_release_id:sourceId,source_asset_id:sourceAsset,delivery_release_id:pdfId,delivery_asset_id:pdfAsset};
}

const commit = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const profileSet = ['desktop-chromium','phone-chromium','phone-webkit'];
// This is an identity/completeness test for an already authenticated producer's receipt.
// Equality is not attestation. Never consume a PR-created or untrusted artifact as proof.
export function assertPrivateProofMatch(proof, manifest, current, pins) {
  need(current?.provenance === 'TRUSTED_PRIVATE_PREFLIGHT_READBACK', 'trusted receipt provenance required');
  need(proof?.status === 'PRIVATE_PREFLIGHT_ONLY' && proof.not_an_approval_or_publication === true,
       'local preflight evidence required');
  need(proof.release === manifest.id && proof.pages === manifest.page_count && proof.pages === 514, 'wrong edition or page extent');
  for (const field of ['head','tree','reviewed_head','main_snapshot','media'])
    need(commit(current[field]) && proof[field] === current[field], 'stale '+field);
  need(hash(current.manifest_sha256) && proof.manifest_sha256 === current.manifest_sha256, 'manifest changed');
  need(proof.source_sha256 === manifest.source.sha256 && proof.pdf_sha256 === manifest.pdf.sha256 &&
       proof.pdf_readback_sha256 === manifest.pdf.sha256,'source or PDF evidence changed');
  need(proof.source_release_id === manifest.delivery.source_release_id && proof.source_asset_id === manifest.delivery.source_asset_id &&
       proof.delivery_release_id === pins.delivery_release_id && proof.delivery_asset_id === pins.delivery_asset_id, 'draft pin mismatch');
  need(Number.isSafeInteger(proof.packaged_bytes) && proof.packaged_bytes > 0 && proof.packaged_bytes <= 1_000_000_000, 'Pages budget not proved');
  need(proof.browser_check_count === 12 && proof.physical_device_test === false &&
       JSON.stringify(proof.profiles) === JSON.stringify(profileSet) && hash(proof.browser_receipt_sha256) && hash(proof.package_policy_sha256),
       'required browser or packaging evidence missing');
  return {phase:'PRIVATE_EVIDENCE_MATCHED_NO_MUTATION',publication_approved:false};
}

const preflightPaths = new Set([
  'src/pages/LatestComicReader.css', 'src/pages/LatestComicReader.tsx',
  'src/pages/TechOpsComic.tsx', 'tests/comic-final-browser.py',
  'tests/comic-final-polish.py', 'tests/comic-music-browser.py',
]);

// The calling workflow must supply these observations from its trusted main checkout,
// the authenticated API and a direct NUL-delimited Git diff, never from the candidate.
const registeredPaths = new Set([
  ...preflightPaths, 'public/k-world/guided-cues.json', 'public/k-world/guided.js',
  'publishing/releases/ixiv-9b2f94974027.json', 'src/data/comic-current-editions.json',
  'src/data/comic-display-labels.json', 'src/data/comic-optional-tracks.json',
  'tests/comic-corrected-release.test.mjs', 'tests/comic-optional-tracks.test.mjs',
]);
export function assertPrivatePreflightTarget(context, observed, expected, {registered = false} = {}) {
  const allowed = registered ? registeredPaths : preflightPaths;
  need(context?.eventName === 'workflow_dispatch' && context.ref === 'refs/heads/main'
       && context.repo?.owner === 'ninja-ops-guy' && context.repo?.repo === 'theemrld-portfolio'
       && context.actor === context.repo.owner && context.triggeringActor === context.repo.owner,
       'owner-only manual preflight on main required');
  need(commit(expected?.main) && expected.main === observed?.main
       && expected.main === context.sha, 'trusted main changed');
  const pr=observed?.pr;
  need(pr?.number === 138 && pr.state === 'open' && pr.merged === false && pr.draft === true
       && pr.head?.repo?.full_name === repoName && pr.base?.repo?.full_name === repoName
       && pr.base.ref === 'main' && pr.base.sha === expected.main
       && pr.head.ref === 'release/techops-ixiv-9b2f94974027'
       && commit(expected.reviewed_head) && pr.head.sha === expected.reviewed_head
       && observed.candidate === expected.reviewed_head, 'candidate identity changed');
  need(hash(expected.manifest_sha256) && expected.manifest_sha256 === observed.manifest_sha256,
       'approved manifest bytes changed');
  need(Array.isArray(observed.paths) && observed.paths.length === allowed.size
       && new Set(observed.paths).size === allowed.size
       && observed.paths.every(path => allowed.has(path)),
       'reviewed changes must match the six-path preflight scope');
  return {phase:'OWNER_PRIVATE_PREFLIGHT_TARGET_MATCH', publication_approved:false};
}
