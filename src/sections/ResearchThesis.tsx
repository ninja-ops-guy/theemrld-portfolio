const principles = [
  ['01', 'QUESTION', 'Start with something concrete I actually want to understand: what is expensive, unreliable, unverifiable, adversarial, or just not making sense yet?'],
  ['02', 'FORMALIZE', 'Write down the constraints, failure states, evidence I would need, and what would prove my idea wrong.'],
  ['03', 'HYPOTHESIZE', 'Turn the idea into something that can fail. If I cannot say what a bad result looks like, I do not really have a test yet.'],
  ['04', 'BUILD', 'Build the smallest thing that can answer the question, then instrument it so I can see what it is actually doing.'],
  ['05', 'VERIFY', 'Test it, benchmark it, keep negative results, challenge the assumptions, and separate “I built it” from “it actually works.”'],
  ['06', 'REUSE', 'If something survives testing, pull out the mechanism and turn it into something I can use again somewhere else.'],
];

const programs = [
  {
    title: 'AUTONOMOUS SYSTEMS I CAN ACTUALLY TRUST',
    question: 'How do I let an autonomous system do useful work without giving up constraints, evidence, escalation, or human control?',
    artifacts: 'RESIDUAL / Command Station · LDD-Kit · verified cyber planning · agent orchestration',
    contribution: 'Contracts, bounded execution, evidence receipts, verifier revisions, routing, durable state, observability, and fail-closed control surfaces.',
  },
  {
    title: 'COMPLEXITY, SEARCH & VERIFICATION',
    question: 'What makes a problem hard, and can I turn that structure into something useful for planning, verification, or security tooling?',
    artifacts: 'CIC · CIC-SAT · P vs NP research · proof systems · formalization · CTF / red-team harness',
    contribution: 'Graph structure, solver experiments, proof-system analysis, SAT tooling, formalization, and direct reuse of research ideas inside security tooling.',
  },
  {
    title: 'ADVERSARIAL AI IN THE REAL WORLD',
    question: 'If something looks promising digitally, does it still work after printing, deformation, viewpoint changes, lighting changes, and physical testing?',
    artifacts: 'RAC · adversarial clothing · physical P1 program',
    contribution: 'Frozen experiments, held-out evaluation, provenance, evidence gates, negative-result retention, and a clean boundary between digital results and physical claims.',
  },
  {
    title: 'AUTOMATING MESSY OPERATIONAL WORK',
    question: 'How do I break complicated operational work into pieces that can be automated without losing track of state, failure, or ownership?',
    artifacts: 'TechOps automation · runtime QA · RoofBot · robotics',
    contribution: 'Recovery loops, agents, data pipelines, runtime QA, event systems, monitoring, and automation that is meant to survive real operating conditions.',
  },
];

