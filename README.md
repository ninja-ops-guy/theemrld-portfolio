# THEEMRLD — Systems & Security Engineering Portfolio

A portfolio focused on **inspectable engineering evidence** across infrastructure, security, automation, applied AI, research software, and product engineering.

The projects here are not presented as equally mature products. Each case study is labeled by its actual state — live, active development, experimental, or research — and emphasizes the problem, implementation, verification, and remaining work.

## Portfolio Thesis

I build systems that operate, test, or improve other systems.

That includes production-minded software, automated QA, security experimentation, AI orchestration, research tooling, and infrastructure-focused automation. The goal of this portfolio is to make that work easy to evaluate without relying on résumé claims alone.

## Flagship Public Evidence

### TechOps Hero — Product Engineering / Automated QA

A public, playable IT troubleshooting RPG that has grown into a substantial software-validation project. The engineering work includes campaign/state systems, browser runtime testing, regression coverage, CI contracts, GitHub Pages deployment, mobile controls, and repeated failure-driven debugging.

- Live: https://ninja-ops-guy.github.io/techops-hero/
- Source: https://github.com/ninja-ops-guy/techops-hero
- Status: **Active development / public**

### Adversarial Clothing Pipeline — Adversarial ML R&D

An experimental platform for researching physically realizable adversarial fashion. The repository emphasizes reproducible experiments, artifact provenance, benchmark orchestration, pattern generation, deformation/physics modeling, and evidence-gated claims.

- Source: https://github.com/ninja-ops-guy/adversarial-clothing-pipeline
- Status: **Experimental public R&D; physical validation pending**

### CIC / SAT Research — Complexity & Formal Reasoning

A public research program combining computational experiments, SAT tooling, written arguments, and formalization artifacts. It is presented as research rather than as settled mathematical proof; measured evidence, formal artifacts, and open claims should be evaluated separately.

- Source: https://github.com/ninja-ops-guy/cic-p-vs-np-research
- Status: **Active research / public**

## Supporting Public Projects

- **LDD-Kit** — reusable engineering tooling: https://github.com/ninja-ops-guy/LDD-Kit
- **Streetfighter for Vector** — robotics/game experiment: https://github.com/ninja-ops-guy/streetfighter-for-vector

Private and commercially oriented work is intentionally not used as the primary evidence layer when the implementation cannot be inspected publicly.

## What to Evaluate

When reviewing the portfolio, the strongest signals are:

1. **Architecture** — how problems are decomposed into systems and interfaces.
2. **Verification** — tests, CI, benchmarks, runtime checks, and failure handling.
3. **Iteration** — evidence that failures lead to concrete engineering changes.
4. **Operational thinking** — deployment, reliability, safety boundaries, observability, and maintainability.
5. **Technical range** — infrastructure, security, automation, AI systems, research software, and interactive products.

## Portfolio Site Stack

- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- GSAP + ScrollTrigger
- Canvas 2D visual effects
- GitHub Actions / GitHub Pages

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

### Refresh the K World release catalogue

K Terminal checks @raikouno's public SoundCloud RSS feed hourly and publishes a new catalogue when track data changes. Open pages refresh the published catalogue every five minutes and when returning to the tab; `sync` or `sync latest` checks it immediately. Sync preserves the current song and playback position. `latest` explicitly plays the newest published release. The feed includes public tracks selected for RSS, and both terminal interfaces show the catalogue timestamp. The existing `python scripts/sync_raikouno.py` command remains available for a manual refresh. See [release sync operations](docs/K_TERMINAL_RELEASE_SYNC.md).

### Music while reading and project comments

Both `/terminal` and `/k/terminal` control the same persistent player. Use `latest`, then `background on`, then `comic` to keep listening while reading. `background off` pauses playback outside the terminal. A fresh page load still requires an explicit play gesture; this feature keeps music across navigation inside the site, not after closing the browser.

`guided edit` opens the soundtrack editor. Assign an edition, inclusive page range, song title, and SoundCloud track URL, then preview the score on your device. `guided on` follows the visible comic page. Cue changes preserve a listener's pause, pages within a cue do not restart it, and unassigned pages remain silent. The published score intentionally starts empty until the creator defines the placements. Local preview edits do not change the soundtrack for other readers. See [guided soundtrack authoring](docs/GUIDED_SOUNDTRACK.md) for publication and revision binding.

`comment` opens a text editor for public project feedback. Drafts remain on the device; **Review and post on GitHub** opens the repository's issue form for the visitor to review and submit while signed in. Opening that link does not submit a comment. The reader also exposes music controls, **Define songs**, and **Comment** above the artwork.

## Links

- GitHub: https://github.com/ninja-ops-guy/
- LinkedIn: https://linkedin.com/in/ma0livares
- TryHackMe: https://tryhackme.com/p/n1n74
- SoundCloud: https://soundcloud.com/raikouno/tracks
