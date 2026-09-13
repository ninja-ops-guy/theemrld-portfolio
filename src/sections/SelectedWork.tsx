import { Link } from 'react-router-dom';

type Project = {
  title:string; category:string; status:string; tone:'live'|'research'|'private';
  thesis:string; claimState:string; evidence:string[]; primitive:string; caseStudy:string; github?:string; demo?:string;
};

const flagships: Project[] = [
  {
    title:'Production Systems Engineering', category:'INFRASTRUCTURE / INCIDENT OWNERSHIP / AUTOMATION', status:'PRODUCTION EXPERIENCE', tone:'live',
    thesis:'Operate real manufacturing and enterprise systems, recover failures, reduce recurrence, and turn repeated support work into reusable operational capability.',
    claimState:'OBSERVED IN PRODUCTION', evidence:['170+ → ~15 support backlog','Critical production recovery','Rogue DHCP traced to switch port','SNMP infrastructure automation'],
    primitive:'Recovery playbooks · automation · observability · operating procedures', caseStudy:'/case-study/production-systems'
  },
  {
    title:'Residual / Command Station', category:'AUTONOMOUS SYSTEMS / PLATFORM ENGINEERING', status:'ACTIVE R&D · PRIVATE', tone:'private',
    thesis:'A governed agent runtime for decomposing large tasks while preserving constraints, provenance, deterministic acceptance, cost controls, and human authority.',
    claimState:'ENGINEERING-COMPLETE / BENCHMARKED', evidence:['Bounded execution contracts','Verifier receipts + graph validation','Durable HITL state','Tiered model routing and continuity fallbacks'],
    primitive:'Contracts · receipts · verifiers · routing layers · durable state', caseStudy:'/case-study/residual'
  },
  {
    title:'Verified Cyber Planning', category:'SECURITY RESEARCH / FORMAL VERIFICATION', status:'RESEARCH PROGRAM · PRIVATE', tone:'research',
    thesis:'Research into whether cyber plans can be generated, checked, explained, and rejected against explicit constraints rather than trusted because a planner produced them.',
    claimState:'INTERNALLY BENCHMARKED', evidence:['SAT/SMT plan verification','Counterexample / MUS generation','Policy-aware planning','CyberPlanBench + proof artifacts'],
    primitive:'Verified planners · policy objects · plan proofs · counterexamples', caseStudy:'/case-study/verified-cyber-planning'
  },
  {
    title:'RAC / Adversarial Clothing', category:'ADVERSARIAL ML / PHYSICAL ROBUSTNESS', status:'PUBLIC R&D · PHYSICAL P1 PENDING', tone:'research',
    thesis:'An evidence-gated adversarial textile research program that separates digital promise from physical certification and preserves negative results.',
    claimState:'PREREGISTERED / PENDING PHYSICAL TEST', evidence:['Frozen experiment contracts','Held-out evaluation boundaries','Artifact + provenance tracking','Negative results retained'],
    primitive:'Evidence gates · frozen protocols · provenance · reproducible trials', caseStudy:'/case-study/adversarial-clothing', github:'https://github.com/ninja-ops-guy/adversarial-clothing-pipeline'
  },
];

const secondary = [
  ['TechOps Hero','State-heavy browser product engineering, runtime QA, campaign regression control, and mobile interaction.','https://github.com/ninja-ops-guy/techops-hero','https://ninja-ops-guy.github.io/techops-hero/'],
  ['CIC + LDD','Computational complexity research, SAT experiments, formalization work, and LDD tooling used to explore structural properties without overstating open claims.','https://github.com/ninja-ops-guy/cic-p-vs-np-research','https://github.com/ninja-ops-guy/LDD-Kit'],
  ['Robotics / Autonomous Operations','Event-driven robotics, persistent motor control, safety/verification agents, mapping, and multi-agent orchestration.','https://github.com/ninja-ops-guy/streetfighter-for-vector',''],
];

const toneColor=(t:Project['tone'])=>t==='live'?'#7DE2A8':t==='research'?'#9AAEFF':'#D8B26E';

