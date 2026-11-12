"""Immutable 27-case recovery matrix, plus bounded fault probes and closure evidence."""
from pathlib import Path
import os, runpy, hashlib
qa=Path(os.environ['QA_SOURCE'])/'qa-linked/qualified_runner.py'
qualifier=qa.read_text()
terminal="runpy.run_path(str(expanded),run_name='__main__')"
assert qualifier.count(terminal)==1
scope={'__file__':str(qa),'__name__':'qualified_setup'}
exec(compile(qualifier.replace(terminal,'# deferred'),str(qa),'exec'),scope)
source=scope['source']
def replace_once(old,new):
    global source
    assert source.count(old)==1,'Unexpected pinned source shape: '+old[:80]
    source=source.replace(old,new,1)
replace_once("'runnerRevision':4,'productHeads':{'portfolio':'0a6f9bf6481f321b52d7a496da02cf62cc193820','native':'b8b2378f3cf0b84bfc94e1472b8e26d7043a7445'}", "'runnerRevision':6,'productHeads':{'portfolio':os.environ['PORTFOLIO_HEAD'],'native':os.environ['NATIVE_HEAD']},'harnessHead':os.environ['HARNESS_HEAD']")
replace_once("URL=BASE+'/theemrld-portfolio/see-world/index.html'", "URL=BASE+'/techops-hero/see-world/index.html'")
replace_once("""def travel(n,i):
    target=[420,820,1220][i];n.keyboard.down('ArrowRight')
    try:n.wait_for_function('(x)=>NM.x+NM.w/2>=x-60',arg=target,timeout=12000)
    finally:n.keyboard.up('ArrowRight')
    expect(n.get_by_role('button',name='Inspect objective',exact=True)).to_be_enabled(timeout=4000)
    n.get_by_role('button',name='Inspect objective',exact=True).click()""", """def travel(n,i):
    target=[420,820,1220][i]
    n.keyboard.down('ArrowRight')
    try:n.wait_for_function('(x)=>NM.x+NM.w/2>=x-60',arg=target,timeout=12000)
    finally:n.keyboard.up('ArrowRight')
    control=n.get_by_role('button',name='Inspect objective',exact=True)
    for _ in range(40):
        if control.is_enabled():break
        x=n.evaluate('NM.x+NM.w/2')
        if x>=target+25:break
        n.keyboard.down('ArrowRight');n.wait_for_timeout(50);n.keyboard.up('ArrowRight')
    expect(control).to_be_enabled(timeout=4000)
    control.click()""")
replace_once('contexts=[];pages=[];page_errors=[];observations={}\n', '''contexts=[];pages=[];page_errors=[];observations={}
events=[];phase='initialization';case_name='none'
def event(kind,**data):
    item={'time':time.time(),'phase':phase,'case':case_name,'kind':kind,**data}
    events.append(item)
    with (OUT/'lifecycle.jsonl').open('a') as f:f.write(json.dumps(item)+'\\n')
def checkpoint(p,label):
    event('checkpoint',label=label,closed=p.is_closed())
    if not p.is_closed():
        try:event('state',label=label,state=p.evaluate('({ready:window.__productionTitleReadiness?.ready,linked:!!window.TechOpsLinked,hasSave:!!localStorage.getItem("techops_save"),url:location.href})'))
        except Exception as e:event('state-unavailable',label=label,error=str(e))
''')
replace_once("ctx.route('https://**/*',lambda route:route.abort());contexts.append(ctx);return ctx", "ctx.route('https://**/*',lambda route:route.abort());ctx.on('close',lambda: event('context-close'));contexts.append(ctx);return ctx")
replace_once("p=ctx.new_page();pages.append((label,p));p.on('pageerror',lambda e:page_errors.append({'page':label,'message':str(e)}));return p", "p=ctx.new_page();pages.append((label,p));p.on('pageerror',lambda e:page_errors.append({'page':label,'message':str(e)}));p.on('close',lambda:event('page-close',label=label));p.on('crash',lambda:event('page-crash',label=label));p.on('requestfailed',lambda r:event('request-failed',label=label,url=r.url,error=r.failure));return p")
replace_once("global contexts,pages,page_errors,observations", "global contexts,pages,page_errors,observations,phase,case_name")
replace_once("contexts=[];pages=[];page_errors=[];observations={};row={'name':name};start=time.monotonic()", "contexts=[];pages=[];page_errors=[];observations={};row={'name':name};start=time.monotonic();case_name=name;phase='test';event('case-start')")
replace_once("row.update(status='FAIL',error=str(error),traceback=traceback.format_exc())", "row.update(status='FAIL',error=str(error),traceback=traceback.format_exc());event('case-failure',error=str(error))")
replace_once("        for c in contexts:\n", "        phase='cleanup';event('cleanup-start')\n        for c in contexts:\n")
replace_once("REPORT['browserVersion']=browser.version", "REPORT['browserVersion']=browser.version;browser.on('disconnected',lambda:event('browser-disconnected'))")
replace_once("    n.wait_for_function('window.TechOpsLinked && window.__productionTitleReadiness?.ready===true',timeout=30000)", "    checkpoint(n,'before-title-readiness')\n    n.wait_for_function('window.TechOpsLinked && window.__productionTitleReadiness?.ready===true',timeout=30000)\n    checkpoint(n,'after-title-readiness')")
replace_once("    n.locator('#btn-start').click();", "    event('new-day-click')\n    n.locator('#btn-start').click();")
replace_once("    run('08-failed-choice-save-atomicity',writes_denied)", "    run('08-failed-choice-save-atomicity',writes_denied)\n    if ENGINE=='webkit':\n        run('08-repeat-1-failed-choice-save-atomicity',writes_denied)\n        run('08-repeat-2-failed-choice-save-atomicity',writes_denied)")
extra=(Path(os.environ['PORTFOLIO_SOURCE'])/'scripts/see-world-recovery-cases.py').read_text()
added=Path(__file__).with_name('exact-recovery-extra.py').read_text()
replace_once("    REPORT['summary']=",extra+'\n'+added+"\n    REPORT['summary']=")
out=Path(os.environ['QA_OUTPUT']);out.mkdir(parents=True,exist_ok=True)
expanded=out/'exact-executed-test.py';expanded.write_text(source)
(out/'source-hashes.json').write_text(__import__('json').dumps({str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in [qa,qa.with_name('deep_browser.py'),Path(__file__),Path(__file__).with_name('exact-recovery-extra.py'),Path(os.environ['PORTFOLIO_SOURCE'])/'scripts/see-world-recovery-cases.py']},indent=2))
if os.environ.get('QA_EXPAND_ONLY')!='1':runpy.run_path(str(expanded),run_name='__main__')
