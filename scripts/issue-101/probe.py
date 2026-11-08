"""Issue 101 diagnostic runner. Does not publish or dispatch workflows."""
import argparse, ast, hashlib, json, os, pathlib, runpy
p=argparse.ArgumentParser()
p.add_argument('--lifecycle', choices=['shared','isolated'],default='shared')
p.add_argument('--select', default='',help='Comma separated exact case names; empty = full matrix')
p.add_argument('--order',choices=['original','reverse'],default='original')
p.add_argument('--repeat',type=int,default=1,help='Predeclared experimental blocks; every failure remains a failure')
p.add_argument('--settle-ms',type=int,default=0)
p.add_argument('--telemetry',choices=['on','off'],default='on')
p.add_argument('--prepare-only',action='store_true')
a=p.parse_args()
if a.repeat<1 or a.settle_ms<0: p.error('Invalid repeat or settle interval')
base=pathlib.Path(__file__).resolve().parent
raw=(base/'original-matrix.py').read_text()
source=raw
out=pathlib.Path(os.environ.get('QA_OUTPUT','results/probe'));out.mkdir(parents=True,exist_ok=True)
os.environ['QA_OUTPUT']=str(out)
os.environ.setdefault('QA_ENGINE','webkit')
os.environ.setdefault('PORTFOLIO_HEAD','14a3df8e1a77ca2ad3329b43828671f69226ce77')
os.environ.setdefault('NATIVE_HEAD','053ee3948170ac972bc1af44eacfa4857fc32a0f')
options=vars(a)
def replace(old,new):
 global source
 if source.count(old)!=1: raise RuntimeError('Unexpected source boundary: '+old[:60])
 source=source.replace(old,new,1)
helper=(base/'instrumentation.py').read_text()
replace('def context(browser,**kw):',helper+'\n\ndef context(browser,**kw):')
replace("ctx.set_default_timeout(6000)","ctx.set_default_timeout(6000)\n    if OPTIONS['telemetry']=='on':\n        ctx.expose_binding('__issue101sample', lambda src, data: diagnostic('page-sample',json.dumps({'url':src['page'].url,'data':data})))\n        ctx.add_init_script(SAMPLER)")
replace('def run(name,fn):','def original_run(name,fn):')
replace('            try:c.close()\n            except Exception:pass',"            try:c.close()\n            except Exception as error:\n                row['status']='FAIL';row['teardownError']=str(error);diagnostic('teardown-error',str(error))")
replace('with sync_playwright() as p:',"pending=[]\ndef run(name,fn): pending.append((name,fn))\n\nwith sync_playwright() as p:")
needle="    REPORT['summary']={'passed':sum(r['status']=='PASS' for r in REPORT['results']),'failed':sum(r['status']=='FAIL' for r in REPORT['results'])}"
execution='''    selected=set(filter(None,OPTIONS['select'].split(',')))
    known={name for name,_ in pending}
    if selected-known: raise ValueError('Unknown cases: '+str(selected-known))
    cases=[x for x in pending if not selected or x[0] in selected]
    if OPTIONS['order']=='reverse': cases.reverse()
    REPORT['experiment']=OPTIONS
    REPORT['plannedCases']=[name for name,_ in cases]
    for block in range(OPTIONS['repeat']):
        for name,fn in cases:
            if OPTIONS['lifecycle']=='isolated':
                browser.close()
                browser=getattr(p,ENGINE).launch(headless=True)
            browser.on('disconnected',lambda:diagnostic('browser-disconnected')) if not getattr(browser,'_issue101Observed',False) else None
            browser._issue101Observed=True
            diagnostic('block',str(block+1))
            process_sample()
            original_run(name if OPTIONS['repeat']==1 else name+'-block-'+str(block+1),fn)
            leaked=len(browser.contexts)
            diagnostic('teardown-complete',json.dumps({'liveContexts':leaked,'connected':browser.is_connected()}))
            if leaked:
                REPORT['results'][-1]['status']='FAIL'
                REPORT['results'][-1]['teardownError']='Live contexts after case: '+str(leaked)
            process_sample()
            if OPTIONS['settle_ms']:
                time.sleep(OPTIONS['settle_ms']/1000)
                process_sample()
'''
replace(needle,execution+'\n'+needle)
original_asserts=[ast.dump(n,include_attributes=False) for n in ast.walk(ast.parse(raw)) if isinstance(n,ast.Assert)]
new_asserts=[ast.dump(n,include_attributes=False) for n in ast.walk(ast.parse(source)) if isinstance(n,ast.Assert)]
if original_asserts!=new_asserts: raise RuntimeError('Assertion parity violated')
# Also preserve every original Playwright click and wait call, including arguments.
def calls(s):
 return sorted(ast.dump(n,include_attributes=False) for n in ast.walk(ast.parse(s)) if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and (n.func.attr=='click' or n.func.attr.startswith('wait_for') or n.func.attr=='set_default_timeout'))
if calls(raw)!=calls(source): raise RuntimeError('Click/wait contract changed')
receipt={'assertions':len(original_asserts),'assertionsIdentical':True,'clicksAndWaitsIdentical':True,'originalSha256':hashlib.sha256(raw.encode()).hexdigest(),'options':options}
(out/'parity.json').write_text(json.dumps(receipt,indent=2))
compiled=out/'executed.py';compiled.write_text(source)
print(json.dumps(receipt),flush=True)
if not a.prepare_only: runpy.run_path(str(compiled),run_name='__main__',init_globals={'OPTIONS':options,'SAMPLER':(base/'sampler.js').read_text()})
