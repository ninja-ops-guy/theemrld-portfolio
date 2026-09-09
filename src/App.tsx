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
import About from './sections/About';
import Networking from './sections/Networking';
import ImmersiveExperiences from './sections/ImmersiveExperiences';
import Contact from './sections/Contact';
import Footer from './sections/Footer';
import KTerminal from './sections/KTerminal';
import CaseStudy from './pages/CaseStudy';

gsap.registerPlugin(ScrollTrigger);

function Portfolio() {
  const lenisRef = useRef<Lenis | null>(null);
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, duration: 1.2 });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); lenis.destroy(); };
  }, []);
  return <><ConstellationCanvas /><CustomCursor /><Navigation /><main className="relative"><Hero /><ExecutiveImpact /><SelectedWork /><About /><Networking /><ImmersiveExperiences /><Contact /></main><Footer /></>;
}

function App() {
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  return <Routes>
    <Route path="/" element={<Portfolio />} />
    <Route path="/terminal" element={<KTerminal />} />
    <Route path="/case-study/:slug" element={<CaseStudy />} />
  </Routes>;
}

export default App;
