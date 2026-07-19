import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const experiences = [
  { title: 'INFRASTRUCTURE', subtitle: 'Windows Server, AD, DNS, Citrix, PXE, MDT, SNMP Automation', image: '/images/exp-infra.jpg' },
  { title: 'AI & ROBOTICS', subtitle: 'Embodied AI, multi-agent orchestration, local LLM inference', image: '/images/exp-ai.jpg' },
  { title: 'CYBERSECURITY', subtitle: 'Vulnerability assessment, pentesting, incident response, TryHackMe 125+ rooms', image: '/images/exp-sec.jpg' },
  { title: 'ENTERPRISE IT', subtitle: 'Hardened kiosk systems, production recovery, ticket queue management, imaging', image: '/images/exp-enterprise.jpg' },
  { title: 'QUANTITATIVE SYSTEMS', subtitle: 'Prediction market algorithms, ensemble ML, Kelly criterion risk management', image: '/images/exp-quant.jpg' },
];

export default function ImmersiveExperiences() {
  const sectionRef = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current || !containerRef.current) return;
    const cards = containerRef.current.querySelectorAll<HTMLDivElement>('[data-exp-card]');
    if (!cards.length) return;

    const getImages = (card: Element) => card.querySelectorAll('img');
    const getText = (card: Element) => card.querySelectorAll('[data-exp-text]');
    const overlap = 0.7;

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: wrapperRef.current, start: 'top top', end: 'bottom bottom', scrub: true },
    });

    cards.forEach((card, index) => {
      const text = getText(card);
      const images = getImages(card);

      if (index !== 0) tl.fromTo(card, { opacity: 0 }, { opacity: 1, duration: 1 });
      if (index !== cards.length - 1) tl.fromTo(images, { scale: 2 }, { scale: 1, duration: 1 }, '<');
      if (index === 0) tl.set(card, { opacity: 1 }, 0);
      if (index === cards.length - 1) tl.set(getImages(card), { scale: 1 }, 0);

      const localTl = gsap.timeline({ ease: 'power3.inOut' });
      if (text.length > 0) localTl.to(text, { yPercent: -100, duration: 1, opacity: 0, stagger: { each: 0.02, from: 'end' } });
      localTl.to(card, { xPercent: index % 2 === 0 ? -25 : 25, duration: 1, opacity: 0 }, 0);
      if (index !== cards.length - 1) localTl.fromTo(getImages(card), { scale: 1 }, { scale: 1.5, duration: 1 }, '<+=90%');
      tl.add(localTl, `+=${1 - overlap}`);

      if (index !== cards.length - 1) {
        const nextText = getText(cards[index + 1]);
        if (nextText.length > 0) tl.fromTo(nextText, { yPercent: 125 }, { yPercent: 0, duration: 1 }, '-=0.4');
      }
    });

    return () => { tl.kill(); ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, []);

  return (
    <section id="experiences" ref={sectionRef} className="relative" style={{ background: '#050A14', zIndex: 1 }}>
      <div className="text-center" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <p className="font-label" style={{ marginBottom: '24px' }}>TECHNICAL DOMAINS</p>
        <h2 className="font-headline mx-auto px-6" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)', color: '#E8EDF3', maxWidth: '700px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          From factory floors to prediction markets.
        </h2>
      </div>
      <div ref={wrapperRef} style={{ height: '300vh' }} data-work="wrapper">
        <div ref={containerRef} data-work="container" style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
          {experiences.map((exp, index) => (
            <div key={exp.title} data-exp-card style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === 0 ? 1 : 0 }}>
              <div style={{ aspectRatio: '16/9', width: '70vw', maxWidth: '1400px', position: 'relative', overflow: 'hidden' }}>
                <img src={exp.image} alt={exp.title} className="w-full h-full object-cover" style={{ transform: index === experiences.length - 1 ? 'scale(1)' : 'scale(2)' }} loading="lazy" />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px', background: 'linear-gradient(to top, rgba(5,10,20,0.8) 0%, transparent 100%)' }}>
                  <h3 data-exp-text className="font-headline" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', color: '#E8EDF3', letterSpacing: '-0.02em' }}>{exp.title}</h3>
                  <p data-exp-text className="font-body" style={{ fontSize: '14px', color: 'rgba(232, 237, 243, 0.6)', marginTop: '8px' }}>{exp.subtitle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="text-center" style={{ padding: '80px 0 120px' }}>
        <p className="font-body" style={{ fontSize: '16px', color: '#8899AA' }}>Scroll to explore the full spectrum of expertise.</p>
      </div>
    </section>
  );
}
