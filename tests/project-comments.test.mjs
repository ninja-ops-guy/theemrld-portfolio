import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/projectComments.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } });
const { prepareProjectComment, readProjectCommentDraft, PROJECT_COMMENTS_URL } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('Comment handoff preserves punctuation and multiline content as data', () => {
  const message = 'Love K & Iona!\nPlease add "RIDE OR DIE"? #comic <script>alert(1)</script>';
  const result = prepareProjectComment({ title: 'Music & comic = ❤️', message }, 'Revision F / page 34');
  const url = new URL(result.url);
  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.pathname, '/ninja-ops-guy/theemrld-portfolio/issues/new');
  assert.equal(url.searchParams.get('title'), '[Project comment] Music & comic = ❤️');
  assert.ok(url.searchParams.get('body').includes(message));
  assert.ok(url.searchParams.get('body').includes('Context: Revision F / page 34'));
  assert.equal(url.hash, '');
  assert.equal([...url.searchParams.keys()].length, 2);
});

test('Blank comments cannot open a submission and a blank subject gets a useful default', () => {
  assert.equal(prepareProjectComment({ title: 'Hello', message: ' \n\t ' }).url, null);
  const url = new URL(prepareProjectComment({ title: '', message: 'More music please.' }).url);
  assert.equal(url.searchParams.get('title'), '[Project comment] Feedback');
});

test('Length limits prevent oversized issue URLs, including heavily escaped Unicode', () => {
  assert.equal(prepareProjectComment({ title: '', message: 'a'.repeat(1001) }).url, null);
  assert.equal(prepareProjectComment({ title: 'a'.repeat(81), message: 'Hello' }).url, null);
  assert.equal(prepareProjectComment({ title: '', message: '界'.repeat(1000) }).url, null);
  assert.ok(prepareProjectComment({ title: '', message: 'a'.repeat(1000) }).url);
});

test('Malformed or obsolete local drafts are bounded and never treated as posted feedback', () => {
  for (const value of [null, '{bad', 'null', '42']) {
    assert.deepEqual(readProjectCommentDraft(value), { title: '', message: '' });
  }
  assert.deepEqual(readProjectCommentDraft('{"title":123,"message":"Still a draft"}'), { title: '', message: 'Still a draft' });
  assert.equal(readProjectCommentDraft(JSON.stringify({ title: 'a'.repeat(120), message: 'a'.repeat(2000) })).message.length, 1000);
  assert.equal(readProjectCommentDraft(JSON.stringify({ title: 'a'.repeat(120) })).title.length, 80);
});

test('Feedback list searches the project comment title marker across open and closed issues', () => {
  const url = new URL(PROJECT_COMMENTS_URL);
  assert.equal(url.pathname, '/ninja-ops-guy/theemrld-portfolio/issues');
  assert.equal(url.searchParams.get('q'), 'is:issue "[Project comment]" in:title');
});
