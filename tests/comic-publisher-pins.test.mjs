import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBookPins } from '../scripts/finalize-comic-dist.mjs';
const repo='ninja-ops-guy/theemrld-portfolio';
function manifest(override={}) {
 const media='a'.repeat(40);
 return {mediaCommit:media,releaseTag:'original',books:{xiv:{pdfFilename:'Book.pdf',imagePath:'techops-comic/volume-xiv/',imageBase:`https://raw.githubusercontent.com/${repo}/${media}/techops-comic/volume-xiv/`,pdfUrl:`https://github.com/${repo}/releases/download/original/Book.pdf`,...override}}};
}
test('existing global immutable pins remain valid',()=>assert.equal(validateBookPins(manifest(),'xiv').releaseTag,'original'));
test('per-book revision does not require changing other editions',()=>{
 const media='b'.repeat(40);const m=manifest({mediaCommit:media,releaseTag:'new-revision',imageBase:`https://raw.githubusercontent.com/${repo}/${media}/techops-comic/volume-xiv/`,pdfUrl:`https://github.com/${repo}/releases/download/new-revision/Book.pdf`});
 assert.equal(validateBookPins(m,'xiv').mediaCommit,media);assert.equal(m.mediaCommit,'a'.repeat(40));
});
test('placeholder pin fails',()=>assert.throws(()=>validateBookPins(manifest({mediaCommit:'NEW_XIV_MEDIA_COMMIT'}),'xiv')));
test('substring fake image pin fails',()=>assert.throws(()=>validateBookPins(manifest({imageBase:`https://evil.example/${'a'.repeat(40)}/` }),'xiv')));
test('wrong master under same release fails',()=>assert.throws(()=>validateBookPins(manifest({pdfUrl:`https://github.com/${repo}/releases/download/original/Other.pdf` }),'xiv')));
