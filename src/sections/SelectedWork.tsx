import { Link } from 'react-router-dom';

type Project = {
  title:string; category:string; status:string; tone:'live'|'research'|'private';
  thesis:string; claimState:string; evidence:string[]; primitive:string; caseStudy:string; github?:string; demo?:string;
};

const flagships: Project[] = [
  {
    title:'RESIDUAL', category:'TRUSTWORTHY AGENT SYSTEMS / VERIFICATION', status:'PUBLIC R&D · ACTIVE', tone:'research',
    thesis:'RESIDUAL is the center of my current work: a system built around the assumption that autonomous workers can be stochastic, incomplete, or wrong. Acceptance depends on contracts, bounded execution, evidence, independent verification, and deterministic integration—not confidence.',
    claimState:'IMPLEMENTED / ACTIVE EVALUATION', evidence:['Core harness + Command Station + Mission Control / WebVM + Factory M2/M3/M4','Obligation DAGs, bounded workers, evidence receipts, independent verification, deterministic integration','Framework-agnostic residual-sdk with hash-chained SQLite attestations','LangChain + CrewAI adapters bound to a shared conformance suite','Mixed PASS / FAIL / UNKNOWN / BLOCKED outcomes retained without score-washing'],
    primitive:'Constrain → observe → verify → deterministically integrate', caseStudy:'/case-study/residual', github:'https://github.com/ninja-ops-guy/residual-agent-harness'
  },
  {
    title:'RAC / Adversarial Clothing', category:'ADVERSARIAL ML / PHYSICAL ROBUSTNESS', status:'PUBLIC R&D · PHYSICAL P1 PENDING', tone:'research',
    thesis:'RAC asks whether digitally promising adversarial designs survive printing, deformation, viewpoint, lighting, and physical evaluation. The project is deliberately structured so software capability cannot be mistaken for physical efficacy.',
    claimState:'PREREGISTERED / PENDING PHYSICAL TEST', evidence:['Frozen experiment contracts','Held-out evaluation boundaries','Artifact + provenance tracking','Negative digital results retained','Physical efficacy explicitly remains unestablished'],
    primitive:'Evidence gates · frozen protocols · provenance · reproducible trials', caseStudy:'/case-study/adversarial-clothing', github:'https://github.com/ninja-ops-guy/adversarial-clothing-pipeline'
  },
];

const foundation: Project = {
  title:'Production Systems Engineering', category:'FOUNDATION / INFRASTRUCTURE / INCIDENT OWNERSHIP', status:'PRODUCTION EXPERIENCE', tone:'live',
  thesis:'The research work is grounded in operating systems that people actually depend on: restore service, find the real failure mode, reduce recurrence, and leave behind a repeatable operating path.',
  claimState:'OBSERVED IN PRODUCTION', evidence:['170+ → ~15 support backlog','Critical production recovery','Rogue DHCP traced to switch port','SNMP infrastructure automation'],
  primitive:'Recovery playbooks · automation · observability · operating procedures', caseStudy:'/case-study/production-systems'
};

const secondary = [
  ['TechOps Hero','A public product-engineering testbed for runtime QA, state management, campaign regressions, mobile controls, deployment, and failure-driven iteration.','https://github.com/ninja-ops-guy/techops-hero','https://ninja-ops-guy.github.io/techops-hero/','/case-study/techops-hero','PUBLIC · PLAYABLE'],
  ['Red-Team CTF Harness','A private security R&D testbed for comparing scripted and LLM-driven operators while retaining execution evidence, replayable reasoning, and defensive telemetry. Included as a case study, not as inspectable public source.','','','/case-study/ctf-redteam-harness','PRIVATE R&D'],
  ['CIC + LDD','Research into structural complexity, SAT, proof ideas, formalization, and observability. Kept as research exploration, with open claims separated from measured or formal evidence.','https://github.com/ninja-ops-guy/cic-p-vs-np-research','https://github.com/ninja-ops-guy/LDD-Kit','/case-study/cic-sat','PUBLIC RESEARCH'],
  ['Vector / WirePod Embodied AI','A private embodied-agent research platform for typed LLM control, reusable robot skills, event-driven coordination, and a developing RESIDUAL qualification layer. Included as work in progress rather than public evidence.','','','/case-study/vector-wirepod','PRIVATE · PUBLIC RELEASE PLANNED'],
];

