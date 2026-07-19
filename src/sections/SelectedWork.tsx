import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    title: 'Palanroof / RoofBot',
    category: 'AI ROOFING INTELLIGENCE PLATFORM',
    image: '/images/proj-palanroof.jpg',
    desc: 'Full-stack operational intelligence platform for roofing workflows. AI vision inference, municipal permit auto-discovery pipeline across 500 US MSAs, multi-agent scraping with Ollama LLM fallback. React, TypeScript, Cloud Run.',
    link: 'https://palanroof.shop/',
  },
  {
    title: 'Kimi Claw x Vector',
    category: 'PHYSICAL AI COMPANION PLATFORM',
    image: '/images/proj-kimiclaw.jpg',
    desc: 'Embodied AI platform using Vector Robot. Go orchestration, Python motor APIs, locally hosted Qwen 2.5 VL multimodal models on RTX 4070. 32 orchestrated AI skills, UDP swarm networking for multi-robot communication.',
    link: null,
  },
  {
    title: 'Kalshi AI Trading Bot',
    category: 'QUANTITATIVE PREDICTION MARKET ENGINE',
    image: '/images/proj-kalshi.jpg',
    desc: 'Algorithmic trading infrastructure for Kalshi. Ensemble ML systems analyzing macroeconomic events and sentiment. Avellaneda-Stoikov market-making for binary contracts. Fractional Kelly Criterion risk management.',
    link: null,
  },
  {
    title: 'Municipal Permit Pipeline',
    category: 'MULTI-AGENT DATA INFRASTRUCTURE',
    image: '/images/proj-permits.jpg',
    desc: '6-agent swarm pipeline for autonomous municipal permit discovery across 500 US cities. 5 platform-specific scraping templates, Ollama LLM extraction, Redis/RQ orchestration, PostgreSQL/PostGIS, 35+ pytest tests.',
    link: null,
  },
  {
    title: 'Helpdesk Hero',
    category: 'POKEMON-STYLE IT TROUBLESHOOTING RPG',
    image: '/images/proj-helpdesk.jpg',
    desc: 'Turn-based battle system for tech issues. Working ROM hack of Pokemon FireRed replacing monsters with IT threats. Assembly scripting, tile editing, map navigation, certification-based skill progression.',
    link: null,
  },
];

export default function SelectedWork() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    cards.forEach((card, index) => {
      gsap.fromTo(card, { opacity: 0, y: 60 }, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: index * 0.15,
        scrollTrigger: { trigger: card, start: 'top 80%', toggleActions: 'play none none none' },
      });
    });
    return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, []);

  const leftProjects = projects.slice(0, 3);
  const rightProjects = projects.slice(3);

  return (
    <section id="work" ref={sectionRef} className="relative" style={{ background: '#050A14', padding: '120px 0', zIndex: 1 }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <p className="font-label" style={{ marginBottom: '64px' }}>SELECTED WORK</p>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col" style={{ gap: '80px' }}>
            {leftProjects.map((project, index) => (
              <div key={project.title} ref={(el) => { cardsRef.current[index] = el; }} className="group cursor-pointer opacity-0" data-cursor="expand">
                <div className="overflow-hidden">
                  <img src={project.image} alt={project.title} className="w-full transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]" style={{ aspectRatio: '4/3', objectFit: 'cover' }} loading="lazy" />
                </div>
                <h3 className="font-headline transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2" style={{ fontSize: 'clamp(1.2rem, 2vw, 1.8rem)', color: '#E8EDF3', marginTop: '16px', letterSpacing: '-0.02em' }}>{project.title}</h3>
                <p className="font-label" style={{ marginTop: '8px' }}>{project.category}</p>
                <p className="font-body" style={{ fontSize: '14px', color: '#8899AA', marginTop: '12px', lineHeight: 1.6 }}>{project.desc}</p>
                {project.link && (
                  <a href={project.link} target="_blank" rel="noopener noreferrer" className="font-label inline-block mt-3 hover:text-[#4A6DFF] transition-colors duration-300" onClick={(e) => e.stopPropagation()}>VISIT SITE &rarr;</a>
                )}
              </div>
            ))}
          </div>
          <div className="flex-1 flex flex-col" style={{ gap: '80px', paddingTop: '200px' }}>
            {rightProjects.map((project, index) => (
              <div key={project.title} ref={(el) => { cardsRef.current[index + 3] = el; }} className="group cursor-pointer opacity-0" data-cursor="expand">
                <div className="overflow-hidden">
                  <img src={project.image} alt={project.title} className="w-full transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]" style={{ aspectRatio: '4/3', objectFit: 'cover' }} loading="lazy" />
                </div>
                <h3 className="font-headline transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2" style={{ fontSize: 'clamp(1.2rem, 2vw, 1.8rem)', color: '#E8EDF3', marginTop: '16px', letterSpacing: '-0.02em' }}>{project.title}</h3>
                <p className="font-label" style={{ marginTop: '8px' }}>{project.category}</p>
                <p className="font-body" style={{ fontSize: '14px', color: '#8899AA', marginTop: '12px', lineHeight: 1.6 }}>{project.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
