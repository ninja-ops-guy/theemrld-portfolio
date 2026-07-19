import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const capabilities = [
  'NETWORK & SERVER ADMINISTRATION',
  'CYBERSECURITY OPERATIONS',
  'AI / ML ENGINEERING',
  'SCRIPTING & AUTOMATION',
  'SYSTEMS DEPLOYMENT',
  'QUANTITATIVE SYSTEMS',
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
    gsap.fromTo(
      leftRef.current,
      { x: -40, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      }
    );

    gsap.fromTo(
      rightRef.current,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative"
      style={{ background: '#0A1020', padding: '160px 0', zIndex: 1 }}
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 flex flex-col md:flex-row gap-8 md:gap-[5%]">
        <div ref={leftRef} className="md:w-[45%] opacity-0">
          <p className="font-label" style={{ marginBottom: '32px' }}>
            ABOUT
          </p>
          <h2
            className="font-headline"
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 3.2rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#E8EDF3',
            }}
          >
            I engineer systems that think, defend, and scale.
          </h2>

          <div style={{ marginTop: '40px' }}>
            <p className="font-label" style={{ marginBottom: '16px' }}>
              HIGHLIGHTS
            </p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {highlights.map((h) => (
                <li
                  key={h}
                  className="font-body"
                  style={{
                    fontSize: '14px',
                    color: '#8899AA',
                    lineHeight: 1.7,
                    paddingLeft: '16px',
                    position: 'relative',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ position: 'absolute', left: 0, color: '#4A6DFF' }}>&gt;</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div ref={rightRef} className="md:w-[50%] opacity-0">
          <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.7 }}>
            Infrastructure engineer with deep expertise across enterprise IT, cybersecurity, and
            emerging AI systems. Built hardened kiosk environments deployed across manufacturing
            floors. Recovered critical production systems from boot failure. Automated infrastructure
            inventory with SNMP tooling that eliminated manual walkdowns.
          </p>
          <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.7, marginTop: '24px' }}>
            Currently focused on embodied AI platforms, multi-agent orchestration systems, and
            quantitative prediction market infrastructure. 125+ TryHackMe rooms completed. Passionate
            about mentoring interns and STEM career outreach for the next generation of technologists.
          </p>

          <div className="flex flex-wrap gap-3" style={{ marginTop: '40px' }}>
            {capabilities.map((cap) => (
              <span key={cap} className="font-label border px-4 py-2" style={{ borderColor: '#1a2540' }}>
                {cap}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
