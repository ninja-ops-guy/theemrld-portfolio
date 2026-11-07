"""Cross-repo browser contract. Native story prerequisites use explicit canonical fixtures.
The tested loop itself uses real native saves, See World UI, keyboard movement,
three native side-operation objectives, persistence, and a new-game reset.
"""
from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import os, json, traceback
BASE=os.environ.get('LINKED_BASE_URL','http://127.0.0.1:8765').rstrip('/')
OUT=Path(os.environ.get('LINKED_QA_DIR','qa/linked')); OUT.mkdir(parents=True,exist_ok=True)
REPORT={'passed':[],'errors':[],'scope':'Native prerequisite fixtures, actual linked UI/save/launch/objective/completion loop; not an entire main-game playthrough.'}

def passed(name):
    REPORT['passed'].append(name); print('PASS',name,flush=True)

def advance(page,target):
    result=page.evaluate('''async target=>{
      const C=TechOpsCampaign,T=TechOpsStory,s=C.load(localStorage);
      for(const a of T.ACTS){if(!s.story?.completedActs?.includes(a.id)){
        if(a.id==='act_4'){s.story.facts.trust_investigation_reported=true;}
        T.completeAct(s,a.id);
      }if(a.id===target)break;}
      if(!C.save(s,localStorage))throw Error('Native campaign save failed');
      await new Promise(r=>setTimeout(r,50)); await TechOpsLinked.publish();
      return TechOpsLinked.context();
    }''',target)
    assert result['milestones']; return result

