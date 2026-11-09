import './FourBeatPulse.css';

/** Silent visual motif, not a progress meter. Never delays navigation or audio. */
export default function FourBeatPulse({ label = 'Opening TechOps Hero', repeat = false }: { label?: string; repeat?: boolean }) {
  return <div className={`four-beat${repeat ? ' four-beat-repeat' : ''}`} role="status" aria-label={label}>
    <span className="four-beat-caption">{label}</span>
    <span className="four-beat-count" aria-hidden="true">
      {['One.', 'Two.', 'Three—', 'Four.'].map((word, index) => <span className={`four-beat-step beat-${index + 1}`} key={word}><i />{word}</span>)}
    </span>
  </div>;
}
