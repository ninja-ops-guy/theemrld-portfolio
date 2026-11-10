import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { GuidedCue, GuidedEdition, GuidedScore } from '../../public/k-world/guided.js';
import displayLabels from '../data/comic-display-labels.json';
import './GuidedScoreDialog.css';

export interface GuidedScoreDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (score: GuidedScore) => void;
  initialScore?: GuidedScore | null;
  onUsePublished?: () => void;
}

const emptyForm = { edition: 'g' as GuidedEdition, startPage: '1', endPage: '1', title: '', url: '' };
const editionLabel = (id: string) => displayLabels[id as keyof typeof displayLabels]?.label ?? 'Retired book';
const serialize = (score: GuidedScore) => JSON.stringify(score, null, 2);
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'The soundtrack could not be read.';

type GuidedModule = typeof import('../../public/k-world/guided.js');
let moduleRequest: Promise<GuidedModule> | null = null;
function loadGuidedModule() {
  if (!moduleRequest) moduleRequest = (import(/* @vite-ignore */ `${import.meta.env.BASE_URL}k-world/guided.js`) as Promise<GuidedModule>).catch(error => { moduleRequest = null; throw error; });
  return moduleRequest;
}

export default function GuidedScoreDialog(props: GuidedScoreDialogProps) {
  const [runtime, setRuntime] = useState<GuidedModule | null>(null);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    if (!props.open || runtime) return;
    let active = true;
    setLoadError('');
    loadGuidedModule().then(module => { if (active) setRuntime(module); }).catch(() => { if (active) setLoadError('The soundtrack editor could not load. Check your connection and reopen it. Your saved draft is unchanged.'); });
    return () => { active = false; };
  }, [props.open, runtime]);
  if (runtime) return <GuidedScoreEditor {...props} runtime={runtime} />;
  return props.open ? <GuidedScoreLoading onClose={props.onClose} message={loadError || 'Opening the soundtrack editor…'} /> : null;
}

function GuidedScoreLoading({ onClose, message }: { onClose: () => void; message: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node.showModal();
    return () => { node.close(); previous?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} className="guided-editor" aria-label="Soundtrack editor" onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => event.stopPropagation()}><div className="guided-editor-body"><p role="status">{message}</p><button type="button" onClick={onClose}>CLOSE</button></div></dialog>;
}

