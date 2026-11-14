# Revision G: approved nine-page publication plan

Planning and QA receipt only. This draft PR does not publish art or alter live configuration. Source upload, manifest registration, qualification and release remain separate gated operations.

## Exact candidate
- PDF SHA256: 4ce5a51c5ddc7dc0b8ed4ee90c443101843cb45cc6b179917109bcd94af33231
- PDF bytes: 525173826
- Source ZIP SHA256: 6071675a4a66b5a78e53b286eaa81ed3eb7969634ca7fc620e3f7d1103c6e460
- Source ZIP bytes: 380015345
- Source PDF SHA256: c18407af88e9ba6dbb5ed4707fc998bd19e12d31c59b2f92b87f58d8a0bfa50b
- Existing base-media identity: aa8c132 (abbreviated reference; immutable full identity belongs in registration manifest).

## Authorized scope
Only pages 6, 7, 8, 16, 28, 35, 36, 39 and 45. Lettering: 6, 7, 8. Art: 16, 28, 35, 36, 39, 45.

Independent assembly review found all nine approved pages exactly matched expected lossless WebP renders at 5x, all 307 other pages unchanged at 72 dpi, and extracted text and bookmarks preserved. Original source byte prefix is retained. Close and phone views were reviewed; these targeted checks do not establish full-book correction or resolve held findings.

Pages 10, 17, 29, 31, 37, 41 and 42 remain unchanged and HOLD. This is not a claim to integrate the latest Batch21 master. The source c184 PDF and aa8c132 media remain the comparison baseline; no unrelated live material is authorized for change.

## Next gates
Register an exact schema-v2 current-only manifest through a separate main registration PR; upload and verify the exact source ZIP; stage and qualify the target candidate; review exact head and manifest before authorized publication. Do not infer publication from this planning receipt or a green partial test.