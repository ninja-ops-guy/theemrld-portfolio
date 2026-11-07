import { createStore, U } from './linked-store.mjs';

export function paintingGate(record) {
  if (!U.validateSource(record?.source) || !record.runs.k?.ended) return {
    unlocked: false, binding: null,
    message: 'Continue the linked story in TechOps Hero and See World to open this painting.'
  };
  const { profileId, playthroughId } = record.source.binding;
  return {
    unlocked: true, binding: profileId + '/' + playthroughId,
    message: 'The painting is open. Step through to meet Ascended K.'
  };
}

export function readPaintingGate(storage) {
  const store = createStore(storage);
  const source = store.source();
  if (!U.validateSource(source)) return paintingGate(null);
  try { return paintingGate(store.read(source)); }
  catch {
    return { ...paintingGate(null),
      message: 'Linked story progress could not be verified. Your save has been preserved.' };
  }
}

export function paintingProgressChanged(key) {
  return !key || key === U.KEYS.source || key === U.KEYS.game ||
    key === U.KEYS.campaign || key.startsWith(U.KEYS.see);
}
