import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import KTerminal, { type KWorldScene } from './KTerminal';

type Phase = 'explore' | 'sitting' | 'seated' | 'standing';
type Cam = { x:number; y:number; ang:number; pitch:number; height:number };
type Hit = { tile:string; ix:number; iy:number; dist:number; side:number } | null;

const W=40,H=32,FOV=Math.PI/2.65;
const SPAWN={x:20,y:29,a:-Math.PI/2};
const RETURN={x:20,y:6.35,a:-Math.PI/2};
const SEAT={x:20,y:4.55,a:-Math.PI/2};
const OUTSIDE={x:20,y:14.45,a:Math.PI/2};
const FONT='ui-monospace,"SF Mono",Menlo,Consolas,monospace';

type SceneId=KWorldScene;
type SceneConfig={label:string;era:string;accent:string;sky:string;haze:string;floorA:string;floorB:string;wall:string;neon:string;weather:string;weatherColor:string;wallChars:[string,string,string]};
const SCENES:Record<SceneId,SceneConfig>={
  spring:{label:'VERNAL COURT',era:'ROYAL GOTHIC // SPRING',accent:'#a7ff9b',sky:'#160d25',haze:'#7d4cff',floorA:'#193124',floorB:'#10251d',wall:'#4e4668',neon:'#a7ff9b',weather:'·',weatherColor:'#8dffad',wallChars:['▓','▒','░']},
  summer:{label:'SOLAR CLOISTER',era:'NEO-GOTHIC // SUMMER',accent:'#ffd166',sky:'#120c21',haze:'#ff3bd4',floorA:'#233329',floorB:'#121f1b',wall:'#384a5f',neon:'#00ffff',weather:'|',weatherColor:'#ffca58',wallChars:['█','▓','▒']},
  autumn:{label:'RUST PROCESSIONAL',era:'BRUTALIST DECAY // AUTUMN',accent:'#ff9b42',sky:'#1b0d0a',haze:'#7a281b',floorA:'#3a2419',floorB:'#241711',wall:'#604334',neon:'#ff7a33',weather:',',weatherColor:'#d98845',wallChars:['▓','▒','░']},
  winter:{label:'WHITEOUT GRID',era:'POSTMODERN COLLAPSE // WINTER',accent:'#d8ecff',sky:'#07111c',haze:'#8bb9df',floorA:'#253445',floorB:'#152330',wall:'#667587',neon:'#a9e7ff',weather:'*',weatherColor:'#d8ecff',wallChars:['□','▒','·']},
  light:{label:'LUMEN ARCOLOGY',era:'POSTMODERN // LIGHT',accent:'#fff0a8',sky:'#07161b',haze:'#d9fff6',floorA:'#284143',floorB:'#173034',wall:'#71878a',neon:'#fff0a8',weather:'+',weatherColor:'#effff9',wallChars:['□','▫','·']},
  dark:{label:'BLACKOUT WASTELAND',era:'POST-APOCALYPTIC // DARK',accent:'#ff3b59',sky:'#050208',haze:'#53102b',floorA:'#1f1118',floorB:'#11090e',wall:'#332532',neon:'#ff315f',weather:'/',weatherColor:'#7b203b',wallChars:['█','▓','·']}
};
const DOOR_SCENE:Record<string,SceneId>={'1':'spring','2':'summer','3':'autumn','4':'winter','5':'light','6':'dark'};
const DOOR_COLOR:Record<string,string>={'1':'#a7ff9b','2':'#ffd166','3':'#ff9b42','4':'#d8ecff','5':'#fff0a8','6':'#ff3b59'};

