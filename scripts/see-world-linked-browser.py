"""Cross-repository integration on real native UI.
Main-story prerequisite setup is explicitly fixture-assisted through native APIs;
See World decisions, native follow-up sections and persistence use production code.
"""
from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import json, os, traceback
root=os.environ.get('LINKED_BASE_URL','http://127.0.0.1:8765').rstrip('/')
native_url=root+'/techops-hero/'
see_url=root+'/theemrld-portfolio/see-world/index.html'
out=Path(os.environ.get('LINKED_QA_DIR','qa/see-world-linked'));out.mkdir(parents=True,exist_ok=True)
receipt={'status':'RUNNING','steps':[],'page_errors':[],'fixture_scope':'Main story progression is seeded through native campaign APIs, not a full natural playthrough. Native section choices and See World decisions are exercised through the actual UI.','limitations':['Desktop/touch browser emulation, not physical-device testing.','No new 3D maps, combat animation, voice or cloud synchronization.']}

def done(label):
    receipt['steps'].append(label)
    print('PASS',label,flush=True)

def click_option(page,text):
    option=page.locator('#dlg-options button').filter(has_text=text).first
    expect(option).to_be_visible(timeout=20000)
    option.click()

def startup(page):
    page.goto(native_url,wait_until='domcontentloaded')
    page.wait_for_function('window.__productionBootstrapReady && window.TechOpsNightRuntime && window.TechOpsUniverse',timeout=60000)
    page.wait_for_function('window.TechOpsProductionTitleExperience?.state().ready',timeout=60000)
    page.locator('#btn-start').click()
    click_option(page,'Standard')
    click_option(page,'Clock in')
    page.wait_for_function('window.S && !S.inDialog && !S.nightMode',timeout=30000)
    page.evaluate('TechOpsUniverse.publish()')

def seed_to(page,act):
    # Keep the actual run identity/revision established by CLOCK IN.
    return page.evaluate('''async target=>{
      const C=TechOpsCampaign,T=TechOpsStory,A=TechOpsCampaignAct2;
      let c=C.load(localStorage);
      if(!c.flags.tuesday_morning_reached){
        const identity=c.universe;c=C.createInitialState();c.universe=identity;
        for(const id of C.TICKETS)C.assignTicket(c,id,'mike');
        C.completeStandup(c);C.completeWorkstation(c,{redInTheMirrorHeard:true,feliciaVideoSeen:true});
        C.recordGhostEvidence(c,{id:'badge_impossible_access',perspective:'firsthand'});
        C.enterSector04(c);C.insightAccessGuard(c);C.severAccessController(c);C.transitionToTuesday(c);T.syncAct1State(c);
      }
      const order=TechOpsUniverseCore.ORDER;
      for(const id of order){
        if(!c.story.completedActs.includes(id)){
          if(id==='act_4'){
            A.beginTrustInvestigation(c);A.recordTrustInvestigation(c,{approach:'trace'});
            for(const e of A.TRUST_EVIDENCE)A.observeTrustEvidence(c,e.id);
            A.evaluateTrustHypothesis(c,'stale_mirror');A.applyTrustResponse(c);
            A.verifyTrustResponse(c,'technical');A.verifyTrustResponse(c,'requester');
            A.completeTrustReport(c,{reported:true,sharedOwnership:true});
          }else T.completeAct(c,id);
        }
        if(id===target)break;
      }
      C.save(c,localStorage);S.day=c.campaign.day; if(!save())throw Error('native profile save failed');
      await TechOpsUniverse.publish();const s=TechOpsUniverseCore.readSource(localStorage);
      if(s.status!=='ready')throw Error(JSON.stringify(s));return s;
    }''',act)

def night(page):
    page.evaluate('''()=>{if(S.inDialog)closeDlg();if(!S.nightMode)enterNight();}''')
    for _ in range(100):
        if page.evaluate('!!window.v722?.active()'):
            page.keyboard.press('Escape')
        if page.evaluate('!!S.nightMode && !S.inDialog && !window.v722?.active()'):
            break
        page.wait_for_timeout(100)
    page.wait_for_function('!!S.nightMode && !S.meta._standaloneMode',timeout=15000)

def journal(page):
    page.bring_to_front()
    if page.evaluate('!!S.inDialog'):
        page.evaluate('closeDlg()')
    page.locator('#night-campaign').click()
    click_option(page,'Linked Story Timeline')
    expect(page.locator('#dlg-name')).to_contain_text('LINKED STORY TIMELINE')

def play_native(page,title,actions):
    journal(page)
    click_option(page,'Enter unlocked: '+title)
    for action in actions:
        click_option(page,action)
    expect(page.locator('#dlg-options')).to_contain_text('Return to See World')
    done('Native section completed through UI: '+title)

