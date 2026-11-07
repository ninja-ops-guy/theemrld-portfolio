import { CAMPAIGNS, CAMPAIGN_IDS, SCENES, campaignById, nodeById } from './campaigns.mjs';
import {createStore, expectedFrom, U} from './linked-store.mjs';
import { SAVE_KEY, newRun, choose, availability, encode, decode, consequence } from './engine.mjs';
const $ = id => document.getElementById(id);
const content = $('content');
const preview = new URLSearchParams(location.search).get('preview') === '1';
let linkedStore=null, linkedRecord=null, nativeSource={status:'unavailable'}, actionBusy=false;
try { if(!preview) linkedStore=createStore(); } catch {}
const sectionTitles={felicia_signal:'The missing interval',felicia_stop:'A stop outside your hands',k_anchor:'What the mark can prove',waldo_route:'Count the people, not the light',iona_freight:'After the fire',iona_workshop:'No one owns the voices',iona_witness:'Write down what I did, too'};
const entryAllowed=id=>preview||U.gate(id,U.ENTRIES[id],nativeSource).allowed;
function nativeHref(section=''){const url=new URL('../../techops-hero/',location.href);if(section)url.searchParams.set('linkedSection',section);return url.href;}
function refreshLinked(){
 if(preview)return;nativeSource=linkedStore?linkedStore.source():{status:'unavailable',reason:'Browser storage is unavailable.'};
 linkedRecord=null;runs={};
 if(U.validateSource(nativeSource)){try{linkedRecord=linkedStore.read(nativeSource);runs=linkedRecord.runs;}catch(e){message('Linked save protected: '+e.message+' No progress has been overwritten.');}}
 else message(nativeSource.reason||'Start or continue TechOps Hero to connect this browser’s story progress.');
}

