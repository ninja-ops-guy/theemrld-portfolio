import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import KTerminal, { type KWorldScene } from './KTerminal';
import { type KAudioZone } from '../data/kAudioZones';
import { K_GALLERY_ART, K_GALLERY_ATLAS } from '../data/kGalleryArt';

type Phase = 'explore' | 'sitting' | 'seated' | 'standing';
type Cam = { x:number; y:number; ang:number; pitch:number; height:number };
type Hit = { tile:string; ix:number; iy:number; dist:number; side:number } | null;

const W=48,H=40,FOV=Math.PI/2.65;
const SPAWN={x:24.5,y:26.5,a:-Math.PI/2};
const RETURN={x:23.5,y:6.45,a:Math.PI/2};
const SEAT={x:23.5,y:5.9,a:-Math.PI/2};
const PORTAL_SPAWN={x:24.5,y:35.2,a:-Math.PI/2};
const REALM_THRESHOLD_Y=29;
const FONT='ui-monospace,"SF Mono",Menlo,Consolas,monospace';

type SceneId=KWorldScene;
type SceneConfig={label:string;era:string;motifs:string;accent:string;sky:string;haze:string;floorA:string;floorB:string;wall:string;neon:string;weather:string;weatherColor:string;wallChars:[string,string,string]};
const CITY_CONFIG:SceneConfig={
  label:'K//CITY',
  era:'ASCII CITY // INNER RING',
  motifs:'PROJECT DISTRICTS · FACTORY SYSTEMS · NEON TRANSIT · GALLERY NORTH',
  accent:'#00ff66',sky:'#050913',haze:'#50206c',floorA:'#15212d',floorB:'#0b121b',wall:'#39475c',neon:'#00ffff',weather:'│',weatherColor:'#184a66',wallChars:['▓','▒','░']
};

const SCENES:Record<SceneId,SceneConfig>={
  spring:{label:'SOL TROPICAL',era:'SUN PORTAL → TROPICAL TEMPLE',motifs:'PALMS · LAGOON · BASALT TEMPLE · SOLAR ALTAR · HUMID RAIN',accent:'#ffb000',sky:'#06171a',haze:'#ffb000',floorA:'#123b2a',floorB:'#08271e',wall:'#3d5d48',neon:'#ffb000',weather:'✦',weatherColor:'#ffd36a',wallChars:['▓','▒','░']},
  summer:{label:'EMERALD HALO',era:'TORUS PORTAL → RING GARDEN',motifs:'CONCENTRIC ARCHES · BIO-CIRCUIT VINES · HALO CANALS · LOOP BRIDGES',accent:'#00ff91',sky:'#03100d',haze:'#00ff91',floorA:'#0c3428',floorB:'#061f18',wall:'#185442',neon:'#00ff91',weather:'·',weatherColor:'#65ffbd',wallChars:['▓','▒','░']},
  autumn:{label:'PRISM CAVERNS',era:'DIAMOND PORTAL → CRYSTAL QUARRY',motifs:'FACETS · CRYSTAL COLUMNS · REFRACTION · DATA VEINS · MIRROR POOLS',accent:'#00ffff',sky:'#020b17',haze:'#6f38ff',floorA:'#082f3b',floorB:'#041b27',wall:'#165267',neon:'#00ffff',weather:'✦',weatherColor:'#8ffcff',wallChars:['◆','▒','·']},
  winter:{label:'RED LABYRINTH',era:'TESSERACT PORTAL → 4D REACTOR',motifs:'NESTED CUBES · IMPOSSIBLE STAIRS · RED GRID · REACTOR CORE · AXIS GATES',accent:'#ff3b3b',sky:'#100205',haze:'#ff003c',floorA:'#351018',floorB:'#1d080d',wall:'#541923',neon:'#ff3b3b',weather:'+',weatherColor:'#ff687b',wallChars:['█','╳','·']},
  light:{label:'K-01 ORBITAL',era:'ROCKET PORTAL → SPACE STATION',motifs:'DOCKING RING · AIRLOCKS · SOLAR ARRAYS · OBSERVATION DOME · EVA LANE',accent:'#ffb000',sky:'#00040d',haze:'#00ffff',floorA:'#111b28',floorB:'#07101c',wall:'#505968',neon:'#ffb000',weather:'·',weatherColor:'#d8efff',wallChars:['□','▓','·']},
  dark:{label:'LUNAR OUTPOST',era:'MOON PORTAL → LUNAR SURFACE',motifs:'CRATERS · REGOLITH · LANDER · EARTHRISE · LOW GRAVITY · HAB DOME',accent:'#d8e6ff',sky:'#000107',haze:'#324b6a',floorA:'#3a3f48',floorB:'#252a31',wall:'#515a66',neon:'#d8e6ff',weather:'·',weatherColor:'#a7bad1',wallChars:['░','▒','·']}
};
const DOOR_SCENE:Record<string,SceneId>={'1':'spring','2':'summer','3':'autumn','4':'winter','5':'light','6':'dark'};
const DOOR_COLOR:Record<string,string>={'1':'#ffb000','2':'#00ff91','3':'#00ffff','4':'#ff3b3b','5':'#ffb000','6':'#d8e6ff'};

type Billboard={x:number;y:number;t:string[];c:string};

const GALLERY_MOTIFS:Billboard[]=[
  {x:24,y:10.4,t:['        .-=====-.','     .-╱  ✥  ╲-.','    ╱  ╲  │  ╱  ╲','   │ ╲  ╲ │ ╱  ╱ │','   │───╲─◎─╱───│','    ╲  ╱  │  ╲  ╱','     ╲___K___╱','  ROSE WINDOW // K'],c:'#b86bff'},
  {x:19.5,y:3.0,t:['K//GALLERY','T H E   E M R L D','TEN YEARS // HANDS ON'],c:'#d892ff'},
  {x:31.5,y:3.4,t:['ART','SURVIVES','STILL','SYSTEMS','REMEMBER'],c:'#caa7ff'},
  {x:24,y:12.2,t:['╔════════════════════╗','║      THE EMRLD     ║','║ BUILD WHAT YOU NEED║','║ VERIFY WHAT YOU SHIP║','║ LEAVE RECEIPTS     ║','╚════════════════════╝'],c:'#a87cff'},
  {x:30.5,y:13.5,t:['┌─────────────┐','│ > ART       │','│ > SYSTEMS   │','│ > SURVIVES  │','│ > STILL     │','│ > _         │','└─────────────┘'],c:'#00ff91'},
  {x:17.0,y:13.7,t:['[ ART ]','[ MEMORY ]','[ RESEARCH ]','[ OPERATIONS ]','[ STILL HERE ]'],c:'#ff5ee1'},
  {x:24,y:8.2,t:['       ╭─╮','    ╭──┤●├──╮','  ╭─┤  ╰┬╯  ├─╮','  │ ╰───┼───╯ │','╭─┴─────┼─────┴─╮','│ RESIDUAL ORRERY│','│ AGENTS / EVIDENCE│','╰────────────────╯'],c:'#c686ff'},
  {x:17.0,y:10.6,t:['╔═ CERT WALL ═╗','║ CCNA        ║','║ SECURITY+   ║','║ LINUX+      ║','║ NETWORK+    ║','╚═════════════╝'],c:'#00d9ff'},
  {x:31.0,y:10.6,t:['╔═ WORK WALL ═╗','║ FACTORY IT  ║','║ NETWORKING  ║','║ SECURITY    ║','║ AI / R&D    ║','╚═════════════╝'],c:'#00ff91'},
  {x:20.2,y:6.8,t:['┌─ COMMANDMENT ─┐','│ NO CLAIM      │','│ WITHOUT       │','│ EVIDENCE      │','└───────────────┘'],c:'#ff3bd4'},
  {x:27.8,y:6.8,t:['┌─ OPERATOR ────┐','│ HUMAN GATE    │','│ FAIL CLOSED   │','│ REPLAY FIRST  │','└───────────────┘'],c:'#ffb000'}
];
const LANDMARKS:Record<SceneId,Billboard[]>={
  spring:[
    {x:19,y:31.6,t:['🌴 PALM COLONNADE 🌴','│╲│╱│╲│╱│','│ ☼ │ ~ │ ☼ │','LAGOON WALK'],c:'#ffd36a'},
    {x:29,y:35.7,t:['╭─ WATERFALL ─╮','│ ≋ ≋ ≋ ≋ ≋ │','│  SOL SHRINE │','╰────╥────────╯'],c:'#00d9ff'}
  ],
  summer:[
    {x:19,y:31.8,t:['╭──◎──◎──◎──╮','│ HALO CANAL │','│ ≈≈≈≈≈≈≈≈≈ │','╰──◎──◎──◎──╯'],c:'#00ff91'},
    {x:29,y:35.5,t:['LOOP BRIDGE','╭────◎────╮','╰────◎────╯','VINES // LIVE'],c:'#65ffbd'}
  ],
  autumn:[
    {x:19,y:31.7,t:['◇ SHARD FOREST ◇','╱╲  ╱╲  ╱╲','◆│  ◇│  ◆│','╲╱  ╲╱  ╲╱'],c:'#00ffff'},
    {x:29,y:35.6,t:['REFRACTOR GATE','◇╲   │   ╱◇','  ╲  │  ╱','───╲◆╱───'],c:'#8ffcff'}
  ],
  winter:[
    {x:19,y:31.7,t:['AXIS GATE','XW // YZ // XZ','╔═╗ ╔═╗ ╔═╗','╚═╝╔═╩═╗╚═╝'],c:'#ff3b3b'},
    {x:29,y:35.5,t:['REACTOR//4D','[■■■■■■■■]','[■  ◇   ■]','[■■■■■■■■]'],c:'#ff687b'}
  ],
  light:[
    {x:19,y:31.8,t:['AIRLOCK K-01','╔═══╤═══╗','║   │   ║','╚═══╧═══╝','PRESSURE // OK'],c:'#ffb000'},
    {x:29,y:35.5,t:['DOCKING RING','◎────◎────◎','   STARFIELD','·  *   ·  *'],c:'#00ffff'}
  ],
  dark:[
    {x:19,y:31.8,t:['CRATER RIDGE','___○____○___','__○___○_____','LOW-G // 0.16'],c:'#d8e6ff'},
    {x:29,y:35.5,t:['HAB DOME','  .-────-.',' /  ◉  ◉  \\','│  LIFE OK  │',' \________/'],c:'#a7bad1'}
  ]
};

