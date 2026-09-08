import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    title: 'Adversarial Clothing Pipeline',
    category: 'ADVERSARIAL ML / COMPUTER VISION RESEARCH',
    image: 'https://tjsizcvhdprxa.kimi.page/images/proj-adversarial.jpg',
    desc: 'A research pipeline that designs machine-optimized clothing patterns to break computer vision classifiers. Combines a black-box adversarial optimizer, neural pattern deformation, and a differentiable physics engine that simulates how fabric drapes and stretches. Includes a browser-based Pattern Lab with 8 procedural generators and a full certification benchmark for reproducible results. Python backend + React design studio.',
    link: null,
    github: 'https://github.com/ninja-ops-guy/adversarial-clothing-pipeline',
  },
  {
    title: 'Palanroof / RoofBot',
    category: 'AI ROOFING INTELLIGENCE PLATFORM',
    image: 'https://tjsizcvhdprxa.kimi.page/images/proj-palanroof.jpg',
    desc: 'Full-stack operational intelligence platform for roofing workflows. AI vision inference, municipal permit auto-discovery pipeline across 500 US MSAs, multi-agent scraping with Ollama LLM fallback. React, TypeScript, Cloud Run.',
    link: 'https://palanroof.shop/',
  },
  {
    title: 'InvoicePro',
    category: 'PROFESSIONAL INVOICE GENERATOR — FULL-STACK SAAS',
    image: 'https://tjsizcvhdprxa.kimi.page/images/proj-invoicepro.jpg',
    desc: 'Full-featured invoice generator for freelancers. Split-screen form editor with live PDF preview, business and client info management, line items with auto-calculation, invoice history, client database, demo data loading, and PDF download. Clean React frontend with real-time preview updates.',
    link: 'https://u3jyyp6jtucdg.kimi.page',
  },
  {
    title: 'Kimi Claw x Vector',
    category: 'PHYSICAL AI COMPANION PLATFORM',
    image: 'https://tjsizcvhdprxa.kimi.page/images/proj-kimiclaw.jpg',
    desc: 'Embodied AI platform using Vector Robot. Go orchestration, Python motor APIs, locally hosted Qwen 2.5 VL multimodal models on RTX 4070. 32 orchestrated AI skills, UDP swarm networking for multi-robot communication.',
    link: null,
  },
  {
    title: 'Kalshi AI Trading Bot',
    category: 'QUANTITATIVE PREDICTION MARKET ENGINE',
    image: 'https://tjsizcvhdprxa.kimi.page/images/proj-kalshi.jpg',
    desc: 'Algorithmic trading infrastructure for Kalshi. Ensemble ML systems analyzing macroeconomic events and sentiment. Avellaneda-Stoikov market-making for binary contracts. Fractional Kelly Criterion risk management.',
    link: null,
  },
  {
    title: 'CIC & SAT Research',
    category: 'P VS NP RESEARCH PROGRAM — 18 STAGES, 60+ TRACKS',
    image: 'https://tjsizcvhdprxa.kimi.page/images/proj-cic-sat.jpg',
    desc: 'Computational Information Complexity framework connecting constraint graph structure to proof and circuit complexity. ~58 theorems (8 rigorous), 6 software tools (6,800 LOC), 3 academic papers, 1 Lean 4 formalization, Red Team Security Harness with 4 modules. 25.7M formulas verified. Novel result: L≠P implies SAT not in NC^1.',
    link: 'https://kymplwsfrh776.kimi.page',
    github: 'https://github.com/ninja-ops-guy/cic-p-vs-np-research',
  },
  {
    title: 'TechOps Hero',
    category: 'ROGUELITE IT CAREER RPG — 65KB, ZERO DEPENDENCIES',
    image: 'https://tjsizcvhdprxa.kimi.page/images/proj-helpdesk.jpg',
    desc: 'Roguelite RPG across a 4-zone aerospace campus — factory floor, corporate offices, server room, reception lobby — each a profit center with distinct failure patterns. Every ticket follows a 5-phase diagnosis pipeline: Interview the user → Isolate root cause from 3 competing hypotheses → Select the portal → Turn-based command battle → Close and debrief. Diagnosis accuracy directly impacts battle: correct root cause = weakened enemy (-30% HP, exposed weakness), wrong one = full-strength fight plus stress penalty. Combat offers 4-6 real commands per scenario — ipconfig /all, tshark -i eth0, gpupdate /force, Restart-Service Spooler, nslookup, dsquery — each with type-effectiveness, resource cost (time/stress), and branching consequences. Flush DNS solves NXDOMAIN but wastes a turn on routing issues; reboot works on 40% of tickets but skips the root cause and hurts your solve-rate rating. 8-rank career ladder to CIO. 7 certifications unlock battle abilities. 6+ boss fights with phase-2 enrage mechanics. Custom Canvas 2D pixel-art engine, Puppeteer balance-testing harness, Web Audio chiptune SFX, SoundCloud soundtrack. Mobile-first with touch D-pad.',
    link: 'https://rfmffik3vwxwg.kimi.page/?sharetype=link',
    github: 'https://github.com/ninja-ops-guy/techops-hero',
  },
];

