/** Dependency-free WebGL renderer. All gallery objects live in world space. */
export const TAU = Math.PI * 2;
// First visits (including privacy/storage failures) use ASCII. Only a stored
// boolean overrides it; strings such as "false" must not be treated as truthy.
export const DEFAULT_ASCII = true;
export function resolveAsciiPreference(value) {
 return typeof value === 'boolean' ? value : DEFAULT_ASCII;
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const hex = h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16)/255);
export function normalize(v) { const n=Math.hypot(...v)||1;return v.map(x=>x/n); }
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
export function modelMatrix(x=0,y=0,z=0,rx=0,ry=0,rz=0){
 const cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),cz=Math.cos(rz),sz=Math.sin(rz);
 return new Float32Array([cy*cz,cy*sz,-sy,0,sx*sy*cz-cx*sz,sx*sy*sz+cx*cz,sx*cy,0,cx*sy*cz+sx*sz,cx*sy*sz-sx*cz,cx*cy,0,x,y,z,1]);
}
export function viewMatrix(p,yaw,pitch){
 const f=normalize([Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)]);
 const s=normalize(cross(f,[0,1,0])),u=cross(s,f);
 return new Float32Array([s[0],u[0],-f[0],0,s[1],u[1],-f[1],0,s[2],u[2],-f[2],0,-dot(s,p),-dot(u,p),dot(f,p),1]);
}
export function perspective(aspect,fov=72,near=.08,far=180){const f=1/Math.tan(fov*Math.PI/360),n=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*n,-1,0,0,2*far*near*n,0]);}
const VERT=`attribute vec3 aPosition; attribute vec3 aNormal; attribute vec2 aUv; attribute vec3 aColor;
uniform mat4 uModel,uView,uProjection; varying vec3 vPosition,vNormal,vColor; varying vec2 vUv;
void main(){vec4 p=uModel*vec4(aPosition,1.);vPosition=p.xyz;vNormal=mat3(uModel)*aNormal;vColor=aColor;vUv=aUv;gl_Position=uProjection*uView*p;}`;
const FRAG=`precision mediump float;
varying vec3 vPosition,vNormal,vColor; varying vec2 vUv;
uniform sampler2D uTexture; uniform float uEmission,uKind,uTime,uEnergy,uFog;
uniform vec3 uEye,uFogColor,uAmbient; uniform vec3 uLights[4],uLightColors[4];
void main(){
 vec4 tex=texture2D(uTexture,vUv);if(tex.a<.08)discard;
 vec3 n=normalize(vNormal); if(!gl_FrontFacing)n=-n;
 vec3 lit=uAmbient+vec3(.17,.17,.22)*max(0.,dot(n,normalize(vec3(-.3,.85,.45))));
 for(int i=0;i<4;i++){vec3 d=uLights[i]-vPosition;float len=length(d);lit+=uLightColors[i]*(.25+max(0.,dot(n,normalize(d))))/(1.+len*len*.045);}
 vec3 color=tex.rgb*vColor;
 if(uKind>0.5&&uKind<1.5){
   vec2 q=abs(fract(vPosition.xz/2.)-.5);float seam=step(.49,max(q.x,q.y));
   float vein=pow(abs(sin(vPosition.x*1.35+sin(vPosition.z*.7)*1.8+sin(vPosition.x*2.1+vPosition.z*.3))),26.);
   color=mix(color,vec3(.21,.15,.24),vein*.7);color=mix(color,vec3(.30,.24,.17),seam*.5);
   for(int i=0;i<4;i++){float d=length(vPosition.xz-uLights[i].xz);color+=uLightColors[i]*pow(max(0.,1.-d/12.),3.)*(.12+uEnergy*.018);}
 }
 if(uKind>1.5&&uKind<2.5){float wave=sin(vPosition.x*3.+uTime*.5)*sin(vPosition.z*2.6-uTime*.4);color+=vec3(.02,.06,.06)*wave;}
 vec3 finalColor=color*mix(lit,vec3(1.),clamp(uEmission,0.,1.));finalColor+=color*max(0.,uEmission-1.);
 float dist=length(uEye-vPosition);float fog=clamp(1.-exp(-dist*uFog),0.,.93);
 gl_FragColor=vec4(mix(finalColor,uFogColor,fog),tex.a);
}`;
const POST_VERT=`attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=(aPosition+1.)*.5;gl_Position=vec4(aPosition,0.,1.);}`;
const POST_FRAG=`precision mediump float; varying vec2 vUv;uniform sampler2D uScene,uGlyphs;uniform vec2 uResolution;uniform float uAscii;
float bayer(vec2 p){vec2 q=mod(floor(p),4.);return mod(q.x*2.+q.y*3.,4.)/4.+mod(q.x+q.y*2.,4.)/16.;}
void main(){
 vec2 p=vUv*uResolution;vec3 c=texture2D(uScene,vUv).rgb;
 if(uAscii>.5){vec2 cell=vec2(5.,8.);vec2 center=(floor(p/cell)+.5)*cell;vec3 sampleC=texture2D(uScene,center/uResolution).rgb;float l=dot(sampleC,vec3(.299,.587,.114));float ch=floor(clamp(l*1.6,0.,.99)*10.);vec2 guv=vec2((ch+fract(p.x/cell.x))/10.,fract(p.y/cell.y));float g=texture2D(uGlyphs,guv).r;c=mix(c*.32,sampleC*1.7,g);}
 else{float d=bayer(p)-.45;c=floor(clamp(c+d/48.,0.,1.)*40.)/40.;}
 float vignette=1.-.20*pow(length((vUv-.5)*1.25),2.);c*=vignette;gl_FragColor=vec4(c,1.);
}`;
function shader(gl,type,source){let s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function program(gl,vs,fs){let p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,vs),f=shader(gl,gl.FRAGMENT_SHADER,fs);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
export class Renderer {
 constructor(canvas){
  this.canvas=canvas;const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
  if(!gl)return new SoftwareRenderer(canvas);this.gl=gl;this.backend='webgl';
  this.program=program(gl,VERT,FRAG);this.post=program(gl,POST_VERT,POST_FRAG);
  this.locations={};for(const n of ['uModel','uView','uProjection','uTexture','uEmission','uKind','uTime','uEnergy','uFog','uEye','uFogColor','uAmbient','uLights[0]','uLightColors[0]'])this.locations[n]=gl.getUniformLocation(this.program,n);
  this.attrs=['aPosition','aNormal','aUv','aColor'].map(n=>gl.getAttribLocation(this.program,n));
  this.textures=new Map();const white=document.createElement('canvas');white.width=white.height=2;white.getContext('2d').fillStyle='white';white.getContext('2d').fillRect(0,0,2,2);this.texture('white',white);
  const glyph=document.createElement('canvas');glyph.width=160;glyph.height=24;const c=glyph.getContext('2d');c.fillStyle='black';c.fillRect(0,0,160,24);c.font='bold 21px monospace';c.textAlign='center';c.textBaseline='middle';c.fillStyle='white';[...' .:-=+*#%@'].forEach((ch,i)=>c.fillText(ch,i*16+8,12));this.texture('glyphs',glyph);
  this.quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  this.fbo=gl.createFramebuffer();this.color=gl.createTexture();this.depth=gl.createRenderbuffer();this.geometry=new WeakMap();this.allocated=[];this.ascii=DEFAULT_ASCII;this.drawCalls=0;
 }
 texture(key,image){const gl=this.gl;if(this.textures.has(key)){gl.deleteTexture(this.textures.get(key));}const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);this.textures.set(key,t);return t;}
 resize(){const gl=this.gl;let w=Math.floor(this.canvas.clientWidth*Math.min(window.devicePixelRatio||1,1.25)),h=Math.floor(this.canvas.clientHeight*Math.min(window.devicePixelRatio||1,1.25));const max=1440;if(Math.max(w,h)>max){const r=max/Math.max(w,h);w=Math.round(w*r);h=Math.round(h*r);}w=Math.max(1,w);h=Math.max(1,h);if(w===this.canvas.width&&h===this.canvas.height)return;this.canvas.width=w;this.canvas.height=h;gl.bindTexture(gl.TEXTURE_2D,this.color);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.bindRenderbuffer(gl.RENDERBUFFER,this.depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.color,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,this.depth);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Render target incomplete');gl.bindFramebuffer(gl.FRAMEBUFFER,null);}
 upload(mesh){let m=this.geometry.get(mesh);if(m)return m;const gl=this.gl,b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh.data),gl.STATIC_DRAW);m={buffer:b,count:mesh.data.length/11};this.geometry.set(mesh,m);this.allocated.push(b);return m;}
 render(scene,camera,time,energy){const gl=this.gl;this.resize();gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbo);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(...scene.background,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.useProgram(this.program);const u=this.locations;gl.uniformMatrix4fv(u.uView,false,viewMatrix(camera.position,camera.yaw,camera.pitch));gl.uniformMatrix4fv(u.uProjection,false,perspective(this.canvas.width/this.canvas.height,camera.fov||70));gl.uniform3fv(u.uEye,camera.position);gl.uniform3fv(u.uFogColor,scene.background);gl.uniform3fv(u.uAmbient,scene.ambient);gl.uniform1f(u.uFog,scene.fog||.018);gl.uniform1f(u.uTime,time);gl.uniform1f(u.uEnergy,energy);gl.uniform3fv(u['uLights[0]'],new Float32Array(scene.lights.flatMap(l=>l.position)));gl.uniform3fv(u['uLightColors[0]'],new Float32Array(scene.lights.flatMap(l=>l.color.map(v=>v*(1+energy*(l.reactive||0))))));gl.uniform1i(u.uTexture,0);this.drawCalls=0;
  for(const mesh of scene.meshes){const g=this.upload(mesh);gl.bindBuffer(gl.ARRAY_BUFFER,g.buffer);const offsets=[0,3,6,8],sizes=[3,3,2,3];this.attrs.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,sizes[i],gl.FLOAT,false,44,offsets[i]*4);});gl.uniformMatrix4fv(u.uModel,false,mesh.transform?mesh.transform(time,energy):identity());gl.uniform1f(u.uEmission,mesh.emission||0);gl.uniform1f(u.uKind,mesh.kind||0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.textures.get(mesh.texture)||this.textures.get('white'));gl.drawArrays(mesh.lines?gl.LINES:gl.TRIANGLES,0,g.count);this.drawCalls++;}
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.DEPTH_TEST);gl.useProgram(this.post);gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);for(const a of this.attrs)gl.disableVertexAttribArray(a);const at=gl.getAttribLocation(this.post,'aPosition');gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,2,gl.FLOAT,false,0,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.color);gl.uniform1i(gl.getUniformLocation(this.post,'uScene'),0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.textures.get('glyphs'));gl.uniform1i(gl.getUniformLocation(this.post,'uGlyphs'),1);gl.uniform2f(gl.getUniformLocation(this.post,'uResolution'),this.canvas.width,this.canvas.height);gl.uniform1f(gl.getUniformLocation(this.post,'uAscii'),this.ascii?1:0);gl.drawArrays(gl.TRIANGLES,0,6);gl.activeTexture(gl.TEXTURE0);
 }
 dispose(){const gl=this.gl;for(const b of this.allocated)gl.deleteBuffer(b);for(const t of this.textures.values())gl.deleteTexture(t);gl.deleteBuffer(this.quad);gl.deleteFramebuffer(this.fbo);gl.deleteRenderbuffer(this.depth);gl.deleteTexture(this.color);gl.deleteProgram(this.program);gl.deleteProgram(this.post);}
}
export class Geometry {
 constructor(){this.groups=new Map();this.transformIds=new WeakMap();this.colliders=[];this.interactions=[];}
 group(color,opts={}){let key=[opts.texture||'white',opts.emission||0,opts.kind||0].join('|');if(opts.transform){if(!this.transformIds.has(opts.transform))this.transformIds.set(opts.transform,this.groups.size);key+='|dynamic'+this.transformIds.get(opts.transform);}if(!this.groups.has(key))this.groups.set(key,{data:[],texture:opts.texture,emission:opts.emission||0,kind:opts.kind||0,transform:opts.transform});return {mesh:this.groups.get(key),rgb:Array.isArray(color)?color:hex(color)};}
 face(points,color,opts={},uvs=[[0,0],[1,0],[1,1],[0,1]]){
  if(points.length===4&&!opts._raw){
   const len=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));const nu=Math.min(24,Math.ceil(len(points[0],points[1])/2.0)),nv=Math.min(24,Math.ceil(len(points[0],points[3])/2.0));
   if(nu>1||nv>1){const bilerp=(values,u,v)=>values[0].map((n,i)=>n*(1-u)*(1-v)+values[1][i]*u*(1-v)+values[2][i]*u*v+values[3][i]*(1-u)*v);for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const corners=[[i/nu,j/nv],[(i+1)/nu,j/nv],[(i+1)/nu,(j+1)/nv],[i/nu,(j+1)/nv]];this.face(corners.map(([u,v])=>bilerp(points,u,v)),color,{...opts,_raw:true},corners.map(([u,v])=>bilerp(uvs,u,v)));}return;}
  }
 const {mesh,rgb}=this.group(color,opts);const a=points[0],b=points[1],c=points[2],n=normalize(cross(b.map((v,i)=>v-a[i]),c.map((v,i)=>v-a[i])));for(const i of points.length===3?[0,1,2]:[0,1,2,0,2,3])mesh.data.push(...points[i],...n,...uvs[i],...rgb);}
 box(x,y,z,w,h,d,color,opts={}){const a=x-w/2,b=x+w/2,c=y-h/2,e=y+h/2,f=z-d/2,g=z+d/2;this.face([[a,c,g],[b,c,g],[b,e,g],[a,e,g]],color,opts);this.face([[b,c,f],[a,c,f],[a,e,f],[b,e,f]],color,opts);this.face([[a,c,f],[a,c,g],[a,e,g],[a,e,f]],color,opts);this.face([[b,c,g],[b,c,f],[b,e,f],[b,e,g]],color,opts);this.face([[a,e,g],[b,e,g],[b,e,f],[a,e,f]],color,opts);this.face([[a,c,f],[b,c,f],[b,c,g],[a,c,g]],color,opts);if(opts.solid)this.colliders.push({minX:a,maxX:b,minZ:f,maxZ:g,minY:c,maxY:e});}
 plane(x,y,z,w,h,yaw,color,opts={}){const r=[Math.cos(yaw)*w/2,0,-Math.sin(yaw)*w/2];this.face([[x-r[0],y-h/2,z-r[2]],[x+r[0],y-h/2,z+r[2]],[x+r[0],y+h/2,z+r[2]],[x-r[0],y+h/2,z-r[2]]],color,opts);}
 floor(x,z,w,d,color,opts={}){this.face([[x-w/2,opts.y||0,z+d/2],[x+w/2,opts.y||0,z+d/2],[x+w/2,opts.y||0,z-d/2],[x-w/2,opts.y||0,z-d/2]],color,opts);}
 cylinder(x,y,z,r,h,color,segments=12,opts={}){for(let i=0;i<segments;i++){const a=i*TAU/segments,b=(i+1)*TAU/segments;const p=[x+r*Math.cos(a),y-h/2,z+r*Math.sin(a)],q=[x+r*Math.cos(b),y-h/2,z+r*Math.sin(b)];this.face([p,[p[0],y+h/2,p[2]],[q[0],y+h/2,q[2]],q],color,opts);this.face([[x,y+h/2,z],[q[0],y+h/2,q[2]],[p[0],y+h/2,p[2]]],color,opts);}}
 sphere(x,y,z,r,color,opts={},lat=10,lon=16){for(let j=0;j<lat;j++)for(let i=0;i<lon;i++){const p=(a,b)=>[x+r*Math.sin(a)*Math.cos(b),y+r*Math.cos(a),z+r*Math.sin(a)*Math.sin(b)];const a=j*Math.PI/lat,b=(j+1)*Math.PI/lat,c=i*TAU/lon,d=(i+1)*TAU/lon;this.face([p(a,c),p(b,c),p(b,d),p(a,d)],color,opts,[[i/lon,1-j/lat],[i/lon,1-(j+1)/lat],[(i+1)/lon,1-(j+1)/lat],[(i+1)/lon,1-j/lat]]);}}
 beam(a,b,r,color,opts={}){const n=normalize(b.map((v,i)=>v-a[i])),q=normalize(cross(n,Math.abs(n[1])>.95?[1,0,0]:[0,1,0])),t=cross(n,q);const point=(p,s1,s2)=>p.map((v,i)=>v+q[i]*r*s1+t[i]*r*s2);const sides=[[1,1],[-1,1],[-1,-1],[1,-1]];for(let i=0;i<4;i++){const s=sides[i],k=sides[(i+1)%4];this.face([point(a,...s),point(a,...k),point(b,...k),point(b,...s)],color,opts);}}
 ring(x,y,z,r,tube,color,opts={},axis='z',steps=48){const p=a=>axis==='y'?[x+r*Math.cos(a),y,z+r*Math.sin(a)]:axis==='x'?[x,y+r*Math.cos(a),z+r*Math.sin(a)]:[x+r*Math.cos(a),y+r*Math.sin(a),z];for(let i=0;i<steps;i++)this.beam(p(i*TAU/steps),p((i+1)*TAU/steps),tube,color,opts);}
 crystal(x,y,z,r,h,color,opts={}){const rgb=hex(color);for(let i=0;i<6;i++){let a=i*TAU/6,b=(i+1)*TAU/6,p=[x+r*Math.cos(a),y,z+r*Math.sin(a)],q=[x+r*Math.cos(b),y,z+r*Math.sin(b)];this.face([p,q,[x,y+h,z]],rgb.map(v=>v*(.55+i*.09)),opts);this.face([q,p,[x,y-h*.25,z]],rgb.map(v=>v*.55),opts);}}
 arch(x,y,z,w,h,color,opts={}){let prev=[x-w/2,y,z];for(let i=1;i<=20;i++){const t=i/20;const q=[x-w/2+w*t,y+h*Math.pow(Math.sin(t*Math.PI),.7),z];this.beam(prev,q,.055,color,opts);prev=q;}}
 finish(config){return {...config,meshes:[...this.groups.values()],colliders:this.colliders,interactions:this.interactions};}
}

