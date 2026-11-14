import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import KBandSprite from './KBandSprite';
import { bandPosition, PREVIEW_TIMING, readBandTiming, tapTempo, type BandTiming } from '../lib/bandTiming';
import {
  guitarRiffPose, GROUP_SHUFFLE, groupDanceAt, groupDancePose, isPerformanceActive, isPlayableClip, katrinDanceAt, performanceCell, PERFORMERS,
  playablePerformance, readArrangement, resolvePerformance, soloDancePose, type Arrangement, type Performer,
} from '../lib/bandPerformance';
import { BAND_CLIPS, ESTIMATED_TRACK_TIMING, TRACK_PERFORMANCES } from '../data/bandPerformances';

type Props = {
  isPlaying: boolean;
  positionMs: number;
  positionSampledAt?: number | null;
  playbackRate?: number;
  trackTitle?: string;
  trackId?: string;
  enabled?: boolean;
};
const HAS_INSTRUMENT_CLIPS = ['waldo-mixing', 'felicia-violin', 'felicia-piano', 'felicia-synth', 'mike-bass'].some(id => isPlayableClip(BAND_CLIPS[id as keyof typeof BAND_CLIPS]));

function getStagePose(members: readonly Performer[], positionMs: number, timing: BandTiming, reducedMotion: boolean, trackLoaded: boolean, shuffleReady: boolean) {
  const { bpm, offsetMs } = timing;
  const group = shuffleReady && !reducedMotion ? groupDanceAt(positionMs, bpm, offsetMs) : null;
  const riff = group ? null : guitarRiffPose(positionMs, bpm, offsetMs, reducedMotion);
  const dance = katrinDanceAt(positionMs, bpm, offsetMs, reducedMotion);
  const katrin = PERFORMERS[isPlayableClip(BAND_CLIPS[dance]) ? dance : 'katrin-backswing'];
  const hasIona = members.some(member => member.actor === 'IONA');
  const manchez = BAND_CLIPS['manchez-drum-dance'];
  const manchezTurn = !group && trackLoaded && isPlayableClip(manchez)
    && isPerformanceActive(positionMs, bpm, offsetMs, manchez, reducedMotion);
  const slots = members.flatMap(member => {
    // Manchez uses Iona’s drum slot. Both still join the group dance.
    if (!group && hasIona && member.id === 'manchez-drum-dance') return [];
    const performer = member.actor === 'IONA' && manchezTurn ? PERFORMERS['manchez-drum-dance']
      : member.id === 'katrin-backswing' ? katrin : member;
    const clip = BAND_CLIPS[performer.id]!;
    const groupPose = group ? groupDancePose(group, member.actor) : null;
    const solo = !group && !reducedMotion ? soloDancePose(performer.id, positionMs, bpm, offsetMs) : null;
    const cell = groupPose ? groupPose.cell
      : performer.id === 'k-guitar' && riff
        ? clip.firstCell + riff.frame
        : solo ? clip.firstCell + solo.frame
        : performanceCell(positionMs, bpm, offsetMs, clip, reducedMotion);
    return [{ key: member.actor, performer, clip, cell, move: solo?.name, x: groupPose?.x ?? solo?.x ?? 0, y: groupPose?.y ?? 0 }];
  });
  return { slots, riff, group: group?.name };
}

export default function KBandStage(props: Props) {
  // Remount per track so preferences cannot leak into another song, even outside KTerminal.
  return <BandStageForTrack key={props.trackId || 'preview'} {...props} />;
}

