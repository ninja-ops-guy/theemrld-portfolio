import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  prepareProjectComment,
  PROJECT_COMMENT_DRAFT_KEY,
  PROJECT_COMMENT_MAX_LENGTH,
  PROJECT_COMMENT_TITLE_MAX_LENGTH,
  PROJECT_COMMENTS_URL,
  readProjectCommentDraft,
  type ProjectCommentDraft,
} from '../lib/projectComments';
import './ProjectCommentDialog.css';

interface ProjectCommentDialogProps {
  open: boolean;
  onClose: () => void;
  context?: string;
}

function initialDraft(): ProjectCommentDraft {
  try {
    return readProjectCommentDraft(window.localStorage.getItem(PROJECT_COMMENT_DRAFT_KEY));
  } catch {
    return { title: '', message: '' };
  }
}

export default function ProjectCommentDialog({ open, onClose, context = 'K Terminal' }: ProjectCommentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState<ProjectCommentDraft>(initialDraft);
  const [savedOnDevice, setSavedOnDevice] = useState(false);
  const [handoffOpened, setHandoffOpened] = useState(false);
  const prepared = prepareProjectComment(draft, context);
  const hasDraft = Boolean(draft.title || draft.message);

  useEffect(() => {
    try {
      if (hasDraft) {
        window.localStorage.setItem(PROJECT_COMMENT_DRAFT_KEY, JSON.stringify(draft));
      } else {
        window.localStorage.removeItem(PROJECT_COMMENT_DRAFT_KEY);
      }
      setSavedOnDevice(true);
    } catch {
      setSavedOnDevice(false);
    }
  }, [draft, hasDraft]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!dialog.open) dialog.showModal();
    messageRef.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [open]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="kt-comment-dialog"
      aria-labelledby="kt-comment-title"
      aria-describedby="kt-comment-description"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => event.stopPropagation()}
      onKeyUp={(event) => event.stopPropagation()}
    >
      <header className="kt-comment-heading">
        <div>
          <span className="kt-comment-kicker">K TERMINAL / COMMUNITY</span>
          <h2 id="kt-comment-title">Leave a comment<span aria-hidden="true">_</span></h2>
        </div>
        <button type="button" className="kt-comment-close" onClick={onClose} aria-label="Close comment editor">×</button>
      </header>

      <p id="kt-comment-description" className="kt-comment-intro">
        Thoughts on the comic, music, game, or the project? Write them here, then review and post on GitHub.
      </p>

      <div className="kt-comment-field">
        <label htmlFor="kt-comment-subject">Subject <span>(optional)</span></label>
        <input
          id="kt-comment-subject"
          type="text"
          value={draft.title}
          maxLength={PROJECT_COMMENT_TITLE_MAX_LENGTH}
          placeholder="What’s on your mind?"
          autoComplete="off"
          onChange={(event) => { setDraft((current) => ({ ...current, title: event.target.value })); setHandoffOpened(false); }}
        />
      </div>

      <div className="kt-comment-field">
        <div className="kt-comment-label-row">
          <label htmlFor="kt-comment-message">Your comment</label>
          <span id="kt-comment-count">{draft.message.length}/{PROJECT_COMMENT_MAX_LENGTH}</span>
        </div>
        <textarea
          ref={messageRef}
          id="kt-comment-message"
          value={draft.message}
          maxLength={PROJECT_COMMENT_MAX_LENGTH}
          rows={7}
          placeholder="I’d love to see…"
          aria-describedby="kt-comment-count kt-comment-storage"
          onChange={(event) => { setDraft((current) => ({ ...current, message: event.target.value })); setHandoffOpened(false); }}
        />
      </div>

      <div className="kt-comment-meta">
        <span id="kt-comment-storage">{hasDraft ? (savedOnDevice ? 'Draft saved on this device.' : 'Draft kept in this tab; device storage is unavailable.') : 'Your draft stays here until you clear it.'}</span>
        {hasDraft && <button type="button" onClick={() => { setDraft({ title: '', message: '' }); setHandoffOpened(false); messageRef.current?.focus(); }}>Clear draft</button>}
      </div>

      <div className="kt-comment-notice">
        <strong>Public feedback · GitHub sign-in required</strong>
        <p>Your comment is posted only after you submit it on GitHub. Your draft stays here if you close that tab.</p>
      </div>

      <div className="kt-comment-status" role="status" aria-live="polite">
        {handoffOpened ? 'Review and submit on GitHub to publish your comment. Your draft is still saved here.' : draft.message.trim() && prepared.error ? prepared.error : ''}
      </div>

      <footer className="kt-comment-actions">
        <a href={PROJECT_COMMENTS_URL} target="_blank" rel="noopener noreferrer" className="kt-comment-secondary">Read project feedback ↗</a>
        {prepared.url ? (
          <a
            className="kt-comment-submit"
            href={prepared.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setHandoffOpened(true)}
          >Review and post on GitHub ↗</a>
        ) : (
          <button type="button" className="kt-comment-submit" disabled>Review and post on GitHub ↗</button>
        )}
      </footer>
      <p className="kt-comment-escape">ESC to close · draft retained</p>
    </dialog>,
    document.body,
  );
}
