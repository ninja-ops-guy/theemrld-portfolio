import { Link } from 'react-router-dom';

type Project = {
  title:string; category:string; status:string; tone:'live'|'research'|'private';
  thesis:string; claimState:string; evidence:string[]; primitive:string; caseStudy:string; github?:string; demo?:string;
};

const flagships: Project[] = [
  {
    title:'Production Systems Engineering', category:'INFRASTRUCTURE / INCIDENT OWNERSHIP / AUTOMATION', status:'PRODUCTION EXPERIENCE', tone:'live',
    thesis:'This is the work that keeps me grounded. Production breaks, people are waiting on it, and I have to figure out what actually failed, get it back, and leave the environment better than I found it.',
    claimState:'OBSERVED IN PRODUCTION', evidence:['170+ → ~15 support backlog','Critical production recovery','Rogue DHCP traced to switch port','SNMP infrastructure automation'],
    primitive:'Recovery playbooks · automation · observability · operating procedures', caseStudy:'/case-study/production-systems'
  },
  {
    title:'RESIDUAL', category:'AI SECURITY RESEARCH / VERIFICATION HARNESS', status:'PUBLIC R&D · ACTIVE', tone:'research',
    thesis:'I started RESIDUAL because I did not want to trust an agent just because it sounded confident or said its work passed. The project assumes workers will sometimes be wrong, then puts contracts, evidence, verification, and deterministic integration around them.',
    claimState:'IMPLEMENTED / ACTIVE EVALUATION', evidence:['Core harness + Command Station + Mission Control / WebVM + Factory M2/M3/M4','Obligation DAGs, bounded workers, evidence receipts, independent verification, deterministic integration','Framework-agnostic residual-sdk with hash-chained SQLite attestations','LangChain + CrewAI adapters bound to a shared conformance suite','Local/cloud heterogeneous DAG experiments retain both PASS and FAIL evidence','PASS / FAIL / UNKNOWN / BLOCKED honest accounting, no score-washing'],
    primitive:'Constrain → observe → verify → deterministically integrate', caseStudy:'/case-study/residual', github:'https://github.com/ninja-ops-guy/residual-agent-harness'
  },
  {
    title:'Verified Cyber Planning', category:'SECURITY RESEARCH / FORMAL VERIFICATION', status:'RESEARCH PROGRAM · PRIVATE', tone:'research',
    thesis:'I wanted to know whether a generated cyber plan could be checked like an engineering artifact instead of trusted because a planner produced it. This project is my attempt to make that practical.',
    claimState:'INTERNALLY BENCHMARKED', evidence:['SAT/SMT plan verification','Counterexample / MUS generation','Policy-aware planning','CyberPlanBench + proof artifacts'],
    primitive:'Verified planners · policy objects · plan proofs · counterexamples', caseStudy:'/case-study/verified-cyber-planning'
  },
  {
    title:'Red-Team CTF Harness', category:'OFFENSIVE SECURITY / AGENT BENCHMARKING / DEFENSIVE TELEMETRY', status:'PUBLIC · ACTIVE', tone:'research',
    thesis:'I built a bounded environment for testing how scripted and LLM-driven agents solve security challenges, then instrumented the same actions for detection, replay, audit integrity, and comparative benchmarking.',
    claimState:'IMPLEMENTED / TESTABLE', evidence:['20 challenges across 12 security domains','Scripted + OpenAI-compatible / local-model solver abstraction','Bounded execution with namespace isolation, rlimits, environment scrubbing, and optional Firecracker path','HMAC-chained tamper-evident command audit','Reasoning replay, evidence graph, specialist routing, and solver benchmarking','Defensive rules, IOC extraction, log forensics, and host-baseline checks'],
    primitive:'Bounded execution · replayable reasoning · evidence graphs · benchmarkable agents · defensive telemetry', caseStudy:'/case-study/ctf-redteam-harness', github:'https://github.com/ninja-ops-guy/ctf-redteam-harness'
  },
  {
    title:'RAC / Adversarial Clothing', category:'ADVERSARIAL ML / PHYSICAL ROBUSTNESS', status:'PUBLIC R&D · PHYSICAL P1 PENDING', tone:'research',
    thesis:'Digital results are easy to overstate. RAC is built around the harder question: does the result still hold when you print it, wear it, deform it, change the scene, and test it properly?',
    claimState:'PREREGISTERED / PENDING PHYSICAL TEST', evidence:['Frozen experiment contracts','Held-out evaluation boundaries','Artifact + provenance tracking','Negative results retained'],
    primitive:'Evidence gates · frozen protocols · provenance · reproducible trials', caseStudy:'/case-study/adversarial-clothing', github:'https://github.com/ninja-ops-guy/adversarial-clothing-pipeline'
  },
];

