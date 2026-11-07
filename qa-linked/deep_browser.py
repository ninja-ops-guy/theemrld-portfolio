"""Adversarial tests of unchanged paired product heads. Failures are retained.
Minimal canonical fixtures establish prerequisites. Traversal uses keyboard input;
enemies are cleared only to isolate movement. Revision 3 brings the native tab to
front and deliberately skips authored entry cutscenes with their supported E key.
The first two runner revisions and their fixture limitations remain in CI history.
"""
from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import os, json, time, traceback
ENGINE=os.getenv('QA_ENGINE','chromium');BASE=os.getenv('QA_BASE','http://127.0.0.1:8765')
OUT=Path(os.getenv('QA_OUTPUT','results/browser'));OUT.mkdir(parents=True,exist_ok=True)
URL=BASE+'/theemrld-portfolio/see-world/index.html';NATIVE=BASE+'/techops-hero/'
REPORT={'engine':ENGINE,'runnerRevision':3,'productHeads':{'portfolio':'0a6f9bf6481f321b52d7a496da02cf62cc193820','native':'b8b2378f3cf0b84bfc94e1472b8e26d7043a7445'},'scope':'Minimal canonical prerequisite fixtures; real UIs, saves, keyboard cutscene controls and objective movement. No full main-story playthrough or physical-device certification.','results':[]}
contexts=[];pages=[];page_errors=[];observations={}

def context(browser,**kw):
    ctx=browser.new_context(viewport={'width':1440,'height':1000},**kw);ctx.set_default_timeout(6000)
    ctx.route('https://**/*',lambda route:route.abort());contexts.append(ctx);return ctx

def page(ctx,label):
    p=ctx.new_page();pages.append((label,p));p.on('pageerror',lambda e:page_errors.append({'page':label,'message':str(e)}));return p

def snap(p):
    return p.wait_for_function('(()=>{try{return TechOpsLinked.context()}catch{return null}})()',timeout=12000).json_value()

def boot(browser):
    ctx=context(browser);n=page(ctx,'native');n.goto(NATIVE,wait_until='domcontentloaded')
    n.wait_for_function('window.TechOpsLinked && window.__productionTitleReadiness?.ready===true',timeout=30000)
    n.locator('#btn-start').click();n.locator('#dlg-options button').filter(has_text='Standard').first.click()
    n.wait_for_function('window.S && localStorage.getItem("techops_save")',timeout=10000)
    n.evaluate('''async()=>{closeDlg();const c=TechOpsCampaign.load(localStorage);TechOpsCampaign.save(c,localStorage);if(!save())throw Error(__techopsSaveError);await TechOpsLinked.publish();}''')
    snap(n);return ctx,n

def advance(n,last='interlude',disclose=False):
    n.evaluate('''async ({last,disclose})=>{const C=TechOpsCampaign,T=TechOpsStory,c=C.load(localStorage);for(const act of T.ACTS){if(!c.story?.completedActs?.includes(act.id)){if(act.id==='act_4')c.story.facts.trust_investigation_reported=true;T.completeAct(c,act.id);}if(act.id===last)break;}if(disclose)c.seeWorldDisclosures={redArrestAccount:{version:1,audience:'player'}};C.save(c,localStorage);await TechOpsLinked.publish();}''',{'last':last,'disclose':disclose})
    return snap(n)

def see(ctx,actor=''):
    p=page(ctx,'see');p.goto(URL+('#'+actor if actor else ''),wait_until='domcontentloaded');p.locator('#content h1').wait_for();return p

def earn(ctx,n,section):
    last='act_4' if section=='signal-check' else 'act_7' if section.startswith('low-quarter-') else 'interlude'
    advance(n,last,section.startswith('low-quarter-'));n.evaluate('S.paused=true');n.wait_for_timeout(800);snap(n);p=see(ctx)
    plan=p.evaluate('''async id=>{const L=await import('./linked.mjs'),E=await import('./engine.mjs'),D=await import('./campaigns.mjs');let ctx;for(let i=0;i<40;i++){ctx=L.context(localStorage);if(ctx.ok)break;await new Promise(r=>setTimeout(r,50));}if(!ctx.ok)throw Error(ctx.error);const s=ctx.snapshot,def=L.SECTION_DEFS.find(d=>d.id===id);const q=[E.newRun(def.actor)];while(q.length){const r=q.shift();const found=L.sections({...L.emptyProgress(s),runs:{[def.actor]:r.history}},s).find(d=>d.id===id);if(found.available)return{actor:def.actor,history:r.history,definition:def};for(const o of D.nodeById(D.campaignById(def.actor),r.node).choices){try{q.push(E.choose(r,o.id));}catch{}}}throw Error('No eligible path');}''',section)
    p.goto(URL+'#'+plan['actor'])
    for step in plan['history']:
        p.locator('[data-choice="'+step['choice']+'"]').click()
        if p.locator('#confirm-dialog').is_visible():p.get_by_role('button',name='Confirm',exact=True).click()
    expect(p.get_by_role('heading',name=plan['definition']['title'],exact=True)).to_be_visible()
    return p,plan['definition']

