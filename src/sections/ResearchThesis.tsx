const principles = [
  ['01', 'QUESTION', 'Start with a concrete technical question: what is expensive, unreliable, unverifiable, adversarial, or insufficiently understood?'],
  ['02', 'FORMALIZE', 'Define constraints, invariants, failure states, evidence requirements, and the conditions under which the claim would be wrong.'],
  ['03', 'HYPOTHESIZE', 'Translate the problem into claims that can fail and define measurable outcomes before treating a mechanism as an improvement.'],
  ['04', 'BUILD', 'Prototype the smallest mechanism capable of reducing uncertainty, then instrument it so behavior can be observed rather than assumed.'],
  ['05', 'VERIFY', 'Test, benchmark, retain negative results, challenge assumptions, and distinguish implementation completion from evidence of effectiveness.'],
  ['06', 'PLATFORMIZE', 'Extract mechanisms that survive testing into reusable primitives, interfaces, policies, verifiers, receipts, and operational workflows.'],
];

const programs = [
  {
    title: 'VERIFIED & GOVERNED AUTONOMOUS SYSTEMS',
    question: 'How can autonomous systems act while preserving constraints, provenance, verification, escalation, and human control?',
    artifacts: 'RESIDUAL / Command Station · LDD-Kit · verified cyber planning · agent orchestration',
    contribution: 'Contracts, bounded execution, evidence receipts, deterministic acceptance, planner verification, model routing, durable state, event-driven observability, and fail-closed control surfaces.',
  },
  {
    title: 'COMPUTATIONAL COMPLEXITY & VERIFICATION',
    question: 'What structural properties explain when computation, proof, and search become tractable or difficult — and can those results become useful engineering mechanisms?',
    artifacts: 'CIC · CIC-SAT · P vs NP research · proof systems · formalization · CTF / red-team harness',
    contribution: 'Graph-structured complexity measures, solver experiments, proof-system analysis, computational verification, theorem development, and direct transfer of CIC/SAT mechanisms into security tooling.',
  },
  {
    title: 'ADVERSARIAL AI & PHYSICAL ROBUSTNESS',
    question: 'When does a digitally promising adversarial result remain valid under governed evaluation, manufacturing, deformation, and physical testing?',
    artifacts: 'RAC · adversarial clothing · physical P1 program',
    contribution: 'Frozen experiments, surrogate/held-out separation, provenance, evidence gates, negative-result retention, physical validation, and research-to-production controls.',
  },
  {
    title: 'AUTONOMOUS OPERATIONS & APPLIED SYSTEMS',
    question: 'How can complex operational work be decomposed, automated, observed, and improved without losing control of system state?',
    artifacts: 'TechOps automation · runtime QA · RoofBot · robotics',
    contribution: 'Operational agents, recovery loops, artifact analysis, data pipelines, event fabrics, monitoring, reproducible workflows, and production-facing automation.',
  },
];

const cicApplications = [
  {
    name: 'CTF / RED-TEAM HARNESS',
    text: 'CIC moved from research artifact to security substrate through pnp_lab: structural SAT encodings, necessity/backdoor analysis, treewidth-based feasibility analysis, entropy-trajectory reasoning, and a SAT/CIC solver bridge used by the red-team harness.',
  },
  {
    name: 'VERIFIED CYBER PLANNING',
    text: 'The same research direction informed my use of SAT/SMT verification, structural planning constraints, proof-producing plan checks, counterexamples, and bounded search as engineering mechanisms for verifiable cyber planning.',
  },
  {
    name: 'RESIDUAL / COMMAND STATION',
    text: 'CIC is a conceptual predecessor rather than a claimed direct code dependency: it reinforced the practice of decomposing difficult search, exposing structure, bounding work, and separating a generated answer from the evidence required to accept it.',
  },
];

const evidenceLabels = [
  'PROVED / FORMALLY VERIFIED',
  'EXPERIMENTALLY OBSERVED',
  'INTERNALLY BENCHMARKED',
  'ENGINEERING-COMPLETE',
  'PREREGISTERED / PENDING TEST',
  'SPECULATIVE / OPEN',
];

