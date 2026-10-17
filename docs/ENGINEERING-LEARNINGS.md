# Moatt engineering learnings

## 2026-10-17 — Interaction ownership
Status: candidate / not validated on the current prototype.
Observation: A previous Moatt implementation was reported to rotate the mannequin while drawing.
Rule candidate: gestures must belong to an explicit active tool, with OrbitControls disabled during painting.
Verification: browser regression covering mouse and touch, front and back.
Central destination: `rules/categories/3D-EDITORS.md`.

## 2026-10-17 — Evidence before status
Status: accepted reporting practice.
Observation: GitHub commits verify persistence of files, not that builds and interaction tests pass.
Rule: separate committed, tested, built, browser-tested, and deployed statuses.
Central destination: `rules/CORE-ENGINEERING.md`.

## Ongoing process
For every meaningful defect or architectural decision: record observed behavior, reproducible evidence, cause, user impact, test, selected scope and proposed rule change. Keep reusable sanitized rules in the private AI config repo, not inside project-specific assumptions.


## 2026-10-17 — Integration checks identified mistakes early
Status: validated by GitHub Actions.
Evidence: GitHub Actions run 39025853488 passed TypeScript, five document unit tests, the production build, and 10 desktop/mobile Playwright cases.
Learnings: Keep Vitest and Playwright discovery separate; use exact accessible locators when labels overlap; scroll canvas into view before touch simulation; distinguish persisted design data from transient view selection.
Caveats: These checks do not measure asset fidelity, sustained GPU resource consumption, or real device hardware performance. The mannequin is still stylized. Do not claim professional garment construction.
Central scope: shared testing workflow and web/3D editor category.

## 2026-10-17 — Garment surface and print-bounds distinctions
Status: implemented; visual-fidelity validation remains open.
Observation: Rectangular geometry made the 3D preview misleadingly different from clothing. A garment-outline ShapeGeometry can replace a rectangular front/back surface without adding cloth physics, but this remains a conceptual mockup.
Rule candidate: Explicitly distinguish artboard coordinates, preview UV mapping, recommended artwork boundaries, and *verified production print dimensions*. Never present one as another.
Verification: typecheck, rendering smoke/browser test, and visual comparison on real devices. Real print measurement calibration deferred.
Scope for promotion: 3D editor category once visual validation is performed.
