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


## 2026-10-27 — Style choices need visible rendering evidence

Observation: changing only roughness values did not create recognizable cotton, denim and satin textile detail. The previous GLB figure was verifiably loaded, but looked blocky and distracted from the garments.

Implementation: keep the pinned original GLB as an explicitly selectable reference; default to a consistent, faceless studio figure. Add deterministic, material-specific weave height maps and matching 2D preview color variation; model sleeves and neckline with softer curves and garment-specific finishing. Verify render output differs between material settings using browser-captured pixels and screenshot comparisons, without claiming scanned PBR quality.

Candidate reusable guidance: any style or material control must lead to a real, testable change in rendered output, not just internal state; validate appearance separately from GPU/render correctness.

## 2026-10-27 — Static 3D editors should not render forever

While adding fabric bump maps, smoother garment geometry and studio lighting, browser tests under software WebGL began timing out despite unit/type/build success. Updating 3D geometry every frame or using realtime shadow maps is not justified when the scene remains static between user actions.

Improvement: render the WebGL preview on demand, call renderer invalidation after asynchronous canvas-texture updates and after camera resets, retain OrbitControls change invalidation, and update GPU counters on each actually rendered frame. Browser tests now assert the mannequin is not redrawn continuously while idle and that changes cause new rendered frames. This is a candidate practice until CI on the final revision passes; review on real mobile hardware remains essential.


## 2026-10-28 — Replace the source of flat-garment previews

Observed: the layered front/back shapes were still flat compared with a real sweatshirt. Changing only outline curves, bump strength and lights could not address the underlying geometry.

Implementation: create a continuous, rounded torso from height-dependent elliptical sections; generate both sides with their own UV maps, tapered 3D sleeves and real open neck/cuff geometry. A connected matte mannequin replaces visibly segmented display limbs. Keep artwork in the original canonical document and project it onto both sides without changing the user's file schema. Model generation has finite-vertex budgets, disposal contracts, front/back UV normal checks and screenshot-based browser coverage.

Known gaps: these are original approximations rather than scanned bodies or cloth-simulation CAD. Source inspiration: MakeHuman makes its asset models CC0 while its application source is AGPL/GPL; Poly Haven publishes CC0 fabric assets. We did not import that software, its code, or scanned texture assets in this change. See https://www.makehumancommunity.org/about/license.html and https://polyhaven.com/license.

Review status: only mark quality green when fresh CI and actual screenshot inspection on this exact revision agree.


### Visual defect found in browser screenshots

The first complete volume preview passed automated tests but displayed triangular gray shoulders, because upper-arm mannequin geometry was visible through the new sleeve mesh. Rather than declaring this acceptable, subsequent revisions reduced excessive sleeve volume, joined the mannequin neck, adjusted hood placement and shortened the exposed arm geometry based on sleeve length. This must be checked from actual front/back screenshots, not only triangle counts or GPU memory. The body is still an illustrative display form, not a measured fit model.

## 2026-10-28 — Useful presentation must not be hostage to limited 3D models

Evidence: prior screenshot reviews found the mannequin too stylized to be a persuasive fashion design outcome. The existing app had a usable layer editor but exported flat 1024-square art or a mannequin screenshot that inherited those visual defects.

A separate, deterministic **2400 x 1500 two-sided presentation** now renders offline in a standard 2D canvas. It uses the existing versioned front/back artwork and silhouette choices, adds garment outlines, shading, material grain and explicit concept-only labeling. It does not mutate the project. Browser regression decodes the actual PNG and checks both halves, actual image dimensions and pixel changes when garments and materials change. The presentation requires no WebGL and retains the original editor.

Limitations: original authored illustration; not a licensed garment photo, physically correct textile simulation, paper pattern, or a guarantee of print placement. Quality verdict requires examining the actual exported image; green tests alone are insufficient.

## 2026-10-28 — GLB load success is insufficient for clothing visual acceptance

The first source GLBs loaded and passed tests, but screenshots showed a human model wearing a blue-dyed top, bare legs/feet and skin clipping through sleeves. This was not a usable clothing presentation. Extend the optional reference with source-verified jeans/shoes, give garment fabric the selected Moatt color, mask underlying body intersections and map independently editable 2D artwork onto the fitted top. Tests now must verify that changing actual text changes rendered 3D pixels; visual inspection remains mandatory. Original upstream generated GLBs are documented CC0; no upstream GPL code is imported. Do not generalize physics correctness or print calibration from this.

## 2026-10-28 — Fix fragmented prints using original garment UV islands

A completed 140-browser-case run had no functional failures, yet screenshot review rejected the hoodie: lettering was fragmented across the chest (e.g. "ST RY 2026") and the garment still had unfinished shoulders. A positional planar shader mapped 1024px artboard pixels from local X/Y; inspecting the *actual* published CC0 hoodie GLB identified stable separate front (approx U=.49-.69) and back (U=.085-.28) UV islands. Switched the fitted-reference print to a unique sampled native UV vertex attribute, normalized against selected chest intervals. Keep an explicit torso/side mask and manufacturer-calibration warning. Added pure mapping tests grounded in numerical samples from the pinned source GLB and browser pixel checks. This is NOT yet evidence of attractive print quality; accept only after reviewing newly captured screenshots from the exact implementation.
