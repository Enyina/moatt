# Moatt product acceptance and automation evidence

Updated: 2026-10-27. Scope: browser-based conceptual garment mockup studio. **This document does not certify fabric fit or manufacturing validity.**

## Test contract

All gates apply to the code being shipped, not just the previous release. A pass on an earlier commit is not a pass on a newer commit. Run:

\`\`\`bash
npm install
npm run assets:verify
npm run typecheck
npm test
npm run build
node scripts/check-static-release.mjs
npx playwright install --with-deps chromium firefox webkit
npm run e2e
\`\`\`

CI workflow name: **Moatt CI**. Its verification job runs all steps and uploads browser artifacts. To claim a gate passed, link its run and final commit SHA. Never claim all green while the workflow is queued or running.

## Automation matrix

| ID | Scenario | Gate | Evidence |
| --- | --- | --- | --- |
| DOC-01 | Fresh default document serializes and restores independent front/back layers | P0 | tests/document.test.ts |
| DOC-02 | Older v1/v2 projects migrate without losing wording or changing defaults unpredictably | P0 | tests/document.test.ts; tests/product-readiness.test.ts |
| DOC-03 | Reject image script URLs, unsupported formats and corrupt artwork | P0 | tests/document.test.ts |
| IDEA-01 | Recognize garment, fit, material, color and front/back wording | P1 | tests/concept-to-review.test.ts |
| IDEA-02 | Keep existing artwork and allow undo after idea draft | P0 | tests/concept-to-review.test.ts; e2e/concept-to-review.spec.ts |
| IDEA-03 | Unknown details (embroidery, actual pocket pattern) explicitly require review | P1 | tests/concept-to-review.test.ts |
| IDEA-04 | Pocket style from supported description is editable, versioned and reversible | P1 | tests/construction-options.test.ts; e2e/construction-options.spec.ts |
| ART-01 | Front/back text edited independently, persists across reload | P0 | e2e/studio.spec.ts |
| ART-02 | Upload PNG; reject unsupported large uploads | P0 | e2e/studio.spec.ts; manual input restriction |
| ART-03 | Draw strokes without starting 3D orbit controls | P0 | e2e/studio.spec.ts |
| ART-04 | Selection keyboard nudges and undo/redo work | P0 | e2e/studio.spec.ts |
| ART-05 | Art-only PNG exports remain transparent | P0 | e2e/studio.spec.ts |
| 3D-01 | Backside UV reverses exactly once; front and back V coordinates match | P0 | tests/product-readiness.test.ts |
| 3D-02 | Curved panel includes positive surface depth and rejects missing geometry | P1 | tests/product-readiness.test.ts |
| 3D-03 | Garment detail controls persist and textures/geometries remain bounded over repeated edits | P0 | e2e/studio.spec.ts |
| 3D-04 | Browser without WebGL offers an edit-capable fallback | P0 | e2e/studio.spec.ts |
| LIB-01 | Save, open and delete multiple different projects in the same browser | P0 | tests/product-readiness.test.ts; e2e/product-readiness.spec.ts |
| LIB-02 | Duplicate colorway keeps artwork, changes independently and supports undo | P1 | tests/construction-options.test.ts; e2e/construction-options.spec.ts |
| LIB-03 | Damaged saved entry is skipped, size limit enforced and storage quota failure surfaces | P0 | tests/product-readiness.test.ts |
| BRIEF-01 | User-supplied brand, fabric and measurements survive reload/import | P0 | tests/product-readiness.test.ts; e2e/product-readiness.spec.ts |
| BRIEF-02 | Export both design sides and unverified manufacturing questions | P0 | tests/concept-to-review.test.ts; e2e/concept-to-review.spec.ts |
| BRIEF-03 | HTML and unsafe image URL injection in supplied information is rejected/escaped | P0 | tests/product-readiness.test.ts; e2e/product-readiness.spec.ts |
| MOB-01 | Functional mobile tools and responsive viewport | P0 | e2e/construction-options.spec.ts |
| BUILD-01 | TypeScript, tests, static build, licensed 3D asset and publishable artifact are reproducible | P0 | GitHub Actions, current HEAD |
| DEPLOY-01 | Published website and mannequin asset actually load at production URL | P0 | GitHub Pages deploy and smoke jobs; open |
| DEVICE-01 | Touch interactions on physical iOS/Android device, accessible keyboard use and realistic appearance | P0 | Independent physical and visual acceptance; open |

## Release decisions

- **Release-blocking P0:** any saved-artwork loss, misleading manufacture-ready claims, mismatched front/back preview, missed browser controls, failed build/typecheck/asset verification, or failed cross-browser behavior.
- **Important P1:** convenience features may be deferred with explicit limitations, but they must not damage P0 behavior.
- **Cannot be proved by automation alone:** real fabric fit and drape; supplier-approved measurements, calibrated printable regions; physical touch/GPU performance on an actual device; creative attractiveness and customer preference; actual manufacturer feedback. These need valid external samples, real-device runs, or customer acceptance.
- Browser-local library is **not cloud storage** or collaborative sharing. The printable supplier review is **not a factory tech pack**. The rule-based text parser is **not generative AI**. The rounded surface is **not cloth simulation**.

## Release status for this change

Implemented in branch \`feat/concept-to-supplier-review\`, PR #5. New functionality is committed; only report verification as passed after the *latest branch SHA* completes CI. Production publishing and external garment accuracy verification are separate gates.

## Engineering learning

Evidence from existing tests demonstrated that a 3D canvas can display a reversed back-side decal while all smoke tests pass. Separate the material UV contract from the drawing surface, unit-test mirror orientation mathematically and always capture paired front/back screenshots. Candidate Moatt-specific rule; promote to shared 3D guidance only after cross-device evidence.


## Visual fidelity checkpoint — October 27, 2026

- The default figure is a locally authored, smooth, neutral studio display mannequin. The earlier licensed low-poly mesh can still be chosen explicitly for comparison.
- Procedural cotton/denim/satin texture tiles are deterministic and checked with unit tests. Physical material profiles use different bump strengths, roughness, sheen and satin anisotropy.
- Browser tests verify selecting the studio versus classic mannequin, selecting all three fabrics, and capturing material screenshots. A canvas snapshot must *actually change* across fabrics. This goes beyond assertions that a dropdown value changed.
- Mannequin and garment visuals remain approximations. No photogrammetry, skin realism, cloth draping solver, fabric scanning, body measurement standards or apparel print calibration are claimed.
- Evidence is tied to the exact commit's CI. Independently inspect screenshot artifacts at normal zoom and enlarged fabric close-ups before final aesthetic sign-off.


## October 28 — Volumetric clothing and mannequin acceptance

- **VOLUME-01:** Front/back surfaces have finite, smoothly shaded 3D depth and outward normals, not a flat 2D polygon. Unit tests inspect bounds, normals and mesh budgets.
- **VOLUME-02:** The front and back texture coordinates are each readable in their viewing direction, and changing sides never alters the stored 2D artwork.
- **VOLUME-03:** Sleeve length and size modify real sleeve geometry. The neck remains an opening surrounded by a band.
- **MANNEQUIN-01:** Arms, legs, head and torso use connected, continuous sculpted surfaces instead of visibly separate elbow and knee balls.
- **BROWSER-01:** Front/back 3D scenes and different garment configurations are captured across supported browsers; graphical fallbacks must remain functional.
- **PERFORMANCE-01:** Preview stays demand-rendered; resource counts, texture allocations and re-render after edits remain bounded.
- **VISUAL-OPEN:** Screenshot appearance, realistic folds and actual mannequin anatomy still require human review and, for physical fit, independent external measurements. Passing vertex tests is **not** proof of visual realism.

## Presentation export acceptance — October 28, 2026

- **PRES-01:** A full-width editable-project presentation shows front and back in a single canvas regardless of WebGL support.
- **PRES-02:** The export produces a real, opaque PNG at 2400 x 1500, with the current garment name, color, material and independent side artwork.
- **PRES-03:** A user switching between regular/oversized, hoodie/T-shirt and textile choices sees different rendered pixels; images are not generated from inert controls.
- **PRES-04:** Preview/export are independent of the 3D renderer; moving between 2D/3D/presentation does not discard artwork or switch the saved side.
- **PRES-05:** Screen-reader labeling and responsive preview should remain usable; visual aesthetic assessment and practical third-party acceptance remain distinct from passing CI.

## Licensed human-reference acceptance — 2026-10-28

- **ASSET-01:** `npm run assets:verify` downloads and verifies three pinned GLBs from upstream published CC0-generated assets. Reject git-blob SHA, file-length or GLB-header mismatches; fail the required CI asset stage.
- **ASSET-02:** Assets are bundled with the static Next site and can be loaded offline after deployment without third-party browser calls.
- **ASSET-03:** New Human fit reference uses original body and fitted T-shirt or hoodie GLB without GPL source-code copying.
- **ASSET-04:** Browser must display explicit loading or fallback and allow returning to the editable procedural studio mannequin; no loss of saved artwork.
- **ASSET-05:** A reference asset rendering is **not evidence of applied print artwork**, exact fit, pose/size change, cloth simulation or verified manufacturing dimensions.
- **VISUAL-OPEN:** Screenshot inspection must confirm the original body/garment assets actually align, have appropriate camera scale, and do not expose skin through the garment. Automated load success alone is not sufficient to mark quality accepted.

## Usable-first layout acceptance — October 30, 2026

- **LAYOUT-01:** A small chest mark, centered statement and front/back composition are editable, within the illustrative region and have readable ink relative to the selected garment.
- **LAYOUT-02:** Adding a layout must preserve all existing layers and remain reversible through Undo. All sides remain independent.
- **LAYOUT-03:** Top, center, bottom and proportional fit cannot silently claim an oversized element is inside the suggested guide. Locked layers are not moved.
- **LAYOUT-04:** Copy to the opposite side creates an independent layer, unique ID and retains data; original is unchanged.
- **LAYOUT-05:** New browser tests cover keyboard/touch-accessible buttons, undo, reload, front/back independence, save to browser and presentation preview on desktop and simulated mobile.
- **LAYOUT-06:** Full CI must pass the exact branch head and screenshots need review; this does not close the separate 3D garment geometry, print DPI, factory sizing, deployment and real mobile-device blockers.

Official benchmark references and observed-versus-remixed decisions are in `docs/REVERSE-ENGINEERING-USABLE-FIRST-2026-10.md`.

## Focused design inspection — October 30, 2026

- **DETAIL-01:** Overview preserves the original two-sided high-resolution presentation. Front and back detail modes show one garment mockup AND the original side's magnified artwork simultaneously. Never replace the source artwork or mislabel the magnified crop as printing scale.
- **DETAIL-02:** Crop of visible artwork includes rotated layers and multiple visible items, remains within the 1024 artwork coordinates and never mutates the project.
- **DETAIL-03:** Zoom − / Zoom + / Fit board operate on CSS preview size only. Export keeps identical source pixels/dimensions regardless of on-screen zoom.
- **DETAIL-04:** Keyboard and mobile zoom controls are accessible; preview controls cannot cover artwork, scrolling remains possible at 200% zoom.
- **DETAIL-05:** Each review export uses its currently selected view, with an explicit `-front-detail` or `-back-detail` name. A PNG's representative pixel must equal the preview canvas pixel.
- **DETAIL-06:** Existing first-use design, saved layers, presentation exports, WebGL fallback, text styles and undo/redo remain unchanged. Desktop/mobile cross-browser screenshots are mandatory.
