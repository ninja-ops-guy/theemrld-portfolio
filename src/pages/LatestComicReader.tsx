import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import source from '../data/comic-current-editions.json';
import displayLabels from '../data/comic-display-labels.json';
import collection from '../data/comic-collection-serving.json';
import ComicMusicBar from '../components/ComicMusicBar';
import './TechOpsComic.css';
import './LatestComicReader.css';

type Hotspot = { page: number; rect: number[] };
type Section = { start: number; end: number; label: string; title: string; kind: string };
type Book = { id: string; label: string; title: string; pageCount: number; revision: string; pdfUrl: string; imageBase: string; mediaCommit?: string; publisherRelease?: string; width: number; height: number; pageDimensions?: Record<string, [number, number]>; sections: Section[]; scenes: {page:number; title:string}[]; links: Record<string, Hotspot[]> };
// Editorial revision IDs remain stable for bookmarks, hashes and soundtrack bindings.
// Reader-facing names are independent of those internal production identifiers.
const books = Object.fromEntries(Object.entries(source.books).map(([id, book]) => [id, {
  ...book, ...displayLabels[id as keyof typeof displayLabels],
}])) as Record<string, Book>;
const legacyEditions = ['g', 'xiii-r', 'xiv'];
const ixivReady = books.ixiv?.publisherRelease === 'ixiv-9b2f94974027';
const editionOrder = ixivReady ? ['ixiv', ...legacyEditions] : legacyEditions;
const defaultEdition = ixivReady ? 'ixiv' : 'g';
const base = import.meta.env.BASE_URL + 'techops-comic/';
// Page 29 of revised XIII uses the corrected Felicia/grandfather tea-table panel.
// Other pages remain pinned to their original immutable media releases.
const grandfatherArtFix = import.meta.env.BASE_URL + 'assets/comic/volume-xiii-029-grandfather.webp';
const imageUrl = (book: Book, page: number) => book.id === 'xiii-r' && page === 29
  ? grandfatherArtFix
  : `${book.imageBase}${String(page).padStart(3, '0')}.webp`;

function readingImageUrl(book: Book, page: number, section: Section) {
  const folder = collection.folders[section.label as keyof typeof collection.folders];
  if (book.id !== 'g' || !book.mediaCommit || !folder) return imageUrl(book, page);
  return `${import.meta.env.BASE_URL}${collection.directory}/${book.mediaCommit}/${folder}/${String(page).padStart(3, '0')}.webp`;
}
function validPage(value: string | null, total: number) { const n=Number(value); return Number.isInteger(n) && n>=1 && n<=total ? n : 0; }
function bookmark(book: Book) { try { return validPage(localStorage.getItem(`techops-hero:${book.id}:${book.revision}:page`),book.pageCount); } catch { return 0; } }

let advisorySeen = false;

export default function LatestComicReader() {
  const [ready, setReady] = useState(() => {
    try { return advisorySeen || sessionStorage.getItem('techops:comic-advisory:v1') === '1'; }
    catch { return advisorySeen; }
  });
  const warning = useRef<HTMLDialogElement>(null);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    if (ready || !warning.current) return;
    const node = warning.current;
    if (typeof node.showModal !== 'function') { setFallback(true); return; }
    try { node.showModal(); } catch { setFallback(true); }
    return () => { if (node.open) node.close(); };
  }, [ready]);
  function continueReading() {
    advisorySeen = true;
    try { sessionStorage.setItem('techops:comic-advisory:v1', '1'); } catch { /* In-memory fallback. */ }
    setReady(true);
  }
  if (!ready) {
    const content = <><h1 id="content-advisory-title">Parental advisory</h1>
      <p id="content-advisory-text">Contains violence, mature language, and mature themes.</p>
      <button type="button" autoFocus onClick={continueReading}>Continue to comic</button></>;
    return fallback
      ? <main id="content-advisory" aria-labelledby="content-advisory-title">{content}</main>
      : <dialog id="content-advisory" ref={warning} aria-labelledby="content-advisory-title"
          aria-describedby="content-advisory-text" onCancel={e=>e.preventDefault()}>{content}</dialog>;
  }
  return <ComicReader />;
}