def night(n):
    n.bring_to_front()
    n.evaluate('()=>{closeDlg();S.inDialog=false;S.inBattle=false;S.paused=false;enterNight();}')
    # Native Night Drive is an intentional transition, not an immediately active map.
    # Both existing v722 and v725 expose E as their deliberate skip control.
    for _ in range(20):
        active=n.evaluate('!!S?.nightMode && TechOpsNightRuntime.active(S.nightMode)')
        blocked=n.evaluate('!!(document.getElementById("v722-cine")||document.getElementById("v725-cine"))')
        if active and not blocked:break
        if blocked:n.keyboard.press('e')
        n.wait_for_timeout(200)
    n.wait_for_function('window.S?.nightMode && window.TechOpsNightRuntime.active(S.nightMode)',timeout=10000)
    snap(n)

def begin(n,definition):
    n.locator('#see-world-linked-button').click();n.get_by_role('button',name='Enter: '+definition['title'],exact=True).click()
    n.wait_for_function('(id)=>TechOpsLinked.mission()?.id===id',arg=definition['id'])
    n.evaluate('()=>{NM.enemies=[];NM.hp=10000;S.inDialog=false;S.paused=false;}')

def travel(n,i):
    target=[420,820,1220][i];n.keyboard.down('ArrowRight')
    try:n.wait_for_function('(x)=>NM.x+NM.w/2>=x-60',arg=target,timeout=12000)
    finally:n.keyboard.up('ArrowRight')
    expect(n.get_by_role('button',name='Inspect objective',exact=True)).to_be_enabled(timeout=4000)
    n.get_by_role('button',name='Inspect objective',exact=True).click()

def run(name,fn):
    global contexts,pages,page_errors,observations
    contexts=[];pages=[];page_errors=[];observations={};row={'name':name};start=time.monotonic()
    try:
        fn();assert not page_errors,'Unhandled page errors: '+json.dumps(page_errors);row['status']='PASS'
    except Exception as error:
        row.update(status='FAIL',error=str(error),traceback=traceback.format_exc())
        for i,(label,p) in enumerate(pages[-3:]):
            try:
                dest=OUT/(name+'-'+label+'-'+str(i)+'.png');p.screenshot(path=str(dest),full_page=True,timeout=5000)
                row.setdefault('screenshots',[]).append(dest.name);row.setdefault('body',{})[label]=p.locator('body').inner_text(timeout=2000)[-16000:]
                if label=='native':row['nativeDiagnostics']=p.evaluate('({night:!!S?.nightMode,mode:S?.meta?._standaloneMode,paused:S?.paused,dialog:S?.inDialog,mission:window.TechOpsLinked?.mission(),link:window.TechOpsLinked?.health(),active:window.TechOpsNightRuntime?.active(S?.nightMode)})')
            except Exception:pass
    finally:
        row.update(seconds=round(time.monotonic()-start,2),page_errors=page_errors,observations=observations);REPORT['results'].append(row)
        (OUT/'deep-receipt.json').write_text(json.dumps(REPORT,indent=2))
        print(row['status'],name,row.get('error','')[:180],flush=True)
        for c in contexts:
            try:c.close()
            except Exception:pass

