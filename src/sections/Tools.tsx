import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const toolCategories = [
  {
    label: 'INFRASTRUCTURE & SYSTEMS',
    tools: [
      'Active Directory',
      'Group Policy (GPO)',
      'MDT / WDS / PXE',
      'Citrix',
      'VMware',
      'Windows Server',
      'DNS / DHCP',
    ],
  },
  {
    label: 'NETWORKING',
    tools: [
      'Cisco IOS / IOS-XE',
      'VLAN / Trunking',
      'OSPF / EIGRP / BGP',
      'ACLs / NAT',
      'VPN (IPsec / SSL)',
      'Wireshark',
      'GNS3',
    ],
  },
  {
    label: 'SECURITY & OFFENSIVE',
    tools: [
      'Nmap',
      'Metasploit',
      'Burp Suite',
      'BloodHound',
      'Empire / Starkiller',
      'Nikto',
      'Gobuster',
      'Hydra',
    ],
  },
  {
    label: 'MONITORING & AUTOMATION',
    tools: [
      'SNMP v2/v3',
      'NetFlow',
      'Python',
      'PowerShell',
      'Ansible',
      'REST APIs',
      'Bash',
    ],
  },
  {
    label: 'DATABASE & CLOUD',
    tools: [
      'PostgreSQL / PostGIS',
      'Redis',
      'Cloud Run',
      'Docker',
      'Git',
      'Linux (RHEL/Ubuntu)',
      'SQL',
    ],
  },
  {
    label: 'AI / ML & QUANT',
    tools: [
      'Ollama',
      'Qwen 2.5 VL',
      'TensorFlow',
      'Pandas / NumPy',
      'WebSocket APIs',
      'Go',
      'React / TypeScript',
    ],
  },
];

export default function Tools() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll('.tool-category');
    if (!cards) return;

    gsap.fromTo(
      cards,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
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
      id="tools"
      ref={sectionRef}
      className="relative"
      style={{ background: '#0A1020', padding: '160px 0', zIndex: 1 }}
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <p className="font-label" style={{ marginBottom: '16px' }}>
          TOOLS & TECHNOLOGIES
        </p>
        <h2
          className="font-headline"
          style={{
            fontSize: 'clamp(1.8rem, 4vw, 3.2rem)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#E8EDF3',
            marginBottom: '64px',
          }}
        >
          The stack I work with daily.
        </h2>

        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: '1px', background: '#0d1424' }}
        >
          {toolCategories.map((cat) => (
            <div
              key={cat.label}
              className="tool-category opacity-0"
              style={{
                padding: '32px',
                background: '#050A14',
                transition: 'background 0.3s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(74, 109, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#050A14';
              }}
            >
              <p className="font-label" style={{ marginBottom: '20px', color: '#4A6DFF' }}>
                {cat.label}
              </p>
              <div className="flex flex-wrap" style={{ gap: '8px' }}>
                {cat.tools.map((tool) => (
                  <span
                    key={tool}
                    className="font-label border px-3 py-1"
                    style={{ borderColor: '#1a2540', fontSize: '10px', color: '#8899AA' }}
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
