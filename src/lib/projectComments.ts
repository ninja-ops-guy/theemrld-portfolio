export const PROJECT_COMMENT_DRAFT_KEY = 'k-terminal:project-comment:v1';
export const PROJECT_COMMENT_MAX_LENGTH = 1000;
export const PROJECT_COMMENT_TITLE_MAX_LENGTH = 80;
const ISSUE_URL_MAX_LENGTH = 7500;
const ISSUES_URL = 'https://github.com/ninja-ops-guy/theemrld-portfolio/issues';

export const PROJECT_COMMENTS_URL = `${ISSUES_URL}?${new URLSearchParams({
  q: 'is:issue "[Project comment]" in:title',
})}`;

export interface ProjectCommentDraft {
  title: string;
  message: string;
}

export function readProjectCommentDraft(value: string | null): ProjectCommentDraft {
  if (!value) return { title: '', message: '' };
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return { title: '', message: '' };
    const draft = parsed as Record<string, unknown>;
    return {
      title: typeof draft.title === 'string' ? draft.title.slice(0, PROJECT_COMMENT_TITLE_MAX_LENGTH) : '',
      message: typeof draft.message === 'string' ? draft.message.slice(0, PROJECT_COMMENT_MAX_LENGTH) : '',
    };
  } catch {
    return { title: '', message: '' };
  }
}

export function prepareProjectComment(draft: ProjectCommentDraft, context = 'K Terminal') {
  const message = draft.message.trim();
  if (!message) return { url: null, error: 'Write a comment before continuing.' };
  if (draft.message.length > PROJECT_COMMENT_MAX_LENGTH || draft.title.length > PROJECT_COMMENT_TITLE_MAX_LENGTH) {
    return { url: null, error: 'Shorten your comment or subject to fit the character limits.' };
  }
  const page = context.replace(/[\r\n\t]/g, ' ').trim().slice(0, 160);
  const title = `[Project comment] ${draft.title.trim() || 'Feedback'}`;
  const body = `### Project feedback\n\n${message}\n\n---\nWritten in K Terminal.${page ? `\nContext: ${page}` : ''}`;
  const url = `${ISSUES_URL}/new?${new URLSearchParams({ title, body })}`;
  if (url.length > ISSUE_URL_MAX_LENGTH) {
    return { url: null, error: 'This comment is too long to transfer to GitHub. Please shorten it before continuing.' };
  }
  return { url, error: null };
}
