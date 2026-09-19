import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import KTerminal, { type KWorldScene } from './KTerminal';
import { type KAudioZone } from '../data/kAudioZones';
import { K_GALLERY_ART, K_GALLERY_ASSET } from '../data/kGalleryArt';

type Phase = 'explore' | 'sitting' | 'seated' | 'standing';
type Cam = { x:number; y:number; ang:number; pitch:number; height:number };
type Hit = { tile:string; ix:number; iy:number; dist:number; side:number } | null;

const W=48,H=40,FOV=Math.PI/2.65;
const SPAWN={x:24.5,y:35.5,a:-Math.PI/2};
const RETURN={x:23.5,y:6.45,a:Math.PI/2};
const SEAT={x:23.5,y:5.9,a:-Math.PI/2};
const OUTSIDE={x:24.5,y:17.45,a:Math.PI/2};
const FONT='ui-monospace,"SF Mono",Menlo,Consolas,monospace';

type SceneId=KWorldScene;
type SceneConfig={label:string;era:string;motifs:string;accent:string;sky:string;haze:string;floorA:string;floorB:string;wall:string;neon:string;weather:string;weatherColor:string;wallChars:[string,string,string]};
const SCENES:Record<SceneId,SceneConfig>={
  spring:{label:'VERNAL COURT',era:'ROYAL GOTHIC → CYBER SPRING',motifs:'POINTED ARCHES · ROSE WINDOWS · IVY · HERALDRY',accent:'#a7ff9b',sky:'#160d25',haze:'#7d4cff',floorA:'#193124',floorB:'#10251d',wall:'#4e566c',neon:'#9effbe',weather:'·',weatherColor:'#8dffad',wallChars:['▓','▒','░']},
  summer:{label:'SOLAR CLOISTER',era:'ROYAL GOTHIC → SOLAR CITY',motifs:'SUNBURSTS · ARCADES · FOUNTAINS · STAINED GLASS',accent:'#ffd166',sky:'#120c21',haze:'#ff3bd4',floorA:'#263329',floorB:'#121f1b',wall:'#42536a',neon:'#00ffff',weather:'|',weatherColor:'#ffca58',wallChars:['█','▓','▒']},
  autumn:{label:'RUST PROCESSIONAL',era:'ROYAL GOTHIC → BRUTALIST DECAY',motifs:'BRUTALIST SLABS · EXPOSED REBAR · OXIDE · LEAF DRIFT',accent:'#ff9b42',sky:'#1b0d0a',haze:'#7a281b',floorA:'#3a2419',floorB:'#241711',wall:'#604334',neon:'#ff7a33',weather:',',weatherColor:'#d98845',wallChars:['▓','▒','░']},
  winter:{label:'WHITEOUT GRID',era:'ROYAL GOTHIC → POSTMODERN COLLAPSE',motifs:'FRACTURED GLASS · ICICLES · SNOW FENCES · BARE LATTICE',accent:'#d8ecff',sky:'#07111c',haze:'#8bb9df',floorA:'#253445',floorB:'#152330',wall:'#667587',neon:'#a9e7ff',weather:'*',weatherColor:'#d8ecff',wallChars:['□','▒','·']},
  light:{label:'LUMEN ARCOLOGY',era:'ROYAL GOTHIC → POSTMODERN LIGHT',motifs:'SOLAR FINS · WHITE GRID · SKY GARDENS · CIVIC ATRIA',accent:'#fff0a8',sky:'#07161b',haze:'#d9fff6',floorA:'#284143',floorB:'#173034',wall:'#71878a',neon:'#fff0a8',weather:'+',weatherColor:'#effff9',wallChars:['□','▫','·']},
  dark:{label:'BLACKOUT WASTELAND',era:'ROYAL GOTHIC → POST-APOCALYPTIC DARK',motifs:'COLLAPSED GANTRIES · ASH · DEAD NEON · FIRE BARRELS',accent:'#ff3b59',sky:'#050208',haze:'#53102b',floorA:'#1f1118',floorB:'#11090e',wall:'#332532',neon:'#ff315f',weather:'/',weatherColor:'#7b203b',wallChars:['█','▓','·']}
};
const DOOR_SCENE:Record<string,SceneId>={'1':'spring','2':'summer','3':'autumn','4':'winter','5':'light','6':'dark'};
const DOOR_COLOR:Record<string,string>={'1':'#a7ff9b','2':'#ffd166','3':'#ff9b42','4':'#d8ecff','5':'#fff0a8','6':'#ff3b59'};

type Billboard={x:number;y:number;t:string[];c:string};