const cicApplications = [
  {
    name: 'CTF / RED-TEAM HARNESS',
    text: 'This is the clearest direct transfer. I took ideas from CIC/SAT research and turned them into security-analysis modules: structural SAT encodings, backdoor and necessity analysis, treewidth-based feasibility checks, entropy-style reasoning, and a solver bridge used by the harness.',
  },
  {
    name: 'VERIFIED CYBER PLANNING',
    text: 'The same line of thinking pushed me toward SAT/SMT verification, bounded search, plan proofs, counterexamples, and explicit planning constraints instead of treating planner output as automatically correct.',
  },
  {
    name: 'RESIDUAL / COMMAND STATION',
    text: 'CIC is not a direct code dependency here. The connection is methodological: break hard search apart, expose structure, bound the work, and keep generation separate from the evidence required to accept the result.',
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

const loop = ['OBSERVE', 'FORMALIZE', 'HYPOTHESIZE', 'BUILD', 'INSTRUMENT', 'TEST', 'VERIFY', 'PULL OUT THE USEFUL PART', 'REUSE', 'APPLY', 'MEASURE FAILURE'];

export default function ResearchThesis() {
  return (
    <section id="research-thesis" className="relative" style={{ background: '#070C18', padding: '150px 0', zIndex: 1 }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <p className="font-label" style={{ marginBottom: '24px' }}>HOW I APPROACH R&amp;D</p>
        <h2 className="font-headline" style={{ fontSize: 'clamp(2rem, 5vw, 4.4rem)', lineHeight: 1.02, letterSpacing: '-0.035em', color: '#E8EDF3', maxWidth: '1100px' }}>
          I like taking hard technical questions, building something that can actually test them, and keeping only the parts that hold up.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16" style={{ marginTop: '64px' }}>
          <div>
            <p className="font-body" style={{ fontSize: '18px', color: '#B1BECC', lineHeight: 1.8, margin: 0 }}>
              My projects move between security, AI systems, infrastructure, computational research, and platform engineering, but the way I work is pretty consistent. I start with a real question, build enough to test it, and let the result change the design.
            </p>
            <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.8, marginTop: '28px' }}>
              I am not trying to collect unrelated projects. I am trying to build up a set of reusable ideas around verification, observability, bounded execution, evidence, and automation that I can apply in different places.
            </p>
          </div>

          <div style={{ borderLeft: '1px solid #1a2540', paddingLeft: '32px' }}>
            <p className="font-label" style={{ color: '#4A6DFF', marginBottom: '20px' }}>THE QUESTION I KEEP COMING BACK TO</p>
            <p className="font-headline" style={{ fontSize: 'clamp(1.35rem, 2.5vw, 2rem)', color: '#E8EDF3', lineHeight: 1.35, margin: 0 }}>
              How do I make increasingly complex or autonomous systems useful without making them impossible to inspect, constrain, reproduce, or trust?
            </p>
            <div className="font-body" style={{ fontSize: '13px', color: '#65778A', lineHeight: 1.8, marginTop: '32px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Research → Evidence → Reusable Systems
            </div>
          </div>
        </div>

        <div style={{ marginTop: '96px', borderTop: '1px solid #1a2540', paddingTop: '40px' }}>
          <p className="font-label" style={{ marginBottom: '16px' }}>RESEARCH PROGRAMS</p>
          <h3 className="font-headline" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', color: '#E8EDF3', maxWidth: '850px', marginBottom: '40px' }}>
            The repos are outputs. These are the bigger questions behind them.
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
          <p className="font-label" style={{ marginBottom: '16px' }}>WHERE CIC ACTUALLY WENT</p>
          <h3 className="font-headline" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', color: '#E8EDF3', maxWidth: '900px', marginBottom: '20px' }}>
            I did not want the complexity research to stay trapped in a research repo.
          </h3>
          <p className="font-body" style={{ color: '#8899AA', fontSize: '15px', lineHeight: 1.8, maxWidth: '1000px', marginBottom: '32px' }}>
            CIC started as me trying to understand structure in SAT, graph parameters, proof systems, and computational difficulty. The useful part was figuring out which ideas could transfer into actual engineering. The strongest direct example is the CTF/red-team harness, where the research shows up as working analysis modules instead of a citation in a README.
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
          <h3 className="font-headline" style={{ fontSize: 'clamp(1.35rem, 2.7vw, 2rem)', color: '#E8EDF3', margin: 0 }}>I want observability designed in, not bolted on after something breaks.</h3>
          <p className="font-body" style={{ color: '#8899AA', fontSize: '15px', lineHeight: 1.8, maxWidth: '1000px', marginTop: '22px' }}>
            I built LDD-Kit around a simple idea: define the events first, then generate the logging, tracing, metrics, dashboards, alerts, CI checks, and platform telemetry around them. That became useful inside Residual, where the same events participate in mission state, admission, diagnostics, and evidence flow. CIC helps me reason about structure; LDD helps me see what the system is actually doing at runtime.
          </p>
        </div>

        <div style={{ marginTop: '96px', borderTop: '1px solid #1a2540', paddingTop: '40px' }}>
          <p className="font-label" style={{ marginBottom: '16px' }}>MY PROCESS</p>
          <h3 className="font-headline" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', color: '#E8EDF3', maxWidth: '800px', marginBottom: '40px' }}>
            Build enough to learn. Instrument enough to know. Keep what survives.
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
          <p className="font-label" style={{ marginBottom: '18px' }}>THE LOOP</p>
          <div className="flex flex-wrap items-center gap-2">
            {loop.map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                <span className="font-label" style={{ border: '1px solid #1a2540', padding: '10px 12px', color: item === 'VERIFY' || item === 'REUSE' ? '#4A6DFF' : '#8899AA', background: '#0A1020' }}>{item}</span>
                {index < loop.length - 1 && <span style={{ color: '#33445A' }}>→</span>}
              </div>
            ))}
            <span style={{ color: '#33445A' }}>↺</span>
          </div>
          <p className="font-body" style={{ fontSize: '14px', color: '#65778A', lineHeight: 1.7, marginTop: '20px', maxWidth: '900px' }}>
            I want failed tests to feed the next design, not disappear from the record. The point is to reduce uncertainty each time around.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16" style={{ marginTop: '80px' }}>
          <div>
            <p className="font-label" style={{ marginBottom: '16px' }}>WHEN SOMETHING WORKS</p>
            <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.8 }}>
              I try to pull out the part that is actually reusable. Sometimes that becomes a verifier, a planner, a contract, a receipt system, a policy object, a routing layer, a simulation environment, or an observability primitive. I care more about that mechanism than the demo around it.
            </p>
          </div>
          <div>
            <p className="font-label" style={{ marginBottom: '16px' }}>WHEN SOMETHING DOES NOT</p>
            <p className="font-body" style={{ fontSize: '16px', color: '#8899AA', lineHeight: 1.8 }}>
              I keep the failure. Cost, latency, correctness, security, reliability, reproducibility, and operational impact all matter. If the evidence is weak, I would rather say that clearly than pretend the project is further along than it is.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '80px', padding: '32px', border: '1px solid #1a2540', background: '#0A1020' }}>
          <p className="font-label" style={{ marginBottom: '20px' }}>CLAIM DISCIPLINE</p>
          <p className="font-body" style={{ color: '#B1BECC', fontSize: '15px', lineHeight: 1.75, maxWidth: '950px', margin: 0 }}>
            I try to label the work based on what I can actually support, not what I hope it becomes. That means separating proof from observation, benchmarks from production evidence, and preregistered tests from completed ones.
          </p>
          <div className="flex flex-wrap gap-2" style={{ marginTop: '24px' }}>
            {evidenceLabels.map((label) => (
              <span key={label} className="font-label" style={{ border: '1px solid #25324A', padding: '9px 11px', color: '#8899AA' }}>{label}</span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '72px', padding: '32px', border: '1px solid #4A6DFF', background: '#0A1020' }}>
          <p className="font-headline" style={{ fontSize: 'clamp(1.25rem, 2.4vw, 1.8rem)', color: '#E8EDF3', lineHeight: 1.45, margin: 0 }}>
            The goal is not to have the most projects. I want a body of work that shows I can take a hard problem, figure out how to test it, build something useful, keep the evidence honest, and reuse what I learned somewhere else.
          </p>
        </div>
      </div>
    </section>
  );
}
