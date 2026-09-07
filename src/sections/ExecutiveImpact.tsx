import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const impacts = [
  {
    label: 'OPERATIONS',
    metric: '170+ → ~15',
    title: 'Turned a large support backlog into a controlled operating queue.',
    body: 'Pairs hands-on incident ownership with process improvement so recurring operational work becomes manageable rather than permanently reactive.',
  },
  {
    label: 'RESILIENCE',
    metric: 'PRODUCTION',
    title: 'Restored critical systems and built repeatable recovery paths.',
    body: 'Experienced in manufacturing environments where downtime has real operational consequences — from Windows recovery to network and kiosk infrastructure.',
  },
  {
    label: 'TECHNICAL LEADERSHIP',
    metric: 'CROSS-FUNCTIONAL',
    title: 'Connects infrastructure, networking, security, AI, and automation.',
    body: 'Translates across disciplines, mentors others, documents the operating model, and helps teams adopt emerging technology with appropriate controls.',
  },
  {
    label: 'R&D / INNOVATION',
    metric: 'EVIDENCE-FIRST',
    title: 'Builds research systems that are designed to learn from failure.',
    body: 'Independent work in embodied AI and adversarial ML emphasizes reproducibility, held-out evaluation, provenance, measurable evidence, and explicit limits on claims.',
  },
];

export default function ExecutiveImpact() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    gsap.fromTo(cards, { opacity: 0, y: 30 }, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 82%' },
    });
  }, []);

  return (
    <section id="impact" ref={sectionRef} className="relative" style={{ background: '#0A1020', padding: '96px 0', zIndex: 1 }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6" style={{ marginBottom: '48px' }}>
          <div>
            <p className="font-label" style={{ marginBottom: '16px' }}>EXECUTIVE IMPACT</p>
            <h2 className="font-headline" style={{ fontSize: 'clamp(2rem, 4vw, 3.4rem)', lineHeight: 1.05, color: '#E8EDF3', maxWidth: '760px' }}>
              Technical depth translated into operational leverage.
            </h2>
          </div>
          <p className="font-body" style={{ color: '#8899AA', lineHeight: 1.65, maxWidth: '420px', fontSize: '14px' }}>
            The through-line across my work is simple: reduce operational risk, automate repetitive work, build reusable capability, and make difficult technology easier for teams to operate.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px]" style={{ background: '#1A2540' }}>
          {impacts.map((item, index) => (
            <div key={item.label} ref={(el) => { cardsRef.current[index] = el; }} style={{ background: '#050A14', padding: '30px', opacity: 0 }}>
              <div className="flex items-center justify-between gap-4">
                <span className="font-label" style={{ color: '#4A6DFF' }}>{item.label}</span>
                <span className="font-headline" style={{ color: '#E8EDF3', fontSize: '13px', letterSpacing: '0.06em' }}>{item.metric}</span>
              </div>
              <h3 className="font-headline" style={{ color: '#E8EDF3', fontSize: 'clamp(1.1rem, 2vw, 1.55rem)', lineHeight: 1.2, marginTop: '22px' }}>{item.title}</h3>
              <p className="font-body" style={{ color: '#8899AA', fontSize: '14px', lineHeight: 1.65, marginTop: '12px' }}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
