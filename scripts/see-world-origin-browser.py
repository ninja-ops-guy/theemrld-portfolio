"""Disposable browser: production-origin routing with candidate files, not live deployment."""
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect
import json, mimetypes
P=Path(__file__).resolve().parents[1]
N=P.parent/'native'
OUT=P.parent/'origin-proof';OUT.mkdir(exist_ok=True)
report={'passed':[],'scope':'Isolated candidate responses at production hostname URLs; not a live deployment check.'}
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True)
 c=b.new_context(viewport={'width':390,'height':844})
 def serve(route):
  u=urlsplit(route.request.url)
  if route.request.method not in ['GET','HEAD']:route.abort();return
  if u.netloc=='ninja-ops-guy.github.io' and u.path.startswith('/theemrld-portfolio/'):
   route.fulfill(status=301,headers={'Location':'https://kterminal.site/'+u.path[len('/theemrld-portfolio/'):]+('?' + u.query if u.query else '')});return
  if u.netloc=='kterminal.site':root=P/'dist';relative=u.path.lstrip('/')
  elif u.netloc=='ninja-ops-guy.github.io' and u.path.startswith('/techops-hero/'):root=N;relative=u.path[len('/techops-hero/'):]
  else:route.abort();return
  f=(root/(relative or 'index.html')).resolve()
  if f.is_dir():f=f/'index.html'
  if not f.is_relative_to(root.resolve()) or not f.is_file():route.fulfill(status=404,body='fixture missing');return
  route.fulfill(path=str(f),content_type='text/javascript' if f.suffix=='.mjs' else mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
 c.route('**/*',serve)
 page=c.new_page();page.goto('https://kterminal.site/see-world/index.html')
 raw='{"sequence":7,"recovery-test":"do not merge"}'
 key='techops:linked:story:v1:local-primary:origin-recovery-test'
 page.evaluate('([key,value])=>localStorage.setItem(key,value)',[key,raw])
 page.reload();expect(page.get_by_role('link',name='Open connected See World',exact=True)).to_be_visible()
 assert page.evaluate('Object.keys(localStorage).length')==1
 page.get_by_role('link',name='Open connected See World',exact=True).click()
 page.wait_for_url('https://ninja-ops-guy.github.io/techops-hero/see-world/index.html')
 reader_origin=page.evaluate('location.origin')
 expect(page.locator('.journey-strip')).to_be_visible()
 assert page.get_by_role('button',name='Locked in this playthrough',exact=True).count()==4
 assert page.evaluate('Object.keys(localStorage).length')==0
 report['passed'].append('Origin choice opens top-level native reader without copying orphaned custom storage')
 page.goto('https://kterminal.site/see-world/index.html')
 assert page.evaluate('key=>localStorage.getItem(key)',key)==raw
 page.get_by_role('button',name='Open this domain’s existing reader',exact=True).click()
 expect(page.locator('.journey-strip')).to_be_visible()
 assert page.evaluate('key=>localStorage.getItem(key)',key)==raw
 report['passed'].append('Explicit old-reader access leaves orphaned custom-domain bytes unchanged')
 page.goto('https://ninja-ops-guy.github.io/theemrld-portfolio/see-world/index.html')
 expect(page.get_by_role('link',name='Open connected See World',exact=True)).to_be_visible()
 page.goto('https://kterminal.site/techops-hero/')
 page.wait_for_url('https://ninja-ops-guy.github.io/techops-hero/')
 expect(page.locator('#btn-start')).to_be_enabled(timeout=120000)
 assert page.evaluate('location.origin')==reader_origin=='https://ninja-ops-guy.github.io'
 assert page.evaluate("localStorage.getItem('techops_save')")==None
 report['passed'].append('Old story bookmark offers choice; custom shortcut reaches same-origin ready game without primary save')
 page.goto('https://ninja-ops-guy.github.io/techops-hero/see-world/index.html')
 expect(page.locator('.journey-strip')).to_be_visible()
 page.get_by_role('button',name='Explore 3D',exact=True).click()
 page.wait_for_url('https://kterminal.site/#/k/gallery')
 report['passed'].append('Gallery leaves reader via top-level canonical route, not cross-origin iframe')
 b.close()
(OUT/'origin-routing.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
