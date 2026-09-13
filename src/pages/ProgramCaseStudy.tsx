import { Link } from 'react-router-dom';

type Packet = {
  title:string; eyebrow:string; status:string; state:string; thesis:string; problem:string; constraints:string[];
  architecture:{title:string;body:string}[]; evidence:string[]; verification:string[]; result:string; limitation:string; primitives:string[];
};

const packets:Record<string,Packet> = {
  residual: {
    title:'Residual / Command Station', eyebrow:'AUTONOMOUS SYSTEMS / PLATFORM ENGINEERING', status:'ACTIVE R&D · PRIVATE', state:'ENGINEERING-COMPLETE / INTERNALLY BENCHMARKED',
    thesis:'A governed agent runtime designed to decompose large tasks while preserving constraints, provenance, deterministic acceptance, service continuity, and human authority.',
    problem:'Agent systems become difficult to trust when execution, model routing, verification, retries, and human intervention are implicit. Residual treats those boundaries as platform primitives rather than application conventions.',
    constraints:['Fail closed when verification is unknown or rejected','Bind evidence to verifier revision, configuration, policy, and parent receipts','Prevent replay or reuse of human approvals','Keep model/provider continuity separate from acceptance authority'],
    architecture:[
      {title:'Contracts & stations',body:'Tasks move through explicit station contracts with bounded execution and acceptance criteria.'},
      {title:'Evidence receipts',body:'Versioned receipts bind artifacts, parent evidence, verifier identity/revision, and canonical cache keys into a validated DAG.'},
      {title:'Durable HITL',body:'Human approval state is persisted transactionally with replay prevention rather than held in ephemeral agent memory.'},
      {title:'Model routing',body:'Cloud, subscription-backed, free-service, and local inference can be routed for cost/continuity without allowing provider choice to override verification.'},
    ],
    evidence:['Schema-versioned StationReceipt envelopes with canonical serialization','ReceiptReference parent graph with cycle/DAG validation','VerifierRevision binding implementation, configuration, policy, and optional proof hashes','PASS / FAIL / UNKNOWN / SKIPPED result semantics','Durable SQLite-backed HITL storage and single-use challenges','Runtime extension registry with collision prevention, freeze semantics, guarded brakes, and active-run locking'],
    verification:['Automated test suite exercises receipt graphs, verifier identity, HITL replay prevention, routing boundaries, and runtime extension behavior','Deterministic acceptance is separated from model confidence or provider output','Negative/unknown verifier states remain first-class outcomes rather than being coerced into success'],
    result:'The research mechanism is becoming a reusable control plane: contracts, receipts, verifiers, routing layers, durable state, and human escalation can be consumed by multiple autonomous workflows instead of rebuilt per agent.',
    limitation:'The strongest current evidence is internal engineering and benchmark evidence. Production-scale external evaluation across independent workloads and operators remains future work.',
    primitives:['Execution contracts','Evidence receipts','Verifier revisions','Policy-bound acceptance','Durable HITL','Model routing / continuity','Fail-closed brakes']
  },
  'verified-cyber-planning': {
    title:'Verified Cyber Planning', eyebrow:'SECURITY RESEARCH / FORMAL REASONING', status:'RESEARCH PROGRAM · PRIVATE', state:'INTERNALLY BENCHMARKED',
    thesis:'A research program for generating cyber plans that can be checked, explained, rejected, and replanned against explicit constraints instead of trusted because a planner produced them.',
    problem:'Automated cyber planning is useful only if the resulting action sequence can be evaluated against scope, preconditions, policy, temporal constraints, and evidence requirements. The research focuses on making plan acceptance a verification problem.',
    constraints:['Operate only inside explicit rules of engagement and bounded lab/CTF scopes','Separate plan generation from plan acceptance','Return structured counterevidence when a plan is invalid','Preserve provenance so later replanning can explain why a decision changed'],
    architecture:[
      {title:'Planning portfolio',body:'A*, SAT, incremental, and hierarchical planning strategies can compete while sharing a common intermediate representation.'},
      {title:'SAT/SMT verification',body:'Plans are checked against formalized constraints, policy objects, preconditions, temporal rules, and evidence requirements.'},
      {title:'Counterexamples',body:'Unsatisfied cores / counterexamples expose why a proposed plan fails rather than returning only a boolean rejection.'},
      {title:'Research harness',body:'CyberPlanBench, digital-twin scenarios, stochastic campaigns, mutation/replanning, and audit artifacts provide repeatable evaluation surfaces.'},
    ],
    evidence:['SAT/SMT plan verifier and plan-proof artifacts','MUS/counterexample generation for rejected constraints','Cyber IR / policy objects and temporal rule handling','Multiple planner strategies with replanning and cache behavior','Benchmark and challenge-pack infrastructure retained as inspectable research artifacts'],
    verification:['Planner output is not accepted by self-report; a separate verifier evaluates the plan','Policy/scope failures become explicit rejection evidence','Counterfactual and replanning paths are evaluated against the same acceptance boundary'],
    result:'The useful contribution is not a single planner. It is the reusable verification layer around planning: policy objects, plan proofs, counterexamples, evidence contracts, and a benchmark surface for comparing strategies.',
    limitation:'This is a bounded ethical-security research environment, not evidence that autonomous planning is ready for unrestricted real-world offensive operation. External validation and broader benchmark diversity remain open.',
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
    <section style={{marginTop:88}}><p className="font-label" style={{color:'#4A6DFF'}}>01 / PROBLEM</p><p className="font-body" style={{fontSize:17,color:'#B7C3D0',lineHeight:1.8,marginTop:18}}>{p.problem}</p></section>
    <section style={{marginTop:78}}><p className="font-label" style={{color:'#4A6DFF'}}>02 / CONSTRAINTS</p><div style={{...box,marginTop:22,padding:24}}>{p.constraints.map(x=><p key={x} className="font-body" style={{color:'#A9B6C5',lineHeight:1.7,margin:'8px 0'}}>→ {x}</p>)}</div></section>
    <section style={{marginTop:78}}><p className="font-label" style={{color:'#4A6DFF'}}>03 / ARCHITECTURE</p><div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{marginTop:22}}>{p.architecture.map(x=><div key={x.title} className="p-6" style={box}><h3 className="font-headline" style={{fontSize:22}}>{x.title}</h3><p className="font-body" style={{color:'#9EADBD',lineHeight:1.7,marginTop:12}}>{x.body}</p></div>)}</div></section>
    <section style={{marginTop:78}}><p className="font-label" style={{color:'#4A6DFF'}}>04 / INSPECTABLE EVIDENCE</p><div style={{...box,marginTop:22,padding:26}}>{p.evidence.map((x,i)=><p key={x} className="font-body" style={{color:'#B7C3D0',lineHeight:1.75,borderBottom:i<p.evidence.length-1?'1px solid #162235':undefined,padding:'11px 0'}}>0{i+1} — {x}</p>)}</div></section>
    <section style={{marginTop:78}}><p className="font-label" style={{color:'#4A6DFF'}}>05 / VERIFICATION METHOD</p><div style={{marginTop:18}}>{p.verification.map(x=><p key={x} className="font-body" style={{color:'#A6B3C2',lineHeight:1.75,padding:'10px 0',borderBottom:'1px solid #162235'}}>→ {x}</p>)}</div></section>
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{marginTop:78}}><div className="p-6" style={box}><p className="font-label" style={{color:'#7DE2A8'}}>MEASURED / ENGINEERED RESULT</p><p className="font-body" style={{color:'#B7C3D0',lineHeight:1.75,marginTop:14}}>{p.result}</p></div><div className="p-6" style={box}><p className="font-label" style={{color:'#D8B26E'}}>LIMITATION / OPEN WORK</p><p className="font-body" style={{color:'#B7C3D0',lineHeight:1.75,marginTop:14}}>{p.limitation}</p></div></section>
    <section style={{marginTop:78}}><p className="font-label" style={{color:'#4A6DFF'}}>06 / REUSABLE PRIMITIVES PRODUCED</p><div className="flex flex-wrap gap-2" style={{marginTop:20}}>{p.primitives.map(x=><span key={x} className="font-label" style={{border:'1px solid #263750',padding:'9px 11px',color:'#A9B6C5'}}>{x}</span>)}</div></section>
  </div></main>;
}
