"""Bound each disposable case independently; preserve nonzero and timeout receipts."""
import os,json,subprocess,sys,time
from pathlib import Path
out=Path(os.environ['QA_OUTPUT']);out.mkdir(parents=True,exist_ok=True)
cases=['03-section-memory-anchor','03-section-return-route','03-section-low-quarter-workshop','15-unfinished-operation-not-completed-on-reload']
rows=[]
for case in cases:
    directory=out/case;directory.mkdir(exist_ok=True)
    env={**os.environ,'QA_CASE':case,'QA_OUTPUT':str(directory),'PYTHONUNBUFFERED':'1'}
    start=time.time()
    with (directory/'process.log').open('wb') as log:
        # GNU timeout kills the whole child process group, including a hung WebKit.
        proc=subprocess.run(['timeout','--signal=TERM','--kill-after=10s','180s',sys.executable,str(Path(__file__).with_name('diagnose-webkit.py'))],env=env,stdout=log,stderr=subprocess.STDOUT)
    row={'case':case,'exit':proc.returncode,'seconds':round(time.time()-start,2),'timedOut':proc.returncode in [124,137],'qualified':False}
    receipt=directory/'deep-receipt.json'
    if receipt.exists():
        data=json.loads(receipt.read_text());results=data.get('results',[])
        row['qualified']=proc.returncode==0 and len(results)==1 and results[0]['name']==case and results[0]['status']=='PASS'
    rows.append(row);(out/'process-receipts.json').write_text(json.dumps(rows,indent=2))
raise SystemExit(0 if all(r['qualified'] for r in rows) else 1)
