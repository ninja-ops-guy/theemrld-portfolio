import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const items = [
  ['Start here','#impact'],
  ['Flagships','#work'],
  ['Research','#research-thesis'],
  ['Evidence','#evidence'],
  ['Journey','#journey'],
  ['Background','#about'],
  ['Credentials','#networking'],
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { const onScroll=()=>setScrolled(window.scrollY>160); window.addEventListener('scroll',onScroll,{passive:true}); return()=>window.removeEventListener('scroll',onScroll); }, []);
  const scrollTo=(id:string)=>{
    setMenuOpen(false);
    const target=document.querySelector(id);
    if(!target) return;
    window.dispatchEvent(new CustomEvent('portfolio-scroll',{detail:id}));
    window.setTimeout(()=>{ if(Math.abs(target.getBoundingClientRect().top)>120) target.scrollIntoView({behavior:'smooth',block:'start'}); },120);
  };
  return <nav aria-label="Portfolio" onKeyDown={event=>{if(event.key==='Escape' && menuOpen){setMenuOpen(false);menuToggle.current?.focus();}}} className="fixed top-0 left-0 right-0 z-[100] transition-all duration-[400ms] ease-out" style={{height:'64px',background:scrolled?'rgba(5,10,20,.9)':'rgba(5,10,20,.62)',backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)'}}>
    <div className="flex items-center justify-between h-full px-6 md:px-10 max-w-[1440px] mx-auto">
      <a href="#hero" onClick={(e)=>{e.preventDefault();scrollTo('#hero')}} className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#E8EDF3]">THEEMRLD</a>
      <div className="hidden lg:flex items-center gap-6">{items.map(([label,id])=><button key={id} onClick={()=>scrollTo(id)} className="font-label hover:text-[#E8EDF3] transition-colors" style={{color:'#8899AA'}}>{label}</button>)}<Link to="/terminal" className="font-label" style={{color:'#8899AA'}}>Terminal</Link><a href="https://ninja-ops-guy.github.io/developer-portfolio/" target="_blank" rel="noreferrer" className="font-label" style={{color:'#9AAEFF'}}>Developer View ↗</a><button onClick={()=>scrollTo('#contact')} className="font-label px-4 py-2" style={{color:'#4A6DFF',border:'1px solid #4A6DFF'}}>Contact</button></div>
      <button ref={menuToggle} className="lg:hidden flex flex-col justify-center gap-[5px] p-2 min-w-11 min-h-11" onClick={()=>setMenuOpen(open=>!open)} aria-label="Toggle menu" aria-expanded={menuOpen} aria-controls="portfolio-mobile-menu"><span className="block w-5 h-[1px] bg-[#E8EDF3]"/><span className="block w-5 h-[1px] bg-[#E8EDF3]"/><span className="block w-5 h-[1px] bg-[#E8EDF3]"/></button>
    </div>
    <div id="portfolio-mobile-menu" inert={!menuOpen} className="lg:hidden fixed top-[64px] right-0 h-[calc(100dvh-64px)] w-[290px] max-w-full overflow-y-auto overscroll-contain transition-transform duration-300" style={{background:'#050A14',transform:menuOpen?'translateX(0)':'translateX(100%)'}}><div className="flex flex-col gap-7 p-9 pt-12">{items.map(([label,id])=><button key={id} onClick={()=>scrollTo(id)} className="font-label text-left" style={{color:'#A2B0BF'}}>{label}</button>)}<Link to="/terminal" onClick={()=>setMenuOpen(false)} className="font-label" style={{color:'#8899AA'}}>Terminal</Link><a href="https://ninja-ops-guy.github.io/developer-portfolio/" target="_blank" rel="noreferrer" onClick={()=>setMenuOpen(false)} className="font-label" style={{color:'#9AAEFF'}}>Developer View ↗</a><button onClick={()=>scrollTo('#contact')} className="font-label px-5 py-3" style={{color:'#4A6DFF',border:'1px solid #4A6DFF'}}>Contact</button></div></div>
  </nav>;
}
