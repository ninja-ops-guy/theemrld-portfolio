const LOCAL_ART = [
 ['cope','A','COPE'],['fear','B','FEAR'],['death-eater','C','DEATH EATER'],['wolf','D','SIGNAL HOUND'],['garden','E','ORCHARD SIGNAL'],['meteor','F','METEOR / RABBIT'],['cathedral','G','STAIR / CATHEDRAL'],['blue-relic','H','BLUE RELIC'],['neon-cosmos','I','NEON COSMOS'],['equations','J','EQUATION STUDY'],['self-i','K','K // SELF I'],['self-ii','L','K // SELF II']
].map(([id,letter,title])=>({id,letter,title,src:`assets/${id}.webp`}));

// Extended user-supplied archive. The gallery has twelve physical frames; these
// works rotate through those frames only after the visitor looks away.
const ARCHIVE_ART = [
 {id:'end-for-us',letter:'13',title:'THIS WILL NOT BE THE END FOR US',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/4d7a0c35-fb1f-4164-a415-12571dc689d5.jpg'},
 {id:'k-hand-portrait',letter:'14',title:'THE HAND REMEMBERS',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/d0282f7f-70c2-4283-ab6e-9e51af1e4667.jpg'},
 {id:'k-mask-emerald',letter:'15',title:'BETWEEN WORLDS',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/2cfd9b07-2838-47b1-9cbc-651e022617cf.jpg'},
 {id:'k-mask-crimson',letter:'16',title:'STILL HERE',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/3d7aec96-5032-4ba1-a00a-85f28acbfa8e.jpg'},
 {id:'k-portrait-study',letter:'17',title:'PORTRAIT / RETURN',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/ea05afa1-2ca2-4ab5-9037-c8711a2e83eb.jpg'},
 {id:'factory-dimension',letter:'18',title:'ANOTHER DIMENSION',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/667cbadb-57a6-4fba-9c1f-750ba4c933c9.jpg'},
 {id:'shattered-reflection',letter:'19',title:'SHATTERED REFLECTION',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/f7d4b7e1-9ebd-4716-a7ef-823c24498c89.jpg'},
 {id:'tortoise-garden',letter:'20',title:'CARRY IT FORWARD',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/fa3344ce-b394-454a-ac21-4fcf030ded64.jpg'},
 {id:'jungle-house',letter:'21',title:'RETURN PATH',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/27a0bfcb-c6ce-4944-a334-dcf803d54b7e.jpg'},
 {id:'jellyfish-duality',letter:'22',title:'TWO WORLDS',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/03a17ab5-c693-44f8-a137-ad7b02399ec8.jpg'},
 {id:'twin-horses',letter:'23',title:'TWIN PATHS',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/49e6639d-09d4-47a8-b726-a51a940f221f.jpg'},
 {id:'be-not-afraid',letter:'24',title:'BE NOT AFRAID',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/9a1d7eb4-ff9e-43cf-ba11-66d3429d648d.png'},
 {id:'lunar-1',letter:'25',title:'LUNAR 1',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/5e21e945-8c81-4e27-b974-29ae04c4abf6.jpg'},
 {id:'lunar-2',letter:'26',title:'LUNAR 2',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/9640fe4e-5352-47b8-8701-752cd191681f.jpg'},
 {id:'googaboogalight',letter:'27',title:'GOOGABOOGABOOGALIGHT',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/4e6b92dc-ac5a-4ae8-8bb2-00848870a5da.jpg'},
 {id:'goat-1',letter:'28',title:'GOAT 1',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/5c91b1a7-afb8-4912-81d7-8f2b95aaf249.jpg'},
 {id:'fuck-five',letter:'29',title:'FUCK FUCK FUCK FUCK FUCK',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/9c3e4917-f814-493b-a1ec-d8f240b4884c.png'},
 {id:'goat-3',letter:'30',title:'GOAT 3',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/6201389f-6e90-4f74-9ca1-340f83e03c3c.png'},
 {id:'void-world-3',letter:'31',title:'VOID WORLD 3',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/b1af0ee5-b2f3-459c-aa23-fb02921b9ed9.jpg'},
 {id:'spring-study',letter:'32',title:'SPRING STUDY',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/0c8f4bc6-df9b-4159-bf0c-0040eeda886c.png'},
 {id:'distortion-sanctuary',letter:'33',title:'DISTORTION SANCTUARY',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/3cc8b675-9daf-4c0e-a154-5db0c561c6ca.jpg'},
 {id:'fractured-monument',letter:'34',title:'FRACTURED MONUMENT',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/46df4d47-c316-4e72-9d1d-6e4033f076a8.jpg'},
 {id:'grasping-hands',letter:'35',title:'GRASPING HANDS',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/d4afc96e-ef90-4860-81bb-84f1cbd47679.png'},
 {id:'astor-club',letter:'36',title:'ASTOR CLUB',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/2389a4e7-2a99-4406-a6ec-eec0e23ea23b.jpg'},
 {id:'green-line-figure',letter:'37',title:'GREEN LINE FIGURE',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/a9887ee3-5cb6-40b6-9724-5c4ca30d06fe.jpg'},
 {id:'vares-end',letter:'38',title:'VARES / END OF WORLD',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/c68a6dc0-5850-48d8-b304-a9cce260da88.jpg'},
 {id:'choose-one',letter:'39',title:'CHOOSE ONE',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/98a77266-1fdc-4457-aa48-8aacbab29489.jpg'},
 {id:'trial-begins',letter:'40',title:'WHEN THE TRIAL BEGINS',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/6704d664-74cd-4d38-bb55-7e2293ef9f36.jpg'},
 {id:'watcher',letter:'41',title:'WATCHER',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/d6809b74-19f6-416e-ab96-7b6aeac58629.png'},
 {id:'good-company',letter:'42',title:'GOOD COMPANY',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/15141352-f864-4e23-9c35-63ceaeb6face.jpg'},
 {id:'below-beyond',letter:'43',title:'BELOW / BEYOND',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/e8b7b8b0-cbe7-4e28-8d7d-3bd7916f198e.jpg'},
 {id:'freed-study',letter:'44',title:'FREED',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/f426d005-335f-4d74-93bc-7de414f583b5.jpg'},
 {id:'the-magician',letter:'45',title:'THE MAGICIAN',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/475aacb2-971f-4a6f-b24d-1e553ac53fce.jpg'},
 {id:'techops-night-shift',letter:'46',title:'NIGHT SHIFT / TECHOPS',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/2d17e99a-bfae-4d8a-ab0c-8b8f455ba659.png'},
 {id:'at-what-cost',letter:'47',title:'AT WHAT COST?',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/5069fa84-95b9-482f-8b1c-fffc86e2f7f4.jpg'},
 {id:'weight-we-carry',letter:'48',title:'THE WEIGHT WE CARRY',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/90767247-4031-4af0-8823-da87f21f2e67.jpg'},
 {id:'doomdude',letter:'49',title:'DOOMDUDE',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/8f048bdd-1306-456c-9aa5-5ee5325682d5.jpg'},
 {id:'liminal-glass',letter:'50',title:'LIMINAL',src:'https://d2ol7oe51mr4n9.cloudfront.net/user_35RBEXAM1O9RfdpYhaXNJJroZk3/e078e3a5-50b5-46e0-9fc8-b8ea876f01a0.jpg'}
];

export const ART=[...LOCAL_ART,...ARCHIVE_ART];
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
