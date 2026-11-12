import { useEffect, useRef, useState } from 'react';
import KBandSprite from './KBandSprite';
import { bandFrame, bandPosition, readBandTiming } from '../lib/bandTiming';

type Props = {
  isPlaying: boolean;
  positionMs: number;
  playbackRate?: number;
  trackTitle?: string;
  trackId?: string;
  enabled?: boolean;
};
const MEMBERS = [['K', 'GUITAR'], ['IONA', 'DRUMS'], ['FELICIA', 'BREAKDANCE'], ['WALDO', 'BREAKDANCE']];

export default function KBandStage({ isPlaying, positionMs, playbackRate = 1, trackTitle, trackId = 'preview', enabled = true }: Props) {
  const storageKey = `kt-band-timing-v1:${trackId}`;
  const [timing, setTiming] = useState(() => {
    try { return readBandTiming(localStorage.getItem(storageKey)); } catch { return readBandTiming(null); }
  });
  const [frame, setFrame] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const anchor = useRef({ positionMs, at: performance.now() });

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    anchor.current = { positionMs, at: performance.now() };
  }, [positionMs, isPlaying, playbackRate]);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(timing)); } catch { /* Playback works without storage. */ }
  }, [storageKey, timing]);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const draw = () => {
      const clock = bandPosition(anchor.current.positionMs, performance.now() - anchor.current.at, isPlaying, playbackRate);
      setFrame(reducedMotion ? 0 : bandFrame(clock, timing.bpm, timing.offsetMs));
      if (isPlaying && !reducedMotion) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [enabled, isPlaying, playbackRate, positionMs, reducedMotion, timing]);

  if (!enabled) return null;
  return (
    <div className="kt-band-stage" role="region" aria-label="TechOps Hero band" data-frame={frame} data-playing={isPlaying}>
      <div className="kt-band-top"><span>TECHOPS // LIVE</span><span className="kt-band-set">{trackTitle || 'WAITING FOR SIGNAL'}</span></div>
      <div className="kt-band-grid">
        {MEMBERS.map(([name, role], row) => <div className="kt-band-member" key={name}>
          <KBandSprite cell={row * 6 + frame} size={128} atlas="assets/techops-band-ensemble-v1.webp" />
          <strong>{name}</strong><small>{role}</small>
        </div>)}
      </div>
      <details className="kt-band-sync"><summary>Music sync · {timing.bpm} BPM</summary>
        <p>Set the song’s tempo and first beat. Saved for this track on this device.</p>
        <label>Tempo (BPM) <input type="number" min="40" max="240" step="0.1" value={timing.bpm} onChange={e => { const bpm = e.target.valueAsNumber; if (Number.isFinite(bpm) && bpm >= 40 && bpm <= 240) setTiming(t => ({ ...t, bpm })); }} /></label>
        <label>Beat offset (ms) <input type="number" min="-600000" max="600000" step="10" value={timing.offsetMs} onChange={e => { const offsetMs = e.target.valueAsNumber; if (Number.isFinite(offsetMs) && Math.abs(offsetMs) <= 600000) setTiming(t => ({ ...t, offsetMs })); }} /></label>
        <small>120 BPM is a preview tempo, not automatic beat detection.</small>
      </details>
      <style>{`
        .kt-band-stage{flex-shrink:0;position:relative;border:1px solid #00ad58;background:#070b12;margin-bottom:10px;overflow:hidden}
        .kt-band-top{display:flex;justify-content:space-between;gap:10px;padding:8px 10px;border-bottom:1px solid #214334;color:#85eaca;font-size:10px;letter-spacing:.1em}
        .kt-band-set{color:#acc8b9;max-width:58%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .kt-band-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-items:end;gap:2px;padding:8px 4px 12px}
        .kt-band-member{display:flex;min-width:0;flex-direction:column;align-items:center}
        .kt-band-member>div{max-width:100%;aspect-ratio:1;height:auto!important}
        .kt-band-member strong{font-size:10px;letter-spacing:.1em;color:#91efb8}
        .kt-band-member small{font-size:8px;margin-top:4px;color:#bac4d4}
        .kt-band-sync{padding:8px 10px;border-top:1px solid #214334;font-size:11px;color:#bac4d4}
        .kt-band-sync summary{cursor:pointer;color:#85eaca;min-height:24px}
        .kt-band-sync p{margin:8px 0;line-height:1.6}
        .kt-band-sync label{display:inline-flex;align-items:center;gap:6px;margin:4px 12px 6px 0}
        .kt-band-sync input{width:85px;min-height:32px;color:#eefaf2;background:#101d20;border:1px solid #65967d;padding:4px}
        .kt-band-sync small{display:block;line-height:1.6}
        @media(max-width:480px){.kt-band-member strong{font-size:9px}.kt-band-member small{font-size:6px}.kt-band-top{font-size:8px}}
      `}</style>
    </div>
  );
}
