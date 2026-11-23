import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCatalogue} from '../scripts/finalize-comic-dist.mjs';
import {requireCollectionAcceptance} from '../scripts/publisher-control.mjs';
const fixture = () => [{schemaVersion:1,publicationPolicy:'current-only',books:[{id:'g',pageCount:316},{id:'xv',pageCount:22}]},{imageCount:338,books:{g:{pageCount:316},xv:{pageCount:22}}},{g:{label:'Full collection'},xv:{label:'Volume XV'}}];
test('reviewed additional volume is accepted without changing existing book counts',()=>assert.deepEqual(validateCatalogue(...fixture()),{g:316,xv:22}));
test('catalogue rejects missing reader, labels, duplicate IDs, count drift and retired books',()=>{
 for(const mutate of [f=>delete f[1].books.xv,f=>delete f[2].xv,f=>f[0].books.push(f[0].books[0]),f=>f[1].books.g.pageCount++,f=>f[1].imageCount++,f=>f[0].books[1].id='f']) {const f=fixture();mutate(f);assert.throws(()=>validateCatalogue(...f));}
});
const run=(id=1,head='a',conclusion='success')=>({id,head_sha:head,path:'.github/workflows/comic-final-collection.yml',status:'completed',conclusion});
test('collection acceptance requires exact head and latest successful completion',()=>{
 assert.equal(requireCollectionAcceptance([run()], 'a'),1);
 for(const runs of [[],[run(1,'b')],[run(1,'a','failure')],[run(),run(2,'a','failure')],[{...run(),status:'in_progress'}]]) assert.throws(()=>requireCollectionAcceptance(runs,'a'));
});
