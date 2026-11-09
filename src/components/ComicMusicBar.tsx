import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useKMusic } from '../sections/AsciiCityWorld';
import './ComicMusicBar.css';

export default function ComicMusicBar({ edition, page, revision }: { edition: string; page: number; revision: string }) {
  const { audio, background, guided, hasGuidedCues, guidedNotice, scoreSource, catalogueStatus, sendCommand, setVolume, openComments, openScore, setReader, usePublishedScore } = useKMusic();
  useEffect(() => { setReader({ edition, page, revision }); }, [edition, page, revision, setReader]);
  useEffect(() => () => setReader(null), [setReader]);
  const playing = audio.status === 'playing';
  const toggle = () => {
    if (playing) sendCommand('pause');
    else {
      sendCommand('background on');
      sendCommand(guided || audio.current ? 'resume' : 'latest');
    }
  };
  const playLatest = () => { sendCommand('background on'); sendCommand('latest'); };
  return <section className="comic-music" aria-label="Comic soundtrack">
    <div className="comic-music-row">
      <div className="comic-music-track">
        <span>K TERMINAL <i>/</i> {guided ? 'GUIDED SOUNDTRACK' : 'BACKGROUND MUSIC'}</span>
        <strong title={audio.current?.title}>{audio.current?.title || (guided ? guidedNotice : 'Music for the pages')}</strong>
      </div>
      <div className="comic-music-transport">
        <button className="comic-music-play" onClick={toggle} aria-label={playing ? 'Pause soundtrack' : audio.current ? 'Resume soundtrack' : 'Play soundtrack'}>{playing ? 'Ⅱ Pause' : '▶ Play'}</button>
        <button onClick={playLatest}>Latest</button>
        <label className="comic-music-volume">Vol <input type="range" min="0" max="100" value={audio.volume} onChange={event => setVolume(Number(event.target.value))} aria-label="Soundtrack volume" /></label>
      </div>
      <div className="comic-music-options">
        <button aria-pressed={guided} disabled={!hasGuidedCues} title={hasGuidedCues ? 'Follow page cues' : 'No guided songs assigned yet. Use Define songs for a local preview.'} onClick={() => sendCommand(guided ? 'guided off' : 'guided on')}>{hasGuidedCues ? `Guided ${guided ? 'on' : 'off'}` : 'Guided · not configured'}</button>
        <button onClick={openScore}>Define songs</button>
        <button onClick={openComments}>Comment</button>
      </div>
    </div>
    <details className="comic-music-details">
      <summary>{audio.error ? 'Playback needs attention' : guided ? guidedNotice : background ? 'Music continues as you read' : 'Soundtrack options'}</summary>
      <div className="comic-music-detail-body">
        {audio.error && <p role="status">{audio.error} <Link to="/k/terminal">Open player controls</Link></p>}
        {audio.current && audio.status === 'paused' && !audio.pausedByUser && <p>Press Play to allow audio. If your browser still blocks it, use the <Link to="/k/terminal">SoundCloud controls in K World</Link>.</p>}
        <p>{guidedNotice} {scoreSource === 'draft' ? 'You are previewing a soundtrack saved on this device.' : hasGuidedCues ? 'The published soundtrack follows the creator’s page cues.' : 'No guided soundtrack has been published yet. Background music is available; Define songs creates a local preview.'}</p>
        <p className="comic-music-catalogue">{catalogueStatus}</p>
        <div>
          <button aria-pressed={background} onClick={() => sendCommand(background ? 'background off' : 'background on')}>Background {background ? 'on' : 'off'}</button>
          <button onClick={() => sendCommand('sync latest')}>Sync latest tracks</button>
          {scoreSource === 'draft' && <button onClick={usePublishedScore}>Use published soundtrack</button>}
          <Link to="/terminal">Open K Terminal</Link>
        </div>
      </div>
    </details>
  </section>;
}
