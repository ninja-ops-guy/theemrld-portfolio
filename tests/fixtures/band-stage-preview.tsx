import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import KBandStage from '../../src/sections/KBandStage';

function Preview() {
  const [playing, setPlaying] = useState(false);
  const [sample, setSample] = useState<{ position: number; sampledAt?: number }>({ position: 0 });
  const [track, setTrack] = useState('https://soundcloud.com/raikouno/black');
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setSample(s => ({ position: s.position + 100 })), 100);
    return () => clearInterval(timer);
  }, [playing]);
  return <main style={{ maxWidth: 760, margin: '20px auto', fontFamily: 'monospace' }}>
    <h1 style={{ color: '#91efb8', fontSize: 20 }}>K TERMINAL // INSTRUMENT REHEARSAL</h1>
    <KBandStage trackId={track} trackTitle={track.endsWith('black') ? 'BLACK' : 'Unmapped song'} isPlaying={playing} positionMs={sample.position} positionSampledAt={sample.sampledAt} />
    <button onClick={() => setPlaying(p => !p)}>{playing ? 'Pause' : 'Play'}</button>
    {[750, 1250, 1950, 2250, 4250, 7250].map(ms =>
      <button key={ms} onClick={() => setSample({ position: ms })}>Seek {ms}</button>)}
    <button onClick={() => { setTrack(t => t.endsWith('black') ? 'unmapped-song' : 'https://soundcloud.com/raikouno/black'); setSample({ position: 0 }); }}>Switch song</button>
    <button onClick={() => {
      setSample({ position: 850, sampledAt: performance.timeOrigin + performance.now() - 225 });
      setPlaying(true);
    }}>Deliver delayed sample</button>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
