import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ProjectCommentDialog from '../components/ProjectCommentDialog';
import GuidedScoreDialog from '../components/GuidedScoreDialog';
import type { GuidedScore } from '../../public/k-world/guided.js';
import './KMusicSession.css';

export type MusicTrack = { id: string; title: string; url: string; provider?: string; slot?: number; createdAt?: string | null };
export type ReaderPosition = { edition: string; page: number; revision: string };
export type MusicState = {
  current: MusicTrack | null; status: string; position: number; positionSampledAt?: number | null; duration: number;
  volume: number; mode: string; rate: number; zone: string | null; pendingZone: string | null;
  pausedByUser: boolean; error: string | null;
};
const INITIAL_AUDIO: MusicState = { current: null, status: 'idle', position: 0, duration: 0, volume: 55, mode: 'auto', rate: 1, zone: null, pendingZone: null, pausedByUser: false, error: null };
const PREVIEW_KEY = 'k-world:guided-preview:v1';
type SessionMessage = { type: string; [key: string]: unknown };
type MusicContextValue = {
  audio: MusicState; catalogue: MusicTrack[]; catalogueStatus: string;
  background: boolean; guided: boolean; guidedNotice: string; scoreSource: 'published' | 'draft';
  sendCommand: (raw: string) => void;
  playTrack: (track: { url: string; title: string }, autoplay?: boolean) => void;
  setVolume: (volume: number) => void; seek: (ms: number) => void;
  openComments: () => void; openScore: () => void; openSoundCloud: () => void;
  setReader: (position: ReaderPosition | null) => void; usePublishedScore: () => void;
};
const MusicContext = createContext<MusicContextValue | null>(null);
export function useKMusic() {
  const session = useContext(MusicContext);
  if (!session) throw new Error('K music controls must be inside the persistent session.');
  return session;
}
const guidedApi = () => import(/* @vite-ignore */ `${import.meta.env.BASE_URL}k-world/guided.js`) as Promise<typeof import('../../public/k-world/guided.js')>;

/** One iframe owns music across both terminal interfaces and the comic reader.
 * It is never remounted on navigation; the 3D renderer sleeps outside K World.
 * A direct reader visit starts no player or sound until the visitor asks for it.
 */
