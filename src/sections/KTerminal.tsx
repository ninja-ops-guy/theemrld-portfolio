import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

interface Track {
  id: number;
  url: string;
  title: string;
  duration: number;
  plays: number;
}

interface TerminalLine {
  text: string;
  className?: string;
}

const bootMessages = [
  'BIOS DATE 04/08/26 14:22:55 VER 1.0.2',
  'CPU: NEURAL-NET PROCESSOR TYPE A-1',
  '640K RAM SYSTEM... OK',
  'SOUNDCLOUD API MODULE... DETECTED',
  'INITIALIZING AUDIO SUBSYSTEM...',
  'Loading @raikouno profile...',
  'MOUNTING VIRTUAL FILESYSTEM...',
  'ESTABLISHING SECURE CONNECTION...',
  'TARGET: soundcloud.com/raikouno',
  'SYSTEM READY.',
];

// Sorted by SoundCloud play count (most popular first) — from raikouno/popular-tracks
const defaultTracks: Track[] = [
  { id: 1, url: 'https://soundcloud.com/raikouno/real', title: "Real (I'm trying to articulate)", duration: 0, plays: 46111 },
  { id: 2, url: 'https://soundcloud.com/raikouno/two-cups', title: 'Two cups', duration: 0, plays: 9639 },
  { id: 3, url: 'https://soundcloud.com/raikouno/3-valentines-2-mp3', title: '3 valentines', duration: 0, plays: 3117 },
  { id: 4, url: 'https://soundcloud.com/raikouno/when-its-all-done-minor-1', title: "When It's All Done (Minor Dream Mix)", duration: 0, plays: 1186 },
  { id: 5, url: 'https://soundcloud.com/raikouno/waiting-patience-ay-mp3', title: 'waiting-patience-ay', duration: 0, plays: 334 },
  { id: 6, url: 'https://soundcloud.com/raikouno/hot-sauce-mp3', title: 'Hot sauce', duration: 0, plays: 272 },
  { id: 7, url: 'https://soundcloud.com/raikouno/ghost-town', title: 'Ghost town', duration: 0, plays: 250 },
  { id: 8, url: 'https://soundcloud.com/raikouno/motorcell-mp3', title: 'MOTORCELL', duration: 0, plays: 234 },
  { id: 9, url: 'https://soundcloud.com/raikouno/see-right-thru-3', title: 'See right thru 3', duration: 0, plays: 222 },
  { id: 10, url: 'https://soundcloud.com/raikouno/flow-mp3', title: 'My Master Hacker', duration: 0, plays: 220 },
  { id: 11, url: 'https://soundcloud.com/raikouno/black', title: 'BLACK', duration: 0, plays: 212 },
  { id: 12, url: 'https://soundcloud.com/raikouno/heavy-wav', title: 'Heavy', duration: 0, plays: 204 },
  { id: 13, url: 'https://soundcloud.com/raikouno/when-its-all-done', title: "When It's All Done", duration: 0, plays: 199 },
  { id: 14, url: 'https://soundcloud.com/raikouno/wake-up-and-die-ft-oz', title: 'Wake up and die B ft OZ', duration: 0, plays: 199 },
  { id: 15, url: 'https://soundcloud.com/raikouno/will-i-be-there', title: 'will-i-be-there', duration: 0, plays: 197 },
  { id: 16, url: 'https://soundcloud.com/raikouno/i-was-a-dreamer-once-too-mp3', title: 'I was a dreamer too, you know', duration: 0, plays: 183 },
  { id: 17, url: 'https://soundcloud.com/raikouno/when-its-all-done-minor-dream', title: "When It's All Done (Minor Dream Mix) 2", duration: 0, plays: 182 },
  { id: 18, url: 'https://soundcloud.com/raikouno/floor-mp3', title: 'Temporal pressure', duration: 0, plays: 179 },
  { id: 19, url: 'https://soundcloud.com/raikouno/two-horses', title: 'Urim and Thummim', duration: 0, plays: 176 },
  { id: 20, url: 'https://soundcloud.com/raikouno/black-bside', title: 'BLACK BSIDE', duration: 0, plays: 174 },
];

