import { Link, Navigate, useParams } from 'react-router-dom';

type Study = {
  title: string; eyebrow: string; status: string; thesis: string; repo?: string; demo?: string;
  problem: string; architecture: { title: string; body: string }[]; evidence: string[];
  failure: { signal: string; response: string; lesson: string }; remains: string[]; stack: string;
};

const studies: Record<string, Study> = {
  'production-systems': {
    title: 'Production Systems Engineering', eyebrow: 'INFRASTRUCTURE / INCIDENT OWNERSHIP / AUTOMATION', status: 'PRODUCTION EXPERIENCE',
    thesis: 'A sanitized case study of how I approach operational engineering: restore service first, identify the real failure mode, reduce recurrence, and leave behind a repeatable operating path.',
    problem: 'Manufacturing IT creates a different engineering constraint from lab systems: downtime affects real operations, many systems are not conveniently redundant, and support volume can hide structural problems. My role has required owning ambiguous incidents across Windows endpoints, production systems, switching, DHCP/DNS behavior, kiosks, print infrastructure, and operational queues while improving the system around the incident rather than only closing the ticket.',
    architecture: [
      { title: 'Triage & scope', body: 'Establish blast radius, production impact, recent change history, dependencies, and the fastest safe path to restoring service before optimizing the permanent fix.' },
      { title: 'Evidence-driven diagnosis', body: 'Use logs, boot state, packet captures, switch-port data, MAC/IP correlation, SNMP counters, endpoint state, and direct reproduction to narrow the failure domain.' },
      { title: 'Recovery', body: 'Apply the smallest controlled change that restores service, verify the business function end to end, and avoid declaring success based only on a green device or process state.' },
      { title: 'Operationalization', body: 'Convert repeated manual investigation into automation, documentation, monitoring, or a reusable recovery procedure so the same class of incident becomes cheaper to resolve next time.' },
    ],
    evidence: ['Reduced a support backlog from 170+ items to roughly 15 on average', 'Recovered a critical production Windows system from an INACCESSIBLE_BOOT_DEVICE / boot-path failure', 'Traced rogue DHCP behavior to a physical switch port by correlating network evidence', 'Built SNMP-based infrastructure tooling to reduce manual discovery and walkdowns', 'Handled kiosk, print, switching, endpoint, and production-support work across enterprise and manufacturing environments'],
    failure: { signal: 'A recurring operational problem is being solved repeatedly at the ticket level without reducing the underlying workload or failure probability.', response: 'Treat the incident as a systems problem: restore the user or production function, capture evidence, identify the repeatable failure mechanism, and add automation, monitoring, documentation, or infrastructure controls where they provide leverage.', lesson: 'Operational maturity is not measured by how many incidents one engineer can heroically close. It is measured by whether the environment becomes easier, safer, and faster for the whole team to operate.' },
    remains: ['Continue moving repeatable support patterns into automation and self-service', 'Increase infrastructure observability where manual discovery is still required', 'Keep recovery procedures current as endpoint and network platforms change', 'Translate additional sanitized production incidents into public engineering case studies without exposing employer-sensitive details'],
    stack: 'Windows · Cisco networking · TCP/IP · DHCP/DNS · SNMP · Wireshark · PowerShell/Python · Enterprise IT / OT-adjacent operations',
  },
  'techops-hero': {
    title: 'TechOps Hero', eyebrow: 'PRODUCT ENGINEERING / AUTOMATED QA', status: 'ACTIVE DEVELOPMENT · PUBLIC',
    thesis: 'A growing browser RPG used as a proving ground for state-heavy product engineering, runtime QA, regression control, and failure-driven iteration.',
    repo: 'https://github.com/ninja-ops-guy/techops-hero', demo: 'https://ninja-ops-guy.github.io/techops-hero/',
    problem: 'Build an interactive game around real troubleshooting concepts while keeping a large, continuously changing campaign playable across desktop and mobile. The hard part is not adding one mechanic; it is preventing new content, cutscenes, combat systems, and state transitions from breaking progression elsewhere.',
    architecture: [
      { title: 'Runtime', body: 'Static browser game with a custom Canvas 2D engine, modular hook/runtime files, campaign state, combat, dialogue, mobile input, and authored assets.' },
      { title: 'Verification', body: 'Browser automation and CI contracts exercise progression and runtime behavior instead of relying only on static/unit checks.' },
      { title: 'Delivery', body: 'GitHub Pages provides a public tester surface so deployed behavior can be checked against the same code that is under active development.' },
      { title: 'Repair loop', body: 'Runtime failures become concrete regression cases: reproduce, isolate ownership/state failure, patch, rerun, and retain the test or contract.' },
    ],
    evidence: ['Public playable GitHub Pages build', 'Repository documents the game loop and system inventory', 'Browser/runtime testing is part of the engineering workflow', 'CI and campaign contracts are used to protect progression', 'Mobile and gamepad behavior are explicit product surfaces'],
    failure: { signal: 'Automated gameplay could pass individual interactions yet still hit lifecycle/progression failures late in a run.', response: 'Treat the browser session and campaign progression as first-class state: track lifecycle, isolate softlocks/timeouts, and add targeted regression coverage rather than accepting a generic failure.', lesson: 'A large test count is not enough. End-to-end runtime behavior has to be observed at the same boundaries the player experiences.' },
    remains: ['Continue reducing campaign/cutscene integration regressions', 'Expand deterministic end-to-end coverage for long campaign paths', 'Polish visual consistency and authored asset ownership', 'Keep deployment evidence synchronized with the tested main branch'],
    stack: 'JavaScript · Canvas 2D · Playwright/Puppeteer · GitHub Actions · GitHub Pages',
  },
  'adversarial-clothing': {
    title: 'Ruthless Adversarial Clothing', eyebrow: 'ADVERSARIAL ML / COMPUTER VISION R&D', status: 'EXPERIMENTAL · PUBLIC R&D',
    thesis: 'An evidence-gated research system for studying printable adversarial textile candidates without confusing software capability, synthetic experiments, and physical efficacy.',
    repo: 'https://github.com/ninja-ops-guy/adversarial-clothing-pipeline',
    problem: 'Digital adversarial patterns are not automatically useful on clothing: fabric deforms, printing changes color, scenes change, and held-out models may behave differently. The project therefore needs both candidate-generation machinery and a strict evidence boundary around what has actually been measured.',
    architecture: [
      { title: 'Exploration plane', body: 'Pattern Lab generates deterministic/procedural candidates, captures parameters, supports visual analysis, and exports artifacts without presenting heuristics as detector evidence.' },
      { title: 'Research plane', body: 'Python modules cover optimization, deformation, differentiable cloth/scene composition, evaluator adapters, and comparative benchmarking.' },
      { title: 'Certification plane', body: 'Frozen protocols, model-set contracts, artifact provenance, sealed bundles, and fail-closed result handling separate measured evidence from targets and assumptions.' },
      { title: 'Physical boundary', body: 'Real detector weights, calibrated print/fabric data, garment trials, and manufacturing measurements remain external evidence requirements.' },
    ],
    evidence: ['Python package + browser Pattern Lab are public', 'Eight browser-side pattern generators', 'Certification/model-lock/provenance infrastructure', 'D2-0003 and D2-0004 retained as negative results rather than discarded', 'Physical validation is explicitly marked not performed'],
    failure: { signal: 'D2 generations did not satisfy the certification threshold.', response: 'Retain the failed generations and their artifacts as immutable negative evidence, close the experiment with provenance, and avoid promoting them into product-efficacy claims.', lesson: 'A research pipeline is more credible when failure is a valid output. The system should make it harder—not easier—to overstate a result.' },
    remains: ['Connect/freeze exact approved detector model sets', 'Collect calibrated print and garment deformation measurements', 'Run preregistered physical trials across pose/view/light/distance', 'Complete RAC-P and RAC-M evidence gates before product-efficacy claims'],
    stack: 'Python · React/JavaScript · Computer Vision · Optimization · Experiment Automation · GitHub Actions',
  },
  'vector-wirepod': {
    title: 'Vector / wire-pod Embodied AI', eyebrow: 'EMBODIED AI / ROBOTICS / AGENT VERIFICATION', status: 'ACTIVE R&D · PRIVATE REPOSITORY',
    thesis: 'An embodied-agent research platform built around Anki Vector, wire-pod, local multimodal models, and tool-driven control—now being extended so autonomous behaviors can be generated, exercised, and independently qualified before they are trusted on the robot.',
    repo: 'https://github.com/ninja-ops-guy/vector-swarm-ai',
    problem: 'LLMs can already issue useful commands to Vector through my wire-pod/MCP integration, but reliable embodied autonomy requires more than a chat interface. A robot has persistent state, motors, sensors, timing constraints, failure modes, and physical consequences. The project therefore treats the model as a planner/tool user rather than the final authority, with behavior calls routed through explicit skills, event handling, safety boundaries, and verification.',
    architecture: [
      { title: 'LLM + MCP control plane', body: 'A local or compatible language model can invoke typed tools instead of emitting free-form robot code. Existing Vector capabilities are exposed as callable skills so planning remains separate from physical execution.' },
      { title: 'wire-pod / SDK bridge', body: 'wire-pod and the Vector SDK provide the robot-facing integration layer for speech, movement, sensors, animation, display, and higher-level behavior calls. This preserves the existing robot ecosystem rather than replacing it.' },
      { title: 'Persistent behavior runtime', body: 'A long-running motor/controller layer and event fabric maintain robot state across individual model turns. Patrols, handoffs, mapping, behavior sequencing, and multi-robot coordination can continue without asking the model to reconstruct the world from scratch each time.' },
      { title: 'Perception + local inference', body: 'The platform is designed to use local multimodal inference, including Qwen-class vision-language models, so camera observations and environmental state can participate in planning while keeping the control loop available on local hardware.' },
      { title: 'Verification boundary', body: 'The next stage integrates RESIDUAL as an external qualification layer: generated Python/SDK behavior code or plans are tested against contracts, simulated or bounded trials, evidence receipts, and independent verification before promotion to trusted robot behavior.' },
    ],
    evidence: ['Typed LLM control of Vector through the existing MCP / wire-pod path', 'Reusable robot skill surface rather than one-off prompt actions', 'Persistent motor/controller and event-driven coordination work', 'Multi-agent / multi-Vector coordination experiments', 'Mapping, patrol, handoff, and safety/verification-agent concepts implemented or under active development', 'Local multimodal inference target built around consumer GPU hardware'],
    failure: { signal: 'A language model can produce a plausible behavior sequence that is syntactically valid but physically unsafe, temporally wrong, incompatible with current robot state, or simply ineffective on the real device.', response: 'Keep execution authority behind typed skills and bounded runtime controls, capture the exact plan/action trace, test generated behaviors before trust promotion, and require independent verification for higher-risk or newly generated code paths.', lesson: 'Embodied AI needs a stronger standard than “the model produced code.” The useful unit is a behavior that can be observed, replayed, tested, and qualified against the actual robot interface.' },
    remains: ['Integrate RESIDUAL qualification for dynamically generated Vector SDK behaviors', 'Build a repeatable simulated/bounded trial path before physical promotion', 'Formalize OODA-style observation → orientation → decision → action traces and measure adaptation over repeated missions', 'Expand multi-robot mesh coordination, handoff, and shared world-state experiments', 'Benchmark local-model latency, task completion, recovery behavior, and safety-gate intervention rate', 'Package the MCP / wire-pod integration for public release once the interfaces, tests, documentation, and safety boundaries are ready'],
    stack: 'Anki Vector · wire-pod · Vector Python SDK · MCP · Python · local multimodal LLMs · event-driven control · RESIDUAL verification',
  },
  'ctf-redteam-harness': {
    title: 'Red-Team CTF Harness', eyebrow: 'OFFENSIVE SECURITY / AGENT BENCHMARKING / DEFENSIVE TELEMETRY', status: 'ACTIVE DEVELOPMENT · PUBLIC',
    thesis: 'A bounded security experimentation harness for comparing scripted and LLM-driven operators while preserving execution evidence, defensive visibility, and replayable reasoning.',
    repo: 'https://github.com/ninja-ops-guy/ctf-redteam-harness',
    problem: 'Agentic security tooling is easy to demo and hard to evaluate. A model can appear capable while relying on unsafe execution, irreproducible reasoning, hidden retries, or a challenge set that does not expose where it fails. I wanted a testbed where the challenge, action boundary, audit record, detections, evidence, and result are all explicit enough to compare solvers and study failure.',
    architecture: [
      { title: 'Challenge + solver layer', body: 'JSON-defined challenge packs drive either deterministic ScriptSolver playbooks or OpenAI-compatible LLM solvers, including local endpoints such as Ollama/vLLM.' },
      { title: 'Bounded execution', body: 'Shell and Python actions are constrained by timeouts, output caps, environment scrubbing, resource limits, namespace isolation, anti-obfuscation checks, and an optional Firecracker execution path.' },
      { title: 'Evidence + replay', body: 'Executed and blocked commands enter an HMAC-chained audit log. Structured agent turns feed reasoning replay, evidence graphs, stall analysis, and attack-chain extraction instead of disappearing into an opaque transcript.' },
      { title: 'Security observability', body: 'The harness also evaluates operator actions through Sigma-style detections, IOC extraction, log forensics, host-baseline checks, and per-attempt reporting so offensive activity produces defensive evidence.' },
      { title: 'Comparative evaluation', body: 'Benchmark tooling races solver configurations across the same pack and records solve rate, time, steps, and throughput so hosted/local models and routing strategies can be compared on a common workload.' },
    ],
    evidence: ['20 public challenge scenarios across 12 security domains', 'Scripted and LLM-driven solver paths share the same harness boundary', 'Tamper-evident HMAC audit detects edit, deletion, and reorder', 'Specialist routing, evidence graphs, replay, and benchmarking are implemented modules', 'Defensive detection, IOC, log-forensics, and baseline modules are wired into the solve loop', 'Local-model operation is supported through OpenAI-compatible endpoints'],
    failure: { signal: 'An agent may produce plausible reasoning or a candidate flag while taking unsafe, irrelevant, or non-reproducible actions.', response: 'Keep execution authority outside the model, bound every action, validate flags independently, retain blocked actions and detections, and replay the reasoning/action sequence against explicit success criteria.', lesson: 'For autonomous security work, capability is only one axis. The execution boundary, evidence quality, reproducibility, and defensive observability are part of the system being evaluated.' },
    remains: ['Run larger apples-to-apples local-versus-hosted benchmark campaigns', 'Add more realistic multi-stage and service-backed challenge environments', 'Use RESIDUAL as an external qualification/control layer for selected agent runs', 'Expand failure taxonomy and adversarial missions for routing, replay, and evidence integrity'],
    stack: 'Python · LLM agents · Ollama/vLLM/OpenAI-compatible APIs · Firecracker/bwrap · HMAC audit · Sigma-style detection · SAT tooling',
  },
  'cic-sat': {
    title: 'CIC & SAT Research', eyebrow: 'COMPLEXITY RESEARCH / FORMAL REASONING', status: 'RESEARCH PROGRAM · PUBLIC',
    thesis: 'A computational research program exploring structural complexity measures with experiments, proof attempts, solver tooling, and formalization artifacts—while keeping open implications visibly open.',
    repo: 'https://github.com/ninja-ops-guy/cic-p-vs-np-research', demo: 'https://kymplwsfrh776.kimi.page',
    problem: 'Investigate whether graph-structural parameters can explain useful relationships among SAT instances, proof complexity, communication complexity, and circuit complexity. Because the subject touches major open problems, empirical correlation, proved lemmas, and conditional implications must be kept distinct.',
    architecture: [
      { title: 'Experiment layer', body: 'Solver implementations and computational experiments test structural hypotheses over generated/analyzed formulas, circuits, and graphs.' },
      { title: 'Argument layer', body: 'Research tracks and papers develop definitions, lemmas, conditional chains, and proof attempts.' },
      { title: 'Formalization layer', body: 'Lean 4 artifacts provide a path toward machine-checked definitions and proofs for claims suitable for formal verification.' },
      { title: 'Communication layer', body: 'The public research site and repository expose both the program and the unresolved gaps rather than presenting a conditional path as a resolution of P vs NP.' },
    ],
    evidence: ['Public research code and papers', 'Multiple solver implementations', 'Large computational experiment corpus reported by the repository', 'Lean 4 formalization work', 'The repository explicitly marks Gap 2 / P ⊄ NC¹ as open'],
    failure: { signal: 'A conditional route reaches an unresolved lower-bound step rather than a P ≠ NP proof.', response: 'Expose the missing implication as an open gap and treat empirical structural observations as evidence for investigation, not as a substitute for the theorem.', lesson: 'In foundational research, the most important portfolio signal is epistemic discipline: readers should be able to tell exactly where measurement ends and proof begins.' },
    remains: ['Audit theorem labels and proof dependencies continuously', 'Expand machine-checked formalization of central claims', 'Reproduce computational results from clean environments', 'Keep conditional/open statements prominent in papers and site copy'],
    stack: 'Python · SAT tooling · Lean 4 · Graph algorithms · Complexity theory',
  },
};

