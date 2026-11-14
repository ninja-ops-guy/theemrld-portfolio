import {PLAYLISTS} from './data.js';
import {clamp} from './renderer.js';
// A monotonic timestamp with the same epoch in the world and terminal frames.
const sampleTime=()=>performance.timeOrigin+performance.now();
/** Pure queue policy. Only natural FINISH or an explicit transport action advances. */
export class Sequencer extends EventTarget {
 constructor(port,playlists=PLAYLISTS){super();this.port=port;this.playlists=playlists;this.generation=0;this.finishedGeneration=-1;this.state={mode:'auto',zone:'gallery-deep',activeZone:null,pendingZone:null,current:null,index:0,status:'idle',position:0,positionSampledAt:null,duration:0,pausedByUser:false,armed:false,error:null,volume:55,rate:1};port.connect?.(this);}
 emit(positionDiscontinuity=false){
  if(!this.state.current)this.state.positionSampledAt=null;
  this.dispatchEvent(new CustomEvent('change',{detail:{...this.state,positionDiscontinuity}}));
 }
 setPosition(position,duration,sampledAt){
  if(!Number.isFinite(position)||!Number.isFinite(sampledAt)||sampledAt<(this.state.positionSampledAt??-Infinity))return false;
  if(Number.isFinite(duration)&&duration>0)this.state.duration=duration;
  this.state.position=Math.max(0,position);
  this.state.positionSampledAt=sampledAt;
  return true;
 }
 arm(){this.state.armed=true;if(!this.state.current&&!this.state.pausedByUser)this.loadZone(this.state.zone,0);else this.resume();}
 /** Start a playlist in response to a visitor gesture; no second player. */
 startZone(zone){if(!this.playlists[zone]?.length)return false;this.state.mode='auto';this.state.zone=zone;this.state.armed=true;this.state.pausedByUser=false;this.loadZone(zone,0);return true;}
 setZone(zone){if(!this.playlists[zone])return;const s=this.state;s.zone=zone;if(s.mode==='auto'){if(s.current&&s.status!=='finished'&&s.status!=='idle'){s.pendingZone=zone===s.activeZone?null:zone;}else if(s.armed&&!s.pausedByUser)this.loadZone(zone,0);else s.pendingZone=zone;}this.emit();}
 loadZone(zone,index=0){const list=this.playlists[zone]||[];if(!list.length)return;const i=((index%list.length)+list.length)%list.length;this.state.activeZone=zone;this.state.index=i;this.state.pendingZone=null;this.load(list[i]);}
 load(track){const token=++this.generation;if(track.provider!=='local')this.state.rate=1;this.state.current=track;this.state.position=0;this.state.positionSampledAt=null;this.state.duration=0;this.state.status='loading';this.state.error=null;this.emit();try{Promise.resolve(this.port.load(track,token)).catch(e=>this.fail(token,e.message));}catch(e){this.fail(token,e.message);}return token;}
 ready(token,duration,{autoplayRequested=false}={}){if(token!==this.generation)return;this.state.duration=Math.max(0,duration||0);if(this.state.pausedByUser||!this.state.armed){this.state.status='paused';this.port.pause();}else {this.state.status='ready';if(!autoplayRequested)this.port.play();}this.emit();}
 playing(token,position,sampledAt=sampleTime()){
  if(token!==this.generation)return;
  if(this.state.pausedByUser||!this.state.armed){this.port.pause();return;}
  if(Number.isFinite(position)&&(position>0||this.state.positionSampledAt!==null||this.state.current?.provider==='local'))this.setPosition(position,0,sampledAt);
  this.state.status='playing';this.state.error=null;this.emit();
 }
 progress(token,position,duration,sampledAt=sampleTime(),positionDiscontinuity=false){
  if(token===this.generation&&this.setPosition(position,duration,sampledAt))this.emit(positionDiscontinuity);
 }
 providerPaused(token,position,sampledAt=sampleTime()){
  if(token!==this.generation||['loading','finished','error'].includes(this.state.status))return;
  const corrected=this.setPosition(position,0,sampledAt);
  this.state.status='paused';this.emit(corrected);
 }
 finish(token){if(token!==this.generation||this.finishedGeneration===token||this.state.status==='loading')return false;this.finishedGeneration=token;this.state.status='finished';this.setPosition(this.state.duration,0,sampleTime());this.emit();if(this.state.mode==='auto'&&this.state.armed&&!this.state.pausedByUser){const next=this.state.pendingZone||this.state.zone||this.state.activeZone;this.loadZone(next,next===this.state.activeZone?this.state.index+1:0);}return true;}
 pause(){
  this.state.pausedByUser=true;
  const sample=this.port.pause();
  if(this.state.current)this.setPosition(sample?.position,0,sample?.sampledAt);
  this.state.status=this.state.current?'paused':'idle';this.emit();
 }
 resume(){this.state.pausedByUser=false;this.state.armed=true;if(!this.state.current){this.loadZone(this.state.zone,0);return;}if(this.state.status==='finished'){if(this.state.mode==='auto')this.loadZone(this.state.pendingZone||this.state.zone,0);else this.load(this.state.current);}else if(this.state.status==='error')this.load(this.state.current);else this.port.play();this.emit();}
 stop(){this.state.pausedByUser=true;this.port.pause();this.port.seek?.(0);this.setPosition(0,0,sampleTime());this.state.status=this.state.current?'paused':'idle';this.emit(true);}
 select(track){this.state.mode='manual';this.state.activeZone=null;this.state.pendingZone=null;this.state.pausedByUser=false;this.state.armed=true;this.load(track);}
 auto(enabled){this.state.mode=enabled?'auto':'manual';this.state.pendingZone=null;if(enabled){this.setZone(this.state.zone);}this.emit();}
 skip(){if(this.state.mode==='auto'){this.state.pausedByUser=false;this.state.armed=true;const zone=this.state.pendingZone||this.state.zone;this.loadZone(zone,zone===this.state.activeZone?this.state.index+1:0);}}
 volume(value){this.state.volume=clamp(value,0,100);this.port.volume?.(this.state.volume);this.emit();}
 seek(ms){
  if(!Number.isFinite(ms)||this.state.duration<=0||!this.port.seek)return;
  const target=clamp(ms,0,this.state.duration);
  const sample=this.port.seek(target);
  if(sample===false)return;
  this.progress(this.generation,sample?.position??target,0,sample?.sampledAt??sampleTime(),true);
 }
 rate(value){
  if(!Number.isFinite(value)||value<.5||value>2)throw Error('Speed must be 0.5–2.0.');
  if(!this.port.rate?.(value))return false;
  const sample=this.port.position?.();
  this.setPosition(sample?.position,0,sample?.sampledAt);this.state.rate=value;this.emit();return true;
 }
 fail(token,message){if(token!==this.generation)return;this.state.status='error';this.state.error=message||'Audio could not load. Use Resume to retry.';this.emit();}
 destroy(){++this.generation;this.port.destroy?.();}
}
export function canonicalUrl(value){try{const u=new URL(value);if(u.protocol!=='https:'||!['soundcloud.com','www.soundcloud.com'].includes(u.hostname))return null;const parts=u.pathname.split('/').filter(Boolean);if(parts.length!==2||['sets','likes','tracks','reposts','popular-tracks'].includes(parts[1]))return null;return 'https://soundcloud.com/'+parts.join('/');}catch{return null;}}
/** Freshest public uploads first; date ties retain SoundCloud's order. */
export function newestProfileTracks(sounds){
 if(!Array.isArray(sounds))return [];
 const seen=new Set();
 return sounds.map((s,order)=>({
  id:String(s?.id||s?.permalink_url),url:canonicalUrl(s?.permalink_url),
  title:s?.title||'Untitled',provider:'soundcloud',
  createdAt:s?.display_date||s?.published_at||s?.created_at||null,order
 })).filter(t=>{if(!t.url?.startsWith('https://soundcloud.com/raikouno/')||seen.has(t.url))return false;seen.add(t.url);return true;})
 .sort((x,y)=>(Date.parse(y.createdAt)||0)-(Date.parse(x.createdAt)||0)||x.order-y.order)
 .map(({order,...track})=>track);
}
let apiPromise;
function api(){if(window.SC?.Widget)return Promise.resolve(window.SC);if(apiPromise)return apiPromise;apiPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://w.soundcloud.com/player/api.js';script.async=true;const timeout=setTimeout(()=>{apiPromise=null;reject(Error('SoundCloud did not respond. Check your connection and press Resume.'));},15000);script.onload=()=>{clearTimeout(timeout);if(window.SC?.Widget)resolve(window.SC);else{apiPromise=null;reject(Error('SoundCloud Widget API unavailable.'));}};script.onerror=()=>{clearTimeout(timeout);apiPromise=null;script.remove();reject(Error('SoundCloud is blocked or offline. Your world remains usable.'));};document.head.append(script);});return apiPromise;}
/** Sole transport. One SC iframe; local audio explicitly pauses it before starting. */
export class SoundCloudPort {
 constructor(slot,onCatalogue=()=>{}){this.slot=slot;this.onCatalogue=onCatalogue;this.widget=null;this.native=null;this.controller=null;this.token=0;this.transportRevision=0;this.pendingSeek=null;this.loading=false;this.expected=null;this.disposed=false;this.duration=0;this.timers=new Set();this.bound=[];this.profilePromise=null;}
 connect(controller){this.controller=controller;}
 later(fn,ms){const id=setTimeout(()=>{this.timers.delete(id);if(!this.disposed)fn();},ms);this.timers.add(id);return id;}
 isCurrent(token){return !this.disposed&&token===this.token&&token===this.controller.generation;}
 readPosition(widget,event,sampledAt,valid,apply){
  if(Number.isFinite(event?.currentPosition)){apply(event.currentPosition,sampledAt);return;}
  if(!widget.getPosition){apply(undefined,sampledAt);return;}
  widget.getPosition(position=>{if(valid())apply(position,sampleTime());});
 }
 acceptsSeekSample(position,sampledAt){
  if(!this.pendingSeek)return true;
  const {target,at}=this.pendingSeek;
  const elapsed=sampledAt-at;
  if(elapsed<1000&&Math.abs(position-target)>Math.max(250,elapsed+50))return false;
  this.pendingSeek=null;
  return true;
 }
 async init(){if(this.initializing)return this.initializing;if(this.widget)return this.widget;this.initializing=(async()=>{
  const SC=await api();if(this.disposed)throw Error('Player disposed');
  const iframe=document.createElement('iframe');iframe.title='SoundCloud player — K Terminal audio authority';iframe.allow='autoplay';iframe.src='https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fraikouno&auto_play=false&single_active=true&show_artwork=true';iframe.style.cssText='width:100%;height:130px;border:0;';this.iframe=iframe;this.slot.replaceChildren(iframe);const widget=SC.Widget(iframe);this.widget=widget;
  const bind=(name,fn)=>{widget.bind(SC.Widget.Events[name],fn);this.bound.push(name);};
  const current=(apply)=>{
   const token=this.token, revision=this.transportRevision;
   const expected=canonicalUrl(this.expected?.url);
   const valid=()=>this.isCurrent(token)&&revision===this.transportRevision&&!this.loading&&expected&&this.expected?.provider!=='local'&&this.widget===widget;
   if(!valid())return;
   widget.getCurrentSound(sound=>{
    if(valid()&&canonicalUrl(sound?.permalink_url)===expected)apply(token,sound,valid);
   });
  };
  let playbackEventVersion=0;
  const playbackEvent=paused=>{
   const version=++playbackEventVersion;
   current((token,sound,valid)=>{
    const latest=()=>valid()&&version===playbackEventVersion;
    if(!latest())return;
    const apply=()=>this.readPosition(widget,null,sampleTime(),latest,(position,at)=>{
     const usable=Number.isFinite(position)&&this.acceptsSeekSample(position,at);
     if(paused){this.controller.providerPaused(token,usable?position:undefined,at);return;}
     this.duration=sound.duration||this.duration;
     widget.setVolume(this.controller.state.volume);
     this.controller.playing(token,usable?position:undefined,at);
    });
    if(widget.isPaused)widget.isPaused(actual=>{if(latest()&&actual===paused)apply();});
    else apply();
   });
  };
  bind('PLAY',()=>playbackEvent(false));
  bind('PAUSE',()=>playbackEvent(true));
  bind('PLAY_PROGRESS',()=>{
   const token=this.token, revision=this.transportRevision;
   const valid=()=>this.isCurrent(token)&&revision===this.transportRevision&&this.widget===widget&&!this.loading
    &&this.expected?.provider==='soundcloud'&&['ready','playing'].includes(this.controller.state.status);
   if(!valid()||(this.progressProbe?.token===token&&this.progressProbe.revision===revision))return;
   // A progress event can outlive its track. Sample the current widget instead.
   const probe={token,revision};
   this.progressProbe=probe;
   const timeout=this.later(()=>{if(this.progressProbe===probe)this.progressProbe=null;},1000);
   widget.getPosition(position=>{
    clearTimeout(timeout);
    this.timers.delete(timeout);
    if(this.progressProbe!==probe)return;
    this.progressProbe=null;
    if(!valid()||!Number.isFinite(position)||(position===0&&this.controller.state.positionSampledAt===null))return;
    const sampledAt=sampleTime();
    if(!this.acceptsSeekSample(position,sampledAt))return;
    if(position>0)this.lastProgress=position;
    this.controller.progress(token,position,this.duration,sampledAt);
   });
  });
  bind('SEEK',event=>{
   const sampledAt=sampleTime();
   current((token,sound,valid)=>this.readPosition(widget,event,sampledAt,valid,(position,at)=>{
    if(Number.isFinite(position)&&this.acceptsSeekSample(position,at))this.controller.progress(token,position,sound.duration||this.duration,at,true);
   }));
  });
  bind('FINISH',()=>current((token,sound,valid)=>{
   widget.getPosition(position=>{
    if(!valid())return;
    const duration=sound.duration||this.duration;
    // SoundCloud can reset its playhead before reporting the end of the track.
    if(duration>0&&Math.max(position||0,this.lastProgress||0)>=duration-600)this.controller.finish(token);
   });
  }));
  bind('ERROR',()=>{if(!this.loading&&this.expected?.provider!=='local')this.controller.fail(this.token,'SoundCloud could not play this track. Resume retries; choose another song to replace it.');});
  await new Promise((resolve,reject)=>{const timer=this.later(()=>reject(Error('SoundCloud player readiness timed out.')),15000);bind('READY',()=>{clearTimeout(timer);this.timers.delete(timer);resolve();});});
  // Read the profile while the widget still points at @raikouno, before loading an individual track.
  this.profilePromise=new Promise(resolve=>{
   let settled=false;const finish=x=>{if(!settled){settled=true;resolve(x);}};
   const timeout=this.later(()=>finish([]),4500);
   try{widget.getSounds(sounds=>{clearTimeout(timeout);this.timers.delete(timeout);
    const tracks=newestProfileTracks(sounds);if(tracks.length)this.onCatalogue(tracks);finish(tracks);
   });}catch{clearTimeout(timeout);this.timers.delete(timeout);finish([]);}
  });
  return widget;
 })();try{return await this.initializing;}catch(e){if(this.widget&&!this.disposed){for(const n of this.bound)this.widget.unbind(window.SC.Widget.Events[n]);this.bound=[];this.widget=null;this.iframe?.remove();}throw e;}finally{this.initializing=null;}}
 async discoverTracks(){await this.init();return this.profilePromise?await this.profilePromise:[];}
 async load(track,token){
  this.token=token;this.expected=track;this.loading=true;this.pendingSeek=null;this.lastProgress=0;
  this.native?.pause();this.widget?.pause();
  if(track.provider==='local'){this.loadNative(track,token);return;}
  const widget=await this.init();if(!this.isCurrent(token))return;
  const {armed,pausedByUser}=this.controller.state;
  const autoplayRequested=armed&&!pausedByUser;
  const expectedUrl=canonicalUrl(track.url);
  const ready=()=>{
   if(!this.loading||token!==this.token)return;
   if(!this.isCurrent(token)){if(token===this.token&&!this.disposed)widget.pause();return;}
   widget.getCurrentSound(sound=>{
    if(!this.isCurrent(token)){if(token===this.token&&!this.disposed)widget.pause();return;}
    if(!this.loading)return;
    if(!expectedUrl||canonicalUrl(sound?.permalink_url)!==expectedUrl){this.later(ready,250);return;}
    this.duration=sound.duration||0;this.loading=false;
    widget.setVolume(this.controller.state.volume);
    this.controller.ready(token,this.duration,{autoplayRequested});
    const revision=this.transportRevision;
    const stillReady=()=>this.isCurrent(token)&&revision===this.transportRevision&&this.controller.state.status==='ready';
    if(autoplayRequested)this.later(()=>{
     if(!stillReady())return;
     widget.isPaused(paused=>{
      if(!stillReady())return;
      if(paused)this.play();
      else this.readPosition(widget,null,sampleTime(),stillReady,(position,at)=>this.controller.playing(token,position,at));
     });
    },350);
    this.later(()=>{if(stillReady())this.controller.providerPaused(token);},4500);
   });
  };
  widget.load(track.url,{auto_play:autoplayRequested,single_active:true,show_comments:false,show_related:false,callback:ready});
  this.later(()=>{if(this.isCurrent(token)&&this.loading){this.loading=false;this.controller.fail(token,'Track loading timed out. Resume retries without changing your queue.');}},20000);
 }
 loadNative(track,token){
  if(!this.native){
   const media=new Audio();
   this.native=media;media.preload='metadata';
   const current=()=>this.isCurrent(this.token)&&!this.loading&&this.expected?.provider==='local'&&media.currentSrc===this.expected.url;
   media.addEventListener('ended',()=>{if(current()&&media.ended)this.controller.finish(this.token);});
   media.addEventListener('playing',()=>{if(current()&&!media.paused)this.controller.playing(this.token,media.currentTime*1000,sampleTime());});
   media.addEventListener('pause',()=>{if(current()&&media.paused&&!media.ended)this.controller.providerPaused(this.token,media.currentTime*1000,sampleTime());});
   const progress=seeked=>{
    if(current()&&!media.ended&&(!media.paused||seeked))this.controller.progress(this.token,media.currentTime*1000,media.duration*1000,sampleTime(),seeked);
   };
   media.addEventListener('timeupdate',()=>progress(false));
   media.addEventListener('seeked',()=>progress(true));
  }
  const media=this.native;
  media.onloadedmetadata=()=>{
   if(!this.isCurrent(token)||media.currentSrc!==track.url)return;
   media.playbackRate=this.controller.state.rate;this.loading=false;this.controller.ready(token,media.duration*1000);
  };
  media.onerror=()=>this.controller.fail(token,'The local audio file could not be decoded.');
  media.src=track.url;media.load();
 }
 play(){
  if(this.loading||!this.isCurrent(this.token))return;
  const token=this.token, revision=++this.transportRevision;
  const valid=()=>this.isCurrent(token)&&revision===this.transportRevision;
  if(this.expected?.provider==='local'){
   this.native.volume=this.controller.state.volume/100;
   this.native.play().catch(()=>{if(valid())this.controller.providerPaused(token);});
   this.startAnalyser();
  }else{
   this.widget?.play();
   this.later(()=>{if(valid()&&this.controller.state.status==='ready')this.controller.providerPaused(token);},4500);
  }
 }
 position(){
  if(this.isCurrent(this.token)&&!this.loading&&this.expected?.provider==='local'&&this.native?.currentSrc===this.expected.url){
   return {position:this.native.currentTime*1000,sampledAt:sampleTime()};
  }
 }
 pause(){
  ++this.transportRevision;
  this.native?.pause();this.widget?.pause();
  return this.position();
 }
 seek(ms){
  if(this.loading||!this.isCurrent(this.token))return false;
  ++this.transportRevision;
  if(this.expected?.provider==='local'&&this.native){
   this.native.currentTime=ms/1000;
   return this.position()??false;
  }
  if(!this.widget)return false;
  const at=sampleTime();
  this.lastProgress=0;
  this.pendingSeek={target:ms,at};
  this.widget.seekTo(ms);
  return {position:ms,sampledAt:at};
 }
 volume(value){if(this.native)this.native.volume=value/100;this.widget?.setVolume(value);}
 rate(value){if(this.expected?.provider!=='local'||!this.native)return false;this.native.playbackRate=value;this.native.preservesPitch=true;return true;}
 startAnalyser(){try{if(!this.context){const Context=window.AudioContext||window.webkitAudioContext;this.context=new Context();this.analyser=this.context.createAnalyser();this.analyser.fftSize=256;this.source=this.context.createMediaElementSource(this.native);this.source.connect(this.analyser);this.analyser.connect(this.context.destination);this.bins=new Uint8Array(this.analyser.frequencyBinCount);}this.context.resume();}catch{/* Playback itself remains functional if Web Audio is blocked. */}}
 spectrum(){if(this.expected?.provider!=='local'||!this.analyser||this.controller.state.status!=='playing')return null;this.analyser.getByteFrequencyData(this.bins);const avg=(a,b)=>this.bins.slice(a,b).reduce((s,v)=>s+v,0)/((b-a)*255);return {bass:avg(1,9),mid:avg(9,40),high:avg(40,100),source:'pcm'};}
 destroy(){this.disposed=true;this.pause();for(const t of this.timers)clearTimeout(t);this.timers.clear();if(this.widget&&window.SC)for(const n of this.bound)this.widget.unbind(window.SC.Widget.Events[n]);this.iframe?.remove();if(this.native){this.native.removeAttribute('src');this.native.load();}this.context?.close();}
}
export function reactiveEnvelope(state,spectrum=null){if(state.status!=='playing')return {bass:0,mid:0,high:0,energy:0,source:spectrum?'pcm':'clock'};if(spectrum)return {...spectrum,energy:spectrum.bass*.5+spectrum.mid*.3+spectrum.high*.2};const t=state.position/1000;const bass=Math.pow(Math.max(0,Math.sin(t*TAU2)),5),mid=(Math.sin(t*4.31)+1)*.3,high=(Math.sin(t*9.72+2)+1)*.15;return {bass,mid,high,energy:bass*.38+mid*.25+high*.18,source:'clock'};}
const TAU2=Math.PI*2*1.7;
