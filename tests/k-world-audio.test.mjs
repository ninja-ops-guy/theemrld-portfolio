import test from 'node:test';import assert from 'node:assert/strict';
import {Sequencer,SoundCloudPort,canonicalUrl,newestProfileTracks,reactiveEnvelope} from '../public/k-world/audio.js';
const t=n=>({id:n,title:n,url:'https://soundcloud.com/raikouno/'+n,provider:'soundcloud'});
const playlists={gallery:[t('g1'),t('g2')],city:[t('c1'),t('c2')],moon:[t('m1')],same:[t('g1')]};
function setup(){const calls=[],port={load:(t,g)=>calls.push(['load',t.id,g]),play:()=>calls.push(['play']),pause:()=>calls.push(['pause']),seek:n=>calls.push(['seek',n]),rate:()=>false};const s=new Sequencer(port,playlists);s.setZone('gallery');return {s,calls,port};}
function playing(s){s.ready(s.generation,180000);s.playing(s.generation);s.progress(s.generation,50000,180000);}
const loads=c=>c.filter(x=>x[0]==='load');
test('Initial world is silent until armed by a gesture',()=>{const {s,calls}=setup();assert.equal(loads(calls).length,0);s.arm();assert.equal(loads(calls).length,1);});
test('A room change cannot interrupt a playing song',()=>{const {s,calls}=setup();s.arm();playing(s);s.setZone('moon');assert.equal(loads(calls).length,1);assert.equal(s.state.current.id,'g1');assert.equal(s.state.pendingZone,'moon');});
test('Even 99.99 percent progress is not FINISH',()=>{const {s,calls}=setup();s.arm();playing(s);s.progress(s.generation,179999,180000);s.setZone('moon');assert.equal(loads(calls).length,1);});
test('Natural FINISH alone advances to queued room',()=>{const {s,calls}=setup();s.arm();playing(s);s.setZone('moon');assert.equal(s.finish(s.generation),true);assert.equal(loads(calls).length,2);assert.equal(s.state.current.id,'m1');});
test('Rapid crossings collapse to latest destination',()=>{const {s,calls}=setup();s.arm();playing(s);s.setZone('moon');s.setZone('city');assert.equal(s.state.pendingZone,'city');s.finish(s.generation);assert.equal(s.state.current.id,'c1');assert.equal(loads(calls).length,2);});
test('Returning to active room cancels obsolete queued destination',()=>{const {s}=setup();s.arm();playing(s);s.setZone('moon');s.setZone('gallery');assert.equal(s.state.pendingZone,null);s.finish(s.generation);assert.equal(s.state.current.id,'g2');});
test('Repeated zone notifications do not reload',()=>{const {s,calls}=setup();s.arm();playing(s);for(let i=0;i<500;i++)s.setZone('gallery');assert.equal(loads(calls).length,1);});
test('A paused song survives every room change',()=>{const {s,calls}=setup();s.arm();playing(s);s.pause();s.setZone('moon');s.setZone('city');assert.equal(s.state.status,'paused');assert.equal(loads(calls).length,1);assert.equal(s.state.position,50000);});
test('Pause while loading survives a late ready callback',()=>{const {s,calls}=setup();s.arm();s.pause();s.ready(s.generation,180000);assert.equal(s.state.status,'paused');assert.equal(calls.filter(x=>x[0]==='play').length,0);});
test('Late provider PLAY cannot override user pause',()=>{const {s,calls}=setup();s.arm();playing(s);s.pause();const n=calls.length;s.playing(s.generation);assert.equal(calls[n][0],'pause');assert.equal(s.state.status,'paused');});
test('Paused FINISH never auto-resumes',()=>{const {s,calls}=setup();s.arm();playing(s);s.pause();s.setZone('moon');s.finish(s.generation);assert.equal(loads(calls).length,1);assert.equal(s.state.pausedByUser,true);});
test('Manual selection is not replaced by scene routing',()=>{const {s,calls}=setup();s.select(t('manual'));playing(s);s.setZone('moon');s.finish(s.generation);assert.equal(s.state.current.id,'manual');assert.equal(loads(calls).length,1);});
test('Auto on preserves current manual track and queues location',()=>{const {s,calls}=setup();s.select(t('manual'));playing(s);s.setZone('moon');s.auto(true);assert.equal(loads(calls).length,1);assert.equal(s.state.pendingZone,'moon');});
test('Auto on does not erase pause intent',()=>{const {s,calls}=setup();s.select(t('manual'));playing(s);s.pause();s.setZone('moon');s.auto(true);assert.equal(s.state.pausedByUser,true);assert.equal(loads(calls).length,1);});
test('Duplicate or stale FINISH cannot skip another song',()=>{const {s,calls}=setup();s.arm();playing(s);const old=s.generation;s.setZone('moon');s.finish(old);s.finish(old);s.finish(s.generation);assert.equal(loads(calls).length,2);});
test('Stale ready/progress/error callbacks are ignored',()=>{const {s}=setup();s.arm();const old=s.generation;s.select(t('manual'));s.ready(old,9999);s.progress(old,1000,9999);s.fail(old,'stale');assert.equal(s.state.duration,0);assert.equal(s.state.error,null);assert.equal(s.state.status,'loading');});
test('Loading song remains protected when scene changes',()=>{const {s,calls}=setup();s.arm();s.setZone('city');assert.equal(loads(calls).length,1);assert.equal(s.state.pendingZone,'city');});
test('Single-song playlist can replay after completion',()=>{const {s,calls}=setup();s.setZone('moon');s.arm();playing(s);s.finish(s.generation);assert.equal(loads(calls).length,2);assert.equal(s.state.current.id,'m1');});
test('Provider errors do not silently skip or retry-loop',()=>{const {s,calls}=setup();s.arm();s.fail(s.generation,'offline');for(let i=0;i<50;i++)s.setZone('moon');assert.equal(loads(calls).length,1);assert.equal(s.state.status,'error');});
test('Explicit skip is a deliberate exception',()=>{const {s,calls}=setup();s.arm();playing(s);s.setZone('moon');s.skip();assert.equal(loads(calls).length,2);assert.equal(s.state.current.id,'m1');});
test('Volume does not reload current song',()=>{const {s,calls}=setup();s.arm();playing(s);s.volume(20);assert.equal(loads(calls).length,1);assert.equal(s.state.volume,20);});
test('Unsupported provider speed does not claim success',()=>{const {s}=setup();s.arm();assert.equal(s.rate(1.5),false);assert.equal(s.state.rate,1);});
test('Reject malformed and non-SoundCloud URLs',()=>{for(const url of ['javascript:alert(1)','https://soundcloud.com.evil.test/a/b','http://soundcloud.com/a/b','https://soundcloud.com/a','https://soundcloud.com/a/sets/foo'])assert.equal(canonicalUrl(url),null);assert.equal(canonicalUrl('https://soundcloud.com/raikouno/hot-sauce-mp3?in=a/b'),'https://soundcloud.com/raikouno/hot-sauce-mp3');});
test('Paused reactive envelope is zero and never fake FFT',()=>{assert.deepEqual(reactiveEnvelope({status:'paused',position:3000}),{bass:0,mid:0,high:0,energy:0,source:'clock'});assert.equal(reactiveEnvelope({status:'playing',position:3000}).source,'clock');assert.equal(reactiveEnvelope({status:'playing',position:3000},{bass:.1,mid:.2,high:.3,source:'pcm'}).source,'pcm');});

test('Changing from local audio to SoundCloud resets actual rate display to 1x',()=>{const {s,port}=setup();port.rate=()=>true;s.select({...t('local'),provider:'local'});s.rate(1.25);assert.equal(s.state.rate,1.25);s.select(t('remote'));assert.equal(s.state.rate,1);});
test('Local-to-local playback preserves a valid speed preference',()=>{const {s,port}=setup();port.rate=()=>true;s.select({...t('local-one'),provider:'local'});s.rate(.8);s.select({...t('local-two'),provider:'local'});assert.equal(s.state.rate,.8);});

test('SoundCloud profile releases sort newest first and exclude foreign or duplicate URLs',()=>{
 const sounds=[
  {id:1,permalink_url:'https://soundcloud.com/raikouno/older',title:'Older',created_at:'2026-06-01T00:00:00Z'},
  {id:2,permalink_url:'https://soundcloud.com/raikouno/newest',title:'Newest',created_at:'2026-05-01T00:00:00Z',display_date:'2026-11-05T00:00:00Z'},
  {id:3,permalink_url:'https://soundcloud.com/other-artist/not-mine',title:'Foreign',created_at:'2026-12-01T00:00:00Z'},
  {id:4,permalink_url:'https://soundcloud.com/raikouno/newest',title:'Duplicate',created_at:'2026-11-05T00:00:00Z'}
 ];
 const tracks=newestProfileTracks(sounds);
 assert.deepEqual(tracks.map(t=>t.title),['Newest','Older']);
 assert.equal(tracks[0].createdAt,'2026-11-05T00:00:00Z');
});
test('Latest-first default progresses through uploads then queues the next room',()=>{
 const calls=[],port={load:t=>calls.push(t.id),pause:()=>{},play:()=>{},volume:()=>{}};
 const s=new Sequencer(port,{...playlists,latest:[t('new'),t('recent')]});
 assert.equal(s.startZone('latest'),true);assert.equal(s.state.current.id,'new');
 playing(s);s.finish(s.generation);assert.equal(s.state.current.id,'recent');
 playing(s);s.setZone('city');assert.equal(s.state.current.id,'recent');
 s.finish(s.generation);assert.equal(s.state.current.id,'c1');
 assert.deepEqual(calls,['new','recent','c1']);
});
test('Empty latest playlist cannot displace the existing room soundtrack',()=>{
 const calls=[],s=new Sequencer({load:t=>calls.push(t.id)}, {...playlists,latest:[]});
 assert.equal(s.startZone('latest'),false);assert.deepEqual(calls,[]);
});

