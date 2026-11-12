import SiteInfoLinks from '../components/SiteInfoLinks';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import source from '../data/comic-current-editions.json';
import displayLabels from '../data/comic-display-labels.json';
import ComicMusicBar from '../components/ComicMusicBar';
import './TechOpsComic.css';
import './LatestComicReader.css';

type Hotspot = { page: number; rect: number[] };
type Book = { id: string; label: string; title: string; pageCount: number; revision: string; pdfUrl: string; imageBase: string; width: number; height: number; sections: {start:number; end:number; label:string; title:string; kind:string}[]; scenes: {page:number; title:string}[]; links: Record<string, Hotspot[]> };
// Editorial revision IDs remain stable for bookmarks, hashes and soundtrack bindings.
// Reader-facing names are independent of those internal production identifiers.
const books = Object.fromEntries(Object.entries(source.books).map(([id, book]) => [id, {
  ...book, ...displayLabels[id as keyof typeof displayLabels],
}])) as Record<string, Book>;
const editionOrder = ['g', 'xiii-r', 'xiv'];
const base = import.meta.env.BASE_URL + 'techops-comic/';
const imageUrl = (book: Book, page: number) => `${book.imageBase}${String(page).padStart(3, '0')}.webp`;
function validPage(value: string | null, total: number) { const n=Number(value); return Number.isInteger(n) && n>=1 && n<=total ? n : 0; }
function bookmark(book: Book) { try { return validPage(localStorage.getItem(`techops-hero:${book.id}:${book.revision}:page`),book.pageCount); } catch { return 0; } }