const loop = ['OBSERVE', 'FORMALIZE', 'HYPOTHESIZE', 'BUILD', 'INSTRUMENT', 'TEST', 'VERIFY', 'EXTRACT PRIMITIVE', 'PLATFORMIZE', 'APPLY', 'MEASURE FAILURE'];

export default function ResearchThesis() {
  return (
    <section id="research-thesis" className="relative" style={{ background: '#070C18', padding: '150px 0', zIndex: 1 }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <p className="font-label" style={{ marginBottom: '24px' }}>PORTFOLIO THESIS / APPLIED R&amp;D</p>
        <h2 className="font-headline" style={{ fontSize: 'clamp(2rem, 5vw, 4.4rem)', lineHeight: 1.02, letterSpacing: '-0.035em', color: '#E8EDF3', maxWidth: '1100px' }}>
          I research how complex computational and autonomous systems can be made measurable, verifiable, and operationally trustworthy — then turn those ideas into platforms that enforce those properties in practice.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16" style={{ marginTop: '64px' }}>
          <div>
            <p className="font-body" style={{ fontSize: '18px', color: '#B1BECC', lineHeight: 1.8, margin: 0 }}>
              My work sits at the intersection of security research, AI systems, infrastructure, computational complexity, and platform engineering. I use engineering to test research ideas and research to determine what is worth engineering.
            </p>
            <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.8, marginTop: '28px' }}>
              The recurring pattern across the corpus is not a specific technology. It is the construction of governed, evidence-producing systems: define the claim, formalize the constraints, build the mechanism, instrument it, verify the outcome, preserve provenance, and extract what survives into reusable infrastructure.
            </p>
          </div>

          <div style={{ borderLeft: '1px solid #1a2540', paddingLeft: '32px' }}>
            <p className="font-label" style={{ color: '#4A6DFF', marginBottom: '20px' }}>RECURRING RESEARCH QUESTION</p>
            <p className="font-headline" style={{ fontSize: 'clamp(1.35rem, 2.5vw, 2rem)', color: '#E8EDF3', lineHeight: 1.35, margin: 0 }}>
              How can increasingly autonomous and complex systems remain efficient, constrained, observable, reproducible, and verifiable under real operating conditions?
            </p>
            <div className="font-body" style={{ fontSize: '13px', color: '#65778A', lineHeight: 1.8, marginTop: '32px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Theory → Evidence Systems → Autonomous Platforms
            </div>
          </div>
        </div>

        <div style={{ marginTop: '96px', borderTop: '1px solid #1a2540', paddingTop: '40px' }}>
          <p className="font-label" style={{ marginBottom: '16px' }}>RESEARCH PROGRAMS</p>
          <h3 className="font-headline" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', color: '#E8EDF3', maxWidth: '850px', marginBottom: '40px' }}>
            Repositories are artifacts. The organizing unit is the research program.
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px" style={{ background: '#1a2540', border: '1px solid #1a2540' }}>
            {programs.map((program) => (
              <div key={program.title} style={{ background: '#070C18', padding: '32px' }}>
                <div className="font-label" style={{ color: '#4A6DFF', marginBottom: '16px' }}>{program.title}</div>
                <p className="font-headline" style={{ color: '#E8EDF3', fontSize: '18px', lineHeight: 1.45, margin: 0 }}>{program.question}</p>
                <p className="font-body" style={{ color: '#65778A', fontSize: '12px', lineHeight: 1.7, marginTop: '18px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{program.artifacts}</p>
                <p className="font-body" style={{ color: '#8899AA', fontSize: '14px', lineHeight: 1.7, marginTop: '16px' }}>{program.contribution}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '80px', borderTop: '1px solid #1a2540', paddingTop: '40px' }}>
          <p className="font-label" style={{ marginBottom: '16px' }}>CIC / RESEARCH TRANSFER</p>
          <h3 className="font-headline" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', color: '#E8EDF3', maxWidth: '900px', marginBottom: '20px' }}>
            Computational Information Complexity became an engineering substrate, not an isolated research exercise.
          </h3>
          <p className="font-body" style={{ color: '#8899AA', fontSize: '15px', lineHeight: 1.8, maxWidth: '1000px', marginBottom: '32px' }}>
            CIC began as research into structural complexity, SAT, graph parameters, proof systems, and the relationship between structure and computational difficulty. I then reused those ideas where they could provide concrete engineering leverage. The clearest direct application is the CTF/red-team harness, where CIC-SAT research is implemented as security-analysis modules rather than merely cited as background theory.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: '#1a2540', border: '1px solid #1a2540' }}>
            {cicApplications.map((item) => (
              <div key={item.name} style={{ background: '#070C18', padding: '28px' }}>
                <div className="font-label" style={{ color: '#4A6DFF', marginBottom: '16px' }}>{item.name}</div>
                <p className="font-body" style={{ color: '#8899AA', fontSize: '14px', lineHeight: 1.75, margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '80px', padding: '32px', border: '1px solid #25324A', background: '#0A1020' }}>
          <p className="font-label" style={{ color: '#4A6DFF', marginBottom: '16px' }}>LDD / LOG-DRIVEN DEVELOPMENT</p>
          <h3 className="font-headline" style={{ fontSize: 'clamp(1.35rem, 2.7vw, 2rem)', color: '#E8EDF3', margin: 0 }}>Observability is part of the architecture, not an afterthought.</h3>
          <p className="font-body" style={{ color: '#8899AA', fontSize: '15px', lineHeight: 1.8, maxWidth: '1000px', marginTop: '22px' }}>
            I built LDD-Kit as a generic Log-Driven Development framework: define event schemas first, then generate structured logging, tracing, metrics, dashboards, alerts, CI validation, and platform-specific telemetry infrastructure from configuration. That work became directly operational inside RESIDUAL / Command Station, where LDD events participate in mission state, transactional event admission, observability, diagnostics, and evidence flow. LDD complements the verification work: CIC helps reason about computational structure; LDD makes runtime behavior legible enough to test, diagnose, and govern.
          </p>
        </div>

        <div style={{ marginTop: '96px', borderTop: '1px solid #1a2540', paddingTop: '40px' }}>
          <p className="font-label" style={{ marginBottom: '16px' }}>APPLIED RESEARCH METHOD</p>
          <h3 className="font-headline" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', color: '#E8EDF3', maxWidth: '800px', marginBottom: '40px' }}>
            Build to learn. Instrument to know. Extract what survives.
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

        <div style={{ marginTop: '80px' }}>
          <p className="font-label" style={{ marginBottom: '18px' }}>RESEARCH → PLATFORM LOOP</p>
          <div className="flex flex-wrap items-center gap-2">
            {loop.map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                <span className="font-label" style={{ border: '1px solid #1a2540', padding: '10px 12px', color: item === 'VERIFY' || item === 'PLATFORMIZE' ? '#4A6DFF' : '#8899AA', background: '#0A1020' }}>{item}</span>
                {index < loop.length - 1 && <span style={{ color: '#33445A' }}>→</span>}
              </div>
            ))}
            <span style={{ color: '#33445A' }}>↺</span>
          </div>
          <p className="font-body" style={{ fontSize: '14px', color: '#65778A', lineHeight: 1.7, marginTop: '20px', maxWidth: '900px' }}>
            Formalization, instrumentation, verification, and primitive extraction are deliberate additions to the normal engineering lifecycle. Failures feed the next research cycle instead of being erased from the record.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16" style={{ marginTop: '80px' }}>
          <div>
            <p className="font-label" style={{ marginBottom: '16px' }}>FROM MECHANISM TO PLATFORM</p>
            <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.8 }}>
              A successful experiment should leave behind more than a demo. I look for the reusable mechanism underneath it and engineer that mechanism into a primitive other systems can consume: planners, verifiers, execution contracts, receipts, policies, routing layers, simulation environments, safety controls, and observability systems.
            </p>
          </div>
          <div>
            <p className="font-label" style={{ marginBottom: '16px' }}>EVIDENCE OVER NOVELTY</p>
            <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.8 }}>
              A capability is not complete because it exists. It becomes meaningful when its effect can be measured. Cost, latency, correctness, security, reliability, resource use, reproducibility, and operational impact determine whether an idea survives and whether it deserves to become infrastructure.
            </p>
          </div>
        </div>

        <div style={{ marginTop: