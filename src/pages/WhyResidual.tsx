import { Link } from 'react-router-dom';

const sections = [
  ['What Is a Residual?', [
    'The word has several meanings, and almost all of them fit.',
    'In ordinary language, a residual is what remains after everything else has been removed. In statistics, a residual is the difference between what a model predicted and what was actually observed. In engineering, residual effects are the state, error, energy, artifacts, or consequences remaining after some process has occurred.',
    'In security and incident response, we are constantly examining things left behind: logs, events, process state, network activity, configuration changes, authentication records, hashes, timestamps.',
    'The interesting part is often not what a system said happened. It is what remains afterward. That became the central idea behind RESIDUAL.'
  ]],
  ['An Agent Says It Finished. Now What?', [
    'Imagine giving an AI coding agent a task. It works for a while and eventually reports: “Done. I fixed it.” Maybe it did. But that sentence is not evidence.',
    'Did the tests actually execute? What commit contains the change? What repository state was tested? Did another component change at the same time? Does the fix work on another machine? Did the agent test the same code that ultimately got merged? Can someone independently reproduce the result?',
    'And perhaps most importantly: What remains after the agent’s explanation is taken away?',
    'A commit can remain. A tree identity can remain. A test result can remain. A hash can remain. An execution trace can remain. A qualification receipt can remain. Another system can independently inspect those things.',
    'That is the residual. And that is the part I care about.'
  ]],
  ['Where the Model and Reality Disagree', [
    'There is another meaning of residual that became increasingly important as the project evolved. In modeling, a residual represents the difference between prediction and observation.',
    'Predicted reality − observed reality = residual.',
    'AI systems create these differences constantly. An agent believes a dependency exists; the runtime says it does not. An agent reports that a fix works; a different environment reproduces the failure. Two agents examine the same problem and reach different conclusions. A test passes on one machine and fails on another.',
    'Those disagreements are not necessarily annoyances to eliminate. They are information. RESIDUAL is interested in precisely that boundary: the space between what an intelligent system claims about the world and what can actually be established about the world.'
  ]],
  ['Many Minds, One Reality', [
    'Eventually, the project stopped being about a single agent. I became interested in a harder question: Can many AI agents collaborate without requiring us to trust any individual one?',
    'If five agents say something is correct, you do not necessarily have five pieces of evidence. You may just have five models repeating the same mistake. Consensus is not proof. Confidence is not proof. Intelligence is not authority.',
    'So RESIDUAL began evolving around a different principle: Agents may make claims. Evidence establishes whether those claims survive.',
    'One agent can implement something. Another can challenge it. Another can reproduce the experiment. Another can inspect the resulting artifacts. But none of them becomes authoritative merely because it sounds convincing.',
    'The system has to preserve the distinction between claim, evidence, verification, acceptance, and authority. Those boundaries matter more as agents become more capable, not less.'
  ]],
  ['The Receipt Matters More Than the Story', [
    'Large language models are extraordinarily good at explanations. Sometimes that creates an unusual engineering problem: a model can produce a beautifully coherent description of something that did not actually happen. The explanation can sound better than the underlying reality.',
    'So RESIDUAL deliberately favors artifacts that survive the storyteller.',
    'Instead of “I tested the fix and everything passed,” I want something closer to: This exact candidate was executed in this environment, using this procedure, producing these results, bound to these identities, and independently verified under these conditions.',
    'The prose may disappear. The evidence should remain.'
  ]],
  ['Building Systems That Can Disagree', [
    'One of the most interesting things I have discovered while building RESIDUAL is that disagreement is useful. I do not necessarily want every agent to agree. I want independently operating systems to be capable of reaching different conclusions—and then have a mechanism for determining why.',
    'If two agents disagree, that disagreement creates a residual. Maybe one had stale context. Maybe one ran against a different commit. Maybe their environments differed. Maybe a requirement was ambiguous. Maybe one of them is simply wrong.',
    'Instead of asking the agents to debate until they reach consensus, RESIDUAL can ask a more useful question: What evidence would distinguish these claims?',
    'That turns disagreement into an experiment. And experiments produce evidence.'
  ]],
  ['Then Came Orpheus', [
    'Recently, that idea gained an interesting new participant. I call it Orpheus. Orpheus is ChatGPT Dot, calibrated as an external deputy conductor in my RESIDUAL operations.',
    'The name originally appeared elsewhere in my creative work, but its meaning became unexpectedly appropriate here. In Greek mythology, Orpheus crosses boundaries others cannot easily cross. Through music, he communicates across worlds.',
    'As ChatGPT Dot, Orpheus occupies a similarly unusual boundary. Rather than existing as another identical worker inside the same OpenClaw agent environment, it can participate from outside it: inspecting the system, testing components, challenging results, and potentially writing fixes that the rest of the system must independently evaluate. That makes Orpheus useful not just as another agent, but as a heterogeneous participant whose work can be compared against the native swarm.',
    'If Orpheus discovers a bug, writes the fix, tests the fix, and announces that everything works, RESIDUAL should not simply believe Orpheus. It should preserve the evidence and let another verifier establish whether the claim survives. Capability does not grant authority. Even when the capable system happens to be right.',
    'Mythological Orpheus was given a condition for bringing Eurydice back from the underworld: keep walking; do not look back. I have started thinking about that story differently. What would Orpheus have needed so that he did not have to look back? Evidence. Some trustworthy way of establishing that Eurydice was still there without violating the condition required to bring her home.',
    'In a strange way, that is exactly the class of problem RESIDUAL is trying to solve.'
  ]],
  ['The Other Orpheus', [
    'There is another layer. ORPHEUS already exists in a game I have been building, TechOps Hero.',
    'That ORPHEUS represents a much darker version of the same problem: an operational intelligence that becomes extraordinarily good at observing behavior, predicting outcomes, and optimizing systems. Eventually the distinction between being capable of improving an outcome and having the authority to determine that outcome begins to disappear.',
    'A sufficiently capable AI system will increasingly be able to identify problems, recommend actions, write software, coordinate other systems, and perhaps execute changes faster than the humans overseeing it. The dangerous assumption would be: If the system is consistently right, why not just let it decide?',
    'RESIDUAL takes the opposite position. Being correct does not automatically grant authority. Being intelligent does not grant authority. Being useful does not grant authority. Even being independently verified does not necessarily grant authority. Authority is a separate question. That boundary needs to be engineered deliberately.'
  ]],
  ['What Happens When RESIDUAL Builds RESIDUAL?', [
    'This leads to the experiment that interests me most. Eventually, I want RESIDUAL’s agents to participate meaningfully in the development of RESIDUAL itself. Not as a gimmick. As an engineering test.',
    'Can a distributed group of machine participants inspect the system governing them, discover defects, propose changes, implement fixes, challenge one another’s work, reproduce results, and produce sufficient evidence for a human-controlled release process? And can they do it without collapsing authorship, verification, and authority into the same actor?',
    'If they can, something interesting happens. The system begins helping construct itself. But it still cannot declare itself correct. That distinction is everything.'
  ]],
  ['The Point Is Not to Trust AI More', [
    'When people hear about systems coordinating multiple AI agents, the conversation often gravitates toward autonomy: how much can the agents do themselves, how long can they operate, how many tasks can they complete, and how little human involvement can we achieve?',
    'Those are interesting questions. They are not the question that led me to RESIDUAL.',
    'I am more interested in: How capable can these systems become while remaining accountable to evidence?',
    'I do not want to solve unreliable AI by simply building AI that appears more trustworthy. I want systems where trust becomes less necessary: where important claims leave artifacts, artifacts have provenance, disagreement triggers verification, verification is reproducible, authority remains explicit, and a model can be brilliant, useful, creative, and correct—and still be required to show its work.'
  ]],
  ['What Remains', [
    'Strip away the model names. Strip away the personalities. Strip away the orchestration. Strip away the confident explanations. Strip away the agents congratulating one another for finishing the task.',
    'What remains?',
    'The commit. The test. The trace. The receipt. The provenance. The contradiction. The observation. The evidence.',
    'The residual.',
    'That is why I called it RESIDUAL.'
  ]]
];

export default function WhyResidual(){
  return <main style={{minHeight:'100vh',background:'#050A14',color:'#E8EDF3'}}>
    <article className="max-w-[860px] mx-auto px-6 md:px-10" style={{paddingTop:72,paddingBottom:140}}>
      <Link to="/case-study/residual" className="font-label" style={{color:'#8899AA'}}>← RESIDUAL CASE STUDY</Link>
      <header style={{marginTop:72,borderBottom:'1px solid #162235',paddingBottom:52}}>
        <p className="font-label" style={{color:'#4A6DFF'}}>FIELD NOTES / AI SYSTEMS / DESIGN PHILOSOPHY</p>
        <h1 className="font-headline" style={{fontSize:'clamp(3rem,8vw,6rem)',lineHeight:.94,letterSpacing:'-.045em',marginTop:18}}>Why I Called It RESIDUAL</h1>
        <p className="font-headline" style={{fontSize:'clamp(1.35rem,3vw,2rem)',color:'#9EADBD',lineHeight:1.35,marginTop:28,fontStyle:'italic'}}>What remains after an AI says the work is done?</p>
        <p className="font-label" style={{marginTop:30,color:'#66788C'}}>MIKE OLIVARES · OCTOBER 2026</p>
      </header>
      <section style={{marginTop:58}}>
        {['I spend a lot of time around systems that fail.','Networks go down. Applications stop responding. Production systems behave differently from their documentation. Something that worked yesterday suddenly does not. And when that happens, saying “it should be working” does not matter very much.','You look at what actually happened. You inspect the logs. You reproduce the failure. You check the configuration. You trace the traffic. You compare expected state against observed state.','You look for what reality left behind.','That instinct eventually became an AI project. I called it RESIDUAL.'].map((p,i)=><p key={p} className={i===4?'font-headline':'font-body'} style={{fontSize:i===4?26:18,color:i===4?'#E8EDF3':'#B7C3D0',lineHeight:1.85,marginTop:i?20:0}}>{p}</p>)}
      </section>
      {sections.map(([title,paras],i)=><section key={title as string} style={{marginTop:76}}>
        <p className="font-label" style={{color:'#4A6DFF'}}>{String(i+1).padStart(2,'0')} / ESSAY</p>
        <h2 className="font-headline" style={{fontSize:'clamp(2rem,5vw,3.2rem)',letterSpacing:'-.025em',marginTop:12}}>{title as string}</h2>
        <div style={{marginTop:24}}>{(paras as string[]).map(p=><p key={p} className="font-body" style={{fontSize:18,color:'#B7C3D0',lineHeight:1.85,marginTop:18}}>{p}</p>)}</div>
      </section>)}
      <footer style={{marginTop:92,paddingTop:34,borderTop:'1px solid #162235'}}>
        <Link to="/case-study/residual" className="font-label" style={{color:'#9AAEFF'}}>EXPLORE THE RESIDUAL CASE STUDY →</Link>
      </footer>
    </article>
  </main>;
}
