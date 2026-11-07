"""Materialize hash-bound authored changes; create a commit object only.
No branch, main, deployment, release or settings are changed by this script.
Concurrent media-links changes at 7495af0 are preserved and reconciled explicitly.
"""
import base64,hashlib,json,lzma,os,pathlib,subprocess,urllib.request
P=pathlib.Path
repo=os.environ['GITHUB_REPOSITORY'];assert repo=='ninja-ops-guy/theemrld-portfolio'
raw=lzma.decompress(base64.b64decode(''.join(p.read_text().strip() for p in sorted(P('.candidate').glob('part-*.txt')))))
assert hashlib.sha256(raw).hexdigest()=='65155a67ac2572302fc61aaca68d9680b1bbb56ca96aeee16b2b2a353f96ba71','Recipe integrity mismatch'
data=json.loads(raw);assert set(data['changes'])==set(data['files']) and not data['assemble']
concurrent={'public/see-world/app.mjs':'2dc48bfe8ee1e7d967dddc1c44bf700ea8fd414eef616c831b8697a762a1c3da','public/see-world/index.html':'bb294387e1b5e8703dcb715db6dbaa99599c5f41d4c4cb68c09e95bef5c51662'}
for name,digest in concurrent.items():
    p=P(name);assert hashlib.sha256(p.read_bytes()).hexdigest()==digest,'Concurrent source changed: '+name
    s=p.read_text()
    if name.endswith('app.mjs'):s=s.replace("$('links-nav').onclick = () => navigate('links');\n",'')
    else:s=s.replace('<title>See World — Playable Campaign Preview</title>','<title>SEE WORLD — Four lives. Your choices.</title>').replace('TechOps Hero sync and Night Walker unlocks are pending. The numbered comic remains separate.','Branching game fiction. The numbered comic remains separate.').replace('<button id="links-nav">Media links</button>','')
    p.write_text(s)
for name,proof in data['files'].items():
    p=P(name);assert not p.is_absolute() and '..' not in p.parts and not name.startswith(('.git','.candidate'))
    assert (hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None)==proof['before'],f'Base mismatch: {name}'
for name,change in data['changes'].items():
    p=P(name);p.parent.mkdir(parents=True,exist_ok=True)
    if 'content' in change:text=change['content']
    else:
        lines=p.read_text().splitlines(keepends=True)
        for start,end,replacement in reversed(change['edits']):lines[start:end]=[replacement]
        text=''.join(lines)
    p.write_text(text)
for name,proof in data['files'].items():assert hashlib.sha256(P(name).read_bytes()).hexdigest()==proof['after'],f'Output mismatch: {name}'
p=P('public/see-world/app.mjs');p.write_text(p.read_text().replace("$('export').onclick", "$('links-nav').onclick = () => navigate('links');\n$('export').onclick",1))
p=P('public/see-world/index.html');p.write_text(p.read_text().replace('<button id="portfolio-nav">','<button id="links-nav">Media links</button><button id="portfolio-nav">').replace('<title>SEE WORLD — Four lives. Your choices.</title>','<title>See World — Linked Campaign Candidate</title>').replace('See World: four choice-driven TechOps Hero campaigns. Iona, Felicia, K and Waldo. Playable story draft.','See World: stories unlocked by your TechOps Hero journey. Linked progression candidate.'))
for name,digest in {'public/see-world/app.mjs':'69c9aaac7e892edb81ed16a44e5d53b4ce71b17f9031011a343c94fa1ea0d2b1','public/see-world/index.html':'37b8376a3546c6932f41bd6ec0d33a98d23180fb4e4a3c75142e6926573f0e5a'}.items():
    assert hashlib.sha256(P(name).read_bytes()).hexdigest()==digest,'Reconciliation output mismatch'
    data['files'][name].update(before=concurrent[name],after=digest)
for name in data['files']:
    if name.endswith(('.js','.mjs')):subprocess.run(['node','--check',name],check=True)
    if name.endswith('.py'):subprocess.run(['python','-m','py_compile',name],check=True)
def api(path,body):
    request=urllib.request.Request('https://api.github.com/repos/'+repo+'/'+path,data=json.dumps(body).encode(),headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},method='POST')
    with urllib.request.urlopen(request) as response:return json.load(response)
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();tree=subprocess.check_output(['git','rev-parse','HEAD^{tree}'],text=True).strip();entries=[]
for name in sorted(data['files']):
    blob=api('git/blobs',{'encoding':'base64','content':base64.b64encode(P(name).read_bytes()).decode()});entries.append({'path':name,'mode':'100644','type':'blob','sha':blob['sha']})
for name in subprocess.check_output(['git','ls-files','.candidate','.github/workflows/linked-candidate-prepare.yml'],text=True).splitlines():entries.append({'path':name,'mode':'100644','type':'blob','sha':None})
t=api('git/trees',{'base_tree':tree,'tree':entries});c=api('git/commits',{'message':'Implement linked See World chronology, guarded saves, timeline and reciprocal native sections','tree':t['sha'],'parents':[head]})
P('candidate-evidence').mkdir(exist_ok=True)
P('candidate-evidence/candidate.json').write_text(json.dumps({'status':'UNATTACHED_CANDIDATE_NOT_RELEASE_QUALIFIED','repository':repo,'parent':head,'commit':c['sha'],'tree':t['sha'],'recipe_sha256':hashlib.sha256(raw).hexdigest(),'files':data['files'],'verification':['all input and reconciled output SHA-256 values matched','concurrent media links fixes preserved','changed JavaScript and Python syntax checks passed'],'branch_mutated':False},indent=2))
print('Unattached candidate:',c['sha'])