function makeMap(){
  const g=Array.from({length:H},()=>Array(W).fill('#'));
  for(let y=2;y<=12;y++)for(let x=8;x<=31;x++)g[y][x]=' ';
  for(let x=8;x<=31;x++){g[2][x]='G';g[12][x]='G';}
  for(let y=2;y<=12;y++){g[y][8]='G';g[y][31]='G';}
  g[12][19]='.';g[12][20]='.';g[12][21]='.';
  g[3][19]='C';g[3][20]='C';
  g[4][8]='1';g[4][31]='2';
  g[7][8]='3';g[7][31]='4';
  g[10][8]='5';g[10][31]='6';
  g[6][11]='A';g[6][28]='A';
  [6,9].forEach(y=>{g[y][13]='P';g[y][26]='P';});
  for(let y=12;y<=30;y++)for(let x=17;x<=22;x++)g[y][x]='.';
  for(let y=19;y<=23;y++)for(let x=3;x<=36;x++)g[y][x]='.';
  for(let y=25;y<=30;y++)for(let x=10;x<=29;x++)g[y][x]='.';
  for(let y=22;y<=27;y++){for(let x=5;x<=10;x++)g[y][x]='.';for(let x=29;x<=34;x++)g[y][x]='.';}
  for(let y=14;y<=29;y+=3){if(g[y][16]==='#')g[y][16]='N';if(g[y][23]==='#')g[y][23]='N';}
  for(let x=5;x<=34;x+=4){if(g[18][x]==='#')g[18][x]='N';if(g[24][x]==='#')g[24][x]='N';}
  return g.map(r=>r.join(''));
}
const MAP=makeMap();
const COLORS:Record<string,string>={'#':'#26324a',N:'#d73cff',G:'#8d63d8',A:'#d9a83e',C:'#00ff66',P:'#75529f',...DOOR_COLOR};
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
  {x:9.7,y:4.5,t:['[1] SPRING','VERNAL COURT'],c:DOOR_COLOR['1']},
  {x:30.3,y:4.5,t:['[2] SUMMER','SOLAR CLOISTER'],c:DOOR_COLOR['2']},
  {x:9.7,y:7.5,t:['[3] AUTUMN','RUST PROCESSIONAL'],c:DOOR_COLOR['3']},
  {x:30.3,y:7.5,t:['[4] WINTER','WHITEOUT GRID'],c:DOOR_COLOR['4']},
  {x:9.7,y:10.5,t:['[5] LIGHT','LUMEN ARCOLOGY'],c:DOOR_COLOR['5']},
  {x:30.3,y:10.5,t:['[6] DARK','BLACKOUT WASTE'],c:DOOR_COLOR['6']}
];

function tile(x:number,y:number){const ix=Math.floor(x),iy=Math.floor(y);return ix<0||iy<0||ix>=W||iy>=H?'#':MAP[iy][ix];}
function solid(x:number,y:number){return '#NGACP123456'.includes(tile(x,y));}
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
function area(x:number,y:number,scene:SceneId){if(y<5.4&&x>9&&x<31)return'THE APSE // TERMINAL ALCOVE';if(y<=12.5&&x>8&&x<32)return'K//GALLERY // ROYAL GOTHIC NEXUS';const cfg=SCENES[scene];if(y<19)return cfg.label+' // THRESHOLD';if(y<25)return cfg.label+' // TRANSIT';return cfg.label+' // OUTER DISTRICT';}
function mini(x:number,y:number,a:number){
  const w=19,h=9,px=Math.floor(x),py=Math.floor(y),dirs=['→','↘','↓','↙','←','↖','↑','↗'];const di=((Math.round(a/(Math.PI*2)*8)%8)+8)%8;const out:string[]=[];
  for(let j=0;j<h;j++){let row='';for(let i=0;i<w;i++){if(i===(w>>1)&&j===(h>>1)){row+=dirs[di];continue;}const mx=px-(w>>1)+i,my=py-(h>>1)+j;if(mx<0||my<0||mx>=W||my>=H){row+=' ';continue;}const t=MAP[my][mx];row+=t==='#'?'▓':t==='N'?'▒':t==='G'?'╫':t==='C'?'▣':t==='A'?'■':t==='P'?'●':DOOR_SCENE[t]?'□':'·';}out.push(row);}return out.join('\n');
}

