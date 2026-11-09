import { cueKey, emptyGuidedScore, resolveGuidedCue, validateGuidedScore } from './guided.js';

/** Page-cued policy over the existing Sequencer. This never creates a player. */
export class GuidedPlayback {
  constructor(music, onNotice = () => {}) {
    this.music = music;
    this.onNotice = onNotice;
    this.score = emptyGuidedScore();
    this.location = null;
    this.enabled = false;
    this.activeCue = null;
    this.notice = 'Guided mode is off.';
    this.activeKey = null;
  }

  setScore(input) {
    // Validate before changing any state: a rejected import leaves playback intact.
    const score = validateGuidedScore(input);
    this.score = score;
    if (this.enabled) this.apply();
    return score;
  }

  setLocation(position) {
    this.location = position && typeof position === 'object' && !Array.isArray(position)
      ? { edition: position.edition, page: position.page, revision: position.revision }
      : null;
    if (this.enabled) this.apply();
  }

  setEnabled(enabled) {
    if (enabled && !this.score.cues.length) {
      this.setNotice('No guided songs are assigned yet. Use guided edit to define a local preview.');
      return; // An unavailable mode must not pause or clear existing background music.
    }
    this.enabled = Boolean(enabled);
    if (this.enabled) {
      // Explicitly choosing guided listening is a new play gesture.
      this.music.state.pausedByUser = false;
      this.apply({ resume: true });
    } else {
      this.activeCue = null;
      this.activeKey = null;
      this.music.state.armed = false;
      this.setNotice('Guided mode is off.');
      this.music.pause();
    }
  }

  pause() {
    if (this.enabled) this.setNotice(this.activeCue ? this.cueNotice(true) : 'Guided mode is paused.');
    this.music.pause();
  }

  resume() {
    if (!this.enabled) {
      this.music.resume();
      return;
    }
    this.music.state.pausedByUser = false;
    // Calling Sequencer.resume() without a cue would start a room playlist.
    this.apply({ resume: true });
  }

  cancelForManual() {
    this.enabled = false;
    this.activeCue = null;
    this.activeKey = null;
    this.setNotice('Guided mode is off.');
    // The caller's explicit play/next/latest action owns the transport change.
  }

  setNotice(notice) {
    if (this.notice === notice) return;
    this.notice = notice;
    this.onNotice(notice);
  }

  cueNotice(paused = this.music.state.pausedByUser) {
    const cue = this.activeCue;
    return `${paused ? 'Guided mode paused' : 'Guided mode'}: ${cue.title} · pages ${cue.startPage}–${cue.endPage}.`;
  }

  gapNotice() {
    if (!this.location) return 'Open a comic page to begin guided listening.';
    if (!this.score.cues.length) return 'No guided songs are assigned yet.';
    if (this.score.editions[this.location.edition] !== this.location.revision) {
      return 'This soundtrack does not match the current comic revision.';
    }
    return 'This page has no guided song.';
  }

  silence() {
    const music = this.music, state = music.state;
    this.activeCue = null;
    this.activeKey = null;
    // Invalidate a load that may still be waiting for the provider. Merely
    // pausing its iframe would let a late READY callback start the old song.
    ++music.generation;
    state.armed = false;
    state.mode = 'manual';
    state.activeZone = null;
    state.pendingZone = null;
    state.current = null;
    state.position = 0;
    state.duration = 0;
    state.status = 'idle';
    state.error = null;
    // Silence between ranges is not a user pause; retain their actual intent.
    this.setNotice(this.gapNotice());
    music.port.pause();
    music.emit();
  }

  apply({ resume = false } = {}) {
    const cue = resolveGuidedCue(this.score, this.location);
    if (!cue) {
      this.silence();
      return;
    }
    const music = this.music, state = music.state, key = cueKey(cue);
    const sameCue = key === this.activeKey && state.current?.url === cue.url;
    this.activeCue = cue;
    this.activeKey = key;
    // Natural FINISH must stop at the cue's end, never fall through to auto DJ.
    state.mode = 'manual';
    state.activeZone = null;
    state.pendingZone = null;
    state.armed = true;
    this.setNotice(this.cueNotice());
    if (!sameCue) {
      // Unlike select(), load() does not erase a pause made on the previous page.
      music.load({ id: cue.id, title: cue.title, url: cue.url, provider: 'soundcloud' });
    } else if (resume) {
      music.resume();
    } else if (state.current.title !== cue.title) {
      // A spelling correction can update the UI without restarting the song.
      state.current = { ...state.current, title: cue.title };
      music.emit();
    }
  }
}
