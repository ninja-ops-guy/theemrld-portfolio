import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const linkedInUrl = 'https://linkedin.com/in/ma0livares';

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const contactRef = useRef<HTMLAnchorElement>(null);
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
          .fromTo(contactRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4');
      },
    });
    return () => { st.kill(); };
  }, []);

  return (
    <section id="contact" ref={sectionRef} className="relative" style={{ background: '#050A14', padding: '160px 0', zIndex: 1 }}>
      <div className="max-w-[800px] mx-auto px-6 md:px-10 text-center">
        <p ref={labelRef} className="font-label" style={{ marginBottom: '24px', opacity: 0 }}>PROFESSIONAL CONTACT</p>
        <h2 ref={headlineRef} className="font-headline" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', letterSpacing: '-0.03em', lineHeight: 0.95, color: '#E8EDF3', opacity: 0 }}>
          Connect on LinkedIn
        </h2>
        <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', margin: '28px auto 0', lineHeight: 1.7, maxWidth: 560 }}>
          For professional conversations, opportunities, and collaboration, please reach out through LinkedIn.
        </p>
        <a ref={contactRef} href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="inline-block font-label border border-[#4A6DFF] text-[#4A6DFF] px-7 py-4 hover:bg-[#4A6DFF] hover:text-[#050A14] transition-colors duration-300" style={{ marginTop: '40px', opacity: 0, textDecoration: 'none' }}>
          CONNECT ON LINKEDIN →
        </a>
      </div>
    </section>
  );
}
