/** New tabs leave the shared music session and reader position mounted. */
export default function SiteInfoLinks() {
  return <nav className="site-info-links" aria-label="Site information">
    {(['About', 'Contact', 'Privacy'] as const).map(label => <a key={label}
      href={`${import.meta.env.BASE_URL}${label.toLowerCase()}.html`}
      target="_blank" rel="noopener noreferrer">{label}<span className="site-info-sr"> (opens in a new tab)</span></a>)}
  </nav>;
}
