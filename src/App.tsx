import { useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ConstellationCanvas from './sections/ConstellationCanvas';
import CustomCursor from './sections/CustomCursor';
import Navigation from './sections/Navigation';
import Hero from './sections/Hero';
import SelectedWork from './sections/SelectedWork';
import ExecutiveImpact from './sections/ExecutiveImpact';
import ResearchThesis from './sections/ResearchThesis';
import EvidenceMatrix from './sections/EvidenceMatrix';
import About from './sections/About';
import Journey from './sections/Journey';
import Networking from './sections/Networking';
import Contact from './sections/Contact';
import Footer from './sections/Footer';
import KTerminal from './sections/KTerminal';
import CaseStudy from './pages/CaseStudy';
import ProgramCaseStudy from './pages/ProgramCaseStudy';

gsap.registerPlugin(ScrollTrigger);

function Portfolio() {
  const lenisRef = useRef<Lenis | null>(null);
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, duration: 1.2 });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    const onPortfolioScroll = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      const target = id ? document.querySelector(id) : null;
      if (target) lenis.scrollTo(target as HTMLElement, { offset: -64, duration: 1.1 });
    };
    window.addEventListener('portfolio-scroll', onPortfolioScroll);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { window.removeEventListener('portfolio-scroll', onPortfolioScroll); gsap.ticker.remove(tick); lenis.destroy(); };
  }, []);
  return <><ConstellationCanvas /><CustomCursor /><Navigation /><main className="relative"><Hero /><ExecutiveImpact /><SelectedWork /><ResearchThesis /><EvidenceMatrix /><Journey /><About /><Networking /><Contact /></main><Footer /></>;
}

function App() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    if (location.hash) requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' }));
  }, [location.pathname, location.hash]);
  return <Routes>
    <Route path="/" element={<Portfolio />} />
    <Route path="/terminal" element={<KTerminal />} />
    <Route path="/case-study/residual" element={<ProgramCaseStudy slug="residual" />} />
    <Route path="/case-study/verified-cyber-planning" element={<ProgramCaseStudy slug="verified-cyber-planning" />} />
    <Route path="/case-study/:slug" element={<CaseStudy />} />
  </Routes>;
}

export default App;
