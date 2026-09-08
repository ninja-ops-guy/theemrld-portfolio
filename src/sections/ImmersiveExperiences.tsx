import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const experiences = [
  {
    title: 'Infrastructure Architecture',
    company: 'ENTERPRISE NETWORKS',
    period: '2022 — PRESENT',
    image: 'https://tjsizcvhdprxa.kimi.page/images/exp-infra.jpg',
    desc: 'Designed and deployed hybrid cloud infrastructure across Azure, AWS, and on-premise VMware environments. Built CI/CD pipelines with GitHub Actions and Terraform for infrastructure-as-code. Implemented zero-trust networking with WireGuard mesh VPNs and cert-manager for automated TLS.',
  },
  {
    title: 'AI Systems Integration',
    company: 'MACHINE LEARNING OPS',
    period: '2021 — 2022',
    image: 'https://tjsizcvhdprxa.kimi.page/images/exp-ai.jpg',
    desc: 'Deployed and fine-tuned LLMs (Llama 2, Mistral) on local GPU clusters. Built vector search pipelines with Pinecone and pgvector for RAG applications. Created automated model evaluation harnesses with prompt injection testing and adversarial validation.',
  },
  {
    title: 'Cybersecurity Operations',
    company: 'RED TEAM / BLUE TEAM',
    period: '2020 — 2021',
    image: 'https://tjsizcvhdprxa.kimi.page/images/exp-sec.jpg',
    desc: 'Conducted penetration testing against enterprise web applications and internal networks. Built automated vulnerability scanners with Python and Nmap. Developed incident response playbooks and threat detection rules for SIEM platforms.',
  },
  {
    title: 'Enterprise IT Support',
    company: 'HELP DESK → SYSTEMS ADMIN',
    period: '2019 — 2020',
    image: 'https://tjsizcvhdprxa.kimi.page/images/exp-enterprise.jpg',
    desc: 'Managed Active Directory, Group Policy, and SCCM for 500+ endpoint fleet. Automated user provisioning with PowerShell and REST APIs. Reduced ticket resolution time by 60% through knowledge base automation and self-service portals.',
  },
  {
    title: 'Quantitative Development',
    company: 'ALGORITHMIC TRADING',
    period: '2018 — 2019',
    image: 'https://tjsizcvhdprxa.kimi.page/images/exp-quant.jpg',
    desc: 'Built backtesting engines and market data pipelines with Python, Pandas, and Redis. Implemented statistical arbitrage strategies with cointegration analysis. Created real-time risk monitoring dashboards with Grafana and Prometheus.',
  },
];

export default function ImmersiveExperiences() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];

    cards.forEach((card, index) => {
      gsap.fromTo(
        card,
        { opacity: 0, x: index % 2 === 0 ? -40 : 40 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section
      id="experiences"
      ref={sectionRef}
      className="relative"
      style={{ background: '#050A14', padding: '120px 0', zIndex: 1 }}
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <p className="font-label" style={{ marginBottom: '64px' }}>
          IMMERSIVE EXPERIENCES
        </p>

        <div className="flex flex-col" style={{ gap: '80px' }}>
          {experiences.map((exp, index) => (
            <div
              key={exp.title}
              ref={(el) => { cardsRef.current[index] = el; }}
              className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 opacity-0`}
            >
              {/* Image */}
              <div className="md:w-1/2 overflow-hidden">
                <img
                  src={exp.image}
                  alt={exp.title}
                  className="w-full"
                  style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="md:w-1/2 flex flex-col justify-center">
                <p className="font-label" style={{ marginBottom: '12px' }}>
                  {exp.company} — {exp.period}
                </p>
                <h3
                  className="font-headline"
                  style={{
                    fontSize: 'clamp(1.5rem, 3vw, 2.4rem)',
                    color: '#E8EDF3',
                    marginBottom: '16px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {exp.title}
                </h3>
                <p
                  className="font-body"
                  style={{
                    fontSize: '15px',
                    color: '#8899AA',
                    lineHeight: 1.7,
                  }}
                >
                  {exp.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
