import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const capabilities = [
  'NETWORK & SERVER ADMINISTRATION',
  'CYBERSECURITY OPERATIONS',
  'AI-ASSISTED SYSTEMS ENGINEERING',
  'SCRIPTING & AUTOMATION',
  'SYSTEMS DEPLOYMENT',
  'RESEARCH & VALIDATION',
];

const highlights = [
  'Nominated "People Making a Difference" award at SARGENT (ASSA ABLOY)',
  'Reduced ticket queue from 170+ to ~15 average',
  'Completed 125+ TryHackMe rooms',
  'Mentored interns & STEM outreach volunteer',
  'Recovered failed production Windows systems (boot failure / EFI rebuild)',
  'Built SNMP automation tools eliminating manual infrastructure walkdowns',
];

const methodology = [
  ['01', 'FRAME', 'Define the problem, constraints, risks, and what success must prove.'],
  ['02', 'EXPLORE', 'Use AI-assisted research and generated technical papers to expand the idea space, compare approaches, surface assumptions, and challenge the preferred direction.'],
  ['03', 'DESIGN', 'Choose the architecture, mechanisms, interfaces, acceptance criteria, and experiments before optimizing implementation details.'],
  ['04', 'IMPLEMENT', 'Use AI heavily as an implementation accelerator. I optimize for system behavior and engineering intent rather than manually authoring syntax for its own sake.'],
  ['05', 'VERIFY', 'Read, test, debug, benchmark, and pressure-test generated implementations against the intended behavior and failure modes.'],
  ['06', 'ITERATE', 'Let evidence change the design. Failed tests and contradictory results feed the next research and architecture cycle.'],
];

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(leftRef.current, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', toggleActions: 'play none none none' } });
    gsap.fromTo(rightRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: 'power3.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', toggleActions: 'play none none none' } });
    return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, []);

  return (
    <section id="about" ref={sectionRef} className="relative" style={{ background: '#0A1020', padding: '160px 0', zIndex: 1 }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 flex flex-col md:flex-row gap-8 md:gap-[5%]">
        <div ref={leftRef} className="md:w-[45%] opacity-0">
          <p className="font-label" style={{ marginBottom: '32px' }}>ABOUT</p>
          <h2 className="font-headline" style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#E8EDF3' }}>
            I operate where infrastructure, security, research, automation, and execution meet.
          </h2>
          <div style={{ marginTop: '40px' }}>
            <p className="font-label" style={{ marginBottom: '16px' }}>HIGHLIGHTS</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {highlights.map((h) => (
                <li key={h} className="font-body" style={{ fontSize: '14px', color: '#8899AA', lineHeight: 1.7, paddingLeft: '16px', position: 'relative', marginBottom: '8px' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#4A6DFF' }}>&gt;</span>{h}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div ref={rightRef} className="md:w-[50%] opacity-0">
          <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.7 }}>
            Systems and security engineer with a track record of taking ambiguous operational problems from diagnosis through implementation. My work spans production IT, enterprise networking, cybersecurity operations, automation, and applied AI — with an emphasis on reducing operational friction, restoring critical services, and leaving behind repeatable systems instead of one-off fixes.
          </p>
          <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.7, marginTop: '24px' }}>
            My independent R&D work is deliberately AI-assisted. I begin with a concrete technical idea, build a deep model of the problem, and use AI to accelerate research, generate competing technical arguments, explore design space, and implement software. I retain ownership of problem definition, architecture, technical direction, acceptance criteria, validation, and final engineering decisions. I care more about understanding why a system behaves as it does than manually producing syntax.
          </p>
          <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.7, marginTop: '24px' }}>
            Generated research is treated as a reasoning artifact, not an authority: assumptions are challenged, alternatives are weighed, implementations are tested, and evidence is allowed to change the design. The objective is not maximum AI-generated code volume; it is using AI to increase the amount of engineering search, experimentation, and validation I can perform while maintaining technical ownership of the result.
          </p>
          <div className="flex flex-wrap gap-3" style={{ marginTop: '40px' }}>
            {capabilities.map((cap) => <span key={cap} className="font-label border px-4 py-2" style={{ borderColor: '#1a2540' }}>{cap}</span>)}
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 md:px-10" style={{ marginTop: '96px' }}>
        <div style={{ borderTop: '1px solid #1a2540', paddingTop: '40px' }}>
          <p className="font-label" style={{ marginBottom: '16px' }}>ENGINEERING METHOD</p>
          <h3 className="font-headline" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', color: '#E8EDF3', marginBottom: '40px' }}>Problem ownership over syntax ownership.</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: '#1a2540', border: '1px solid #1a2540' }}>
            {methodology.map(([n, title, body]) => (
              <div key={n} style={{ background: '#0A1020', padding: '28px' }}>
                <div className="font-label" style={{ color: '#4A6DFF', marginBottom: '18px' }}>{n} / {title}</div>
                <p className="font-body" style={{ fontSize: '14px', color: '#8899AA', lineHeight: 1.7, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