export default function SelectedWork() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];

    cards.forEach((card, index) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          delay: index * 0.15,
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const leftProjects = projects.slice(0, 4);
  const rightProjects = projects.slice(4); // 3 projects with offset

  return (
    <section
      id="work"
      ref={sectionRef}
      className="relative"
      style={{ background: '#050A14', padding: '120px 0', zIndex: 1 }}
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <p className="font-label" style={{ marginBottom: '64px' }}>
          SELECTED WORK
        </p>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left column - 4 projects */}
          <div className="flex-1 flex flex-col" style={{ gap: '80px' }}>
            {leftProjects.map((project, index) => (
              <div
                key={project.title}
                ref={(el) => { cardsRef.current[index] = el; }}
                className="group cursor-pointer opacity-0"
                data-cursor="expand"
              >
                <div className="overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                    style={{ aspectRatio: '4/3', objectFit: 'cover' }}
                    loading="lazy"
                  />
                </div>
                <h3
                  className="font-headline transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2"
                  style={{
                    fontSize: 'clamp(1.2rem, 2vw, 1.8rem)',
                    color: '#E8EDF3',
                    marginTop: '16px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {project.title}
                </h3>
                <p className="font-label" style={{ marginTop: '8px' }}>
                  {project.category}
                </p>
                <p
                  className="font-body"
                  style={{
                    fontSize: '14px',
                    color: '#8899AA',
                    marginTop: '12px',
                    lineHeight: 1.6,
                  }}
                >
                  {project.desc}
                </p>
                <div className="flex flex-wrap gap-3 mt-4">
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block font-label px-5 py-2 border border-[#4A6DFF] text-[#4A6DFF] hover:bg-[#4A6DFF] hover:text-[#050A14] transition-all duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      VIEW PROJECT &rarr;
                    </a>
                  )}
                  {(project as any).github && (
                    <a
                      href={(project as any).github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block font-label px-5 py-2 border border-[#8899AA] text-[#8899AA] hover:bg-[#8899AA] hover:text-[#050A14] transition-all duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      GITHUB &rarr;
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right column - 3 projects, offset */}
          <div
            className="flex-1 flex flex-col"
            style={{ gap: '80px', paddingTop: '200px' }}
          >
            {rightProjects.map((project, index) => (
              <div
                key={project.title}
                ref={(el) => { cardsRef.current[index + 3] = el; }}
                className="group cursor-pointer opacity-0"
                data-cursor="expand"
              >
                <div className="overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                    style={{ aspectRatio: '4/3', objectFit: 'cover' }}
                    loading="lazy"
                  />
                </div>
                <h3
                  className="font-headline transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2"
                  style={{
                    fontSize: 'clamp(1.2rem, 2vw, 1.8rem)',
                    color: '#E8EDF3',
                    marginTop: '16px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {project.title}
                </h3>
                <p className="font-label" style={{ marginTop: '8px' }}>
                  {project.category}
                </p>
                <p
                  className="font-body"
                  style={{
                    fontSize: '14px',
                    color: '#8899AA',
                    marginTop: '12px',
                    lineHeight: 1.6,
                  }}
                >
                  {project.desc}
                </p>
                <div className="flex flex-wrap gap-3 mt-4">
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block font-label px-5 py-2 border border-[#4A6DFF] text-[#4A6DFF] hover:bg-[#4A6DFF] hover:text-[#050A14] transition-all duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      VIEW PROJECT &rarr;
                    </a>
                  )}
                  {(project as any).github && (
                    <a
                      href={(project as any).github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block font-label px-5 py-2 border border-[#8899AA] text-[#8899AA] hover:bg-[#8899AA] hover:text-[#050A14] transition-all duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      GITHUB &rarr;
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