with sync_playwright() as p:
    browser=getattr(p,ENGINE).launch(headless=True)
    REPORT['browserVersion']=browser.version
    def fresh():
        c=context(browser);v=see(c)
        for actor in ['iona','felicia','k','waldo']:
            v.goto(URL+'#'+actor);expect(v.get_by_role('button',name='Locked in this playthrough',exact=True)).to_have_count(4)
            text=v.locator('#content').inner_text();assert not any(t in text for t in ['The Name I Keep','The World He Left Running','No One Left Behind','A Signal Is Not a Confession'])
        v.get_by_role('button',name='Collection',exact=True).click();assert 'An unopened record' in v.locator('#content').inner_text()
    run('01-fresh-spoiler-masking',fresh)
    def felicia_gate():
        c,n=boot(browser);advance(n,'act_3',False);v=see(c,'felicia')
        assert snap(n)['milestones']['duet'] is False
        for key in ['capture-baseline','independent-clock','wait-sweep','bench-test']:v.locator('[data-choice="'+key+'"]').click()
        expect(v.locator('[data-choice="external-stop"]')).to_be_disabled();advance(n,'act_4',False)
        expect(v.locator('[data-choice="external-stop"]')).to_be_enabled();v.locator('[data-choice="external-stop"]').click();v.locator('[data-choice="share-packet"]').click()
        expect(v.get_by_role('heading',name='Signal / Independent Check',exact=True)).to_be_visible()
    run('02-solo-before-duet-chapter-gates',felicia_gate)
    for section in ['signal-check','memory-anchor','return-route','low-quarter-burn','low-quarter-workshop','low-quarter-witnesses']:
        def full_section(section=section):
            c,n=boot(browser);v,d=earn(c,n,section);before=n.evaluate('JSON.stringify(TechOpsCampaign.load(localStorage).story)');night(n);begin(n,d)
            expect(n.get_by_role('button',name='Inspect objective',exact=True)).to_be_disabled()
            for i,step in enumerate(d['steps']):
                travel(n,i);n.get_by_role('button',name=step[2],exact=True).click();expect(n.get_by_text('That conclusion is not supported.',exact=False)).to_be_visible()
                n.get_by_role('button',name=step[1],exact=True).click()
            expect(n.get_by_role('heading',name='SECTION COMPLETE',exact=True)).to_be_visible()
            assert before==n.evaluate('JSON.stringify(TechOpsCampaign.load(localStorage).story)')
            v.reload();expect(v.get_by_text('Completed in Night Walker.',exact=True)).to_be_visible()
            observations.update(section=section,realKeyboardObjectives=3,mainStoryUnchanged=True)
            if section=='memory-anchor':n.screenshot(path=str(OUT/'k-native-complete.png'),full_page=True)
        run('03-section-'+section,full_section)
    def good_dogs():
        c,n=boot(browser);advance(n,'act_6',False)
        n.wait_for_function('window.TechOpsGoodDogsCampaignState',timeout=15000)
        n.evaluate('''async()=>{const c=TechOpsCampaign.load(localStorage);S.story=structuredClone(c.story);S.meta._v736={m:1,k:false,waldo:false,done:false,campaignOrigin:'campaign'};delete S.meta._standaloneMode;for(let i=1;i<8;i++)TechOpsGoodDogsCampaignState.markTransition(i,i+1);S.meta._v736.done=true;TechOpsGoodDogsCampaignState.completeReturn();await TechOpsLinked.publish();}''')
        data=n.evaluate('({bridge:__goodDogsMainCampaignBridge,liveActs:S.story.completedActs,persistedActs:TechOpsCampaign.load(localStorage).story.completedActs,goodDogs:S.meta.goodDogs})');observations.update(data)
        assert data['bridge']['canonicalImported'] is True,'Invalid fixture: native Good Dogs did not finish canonically'
        n.wait_for_timeout(1200);actual=snap(n);observations['milestones']=actual['milestones']
        assert actual['milestones']['returned'] is True,'Native Good Dogs completed, but See World still reports returned=false'
    run('04-native-good-dogs-source-persistence',good_dogs)
    def snapshots():
        c,n=boot(browser);advance(n,'act_4',False);v=see(c,'felicia');v.locator('[data-choice="capture-baseline"]').click()
        n.evaluate('''async()=>{const x=JSON.parse(localStorage.getItem('techops:linked:native:v1'));x.sequence='damaged';localStorage.setItem('techops:linked:native:v1',JSON.stringify(x));save();await TechOpsLinked.publish();}''')
        n.wait_for_timeout(1000);observations['snapshot']=n.evaluate('JSON.parse(localStorage.getItem("techops:linked:native:v1"))')
        assert isinstance(observations['snapshot']['sequence'],int),'Disposable source snapshot never recovers after a valid native save'
        expect(v.locator('#scene-title')).to_have_text('The missing interval')
    run('05-damaged-source-snapshot-recovery',snapshots)
    def storage_unavailable():
        c=context(browser);v=page(c,'blocked-storage');v.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage unavailable','SecurityError')}})")
        v.goto(URL);v.wait_for_timeout(400);text=v.locator('#content').inner_text();observations['content']=text
        assert len(text.strip())>40,'Storage denial leaves a blank linked page instead of recovery instructions'
    run('06-denied-storage-readable-fallback',storage_unavailable)
    def addon_missing():
        c,n=boot(browser);advance(n,'act_4',False);state=c.storage_state();other=context(browser,storage_state=state)
        other.route('**/see-world/linked.mjs',lambda r:r.abort());v=page(other,'native-without-addon');v.goto(NATIVE,wait_until='domcontentloaded')
        v.wait_for_function('window.__productionTitleReadiness?.ready===true',timeout=30000);v.locator('#btn-continue').click();v.wait_for_function('!!window.S')
        result=v.evaluate('({ok:save(),error:window.__techopsSaveError,addonError:window.__seeWorldLinkedLoadError})');observations.update(result)
        assert result['ok'] is True,'Optional companion import failure disables saving the main game'
    run('07-companion-unavailable-native-save',addon_missing)
    def writes_denied():
        c,n=boot(browser);advance(n,'act_3',False);v=page(c,'quota');v.add_init_script("const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('techops:linked:story:'))throw new DOMException('Quota test','QuotaExceededError');return original.call(this,k,v)}")
        v.goto(URL+'#felicia');v.locator('[data-choice="capture-baseline"]').click()
        expect(v.locator('#storage-status')).to_contain_text('Quota');expect(v.locator('#scene-title')).to_have_text('An answer, not a command')
        assert v.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('techops:linked:story:')).length")==0
    run('08-failed-choice-save-atomicity',writes_denied)
    def no_locks():
        c,n=boot(browser);advance(n,'act_3',False);v=page(c,'no-locks');v.add_init_script("Object.defineProperty(navigator,'locks',{value:undefined})");v.goto(URL+'#felicia');v.locator('[data-choice="capture-baseline"]').click()
        expect(v.locator('#storage-status')).to_contain_text('Web Locks');expect(v.locator('#scene-title')).to_have_text('An answer, not a command')
    run('09-missing-locks-no-unearned-write',no_locks)
    def corrupt_progress():
        c,n=boot(browser);s=advance(n,'act_4',False);key='techops:linked:story:v1:'+s['profileId']+':'+s['runId'];n.evaluate('(key)=>localStorage.setItem(key,"{bad")',key)
        v=see(c,'felicia');assert v.evaluate('(key)=>localStorage.getItem(key)',key)=='{bad';assert v.locator('button[data-choice]').count()==0;expect(v.locator('#storage-status')).not_to_be_empty()
    run('10-corrupt-story-preserved',corrupt_progress)
    def scroll_retained():
        c,n=boot(browser);advance(n,'act_4',False);v=see(c,'felicia');v.set_viewport_size({'width':390,'height':600});v.evaluate('scrollTo(0,450)');assert v.evaluate('scrollY')>300
        n.evaluate('async()=>{save();await TechOpsLinked.publish()}');v.wait_for_timeout(1100);observations['scrollY']=v.evaluate('scrollY')
        assert observations['scrollY']>300,'Unchanged story milestone update resets reading position to page top'
    run('11-native-autosave-reading-position',scroll_retained)
    def invalid_receipt():
        c,n=boot(browser);v,d=earn(c,n,'signal-check');s=snap(n);key='techops:linked:night:v1:'+s['profileId']+':'+s['runId']
        n.evaluate('''({key,s})=>localStorage.setItem(key,JSON.stringify({contract:'see-world-linked/1',profileId:s.profileId,runId:s.runId,sequence:1,completed:{'signal-check':{damaged:true}}}))''',{'key':key,'s':s})
        n.locator('#see-world-linked-button').click();text=n.locator('#see-world-native-journal').inner_text();observations['journal']=text
        assert 'Completed: Signal / Independent Check' not in text,'Malformed completion receipt is displayed as a completed operation'
    run('12-malformed-native-receipt-not-completion',invalid_receipt)
    def preview_import():
        c,n=boot(browser);advance(n,'act_3',False);v=see(c,'felicia');v.locator('#import').set_input_files({'name':'old.json','mimeType':'application/json','buffer':b'{"schema":1,"revision":"2026-11-07-a","runs":{}}'});expect(v.locator('#storage-status')).to_contain_text('unlinked preview');expect(v.locator('#scene-title')).to_have_text('An answer, not a command')
    run('13-preview-import-isolation',preview_import)
    def stale_tabs():
        c,n=boot(browser);old=snap(n)['runId'];advance(n,'act_3',False);other=page(c,'continued');other.goto(NATIVE,wait_until='domcontentloaded');other.wait_for_function('window.TechOpsLinked&&window.__productionTitleReadiness?.ready',timeout=30000);other.locator('#btn-continue').click();assert snap(other)['runId']==old
        before=other.evaluate('localStorage.getItem("techops_save")');assert n.evaluate('save()') is False;assert other.evaluate('localStorage.getItem("techops_save")')==before
        assert n.evaluate('async()=>{try{await TechOpsLinked.bindExisting();return false}catch{return true}}') is True
    run('14-stale-native-writer-isolation',stale_tabs)
    def mid_operation():
        c,n=boot(browser);v,d=earn(c,n,'return-route');night(n);begin(n,d);travel(n,0);n.get_by_role('button',name=d['steps'][0][1],exact=True).click();assert n.evaluate('TechOpsLinked.mission().step')==1
        n.reload(wait_until='domcontentloaded');n.wait_for_function('window.TechOpsLinked&&window.__productionTitleReadiness?.ready',timeout=30000);n.locator('#btn-continue').click();s=snap(n)
        assert n.evaluate('TechOpsLinked.mission()') is None
        key='techops:linked:night:v1:'+s['profileId']+':'+s['runId'];assert n.evaluate('(key)=>localStorage.getItem(key)',key) is None
        v.reload();expect(v.get_by_role('heading',name='Waldo / The Return Path',exact=True)).to_be_visible()
    run('15-unfinished-operation-not-completed-on-reload',mid_operation)
    def mobile():
        c,n=boot(browser);advance(n,'act_3',False);v=see(c)
        for width,height in [(320,568),(390,844),(844,390),(768,1024)]:
            v.set_viewport_size({'width':width,'height':height});v.reload();assert v.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'hub overflow {width}'
            v.get_by_role('button',name='Continue this perspective',exact=True).click();assert v.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'story overflow {width}'
            for b in v.locator('button[data-choice]').all():assert b.bounding_box()['height']>=44
            v.goto(URL)
        v.set_viewport_size({'width':390,'height':844});v.screenshot(path=str(OUT/'mobile-hub.png'),full_page=True)
    run('16-responsive-hub-and-choices',mobile)
    def legacy_link():
        c,n=boot(browser);advance(n,'act_4',False);stored=c.storage_state()
        for origin in stored['origins']:
            clean=[]
            for item in origin['localStorage']:
                if item['name'].startswith('techops:linked:'):continue
                if item['name'] in ['techops_save','techops_save_bak','techops_hero_campaign_v1','techops_day_checkpoint_v1']:
                    try:
                        data=json.loads(item['value']);data.pop('seeWorldLink',None)
                        if isinstance(data.get('meta'),dict):data['meta'].pop('seeWorldLink',None)
                        if isinstance(data.get('state'),dict):data['state'].get('meta',{}).pop('seeWorldLink',None)
                        item={**item,'value':json.dumps(data)}
                    except Exception:pass
                clean.append(item)
            origin['localStorage']=clean
        other=context(browser,storage_state=stored);v=page(other,'legacy');v.goto(NATIVE,wait_until='domcontentloaded');v.wait_for_function('window.TechOpsLinked&&window.__productionTitleReadiness?.ready',timeout=30000);v.locator('#btn-continue').click();v.locator('#see-world-linked-button').click();v.get_by_role('button',name='Link this loaded main-story run',exact=True).click();assert snap(v)['milestones']['alliance'] is True
    run('17-explicit-legacy-adoption',legacy_link)
    REPORT['summary']={'passed':sum(r['status']=='PASS' for r in REPORT['results']),'failed':sum(r['status']=='FAIL' for r in REPORT['results'])}
    (OUT/'deep-receipt.json').write_text(json.dumps(REPORT,indent=2));print(json.dumps(REPORT['summary']),flush=True);browser.close()
raise SystemExit(1 if REPORT['summary']['failed'] else 0)
