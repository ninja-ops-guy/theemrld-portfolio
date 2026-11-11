import test from 'node:test';
import assert from 'node:assert/strict';
import { Sequencer, SoundCloudPort } from '../public/k-world/audio.js';
import { GuidedPlayback } from '../public/k-world/guided-playback.js';
import { emptyGuidedScore, GUIDED_EDITIONS } from '../public/k-world/guided.js';

const track = id => ({ id, title: id, url: `https://soundcloud.com/raikouno/${id}`, provider: 'soundcloud' });
const position = (page, edition = 'f') => ({ page, edition, revision: GUIDED_EDITIONS[edition].revision });
function score() {
  return {
    ...emptyGuidedScore(),
    cues: [
      { ...track('test-a'), edition: 'f', startPage: 2, endPage: 4 },
      { ...track('test-b'), edition: 'f', startPage: 6, endPage: 8 },
      { ...track('test-c'), edition: 'f', startPage: 10, endPage: 12 },
      { ...track('test-xiii'), edition: 'xiii', startPage: 2, endPage: 3 },
    ],
  };
}
function setup() {
  const calls = [], notices = [];
  const port = {
    load: (selected, token) => calls.push(['load', selected.id, token]),
    play: () => calls.push(['play']),
    pause: () => calls.push(['pause']),
  };
  const music = new Sequencer(port, { gallery: [track('room-music')], city: [track('city-music')] });
  music.setZone('gallery');
  const guided = new GuidedPlayback(music, notice => notices.push(notice));
  return { calls, notices, music, guided };
}
const loads = calls => calls.filter(call => call[0] === 'load');
const plays = calls => calls.filter(call => call[0] === 'play');
function playing(music) {
  music.ready(music.generation, 180000);
  music.playing(music.generation);
  music.progress(music.generation, 35000, 180000);
}
function enable(guided, page = 2) {
  guided.setScore(score());
  guided.setLocation(position(page));
  guided.setEnabled(true);
}

test('score and reading-position updates do not start audio before guided mode is enabled', () => {
  const { guided, music, calls } = setup();
  guided.setScore(score());
  guided.setLocation(position(2));
  assert.equal(guided.enabled, false);
  assert.equal(guided.activeCue, null);
  assert.equal(music.state.current, null);
  assert.deepEqual(calls, []);
});

test('explicit enable starts the visible mapped cue and clears an earlier user pause', () => {
  const { guided, music, calls } = setup();
  music.pause();
  enable(guided);
  assert.equal(music.state.pausedByUser, false);
  assert.equal(music.state.armed, true);
  assert.equal(music.state.mode, 'manual');
  assert.equal(music.state.current.id, 'test-a');
  assert.equal(guided.activeCue.id, 'test-a');
  assert.deepEqual(loads(calls).map(call => call[1]), ['test-a']);
  music.ready(music.generation, 180000);
  assert.equal(plays(calls).length, 1);
});

test('page changes within one cue preserve position and never restart it', () => {
  const { guided, music, calls } = setup();
  enable(guided);
  playing(music);
  for (const page of [3, 4, 2, 4, 4]) guided.setLocation(position(page));
  assert.equal(loads(calls).length, 1);
  assert.equal(music.state.position, 35000);
  assert.equal(music.state.status, 'playing');
});

test('new cue loads once and stale provider callbacks cannot alter it', () => {
  const { guided, music, calls } = setup();
  enable(guided);
  const old = music.generation;
  guided.setLocation(position(6));
  guided.setLocation(position(7));
  assert.deepEqual(loads(calls).map(call => call[1]), ['test-a', 'test-b']);
  music.ready(old, 9999);
  music.playing(old);
  music.progress(old, 9999, 9999);
  music.fail(old, 'stale failure');
  assert.equal(music.finish(old), false);
  assert.equal(music.state.current.id, 'test-b');
  assert.equal(music.state.status, 'loading');
  assert.equal(music.state.error, null);
  assert.equal(music.state.position, 0);
  assert.equal(plays(calls).length, 0);
});

