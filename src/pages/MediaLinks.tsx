import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, Gamepad2, Github, Instagram, Music2, Terminal, Palette, Copy } from 'lucide-react';
import './media-links.css';

const socials = [
  { label: '@mikesninja', detail: 'Art & comics', href: 'https://www.instagram.com/mikesninja/' },
  { label: '@kind.dread', detail: 'Original artwork', href: 'https://www.instagram.com/kind.dread/' },
  { label: '@defied_stars', detail: 'Creative projects', href: 'https://www.instagram.com/defied_stars/' },
];

export default function MediaLinks() {
  const [copied, setCopied] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const copyInput = useRef<HTMLInputElement>(null);
  const hubUrl = new URL(import.meta.env.BASE_URL, window.location.origin).href + '#/links';
  useEffect(() => {
    const previous = document.title;
    document.title = 'THE EMRLD — Art, comics, music & worlds';
    return () => { document.title = previous; };
  }, []);
  useEffect(() => { if (manualCopy) { copyInput.current?.focus(); copyInput.current?.select(); } }, [manualCopy]);
  async function copyLink() {
    try { await navigator.clipboard.writeText(hubUrl); setCopied(true); setManualCopy(false); }
    catch { setManualCopy(true); setCopied(false); }
  }
  return <main className="media-hub">
    <div className="media-hub-inner">
      <header className="media-masthead">
        <Link to="/portfolio" className="media-wordmark"><span aria-hidden="true">◈</span> THE EMRLD</Link>
        <span>THE CREATIVE COLLECTION</span>
      </header>
      <div className="media-layout">
        <section className="media-intro" aria-labelledby="media-heading">
          <p className="media-eyebrow">NINJAOPSGUY / ARTIST & BUILDER</p>
          <h1 id="media-heading">Stories.<br />Sounds.<br /><em>Other worlds.</em></h1>
          <p className="media-intro-copy">Original art, comics, music, and places to get a little lost. Welcome to my corner of the universe.</p>
          <div className="media-orbit" aria-hidden="true"><span>THE<br />EMRLD</span><small>READ · LISTEN · EXPLORE</small></div>
          <div className="media-share">
            <button type="button" onClick={copyLink}><Copy size={15} aria-hidden="true" /> {copied ? 'Link copied' : 'Copy this hub’s link'}</button>
            <span role="status">{copied ? 'Ready to share.' : manualCopy ? 'Select and copy the address below.' : ''}</span>
            {manualCopy && <label className="manual-link">Media hub address<input ref={copyInput} readOnly value={hubUrl} onFocus={event => event.target.select()} /></label>}
          </div>
        </section>
        <div className="media-destinations">
          <section aria-labelledby="stories-label">
            <div className="media-section-label"><h2 id="stories-label">ENTER THE STORY</h2><span>01 / COMICS & GAMES</span></div>
            <Link to="/comic" className="media-feature">
              <div className="media-feature-top"><span className="media-tag">START READING</span><BookOpen size={24} aria-hidden="true" /></div>
              <h3>TECHOPS<br /><span>HERO</span></h3>
              <p>The comic. Start at the beginning, or return to the world you left behind.</p>
              <span className="media-action">Read TechOps Hero <ArrowRight size={20} aria-hidden="true" /></span>
              <span className="media-feature-mark" aria-hidden="true">TH</span>
            </Link>
            <div className="media-pair">
              <a href="/techops-hero/" className="media-card"><Gamepad2 size={21} aria-hidden="true" /><h3>Play TechOps Hero</h3><p>The main game. Start a run or continue your save.</p><span className="media-action">Enter the game <ArrowRight size={17} aria-hidden="true" /></span></a>
              <Link to="/see-world" className="media-card media-card-emerald"><span className="media-diamond" aria-hidden="true">◈</span><h3>See World</h3><p>Discover character perspectives through your game progress. Your choices open new Night Walker sections.</p><span className="media-action">Explore the stories <ArrowRight size={17} aria-hidden="true" /></span></Link>
            </div>
            <p className="media-small-note">New to the universe? The comic needs no save. To connect the games, use the same browser and device.</p>
          </section>
          <section aria-labelledby="explore-label">
            <div className="media-section-label"><h2 id="explore-label">FOLLOW YOUR CURIOSITY</h2><span>02 / ART & MUSIC</span></div>
            <nav className="media-list" aria-label="Art and music destinations">
              <Link to="/k/gallery"><Palette aria-hidden="true" size={20} /><span><strong>The 3D gallery</strong><small>Walk through the artwork.</small></span><ArrowRight aria-hidden="true" size={18} /></Link>
              <Link to="/terminal"><Terminal aria-hidden="true" size={20} /><span><strong>K Terminal</strong><small>Music, experiments, and an interactive terminal.</small></span><ArrowRight aria-hidden="true" size={18} /></Link>
              <a href="https://soundcloud.com/raikouno/tracks"><Music2 aria-hidden="true" size={20} /><span><strong>Original music</strong><small>Listen on SoundCloud · @raikouno</small></span><ArrowUpRight aria-hidden="true" size={18} /></a>
            </nav>
          </section>
          <section aria-labelledby="follow-label">
            <div className="media-section-label"><h2 id="follow-label">STAY IN THE LOOP</h2><span>03 / FOLLOW THE WORK</span></div>
            <nav className="media-socials" aria-label="Artist accounts">{socials.map(item => <a key={item.label} href={item.href}><Instagram size={16} aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.detail}</small></span><ArrowUpRight size={15} aria-hidden="true" /></a>)}</nav>
          </section>
        </div>
      </div>
      <footer className="media-footer"><p>Independent art. Connected stories.</p><nav aria-label="Creator links"><Link to="/portfolio">Portfolio <ArrowRight size={14} aria-hidden="true" /></Link><a href="https://github.com/ninja-ops-guy"><Github size={15} aria-hidden="true" /> GitHub</a></nav><small>BUILD · OPERATE · PROTECT · BELONG</small></footer>
    </div>
  </main>;
}
