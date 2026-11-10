"""Read-only observations around unchanged original or bounded QA movement.
Application inputs remain immutable. This focused probe is not a full-suite PASS.
"""
from pathlib import Path
import os,runpy,hashlib,json
out=Path(os.environ['QA_OUTPUT']);out.mkdir(parents=True,exist_ok=True)
os.environ['QA_EXPAND_ONLY']='1'
runpy.run_path(str(Path(__file__).with_name('exact-recovery.py')),run_name='diagnostic_expand')
source=(out/'exact-executed-test.py').read_text()
def once(old,new):
    global source
    assert source.count(old)==1,'Diagnostic source drift: '+old[:100]
    source=source.replace(old,new,1)
start=source.index('def travel(n,i):')
end=source.index('\ndef run(name,fn):',start)
if os.environ.get('QA_MOVEMENT')=='original':
    source=source[:start]+'''def travel(n,i):
    target=[420,820,1220][i];n.keyboard.down('ArrowRight')
    try:n.wait_for_function('(x)=>NM.x+NM.w/2>=x-60',arg=target,timeout=12000)
    finally:n.keyboard.up('ArrowRight')
    expect(n.get_by_role('button',name='Inspect objective',exact=True)).to_be_enabled(timeout=4000)
    n.get_by_role('button',name='Inspect objective',exact=True).click()
'''+source[end:]
else:assert os.environ.get('QA_MOVEMENT')=='bounded'
probe='''def native_probe(p,label):
    try:
        state=p.locator('body').evaluate("""()=>{let context,error;try{context=window.TechOpsLinked?.context()}catch(e){error=String(e)}const s=window.S,n=s?.nightMode,m=window.TechOpsLinked?.mission(),b=[...document.querySelectorAll('button')].find(b=>b.textContent==='Inspect objective');return {nightExists:!!n,nightIsNM:n===(typeof NM!=='undefined'?NM:null),x:n?.x,y:n?.y,w:n?.w,vx:n?.vx,vy:n?.vy,center:n?n.x+n.w/2:null,district:n?.district,drive:!!n?.drive,sector:!!n?._sector04,goodDogs:!!n?._v736,inBattle:!!s?.inBattle,inDialog:!!s?.inDialog,paused:!!s?.paused,active:n?window.TechOpsNightRuntime?.active(n):false,mission:m?{id:m.id,step:m.step,target:m.position?.[m.step],district:m.district,runId:m.runId,profileId:m.profileId}:null,identity:s?.meta?.seeWorldLink,health:window.TechOpsLinked?.health(),contextIdentity:context?{runId:context.runId,profileId:context.profileId}:null,contextError:error,objective:b?{disabled:b.disabled,rect:b.getBoundingClientRect().toJSON()}:null}}""",timeout=1500)
        event('native-probe',label=label,state=state)
    except Exception as e:event('native-probe-unavailable',label=label,error=str(e))

'''
once('def travel(n,i):',probe+"def travel(n,i):\n    native_probe(n,'before-movement-'+str(i))")
once("    finally:n.keyboard.up('ArrowRight')", "    finally:\n        native_probe(n,'before-key-release-'+str(i))\n        n.keyboard.up('ArrowRight')\n        native_probe(n,'after-key-release-'+str(i))")
if os.environ['QA_MOVEMENT']=='bounded':
    once("    expect(control).to_be_enabled(timeout=4000)","    native_probe(n,'after-bounded-steps-'+str(i))\n    expect(control).to_be_enabled(timeout=4000)")
once("        row.update(status='FAIL',error=str(error),traceback=traceback.format_exc());event('case-failure',error=str(error))", "        row.update(status='FAIL',error=str(error),traceback=traceback.format_exc());event('case-failure',error=str(error))\n        for label,p in pages:\n            if label=='native':native_probe(p,'failure-before-screenshots')")
once("    contexts=[];pages=[];page_errors=[];observations={};row={'name':name};start=time.monotonic();case_name=name;phase='test';event('case-start')", "    if os.environ.get('QA_SCOPE')!='full' and name!=os.environ['QA_CASE']:return\n    contexts=[];pages=[];page_errors=[];observations={};row={'name':name};start=time.monotonic();case_name=name;phase='test';event('case-start')")
once("REPORT['browserVersion']=browser.version;", "REPORT['diagnosticOnly']=True;REPORT['movementVariant']=os.environ['QA_MOVEMENT'];REPORT['scope']='Full original suite order in one browser, including original 27 cases, two atomicity repeats and two existing-write probes; assertions unchanged. Read-only probes can affect scheduling.' if os.environ.get('QA_SCOPE')=='full' else 'Focused native objective observation; one named case per process, not full recovery certification. Original assertions retained. Read-only probes can affect scheduling.';REPORT['browserVersion']=browser.version;")

