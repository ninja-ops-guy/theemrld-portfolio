import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import KBandSprite from './KBandSprite';
import { bandPosition, readBandTiming } from '../lib/bandTiming';
import {
  guitarRiffPose, GROUP_SHUFFLE, groupShuffleFrame, isPerformanceActive, isPlayableClip, katrinDanceAt, performanceCell, PERFORMERS,
  playablePerformance, readArrangement, resolvePerformance, type Arrangement, type Performer,
} from '../lib/bandPerformance';
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

function getStagePose(members: readonly Performer[], positionMs: number, timing: ReturnType<typeof readBandTiming>, reducedMotion: boolean, trackLoaded: boolean, shuffleReady: boolean) {
  const { bpm, offsetMs } = timing;
  const shuffleFrame = shuffleReady ? groupShuffleFrame(positionMs, bpm, offsetMs, reducedMotion) : null;
  const shuffling = shuffleFrame !== null;
  const riff = shuffling ? null : guitarRiffPose(positionMs, bpm, offsetMs, reducedMotion);
  const dance = katrinDanceAt(positionMs, bpm, offsetMs, reducedMotion);
  const katrin = PERFORMERS[isPlayableClip(BAND_CLIPS[dance]) ? dance : 'katrin-backswing'];
  const hasIona = members.some(member => member.actor === 'IONA');
  const manchez = BAND_CLIPS['manchez-drum-dance'];
  const manchezTurn = !shuffling && trackLoaded && isPlayableClip(manchez)
    && isPerformanceActive(positionMs, bpm, offsetMs, manchez, reducedMotion);
  const slots = members.flatMap(member => {
    // Manchez uses Iona’s drum slot. Both still join the group dance.
    if (!shuffling && hasIona && member.id === 'manchez-drum-dance') return [];
    const performer = member.actor === 'IONA' && manchezTurn ? PERFORMERS['manchez-drum-dance']
      : member.id === 'katrin-backswing' ? katrin : member;
    const clip = BAND_CLIPS[performer.id]!;
    const cell = shuffleFrame !== null
      ? GROUP_SHUFFLE.rowByActor[member.actor] * GROUP_SHUFFLE.columns + shuffleFrame
      : performer.id === 'k-guitar' && riff
        ? clip.firstCell + riff.frame
        : performanceCell(positionMs, bpm, offsetMs, clip, reducedMotion);
    return [{ key: member.actor, performer, clip, cell }];
  });
  return { slots, riff, shuffleFrame };
}

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
  const members = useMemo(
    () => playablePerformance(resolvePerformance(TRACK_PERFORMANCES[trackId], arrangement, timing.bpm), BAND_CLIPS),
    [trackId, arrangement, timing.bpm],
  );
  const trackLoaded = trackId !== 'preview';
  const ionaId = members.find(member => member.actor === 'IONA')?.id;
  const [shuffleReady, setShuffleReady] = useState(false);
  const [pose, setPose] = useState(() => getStagePose(members, positionMs, timing, reducedMotion, trackLoaded, shuffleReady));
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
    if (!enabled || reducedMotion || shuffleReady || !trackLoaded) return;
    const sprite = new Image();
    sprite.onload = () => setShuffleReady(true);
    sprite.src = `${import.meta.env.BASE_URL}${GROUP_SHUFFLE.atlas}`;
    return () => { sprite.onload = null; };
  }, [enabled, reducedMotion, shuffleReady, trackLoaded]);
  const chooseArrangement = (next: Arrangement) => {
    setArrangement(next);
    try { localStorage.setItem(arrangementKey, JSON.stringify(next)); } catch { /* Session choices still work. */ }
  };
  useEffect(() => {
    if (!enabled) return;
    for (const id of ['katrin-backswing', 'katrin-marmot', 'manchez-drum-dance', ionaId] as const) {
      const clip = id ? BAND_CLIPS[id] : undefined;
      if (isPlayableClip(clip)) {
        const image = new Image();
        image.src = `${import.meta.env.BASE_URL}${clip.atlas}`;
      }
    }
  }, [enabled, ionaId]);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const draw = () => {
      const clock = bandPosition(anchor.current.positionMs, performance.now() - anchor.current.at, isPlaying, playbackRate);
      const next = getStagePose(members, clock, timing, reducedMotion, trackLoaded, shuffleReady);
      // Keep the playback clock in the ref; render only when a visible pose changes.
      setPose(previous => previous.riff === next.riff
        && previous.shuffleFrame === next.shuffleFrame
        && previous.slots.length === next.slots.length
        && next.slots.every(({ key, performer, cell }, index) => {
          const before = previous.slots[index];
          return before.key === key && before.performer === performer && before.cell === cell;
        }) ? previous : next);
      if (isPlaying && !reducedMotion) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [enabled, isPlaying, playbackRate, positionMs, reducedMotion, timing, members, trackLoaded, shuffleReady]);

  if (!enabled) return null;
  const shuffling = pose.shuffleFrame !== null;
  const guitarStyle = pose.riff ? { '--kt-guitar-rotation': `rotate(${pose.riff.lean}deg)` } as CSSProperties : undefined;
  const guitarFrame = pose.slots.find(({ performer }) => performer.id === 'k-guitar')?.cell ?? 0;
  return (
    <div className="kt-band-stage" role="region" aria-label="TechOps Hero band" data-frame={guitarFrame} data-playing={isPlaying} data-band-move={shuffling ? 'skeleton-shuffle' : undefined}>
      <div className="kt-band-top"><span>TECHOPS // LIVE</span><span className="kt-band-set">{trackTitle || 'WAITING FOR SIGNAL'}</span></div>
      <div className="kt-band-grid" data-members={pose.slots.length} style={{ '--band-members': pose.slots.length } as CSSProperties}>
        {pose.slots.map(({ key, performer, clip, cell }) => {
          const sprite = shuffling ? GROUP_SHUFFLE : clip;
          return <div className="kt-band-member" key={key} data-performance={performer.id} style={performer.id === 'k-guitar' ? guitarStyle : undefined}>
            <KBandSprite cell={cell} size={128} atlas={sprite.atlas} columns={sprite.columns} rows={sprite.rows} strip={shuffling ? undefined : clip.strip} />
            <strong>{performer.actor}</strong>
            {!shuffling && <small>{performer.role}</small>}
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
        .kt-band-member[data-performance="k-guitar"]>div{transform:var(--kt-guitar-rotation,none);transform-origin:25% 94%}
        .kt-band-member strong{font-size:10px;letter-spacing:.1em;color:#91efb8}
        .kt-band-member small{font-size:8px;margin-top:4px;color:#bac4d4}
        .kt-band-stage[data-band-move="skeleton-shuffle"] .kt-band-member small{visibility:hidden}
        .kt-band-sync{padding:8px 10px;border-top:1px solid #214334;font-size:11px;color:#bac4d4}
        .kt-band-sync summary{cursor:pointer;color:#85eaca;min-height:24px}
        .kt-band-sync p{margin:8px 0;line-height:1.6}
        .kt-band-sync label{display:inline-flex;align-items:center;gap:6px;margin:4px 12px 6px 0}
        .kt-band-sync select{max-width:100%;min-height:32px;color:#eefaf2;background:#101d20;border:1px solid #65967d;padding:4px}
        .kt-band-sync input{width:85px;min-height:32px;color:#eefaf2;background:#101d20;border:1px solid #65967d;padding:4px}
        .kt-band-sync small{display:block;line-height:1.6}
        @media(max-width:480px){.kt-band-grid:is([data-members="5"],[data-members="6"]){grid-template-columns:repeat(3,minmax(0,1fr));row-gap:12px}.kt-band-grid[data-members="7"]{grid-template-columns:repeat(4,minmax(0,1fr));row-gap:12px}.kt-band-member strong{font-size:10px}.kt-band-member small{font-size:8px}.kt-band-top{font-size:8px}}
      `}</style>
    </div>
  );
}
