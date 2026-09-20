import {Geometry, hex, TAU, modelMatrix, clamp} from './renderer.js';
import {ART,WORLDS} from './data.js';
const GOLD='#a17c45', BRONZE='#604424', STONE='#2f2939', CEDAR='#2b1e24', GREEN='#59ecab', VIOLET='#a476dc';
function label(g,a,text,x,y,z,w,h,color,yaw=0,opts={}){g.plane(x,y,z,w,h,yaw,'#ffffff',{texture:a.label(Array.isArray(text)?text:[text],color,opts),emission:opts.emission??.8});}
function frame(g,a,id,x,y,z,w,h,yaw=0){
 const art=ART.find(p=>p.id===id),image=a.images.get(id);const aspect=image?image.naturalWidth/image.naturalHeight:1;
 // Fit, never stretch, crop, or share atlas coordinates. The full uploaded work stays intact.
 const ih=Math.min(h,w/aspect),iw=ih*aspect;
 g.plane(x,y,z,w+.18,h+.18,yaw,'#08060b',{emission:.5});
 const right=[Math.cos(yaw),0,-Math.sin(yaw)],normal=[Math.sin(yaw),0,Math.cos(yaw)];
 const p=(sx,sy,d=0)=>[x+right[0]*sx+normal[0]*d,y+sy,z+right[2]*sx+normal[2]*d];
 const corners=[p(-w/2-.06,-h/2-.06,.035),p(w/2+.06,-h/2-.06,.035),p(w/2+.06,h/2+.06,.035),p(-w/2-.06,h/2+.06,.035)];
 for(let i=0;i<4;i++)g.beam(corners[i],corners[(i+1)%4],.045,GOLD,{emission:.28});
 g.plane(x+normal[0]*.026,y,z+normal[2]*.026,iw,ih,yaw,'#ffffff',{texture:id,emission:1});
 label(g,a,[`K//ARCHIVE ${art.letter}`],x+normal[0]*.06,y-h/2-.29,z+normal[2]*.06,Math.max(1.35,w*.75),.25,'#00ff41',yaw,{fontSize:32,width:768,height:96,border:false,background:'#010401'});
 // Real small fixture above the work; spot response is deliberately restrained.
 const lamp=p(0,h/2+.38,.30);g.box(...lamp,.22,.09,.26,'#423333');g.box(lamp[0],lamp[1]-.05,lamp[2],.15,.023,.15,'#ffcfa0',{emission:1.05});
 g.interactions.push({id:'art-'+id,type:'art',art:id,title:art.title,position:p(0,0,.25),radius:4.5});
}
function column(g,x,z,height=9,r=.28,name){
 g.cylinder(x,height/2,z,r,height,BRONZE,16);g.cylinder(x,.24,z,r*1.7,.48,GOLD,16);
 for(const y of [.52,height-.6,height-.35,height-.13])g.cylinder(x,y,z,r*1.45,.11,GOLD,16);
 for(let i=0;i<10;i++){let angle=i*TAU/10;g.cylinder(x+Math.cos(angle)*r*.96,height/2,z+Math.sin(angle)*r*.96,.026,height-.75,'#997244',5);}
 g.colliders.push({minX:x-r*1.3,maxX:x+r*1.3,minZ:z-r*1.3,maxZ:z+r*1.3,minY:0,maxY:height});
}
function bench(g,x,z,w=3.2){g.box(x,.58,z,w,.22,.82,'#332435',{solid:true});g.box(x,.45,z,w,.12,.83,GOLD);for(const dx of [-w*.4,w*.4])for(const dz of [-.26,.26])g.box(x+dx,.25,z+dz,.1,.5,.1,'#766040');}
function crystalStatue(g,x,y,z,scale=1){const spin=t=>modelMatrix(x,y,z,0,t*.11,0),o={transform:spin};g.crystal(0,0,0,scale*.38,scale*.85,'#59e7bb',{...o,emission:.75});for(const [rx,rz] of [[.4,.4],[-.4,1.2],[1.1,.2]]){const transform=t=>modelMatrix(x,y,z,rx,t*.08,rz);g.ring(0,0,0,scale,.018,GOLD,{transform,emission:.6});}}
function stars(g,seed=13){const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<130;i++){const angle=rand()*TAU,el=rand()*1.3+.05,r=60;g.box(Math.cos(angle)*r*Math.cos(el),Math.sin(el)*r,Math.sin(angle)*r*Math.cos(el),.08+rand()*.11,.08,.06,i%5?'#b6c9e6':'#ffe7ac',{emission:1});}}
function gate(g,a,id,x,z,title,color,to,meta={}){
 g.box(x-1.28,1.45,z,.18,2.9,.32,'#292536',{solid:true});g.box(x+1.28,1.45,z,.18,2.9,.32,'#292536',{solid:true});g.box(x,2.91,z,2.72,.19,.32,'#514156');
 g.box(x-1.14,1.4,z+.17,.045,2.8,.025,color,{emission:1});g.box(x+1.14,1.4,z+.17,.045,2.8,.025,color,{emission:1});g.box(x,2.82,z+.17,2.30,.04,.025,color,{emission:1});
 label(g,a,[title],x,3.35,z+.05,2.85,.48,color,0,{fontSize:40});
 g.plane(x,1.42,z-.05,2.16,2.7,0,'#0e1220');
 label(g,a,['[ E ]','TRAVEL'],x,1.5,z+.01,1.3,.7,color,0,{border:false,fontSize:50});
 g.interactions.push({id,type:'gate',to,title,position:[x,1.55,z+1.15],radius:2.9,...meta});
}
const BASE={background:hex('#090912'),ambient:[.53,.49,.62],fog:.011,spawn:[0,1.7,11],yaw:0,bounds:[-11,11,-16,16],lights:[{position:[-7,5,1],color:[.42,.16,.55],reactive:.04},{position:[7,5,-6],color:[.05,.39,.40],reactive:.04},{position:[0,7,-10],color:[.55,.33,.13],reactive:.04},{position:[0,6,10],color:[.40,.28,.19]}]};
export function buildGallery(a){const g=new Geometry();
 g.floor(0,0,24,34,'#19141e',{kind:1});
 g.box(-12,5.5,0,.5,11,34,CEDAR,{solid:true});g.box(12,5.5,0,.5,11,34,CEDAR,{solid:true});g.box(0,5.5,-17,24,11,.5,CEDAR,{solid:true});
 // Doorway wall is physically open in the center, never a giant overlay.
 g.box(-7,5.5,17,10,11,.4,CEDAR,{solid:true});g.box(7,5.5,17,10,11,.4,CEDAR,{solid:true});g.box(0,7.5,17,4,7,.4,CEDAR,{solid:true});
 // Pitched ceiling, readable overhead ribs, an upper balcony on each side.
 g.face([[-12,10.8,17],[0,14,17],[0,14,-17],[-12,10.8,-17]],'#19131f');g.face([[0,14,17],[12,10.8,17],[12,10.8,-17],[0,14,-17]],'#19131f');
 for(let z=-15;z<=15;z+=6){g.beam([-11.8,10.65,z],[0,13.85,z],.095,GOLD);g.beam([0,13.85,z],[11.8,10.65,z],.095,GOLD);g.arch(0,7.8,z,22,5.7,'#54403a');}
 for(const side of [-1,1]){
  g.box(side*10.8,6.6,0,2.2,.18,32,'#19131f');g.box(side*9.75,7.7,0,.075,.08,32,GOLD);
  for(let z=-15.5;z<16;z+=.66)g.box(side*9.75,7.17,z,.042,1.02,.045,'#68513a');
  g.box(side*11.72,5.95,0,.075,.043,32,side<0?'#49bbcc':'#bb67cf',{emission:1});
  for(const z of [-14,-7.5,-2.8,3,7.8,13]){column(g,side*10.9,z,10.8,.25);}
  for(let z=-13;z<=13;z+=6.5){
   const x=side*11.72;g.plane(x,8.7,z,3.65,3.45,side<0?Math.PI/2:-Math.PI/2,'#594076',{emission:.7});
   for(let dz=-1.6;dz<=1.6;dz+=.53)g.beam([x-side*.04,7.05,z+dz],[x-side*.04,10.32,z+dz],.035,'#27202d');
   for(let y=7.6;y<10.3;y+=.8)g.beam([x-side*.05,y,z-1.78],[x-side*.05,y,z+1.78],.025,'#342538');
  }
 }
 // Individually modeled, carved cedar wall bays and stained-glass textures.
 for(const side of [-1,1])for(let z=-13.2;z<15;z+=6.0){
  g.plane(side*11.715,3.02,z,5.94,5.65,side<0?Math.PI/2:-Math.PI/2,'#ffffff',{texture:a.material('cedar'),emission:.36});
  g.plane(side*11.715,8.7,z,3.55,3.36,side<0?Math.PI/2:-Math.PI/2,'#ffffff',{texture:a.material('window'),emission:.76});
 }
 // Fine ornamental borders on the entrance and sanctuary wall.
 for(const x of [-9,-4.5,0,4.5,9])g.plane(x,3.1,-16.74,4.42,5.9,0,'#ffffff',{texture:a.material('cedar'),emission:.35});
 // Cedar panels, palm/pomegranate ornamental band, gold procession aisle.
 for(const side of [-1,1])for(let z=-12;z<15;z+=6)g.plane(side*11.72,6.23,z,5.9,.42,side<0?Math.PI/2:-Math.PI/2,'#ffffff',{texture:a.ornament(),emission:.45});
 for(const side of [-1,1])g.box(side*3.9,.008,0,.025,.015,32,GOLD,{emission:.5});
 label(g,a,['K // GALLERY','T H E  E M R L D'],0,9.35,-16.71,11,1.8,'#cb9aef',0,{fontSize:105,width:1536,height:320,border:false});
 // Reference-style A-E left, F-G central, H-J right, personal diptych beside entry.
 frame(g,a,'cope',-11.69,3.72,-9.4,2.75,3.3,Math.PI/2);
 frame(g,a,'fear',-11.69,3.66,-5.5,2.65,3.25,Math.PI/2);
 frame(g,a,'death-eater',-11.69,3.4,-.6,3.85,2.7,Math.PI/2);
 frame(g,a,'wolf',-11.69,2.85,4.9,2.65,2.65,Math.PI/2);
 frame(g,a,'garden',-11.69,3,9.2,3.0,2.65,Math.PI/2);
 frame(g,a,'meteor',-4.9,3.6,-16.65,3.1,4.12,0);
 frame(g,a,'cathedral',4.4,3.6,-16.65,3.8,3.8,0);
 frame(g,a,'blue-relic',11.69,3.5,-10.0,2.9,2.95,-Math.PI/2);
 frame(g,a,'neon-cosmos',11.69,3.5,-5.4,3.05,3.05,-Math.PI/2);
 frame(g,a,'equations',11.69,3.0,.1,3.6,3.1,-Math.PI/2);
 frame(g,a,'self-i',11.69,2.65,5.8,1.7,2.5,-Math.PI/2);
 frame(g,a,'self-ii',11.69,2.65,9.4,2.15,2.35,-Math.PI/2);
 // Narrow bronze pillars mark the threshold. Inspired motifs, not an archaeological replica.
 column(g,-3.9,11.7,9.5,.34);column(g,3.9,11.7,9.5,.34);
 label(g,a,['JACHIN'], -3.9,1.08,12.17,1.2,.28,'#d3b785',0,{fontSize:35,border:false});label(g,a,['BOAZ'],3.9,1.08,12.17,1.2,.28,'#d3b785',0,{fontSize:35,border:false});
 // The sculpture can be walked around; collision matches its stone pedestal.
 g.box(0,.58,-6.8,3.0,1.16,2.4,'#211c25',{solid:true});g.box(0,1.19,-6.8,3.1,.07,2.5,GOLD);
 label(g,a,['THE EMRLD','SOME THINGS DECAY.','SOME THINGS REMAIN.','SOME THINGS TRANSCEND.'],0,.60,-5.56,2.54,.84,'#ba92d1',0,{fontSize:52,border:false});
 crystalStatue(g,0,2.7,-6.8,1.1);
 for(const x of [-6.5,6.5])for(const z of [-1.8,5.4])bench(g,x,z,3.1);
 // Banners occupy the upper nave; they never cover the player's view.
 label(g,a,['ART','SURVIVES','STILL','K'],0,7.1,-16.4,1.7,3.6,'#c9a0e3',0,{fontSize:68,width:384,height:1024,background:'#29152e',border:true});
 // CRT and wood console.
 g.box(7.8,.56,12.0,2.4,1.12,1.15,'#281b27',{solid:true});g.box(7.8,1.46,12.0,1.04,.82,.52,'#34323c');
 label(g,a,['> ART','> SURVIVES','> STILL','> K TERMINAL _'],7.8,1.46,12.285,.86,.65,'#50f0a0',0,{width:512,height:384,fontSize:42,border:false,background:'#04120e'});
 g.interactions.push({id:'console',type:'terminal',title:'K TERMINAL / AUDIO AUTHORITY',position:[7.8,1.55,13.2],radius:2.7});
 // Books and low candles are geometry, not screen decorations.
 for(const x of [-8.8,8.8])for(let z=-12;z<14;z+=5.5){g.cylinder(x,.85,z,.055,1.7,GOLD,6);g.box(x,1.73,z,.08,.25,.08,'#f2bd70',{emission:1});}
 label(g,a,['K // LIVING ARCHIVE','LOOK AWAY · RETURN CHANGED'],0,4.15,16.72,3.8,.62,'#00ff41',0,{fontSize:38,width:1024,height:192,border:false,background:'#010401'});
 gate(g,a,'gallery-exit',0,16.1,'K // CITY',GREEN,'city');
 return g.finish({...BASE,id:'gallery',title:'K // GALLERY',subtitle:'Art · memory · sacred systems',spawn:[0,1.7,10.5],yaw:0,bounds:[-11.5,11.5,-16.5,16.5]});
}
function shop(g,a,x,z,width,height,title,sub,color){const side=x<0?-1:1,faceX=x-side*width/2;g.box(x,height/2,z,width,height,7,'#242639',{solid:true});
 // Sign faces the road. Shopfront rhythm and window mullions, not giant billboards.
 const yaw=side<0?Math.PI/2:-Math.PI/2;
 label(g,a,[title,sub],faceX-side*.04,3.05,z,5.4,1.2,color,yaw,{fontSize:68,width:1024,height:256});
 g.plane(faceX-side*.045,1.28,z,5.55,2,yaw,'#203647',{emission:.42});
 for(const dz of [-2.55,-1.27,0,1.27,2.55])g.box(faceX-side*.06,1.35,z+dz,.055,2.2,.07,'#646379');
 for(let yy=5.0;yy<height;yy+=2.0)for(const dz of [-2.5,-1.2,0,1.2,2.5])g.plane(faceX-side*.07,yy,z+dz,.66,1,yaw,((Math.floor(yy)+Math.round(dz*5))%3===0)?'#93649f':'#517083',{emission:.48});
 // Black projecting awning gives each entry depth.
 g.box(faceX-side*.8,2.65,z,1.5,.13,6.0,'#272432');
}
function streetLamp(g,x,z){g.cylinder(x,2.4,z,.055,4.8,'#41404c',8);g.beam([x,4.75,z],[x-Math.sign(x)*.6,4.9,z],.045,'#68606a');g.box(x-Math.sign(x)*.62,4.86,z,.30,.07,.42,'#ffcfa1',{emission:1});}
export function buildCity(a){const g=new Geometry();
 g.floor(0,0,32,64,'#ffffff',{texture:a.floorTexture('asphalt')});g.box(-7.5,.13,0,5,.26,62,'#303541');g.box(7.5,.13,0,5,.26,62,'#303541');
 for(const x of [-5.1,5.1])g.box(x,.28,0,.14,.12,62,'#687180');
 for(let z=-28;z<=29;z+=3)g.box(0,.009,z,.10,.018,1.35,'#c69c50',{emission:.35});
 for(let x=-4;x<=4;x+=1.2)g.box(x,.017,4,.65,.025,3.0,'#646874');
 const shops=[['K // RECORDS','MUSIC · ART · IDEAS','#d479d6'],['RESIDUAL','AGENTS / EVIDENCE / REPLAY','#8fc4ff'],['PALANROOF','PERMITS → MAPS → LEADS','#ebbb72'],['TECHOPS CAFE','COFFEE / TICKETS / SOLUTIONS','#71dabc'],['VECTOR LAB','VISION · SKILLS · SAFETY','#53dfd0'],['TECHOPS HERO','EVERY TICKET IS A DUNGEON','#baa1f2']];
 for(let i=0;i<6;i++){const side=i<3?-1:1,j=i%3,z=-19+j*13;shop(g,a,side*12,z,8,14+(j%2)*6,...shops[i]);}
 for(const x of [-6.6,6.6])for(let z=-24;z<22;z+=8){streetLamp(g,x,z);g.box(x,.4,z+2,.9,.8,.9,'#3c353b',{solid:true});g.sphere(x,1,z+2,.65,'#375348',{},4,8);}
 // Overhead sky bridge, fire escapes and utility bundles give the street depth.
 g.box(0,7.0,-9,23,.27,2.0,'#343042');g.box(0,8.1,-10,23,.06,.05,'#5e5f71');for(let x=-11;x<12;x+=.8)g.box(x,7.6,-10,.035,1.0,.035,'#5b5c67');
 for(const x of [-8,8])for(let z=-18;z<=8;z+=13){for(let y=5;y<13;y+=2){g.box(x,y,z,1.2,.05,1.8,'#4b424c');g.beam([x,y,z-.7],[x,y+2,z+.7],.035,'#6e5967');}}
 for(let i=0;i<3;i++)g.beam([-10,10+i*.18,-21],[10,9+i*.18,-21],.023,'#41404f');
 label(g,a,['K // THE EMRLD','DOWNTOWN / NEW HAVEN','BUILD · VERIFY · OPERATE'],0,10,-28,11,2.4,'#b589ea',0,{fontSize:74,width:1536,height:384});
 gate(g,a,'city-gallery',0,-27,'GALLERY / ART SURVIVES STILL',GOLD,'gallery');
 // Six travel doors form a deliberate terminal plaza, not a hidden threshold.
 for(let i=0;i<WORLDS.length;i++){const w=WORLDS[i],x=(i%3-1)*6,z=19+Math.floor(i/3)*8;gate(g,a,'city-'+w.id,x,z,w.name+' / '+w.subtitle.toUpperCase(),w.color,w.id);}
 // Parked K car. Entry is a real interactable. Dashboard mode is controlled by the app.
 g.box(3.4,.57,-2,1.9,.62,4.0,'#292335',{solid:true});g.box(3.4,1.03,-2.1,1.68,.65,1.9,'#282e44');for(const x of [2.45,4.35])for(const z of [-3.25,-.7])g.box(x,.35,z,.26,.56,.58,'#090a11');g.box(3.4,.7,-4.04,1.65,.13,.04,'#ca9af2',{emission:1});
 g.interactions.push({id:'car',type:'car',title:'K // DRIVE · FLAG',position:[2,1.55,-2],radius:2.5});
 stars(g);
 return g.finish({...BASE,id:'city',title:'K // CITY',subtitle:'Downtown / project districts',background:hex('#080f1e'),spawn:[0,1.7,12],yaw:0,bounds:[-8.0,8.0,-29,29.5],lights:[{position:[-6,6,-18],color:[.48,.12,.50]},{position:[6,6,-5],color:[.05,.38,.40]},{position:[-6,5,9],color:[.48,.15,.42]},{position:[0,8,22],color:[.18,.28,.29]}]});
}
function realmBase(g,a,id,color){gate(g,a,'return',0,15,'RETURN / K // CITY',color,'city');g.interactions[g.interactions.length-1].returnGate=true;}
function palm(g,x,z,height=6){const brown='#6e583d',green='#488563';for(let j=0;j<5;j++)g.beam([x+j*.09,j*height/5,z],[x+(j+1)*.09,(j+1)*height/5,z],.09,brown);for(let i=0;i<9;i++){const angle=i*TAU/9,dx=Math.cos(angle),dz=Math.sin(angle);const root=[x+.45,height,z],tip=[x+.45+dx*3.2,height-.7,z+dz*3.2],mid=[x+.45+dx*1.65,height+.48,z+dz*1.65];g.face([root,[mid[0]-dz*.4,mid[1],mid[2]+dx*.4],tip,[mid[0]+dz*.4,mid[1],mid[2]-dx*.4]],green);}}
export function buildRealm(a,id){const g=new Geometry(),w=WORLDS.find(w=>w.id===id),color=w.color;realmBase(g,a,id,color);let config={...BASE,id,title:w.name+' // '+w.subtitle.toUpperCase(),subtitle:w.description,spawn:[0,1.7,10.5],yaw:0,bounds:[-17,17,-21,16.2],lights:[{position:[-6,6,-4],color:hex(color).map(v=>v*.43)},{position:[6,5,-10],color:hex(color).map(v=>v*.36)},{position:[0,6,7],color:[.3,.26,.24]},{position:[0,10,-16],color:[.34,.31,.28]}]};
 if(id==='sol'){
  config.background=hex('#2b535b');config.ambient=[.88,.86,.70];config.fog=.018;
  g.floor(0,0,38,46,'#ffffff',{texture:a.floorTexture('sand')});g.floor(-9,-2,13,31,'#267c84',{kind:2,y:.014});
  for(let i=0;i<9;i++){palm(g,-16+(i%3)*4,-16+Math.floor(i/3)*12,5+(i%2));palm(g,10+(i%2)*4,-18+i*3.8,5.4);}
  // Low stepped solar sanctuary, not an arbitrary colored city block.
  for(let i=0;i<5;i++)g.box(3,.22+i*.32,-12,10-i*1.15,.42,8-i*.8,'#71684b',{solid:i===0});
  for(const x of [-.2,6.2]){column(g,x,-13.5,5,.25);}
  g.box(3,5.1,-13.5,8,.38,1.0,'#827347');g.ring(3,4.05,-13.15,1.15,.08,'#ffce68',{emission:.6});
  g.sphere(-18,27,-55,4.8,'#ffd596',{emission:1},12,24);
  label(g,a,['S O L','TROPICAL TEMPLE','PARADISE AWAITS'],3,2.35,-11.48,3.5,1.1,'#ffdd97',0,{background:'#4d4530'});
  g.box(4,.9,-5,2,1.8,1.5,'#655c42',{solid:true});
 } else if(id==='torus'){
  config.background=hex('#051c1a');config.ambient=[.54,.76,.68];g.floor(0,0,38,46,'#ffffff',{texture:a.floorTexture('halo')});g.floor(0,-5,22,22,'#185851',{kind:2,y:.02});
  // Raised concentric walk rings, four radial bridges, transparent center garden.
  for(const r of [4,8,12])for(let i=0;i<48;i++){const angle=i*TAU/48,x=r*Math.cos(angle),z=-5+r*Math.sin(angle);g.box(x,.13,z,.8,.26,.8,'#486e58');}
  for(const x of [-8,8])g.box(x,.19,-5,1.8,.38,25,'#436555');g.box(0,.19,2,27,.38,1.8,'#436555');
  g.ring(0,7,-6,8.2,.18,'#4df0ac',{emission:.6});g.ring(0,7,-6,6.9,.08,'#71d3b2',{emission:.35});
  for(const x of [-13,13])for(let z=-17;z<10;z+=6){g.cylinder(x,2.5,z,.14,5,'#375747',10);g.sphere(x,4.8,z,1.2,'#34825d',{},6,10);}
  crystalStatue(g,0,2.5,-6,1.6);label(g,a,['E M E R A L D  H A L O','LOOP / GROW / REGENERATE'],0,9.6,-6,7.3,1.1,'#69efbc');
 } else if(id==='prism'){
  config.background=hex('#061523');config.ambient=[.43,.62,.80];g.floor(0,0,38,46,'#ffffff',{texture:a.floorTexture('crystal')});g.box(-18,5,-2,.7,10,44,'#172132',{solid:true});g.box(18,5,-2,.7,10,44,'#172132',{solid:true});
  g.box(0,12,-2,36,.7,44,'#111c30');
  for(let i=0;i<22;i++){const side=i%2?-1:1,x=side*(6+(i%4)*2.9),z=-19+Math.floor(i/2)*2.8,h=3+(i%5)*1.2;g.crystal(x,.5,z,1+(i%3)*.3,h,i%3?'#3a7c9e':'#78c7df',{emission:.25});g.colliders.push({minX:x-1,maxX:x+1,minZ:z-1,maxZ:z+1,minY:0,maxY:h});}
  for(let i=0;i<12;i++)g.crystal(-14+i*2.5,11,-11+(i%3)*6,.55,-2.0,'#317894');
  g.floor(0,-11,7,8,'#143f53',{kind:2,y:.016});label(g,a,['P R I S M','SEE DEEPER'],0,5.5,-19,6,1.8,'#74ddfa');
 } else if(id==='tesseract'){
  config.background=hex('#16040c');config.ambient=[.7,.35,.45];g.floor(0,-2,36,44,'#ffffff',{texture:a.floorTexture('red')});
  // Walk-through nested frames, spaced in depth, no screen-space fake tunnel.
  for(let z=8;z>=-18;z-=4){const size=6.6+(z+18)*.05;for(const x of [-size,size])g.box(x,4.5,z,.13,9,.13,'#d3405f',{emission:.65});g.box(0,9,z,size*2,.13,.13,'#e74a65',{emission:.7});g.box(0,.03,z,size*2,.055,.08,'#b12f4d',{emission:.7});}
  for(let x=-16;x<=16;x+=2)g.box(x,.012,-2,.02,.02,42,'#713346',{emission:.75});for(let z=-22;z<=18;z+=2)g.box(0,.015,z,34,.02,.025,'#9e3851',{emission:.7});
  const spin=t=>modelMatrix(0,4,-12,t*.12,t*.23,t*.05);const opt={transform:spin,emission:.7};
  for(const size of [1.3,2.6]){for(const x of [-size,size])for(const y of [-size,size])g.beam([x,y,-size],[x,y,size],.035,'#ff617b',opt);for(const x of [-size,size])for(const z of [-size,size])g.beam([x,-size,z],[x,size,z],.035,'#ff617b',opt);for(const y of [-size,size])for(const z of [-size,size])g.beam([-size,y,z],[size,y,z],.035,'#ff617b',opt);}
  for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])g.beam([x*1.3,y*1.3,z*1.3],[x*2.6,y*2.6,z*2.6],.02,'#ffaba3',opt);
  label(g,a,['RED LABYRINTH','XW / YZ / XZ','HIGHER DIMENSIONS'],0,10.5,-12,6,1.5,'#ff7a90');
 } else if(id==='moon'){
  config.background=hex('#02040b');config.ambient=[.66,.70,.80];config.fog=.004;stars(g,42);
  const craters=[[-9,-9,5],[10,3,4],[-9,8,3],[8,-16,3.5]];
  const height=(x,z)=>craters.reduce((h,[cx,cz,r])=>{const d=Math.hypot(x-cx,z-cz)/r;if(d<1)h-=.8*(1-d*d);else if(d<1.3)h+=.22*Math.sin((d-1)/.3*Math.PI);return h;},0);
  for(let x=-20;x<20;x++)for(let z=-24;z<20;z++)g.face([[x,height(x,z+1),z+1],[x+1,height(x+1,z+1),z+1],[x+1,height(x+1,z),z],[x,height(x,z),z]],(x+z)%4?'#717581':'#626776');config.ground=height;
  // Habitat, antenna, survey lander.
  g.sphere(-10,0,-14,3.6,'#858d9b',{},12,20);g.box(-10,.9,-10.5,1.3,1.8,1.2,'#373d4e',{solid:true});
  g.box(5.5,2.05,-7.8,3.5,2.25,3.0,'#b9a077',{solid:true});g.box(5.5,3.38,-7.8,2,.45,1.9,'#d1ccaf');
  for(const x of [3,8])for(const z of [-10,-5.5])g.beam([5.5,1.6,-7.8],[x,.05,z],.07,'#a4aaba');
  g.box(5.5,2.25,-6.27,1.8,.72,.05,'#273a57',{emission:.3});g.cylinder(11,4,-15,.055,8,'#a3aebd',8);g.ring(11,8.1,-15,1.3,.08,'#a3aebd');
  g.sphere(27,23,-55,5.9,'#ffffff',{texture:a.skyTexture('earth'),emission:.85},20,32);
  label(g,a,['LUNAR OUTPOST','QUIET PERSPECTIVE','0.16 g / SURVEY ACTIVE'],0,3.6,-16,4.4,1.2,'#cddceb');
 } else if(id==='station'){
  config.background=hex('#030b16');config.ambient=[.65,.68,.79];config.fog=.006;config.bounds=[-11,11,-22,16.2];stars(g,51);
  g.floor(0,-2,24,44,'#ffffff',{texture:a.floorTexture('metal')});g.box(0,7,-2,24,.3,44,'#232a3a');
  // Hull walls with actual observation windows opening onto space.
  for(const side of [-1,1])for(let z=-19;z<15;z+=6){g.box(side*12,1.1,z,.35,2.2,6,'#414959',{solid:true});g.box(side*12,6.2,z,.35,1.6,6,'#343c4c');g.box(side*12,4,z-2.9,.45,4,.22,'#6b6670');g.box(side*11.7,2.26,z,.05,.07,5.7,'#d59f50',{emission:1});}
  for(let z=-19;z<16;z+=4){g.box(0,6.85,z,22,.06,.12,'#adc9d8',{emission:.8});g.box(-6,3.4,z,.14,6.8,.2,'#566173');g.box(6,3.4,z,.14,6.8,.2,'#566173');}
  g.sphere(22,6,-17,7.2,'#ffffff',{texture:a.skyTexture('earth'),emission:.8},20,32);
  for(let z=-14;z<6;z+=7){g.box(-9,.85,z,3,1.7,2,'#414b61',{solid:true});label(g,a,['REACTOR / 01','PRESSURE: NOMINAL','RESIDUAL // TELEMETRY'],-9,1.45,z+1.02,2.6,.75,'#75d3df');}
  gate(g,a,'eva',0,-20,'EVA / OBSERVATION DECK','#ffbe64','station',{type:'flight'});
  label(g,a,['K-01 // ORBITAL','DOCKING / SYSTEMS / OBSERVATION'],0,5.3,-20,9,1.35,'#ffc266');
 }
 return g.finish(config);
}
export const buildScene=(a,id)=>id==='gallery'?buildGallery(a):id==='city'?buildCity(a):buildRealm(a,id);
export function isFree(scene,x,z,radius=.28,y=1.7){const [minX,maxX,minZ,maxZ]=scene.bounds;if(x-radius<minX||x+radius>maxX||z-radius<minZ||z+radius>maxZ)return false;return !scene.colliders.some(b=>y>b.minY&&y<b.maxY+1.4&&x+radius>b.minX&&x-radius<b.maxX&&z+radius>b.minZ&&z-radius<b.maxZ);}
export function moveCamera(scene,camera,dx,dz){const stepCount=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.16));for(let i=0;i<stepCount;i++){if(isFree(scene,camera.position[0]+dx/stepCount,camera.position[2],.28,camera.position[1]))camera.position[0]+=dx/stepCount;if(isFree(scene,camera.position[0],camera.position[2]+dz/stepCount,.28,camera.position[1]))camera.position[2]+=dz/stepCount;}}
export function findInteraction(scene,camera){let best=null,score=Infinity;for(const item of scene.interactions){const dx=item.position[0]-camera.position[0],dz=item.position[2]-camera.position[2],dist=Math.hypot(dx,dz);const facing=dist<.25?1:(dx*Math.sin(camera.yaw)-dz*Math.cos(camera.yaw))/dist;if(dist<item.radius&&facing>.52&&dist<score){best=item;score=dist;}}return best;}
