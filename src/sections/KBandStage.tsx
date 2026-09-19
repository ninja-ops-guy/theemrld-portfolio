import { useMemo } from 'react';
import KBandSprite from './KBandSprite';

type Props = {
  isPlaying: boolean;
  progress: number;
  positionMs?: number;
  intensity: number;
  trackTitle?: string;
  enabled?: boolean;
};

const FRAMES = {
  vocals: [0, 1, 9, 21],
  control: [2, 8, 18, 20],
  keys: [3, 14, 22, 3],
  hype: [10, 16, 19, 23],
};

export default function KBandStage({ isPlaying, progress, positionMs = 0, intensity, trackTitle, enabled = true }: Props) {
  const beat = useMemo(() => {
    // SoundCloud PLAY_PROGRESS is the authoritative clock. The percentage term is
    // only a fallback before the first position event arrives.
    const clock = positionMs > 0 ? positionMs : progress * 100;
    const stepMs = Math.max(105, 235 - Math.round(intensity * 1.05));
    return Math.floor(clock / stepMs) % 24;
  }, [positionMs, progress, intensity]);

  const pick = (key: keyof typeof FRAMES, offset: number) => {
    const list = FRAMES[key];
    if (!isPlaying) return list[0];
    return list[(beat + offset) % list.length];
  };

  if (!enabled) return null;

  return (
    <div
      className={`kt-band-stage ${isPlaying ? 'playing' : 'idle'}`}
      style={{ ['--band-power' as any]: intensity / 100, ['--band-beat' as any]: beat }}
      data-beat={beat}
    >
      <div className="kt-band-top">
        <span>K//CLONE ENSEMBLE</span>
        <span className="kt-band-set">{trackTitle ? `SET: ${trackTitle.toUpperCase()}` : 'WAITING FOR SIGNAL'}</span>
      </div>
      <div className="kt-band-grid">
        <div className="kt-band-member singer"><KBandSprite cell={pick('vocals', 0)} glow /><small>VOCALS//K-01</small></div>
        <div className="kt-band-member ctrl"><KBandSprite cell={pick('control', 1)} glow /><small>CTRL//K-02</small></div>
        <div className="kt-band-member keys"><KBandSprite cell={pick('keys', 2)} glow /><small>KEYS//K-03</small></div>
        <div className="kt-band-member hype"><KBandSprite cell={pick('hype', 3)} glow /><small>HYPE//K-04</small></div>
      </div>
      <div className="kt-band-floor"><span>♪</span><span>☿</span><span>◆</span><span>TECHOPS//LIVE · BEAT {String(beat).padStart(2, '0')}</span><span>♄</span><span>♫</span></div>
      <style>{`
        .kt-band-stage{position:relative;border:1px solid #00ff41;background:radial-gradient(circle at 50% 0%,rgba(176,0,255,.13),transparent 40%),linear-gradient(180deg,rgba(0,18,7,.94),rgba(4,3,8,.98));box-shadow:inset 0 0 24px rgba(0,255,65,.08),0 0 12px rgba(0,255,65,.08);margin-bottom:10px;overflow:hidden}
        .kt-band-top{display:flex;justify-content:space-between;gap:10px;padding:6px 9px;border-bottom:1px solid rgba(0,255,255,.18);color:#00ffff;font-size:10px;letter-spacing:.12em}
        .kt-band-set{color:#008f11;max-width:58%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .kt-band-grid{display:grid;grid-template-columns:repeat(4,1fr);align-items:end;justify-items:center;gap:4px;min-height:112px;padding:8px 6px 3px;background:repeating-linear-gradient(90deg,rgba(0,255,65,.025) 0 3px,transparent 3px 15px)}
        .kt-band-member{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;transform-origin:center bottom;transition:filter .08s linear}
        .kt-band-member small{margin-top:-3px;color:#00ff66;font-size:8px;letter-spacing:.06em;text-shadow:0 0 6px rgba(0,255,65,.5)}
        .kt-band-stage.playing .kt-band-member{animation:kt-band-bounce calc(.48s - (var(--band-power) * .12s)) steps(2) infinite}
        .kt-band-stage.playing .singer{animation-name:kt-band-bounce-left}
        .kt-band-stage.playing .ctrl{animation-delay:.07s;animation-name:kt-band-bounce-right}
        .kt-band-stage.playing .keys{animation-delay:.13s;animation-name:kt-band-bounce-left}
        .kt-band-stage.playing .hype{animation-delay:.19s;animation-name:kt-band-hype}
        .kt-band-stage.playing:after{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 18% 35%,rgba(0,255,65,.12),transparent 18%),radial-gradient(circle at 78% 30%,rgba(176,0,255,.14),transparent 20%);animation:kt-band-light .55s steps(4) infinite}
        .kt-band-floor{display:flex;justify-content:space-around;align-items:center;padding:5px 4px 7px;border-top:1px solid rgba(176,0,255,.18);background:rgba(10,0,18,.5);color:#b000ff;font-size:9px;letter-spacing:.08em;text-shadow:0 0 7px rgba(176,0,255,.65)}
        @keyframes kt-band-bounce-left{0%,100%{transform:translateY(0) rotate(-1deg) scaleY(1)}50%{transform:translateY(-6px) rotate(2deg) scaleY(1.03)}}
        @keyframes kt-band-bounce-right{0%,100%{transform:translateY(0) rotate(1deg)}50%{transform:translateY(-5px) rotate(-2deg)}}
        @keyframes kt-band-hype{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(1.05)}}
        @keyframes kt-band-light{0%,100%{filter:brightness(.9);opacity:.32}50%{filter:brightness(1.45);opacity:.8}}
        @media(max-width:768px){.kt-band-grid{min-height:90px}.kt-band-member>div{width:68px!important;height:68px!important}.kt-band-member small{font-size:6px}.kt-band-top{font-size:8px}.kt-band-set{max-width:50%}}
        @media(prefers-reduced-motion:reduce){.kt-band-stage.playing .kt-band-member,.kt-band-stage.playing:after{animation:none}}
      `}</style>
    </div>
  );
}