const CSS='.kcity{position:fixed;inset:0;background:#04060c;color:#00ff66;font-family:'+FONT+';overflow:hidden}.kc-wrap{position:absolute;inset:0}.kc-wrap canvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair;image-rendering:pixelated}.kc-scan,.kc-vig{position:absolute;inset:0;pointer-events:none;z-index:8}.kc-scan{background:repeating-linear-gradient(to bottom,transparent 0 2px,rgba(0,0,0,.28) 2px 4px);mix-blend-mode:multiply}.kc-vig{background:radial-gradient(ellipse at center,transparent 42%,rgba(0,0,0,.62) 100%),radial-gradient(ellipse at 50% 110%,rgba(176,0,255,.09),transparent 55%)}.kc-hud{position:absolute;z-index:12;left:12px;top:12px;border:1px solid #00ff6644;background:#000b;padding:8px 10px;font-size:10px;line-height:1.45}.kc-hud b,.kc-hud span,.kc-hud small{display:block}.kc-hud b{color:#00ff91}.kc-hud span{color:#00d9ff}.kc-hud small{color:#46705c}.kc-map{position:absolute;z-index:12;right:12px;top:12px;margin:0;border:1px solid #00ff6633;background:#000c;padding:7px;color:#59736a;font:8px/.95 monospace}.kc-cross{position:absolute;z-index:12;left:50%;top:50%;transform:translate(-50%,-50%);color:#00ff6699;text-shadow:0 0 8px #00ff66}.kc-ctl{position:absolute;z-index:12;left:12px;bottom:12px;border:1px solid #00ff6633;background:#000b;padding:7px 9px;color:#4c8268;font-size:9px;line-height:1.45}.kc-ctl b{color:#00ff91}.kc-prompt,.kc-lock{position:absolute;z-index:13;left:50%;transform:translateX(-50%);background:#000d;font:10px monospace;letter-spacing:.14em;padding:8px 12px;cursor:pointer}.kc-prompt{bottom:82px;border:1px solid #00ff66;color:#bfffd8;box-shadow:0 0 20px #00ff6633}.kc-lock{bottom:31%;border:1px solid #00d9ff88;color:#00d9ff}.kc-note{position:absolute;z-index:14;left:50%;top:13%;transform:translateX(-50%);border:1px solid #00ff66;background:#020805ed;padding:8px 12px;color:#00ff91;font-size:9px;letter-spacing:.09em;text-align:center}.kc-boot{position:absolute;z-index:30;inset:0;background:#04060cf5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:18px}.kc-logo{font-size:clamp(34px,8vw,88px);letter-spacing:.12em;color:#b86bff;text-shadow:0 0 24px #8f4dff}.kc-boot pre{color:#00ff91;line-height:1.7;font-size:11px}.kc-boot button{background:#06030b;border:1px solid #00ff66;color:#00ff91;padding:11px 22px;font:11px monospace;letter-spacing:.22em;cursor:pointer;box-shadow:0 0 18px #00ff6633}.kc-terminal{position:absolute;inset:0;z-index:40;background:#000}.kc-terminal .kt-body{height:100dvh}@media(max-width:700px){.kc-hud{font-size:8px;left:6px;top:6px;padding:6px}.kc-map{right:6px;top:6px;font-size:6px}.kc-ctl{left:6px;bottom:6px;font-size:7px;max-width:72%}.kc-prompt{bottom:68px;font-size:8px}.kc-lock{bottom:26%;font-size:8px}.kc-note{top:18%;width:82%;font-size:8px}.kc-logo{font-size:34px}.kc-boot pre{font-size:9px}}';

