import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const socialLinks = [
  { name: 'LinkedIn', url: 'https://linkedin.com/in/ma0livares' },
  { name: 'GitHub', url: 'https://github.com/ninja-ops-guy/' },
  { name: 'SoundCloud', url: 'https://soundcloud.com/raikouno/tracks' },
  { name: 'TryHackMe', url: 'https://tryhackme.com/p/n1n74' },
];

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const emailRef = useRef<HTMLAnchorElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!sectionRef.current || !headlineRef.current) return;

    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.to(labelRef.current, { opacity: 1, duration: 0.6 })
          .fromTo(headlineRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.2 }, '-=0.3')
          .fromTo(emailRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4');

        const socialItems = socialRef.current?.querySelectorAll('a');
        if (socialItems) {
          gsap.fromTo(socialItems, { opacity: 0, y: 10 }, { opacity: 1, y: 0, stagger: 0.1, delay: 1.0, duration: 0.5, ease: 'power3.out' });
        }
      },
    });

    return () => { st.kill(); };
  }, []);

  return (
    <section id="contact" ref={sectionRef} className="relative" style={{ background: '#050A14', padding: '160px 0', zIndex: 1 }}>
      <div className="max-w-[800px] mx-auto px-6 md:px-10 text-center">
        <p ref={labelRef} className="font-label" style={{ marginBottom: '24px', opacity: 0 }}>
          LET&apos;S BUILD SYSTEMS
        </p>

        <h2
          ref={headlineRef}
          className="font-headline"
          style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', letterSpacing: '-0.03em', lineHeight: 0.95, color: '#E8EDF3', opacity: 0 }}
        >
          Start a conversation
        </h2>

        <a
          ref={emailRef}
          href="mailto:raikouno@theemrld.studio"
          className="inline-block font-headline relative group"
          style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', color: '#4A6DFF', marginTop: '40px', opacity: 0, textDecoration: 'none' }}
        >
          raikouno@theemrld.studio
          <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#4A6DFF] origin-left transition-transform duration-300 scale-x-0 group-hover:scale-x-100" />
        </a>

        <div ref={socialRef} className="flex justify-center gap-8 flex-wrap" style={{ marginTop: '48px' }}>
          {socialLinks.map((link) => (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
              className="font-label hover:text-[#E8EDF3] transition-colors duration-300" style={{ opacity: 0, color: '#8899AA', textDecoration: 'none' }}>
              {link.name}
            </a>
          ))}
        </div>

        <p className="font-body" style={{ fontSize: '14px', color: '#8899AA', marginTop: '48px', lineHeight: 1.6 }}>
          Also check out the{' '}
          <a href="#/terminal" style={{ color: '#4A6DFF', textDecoration: 'none' }}>K Terminal</a>{' '}
          for some beats while you browse.
        </p>
      </div>
    </section>
  );
}
