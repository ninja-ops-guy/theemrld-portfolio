const stages = [
  { era: 'EARLY API / CLI', title: 'Models became tools, not just chat.', body: 'I started by wiring early language-model APIs into command-line workflows. The useful lesson was not the novelty of a prompt; it was learning what changes when a model can participate in an operational toolchain.' },
  { era: 'TOOL-USING WORKFLOWS', title: 'Capability exposed the control problem.', body: 'As the workflows gained tools, state, and autonomy, the harder questions became boundaries, observability, recovery, and how to tell whether the work was actually correct.' },
  { era: 'AGENT SYSTEMS', title: 'The harness became the engineering problem.', body: 'I moved from asking what a model could generate to designing the system around it: contracts, bounded workers, evidence, independent verification, deterministic integration, and failure handling.' },
  { era: 'RESIDUAL', title: 'Trust became something to engineer.', body: 'RESIDUAL is the current expression of that trajectory: assume individual workers can be stochastic or wrong, then make acceptance depend on inspectable evidence and explicit system-level controls.' },
];

export default function EngineeringTrajectory() {
  return <section className="relative" style={{background:'#060C17',padding:'110px 0',zIndex:1}}>
    <div className="max-w-[1280px] mx-auto px-6 md:px-10">
      <p className="font-label">ENGINEERING TRAJECTORY</p>
      <h2 className="font-headline" style={{color:'#E8EDF3',fontSize:'clamp(2rem,4vw,3.8rem)',lineHeight:1.05,marginTop:16,maxWidth:960}}>From putting models in the terminal to engineering the systems around autonomous work.</h2>
      <p className="font-body" style={{color:'#8899AA',maxWidth:880,lineHeight:1.8,marginTop:20}}>The through-line is not “I used AI early.” It is that the same problem kept getting deeper. Once a model can use tools and affect real systems, generation is only the beginning; constraints, evidence, verification, and recovery become the actual engineering work.</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-px" style={{background:'#1A2540',border:'1px solid #1A2540',marginTop:42}}>
        {stages.map((s,i)=><article key={s.era} style={{background:'#060C17',padding:'28px'}}>
          <div className="font-label" style={{color:'#4A6DFF'}}>0{i+1} / {s.era}</div>
          <h3 className="font-headline" style={{color:'#E8EDF3',fontSize:20,lineHeight:1.25,marginTop:18}}>{s.title}</h3>
          <p className="font-body" style={{color:'#8FA0B2',fontSize:13,lineHeight:1.75,marginTop:14}}>{s.body}</p>
        </article>)}
      </div>
      <p className="font-body" style={{color:'#74869A',fontSize:12,lineHeight:1.7,marginTop:18}}>This is a technical progression, not a claim to have invented agentic development. The evidence is in the systems, artifacts, tests, and failure records linked throughout the portfolio.</p>
    </div>
  </section>
}
