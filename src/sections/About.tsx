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
    <section id="about" ref={sectionRef} className="relative" style={{ background: '#0A1020', padding: '130px 0', zIndex: 1 }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 flex flex-col md:flex-row gap-8 md:gap-[5%]">
        <div ref={leftRef} className="md:w-[45%] opacity-0">
          <p className="font-label" style={{ marginBottom: '32px' }}>OPERATING BACKGROUND</p>
          <h2 className="font-headline" style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#E8EDF3' }}>
            Production judgment anchors the research.
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
          <p className="font-body" style={{ fontSize: '16px', color: '#A6B3C2', lineHeight: 1.75 }}>
            My day-to-day engineering background is in production IT and infrastructure: ambiguous incidents, networking, endpoint recovery, automation, manufacturing systems, and operational queues where downtime has real consequences. That operating experience is the credibility layer underneath the independent research.
          </p>
          <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.75, marginTop: '24px' }}>
            The same method carries into R&amp;D: define the claim, formalize constraints, build the smallest mechanism that can test it, instrument the system, retain failures, and platformize only what survives verification. AI is used as an accelerator for research and implementation, while architecture, acceptance criteria, validation, and final engineering decisions remain evidence-driven.
          </p>
          <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.75, marginTop: '24px' }}>
            I am most interested in security engineering, AI security, red-team R&amp;D, autonomous systems, and platform/security engineering roles where production constraints and research discipline both matter.
          </p>
          <div className="flex flex-wrap gap-3" style={{ marginTop: '40px' }}>
            {capabilities.map((cap) => <span key={cap} className="font-label border px-4 py-2" style={{ borderColor: '#1a2540' }}>{cap}</span>)}
          </div>
          <div className="flex flex-wrap gap-3" style={{ marginTop: '34px' }}>
            <a href="https://github.com/ninja-ops-guy" target="_blank" rel="noreferrer" className="font-label px-5 py-3" style={{border:'1px solid #4A6DFF',color:'#4A6DFF'}}>GITHUB PROFILE →</a>
            <a href="#contact" className="font-label px-5 py-3" style={{background:'#4A6DFF',color:'#050A14'}}>CONTACT →</a>
          </div>
        </div>
      </div>
    </section>
  );
}
