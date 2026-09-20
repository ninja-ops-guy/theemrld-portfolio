import {PLAYLISTS} from './data.js';
import {clamp} from './renderer.js';
/** Pure queue policy. Only natural FINISH or an explicit transport action advances. */
export class Sequencer extends EventTarget {
 constructor(port,playlists=PLAYLISTS){super();this.port=port;this.playlists=playlists;this.generation=0;this.finishedGeneration=-1;this.state={mode:'auto',zone:'gallery-deep',activeZone:null,pendingZone:null,current:null,index:0,status:'idle',position:0,duration:0,pausedByUser:false,armed:false,error:null,volume:55,rate:1};port.connect?.(this);}
 emit(){this.dispatchEvent(new CustomEvent('change',{detail:{...this.state}}));}
 arm(){this.state.armed=true;if(!this.state.current&&!this.state.pausedByUser)this.loadZone(this.state.zone,0);else this.resume();}
 setZone(zone){if(!this.playlists[zone])return;const s=this.state;s.zone=zone;if(s.mode==='auto'){if(s.current&&s.status!=='finished'&&s.status!=='idle'){s.pendingZone=zone===s.activeZone?null:zone;}else if(s.armed&&!s.pausedByUser)this.loadZone(zone,0);else s.pendingZone=zone;}this.emit();}
 loadZone(zone,index=0){const list=this.playlists[zone]||[];if(!list.length)return;const i=((index%list.length)+list.length)%list.length;this.state.activeZone=zone;this.state.index=i;this.state.pendingZone=null;this.load(list[i]);}
 load(track){const token=++this.generation;if(track.provider!=='local')this.state.rate=1;this.state.current=track;this.state.position=0;this.state.duration=0;this.state.status='loading';this.state.error=null;this.emit();try{Promise.resolve(this.port.load(track,token)).catch(e=>this.fail(token,e.message));}catch(e){this.fail(token,e.message);}return token;}
 ready(token,duration){if(token!==this.generation)return;this.state.duration=Math.max(0,duration||0);if(this.state.pausedByUser||!this.state.armed){this.state.status='paused';this.port.pause();}else {this.state.status='ready';this.port.play();}this.emit();}
 playing(token){if(token!==this.generation)return;if(this.state.pausedByUser||!this.state.armed){this.port.pause();return;}this.state.status='playing';this.state.error=null;this.emit();}
 progress(token,position,duration){if(token!==this.generation)return;this.state.position=Math.max(0,position||0);if(duration>0)this.state.duration=duration;this.emit();}
 providerPaused(token){if(token!==this.generation||this.state.status==='loading'||this.state.status==='finished')return;this.state.status='paused';this.emit();}
 finish(token){if(token!==this.generation||this.finishedGeneration===token||this.state.status==='loading')return false;this.finishedGeneration=token;this.state.status='finished';this.state.position=this.state.duration;this.emit();if(this.state.mode==='auto'&&this.state.armed&&!this.state.pausedByUser){const next=this.state.pendingZone||this.state.zone||this.state.activeZone;this.loadZone(next,next===this.state.activeZone?this.state.index+1:0);}return true;}
 pause(){this.state.pausedByUser=true;this.port.pause();this.state.status=this.state.current?'paused':'idle';this.emit();}
 resume(){this.state.pausedByUser=false;this.state.armed=true;if(!this.state.current){this.loadZone(this.state.zone,0);return;}if(this.state.status==='finished'){if(this.state.mode==='auto')this.loadZone(this.state.pendingZone||this.state.zone,0);else this.load(this.state.current);}else if(this.state.status==='error')this.load(this.state.current);else this.port.play();this.emit();}
 stop(){this.state.pausedByUser=true;this.port.pause();this.port.seek?.(0);this.state.position=0;this.state.status=this.state.current?'paused':'idle';this.emit();}
 select(track){this.state.mode='manual';this.state.activeZone=null;this.state.pendingZone=null;this.state.pausedByUser=false;this.state.armed=true;this.load(track);}
 auto(enabled){this.state.mode=enabled?'auto':'manual';this.state.pendingZone=null;if(enabled){this.setZone(this.state.zone);}this.emit();}
 skip(){if(this.state.mode==='auto'){this.state.pausedByUser=false;this.state.armed=true;const zone=this.state.pendingZone||this.state.zone;this.loadZone(zone,zone===this.state.activeZone?this.state.index+1:0);}}
 volume(value){this.state.volume=clamp(value,0,100);this.port.volume?.(this.state.volume);this.emit();}
 seek(ms){if(this.state.duration>0)this.port.seek?.(clamp(ms,0,this.state.duration));}
 rate(value){if(!Number.isFinite(value)||value<.5||value>2)throw Error('Speed must be 0.5–2.0.');if(!this.port.rate?.(value))return false;this.state.rate=value;this.emit();return true;}
 fail(token,message){if(token!==this.generation)return;this.state.status='error';this.state.error=message||'Audio could not load. Use Resume to retry.';this.emit();}
 destroy(){++this.generation;this.port.destroy?.();}
}
export function canonicalUrl(value){try{const u=new URL(value);if(u.protocol!=='https:'||!['soundcloud.com','www.soundcloud.com'].includes(u.hostname))return null;const parts=u.pathname.split('/').filter(Boolean);if(parts.length!==2||['sets','likes','tracks','reposts','popular-tracks'].includes(parts[1]))return null;return 'https://soundcloud.com/'+parts.join('/');}catch{return null;}}
let apiPromise;
function api(){if(window.SC?.Widget)return Promise.resolve(window.SC);if(apiPromise)return apiPromise;apiPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://w.soundcloud.com/player/api.js';script.async=true;const timeout=setTimeout(()=>{apiPromise=null;reject(Error('SoundCloud did not respond. Check your connection and press Resume.'));},15000);script.onload=()=>{clearTimeout(timeout);if(window.SC?.Widget)resolve(window.SC);else{apiPromise=null;reject(Error('SoundCloud Widget API unavailable.'));}};script.onerror=()=>{clearTimeout(timeout);apiPromise=null;script.remove();reject(Error('SoundCloud is blocked or offline. Your world remains usable.'));};document.head.append(script);});return apiPromise;}
/** Sole transport. One SC iframe; local audio explicitly pauses it before starting. */
export class SoundCloudPort {
 constructor(slot,onCatalogue=()=>{}){this.slot=slot;this.onCatalogue=onCatalogue;this.widget=null;this.native=null;this.controller=null;this.token=0;this.loading=false;this.expected=null;this.disposed=false;this.duration=0;this.timers=new Set();this.bound=[];}
 connect(controller){this.controller=controller;}
 later(fn,ms){const id=setTimeout(()=>{this.timers.delete(id);if(!this.disposed)fn();},ms);this.timers.add(id);return id;}
 async init(){if(this.widget)return this.widget;if(this.initializing)return this.initializing;this.initializing=(async()=>{
  const SC=await api();if(this.disposed)throw Error('Player disposed');
  const iframe=document.createElement('iframe');iframe.title='SoundCloud player — K Terminal audio authority';iframe.allow='autoplay';iframe.src='https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fraikouno&auto_play=false&single_active=true&show_artwork=true';iframe.style.cssText='width:100%;height:130px;border:0;';this.iframe=iframe;this.slot.replaceChildren(iframe);const widget=SC.Widget(iframe);this.widget=widget;
  const bind=(name,fn)=>{widget.bind(SC.Widget.Events[name],fn);this.bound.push(name);};
  const current=(fn)=>{const token=this.token;if(this.loading||this.expected?.provider==='local'||this.disposed)return;widget.getCurrentSound(sound=>{if(this.disposed||token!==this.token||this.loading)return;if(canonicalUrl(sound?.permalink_url)!==canonicalUrl(this.expected?.url))return;fn(token,sound);});};
  bind('PLAY',()=>current((token,sound)=>{this.duration=sound.duration||this.duration;widget.setVolume(this.controller.state.volume);this.controller.playing(token);}));
  bind('PAUSE',()=>current(token=>this.controller.providerPaused(token)));
  bind('PLAY_PROGRESS',event=>{if(this.loading||this.expected?.provider==='local')return;this.controller.progress(this.token,event.currentPosition||0,this.duration);});
  bind('FINISH',event=>current((token,sound)=>{widget.getPosition(position=>{if(token!==this.token||this.loading)return;const duration=sound.duration||this.duration;const endPosition=Math.max(event?.currentPosition||0,position||0,this.controller.state.position||0);if(duration>0&&endPosition>=duration-600)this.controller.finish(token);});}));
  bind('ERROR',()=>{if(!this.loading&&this.expected?.provider!=='local')this.controller.fail(this.token,'SoundCloud could not play this track. Resume retries; choose another song to replace it.');});
  await new Promise((resolve,reject)=>{const timer=this.later(()=>reject(Error('SoundCloud player readiness timed out.')),15000);bind('READY',()=>{clearTimeout(timer);this.timers.delete(timer);resolve();});});
  widget.getSounds(sounds=>{if(Array.isArray(sounds)&&sounds.length>1){const tracks=sounds.filter(s=>canonicalUrl(s.permalink_url)).sort((a,b)=>Date.parse(b.created_at||0)-Date.parse(a.created_at||0)).map(s=>({id:String(s.id),url:canonicalUrl(s.permalink_url),title:s.title||'Untitled',provider:'soundcloud',createdAt:s.created_at}));this.onCatalogue(tracks);}});
  return widget;
 })();try{return await this.initializing;}catch(e){if(this.widget&&!this.disposed){for(const n of this.bound)this.widget.unbind(window.SC.Widget.Events[n]);this.bound=[];this.widget=null;this.iframe?.remove();}this.initializing=null;throw e;}}
 async load(track,token){this.token=token;this.expected=track;this.loading=true;this.native?.pause();this.widget?.pause();if(track.provider==='local'){await this.loadNative(track,token);return;}
  const widget=await this.init();if(token!==this.token||this.disposed)return;
  widget.pause();widget.load(track.url,{auto_play:false,single_active:true,show_comments:false,show_related:false,callback:()=>{if(token!==this.token||this.disposed)return;widget.getDuration(duration=>{if(token!==this.token||this.disposed)return;this.duration=duration||0;this.loading=false;widget.setVolume(this.controller.state.volume);this.controller.ready(token,this.duration);this.later(()=>{if(token===this.token&&!this.loading&&this.controller.state.status==='ready'){this.controller.providerPaused(token);}},2200);});}});
  this.later(()=>{if(token===this.token&&this.loading){this.loading=false;this.controller.fail(token,'Track loading timed out. Resume retries without changing your queue.');}},20000);
 }
 async loadNative(track,token){if(!this.native){this.native=new Audio();this.native.preload='metadata';this.native.addEventListener('ended',()=>{if(this.expected?.provider==='local')this.controller.finish(this.token);});this.native.addEventListener('play',()=>{if(this.expected?.provider==='local')this.controller.playing(this.token);});this.native.addEventListener('pause',()=>{if(this.expected?.provider==='local')this.controller.providerPaused(this.token);});this.native.addEventListener('timeupdate',()=>{if(this.expected?.provider==='local')this.controller.progress(this.token,this.native.currentTime*1000,this.native.duration*1000);});}
  this.native.onloadedmetadata=()=>{if(token!==this.token)return;this.native.playbackRate=this.controller.state.rate;this.loading=false;this.controller.ready(token,this.native.duration*1000);};this.native.onerror=()=>this.controller.fail(token,'The local audio file could not be decoded.');this.native.src=track.url;this.native.load();
 }
 play(){if(this.loading)return;if(this.expected?.provider==='local'){this.native.volume=this.controller.state.volume/100;this.native.play().catch(()=>this.controller.providerPaused(this.token));this.startAnalyser();}else{this.widget?.play();this.later(()=>{if(this.controller.state.status==='ready')this.controller.providerPaused(this.token);},1800);}}
 pause(){this.native?.pause();this.widget?.pause();}
 seek(ms){if(this.expected?.provider==='local'&&this.native)this.native.currentTime=ms/1000;else this.widget?.seekTo(ms);}
 volume(value){if(this.native)this.native.volume=value/100;this.widget?.setVolume(value);}
 rate(value){if(this.expected?.provider!=='local'||!this.native)return false;this.native.playbackRate=value;this.native.preservesPitch=true;return true;}
 startAnalyser(){try{if(!this.context){const Context=window.AudioContext||window.webkitAudioContext;this.context=new Context();this.analyser=this.context.createAnalyser();this.analyser.fftSize=256;this.source=this.context.createMediaElementSource(this.native);this.source.connect(this.analyser);this.analyser.connect(this.context.destination);this.bins=new Uint8Array(this.analyser.frequencyBinCount);}this.context.resume();}catch{/* Playback itself remains functional if Web Audio is blocked. */}}
 spectrum(){if(this.expected?.provider!=='local'||!this.analyser||this.controller.state.status!=='playing')return null;this.analyser.getByteFrequencyData(this.bins);const avg=(a,b)=>this.bins.slice(a,b).reduce((s,v)=>s+v,0)/((b-a)*255);return {bass:avg(1,9),mid:avg(9,40),high:avg(40,100),source:'pcm'};}
 destroy(){this.disposed=true;this.pause();for(const t of this.timers)clearTimeout(t);this.timers.clear();if(this.widget&&window.SC)for(const n of this.bound)this.widget.unbind(window.SC.Widget.Events[n]);this.iframe?.remove();if(this.native){this.native.removeAttribute('src');this.native.load();}this.context?.close();}
}
export function reactiveEnvelope(state,spectrum=null){if(state.status!=='playing')return {bass:0,mid:0,high:0,energy:0,source:spectrum?'pcm':'clock'};if(spectrum)return {...spectrum,energy:spectrum.bass*.5+spectrum.mid*.3+spectrum.high*.2};const t=state.position/1000;const bass=Math.pow(Math.max(0,Math.sin(t*TAU2)),5),mid=(Math.sin(t*4.31)+1)*.3,high=(Math.sin(t*9.72+2)+1)*.15;return {bass,mid,high,energy:bass*.38+mid*.25+high*.18,source:'clock'};}
const TAU2=Math.PI*2*1.7;