test('a user pause during loading remains sticky across cue changes and gaps', () => {
  const { guided, music, calls } = setup();
  enable(guided);
  guided.pause();
  guided.setLocation(position(6));
  music.ready(music.generation, 180000);
  assert.equal(music.state.pausedByUser, true);
  assert.equal(music.state.status, 'paused');
  assert.equal(plays(calls).length, 0);
  guided.setLocation(position(9));
  assert.equal(music.state.armed, false);
  assert.equal(music.state.pausedByUser, true);
  guided.setLocation(position(10));
  music.ready(music.generation, 180000);
  assert.equal(music.state.pausedByUser, true);
  assert.equal(plays(calls).length, 0);
  guided.resume();
  assert.equal(music.state.pausedByUser, false);
  assert.equal(plays(calls).length, 1);
  assert.equal(music.state.current.id, 'test-c');
});

test('gaps disarm and invalidate loading audio without inventing a user pause', () => {
  const { guided, music, calls } = setup();
  enable(guided);
  const old = music.generation;
  guided.setLocation(position(5));
  assert.equal(guided.activeCue, null);
  assert.equal(music.state.current, null);
  assert.equal(music.state.armed, false);
  assert.equal(music.state.pausedByUser, false);
  assert.equal(music.state.status, 'idle');
  assert.ok(calls.some(call => call[0] === 'pause'));
  music.ready(old, 180000);
  music.playing(old);
  music.progress(old, 1000, 180000);
  music.fail(old, 'obsolete track');
  assert.equal(music.finish(old), false);
  guided.resume();
  music.setZone('city');
  assert.equal(plays(calls).length, 0);
  assert.equal(loads(calls).length, 1);
  assert.equal(music.state.status, 'idle');
  assert.equal(music.state.current, null);
  assert.equal(music.state.error, null);
  guided.setLocation(position(6));
  music.ready(music.generation, 180000);
  assert.equal(music.state.current.id, 'test-b');
  assert.equal(plays(calls).length, 1);
});

test('an empty soundtrack remains silent on enable and resume in every edition', () => {
  const { guided, music, calls } = setup();
  for (const edition of Object.keys(GUIDED_EDITIONS)) {
    guided.setLocation(position(2, edition));
    guided.setEnabled(true);
    guided.resume();
  }
  assert.equal(guided.enabled, true);
  assert.equal(guided.activeCue, null);
  assert.equal(music.state.armed, false);
  assert.equal(music.state.current, null);
  assert.equal(loads(calls).length, 0);
  assert.equal(plays(calls).length, 0);
  assert.match(guided.notice, /No guided songs are assigned/);
});

test('wrong revision, invalid page, and leaving the reader all silence playback', () => {
  for (const invalid of [{ ...position(3), revision: 'different-revision' }, position(0), position(9999), null]) {
    const { guided, music, calls } = setup();
    enable(guided);
    playing(music);
    const played = plays(calls).length;
    guided.setLocation(invalid);
    guided.resume();
    assert.equal(music.state.current, null);
    assert.equal(music.state.armed, false);
    assert.equal(plays(calls).length, played);
    assert.equal(loads(calls).length, 1);
  }
});

test('natural finish stops without auto DJ or a same-range page-turn restart', () => {
  const { guided, music, calls } = setup();
  enable(guided);
  playing(music);
  music.setZone('city');
  assert.equal(music.finish(music.generation), true);
  guided.setLocation(position(4));
  assert.equal(music.state.status, 'finished');
  assert.equal(loads(calls).length, 1);
  guided.resume();
  assert.deepEqual(loads(calls).map(call => call[1]), ['test-a', 'test-a']);
});

test('manual cancellation changes no transport state and later pages leave manual playback alone', () => {
  const { guided, music, calls } = setup();
  enable(guided);
  playing(music);
  const previousCalls = structuredClone(calls);
  const previousState = structuredClone(music.state);
  const generation = music.generation;
  guided.cancelForManual();
  assert.equal(guided.enabled, false);
  assert.equal(guided.activeCue, null);
  assert.deepEqual(calls, previousCalls);
  assert.deepEqual(music.state, previousState);
  assert.equal(music.generation, generation);
  music.select(track('manual-pick'));
  guided.setLocation(position(6));
  assert.equal(music.state.current.id, 'manual-pick');
  assert.equal(loads(calls).length, 2);
});

