import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import KBandStage from '../../src/sections/KBandStage';

function Preview() {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [track, setTrack] = useState('https://soundcloud.com/raikouno/black');
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setPosition(p => p + 100), 100);
    return () => clearInterval(timer);
  }, [playing]);
  return <main style={{ maxWidth: 760, margin: '20px auto', fontFamily: 'monospace' }}>
    <h1 style={{ color: '#91efb8', fontSize: 20 }}>K TERMINAL // INSTRUMENT REHEARSAL</h1>
    <KBandStage trackId={track} trackTitle={track.endsWith('black') ? 'BLACK' : 'Unmapped song'} isPlaying={playing} positionMs={position} />
    <button onClick={() => setPlaying(p => !p)}>{playing ? 'Pause' : 'Play'}</button>
    <button onClick={() => setPosition(750)}>Seek 750</button>
    <button onClick={() => { setTrack(t => t.endsWith('black') ? 'unmapped-song' : 'https://soundcloud.com/raikouno/black'); setPosition(0); }}>Switch song</button>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
