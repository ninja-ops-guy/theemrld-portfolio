export default function Footer() {
  return (
    <footer
      className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3 md:px-10"
      style={{ minHeight: '64px', background: '#050A14', borderTop: '1px solid #0d1424', zIndex: 1 }}
    >
      <p className="font-body" style={{ fontSize: '12px', color: '#8899AA' }}>
        2025 THEEMRLD // Systems Engineering
      </p>
      <nav aria-label="Footer" className="flex flex-wrap items-center gap-6">
        <a href={`${import.meta.env.BASE_URL}privacy.html`} className="font-label inline-flex items-center min-h-11 hover:text-[#E8EDF3]">Privacy</a>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-label min-h-11 hover:text-[#E8EDF3] transition-colors duration-300"
          style={{ letterSpacing: '0.1em' }}
        >
          Back to top
        </button>
      </nav>
    </footer>
  );
}
