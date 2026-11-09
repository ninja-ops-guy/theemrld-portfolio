# Comic visual registers — phase-one sample

Status: limited review implementation for PR #63. This adds edition-bound sample annotations and reader disclosure UI; it does not complete all-page tagging, establish creator approval, alter art, or settle open chronology.

## Registers

- Present — observable scene-present action or dialogue; speech is not proof.
- Personal memory — lived Red/K/Iona recollection; incomplete and not documentary proof alone.
- Mike-to-K fragment — fragmentary, induced, one-way memory-feed content.
- Record — displayed physical/captured evidence with source and bounded claim scope.
- ORPHEUS model · provisional — ORPHEUS inference, classification, or reconstruction.
- Celestial event — actual experience in the established cosmology; exact historical placement stays open.

Communication channel (dialogue, radio, relay audio, dog telepathy, Mike feed) and action kind (ordinary or emerald) are facets, not additional registers.

## Edition and art binding

The reader must match edition, art revision, and one-based page index before displaying a label. The supplied scene titles “What Orpheus was,” “Red and Iona / recollection,” and “The celestial encounter / Tea and regalia” are in the 161-page legacy edition at pages 13, 33, and 77. They do not match Revision F at those indices. Revision F declares 316 pages and uses art revision continuity-hq-46943e14; legacy uses 161 pages and 11.2.

## Reader behavior

The reader shows one compact Visual register disclosure below the artwork and above navigation, outside the comic image. It lists panel order, register labels, review state, and record scope, with a nested keyboard-operable six-register legend. Text carries the distinction; color is not the sole cue. Pending panels say Needs creator review and are not assigned a register.

## Sample findings

- Revision F p. 13: present action plus visible terminal log; the displayed match score is not independent corroboration.
- Revision F p. 33: live radio and landing action; the phone message records what the sender said but does not authenticate every claim.
- Revision F p. 77: origin montage and ORPHEUS monitor; source of narration/montage remains unresolved.
- Legacy p. 13: present explanation/test; purple construct panel is ambiguous.
- Legacy p. 33: present workshop and bounded damaged-record display, surrounding an explicit Iona recollection.
- Legacy p. 77: actual celestial realm panels; opening and threshold panels remain unresolved, and no date is added.

tests/story-visual-register.test.mjs validates page binding, page bounds, record provenance/scope, pending-panel rules, the six categories, and anti-conflation invariants. These are editorial metadata checks, not a visual-accuracy certification.
