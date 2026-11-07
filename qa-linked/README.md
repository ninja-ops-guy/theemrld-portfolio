# Independent linked-story QA

User request: test thoroughly. This branch adds tests only. It does not alter either runtime candidate or deploy anything.

Pinned products:
- Portfolio PR #46: 0a6f9bf6481f321b52d7a496da02cf62cc193820
- TechOps Hero PR #99: b8b2378f3cf0b84bfc94e1472b8e26d7043a7445

The workflow runs the existing 37 logic tests, the entire native production gate, independent semantic probes, and 22 browser cases in Chromium, Firefox and WebKit. All six return-section variants are traversed through actual UI choices and keyboard input. Prerequisites use declared native API fixtures; enemies are removed only to isolate side-operation movement. This is not a full from-scratch gameplay or real-iOS certification.

Fault injection includes unavailable browser storage, denied writes, missing Web Locks, a failed optional companion import, damaged derived snapshots, damaged completion receipts, old preview imports, same-run native tab ownership, and reload during an incomplete operation. The source-owned Good Dogs completion path is invoked directly rather than simulating its result by completing acts in a test fixture.

Failed assertions are retained with screenshots and observations, and every case runs even after another fails. Product fixes must be made separately and retested; a green earlier narrow suite is not substituted for these outcomes.
