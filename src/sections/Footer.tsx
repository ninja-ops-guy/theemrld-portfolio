export default function Footer() {
  return (
    <footer
      className="relative flex items-center justify-between px-6 md:px-10"
      style={{ height: '64px', background: '#050A14', borderTop: '1px solid #0d1424', zIndex: 1 }}
    >
      <p className="font-body" style={{ fontSize: '12px', color: '#8899AA' }}>
        2025 THEEMRLD // Systems Engineering
      </p>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="font-label hover:text-[#E8EDF3] transition-colors duration-300"
        style={{ letterSpacing: '0.1em' }}
      >
        Back to top
      </button>
    </footer>
  );
}
