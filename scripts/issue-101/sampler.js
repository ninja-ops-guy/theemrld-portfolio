(() => {
  let frames=0,lastButton=null,replacements=0;
  const frame=()=>{frames++;requestAnimationFrame(frame);};requestAnimationFrame(frame);
  setInterval(()=>{
    const b=[...document.querySelectorAll('#see-world-night-objective button')].find(x=>x.textContent==='Inspect objective');
    if(b!==lastButton){replacements++;lastButton=b;}
    const r=b?.getBoundingClientRect();
    const g=window.__productionTitleReadiness;
    const data={at:performance.now(),frames,visibility:document.visibilityState,readyState:document.readyState,
      readiness:g,bootstrap:window.__productionBootstrapReady,bootstrapError:window.__productionBootstrapError,
      hardFix:window.TechOpsGoodBoysButtonHardFix?.dependencySnapshot?.(),
      canvases:document.querySelectorAll('canvas').length,images:document.images.length,
      objective:b?{replacements,connected:b.isConnected,disabled:b.disabled,rect:{x:r.x,y:r.y,width:r.width,height:r.height},hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML?.slice(0,300)}:null};
    window.__issue101sample(data).catch(()=>{});
  },250);
})();