def start(page):
    page.wait_for_function('window.TechOpsLinked && window.__productionTitleReadiness?.ready===true',timeout=30000)
    page.locator('#btn-start').click()
    page.locator('#dlg-options button').filter(has_text='Standard').first.click()
    page.wait_for_function('window.S && localStorage.getItem("techops_save")',timeout=12000)
    page.evaluate('''async()=>{closeDlg(); const c=TechOpsCampaign.load(localStorage);TechOpsCampaign.save(c,localStorage);if(!save())throw Error(__techopsSaveError);await new Promise(r=>setTimeout(r,60));await TechOpsLinked.publish();}''')
    page.wait_for_function('window.TechOpsLinked && (()=>{try{return !!TechOpsLinked.context()}catch{return false}})()',timeout=10000)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    ctx=browser.new_context(viewport={'width':1440,'height':1000})
    # Soundtrack/third-party requests are not part of this contract.
    ctx.route('https://**/*',lambda r:r.abort())
    native=ctx.new_page(); see=ctx.new_page(); observed=[]
    for label,page in [('native',native),('see',see)]:
        page.on('pageerror',lambda e,label=label:observed.append({'page':label,'error':str(e)}))
    try:
        see.goto(BASE+'/theemrld-portfolio/see-world/index.html#k')
        see.locator('.hero').wait_for()
        assert see.get_by_role('button',name='Locked in this playthrough',exact=True).count()==4
        text=see.locator('#content').inner_text()
        for secret in ['The Name I Keep','The World He Left Running','No One Left Behind','A Signal Is Not a Confession']:assert secret not in text
        see.screenshot(path=str(OUT/'linked-locked-desktop.png'),full_page=True)
        passed('fresh state and direct-hash spoiler masking')
        native.goto(BASE+'/techops-hero/',wait_until='domcontentloaded')
        start(native)
        old_id=native.evaluate('TechOpsLinked.context().runId')
        assert native.evaluate('TechOpsLinked.context().milestones.violinist') is False
        passed('real main New Game creates shared playthrough identity')
        advance(native,'act_3')
        assert native.evaluate('TechOpsStoryAuthority.canPlayFelicia()') is True
        assert native.evaluate('TechOpsStoryAuthority.canShareFelicia()') is False
        see.reload();see.get_by_role('button',name='Continue this perspective',exact=True).click()
        for choice in ['capture-baseline','independent-clock','wait-sweep','bench-test']:
            see.locator('[data-choice="'+choice+'"]').click()
        expect(see.locator('[data-choice="external-stop"]')).to_be_disabled()
        passed('Felicia solo before Duet, later handoff guarded by native alliance')
        advance(native,'act_4')
        expect(see.locator('[data-choice="external-stop"]')).to_be_enabled()
        see.locator('[data-choice="external-stop"]').click()
        see.locator('[data-choice="share-packet"]').click()
        expect(see.get_by_role('heading',name='EARNED IN NIGHT WALKER',exact=True)).to_be_visible()
        before=native.evaluate('JSON.stringify(TechOpsCampaign.load(localStorage).story)')
        passed('native completion unlocks scene; See World handoff earns section')
        native.evaluate('''()=>{closeDlg();S.inDialog=false;S.inBattle=false;S.paused=false;enterNight();}''')
        native.locator('#see-world-linked-button').click()
        native.get_by_role('button',name='Enter: Signal / Independent Check',exact=True).click()
        native.wait_for_function('TechOpsLinked.mission()?.id==="signal-check"')
        # Remove combat enemies only in this browser fixture to isolate movement/interaction.
        native.evaluate('NM.enemies=[];NM.hp=10000;S.inDialog=false;S.paused=false')
        assert native.evaluate('TechOpsLinked.context().runId')==old_id
        answers=['Record the quiet baseline','Preserve the disagreement','Let another operator enforce the stop']
        for i,answer in enumerate(answers):
            target=[420,820,1220][i]
            native.keyboard.down('ArrowRight')
            try:native.wait_for_function('(target)=>NM.x+NM.w/2>=target-60',arg=target,timeout=12000)
            finally:native.keyboard.up('ArrowRight')
            expect(native.get_by_role('button',name='Inspect objective',exact=True)).to_be_enabled(timeout=4000)
            native.get_by_role('button',name='Inspect objective',exact=True).click()
            if i==0:
                native.get_by_role('button',name='Interpret a response before measuring',exact=True).click()
                expect(native.get_by_text('That conclusion is not supported.',exact=False)).to_be_visible()
            native.get_by_role('button',name=answer,exact=True).click()
        expect(native.get_by_role('heading',name='SECTION COMPLETE',exact=True)).to_be_visible()
        after=native.evaluate('JSON.stringify(TechOpsCampaign.load(localStorage).story)')
        assert before==after,'Side operation changed native story completion'
        native.screenshot(path=str(OUT/'linked-night-completed.png'),full_page=True)
        passed('earned section launches in actual Night Walker; keyboard traversal and three objective checks complete without stamping story acts')
        see.reload()
        expect(see.get_by_text('Completed in Night Walker.',exact=True)).to_be_visible()
        see.screenshot(path=str(OUT/'linked-return-completed.png'),full_page=True)
        passed('native completion receipt returns to See World and survives reload')
        # Mobile reads the same real persisted linked records, not arbitrary all-complete flags.
        mobilectx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,storage_state=ctx.storage_state())
        mobile=mobilectx.new_page();mobile.goto(BASE+'/theemrld-portfolio/see-world/index.html')
        assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
        mobile.get_by_role('button',name='Continue this perspective',exact=True).click()
        assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
        for box in mobile.locator('button[data-choice]').all():assert box.bounding_box()['height']>=44
        mobile.screenshot(path=str(OUT/'linked-mobile.png'),full_page=True)
        passed('mobile linked scene has no horizontal overflow and >=44px choices')
        mobilectx.close()
        native.get_by_role('button',name='Return to Night Walker',exact=True).click()
        advance(native,'act_7')
        assert native.evaluate('TechOpsLinked.context().milestones.ionaAccount') is False
        native.locator('#see-world-linked-button').click()
        native.get_by_role('button',name='Read an earlier perspective',exact=True).click()
        native.get_by_role('button',name='Record this account and reveal the interlude',exact=True).click()
        native.wait_for_function('(()=>{try{return TechOpsLinked.context().milestones.ionaAccount===true}catch{return false}})()')
        see.goto(BASE+'/theemrld-portfolio/see-world/index.html#iona')
        expect(see.get_by_role('heading',name='The empty mic',exact=True)).to_be_visible()
        passed('Iona disclosure is explicit, after Ghost Fork, and earlier-interlude labeled')
        # Wrong-run imports and old unrestricted previews are never accepted.
        see.locator('#import').set_input_files({'name':'preview.json','mimeType':'application/json','buffer':b'{"schema":1,"revision":"2026-11-07-a","runs":{}}'})
        expect(see.locator('#storage-status')).to_contain_text('unlinked preview')
        passed('unlinked preview import rejected')
        # Continue in another native tab transfers write ownership without changing the run.
        resumed=ctx.new_page();resumed.on('pageerror',lambda e:observed.append({'page':'resumed','error':str(e)}))
        resumed.goto(BASE+'/techops-hero/',wait_until='domcontentloaded')
        resumed.wait_for_function('window.TechOpsLinked && window.__productionTitleReadiness?.ready===true',timeout=30000)
        resumed.locator('#btn-continue').click()
        resumed.wait_for_function('(()=>{try{return !!TechOpsLinked.context()}catch{return false}})()',timeout=10000)
        assert resumed.evaluate('TechOpsLinked.context().runId')==old_id
        assert native.evaluate('save()') is False
        assert native.evaluate('async()=>{try{await TechOpsLinked.bindExisting();return false}catch{return true}}') is True
        passed('Continue preserves run identity and transfers the native writer lease; previous tab cannot overwrite the same run')
        # A second real New Game retires the old active binding; old tab cannot overwrite it.
        newer=ctx.new_page();newer.on('pageerror',lambda e:observed.append({'page':'newer','error':str(e)}));newer.goto(BASE+'/techops-hero/',wait_until='domcontentloaded');start(newer)
        new_id=newer.evaluate('TechOpsLinked.context().runId');assert new_id!=old_id
        old_write=native.evaluate('save()');assert old_write is False
        assert resumed.evaluate('save()') is False
        assert native.evaluate('async()=>{try{await TechOpsLinked.bindExisting();return false}catch{return true}}') is True
        assert newer.evaluate('TechOpsLinked.context().runId')==new_id
        see.reload();assert see.get_by_role('button',name='Locked in this playthrough',exact=True).count()==4
        passed('new-game identity reset; previous native tab cannot overwrite the new run; See World gates reset')
        REPORT['page_errors']=observed
        assert not observed,observed
        REPORT['status']='PASS'
    except Exception as error:
        REPORT['status']='FAIL';REPORT['errors'].append(str(error));REPORT['traceback']=traceback.format_exc();REPORT['page_errors']=observed
        for label,page in [('native',native),('see',see)]:
            try:
                page.screenshot(path=str(OUT/('failure-'+label+'.png')),full_page=True)
                REPORT[label+'_body']=page.locator('body').inner_text()[-14000:]
                if label=='native': REPORT['native_diagnostics']=page.evaluate('({linked:window.TechOpsLinked?.health(),loadError:window.__seeWorldLinkedLoadError,saveError:window.__techopsSaveError,state:!!window.S,identity:window.S?.meta?.seeWorldLink,night:window.NM&&{district:NM.district,x:NM.x,paused:S.paused,inDialog:S.inDialog},source:localStorage.getItem("techops:linked:native:v1")})')
            except Exception: pass
        raise
    finally:
        (OUT/'linked-browser-receipt.json').write_text(json.dumps(REPORT,indent=2))
        print(json.dumps(REPORT,indent=2),flush=True)
        browser.close()
