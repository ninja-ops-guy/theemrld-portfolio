# Issue 100 repair candidate

The five confirmed QA defects are addressed without changing authored campaign text, milestones, character identities or chronological gates.

1. Native save ownership now lives in the parser-loaded `dogs.js` bundle. Both the prototype path and v7.32's captured storage-instance setter use it. The portfolio companion may fail to load without disabling the active native writer. Continue and New Game retain their run-isolation semantics.
2. Derived snapshot shape, counter and source-derived fields are validated before reuse. Malformed caches are rebuilt from the matching native source pair. An exact recovery copy is retained before replacement; authoritative histories are not deleted.
3. The linked reader guards both the storage getter and initial read. Unavailable storage produces recovery instructions, a retry action and public navigation; imports/exports and earned writes remain unavailable.
4. Routine source-byte updates do not replace the reader DOM when visible story state is unchanged. During delayed publication, actions are inert until validation returns; scroll, focus and open journal state are retained.
5. Both applications use the same operation-receipt validator. New v2 receipts bind section, run, content revision and the earned source-history prefix, with exactly three valid objective answers. Valid legacy v1 receipts remain supported through their validated run envelope and section key. Invalid entries do not count; real recompletion preserves the damaged record and writes a new valid receipt.

The original 22-case Chromium/Firefox/WebKit adverse matrix is reused from the exact QA PR #49 head, with its already documented fixture corrections. No original assertions are removed. Five additional browser scenarios exercise companion outage/reload/ownership recovery, actual malformed-receipt recompletion, delayed-publication reader focus, malformed JSON cache recovery, and storage retry without false progress. Expanded test source is retained alongside each receipt.

The new deterministic suite adds 23 recovery and native-ownership tests to the existing 37. The matrix also runs the full native production gate. Passing results must be read from the actual exact-pair run; this document alone is not a verification claim.

Same-origin local saves only; not cloud synchronization or anti-cheat security. Public deployment still requires the paired build and editorial/release approval. No main branch or live save is changed by this candidate.