export default function AsciiCityWorld({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const worldVisible = location.pathname === '/k' || location.pathname.startsWith('/k/');
  const terminalVisible = location.pathname === '/terminal';
  const [started, setStarted] = useState(worldVisible || terminalVisible);
  const [ready, setReady] = useState(false);
  const [source] = useState(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    const scene = worldVisible ? new URLSearchParams(location.search).get('scene') || parts[parts.length - 1] || 'gallery' : 'player';
    return `${import.meta.env.BASE_URL}k-world/index.html?hosted=1&entry=${encodeURIComponent(scene)}`;
  });
  const frame = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  const pending = useRef<SessionMessage[]>([]);
  const hostRef = useRef({ worldVisible, terminalVisible });
  hostRef.current = { worldVisible, terminalVisible };
  const readerRef = useRef<ReaderPosition | null>(null);
  const scoreRef = useRef<GuidedScore | undefined>(undefined);
  const scoreOperation = useRef(0);
  const [audio, setAudio] = useState<MusicState>(INITIAL_AUDIO);
  const [catalogue, setCatalogue] = useState<MusicTrack[]>([]);
  const [catalogueStatus, setCatalogueStatus] = useState('Checking the release catalogue…');
  const [background, setBackground] = useState(false);
  const [guided, setGuided] = useState(false);
  const [guidedNotice, setGuidedNotice] = useState('Choose the songs for each part of the comic.');
  const [score, setScore] = useState<GuidedScore>();
  const [scoreSource, setScoreSource] = useState<'published' | 'draft'>('published');
  const [scoreOpen, setScoreOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [providerOpen, setProviderOpen] = useState(false);
  const [sessionError, setSessionError] = useState('');

  const post = useCallback((message: SessionMessage) => {
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);
  const send = useCallback((message: SessionMessage) => {
    setStarted(true);
    if (readyRef.current) post(message);
    else pending.current = [...pending.current.slice(-49), message];
  }, [post]);
  const sendCommand = useCallback((raw: string) => send({ type: 'k-world:command', raw }), [send]);
  const playTrack = useCallback((track: { url: string; title: string }, autoplay = true) => send({ type: 'k-world:select', track, autoplay }), [send]);
  const setVolume = useCallback((volume: number) => send({ type: 'k-world:volume', volume }), [send]);
  const seek = useCallback((ms: number) => send({ type: 'k-world:seek', ms }), [send]);
  const openComments = useCallback(() => setCommentsOpen(true), []);
  const openSoundCloud = useCallback(() => setProviderOpen(true), []);
  const openScore = useCallback(() => setScoreOpen(true), []);
  const setReader = useCallback((position: ReaderPosition | null) => {
    readerRef.current = position;
    if (readyRef.current) post({ type: 'k-world:reader', position });
  }, [post]);

  const applyScore = useCallback((next: GuidedScore) => {
    ++scoreOperation.current;
    scoreRef.current = next;
    setScore(next);
    setScoreSource('draft');
    try { localStorage.setItem(PREVIEW_KEY, JSON.stringify(next)); } catch { /* The current session still supports preview. */ }
    if (readyRef.current) post({ type: 'k-world:score', score: next, source: 'draft' });
  }, [post]);
  const usePublishedScore = useCallback(() => {
    const operation = ++scoreOperation.current;
    void Promise.all([guidedApi(), fetch(`${import.meta.env.BASE_URL}k-world/guided-cues.json`, { cache: 'no-store' }).then(r => {
      if (!r.ok) throw new Error('The published soundtrack could not be loaded.');
      return r.json();
    })]).then(([api, raw]) => {
      const next = api.validateGuidedScore(raw);
      if (scoreOperation.current !== operation) return;
      try { localStorage.removeItem(PREVIEW_KEY); } catch { /* Storage is optional. */ }
      scoreRef.current = next; setScore(next); setScoreSource('published');
      if (readyRef.current) post({ type: 'k-world:score', score: next, source: 'published' });
    }).catch(() => { if (scoreOperation.current === operation) setSessionError('The published soundtrack is unavailable. Your current soundtrack is unchanged.'); });
  }, [post]);

  useEffect(() => {
    let active = true;
    const operation = ++scoreOperation.current;
    void guidedApi().then(async api => {
      let preview: string | null = null;
      try { preview = localStorage.getItem(PREVIEW_KEY); } catch { /* Optional local preview. */ }
      let next: GuidedScore | undefined;
      if (preview) { try { next = api.parseGuidedScore(preview); } catch { /* Ignore a damaged local draft. */ } }
      const isDraft = Boolean(next);
      if (!next) {
        const response = await fetch(`${import.meta.env.BASE_URL}k-world/guided-cues.json`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Published soundtrack unavailable');
        next = api.validateGuidedScore(await response.json());
      }
      if (!active || scoreOperation.current !== operation) return;
      scoreRef.current = next; setScore(next); setScoreSource(isDraft ? 'draft' : 'published');
      if (readyRef.current) post({ type: 'k-world:score', score: next, source: isDraft ? 'draft' : 'published' });
    }).catch(() => { if (active && scoreOperation.current === operation) setGuidedNotice('Soundtrack definitions are unavailable. Open Define songs to start a local preview.'); });
    return () => { active = false; };
  }, [post]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data.type !== 'string') return;
      switch (data.type) {
        case 'k-world:ready':
          readyRef.current = true; setReady(true); setSessionError('');
          post({ type: 'k-world:host', ...hostRef.current });
          if (scoreRef.current) post({ type: 'k-world:score', score: scoreRef.current });
          post({ type: 'k-world:reader', position: readerRef.current });
          for (const message of pending.current.splice(0)) post(message);
          break;
        case 'k-world:state':
          if (data.audio && typeof data.audio.status === 'string') setAudio(data.audio);
          setBackground(data.background === true); setGuided(data.guided === true);
          if (typeof data.guidedNotice === 'string') setGuidedNotice(data.guidedNotice);
          break;
        case 'k-world:catalogue':
          if (Array.isArray(data.tracks)) setCatalogue(data.tracks);
          if (typeof data.status === 'string') setCatalogueStatus(data.status);
          break;
        case 'k-world:provider-close': setProviderOpen(false); break;
        case 'k-world:comment': setCommentsOpen(true); break;
        case 'k-world:guided-editor': setScoreOpen(true); break;
        case 'k-world:comic': navigate('/comic?from=world'); break;
        case 'k-world:portfolio': navigate('/'); break;
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [navigate, post]);

  useEffect(() => {
    if (worldVisible || terminalVisible) setStarted(true);
    if (!ready) return;
    post({ type: 'k-world:host', worldVisible, terminalVisible });
    if (worldVisible) {
      const parts = location.pathname.split('/').filter(Boolean);
      const scene = new URLSearchParams(location.search).get('scene') || parts[parts.length - 1] || 'gallery';
      post({ type: 'k-world:navigate', scene });
    }
  }, [location.pathname, location.search, worldVisible, terminalVisible, ready, post]);
  useEffect(() => {
    const panel = new URLSearchParams(location.search).get('panel');
    if (panel === 'comment') setCommentsOpen(true);
    if (panel === 'guided') setScoreOpen(true);
  }, [location.search]);
  useEffect(() => {
    if (!started || ready) return;
    const timeout = window.setTimeout(() => setSessionError('The music player is taking longer than expected. Reload the page to retry.'), 20000);
    return () => window.clearTimeout(timeout);
  }, [started, ready]);
  useEffect(() => {
    const refresh = () => { if (!document.hidden && readyRef.current) post({ type: 'k-world:refresh' }); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [post]);

  const isComic = location.pathname === '/comic';
  const providerVisible = isComic && providerOpen;
  useEffect(() => {
    if (!isComic) setProviderOpen(false);
  }, [isComic]);
  useEffect(() => {
    if (ready) post({ type: 'k-world:provider', open: providerVisible });
  }, [ready, providerVisible, post]);

  const value = useMemo<MusicContextValue>(() => ({ audio, catalogue, catalogueStatus, background, guided, guidedNotice, scoreSource, sendCommand, playTrack, setVolume, seek, openComments, openScore, openSoundCloud, setReader, usePublishedScore }), [audio, catalogue, catalogueStatus, background, guided, guidedNotice, scoreSource, sendCommand, playTrack, setVolume, seek, openComments, openScore, openSoundCloud, setReader, usePublishedScore]);
  return <MusicContext.Provider value={value}>
    {children}
    {started && <iframe
      ref={frame} src={source}
      title={providerVisible ? 'SoundCloud soundtrack controls' : 'K // THE EMRLD — shared world and music player'}
      allow="autoplay; fullscreen" referrerPolicy="strict-origin-when-cross-origin"
      tabIndex={worldVisible || providerVisible ? 0 : -1} aria-hidden={!worldVisible && !providerVisible} inert={!worldVisible && !providerVisible}
      className={worldVisible ? 'k-session-frame' : providerVisible ? 'k-session-frame k-session-frame-provider' : 'k-session-frame k-session-frame-background'}
    />}
    {sessionError && <div className="k-session-error" role="status">{sessionError}<button onClick={() => setSessionError('')} aria-label="Dismiss music notice">×</button></div>}
    {!worldVisible && !terminalVisible && !isComic && audio.current && background && <aside className="k-music-floating" aria-label="Background music">
      <span>{audio.current.title}</span>
      <button onClick={() => sendCommand(audio.status === 'playing' ? 'pause' : 'resume')}>{audio.status === 'playing' ? 'Pause' : 'Resume'}</button>
      <button onClick={() => sendCommand('background off')}>Stop background</button>
      <Link to="/terminal">K Terminal</Link>
    </aside>}
    <ProjectCommentDialog open={commentsOpen} onClose={() => setCommentsOpen(false)} context={isComic ? `TechOps Hero · ${readerRef.current?.edition ?? 'collection'}${readerRef.current?.page ? ` · page ${readerRef.current.page}` : ''}` : 'K Terminal / THE EMRLD project'} />
    <GuidedScoreDialog open={scoreOpen} onClose={() => setScoreOpen(false)} onApply={applyScore} onUsePublished={usePublishedScore} initialScore={score} />
  </MusicContext.Provider>;
}