# Observe only synthetic local save keys in case18; never write or repair them.
companion_probe = r'''def companion_snapshot(p,label):
    import hashlib
    try:
        data=p.locator('body').evaluate("""()=>{const values={};for(const k of Object.keys(localStorage).sort()){if(k.startsWith('techops'))values[k]=localStorage.getItem(k)}let selected,error;try{selected=window.TechOpsLinkedSaveCore?.selectedRun()}catch(e){error=String(e)}return {url:location.href,ready:window.__productionTitleReadiness?.ready,hasCore:!!window.TechOpsLinkedSaveCore,hasCompanion:!!window.TechOpsLinked,selected,selectedError:error,runtimeIdentity:window.S?.meta?.seeWorldLink,night:!!window.S?.nightMode,paused:!!window.S?.paused,dialog:!!window.S?.inDialog,mode:window.S?.meta?._standaloneMode,values}}""",timeout=2000)
        raw=data.pop('values')
        data['storage']={k:{'raw':v,'utf8Bytes':len(v.encode('utf-8')),'sha256':hashlib.sha256(v.encode('utf-8')).hexdigest()} for k,v in raw.items()}
        path=OUT/('case18-'+label+'.json');path.write_text(json.dumps(data,indent=2))
        event('companion-save-snapshot',label=label,path=path.name,ready=data.get('ready'),hasCore=data.get('hasCore'),hasCompanion=data.get('hasCompanion'),keys=list(raw))
    except Exception as error:event('companion-snapshot-unavailable',label=label,error=str(error))

'''
# Helpers belong at module scope, not in the with-browser suite block.
once('def native_probe(p,label):',companion_probe+'def native_probe(p,label):')
once("        assert offline.evaluate('TechOpsCampaign.save(TechOpsCampaign.load(localStorage),localStorage)') is True", "        assert offline.evaluate('TechOpsCampaign.save(TechOpsCampaign.load(localStorage),localStorage)') is True\n        companion_snapshot(offline,'offline-before-reload')\n        companion_snapshot(n,'survivor-before-reload')")
once("        offline.reload(wait_until='domcontentloaded');offline.wait_for_function('window.TechOpsLinkedSaveCore&&window.__productionTitleReadiness?.ready',timeout=30000)","        event('companion-reload-start')\n        offline.reload(wait_until='domcontentloaded')\n        event('companion-reload-domcontentloaded')\n        companion_snapshot(offline,'offline-after-reload-dom')\n        offline.wait_for_function('window.TechOpsLinkedSaveCore&&window.__productionTitleReadiness?.ready',timeout=30000)\n        companion_snapshot(offline,'offline-after-reload-ready')")
once("        c.unroute('**/see-world/linked.mjs');offline.reload(wait_until='domcontentloaded')", "        companion_snapshot(offline,'offline-before-restoration')\n        c.unroute('**/see-world/linked.mjs');offline.reload(wait_until='domcontentloaded')\n        companion_snapshot(offline,'restored-after-reload-dom')")
once("        observations['preservedRun']=run_id", "        companion_snapshot(offline,'restored-selected-run')\n        observations['preservedRun']=run_id")
once("        for label,p in pages:\n            if label=='native':native_probe(p,'failure-before-screenshots')", "        if name=='18-companion-outage-ownership-reload-recovery':\n            for label,p in pages:\n                companion_snapshot(p,label+'-failure-before-screenshots')\n        for label,p in pages:\n            if label.startswith('native'):native_probe(p,label+'-failure-before-screenshots')")

expanded=out/'diagnostic-executed-test.py';expanded.write_text(source)
(out/'diagnostic-source-sha256.txt').write_text(hashlib.sha256(Path(__file__).read_bytes()).hexdigest()+'\n')
if os.environ.get('DIAG_EXPAND_ONLY')!='1':runpy.run_path(str(expanded),run_name='__main__')