function makeMap(){
  const rep=(c:string,n:number)=>c.repeat(n);
  const rows:string[]=[
    rep('#',48),
    rep('#',48),
    rep('#',12)+'SSSSSSSSWWWWWWWWSSSSSSSS'+rep('#',12),
    rep('#',12)+'S'+'A'+rep(' ',9)+'CC'+rep(' ',9)+'A'+'S'+rep('#',12),
    rep('#',12)+'S'+rep(' ',22)+'S'+rep('#',12),
    rep('#',12)+'S'+'    P            P    '+'S'+rep('#',12),
    rep('#',12)+'W'+'1'+rep(' ',20)+'2'+'W'+rep('#',12),
    rep('#',12)+'S'+rep(' ',22)+'S'+rep('#',12),
    rep('#',12)+'S'+'    P            P    '+'S'+rep('#',12),
    rep('#',12)+'W'+'3'+rep(' ',20)+'4'+'W'+rep('#',12),
    rep('#',12)+'S'+rep(' ',22)+'S'+rep('#',12),
    rep('#',12)+'S'+'    P            P    '+'S'+rep('#',12),
    rep('#',12)+'W'+'5'+rep(' ',20)+'6'+'W'+rep('#',12),
    rep('#',12)+'S'+rep(' ',22)+'S'+rep('#',12),
    rep('#',12)+'S'+'    P            P    '+'S'+rep('#',12),
    rep('#',12)+'SSSSSSSSSSS'+'  '+'SSSSSSSSSSS'+rep('#',12),
    rep('#',21)+rep('.',6)+rep('#',21),
    rep('#',21)+rep('.',6)+rep('#',21),
    rep('#',20)+'N'+rep('.',6)+'N'+rep('#',20),
    rep('#',21)+rep('.',6)+rep('#',21),
    rep('#',21)+rep('.',6)+rep('#',21),
    rep('#',20)+'N'+rep('.',6)+'N'+rep('#',20),
    rep('#',21)+rep('.',6)+rep('#',21),
    rep('#',21)+rep('.',6)+rep('#',21),
    rep('#',3)+rep('.',42)+rep('#',3),
    rep('#',3)+rep('.',9)+'NN'+rep('.',20)+'NN'+rep('.',9)+rep('#',3),
    rep('#',3)+rep('.',9)+'NN'+rep('.',20)+'NN'+rep('.',9)+rep('#',3),
    rep('#',3)+rep('.',42)+rep('#',3),
    rep('#',21)+rep('.',6)+rep('#',21),
    rep('#',20)+'N'+rep('.',6)+'N'+rep('#',20),
    rep('#',21)+rep('.',6)+rep('#',21),
    rep('#',21)+rep('.',6)+rep('#',21),
    rep('#',20)+'N'+rep('.',6)+'N'+rep('#',20),
    rep('#',21)+rep('.',6)+rep('#',21),
    rep('#',6)+rep('.',36)+rep('#',6),
    rep('#',6)+rep('.',36)+rep('#',6),
    rep('#',6)+rep('.',36)+rep('#',6),
    rep('#',48),
    rep('#',48),
    rep('#',48)
  ];
  // Parked car in lower city plaza. Interact to enter K//DRIVE.
  const carX=38,carY=26;
  rows[carY]=rows[carY].slice(0,carX)+'V'+rows[carY].slice(carX+1);
  return rows;
}
const MAP=makeMap();
const COLORS:Record<string,string>={'#':'#31394c',N:'#d73cff',S:'#8e8aa3',W:'#b86bff',G:'#69517e',A:'#d9a83e',C:'#00ff66',P:'#75529f',V:'#00d9ff',...DOOR_COLOR};
const SIGNS=[
  {x:15.8,y:15.4,t:['╔══════════════════╗','║ K//THE EMRLD     ║','║ BUILD · VERIFY   ║','╚══════════════════╝'],c:'#b86bff'},
  {x:24,y:17.8,t:['┌────────────────┐','│ TECHOPS//OPS   │','│ QUEUE 170 → 15 │','│ EVIDENCE > EGO │','└────────────────┘'],c:'#00ff66'},
  {x:8.6,y:21,t:['┌────────────────┐','│ NETWORK FORENSIC│','│ MAC → PORT → HOST│','│ DHCP//TRACE     │','└────────────────┘'],c:'#00d9ff'},
  {x:31.4,y:21,t:['┌────────────────┐','│ RESIDUAL//RT    │','│ RECEIPTS > CLAIMS│','│ VERIFY · REPLAY │','└────────────────┘'],c:'#ff3bd4'},
  {x:10.5,y:26.2,t:['╔═ PRODUCTION ═╗','║ P2 RECOVERY  ║','║ PLATING//UP  ║','║ NEVER SLEEPS ║','╚══════════════╝'],c:'#ffb000'},
  {x:37,y:26.2,t:['╔═ FACTORY NET ═╗','║ CLOSET REFRESH║','║ WIRELESS MAP  ║','║ NIGHT SHIFT   ║','╚═══════════════╝'],c:'#00ff91'},
  {x:9,y:31.5,t:['┌─ ROOFBOT ─────┐','│ PERMITS → LEADS│','│ MAP / POSTGIS │','│ PALANROOF     │','└───────────────┘'],c:'#f5b342'},
  {x:38,y:31.5,t:['┌─ VECTOR LAB ──┐','│ ANGEL^3       │','│ VISION → SKILL│','│ SAFETY / MESH │','└───────────────┘'],c:'#00e5ff'},
  {x:13,y:35.0,t:['[ TECHOPS HERO ]','EVERY TICKET','IS A DUNGEON','NEW HAVEN//NIGHT'],c:'#7dff68'},
  {x:35,y:35.0,t:['[ RESEARCH BENCH ]','AX // M6 // RAC','CHALLENGE CLAIMS','PRESERVE EVIDENCE'],c:'#ff4ad8'},
  {x:24,y:3.55,t:['╔══════════════════╗','║ K TERMINAL // 01 ║','║ APSE COMMAND     ║','║ HUMAN GATE: ARMED║','╚══════════════════╝'],c:'#00ff66'}
];
const DOOR_SIGNS=[
  {x:13.7,y:6.5,t:['[1] ☉ SUN','TROPICAL TEMPLE'],c:DOOR_COLOR['1']},
  {x:34.3,y:6.5,t:['[2] TORUS','EMERALD HALO'],c:DOOR_COLOR['2']},
  {x:13.7,y:9.5,t:['[3] ◇ DIAMOND','PRISM CAVERNS'],c:DOOR_COLOR['3']},
  {x:34.3,y:9.5,t:['[4] TESSERACT','RED LABYRINTH'],c:DOOR_COLOR['4']},
  {x:13.7,y:12.5,t:['[5] △ ROCKET','K-01 ORBITAL'],c:DOOR_COLOR['5']},
  {x:34.3,y:12.5,t:['[6] ☽ MOON','LUNAR OUTPOST'],c:DOOR_COLOR['6']}
]
const SCENE_ARCHITECTURE:Record<SceneId,Billboard[]>={
  spring:[
    {x:17,y:34.5,t:['        ☼','    _\  |  /_','  _/  \ | /  \_',' /  🌴 \|/ 🌴  \\','│~~~ SOL LAGOON ~~~│','│  BASALT TEMPLE   │','╰──────┬───────────╯','       │',' TROPICAL TEMPLE'],c:'#ffb000'},
    {x:31,y:33.0,t:['  🌴     🌴',' ╱│╲   ╱│╲','  │  ~~~ │','╭─┴──────┴─╮','│ SOLAR ALTAR│','│  ☼  ☼  ☼  │','╰───────────╯'],c:'#ffd36a'}
  ],
  summer:[
    {x:17,y:34.5,t:['      ╭────────╮','   ╭──╯  ◎◎  ╰──╮',' ╭─╯ ◎  ╭──╮  ◎ ╰─╮',' │ ◎   ╭╯  ╰╮   ◎ │',' │  EMERALD HALO  │',' ╰─╮ ◎  ╰──╯  ◎ ╭─╯','   ╰──╮      ╭──╯','      ╰──────╯'],c:'#00ff91'},
    {x:31,y:33.2,t:['❧╲  ◎  ╱❧','  ╲◎◎╱','◎──╬──◎','  ╱◎◎╲','❧╱  ◎  ╲❧','BIO-CIRCUIT','RING GARDEN'],c:'#65ffbd'}
  ],
  autumn:[
    {x:17,y:34.2,t:['        ◇','       ╱╲','      ╱◇ ╲','   ◇ ╱____╲ ◇','    ╱╲ ◇ ╱╲','   ╱__╲╱╲__╲','  PRISM CATHEDRAL','  CYAN QUARRY'],c:'#00ffff'},
    {x:31,y:33.4,t:['◇  ◇   ◆  ◇',' ╲│╱ ╲│╱','──◆──◇──◆──',' ╱│╲ ╱│╲','◆  ◇   ◆  ◇','DATA VEINS','REFRACTION FIELD'],c:'#8ffcff'}
  ],
  winter:[
    {x:17,y:34.4,t:['╔════════════╗','║ ╔════════╗ ║','║ ║ ╔════╗ ║ ║','║ ║ ║ ◇  ║ ║ ║','║ ║ ╚════╝ ║ ║','║ ╚════════╝ ║','╚════════════╝','4D RED CORE'],c:'#ff3b3b'},
    {x:31,y:33.3,t:['  ╱────╲',' ╱ ╲  ╱ ╲','│ ╲ ╲╱ ╱ │','│  ╳  ╳  │','│ ╱ ╱╲ ╲ │',' ╲ ╱  ╲ ╱','  ╲────╱','IMPOSSIBLE STAIRS'],c:'#ff687b'}
  ],
  light:[
    {x:17,y:34.3,t:['        △','       ╱│╲','   ╔═══╧╧═══╗',' ╔═╩════════╩═╗',' ║ K-01 ORBITAL║',' ║  DOCK RING  ║',' ╚═╦════════╦═╝','   ║ AIRLOCK║','   ╚═══╤════╝','       │'],c:'#ffb000'},
    {x:31,y:33.0,t:['☼═══╦══════╦═══☼','    ║  ◉   ║',' ╔══╩══════╩══╗',' ║ OBSERVATION║',' ║    DOME    ║',' ╚══╦══════╦══╝','SOLAR ARRAY / EVA'],c:'#00ffff'}
  ],
  dark:[
    {x:17,y:34.5,t:['           ·','      _.-" "-._','   .-"   ☽    "-.','  /   ○      ○  \\',' │  LUNAR OUTPOST │',' │   [HAB]  [LAB] │','  \____╥____╥____/','       ║    ║','REGOLITH / CRATERS'],c:'#d8e6ff'},
    {x:31,y:33.1,t:['      .     *','  ___/\___',' /  LANDER  \\','│  /|\  /|\ │','╰──┴────┴──╯',' ○   ○   ○','EARTHRISE → ◉'],c:'#a7bad1'}
  ]
};
const REALM_RETURN_GATE:Billboard={x:24.5,y:30.2,t:['╔══════════════════╗','║ ← K//CITY RETURN ║','║ PROJECT DISTRICTS║','║ GALLERY // NORTH ║','╚══════════════════╝','        ↑'],c:'#00ff66'};
const PROJECT_STRUCTURES:Billboard[]=[
  {x:16,y:18.8,t:['       ╱╲','      ╱  ╲','  ╔══╧════╧══╗','  ║ RESIDUAL ║','╔═╩══════════╩═╗','║ RECEIPT HALL ║','║ OBSERVE      ║','║ VERIFY       ║','║ REPLAY       ║','╚══════╤═══════╝','       │'],c:'#ff3bd4'},
  {x:32,y:18.8,t:['    ┌─┬─┬─┐','  ┌─┘ │ │ └─┐','  │ VECTOR  │','  │ ANGEL^3 │','  │ ◉  ◇  ◉ │','  └──┬───┬──┘','     ╰─┬─╯',' ROBOTICS LAB'],c:'#00d9ff'},
  {x:8,y:25.5,t:['   ╱╲  ╱╲',' _╱__╲╱__╲_','│ ROOFSCAN  │','│ ▦ ▦ ▦ ▦   │','│ PERMIT MAP│','└────┬──────┘',' PALANROOF'],c:'#f5b342'},
  {x:40,y:25.5,t:['╔═══════════╗','║ TECHOPS   ║','║   HERO    ║','║ O I H E V ║','║ TICKET//XP║','╚════╤══════╝',' RPG ARCADE'],c:'#7dff68'},
  {x:16,y:27.2,t:['╔═ RESEARCH ═╗','║ AX-21      ║','║ M6 BENCH   ║','║ RAC / CTM  ║','║ PREREG     ║','╚════╤═══════╝',' EVIDENCE LAB'],c:'#b86bff'},
  {x:32,y:27.2,t:['┌─ SWARM DOCK ─┐','│ KIMI / MOON  │','│ LOCAL MODELS │','│ API DELEGATE │','│ AGENT MESH   │','└──────┬───────┘'],c:'#00ff91'},
  {x:24,y:22.6,t:['        ╱╲','       ╱  ╲','   ╔═══╧══╧═══╗','   ║ FACTORY  ║','╔══╩══════════╩══╗','║ INFRA / SEC / AI║','║ PRINT · WIFI    ║','║ CLOCKS · CLOSETS║','╚═══════╤════════╝','        │'],c:'#a7a0ff'}
];
const CAR_SIGN:Billboard={x:38,y:26,t:['   ______',' _/|_||_\\`.__','(   _    _ _\\','=`-(_)--(_)-\'',' K//DRIVE · ⚑',' [E] ENTER'],c:'#00d9ff'};