const toneColor=(t:Project['tone'])=>t==='live'?'#7DE2A8':t==='research'?'#9AAEFF':'#D8B26E';

export default function SelectedWork(){
  return <section id="work" className="relative" style={{background:'#050A14',padding:'120px 0',zIndex:1}}>
    <div className="max-w-[1280px] mx-auto px-6 md:px-10">
      <p className="font-label">FLAGSHIP RESEARCH & ENGINEERING</p>
      <h2 className="font-headline" style={{color:'#E8EDF3',fontSize:'clamp(2rem,4vw,4rem)',marginTop:18,maxWidth:950,lineHeight:1}}>Run the system. Find the problem. Test the idea. Keep what survives.</h2>
      <p className="font-body" style={{color:'#8899AA',maxWidth:840,marginTop:20,lineHeight:1.7}}>The public flagship work carries the main research story. Each program has a different domain, but the evaluation rule is the same: separate what is implemented from what is observed, and what is observed from what is still a hypothesis.</p>

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

      <div style={{marginTop:72}}>
        <p className="font-label">OPERATIONAL FOUNDATION</p>
        <article className="border border-[#162235] p-6 md:p-7" style={{background:'rgba(8,15,28,.78)',marginTop:24}}>
          <div className="flex items-center justify-between gap-4 flex-wrap"><span className="font-label" style={{color:'#7DE2A8',fontSize:10}}>● {foundation.status}</span><span className="font-label" style={{border:'1px solid #263750',padding:'6px 8px',color:'#A9B6C5'}}>{foundation.claimState}</span></div>
          <h3 className="font-headline" style={{fontSize:'clamp(1.7rem,2.8vw,2.5rem)',color:'#E8EDF3',marginTop:18}}>{foundation.title}</h3>
          <p className="font-body" style={{color:'#A6B3C2',fontSize:15,lineHeight:1.7,marginTop:16,maxWidth:900}}>{foundation.thesis}</p>
          <div className="flex flex-wrap gap-3" style={{marginTop:22}}><Link to={foundation.caseStudy} className="font-label px-5 py-2 border border-[#7DE2A8] text-[#7DE2A8]">OPEN CASE STUDY →</Link></div>
        </article>
      </div>

      <div style={{marginTop:96,borderTop:'1px solid #1A2540',paddingTop:38}}>
        <p className="font-label">OTHER WORK</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{marginTop:26}}>{secondary.map(([title,body,link1,link2,caseStudy,note])=><div key={title} className="p-6 border border-[#162235]" style={{background:'#07101E'}}><h3 className="font-headline" style={{color:'#E8EDF3',fontSize:22}}>{title}</h3>{note&&<p className="font-label" style={{color:'#D8B26E',fontSize:10,marginTop:10}}>● {note}</p>}<p className="font-body" style={{color:'#8899AA',lineHeight:1.7,fontSize:14,marginTop:12}}>{body}</p><div className="flex flex-wrap gap-3" style={{marginTop:20}}>{caseStudy&&<Link className="font-label" style={{color:'#7DE2A8'}} to={caseStudy}>CASE STUDY →</Link>}{link1&&<a className="font-label" style={{color:'#4A6DFF'}} href={link1} target="_blank" rel="noreferrer">OPEN ↗</a>}{link2&&<a className="font-label" style={{color:'#8899AA'}} href={link2} target="_blank" rel="noreferrer">RELATED ↗</a>}</div></div>)}</div>
      </div>
    </div>
  </section>
}
