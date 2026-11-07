"""Paired native/See World UI + earned painting acceptance.
Main acts are fixture-assisted through native APIs. K choices and native memory
section are played via production UI. QA only positions the 3D camera; it cannot
award progression or bypass the painting gate. No real-device claim.
"""
from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import json, os, traceback
# Reuse the established real-native-page helpers without executing its suite.
helpers={}
code=Path(__file__).with_name('see-world-linked-browser.py').read_text().split('\nwith sync_playwright()')[0]
exec(compile(code,'see-world-linked-browser-helpers','exec'),helpers)
startup,seed_to,night,play_native,see_campaign,decisions=[helpers[k] for k in ['startup','seed_to','night','play_native','see_campaign','decisions']]
root=os.environ.get('LINKED_BASE_URL','http://127.0.0.1:8765').rstrip('/')
out=Path(os.environ.get('ASCENDED_QA_DIR','qa/ascended-k'));out.mkdir(parents=True,exist_ok=True)
url=root+'/theemrld-portfolio/k-world/index.html'
receipt={'status':'RUNNING','checks':[], 'page_errors':[],
 'scope':'Native main acts fixture-assisted; actual K choices, native k_anchor casebook and portal controls. 3D QA positions camera only. External audio and unrelated remote archive images blocked in this test.',
 'limitations':['Emulated Chromium desktop/touch, not physical devices or screen-reader qualification.','Geometric scene staging; scenic stairs are not a climbable level.','No combat-power, native ending, or numbered-comic canon award.']}
def done(s):receipt['checks'].append(s);print('PASS',s,flush=True)
def ready(page,suffix='?qa=1'):
 page.goto(url+suffix,wait_until='domcontentloaded');page.wait_for_function('window.__K_WORLD_QA__',timeout=60000)
def pose(page,position,yaw=0):
 page.evaluate('(p)=>{__K_WORLD_QA__.close();__K_WORLD_QA__.camera(p.position,p.yaw);}',{'position':position,'yaw':yaw});page.locator('#scene').focus();page.wait_for_timeout(150)
