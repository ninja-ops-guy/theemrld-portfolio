import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** Persistent K-world host. All /k/* destinations share one iframe/audio session.
 * The inner app owns travel, render modes and the sole audio controller. Keeping
 * its src fixed prevents route changes from restarting the current song.
 */
export default function AsciiCityWorld() {
  const location = useLocation();
  const navigate = useNavigate();
  const frame = useRef<HTMLIFrameElement>(null);
  const requested = useCallback(() => {
    const params = new URLSearchParams(location.search);
    return params.get('scene') || location.pathname.split('/').filter(Boolean).slice(-1)[0] || 'gallery';
  }, [location.pathname, location.search]);
  const [source] = useState(() => `${import.meta.env.BASE_URL}k-world/index.html?entry=${encodeURIComponent(requested())}`);
  const sendLocation = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: 'k-world:navigate', scene: requested() }, window.location.origin);
  }, [requested]);

  useEffect(() => { sendLocation(); }, [sendLocation]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'k-world:portfolio') navigate('/');
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [navigate]);

  return <iframe
    ref={frame}
    src={source}
    title="K // THE EMRLD — walkable city, gallery and portal worlds"
    allow="autoplay; fullscreen"
    referrerPolicy="strict-origin-when-cross-origin"
    onLoad={sendLocation}
    style={{ position: 'fixed', inset: 0, display: 'block', width: '100%', height: '100dvh', border: 0, background: '#070910', zIndex: 20 }}
  />;
}