/** Capability fallback for devices that disallow WebGL. Same meshes, camera,
 * textures, collision and navigation; per-pixel z-buffer Canvas rasterization. */
export class SoftwareRenderer {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});if(!this.ctx)throw Error('No supported canvas renderer.');this.backend='canvas';this.textures=new Map();this.ascii=DEFAULT_ASCII;this.drawCalls=0;this.work=document.createElement('canvas');this.workCtx=this.work.getContext('2d',{alpha:false});this.lastDraw=0;this.makeMarble();}
 texture(key,image){this.textures.set(key,image);return image;}
 makeMarble(){const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d');ctx.fillStyle='#211a2c';ctx.fillRect(0,0,1024,1024);for(let i=0;i<40;i++){ctx.beginPath();let x=i*43%1024;ctx.moveTo(x,0);for(let y=0;y<1024;y+=20){x+=Math.sin(y*.02+i)*18;ctx.lineTo(x,y);}ctx.strokeStyle=i%4?'#493548':'#756059';ctx.lineWidth=i%3===0?2:1;ctx.stroke();}ctx.strokeStyle='#72604d';ctx.lineWidth=2;for(let n=0;n<=1024;n+=128){ctx.beginPath();ctx.moveTo(n,0);ctx.lineTo(n,1024);ctx.moveTo(0,n);ctx.lineTo(1024,n);ctx.stroke();}this.textures.set('marble',c);}
 resize(){let w=this.canvas.clientWidth,h=this.canvas.clientHeight;const factor=Math.min(1,960/Math.max(w,h));w=Math.max(1,Math.round(w*factor));h=Math.max(1,Math.round(h*factor));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;this.work.width=w;this.work.height=h;}}
 render(scene,camera,time,energy){this.resize();const w=this.canvas.width,h=this.canvas.height,f=h/(2*Math.tan((camera.fov||70)*Math.PI/360)),v=viewMatrix(camera.position,camera.yaw,camera.pitch);
  if(!this.image||this.image.width!==w||this.image.height!==h){this.image=this.ctx.createImageData(w,h);this.zbuffer=new Float32Array(w*h);}this.zbuffer.fill(Infinity);const pixels=this.image.data,bg=scene.background.map(n=>Math.round(n*255));for(let i=0;i<pixels.length;i+=4){pixels[i]=bg[0];pixels[i+1]=bg[1];pixels[i+2]=bg[2];pixels[i+3]=255;}
  const tx=(m,x,y,z)=>[m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]];
  const project=p=>[w/2+p[0]*f/-p[2],h/2-p[1]*f/-p[2]];
  const clipped=points=>{const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ina=a[2]<=-.08,inb=b[2]<=-.08;if(ina)out.push(a);if(ina!==inb){const t=(-.08-a[2])/(b[2]-a[2]);out.push(a.map((n,j)=>n+(b[j]-n)*t));}}return out;};
  if(!this.texturePixels)this.texturePixels=new Map();
  const texturePixels=key=>{if(this.texturePixels.has(key))return this.texturePixels.get(key);const img=this.textures.get(key);if(!img)return null;const c=document.createElement('canvas');c.width=img.naturalWidth||img.width;c.height=img.naturalHeight||img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,c.width,c.height);this.texturePixels.set(key,data);return data;};
  const drawTriangle=(p,color,texture,floor,fog)=>{
   const screen=p.map(project),[a,b,c]=screen;
   const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(w-1,Math.ceil(Math.max(a[0],b[0],c[0]))),minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(h-1,Math.ceil(Math.max(a[1],b[1],c[1])));
   if(maxX<minX||maxY<minY)return;
   const det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(det)<.08)return;
   const ax=(b[1]-c[1])/det,ay=(c[0]-b[0])/det,bx=(c[1]-a[1])/det,by=(a[0]-c[0])/det;
   const inv=p.map(q=>1/-q[2]),uu=p.map((q,i)=>q[3]*inv[i]),vv=p.map((q,i)=>(1-q[4])*inv[i]);
   const mul=texture?(floor?[.83-fog*.5,.83-fog*.5,.9-fog*.5]:color):null;
   for(let y=minY;y<=maxY;y++){
    let u=ax*(minX+.5-c[0])+ay*(y+.5-c[1]),v0=bx*(minX+.5-c[0])+by*(y+.5-c[1]);
    for(let x=minX;x<=maxX;x++,u+=ax,v0+=bx){const q=1-u-v0;if(u<-.0001||v0<-.0001||q<-.0001)continue;const iz=u*inv[0]+v0*inv[1]+q*inv[2];if(iz<=0)continue;const depth=1/iz,zi=y*w+x;if(depth>=this.zbuffer[zi])continue;const at=zi*4;
     if(texture){const tx0=clamp(Math.floor((u*uu[0]+v0*uu[1]+q*uu[2])/iz*texture.width),0,texture.width-1),ty=clamp(Math.floor((u*vv[0]+v0*vv[1]+q*vv[2])/iz*texture.height),0,texture.height-1),ti=(ty*texture.width+tx0)*4;if(texture.data[ti+3]<32)continue;pixels[at]=texture.data[ti]*mul[0];pixels[at+1]=texture.data[ti+1]*mul[1];pixels[at+2]=texture.data[ti+2]*mul[2];}
     else{pixels[at]=color[0]*255;pixels[at+1]=color[1]*255;pixels[at+2]=color[2]*255;}
     this.zbuffer[zi]=depth;
    }
   }
  };
  this.drawCalls=0;
  for(const mesh of scene.meshes){const d=mesh.data,m=mesh.transform?mesh.transform(time,energy):null,texture=texturePixels(mesh.texture||(mesh.kind===1?'marble':''));
   for(let j=0;j<d.length;j+=33){const world=[],points=[];for(let i=0;i<3;i++){const at=j+i*11,wp=m?tx(m,d[at],d[at+1],d[at+2]):[d[at],d[at+1],d[at+2]];world.push(wp);points.push([...tx(v,...wp),d[at+6],d[at+7]]);}if(points.every(p=>p[2]>-.08))continue;
    const normal=m?[m[0]*d[j+3]+m[4]*d[j+4]+m[8]*d[j+5],m[1]*d[j+3]+m[5]*d[j+4]+m[9]*d[j+5],m[2]*d[j+3]+m[6]*d[j+4]+m[10]*d[j+5]]:[d[j+3],d[j+4],d[j+5]];
    const center=[0,1,2].map(i=>(world[0][i]+world[1][i]+world[2][i])/3),dist=Math.hypot(...center.map((n,i)=>n-camera.position[i]));if(dist>180)continue;
    let light=scene.ambient.map(n=>n+.16*Math.max(0,dot(normal,[-.3,.85,.45])));for(const lamp of scene.lights){const dir=lamp.position.map((n,i)=>n-center[i]),len=Math.hypot(...dir),intensity=(.25+Math.max(0,dot(normal,normalize(dir))))/(1+len*len*.045);light=light.map((n,i)=>n+lamp.color[i]*intensity*(1+energy*(lamp.reactive||.04)));}
    const emission=clamp(mesh.emission||0,0,1),fog=clamp(1-Math.exp(-dist*(scene.fog||.018)),0,.93),color=[d[j+8],d[j+9],d[j+10]].map((n,i)=>clamp(n*(light[i]*(1-emission)+emission)*(1-fog)+scene.background[i]*fog,0,1));
    const poly=clipped(points);for(let i=1;i<poly.length-1;i++){drawTriangle([poly[0],poly[i],poly[i+1]],color,texture,mesh.kind===1,fog);this.drawCalls++;}
   }
  }
  if(!this.ascii)this.ctx.putImageData(this.image,0,0);
  else{const data=this.image.data,c=this.ctx;c.putImageData(this.image,0,0);c.fillStyle='rgba(7,9,16,.76)';c.fillRect(0,0,w,h);const glyphs=' .:-=+*#%@',cw=w>800?6:4,ch=cw*1.6;c.font=`${ch}px monospace`;c.textBaseline='top';for(let y=0;y<h;y+=ch)for(let x=0;x<w;x+=cw){const at=(Math.floor(y)*w+Math.floor(x))*4,r=data[at],g=data[at+1],b=data[at+2],l=(r*.299+g*.587+b*.114)/255;const text=glyphs[Math.min(9,Math.floor(l*22))];if(text===' ')continue;c.fillStyle=`rgb(${Math.min(255,r*1.85)},${Math.min(255,g*1.85)},${Math.min(255,b*1.85)})`;c.fillText(text,x,y);}}
 }
 dispose(){this.textures.clear();}
}
