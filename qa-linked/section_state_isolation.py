"""Focused follow-up against unchanged products.
Record native entry, operation launch and completion separately. Include both native
Good Dogs persistence authorities and a consistent lower-runtime completion record;
the earlier semantic-only fixture left lower-runtime rescue booleans false.
"""
from pathlib import Path
helper=Path(__file__).with_name('deep_browser.py').read_text()
exec(helper.split('\nwith sync_playwright() as p:')[0],globals())
REPORT['scope']='Focused K/Waldo state isolation, complete native Good Dogs importer composition, and stable quota rejection. Canonical prerequisite fixtures; real persistence/UI/keyboard.'
REPORT['runnerRevision']='state-isolation-2'
def story_state(n):return n.evaluate('JSON.parse(JSON.stringify(TechOpsCampaign.load(localStorage).story))')
with sync_playwright() as p:
    browser=getattr(p,ENGINE).launch(headless=True);REPORT['browserVersion']=browser.version
    def full_return_composition():
        c,n=boot(browser);advance(n,'act_6',False)
        n.wait_for_function('window.TechOpsGoodDogsCampaignState && window.TechOpsLateGameCampaign',timeout=15000)
        n.evaluate('''async()=>{
          const c=TechOpsCampaign.load(localStorage);S.story=structuredClone(c.story);S.inDialog=true;
          S.meta._v736={m:1,k:false,waldo:false,done:false,campaignOrigin:'campaign'};delete S.meta._standaloneMode;
          for(let i=1;i<8;i++){
            S.meta._v736.m=i+1;
            if(i>=4)S.meta._v736.k=true;
            if(i>=6)S.meta._v736.waldo=true;
            TechOpsGoodDogsCampaignState.markTransition(i,i+1);
          }
          S.meta._v736.done=true;TechOpsGoodDogsCampaignState.completeReturn();
          await TechOpsLinked.publish();
        }''')
        observations['initial']=n.evaluate('({lower:S.meta._v736,bridge:__goodDogsMainCampaignBridge,liveActs:S.story.completedActs,persistedActs:TechOpsCampaign.load(localStorage).story.completedActs})')
        assert observations['initial']['bridge']['canonicalImported'] is True
        # The existing late-game importer runs every 1.5 seconds. Do not invent
        # an interlude by calling TechOpsStory.completeAct in this assertion path.
        n.wait_for_function('TechOpsCampaign.load(localStorage).story.completedActs.includes("interlude")',timeout=8000)
        n.wait_for_function('(()=>{try{return TechOpsLinked.context().milestones.returned===true}catch{return false}})()',timeout=8000)
        observations['final']=snap(n)
        observations['persistedActs']=story_state(n)['completedActs']
        n.reload(wait_until='domcontentloaded');n.wait_for_function('window.TechOpsLinked&&window.__productionTitleReadiness?.ready',timeout=30000);n.locator('#btn-continue').click()
        assert snap(n)['milestones']['returned'] is True
        v=see(c,'k');expect(v.locator('#scene-title')).to_have_text('Cell 118')
        observations['reloadPreservesReturn']=True
    run('complete-native-return-importer-composition',full_return_composition)
    def stable_quota():
        c,n=boot(browser);advance(n,'act_3',False);n.evaluate('S.paused=true');n.wait_for_timeout(800);snap(n)
        v=page(c,'quota');v.add_init_script("const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('techops:linked:story:'))throw new DOMException('Quota test','QuotaExceededError');return original.call(this,k,v)}")
        v.goto(URL);v.get_by_role('button',name='Continue this perspective',exact=True).click()
        for _ in range(3):
            v.locator('[data-choice="capture-baseline"]').click();expect(v.locator('#storage-status')).to_contain_text('Quota');expect(v.locator('#scene-title')).to_have_text('An answer, not a command')
        assert v.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('techops:linked:story:')).length")==0
        observations['rejectedWrites']=3
    run('quota-rejection-no-history-advance',stable_quota)
    for section in ['memory-anchor','return-route']:
        def isolated(section=section):
            c,n=boot(browser);v,d=earn(c,n,section)
            before_entry=story_state(n);night(n);after_entry=story_state(n)
            observations['beforeNativeEntry']=before_entry;observations['afterNativeEntry']=after_entry
            begin(n,d);before_operation=story_state(n);observations['afterOperationLaunch']=before_operation
            for i,step in enumerate(d['steps']):
                travel(n,i);n.get_by_role('button',name=step[2],exact=True).click();expect(n.get_by_text('That conclusion is not supported.',exact=False)).to_be_visible();n.get_by_role('button',name=step[1],exact=True).click()
            expect(n.get_by_role('heading',name='SECTION COMPLETE',exact=True)).to_be_visible()
            after_operation=story_state(n);observations['afterOperationCompletion']=after_operation
            observations['nativeEntryChangedStory']=before_entry!=after_entry;observations['launchChangedStory']=after_entry!=before_operation;observations['operationChangedStory']=before_operation!=after_operation
            v.reload();expect(v.get_by_text('Completed in Night Walker.',exact=True)).to_be_visible();observations['returnReceiptVisible']=True
            n.screenshot(path=str(OUT/(section+'-complete.png')),full_page=True)
            assert after_entry==before_operation,'Launching the side operation changes native story state'
            assert before_operation==after_operation,'Side-operation objective completion changes native story state'
        run('isolate-'+section,isolated)
    REPORT['summary']={'passed':sum(r['status']=='PASS' for r in REPORT['results']),'failed':sum(r['status']=='FAIL' for r in REPORT['results'])}
    (OUT/'deep-receipt.json').write_text(json.dumps(REPORT,indent=2));print(json.dumps(REPORT['summary']),flush=True);browser.close()
raise SystemExit(1 if REPORT['summary']['failed'] else 0)
