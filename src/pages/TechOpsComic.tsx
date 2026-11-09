import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDownToLine, ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import data from '../data/comic.json';
import collectedDescriptions from '../data/comic-descriptions.json';
import revisionF from '../data/comic-revision-f.json';
import coverArt from '../data/comic-revision-f-covers.json';
import volumeFive from '../data/comic-volume-five.json';
import volumeThirteen from '../data/comic-volume-thirteen.json';
import './TechOpsComic.css';

const base = import.meta.env.BASE_URL + 'techops-comic/';
const splashArt = base + 'intro-panels-hq.webp';
const revision = '11.2';
const collectedPdf = base + `TechOps-Hero-Revision-${revision}.pdf`;
const revisionFArtRevision = 'continuity-hq-46943e14';
const revisionFPdf = base + `TechOps-Hero-Revision-F-Complete.pdf?rev=${revisionFArtRevision}`;
const volumeThirteenBase = base + 'volume-xiii/';
const volumeThirteenPdf = `${volumeThirteenBase}TechOps-Hero-Volume-XIII-The-Last-Launch.pdf?rev=${volumeThirteen.artRevision}`;
const volumeThirteenImageUrl = (page: number) => `${volumeThirteenBase}${String(page).padStart(3, '0')}.webp?rev=${volumeThirteen.artRevision}`;
const volumeFiveBase = base + 'volume-v/';
const mobilePdf = volumeFiveBase + 'TechOps-Hero-Volume-5-Mobile.pdf';
const printPdf = volumeFiveBase + 'TechOps-Hero-Volume-5.pdf';
const legacyDescriptions = [...collectedDescriptions, ...volumeFive.descriptions];
const legacyTotal = legacyDescriptions.length;
const collectedPages = collectedDescriptions.length;
const legacyScenes = [...data.scenes, ...volumeFive.scenes.map(scene => ({
  title: scene.title,
  page: collectedPages + scene.page,
}))];
const artworkUrl = (name: string) => `${base}${name}.webp?rev=${revision}`;
const volumeFiveArt = (name: string) => `${volumeFiveBase}${name}.webp?rev=${volumeFive.artRevision}`;
function legacyImageUrl(page: number) {
  if (page > collectedPages) return volumeFiveArt(String(page - collectedPages).padStart(3, '0'));
  return artworkUrl(String(page).padStart(3, '0'));
}
const legacyVolumes = [
  { numeral: 'I', title: 'The Human Connection', start: 1, end: 46, cover: artworkUrl('volume-I') },
  { numeral: 'II', title: 'The Vessel', start: 47, end: 81, cover: artworkUrl('volume-II') },
  { numeral: 'III', title: 'The Return Signal', start: 82, end: 104, cover: artworkUrl('volume-III') },
  { numeral: 'IV', title: 'The False Bearing', start: 105, end: collectedPages, cover: artworkUrl('volume-IV') },
  { numeral: 'V', title: volumeFive.title, start: collectedPages + 1, end: legacyTotal, cover: volumeFiveArt('cover') },
];
const revisionFImageUrl = (page: number) => `${base}revision-f/${String(page).padStart(3, '0')}.webp?rev=${revisionFArtRevision}`;
const revisionFVolumes = revisionF.sections.filter(section => section.kind !== 'guide');
type CoverArt = { page: number; crop: { x: number; y: number; size: number }; color: string; chapters?: string };
const illustratedCovers: Partial<Record<number, CoverArt>> = coverArt;

function IllustratedCover({ art, label, title, inReader = false, onError }: {
  art: CoverArt;
  label: string;
  title: string;
  inReader?: boolean;
  onError?: () => void;
}) {
  const { x, y, size } = art.crop;
  return <div className="comic-illustrated-cover" style={{ '--cover-accent': art.color } as CSSProperties}
    aria-hidden={inReader ? undefined : true} role={inReader ? 'img' : undefined}
    aria-label={inReader ? `TechOps Hero. ${label}, ${title}. Chapters ${art.chapters}. By Mike Olivares.` : undefined}>
    <div className="comic-cover-mast"><span>{label}</span><strong>TechOps Hero</strong></div>
    <div className="comic-cover-panel">
      <img src={revisionFImageUrl(art.page)} alt="" loading={inReader ? 'eager' : 'lazy'}
        width="1080" height="1620" onError={onError}
        style={{ width: `${108000 / size}%`, left: `${-100 * x / size}%`, top: `${-100 * y / size}%` }} />
    </div>
    <div className="comic-cover-title">{title}</div>
    <div className="comic-cover-credit">
      <span>Mike Olivares</span>{art.chapters && <span>Ch. {art.chapters}</span>}
    </div>
  </div>;
}