export default function SelectedWork(){
  return <section id="work" className="relative" style={{background:'#050A14',padding:'120px 0',zIndex:1}}>
    <div className="max-w-[1280px] mx-auto px-6 md:px-10">
      <p className="font-label">FLAGSHIP EVIDENCE</p>
      <h2 className="font-headline" style={{color:'#E8EDF3',fontSize:'clamp(2rem,4vw,4rem)',marginTop:18,maxWidth:950,lineHeight:1}}>Operate → investigate → formalize → build → verify → platformize.</h2>
      <p className="font-body" style={{color:'#8899AA',maxWidth:840,marginTop:20,lineHeight:1.7}}>Projects are not the organizing unit. Each flagship is evidence inside a larger engineering or research program. The cards below show the claim state, inspectable evidence, and the reusable primitive that survived the work.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{marginTop:58}}>
        {flagships.map((p,i)=><article key={p.title} className="border border-[#162235] p-6 md:p-7 flex flex-col" style={{background:'rgba(8,15,28,.78)'}}>
          <div className="font-label" style={{color:'#4A6DFF'}}>0{i+1} / {p.category}</div>
          <div className="flex items-center justify-between gap-4 flex-wrap" style={{marginTop:14}}><span className="font-label" style={{color:toneColor(p.tone),fontSize:10}}>● {p.status}</span><span className="font-label" style={{border:'1px solid #263750',padding:'6px 8px',color:'#A9B6C5'}}>{p.claimState}</span></div>
          <h3 className="font-headline" style={{fontSize:'clamp(1.7rem,2.8vw,2.5rem)',color:'#E8EDF3',marginTop:18}}>{p.title}</h3>
          <p className="font-body" style={{color:'#A6B3C2',fontSize:15,lineHeight:1.7,marginTop:16}}>{p.thesis}</p>
          <div style={{marginTop:24}}><p className="font-label" style={{color:'#4A6DFF',marginBottom:10}}>INSPECTABLE EVIDENCE</p>{p.evidence.map(x=><p key={x} className="font-body" style={{color:'#B7C3D0',fontSize:13,lineHeight:1.65,margin:'6px 0'}}>→ {x}</p>)}</div>
          <div style={{marginTop:22,paddingTop:18,borderTop:'1px solid #162235'}}><p className="font-label" style={{color:'#4A6DFF'}}>REUSABLE PRIMITIVE</p><p className="font-body" style={{color:'#8899AA',fontSize:13,lineHeight:1.65,marginTop:8}}>{p.primitive}</p></div>
          <div className="flex flex-wrap gap-3 mt-auto pt-7"><Link to={p.caseStudy} className="font-label px-5 py-2 bg-[#4A6DFF] text-[#050A14]">EVIDENCE PACKET →</Link>{p.github&&<a href={p.github} target="_blank" rel="noreferrer" className="font-label px-5 py-2 border border-[#8899AA] text-[#8899AA]">SOURCE →</a>}{p.demo&&<a href={p.demo} target="_blank" rel="noreferrer" className="font-label px-5 py-2 border border-[#4A6DFF] text-[#4A6DFF]">DEMO →</a>}</div>
        </article>)}
      </div>

      <div style={{marginTop:96,borderTop:'1px solid #1A2540',paddingTop:38}}>
        <p className="font-label">SELECTED ENGINEERING / RESEARCH WORK</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{marginTop:26}}>{secondary.map(([title,body,link1,link2])=><div key={title} className="p-6 border border-[#162235]" style={{background:'#07101E'}}><h3 className="font-headline" style={{color:'#E8EDF3',fontSize:22}}>{title}</h3><p className="font-body" style={{color:'#8899AA',lineHeight:1.7,fontSize:14,marginTop:12}}>{body}</p><div className="flex flex-wrap gap-3" style={{marginTop:20}}>{link1&&<a className="font-label" style={{color:'#4A6DFF'}} href={link1} target="_blank" rel="noreferrer">EVIDENCE ↗</a>}{link2&&<a className="font-label" style={{color:'#8899AA'}} href={link2} target="_blank" rel="noreferrer">RELATED ↗</a>}</div></div>)}</div>
      </div>
    </div>
  </section>
}
