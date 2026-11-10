# Navigation-only repair

The public smoke used github.io exclusively while the portfolio redirects to kterminal.site. Its browser allowlist blocked the custom-domain assets. Keep exact deployed reader-byte checks and existing spoiler/help/storage assertions, allow HTTPS GET/HEAD on only the two intended hosts, and follow the actual game destination to native title readiness.

The media hub links directly to the original github.io game origin. The custom-domain /techops-hero/ bookmark redirects there without accessing storage and preserves query/hash. No native player data is copied, cleared, imported, or migrated.

The smoke separately verifies all 14 native reader file hashes against native candidate 8d3ac165863857a4cf29a4aed6251b347fde0d2f. This establishes reader-byte provenance, not that every native game file is from that commit. A later legitimate native reader update requires explicit reviewed provenance changes.

Candidate CI serves the built portfolio files by request interception at the production-shaped custom origin and uses the actual legacy redirect and native game. It is labeled candidate evidence, not deployed portfolio verification. Every browser context is disposable and no game run is started. The live workflow uses real canonical-domain responses and fails on wrong bytes, links, readiness, storage writes or page errors.

## Untouched native title storage baseline

The native-only title gate allows exactly `techops_settings`, `setItem`, and `getItem`, and requires the getter and setter to remain callable. Every other entry, including all native and linked progress, fails. Portfolio and reader storage must still be empty.

The first key is an existing preference written by v68/v69/v71 startup hooks. The latter two are legacy method-name artifacts: v732_hooks.js assigns functions directly to the localStorage instance at lines 60 and 73. Those assignments already existed at pre-repair native commit 053ee3948170ac972bc1af44eacfa4857fc32a0f. Read source at https://github.com/ninja-ops-guy/techops-hero/blob/053ee3948170ac972bc1af44eacfa4857fc32a0f/v732_hooks.js#L56-L79.

Run 42900656433 confirmed three total entries, both fixed method-name presence booleans true, and both APIs callable. It exported no storage names or contents. Prior failing receipts 42898075929, 42898928115, 42900122836 and 42900656433 remain evidence of the newly added gate's overly strict initial assumption. This exact baseline correction does not weaken the original reader checks, certify backup-wrapper behavior, or prove save continuity.

## Still held

This intentionally does not import the reader origin-choice or linked-save changes in #66. The portfolio reader and native game still use different origins. Navigation-only PASS does not prove connected progress or resolve the WebKit recovery failures tracked by #71. Preserve those failures and both release holds. No merge, deployment or review-state change is authorized by this draft.