def state(page):return page.evaluate('__K_WORLD_QA__.state()')
def native_saves(page):return page.evaluate("[localStorage.getItem('techops_hero_campaign_v1'),localStorage.getItem('techops_save'),localStorage.getItem('theemrld:universe:source:v1')]")
def screenshot(page,name):page.screenshot(path=str(out/name),full_page=True)

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.environ.get('BROWSER_EXECUTABLE') or None,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1)
 context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(root) else r.abort())
 native=context.new_page();view=context.new_page();world=context.new_page()
 for page in [native,view,world]:page.on('pageerror',lambda e:receipt['page_errors'].append(str(e)))
 try:
  ready(world,'?qa=1#ascended');assert state(world)['activeId']=='gallery'
  world.evaluate('__K_WORLD_QA__.inspect(6)');expect(world.locator('#painting-enter')).to_be_disabled()
  assert world.locator('#art-image').evaluate('(i)=>i.complete&&i.naturalWidth===732&&i.naturalHeight===732')
  screenshot(world,'painting-locked.png')
  pose(world,[4.4,1.7,-15.5]);world.keyboard.down('w')
  try:world.wait_for_function("__K_WORLD_QA__.state().camera.position[2]<=-16.0",timeout=15000)
  finally:world.keyboard.up('w')
  assert state(world)['activeId']=='gallery'
  done('Fresh save: hash navigation, inspect action and physical crossing remain locked; original square archive artwork loaded')
  assert world.evaluate("__K_WORLD_QA__.rotateFrame('cathedral').after")=='cathedral'
  done('Painting remains pinned during look-away rotation')
  startup(native);seed_to(native,'act_7');night(native)
  see_campaign(view,'k');decisions(view,['mark-wall','test-anchor','answer-plain','give-space','free-oz','accept-water','cycle'])
  expect(view.locator('[data-choice="keep-log"]')).to_be_disabled()
  world.evaluate('__K_WORLD_QA__.inspect(6)');expect(world.locator('#painting-enter')).to_be_disabled()
  play_native(native,'What the mark can prove',['recorded a specific observed mark','separate columns','Keep the detailed record private'])
  view.bring_to_front();expect(view.locator('[data-choice="keep-log"]')).to_be_enabled();decisions(view,['keep-log'])
  expect(view.get_by_role('button',name='Visit the painting →')).to_be_visible()
  done('Real linked K decisions require native k_anchor completion before the ending and portal')
  # Separate world tab updates on the storage event without reloading it.
  world.bring_to_front();expect(world.locator('#painting-enter')).to_be_enabled(timeout=20000)
  before=native_saves(world);screenshot(world,'painting-unlocked.png')
  world.locator('#painting-enter').click();world.wait_for_function("__K_WORLD_QA__.state().activeId==='ascended'")
  world.evaluate('__K_WORLD_QA__.setView(false)');screenshot(world,'chamber-desktop.png')
  expect(world.locator('#painting-exit')).to_be_visible()
  pose(world,[2.6,1.7,-3.4]);expect(world.locator('#interact')).to_contain_text('ASCENDED K');world.locator('#interact').click()
  expect(world.locator('#ascended-dialog')).to_be_visible();world.get_by_role('button',name='What am I supposed to keep?').click()
  expect(world.locator('#ascended-line')).to_contain_text('A mark can be real');screenshot(world,'ascended-conversation.png')
  world.locator('#ascended-return').click();assert state(world)['activeId']=='gallery';assert state(world)['camera']['position']==[4.4,1.7,-13.4]
  assert native_saves(world)==before
  done('Enter, converse, exit: safe return and byte-unchanged native saves; no extra grants')
  pose(world,[4.4,1.7,-15.5]);world.keyboard.down('w')
  try:world.wait_for_function("__K_WORLD_QA__.state().activeId==='ascended'",timeout=15000)
  finally:world.keyboard.up('w')
  done('Physical forward movement through the painted aperture opens the chamber')
  world.reload();world.wait_for_function("window.__K_WORLD_QA__?.state().activeId==='ascended'")
  done('Earned entry survives reload without a fabricated completion switch')
  saved=context.storage_state();snapshot=world.evaluate('Object.fromEntries(Object.entries(localStorage))')
  # Isolated preview cannot inherit entry even when this browser has linked K completion.
  replay=context.new_page();ready(replay,'?qa=1&preview=1#ascended');assert state(replay)['activeId']=='gallery'
  replay.evaluate('__K_WORLD_QA__.inspect(6)');expect(replay.locator('#painting-enter')).to_be_disabled();replay.close()
  done('Preview context remains isolated even alongside completed native-linked progress')
  # Actual See World ending entry opens its existing persistent world frame.
  view.bring_to_front();view.get_by_role('button',name='Visit the painting →').click()
  frame=view.frame_locator('#world-stage iframe');expect(frame.locator('#room-title')).to_have_text('K // GALLERY',timeout=60000)
  expect(frame.get_by_role('button',name='EXPLORE QUIETLY')).to_be_visible(timeout=60000);frame.get_by_role('button',name='EXPLORE QUIETLY').click()
  done('K ending opens the existing gallery iframe, without a second music player')
  # Dedicated touch context uses copied test fixture bytes only; no product cloud-sync claim.
  mobile_context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True,reduced_motion='reduce',storage_state=saved)
  mobile_context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(root) else r.abort())
  mobile=mobile_context.new_page();mobile.on('pageerror',lambda e:receipt['page_errors'].append(str(e)));ready(mobile)
  mobile.evaluate('__K_WORLD_QA__.inspect(6)');expect(mobile.locator('#painting-enter')).to_be_enabled();mobile.locator('#painting-enter').tap()
  mobile.wait_for_function("__K_WORLD_QA__.state().activeId==='ascended'");mobile.evaluate('__K_WORLD_QA__.setView(false)')
  screenshot(mobile,'chamber-mobile.png')
  pose(mobile,[2.6,1.7,-3.4]);expect(mobile.locator('#interact')).to_contain_text('ASCENDED K');mobile.locator('#interact').tap()
  mobile.get_by_role('button',name='Can I come back?').tap();expect(mobile.locator('#ascended-line')).to_contain_text('The frame is still there')
  screenshot(mobile,'conversation-mobile.png');assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
  for selector in ['#ascended-choices button','#ascended-return']:
   for box in mobile.locator(selector).evaluate_all('(els)=>els.map(e=>{const r=e.getBoundingClientRect();return [r.width,r.height];})'):assert box[0]>=44 and box[1]>=44
  mobile.locator('#ascended-return').tap();assert state(mobile)['activeId']=='gallery';mobile_context.close()
  done('390px touch/reduced-motion: entry, conversation, return and 44px controls; no horizontal overflow')
  # Denied storage cannot retain an earned-room state after a cold load.
  blocked_context=browser.new_context();blocked_context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(root) else r.abort())
  blocked_context.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError')}})")
  blocked=blocked_context.new_page();blocked.on('pageerror',lambda e:receipt['page_errors'].append(str(e)));ready(blocked,'?qa=1#ascended');assert state(blocked)['activeId']=='gallery';blocked_context.close()
  done('Storage-restricted browser fails closed without a crash')
  # Actual native New Game; no direct mutation of an unlock boolean.
  startup(native);world.bring_to_front();world.wait_for_function("__K_WORLD_QA__.state().activeId==='gallery'",timeout=20000)
  world.evaluate('__K_WORLD_QA__.inspect(6)');expect(world.locator('#painting-enter')).to_be_disabled()
  done('Native New Game revokes old-run access and safely returns an open chamber to the gallery')
  assert not receipt['page_errors'],receipt['page_errors']
  receipt['status']='PASS'
 except Exception as e:
  receipt['status']='FAIL';receipt['error']=str(e);receipt['traceback']=traceback.format_exc()
  try:receipt['world_state']=state(world)
  except Exception:pass
  for label,page in [('native',native),('see',view),('world',world)]:
   try:screenshot(page,label+'-failure.png')
   except Exception:pass
 finally:
  (out/'receipt.json').write_text(json.dumps(receipt,indent=2));browser.close()
 if receipt['status']!='PASS':raise SystemExit(receipt['error'])