function sceneWallGlyph(scene:SceneId,ix:number,iy:number,sx:number,sy:number,top:number,bot:number,time:number,fallback:string){
  const h=Math.max(1,bot-top),v=(sy-top)/h,p=(ix*7+iy*11+sx)%19;
  switch(scene){
    case 'spring':
      if(v>.16&&v<.23&&p===0)return '☼';
      if(v>.55&&p===3)return '│';
      if(v>.72&&p===6)return '❧';
      if((sx+Math.floor(time*2))%31===0)return '~';
      return fallback;
    case 'summer':
      if(p===0)return '◎';
      if(v>.42&&v<.50&&p<3)return '○';
      if(v>.72&&p===5)return '❧';
      return fallback;
    case 'autumn':
      if(p===0)return '◇';
      if(p===4)return '╲';
      if(p===9)return '╱';
      if((sx+sy+Math.floor(time*2))%29===0)return '✦';
      return fallback;
    case 'winter':
      if(p===0)return '□';
      if(p===5)return '╳';
      if(v>.36&&v<.43&&p<3)return '═';
      if((sx*3+sy+Math.floor(time))%31===0)return '+';
      return fallback;
    case 'light':
      if(v<.2&&p===0)return '·';
      if(p===2)return '║';
      if(p===8)return '═';
      if(v>.65&&p===12)return '□';
      return fallback;
    case 'dark':
      if(v>.68&&p===0)return '○';
      if(v>.72&&p===7)return '_';
      if((sx*3+sy)%27===0)return '·';
      return fallback;
  }
}
function tile(x:number,y:number){const ix=Math.floor(x),iy=Math.floor(y);return ix<0||iy<0||ix>=W||iy>=H?'#':MAP[iy][ix];}
function solid(x:number,y:number){return '#NSWGACPV123456'.includes(tile(x,y));}
function cast(px:number,py:number,dx:number,dy:number,max=40):Hit{
  let mx=Math.floor(px),my=Math.floor(py),side=0;
  const ddx=Math.abs(1/(dx||1e-9)),ddy=Math.abs(1/(dy||1e-9));
  const sx=dx<0?-1:1,sy=dy<0?-1:1;
  let ax=dx<0?(px-mx)*ddx:(mx+1-px)*ddx,ay=dy<0?(py-my)*ddy:(my+1-py)*ddy;
  for(let i=0;i<128;i++){
    if(ax<ay){ax+=ddx;mx+=sx;side=0;}else{ay+=ddy;my+=sy;side=1;}
    if(mx<0||my<0||mx>=W||my>=H)return null;
    const t=MAP[my][mx];
    if(t!=='.'&&t!==' '){const d=side===0?ax-ddx:ay-ddy;return d>max?null:{tile:t,ix:mx,iy:my,dist:d,side};}
  }
  return null;
}
function norm(a:number){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;}
function dim(hex:string,k:number){const h=hex.slice(1);const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return 'rgb('+Math.round(r*k)+','+Math.round(g*k)+','+Math.round(b*k)+')';}
function area(x:number,y:number,scene:SceneId){if(y<6.2&&x>12&&x<36)return'APSE COMMAND // K TERMINAL';if(y<=15.8&&x>12&&x<36)return'K//GALLERY // ART + MEMORY NAVE';if(y>=REALM_THRESHOLD_Y)return SCENES[scene].label+' // PORTAL REALM';if(y<24)return'K//CITY INNER RING // PROJECT QUARTER';return'K//CITY CENTRAL // TECHOPS CROSSING';}
function mini(x:number,y:number,a:number){
  const w=19,h=9,px=Math.floor(x),py=Math.floor(y),dirs=['→','↘','↓','↙','←','↖','↑','↗'];const di=((Math.round(a/(Math.PI*2)*8)%8)+8)%8;const out:string[]=[];
  for(let j=0;j<h;j++){let row='';for(let i=0;i<w;i++){if(i===(w>>1)&&j===(h>>1)){row+=dirs[di];continue;}const mx=px-(w>>1)+i,my=py-(h>>1)+j;if(mx<0||my<0||mx>=W||my>=H){row+=' ';continue;}const t=MAP[my][mx];row+=t==='#'?'▓':t==='N'?'▒':t==='S'?'╬':t==='W'?'◆':t==='G'?'╫':t==='C'?'▣':t==='A'?'■':t==='P'?'●':t==='V'?'▰':DOOR_SCENE[t]?'□':'·';}out.push(row);}return out.join('\n');
}