function ComicReader() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('edition') ?? defaultEdition;
  const id = editionOrder.includes(requested) ? requested : defaultEdition;
  const book = books[id];
  const page = validPage(params.get('page'), book.pageCount);
  const nativePage = book.pageDimensions?.[String(page)];
  const [pageWidth, pageHeight] = nativePage ?? [book.width, book.height];
  const fromWorld = params.get('from') === 'world';
  const section = book.sections.find(s => page>=s.start && page<=s.end) ?? book.sections[0];
  const saved = bookmark(book);
  const [zoomedPage, setZoomedPage] = useState('');
  const [failure, setFailure] = useState('');
  const [readingImageFailure, setReadingImageFailure] = useState('');
  const [originalFailure, setOriginalFailure] = useState('');
  const [retry, setRetry] = useState(0);
  const volumeIntro = id === 'xiii-r';
  const [intro, setIntro] = useState(() => (!page || (volumeIntro && page === 1)) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const playedOnLanding = useRef(false);
  const showIntro = intro && (!page || (volumeIntro && page === 1));
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const swipe = useRef<{x:number;y:number}|null>(null);
  const key = `${id}-${page}`;
  const zoom = zoomedPage === key;
  const original = imageUrl(book, page);
  const readingImage = readingImageUrl(book, page, section);
  const hasReadingImage = readingImage !== original && readingImageFailure !== key;
  const showReadingImage = hasReadingImage && (!zoom || originalFailure === key);
  const volumes = id === 'g' || id === 'ixiv' ? book.sections.filter(s => s.kind === 'volume') : [];
  const describe = (n:number) => { const s=book.sections.find(s=>n>=s.start && n<=s.end); return `${s?.label ?? book.label} · ${s?.title ?? book.title}`; };
  const go = useCallback((target:number, edition=id) => {
    const openingFromLibrary = !page && target === 1 && edition === 'xiii-r' && !playedOnLanding.current;
    setIntro(openingFromLibrary && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    playedOnLanding.current = false;
    setFailure('');
    setReadingImageFailure('');
    setOriginalFailure('');
    setRetry(0);
    setZoomedPage('');
    const q = new URLSearchParams({edition});
    if (fromWorld) q.set('from','world');
    if (target) q.set('page',String(target));
    setParams(q,{replace:page>0 && target>0 && edition===id});
  },[fromWorld,id,page,setParams]);
  useEffect(() => {
    const modal = dialog.current;
    if (!showIntro || !modal) return;
    if (volumeIntro && !page) playedOnLanding.current = true;
    modal.showModal();
    const timer = volumeIntro ? undefined : window.setTimeout(() => setIntro(false), 8000);
    return () => {
      window.clearTimeout(timer);
      modal.close();
    };
  }, [showIntro, volumeIntro, page]);
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
    setZoomedPage('');
    stage.current?.scrollTo(0,0);
    if (!page || showIntro) return;
    const onKey=(e:KeyboardEvent)=>{
      if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||(e.target instanceof HTMLElement && e.target.closest('input,select,textarea,button,[contenteditable=true]')))return;
      if(e.key==='ArrowLeft' && page>1){e.preventDefault();go(page-1);}
      if(e.key==='ArrowRight' && page<book.pageCount){e.preventDefault();go(page+1);}
    };
    window.addEventListener('keydown',onKey);return ()=>window.removeEventListener('keydown',onKey);
  },[book,page,go,showIntro]);
  const onPageLoad = () => {
    try {
      localStorage.setItem(`techops-hero:${book.id}:${book.revision}:page`, String(page));
    } catch { /* Optional in private browsing. */ }
    if (zoom || page >= book.pageCount || (id === 'g' && (!showReadingImage || page >= section.end))) return;
    const prefetch = new Image();
    prefetch.fetchPriority = 'low';
    prefetch.src = readingImageUrl(book, page + 1, section);
  };
  const onPageError = () => {
    if (showReadingImage) setReadingImageFailure(key);
    else if (hasReadingImage) setOriginalFailure(key);
    else setFailure(key);
  };
  const retryPage = () => {
    setFailure('');
    setReadingImageFailure('');
    setOriginalFailure('');
    setRetry(attempt => attempt + 1);
  };
  const next=id === 'ixiv' ? undefined : legacyEditions[legacyEditions.indexOf(id)+1];
  return <main className={'comic-shell comic-current '+(page?'comic-reading':'')}>
    {showIntro && <dialog ref={dialog} className="comic-reel" aria-label={volumeIntro ? 'Volume XIII opening animation' : 'Tech Ops Hero introduction'} onCancel={()=>setIntro(false)}>
      {volumeIntro ? <video
        aria-label="Volume XIII opening animation"
        src={`${base}volume-xiii-opening.mp4`}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        autoPlay muted playsInline controls
        onEnded={() => setIntro(false)}
        onError={() => setIntro(false)}
      /> : <div className="comic-reel-film" aria-hidden="true" style={{'--panel-sheet':`url("${base}intro-panels-hq.webp")`} as CSSProperties} onAnimationEnd={e=>{if(e.animationName==='comic-reel-out')setIntro(false);}}>
        <div className="comic-reel-gate"><img className="comic-panel-sheet" src={`${base}intro-panels-hq.webp`} alt="" fetchPriority="high" onLoad={e=>e.currentTarget.dataset.ready='true'} onError={()=>setIntro(false)}/></div>
        <div className="comic-reel-mask"><span>TECH OPS</span><span>HERO</span></div>
      </div>}<button className="comic-reel-toggle" onClick={()=>setIntro(false)}>Skip intro</button>
    </dialog>}
    <header className="comic-mast">
      <Link to={fromWorld?'/k/terminal':'/terminal'}><ArrowLeft size={16}/> K Terminal</Link>
      <span className="comic-imprint">THE EMRLD <i>/</i> COMICS</span>
      <a href={`${import.meta.env.BASE_URL}privacy.html`}>Privacy</a>
      <nav className="comic-downloads" aria-label="PDF downloads"><a className="comic-download" href={book.pdfUrl} target="_blank" rel="noopener noreferrer"><BookOpen size={16}/> {book.label} · Complete {book.pageCount}-page PDF</a></nav>
    </header>
    <ComicMusicBar edition={id} page={failure===key || (volumeIntro && showIntro)?0:page} revision={book.revision}/>
    {!page ? <>
      <section className="comic-hero" style={{'--dock':`url("${base}dock.webp")`} as CSSProperties}>
        <div className="comic-hero-art" aria-hidden="true"/>
        <button className="comic-reel-toggle" onClick={()=>setIntro(true)}>Replay intro</button>
        <div className="comic-hero-copy"><p className="comic-overline"><span/> THE FULL COLLECTION</p>
          <h1 aria-label="TECH OPS HERO">{['TECH OPS','HERO'].map((line,row)=><span className="comic-title-line" aria-hidden="true" key={line}>{[...line].map((c,i)=><b key={i} style={{'--i':row*7+i} as CSSProperties}>{c===' '?'\u00a0':c}</b>)}</span>)}</h1>
          <p className="comic-byline">By Mike Olivares</p><div className="comic-actions"><button className="comic-primary" onClick={()=>go(saved>1?saved:1)}>{saved>1?`Resume · p. ${saved}`:`Read ${book.label}`} <ArrowRight size={18}/></button><span>{book.pageCount} pages <i>/</i> {book.title}</span></div>
        </div>
      </section>
      <section className="comic-library" aria-label="Comic library">
        <div className="comic-library-heading"><h2>The complete reading order</h2><span>VOLUMES I–XIV</span></div>
        <div className="comic-volumes comic-volumes-complete comic-current-books">{editionOrder.map(eid=>{
          const item = books[eid];
          const coverSection = item.sections.find(s => s.kind === 'volume') ?? item.sections[0];
          const cover = eid === 'g' ? coverSection.start : 1;
          const originalCover = imageUrl(item, cover);
          return <article key={eid} className="comic-current-card"><button onClick={()=>go(1,eid)}>
            <img src={readingImageUrl(item, cover, coverSection)} alt={`${item.label} cover`} width={item.width} height={item.height} loading="lazy"
              onError={eid === 'g' ? e => { if (e.currentTarget.src !== originalCover) e.currentTarget.src = originalCover; } : undefined}/>
            <div className="comic-vol-meta">{item.label}<span>{item.pageCount} PAGES</span></div><div className="comic-vol-title">{item.title}<ArrowRight size={18}/></div>
          </button><a className="comic-edition-link" href={item.pdfUrl} target="_blank" rel="noopener noreferrer">Complete PDF · {item.pageCount} pages</a></article>;
        })}</div>
        {volumes.length > 0 && <>
          <h2 className="comic-current-chapters">Choose a volume</h2>
          <div className="comic-current-toc">{volumes.map(volume => <button key={volume.start} onClick={() => go(volume.start)}>
            <span>{volume.label} · {volume.title}</span><small>p. {volume.start}</small>
          </button>)}</div>
        </>}
        <h2 className="comic-current-chapters">{book.label} · Contents</h2>
        <div className="comic-current-toc">{book.scenes.map((scene,i)=><button key={`${scene.page}-${i}`} onClick={()=>go(scene.page)}><span>{scene.title}</span><small>p. {scene.page}</small></button>)}</div>
      </section>
    </> : <>
      <div className="comic-reader-head"><button onClick={()=>go(0)}><BookOpen size={17}/> Library</button><h1>Tech Ops Hero <span>/</span> <small>{section.label} · {section.title}</small></h1><button aria-pressed={zoom} onClick={() => setZoomedPage(zoom ? '' : key)}>{zoom?<Minimize2 size={16}/>:<Maximize2 size={16}/>} {zoom?'Fit page':'Enlarge'}</button></div>
      <div className={'comic-stage'+(zoom?' is-enlarged':'')} ref={stage}
        onTouchStart={e=>{swipe.current=!zoom && e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;}}
        onTouchCancel={()=>{swipe.current=null;}}
        onTouchEnd={e=>{const start=swipe.current;swipe.current=null;if(!start||e.touches.length||!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-start.x;const dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)<55||Math.abs(dx)<1.6*Math.abs(dy))return;go(Math.min(book.pageCount,Math.max(1,page+(dx<0?1:-1))));}}>
        {failure===key?<div className="comic-current-error" role="alert"><p>This page could not load.</p><button onClick={retryPage}>Retry page</button> <a href={book.pdfUrl}>Open the complete PDF</a></div>:<div className="comic-sheet" data-native-page={nativePage ? 'true' : undefined} style={nativePage ? {'--native-page-ratio':pageWidth/pageHeight} as CSSProperties : undefined}>
          <img key={`${key}-${retry}`} className="comic-page-image"
            src={(showReadingImage ? readingImage : original) + (retry ? `?retry=${retry}` : '')}
            alt={`Page ${page} of ${book.pageCount}. ${describe(page)}`} width={pageWidth} height={pageHeight}
            onLoad={onPageLoad} onError={onPageError} fetchPriority="high"/>
          {book.links[String(page)]?.map((link,i)=><button key={i} className="comic-hotspot" aria-label={`Read page ${link.page}: ${describe(link.page)}`} onClick={()=>go(link.page)} style={{left:`${link.rect[0]}%`,top:`${link.rect[1]}%`,width:`${link.rect[2]-link.rect[0]}%`,height:`${link.rect[3]-link.rect[1]}%`}}/>)}
        </div>}
      </div>
      <nav className="comic-controls" aria-label="Reader navigation">
        <button className="comic-turn" aria-label="Previous page" disabled={page===1} onClick={()=>go(page-1)}><ChevronLeft/></button>
        <label>Page <select aria-label="Jump to page" value={page} onChange={e=>go(Number(e.target.value))}>{Array.from({length:book.pageCount},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select> / {book.pageCount}</label>
        <button className="comic-turn" aria-label="Next page" disabled={page===book.pageCount} onClick={()=>go(page+1)}><ChevronRight/></button>
        <select aria-label="Jump to scene" className="comic-scenes" value="" onChange={e=>go(Number(e.target.value))}><option value="" disabled>Jump to scene</option>{book.scenes.map((scene,i)=><option key={`${scene.page}-${i}`} value={scene.page}>{scene.page} · {scene.title}</option>)}</select>
        {volumes.length > 0 && <select aria-label="Jump to volume" value={section.kind === 'volume' ? section.start : ''} onChange={e => go(Number(e.target.value))}>
          <option value="" disabled>Jump to volume</option>
          {volumes.map(volume => <option key={volume.start} value={volume.start}>{volume.label} · {volume.title}</option>)}
        </select>}
        <label className="comic-current-edition">Book <select aria-label="Choose book" value={id} onChange={e=>go(1,e.target.value)}>{editionOrder.map(eid=><option key={eid} value={eid}>{books[eid].label}</option>)}</select></label>
        <span className="sr-only" aria-live="polite">Page {page} of {book.pageCount}. {describe(page)}</span>
      </nav>
      {page===book.pageCount && next && <div className="comic-current-continue"><button className="comic-primary" onClick={()=>go(1,next)}>Continue with {books[next].label}<ArrowRight size={18}/></button></div>}
    </>}
  </main>;
}
