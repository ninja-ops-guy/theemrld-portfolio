import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const impacts = [
  {
    label: 'OPERATIONS',
    metric: '170+ → ~15',
    title: 'I helped turn a huge support backlog into something the team could actually control.',
    body: 'I do not like solving the same ticket forever. If a problem keeps coming back, I look for the process, tooling, documentation, or infrastructure change that makes it cheaper the next time.',
  },
  {
    label: 'RESILIENCE',
    metric: 'PRODUCTION',
    title: 'I have had to recover systems when downtime was affecting real operations.',
    body: 'That includes Windows recovery, networking, kiosks, print infrastructure, and production systems where “it works on my machine” is not a useful answer.',
  },
  {
    label: 'TECHNICAL LEADERSHIP',
    metric: 'CROSS-FUNCTIONAL',
    title: 'I tend to end up in the gaps between infrastructure, security, networking, AI, and automation.',
    body: 'A lot of my value comes from being able to move between those areas, explain what is happening, document it, and help other people operate the result.',
  },
  {
    label: 'R&D / INNOVATION',
    metric: 'EVIDENCE-FIRST',
    title: 'I build research systems where failure is allowed to be a real result.',
    body: 'If an experiment fails, I would rather keep the failure and learn from it than polish it into a success story. That is why so much of the research work emphasizes provenance, held-out testing, and explicit limits on claims.',
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
            <p className="font-label" style={{ marginBottom: '16px' }}>WHAT THIS LOOKS LIKE IN PRACTICE</p>
            <h2 className="font-headline" style={{ fontSize: 'clamp(2rem, 4vw, 3.4rem)', lineHeight: 1.05, color: '#E8EDF3', maxWidth: '760px' }}>
              I care about making the system easier to operate after I touch it.
            </h2>
          </div>
          <p className="font-body" style={{ color: '#8899AA', lineHeight: 1.65, maxWidth: '420px', fontSize: '14px' }}>
            Whether it is production work or research, I usually end up doing the same thing: understand the failure, reduce the uncertainty, build something reusable, and make the next iteration better.
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
