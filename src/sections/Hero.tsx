import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const domains = ['SECURITY RESEARCH','AUTONOMOUS SYSTEMS','FORMAL VERIFICATION','ADVERSARIAL ML','INFRASTRUCTURE','PLATFORM ENGINEERING'];

export default function Hero() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    const target = document.querySelector(id);
    if (!target) return;
    window.dispatchEvent(new CustomEvent('portfolio-scroll', { detail: id }));
    window.setTimeout(() => {
      if (Math.abs(target.getBoundingClientRect().top) > 120) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(labelRef.current,{ opacity: 0, y: 10 },{ opacity: 1, y: 0, duration: 0.6, delay: 0.2 })
      .fromTo(headlineRef.current,{ opacity: 0, y: 30 },{ opacity: 1, y: 0, duration: 1.0 },'-=0.25')
      .fromTo(sublineRef.current,{ opacity: 0, y: 20 },{ opacity: 1, y: 0, duration: 0.7 },'-=0.5')
      .fromTo(scrollIndicatorRef.current,{ opacity: 0 },{ opacity: 1, duration: 0.5 },'-=0.1');
    const scrollLine = scrollIndicatorRef.current?.querySelector('.scroll-line');
    if (scrollLine) gsap.to(scrollLine,{ y: 8, duration: 2, ease: 'sine.inOut', repeat: -1, yoyo: true });
  }, []);

  return (
    <section id="hero" className="relative flex flex-col items-center justify-center overflow-hidden" style={{ minHeight: '100dvh', zIndex: 1 }}>
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-[1180px]">
        <p ref={labelRef} className="font-label" style={{ marginBottom: '22px', opacity: 0 }}>SYSTEMS // SECURITY // APPLIED R&amp;D</p>
        <h1 ref={headlineRef} className="font-headline uppercase" style={{ fontSize: 'clamp(2.7rem, 8vw, 7rem)', letterSpacing: '-0.04em', lineHeight: 0.9, color: '#E8EDF3', textShadow: '0 0 60px rgba(5, 10, 20, 0.8)', opacity: 0 }}>SYSTEMS &amp; SECURITY ENGINEER</h1>
        <p ref={sublineRef} className="font-body" style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#A8B5C4', maxWidth: '820px', marginTop: '30px', lineHeight: 1.65, opacity: 0 }}>
          I work on hard problems where infrastructure, security, automation, AI, and research overlap. I run real systems, figure out what actually failed, test ideas, and turn the useful parts into something reusable.
        </p>
        <div className="flex flex-wrap justify-center gap-3" style={{ marginTop: '34px' }}>
          <button type="button" onClick={() => scrollToSection('#work')} className="font-label px-5 py-3" style={{ background: '#4A6DFF', color: '#050A14' }}>SEE THE WORK →</button>
          <button type="button" onClick={() => scrollToSection('#research-thesis')} className="font-label px-5 py-3" style={{ border: '1px solid #4A6DFF', color: '#4A6DFF' }}>HOW I APPROACH R&amp;D →</button>
          <a href="https://github.com/ninja-ops-guy/developer-portfolio" target="_blank" rel="noreferrer" className="font-label px-5 py-3" style={{ border: '1px solid #8899AA', color: '#B7C3D0' }}>DEVELOPER VIEW ↗</a>
        </div>
        <div className="flex flex-wrap justify-center gap-2" style={{ marginTop: '34px', maxWidth: '980px' }}>
          {domains.map((domain) => <span key={domain} className="font-label" style={{ border: '1px solid #1A2540', padding: '8px 10px', color: '#74869A', background: 'rgba(5,10,20,.45)' }}>{domain}</span>)}
        </div>
      </div>
      <div ref={scrollIndicatorRef} className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ opacity: 0 }}><div className="scroll-line w-[1px] h-8 bg-[#4A6DFF]" /></div>
    </section>
  );
}
