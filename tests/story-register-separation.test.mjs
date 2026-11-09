import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../src/data/comic-visual-registers.json', import.meta.url), 'utf8'));
const findPage = (edition, pageIndex) => {
  const entry = data.annotations.find(item => item.edition === edition && item.pageIndex === pageIndex);
  assert.ok(entry, `annotation exists for ${edition} page ${pageIndex}`);
  return entry;
};
const findPanel = (entry, order) => {
  const panel = entry.panels.find(item => item.order === order);
  assert.ok(panel, `panel ${order} exists on ${entry.edition} page ${entry.pageIndex}`);
  return panel;
};

test('ORPHEUS display and explanatory art remain unresolved until evidence source is separated', () => {
  const fMonitor = findPanel(findPage('f', 77), 3);
  assert.equal(fMonitor.status, 'needs_creator_review');
  assert.deepEqual(fMonitor.registers, []);
  assert.deepEqual(new Set(fMonitor.candidateRegisters), new Set(['stored_evidence', 'orpheus_provisional_model']));
  assert.equal(fMonitor.evidenceSource, undefined);

  const legacyGraphic = findPanel(findPage('legacy', 13), 4);
  assert.equal(legacyGraphic.status, 'needs_creator_review');
  assert.deepEqual(legacyGraphic.registers, []);
  assert.deepEqual(new Set(legacyGraphic.candidateRegisters), new Set(['objective_present', 'orpheus_provisional_model']));
});

test('Iona recollection stays separate from Mike feed and stored evidence', () => {
  const page = findPage('legacy', 33);
  const memory = findPanel(page, 2);
  assert.deepEqual(memory.registers, ['personal_recollection']);
  assert.equal(memory.registers.includes('mike_memory_feed'), false);
  assert.equal(memory.registers.includes('stored_evidence'), false);
  assert.match(memory.note, /not an independent recording/i);
});

test('the damaged record is scoped and does not absorb the recollection panel', () => {
  const page = findPage('legacy', 33);
  for (const order of [1, 3]) {
    const panel = findPanel(page, order);
    assert.ok(panel.registers.includes('stored_evidence'));
    assert.ok(panel.evidenceSource?.trim());
    assert.ok(panel.claimScope?.trim());
    assert.match(panel.claimScope, /only|fragment|gaps/i);
  }
  assert.equal(findPanel(page, 2).registers.includes('stored_evidence'), false);
});

test('actual celestial panels stay distinct from memories and ORPHEUS models', () => {
  const page = findPage('legacy', 77);
  assert.equal(page.chronology, 'unresolved');
  for (const order of [3, 4, 5]) {
    const panel = findPanel(page, order);
    assert.deepEqual(panel.registers, ['celestial_event']);
    assert.equal(panel.registers.includes('personal_recollection'), false);
    assert.equal(panel.registers.includes('orpheus_provisional_model'), false);
    assert.equal(panel.registers.includes('stored_evidence'), false);
  }
  assert.equal(findPanel(page, 1).status, 'needs_creator_review');
  assert.equal(findPanel(page, 2).status, 'needs_creator_review');
});

test('stored-evidence sample labels remain bound to explicit claims, not a score alone', () => {
  const fLog = findPanel(findPage('f', 13), 1);
  assert.ok(fLog.registers.includes('stored_evidence'));
  assert.ok(fLog.evidenceSource?.trim());
  assert.ok(fLog.claimScope?.trim());
  assert.match(fLog.claimScope, /does not independently prove/i);
  const message = findPanel(findPage('f', 33), 3);
  assert.match(message.claimScope, /does not independently authenticate/i);
});