const CSS='.kcity{position:fixed;inset:0;background:#04060c;color:#00ff66;font-family:'+FONT+';overflow:hidden}.kc-wrap{position:absolute;inset:0}.kc-wrap canvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair;image-rendering:pixelated}.kc-scan,.kc-vig{position:absolute;inset:0;pointer-events:none;z-index:8}.kc-scan{background:repeating-linear-gradient(to bottom,transparent 0 2px,rgba(0,0,0,.28) 2px 4px);mix-blend-mode:multiply}.kc-vig{background:radial-gradient(ellipse at center,transparent 42%,rgba(0,0,0,.62) 100%),radial-gradient(ellipse at 50% 110%,rgba(176,0,255,.09),transparent 55%)}.kc-gallery-glow{position:absolute;inset:0;z-index:7;pointer-events:none;background:linear-gradient(90deg,rgba(0,255,255,.025),transparent 28%,transparent 72%,rgba(255,0,255,.035)),radial-gradient(ellipse at 50% 115%,rgba(176,0,255,.14),transparent 48%);mix-blend-mode:screen}.kc-hud{position:absolute;z-index:12;left:12px;top:12px;border:1px solid #00ff6644;background:#000b;padding:8px 10px;font-size:10px;line-height:1.45;max-width:min(440px,62vw)}.kc-hud b,.kc-hud span,.kc-hud small{display:block}.kc-hud b{color:#00ff91}.kc-hud span{color:#00d9ff}.kc-hud small{color:#46705c}.kc-map{position:absolute;z-index:12;right:12px;top:12px;margin:0;border:1px solid #00ff6633;background:#000c;padding:7px;color:#59736a;font:8px/.95 monospace}.kc-cross{position:absolute;z-index:12;left:50%;top:50%;transform:translate(-50%,-50%);color:#00ff6699;text-shadow:0 0 8px #00ff66}.kc-ctl{position:absolute;z-index:12;left:12px;bottom:12px;border:1px solid #00ff6633;background:#000b;padding:7px 9px;color:#4c8268;font-size:9px;line-height:1.45}.kc-ctl b{color:#00ff91}.kc-prompt,.kc-lock{position:absolute;z-index:13;left:50%;transform:translateX(-50%);background:#000d;font:10px monospace;letter-spacing:.14em;padding:8px 12px;cursor:pointer}.kc-prompt{bottom:82px;border:1px solid #00ff66;color:#bfffd8;box-shadow:0 0 20px #00ff6633}.kc-lock{bottom:31%;border:1px solid #00d9ff88;color:#00d9ff}.kc-note{position:absolute;z-index:14;left:50%;top:13%;transform:translateX(-50%);border:1px solid #00ff66;background:#020805ed;padding:8px 12px;color:#00ff91;font-size:9px;letter-spacing:.09em;text-align:center}.kc-boot{position:absolute;z-index:30;inset:0;background:#04060cf5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:18px}.kc-logo{font-size:clamp(34px,8vw,88px);letter-spacing:.12em;color:#b86bff;text-shadow:0 0 24px #8f4dff}.kc-boot pre{color:#00ff91;line-height:1.7;font-size:11px}.kc-boot button{background:#06030b;border:1px solid #00ff66;color:#00ff91;padding:11px 22px;font:11px monospace;letter-spacing:.22em;cursor:pointer;box-shadow:0 0 18px #00ff6633}.kc-terminal{position:absolute;inset:0;z-index:40;background:#000;transition:opacity .16s ease}.kc-terminal-open{opacity:1;visibility:visible;pointer-events:auto}.kc-terminal-hidden{opacity:0;visibility:hidden;pointer-events:none}.kc-terminal .kt-body{height:100dvh}.kc-nowplaying{position:absolute;z-index:13;left:12px;bottom:58px;border:1px solid #b000ff66;background:#05020bcc;padding:6px 9px;color:#d8a6ff;font-size:8px;letter-spacing:.08em;max-width:52vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kc-nowplaying b{color:#00ffff}.kc-drive-dashboard{position:absolute;z-index:15;left:50%;bottom:0;transform:translateX(-50%);width:min(720px,94vw);height:118px;border:2px solid #00d9ff;background:linear-gradient(#051015e8,#020507f5);box-shadow:0 -10px 35px #00d9ff18,inset 0 0 28px #00d9ff12;padding:8px 14px;display:grid;grid-template-columns:150px 1fr 150px;align-items:center;gap:12px;color:#00d9ff}.kc-drive-dashboard pre{margin:0;color:#ff315f;font:10px/1 monospace;text-align:center;text-shadow:0 0 8px #ff315f}.kc-drive-center{text-align:center;font-size:10px;line-height:1.5}.kc-drive-center b{display:block;color:#fff}.kc-drive-gauge{text-align:right;color:#00ff91;font-size:9px}.kc-flight-hud{position:absolute;z-index:15;right:12px;bottom:58px;border:1px solid #fff0a888;background:#07161bdd;padding:8px 10px;color:#fff0a8;font-size:9px;line-height:1.45;text-align:right}.kc-flight-toggle{position:absolute;z-index:15;right:12px;bottom:12px;border:1px solid #fff0a8;background:#07161be8;color:#fff0a8;padding:7px 10px;font:9px monospace;cursor:pointer}.kc-audio-arm{position:fixed;z-index:55;left:50%;bottom:96px;transform:translateX(-50%);border:1px solid #00ffff;background:#020509ee;color:#00ffff;padding:9px 13px;font:9px monospace;letter-spacing:.08em;box-shadow:0 0 18px #00ffff33}.kc-gallery-art-note{position:absolute;z-index:12;right:12px;bottom:12px;color:#7e6597;font-size:7px}@media(max-width:700px){.kc-hud{font-size:8px;left:6px;top:6px;padding:6px}.kc-map{right:6px;top:6px;font-size:6px}.kc-ctl{left:6px;bottom:6px;font-size:7px;max-width:72%}.kc-prompt{bottom:68px;font-size:8px}.kc-lock{bottom:26%;font-size:8px}.kc-note{top:18%;width:82%;font-size:8px}.kc-logo{font-size:34px}.kc-boot pre{font-size:9px}.kc-nowplaying{left:6px;bottom:46px;font-size:7px;max-width:70vw}.kc-drive-dashboard{height:96px;grid-template-columns:90px 1fr 80px;padding:6px}.kc-drive-dashboard pre{font-size:7px}.kc-drive-center,.kc-drive-gauge{font-size:7px}.kc-flight-hud{right:6px;bottom:48px;font-size:7px}.kc-flight-toggle{right:6px;bottom:6px;font-size:7px}}';

