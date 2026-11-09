import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { Sequencer } from '../public/k-world/audio.js';
import { GuidedPlayback } from '../public/k-world/guided-playback.js';

// Exercise the production handlers without constructing the renderer or a DOM.
// The source is executed unchanged; the feed request is the only deferred input.
const appSource = readFileSync(new URL('../public/k-world/app.js', import.meta.url), 'utf8');
function handler(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} handler must exist`);
  const end = appSource.indexOf('\nfunction ', start + 1);
  return appSource.slice(start, end === -1 ? appSource.length : end);
}
const track = id => ({ id, title: id, url: `https://soundcloud.com/raikouno/${id}`, provider: 'soundcloud' });
function setup({ playing = true } = {}) {
  let resolveFeed;
  const pendingFeed = new Promise(resolve => { resolveFeed = resolve; });
  const loads = [];
  const music = new Sequencer({ load: selected => loads.push(selected.id), play() {}, pause() {} }, {
    gallery: [track('old-one'), track('old-two')], latest: [track('newest')],
  });
  if (playing) {
    music.startZone('gallery');
    music.ready(music.generation, 180000);
    music.playing(music.generation);
  }
  const context = vm.createContext({
    music, guided: new GuidedPlayback(music), transportIntent: 0,
    loadPublishedReleases: () => pendingFeed,
    remember() {}, publishState() {}, log() {}, toast() {},
    $: () => ({ textContent: '' }),
  });
  vm.runInContext(['startLatestMusic', 'pauseMusic', 'selectTrack'].map(handler).join('\n'), context);
  return { context, music, loads, resolveFeed };
}

test('explicit latest survives a natural FINISH while its catalogue request is pending', async () => {
  const { context, music, loads, resolveFeed } = setup();
  const requested = context.startLatestMusic(true);
  music.finish(music.generation);
  assert.equal(music.state.current.id, 'old-two');
  resolveFeed(true);
  await requested;
  assert.equal(music.state.current.id, 'newest');
  assert.deepEqual(loads, ['old-one', 'old-two', 'newest']);
});

test('pause during a pending latest request remains the final user intent', async () => {
  const { context, music, loads, resolveFeed } = setup();
  const requested = context.startLatestMusic(true);
  context.pauseMusic();
  resolveFeed(true);
  await requested;
  assert.equal(music.state.current.id, 'old-one');
  assert.equal(music.state.status, 'paused');
  assert.equal(music.state.pausedByUser, true);
  assert.deepEqual(loads, ['old-one']);
});

test('manual selection during a pending latest request is never replaced', async () => {
  const { context, music, loads, resolveFeed } = setup();
  const requested = context.startLatestMusic(true);
  context.selectTrack(track('manual-pick'));
  resolveFeed(true);
  await requested;
  assert.equal(music.state.current.id, 'manual-pick');
  assert.equal(music.state.mode, 'manual');
  assert.deepEqual(loads, ['old-one', 'manual-pick']);
});

test('repeated latest requests sharing one refresh start only the final request', async () => {
  const { context, music, loads, resolveFeed } = setup();
  const first = context.startLatestMusic(true);
  const second = context.startLatestMusic(true);
  resolveFeed(true);
  await Promise.all([first, second]);
  assert.equal(music.state.current.id, 'newest');
  assert.deepEqual(loads, ['old-one', 'newest']);
});

test('quiet startup does not replace audio started while the catalogue was loading', async () => {
  const { context, music, loads, resolveFeed } = setup({ playing: false });
  const requested = context.startLatestMusic();
  music.startZone('gallery');
  resolveFeed(true);
  await requested;
  assert.equal(music.state.current.id, 'old-one');
  assert.deepEqual(loads, ['old-one']);
});