def see_campaign(page,id):
    page.goto(see_url,wait_until='domcontentloaded')
    page.wait_for_selector('#content h1')
    # Select only the actual revealed card, never force a locked campaign.
    if id=='iona':
        page.locator('.featured').get_by_role('button',name='Begin campaign →').click()
    else:
        label={'felicia':'Felicia','k':'K','waldo':'Waldo / Oz'}[id]
        page.get_by_role('button',name='Timeline',exact=True).click()
        card=page.locator('.collection .card').filter(has=page.get_by_role('heading',name=label.upper(),exact=True))
        # Native labels on timeline use campaign.name (upper case).
        card.get_by_role('button',name='Begin campaign →').click()
    page.locator('#scene-title').wait_for()

def decisions(page,choices):
    for choice in choices:
        button=page.locator(f'[data-choice="{choice}"]')
        expect(button).to_be_enabled(timeout=20000)
        button.click()

def check_source(page):
    return page.evaluate('TechOpsUniverseCore.readSource(localStorage)')

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1)
    context.set_default_timeout(20000)
    context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(root) else r.abort())
    native=context.new_page();view=context.new_page()
    for page in (native,view):page.on('pageerror',lambda e:receipt['page_errors'].append(str(e)))
    try:
        view.goto(see_url+'#iona')
        expect(view.locator('main')).to_contain_text('A story still unfolding.')
        text=view.locator('main').inner_text()
        for secret in ['Iona','Felicia','Waldo','The World He Left Running','The Name I Keep']:
            assert secret not in text,secret
        view.screenshot(path=str(out/'fresh-linked-no-spoilers.png'),full_page=True)
        done('Fresh/direct-link UI withholds undiscovered names, scenes and rewards')
        startup(native)
        s=seed_to(native,'act_3');assert s['milestones']['violinist'] and not s['milestones']['duet']
        see_campaign(view,'felicia')
        decisions(view,['capture-baseline','independent-clock'])
        expect(view.locator('[data-choice="wait-sweep"]')).to_be_disabled()
        done('The Violinist opens solo Felicia before Duet; later scene waits for native section')
        night(native)
        journal(native)
        click_option(native,'Enter unlocked: The missing interval')
        click_option(native,'Keep only the dramatic timestamp')
        expect(native.locator('#dlg-name')).to_contain_text('CHECK THE EVIDENCE')
        click_option(native,'Return to the observation')
        for text in ['Preserve both clocks','repeatable local response','Retain the reference','File the bounded result']:
            click_option(native,text)
        expect(native.locator('#dlg-options')).to_contain_text('Return to See World')
        assert 'felicia_signal' in check_source(native)['milestones']['completedSections']
        assert not check_source(native)['milestones']['duet']
        native.screenshot(path=str(out/'native-signal-section-complete.png'),full_page=True)
        done('Actual native signal section rejects a false conclusion, saves completion, and does not complete Duet')
        view.bring_to_front()
        expect(view.locator('[data-choice="wait-sweep"]')).to_be_enabled(timeout=20000)
        decisions(view,['wait-sweep','bench-test','external-stop','share-packet','publish-limits','joint-brief'])
        expect(view.locator('#scene-title')).to_have_text('Two people can stop it')
        view.screenshot(path=str(out/'felicia-linked-complete.png'),full_page=True)
        view.reload();expect(view.locator('#scene-title')).to_have_text('Two people can stop it')
        done('Native completion returns to See World, opens the next chapter, and survives reload')
        play_native(native,'A stop outside your hands',['Test an external stop','Let the other operator','Record only this tested stop'])
        native.evaluate('closeDlg()')
        s=seed_to(native,'act_7');assert s['milestones']['returned'] and s['milestones']['ghostFork'] and not s['milestones']['iona']
        # The native disclosure is an actual reader action, not a guessed arrest flag.
        journal(native)
        click_option(native,'Read an earlier interlude')
        expect(native.locator('#dlg-text')).to_contain_text('not a recording Mike possesses')
        click_option(native,'Read later')
        assert not check_source(native)['milestones']['iona']
        click_option(native,'Read an earlier interlude')
        click_option(native,'Record this viewpoint')
        native.wait_for_function("TechOpsUniverseCore.readSource(localStorage).milestones?.iona === true")
        assert check_source(native)['milestones']['iona']
        done('Iona remains locked until the explicit native player-only cutaway is read')
        # K and Waldo retain independent histories and require their earned native sections.
        see_campaign(view,'k')
        decisions(view,['mark-wall','test-anchor','answer-plain','give-space','free-oz','accept-water','cycle'])
        expect(view.locator('[data-choice="keep-log"]')).to_be_disabled()
        play_native(native,'What the mark can prove',['recorded a specific observed mark','separate columns','Keep the detailed record private'])
        view.bring_to_front();expect(view.locator('[data-choice="keep-log"]')).to_be_enabled();decisions(view,['keep-log'])
        expect(view.locator('#scene-title')).to_have_text('The name in the margin')
        see_campaign(view,'waldo')
        decisions(view,['listen-dogs','prioritize-k','give-space','leave-cell','share-water','inspect-shutter','interval-cross','roll-call'])
        expect(view.locator('[data-choice="shelter"]')).to_be_disabled()
        play_native(native,'Count the people, not the light',['Record each dog','Dogs free K','Check K, Oz, Katrin and Manchez'])
        view.bring_to_front();expect(view.locator('[data-choice="shelter"]')).to_be_enabled();decisions(view,['shelter'])
        done('K and Waldo native follow-ups open their distinct final reflections without another rescue')
        see_campaign(view,'iona')
        decisions(view,['check-record','delegate','intercept','send-help','corridor','rescue-lift','sidestep','open-cells','recover-ledger','record-director','leave-recording','verify-count'])
        view.locator('[data-choice="burn"]').click();view.get_by_role('button',name='Keep playing',exact=True).click()
        expect(view.locator('#scene-title')).to_have_text('What survives?')
        view.locator('[data-choice="burn"]').click();view.get_by_role('button',name='Confirm',exact=True).click()
        expect(view.locator('[data-choice="burn-family"]')).to_be_disabled()
        journal(native)
        native_text=native.locator('#dialogue').inner_text()
        assert 'After the fire' in native_text and 'No one owns the voices' not in native_text and 'Write down what I did' not in native_text
        click_option(native,'Enter unlocked: After the fire')
        for text in ['Keep the original ledger','Request the original continuation order','Give the address']:
            click_option(native,text)
        view.bring_to_front();expect(view.locator('[data-choice="burn-family"]')).to_be_enabled();decisions(view,['burn-family'])
        expect(view.locator('#scene-title')).to_have_text('The count survives the fire')
        done('Iona cancellation, irreversible fate, exclusive native follow-up and linked ending')
        view.get_by_role('button',name='Timeline',exact=True).click()
        view.screenshot(path=str(out/'shared-story-timeline-desktop.png'),full_page=True)
        snapshot=view.evaluate('Object.fromEntries(Object.entries(localStorage))')
        receipt['native_source']=check_source(native)
        # Snapshot is a test fixture for responsive inspection, NOT a product cloud-sync feature.
        mobile_context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
        mobile_context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(root) else r.abort())
        mobile_context.add_init_script('const data='+json.dumps(snapshot)+';for(const [k,v] of Object.entries(data))localStorage.setItem(k,v);')
        mobile=mobile_context.new_page();mobile.on('pageerror',lambda e:receipt['page_errors'].append(str(e)))
        mobile.goto(see_url);mobile.get_by_role('button',name='Timeline',exact=True).click()
        assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
        mobile.screenshot(path=str(out/'shared-story-timeline-mobile.png'),full_page=True)
        mobile.set_viewport_size({'width':320,'height':740});assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
        done('390px and 320px linked timelines fit without horizontal overflow')
        # A legacy preview never becomes a native award.
        before=view.evaluate("localStorage.getItem('techops_hero_campaign_v1')")
        sandbox=context.new_page();sandbox.goto(see_url+'?preview=1')
        sandbox.get_by_role('button',name='Begin campaign →').first.click();sandbox.locator('[data-choice="hear-sister"]').click()
        assert view.evaluate("localStorage.getItem('techops_hero_campaign_v1')")==before
        done('Sandbox replay remains separate from the native playthrough')
        # Reset through the real title button; the existing See World tab must immediately hide prior spoilers.
        old_run=check_source(native)['binding']['playthroughId']
        startup(native)
        native.wait_for_function("TechOpsUniverseCore.readSource(localStorage).status==='ready'")
        assert check_source(native)['binding']['playthroughId']!=old_run
        view.bring_to_front();view.goto(see_url+'#iona')
        expect(view.locator('main')).to_contain_text('A story still unfolding.')
        assert 'The World He Left Running' not in view.locator('main').inner_text()
        done('Actual New Game invalidates old run access without deleting archived See World histories')
        assert not receipt['page_errors'],receipt['page_errors']
        receipt['status']='PASS'
    except Exception as exc:
        receipt['status']='FAIL';receipt['error']=str(exc);receipt['traceback']=traceback.format_exc()
        for label,page in [('native',native),('see',view)]:
            try:
                page.screenshot(path=str(out/(label+'-failure.png')),full_page=True)
                receipt[label+'_diagnostic']=page.evaluate('''()=>({url:location.href,body:document.body.innerText.slice(-18000),source:globalThis.TechOpsUniverseCore?.readSource(localStorage),native:globalThis.TechOpsUniverse?.health(),bootstrap:globalThis.__productionBootstrapError})''')
            except Exception as inner:receipt[label+'_diagnostic_error']=str(inner)
    finally:
        (out/'receipt.json').write_text(json.dumps(receipt,indent=2))
        print(json.dumps(receipt,indent=2),flush=True)
        browser.close()
if receipt['status']!='PASS':raise SystemExit(1)
