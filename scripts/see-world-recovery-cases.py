    def outage_ownership_recovery():
        c,n=boot(browser);advance(n,'act_4',False);run_id=snap(n)['runId']
        c.route('**/see-world/linked.mjs',lambda r:r.abort())
        offline=page(c,'native-companion-offline');offline.goto(NATIVE,wait_until='domcontentloaded')
        offline.wait_for_function('window.TechOpsLinkedSaveCore&&window.__productionTitleReadiness?.ready',timeout=30000)
        offline.locator('#btn-continue').click();offline.wait_for_function('TechOpsLinkedSaveCore.selectedRun()')
        assert offline.evaluate('window.TechOpsLinked===undefined')
        assert offline.evaluate('save()') is True
        assert n.evaluate('save()') is False
        assert offline.evaluate('TechOpsCampaign.save(TechOpsCampaign.load(localStorage),localStorage)') is True
        offline.reload(wait_until='domcontentloaded');offline.wait_for_function('window.TechOpsLinkedSaveCore&&window.__productionTitleReadiness?.ready',timeout=30000)
        offline.locator('#btn-continue').click();offline.wait_for_function('TechOpsLinkedSaveCore.selectedRun()')
        assert offline.evaluate('save()') is True
        assert offline.evaluate('S.meta.seeWorldLink.runId')==run_id
        c.unroute('**/see-world/linked.mjs');offline.reload(wait_until='domcontentloaded')
        offline.wait_for_function('window.TechOpsLinked&&window.__productionTitleReadiness?.ready',timeout=30000)
        offline.locator('#btn-continue').click();assert snap(offline)['runId']==run_id
        observations['preservedRun']=run_id
    run('18-companion-outage-ownership-reload-recovery',outage_ownership_recovery)

    def receipt_repair():
        c,n=boot(browser);v,d=earn(c,n,'signal-check');s=snap(n);key='techops:linked:night:v1:'+s['profileId']+':'+s['runId']
        raw=json.dumps({'contract':'see-world-linked/1','profileId':s['profileId'],'runId':s['runId'],'sequence':1,'completed':{'signal-check':{'damaged':True}}})
        n.evaluate('({key,raw})=>localStorage.setItem(key,raw)',{'key':key,'raw':raw})
        n.locator('#see-world-linked-button').click();expect(n.get_by_role('button',name='Enter: '+d['title'],exact=True)).to_be_visible()
        n.get_by_role('button',name='Close journal',exact=True).click();night(n);begin(n,d)
        for i,step in enumerate(d['steps']):travel(n,i);n.get_by_role('button',name=step[1],exact=True).click()
        expect(n.get_by_role('heading',name='SECTION COMPLETE',exact=True)).to_be_visible()
        assert n.evaluate('(key)=>localStorage.getItem(key+":recovery")',key)==raw
        receipt=n.evaluate('(key)=>JSON.parse(localStorage.getItem(key)).completed["signal-check"]',key)
        assert receipt['version']==2 and receipt['sectionId']=='signal-check' and receipt['runId']==s['runId']
        assert len(receipt['sourceHistory'])>0 and len(receipt['answers'])==3
        v.reload();expect(v.get_by_text('Completed in Night Walker.',exact=True)).to_be_visible()
        n.get_by_role('button',name='Return to Night Walker',exact=True).click();n.locator('#see-world-linked-button').click()
        expect(n.get_by_role('button',name='Completed: '+d['title'],exact=True)).to_be_visible()
        observations['receipt']=receipt
    run('19-invalid-receipt-real-recompletion-preserves-evidence',receipt_repair)

    def reader_details_focus():
        c,n=boot(browser);advance(n,'act_4',False);v=see(c,'felicia');v.set_viewport_size({'width':390,'height':600})
        v.evaluate('''()=>{document.querySelector('.journal').open=true;document.querySelector('.journal summary').focus({preventScroll:true});scrollTo(0,450);window.readerNode=document.querySelector('#scene-title');window.lockHeld=false;navigator.locks.request('techops-linked-write-v1',()=>new Promise(r=>{window.releaseReaderLock=r;window.lockHeld=true}));}''')
        v.wait_for_function('window.lockHeld===true');n.evaluate('save()');v.wait_for_timeout(150)
        v.evaluate('releaseReaderLock()');snap(n);v.wait_for_timeout(100)
        data=v.evaluate('({y:scrollY,open:document.querySelector(".journal").open,focus:document.activeElement===document.querySelector(".journal summary"),sameNode:readerNode===document.querySelector("#scene-title")})')
        assert data['y']>300 and data['open'] and data['focus'] and data['sameNode'],data
        observations.update(data)
    run('20-delayed-publication-preserves-reader-dom-and-focus',reader_details_focus)

    def corrupt_cache_rebuild():
        c,n=boot(browser);v,d=earn(c,n,'signal-check');s=snap(n)
        key='techops:linked:story:v1:'+s['profileId']+':'+s['runId'];history=n.evaluate('(k)=>localStorage.getItem(k)',key)
        n.evaluate('''async()=>{localStorage.setItem('techops:linked:native:v1','{bad');save();await TechOpsLinked.publish();}''')
        assert snap(n)['milestones']['alliance'] is True
        assert n.evaluate('localStorage.getItem("techops:linked:native:v1:recovery")')=='{bad'
        assert n.evaluate('(k)=>localStorage.getItem(k)',key)==history
        expect(v.get_by_role('heading',name=d['title'],exact=True)).to_be_visible()
    run('21-invalid-json-cache-rebuild-preserves-earned-history',corrupt_cache_rebuild)

    def storage_retry():
        c=context(browser);v=page(c,'storage-retry')
        v.add_init_script("window.backingStore=localStorage;Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Blocked','SecurityError')}})")
        v.goto(URL);expect(v.get_by_role('button',name='Try storage again',exact=True)).to_be_visible()
        expect(v.locator('#export')).to_be_disabled();expect(v.locator('#import')).to_be_disabled()
        assert v.get_by_role('link',name='Open TechOps Hero ↗',exact=True).count()==1
        v.evaluate("Object.defineProperty(window,'localStorage',{configurable:true,get(){return backingStore}})")
        v.get_by_role('button',name='Try storage again',exact=True).click()
        expect(v.get_by_role('button',name='Locked in this playthrough',exact=True)).to_have_count(4)
        assert v.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('techops:linked:')).length")==0
        v.screenshot(path=str(OUT/'storage-recovery.png'),full_page=True)
    run('22-storage-retry-keeps-public-navigation-no-false-progress',storage_retry)
