import { useCallback, useEffect, useRef, useState } from 'react';

export type KSoundtrackTrack = {
  title: string;
  url: string;
};

type Props = {
  cueKey: string;
  playlist: KSoundtrackTrack[];
  armed?: boolean;
  volume?: number;
  onProgress?: (positionMs: number, durationMs: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  onTrackChange?: (track: KSoundtrackTrack, index: number) => void;
};

declare global {
  interface Window { SC?: any; }
}

const API_ID = 'sc-api';

function ensureSoundCloudApi(): Promise<any> {
  if (window.SC?.Widget) return Promise.resolve(window.SC);
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(API_ID) as HTMLScriptElement | null;
    if (existing) {
      const poll = window.setInterval(() => {
        if (window.SC?.Widget) {
          window.clearInterval(poll);
          resolve(window.SC);
        }
      }, 100);
      window.setTimeout(() => {
        window.clearInterval(poll);
        if (window.SC?.Widget) resolve(window.SC);
        else reject(new Error('SoundCloud Widget API timed out'));
      }, 8000);
      return;
    }
    const script = document.createElement('script');
    script.id = API_ID;
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    script.onload = () => resolve(window.SC);
    script.onerror = () => reject(new Error('SoundCloud Widget API failed to load'));
    document.body.appendChild(script);
  });
}

export default function KWorldAudio({
  cueKey,
  playlist,
  armed = true,
  volume = 55,
  onProgress,
  onPlayingChange,
  onTrackChange,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);
  const boundRef = useRef(false);
  const durationRef = useRef(0);
  const playTokenRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [needsGesture, setNeedsGesture] = useState(false);

  const current = playlist[Math.min(index, Math.max(0, playlist.length - 1))];

  const bind = useCallback((widget: any) => {
    if (boundRef.current || !window.SC?.Widget) return;
    boundRef.current = true;
    const E = window.SC.Widget.Events;

    widget.bind(E.READY, () => {
      widget.setVolume(volume);
      widget.getDuration((d: number) => { durationRef.current = d || 0; });
    });
    widget.bind(E.PLAY, () => {
      setNeedsGesture(false);
      onPlayingChange?.(true);
      widget.getDuration((d: number) => { durationRef.current = d || 0; });
    });
    widget.bind(E.PAUSE, () => onPlayingChange?.(false));
    widget.bind(E.FINISH, () => {
      onPlayingChange?.(false);
      if (playlist.length > 1) setIndex((i) => (i + 1) % playlist.length);
    });
    widget.bind(E.PLAY_PROGRESS, (e: any) => {
      onProgress?.(e?.currentPosition || 0, durationRef.current);
    });
  }, [onPlayingChange, onProgress, playlist.length, volume]);

  const loadCurrent = useCallback(async (forcePlay = false) => {
    if (!armed || !current || !iframeRef.current) return;
    const token = ++playTokenRef.current;
    try {
      const SC = await ensureSoundCloudApi();
      if (token !== playTokenRef.current || !iframeRef.current) return;
      const widget = widgetRef.current || SC.Widget(iframeRef.current);
      widgetRef.current = widget;
      bind(widget);
      onTrackChange?.(current, index);
      widget.load(current.url, {
        auto_play: true,
        hide_related: true,
        show_comments: false,
        show_user: false,
        show_reposts: false,
        visual: false,
        callback: () => {
          if (token !== playTokenRef.current) return;
          widget.setVolume(volume);
          widget.getDuration((d: number) => { durationRef.current = d || 0; });
          widget.play();
          window.setTimeout(() => {
            widget.isPaused((paused: boolean) => {
              if (paused) setNeedsGesture(true);
            });
          }, forcePlay ? 500 : 1200);
        },
      });
    } catch {
      setNeedsGesture(true);
      onPlayingChange?.(false);
    }
  }, [armed, bind, current, index, onPlayingChange, onTrackChange, volume]);

  useEffect(() => {
    setIndex(0);
  }, [cueKey]);

  useEffect(() => {
    loadCurrent(false);
  }, [cueKey, index, loadCurrent]);

  useEffect(() => {
    widgetRef.current?.setVolume?.(volume);
  }, [volume]);

  useEffect(() => {
    if (!armed) {
      widgetRef.current?.pause?.();
      onPlayingChange?.(false);
    }
  }, [armed, onPlayingChange]);

  if (!playlist.length) return null;

  return (
    <>
      <iframe
        ref={iframeRef}
        title="K world soundtrack"
        width="1"
        height="1"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(current?.url || 'https://soundcloud.com/raikouno')}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false`}
        style={{ position: 'fixed', left: 0, bottom: 0, width: 1, height: 1, opacity: 0.01, pointerEvents: 'none', border: 0, zIndex: -1 }}
      />
      {needsGesture && (
        <button className="kc-audio-arm" type="button" onClick={() => loadCurrent(true)}>
          ▶ ENABLE {current?.title?.toUpperCase() || 'SOUNDTRACK'}
        </button>
      )}
    </>
  );
}
