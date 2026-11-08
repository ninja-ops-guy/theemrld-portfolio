/** Optional game-only encounter staging. Original art is not repainted.
 * Side stairs are scenic geometry; the accessible nave is the walking surface.
 */
import {Geometry, hex, TAU} from './renderer.js';
const GOLD='#847549', BLUE='#426fc4', DARK='#111329';
function label(g,a,lines,x,y,z,w,h,color,yaw=0){
 g.plane(x,y,z,w,h,yaw,'#ffffff',{texture:a.label(lines,color,{width:1024,height:256,fontSize:48,border:false,background:'#080d19'}),emission:1});
}
export function buildAscendedChamber(a){
 const g=new Geometry();
 g.floor(0,0,18,26,'#161c35',{kind:1});
 g.box(-9.3,6,0,.5,12,27,DARK,{solid:true});g.box(9.3,6,0,.5,12,27,DARK,{solid:true});
 g.box(0,6,-13.3,19,12,.5,'#111329',{solid:true});g.box(0,6,13.3,19,12,.5,DARK,{solid:true});
 // Window and ribs echo the painting, without replacing it with generated art.
 g.plane(0,6.3,-13,5.8,8.6,0,'#7bc9ff',{texture:a.material('window'),emission:1});
 g.arch(0,9,-12.9,5.7,2.4,'#5fa7f3',{emission:.8});
 for(const x of [-2.85,-1.42,0,1.42,2.85])g.beam([x,2,-12.85],[x,10,-12.85],.065,'#354a74');
 for(const y of [3,5.7,8.6])g.beam([-2.85,y,-12.85],[2.85,y,-12.85],.07,'#354a74');
 for(let z=-11;z<=11;z+=5.5){
   g.arch(0,7,z,17,5.3,'#2c355e');
   for(const x of [-8.5,8.5]){g.cylinder(x,3.6,z,.22,7.2,'#252a49',10);g.cylinder(x,.2,z,.42,.4,GOLD,10);}
 }
 // Curving stairs: no misleading climb interaction or invisible travel trigger.
 for(const side of [-1,1]){
   let prev=null;
   for(let i=0;i<30;i++){
     const t=i/29,angle=-Math.PI*.55+t*Math.PI*.95;
     const x=side*(7.9-2.8*Math.cos(angle)),z=-1+5*Math.sin(angle),y=.15+t*4.3;
     g.box(x,y,z,1.65,.16,.75,'#312c56');
     const rail=[x-side*.75,y+1,z];
     g.beam([rail[0],y,rail[2]],rail,.032,GOLD);
     if(prev)g.beam(prev,rail,.055,GOLD);prev=rail;
   }
   // Scenic stairs outside the traversable central aisle, blocked at floor level.
   g.colliders.push({minX:side<0?-8.9:4.4,maxX:side<0?-4.4:8.9,minZ:-6.2,maxZ:4.3,minY:0,maxY:6});
 }
 // Floating stars, deterministic and static for reduced-motion visitors.
 let seed=118;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<170;i++){const x=(rand()-.5)*17,y=7+rand()*5,z=(rand()-.5)*24;g.box(x,y,z,.035+rand()*.045,.045,.045,i%7?'#7fbae6':'#c2a6ef',{emission:1});}
 // The altar retains the compositional motif; it is not a new story claim.
 g.box(0,.65,-10.7,3.4,1.3,1.1,'#272438',{solid:true});g.box(0,1.34,-10.7,3.65,.12,1.25,GOLD);
 g.beam([0,1.4,-10.6],[0,2.4,-10.6],.075,'#232942');g.beam([-.35,2.05,-10.6],[.35,2.05,-10.6],.065,'#232942');
 for(const x of [-1.25,1.25]){g.cylinder(x,1.65,-10.5,.06,.5,'#c2a672',8);g.crystal(x,1.95,-10.5,.08,.16,'#ffb664',{emission:1});}
 // Hooded silhouette with emerald stitching; no invented human likeness.
 const x=2.6,z=-6.4;
 g.box(x,.22,z,1.35,.44,1.3,'#20243a',{solid:true});
 g.face([[x-.7,.42,z+.43],[x+.7,.42,z+.43],[x+.35,1.9,z],[x-.35,1.9,z]],'#071813');
 g.face([[x-.7,.42,z-.4],[x+.7,.42,z-.4],[x+.35,1.9,z],[x-.35,1.9,z]],'#0b201b');
 g.sphere(x,2.05,z,.43,'#0c2119',{},8,12);
 g.plane(x,2.05,z+.38,.47,.5,0,'#020907');
 for(let i=0;i<7;i++){g.beam([x-.42+i*.13,.55,z+.44],[x-.23+i*.07,1.8,z+.15],.012,'#348456',{emission:.4});}
 for(const dx of [-.15,.15])g.box(x+dx,2.1,z+.4,.045,.045,.02,'#68bc74',{emission:.8});
 g.beam([x-.3,1.7,z],[x-.75,1.65,z+.1],.1,'#0b201b');g.beam([x-.75,1.65,z+.1],[x-.78,2.5,z+.1],.09,'#0b201b');
 g.sphere(x-.78,2.57,z+.1,.12,'#153528',{},6,8);
 g.interactions.push({id:'ascended-k',type:'ascended-k',title:'ASCENDED K',position:[x,1.7,z+1],radius:2.6});
 label(g,a,['ASCENDED K','AN OPTIONAL REFLECTION'],x,.9,z+.72,2.8,.55,'#72b892');
 // The return is visible from the nave; a persistent DOM button also offers exit.
 g.plane(0,2.2,12.9,3.6,3.6,Math.PI,'#ffffff',{texture:'cathedral',emission:1});
 for(const x of [-1.9,1.9])g.box(x,2.2,12.8,.12,3.9,.18,GOLD);
 g.box(0,4.15,12.8,3.9,.12,.18,GOLD);g.box(0,.25,12.8,3.9,.12,.18,GOLD);
 label(g,a,['RETURN TO GALLERY'],0,4.7,12.7,4,.5,'#82b6d9',Math.PI);
 g.interactions.push({id:'painting-return',type:'painting-return',title:'RETURN TO GALLERY',position:[0,1.7,11.8],radius:3});
 return g.finish({id:'ascended',title:'BEYOND THE FRAME',subtitle:'Ascended K · Optional game-only reflection',
   background:hex('#070a1b'),ambient:[.34,.4,.65],fog:.012,spawn:[0,1.7,9.7],yaw:0,bounds:[-8.8,8.8,-12.8,12.7],
   lights:[{position:[0,6,-10],color:[.1,.48,1]},{position:[-5,3,0],color:[.28,.1,.48]},{position:[4,3,-5],color:[.05,.4,.24]},{position:[0,4,10],color:[.2,.26,.48]}]});
}
