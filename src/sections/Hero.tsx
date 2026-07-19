import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Hero() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      labelRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.3 }
    )
      .fromTo(
        headlineRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2 },
        '-=0.3'
      )
      .fromTo(
        sublineRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8 },
        '-=0.6'
      )
      .fromTo(
        scrollIndicatorRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6 },
        '-=0.2'
      );

    const scrollLine = scrollIndicatorRef.current?.querySelector('.scroll-line');
    if (scrollLine) {
      gsap.to(scrollLine, {
        y: 8,
        duration: 2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    }
  }, []);

  return (
    <section
      id="hero"
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{ height: '100dvh', zIndex: 1 }}
    >
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <p
          ref={labelRef}
          className="font-label"
          style={{ marginBottom: '24px', opacity: 0 }}
        >
          INFRASTRUCTURE // AI // SECURITY // AUTOMATION
        </p>

        <h1
          ref={headlineRef}
          className="font-headline uppercase"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 7rem)',
            letterSpacing: '-0.04em',
            lineHeight: 0.9,
            color: '#E8EDF3',
            textShadow: '0 0 60px rgba(5, 10, 20, 0.8)',
            opacity: 0,
          }}
        >
          SYSTEMS ENGINEER
        </h1>

        <p
          ref={sublineRef}
          className="font-body"
          style={{
            fontSize: '18px',
            color: '#8899AA',
            maxWidth: '560px',
            marginTop: '32px',
            lineHeight: 1.6,
            opacity: 0,
          }}
        >
          Infrastructure automation. AI/robotics engineering. Cybersecurity operations.
          Building systems that think, defend, and scale.
        </p>
      </div>

      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        style={{ opacity: 0 }}
      >
        <div className="scroll-line w-[1px] h-10 bg-[#4A6DFF]" />
      </div>
    </section>
  );
}
