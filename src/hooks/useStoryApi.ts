import { useEffect, useState } from 'react';

type StoryApi = typeof import('../../public/k-world/story.js');
let pending: Promise<StoryApi> | undefined;

// Public modules are shared with the unbundled player. Match its runtime-import
// strategy instead of asking Vite to bundle JavaScript from the public directory.
export function loadStoryApi(): Promise<StoryApi> {
  if (!pending) pending = (import(/* @vite-ignore */ `${import.meta.env.BASE_URL}k-world/story.js`) as Promise<StoryApi>)
    .catch(error => { pending = undefined; throw error; });
  return pending;
}

export default function useStoryApi() {
  const [api, setApi] = useState<StoryApi | null>(null);
  useEffect(() => {
    let active = true;
    void loadStoryApi().then(value => { if (active) setApi(value); }).catch(() => { /* Existing reader/music remain available. */ });
    return () => { active = false; };
  }, []);
  return api;
}
