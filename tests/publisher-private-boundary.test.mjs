import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPrivateSplit} from '../scripts/publisher-private-boundary.mjs';
const repo={owner:'ninja-ops-guy',repo:'theemrld-portfolio'};
const m={schema_version:2,edition:'ixiv',page_count:514,repository:'ninja-ops-guy/theemrld-portfolio',
 source:{tag:'private-source',asset:'source.zip',sha256:'a'.repeat(64),bytes:81},
 delivery:{tag:'reader-pdf',source_release_id:1,source_asset_id:10},
 pdf:{filename:'reader.pdf',sha256:'b'.repeat(64),bytes:32}};
const pins={delivery_release_id:2,delivery_asset_id:20};
function fixture(change=()=>{}){
 const releases={1:{id:1,tag_name:'private-source',draft:true,prerelease:true},2:{id:2,tag_name:'reader-pdf',draft:true,prerelease:false}};
 const assets={1:[{id:10,name:'source.zip',state:'uploaded',size:81,digest:'sha256:'+m.source.sha256}],2:[{id:20,name:'reader.pdf',state:'uploaded',size:32,digest:'sha256:'+m.pdf.sha256}]};
 change(releases,assets);
 return {getRelease:async a=>({data:releases[a.release_id]}),listReleaseAssets:async a=>({data:assets[a.release_id]})};
}
test('exact separate private drafts do not imply byte verification',async()=>{
 const r=await inspectPrivateSplit(fixture(),repo,m,pins);
 assert.equal(r.phase,'PRIVATE_DRAFTS_MATCH_METADATA');
 assert.equal(r.byte_readback_verified,false);
});
for(const [label,change] of [
 ['source published',r=>{r[1].draft=false;}],
 ['delivery published before approval',r=>{r[2].draft=false;}],
 ['wrong tag',r=>{r[2].tag_name='renamed';}],
 ['wrong release ID',r=>{r[2].id=4;}],
 ['ZIP attached to delivery',(_r,a)=>{a[2].push(a[1][0]);}],
 ['wrong asset ID',(_r,a)=>{a[2][0].id=21;}],
 ['wrong upload state',(_r,a)=>{a[2][0].state='open';}],
 ['wrong digest',(_r,a)=>{a[2][0].digest='sha256:'+'c'.repeat(64);}],
 ['wrong size',(_r,a)=>{a[1][0].size++;}],
 ['missing PDF',(_r,a)=>{a[2]=[];}],
]) test(label,()=>assert.rejects(inspectPrivateSplit(fixture(change),repo,m,pins),/PRIVATE_SOURCE_HOLD/));
test('refuse shared source and delivery IDs before reading',()=>assert.rejects(inspectPrivateSplit({},repo,m,{...pins,delivery_release_id:1}),/distinct exact/));

test('receipt must match exact current pins and does not approve publication',async()=>{
 const {assertPrivateProofMatch} = await import('../scripts/publisher-private-boundary.mjs');
 const current={provenance:'TRUSTED_PRIVATE_PREFLIGHT_READBACK',head:'1'.repeat(40),tree:'2'.repeat(40),
 reviewed_head:'3'.repeat(40),main_snapshot:'4'.repeat(40),media:'5'.repeat(40),manifest_sha256:'6'.repeat(64)};
 const mr={...m,id:'fixture'};
 const p={...current,...pins,status:'PRIVATE_PREFLIGHT_ONLY',not_an_approval_or_publication:true,release:mr.id,pages:514,
 source_sha256:m.source.sha256,pdf_sha256:m.pdf.sha256,pdf_readback_sha256:m.pdf.sha256,
 source_release_id:1,source_asset_id:10,packaged_bytes:149186554,browser_check_count:12,physical_device_test:false,
 profiles:['desktop-chromium','phone-chromium','phone-webkit'],browser_receipt_sha256:'7'.repeat(64),package_policy_sha256:'8'.repeat(64)};
 assert.equal(assertPrivateProofMatch(p,mr,current,pins).publication_approved,false);
 assert.throws(()=>assertPrivateProofMatch(p,mr,{...current,provenance:'PR_ARTIFACT'},pins),/provenance/);
 for(const [field,value] of Object.entries({head:'a'.repeat(40),tree:'a'.repeat(40),reviewed_head:'a'.repeat(40),
 main_snapshot:'a'.repeat(40),media:'a'.repeat(40),manifest_sha256:'a'.repeat(64),delivery_asset_id:99,
 packaged_bytes:1000000001,browser_check_count:8,pdf_readback_sha256:'c'.repeat(64),profiles:['desktop-chromium']}))
  assert.throws(()=>assertPrivateProofMatch({...p,[field]:value},mr,current,pins),/PRIVATE_SOURCE_HOLD/,field);
});