function BandStageForTrack({ isPlaying, positionMs, positionSampledAt, playbackRate = 1, trackTitle, trackId = 'preview', enabled = true }: Props) {
  const storageKey = `kt-band-timing-v1:${trackId}`;
  const estimatedTiming = ESTIMATED_TRACK_TIMING[trackId];
  const [savedTiming, setSavedTiming] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      // The previous stage wrote preview timing for every opened track, even without edits.
      if (raw === '{"bpm":120,"offsetMs":0}') return null;
      return readBandTiming(raw);
    } catch { return null; }
  });
  const timing = savedTiming ?? estimatedTiming ?? PREVIEW_TIMING;
  const clockRunning = isPlaying && positionSampledAt !== null;
  const taps = useRef<{ at: number; position: number }[]>([]);
  const [tapCount, setTapCount] = useState(0);
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
    const now = performance.now();
    const sampleAt = positionSampledAt != null && Number.isFinite(positionSampledAt) ? positionSampledAt - performance.timeOrigin : now;
    anchor.current = { positionMs, at: Math.min(now, sampleAt) };
  }, [positionMs, positionSampledAt, isPlaying, playbackRate]);
  useEffect(() => {
    try {
      if (savedTiming) localStorage.setItem(storageKey, JSON.stringify({ ...savedTiming, customized: true }));
      else localStorage.removeItem(storageKey);
    } catch { /* Playback works without storage. */ }
  }, [storageKey, savedTiming]);
  useEffect(() => {
    taps.current = [];
    setTapCount(0);
  }, [clockRunning, playbackRate]);
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
      const clock = bandPosition(anchor.current.positionMs, performance.now() - anchor.current.at, clockRunning, playbackRate);
      const next = getStagePose(members, clock, timing, reducedMotion, trackLoaded, shuffleReady);
      // Keep the playback clock in the ref; render only when a visible pose changes.
      setPose(previous => previous.riff === next.riff
        && previous.group === next.group
        && previous.slots.length === next.slots.length
        && next.slots.every(({ key, performer, cell, move, x, y }, index) => {
          const before = previous.slots[index];
          return before.key === key && before.performer === performer && before.cell === cell
            && before.move === move && before.x === x && before.y === y;
        }) ? previous : next);
      if (clockRunning && !reducedMotion) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [enabled, clockRunning, playbackRate, positionMs, positionSampledAt, reducedMotion, timing, members, trackLoaded, shuffleReady]);

  const tapBeat = () => {
    const now = performance.now();
    const position = bandPosition(anchor.current.positionMs, now - anchor.current.at, clockRunning, playbackRate);
    const last = taps.current[taps.current.length - 1];
    if (last && (now - last.at > 1650 / playbackRate
      || Math.abs(position - last.position - (now - last.at) * playbackRate) > 250)) taps.current = [];
    taps.current.push({ at: now, position });
    const bpm = tapTempo(taps.current.map(tap => tap.at), playbackRate);
    if (bpm !== null) {
      const barMs = 4 * 60000 / bpm;
      setSavedTiming({ bpm, offsetMs: Math.round(taps.current[0].position % barMs) });
      taps.current = [];
    } else if (taps.current.length >= 4) {
      taps.current.shift();
    }
    setTapCount(taps.current.length);
  };

  if (!enabled) return null;
  const shuffling = Boolean(pose.group);
  const guitarStyle = pose.riff ? { '--kt-guitar-rotation': `rotate(${pose.riff.lean}deg)` } as CSSProperties : undefined;
  const guitarFrame = pose.slots.find(({ performer }) => performer.id === 'k-guitar')?.cell ?? 0;
  return (
    <div className="kt-band-stage" role="region" aria-label="TechOps Hero band" data-frame={guitarFrame} data-playing={isPlaying} data-band-move={pose.group}>
      <div className="kt-band-top"><span>TECHOPS // LIVE</span><span className="kt-band-set">{trackTitle || 'WAITING FOR SIGNAL'}</span></div>
      <div className="kt-band-grid" data-members={pose.slots.length} style={{ '--band-members': pose.slots.length } as CSSProperties}>
        {pose.slots.map(({ key, performer, clip, cell, move, x, y }) => {
          const sprite = shuffling ? GROUP_SHUFFLE : clip;
          const style = x || y ? { '--kt-dance-step': `translate(${x}%, ${y}%)` } as CSSProperties
            : performer.id === 'k-guitar' ? guitarStyle : undefined;
          return <div className="kt-band-member" key={key} data-performance={performer.id} data-dance={move} style={style}>
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
        <p>Tap on four consecutive beats, starting on the downbeat. Sync is saved per song on this device.</p>
        <button type="button" disabled={!clockRunning || !trackLoaded} onClick={tapBeat}>Tap beat</button>
        {tapCount > 0 && <span role="status"> {tapCount} of 4 taps</span>}
        <label>Tempo (BPM) <input type="number" min="40" max="240" step="0.01" value={timing.bpm} onChange={e => { const bpm = e.target.valueAsNumber; if (Number.isFinite(bpm) && bpm >= 40 && bpm <= 240) setSavedTiming({ ...timing, bpm }); }} /></label>
        <label>Beat offset (ms) <input type="number" min="-600000" max="600000" step="1" value={timing.offsetMs} onChange={e => { const offsetMs = e.target.valueAsNumber; if (Number.isFinite(offsetMs) && Math.abs(offsetMs) <= 600000) setSavedTiming({ ...timing, offsetMs }); }} /></label>
        {savedTiming ? <button type="button" onClick={() => setSavedTiming(null)}>Reset sync</button>
          : <small>{estimatedTiming ? 'Estimated from the song’s waveform. Tap to align the downbeat.' : 'Using the 120 BPM preview tempo.'}</small>}
      </details>
      <style>{`
        .kt-band-stage{flex-shrink:0;position:relative;border:1px solid #00ad58;background:#070b12;margin-bottom:10px;overflow:hidden}
        .kt-band-top{display:flex;justify-content:space-between;gap:10px;padding:8px 10px;border-bottom:1px solid #214334;color:#85eaca;font-size:10px;letter-spacing:.1em}
        .kt-band-set{color:#acc8b9;max-width:58%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .kt-band-grid{display:grid;grid-template-columns:repeat(var(--band-members,4),minmax(0,1fr));align-items:end;gap:2px;padding:8px 4px 12px}
        .kt-band-member{display:flex;min-width:0;flex-direction:column;align-items:center}
        .kt-band-member>div{max-width:100%;aspect-ratio:1;height:auto!important;mix-blend-mode:lighten;transform:var(--kt-dance-step,var(--kt-guitar-rotation,none));transform-origin:25% 94%}
        .kt-band-member strong{font-size:10px;letter-spacing:.1em;color:#91efb8}
        .kt-band-member small{font-size:8px;margin-top:4px;color:#bac4d4}
        .kt-band-stage[data-band-move] .kt-band-member{padding-bottom:14px}
        .kt-band-sync{padding:8px 10px;border-top:1px solid #214334;font-size:11px;color:#bac4d4}
        .kt-band-sync summary{cursor:pointer;color:#85eaca;min-height:24px}
        .kt-band-sync p{margin:8px 0;line-height:1.6}
        .kt-band-sync label{display:inline-flex;align-items:center;gap:6px;margin:4px 12px 6px 0}
        .kt-band-sync select{max-width:100%;min-height:32px;color:#eefaf2;background:#101d20;border:1px solid #65967d;padding:4px}
        .kt-band-sync input{width:85px;min-height:32px;color:#eefaf2;background:#101d20;border:1px solid #65967d;padding:4px}
        .kt-band-sync button{min-height:32px;padding:4px 8px;margin:4px 8px 6px 0;border:1px solid #65967d;color:#eefaf2;background:#101d20}
        .kt-band-sync button:disabled{opacity:.55}
        .kt-band-sync small{display:block;line-height:1.6}
        @media(max-width:480px){.kt-band-grid:is([data-members="5"],[data-members="6"]){grid-template-columns:repeat(3,minmax(0,1fr));row-gap:12px}.kt-band-grid[data-members="7"]{grid-template-columns:repeat(4,minmax(0,1fr));row-gap:12px}.kt-band-member strong{font-size:10px}.kt-band-member small{font-size:8px}.kt-band-top{font-size:8px}}
      `}</style>
    </div>
  );
}
