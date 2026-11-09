import { useEffect, useState } from 'react';
import type { GuidedPosition } from '../../public/k-world/guided.js';
import useStoryApi, { loadStoryApi } from './useStoryApi';

let sessionPosition: GuidedPosition | null = null;
let operation = 0;
function storage() { try { return window.localStorage; } catch { return null; } }

/** Call only after the requested page artwork successfully loads. */
export function rememberReaderPosition(value: unknown) {
  const request = ++operation;
  void loadStoryApi().then(api => {
    if (request !== operation) return;
    const position = api.normalizeReaderPosition(value);
    if (!position) return;
    sessionPosition = position;
    api.writeReaderPosition(storage(), position);
    window.dispatchEvent(new CustomEvent(api.READER_POSITION_EVENT, { detail: position }));
  }).catch(() => { /* The reader's existing edition bookmark still works. */ });
}

export default function useReaderPosition() {
  const api = useStoryApi();
  const [position, setPosition] = useState<GuidedPosition | null>(sessionPosition);
  useEffect(() => {
    if (!api) return;
    const refresh = () => setPosition(sessionPosition || api.readReaderPosition(storage()));
    const local = (event: Event) => {
      const next = api.normalizeReaderPosition((event as CustomEvent<unknown>).detail);
      if (next) setPosition(next);
    };
    const remote = (event: StorageEvent) => {
      if (event.key === null || event.key === api.READER_POSITION_KEY || Object.values(api.BOOKMARK_KEYS).includes(event.key)) {
        ++operation;
        sessionPosition = null;
        refresh();
      }
    };
    window.addEventListener(api.READER_POSITION_EVENT, local);
    window.addEventListener('storage', remote);
    refresh();
    return () => {
      window.removeEventListener(api.READER_POSITION_EVENT, local);
      window.removeEventListener('storage', remote);
    };
  }, [api]);
  return position;
}