export default function KTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLIFrameElement>(null);
  const scWidgetRef = useRef<any>(null);
  const visualizerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [bootPhase, setBootPhase] = useState<'booting' | 'done'>('booting');
  const [bootText, setBootText] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [tracks, setTracks] = useState<Track[]>(defaultTracks);
  const [volume, setVolume] = useState(50);
  const [progress, setProgress] = useState(0);
  const [timeDisplay, setTimeDisplay] = useState('00:00 / 00:00');
  const [audioStatus, setAudioStatus] = useState('STANDBY');
  const [showClickStart, setShowClickStart] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const bootIndexRef = useRef(0);

  // Detect mobile on mount
  useEffect(() => {
    const mobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);

  // Boot sequence
  useEffect(() => {
    const bootSequence = () => {
      if (bootIndexRef.current < bootMessages.length) {
        setBootText((prev) => prev + bootMessages[bootIndexRef.current] + '\n');
        bootIndexRef.current++;
        setTimeout(bootSequence, Math.random() * 300 + 100);
      } else {
        setTimeout(() => {
          setBootPhase('done');
          showWelcome();
        }, 500);
      }
    };
    bootSequence();
  }, []);

  // Keep input focused
  useEffect(() => {
    if (bootPhase === 'done') {
      inputRef.current?.focus();
    }
  }, [bootPhase]);

  const addLine = useCallback((text: string, className?: string) => {
    setLines((prev) => [...prev, { text, className }]);
  }, []);

  const showWelcome = useCallback(() => {
    addLine('========================================', 'cyan');
    addLine('  K TERMINAL v2.0.77', 'cyan');
    addLine('========================================', 'cyan');
    addLine('');
    addLine('Artist Profile: <span class="tc-cyan">https://soundcloud.com/raikouno</span>');
    addLine('');
    addLine(`<span class="tc-success">[OK]</span> ${defaultTracks.length} track(s) pre-loaded.`);
    addLine('Type <span class="tc-command">\'list\'</span> to see available tracks.');
    addLine('Type <span class="tc-command">\'help\'</span> for all commands.');
    addLine('Or <span class="tc-cyan">CLICK on any track below to play</span>');
    addLine('');
  }, [addLine]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const updateProgressUI = useCallback((current: number, total: number) => {
    if (!total) return;
    const percent = (current / total) * 100;
    setProgress(percent);
    const currentSec = Math.floor(current / 1000);
    const totalSec = Math.floor(total / 1000);
    setTimeDisplay(`${formatTime(currentSec)} / ${formatTime(totalSec)}`);
  }, [formatTime]);

  // Bind SoundCloud widget events (call once after iframe loads)
  const bindWidgetEvents = useCallback((widget: any) => {
    const SC = (window as any).SC;
    if (!SC) return;

    widget.bind(SC.Widget.Events.READY, () => {
      widget.getDuration((duration: number) => {
        setCurrentTrack((prev) => (prev ? { ...prev, duration } : prev));
      });
      widget.setVolume(volume);
      // Explicit play() is REQUIRED for mobile -- autoplay is blocked
      widget.play();
    });

    widget.bind(SC.Widget.Events.PLAY, () => {
      setIsPlaying(true);
      setAudioStatus('PLAYING');
      startVisualizer();
    });

    widget.bind(SC.Widget.Events.PAUSE, () => {
      setIsPlaying(false);
      setAudioStatus('PAUSED');
      stopVisualizer();
    });

    widget.bind(SC.Widget.Events.FINISH, () => {
      setIsPlaying(false);
      setAudioStatus('STOPPED');
      stopVisualizer();
      addLine('Track finished. Type "next" to continue or "list" to choose another.', 'warning');
    });

    widget.bind(SC.Widget.Events.PLAY_PROGRESS, (e: any) => {
      updateProgressUI(e.currentPosition, currentTrack?.duration || 0);
    });
  }, [volume, updateProgressUI, addLine, currentTrack?.duration]);

  // SoundCloud Widget init -- NO auto_play (mobile blocks it)
  const initSoundCloud = useCallback((url: string) => {
    if (!widgetRef.current) return;

    const SC = (window as any).SC;
    if (!SC || !SC.Widget) {
      addLine('<span class="tc-warning">[WARN]</span> SoundCloud API loading... retrying...');
      setTimeout(() => initSoundCloud(url), 1000);
      return;
    }

    try {
      widgetRef.current.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false`;

      widgetRef.current.onload = () => {
        if (!widgetRef.current) return;
        const widget = SC.Widget(widgetRef.current);
        scWidgetRef.current = widget;
        bindWidgetEvents(widget);
      };
    } catch (err) {
      console.error('SC Widget error:', err);
      addLine('<span class="tc-error">Error loading SoundCloud player.</span>');
    }
  }, [bindWidgetEvents, addLine]);

  // Visualizer
  const startVisualizer = useCallback(() => {
    stopVisualizer();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bars = 50;
    const draw = () => {
      if (!isPlaying) return;
      ctx.fillStyle = 'rgba(13, 2, 8, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / bars;
      for (let i = 0; i < bars; i++) {
        const height = Math.random() * canvas.height * 0.8;
        const hue = (i / bars) * 120 + 100;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(i * barWidth, canvas.height - height, barWidth - 2, height);
      }
    };
    visualizerIntervalRef.current = setInterval(draw, 50);
  }, [isPlaying]);

  const stopVisualizer = useCallback(() => {
    if (visualizerIntervalRef.current) {
      clearInterval(visualizerIntervalRef.current);
      visualizerIntervalRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Play track by click
  const playTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setShowClickStart(false);
    addLine(`Loading track ${track.id}: ${track.title}...`);
    initSoundCloud(track.url);
  }, [addLine, initSoundCloud]);

  // Play any SoundCloud URL
  const playUrl = useCallback((url: string) => {
    if (!url.includes('soundcloud.com')) {
      addLine('<span class="tc-error">Error: URL must be from SoundCloud</span>');
      return;
    }
    const t: Track = { id: 999, url, title: 'Custom URL', duration: 0, plays: 0 };
    setCurrentTrack(t);
    setShowClickStart(false);
    addLine(`Loading SoundCloud URL...`);
    initSoundCloud(url);
  }, [addLine, initSoundCloud]);

  // Terminal commands
  const executeCommand = useCallback((cmd: string, args: string[]) => {
    switch (cmd) {
      case 'help':
        addLine(`Available commands:
  <span class="tc-command">list</span>              - Display available tracks
  <span class="tc-command">play [id]</span>         - Play track by ID
  <span class="tc-command">play [url]</span>        - Play any SoundCloud URL
  <span class="tc-command">add [url] [title]</span> - Add new track to playlist
  <span class="tc-command">remove [id]</span>       - Remove track from playlist
  <span class="tc-command">clearplaylist</span>     - Remove all tracks
  <span class="tc-command">artist</span>            - Open @raikouno profile
  <span class="tc-command">pause</span>             - Pause current track
  <span class="tc-command">resume</span>            - Resume paused track
  <span class="tc-command">stop</span>              - Stop playback
  <span class="tc-command">volume [0-100]</span>    - Set volume level
  <span class="tc-command">next</span>              - Play next track
  <span class="tc-command">prev</span>              - Play previous track
  <span class="tc-command">status</span>            - Show playback status
  <span class="tc-command">clear</span>             - Clear terminal screen
  <span class="tc-command">help</span>              - Show this help message`);
        break;

      case 'list': {
        if (tracks.length === 0) {
          addLine('<span class="tc-warning">Playlist is empty.</span>');
          break;
        }
        addLine('PLAYLIST:');
        addLine('='.repeat(40));
        tracks.forEach((track) => {
          const prefix = currentTrack && currentTrack.id === track.id ? '▶ ' : '  ';
          const playsDisplay = track.plays >= 1000
            ? `${(track.plays / 1000).toFixed(track.plays >= 10000 ? 0 : 1)}K`
            : `${track.plays}`;
          const playsStr = track.plays > 0 ? ` <span class="tc-cyan">${playsDisplay} plays</span>` : '';
          addLine(`${prefix}[${track.id}] ${track.title}${playsStr}`, currentTrack && currentTrack.id === track.id ? 'playing' : '');
        });
        addLine('');
        addLine('Click on a track above or use "play [id]" to select');
        break;
      }

      case 'play': {
        if (!args[0]) {
          addLine('Error: No track specified. Usage: play [id] or play [url]', 'error');
          break;
        }
        const arg = args[0];
        if (arg.includes('soundcloud.com')) {
          playUrl(arg);
        } else {
          const id = parseInt(arg);
          const track = tracks.find((t) => t.id === id);
          if (!track) {
            addLine(`Error: Track ${id} not found. Type "list" to see available tracks.`, 'error');
            break;
          }
          playTrack(track);
        }
        break;
      }

      case 'add': {
        if (!args[0]) {
          addLine('Error: No URL specified. Usage: add [url] [title]', 'error');
          break;
        }
        const url = args[0];
        if (!url.includes('soundcloud.com')) {
          addLine('Error: URL must be from SoundCloud', 'error');
          break;
        }
        const title = args.slice(1).join(' ') || `Track ${tracks.length + 1}`;
        const newTrack: Track = {
          id: tracks.length > 0 ? Math.max(...tracks.map((t) => t.id)) + 1 : 1,
          url,
          title,
          duration: 0,
          plays: 0,
        };
        setTracks((prev) => [...prev, newTrack]);
        addLine(`<span class="tc-success">[OK]</span> Added: ${title} (ID: ${newTrack.id})`);
        break;
      }

      case 'remove': {
        if (!args[0]) {
          addLine('Error: No ID specified. Usage: remove [id]', 'error');
          break;
        }
        const id = parseInt(args[0]);
        const index = tracks.findIndex((t) => t.id === id);
        if (index === -1) {
          addLine(`Error: Track ${id} not found.`, 'error');
          break;
        }
        const removed = tracks[index];
        setTracks((prev) => prev.filter((t) => t.id !== id));
        addLine(`<span class="tc-success">[OK]</span> Removed: ${removed.title}`);
        break;
      }

      case 'clearplaylist': {
        setTracks([]);
        addLine('<span class="tc-warning">[OK]</span> Playlist cleared.');
        break;
      }

      case 'artist': {
        window.open('https://soundcloud.com/raikouno', '_blank');
        addLine('Opening RAIKOUNO profile: <span class="tc-cyan">https://soundcloud.com/raikouno</span>');
        break;
      }

      case 'pause': {
        if (!scWidgetRef.current) {
          addLine('Error: No track loaded', 'error');
          break;
        }
        try { scWidgetRef.current.pause(); } catch (e) {}
        addLine('Playback paused.');
        break;
      }

      case 'resume': {
        if (!scWidgetRef.current) {
          addLine('Error: No track loaded', 'error');
          break;
        }
        try { scWidgetRef.current.play(); } catch (e) {}
        addLine('Resuming playback...');
        break;
      }

      case 'stop': {
        if (!scWidgetRef.current) {
          addLine('Error: No track loaded', 'error');
          break;
        }
        try {
          scWidgetRef.current.pause();
          scWidgetRef.current.seekTo(0);
        } catch (e) {}
        setIsPlaying(false);
        setAudioStatus('STOPPED');
        stopVisualizer();
        setProgress(0);
        addLine('Playback stopped.');
        break;
      }

      case 'volume': {
        if (!args[0]) {
          addLine(`Current volume: ${volume}%`);
          break;
        }
        const vol = parseInt(args[0]);
        if (isNaN(vol) || vol < 0 || vol > 100) {
          addLine('Error: Volume must be 0-100', 'error');
          break;
        }
        setVolume(vol);
        try { scWidgetRef.current?.setVolume(vol); } catch (e) {}
        addLine(`Volume set to ${vol}%`);
        break;
      }

      case 'next': {
        if (tracks.length === 0) {
          addLine('Error: No tracks in playlist', 'error');
          break;
        }
        if (!currentTrack) {
          playTrack(tracks[0]);
          break;
        }
        const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
        const nextTrack = tracks[(currentIndex + 1) % tracks.length];
        playTrack(nextTrack);
        break;
      }

      case 'prev': {
        if (tracks.length === 0) {
          addLine('Error: No tracks in playlist', 'error');
          break;
        }
        if (!currentTrack) {
          playTrack(tracks[0]);
          break;
        }
        const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
        const prevTrack = tracks[(currentIndex - 1 + tracks.length) % tracks.length];
        playTrack(prevTrack);
        break;
      }

      case 'status': {
        if (!currentTrack) {
          addLine('No track loaded. System ready.');
          break;
        }
        addLine(`Current Track: ${currentTrack.title}
Status: ${isPlaying ? 'PLAYING' : 'PAUSED/STOPPED'}
Volume: ${volume}%
Playlist: ${tracks.length} track(s)`);
        break;
      }

      case 'clear': {
        setLines([]);
        break;
      }

      default:
        addLine(`Command not found: ${cmd}. Type "help" for available commands.`, 'error');
    }
  }, [tracks, currentTrack, volume, isPlaying, addLine, playTrack, playUrl, stopVisualizer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        const value = inputValue.trim();
        if (!value) return;
        addLine(`<span class="tc-prompt">k@theemrld:~$</span> ${value}`, 'command');
        setInputValue('');
        const parts = value.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        executeCommand(cmd, args);
      }
    },
    [inputValue, addLine, executeCommand]
  );

  // Canvas resize
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth;
        canvasRef.current.height = canvasRef.current.offsetHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Load SoundCloud API script
  useEffect(() => {
    if (document.getElementById('sc-api')) return;
    const script = document.createElement('script');
    script.id = 'sc-api';
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      const existing = document.getElementById('sc-api');
      if (existing) existing.remove();
    };
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  if (bootPhase === 'booting') {
    return (
      <div className="kt-boot-overlay">
        <pre className="kt-boot-text">{bootText}</pre>
      </div>
    );
  }

  return (
    <div className="kt-body">
      {/* SoundCloud widget iframe -- tiny but in-viewport for mobile autoplay policy */}
      <iframe
        ref={widgetRef}
        id="soundcloud-widget"
        width="1"
        height="1"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        style={{ position: 'absolute', bottom: '0', left: '0', opacity: 0, pointerEvents: 'none' }}
      />

      <div className="kt-container">
        {/* Header */}
        <div className="kt-header">
          <div className="kt-title kt-glitch">
            K Terminal <span className="kt-artist-badge">THEEMRLD</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="kt-status hover:text-[#00ffff] transition-colors duration-300"
              style={{ textDecoration: 'none' }}
            >
              [&larr; PORTFOLIO]
            </Link>
            <div className="kt-status">
              [SYSTEM: ONLINE] [AUDIO: <span className={`kt-audio-${audioStatus === 'PLAYING' ? 'success' : audioStatus === 'PAUSED' ? 'warning' : 'error'}`}>{audioStatus}</span>]
            </div>
          </div>
        </div>

        {/* Visualizer */}
        <div className="kt-visualizer-container">
          <canvas ref={canvasRef} className="kt-canvas" />
        </div>

        {/* Progress bar */}
        <div className="kt-progress-container">
          <div className="kt-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="kt-track-info">
          <span id="current-track">{currentTrack ? currentTrack.title.toUpperCase() : 'NO TRACK LOADED'}</span>
          <span id="time-display">{timeDisplay}</span>
        </div>

        {/* Click-to-play track list */}
        {showClickStart && (
          <div className="kt-click-play">
            <div className="kt-click-header">
              <span className="kt-cyan">{isMobile ? 'TAP TO PLAY' : 'CLICK TO PLAY'}</span> -- @raikouno
            </div>
            {isMobile && (
              <div
                className="kt-mobile-play-hint"
                style={{
                  fontSize: '11px',
                  color: '#008f11',
                  marginBottom: '8px',
                  textAlign: 'center',
                  padding: '6px',
                  border: '1px dashed #008f11',
                }}
              >
                Tap any track below to start playback
              </div>
            )}
            <ul className="kt-track-list">
              {tracks.map((track) => (
                <li
                  key={track.id}
                  className={`kt-track-item ${currentTrack && currentTrack.id === track.id ? 'kt-playing' : ''}`}
                  onClick={() => playTrack(track)}
                >
                  <span className="kt-track-number">[{String(track.id).padStart(2, '0')}]</span>
                  <span className="kt-track-title">{track.title}</span>
                  <span className="kt-track-plays">
                    {track.plays >= 1000
                      ? `${(track.plays / 1000).toFixed(track.plays >= 10000 ? 0 : 1)}K plays`
                      : track.plays > 0
                        ? `${track.plays} plays`
                        : '--'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Terminal */}
        <div className="kt-terminal" ref={terminalRef}>
          {lines.map((line, i) => (
            <div
              key={i}
              className="kt-line"
              dangerouslySetInnerHTML={{ __html: line.text }}
              style={{ marginBottom: 5, opacity: 1 }}
            />
          ))}
        </div>

        {/* Input */}
        <div className="kt-input-line">
          <span className="kt-prompt">k@theemrld:~$</span>
          <input
            ref={inputRef}
            type="text"
            className="kt-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
          <span className="kt-cursor" />
        </div>
      </div>

      {/* Global styles for terminal page */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&family=Share+Tech+Mono&display=swap');

        .kt-body {
          background: #0d0208;
          color: #00ff41;
          font-family: 'Share Tech Mono', monospace;
          height: 100vh;
          overflow: hidden;
          position: relative;
        }

        /* CRT scanlines */
        .kt-body::before {
          content: " ";
          display: block;
          position: fixed;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
                      linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
          z-index: 10;
        }
        .kt-body::after {
          content: " ";
          display: block;
          position: fixed;
          top: 0; left: 0; bottom: 0; right: 0;
          background: rgba(18, 16, 16, 0.1);
          pointer-events: none;
          z-index: 11;
          animation: kt-flicker 0.15s infinite;
        }

        @keyframes kt-flicker {
          0% { opacity: 0.27861; } 5% { opacity: 0.34769; } 10% { opacity: 0.23604; }
          15% { opacity: 0.90626; } 20% { opacity: 0.18128; } 25% { opacity: 0.10689; }
          30% { opacity: 0.20316; } 35% { opacity: 0.85418; } 40% { opacity: 0.12793; }
          45% { opacity: 0.47557; } 50% { opacity: 0.1943; } 55% { opacity: 0.72038; }
          60% { opacity: 0.18335; } 65% { opacity: 0.15978; } 70% { opacity: 0.32258; }
          75% { opacity: 0.93817; } 80% { opacity: 0.13305; } 85% { opacity: 0.20232; }
          90% { opacity: 0.91513; } 95% { opacity: 0.15313; } 100% { opacity: 0.16754; }
        }

        .kt-boot-overlay {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: #0d0208;
          z-index: 100;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-family: 'VT323', monospace;
        }
        .kt-boot-text {
          font-size: 20px;
          max-width: 600px;
          width: 90%;
          color: #00ff41;
          line-height: 1.8;
        }

        .kt-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 20px;
          position: relative;
          z-index: 5;
        }

        .kt-header {
          border-bottom: 2px solid #00ff41;
          padding-bottom: 10px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .kt-title {
          font-size: 24px;
          text-shadow: 0 0 10px #00ff41;
          animation: kt-pulse 2s infinite;
        }
        @keyframes kt-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .kt-artist-badge {
          display: inline-block;
          background: rgba(0, 255, 255, 0.1);
          border: 1px solid #00ffff;
          color: #00ffff;
          padding: 2px 8px;
          margin-left: 10px;
          font-size: 12px;
          text-transform: uppercase;
        }
        .kt-status { font-size: 14px; color: #008f11; }
        .kt-audio-success { color: #00ff41; }
        .kt-audio-warning { color: #ffaa00; }
        .kt-audio-error { color: #ff3333; }

        .kt-glitch {
          position: relative;
          animation: kt-glitch-skew 1s infinite;
        }
        @keyframes kt-glitch-skew {
          0% { transform: skew(0deg); } 20% { transform: skew(-2deg); }
          40% { transform: skew(2deg); } 60% { transform: skew(0deg); }
          80% { transform: skew(1deg); } 100% { transform: skew(0deg); }
        }

        .kt-visualizer-container {
          height: 100px;
          border: 1px solid #008f11;
          margin-bottom: 10px;
          position: relative;
          background: rgba(0, 20, 0, 0.3);
          overflow: hidden;
        }
        .kt-canvas { width: 100%; height: 100%; display: block; }

        .kt-progress-container {
          width: 100%;
          height: 4px;
          background: #0d0208;
          border: 1px solid #008f11;
          position: relative;
        }
        .kt-progress-bar {
          height: 100%;
          background: #00ff41;
          transition: width 0.1s linear;
          box-shadow: 0 0 10px #00ff41;
        }
        .kt-track-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-top: 5px;
          margin-bottom: 10px;
          color: #008f11;
        }

        /* Click-to-play area */
        .kt-click-play {
          border: 1px dashed #00ffff;
          padding: 12px 15px;
          margin-bottom: 10px;
          background: rgba(0, 255, 255, 0.05);
          max-height: 160px;
          overflow-y: auto;
        }
        .kt-click-play::-webkit-scrollbar { width: 6px; }
        .kt-click-play::-webkit-scrollbar-track { background: #0d0208; }
        .kt-click-play::-webkit-scrollbar-thumb { background: #008f11; }
        .kt-click-header {
          font-size: 12px;
          color: #008f11;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .kt-track-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .kt-track-item {
          padding: 8px 10px;
          cursor: pointer;
          transition: all 0.3s;
          border-left: 2px solid transparent;
          font-size: 14px;
          color: #00ff41;
          display: flex;
          align-items: center;
          min-height: 36px;
          -webkit-tap-highlight-color: rgba(0, 255, 65, 0.2);
        }
        .kt-track-item:active {
          background: rgba(0, 255, 65, 0.15);
        }
        .kt-track-item:hover {
          background: rgba(0, 255, 65, 0.1);
          border-left: 2px solid #00ff41;
          padding-left: 14px;
        }
        .kt-track-item.kt-playing {
          background: rgba(0, 255, 65, 0.2);
          border-left: 2px solid #ff00ff;
          color: #ff00ff;
        }
        .kt-track-number { color: #008f11; margin-right: 8px; flex-shrink: 0; }
        .kt-track-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
        .kt-track-plays { color: #008f11; font-size: 11px; margin-left: 10px; flex-shrink: 0; }

        @media (max-width: 768px) {
          .kt-track-item {
            padding: 12px 10px;
            font-size: 15px;
            min-height: 44px;
          }
          .kt-track-plays { font-size: 12px; }
          .kt-container { padding: 10px; }
          .kt-title { font-size: 18px; }
          .kt-terminal { padding: 10px; font-size: 13px; }
          .kt-click-play { padding: 10px; }
          .kt-visualizer-container { height: 80px; }
        }

        .kt-terminal {
          flex: 1;
          overflow-y: auto;
          border: 1px solid #008f11;
          background: rgba(0, 10, 0, 0.8);
          padding: 15px;
          font-size: 15px;
          line-height: 1.6;
          box-shadow: inset 0 0 20px rgba(0, 255, 65, 0.1);
        }
        .kt-terminal::-webkit-scrollbar { width: 10px; }
        .kt-terminal::-webkit-scrollbar-track { background: #0d0208; border-left: 1px solid #008f11; }
        .kt-terminal::-webkit-scrollbar-thumb { background: #00ff41; border: 1px solid #0d0208; }

        .kt-input-line {
          display: flex;
          align-items: center;
          margin-top: 10px;
          border-top: 1px solid #008f11;
          padding-top: 10px;
        }
        .kt-prompt { color: #00ff41; margin-right: 10px; font-weight: bold; white-space: nowrap; }
        .kt-input {
          background: transparent;
          border: none;
          color: #00ff41;
          font-family: 'Share Tech Mono', monospace;
          font-size: 15px;
          flex: 1;
          outline: none;
          caret-color: #00ff41;
        }
        .kt-cursor {
          display: inline-block;
          width: 10px;
          height: 18px;
          background: #00ff41;
          animation: kt-blink 1s infinite;
          margin-left: 2px;
          flex-shrink: 0;
        }
        @keyframes kt-blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }

        /* Terminal color classes */
        .tc-prompt { color: #00ff41; font-weight: bold; }
        .tc-command { color: #00ff41; }
        .tc-response { color: #008f11; margin-left: 20px; }
        .tc-error { color: #ff3333; }
        .tc-success { color: #00ff41; }
        .tc-warning { color: #ffaa00; }
        .tc-cyan { color: #00ffff; }
      `}</style>
    </div>
  );
}
