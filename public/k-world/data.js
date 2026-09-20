export const ART = [
 ['cope','A','COPE'],['fear','B','FEAR'],['death-eater','C','DEATH EATER'],['wolf','D','SIGNAL HOUND'],['garden','E','ORCHARD SIGNAL'],['meteor','F','METEOR / RABBIT'],['cathedral','G','STAIR / CATHEDRAL'],['blue-relic','H','BLUE RELIC'],['neon-cosmos','I','NEON COSMOS'],['equations','J','EQUATION STUDY'],['self-i','K','K // SELF I'],['self-ii','L','K // SELF II']
].map(([id,letter,title])=>({id,letter,title,src:`assets/${id}.webp`}));
export const WORLDS=[
 {id:'sol',legacy:'spring',icon:'sun',name:'SOL',subtitle:'Tropical temple',color:'#ffbc52',tag:'PARADISE AWAITS',zone:'spring',description:'Amber sunlight, basalt steps, palms and a turquoise lagoon.'},
 {id:'torus',legacy:'summer',icon:'torus',name:'TORUS',subtitle:'Emerald halo',color:'#42efa0',tag:'GROW FOREVER',zone:'summer',description:'Concentric bridges, a living ring garden and green reservoirs.'},
 {id:'prism',legacy:'autumn',icon:'diamond',name:'DIAMOND',subtitle:'Prism caverns',color:'#62ddff',tag:'SEE DEEPER',zone:'autumn',description:'A subterranean data cathedral carved from cyan crystal.'},
 {id:'tesseract',legacy:'winter',icon:'tesseract',name:'TESSERACT',subtitle:'Red labyrinth',color:'#ff536f',tag:'HIGHER DIMENSIONS',zone:'winter',description:'Recursive frames, a dimensional reactor and crimson walkways.'},
 {id:'moon',legacy:'dark',icon:'moon',name:'MOON',subtitle:'Lunar outpost',color:'#b9d4ed',tag:'QUIET PERSPECTIVE',zone:'dark',description:'Cratered regolith, the lander, a habitat and Earthrise.'},
 {id:'station',legacy:'light',icon:'rocket',name:'ROCKET',subtitle:'K-01 orbital',color:'#ffb74c',tag:'REACH FURTHER',zone:'light',description:'A pressurized station with airlocks, docking spine and an EVA deck.'},
];
const track=(slug,title)=>({id:slug,url:`https://soundcloud.com/raikouno/${slug}`,title,provider:'soundcloud'});
export const TRACKS={
 turnaround:track('my-song-4dadnm-aggressive','My Song 4DADNM Aggressive'),city:track('maybe-mp3','Maybe'),spring:track('ponderthought','Ponderthought'),winter1:track('winter-mp3','Winter'),winter2:track('winter-2-mp3','Winter 2'),dreamer:track('i-was-a-dreamer-once-too-mp3','I Was A Dreamer Once Too'),summer1:track('when-its-all-done-minor-1',"When It’s All Done (Minor Dream Mix)"),summer2:track('star-struck-blue','Star Struck Blue'),summer3:track('lovesick-1-wav','Lovesick'),autumn1:track('hot-sauce-mp3','Hot Sauce'),autumn2:track('gandala-3','Gandala 3'),gallery:track('god-hands-mp3','God Hands'),car:track('flag-mp3','Flag'),dark:track('i-see-the-dead-mp3','I See The Dead'),ambient1:track('alien-superstar-mp3','Alien Superstar'),ambient2:track('g-13','G-13'),flight:track('mirror-plane-autotuned-rage','Mirror Plane (Autotuned Rage)')
};
export const PLAYLISTS={
 'gallery-turnaround':[TRACKS.turnaround,TRACKS.gallery], 'gallery-deep':[TRACKS.gallery],
 city:[TRACKS.city,TRACKS.ambient1,TRACKS.ambient2], spring:[TRACKS.spring,TRACKS.ambient1],summer:[TRACKS.summer1,TRACKS.summer2,TRACKS.summer3],autumn:[TRACKS.autumn1,TRACKS.autumn2],winter:[TRACKS.winter1,TRACKS.winter2,TRACKS.dreamer],light:[TRACKS.ambient1,TRACKS.ambient2],dark:[TRACKS.dark,TRACKS.ambient2],car:[TRACKS.car],flight:[TRACKS.flight],ambient:[TRACKS.ambient1,TRACKS.ambient2]
};
export function resolveWorld(id){if(id==='gallery'||id==='city')return id;return WORLDS.find(w=>w.id===id||w.legacy===id)?.id||'gallery';}
export const zoneForWorld=id=>id==='gallery'?'gallery-deep':id==='city'?'city':WORLDS.find(w=>w.id===id)?.zone||'ambient';
export const zoneLabel=id=>id==='gallery-deep'?'GALLERY / INNER NAVE':id==='gallery-turnaround'?'GALLERY / RETURN':id==='city'?'K//CITY':id==='car'?'K//DRIVE':id==='flight'?'K-01 / EVA':WORLDS.find(w=>w.zone===id)?.subtitle.toUpperCase()||'AMBIENT';
