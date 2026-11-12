import { playSuggestions, completePlayCommand } from './song-search.js';

let nextId = 0;

// This small DOM adapter gives both terminal implementations the same keyboard,
// touch and screen-reader behavior. It only fills the prompt; Enter executes it.
export function attachPlayAutocomplete(input, container, getTracks, onComplete = () => {}) {
  const prefix = `play-complete-${++nextId}`;
  const abort = new AbortController();
  const on = (element, event, callback) => element.addEventListener(event, callback, { signal: abort.signal });
  const prior = new Map(['role', 'aria-autocomplete', 'aria-expanded', 'aria-controls', 'aria-describedby', 'aria-activedescendant']
    .map(name => [name, input.getAttribute(name)]));
  const list = document.createElement('div');
  const hint = document.createElement('div');
  list.id = `${prefix}-list`;
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'Matching songs');
  hint.id = `${prefix}-hint`;
  hint.className = 'play-autocomplete-hint';
  hint.setAttribute('role', 'tooltip');
  hint.textContent = 'Tab to autocomplete · ↑ ↓ to choose · or tap a song. Enter to play. Esc to dismiss.';
  container.classList.add('play-autocomplete');
  container.replaceChildren(hint, list);
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', list.id);
  let matches = [], active = -1, dismissed = false;

  function close() {
    container.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    if (prior.get('aria-describedby')) input.setAttribute('aria-describedby', prior.get('aria-describedby'));
    else input.removeAttribute('aria-describedby');
    active = -1;
  }

  function highlight(index) {
    active = index;
    [...list.children].forEach((option, i) => option.setAttribute('aria-selected', String(i === active)));
    if (active < 0) input.removeAttribute('aria-activedescendant');
    else {
      input.setAttribute('aria-activedescendant', list.children[active].id);
      list.children[active].scrollIntoView({ block: 'nearest' });
    }
  }

  function complete(index) {
    const track = matches[index];
    if (!track) return;
    const value = completePlayCommand(track, getTracks());
    input.value = value;
    onComplete(value);
    dismissed = true;
    close();
    input.focus();
    input.setSelectionRange(value.length, value.length);
  }

  function refresh() {
    if (dismissed || document.activeElement !== input) { close(); return; }
    matches = playSuggestions(getTracks(), input.value);
    list.replaceChildren();
    if (!matches.length) { close(); return; }
    matches.forEach((track, index) => {
      const option = document.createElement('div');
      option.id = `${prefix}-${index}`;
      option.className = 'play-autocomplete-option';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      const title = document.createElement('span');
      title.textContent = track.title;
      option.append(title);
      if (matches.filter(other => other.title === track.title).length > 1) {
        const detail = document.createElement('small');
        detail.textContent = track.url.split('/').pop();
        option.append(detail);
      }
      // Keep the input focused for mouse users; clicks also support touch.
      option.addEventListener('pointerdown', event => event.preventDefault());
      option.addEventListener('click', () => complete(index));
      list.append(option);
    });
    active = -1;
    input.removeAttribute('aria-activedescendant');
    container.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-describedby', [prior.get('aria-describedby'), hint.id].filter(Boolean).join(' '));
  }

  on(input, 'input', () => { dismissed = false; refresh(); });
  on(input, 'focus', refresh);
  on(input, 'blur', event => { if (!container.contains(event.relatedTarget)) close(); });
  on(input, 'keydown', event => {
    if (event.isComposing || event.ctrlKey || event.altKey || event.metaKey || container.hidden) return;
    const key = event.key;
    if (!['ArrowDown', 'ArrowUp', 'Escape', 'Tab', 'Enter'].includes(key)) return;
    if (key === 'Tab' && event.shiftKey || key === 'Enter' && active < 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (key === 'Escape') { dismissed = true; close(); }
    else if (key === 'ArrowDown') highlight((active + 1) % matches.length);
    else if (key === 'ArrowUp') highlight((active < 0 ? matches.length - 1 : active - 1 + matches.length) % matches.length);
    else complete(active < 0 ? 0 : active);
  });
  close();
  refresh();
  return {
    refresh,
    dismiss() { dismissed = true; close(); },
    destroy() {
      abort.abort();
      container.replaceChildren();
      container.hidden = true;
      for (const [name, value] of prior) {
        if (value === null) input.removeAttribute(name);
        else input.setAttribute(name, value);
      }
    },
  };
}
