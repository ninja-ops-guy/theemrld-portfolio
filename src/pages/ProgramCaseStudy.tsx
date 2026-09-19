import { Link } from 'react-router-dom';

type Packet = {
  title:string; eyebrow:string; status:string; state:string; thesis:string; problem:string; constraints:string[];
  architecture:{title:string;body:string}[]; evidence:string[]; verification:string[]; result:string; limitation:string; primitives:string[];
};

const packets:Record<string,Packet> = {
  residual: {
    title:'Residual / Command Station', eyebrow:'AI SECURITY RESEARCH / VERIFICATION HARNESS', status:'ACTIVE R&D · PUBLIC', state:'ENGINEERING-COMPLETE / RED-TEAM EVALUATION IN PROGRESS',
    thesis:'I built Residual because agent systems get hard to trust when routing, retries, approvals, evidence, and verification all happen implicitly. I wanted those boundaries to be explicit enough that I could inspect, enforce, and adversarially test them.',
    problem:'Once an agent system gets large enough, the hard part is not just getting a model to do the task. It is knowing what ran, what it was allowed to do, why a result was accepted, what happens when verification is uncertain, and where a human can still take control. Residual is my attempt to make those things part of the runtime instead of scattered conventions — and then attack every boundary to see if it actually holds.',
    constraints:['Fail closed when verification is unknown or rejected','Bind evidence to verifier revision, configuration, policy, and parent receipts','Prevent replay or reuse of human approvals','Keep model/provider continuity separate from acceptance authority','Quarantine all tool calls: policy evaluation before execution','Deterministic sandboxing: seccomp, unprivileged, no-new-privileges, timing-side-channel resistant'],
    architecture:[
      {title:'Contracts & stations',body:'Tasks move through explicit station contracts so execution boundaries and acceptance criteria are visible instead of implied.'},
      {title:'Obligation DAGs & attestation',body:'Dependency lineage is tracked through obligation DAGs. Every verification step leaves a tamper-evident attestation receipt binding artifacts, parent evidence, verifier identity, and cache keys into a validated graph.'},
      {title:'Quarantine barriers',body:'Worker outputs live in quarantine until they pass mechanical, structural, and judge checks in strict order. Tool calls are policy-evaluated before execution, not after.'},
      {title:'Evidence receipts',body:'Receipts bind artifacts, parent evidence, verifier identity and revision, and cache keys into a graph I can validate.'},
      {title:'Deterministic sandboxing',body:'Workers run in Docker with seccomp profiles, unprivileged containers, and no-new-privileges. Execution is bounded with circuit-breaker timeouts to prevent runaway or adversarial resource exhaustion.'},
      {title:'Durable HITL',body:'Human approval state is stored transactionally with replay prevention instead of living in temporary agent memory.'},
      {title:'Model routing',body:'I can route between cloud, subscription-backed, free-service, and local inference for cost and continuity without letting provider choice bypass verification.'},
    ],
    evidence:['Schema-versioned StationReceipt envelopes with canonical serialization','ReceiptReference parent graph with cycle/DAG validation','VerifierRevision binding implementation, configuration, policy, and optional proof hashes','PASS / FAIL / UNKNOWN / SKIPPED / BLOCKED result semantics with honest accounting','~90 red-team test modules covering gateway bypass, sandbox containment, control-integrity subversion, adversarial timing attacks','Durable SQLite-backed HITL storage and single-use challenges','Runtime extension registry with collision prevention, freeze semantics, guarded brakes, and active-run locking'],
    verification:['The automated test suite exercises receipt graphs, verifier identity, HITL replay prevention, routing boundaries, and extension behavior','Red-team suites adversarially test gateway bypass, sandbox escape, control-integrity subversion, and timing-side-channel attacks','Acceptance is kept separate from model confidence or provider output','Unknown and negative verifier states stay first-class outcomes instead of being quietly treated as success','Preregistered experiment protocol: claims are declared before testing, results are recorded without score-washing'],
    result:'The useful part is bigger than one agent workflow. I now have reusable pieces for contracts, receipts, verifiers, routing, durable state, quarantine barriers, deterministic sandboxing, and human escalation that can be dropped into other autonomous systems.',
    limitation:'Most of the evidence is still internal engineering and benchmark evidence. I have not yet shown production-scale external evaluation across independent workloads and operators.',
    primitives:['Execution contracts','Evidence receipts','Verifier revisions','Policy-bound acceptance','Durable HITL','Model routing / continuity','Fail-closed brakes','Obligation DAGs','Quarantine barriers','Deterministic sandboxing']
  },
  'verified-cyber-planning': {
    title:'Verified Cyber Planning', eyebrow:'SECURITY RESEARCH / FORMAL REASONING', status:'RESEARCH PROGRAM · PRIVATE', state:'INTERNALLY BENCHMARKED',
    thesis:'I wanted to know whether a generated cyber plan could be treated like an engineering artifact: checked, rejected, explained, and replanned against explicit rules instead of trusted because the planner said it was good.',
    problem:'Automated planning is only useful to me if the result can be checked against scope, preconditions, policy, timing, and evidence requirements. The interesting problem is not just generating a plan. It is making plan acceptance independently verifiable.',
    constraints:['Operate only inside explicit rules of engagement and bounded lab/CTF scopes','Separate plan generation from plan acceptance','Return useful counterevidence when a plan is invalid','Preserve provenance so later replanning can explain why a decision changed'],
    architecture:[
      {title:'Planning portfolio',body:'A*, SAT, incremental, and hierarchical planners can compete while using a shared intermediate representation.'},
      {title:'SAT/SMT verification',body:'Plans are checked against formalized constraints, policy objects, preconditions, temporal rules, and evidence requirements.'},
      {title:'Counterexamples',body:'When a plan fails, unsatisfied cores and counterexamples show why instead of returning a useless boolean.'},
      {title:'Research harness',body:'CyberPlanBench, digital-twin scenarios, stochastic campaigns, mutation/replanning, and audit artifacts give me repeatable ways to compare behavior.'},
    ],
    evidence:['SAT/SMT plan verifier and plan-proof artifacts','MUS/counterexample generation for rejected constraints','Cyber IR / policy objects and temporal rule handling','Multiple planner strategies with replanning and cache behavior','Benchmark and challenge-pack infrastructure retained as inspectable research artifacts'],
    verification:['Planner output is checked by a separate verifier instead of being accepted by self-report','Policy and scope failures become explicit rejection evidence','Counterfactual and replanning paths go through the same acceptance boundary'],
    result:'The most useful thing that came out of the project is not one planner. It is the verification layer around planning: policy objects, plan proofs, counterexamples, evidence contracts, and a benchmark surface for comparing strategies.',
    limitation:'This is bounded ethical-security research. It is not evidence that autonomous planning is ready for unrestricted real-world offensive use. External validation and broader benchmark diversity are still open work.',
    primitives:['Verified planners','Cyber IR','Policy objects','Plan proofs','MUS counterexamples','Replanning contracts','CyberPlanBench']
  }
};

