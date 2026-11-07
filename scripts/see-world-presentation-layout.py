from playwright.sync_api import sync_playwright
from pathlib import Path
import os,json
base=os.environ.get('PRESENTATION_BASE','http://127.0.0.1:8765').rstrip('/')
engine=os.environ.get('PRESENTATION_ENGINE','chromium')
out=Path(os.environ.get('PRESENTATION_OUTPUT','qa/presentation'));out.mkdir(parents=True,exist_ok=True)
result=[]
with sync_playwright() as pw:
    b=getattr(pw,engine).launch(headless=True)
    p=b.new_page()
    p.route('https://**/*',lambda r:r.abort())
    for route,label,selector in [('/theemrld-portfolio/#/links','media','.media-hub'),('/theemrld-portfolio/see-world/index.html','welcome','.journey-strip')]:
        for width in [320,390,1440]:
            p.set_viewport_size({'width':width,'height':1000});p.goto(base+route);p.locator(selector).wait_for();p.wait_for_timeout(150)
            stats=p.evaluate('''()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1}).map(e=>({tag:e.tagName,id:e.id,cls:e.className,text:e.textContent.slice(0,65),right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})).slice(0,35)})''')
            result.append({'page':label,'width':width,**stats});p.screenshot(path=str(out/f'{label}-{width}.png'),full_page=True)
    p.set_viewport_size({'width':390,'height':844});p.get_by_role('button',name='How to play',exact=True).click();p.screenshot(path=str(out/'help-390.png'),full_page=True)
    result.append({'page':'help','width':390,'scrollWidth':p.evaluate('document.documentElement.scrollWidth')})
    b.close()
(out/'layout-diagnostics.json').write_text(json.dumps(result,indent=2))
