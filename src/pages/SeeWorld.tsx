import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/** One story reader; only its optional gallery owns world audio. */
export default function SeeWorld() {
  const frame = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type !== 'see-world:navigate') return;
      const routes: Record<string, string> = { comic: '/comic', links: '/links', terminal: '/terminal', portfolio: '/portfolio' };
      const to = event.data.to;
      if (typeof to === 'string' && Object.prototype.hasOwnProperty.call(routes, to)) navigate(routes[to]);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [navigate]);
  return <iframe ref={frame} src={`${import.meta.env.BASE_URL}see-world/index.html`}
    title="See World — interactive stories"
    allow="autoplay; fullscreen" referrerPolicy="strict-origin-when-cross-origin"
    style={{ position: 'fixed', inset: 0, width: '100%', height: '100dvh', border: 0, background: '#091310', zIndex: 20 }} />;
}
