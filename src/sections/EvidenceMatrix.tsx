const rows = [
  { program:'Production Systems', claim:'Operational load can be reduced by combining incident ownership with process and infrastructure improvement.', state:'EXPERIMENTALLY OBSERVED', artifact:'170+ → ~15 queue reduction · recovery cases · automation' },
  { program:'Residual / Command Station', claim:'Autonomous work can be bounded by explicit contracts, verifier revisions, durable receipts, and human escalation.', state:'INTERNALLY BENCHMARKED', artifact:'Runtime · receipt DAG validation · HITL store · verifier contracts' },
  { program:'Verified Cyber Planning', claim:'Generated cyber plans can be checked against explicit constraints and rejected with structured counterevidence.', state:'INTERNALLY BENCHMARKED', artifact:'SAT/SMT verifier · policy objects · MUS/counterexamples · CyberPlanBench' },
  { program:'RAC / Adversarial Clothing', claim:'Digital adversarial promise must survive frozen evaluation and physical testing before efficacy claims are warranted.', state:'PREREGISTERED / PENDING TEST', artifact:'Frozen contracts · provenance · held-out evaluation · P1 protocol' },
  { program:'CIC + LDD', claim:'Graph-structured complexity measures are useful research instruments for exploring SAT/proof/circuit structure.', state:'EXPERIMENTALLY OBSERVED', artifact:'Solver experiments · Lean artifacts · LDD Kit · open-gap documentation' },
];

export default function EvidenceMatrix(){
  return <section id="evidence" className="relative" style={{background:'#08101D',padding:'110px 0',zIndex:1}}>
    <div className="max-w-[1280px] mx-auto px-6 md:px-10">
      <p className="font-label">RESEARCH EVIDENCE MATRIX</p>
      <h2 className="font-headline" style={{fontSize:'clamp(2rem,4vw,3.8rem)',color:'#E8EDF3',lineHeight:1.05,marginTop:16,maxWidth:900}}>Every important claim should expose its evidence state.</h2>
      <p className="font-body" style={{color:'#8899AA',lineHeight:1.7,maxWidth:820,marginTop:18}}>I separate what is proved, observed, benchmarked, engineering-complete, preregistered, or still speculative. The point is not to make every project look successful; it is to make the state of the evidence legible.</p>
      <div className="overflow-x-auto" style={{marginTop:42,border:'1px solid #1A2540'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:820}}>
          <thead><tr style={{background:'#0A1424'}}>{['PROGRAM','CLAIM','EVIDENCE STATE','ARTIFACT'].map(h=><th key={h} className="font-label" style={{textAlign:'left',padding:'16px',borderBottom:'1px solid #1A2540',color:'#91A2B5'}}>{h}</th>)}</tr></thead>
          <tbody>{rows.map(r=><tr key={r.program} style={{borderBottom:'1px solid #162235'}}>
            <td className="font-headline" style={{padding:'18px 16px',color:'#E8EDF3',fontSize:16,verticalAlign:'top'}}>{r.program}</td>
            <td className="font-body" style={{padding:'18px 16px',color:'#A7B4C2',fontSize:13,lineHeight:1.6,verticalAlign:'top',maxWidth:420}}>{r.claim}</td>
            <td style={{padding:'18px 16px',verticalAlign:'top'}}><span className="font-label" style={{border:'1px solid #334766',padding:'7px 9px',color:'#9AAEFF',whiteSpace:'nowrap'}}>{r.state}</span></td>
            <td className="font-body" style={{padding:'18px 16px',color:'#7E90A5',fontSize:13,lineHeight:1.6,verticalAlign:'top'}}>{r.artifact}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="font-body" style={{color:'#607287',fontSize:12,lineHeight:1.7,marginTop:18}}>Evidence labels describe the current state of the claim, not the ambition of the program. Status changes only when new evidence justifies it.</p>
    </div>
  </section>
}
