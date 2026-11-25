
import test from 'node:test';
import assert from 'node:assert/strict';
import { assertPrivatePreflightTarget } from '../scripts/publisher-private-boundary.mjs';
const repoName='ninja-ops-guy/theemrld-portfolio';
const main='1'.repeat(40), head='2'.repeat(40), manifest='3'.repeat(64);
const setup=()=>({
  context:{eventName:'workflow_dispatch',ref:'refs/heads/main',repo:{owner:'ninja-ops-guy',repo:'theemrld-portfolio'},
    actor:'ninja-ops-guy',triggeringActor:'ninja-ops-guy',sha:main},
  observed:{main,candidate:head,manifest_sha256:manifest,pr:{number:138,state:'open',merged:false,draft:true,
    base:{ref:'main',sha:main,repo:{full_name:repoName}},
    head:{ref:'release/techops-ixiv-9b2f94974027',sha:head,repo:{full_name:repoName}}},
    paths:['src/pages/LatestComicReader.css','src/pages/LatestComicReader.tsx','src/pages/TechOpsComic.tsx',
      'tests/comic-final-browser.py','tests/comic-final-polish.py','tests/comic-music-browser.py']},
  expected:{main,reviewed_head:head,manifest_sha256:manifest}
});
const check=({context,observed,expected})=>assertPrivatePreflightTarget(context,observed,expected);
test('exact owner preflight is qualified for read-only intake, not for publishing',()=>{
  assert.deepEqual(check(setup()),{phase:'OWNER_PRIVATE_PREFLIGHT_TARGET_MATCH',publication_approved:false});
});
for(const [name,mutate] of [
  ['request made by collaborator',x=>x.context.actor='collaborator'],
  ['run retriggered by collaborator',x=>x.context.triggeringActor='collaborator'],
  ['push trigger',x=>x.context.eventName='push'],
  ['workflow loaded from a non-main ref',x=>x.context.ref='refs/heads/topic'],
  ['workflow loaded from an obsolete main commit',x=>x.context.sha='4'.repeat(40)],
  ['candidate pushed after original review',x=>x.observed.pr.head.sha='4'.repeat(40)],
  ['manifest changed',x=>x.observed.manifest_sha256='4'.repeat(64)],
  ['candidate branch replaced with fork',x=>x.observed.pr.head.repo.full_name='fork/theemrld-portfolio'],
  ['workflow or build script added',x=>x.observed.paths.push('.github/workflows/pages.yml')],
  ['duplicate path substituted for reviewed file',x=>x.observed.paths[0]=x.observed.paths[1]],
  ['candidate already merged',x=>x.observed.pr.merged=true],
]) test('denies '+name,()=>{
  const input=setup();mutate(input);
  assert.throws(()=>check(input),/PRIVATE_SOURCE_HOLD/);
});


const registered=[
  'public/k-world/guided-cues.json','public/k-world/guided.js',
  'publishing/releases/ixiv-9b2f94974027.json','src/data/comic-current-editions.json',
  'src/data/comic-display-labels.json','src/data/comic-optional-tracks.json',
  'tests/comic-corrected-release.test.mjs','tests/comic-optional-tracks.test.mjs',
];
test('registered mode requires all exact registration paths, not just approval UI or draft assets',()=>{
  const i=setup();
  const check=()=>assertPrivatePreflightTarget(i.context,i.observed,i.expected,{registered:true});
  assert.throws(check,/PRIVATE_SOURCE_HOLD/);
  i.observed.paths.push(...registered);
  assert.equal(check().publication_approved,false);
  i.observed.paths[7]='techops-comic/volumes-i-xiv/001.webp';
  assert.throws(check,/PRIVATE_SOURCE_HOLD/);
});

test('trusted current main and reviewed PR base are separate exact identities',()=>{
  const i=setup(), previous='9'.repeat(40);
  i.observed.pr.base.sha=previous;
  i.expected.reviewed_base=previous;
  i.observed.merge_base=previous;
  assert.equal(check(i).publication_approved,false);
  i.observed.merge_base='8'.repeat(40);
  assert.throws(()=>check(i),/reviewed base mismatch/);
  i.observed.merge_base=previous;
  i.observed.main=previous;
  assert.throws(()=>check(i),/trusted main changed/);
});