/** This edits a device-local preview. Publication remains a reviewed repository change. */
function GuidedScoreEditor({ open, onClose, onApply, initialScore, onUsePublished, runtime }: GuidedScoreDialogProps & { runtime: GuidedModule }) {
  const { GUIDED_DRAFT_KEY, GUIDED_EDITIONS, MAX_GUIDED_JSON_LENGTH, emptyGuidedScore, parseGuidedScore, validateGuidedScore } = runtime;
  const dialog = useRef<HTMLDialogElement>(null);
  const initialFocus = useRef<HTMLSelectElement>(null);
  const initialized = useRef(false);
  const [score, setScore] = useState<GuidedScore>(emptyGuidedScore);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [json, setJson] = useState(() => serialize(emptyGuidedScore()));
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Your changes are a preview on this device.');
  const [storageStatus, setStorageStatus] = useState('');

  useEffect(() => {
    if (!open || initialized.current) return;
    initialized.current = true;
    try {
      const saved = localStorage.getItem(GUIDED_DRAFT_KEY);
      const first = saved ? parseGuidedScore(saved) : initialScore ? validateGuidedScore(initialScore) : emptyGuidedScore();
      setScore(first); setJson(serialize(first));
      setStatus(saved ? 'Restored the soundtrack draft saved on this device.' : 'Choose the pages where each song should play.');
    } catch (failure) {
      setError(errorMessage(failure));
      setStatus('Saved draft could not be read. You can create a new score or import a valid one.');
    }
  }, [open, initialScore]);

  useEffect(() => {
    const node = dialog.current;
    if (!open || !node) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!node.open) node.showModal();
    initialFocus.current?.focus();
    return () => { if (node.open) node.close(); previous?.focus({ preventScroll: true }); };
  }, [open]);

  const save = (next: GuidedScore) => {
    const checked = validateGuidedScore(next);
    const source = serialize(checked);
    setScore(checked); setJson(source); setError('');
    try { localStorage.setItem(GUIDED_DRAFT_KEY, source); setStorageStatus('Draft saved on this device.'); }
    catch { setStorageStatus('Device storage is unavailable. Export the JSON to keep this draft.'); }
    return checked;
  };

  const addCue = (event: FormEvent) => {
    event.preventDefault();
    try {
      if (!Object.hasOwn(displayLabels, form.edition)) throw Error('Choose a current book before adding a cue.');
      if (score.editions[form.edition] && score.editions[form.edition] !== GUIDED_EDITIONS[form.edition].revision) {
        throw Error('This draft uses an older edition. Review the existing page ranges and update its revision stamp in JSON before adding cues.');
      }
      const cue: GuidedCue = {
        id: editingId ?? `cue-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        edition: form.edition, startPage: Number(form.startPage), endPage: Number(form.endPage),
        title: form.title, url: form.url,
      };
      save({ ...score, editions: { ...score.editions, [cue.edition]: GUIDED_EDITIONS[cue.edition].revision }, cues: [...score.cues.filter(item => item.id !== editingId), cue] });
      setStatus(editingId ? 'Cue updated in your local draft.' : 'Cue added to your local draft.');
      setEditingId(null); setForm({ ...emptyForm, edition: form.edition });
    } catch (failure) { setError(errorMessage(failure)); }
  };

  const edit = (cue: GuidedCue) => {
    if (!Object.hasOwn(displayLabels, cue.edition)) {
      setError('This cue belongs to a retired book. It is preserved for export, but must be recreated for a current book after reviewing its page placement.');
      return;
    }
    setEditingId(cue.id);
    setForm({ edition: cue.edition, startPage: String(cue.startPage), endPage: String(cue.endPage), title: cue.title, url: cue.url });
    setError(''); initialFocus.current?.focus();
  };

  const exportScore = () => {
    try {
      const checked = validateGuidedScore(score);
      const blobUrl = URL.createObjectURL(new Blob([serialize(checked) + '\n'], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = blobUrl; link.download = 'guided-cues.json';
      document.body.append(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      setStatus('Exported the soundtrack JSON. Publication is a separate step.');
    } catch (failure) { setError(errorMessage(failure)); }
  };

  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > MAX_GUIDED_JSON_LENGTH) throw Error('Use a soundtrack JSON file smaller than 150 KB.');
      save(parseGuidedScore(await file.text()));
      setEditingId(null); setForm(emptyForm); setStatus('Imported into the local draft. Select Preview this score to hear it.');
    } catch (failure) { setError(errorMessage(failure)); }
  };

  const stale = Object.entries(score.editions).filter(([id, revision]) => GUIDED_EDITIONS[id as GuidedEdition].revision !== revision);
  return <dialog ref={dialog} className="guided-editor" aria-labelledby="guided-editor-title" aria-describedby="guided-editor-description"
    onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => event.stopPropagation()}>
    <header className="guided-editor-header">
      <div><span>K TERMINAL / SOUNDTRACK EDITOR</span><h2 id="guided-editor-title">Set the score.</h2></div>
      <button type="button" onClick={onClose} aria-label="Close soundtrack editor">CLOSE ×</button>
    </header>
    <div className="guided-editor-body">
      <p id="guided-editor-description">Choose a song and the comic pages where it belongs. A song continues through its range; unassigned pages are silent in guided mode.</p>
      <p className="guided-local-note">LOCAL PREVIEW · These changes are saved on this device. Export the score to publish it for every reader.</p>
      {stale.length > 0 && <p className="guided-warning" role="status">Edition changed: {stale.map(([id]) => editionLabel(id)).join(', ')}. Cues for an old revision stay silent until their page ranges and revision stamps are reviewed.</p>}
      <form className="guided-cue-form" onSubmit={addCue}>
        <label className="guided-edition">COMIC BOOK
          <select ref={initialFocus} aria-label="Soundtrack book" value={form.edition} onChange={event => setForm({ ...form, edition: event.target.value as GuidedEdition })}>
            {Object.entries(displayLabels).map(([id, edition]) => <option key={id} value={id}>{edition.label} · {GUIDED_EDITIONS[id as GuidedEdition].pageCount} pages</option>)}
          </select>
        </label>
        <label>FROM PAGE<input type="number" min="1" max={GUIDED_EDITIONS[form.edition].pageCount} required value={form.startPage} onChange={event => setForm({ ...form, startPage: event.target.value })} /></label>
        <label>THROUGH PAGE<input type="number" min="1" max={GUIDED_EDITIONS[form.edition].pageCount} required value={form.endPage} onChange={event => setForm({ ...form, endPage: event.target.value })} /></label>
        <label className="guided-wide">SONG TITLE<input maxLength={250} required value={form.title} placeholder="The song you want readers to hear" onChange={event => setForm({ ...form, title: event.target.value })} /></label>
        <label className="guided-wide">SOUNDCLOUD TRACK URL<input type="url" maxLength={1500} required value={form.url} placeholder="https://soundcloud.com/raikouno/…" onChange={event => setForm({ ...form, url: event.target.value })} /></label>
        <div className="guided-wide guided-form-actions"><button type="submit" className="guided-primary">{editingId ? 'SAVE CUE' : '+ ADD CUE'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>CANCEL EDIT</button>}<small>Use the reader’s page number, including covers.</small></div>
      </form>
      {error && <p className="guided-error" role="alert">{error}</p>}
      <section className="guided-cue-list" aria-labelledby="guided-cues-title">
        <h3 id="guided-cues-title">YOUR CUES <span>{score.cues.length}</span></h3>
        {score.cues.length === 0 ? <p className="guided-empty">The score is open. Add your first song when you know where it belongs.</p> : <ol>
          {score.cues.map(cue => <li key={cue.id}><div><small>{editionLabel(cue.edition)} · pp. {cue.startPage}–{cue.endPage}</small><strong>{cue.title}</strong><a href={cue.url} target="_blank" rel="noopener noreferrer">Open song ↗</a></div><div className="guided-cue-actions"><button type="button" onClick={() => edit(cue)} aria-label={`Edit ${cue.title}`}>EDIT</button><button type="button" onClick={() => { save({ ...score, cues: score.cues.filter(item => item.id !== cue.id) }); if (editingId === cue.id) { setEditingId(null); setForm(emptyForm); } setStatus('Cue removed from the local draft.'); }} aria-label={`Remove ${cue.title}`}>REMOVE</button></div></li>)}
        </ol>}
      </section>
      <details className="guided-json"><summary>IMPORT / EXPORT JSON</summary><p>Keep the edition stamps with your cues. After a comic revision, check the page ranges before changing a stamp.</p>
        <label>SOUNDTRACK JSON<textarea spellCheck={false} value={json} maxLength={MAX_GUIDED_JSON_LENGTH} onChange={event => setJson(event.target.value)} rows={10} /></label>
        <div className="guided-json-actions"><button type="button" onClick={() => { try { save(parseGuidedScore(json)); setEditingId(null); setForm(emptyForm); setStatus('JSON loaded into your local draft.'); } catch (failure) { setError(errorMessage(failure)); } }}>LOAD JSON INTO DRAFT</button><label className="guided-file-button">IMPORT FILE<input type="file" accept=".json,application/json" onChange={event => { void importFile(event.target.files?.[0]); event.target.value = ''; }} /></label><button type="button" onClick={exportScore}>EXPORT JSON</button></div>
      </details>
      <p className="guided-editor-status" role="status">{status} {storageStatus}</p>
    </div>
    <footer className="guided-editor-footer"><span>One song per page. You set the pacing.</span><div className="guided-form-actions">{onUsePublished && <button type="button" onClick={() => { onUsePublished(); setStatus('Requesting the published soundtrack. Your local draft stays saved.'); }}>USE PUBLISHED SCORE</button>}<button type="button" className="guided-primary" onClick={() => { try { const checked = save(score); onApply(checked); setStatus('Local preview applied. Open the comic and enable Guided mode to listen.'); } catch (failure) { setError(errorMessage(failure)); } }}>PREVIEW THIS SCORE</button></div></footer>
  </dialog>;
}
