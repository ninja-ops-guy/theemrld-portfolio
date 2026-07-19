import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navigation() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 200); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-[400ms] ease-out"
      style={{
        height: '64px',
        background: scrolled ? 'rgba(5, 10, 20, 0.85)' : 'rgba(5, 10, 20, 0.6)',
        backdropFilter: scrolled ? 'blur(20px)' : 'blur(12px)',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'blur(12px)',
      }}
    >
      <div className="flex items-center justify-between h-full px-6 md:px-10 max-w-[1440px] mx-auto">
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#E8EDF3]">
          THEEMRLD
        </a>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo('#work')} className="font-label bg-transparent hover:text-[#E8EDF3] transition-colors duration-300 cursor-pointer" style={{ color: '#8899AA', border: 'none', outline: 'none' }}>Work</button>
          <button onClick={() => scrollTo('#about')} className="font-label bg-transparent hover:text-[#E8EDF3] transition-colors duration-300 cursor-pointer" style={{ color: '#8899AA', border: 'none', outline: 'none' }}>About</button>
          <button onClick={() => scrollTo('#networking')} className="font-label bg-transparent hover:text-[#E8EDF3] transition-colors duration-300 cursor-pointer" style={{ color: '#8899AA', border: 'none', outline: 'none' }}>Networking</button>
          <button onClick={() => scrollTo('#contact')} className="font-label bg-transparent hover:text-[#E8EDF3] transition-colors duration-300 cursor-pointer" style={{ color: '#8899AA', border: 'none', outline: 'none' }}>Contact</button>
          <Link to="/terminal" className="font-label hover:text-[#00ff41] transition-colors duration-300 no-underline" style={{ color: '#8899AA', textDecoration: 'none' }}>Terminal</Link>
          <button onClick={() => scrollTo('#contact')} className="font-label bg-transparent px-5 py-2 hover:bg-[#4A6DFF] hover:text-[#050A14] transition-all duration-300 cursor-pointer" style={{ color: '#4A6DFF', border: '1px solid #4A6DFF' }}>Start a Project</button>
        </div>

        <button className="md:hidden flex flex-col gap-[5px] p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span className="block w-5 h-[1px] bg-[#E8EDF3] transition-all duration-300" style={{ transform: menuOpen ? 'rotate(45deg) translate(3px, 3px)' : 'none' }} />
          <span className="block w-5 h-[1px] bg-[#E8EDF3] transition-all duration-300" style={{ opacity: menuOpen ? 0 : 1 }} />
          <span className="block w-5 h-[1px] bg-[#E8EDF3] transition-all duration-300" style={{ transform: menuOpen ? 'rotate(-45deg) translate(3px, -3px)' : 'none' }} />
        </button>
      </div>

      <div className="md:hidden fixed top-[64px] right-0 bottom-0 w-[280px] transition-transform duration-500 ease-out"
        style={{ background: 'rgba(5, 10, 20, 0.95)', backdropFilter: 'blur(20px)', transform: menuOpen ? 'translateX(0)' : 'translateX(100%)' }}>
        <div className="flex flex-col gap-8 p-10 pt-16">
          <button onClick={() => scrollTo('#work')} className="font-label text-left bg-transparent hover:text-[#E8EDF3] transition-colors duration-300 cursor-pointer" style={{ color: '#8899AA', border: 'none', outline: 'none' }}>Work</button>
          <button onClick={() => scrollTo('#about')} className="font-label text-left bg-transparent hover:text-[#E8EDF3] transition-colors duration-300 cursor-pointer" style={{ color: '#8899AA', border: 'none', outline: 'none' }}>About</button>
          <button onClick={() => { scrollTo('#networking'); setMenuOpen(false); }} className="font-label text-left bg-transparent hover:text-[#E8EDF3] transition-colors duration-300 cursor-pointer" style={{ color: '#8899AA', border: 'none', outline: 'none' }}>Networking</button>
          <button onClick={() => scrollTo('#contact')} className="font-label text-left bg-transparent hover:text-[#E8EDF3] transition-colors duration-300 cursor-pointer" style={{ color: '#8899AA', border: 'none', outline: 'none' }}>Contact</button>
          <Link to="/terminal" onClick={() => setMenuOpen(false)} className="font-label text-left hover:text-[#00ff41] transition-colors duration-300 no-underline" style={{ color: '#8899AA', textDecoration: 'none' }}>Terminal</Link>
          <button onClick={() => scrollTo('#contact')} className="font-label bg-transparent px-5 py-3 text-center hover:bg-[#4A6DFF] hover:text-[#050A14] transition-all duration-300 cursor-pointer" style={{ color: '#4A6DFF', border: '1px solid #4A6DFF' }}>Start a Project</button>
        </div>
      </div>
    </nav>
  );
}