const books = {
  xiii: {
    total: volumeThirteen.pageCount,
    sections: volumeThirteen.sections,
    cards: volumeThirteen.sections.map(section => ({ ...section, cover: volumeThirteenImageUrl(section.start) })),
    scenes: volumeThirteen.scenes,
    links: volumeThirteen.links as Record<number, { page: number; rect: number[] }[]>,
    describe: (page: number) => volumeThirteen.descriptions[page - 1],
    imageUrl: volumeThirteenImageUrl,
    bookmarkKey: 'techops-hero:volume-xiii:revised:page',
  },
  f: {
    total: revisionF.pageCount,
    sections: revisionF.sections,
    cards: revisionFVolumes.map(section => ({ ...section, cover: revisionFImageUrl(section.start) })),
    scenes: revisionF.scenes,
    links: revisionF.links as Record<number, { page: number; rect: number[] }[]>,
    describe: (page: number) => revisionF.descriptions[page - 1]
      ?? revisionF.sections.find(section => page >= section.start && page <= section.end)?.title ?? 'Revision F',
    imageUrl: revisionFImageUrl,
    bookmarkKey: 'techops-hero:revision-f:waldo-continuity:page',
  },
  legacy: {
    total: legacyTotal,
    sections: legacyVolumes.map(volume => ({ ...volume, label: `Vol. ${volume.numeral}` })),
    cards: legacyVolumes.map(volume => ({ ...volume, label: `Vol. ${volume.numeral}` })),
    scenes: legacyScenes,
    links: { 3: data.contentsLinks } as Record<number, { page: number; rect: number[] }[]>,
    describe: (page: number) => legacyDescriptions[page - 1],
    imageUrl: legacyImageUrl,
    bookmarkKey: 'techops-hero:r11:page',
  },
};

function validPage(value: string | null, total: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= total ? number : 0;
}
function readBookmark(book: (typeof books)[keyof typeof books]) {
  try {
    const saved = localStorage.getItem(book.bookmarkKey);
    if (saved !== null) return validPage(saved, book.total);
    if (book === books.f) {
      const previous = validPage(localStorage.getItem('techops-hero:revision-f:page'), 315);
      return previous >= 34 ? previous + 1 : previous;
    }
    return 0;
  } catch { return 0; }
}