export default function AsciiCityWorld(){
  const [params,setParams]=useSearchParams(),back=params.get('spawn')==='console',portal=params.get('spawn')==='portal';
  const queryScene=params.get('scene') as SceneId|null;
  const initialScene:SceneId=queryScene&&SCENES[queryScene]?queryScene:'spring';
  const wrap=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),keys=useRef<Record<string,boolean>>({});
  const phase=useRef<Phase>('explore'),anim=useRef(0),termRef=useRef(false),target=useRef<{kind:'console'|'relic'|'door';scene?:SceneId}|null>(null),lastPaint=useRef(0),lastHud=useRef(0);
  const touchMove=useRef({id:-1,x0:0,y0:0,dx:0,dy:0}),touchLook=useRef({id:-1,x:0,y:0});
  const start=back?RETURN:portal?OUTSIDE:SPAWN,cam=useRef<Cam>({x:start.x,y:start.y,ang:start.a,pitch:0,height:1.55}),seatFrom=useRef({x:RETURN.x,y:RETURN.y,ang:RETURN.a,h:1.55});
  const [scene,setScene]=useState<SceneId>(initialScene);
  const [booted,setBooted]=useState(back||portal),[terminal,setTerminal]=useState(false),[locked,setLocked]=useState(false),[notice,setNotice]=useState(back?'SESSION CLOSED // APSE CONSOLE // TURN AROUND TO EXPLORE K//CITY':portal?'PORTAL LINK // '+SCENES[initialScene].label+' // '+SCENES[initialScene].era:'');
  const [hud,setHud]=useState({area:area(start.x,start.y,initialScene),prompt:null as string|null,fps:0,x:start.x,y:start.y,ang:start.a});termRef.current=terminal;

  const resize=useCallback(()=>{const c=canvas.current,w=wrap.current;if(!c||!w)return;const d=Math.min(2,window.devicePixelRatio||1),ww=w.clientWidth,hh=w.clientHeight;c.width=Math.floor(ww*d);c.height=Math.floor(hh*d);c.style.width=ww+'px';c.style.height=hh+'px';c.getContext('2d')?.setTransform(d,0,0,d,0,0);},[]);
  useEffect(()=>{resize();window.addEventListener('resize',resize);const t=window.setTimeout(()=>setNotice(''),4200);return()=>{window.removeEventListener('resize',resize);window.clearTimeout(t);};},[resize]);
  const lock=useCallback(()=>{if(termRef.current)return;try{const p=canvas.current?.requestPointerLock?.();if(p&&typeof (p as Promise<void>).catch==='function')(p as Promise<void>).catch(()=>{});}catch(_){}},[]);
  const sit=useCallback(()=>{if(phase.current!=='explore')return;const c=cam.current;seatFrom.current={x:c.x,y:c.y,ang:c.ang,h:c.height};anim.current=0;phase.current='sitting';document.exitPointerLock?.();},[]);
  const exit=useCallback(()=>{setTerminal(false);termRef.current=false;anim.current=0;phase.current='standing';setNotice('K TERMINAL CLOSED // BACK AT APSE CONSOLE // TURN AROUND FOR K//CITY');window.setTimeout(()=>setNotice(''),3500);},[]);
  const enterScene=useCallback((next:SceneId)=>{setScene(next);setParams({scene:next,spawn:'portal'},{replace:true});setTerminal(false);termRef.current=false;phase.current='explore';document.exitPointerLock?.();cam.current={x:OUTSIDE.x,y:OUTSIDE.y,ang:OUTSIDE.a,pitch:0,height:1.55};seatFrom.current={x:RETURN.x,y:RETURN.y,ang:RETURN.a,h:1.55};setNotice('PORTAL '+next.toUpperCase()+' // '+SCENES[next].label+' // '+SCENES[next].era);window.setTimeout(()=>setNotice(''),3600);},[setParams]);
  const interact=useCallback(()=>{if(phase.current!=='explore')return;const t=target.current;if(!t)return;if(t.kind==='console')sit();else if(t.kind==='relic'){setNotice('SIGNAL SCRIPTURE // ARCHIVE LINK VERIFIED');window.setTimeout(()=>setNotice(''),2200);}else if(t.kind==='door'&&t.scene)enterScene(t.scene);},[sit,enterScene]);

  useEffect(()=>{const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();keys.current[k]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='e')interact();if(k==='escape'&&termRef.current)exit();};const up=(e:KeyboardEvent)=>{keys.current[e.key.toLowerCase()]=false;};const pl=()=>setLocked(document.pointerLockElement===canvas.current);const mm=(e:MouseEvent)=>{if(document.pointerLockElement!==canvas.current||phase.current!=='explore')return;cam.current.ang+=e.movementX*.00235;cam.current.pitch=Math.max(-13,Math.min(13,cam.current.pitch-e.movementY*.07));};window.addEventListener('keydown',down);window.addEventListener('keyup',up);document.addEventListener('pointerlockchange',pl);document.addEventListener('mousemove',mm);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);document.removeEventListener('pointerlockchange',pl);document.removeEventListener('mousemove',mm);};},[interact,exit]);

  const ts=useCallback((e:React.TouchEvent)=>{const half=window.innerWidth/2;for(const t of Array.from(e.changedTouches)){if(t.clientX<half&&touchMove.current.id===-1)touchMove.current={id:t.identifier,x0:t.clientX,y0:t.clientY,dx:0,dy:0};else if(touchLook.current.id===-1)touchLook.current={id:t.identifier,x:t.clientX,y:t.clientY};}},[]);
  const tm=useCallback((e:React.TouchEvent)=>{for(const t of Array.from(e.changedTouches)){if(t.identifier===touchMove.current.id){touchMove.current.dx=Math.max(-1,Math.min(1,(t.clientX-touchMove.current.x0)/65));touchMove.current.dy=Math.max(-1,Math.min(1,(t.clientY-touchMove.current.y0)/65));}else if(t.identifier===touchLook.current.id&&phase.current==='explore'){cam.current.ang+=(t.clientX-touchLook.current.x)*.0065;cam.current.pitch=Math.max(-13,Math.min(13,cam.current.pitch-(t.clientY-touchLook.current.y)*.13));touchLook.current.x=t.clientX;touchLook.current.y=t.clientY;}}},[]);
  const te=useCallback((e:React.TouchEvent)=>{for(const t of Array.from(e.changedTouches)){if(t.identifier===touchMove.current.id)touchMove.current={id:-1,x0:0,y0:0,dx:0,dy:0};if(t.identifier===touchLook.current.id)touchLook.current={id:-1,x:0,y:0};}},[]);

  const draw=useCallback((time:number,fps:number)=>{const c=canvas.current,w=wrap.current;if(!c||!w)return;const ctx=c.getContext('2d');if(!ctx)return;const ww=w.clientWidth,hh=w.clientHeight,targetCols=ww<700?94:ww<1100?120:154,fs=Math.max(7,(ww/targetCols)/.62);ctx.font=fs+'px '+FONT;const cw=ctx.measureText('M').width||fs*.62,ch=fs*1.03,cols=Math.max(48,Math.floor(ww/cw)),rows=Math.max(26,Math.floor(hh/ch)),chars=Array.from({length:rows},()=>Array(cols).fill(' ')),colors=Array.from({length:rows},()=>Array(cols).fill('#07101b')),zb=new Float32Array(cols),cc=cam.current,hor=Math.floor(rows*.49+cc.pitch);
    const cfg=SCENES[scene],royal=cc.y<=12.6&&cc.x>8&&cc.x<32;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){if(y<hor){const weather=(x*17+y*7+Math.floor(time*(scene==='winter'?18:34)))%67===0,star=(x*41+y*13)%257===0;if(royal){chars[y][x]=weather?'│':star?'·':' ';colors[y][x]=weather?'#3a2055':'#1c1028';}else{chars[y][x]=weather?cfg.weather:star?'·':' ';colors[y][x]=weather?cfg.weatherColor:cfg.sky;}}else{const chk=((Math.floor(x/3)+Math.floor((y-hor)/2))&1)===0;chars[y][x]=scene==='autumn'?(chk?',':'·'):scene==='winter'?(chk?'·':'_'):scene==='light'?(chk?'·':'+'):scene==='dark'?(chk?'.':':'):(chk?'·':'░');colors[y][x]=royal?(chk?'#24182f':'#15101d'):(chk?cfg.floorA:cfg.floorB);}}
    for(let x=0;x<cols;x++){const rx=(x/Math.max(1,cols-1)-.5)*2,ra=cc.ang+rx*(FOV/2),dx=Math.cos(ra),dy=Math.sin(ra),hit=cast(cc.x,cc.y,dx,dy,42);if(!hit){zb[x]=999;continue;}const d=Math.max(.08,hit.dist*Math.cos(ra-cc.ang));zb[x]=d;const wh=Math.min(rows*1.5,(rows*1.05)/d),top=Math.max(0,Math.floor(hor-wh*.56)),bot=Math.min(rows-1,Math.ceil(hor+wh*.44));const fixed=hit.iy<=12||'GACP123456'.includes(hit.tile),base=DOOR_COLOR[hit.tile]||COLORS[hit.tile]||(hit.tile==='N'?cfg.neon:cfg.wall),sh=fixed?(d<3?['█','▓','▒']:d<7?['▓','▒','░']:['▒','░','·']):cfg.wallChars;for(let y=top;y<=bot;y++){const band=Math.floor((y-top)/Math.max(1,bot-top)*3);chars[y][x]=hit.tile==='C'&&(x+y)%7===0?'▣':DOOR_SCENE[hit.tile]&&y===Math.round((top+bot)/2)?hit.tile:sh[Math.min(2,band)];colors[y][x]=hit.side?dim(base,.72):base;}}
    const sceneSign={x:20,y:16.3,t:['['+scene.toUpperCase()+'] '+cfg.label,cfg.era],c:cfg.accent};
    const allSigns=[...SIGNS,...DOOR_SIGNS,sceneSign];
    for(const sg of allSigns){const dx=sg.x-cc.x,dy=sg.y-cc.y,d=Math.hypot(dx,dy);if(d<.3||d>18)continue;const rel=norm(Math.atan2(dy,dx)-cc.ang);if(Math.abs(rel)>FOV*.64)continue;const sx=Math.round((.5+rel/FOV)*cols),ci=Math.max(0,Math.min(cols-1,sx));if(d>zb[ci]+.6)continue;const sy=Math.round(hor-(rows*.28)/Math.max(1.1,d));sg.t.forEach((line,li)=>{const st=Math.round(sx-line.length/2);for(let q=0;q<line.length;q++){const xx=st+q,yy=sy+li;if(xx>=0&&xx<cols&&yy>=0&&yy<rows){chars[yy][xx]=line[q];colors[yy][xx]=sg.c;}}});}
    ctx.fillStyle='#04060c';ctx.fillRect(0,0,ww,hh);ctx.textBaseline='top';for(let y=0;y<rows;y++){let x=0;while(x<cols){const co=colors[y][x];let e=x+1;while(e<cols&&colors[y][e]===co)e++;const str=chars[y].slice(x,e).join('');if(str.trim()){ctx.fillStyle=co;ctx.fillText(str,x*cw,y*ch);}x=e;}}
    const hit=phase.current==='explore'?cast(cc.x,cc.y,Math.cos(cc.ang),Math.sin(cc.ang),3.2):null;const door=hit?DOOR_SCENE[hit.tile]:undefined;target.current=hit&&hit.dist<2.65&&hit.tile==='C'?{kind:'console'}:hit&&hit.dist<2.4&&hit.tile==='A'?{kind:'relic'}:hit&&hit.dist<2.8&&door?{kind:'door',scene:door}:null;if(time-lastHud.current>.12){lastHud.current=time;const prompt=target.current?.kind==='console'?'[E] SIT AT K TERMINAL':target.current?.kind==='relic'?'[E] INSPECT SIGNAL RELIC':target.current?.kind==='door'&&target.current.scene?'[E] ENTER '+target.current.scene.toUpperCase()+' // '+SCENES[target.current.scene].label:null;setHud({area:area(cc.x,cc.y,scene),prompt,fps,x:cc.x,y:cc.y,ang:cc.ang});}},[scene]);

  useEffect(()=>{let raf=0,last=performance.now(),ff=0,clock=0,fps=0;const frame=(now:number)=>{raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;ff++;clock+=dt;if(clock>=.5){fps=Math.round(ff/clock);ff=0;clock=0;}const c=cam.current;if(phase.current==='explore'&&booted){const k=keys.current;let fw=0,st=0;if(k.w||k.arrowup)fw++;if(k.s||k.arrowdown)fw--;if(k.a)st--;if(k.d)st++;if(touchMove.current.id!==-1){fw-=touchMove.current.dy;st+=touchMove.current.dx;}if(k.arrowleft)c.ang-=1.8*dt;if(k.arrowright)c.ang+=1.8*dt;const sp=(k.shift?3.7:2.55)*dt,dx=Math.cos(c.ang),dy=Math.sin(c.ang),mx=(dx*fw-dy*st)*sp,my=(dy*fw+dx*st)*sp,r=.24;if(!solid(c.x+mx+Math.sign(mx||1)*r,c.y))c.x+=mx;if(!solid(c.x,c.y+my+Math.sign(my||1)*r))c.y+=my;}if(phase.current==='sitting'||phase.current==='standing'){anim.current=Math.min(1,anim.current+dt/.72);const e=anim.current,sm=e*e*(3-2*e),from=seatFrom.current,to={x:SEAT.x,y:SEAT.y,ang:SEAT.a,h:1.2},aa=phase.current==='sitting'?from:to,bb=phase.current==='sitting'?to:from,da=norm(bb.ang-aa.ang);c.x=aa.x+(bb.x-aa.x)*sm;c.y=aa.y+(bb.y-aa.y)*sm;c.ang=aa.ang+da*sm;c.height=aa.h+(bb.h-aa.h)*sm;c.pitch*=1-sm;if(e>=1){if(phase.current==='sitting'){phase.current='seated';setTerminal(true);termRef.current=true;}else phase.current='explore';}}if(now-lastPaint.current>32){lastPaint.current=now;draw(now/1000,fps);}};raf=requestAnimationFrame(frame);return()=>cancelAnimationFrame(raf);},[booted,draw]);
  const map=useMemo(()=>mini(hud.x,hud.y,hud.ang),[hud.x,hud.y,hud.ang]);
  const sceneCfg=SCENES[scene];

  return <div className="kcity"><div ref={wrap} className="kc-wrap"><canvas ref={canvas} onClick={lock} onTouchStart={ts} onTouchMove={tm} onTouchEnd={te} onTouchCancel={te}/></div><div className="kc-scan"/><div className="kc-vig"/>
    {booted&&!terminal&&<><div className="kc-hud"><b>K//CITY ASCII-RT v4.0</b><span>{hud.area}</span><small>PORTAL {scene.toUpperCase()} // {sceneCfg.era}</small><small>POS {hud.x.toFixed(1)}:{hud.y.toFixed(1)} · {hud.fps}FPS</small></div><pre className="kc-map">SCAN GRID{"\n"}{map}</pre><div className="kc-cross">+</div><div className="kc-ctl">[WASD] WALK · [MOUSE/DRAG] LOOK · [SHIFT] RUN · [E] INTERACT<br/><b>GALLERY DOORS: SPRING · SUMMER · AUTUMN · WINTER · LIGHT · DARK</b></div>{hud.prompt&&<button className="kc-prompt" onClick={interact}>{hud.prompt}</button>}{!locked&&<button className="kc-lock" onClick={lock}>CLICK TO CAPTURE MOUSE</button>}</>}
    {notice&&!terminal&&<div className="kc-note">{notice}</div>}
    {!booted&&<div className="kc-boot"><div className="kc-logo">K//THE EMRLD</div><pre>{'☿ SOLVE / COAGULA ☉\n> booting ASCII raycaster ........ ok\n> mounting K//GALLERY royal nexus  ok\n> six seasonal/light/dark doors .. online\n> TECHOPS city grid .............. online\n> apse K Terminal ................ armed'}</pre><button onClick={()=>{setBooted(true);lock();}}>ENTER K//CITY</button></div>}
    {terminal&&<div className="kc-terminal"><KTerminal embedded onExitToCity={exit} onEnterScene={enterScene}/></div>}<style>{CSS}</style></div>;
}
