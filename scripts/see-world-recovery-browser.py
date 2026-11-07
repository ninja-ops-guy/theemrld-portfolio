"""Run the exact qualified QA matrix from PR #49, then extra repair cases.
No assertions are removed or relaxed. The expanded executed source is retained.
QA_SOURCE must point to the pinned 78bdb1a5 checkout, not a moving branch.
"""
from pathlib import Path
import hashlib, os, runpy
qa=Path(os.environ['QA_SOURCE'])/'qa-linked/qualified_runner.py'
qualifier=qa.read_text()
# Execute only the pinned fixture-qualification stage; defer its final run.
terminal="runpy.run_path(str(expanded),run_name='__main__')"
assert qualifier.count(terminal)==1, 'Unexpected qualified-runner shape'
scope={'__file__':str(qa),'__name__':'qualified_setup'}
exec(compile(qualifier.replace(terminal,'# Execution deferred to repair extension'),str(qa),'exec'),scope)
source=scope['source']
old="'runnerRevision':4,'productHeads':{'portfolio':'0a6f9bf6481f321b52d7a496da02cf62cc193820','native':'b8b2378f3cf0b84bfc94e1472b8e26d7043a7445'}"
new="'runnerRevision':5,'productHeads':{'portfolio':os.environ['PORTFOLIO_HEAD'],'native':os.environ['NATIVE_HEAD']}"
assert source.count(old)==1, 'Unexpected baseline receipt metadata'
source=source.replace(old,new,1)
marker="    REPORT['summary']="
assert source.count(marker)==1, 'Unexpected baseline result boundary'
extra=Path(__file__).with_name('see-world-recovery-cases.py').read_text()
source=source.replace(marker,extra+'\n'+marker,1)
output=Path(os.environ['QA_OUTPUT']);output.mkdir(parents=True,exist_ok=True)
expanded=output/'repair-executed-test.py';expanded.write_text(source)
(output/'qa-source-sha256.txt').write_text(hashlib.sha256(qa.read_bytes()).hexdigest()+'\n')
runpy.run_path(str(expanded),run_name='__main__')