const secondary = [
  ['TechOps Hero','I use the game as a real product-engineering testbed: runtime QA, state management, campaign regressions, mobile controls, deployment, and constant iteration.','https://github.com/ninja-ops-guy/techops-hero','https://ninja-ops-guy.github.io/techops-hero/'],
  ['CIC + LDD','This is where I explore structural complexity, SAT, proof ideas, formalization, and observability. Some of that research later feeds directly into security and autonomous-systems tooling.','https://github.com/ninja-ops-guy/cic-p-vs-np-research','https://github.com/ninja-ops-guy/LDD-Kit'],
  ['Vector / WirePod Robotics','An embodied-agent research platform built around Anki Vector, WirePod, MCP, and the Vector SDK. I already have typed LLM control and reusable robot skills working; the next stage is using RESIDUAL to turn requested behaviors into bounded, verified Python SDK code before anything is promoted to the robot. The research question is whether that loop can become a practical form of governed dynamic learning: observe → orient → propose → verify → act → measure → retain.','https://github.com/ninja-ops-guy/streetfighter-for-vector','','/case-study/vector-wirepod'],
];

const toneColor=(t:Project['tone'])=>t==='live'?'#7DE2A8':t==='research'?'#9AAEFF':'#D8B26E';

export default function SelectedWork(){
  return <section id="work" className="relative" style={{background:'#050A14',padding:'120px 0',zIndex:1}}>
    <div className="max-w-[1280px] mx-auto px-6 md:px-10">
      <p className="font-label">FLAGSHIP WORK</p>
      <h2 className="font-headline" style={{color:'#E8EDF3',fontSize:'clamp(2rem,4vw,4rem)',marginTop:18,maxWidth:950,lineHeight:1}}>Run the system. Find the problem. Test the idea. Keep what survives.</h2>
      <p className="font-body" style={{color:'#8899AA',maxWidth:840,marginTop:20,lineHeight:1.7}}>The projects look different on the surface, but I approach them the same way. I start with a real problem or question, build enough to test it, keep the evidence, and pull out the parts that are worth reusing.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{marginTop:58}}>
        {flagships.map((p,i)=><article key={p.title} className="border border-[#162235] p-6 md:p-7 flex flex-col" style={{background:'rgba(8,15,28,.78)'}}>
          <div className="font-label" style={{color:'#4A6DFF'}}>0{i+1} / {p.category}</div>
          <div className="flex items-center justify-between gap-4 flex-wrap" style={{marginTop:14}}><span className="font-label" style={{color:toneColor(p.tone),fontSize:10}}>● {p.status}</span><span className="font-label" style={{border:'1px solid #263750',padding:'6px 8px',color:'#A9B6C5'}}>{p.claimState}</span></div>
          <h3 className="font-headline" style={{fontSize:'clamp(1.7rem,2.8vw,2.5rem)',color:'#E8EDF3',marginTop:18}}>{p.title}</h3>
          <p className="font-body" style={{color:'#A6B3C2',fontSize:15,lineHeight:1.7,marginTop:16}}>{p.thesis}</p>
          <div style={{marginTop:24}}><p className="font-label" style={{color:'#4A6DFF',marginBottom:10}}>WHAT I CAN POINT TO</p>{p.evidence.map(x=><p key={x} className="font-body" style={{color:'#B7C3D0',fontSize:13,lineHeight:1.65,margin:'6px 0'}}>→ {x}</p>)}</div>
          <div style={{marginTop:22,paddingTop:18,borderTop:'1px solid #162235'}}><p className="font-label" style={{color:'#4A6DFF'}}>WHAT CAME OUT OF IT</p><p className="font-body" style={{color:'#8899AA',fontSize:13,lineHeight:1.65,marginTop:8}}>{p.primitive}</p></div>
          <div className="flex flex-wrap gap-3 mt-auto pt-7"><Link to={p.caseStudy} className="font-label px-5 py-2 bg-[#4A6DFF] text-[#050A14]">OPEN CASE STUDY →</Link>{p.github&&<a href={p.github} target="_blank" rel="noreferrer" className="font-label px-5 py-2 border border-[#8899AA] text-[#8899AA]">SOURCE →</a>}{p.demo&&<a href={p.demo} target="_blank" rel="noreferrer" className="font-label px-5 py-2 border border-[#4A6DFF] text-[#4A6DFF]">DEMO →</a>}</div>
        </article>)}
      </div>

      <div style={{marginTop:96,borderTop:'1px solid #1A2540',paddingTop:38}}>
        <p className="font-label">OTHER WORK</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{marginTop:26}}>{secondary.map(([title,body,link1,link2,caseStudy])=><div key={title} className="p-6 border border-[#162235]" style={{background:'#07101E'}}><h3 className="font-headline" style={{color:'#E8EDF3',fontSize:22}}>{title}</h3><p className="font-body" style={{color:'#8899AA',lineHeight:1.7,fontSize:14,marginTop:12}}>{body}</p><div className="flex flex-wrap gap-3" style={{marginTop:20}}>{caseStudy&&<Link className="font-label" style={{color:'#7DE2A8'}} to={caseStudy}>CASE STUDY →</Link>}{link1&&<a className="font-label" style={{color:'#4A6DFF'}} href={link1} target="_blank" rel="noreferrer">OPEN ↗</a>}{link2&&<a className="font-label" style={{color:'#8899AA'}} href={link2} target="_blank" rel="noreferrer">RELATED ↗</a>}</div></div>)}</div>
      </div>
    </div>
  </section>
}
