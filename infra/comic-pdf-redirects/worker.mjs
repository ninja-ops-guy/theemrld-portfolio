// Proposed only. Archive assets must exist before this route is enabled.
const archives = {
  "https://kterminal.site/techops-comic/TechOps-Hero-Revision-11.1.pdf": "https://github.com/ninja-ops-guy/theemrld-portfolio/releases/download/techops-hero-pdf-archive-20261110/TechOps-Hero-Revision-11.1.pdf",
  "https://kterminal.site/techops-comic/TechOps-Hero-Revision-11.pdf": "https://github.com/ninja-ops-guy/theemrld-portfolio/releases/download/techops-hero-pdf-archive-20261110/TechOps-Hero-Revision-11.pdf",
  "https://kterminal.site/techops-comic/TechOps-Hero-Revision-F-Annotation-Update-315-Pages.pdf": "https://github.com/ninja-ops-guy/theemrld-portfolio/releases/download/techops-hero-pdf-archive-20261110/TechOps-Hero-Revision-F-Annotation-Update-315-Pages.pdf"
};

export function redirectFor(request) {
  const url = new URL(request.url);
  const target = archives[url.origin + url.pathname];
  if (!target || !['GET', 'HEAD'].includes(request.method)) return null;
  // Keep redirects reversible; no page fragment is set on the target.
  return new Response(null, { status: 302, headers: {
    Location: target, 'Cache-Control': 'no-store'
  }});
}
export default {
  async fetch(request) { return redirectFor(request) ?? fetch(request); }
};
