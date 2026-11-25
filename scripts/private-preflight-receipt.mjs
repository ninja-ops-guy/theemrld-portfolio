import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { assertPrivateProofMatch } from './publisher-private-boundary.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const {MANIFEST,MANIFEST_SHA,PRIVATE_EXPECTED_HEAD:head,PRIVATE_EXPECTED_MEDIA:media,
  GITHUB_SHA:main_snapshot,GITHUB_RUN_ID:run,GITHUB_RUN_ATTEMPT:attempt,REVIEWED_HEAD:reviewed_head}=process.env;
assert.match(run,/^[1-9][0-9]*$/);
assert.match(attempt,/^[1-9][0-9]*$/);
const root=path.join(process.env.RUNNER_TEMP,'ixiv-source');
const git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8'}).trim();
const tree=git('candidate','rev-parse','HEAD^{tree}');
assert.equal(head,git('candidate','rev-parse','HEAD'));
assert.equal(media,git('media','rev-parse','HEAD'));
assert.equal(main_snapshot,git('control','rev-parse','HEAD'));
git('candidate','merge-base','--is-ancestor',reviewed_head,'HEAD');
git('candidate','merge-base','--is-ancestor',main_snapshot,'HEAD');
const registered_head=git('candidate','rev-parse','HEAD^');
const registered_tree=git('candidate','rev-parse','HEAD^^{tree}');
const raw=await fs.readFile(MANIFEST);
const manifest=JSON.parse(raw);
assert.equal(sha(raw),MANIFEST_SHA);
const p=await fs.readFile(path.join(root,'package-policy.json'));
const pack=JSON.parse(p);
const book=pack.books.find(book=>book.id==='ixiv');
assert.equal(pack.sourceCommit,head);
assert.equal(pack.earlierEditionsPublic,false);
assert.equal(book?.pageCount,514);
assert.equal(book.mediaCommit,media);
assert.equal(book.pdfSha256,manifest.pdf.sha256);
assert.equal(book.publisherRelease,manifest.id);
const markerFile='candidate/dist/publishing/deployment.json';
const marker=await read(markerFile);
assert.deepEqual([marker.status,marker.commit,marker.media_commit,marker.manifest_sha256],
  ['PRIVATE_BUILT_NOT_PUBLISHED',head,media,MANIFEST_SHA]);
const stage=await read(path.join(root,'staged.json'));
assert.deepEqual([stage.status,stage.head,stage.media_commit,stage.manifest_sha256,stage.source_sha256],
  ['PRIVATE_STAGE_BUILT',head,media,MANIFEST_SHA,manifest.source.sha256]);
const browserBytes=await fs.readFile('browser-receipts/result.json');
const browser=JSON.parse(browserBytes);
assert.equal(browser.release_id,manifest.id);
assert.equal(browser.scope,'PRIVATE_PREFLIGHT');
assert.equal(browser.physical_device_test,false);
const profiles=['desktop-chromium','phone-chromium','phone-webkit'];
assert.equal(browser.checks.length,12);
const allowedVisits=[[1,'first'],[377,'same-session'],[514,'same-session'],[514,'fresh-last']];
assert.deepEqual(browser.checks.map(({profile,page,visit,result})=>[profile,page,visit,result]),
  profiles.flatMap(profile=>allowedVisits.map(([page,visit])=>[profile,page,visit,'PASS'])));
const pdf=createHash('sha256');
for await (const bytes of createReadStream(path.join(root,'finished.pdf'))) pdf.update(bytes);
const pdf_readback_sha256=pdf.digest('hex');
const pins={delivery_release_id:457833249,delivery_asset_id:790723467};
const proof={status:'PRIVATE_PREFLIGHT_ONLY',not_an_approval_or_publication:true,
  release:manifest.id,pages:514,head,tree,reviewed_head,main_snapshot,media,registered_head,registered_tree,
  manifest_sha256:MANIFEST_SHA,source_sha256:manifest.source.sha256,pdf_sha256:manifest.pdf.sha256,
  pdf_readback_sha256,source_release_id:manifest.delivery.source_release_id,source_asset_id:manifest.delivery.source_asset_id,...pins,
  packaged_bytes:pack.deployedBytes+(await fs.stat(markerFile)).size,browser_check_count:12,physical_device_test:false,
  profiles,browser_receipt_sha256:sha(browserBytes),package_policy_sha256:sha(p),run,attempt};
assertPrivateProofMatch(proof,manifest,{provenance:'TRUSTED_PRIVATE_PREFLIGHT_READBACK',head,tree,reviewed_head,main_snapshot,media,registered_head,registered_tree,manifest_sha256:MANIFEST_SHA},pins);
// This is the only downloadable artifact. It contains pins and test counts, never source bytes.
await fs.writeFile('private-preflight-receipt.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