export default function TechOpsComic() {
  const [params, setParams] = useSearchParams();
  const requestedEdition = params.get('edition');
  // Old URLs used page numbers from a different edition.
  const edition = requestedEdition === 'xiii' ? 'xiii' : requestedEdition === 'f' || (!params.has('page') && requestedEdition !== 'legacy') ? 'f' : 'legacy';
  const isRevisionF = edition === 'f';
  const isVolumeThirteen = edition === 'xiii';
  const { total, sections, cards, scenes, links, describe, imageUrl, bookmarkKey } = books[edition];
  const page = validPage(params.get('page'), total);
  const fromWorld = params.get('from') === 'world';
  const [bookmarks, setBookmarks] = useState(() => ({ f: readBookmark(books.f), legacy: readBookmark(books.legacy), xiii: readBookmark(books.xiii) }));
  const savedPage = bookmarks[edition];
  const alternateEdition = new URLSearchParams();
  if (fromWorld) alternateEdition.set('from', 'world');
  if (isRevisionF) alternateEdition.set('edition', 'legacy');
  const [revisionFReady, setRevisionFReady] = useState(false);
  useEffect(() => {
    let active = true;
    // Never advertise a download until its actual PDF asset is on the public site.
    fetch(revisionFPdf, { method: 'HEAD' }).then(response => {
      if (active) setRevisionFReady(response.ok && /application\/pdf/i.test(response.headers.get('content-type') ?? ''));
    }).catch(() => { if (active) setRevisionFReady(false); });
    return () => { active = false; };
  }, []);
  const [intro, setIntro] = useState(() => !page && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stopIfReduced = () => { if (motion.matches) setIntro(false); };
    motion.addEventListener('change', stopIfReduced);
    return () => motion.removeEventListener('change', stopIfReduced);
  }, []);
  const splash = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = splash.current;
    if (!intro || page || !dialog) return;
    dialog.showModal();
    // Release the reader even if the panel sheet stalls on a slow connection.
    const finish = window.setTimeout(() => setIntro(false), 8000);
    return () => {
      window.clearTimeout(finish);
      dialog.close();
    };
  }, [intro, page]);
  const [zoom, setZoom] = useState(false);
  const [failedPage, setFailedPage] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const swipe = useRef<{x: number; y: number} | null>(null);
  const section = sections.find(item => page >= item.start && page <= item.end) ?? sections[0];
  // Only replace plain volume title pages. Iona’s first page contains the story.
  const openingCover = isRevisionF && page === section.start && section.label !== 'Interlude'
    ? illustratedCovers[page] : undefined;
  const readingVolumeFive = page > 0 && section.label === 'Vol. V';
  const pdfUrl = isVolumeThirteen ? `${volumeThirteenPdf}#page=${page}` : isRevisionF ? `${revisionFPdf}#page=${page}` : readingVolumeFive ? mobilePdf : collectedPdf;
  const choosePage = useCallback((number: number) => {
    setIntro(false);
    const q = new URLSearchParams();
    if (fromWorld) q.set('from', 'world');
    if (isVolumeThirteen) q.set('edition', 'xiii');
    else if (isRevisionF && number) q.set('edition', 'f');
    else if (!isRevisionF && !number) q.set('edition', 'legacy');
    if (number) q.set('page', String(number));
    setParams(q, { replace: page > 0 && number > 0 });
    setFailedPage(0);
  }, [fromWorld, isRevisionF, isVolumeThirteen, page, setParams]);

  useEffect(() => {
    const original = document.title;
    document.title = page ? `Page ${page} · TechOps Hero` : 'TechOps Hero · The Collected Edition';
    return () => { document.title = original; };
  }, [page]);
  useEffect(() => {
    if (!page) { setZoom(false); return; }
    setBookmarks(previous => previous[edition] === page ? previous : { ...previous, [edition]: page });
    try { localStorage.setItem(bookmarkKey, String(page)); } catch { /* Private storage is optional. */ }
    stage.current?.scrollTo(0, 0);
    function keydown(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || (e.target instanceof HTMLElement && e.target.closest('input,select,textarea,[contenteditable=true]'))) return;
      if (e.key === 'ArrowLeft' && page > 1) { e.preventDefault(); choosePage(page - 1); }
      if (e.key === 'ArrowRight' && page < total) { e.preventDefault(); choosePage(page + 1); }
    }
    window.addEventListener('keydown', keydown);
    if (page < total) new Image().src = imageUrl(page + 1);
    return () => window.removeEventListener('keydown', keydown);
  }, [page, choosePage, edition, bookmarkKey, total, imageUrl]);

  return <main className={'comic-shell ' + (page ? 'comic-reading' : '')}>
    {intro && !page && <dialog ref={splash} className="comic-reel" aria-label="Tech Ops Hero introduction"
      onCancel={() => setIntro(false)}>
      <div className="comic-reel-film" aria-hidden="true" style={{'--panel-sheet': `url("${splashArt}")`} as CSSProperties}
        onAnimationEnd={event => { if (event.animationName === 'comic-reel-out') setIntro(false); }}>
        <div className="comic-reel-gate">
          <img className="comic-panel-sheet" src={splashArt} alt="" fetchPriority="high"
            onLoad={event => event.currentTarget.dataset.ready = 'true'} onError={() => setIntro(false)} />
        </div>
        <div className="comic-reel-mask"><span>TECH OPS</span><span>HERO</span></div>
      </div>
      <button type="button" className="comic-reel-toggle" onClick={() => setIntro(false)}>Skip intro</button>
    </dialog>}
    <header className="comic-mast">
      <Link to={fromWorld ? '/k/terminal' : '/terminal'}><ArrowLeft size={16} /> K Terminal</Link>
      <span className="comic-imprint">THE EMRLD <i>/</i> COMICS</span>
      <nav className="comic-downloads" aria-label="PDF downloads">
        {/* Offer only the current edition's downloads. */}
        {(isVolumeThirteen || (isRevisionF && !page)) && <a className="comic-download" href={volumeThirteenPdf} target="_blank" rel="noopener noreferrer"><BookOpen size={16} /> Vol. XIII · The Last Launch PDF</a>}
        {isRevisionF && revisionFReady && <a className="comic-download" href={revisionFPdf} target="_blank" rel="noopener noreferrer"><BookOpen size={16} /> Complete {revisionF.pageCount}-page Revision F PDF</a>}
        {edition === 'legacy' && !readingVolumeFive && <a className="comic-download" href={collectedPdf} download><ArrowDownToLine size={16} /> Vols. I–IV PDF</a>}
        {edition === 'legacy' && (!page || readingVolumeFive) && <a className="comic-download" href={mobilePdf} download><ArrowDownToLine size={16} /> Vol. V mobile PDF</a>}
        {edition === 'legacy' && readingVolumeFive && <a className="comic-download" href={printPdf} download>Print PDF</a>}
      </nav>
    </header>
    {!page ? <>
      <section className="comic-hero" style={{'--dock': `url("${base}dock.webp")`} as CSSProperties}>
        <div className="comic-hero-art" aria-hidden="true" />
        <button type="button" className="comic-reel-toggle" onClick={() => setIntro(true)}>Replay intro</button>
        <div className="comic-hero-copy">
          <p className="comic-overline"><span /> {isVolumeThirteen ? 'VOLUME XIII · THE LAST LAUNCH' : 'THE COLLECTED EDITION'}</p>
          <h1 aria-label="TECH OPS HERO">{['TECH OPS','HERO'].map((line, row) =>
            <span className="comic-title-line" aria-hidden="true" key={line}>{[...line].map((c,i) =>
              <b key={i} style={{'--i': row * 7 + i} as CSSProperties}>{c === ' ' ? '\u00a0' : c}</b>)}</span>)}</h1>
          <p className="comic-byline">By Mike Olivares</p>
          <div className="comic-actions">
            <button className="comic-primary" onClick={() => choosePage(savedPage > 1 ? savedPage : 1)}>{savedPage > 1 ? `Resume · p. ${savedPage}` : 'Read the comic'} <ArrowRight size={18}/></button>
            <span>{isVolumeThirteen ? 'Volume XIII' : `${isRevisionF ? 12 : legacyVolumes.length} volumes`} <i> / </i> {total} pages</span>
          </div>
        </div>
      </section>
      <section className="comic-library" aria-label="Volumes">
        <div className="comic-library-heading">
          <h2>{isVolumeThirteen ? 'The Last Launch' : 'The volumes'}</h2><span>{isVolumeThirteen ? 'VOL. XIII · REVISED EDITION' : isRevisionF ? 'VOLS. I–XII · REVISION F' : 'VOLS. I–V · EARLIER EDITION'}</span>
        </div>
        <div className={'comic-volumes' + (isRevisionF || isVolumeThirteen ? ' comic-volumes-complete' : '')}>{cards.map(item => {
          const art = isRevisionF ? illustratedCovers[item.start] : undefined;
          return <button key={item.start} onClick={() => choosePage(item.start)}>
            {art
              ? <IllustratedCover art={art} label={item.label} title={item.title} />
              : <img src={item.cover} alt="" loading="lazy" width={isRevisionF || isVolumeThirteen ? 1080 : 420} height={isRevisionF || isVolumeThirteen ? 1620 : 180} />}
            <div className="comic-vol-meta">{item.label}<span>PP. {item.start}–{item.end}</span></div>
            <div className="comic-vol-title">{item.title} <ArrowRight size={18}/></div>
          </button>;
        })}{isRevisionF && <button onClick={() => {
          const q = new URLSearchParams({ edition: 'xiii', page: '1' });
          if (fromWorld) q.set('from', 'world');
          setParams(q);
        }}>
          <img src={volumeThirteenImageUrl(1)} alt="" loading="lazy" width="1080" height="1620" />
          <div className="comic-vol-meta">Vol. XIII<span>PP. {revisionF.pageCount + 1}–{revisionF.pageCount + volumeThirteen.pageCount}</span></div>
          <div className="comic-vol-title">{volumeThirteen.title} <ArrowRight size={18}/></div>
        </button>}</div>
        {!isVolumeThirteen && <p><Link className="comic-edition-link" to={`/comic?edition=xiii&page=1${fromWorld ? '&from=world' : ''}`}>
          Continue with Volume XIII · The Last Launch <ArrowRight size={18}/>
        </Link></p>}
        <Link className="comic-edition-link" to={{ pathname: '/comic', search: alternateEdition.toString() }}>
          {isRevisionF ? 'Earlier Volumes I–V reader' : 'Read the complete Revision F collection'}
        </Link>
      </section>
    </> : <>
      <div className="comic-reader-head">
        <button onClick={() => choosePage(0)}><BookOpen size={17}/> Collection</button>
        <h1>Tech Ops Hero <span>/</span> <small>{section.label} · {section.title}</small></h1>
        <button aria-pressed={zoom} onClick={() => setZoom(!zoom)}>{zoom ? <Minimize2 size={16}/> : <Maximize2 size={16}/>} {zoom ? 'Fit page' : 'Enlarge'}</button>
      </div>
      <div className={'comic-stage' + (zoom ? ' is-enlarged' : '')} ref={stage}
        onTouchStart={e => { swipe.current = !zoom && e.touches.length === 1 ? {x:e.touches[0].clientX,y:e.touches[0].clientY} : null; }}
        onTouchCancel={() => { swipe.current = null; }}
        onTouchEnd={e => {
          const start = swipe.current; swipe.current = null;
          if (!start || e.touches.length || !e.changedTouches.length) return;
          const dx = e.changedTouches[0].clientX - start.x;
          if (Math.abs(dx) < 55 || Math.abs(dx) < 1.6 * Math.abs(e.changedTouches[0].clientY - start.y)) return;
          choosePage(Math.min(total,Math.max(1,page + (dx < 0 ? 1 : -1))));
        }}>
        {failedPage === page ? <p role="alert">This page could not load. <a href={pdfUrl}>Open the complete PDF</a></p> :
          <div className="comic-sheet">
            {openingCover
              ? <IllustratedCover key={page} art={openingCover} label={section.label} title={section.title}
                  inReader onError={() => setFailedPage(page)} />
              : <img key={`${edition}-${page}`} className="comic-page-image" src={imageUrl(page)} alt={`Page ${page}. ${describe(page)}`} width="1080" height="1620" onError={() => setFailedPage(page)} />}
            {isVolumeThirteen && page === total && <div className="comic-end-card">To be continued.</div>}
            {links[page]?.map(({page:target,rect:[x1,y1,x2,y2]}, i) =>
              <button key={i} aria-label={`Read page ${target}: ${describe(target)}`} className="comic-hotspot" onClick={() => choosePage(target)}
                style={{left:`${100*x1/432}%`,top:`${100*y1/648}%`,width:`${100*(x2-x1)/432}%`,height:`${100*(y2-y1)/648}%`}} />)}
          </div>}
      </div>
      <nav className="comic-controls" aria-label="Reader navigation">
        <button className="comic-turn" aria-label="Previous page" disabled={page===1} onClick={() => choosePage(page-1)}><ChevronLeft/></button>
        <label>Page <select aria-label="Jump to page" value={page} onChange={e=>choosePage(Number(e.target.value))}>
          {Array.from({ length: total }, (_, i) => <option key={i} value={i+1}>{i+1}</option>)}</select> / {total}</label>
        <button className="comic-turn" aria-label="Next page" disabled={page===total} onClick={() => choosePage(page+1)}><ChevronRight/></button>
        <select aria-label="Jump to scene" className="comic-scenes" value="" onChange={e=>choosePage(Number(e.target.value))}>
          <option value="" disabled>Jump to scene</option>
          {sections.map(v=><optgroup key={v.start} label={`${v.label} · ${v.title}`}>
            {scenes.filter(s=>s.page>=v.start && s.page<=v.end).map(s=><option value={s.page} key={s.page}>{s.page} · {s.title}</option>)}
          </optgroup>)}
        </select>
        <span className="sr-only" aria-live="polite">Page {page} of {total}. {describe(page)}</span>
      </nav>
      {!isRevisionF && readingVolumeFive && <details key={page} className="comic-transcript">
        <summary>Page transcript</summary>
        <p>{volumeFive.transcripts[page - collectedPages - 1]}</p>
      </details>}
    </>}
  </main>;
}