export default function AsciiCityWorld(){
  const [params,setParams]=useSearchParams(),back=params.get('spawn')==='console',portal=params.get('spawn')==='portal';
  const queryScene=params.get('scene') as SceneId|null;
  const initialScene:SceneId=queryScene&&SCENES[queryScene]?queryScene:'spring';
  const wrap=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),keys=useRef<Record<string,boolean>>({});
  const artImagesRef=useRef<Map<string,HTMLImageElement>>(new Map());
  const phase=useRef<Phase>('explore'),anim=useRef(0),termRef=useRef(false),target=useRef<{kind:'console'|'relic'|'door'|'car';scene?:SceneId}|null>(null),lastPaint=useRef(0),lastHud=useRef(0);
  const touchMove=useRef({id:-1,x0:0,y0:0,dx:0,dy:0}),touchLook=useRef({id:-1,x:0,y:0});
  const vehicleRef=useRef(false),flightRef=useRef(false),audioMsRef=useRef(0),audioPlayingRef=useRef(false),audioEnergyRef=useRef(0),portableTerminalRef=useRef(false),cueRef=useRef<KAudioZone>(back?'gallery-turnaround':portal?initialScene:'city'),galleryReturnUntil=useRef(back?performance.now()+12000:0);
  const start=back?RETURN:portal?PORTAL_SPAWN:SPAWN,cam=useRef<Cam>({x:start.x,y:start.y,ang:start.a,pitch:0,height:1.55}),seatFrom=useRef({x:RETURN.x,y:RETURN.y,ang:RETURN.a,h:1.55});
  const [scene,setScene]=useState<SceneId>(initialScene);
  const [audioCue,setAudioCueState]=useState<KAudioZone>(back?'gallery-turnaround':portal?initialScene:'city');
  const [nowPlaying,setNowPlaying]=useState('');
  const [vehicle,setVehicle]=useState(false),[flight,setFlight]=useState(false);
  const [booted,setBooted]=useState(back||portal),[terminal,setTerminal]=useState(false),[locked,setLocked]=useState(false),[notice,setNotice]=useState(back?'SESSION CLOSED // APSE CONSOLE // TURN AROUND TO EXPLORE K//CITY':portal?'PORTAL LINK // '+SCENES[initialScene].label+' // '+SCENES[initialScene].era:'');
  const [hud,setHud]=useState({area:area(start.x,start.y,initialScene),prompt:null as string|null,fps:0,x:start.x,y:start.y,ang:start.a});termRef.current=terminal;vehicleRef.current=vehicle;flightRef.current=flight;

  const setAudioCue=useCallback((cue:KAudioZone)=>{
    if(cueRef.current===cue)return;
    cueRef.current=cue;
    setAudioCueState(cue);
  },[]);

  const resize=useCallback(()=>{const c=canvas.current,w=wrap.current;if(!c||!w)return;const d=Math.min(2,window.devicePixelRatio||1),ww=w.clientWidth,hh=w.clientHeight;c.width=Math.floor(ww*d);c.height=Math.floor(hh*d);c.style.width=ww+'px';c.style.height=hh+'px';c.getContext('2d')?.setTransform(d,0,0,d,0,0);},[]);
  useEffect(()=>{resize();window.addEventListener('resize',resize);const t=window.setTimeout(()=>setNotice(''),4200);return()=>{window.removeEventListener('resize',resize);window.clearTimeout(t);};},[resize]);
  useEffect(()=>{
    const img=new Image();
    img.decoding='async';
    img.src=K_GALLERY_ATLAS;
    const images=new Map<string,HTMLImageElement>();
    K_GALLERY_ART.forEach((piece)=>images.set(piece.id,img));
    artImagesRef.current=images;
    return()=>{artImagesRef.current.clear();};
  },[]);
  const lock=useCallback(()=>{if(termRef.current)return;try{const p=canvas.current?.requestPointerLock?.();if(p&&typeof (p as Promise<void>).catch==='function')(p as Promise<void>).catch(()=>{});}catch(_){}},[]);
  const sit=useCallback(()=>{if(phase.current!=='explore')return;portableTerminalRef.current=false;const c=cam.current;seatFrom.current={x:c.x,y:c.y,ang:c.ang,h:c.height};anim.current=0;phase.current='sitting';document.exitPointerLock?.();},[]);
  const openPortableTerminal=useCallback(()=>{if(phase.current!=='explore'||terminal)return;portableTerminalRef.current=true;document.exitPointerLock?.();phase.current='seated';setTerminal(true);termRef.current=true;setNotice('K TERMINAL // PORTABLE OVERLAY // AUDIO AUTHORITY ONLINE');},[terminal]);
  const exit=useCallback(()=>{
    setTerminal(false);termRef.current=false;
    if(portableTerminalRef.current){portableTerminalRef.current=false;phase.current='explore';setNotice('K TERMINAL CLOSED // AUDIO CONTINUES');window.setTimeout(()=>setNotice(''),2200);return;}
    anim.current=0;phase.current='standing';galleryReturnUntil.current=performance.now()+12000;setAudioCue('gallery-turnaround');setNotice('K TERMINAL CLOSED // BACK AT APSE // TURN AROUND');window.setTimeout(()=>setNotice(''),3500);
  },[setAudioCue]);
  const returnToGallery=useCallback(()=>{
    setTerminal(false);termRef.current=false;portableTerminalRef.current=false;phase.current='explore';document.exitPointerLock?.();
    cam.current={x:RETURN.x,y:RETURN.y,ang:RETURN.a,pitch:0,height:1.55};
    galleryReturnUntil.current=performance.now()+12000;setAudioCue('gallery-turnaround');
    setNotice('GALLERY APSE // TURN AROUND // 4DADNM SIGNAL');
    window.setTimeout(()=>setNotice(''),3600);
  },[setAudioCue]);
  const enterScene=useCallback((next:SceneId)=>{setScene(next);setParams({scene:next,spawn:'portal'},{replace:true});setTerminal(false);termRef.current=false;portableTerminalRef.current=false;setVehicle(false);vehicleRef.current=false;setFlight(false);flightRef.current=false;setAudioCue(next);phase.current='explore';document.exitPointerLock?.();cam.current={x:PORTAL_SPAWN.x,y:PORTAL_SPAWN.y,ang:PORTAL_SPAWN.a,pitch:0,height:1.55};seatFrom.current={x:RETURN.x,y:RETURN.y,ang:RETURN.a,h:1.55};setNotice('PORTAL '+next.toUpperCase()+' // '+SCENES[next].label+' // K TERMINAL AUTO DJ');window.setTimeout(()=>setNotice(''),3600);},[setParams,setAudioCue]);
  const toggleFlight=useCallback(()=>{if(scene!=='light'){setNotice('EVA MODE // AVAILABLE ONLY AT ROCKET / K-01 ORBITAL');window.setTimeout(()=>setNotice(''),2200);return;}const next=!flightRef.current;flightRef.current=next;setFlight(next);setVehicle(false);vehicleRef.current=false;cam.current.height=next?2.75:1.55;cam.current.pitch=next?-5:0;setAudioCue(next?'flight':'light');setNotice(next?'EVA MODE // MIRROR PLANE // [F] RETURN':'AIRLOCK REENTRY // K-01 ORBITAL');window.setTimeout(()=>setNotice(''),2600);},[scene,setAudioCue]);
  const interact=useCallback(()=>{if(phase.current!=='explore')return;if(vehicleRef.current){vehicleRef.current=false;setVehicle(false);setAudioCue(scene);setNotice('K//DRIVE EXITED // FLAG SIGNAL RELEASED');window.setTimeout(()=>setNotice(''),2200);return;}const t=target.current;if(!t)return;if(t.kind==='console')sit();else if(t.kind==='relic'){setNotice('SIGNAL SCRIPTURE // ARCHIVE LINK VERIFIED');window.setTimeout(()=>setNotice(''),2200);}else if(t.kind==='door'&&t.scene)enterScene(t.scene);else if(t.kind==='car'){vehicleRef.current=true;setVehicle(true);flightRef.current=false;setFlight(false);cam.current.height=1.25;setAudioCue('car');setNotice('K//DRIVE ONLINE // ⚑ FLAG ON DASH // [E] EXIT VEHICLE');window.setTimeout(()=>setNotice(''),3000);}},[sit,enterScene,setAudioCue,scene]);

  useEffect(()=>{const down=(e:KeyboardEvent)=>{const el=e.target as HTMLElement|null;if(el&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA'||el.isContentEditable))return;const k=e.key.toLowerCase();keys.current[k]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='e')interact();if(k==='f')toggleFlight();if(k==='t'&&!termRef.current)openPortableTerminal();if(k==='escape'&&termRef.current)exit();};const up=(e:KeyboardEvent)=>{keys.current[e.key.toLowerCase()]=false;};const pl=()=>setLocked(document.pointerLockElement===canvas.current);const mm=(e:MouseEvent)=>{if(document.pointerLockElement!==canvas.current||phase.current!=='explore')return;cam.current.ang+=e.movementX*.00235;cam.current.pitch=Math.max(-13,Math.min(13,cam.current.pitch-e.movementY*.07));};window.addEventListener('keydown',down);window.addEventListener('keyup',up);document.addEventListener('pointerlockchange',pl);document.addEventListener('mousemove',mm);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);document.removeEventListener('pointerlockchange',pl);document.removeEventListener('mousemove',mm);};},[interact,exit,toggleFlight,openPortableTerminal]);

  const ts=useCallback((e:React.TouchEvent)=>{const half=window.innerWidth/2;for(const t of Array.from(e.changedTouches)){if(t.clientX<half&&touchMove.current.id===-1)touchMove.current={id:t.identifier,x0:t.clientX,y0:t.clientY,dx:0,dy:0};else if(touchLook.current.id===-1)touchLook.current={id:t.identifier,x:t.clientX,y:t.clientY};}},[]);
  const tm=useCallback((e:React.TouchEvent)=>{for(const t of Array.from(e.changedTouches)){if(t.identifier===touchMove.current.id){touchMove.current.dx=Math.max(-1,Math.min(1,(t.clientX-touchMove.current.x0)/65));touchMove.current.dy=Math.max(-1,Math.min(1,(t.clientY-touchMove.current.y0)/65));}else if(t.identifier===touchLook.current.id&&phase.current==='explore'){cam.current.ang+=(t.clientX-touchLook.current.x)*.0065;cam.current.pitch=Math.max(-13,Math.min(13,cam.current.pitch-(t.clientY-touchLook.current.y)*.13));touchLook.current.x=t.clientX;touchLook.current.y=t.clientY;}}},[]);
  const te=useCallback((e:React.TouchEvent)=>{for(const t of Array.from(e.changedTouches)){if(t.identifier===touchMove.current.id)touchMove.current={id:-1,x0:0,y0:0,dx:0,dy:0};if(t.identifier===touchLook.current.id)touchLook.current={id:-1,x:0,y:0};}},[]);

  const draw=useCallback((time:number,fps:number)=>{const c=canvas.current,w=wrap.current;if(!c||!w)return;const ctx=c.getContext('2d');if(!ctx)return;const ww=w.clientWidth,hh=w.clientHeight,targetCols=ww<700?94:ww<1100?120:154,fs=Math.max(7,(ww/targetCols)/.62);ctx.font=fs+'px '+FONT;const cw=ctx.measureText('M').width||fs*.62,ch=fs*1.03,cols=Math.max(48,Math.floor(ww/cw)),rows=Math.max(26,Math.floor(hh/ch)),chars=Array.from({length:rows},()=>Array(cols).fill(' ')),colors=Array.from({length:rows},()=>Array(cols).fill('#07101b')),zb=new Float32Array(cols),cc=cam.current,hor=Math.floor(rows*.49+cc.pitch-(cc.height-1.55)*1.8);
    const royal=cc.y<=15.9&&cc.x>12&&cc.x<36;
    const inRealm=!royal&&cc.y>=REALM_THRESHOLD_Y;
    const cfg=inRealm?SCENES[scene]:CITY_CONFIG;
    const audioTime=audioMsRef.current/1000,syncStep=Math.floor(audioMsRef.current/180),syncTime=audioMsRef.current>0?audioTime:time;
    const playing=audioPlayingRef.current;
    // SoundCloud exposes position rather than raw PCM/FFT. Build a deterministic
    // multi-band envelope from that authoritative clock so every subsystem stays
    // phase-locked through pause/resume without pretending this is spectral data.
    const kick=playing?Math.pow(Math.abs(Math.sin(syncTime*3.18)),7):0;
    const mid=playing?(Math.sin(syncTime*5.37+1.1)+1)*.5:0;
    const high=playing?(Math.sin(syncTime*11.7+2.4)+1)*.5:0;
    const audioEnergy=playing?Math.min(1,.48*kick+.32*mid+.20*high):0;
    audioEnergyRef.current=audioEnergy;
    const syncPulse=.64+.36*audioEnergy;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      if(y<hor){
        const weather=(x*17+y*7+syncStep)%Math.max(23,67-Math.floor(audioEnergy*28))===0,star=(x*41+y*13+Math.floor(syncTime))%Math.max(97,257-Math.floor(audioEnergy*100))===0;
        if(royal){
          // Tall neo-gothic gallery: lancet windows, balcony rails, suspended
          // spotlights and violet tracery modeled after the approved reference.
          const arch=Math.abs((x%30)-15)-Math.floor((hor-y)*.22)===0;
          const mullion=(x%10===0&&y>Math.max(1,hor-12));
          const balcony=y===Math.max(2,hor-7)&&x>cols*.42;
          const pendant=((x+3)%23===0&&y===Math.max(2,hor-3));
          chars[y][x]=arch?(x%2?'╲':'╱'):mullion?'│':balcony?'═':pendant?'▼':star?'·':' ';
          colors[y][x]=pendant?'#ff76df':balcony?'#8c4fc7':arch||mullion?'#76579e':'#100817';
        }else{
          // Distant modern high-rise skyline behind the raycast city canyon.
          const block=Math.floor(x/5),towerH=3+((block*11+7)%10),inTower=y>=hor-towerH&&y<hor;
          if(inTower){
            const edge=x%5===0||x%5===4,lit=((x+y+block)%7===0);
            chars[y][x]=edge?'│':lit?'▫':'▓';
            colors[y][x]=lit?dim(cfg.neon,syncPulse):dim(cfg.wall,.42);
          }else{
            chars[y][x]=weather?cfg.weather:star?'·':' ';
            colors[y][x]=weather?cfg.weatherColor:cfg.sky;
          }
        }
      }else{
        const chk=((Math.floor(x/3)+Math.floor((y-hor)/2))&1)===0;
        if(royal){
          const reflection=((x+syncStep)%29<2)||((x*3+syncStep)%41<2);
          const grout=(y-hor)%5===0||x%17===0;
          chars[y][x]=reflection?'≈':grout?'─':chk?'◇':'·';
          colors[y][x]=reflection?(x%2?'#00bfcf':'#c126ff'):grout?'#4d315f':chk?'#2d1d38':'#130f18';
        }else{
          const puddle=((x*5+y*3+syncStep)%19)<3;
          chars[y][x]=puddle?(scene==='dark'?'░':'≈'):scene==='autumn'?(chk?',':'·'):scene==='winter'?(chk?'·':'_'):scene==='light'?(chk?'·':'+'):(chk?'·':'░');
          colors[y][x]=puddle?dim(cfg.neon,.52):(chk?cfg.floorA:cfg.floorB);
        }
      }
    }
    for(let x=0;x<cols;x++){
      const rx=(x/Math.max(1,cols-1)-.5)*2,ra=cc.ang+rx*(FOV/2),dx=Math.cos(ra),dy=Math.sin(ra),hit=cast(cc.x,cc.y,dx,dy,45);
      if(!hit){zb[x]=999;continue;}
      const d=Math.max(.08,hit.dist*Math.cos(ra-cc.ang));zb[x]=d;
      const gothic='SWGACP123456'.includes(hit.tile);
      const heightScale=hit.tile==='V' ? .44 : gothic ? 1.16 : (hit.tile==='N' ? 2.05 : 1.72);
      const altitudeScale=Math.max(.58,1-(cc.height-1.55)*.16);
      const wh=Math.min(rows*1.9,(rows*heightScale*altitudeScale)/d),top=Math.max(0,Math.floor(hor-wh*.58)),bot=Math.min(rows-1,Math.ceil(hor+wh*.42));
      const base=DOOR_COLOR[hit.tile]||COLORS[hit.tile]||(hit.tile==='N'?cfg.neon:cfg.wall);
      const generic=gothic?(d<3?['█','▓','▒']:d<7?['▓','▒','░']:['▒','░','·']):cfg.wallChars;
      for(let y=top;y<=bot;y++){
        const band=Math.floor((y-top)/Math.max(1,bot-top)*3);
        let glyph=generic[Math.min(2,band)];
        if(hit.tile==='S'){
          const relY=(y-top)/Math.max(1,bot-top),bay=(x+hit.ix)%12;
          glyph=relY<.18?(bay===0?'╱':bay===11?'╲':'═'):relY<.52?(bay===0?'║':bay===5||bay===6?'│':((y-top)%5===0?'─':'▓')):((y-top)%5===0?'═':(bay===0?'║':'▓'));
        }
        else if(hit.tile==='W'){
          const q=(x+y+hit.ix)%11;
          glyph=q===0?'◆':q===3?'╬':q===6?'◇':((y-top)%4===0?'─':'░');
        }
        else if(hit.tile==='P') glyph=((y-top)%4===0)?'╬':((x+hit.iy)%3===0?'║':'│');
        else if(hit.tile==='C') glyph=((x+y)%7===0)?'▣':'▓';
        else if(DOOR_SCENE[hit.tile]) glyph=(y===Math.round((top+bot)/2))?hit.tile:((x+y)%3===0?'◇':'▓');
        else if(hit.tile==='N') glyph=((y-top)%4===1)?(((x+hit.ix)%4===0)?'▣':'▫'):'▓';
        else if(hit.tile==='V') glyph=(y===Math.round((top+bot)/2))?'⚑':((x+y)%4===0?'▰':'▓');
        else if(hit.tile==='#') glyph=((y-top)%5===1&&((x+hit.ix+hit.iy)%5===0))?'▪':((y-top)%7===0?'─':glyph);
        if(inRealm&&!gothic&&hit.tile!=='V') glyph=sceneWallGlyph(scene,hit.ix,hit.iy,x,y,top,bot,syncTime,glyph);
        chars[y][x]=glyph;
        colors[y][x]=hit.side?dim(base,.70):base;
      }
    }
    const sceneSign={x:24.5,y:32.0,t:['['+scene.toUpperCase()+'] '+SCENES[scene].label,SCENES[scene].era],c:SCENES[scene].accent};
    const citySign:Billboard={x:24.5,y:23.3,t:['K//CITY // INNER RING','PROJECTS · OPERATIONS · R&D','GALLERY ↑ NORTH'],c:'#00ff66'};
    const allSigns=royal
      ? [...SIGNS,...DOOR_SIGNS,...GALLERY_MOTIFS]
      : inRealm
        ? [...SCENE_ARCHITECTURE[scene],...LANDMARKS[scene],REALM_RETURN_GATE,sceneSign]
        : [...SIGNS,...PROJECT_STRUCTURES,CAR_SIGN,citySign];
    for(const sg of allSigns){const dx=sg.x-cc.x,dy=sg.y-cc.y,d=Math.hypot(dx,dy);if(d<.3||d>18)continue;const rel=norm(Math.atan2(dy,dx)-cc.ang);if(Math.abs(rel)>FOV*.64)continue;const sx=Math.round((.5+rel/FOV)*cols),ci=Math.max(0,Math.min(cols-1,sx));if(d>zb[ci]+.6)continue;const sy=Math.round(hor-(rows*.28)/Math.max(1.1,d));sg.t.forEach((line,li)=>{const st=Math.round(sx-line.length/2);for(let q=0;q<line.length;q++){const xx=st+q,yy=sy+li;if(xx>=0&&xx<cols&&yy>=0&&yy<rows){chars[yy][xx]=line[q];colors[yy][xx]=sg.c;}}});}
    if(!royal){
      const movers=[
        {x:Math.floor(((syncTime*(9+audioEnergy*5))% (cols+24))-12),y:Math.max(1,hor-8),txt:'<DRONE-07>',c:'#00ffff'},
        {x:Math.floor(cols-((syncTime*(6+audioEnergy*4))% (cols+20))+10),y:Math.max(2,hor-4),txt:'==AIR.TAXI==>',c:'#ff3bd4'},
        {x:Math.floor(((syncTime*(4+audioEnergy*3))% (cols+30))-15),y:Math.min(rows-2,hor+5),txt:'[NIGHT BUS]',c:cfg.accent}
      ];
      for(const m of movers)for(let q=0;q<m.txt.length;q++){const xx=m.x+q,yy=m.y;if(xx>=0&&xx<cols&&yy>=0&&yy<rows&&zb[Math.max(0,Math.min(cols-1,xx))]>5){chars[yy][xx]=m.txt[q];colors[yy][xx]=m.c;}}
    }
    ctx.fillStyle='#04060c';ctx.fillRect(0,0,ww,hh);ctx.textBaseline='top';for(let y=0;y<rows;y++){let x=0;while(x<cols){const co=colors[y][x];let e=x+1;while(e<cols&&colors[y][e]===co)e++;const str=chars[y].slice(x,e).join('');if(str.trim()){ctx.fillStyle=co;ctx.fillText(str,x*cw,y*ch);}x=e;}}
    if(royal){
      for(const piece of K_GALLERY_ART){
        const img=artImagesRef.current.get(piece.id);
        if(!img||!img.complete||!img.naturalWidth)continue;
        const dx=piece.x-cc.x,dy=piece.y-cc.y,d=Math.hypot(dx,dy);
        if(d<.55||d>16)continue;
        const rel=norm(Math.atan2(dy,dx)-cc.ang);
        if(Math.abs(rel)>FOV*.58)continue;
        const screenX=(.5+rel/FOV)*ww;
        const ci=Math.max(0,Math.min(cols-1,Math.round(screenX/cw)));
        // The art positions are gallery wall anchors, not collision objects;
        // render when facing their wall sector instead of letting the raycaster
        // mistakenly occlude them behind the cathedral shell.
        const scale=Math.max(.24,Math.min(1.35,6.8/d));
        const ph=Math.max(58,piece.height*86*scale);
        const pw=Math.max(52,piece.width*86*scale);
        const px=screenX-pw/2;
        const py=hh*.46-ph*.56-(cc.height-1.55)*14;
        const pad=Math.max(4,Math.round(8*scale));
        const glow=8+26*audioEnergy;
        ctx.save();
        // Museum spotlight cone.
        const lampY=Math.max(6,py-24*scale);
        const grad=ctx.createLinearGradient(screenX,lampY,screenX,py+ph);
        grad.addColorStop(0,`rgba(255,230,205,${.10+.16*audioEnergy})`);
        grad.addColorStop(1,'rgba(255,230,205,0)');
        ctx.fillStyle=grad;
        ctx.beginPath();ctx.moveTo(screenX-5*scale,lampY);ctx.lineTo(px-10*scale,py+ph);ctx.lineTo(px+pw+10*scale,py+ph);ctx.closePath();ctx.fill();
        // Layered antique-gold frame like the reference.
        ctx.shadowColor=piece.accent;ctx.shadowBlur=glow;
        ctx.fillStyle='#070409';ctx.fillRect(px-pad*1.6,py-pad*1.6,pw+pad*3.2,ph+pad*3.2);
        ctx.strokeStyle='#b98a48';ctx.lineWidth=Math.max(2,3*scale);ctx.strokeRect(px-pad*1.35,py-pad*1.35,pw+pad*2.7,ph+pad*2.7);
        ctx.strokeStyle='#51361f';ctx.lineWidth=Math.max(1,1.5*scale);ctx.strokeRect(px-pad*.65,py-pad*.65,pw+pad*1.3,ph+pad*1.3);
        ctx.shadowBlur=0;
        ctx.drawImage(img,piece.sx,piece.sy,piece.sw,piece.sh,px,py,pw,ph);
        ctx.fillStyle='rgba(2,2,5,.9)';ctx.fillRect(px,py+ph-15*scale,pw,15*scale);
        ctx.font=`${Math.max(8,10*scale)}px ${FONT}`;
        ctx.fillStyle=piece.accent;ctx.fillText(piece.label+' // '+piece.title,px+5*scale,py+ph-12*scale);
        ctx.restore();
      }
    }
    if(royal){
      // Foreground installations from the reference: central armillary/pedestal,
      // side benches, CRT and hanging ART/SURVIVES/STILL banner.
      const pulse=audioEnergyRef.current;
      ctx.save();
      ctx.textAlign='center';ctx.textBaseline='middle';
      const cx=ww*.50,baseY=hh*.82;
      ctx.strokeStyle=`rgba(190,105,255,${.55+.35*pulse})`;ctx.lineWidth=1.5;
      for(let r=22;r<=54;r+=16){ctx.beginPath();ctx.ellipse(cx,baseY-58,r,r*.48,(syncTime*.18)+(r*.01),0,Math.PI*2);ctx.stroke();}
      ctx.fillStyle='#100a14';ctx.fillRect(cx-92,baseY-24,184,62);
      ctx.strokeStyle='#7c526f';ctx.strokeRect(cx-92,baseY-24,184,62);
      ctx.font=`${Math.max(9,ww*.008)}px ${FONT}`;ctx.fillStyle='#c48ce8';ctx.fillText('T H E   E M R L D',cx,baseY+1);
      ctx.font=`${Math.max(7,ww*.0055)}px ${FONT}`;ctx.fillStyle='#805b91';ctx.fillText('SOME THINGS DECAY · SOME THINGS REMAIN · SOME THINGS TRANSCEND',cx,baseY+20);
      ctx.textAlign='left';
      ctx.fillStyle='#09070b';ctx.fillRect(ww*.08,hh*.78,ww*.17,18);ctx.strokeStyle='#57314f';ctx.strokeRect(ww*.08,hh*.78,ww*.17,18);
      ctx.fillRect(ww*.73,hh*.78,ww*.17,18);ctx.strokeRect(ww*.73,hh*.78,ww*.17,18);
      ctx.fillStyle='#030a08';ctx.fillRect(ww*.86,hh*.70,ww*.11,hh*.16);ctx.strokeStyle='#00ff66';ctx.strokeRect(ww*.86,hh*.70,ww*.11,hh*.16);
      ctx.font=`${Math.max(7,ww*.006)}px ${FONT}`;ctx.fillStyle='#00ff66';ctx.fillText('> ART',ww*.87,hh*.73);ctx.fillText('> SURVIVES',ww*.87,hh*.76);ctx.fillText('> STILL',ww*.87,hh*.79);ctx.fillText('> _',ww*.87,hh*.82);
      ctx.fillStyle='rgba(42,12,48,.88)';ctx.fillRect(ww*.77,hh*.08,ww*.09,hh*.25);ctx.font=`${Math.max(8,ww*.006)}px ${FONT}`;ctx.fillStyle='#b96eea';ctx.textAlign='center';ctx.fillText('ART',ww*.815,hh*.14);ctx.fillText('SURVIVES',ww*.815,hh*.20);ctx.fillText('STILL',ww*.815,hh*.26);
      ctx.restore();
    }

    const hit=phase.current==='explore'?cast(cc.x,cc.y,Math.cos(cc.ang),Math.sin(cc.ang),3.2):null;const door=hit?DOOR_SCENE[hit.tile]:undefined;target.current=hit&&hit.dist<2.65&&hit.tile==='C'?{kind:'console'}:hit&&hit.dist<2.4&&hit.tile==='A'?{kind:'relic'}:hit&&hit.dist<2.8&&door?{kind:'door',scene:door}:hit&&hit.dist<2.8&&hit.tile==='V'?{kind:'car'}:null;if(time-lastHud.current>.12){lastHud.current=time;const prompt=vehicleRef.current?'[E] EXIT K//DRIVE':target.current?.kind==='console'?'[E] SIT AT K TERMINAL':target.current?.kind==='relic'?'[E] INSPECT SIGNAL RELIC':target.current?.kind==='car'?'[E] ENTER K//DRIVE · ⚑ FLAG':target.current?.kind==='door'&&target.current.scene?'[E] ENTER '+target.current.scene.toUpperCase()+' // '+SCENES[target.current.scene].label:null;setHud({area:area(cc.x,cc.y,scene),prompt,fps,x:cc.x,y:cc.y,ang:cc.ang});}},[scene]);

  useEffect(()=>{
    let raf=0,last=performance.now(),ff=0,clock=0,fps=0;
    const frame=(now:number)=>{
      raf=requestAnimationFrame(frame);
      const dt=Math.min(.05,(now-last)/1000);last=now;ff++;clock+=dt;
      if(clock>=.5){fps=Math.round(ff/clock);ff=0;clock=0;}
      const c=cam.current;
      if(phase.current==='explore'&&booted){
        const k=keys.current;
        let fw=0,st=0;
        if(k.w||k.arrowup)fw++;
        if(k.s||k.arrowdown)fw--;
        if(vehicleRef.current){
          if(k.a||k.arrowleft)c.ang-=2.15*dt;
          if(k.d||k.arrowright)c.ang+=2.15*dt;
          st=0;
        }else{
          if(k.a)st--;
          if(k.d)st++;
          if(k.arrowleft)c.ang-=1.8*dt;
          if(k.arrowright)c.ang+=1.8*dt;
        }
        if(touchMove.current.id!==-1){fw-=touchMove.current.dy;if(!vehicleRef.current)st+=touchMove.current.dx;}
        if(flightRef.current){
          if(k[' '])c.height=Math.min(5.2,c.height+2.1*dt);
          if(k.control||k.c)c.height=Math.max(1.9,c.height-2.1*dt);
        }
        const sp=(vehicleRef.current?6.4:flightRef.current?5.2:(k.shift?3.7:2.55))*dt;
        const dx=Math.cos(c.ang),dy=Math.sin(c.ang),mx=(dx*fw-dy*st)*sp,my=(dy*fw+dx*st)*sp,r=vehicleRef.current ? .18 : .24;
        const flyingOver=flightRef.current&&c.height>3.05;
        if(flyingOver||!solid(c.x+mx+Math.sign(mx||1)*r,c.y))c.x=Math.max(1.1,Math.min(W-1.1,c.x+mx));
        if(flyingOver||!solid(c.x,c.y+my+Math.sign(my||1)*r))c.y=Math.max(1.1,Math.min(H-1.1,c.y+my));

        // K Terminal changes tracks only when crossing an actual room/world
        // boundary. Walking inside a room never restarts or cuts its song.
        const inGallery=c.y<=15.9&&c.x>12&&c.x<36;
        const inRealm=c.y>=REALM_THRESHOLD_Y;
        const memory=cam.current as Cam & {_gallery?:boolean;_realm?:boolean};
        const wasGallery=memory._gallery ?? inGallery;
        const wasRealm=memory._realm ?? inRealm;
        memory._gallery=inGallery;memory._realm=inRealm;
        if(vehicleRef.current){
          if(cueRef.current!=='car')setAudioCue('car');
        }else if(flightRef.current){
          if(cueRef.current!=='flight')setAudioCue('flight');
        }else if(inGallery&&!wasGallery){
          if(cueRef.current!=='gallery-turnaround')setAudioCue('gallery-deep');
        }else if(!inGallery&&wasGallery){
          setAudioCue('city');
          setNotice('K//CITY REENTRY // PROJECT DISTRICTS // PORTALS SOUTH');
          window.setTimeout(()=>setNotice(''),2200);
        }else if(inRealm&&!wasRealm){
          setAudioCue(scene);
          setNotice(SCENES[scene].label+' // WORLD SIGNAL ACQUIRED');
          window.setTimeout(()=>setNotice(''),2200);
        }else if(!inRealm&&wasRealm){
          setAudioCue('city');
          setNotice('K//CITY RETURN GATE // GALLERY NORTH');
          window.setTimeout(()=>setNotice(''),2400);
        }
      }
      if(phase.current==='sitting'||phase.current==='standing'){
        anim.current=Math.min(1,anim.current+dt/.72);
        const e=anim.current,sm=e*e*(3-2*e),from=seatFrom.current,to={x:SEAT.x,y:SEAT.y,ang:SEAT.a,h:1.2},aa=phase.current==='sitting'?from:to,bb=phase.current==='sitting'?to:from,da=norm(bb.ang-aa.ang);
        c.x=aa.x+(bb.x-aa.x)*sm;c.y=aa.y+(bb.y-aa.y)*sm;c.ang=aa.ang+da*sm;c.height=aa.h+(bb.h-aa.h)*sm;c.pitch*=1-sm;
        if(e>=1){if(phase.current==='sitting'){phase.current='seated';setTerminal(true);termRef.current=true;}else phase.current='explore';}
      }
      if(now-lastPaint.current>32){lastPaint.current=now;draw(now/1000,fps);}
    };
    raf=requestAnimationFrame(frame);
    return()=>cancelAnimationFrame(raf);
  },[booted,draw,setAudioCue]);
  const map=useMemo(()=>mini(hud.x,hud.y,hud.ang),[hud.x,hud.y,hud.ang]);
  const sceneCfg=SCENES[scene];
  const audioState=nowPlaying?'K TERMINAL':'ARMED';

  return <div className="kcity">
    <div ref={wrap} className="kc-wrap"><canvas ref={canvas} onClick={lock} onTouchStart={ts} onTouchMove={tm} onTouchEnd={te} onTouchCancel={te}/></div><div className="kc-scan"/><div className="kc-vig"/><div className="kc-gallery-glow"/>
    {booted&&!terminal&&<><div className="kc-hud"><b>K//CITY ASCII-RT v5.0</b><span>{hud.area}</span><small>{hud.y>=REALM_THRESHOLD_Y ? `PORTAL ${scene.toUpperCase()} // ${sceneCfg.era}` : 'K//CITY // SHARED INNER WORLD'}</small><small>{hud.y>=REALM_THRESHOLD_Y ? `WORLD ID ${scene.toUpperCase()} // ${sceneCfg.motifs}` : 'RETURN PATH // GALLERY NORTH · PORTALS SOUTH'}</small><small>SYNC {audioState} // {nowPlaying||'WAITING FOR SOUNDCLOUD'}</small><small>POS {hud.x.toFixed(1)}:{hud.y.toFixed(1)} · ALT {cam.current.height.toFixed(1)} · {hud.fps}FPS</small></div><pre className="kc-map">SCAN GRID{"\n"}{map}</pre><div className="kc-cross">+</div><div className="kc-ctl">[WASD] WALK · [MOUSE/DRAG] LOOK · [SHIFT] RUN · [E] INTERACT · [T] K TERMINAL{scene==='light'?' · [F] FLY':''}<br/><b>{vehicle?'K//DRIVE ACTIVE · [E] EXIT':flight?'K-01 EVA · [SPACE] CLIMB · [C/CTRL] DESCEND':'BUILD · VERIFY · OPERATE · RESEARCH // [T] K TERMINAL'}</b></div><div className="kc-nowplaying"><b>♫ {audioState}</b> // {nowPlaying||'SOUNDTRACK ARMING'}</div>{hud.prompt&&<button className="kc-prompt" onClick={interact}>{hud.prompt}</button>}{!locked&&!vehicle&&!flight&&<button className="kc-lock" onClick={lock}>CLICK TO CAPTURE MOUSE</button>}{scene==='light'&&<button className="kc-flight-toggle" onClick={toggleFlight}>{flight?'[F] LAND':'[F] FLY'}</button>}</>}
    {vehicle&&!terminal&&<div className="kc-drive-dashboard"><pre>{'┌───────────┐\n│ ⚑ K//FLAG │\n│ ▓▒░▓▒░▓▒░ │\n└─────┬─────┘\n      │'}</pre><div className="kc-drive-center"><b>K//DRIVE // NIGHT DASH</b>FLAG SIGNAL LOCKED<br/>♫ {nowPlaying||'FLAG'}</div><div className="kc-drive-gauge">SPD // {keys.current.w?'88':'00'}<br/>NET // ONLINE<br/>[E] EXIT</div></div>}
    {flight&&!terminal&&<div className="kc-flight-hud"><b>K-01 EVA</b><br/>ALT // {cam.current.height.toFixed(1)}<br/>MIRROR PLANE // SYNC<br/>SPACE ↑ · C/CTRL ↓</div>}
    {notice&&!terminal&&<div className="kc-note">{notice}</div>}
    {!booted&&<div className="kc-boot"><div className="kc-logo">K//THE EMRLD</div><pre>{'☿ SOLVE / COAGULA ☉\n> booting ASCII raycaster ........ ok\n> K//CITY soundtrack bus ......... armed\n> six seasonal/light/dark doors .. online\n> K//DRIVE + FLAG dash ........... online\n> K-01 EVA system ............ online\n> apse K Terminal ................ armed'}</pre><button onClick={()=>{setAudioCue('city');setBooted(true);lock();}}>ENTER K//CITY</button></div>}
    <div className={`kc-terminal ${terminal?'kc-terminal-open':'kc-terminal-hidden'}`}>
      <KTerminal
        embedded
        onExitToCity={exit}
        onExitToGallery={returnToGallery}
        onEnterScene={enterScene}
        worldAudioZone={audioCue}
        worldAudioArmed={booted}
        onAudioState={(state)=>{audioMsRef.current=state.positionMs;audioPlayingRef.current=state.playing;setNowPlaying(state.title);}}
      />
    </div><style>{CSS}</style></div>;
}
