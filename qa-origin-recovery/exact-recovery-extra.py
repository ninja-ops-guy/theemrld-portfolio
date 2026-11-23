    def saved_reader():
        c,n=boot(browser);advance(n,'act_3',False);n.evaluate('S.paused=true');n.wait_for_timeout(800);s=snap(n)
        v=see(c,'felicia');v.locator('[data-choice="capture-baseline"]').click()
        expect(v.locator('#scene-title')).to_have_text('The missing interval')
        key='techops:linked:story:v1:'+s['profileId']+':'+s['runId']
        raw=v.evaluate('(key)=>localStorage.getItem(key)',key);assert raw is not None;json.loads(raw)
        return c,n,v,key,raw

    def rejected_existing_write():
        c,n,v,key,prior=saved_reader();event('fault-install',fault='quota-on-existing-story',key=key)
        v.evaluate('''key=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,value){if(k===key)throw new DOMException('Quota existing-save test','QuotaExceededError');return originalSetItem.call(this,k,value)}}''',key)
        v.locator('[data-choice="independent-clock"]').click()
        expect(v.locator('#storage-status')).to_contain_text('Quota')
        expect(v.locator('#scene-title')).to_have_text('The missing interval')
        assert v.evaluate('(key)=>localStorage.getItem(key)',key)==prior
        event('rejected-write-verified',priorReadable=True,successReported=False)
        v.reload();expect(v.locator('#scene-title')).to_have_text('The missing interval')
        assert v.evaluate('(key)=>localStorage.getItem(key)',key)==prior
        v.locator('[data-choice="independent-clock"]').click()
        v.wait_for_function('(key)=>JSON.parse(localStorage.getItem(key)).sequence>'+str(json.loads(prior)['sequence']),arg=key)
        after=v.evaluate('(key)=>localStorage.getItem(key)',key);json.loads(after);assert after!=prior
        v.reload();assert v.evaluate('(key)=>localStorage.getItem(key)',key)==after
        observations.update(priorReadable=True,rejectionReported=True,noFalseSuccess=True,reloadRecovered=True)
    run('23-rejected-existing-write-preserves-prior-and-reloads',rejected_existing_write)

    def interrupted_existing_write():
        c,n,v,key,prior=saved_reader()
        lock=v.evaluate("async()=> (await import('./linked.mjs')).LOCK");assert lock=='techops-linked-write-v1'
        reader_client=v.evaluate("async()=>navigator.locks.request('qa-reader-client',async()=>{const q=await navigator.locks.query();return q.held.find(x=>x.name==='qa-reader-client').clientId})")
        before_ui={'status':v.locator('#storage-status').inner_text(),'announcement':v.locator('#announcement').inner_text()}
        n.evaluate('''()=>{window.testLockHeld=false;navigator.locks.request('techops-linked-write-v1',()=>new Promise(resolve=>{window.releaseTestLock=resolve;window.testLockHeld=true}));}''')
        n.wait_for_function('window.testLockHeld===true');event('fault-install',fault='held-write-lock-then-tab-close')
        v.locator('[data-choice="independent-clock"]').click()
        v.wait_for_function('''async id=>{const q=await navigator.locks.query();return q.pending.some(x=>x.name==='techops-linked-write-v1'&&x.clientId===id)}''',arg=reader_client)
        observations['pendingLocks']=v.evaluate('async()=>await navigator.locks.query()')
        expect(v.locator('#scene-title')).to_have_text('The missing interval')
        assert v.locator('#storage-status').inner_text()==before_ui['status']
        assert v.locator('#announcement').inner_text()==before_ui['announcement']
        assert v.evaluate('(key)=>localStorage.getItem(key)',key)==prior
        event('intentional-interruption',target='reader-tab',beforeCommit=True);v.close()
        n.evaluate('releaseTestLock()');n.wait_for_timeout(200)
        assert n.evaluate('(key)=>localStorage.getItem(key)',key)==prior
        restored=see(c,'felicia');expect(restored.locator('#scene-title')).to_have_text('The missing interval')
        assert restored.evaluate('(key)=>localStorage.getItem(key)',key)==prior
        restored.locator('[data-choice="independent-clock"]').click()
        restored.wait_for_function('(key)=>JSON.parse(localStorage.getItem(key)).sequence>'+str(json.loads(prior)['sequence']),arg=key)
        saved=restored.evaluate('(key)=>localStorage.getItem(key)',key);json.loads(saved);assert saved!=prior
        restored.reload();assert restored.evaluate('(key)=>localStorage.getItem(key)',key)==saved
        observations.update(priorReadable=True,interruptedBeforeCommit=True,noFalseSuccess=True,reloadRecovered=True)
    run('24-interrupted-existing-write-preserves-prior-and-reloads',interrupted_existing_write)
