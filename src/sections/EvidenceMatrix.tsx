const rows = [
  { program:'Production Systems', claim:'Owning the incident and improving the system around it can cut recurring operational load.', state:'EXPERIMENTALLY OBSERVED', artifact:'170+ → ~15 queue reduction · recovery cases · automation' },
  { program:'Residual / Command Station', claim:'Agent work can be bounded with explicit contracts, verifier revisions, durable receipts, and human escalation.', state:'INTERNALLY BENCHMARKED', artifact:'Runtime · receipt DAG validation · HITL store · verifier contracts' },
  { program:'Verified Cyber Planning', claim:'Generated cyber plans can be checked against explicit constraints and rejected with useful counterevidence.', state:'INTERNALLY BENCHMARKED', artifact:'SAT/SMT verifier · policy objects · MUS/counterexamples · CyberPlanBench' },
  { program:'RAC / Adversarial Clothing', claim:'A digital adversarial result does not count as physical efficacy until it survives frozen evaluation and real-world testing.', state:'PREREGISTERED / PENDING TEST', artifact:'Frozen contracts · provenance · held-out evaluation · P1 protocol' },
  { program:'CIC + LDD', claim:'Structural complexity and observability tools can help expose where search, proof, and runtime behavior actually become difficult.', state:'EXPERIMENTALLY OBSERVED', artifact:'Solver experiments · Lean artifacts · LDD Kit · open-gap documentation' },
];

export default function EvidenceMatrix(){
  return <section id="evidence" className="relative" style={{background:'#08101D',padding:'110px 0',zIndex:1}}>
    <div className="max-w-[1280px] mx-auto px-6 md:px-10">
      <p className="font-label">WHAT I ACTUALLY KNOW</p>
      <h2 className="font-headline" style={{fontSize:'clamp(2rem,4vw,3.8rem)',color:'#E8EDF3',lineHeight:1.05,marginTop:16,maxWidth:900}}>I try to make it obvious what is proven, what I measured, and what is still open.</h2>
      <p className="font-body" style={{color:'#8899AA',lineHeight:1.7,maxWidth:820,marginTop:18}}>I do not want a research page where everything sounds finished. Some things are proved, some are observed, some are internally benchmarked, and some still need physical or external testing. I label them that way on purpose.</p>
      <div className="overflow-x-auto" style={{marginTop:42,border:'1px solid #1A2540'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:820}}>
          <thead><tr style={{background:'#0A1424'}}>{['PROGRAM','WHAT I AM CLAIMING','CURRENT STATE','WHAT BACKS IT'].map(h=><th key={h} className="font-label" style={{textAlign:'left',padding:'16px',borderBottom:'1px solid #1A2540',color:'#91A2B5'}}>{h}</th>)}</tr></thead>
          <tbody>{rows.map(r=><tr key={r.program} style={{borderBottom:'1px solid #162235'}}>
            <td className="font-headline" style={{padding:'18px 16px',color:'#E8EDF3',fontSize:16,verticalAlign:'top'}}>{r.program}</td>
            <td className="font-body" style={{padding:'18px 16px',color:'#A7B4C2',fontSize:13,lineHeight:1.6,verticalAlign:'top',maxWidth:420}}>{r.claim}</td>
            <td style={{padding:'18px 16px',verticalAlign:'top'}}><span className="font-label" style={{border:'1px solid #334766',padding:'7px 9px',color:'#9AAEFF',whiteSpace:'nowrap'}}>{r.state}</span></td>
            <td className="font-body" style={{padding:'18px 16px',color:'#7E90A5',fontSize:13,lineHeight:1.6,verticalAlign:'top'}}>{r.artifact}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="font-body" style={{color:'#607287',fontSize:12,lineHeight:1.7,marginTop:18}}>The label changes when the evidence changes, not when I get more excited about the project.</p>
    </div>
  </section>
}
