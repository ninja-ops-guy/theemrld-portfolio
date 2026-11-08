# TechOps Hero issue 101 — investigation and reviewable experiment

7 November 2026. No repository changes published; no hosted workflow launched. No production correction is justified yet.

## Finding

The strongest working hypothesis is a native page-process failure sensitive to accumulated browser workload or context turnover. Application asset/graphics/audio activity could trigger it; the evidence does not separate that from WebKit internals or the runner environment. A missing readiness dependency alone does not explain an actual page-crash event. The location where the test was waiting is not a crash stack.

I independently downloaded both shared-process archives and matched their recorded SHA-256 digests. Inspected their executed source, receipts, timestamped lifecycle events, stderr, and the pinned native production source. The isolated 27/27 results were checked against the retained issue comment and job results, not independently re-executed or re-hashed in this investigation.

| Condition | Failure location | Additional evidence |
|---|---|---|
| Released/shared | Case 07, ordinal 12; second native page, `native-without-addon` | Crash 22:52:12.812 UTC; case failure 22:52:13.357; page close 22:52:13.367. Route abort was already installed, but Continue and save assertion had not run. First native page remained inspectable. |
| Presentation/shared | Case 09, ordinal 14; initial native boot | Crash 22:52:35.009 UTC; case failure 22:52:35.016; page close 22:52:35.019. Missing-locks page/setup had not been reached. |
| Released/shared | Case 19, objective click | 6-second actionability timeout after enabled assertion passed. No crash event recorded; native screenshot attempt also failed, leaving no native state snapshot. |

In both crash jobs the launcher remained alive, later cases passed, and final shutdown reported exitCode=0, signal=null. This argues against the main browser launcher dying; it does not tell us why a WebContent process died. Stderr lacks a crash backtrace, child exit signal, or OOM evidence. EGL/ZINK initialization and automation-session warnings recur during successful cases. The warnings immediately following the crash align with the next case startup, so attributing the preceding crash to those lines would reverse the event order.

Sources: [issue 101](https://github.com/ninja-ops-guy/techops-hero/issues/101), [shared run](https://github.com/ninja-ops-guy/theemrld-portfolio/actions/runs/42422337317), [isolated run](https://github.com/ninja-ops-guy/theemrld-portfolio/actions/runs/42422755571), [closed diagnostic PR 53](https://github.com/ninja-ops-guy/theemrld-portfolio/pull/53).

## Source inspection

All native references below use `053ee3948170ac972bc1af44eacfa4857fc32a0f`.

- `production_title_experience.js`: 100 ms polling, default 20-second deadline, timer cleared on ready/failure. Gate combines production bootstrap, campaign globals, Good Dogs authority/dependencies and Night router. Event refreshes also run. It performs DOM/status work and checkpoint reads; no direct WebGL or AudioContext creation. No pagehide disposer for title event listeners/polling, but context destruction normally destroys the document realm; absence alone is not evidence of cross-context retention. Good Dogs return watchdog occurs after a launch, not at cold title boot.
- `production_bootstrap.js`: serial script execution, four-script preload lookahead, later asset installation and readiness event. Timer deferral/parking and asynchronous asset work make dependency snapshots useful. A pending load can block readiness; it cannot by itself establish why a page process crashed.
- `production_asset_registry.js`: keeps image objects in a page-local registry; image preload concurrency is already bounded to eight. A retained-resource hypothesis needs per-process memory and child-process lifetime evidence. No basis yet for changing asset quality, preload counts or readiness gates.
- `runtime_combat_audio.js`: lazy acquisition of shared audio context, voice disposal and visibility silencing. No proof its resources survive closed browser contexts; no crash backtrace connects it to the failures.
- Harness `run()`: closes each context synchronously in `finally`, but suppresses close exceptions. Existing `case-end` is emitted BEFORE close. Page-close events are useful, but do not prove that all native child processes/resources have been released.

## Objective timeout: separate hypothesis

`see_world_linked_native.mjs:84` replaces all objective-panel children, including the Inspect button, on each `updateObjective()`. Its 750 ms timer invokes that updater; pagehide clears the interval and pageshow restarts it. Repeated replacement could race focus/actionability under load. However, the receipt does not report repeated detachments, and the failed native screenshot also allows a broader page/render stall. Therefore button churn is a concrete source observation, not an established cause of the six-second timeout.

A possible minimal correction, ONLY after evidence connects replacement to failure, is to create the objective controls once, retain their DOM identity, and update text/disabled state when necessary. Keep `near()`, ownership, unlock and receipt checks intact. Do not force clicks or increase timeouts as a fix. No such production patch is proposed for publication now.

## Implemented diagnostic proposal

`probe.py` reuses the exact retained matrix and changes only orchestration/diagnostics. It verifies all 43 original assert ASTs and every original click/wait/default-timeout call are identical. It supports full matrix, exact selected cases, original/reverse ordering, shared/fresh browser per case, and fixed experimental blocks. It records every failure; there is no retry-until-pass behavior. Multi-tab cases remain intact.

Instrumentation records page-crash versus browser-disconnect, readiness/dependency state, frame progression, objective identity replacement/actionability geometry, process RSS/thread/FD counts and cgroup memory events. Teardown errors become failures and live contexts are checked. Output directories must be distinct for independent invocations. Telemetry-on/off controls are necessary because sampling itself changes timing. RSS sums include shared pages and must not be treated as unique memory; cgroup scope may include the whole job. Kernel/coredump evidence may still be unavailable. Child PID disappearance is evidence to correlate, not a crash diagnosis by itself.

`startup.py` removes gameplay workload: repeated unmodified native startup or an about:blank context-lifecycle control, shared/fresh browser processes, fixed count. Blank passes cannot exonerate the application or engine; blank failures would strongly implicate the harness/engine/environment below native initialization.

First proposed hosted batch: six explicitly dispatched jobs, pinned Playwright 1.57.0/WebKit 2227, Ubuntu 24.04 and exact released heads, max parallel 2, 15-minute cap/job:

1. Full 27 cases, shared process, original order, telemetry on.
2. Same, isolated process per independent case.
3. Full 27 cases, shared process, reverse order.
4. Native-only startup, 24 shared-process iterations.
5. Blank-page control, 24 shared-process iterations.
6. Case 19 alone, six predeclared independent blocks, fresh process each block.

All six are experiments, not release gates. If failure reproduces, compare first failing dependency and frame/process history; then repeat the relevant condition with telemetry off as a separate declared experiment. Only then add one-variable graphics/audio/asset interventions. A reduction in failures without resource or crash evidence remains an association. Order-dependent failure supports accumulated state; a fixed startup phase across fresh processes supports native-triggered behavior but still may be an engine bug.

## Local execution and limits

- Released `test_production_title_experience.js`: PASS, run from the native repository root. Initial wrong-directory invocation failed before testing; corrected invocation is the reported result.
- Harness compilation and assertion/click/wait parity: PASS, 43 assertions unchanged. These validate construction, not browser behavior.
- Pinned WebKit 2227 downloaded; launch blocked by missing GTK4, Graphene, WOFF2, HarfBuzz ICU, Hyphen, Manette and GLES libraries. Host is Debian 13, not the retained Ubuntu 24.04 runner. No native WebKit cases executed locally.
- Attempted reduced system-Chromium objective probe: browser launch failed with socket Operation not permitted before page execution. No DOM-probe result claimed. This is a local execution limitation, not evidence of a product crash.

No native reliability certification, physical Safari/iPhone compatibility claim, or production fix. Approval is required before pushing the diagnostic files and dispatching the six-job batch above.