const box={border:'1px solid #162235',background:'rgba(8,15,28,.78)'};

export default function ProgramCaseStudy({slug}:{slug:string}){
  const p=packets[slug];
  if(!p) return null;
  return <main style={{minHeight:'100vh',background:'#050A14',color:'#E8EDF3'}}><div className="max-w-[1080px] mx-auto px-6 md:px-10" style={{paddingTop:72,paddingBottom:120}}>
    <Link to="/#work" className="font-label" style={{color:'#8899AA'}}>← PORTFOLIO</Link>
    <header style={{marginTop:70}}><p className="font-label" style={{color:'#4A6DFF'}}>{p.eyebrow}</p><h1 className="font-headline" style={{fontSize:'clamp(3rem,8vw,6.4rem)',lineHeight:.92,letterSpacing:'-.04em',marginTop:18}}>{p.title}</h1><div className="flex flex-wrap gap-2" style={{marginTop:24}}><span className="font-label" style={{color:'#9AAEFF'}}>● {p.status}</span><span className="font-label" style={{border:'1px solid #334766',padding:'7px 9px',color:'#9AAEFF'}}>{p.state}</span></div><p className="font-body" style={{color:'#A6B3C2',fontSize:20,lineHeight:1.65,maxWidth:850,marginTop:28}}>{p.thesis}</p></header>
    <section style={{marginTop:88}}><p className="font-label" style={{color:'#4A6DFF'}}>01 / WHAT I WAS TRYING TO SOLVE</p><p className="font-body" style={{fontSize:17,color:'#B7C3D0',lineHeight:1.8,marginTop:18}}>{p.problem}</p></section>
    <section style={{marginTop:78}}><p className="font-label" style={{color:'#4A6DFF'}}>02 / RULES I WOULD NOT BREAK</p><div style={{...box,marginTop:22,padding:24}}>{p.constraints.map(x=><p key={x} className="font-body" style={{color:'#A9B6C5',lineHeight:1.7,margin:'8px 0'}}>→ {x}</p>)}</div></section>
    <section style={{marginTop:78}}><p className="font-label" style={{color:'#4A6DFF'}}>03 / HOW I BUILT IT</p><div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{marginTop:22}}>{p.architecture.map(x=><div key={x.title} className="p-6" style={box}><h3 className="font-headline" style={{fontSize:22}}>{x.title}</h3><p className="font-body" style={{color:'#9EADBD',lineHeight:1.7,marginTop:12}}>{x.body}</p></div>)}</div></section>
    <section style={{marginTop:78}}><p className="font-label" style={{color:'#4A6DFF'}}>04 / WHAT I CAN POINT TO</p><div style={{...box,marginTop:22,padding:26}}>{p.evidence.map((x,i)=><p key={x} className="font-body" style={{color:'#B7C3D0',lineHeight:1.75,borderBottom:i<p.evidence.length-1?'1px solid #162235':undefined,padding:'11px 0'}}>0{i+1} — {x}</p>)}</div></section>
    <section style={{marginTop:78}}><p className="font-label" style={{color:'#4A6DFF'}}>05 / HOW I CHECKED IT</p><div style={{marginTop:18}}>{p.verification.map(x=><p key={x} className="font-body" style={{color:'#A6B3C2',lineHeight:1.75,padding:'10px 0',borderBottom:'1px solid #162235'}}>→ {x}</p>)}</div></section>
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{marginTop:78}}><div className="p-6" style={box}><p className="font-label" style={{color:'#7DE2A8'}}>WHAT I GOT OUT OF IT</p><p className="font-body" style={{color:'#B7C3D0',lineHeight:1.75,marginTop:14}}>{p.result}</p></div><div className="p-6" style={box}><p className="font-label" style={{color:'#D8B26E'}}>WHAT IS STILL OPEN</p><p className="font-body" style={{color:'#B7C3D0',lineHeight:1.75,marginTop:14}}>{p.limitation}</p></div></section>
    <section style={{marginTop:78}}><p className="font-label" style={{color:'#4A6DFF'}}>06 / WHAT I CAN REUSE</p><div className="flex flex-wrap gap-2" style={{marginTop:20}}>{p.primitives.map(x=><span key={x} className="font-label" style={{border:'1px solid #263750',padding:'9px 11px',color:'#A9B6C5'}}>{x}</span>)}</div></section>
  </div></main>;
}