export default function LatestComicReader() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('edition') ?? 'g';
  const id = editionOrder.includes(requested) ? requested : 'g';
  const book = books[id];
  const page = validPage(params.get('page'), book.pageCount);
  const fromWorld = params.get('from') === 'world';
  const section = book.sections.find(s => page>=s.start && page<=s.end) ?? book.sections[0];
  const saved = bookmark(book);
  const [zoom, setZoom] = useState(false);
  const [failure, setFailure] = useState('');
  const [retry, setRetry] = useState(0);
  const [intro, setIntro] = useState(() => !page && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const swipe = useRef<{x:number;y:number}|null>(null);
  const key = `${id}-${page}`;
  const describe = (n:number) => { const s=book.sections.find(s=>n>=s.start && n<=s.end); return `${s?.label ?? book.label} · ${s?.title ?? book.title}`; };
  const go = useCallback((target:number, edition=id) => {
    setIntro(false); setFailure(''); setRetry(0);
    const q = new URLSearchParams({edition});
    if (fromWorld) q.set('from','world');
    if (target) q.set('page',String(target));
    setParams(q,{replace:page>0 && target>0 && edition===id});
  },[fromWorld,id,page,setParams]);
  useEffect(() => {
    if (!intro || page || !dialog.current) return;
    dialog.current.showModal();
    const handle=setTimeout(()=>setIntro(false),8000);
    return ()=>{ clearTimeout(handle); dialog.current?.close(); };
  },[intro,page]);
  useEffect(() => {
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    const stop=()=>{if(motion.matches)setIntro(false);}; motion.addEventListener('change',stop);
    return ()=>motion.removeEventListener('change',stop);
  },[]);
  useEffect(() => {
    const previous=document.title; document.title=page?`Page ${page} · ${book.label} · TechOps Hero`:'TechOps Hero · Full collection';
    return ()=>{document.title=previous;};
  },[book.label,page]);
  useEffect(() => {
    setZoom(false); stage.current?.scrollTo(0,0);
    if (!page) return;
    try {localStorage.setItem(`techops-hero:${book.id}:${book.revision}:page`,String(page));} catch { /* Optional in private browsing. */ }
    if (page<book.pageCount) new Image().src=imageUrl(book,page+1);
    const onKey=(e:KeyboardEvent)=>{
      if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||(e.target instanceof HTMLElement && e.target.closest('input,select,textarea,button,[contenteditable=true]')))return;
      if(e.key==='ArrowLeft' && page>1){e.preventDefault();go(page-1);}
      if(e.key==='ArrowRight' && page<book.pageCount){e.preventDefault();go(page+1);}
    };
    window.addEventListener('keydown',onKey);return ()=>window.removeEventListener('keydown',onKey);
  },[book,page,go]);
  const next=editionOrder[editionOrder.indexOf(id)+1];
  return <main className={'comic-shell comic-current '+(page?'comic-reading':'')}>
    {intro && !page && <dialog ref={dialog} className="comic-reel" aria-label="Tech Ops Hero introduction" onCancel={()=>setIntro(false)}>
      <div className="comic-reel-film" aria-hidden="true" style={{'--panel-sheet':`url("${base}intro-panels-hq.webp")`} as CSSProperties} onAnimationEnd={e=>{if(e.animationName==='comic-reel-out')setIntro(false);}}>
        <div className="comic-reel-gate"><img className="comic-panel-sheet" src={`${base}intro-panels-hq.webp`} alt="" fetchPriority="high" onLoad={e=>e.currentTarget.dataset.ready='true'} onError={()=>setIntro(false)}/></div>
        <div className="comic-reel-mask"><span>TECH OPS</span><span>HERO</span></div>
      </div><button className="comic-reel-toggle" onClick={()=>setIntro(false)}>Skip intro</button>
    </dialog>}
    <header className="comic-mast">
      <Link to={fromWorld?'/k/terminal':'/terminal'}><ArrowLeft size={16}/> K Terminal</Link>
      <SiteInfoLinks />
      <span className="comic-imprint">THE EMRLD <i>/</i> COMICS</span>
      <nav className="comic-downloads" aria-label="PDF downloads"><a className="comic-download" href={book.pdfUrl} target="_blank" rel="noopener noreferrer"><BookOpen size={16}/> {book.label} · Complete {book.pageCount}-page PDF</a></nav>
    </header>
    <ComicMusicBar edition={id} page={failure===key?0:page} revision={book.revision}/>
    {!page ? <>
      <section className="comic-hero" style={{'--dock':`url("${base}dock.webp")`} as CSSProperties}>
        <div className="comic-hero-art" aria-hidden="true"/>
        <button className="comic-reel-toggle" onClick={()=>setIntro(true)}>Replay intro</button>
        <div className="comic-hero-copy"><p className="comic-overline"><span/> THE FULL COLLECTION</p>
          <h1 aria-label="TECH OPS HERO">{['TECH OPS','HERO'].map((line,row)=><span className="comic-title-line" aria-hidden="true" key={line}>{[...line].map((c,i)=><b key={i} style={{'--i':row*7+i} as CSSProperties}>{c===' '?'\u00a0':c}</b>)}</span>)}</h1>
          <p className="comic-byline">By Mike Olivares</p><p className="comic-site-intro">TechOps Hero is an original comic by Mike Olivares about memory, belonging, and the people who keep one another going. Read the collection in order, or return to a saved page. The optional soundtrack connects the comic with music from @raikouno; you control when it plays.</p><div className="comic-actions"><button className="comic-primary" onClick={()=>go(saved>1?saved:1)}>{saved>1?`Resume · p. ${saved}`:`Read ${book.label}`} <ArrowRight size={18}/></button><span>{book.pageCount} pages <i>/</i> {book.title}</span></div>
        </div>
      </section>
      <section className="comic-library" aria-label="Comic library">
        <div className="comic-library-heading"><h2>The complete reading order</h2><span>VOLUMES I–XIV</span></div>
        <div className="comic-volumes comic-volumes-complete comic-current-books">{editionOrder.map(eid=>{
          const item=books[eid];return <article key={eid} className="comic-current-card"><button onClick={()=>go(1,eid)}>
            <img src={imageUrl(item,eid==='g'?3:1)} alt={`${item.label} cover`} width={item.width} height={item.height} loading="lazy"/>
            <div className="comic-vol-meta">{item.label}<span>{item.pageCount} PAGES</span></div><div className="comic-vol-title">{item.title}<ArrowRight size={18}/></div>
          </button><a className="comic-edition-link" href={item.pdfUrl} target="_blank" rel="noopener noreferrer">Complete PDF · {item.pageCount} pages</a></article>;
        })}</div>
        <h2 className="comic-current-chapters">{book.label} · Contents</h2>
        <div className="comic-current-toc">{book.scenes.map((scene,i)=><button key={`${scene.page}-${i}`} onClick={()=>go(scene.page)}><span>{scene.title}</span><small>p. {scene.page}</small></button>)}</div>
      </section>
    </> : <>
      <div className="comic-reader-head"><button onClick={()=>go(0)}><BookOpen size={17}/> Library</button><h1>Tech Ops Hero <span>/</span> <small>{section.label} · {section.title}</small></h1><button aria-pressed={zoom} onClick={()=>setZoom(!zoom)}>{zoom?<Minimize2 size={16}/>:<Maximize2 size={16}/>} {zoom?'Fit page':'Enlarge'}</button></div>
      <div className={'comic-stage'+(zoom?' is-enlarged':'')} ref={stage}
        onTouchStart={e=>{swipe.current=!zoom && e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;}}
        onTouchCancel={()=>{swipe.current=null;}}
        onTouchEnd={e=>{const start=swipe.current;swipe.current=null;if(!start||e.touches.length||!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-start.x;const dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)<55||Math.abs(dx)<1.6*Math.abs(dy))return;go(Math.min(book.pageCount,Math.max(1,page+(dx<0?1:-1))));}}>
        {failure===key?<div className="comic-current-error" role="alert"><p>This page could not load.</p><button onClick={()=>{setFailure('');setRetry(n=>n+1);}}>Retry page</button> <a href={book.pdfUrl}>Open the complete PDF</a></div>:<div className="comic-sheet">
          <img key={`${key}-${retry}`} className="comic-page-image" src={imageUrl(book,page)+(retry?`?retry=${retry}`:'')} alt={`Page ${page} of ${book.pageCount}. ${describe(page)}`} width={book.width} height={book.height} onError={()=>setFailure(key)} fetchPriority="high"/>
          {book.links[String(page)]?.map((link,i)=><button key={i} className="comic-hotspot" aria-label={`Read page ${link.page}: ${describe(link.page)}`} onClick={()=>go(link.page)} style={{left:`${link.rect[0]}%`,top:`${link.rect[1]}%`,width:`${link.rect[2]-link.rect[0]}%`,height:`${link.rect[3]-link.rect[1]}%`}}/>)}
        </div>}
      </div>
      <nav className="comic-controls" aria-label="Reader navigation">
        <button className="comic-turn" aria-label="Previous page" disabled={page===1} onClick={()=>go(page-1)}><ChevronLeft/></button>
        <label>Page <select aria-label="Jump to page" value={page} onChange={e=>go(Number(e.target.value))}>{Array.from({length:book.pageCount},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select> / {book.pageCount}</label>
        <button className="comic-turn" aria-label="Next page" disabled={page===book.pageCount} onClick={()=>go(page+1)}><ChevronRight/></button>
        <select aria-label="Jump to scene" className="comic-scenes" value="" onChange={e=>go(Number(e.target.value))}><option value="" disabled>Jump to scene</option>{book.scenes.map((scene,i)=><option key={`${scene.page}-${i}`} value={scene.page}>{scene.page} · {scene.title}</option>)}</select>
        <label className="comic-current-edition">Book <select aria-label="Choose book" value={id} onChange={e=>go(1,e.target.value)}>{editionOrder.map(eid=><option key={eid} value={eid}>{books[eid].label}</option>)}</select></label>
        <span className="sr-only" aria-live="polite">Page {page} of {book.pageCount}. {describe(page)}</span>
      </nav>
      {page===book.pageCount && next && <div className="comic-current-continue"><button className="comic-primary" onClick={()=>go(1,next)}>Continue with {books[next].label}<ArrowRight size={18}/></button></div>}
    </>}
  </main>;
}