const GALLERY_MOTIFS:Billboard[]=[
  {x:24,y:10.4,t:['        .-=====-.','     .-╱  ✥  ╲-.','    ╱  ╲  │  ╱  ╲','   │ ╲  ╲ │ ╱  ╱ │','   │───╲─◎─╱───│','    ╲  ╱  │  ╲  ╱','     ╲___♛___╱','      ROSE WINDOW'],c:'#b86bff'},
  {x:16.5,y:8.2,t:['    ╱╲','   ╱  ╲','  ╱ ♜  ╲',' ╱______╲',' │  ║║  │',' ╰──╨╨──╯','POINTED ARCH'],c:'#d892ff'},
  {x:31.5,y:8.2,t:['╔═══♛═══╗','║  K//  ║','║ EMRLD ║','╚═══╤═══╝',' HERALDRY'],c:'#a87cff'},
  {x:17,y:13.5,t:['╔══════════╗','║ ART WALL ║','║ SLOT // A║','║ COVER ART║','║  PENDING ║','╚══════════╝'],c:'#00ffff'},
  {x:31,y:13.5,t:['╔══════════╗','║ ART WALL ║','║ SLOT // B║','║ COVER ART║','║  PENDING ║','╚══════════╝'],c:'#ff3bd4'}
];

const LANDMARKS:Record<SceneId,Billboard[]>={
  spring:[
    {x:18,y:19.2,t:['     ❧   ❧','   ╭───────╮','  ╱  ╲ ✥ ╱  ╲',' ╱____╲│╱____╲',' │ ♛   ◎   ♛ │',' ╰─╨───┴───╨─╯','VERNAL GATE'],c:'#a7ff9b'},
    {x:31,y:22.0,t:['   ╭─❀─╮',' ╭─╯ ║ ╰─╮',' │  ≈╬≈  │',' │ ≈╬╬╬≈ │',' ╰──╥╥╥──╯','FOUNTAIN'],c:'#78ffd1'},
    {x:14.5,y:27.5,t:['❧❧ IVY WALK ❧❧','│╲│╱│╲│╱│╲│','│ ❧ │ ❀ │ ❧│','╰───╧───╧──╯'],c:'#6dff78'},
    {x:34,y:31.5,t:['╔══ HOUSE K ══╗','║ ♜ ♛ ✥ ♜    ║','╚════╤════════╝','HERALDIC COURT'],c:'#c4a0ff'}
  ],
  summer:[
    {x:24,y:19.2,t:['      ╲ │ ╱','    ─── ☼ ───','      ╱ │ ╲','  ╭──────────╮','  │SOLAR NAVE│','  ╰──────────╯'],c:'#ffd166'},
    {x:14,y:24.5,t:['╭─╮ ╭─╮ ╭─╮','│ │ │ │ │ │','╰─╯ ╰─╯ ╰─╯','ARCADE WALK'],c:'#ffe68a'},
    {x:34,y:25.2,t:['  ╭────╮','╭─╯ ☼☼ ╰─╮','│ ≈≈╬≈≈ │','╰──╥╥───╯','SUN FOUNTAIN'],c:'#00ffff'},
    {x:22,y:32.0,t:['╱╲╱╲╱╲╱╲╱╲','╲╱╲╱╲╱╲╱╲╱','STAINED GLASS'],c:'#ff76df'}
  ],
  autumn:[
    {x:17,y:20.2,t:['████████████','██  ██  ████','██  ██  ████','████████████','╫╫  ╫╫  ╫╫','BRUTAL BLOCK'],c:'#c96b35'},
    {x:33,y:23.4,t:['╫  ╫   ╫  ╫','╫╲ ╫ ╱ ╫╲ ╫','╫ ╲╫╱  ╫ ╲╫','╫  ╳   ╫  ╫','EXPOSED REBAR'],c:'#a9552b'},
    {x:14,y:30,t:['>>> WARNING >>>','OXIDE ZONE 04','/////\\\\','LEAF DRIFT ,,,'],c:'#ff9b42'},
    {x:34,y:32,t:['┌───────────┐','│ K//WORKS  │','│   CLOSED  │','└─────╥─────┘',' , ,  ║ , ,'],c:'#e7823f'}
  ],
  winter:[
    {x:17,y:19.7,t:['      ✧','    ╱╲╱╲','  ╱╲╱◇╲╱╲',' ╲╱╲╱╲╱╲╱',' ICE SPIRE'],c:'#d8ecff'},
    {x:33,y:23.5,t:['╲   │   ╱',' ╲  │  ╱','──╲─◇─╱──',' ╱  │  ╲','FRACTURED GLASS'],c:'#a9e7ff'},
    {x:14,y:30.2,t:['||||||||||||','|*|*|*|*|*|','||||||||||||','SNOW FENCE'],c:'#c5d8e8'},
    {x:34,y:32,t:['╭─────────╮','│ FROZEN  │','│ TRANSIT │','╰─┬─┬─┬───╯','  * * *'],c:'#8bb9df'}
  ],
  light:[
    {x:17,y:19.5,t:['    ╱│╲','   ╱ │ ╲','  ╱  ◇  ╲',' ╱___│___╲',' │ □ □ □ │','LUMEN TOWER'],c:'#fff0a8'},
    {x:33,y:23.0,t:['╭──────────╮','│SKY GARDEN│','│ ❀  ❧  ❀ │','╰────┬─────╯','     │'],c:'#b8ffd8'},
    {x:14,y:30,t:['╱╲ ╱╲ ╱╲ ╱╲','☼  ☼  ☼  ☼','╲╱ ╲╱ ╲╱ ╲╱','SOLAR FINS'],c:'#ffe16a'},
    {x:34,y:32,t:['╔══════════╗','║ CIVIC    ║','║ ATRIUM   ║','║ □ ◇ □ ◇  ║','╚══════════╝'],c:'#effff9'}
  ],
  dark:[
    {x:17,y:19.5,t:['____/╲________','   /  ╲__','__/      ╲____',' COLLAPSED','  GANTRY'],c:'#7c3547'},
    {x:33,y:23.2,t:['   (^^)','  (####)','   ╲__/','    │','   ╱_╲','FIRE BARREL'],c:'#ff5a32'},
    {x:14,y:30,t:['┌──────────┐','│ N E O N  │','│  D E A D │','└────╲─────┘','      ╲'],c:'#ff315f'},
    {x:34,y:32,t:['    ╳','   ╱│╲','  ╱ │ ╲',' ╱__│__╲','  ASH MAST'],c:'#6e2639'}
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
    rep('#',15)+rep('.',18)+rep('#',15),
    rep('#',15)+rep('.',18)+rep('#',15),
    rep('#',15)+rep('.',18)+rep('#',15),
    rep('#',48),
    rep('#',48),
    rep('#',48)
  ];
  // Parked car in lower city plaza. Interact to enter K//DRIVE.
  const carX=31,carY=35;
  rows[carY]=rows[carY].slice(0,carX)+'V'+rows[carY].slice(carX+1);
  return rows;
}
const MAP=makeMap();
const COLORS:Record<string,string>={'#':'#31394c',N:'#d73cff',S:'#8e8aa3',W:'#b86bff',G:'#69517e',A:'#d9a83e',C:'#00ff66',P:'#75529f',V:'#00d9ff',...DOOR_COLOR};
const SIGNS=[
  {x:15.8,y:15.4,t:['╔══════════════╗','║ K//THE EMRLD ║','╚══════════════╝'],c:'#b86bff'},
  {x:24,y:17.8,t:['┌─────────────┐','│ TECHOPS//L3 │','│ QUEUE:015   │','└─────────────┘'],c:'#00ff66'},
  {x:8.6,y:21,t:['┌─────────────┐','│ DHCP//TRACE │','│ PORT → HOST │','└─────────────┘'],c:'#00d9ff'},
  {x:31.4,y:21,t:['┌──────────────┐','│ RESIDUAL//RT │','│ EVIDENCE>AI  │','└──────────────┘'],c:'#ff3bd4'},
  {x:12,y:27,t:['[ P2 RECOVERY ]','PRODUCTION NEVER SLEEPS'],c:'#ffb000'},
  {x:28,y:27,t:['[ NIGHT SHIFT ]','FACTORY NET // ACTIVE'],c:'#00ff91'},
  {x:20,y:3.55,t:['╔════════════════╗','║ K TERMINAL 01  ║','║ APSE CONSOLE   ║','╚════════════════╝'],c:'#00ff66'}
];
const DOOR_SIGNS=[
  {x:13.7,y:6.5,t:['[1] SPRING','VERNAL COURT'],c:DOOR_COLOR['1']},
  {x:34.3,y:6.5,t:['[2] SUMMER','SOLAR CLOISTER'],c:DOOR_COLOR['2']},
  {x:13.7,y:9.5,t:['[3] AUTUMN','RUST PROCESSION'],c:DOOR_COLOR['3']},
  {x:34.3,y:9.5,t:['[4] WINTER','WHITEOUT GRID'],c:DOOR_COLOR['4']},
  {x:13.7,y:12.5,t:['[5] LIGHT','LUMEN ARCOLOGY'],c:DOOR_COLOR['5']},
  {x:34.3,y:12.5,t:['[6] DARK','BLACKOUT WASTE'],c:DOOR_COLOR['6']}
]
const CAR_SIGN:Billboard={x:31,y:35,t:['   ______',' _/|_||_\\`.__','(   _    _ _\\','=`-(_)--(_)-\'',' K//DRIVE · ⚑',' [E] ENTER'],c:'#00d9ff'};

