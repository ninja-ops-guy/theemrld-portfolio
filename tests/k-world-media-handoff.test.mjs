import test from 'node:test';
import assert from 'node:assert/strict';
import { createMediaHandoff } from '../public/k-world/media-handoff.js';
function fixture() {
  let pauses = 0;
  const clips = [0, 1].map(() => ({ paused: true, position: 12, pause() { this.paused = true; } }));
  const handoff = createMediaHandoff({ pauseMusic: () => pauses++, media: () => clips });
  return { handoff, clips, pauses: () => pauses };
}
test('a newly played clip pauses music and another clip without seeking either', () => {
  const f = fixture(); f.clips.forEach(c => c.paused = false);
  f.handoff.playClip(f.clips[1]);
  assert.equal(f.pauses(), 1); assert.equal(f.clips[0].paused, true);
  assert.equal(f.clips[1].paused, false); assert.equal(f.clips[0].position, 12);
});
test('music selected or resumed pauses clips even before provider status catches up', () => {
  const f = fixture(); f.clips[0].paused = false;
  f.handoff.playMusic(); assert.equal(f.clips[0].paused, true); assert.equal(f.pauses(), 0);
});
test('repeated old playing telemetry cannot reclaim priority during a clip handoff', () => {
  const f = fixture(); f.handoff.observeMusic('playing'); f.clips[0].paused = false;
  f.handoff.playClip(f.clips[0]); f.handoff.observeMusic('playing');
  assert.equal(f.clips[0].paused, false);
  f.handoff.observeMusic('paused'); assert.equal(f.clips[0].paused, false);
  f.handoff.observeMusic('playing'); assert.equal(f.clips[0].paused, true);
});
test('pause, seek/stall status and completion never resume displaced media', () => {
  const f = fixture(); f.clips[0].paused = false; f.handoff.playMusic();
  for (const status of ['paused', 'loading', 'paused', 'idle']) f.handoff.observeMusic(status);
  assert.equal(f.clips[0].paused, true); assert.equal(f.clips[0].position, 12);
  assert.equal(f.pauses(), 0);
});