test('Transport samples keep their original clock time and discard older samples',()=>{
 const {s}=setup();
 s.arm();
 const token=s.generation;
 s.ready(token,180000);
 const start=performance.timeOrigin+performance.now();
 s.playing(token,0,start);
 s.progress(token,1200,180000,start+1200);
 s.progress(token,1100,180000,start+1100);
 s.volume(20);
 assert.equal(s.state.position,1200);
 assert.equal(s.state.positionSampledAt,start+1200);
 s.select(t('next'));
 assert.equal(s.state.position,0);
 assert.equal(s.state.positionSampledAt,null);
 s.progress(token,1400,180000,start+1400);
 assert.equal(s.state.positionSampledAt,null);
});

test('A paused seek publishes its new position immediately and keeps the pause',()=>{
 const {s,calls}=setup();
 s.arm();
 playing(s);
 s.pause();
 let change;
 s.addEventListener('change',event=>{change=event.detail;});
 s.seek(4000);
 assert.deepEqual(calls.at(-1),['seek',4000]);
 assert.equal(change.status,'paused');
 assert.equal(change.position,4000);
 assert.equal(change.positionDiscontinuity,true);
 assert.ok(change.positionSampledAt>=performance.timeOrigin);
});

async function setupWidget(context){
 const listeners=new Map(),soundRequests=[],positionRequests=[],loads=[];
 const widget={
  bind(name,callback){listeners.set(name,callback);if(name==='READY')queueMicrotask(callback);},
  unbind(name){listeners.delete(name);},
  getSounds(callback){callback([]);},
  getDuration(callback){callback(180000);},
  getCurrentSound(callback){soundRequests.push(callback);},
  getPosition(callback){positionRequests.push(callback);},
  isPaused(callback){callback(widget.paused);},
  load(url,options){loads.push({url,...options});},
  play(){widget.paused=false;},
  pause(){widget.paused=true;},
  seekTo(position){widget.seekTarget=position;},
  setVolume(){},
 };
 const Widget=()=>widget;
 Widget.Events=Object.fromEntries(['READY','PLAY','PAUSE','PLAY_PROGRESS','SEEK','FINISH','ERROR'].map(name=>[name,name]));
 const previousWindow=globalThis.window,previousDocument=globalThis.document;
 globalThis.window={SC:{Widget}};
 globalThis.document={createElement:()=>({style:{},remove(){}})};
 const port=new SoundCloudPort({replaceChildren(){}});
 const music=new Sequencer(port);
 context.after(()=>{
  port.destroy();
  if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;
  if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
 });
 await port.init();
 const select=async track=>{
  music.select(track);
  await Promise.resolve();
  assert.equal(loads.at(-1).url,track.url);
  loads.at(-1).callback();
  soundRequests.shift()({permalink_url:track.url,duration:180000});
 };
 const emit=(event,detail)=>listeners.get(event)(detail);
 return {music,widget,select,emit,soundRequests,positionRequests};
}