function sceneWallGlyph(scene:SceneId,ix:number,iy:number,sx:number,sy:number,top:number,bot:number,time:number,fallback:string){
  const h=Math.max(1,bot-top),v=(sy-top)/h,p=(ix*7+iy*11+sx)%19;
  switch(scene){
    case 'spring':
      if(v>.22&&v<.28&&p===0)return '✥';
      if(v>.55&&p===3)return '│';
      if(v>.74&&p===6)return '❧';
      return fallback;
    case 'summer':
      if(v>.18&&v<.25&&p===0)return '☼';
      if(v>.42&&v<.50&&p<2)return '╭';
      if(v>.70&&p===5)return '≈';
      return fallback;
    case 'autumn':
      if(p===0&&v>.2)return '╫';
      if((sx+sy+Math.floor(time*2))%23===0)return ',';
      if(v>.66&&p===7)return '#';
      return fallback;
    case 'winter':
      if(v<.18&&p<3)return '▼';
      if(p===2)return '╲';
      if(p===9)return '╱';
      if((sx*3+sy+Math.floor(time))%29===0)return '*';
      return fallback;
    case 'light':
      if(p===0)return '□';
      if(v>.35&&v<.42&&p<3)return '◇';
      if(v>.7&&p===8)return '│';
      return fallback;
    case 'dark':
      if(p===1&&v>.18)return '╳';
      if(p===8)return '/';
      if((sx+sy+Math.floor(time*3))%31===0)return '·';
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
function area(x:number,y:number,scene:SceneId){if(y<6.2&&x>12&&x<36)return'THE APSE // TERMINAL ALCOVE';if(y<=15.8&&x>12&&x<36)return'K//GALLERY // ROYAL GOTHIC CATHEDRAL';const cfg=SCENES[scene];if(y<24)return'CATHEDRAL APPROACH // '+cfg.label;if(y<29)return'SECTOR 7 // BUSTLING CYBERPUNK CROSSING';return'LOWER CITY // '+cfg.label;}
function mini(x:number,y:number,a:number){
  const w=19,h=9,px=Math.floor(x),py=Math.floor(y),dirs=['→','↘','↓','↙','←','↖','↑','↗'];const di=((Math.round(a/(Math.PI*2)*8)%8)+8)%8;const out:string[]=[];
  for(let j=0;j<h;j++){let row='';for(let i=0;i<w;i++){if(i===(w>>1)&&j===(h>>1)){row+=dirs[di];continue;}const mx=px-(w>>1)+i,my=py-(h>>1)+j;if(mx<0||my<0||mx>=W||my>=H){row+=' ';continue;}const t=MAP[my][mx];row+=t==='#'?'▓':t==='N'?'▒':t==='S'?'╬':t==='W'?'◆':t==='G'?'╫':t==='C'?'▣':t==='A'?'■':t==='P'?'●':t==='V'?'▰':DOOR_SCENE[t]?'□':'·';}out.push(row);}return out.join('\n');
}

const CSS='.kcity{position:fixed;inset:0;background:#04060c;color:#00ff66;font-family:'+FONT+';overflow:hidden}.kc-wrap{position:absolute;inset:0}.kc-wrap canvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair;image-rendering:pixelated}.kc-scan,.kc-vig{position:absolute;inset:0;pointer-events:none;z-index:8}.kc-scan{background:repeating-linear-gradient(to bottom,transparent 0 2px,rgba(0,0,0,.28) 2px 4px);mix-blend-mode:multiply}.kc-vig{background:radial-gradient(ellipse at center,transparent 42%,rgba(0,0,0,.62) 100%),radial-gradient(ellipse at 50% 110%,rgba(176,0,255,.09),transparent 55%)}.kc-hud{position:absolute;z-index:12;left:12px;top:12px;border:1px solid #00ff6644;background:#000b;padding:8px 10px;font-size:10px;line-height:1.45;max-width:min(440px,62vw)}.kc-hud b,.kc-hud span,.kc-hud small{display:block}.kc-hud b{color:#00ff91}.kc-hud span{color:#00d9ff}.kc-hud small{color:#46705c}.kc-map{position:absolute;z-index:12;right:12px;top:12px;margin:0;border:1px solid #00ff6633;background:#000c;padding:7px;color:#59736a;font:8px/.95 monospace}.kc-cross{position:absolute;z-index:12;left:50%;top:50%;transform:translate(-50%,-50%);color:#00ff6699;text-shadow:0 0 8px #00ff66}.kc-ctl{position:absolute;z-index:12;left:12px;bottom:12px;border:1px solid #00ff6633;background:#000b;padding:7px 9px;color:#4c8268;font-size:9px;line-height:1.45}.kc-ctl b{color:#00ff91}.kc-prompt,.kc-lock{position:absolute;z-index:13;left:50%;transform:translateX(-50%);background:#000d;font:10px monospace;letter-spacing:.14em;padding:8px 12px;cursor:pointer}.kc-prompt{bottom:82px;border:1px solid #00ff66;color:#bfffd8;box-shadow:0 0 20px #00ff6633}.kc-lock{bottom:31%;border:1px solid #00d9ff88;color:#00d9ff}.kc-note{position:absolute;z-index:14;left:50%;top:13%;transform:translateX(-50%);border:1px solid #00ff66;background:#020805ed;padding:8px 12px;color:#00ff91;font-size:9px;letter-spacing:.09em;text-align:center}.kc-boot{position:absolute;z-index:30;inset:0;background:#04060cf5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:18px}.kc-logo{font-size:clamp(34px,8vw,88px);letter-spacing:.12em;color:#b86bff;text-shadow:0 0 24px #8f4dff}.kc-boot pre{color:#00ff91;line-height:1.7;font-size:11px}.kc-boot button{background:#06030b;border:1px solid #00ff66;color:#00ff91;padding:11px 22px;font:11px monospace;letter-spacing:.22em;cursor:pointer;box-shadow:0 0 18px #00ff6633}.kc-terminal{position:absolute;inset:0;z-index:40;background:#000;transition:opacity .16s ease}.kc-terminal-open{opacity:1;visibility:visible;pointer-events:auto}.kc-terminal-hidden{opacity:0;visibility:hidden;pointer-events:none}.kc-terminal .kt-body{height:100dvh}.kc-nowplaying{position:absolute;z-index:13;left:12px;bottom:58px;border:1px solid #b000ff66;background:#05020bcc;padding:6px 9px;color:#d8a6ff;font-size:8px;letter-spacing:.08em;max-width:52vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kc-nowplaying b{color:#00ffff}.kc-drive-dashboard{position:absolute;z-index:15;left:50%;bottom:0;transform:translateX(-50%);width:min(720px,94vw);height:118px;border:2px solid #00d9ff;background:linear-gradient(#051015e8,#020507f5);box-shadow:0 -10px 35px #00d9ff18,inset 0 0 28px #00d9ff12;padding:8px 14px;display:grid;grid-template-columns:150px 1fr 150px;align-items:center;gap:12px;color:#00d9ff}.kc-drive-dashboard pre{margin:0;color:#ff315f;font:10px/1 monospace;text-align:center;text-shadow:0 0 8px #ff315f}.kc-drive-center{text-align:center;font-size:10px;line-height:1.5}.kc-drive-center b{display:block;color:#fff}.kc-drive-gauge{text-align:right;color:#00ff91;font-size:9px}.kc-flight-hud{position:absolute;z-index:15;right:12px;bottom:58px;border:1px solid #fff0a888;background:#07161bdd;padding:8px 10px;color:#fff0a8;font-size:9px;line-height:1.45;text-align:right}.kc-flight-toggle{position:absolute;z-index:15;right:12px;bottom:12px;border:1px solid #fff0a8;background:#07161be8;color:#fff0a8;padding:7px 10px;font:9px monospace;cursor:pointer}.kc-audio-arm{position:fixed;z-index:55;left:50%;bottom:96px;transform:translateX(-50%);border:1px solid #00ffff;background:#020509ee;color:#00ffff;padding:9px 13px;font:9px monospace;letter-spacing:.08em;box-shadow:0 0 18px #00ffff33}.kc-gallery-art-note{position:absolute;z-index:12;right:12px;bottom:12px;color:#7e6597;font-size:7px}@media(max-width:700px){.kc-hud{font-size:8px;left:6px;top:6px;padding:6px}.kc-map{right:6px;top:6px;font-size:6px}.kc-ctl{left:6px;bottom:6px;font-size:7px;max-width:72%}.kc-prompt{bottom:68px;font-size:8px}.kc-lock{bottom:26%;font-size:8px}.kc-note{top:18%;width:82%;font-size:8px}.kc-logo{font-size:34px}.kc-boot pre{font-size:9px}.kc-nowplaying{left:6px;bottom:46px;font-size:7px;max-width:70vw}.kc-drive-dashboard{height:96px;grid-template-columns:90px 1fr 80px;padding:6px}.kc-drive-dashboard pre{font-size:7px}.kc-drive-center,.kc-drive-gauge{font-size:7px}.kc-flight-hud{right:6px;bottom:48px;font-size:7px}.kc-flight-toggle{right:6px;bottom:6px;font-size:7px}}';

export default function AsciiCityWorld(){
  const [params,setParams]=useSearchParams(),back=params.get('spawn')==='console',portal=params.get('spawn')==='portal';
  const queryScene=params.get('scene') as SceneId|null;
  const initialScene:SceneId=queryScene&&SCENES[queryScene]?queryScene:'spring';
  const wrap=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),keys=useRef<Record<string,boolean>>({});
  const phase=useRef<Phase>('explore'),anim=useRef(0),termRef=useRef(false),target=useRef<{kind:'console'|'relic'|'door'|'car';scene?:SceneId}|null>(null),lastPaint=useRef(0),lastHud=useRef(0);
  const touchMove=useRef({id:-1,x0:0,y0:0,dx:0,dy:0}),touchLook=useRef({id:-1,x:0,y:0});
  const vehicleRef=useRef(false),flightRef=useRef(false),audioMsRef=useRef(0),portableTerminalRef=useRef(false),cueRef=useRef<KAudioZone>(back?'gallery-turnaround':portal?initialScene:'city'),galleryReturnUntil=useRef(back?performance.now()+12000:0);
  const start=back?RETURN:portal?OUTSIDE:SPAWN,cam=useRef<Cam>({x:start.x,y:start.y,ang:start.a,pitch:0,height:1.55}),seatFrom=useRef({x:RETURN.x,y:RETURN.y,ang:RETURN.a,h:1.55});
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
  const enterScene=useCallback((next:SceneId)=>{setScene(next);setParams({scene:next,spawn:'portal'},{replace:true});setTerminal(false);termRef.current=false;portableTerminalRef.current=false;setVehicle(false);vehicleRef.current=false;setFlight(false);flightRef.current=false;setAudioCue(next);phase.current='explore';document.exitPointerLock?.();cam.current={x:OUTSIDE.x,y:OUTSIDE.y,ang:OUTSIDE.a,pitch:0,height:1.55};seatFrom.current={x:RETURN.x,y:RETURN.y,ang:RETURN.a,h:1.55};setNotice('PORTAL '+next.toUpperCase()+' // '+SCENES[next].label+' // K TERMINAL AUTO DJ');window.setTimeout(()=>setNotice(''),3600);},[setParams,setAudioCue]);
  const toggleFlight=useCallback(()=>{if(scene!=='light'){setNotice('FLIGHT MODE // AVAILABLE ONLY IN LIGHT / LUMEN ARCOLOGY');window.setTimeout(()=>setNotice(''),2200);return;}const next=!flightRef.current;flightRef.current=next;setFlight(next);setVehicle(false);vehicleRef.current=false;cam.current.height=next?2.75:1.55;cam.current.pitch=next?-5:0;setAudioCue(next?'flight':'light');setNotice(next?'FLIGHT MODE // MIRROR PLANE // [F] LAND':'TOUCHDOWN // LUMEN ARCOLOGY');window.setTimeout(()=>setNotice(''),2600);},[scene,setAudioCue]);
  const interact=useCallback(()=>{if(phase.current!=='explore')return;if(vehicleRef.current){vehicleRef.current=false;setVehicle(false);setAudioCue(scene);setNotice('K//DRIVE EXITED // FLAG SIGNAL RELEASED');window.setTimeout(()=>setNotice(''),2200);return;}const t=target.current;if(!t)return;if(t.kind==='console')sit();else if(t.kind==='relic'){setNotice('SIGNAL SCRIPTURE // ARCHIVE LINK VERIFIED');window.setTimeout(()=>setNotice(''),2200);}else if(t.kind==='door'&&t.scene)enterScene(t.scene);else if(t.kind==='car'){vehicleRef.current=true;setVehicle(true);flightRef.current=false;setFlight(false);cam.current.height=1.25;setAudioCue('car');setNotice('K//DRIVE ONLINE // ⚑ FLAG ON DASH // [E] EXIT VEHICLE');window.setTimeout(()=>setNotice(''),3000);}},[sit,enterScene,setAudioCue,scene]);

  useEffect(()=>{const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();keys.current[k]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='e')interact();if(k==='f')toggleFlight();if(k==='t'&&!termRef.current)openPortableTerminal();if(k==='escape'&&termRef.current)exit();};const up=(e:KeyboardEvent)=>{keys.current[e.key.toLowerCase()]=false;};const pl=()=>setLocked(document.pointerLockElement===canvas.current);const mm=(e:MouseEvent)=>{if(document.pointerLockElement!==canvas.current||phase.current!=='explore')return;cam.current.ang+=e.movementX*.00235;cam.current.pitch=Math.max(-13,Math.min(13,cam.current.pitch-e.movementY*.07));};window.addEventListener('keydown',down);window.addEventListener('keyup',up);document.addEventListener('pointerlockchange',pl);document.addEventListener('mousemove',mm);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);document.removeEventListener('pointerlockchange',pl);document.removeEventListener('mousemove',mm);};},[interact,exit,toggleFlight,openPortableTerminal]);

  const ts=useCallback((e:React.TouchEvent)=>{const half=window.innerWidth/2;for(const t of Array.from(e.changedTouches)){if(t.clientX<half&&touchMove.current.id===-1)touchMove.current={id:t.identifier,x0:t.clientX,y0:t.clientY,dx:0,dy:0};else if(touchLook.current.id===-1)touchLook.current={id:t.identifier,x:t.clientX,y:t.clientY};}},[]);
  const tm=useCallback((e:React.TouchEvent)=>{for(const t of Array.from(e.changedTouches)){if(t.identifier===touchMove.current.id){touchMove.current.dx=Math.max(-1,Math.min(1,(t.clientX-touchMove.current.x0)/65));touchMove.current.dy=Math.max(-1,Math.min(1,(t.clientY-touchMove.current.y0)/65));}else if(t.identifier===touchLook.current.id&&phase.current==='explore'){cam.current.ang+=(t.clientX-touchLook.current.x)*.0065;cam.current.pitch=Math.max(-13,Math.min(13,cam.current.pitch-(t.clientY-touchLook.current.y)*.13));touchLook.current.x=t.clientX;touchLook.current.y=t.clientY;}}},[]);
  const te=useCallback((e:React.TouchEvent)=>{for(const t of Array.from(e.changedTouches)){if(t.identifier===touchMove.current.id)touchMove.current={id:-1,x0:0,y0:0,dx:0,dy:0};if(t.identifier===touchLook.current.id)touchLook.current={id:-1,x:0,y:0};}},[]);

  const draw=useCallback((time:number,fps:number)=>{const c=canvas.current,w=wrap.current;if(!c||!w)return;const ctx=c.getContext('2d');if(!ctx)return;const ww=w.clientWidth,hh=w.clientHeight,targetCols=ww<700?94:ww<1100?120:154,fs=Math.max(7,(ww/targetCols)/.62);ctx.font=fs+'px '+FONT;const cw=ctx.measureText('M').width||fs*.62,ch=fs*1.03,cols=Math.max(48,Math.floor(ww/cw)),rows=Math.max(26,Math.floor(hh/ch)),chars=Array.from({length:rows},()=>Array(cols).fill(' ')),colors=Array.from({length:rows},()=>Array(cols).fill('#07101b')),zb=new Float32Array(cols),cc=cam.current,hor=Math.floor(rows*.49+cc.pitch-(cc.height-1.55)*1.8);
    const cfg=SCENES[scene],royal=cc.y<=15.9&&cc.x>12&&cc.x<36;
    const audioTime=audioMsRef.current/1000,syncStep=Math.floor(audioMsRef.current/180),syncTime=audioMsRef.current>0?audioTime:time;
    const syncPulse=.72+.28*Math.abs(Math.sin(syncTime*3.15));
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      if(y<hor){
        const weather=(x*17+y*7+syncStep)%67===0,star=(x*41+y*13+Math.floor(syncTime))%257===0;
        if(royal){
          const rib=((x+y*2)%17===0)||(Math.abs((x%28)-14)-Math.floor((hor-y)*.18)===0);
          chars[y][x]=rib?(x%2?'╲':'╱'):weather?'│':star?'·':' ';
          colors[y][x]=rib?'#6f5591':weather?'#35254f':'#160e22';
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
          chars[y][x]=chk?'◇':'·'; colors[y][x]=chk?'#31243d':'#1a1421';
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
        if(hit.tile==='S') glyph=((y-top)%5===0)?'═':((x+hit.ix)%9===0?'║':'▓');
        else if(hit.tile==='W') glyph=((x+y)%5===0)?'◆':((x+y)%3===0?'╬':'░');
        else if(hit.tile==='P') glyph=((y-top)%4===0)?'╬':'║';
        else if(hit.tile==='C') glyph=((x+y)%7===0)?'▣':'▓';
        else if(DOOR_SCENE[hit.tile]) glyph=(y===Math.round((top+bot)/2))?hit.tile:((x+y)%3===0?'◇':'▓');
        else if(hit.tile==='N') glyph=((y-top)%4===1)?(((x+hit.ix)%4===0)?'▣':'▫'):'▓';
        else if(hit.tile==='V') glyph=(y===Math.round((top+bot)/2))?'⚑':((x+y)%4===0?'▰':'▓');
        else if(hit.tile==='#') glyph=((y-top)%5===1&&((x+hit.ix+hit.iy)%5===0))?'▪':((y-top)%7===0?'─':glyph);
        if(!gothic&&hit.tile!=='V') glyph=sceneWallGlyph(scene,hit.ix,hit.iy,x,y,top,bot,syncTime,glyph);
        chars[y][x]=glyph;
        colors[y][x]=hit.side?dim(base,.70):base;
      }
    }
    const sceneSign={x:24.5,y:18.3,t:['['+scene.toUpperCase()+'] '+cfg.label,cfg.era],c:cfg.accent};
    const allSigns=[...SIGNS,...DOOR_SIGNS,...GALLERY_MOTIFS,...LANDMARKS[scene],CAR_SIGN,sceneSign];
    for(const sg of allSigns){const dx=sg.x-cc.x,dy=sg.y-cc.y,d=Math.hypot(dx,dy);if(d<.3||d>18)continue;const rel=norm(Math.atan2(dy,dx)-cc.ang);if(Math.abs(rel)>FOV*.64)continue;const sx=Math.round((.5+rel/FOV)*cols),ci=Math.max(0,Math.min(cols-1,sx));if(d>zb[ci]+.6)continue;const sy=Math.round(hor-(rows*.28)/Math.max(1.1,d));sg.t.forEach((line,li)=>{const st=Math.round(sx-line.length/2);for(let q=0;q<line.length;q++){const xx=st+q,yy=sy+li;if(xx>=0&&xx<cols&&yy>=0&&yy<rows){chars[yy][xx]=line[q];colors[yy][xx]=sg.c;}}});}
    if(!royal){
      const movers=[
        {x:Math.floor(((syncTime*9)% (cols+24))-12),y:Math.max(1,hor-8),txt:'<DRONE-07>',c:'#00ffff'},
        {x:Math.floor(cols-((syncTime*6)% (cols+20))+10),y:Math.max(2,hor-4),txt:'==AIR.TAXI==>',c:'#ff3bd4'},
        {x:Math.floor(((syncTime*4)% (cols+30))-15),y:Math.min(rows-2,hor+5),txt:'[NIGHT BUS]',c:cfg.accent}
      ];
      for(const m of movers)for(let q=0;q<m.txt.length;q++){const xx=m.x+q,yy=m.y;if(xx>=0&&xx<cols&&yy>=0&&yy<rows&&zb[Math.max(0,Math.min(cols-1,xx))]>5){chars[yy][xx]=m.txt[q];colors[yy][xx]=m.c;}}
    }
    ctx.fillStyle='#04060c';ctx.fillRect(0,0,ww,hh);ctx.textBaseline='top';for(let y=0;y<rows;y++){let x=0;while(x<cols){const co=colors[y][x];let e=x+1;while(e<cols&&colors[y][e]===co)e++;const str=chars[y].slice(x,e).join('');if(str.trim()){ctx.fillStyle=co;ctx.fillText(str,x*cw,y*ch);}x=e;}}
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

        // Zone soundtrack routing. A terminal exit gets a protected 12-second
        // turnaround cue before the nave/deeper-gallery music can take over.
        const inGallery=c.y<=15.9&&c.x>12&&c.x<36;
        if(vehicleRef.current)setAudioCue('car');
        else if(flightRef.current)setAudioCue('flight');
        else if(inGallery){
          if(cueRef.current==='gallery-turnaround'&&now<galleryReturnUntil.current){/* hold */}
          else if(c.y>8.1&&c.y<14.9)setAudioCue('gallery-deep');
          else setAudioCue('ambient');
        }else if(['gallery-turnaround','gallery-deep','ambient','city'].includes(cueRef.current)){
          setAudioCue(scene);
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
    <div ref={wrap} className="kc-wrap"><canvas ref={canvas} onClick={lock} onTouchStart={ts} onTouchMove={tm} onTouchEnd={te} onTouchCancel={te}/></div><div className="kc-scan"/><div className="kc-vig"/>
    {booted&&!terminal&&<><div className="kc-hud"><b>K//CITY ASCII-RT v4.1</b><span>{hud.area}</span><small>PORTAL {scene.toUpperCase()} // {sceneCfg.era}</small><small>MOTIFS {sceneCfg.motifs}</small><small>SYNC {audioState} // {nowPlaying||'WAITING FOR SOUNDCLOUD'}</small><small>POS {hud.x.toFixed(1)}:{hud.y.toFixed(1)} · ALT {cam.current.height.toFixed(1)} · {hud.fps}FPS</small></div><pre className="kc-map">SCAN GRID{"\n"}{map}</pre><div className="kc-cross">+</div><div className="kc-ctl">[WASD] WALK · [MOUSE/DRAG] LOOK · [SHIFT] RUN · [E] INTERACT · [T] K TERMINAL{scene==='light'?' · [F] FLY':''}<br/><b>{vehicle?'K//DRIVE ACTIVE · [E] EXIT':flight?'LUMEN FLIGHT · [SPACE] CLIMB · [C/CTRL] DESCEND':'CATHEDRAL PORTALS CHANGE WORLD + SOUNDTRACK'}</b></div><div className="kc-nowplaying"><b>♫ {audioState}</b> // {nowPlaying||'SOUNDTRACK ARMING'}</div>{hud.prompt&&<button className="kc-prompt" onClick={interact}>{hud.prompt}</button>}{!locked&&!vehicle&&!flight&&<button className="kc-lock" onClick={lock}>CLICK TO CAPTURE MOUSE</button>}{scene==='light'&&<button className="kc-flight-toggle" onClick={toggleFlight}>{flight?'[F] LAND':'[F] FLY'}</button>}</>}
    {vehicle&&!terminal&&<div className="kc-drive-dashboard"><pre>{'┌───────────┐\n│ ⚑ K//FLAG │\n│ ▓▒░▓▒░▓▒░ │\n└─────┬─────┘\n      │'}</pre><div className="kc-drive-center"><b>K//DRIVE // NIGHT DASH</b>FLAG SIGNAL LOCKED<br/>♫ {nowPlaying||'FLAG'}</div><div className="kc-drive-gauge">SPD // {keys.current.w?'88':'00'}<br/>NET // ONLINE<br/>[E] EXIT</div></div>}
    {flight&&!terminal&&<div className="kc-flight-hud"><b>LUMEN FLIGHT</b><br/>ALT // {cam.current.height.toFixed(1)}<br/>MIRROR PLANE // SYNC<br/>SPACE ↑ · C/CTRL ↓</div>}
    {notice&&!terminal&&<div className="kc-note">{notice}</div>}
    {!booted&&<div className="kc-boot"><div className="kc-logo">K//THE EMRLD</div><pre>{'☿ SOLVE / COAGULA ☉\n> booting ASCII raycaster ........ ok\n> K//CITY soundtrack bus ......... armed\n> six seasonal/light/dark doors .. online\n> K//DRIVE + FLAG dash ........... online\n> LUMEN flight system ............ online\n> apse K Terminal ................ armed'}</pre><button onClick={()=>{setAudioCue('city');setBooted(true);lock();}}>ENTER K//CITY</button></div>}
    <div className={`kc-terminal ${terminal?'kc-terminal-open':'kc-terminal-hidden'}`}>
      <KTerminal
        embedded
        onExitToCity={exit}
        onExitToGallery={returnToGallery}
        onEnterScene={enterScene}
        worldAudioZone={audioCue}
        worldAudioArmed={booted}
        onAudioState={(state)=>{audioMsRef.current=state.positionMs;setNowPlaying(state.title);}}
      />
    </div><style>{CSS}</style></div>;
}
