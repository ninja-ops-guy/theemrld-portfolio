"""Focused follow-up: record native entry, operation launch and completion separately.
Uses the same pinned product pair and real UI/keyboard helpers as deep_browser.py.
The main-story invariant begins AFTER the normal native entry finishes; changes
before that boundary are retained explicitly, not silently discarded.
"""
from pathlib import Path
helper=Path(__file__).with_name('deep_browser.py').read_text()
exec(helper.split('\nwith sync_playwright() as p:')[0],globals())
REPORT['scope']='Focused K/Waldo source-state isolation. Real side-operation launch, keyboard objectives and return receipts; native prerequisites remain explicit fixtures.'
REPORT['runnerRevision']='state-isolation-1'
def story_state(n):return n.evaluate('JSON.parse(JSON.stringify(TechOpsCampaign.load(localStorage).story))')
with sync_playwright() as p:
    browser=getattr(p,ENGINE).launch(headless=True);REPORT['browserVersion']=browser.version
    for section in ['memory-anchor','return-route']:
        def isolated(section=section):
            c,n=boot(browser);v,d=earn(c,n,section)
            before_entry=story_state(n);night(n);after_entry=story_state(n)
            observations['beforeNativeEntry']=before_entry;observations['afterNativeEntry']=after_entry
            begin(n,d);before_operation=story_state(n);observations['afterOperationLaunch']=before_operation
            for i,step in enumerate(d['steps']):
                travel(n,i)
                n.get_by_role('button',name=step[2],exact=True).click()
                expect(n.get_by_text('That conclusion is not supported.',exact=False)).to_be_visible()
                n.get_by_role('button',name=step[1],exact=True).click()
            expect(n.get_by_role('heading',name='SECTION COMPLETE',exact=True)).to_be_visible()
            after_operation=story_state(n);observations['afterOperationCompletion']=after_operation
            observations['nativeEntryChangedStory']=before_entry!=after_entry
            observations['launchChangedStory']=after_entry!=before_operation
            observations['operationChangedStory']=before_operation!=after_operation
            v.reload();expect(v.get_by_text('Completed in Night Walker.',exact=True)).to_be_visible()
            observations['returnReceiptVisible']=True
            n.screenshot(path=str(OUT/(section+'-complete.png')),full_page=True)
            assert after_entry==before_operation,'Launching the side operation changes native story state'
            assert before_operation==after_operation,'Side-operation objective completion changes native story state'
        run('isolate-'+section,isolated)
    REPORT['summary']={'passed':sum(r['status']=='PASS' for r in REPORT['results']),'failed':sum(r['status']=='FAIL' for r in REPORT['results'])}
    (OUT/'deep-receipt.json').write_text(json.dumps(REPORT,indent=2));print(json.dumps(REPORT['summary']),flush=True);browser.close()
raise SystemExit(1 if REPORT['summary']['failed'] else 0)