test('SoundCloud emits a paused seek at the event time for the current track',async context=>{
 const {music,select,emit,soundRequests}=await setupWidget(context);
 const first=t('first'),second=t('second');
 await select(first);
 music.pause();
 emit('SEEK',{currentPosition:9200});
 soundRequests.shift()({permalink_url:second.url});
 assert.equal(music.state.position,0);

 let change;
 music.addEventListener('change',event=>{change=event.detail;});
 emit('SEEK',{currentPosition:8400});
 const afterEvent=performance.timeOrigin+performance.now();
 soundRequests.shift()({permalink_url:first.url});
 assert.equal(change.position,8400);
 assert.equal(change.status,'paused');
 assert.equal(change.positionDiscontinuity,true);
 assert.ok(change.positionSampledAt<=afterEvent);

 emit('SEEK',{currentPosition:38000});
 const oldSeek=soundRequests.shift();
 await select(second);
 oldSeek({permalink_url:first.url});
 assert.equal(music.state.position,0);
});

test('SoundCloud ignores delayed pause samples after resuming or seeking',async context=>{
 const {music,widget,select,emit,soundRequests,positionRequests}=await setupWidget(context);
 const track=t('first');
 await select(track);
 const sound={permalink_url:track.url};
 const verifySound=()=>soundRequests.shift()(sound);
 widget.paused=false;
 emit('PLAY',{currentPosition:0});
 verifySound();
 positionRequests.shift()(0);
 emit('PLAY_PROGRESS',{currentPosition:0});
 positionRequests.shift()(0);
 assert.equal(music.state.positionSampledAt,null);
 emit('PLAY',{currentPosition:30000});
 verifySound();
 positionRequests.shift()(3000);
 assert.equal(music.state.status,'playing');
 assert.equal(music.state.position,3000);
 music.pause();
 emit('PAUSE');
 verifySound();
 const oldPause=positionRequests.shift();
 music.resume();
 emit('PLAY',{currentPosition:3300});
 verifySound();
 positionRequests.shift()(3300);
 oldPause(3100);
 assert.equal(music.state.status,'playing');
 assert.equal(music.state.position,3300);

 music.seek(12000);
 assert.equal(widget.seekTarget,12000);
 emit('PLAY_PROGRESS',{currentPosition:3500});
 positionRequests.shift()(3500);
 assert.equal(music.state.position,12000);
 emit('SEEK',{currentPosition:12000});
 verifySound();
 emit('PLAY_PROGRESS',{currentPosition:12100});
 positionRequests.shift()(12100);
 assert.equal(music.state.position,12100);
});

test('Local media samples its clock on pause, seek and playback-rate changes',context=>{
 const previousAudio=globalThis.Audio;
 class LocalMedia extends EventTarget {
  duration=90;
  currentTime=0;
  paused=true;
  endPlay;
  load(){this.currentSrc=this.src;this.onloadedmetadata();}
  play(){this.paused=false;this.dispatchEvent(new Event('playing'));return new Promise((_,reject)=>{this.endPlay=reject;});}
  pause(){this.paused=true;}
  removeAttribute(){this.onloadedmetadata=null;}
 }
 globalThis.Audio=LocalMedia;
 context.after(()=>{
  if(previousAudio===undefined)delete globalThis.Audio;else globalThis.Audio=previousAudio;
 });
 const port=new SoundCloudPort(null);
 const music=new Sequencer(port);
 music.select({...t('local'),provider:'local',url:'blob:local'});
 const media=port.native;
 assert.equal(music.state.status,'playing');
 media.currentTime=2.25;
 music.pause();
 assert.equal(music.state.position,2250);
 music.seek(9250);
 assert.equal(media.currentTime,9.25);
 assert.equal(music.state.position,9250);
 assert.equal(music.state.status,'paused');
 const firstPlay=media.endPlay;
 music.resume();
 firstPlay(Error('Previous play request was interrupted'));
 media.currentTime=10;
 music.rate(1.5);
 assert.equal(music.state.position,10000);
 assert.equal(music.state.status,'playing');
 assert.equal(music.state.rate,1.5);
});
