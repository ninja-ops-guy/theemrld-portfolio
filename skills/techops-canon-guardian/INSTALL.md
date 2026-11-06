# Install and use the TechOps Hero Visual Canon Guardian

This directory is a portable AgentSkills/OpenClaw skill package.

## OpenClaw

Copy the complete `techops-canon-guardian` directory into the workspace skill folder, such as `~/.openclaw/workspace/skills/techops-canon-guardian`, or a project `.agents/skills/` folder. For isolated agents, install the same version in each workspace. Run `openclaw skills list` and start a fresh session if the command is not recognized.

## Invoke

- **Image prompt:** `/techops-canon-guardian Create a prompt for [scene]. Load applicable references, freeze identity/costume details, and list uncertainties.`
- **Comic plan:** `/techops-canon-guardian Plan [volume/chapter]. Check Story Bible v1.7, scoped addenda and page descriptions; return chronology-safe numbered panel briefs and missing references.`
- **Visual review:** `/techops-canon-guardian Review [files/pages/panels] against [reference files]. Compare face, hair, clothing, environment, panel order and duplicate art. Return evidence-backed findings and exact corrections.`

For rendered images, the optional helpers are described in `README.md`. A script result is not a likeness or canon certificate; an actual visual comparison against accepted references is required.

## Authority reminder

Story Bible v1.7 and previously accepted revisions remain authoritative. The November 6 repository addendum supplements v1.7 only for its scoped clarifications. Refresh repository sources and hashes when they change. Missing or unverified reference material must be reported as such.
