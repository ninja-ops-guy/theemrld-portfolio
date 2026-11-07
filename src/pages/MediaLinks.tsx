import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, Gamepad2, Github, Instagram, Music2, Terminal, Palette } from 'lucide-react';

const destinations = [
  { title: 'READ TECHOPS HERO', detail: 'The comic archive — start reading', href: '#/comic', icon: BookOpen, internal: true },
  { title: 'SEE WORLD / CAMPAIGN PREVIEW', detail: 'Four playable story drafts. Progress stays in See World. TechOps Hero sync and Night Walker unlocks are pending.', href: '#/see-world', icon: Gamepad2, internal: true },
  { title: 'K WORLD / 3D GALLERY', detail: 'Walk through the existing interactive art gallery', href: '#/k/gallery', icon: Palette, internal: true },
  { title: 'K TERMINAL', detail: 'Music, experiments and the interactive terminal', href: '#/terminal', icon: Terminal, internal: true },
  { title: 'MUSIC / GHOST BENDS', detail: 'Listen to original tracks and discover more', href: 'https://soundcloud.com/raikouno/tracks', icon: Music2 },
  { title: '@MIKESNINJA', detail: 'Art and comic updates · Instagram profile unverified', href: 'https://www.instagram.com/mikesninja/', icon: Instagram },
  { title: '@KIND.DREAD', detail: 'Original artwork · Instagram profile unverified', href: 'https://www.instagram.com/kind.dread/', icon: Instagram },
  { title: '@DEFIED_STARS', detail: 'Creative projects · Instagram profile unverified', href: 'https://www.instagram.com/defied_stars/', icon: Instagram },
  { title: 'GITHUB', detail: 'Projects, code and research', href: 'https://github.com/ninja-ops-guy', icon: Github },
];

export default function MediaLinks() {
  return <main className="min-h-screen bg-[#050A14] text-[#E8EDF3] relative overflow-hidden px-5 py-12 sm:py-20">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(74,109,255,.20), transparent 55%), radial-gradient(ellipse at 90% 85%, rgba(49,190,139,.09), transparent 45%)' }} />
    <div className="relative mx-auto max-w-xl">
      <div className="flex flex-wrap justify-between items-center gap-x-4 mb-8 text-[11px] tracking-[.25em] uppercase text-[#8899AA]">
        <Link to="/" className="inline-flex min-h-11 items-center hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#83e1c0]">← Portfolio</Link>
        <span>THE EMRLD / MEDIA INDEX</span>
      </div>
      <div className="mb-10">
        <p className="font-label mb-4">ART // COMICS // MUSIC // WORLDS</p>
        <h1 className="font-headline text-[clamp(2rem,10vw,4.5rem)] [overflow-wrap:anywhere] tracking-[-.06em] leading-none mb-5">NINJA<span className="text-[#83e1c0]">OPS</span>GUY</h1>
        <p className="text-[#aebbc9] leading-relaxed max-w-md">Stories you can read. Music you can hear. Worlds you can explore. Choose where to begin.</p>
      </div>
      <nav aria-label="Media destinations" className="space-y-3">
        {destinations.map(({ title, detail, href, icon: Icon, internal }) => {
          const Arrow = internal ? ArrowRight : ArrowUpRight;
          const body = <><span className="flex items-center gap-4 min-w-0"><Icon aria-hidden="true" size={21} className="shrink-0 text-[#83e1c0]" /><span className="min-w-0"><span className="block font-headline text-sm sm:text-base tracking-[.09em]">{title}</span><span className="block text-xs sm:text-sm text-[#aebbc9] mt-1">{detail}</span></span></span><Arrow aria-hidden="true" size={18} className="shrink-0 text-[#8899AA]" /></>;
          const cls = 'flex min-h-[76px] items-center justify-between gap-3 rounded-lg border border-[#263648] bg-[#0d1726]/90 px-4 py-4 transition-colors hover:border-[#83e1c0] hover:bg-[#13243a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#83e1c0]';
          return internal ? <Link key={title} to={href.slice(1)} className={cls}>{body}</Link> : <a key={title} href={href} className={cls}>{body}</a>;
        })}
      </nav>
      <p className="mt-12 text-center text-xs tracking-[.12em] text-[#8899AA]">THE EMRLD · ENTER THE WORLD, FOLLOW THE SIGNAL</p>
    </div>
  </main>;
}