const box = { border: '1px solid #162235', background: 'rgba(8,15,28,.78)' };

export default function CaseStudy() {
  const { slug } = useParams();
  const s = slug ? studies[slug] : undefined;
  if (!s) return <Navigate to="/" replace />;
  return <main style={{ minHeight: '100vh', background: '#050A14', color: '#E8EDF3' }}>
    <div className="max-w-[1080px] mx-auto px-6 md:px-10" style={{ paddingTop: 72, paddingBottom: 120 }}>
      <Link to="/#work" className="font-label" style={{ color: '#8899AA' }}>← PORTFOLIO</Link>
      <div style={{ marginTop: 72 }}>
        <p className="font-label" style={{ color: '#4A6DFF' }}>{s.eyebrow}</p>
        <h1 className="font-headline" style={{ fontSize: 'clamp(3rem,8vw,7rem)', lineHeight: .9, letterSpacing: '-.04em', marginTop: 18 }}>{s.title}</h1>
        <p className="font-label" style={{ color: '#7DE2A8', marginTop: 24 }}>● {s.status}</p>
        <p className="font-body" style={{ color: '#A6B3C2', fontSize: 20, lineHeight: 1.65, maxWidth: 820, marginTop: 28 }}>{s.thesis}</p>
        {(s.repo || s.demo) && <div className="flex flex-wrap gap-3" style={{ marginTop: 30 }}>
          {s.repo && <a href={s.repo} target="_blank" rel="noreferrer" className="font-label px-5 py-3 border border-[#8899AA] text-[#E8EDF3]">SOURCE / EVIDENCE →</a>}
          {s.demo && <a href={s.demo} target="_blank" rel="noreferrer" className="font-label px-5 py-3 border border-[#4A6DFF] text-[#4A6DFF]">LIVE / DEMO →</a>}
        </div>}
      </div>

      <section style={{ marginTop: 100 }}><p className="font-label" style={{ color: '#4A6DFF' }}>01 / ENGINEERING PROBLEM</p><p className="font-body" style={{ fontSize: 18, color: '#B7C3D0', lineHeight: 1.8, marginTop: 18 }}>{s.problem}</p></section>
      <section style={{ marginTop: 90 }}><p className="font-label" style={{ color: '#4A6DFF' }}>02 / ARCHITECTURE</p><div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginTop: 24 }}>{s.architecture.map(x => <div key={x.title} className="p-6" style={box}><h3 className="font-headline" style={{ fontSize: 22 }}>{x.title}</h3><p className="font-body" style={{ color: '#9EADBD', lineHeight: 1.7, marginTop: 12 }}>{x.body}</p></div>)}</div></section>
      <section style={{ marginTop: 90 }}><p className="font-label" style={{ color: '#4A6DFF' }}>03 / INSPECTABLE EVIDENCE</p><div style={{ ...box, marginTop: 24, padding: 28 }}>{s.evidence.map((x,i) => <p key={x} className="font-body" style={{ color: '#B7C3D0', lineHeight: 1.8, borderBottom: i < s.evidence.length-1 ? '1px solid #162235' : undefined, padding: '12px 0' }}>0{i+1} — {x}</p>)}</div></section>
      <section style={{ marginTop: 90 }}><p className="font-label" style={{ color: '#4A6DFF' }}>04 / FAILURE → FIX → LESSON</p><div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginTop: 24 }}>{[['SIGNAL',s.failure.signal],['RESPONSE',s.failure.response],['LESSON',s.failure.lesson]].map(([a,b]) => <div key={a} className="p-6" style={box}><p className="font-label" style={{ color: '#8899AA' }}>{a}</p><p className="font-body" style={{ color: '#B7C3D0', lineHeight: 1.7, marginTop: 14 }}>{b}</p></div>)}</div></section>
      <section style={{ marginTop: 90 }}><p className="font-label" style={{ color: '#4A6DFF' }}>05 / WHAT REMAINS</p><div style={{ marginTop: 22 }}>{s.remains.map(x => <p key={x} className="font-body" style={{ color: '#A6B3C2', padding: '12px 0', borderBottom: '1px solid #162235' }}>→ {x}</p>)}</div></section>
      <p className="font-body" style={{ color: '#66788C', marginTop: 70 }}>{s.stack}</p>
    </div>
  </main>;
}