test('explicit disable pauses pending audio and a later enable selects the visible cue', () => {
  const { guided, music, calls } = setup();
  enable(guided);
  guided.setEnabled(false);
  music.ready(music.generation, 180000);
  assert.equal(music.state.pausedByUser, true);
  assert.equal(music.state.armed, false);
  assert.equal(plays(calls).length, 0);
  guided.setLocation(position(6));
  guided.setEnabled(true);
  assert.equal(music.state.current.id, 'test-b');
  assert.equal(music.state.pausedByUser, false);
  music.ready(music.generation, 180000);
  assert.equal(plays(calls).length, 1);
});

test('invalid score imports leave the previous score, cue, and playback untouched', () => {
  const { guided, music, calls } = setup();
  enable(guided);
  playing(music);
  const previousScore = guided.score, previousCue = guided.activeCue;
  const previousState = structuredClone(music.state), previousCalls = structuredClone(calls);
  const bad = score();
  bad.cues[1].startPage = 3;
  assert.throws(() => guided.setScore(bad), /overlap/);
  assert.equal(guided.score, previousScore);
  assert.equal(guided.activeCue, previousCue);
  assert.deepEqual(music.state, previousState);
  assert.deepEqual(calls, previousCalls);
});

test('applying a title correction preserves position; replacing its song preserves pause intent', () => {
  const { guided, music, calls } = setup();
  enable(guided);
  playing(music);
  const revised = score();
  revised.cues[0].title = 'Corrected song title';
  guided.setScore(revised);
  assert.equal(loads(calls).length, 1);
  assert.equal(music.state.position, 35000);
  assert.equal(music.state.current.title, 'Corrected song title');
  guided.pause();
  revised.cues[0].url = 'https://soundcloud.com/raikouno/replacement';
  guided.setScore(revised);
  assert.equal(loads(calls).length, 2);
  assert.equal(music.state.current.url, revised.cues[0].url);
  music.ready(music.generation, 180000);
  assert.equal(music.state.pausedByUser, true);
  assert.equal(music.state.status, 'paused');
});

test('forward jumps, backwards turns, and edition changes resolve only the visible cue', () => {
  const { guided, music, calls } = setup();
  enable(guided);
  guided.setLocation(position(11));
  guided.setLocation(position(3));
  guided.setLocation(position(2, 'xiii'));
  assert.deepEqual(loads(calls).map(call => call[1]), ['test-a', 'test-c', 'test-a', 'test-xiii']);
  assert.equal(music.state.current.id, 'test-xiii');
});

test('SoundCloud requests autoplay for each armed guided cue and respects pause during a load', async () => {
  const loads = [];
  const transport = [];
  const timers = [];
  let widgetPaused = false;
  const widget = {
    load(url, options) { loads.push({ url, ...options }); },
    getDuration(callback) { callback(120000); },
    isPaused(callback) { callback(widgetPaused); },
    setVolume() {},
    play() { transport.push('play'); },
    pause() { transport.push('pause'); },
  };
  const port = new SoundCloudPort(null);
  port.widget = widget;
  port.later = (callback, delay) => { if (delay === 350) timers.push(callback); };
  const music = new Sequencer(port);
  music.select(track('first-cue'));
  await Promise.resolve();
  assert.equal(loads[0].auto_play, true);
  loads[0].callback();
  timers.shift()();
  assert.equal(music.state.status, 'playing');
  assert.equal(transport.includes('play'), false);

  music.load(track('second-cue'));
  await Promise.resolve();
  assert.equal(loads[1].auto_play, true);
  widgetPaused = true;
  loads[1].callback();
  timers.shift()();
  assert.equal(transport.at(-1), 'play');
  music.pause();
  assert.equal(music.state.status, 'paused');
  assert.equal(music.state.pausedByUser, true);

  music.load(track('third-cue'));
  await Promise.resolve();
  assert.equal(loads[2].auto_play, false);
  loads[2].callback();
  assert.equal(music.state.status, 'paused');
});
