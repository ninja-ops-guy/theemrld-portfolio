import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUIDED_EDITIONS } from '../public/k-world/guided.js';

const readJson = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const data = readJson('../src/data/comic-visual-registers.json');
const sceneIndex = readJson('../src/data/comic.json');
const revisionF = readJson('../src/data/comic-revision-f.json');

test('defines the six distinct reader registers', () => {
  assert.deepEqual(Object.keys(data.registers).sort(), [
    'celestial_event', 'mike_memory_feed', 'objective_present',
    'orpheus_provisional_model', 'personal_recollection', 'stored_evidence'
  ]);
});

test('binds each sample to an exact edition, art revision, and valid page', () => {
  const keys = new Set();
  for (const entry of data.annotations) {
    const edition = GUIDED_EDITIONS[entry.edition];
    assert.ok(edition, 'known edition');
    assert.equal(entry.artRevision, edition.revision);
    assert.ok(Number.isInteger(entry.pageIndex) && entry.pageIndex >= 1 && entry.pageIndex <= edition.pageCount);
    const key = [entry.edition, entry.artRevision, entry.pageIndex].join(':');
    assert.ok(!keys.has(key), 'annotation key is unique');
    keys.add(key);
  }
  assert.equal(revisionF.pageCount, GUIDED_EDITIONS.f.pageCount);
  assert.equal(GUIDED_EDITIONS.f.pageCount, 316);
});

test('keeps the supplied scene titles bound to the legacy edition', () => {
  for (const [page, title] of [
    [13, 'What Orpheus was'],
    [33, 'Red and Iona / recollection'],
    [77, 'The celestial encounter / Tea and regalia']
  ]) {
    assert.ok(sceneIndex.scenes.some(scene => scene.page === page && scene.title === title));
    assert.ok(data.annotations.some(entry => entry.edition === 'legacy' && entry.pageIndex === page));
  }
  assert.ok(!data.annotations.some(entry => entry.edition === 'f' && [13,33,77].includes(entry.pageIndex) && entry.sceneIndexTitle));
});

test('requires scope and provenance for every record classification', () => {
  for (const entry of data.annotations) {
    for (const panel of entry.panels) {
      if (panel.registers.includes('stored_evidence')) {
        assert.ok(panel.evidenceSource?.trim());
        assert.ok(panel.claimScope?.trim());
      }
    }
  }
});

test('unresolved panels cannot inherit a register silently', () => {
  for (const entry of data.annotations) {
    const pending = entry.panels.filter(panel => panel.status === 'needs_creator_review');
    if (pending.length) assert.equal(entry.status, 'needs_creator_review');
    for (const panel of pending) {
      assert.deepEqual(panel.registers, []);
      assert.ok(panel.candidateRegisters?.length);
      assert.ok(panel.candidateRegisters.every(key => key in data.registers));
    }
  }
});

test('does not conflate the memory feed, personal recollection, records, and celestial events', () => {
  assert.ok(data.separationRules.some(rule => rule.id === 'ORPHEUS_IS_NOT_EVIDENCE'));
  assert.ok(data.separationRules.some(rule => rule.id === 'FEED_IS_NOT_PERSONAL_MEMORY'));
  assert.ok(data.separationRules.some(rule => rule.id === 'RECOLLECTION_IS_NOT_RECORD'));
  assert.ok(data.separationRules.some(rule => rule.id === 'RECORD_SCOPE_IS_BOUNDED'));
  assert.ok(data.separationRules.some(rule => rule.id === 'CELESTIAL_IS_NOT_SIMULATION'));
  const recollection = data.annotations.find(entry => entry.edition === 'legacy' && entry.pageIndex === 33);
  assert.ok(recollection.panels.some(panel => panel.registers.includes('personal_recollection')));
  assert.ok(!recollection.panels.some(panel => panel.registers.includes('mike_memory_feed')));
  const celestial = data.annotations.find(entry => entry.edition === 'legacy' && entry.pageIndex === 77);
  assert.equal(celestial.chronology, 'unresolved');
  assert.ok(celestial.panels.some(panel => panel.registers.includes('celestial_event')));
});
