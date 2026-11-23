const stages = [
  ['Early API era','LLM + CLI experimentation','Models become tools.'],
  ['Tool-integrated workflows','Shell, automation, development environments','Models become operators.'],
  ['Agent & swarm experimentation','Orchestration, specialization, distributed execution','Models become collaborators.'],
  ['RESIDUAL','Contracts, evidence, verification, containment','Autonomy becomes something that must be qualified.'],
  ['Current research','Recursive improvement, security, embodied AI','Can systems safely learn, improve, and act?'],
];

export default function Journey() {
  return <section id="journey" className="relative px-6 md:px-10 py-24 md:py-32 max-w-[1440px] mx-auto">
    <div className="max-w-[980px]">
      <p className="font-label mb-5">HOW I GOT HERE // A TECHNICAL LINEAGE</p>
      <h2 className="font-headline text-[clamp(36px,6vw,72px)] leading-[.98] tracking-[-.04em] mb-8">FROM LLM TOOLING TO<br/><span style={{color:'#9AAEFF'}}>VERIFIABLE AUTONOMOUS SYSTEMS</span></h2>
      <div className="font-body text-[16px] md:text-[18px] leading-[1.8] text-[#A8B5C4] space-y-6 max-w-[860px]">
        <p>My work with AI systems began before the current wave of coding agents. During the early OpenAI API waitlist era, I started connecting language models to the environment where I was already comfortable working: the command line. Tools such as ShellGPT were primitive compared with today's coding agents, but the underlying idea was already there: a model became substantially more useful when it could operate alongside real tools, files, commands, and a human who understood the environment.</p>
        <p>Looking back, that was my first experience with what I would now call an <strong className="text-[#E8EDF3] font-normal">agent harness</strong>. Context had to be managed manually. Reliability was inconsistent. Human supervision was mandatory. Those constraints exposed the same problems that now define agent engineering: tool use, context management, permissions, failure recovery, verification, and deciding what authority should remain with the human.</p>
        <p>As models improved, my question changed from <em className="text-[#E8EDF3]">“What can I prompt the model to do?”</em> to <em className="text-[#E8EDF3]">“What system can I build around the model so it can accomplish useful work reliably?”</em></p>
      </div>
    </div>

    <div className="mt-16 border-t border-[#1B2A3A]">
      {stages.map(([era,work,idea],i)=><div key={era} className="grid md:grid-cols-[90px_1fr_1fr] gap-3 md:gap-8 py-7 border-b border-[#1B2A3A]">
        <span className="font-label" style={{color:'#4A6DFF'}}>0{i+1}</span>
        <div><div className="font-headline text-xl text-[#E8EDF3]">{era}</div><div className="font-body text-sm text-[#66788C] mt-1">{work}</div></div>
        <div className="font-body text-[15px] text-[#A8B5C4] md:text-right">{idea}</div>
      </div>)}
    </div>

    <div className="mt-16 grid md:grid-cols-2 gap-10 md:gap-16">
      <div>
        <p className="font-label mb-4">THE PROBLEM CHANGED AGAIN</p>
        <p className="font-body text-[16px] leading-[1.8] text-[#A8B5C4]">Modern agents can navigate repositories, call tools, modify files, execute commands, run tests, and iterate. That creates a harder question: <strong className="text-[#E8EDF3] font-normal">once an agent can perform substantial work autonomously, how do we know the work should be trusted?</strong> A successful command is not necessarily a correct result. A passing test does not necessarily prove the intended property. Several agents agreeing does not make their conclusion true.</p>
      </div>
      <div>
        <p className="font-label mb-4">WHY RESIDUAL EXISTS</p>
        <p className="font-body text-[16px] leading-[1.8] text-[#A8B5C4]">RESIDUAL grew from that problem. It explores bounded, inspectable, evidence-producing autonomy: explicit mission contracts, isolated workers, deterministic integration, independent verification, failure containment, human escalation, reproducible experiments, challengeable claims, and governed recursive improvement. The goal is not to eliminate autonomy. It is to make greater autonomy possible without requiring blind trust.</p>
      </div>
    </div>

    <div className="mt-16 p-7 md:p-10 border border-[#26384C]" style={{background:'rgba(74,109,255,.045)'}}>
      <p className="font-label mb-4">THE RECURRING QUESTION</p>
      <p className="font-headline text-[clamp(24px,3.5vw,42px)] leading-[1.15] max-w-[1050px]">How do we connect intelligent models to real capabilities while retaining enough structure to understand, test, and trust what they do?</p>
      <p className="font-body text-[15px] leading-[1.8] text-[#8899AA] mt-6 max-w-[900px]">Today that work spans autonomous agent infrastructure, cybersecurity research, distributed systems, adversarial testing, and embodied AI. The technology has changed dramatically since my first command-line LLM workflows. The systems question has remained remarkably consistent.</p>
    </div>
  </section>;
}
