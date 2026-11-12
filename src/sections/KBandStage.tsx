import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import KBandSprite from './KBandSprite';
import { bandPosition, readBandTiming } from '../lib/bandTiming';
import { readArrangement, resolvePerformance, playablePerformance, performanceCell, isPlayableClip, type Arrangement } from '../lib/bandPerformance';
import { BAND_CLIPS, TRACK_PERFORMANCES } from '../data/bandPerformances';

type Props = {
  isPlaying: boolean;
  positionMs: number;
  playbackRate?: number;
  trackTitle?: string;
  trackId?: string;
  enabled?: boolean;
};
const HAS_INSTRUMENT_CLIPS = ['waldo-mixing', 'felicia-violin', 'felicia-piano', 'felicia-synth', 'mike-bass'].some(id => isPlayableClip(BAND_CLIPS[id as keyof typeof BAND_CLIPS]));

export default function KBandStage(props: Props) {
  // Remount per track so preferences cannot leak into another song, even outside KTerminal.
  return <BandStageForTrack key={props.trackId || 'preview'} {...props} />;
}

function BandStageForTrack({ isPlaying, positionMs, playbackRate = 1, trackTitle, trackId = 'preview', enabled = true }: Props) {
  const storageKey = `kt-band-timing-v1:${trackId}`;
  const [timing, setTiming] = useState(() => {
    try { return readBandTiming(localStorage.getItem(storageKey)); } catch { return readBandTiming(null); }
  });
  const arrangementKey = `kt-band-arrangement-v1:${trackId}`;
  const [arrangement, setArrangement] = useState(() => {
    try { return readArrangement(localStorage.getItem(arrangementKey)); } catch { return readArrangement(null); }
  });
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const members = useMemo(() => playablePerformance(resolvePerformance(TRACK_PERFORMANCES[trackId], arrangement), BAND_CLIPS), [trackId, arrangement]);
  const [cells, setCells] = useState<Record<string, number>>(() => Object.fromEntries(members.map(member => [member.id, performanceCell(positionMs, timing.bpm, timing.offsetMs, BAND_CLIPS[member.id]!, reducedMotion)])));
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
  const chooseArrangement = (next: Arrangement) => {
    setArrangement(next);
    try { localStorage.setItem(arrangementKey, JSON.stringify(next)); } catch { /* Session choices still work. */ }
  };
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const draw = () => {
      const clock = bandPosition(anchor.current.positionMs, performance.now() - anchor.current.at, isPlaying, playbackRate);
      const next = Object.fromEntries(members.map(member => [member.id, performanceCell(clock, timing.bpm, timing.offsetMs, BAND_CLIPS[member.id]!, reducedMotion)]));
      // Keep the playback clock in the ref; render only when a visible pose changes.
      setCells(previous => Object.keys(previous).length === members.length && members.every(member => previous[member.id] === next[member.id]) ? previous : next);
      if (isPlaying && !reducedMotion) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [enabled, isPlaying, playbackRate, positionMs, reducedMotion, timing, members]);

  if (!enabled) return null;
  return (
    <div className="kt-band-stage" role="region" aria-label="TechOps Hero band" data-frame={cells['k-guitar'] ?? 0} data-playing={isPlaying}>
      <div className="kt-band-top"><span>TECHOPS // LIVE</span><span className="kt-band-set">{trackTitle || 'WAITING FOR SIGNAL'}</span></div>
      <div className="kt-band-grid" data-members={members.length} style={{ '--band-members': members.length } as CSSProperties}>
        {members.map(member => {
          const clip = BAND_CLIPS[member.id]!;
          return <div className="kt-band-member" key={member.actor} data-performance={member.id}>
            <KBandSprite cell={cells[member.id] ?? clip.firstCell} size={128} atlas={clip.atlas} columns={clip.columns} rows={clip.rows} strip={clip.strip} />
            <strong>{member.actor}</strong><small>{member.role}</small>
          </div>;
        })}
      </div>
      {HAS_INSTRUMENT_CLIPS && <details className="kt-band-sync">
        <summary>Band arrangement</summary>
        <p>{TRACK_PERFORMANCES[trackId] ? 'Auto follows this song’s arrangement.' : 'Choose the parts for this song; its automatic arrangement is not set yet.'} Choices stay on this device.</p>
        <label>Waldo <select aria-label="Waldo" value={arrangement.waldo} onChange={e => chooseArrangement({ ...arrangement, waldo: e.target.value as Arrangement['waldo'] })}>
          <option value="auto">Auto</option><option value="dance">Dance</option>
          <option value="mixing" disabled={!isPlayableClip(BAND_CLIPS['waldo-mixing'])}>Mixing board</option>
        </select></label>
        <label>Felicia <select aria-label="Felicia" value={arrangement.felicia} onChange={e => chooseArrangement({ ...arrangement, felicia: e.target.value as Arrangement['felicia'] })}>
          <option value="auto">Auto</option><option value="dance">Dance</option>
          <option value="violin" disabled={!isPlayableClip(BAND_CLIPS['felicia-violin'])}>Violin</option>
          <option value="piano" disabled={!isPlayableClip(BAND_CLIPS['felicia-piano'])}>Piano</option>
          <option value="synth" disabled={!isPlayableClip(BAND_CLIPS['felicia-synth'])}>Synthesizer</option>
        </select></label>
        <label>Mike <select aria-label="Mike" value={arrangement.mike} onChange={e => chooseArrangement({ ...arrangement, mike: e.target.value as Arrangement['mike'] })}>
          <option value="auto">Auto</option><option value="off">Offstage</option>
          <option value="bass" disabled={!isPlayableClip(BAND_CLIPS['mike-bass'])}>Bass</option>
        </select></label>
      </details>}
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
        .kt-band-grid{display:grid;grid-template-columns:repeat(var(--band-members,4),minmax(0,1fr));align-items:end;gap:2px;padding:8px 4px 12px}
        .kt-band-member{display:flex;min-width:0;flex-direction:column;align-items:center}
        .kt-band-member>div{max-width:100%;aspect-ratio:1;height:auto!important;mix-blend-mode:lighten}
        .kt-band-member strong{font-size:10px;letter-spacing:.1em;color:#91efb8}
        .kt-band-member small{font-size:8px;margin-top:4px;color:#bac4d4}
        .kt-band-sync{padding:8px 10px;border-top:1px solid #214334;font-size:11px;color:#bac4d4}
        .kt-band-sync summary{cursor:pointer;color:#85eaca;min-height:24px}
        .kt-band-sync p{margin:8px 0;line-height:1.6}
        .kt-band-sync label{display:inline-flex;align-items:center;gap:6px;margin:4px 12px 6px 0}
        .kt-band-sync select{max-width:100%;min-height:32px;color:#eefaf2;background:#101d20;border:1px solid #65967d;padding:4px}
        .kt-band-sync input{width:85px;min-height:32px;color:#eefaf2;background:#101d20;border:1px solid #65967d;padding:4px}
        .kt-band-sync small{display:block;line-height:1.6}
        @media(max-width:480px){.kt-band-grid:is([data-members="5"],[data-members="6"]){grid-template-columns:repeat(3,minmax(0,1fr));row-gap:12px}.kt-band-member strong{font-size:10px}.kt-band-member small{font-size:8px}.kt-band-top{font-size:8px}}
      `}</style>
    </div>
  );
}
