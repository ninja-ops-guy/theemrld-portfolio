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
          <p className="font-label" style={{ marginBottom: '32px' }}>BACKGROUND</p>
          <h2 className="font-headline" style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#E8EDF3' }}>
            The research makes more sense when you know where I came from.
          </h2>
          <div style={{ marginTop: '40px' }}>
            <p className="font-label" style={{ marginBottom: '16px' }}>A FEW THINGS I CAN POINT TO</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {highlights.map((h) => (
                <li key={h} className="font-body" style={{ fontSize: '14px', color: '#8899AA', lineHeight: 1.7, paddingLeft: '16px', position: 'relative', marginBottom: '8px' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#5A78FF' }}>&gt;</span>{h}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div ref={rightRef} className="md:w-[50%] opacity-0">
          <p className="font-body" style={{ fontSize: '16px', color: '#A6B3C2', lineHeight: 1.75 }}>
            Most of my day-to-day background is production IT and infrastructure. That means weird incidents, networking problems, endpoint recovery, manufacturing systems, automation, and queues where people are waiting on you to get something working again.
          </p>
          <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.75, marginTop: '24px' }}>
            I tend to approach research the same way. Start with a real question, break it down until I can test it, build something, instrument it, and see what survives. If it fails, I keep the failure. If it works, I try to understand why and turn the useful mechanism into something I can reuse elsewhere.
          </p>
          <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.75, marginTop: '24px' }}>
            I use AI heavily because it lets me explore more ideas, compare approaches, implement faster, and test a wider design space. I do not treat model output as evidence. Architecture, constraints, acceptance criteria, validation, and the final engineering calls still have to hold up on their own.
          </p>
          <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.75, marginTop: '24px' }}>
            The work I want more of is security engineering, security research, AI security, red-team R&amp;D, autonomous systems, and platform engineering where production reality and research discipline both matter.
          </p>
          <div className="flex flex-wrap gap-3" style={{ marginTop: '40px' }}>
            {capabilities.map((cap) => <span key={cap} className="font-label border px-4 py-2" style={{ borderColor: '#1a2540' }}>{cap}</span>)}
          </div>
          <div className="flex flex-wrap gap-3" style={{ marginTop: '34px' }}>
            <a href="https://github.com/ninja-ops-guy" target="_blank" rel="noreferrer" className="font-label px-5 py-3" style={{border:'1px solid #5A78FF',color:'#5A78FF'}}>GITHUB PROFILE →</a>
            <a href="#contact" className="font-label px-5 py-3" style={{background:'#5A78FF',color:'#050A14'}}>CONTACT →</a>
          </div>
        </div>
      </div>
    </section>
  );
}