const make = (tag, text = '', className = '') => { const element = document.createElement(tag); element.textContent = text; if (className) element.className = className; return element; };
const button = (label, action, className = '') => { const element = make('button', label, className); element.type = 'button'; element.addEventListener('click', action); return element; };
let runs = {}, selected = '', view = 'hub', lastConsequence = '', pending = null, worldFrame = null, worldScene = 'city', exploring = false, blockedSave = false, recoveryRaw = '';
function announce(text) { $('announcement').textContent = text; }
function message(text) { $('storage-status').replaceChildren(make('span', text)); }
function download(text, filename) { const url = URL.createObjectURL(new Blob([text], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
try {
  const raw = preview ? localStorage.getItem(SAVE_KEY) : null;
  if (raw) { try { runs = decode(raw); } catch { blockedSave = true; recoveryRaw = raw; message('The existing save could not be validated. It has NOT been overwritten. Play temporarily, import a valid save, or reset it below.'); } }
} catch { message('Browser storage is unavailable. Play continues in memory; export progress before leaving.'); }
function persist() {
  if(!preview)return false;
  if (blockedSave) return false;
  try { localStorage.setItem(SAVE_KEY, encode(runs)); $('storage-status').replaceChildren(); return true; }
  catch { message('Progress is in memory only: this browser refused the save. Export progress before leaving.'); return false; }
}
function confirmAction(title, text, action) {
  if ($('confirm-dialog').open) return;
  pending = action; $('confirm-title').textContent = title; $('confirm-body').textContent = text; $('confirm-dialog').showModal();
}
$('cancel').onclick = () => { pending = null; $('confirm-dialog').close(); };
$('confirm-dialog').addEventListener('cancel', () => { pending = null; });
$('confirm').onclick = () => { const action = pending; pending = null; $('confirm-dialog').close(); action?.(); };
function leaveWorld() { exploring = false; document.body.classList.remove('exploring'); $('world-stage').hidden = true; $('world-nav').textContent = 'Explore 3D'; }
function setScene(scene, force = false) {
  if (!SCENES.includes(scene) || (!force && scene === worldScene)) return;
  worldScene = scene;
  if (worldFrame) worldFrame.contentWindow?.postMessage({ type: 'k-world:navigate', scene }, location.origin);
}
function explore() {
  if (exploring) { leaveWorld(); render(); return; }
  exploring = true; document.body.classList.add('exploring'); $('world-stage').hidden = false; $('world-nav').textContent = 'Return to story';
  if (!worldFrame) {
    worldFrame = document.createElement('iframe'); worldFrame.title = 'See World — existing walkable environment'; worldFrame.allow = 'autoplay; fullscreen'; worldFrame.referrerPolicy = 'strict-origin-when-cross-origin';
    worldFrame.src = `../k-world/index.html?entry=${encodeURIComponent(worldScene)}`;
    worldFrame.addEventListener('load', () => { setScene(worldScene, true); $('world-note').textContent = 'Existing-world staging, not new mission geometry. Use Return to story to continue. Movement does not advance choices. The world owns music playback.'; });
    $('world-stage').append(worldFrame);
  }
}
function navigate(to) {
  if (!['comic', 'links', 'terminal', 'portfolio'].includes(to)) return;
  if (window.parent !== window) window.parent.postMessage({ type: 'see-world:navigate', to }, location.origin);
  else window.location.href = '../#/' + (to === 'portfolio' ? '' : to);
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || !worldFrame || event.source !== worldFrame.contentWindow) return;
  if (event.data?.type === 'k-world:comic') navigate('comic');
  if (event.data?.type === 'k-world:portfolio') navigate('portfolio');
});
async function openCampaign(id) {
  if (!campaignById(id)||actionBusy) return;
  leaveWorld(); selected=id; view='story'; lastConsequence='';
  if(!preview){
    refreshLinked();
    if(!entryAllowed(id)||!linkedRecord){render();return;}
    if(!runs[id]){actionBusy=true;try{linkedRecord=await linkedStore.begin(id,expectedFrom(linkedRecord));runs=linkedRecord.runs;nativeSource=linkedRecord.source;}catch(e){message(e.message);refreshLinked();}finally{actionBusy=false;}}
  }else{if(!runs[id])runs[id]=newRun(id);persist();}
  try { history.replaceState(null,'','#'+id); } catch {}
  render();
}

function showHub() { leaveWorld(); selected = ''; view = 'hub'; try { history.replaceState(null, '', location.pathname + location.search); } catch { /* History is optional. */ } render(); }
function showCollection() { leaveWorld(); view = 'collection'; render(); }
function statusFor(id) { const run = runs[id]; return run?.ended ? 'EPISODE COMPLETE / DOSSIER FOUND' : run?.history.length ? `RESUME / ${run.history.length} DECISIONS SAVED` : 'BEGIN YOUR ROUTE'; }
function launchButton(campaign, className = '') { return button(runs[campaign.id]?.ended ? 'Review your ending ↗' : runs[campaign.id]?.history.length ? 'Continue campaign →' : 'Begin campaign →', () => openCampaign(campaign.id), className); }
function showTimeline(){leaveWorld();view='timeline';if(!preview)refreshLinked();render();}
function nativeLink(label,section=''){const a=make('a',label,'secondary native-link');a.href=nativeHref(section);return a;}
function appendNativeLinks(target){
 if(preview){target.append(make('p','Sandbox play grants no native access.'));return;}
 const grants=U.grants(runs,nativeSource);
 for(const g of grants){if(selected&&g.campaign!==selected)continue;const done=nativeSource.milestones.completedSections.includes(g.id);target.append(nativeLink((done?'Review in Night Walker: ':'Unlocked in Night Walker: ')+sectionTitles[g.id],g.id));}
 target.append(nativeLink('Return to TechOps Hero / Night Walker'));
}
function renderLocked(){
 content.append(make('p','LINKED STORY / CHRONOLOGY','eyebrow'),make('h1','A story still unfolding.'),make('p',nativeSource.reason||'This perspective or checkpoint has not been earned in the active TechOps Hero run. No future scene, title, or reward is shown.'));
 content.append(nativeLink('Continue TechOps Hero'),button('View Story Timeline',showTimeline,'secondary'));
}
function renderLinkedHub(){
 const hero=make('section','','hero');const text=make('div');text.append(make('p','ONE PLAYTHROUGH / MULTIPLE VIEWPOINTS','eyebrow'),make('h1','FOLLOW THE STORY.'));
 const intro=make('div','','hero-copy');intro.append(make('p','Complete story beats in TechOps Hero. Discover another perspective here. Earn new sections in Night Walker.'),button('Open Story Timeline',showTimeline,'primary'));hero.append(text,intro);content.append(hero);
 if(!U.validateSource(nativeSource))content.append(nativeLink('Start or continue TechOps Hero'));
 const cards=make('div','','cards');
 for(const campaign of CAMPAIGNS){const card=make('article','','card');card.style.setProperty('--tone',entryAllowed(campaign.id)?campaign.color:'#879499');const body=make('div','','card-body');
  if(entryAllowed(campaign.id)){body.append(make('p',campaign.name,'eyebrow'),make('h2',campaign.title),make('p',U.PLACEMENT[campaign.id]),launchButton(campaign),make('small',statusFor(campaign.id)));}
  else body.append(make('h2','Undiscovered perspective'),make('p','Continue the main story to reveal this chapter.'));
  card.append(body);cards.append(card);
 }
 content.append(cards);appendNativeLinks(content);
}
function renderTimeline(){
 content.append(make('p','SHARED STORY TIMELINE','eyebrow'),make('h1','Where you are.'),make('p','Story placement and discovery order are distinct. Earlier interludes stay marked as earlier; player knowledge does not silently become another character’s knowledge.'));
 if(preview){content.append(make('p','Sandbox previews do not belong to the linked timeline.'),nativeLink('Continue the real TechOps Hero run'));return;}
 if(!U.validateSource(nativeSource)){content.append(make('p',nativeSource.reason),nativeLink('Connect through TechOps Hero'));return;}
 const names={prologue:'The Queue — opening',act_1:'Sector 04',act_2:'Ghost Frequency',act_3:'Parts in Motion / The Violinist',act_4:'Trust Is Earned',act_5:'MORNINGSTAR',act_6:'Duet Protocol',interlude:'Good Dogs — return',act_7:'Ghost Fork',act_8:'Watchdog',act_9:'ORPHEUS Wakes',epilogue:'The Queue — epilogue'};
 const native=make('section','','result');native.append(make('h2','TechOps Hero / earned milestones'));const list=make('ol');for(const id of nativeSource.milestones.completedActs)list.append(make('li',names[id]+' — completed'));native.append(list);if(!list.children.length)native.append(make('p','Your main story has begun. No story milestone has been completed yet.'));content.append(native);
 const perspectives=make('div','','collection');
 for(const campaign of CAMPAIGNS){const card=make('article','','card');card.style.setProperty('--tone',campaign.color);const visible=entryAllowed(campaign.id),r=runs[campaign.id];
  card.append(make('h2',visible?campaign.name:'Undiscovered perspective'));
  if(visible){card.append(make('p',U.PLACEMENT[campaign.id]),make('p',r?.ended?'Completed':r?.history.length?'In progress':'Available'),launchButton(campaign));if(r&&!r.ended){const node=nodeById(campaign,r.node);const waits=node.choices.map(o=>{try{return U.gate(campaign.id,choose(r,o.id).node,nativeSource);}catch{return {allowed:true};}}).filter(g=>!g.allowed);if(waits.length)card.append(make('p',waits[0].reason));}}
  else card.append(make('p','Locked — continue the main story.'));
  perspectives.append(card);
 }
 content.append(perspectives);appendNativeLinks(content);
 content.append(make('p','Local linked run '+nativeSource.binding.playthroughId.slice(0,14)+' · native checkpoint '+nativeSource.sequence+'. This is not cloud synchronization.','status-tag'));
}
function renderHub() {
  if(!preview&&!entryAllowed('iona'))return renderLinkedHub();
  const hero = make('section', '', 'hero'); const heading = make('div'); heading.append(make('p', 'THE EMRLD / INTERACTIVE STORIES', 'eyebrow'));
  const h1 = make('h1'); h1.append(document.createTextNode('FOUR LIVES.'), document.createElement('br'), make('span', 'ONE WORLD.')); heading.append(h1);
  const copy = make('div', '', 'hero-copy'); copy.append(make('p', 'Step into the story. Make the call. Live with what changes. Four character-led campaigns, with choices that leave a record.'));
  const counts = make('div', '', 'counter-row');
  for (const [number, label] of [['04', 'CAMPAIGNS'], [String(CAMPAIGNS.reduce((n,c) => n + c.nodes.filter(x => x.ending).length, 0)).padStart(2,'0'), 'ENDINGS'], [String(CAMPAIGN_IDS.filter(id => runs[id]?.ended).length).padStart(2,'0'), 'DOSSIERS FOUND']]) { const item = make('div'); item.append(make('strong', number), make('small', label)); counts.append(item); }
  copy.append(counts); hero.append(heading, copy); content.append(hero);
  const first = CAMPAIGNS[0], featured = make('section', '', 'featured'); featured.style.setProperty('--accent', first.color);
  const intro = make('div'); intro.append(make('p', 'FEATURED / IONA’S REVENGE', 'eyebrow'), make('h2', first.title), make('p', first.premise), launchButton(first, 'primary'), make('div', statusFor(first.id), 'status-tag'));
  const sigil = make('div', '', 'sigil'); sigil.style.color = first.color; sigil.setAttribute('aria-hidden', 'true'); sigil.append(make('strong', '04'), make('span', 'ONE. TWO. THREE. FOUR.')); featured.append(intro, sigil); content.append(featured);
  const sh = make('div', '', 'section-heading'); sh.append(make('h2', 'Other lives. Other decisions.'), make('small', preview?'SANDBOX / NO LINKED REWARDS':'LINKED CHARACTER PERSPECTIVES')); content.append(sh);
  const cards = make('div', '', 'cards');
  for (const campaign of CAMPAIGNS.slice(1)) {
    if(!entryAllowed(campaign.id)){const locked=make('article','','card');locked.append(make('div','UNDISCOVERED PERSPECTIVE','card-body'),make('p','Continue the main story to reveal this chapter.','card-body'));cards.append(locked);continue;}
    const card = make('article', '', 'card'); card.style.setProperty('--tone', campaign.color);
    const art = make('div', '', 'card-art'); art.setAttribute('aria-hidden','true'); art.append(make('span', campaign.motif.split(' / ')[0]), make('strong', campaign.name));
    const body = make('div', '', 'card-body'); body.append(make('h3', campaign.title), make('p', campaign.subtitle), make('p', campaign.mechanics, 'mechanics'), launchButton(campaign), make('div', statusFor(campaign.id), 'status-tag')); card.append(art,body); cards.append(card);
  }
  content.append(cards);
  const rules = make('section', '', 'rules');
  for (const [title, text] of [['Your pace. Real decisions.', preview?'No timed button prompts. Sandbox choices never grant native progress.':'No timed button prompts. Every character’s history belongs to one native playthrough.'], ['Explore, then return.', 'The existing 3D world remains available between decisions. Dedicated campaign scenes, combat and cinematics are not yet built.'], ['A game route is not the comic.', 'New dialogue and alternate outcomes are drafts. Source chronology stays visible; the main comic is never locked behind a puzzle.']]) { const item = make('div'); item.append(make('h3',title),make('p',text)); rules.append(item); }
  content.append(rules);
}
async function commitChoice(option, expectedNode) {
  if(actionBusy)return;actionBusy=true;
  const run=runs[selected];
  try {
    if(preview){const next=choose(run,option.id,expectedNode);lastConsequence=consequence(campaignById(selected),run,next);runs[selected]=next;persist();}
    else{
      if(!linkedRecord)throw Error('No writable linked playthrough.');
      linkedRecord=await linkedStore.decide(selected,option.id,expectedNode,expectedFrom(linkedRecord));
      runs=linkedRecord.runs;nativeSource=linkedRecord.source;
      lastConsequence=consequence(campaignById(selected),run,runs[selected]);
    }
    render();announce(lastConsequence+' '+nodeById(campaignById(selected),runs[selected].node).title);
  }catch(error){message(error.message);announce(error.message);if(!preview)refreshLinked();render();}
  finally{actionBusy=false;}
}

function renderStory() {
  if(!preview&&(!entryAllowed(selected)||!linkedRecord))return renderLocked();
  if(!runs[selected])return renderLocked();
  if(!preview&&!U.gate(selected,runs[selected].node,nativeSource).allowed)return renderLocked();
  const campaign = campaignById(selected), run = runs[selected], current = nodeById(campaign,run.node);
  content.style.setProperty('--tone',campaign.color); setScene(current.scene);
  const top = make('div', '', 'story-top'); top.append(button('← All campaigns',showHub),make('small', campaign.name + ' / ' + campaign.motif)); content.append(top);
  const layout = make('div', '', 'story-grid'), story = make('section', '', 'story'); story.setAttribute('aria-labelledby','scene-title');
  story.append(make('p', `${current.ending ? 'EPISODE COMPLETE' : 'ACT '+String(current.chapter).padStart(2,'0')+' / 05'} · ${campaign.title}`, 'chapter-label'));
  const title = make('h1',current.title); title.id = 'scene-title'; title.tabIndex = -1; story.append(title, make('p',current.place,'location'));
  if (lastConsequence) story.append(make('p',lastConsequence,'after-choice'));
  const text = make('div','','story-text'); for (const paragraph of current.text) text.append(make('p',paragraph)); story.append(text);
  const dialogue = make('blockquote','','dialogue'); dialogue.append(make('small',current.speaker || campaign.name),make('p','“'+current.quote+'”')); story.append(dialogue);
  if (!current.ending) {
    const choices = make('div','','choices'); choices.setAttribute('aria-label','Story choices');
    current.choices.forEach((option,index) => {
      let allowed = availability(run,option);
      if(allowed.allowed&&!preview){try{allowed=U.gate(selected,choose(run,option.id,current.id).node,nativeSource);}catch(e){allowed={allowed:false,reason:e.message};}}
      const action = () => option.confirm ? confirmAction('Commit this depot fate?', option.hint+' This cannot be undone within this run. Restarting this campaign requires a separate confirmation.', () => commitChoice(option,current.id)) : commitChoice(option,current.id);
      const item = button('',action,'choice'); item.dataset.choice=option.id; item.disabled=!allowed.allowed;
      item.append(make('span',String(index+1).padStart(2,'0'),'choice-index'));
      const label = make('span'); label.append(make('strong',option.label),make('small',option.hint + (!allowed.allowed ? ' Locked: '+allowed.reason : '')));
      if (option.confirm) label.append(make('small','IRREVERSIBLE / CONFIRMATION REQUIRED','irreversible'));
      item.append(label,make('span',allowed.allowed ? '↗' : '—')); choices.append(item);
    }); story.append(choices);
  } else {
    const result = make('section','','result'); result.append(make('small','PERSISTENT OUTCOME'),make('h2',current.worldState),make('small','DOSSIER DISCOVERED'),make('p',campaign.reward.title+' — '+campaign.reward.text)); story.append(result);
    const actions=make('div','','result-actions'); actions.append(button('Open collection',showCollection,'primary'),button('Choose another life',showHub,'secondary')); story.append(actions);
  }
  const side = make('aside','','sidebar'); side.setAttribute('aria-label','Campaign state'); side.append(make('h2','YOUR CONSEQUENCES'));
  for (const [key,value] of Object.entries(run.stats)) {
    const stat=make('div','','stat'), label=make('div','','stat-label'); label.append(make('span',campaign.labels[key]),make('strong',String(value)));
    const meter=document.createElement('meter'); meter.min=0;meter.max=16;meter.value=Math.min(16,value);meter.setAttribute('aria-label',campaign.labels[key]+' '+value);stat.append(label,meter);side.append(stat);
  }
  side.append(make('p','These values are independent. They do not combine into a morality score.'));
  const chronology=make('div','','chronology');chronology.append(make('h2','CHRONOLOGY BOUNDARY'),make('p',campaign.chronology));side.append(chronology);
  const journal=make('details','','journal');journal.append(make('summary',`DECISION JOURNAL / ${run.history.length}`));const list=make('ol');
  for (const step of run.history) { const n=nodeById(campaign,step.node), c=n.choices.find(x=>x.id===step.choice),li=make('li');li.append(make('strong',n.title),make('span',c.label));list.append(li); }
  journal.append(list);side.append(journal,button('Explore this world',explore,'secondary'));
  if(preview)side.append(button('Restart sandbox episode',()=>confirmAction('Restart '+campaign.name+'?', 'Only this sandbox episode resets. Linked progress is untouched.',()=>{runs[selected]=newRun(selected);lastConsequence='';persist();render();}),'secondary'));
  else{
    side.append(button('Story Timeline',showTimeline,'secondary'));
    appendNativeLinks(side);
    side.append(button('Replay separately — no unlocks',()=>confirmAction('Open sandbox replay?', 'Your linked decisions will not change. Sandbox play cannot award Night Walker access.',()=>{const url=new URL(location.href);url.searchParams.set('preview','1');url.hash=selected;location.assign(url.href);}),'secondary'));
  }
  layout.append(story,side);content.append(layout);
}
function renderCollection() {
  content.append(make('p','THE ARCHIVE / EARNED THROUGH PLAY','eyebrow'),make('h1','What you carry.'),make('p','These are in-game text dossiers, not new comic pages or unreleased recordings. Alternate replay stays in a separate sandbox. It cannot overwrite linked decisions or grant native rewards.'));
  const grid=make('div','','collection');
  for(const campaign of CAMPAIGNS) { if(!entryAllowed(campaign.id)){const locked=make('article','','card');locked.append(make('h2','Undiscovered perspective'),make('p','Continue the main story.'));grid.append(locked);continue;} const unlocked=runs[campaign.id]?.ended,card=make('article','','card');card.style.setProperty('--tone',campaign.color);card.append(make('p',campaign.name+' / '+(unlocked?'DISCOVERED':'UNDISCOVERED'),'eyebrow'),make('h2',unlocked?campaign.reward.title:'An unopened record'),make('p',unlocked?campaign.reward.text:'Complete this character’s episode to reveal the dossier.'),launchButton(campaign));grid.append(card); }
  content.append(grid);
  if(CAMPAIGN_IDS.every(id=>runs[id]?.ended)){const reward=make('section','','all-witnesses');reward.append(make('p','ALL FOUR PERSPECTIVES / BONUS DOSSIER','eyebrow'),make('h2','Four witnesses'),make('p','Voice is not consent. Trust is not evidence. Origin is not ownership. Care is not command. These four routes can illuminate one another without becoming one compulsory version of events.'));content.append(reward);}
}
function render() {
  content.replaceChildren();content.style.removeProperty('--tone');
  if(view==='story' && selected) renderStory(); else if(view==='collection') renderCollection(); else if(view==='timeline')renderTimeline();else renderHub();
  if(blockedSave){const recovery=make('section','','result');recovery.append(make('h2','Your previous save is protected'),button('Download recovery copy',()=>download(recoveryRaw,'see-world-recovery.json'),'secondary'),button('Replace unreadable save',()=>confirmAction('Replace the unreadable save?', 'Download its recovery copy first. The current in-memory progress will replace only See World’s save slot.',()=>{blockedSave=false;persist();render();}),'secondary'));content.append(recovery);}
  document.title = view==='story'&&entryAllowed(selected) ? `${campaignById(selected).name} — SEE WORLD` : 'SEE WORLD — Linked stories';
  window.scrollTo(0,0); (document.getElementById('scene-title') || content).focus({preventScroll:true});
}
$('home').onclick=showHub;$('campaigns-nav').onclick=showHub;$('collection-nav').onclick=showCollection;$('world-nav').onclick=explore;$('comic-nav').onclick=()=>navigate('comic');$('portfolio-nav').onclick=()=>navigate('portfolio');
$('links-nav').onclick = () => navigate('links');
$('export').onclick=()=>{try{download(preview?encode(runs):linkedStore.exportSave(),preview?'see-world-sandbox.json':'see-world-linked-progress.json');announce('Progress exported.');}catch(e){message(e.message);}};
$('import').addEventListener('change', async event=>{
 const file=event.target.files?.[0];event.target.value='';if(!file)return;
 if(file.size>250000){message('Import refused: file exceeds 250 KB. Existing progress is unchanged.');return;}
 try{
  const raw=await file.text();
  if(preview){const imported=decode(raw);confirmAction('Replace sandbox progress?', 'Linked progress will not change.',()=>{runs=imported;blockedSave=false;selected='';view='hub';persist();render();});}
  else{
   if(!linkedRecord)throw Error('Open a readable native-linked run first.');
   const captured=expectedFrom(linkedRecord);
   confirmAction('Import a backup for this playthrough?', 'Only a compatible history from this exact native run can be merged. Existing choices and native completion cannot be replaced.',async()=>{try{linkedRecord=await linkedStore.importSave(raw,captured);runs=linkedRecord.runs;nativeSource=linkedRecord.source;selected='';view='timeline';render();announce('Compatible linked progress restored.');}catch(e){message('Import refused: '+e.message);}});
  }
 }catch(e){message('Import refused: '+e.message+' Existing progress is unchanged.');}
});
$('timeline-nav').onclick=showTimeline;
if(!preview){
 refreshLinked();
 const refresh=()=>{const y=scrollY;refreshLinked();render();scrollTo(0,y);};
 window.addEventListener('storage',e=>{if(e.key===U.KEYS.source||e.key?.startsWith(U.KEYS.see))refresh();});
 window.addEventListener('focus',refresh);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
}
$('mode-label').textContent=preview?'SANDBOX / NO LINKED REWARDS':'LINKED STORY CANDIDATE';
$('mode-detail').textContent=preview?'Independent preview. Main-game saves and unlocks are untouched.':'Chronology follows your TechOps Hero playthrough.';
const initial=location.hash.slice(1);if(CAMPAIGN_IDS.includes(initial)){selected=initial;view='story';if(preview)runs[initial]??=newRun(initial);}render();
