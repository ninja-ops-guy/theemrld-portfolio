"""Execute the existing deep matrix with three documented harness corrections.
No product checkout is modified. Exact substitutions fail if the source runner drifts.
The fully expanded executed test is retained beside the browser receipts.
"""
from pathlib import Path
import os, runpy
source_path=Path(__file__).with_name('deep_browser.py')
source=source_path.read_text()
def replace_once(old,new):
    global source
    assert source.count(old)==1, 'Unexpected QA source drift: '+old[:80]
    source=source.replace(old,new,1)
replace_once("'runnerRevision':3", "'runnerRevision':4")
# The native Ghost Fork entry cinematic may legitimately advance the story.
# Capture that observation, then enforce no story mutation from the side operation.
replace_once("c,n=boot(browser);v,d=earn(c,n,section);before=n.evaluate('JSON.stringify(TechOpsCampaign.load(localStorage).story)');night(n);begin(n,d)",
 "c,n=boot(browser);v,d=earn(c,n,section);entry_before=n.evaluate('JSON.stringify(TechOpsCampaign.load(localStorage).story)');night(n);before=n.evaluate('JSON.stringify(TechOpsCampaign.load(localStorage).story)');observations['nativeEntryChangedStory']=entry_before!=before;begin(n,d)")
# A true lower-runtime rescue checkpoint carries these booleans. The prior
# semantic-only fixture left them false and omitted the second native importer.
replace_once("for(let i=1;i<8;i++)TechOpsGoodDogsCampaignState.markTransition(i,i+1);S.meta._v736.done=true;",
 "for(let i=1;i<8;i++){S.meta._v736.m=i+1;if(i>=4)S.meta._v736.k=true;if(i>=6)S.meta._v736.waldo=true;TechOpsGoodDogsCampaignState.markTransition(i,i+1);}S.meta._v736.done=true;")
replace_once("n.wait_for_timeout(1200);actual=snap(n);observations['milestones']=actual['milestones']",
 "n.wait_for_function('TechOpsCampaign.load(localStorage).story.completedActs.includes(\"interlude\")',timeout=8000);n.wait_for_function('(()=>{try{return TechOpsLinked.context().milestones.returned===true}catch{return false}})()',timeout=8000);actual=snap(n);observations['milestones']=actual['milestones']")
# Start the quota test through the ordinary available card, after native state
# settles, rather than conflating a transient direct-hash refresh with a write test.
replace_once("c,n=boot(browser);advance(n,'act_3',False);v=page(c,'quota');",
 "c,n=boot(browser);advance(n,'act_3',False);n.evaluate('S.paused=true');n.wait_for_timeout(800);snap(n);v=page(c,'quota');")
replace_once("v.goto(URL+'#felicia');v.locator('[data-choice=\"capture-baseline\"]').click()\n        expect(v.locator('#storage-status')).to_contain_text('Quota')",
 "v.goto(URL);v.get_by_role('button',name='Continue this perspective',exact=True).click();v.locator('[data-choice=\"capture-baseline\"]').click()\n        expect(v.locator('#storage-status')).to_contain_text('Quota')")
output=Path(os.getenv('QA_OUTPUT','results/browser'));output.mkdir(parents=True,exist_ok=True)
expanded=output/'qualified-executed-test.py';expanded.write_text(source)
runpy.run_path(str(expanded),run_name='__main__')
