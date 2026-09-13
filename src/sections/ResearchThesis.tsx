const principles = [
  ['01', 'QUESTION', 'Start with a concrete technical question: what is expensive, unreliable, unverifiable, or insufficiently understood?'],
  ['02', 'HYPOTHESIZE', 'Translate the problem into claims that can fail and define measurable outcomes before treating a mechanism as an improvement.'],
  ['03', 'PROTOTYPE', 'Build the smallest mechanism capable of reducing uncertainty. Early implementations are experiments, not endpoints.'],
  ['04', 'EXTRACT', 'Turn mechanisms that survive testing into reusable primitives: planners, verifiers, contracts, receipts, policies, routers, and observability.'],
  ['05', 'PLATFORM', 'Engineer successful primitives into reusable systems with durable state, interfaces, safety controls, testing, deployment, and documentation.'],
  ['06', 'VALIDATE', 'Apply the platform to real workloads and measure cost, correctness, reliability, latency, security, and operational outcomes.'],
];

export default function ResearchThesis() {
  return (
    <section id="research-thesis" className="relative" style={{ background: '#070C18', padding: '150px 0', zIndex: 1 }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <p className="font-label" style={{ marginBottom: '24px' }}>PORTFOLIO THESIS / APPLIED R&amp;D</p>
        <h2 className="font-headline" style={{ fontSize: 'clamp(2rem, 5vw, 4.4rem)', lineHeight: 1.02, letterSpacing: '-0.035em', color: '#E8EDF3', maxWidth: '980px' }}>
          Research becomes most valuable when it survives contact with real systems.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16" style={{ marginTop: '64px' }}>
          <div>
            <p className="font-body" style={{ fontSize: '18px', color: '#B1BECC', lineHeight: 1.8, margin: 0 }}>
              I build at the intersection of security research, AI systems, infrastructure, and platform engineering. I do not treat research and engineering as separate disciplines: engineering is a method for testing research ideas, and research is a method for deciding what is worth engineering.
            </p>
            <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.8, marginTop: '28px' }}>
              The projects in this portfolio are not intended as isolated applications. They are experiments in turning technical hypotheses into working, measurable systems. Research into verified planning can become a verification layer for autonomous agents. Deterministic execution can become infrastructure for software automation. Adversarial perception research can become a physical experimentation platform. Operational failures then expose the next research questions.
            </p>
          </div>

          <div style={{ borderLeft: '1px solid #1a2540', paddingLeft: '32px' }}>
            <p className="font-label" style={{ color: '#4A6DFF', marginBottom: '20px' }}>RECURRING RESEARCH QUESTION</p>
            <p className="font-headline" style={{ fontSize: 'clamp(1.35rem, 2.5vw, 2rem)', color: '#E8EDF3', lineHeight: 1.35, margin: 0 }}>
              How can increasingly autonomous and complex systems remain efficient, measurable, constrained, and verifiable?
            </p>
            <div className="font-body" style={{ fontSize: '13px', color: '#65778A', lineHeight: 1.8, marginTop: '32px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Question → Hypothesis → Prototype → Measurement → Architecture → Platform → Application → Validation
            </div>
          </div>
        </div>

        <div style={{ marginTop: '96px', borderTop: '1px solid #1a2540', paddingTop: '40px' }}>
          <p className="font-label" style={{ marginBottom: '16px' }}>APPLIED RESEARCH METHOD</p>
          <h3 className="font-headline" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', color: '#E8EDF3', maxWidth: '800px', marginBottom: '40px' }}>
            Build to learn. Extract what works. Prove the result.
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: '#1a2540', border: '1px solid #1a2540' }}>
            {principles.map(([n, title, body]) => (
              <div key={n} style={{ background: '#070C18', padding: '28px' }}>
                <div className="font-label" style={{ color: '#4A6DFF', marginBottom: '18px' }}>{n} / {title}</div>
                <p className="font-body" style={{ fontSize: '14px', color: '#8899AA', lineHeight: 1.7, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16" style={{ marginTop: '80px' }}>
          <div>
            <p className="font-label" style={{ marginBottom: '16px' }}>FROM MECHANISM TO PLATFORM</p>
            <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.8 }}>
              A successful experiment should leave behind more than a demo. I look for the reusable mechanism underneath it and engineer that mechanism into a primitive that other systems can consume. That is where applied research becomes platform engineering: ideas become interfaces, contracts, verification gates, execution infrastructure, observability, policy, and repeatable workflows.
            </p>
          </div>
          <div>
            <p className="font-label" style={{ marginBottom: '16px' }}>EVIDENCE OVER NOVELTY</p>
            <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.8 }}>
              I treat failures as results. They expose weak abstractions, hidden state, nondeterminism, incorrect assumptions, and insufficient verification. A capability is not complete because it exists; it becomes meaningful when its effect can be measured. Cost, latency, reliability, correctness, security, resource use, and operational impact are the evidence that determines whether an idea survives.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '72px', padding: '32px', border: '1px solid #1a2540', background: '#0A1020' }}>
          <p className="font-headline" style={{ fontSize: 'clamp(1.25rem, 2.4vw, 1.8rem)', color: '#E8EDF3', lineHeight: 1.45, margin: 0 }}>
            The goal is not to accumulate projects. It is to build a body of evidence that I can investigate difficult technical problems, develop mechanisms for them, turn those mechanisms into reusable platforms, apply them to real systems, and let measurement determine what comes next.
          </p>
        </div>
      </div>
    </section>
  );
}
