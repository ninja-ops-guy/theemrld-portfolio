"""Predeclared native-only startup / blank-context control, no retries."""
import argparse,json,os,time,traceback,threading,importlib.metadata
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--payload',choices=['native','blank'],default='native');p.add_argument('--lifecycle',choices=['shared','isolated'],default='shared');p.add_argument('--count',type=int,default=24);p.add_argument('--settle-ms',type=int,default=0);p.add_argument('--telemetry',choices=['on','off'],default='on');a=p.parse_args()
if a.count<1 or a.settle_ms<0:p.error('Invalid count/settle')
OUT=Path(os.environ.get('QA_OUTPUT','results/startup'));OUT.mkdir(parents=True,exist_ok=True)
OPTIONS=vars(a)
def diagnostic(event,detail=''):
 with (OUT/'events.jsonl').open('a') as f:f.write(json.dumps({'time':time.time(),'event':event,'detail':str(detail)})+'\n')
exec((Path(__file__).parent/'instrumentation.py').read_text())
results=[]
crashed=set()
def record_crash(ordinal):
 crashed.add(ordinal)
 record={'ordinal':ordinal,'status':'CRASH','time':time.time()}
 diagnostic('page-crash',json.dumps(record))
 (OUT/('crash-'+str(ordinal)+'.json')).write_text(json.dumps(record))
with sync_playwright() as pw:
 b=None
 for i in range(a.count):
  (OUT/'active.json').write_text(json.dumps({'ordinal':i+1,'status':'IN_PROGRESS','time':time.time()}))
  if b is None or a.lifecycle=='isolated':
   if b:b.close()
   b=pw.webkit.launch(headless=True);b.on('disconnected',lambda:diagnostic('browser-disconnected'))
  c=b.new_context(viewport={'width':1440,'height':1000});c.set_default_timeout(6000)
  c.route('https://**/*',lambda route:route.abort())
  if a.telemetry=='on':
   c.expose_binding('__issue101sample',lambda src,data:diagnostic('page-sample',json.dumps({'pageUrl':src['page'].url,'frameUrl':src['frame'].url,'mainFrame':src['frame']==src['page'].main_frame,'data':data})))
   c.add_init_script((Path(__file__).parent/'sampler.js').read_text())
  n=c.new_page();n.on('crash',lambda ordinal=i+1:record_crash(ordinal));n.on('pageerror',lambda error:diagnostic('pageerror',str(error)))
  row={'ordinal':i+1,'status':'FAIL'};diagnostic('start',i+1)
  try:
   if a.payload=='native':
    n.goto(os.environ.get('QA_BASE','http://127.0.0.1:8765')+'/techops-hero/',wait_until='domcontentloaded')
    n.wait_for_function('window.TechOpsLinked && window.__productionTitleReadiness?.ready===true',timeout=30000)
   else:
    n.goto('about:blank',wait_until='domcontentloaded')
    n.wait_for_function('document.readyState==="complete"',timeout=30000)
   row['status']='PASS'
  except Exception as error:row.update(error=str(error),traceback=traceback.format_exc())
  finally:
   try:c.close()
   except Exception as error:row.update(status='FAIL',teardownError=str(error))
   if b.contexts:row.update(status='FAIL',teardownError='contexts remain')
   
   if i+1 in crashed:row.update(status='FAIL',crash=True)
   results.append(row);diagnostic('end',json.dumps(row));process_sample()
   (OUT/'results.json').write_text(json.dumps({'options':OPTIONS,'playwright':importlib.metadata.version('playwright'),'browser':b.version,'results':results},indent=2))
   (OUT/'active.json').write_text(json.dumps({'ordinal':i+1,'status':'COMPLETED','time':time.time()}))
   if a.settle_ms:time.sleep(a.settle_ms/1000)
 b.close()
raise SystemExit(any(r['status']!='PASS' for r in results))
