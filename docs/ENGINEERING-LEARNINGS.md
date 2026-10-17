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
