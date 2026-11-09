import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useKMusic } from '../sections/AsciiCityWorld';
import useReaderPosition from '../hooks/useReaderPosition';
import useStoryApi from '../hooks/useStoryApi';
import FourBeatPulse from './FourBeatPulse';
import './StoryTerminal.css';

/** A scoped command boundary for the existing terminal; unrelated commands fall through. */
export default function StoryTerminal({ children }: { children: ReactNode }) {
  const { score, scoreSource, playTrack, sendCommand, audio } = useKMusic();
  const position = useReaderPosition();
  const api = useStoryApi();
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState('');
  const target = useMemo(() => api?.resolveSoundtrackLink(score, location.search) ?? null, [api, score, location.search]);
  const hasCue = new URLSearchParams(location.search).has('cue');
  const resume = api?.comicHref(position);
  // Display the requested song without issuing a transport command. The shared
  // player's select(false) path selects first and pauses afterward; only the
  // explicit Play button may change the track, preserving background playback.

  const command = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.matches('.kt-input')) return;
    const result = api ? api.resolveStoryCommand(input.value, { score, position })
      : /^(comic|register|verify|cutoff)(?:\s|$)/i.test(input.value.trim())
        ? { kind: 'message' as const, text: 'The reader connection is not ready. Reload to retry; music commands remain available.' } : null;
    if (!result) return;
    event.preventDefault();
    event.stopPropagation();
    if (result.kind === 'navigate') navigate(result.href);
    else setNotice(result.text);
  };

  return <div className="story-terminal" onKeyDownCapture={command}>
    <section className="story-terminal-bar" aria-label="TechOps Hero reader connection">
      <FourBeatPulse label="K Terminal · count-in" />
      <div className="story-terminal-links">
        {resume && position
          ? <Link to={resume}>Resume TechOps Hero · p. {position.page}<small>{api?.GUIDED_EDITIONS[position.edition].label}</small></Link>
          : <Link to="/comic?edition=f">Read TechOps Hero</Link>}
        <details><summary>Comic commands</summary>
          <p><code>comic 197</code> · <code>comic resume</code> · <code>comic xiii 12</code> · <code>register</code></p>
          <p>Use a soundtrack cue ID or a hyphenated song title after its page assignment is defined. Song mappings follow the selected published or local-preview score.</p>
        </details>
      </div>
      {target && <div className="story-terminal-track" aria-label="Selected comic soundtrack">
        <strong>{target.cue.title}</strong>
        <span>{scoreSource === 'draft' ? 'Local preview' : 'Published cue'} · p. {target.position.page}</span>
        <button onClick={() => { sendCommand('background on'); if (audio.current?.url === target.cue.url) sendCommand('resume'); else playTrack(target.cue, true); }}>Play this song</button>
        <Link to={api!.comicHref(target.position)!}>Return to this page</Link>
        <Link to={api!.comicHref({ ...target.position, page: target.cue.startPage })!}>Read song scene</Link>
      </div>}
      {hasCue && !target && <p role="status">{score ? 'This soundtrack link no longer matches the active edition and score. No replacement track was selected.' : 'Loading the soundtrack definition. No track will autoplay.'}</p>}
    </section>
    {children}
    {notice && <aside className="story-command-notice" role="status"><p>{notice}</p><button onClick={() => setNotice('')}>Dismiss</button></aside>}
  </div>;
}
