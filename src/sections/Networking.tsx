import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const certifications = [
  { name: 'CCNA', full: 'Cisco Certified Network Associate', detail: 'Cisco', status: 'CERTIFIED' },
  { name: 'CompTIA Network+', full: 'Network+ Certification', detail: 'N10-007', status: 'CERTIFIED' },
  { name: 'CompTIA Security+', full: 'Security+ Certification', detail: 'SY0-601', status: 'CERTIFIED' },
  { name: 'CompTIA Linux+', full: 'Linux+ Certification', detail: 'XK0-005', status: 'CERTIFIED' },
  { name: 'IBM Cybersecurity Analyst', full: 'Cybersecurity Analyst', detail: 'IBM', status: 'COMPLETED' },
];

const training = [
  { name: 'TryHackMe Junior Penetration Tester', detail: 'Hands-on penetration testing pathway', status: 'COMPLETED' },
  { name: 'Dell EMC Service Basics 2017', detail: 'Dell EMC technical service training', status: 'COMPLETED' },
  { name: 'Dell Client Foundation 2020', detail: 'Dell client systems foundation training', status: 'COMPLETED' },
  { name: 'Python', detail: 'Mimo app coursework', status: 'COMPLETED' },
  { name: 'SQL', detail: 'Mimo app coursework', status: 'COMPLETED' },
];

const networkSkills = [
  { label: 'ROUTING & SWITCHING', detail: 'OSPF, EIGRP, BGP, VLANs, STP, Inter-VLAN routing' },
  { label: 'NETWORK PROTOCOLS', detail: 'TCP/IP, DHCP, DNS, NAT, ACLs, QoS' },
  { label: 'VPN & SECURITY', detail: 'IPsec, SSL VPN, Site-to-site, GRE tunnels' },
  { label: 'MONITORING', detail: 'SNMP, Wireshark, packet analysis, NetFlow' },
  { label: 'SWITCH PORT ANALYSIS', detail: 'Interface counters, port utilization, network hygiene' },
  { label: 'INFRASTRUCTURE AUTOMATION', detail: 'Python scripting, Ansible, REST APIs' },
];

const tools = [
  'Cisco IOS / IOS-XE',
  'Wireshark',
  'GNS3',
  'VLAN / trunking',
  'ACLs / NAT',
  'SNMP v2/v3',
];

export default function Networking() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(leftRef.current, { x: -40, opacity: 0 }, {
      x: 0, opacity: 1, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', toggleActions: 'play none none none' },
    });
    gsap.fromTo(rightRef.current, { y: 40, opacity: 0 }, {
      x: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', toggleActions: 'play none none none' },
    });
    return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, []);

  return (
    <section id="networking" ref={sectionRef} className="relative" style={{ background: '#050A14', padding: '160px 0', zIndex: 1 }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <p className="font-label" style={{ marginBottom: '64px' }}>NETWORKING, SECURITY & CREDENTIALS</p>
        <div className="flex flex-col md:flex-row gap-8 md:gap-[5%]">
          <div ref={leftRef} className="md:w-[45%] opacity-0">
            <div className="flex items-center gap-3" style={{ marginBottom: '32px', padding: '16px 20px', border: '1px solid #1a2540', background: 'rgba(74, 109, 255, 0.05)' }}>
              <span className="font-headline" style={{ fontSize: '14px', color: '#4A6DFF', letterSpacing: '0.1em' }}>CISCO + COMPTIA</span>
              <span style={{ color: '#1a2540' }}>|</span>
              <span className="font-label" style={{ color: '#E8EDF3' }}>MULTI-DOMAIN CERTIFIED</span>
            </div>
            <h2 className="font-headline" style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#E8EDF3' }}>
              Certified across networking, security, Linux, and infrastructure operations.
            </h2>
            <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.7, marginTop: '24px' }}>
              The credential stack reflects hands-on work across enterprise networking, cybersecurity,
              Linux administration, endpoint support, automation, and penetration-testing fundamentals.
              It complements production experience with Cisco infrastructure, Windows systems, SNMP
              automation, incident response, and operational security.
            </p>

            <div style={{ marginTop: '40px' }}>
              <p className="font-label" style={{ marginBottom: '16px' }}>PROFESSIONAL CERTIFICATIONS</p>
              {certifications.map((cert) => (
                <div key={cert.name} className="flex items-start justify-between gap-4" style={{ padding: '14px 0', borderBottom: '1px solid #0d1424' }}>
                  <div>
                    <span className="font-headline" style={{ fontSize: '14px', color: '#E8EDF3', letterSpacing: '-0.01em', display: 'block' }}>{cert.name}</span>
                    <span className="font-body" style={{ fontSize: '12px', color: '#8899AA', display: 'block', marginTop: '3px' }}>{cert.full}</span>
                    <span className="font-label" style={{ fontSize: '9px', color: '#5f7187', display: 'block', marginTop: '4px' }}>{cert.detail}</span>
                  </div>
                  <span className="font-label" style={{ color: '#4A6DFF', fontSize: '10px', flexShrink: 0 }}>{cert.status}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '40px' }}>
              <p className="font-label" style={{ marginBottom: '16px' }}>TRAINING & TECHNICAL COURSEWORK</p>
              {training.map((item) => (
                <div key={item.name} className="flex items-start justify-between gap-4" style={{ padding: '12px 0', borderBottom: '1px solid #0d1424' }}>
                  <div>
                    <span className="font-headline" style={{ fontSize: '13px', color: '#E8EDF3', display: 'block' }}>{item.name}</span>
                    <span className="font-body" style={{ fontSize: '12px', color: '#8899AA', display: 'block', marginTop: '3px' }}>{item.detail}</span>
                  </div>
                  <span className="font-label" style={{ color: '#4A6DFF', fontSize: '9px', flexShrink: 0 }}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div ref={rightRef} className="md:w-[50%] opacity-0">
            <div className="overflow-hidden" style={{ marginBottom: '40px' }}>
              <img src={'https://tjsizcvhdprxa.kimi.page/images/exp-networking.jpg'} alt="Cisco network infrastructure" className="w-full" style={{ aspectRatio: '16/9', objectFit: 'cover' }} loading="lazy" />
            </div>
            <p className="font-label" style={{ marginBottom: '16px' }}>NETWORK ENGINEERING SKILLS</p>
            <div className="flex flex-col" style={{ gap: '1px', background: '#0d1424' }}>
              {networkSkills.map((skill) => (
                <div key={skill.label} className="group cursor-default" style={{ padding: '14px 16px', background: '#050A14', transition: 'background 0.3s ease' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(74, 109, 255, 0.05)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#050A14'; }}>
                  <span className="font-label" style={{ color: '#E8EDF3', fontSize: '11px' }}>{skill.label}</span>
                  <span className="font-body" style={{ fontSize: '13px', color: '#8899AA', marginTop: '4px', display: 'block' }}>{skill.detail}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3" style={{ marginTop: '32px' }}>
              {tools.map((tool) => (
                <span key={tool} className="font-label border px-3 py-1" style={{ borderColor: '#1a2540', fontSize: '10px' }}>{tool}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
