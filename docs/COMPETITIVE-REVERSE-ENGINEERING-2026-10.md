# Moatt — evidence-led feature audit and engineering roadmap
**Status:** Research/decision proposal, not a release or an approval to merge unverified features.  
**Date:** 30 October 2026  
**Goal:** Make Moatt the first tool an independent clothing-brand founder chooses to turn an original concept into an editable, credible garment visualization and an actionable sampling brief.

## 1. Method and boundaries

Applied applicable rules from `Enyina/ai-engineering-config`:
- `AGENTS.md`: understand → investigate → evidence → eliminate → verify → recommend → learn; Reverse Engineering First.
- `rules/categories/3D-EDITORS.md`: one versioned source of truth, honest visual claims, paired front/back validation, bounded resources, screenshot inspection.
- `knowledge/patterns/catalog.json`: compare canvas-first, panels and guided editor approaches against measured first-time success; canonical document and derived views.
- `projects/moatt.md`: compare garment visualization and virtual try-on with current products.
- Moatt `AGENTS.md`: employer and non-Moatt rules are excluded; no protected assets or proprietary product code copied.

**Reverse-engineering method:** inspect public official product documentation and visible workflows, infer user-facing contracts, design an independently implemented equivalent suitable to Moatt. The sources below do not grant permission to copy code, libraries, branded screenshots, or garment assets.

## 2. Confirmed current Moatt baseline

Observed in `main` as of the audit:
- Versioned canonical `StudioDocument`, front/back text/image/stroke layers, draw/select/erase, undo/redo and keyboard controls.
- Two garments: T-shirt and hoodie, with rough fit/sleeves/hem/neck/pocket switches; cotton/denim/satin **appearance approximations**, not validated materials or tailoring.
- Rule-based concept → editable draft (not real generative AI); local design library, duplicated colorways, local autosave, import/export JSON.
- Flat PNG, 3D screenshot and 2400 × 1500 two-sided presentation; print-safe warnings, contrast warnings and explicit contrast repair.
- User-entered fabric/construction/sizing brief and printable *supplier conversation sheet*, expressly not a production tech pack.
- Static local-first browser app; no real cloud sharing, cross-device synchronization, authenticated collaborative approvals or validated factory output.
- Current live `main` does **not** have the new licensed fitted garment reference. PR #11 (asset reference) and stacked PR #12 (garment print) are open.
- Exact PR #12 head observed `068142654877b772aebbe3f3750232d5ca56a631`: CI run 40727227050 failed **3 browser checks** (texture delta +4 versus a test budget +3), despite 57 unit and 145 other browser checks passing. Earlier PR #12 commit 02aa9777 passed 54 unit / 140 browser checks but its rendered print was visibly misplaced. **Neither result is proof of production readiness.**
- The accepted production website, physical devices, garments, textiles, and manufacturer-grade print/sizing standards remain unverified.

## 3. Competitive workflows reverse engineered from official sources

| Reference | Publicly demonstrated workflow | Differentiated capability Moatt lacks or offers only approximately | Original adaptation |
|---|---|---|---|
| **CLO 2026.0/2026.1** | Sketch directly on an avatar → pattern; linked 2D drafting, seam construction, fabrication and visual simulation; grading revisions and fit/strain tools | Moatt has sliders and meshes but no source-backed pattern pieces, seam graph, or fabric drape/size validation | Begin with 2–3 reviewed garment blocks and honest construction dimensions. Defer true cloth solver until it can be validated, never imply physics |
| **Browzwear VStitcher** | Fabric and trim library → 2D/3D garment fitting, grading and tech-pack collaboration | Moatt fabric selection primarily changes visual shading and cannot verify drape or size accuracy | Separate material appearance from physical fabric specifications; add measured swatch references and sample approval states |
| **Printful Design Maker** | Choose product/decoration method → place artwork in approved regions (front/back/sleeve/labels), quality checks → reusable template and mockups | Moatt's safe area is a suggested artboard box; no actual decoration-method print region, DPI at real size, sleeve/label print surfaces or supplier file requirement checks | Add per-template print zones and explicit method/print-resolution checks. Show “unknown” if a supplier has not provided actual dimensions |
| **Kittl** | Link original artboard to multiple mockups; changing design refreshes them; edit mockup placement while preserving art | Moatt has one editable source and several previews, but scene positions, photo quality, connected outputs and variation exports are limited | Adopt immutable source artwork + multiple bound, saved views (front/back/close-up/lifestyle) with one update propagating to each |
| **Pacdora** | Pick polished, varied apparel mockup, customize graphics/color/fabric → impressive image/video/shareable outputs | Limited template library; rendered model, fabric folds and output aesthetics fall below competitive product-shot quality; no motion video or shareable link | Ship 2 genuinely excellent templates and 6 canonical angles before adding categories. Use legal high-quality assets and actual screenshot acceptance |
| **Techpacker** | Build tech pack from flat sketches, measurements, bill of materials, construction notes and colorways; save versions for supplier revisions | Moatt has prose fields and a discussion sheet, not structured POM/BOM, graded measurements, tolerances, revision approval or supplier-specific requirements | Build an incomplete-by-default *sampling specification draft* with measured inputs and explicit approval workflow; never fabricate values or label it manufacturing-ready |

Official references:
- CLO 2026.0 sketch, pattern, strain: https://www.clo3d.com/en/resources/notices/1374
- CLO 2026.1 revisions/grading: https://www.clo3d.com/en/resources/notices/1442
- CLO modular blocks: https://support.clo3d.com/hc/en-us/articles/115015824287-Create-Custom-Blocks
- Browzwear product: https://browzwear.com/products/v-stitcher
- Printful placement and quality: https://help.printful.com/hc/en-us/articles/50264179910673-How-does-the-Design-Maker-work
- Kittl linked mockups: https://help.kittl.com/editing-and-design/mockup-generator/
- Pacdora apparel styles and exports: https://www.pacdora.com/resource/clothing-design
- Techpacker versions: https://helpcenter.techpacker.com/hc/en-us/articles/42614589516179-How-to-create-Tech-Packs
- Tech pack specification coverage: https://techpacker.com/blog/design/how-to-simplify-generating-and-managing-tech-packs-2/

## 4. Feature-gap priority by user outcome

Evidence label: **implemented** means code observable in current `main`, **partial** means an approximation that cannot satisfy the intended use, **missing** means no supported implementation found, **experimental** means unmerged and unaccepted.

| Priority | Missing / incomplete user capability | State | Why it matters | Acceptance |
|---|---|---|---|---|
| **P0-A** | Recognizably realistic base garments that fit their display form (seams, collar/hood, cuffs, sleeves, silhouette and believable material response) | **Partial / experimental** | Current screenshots lose the user's confidence before printing or sharing | Independent visual QA: front/back/side 2x templates, no clipping, unfinished shoulders, floating limbs, faceted folds or obviously wrong artwork |
| **P0-B** | Artifact alignment: every front/back layer correctly follows garment without mirroring, clipping, shifting to hem or hiding under texture | **Partial / experimental** | Breaks the actual design | Compare rendered front/back pixels after text upload/move, color change, save/import/reopen and alternate view; fail on misplaced letters |
| **P0-C** | Honest, dependable garment and fabric previews | **Partial** | A mockup must be good before someone trusts a supplier brief | Exact high-resolution reference images, real-device GPU/frame benchmarks, graceful 2D output; remove unsupported “fit” claims |
| **P1-A** | Verified garment blocks with linked construction parameters | **Missing** | Founder should alter the *actual garment*, not only an image | Tweak body width, length, cuffs, neckline, hood/pocket; geometry AND consistent front/back prints visibly update; realistic limits |
| **P1-B** | Per-decoration printable regions, resolution and minimum-size warnings | **Missing** | Prevents designs that cannot be used for production | For selected known template/method, report art effective DPI and exact allowed area; otherwise show “not calibrated”, never invent centimeters |
| **P1-C** | Original artwork linked to multiple saved mockup placements and reusable brand scenes | **Partial** | Brand founder needs a usable shareable set, not one crude angle | 6 views from same artwork, one update propagates, high-res export with preserved transparent source |
| **P1-D** | Guided first-use path with strong garment presets | **Partial** | Requires lower learning effort than generic design tools | Brand founder completes a first useful hoodie, saves it and exports both sides unassisted; real usability sessions |
| **P2-A** | Structured sampling pack: flats, POM, tolerances, fabric/trim BOM, decoration method, size range, colorways, change log, approval state | **Partial** | Factory can't quote or sample accurately from prose and image | Required blank/unknown values flagged; supplier can compare two versions and identify unanswered questions |
| **P2-B** | Shareable review and comments pinned to a garment side or design revision | **Missing** | Real feedback loop without screenshot/email chaos | Read-only review link; annotations version-linked; permission and revoked-link tests |
| **P2-C** | Collection workspace (styles, fabric swatches, colorways, comparison, shortlist) | **Partial** | Brand consistency and repeated creation | Duplicate style into colorways and share a 3-style collection with no mixed artwork |
| **P3** | Simulated cloth, true body measurements, graded patterns, verified fit and automated sewing-pattern generation | **Missing** | True advanced CAD differentiation but high risk/cost | Only after external pattern/size/fabric validation; don't ship simulated claims without lab/physical sample evidence |

## 5. Build strategy — pick one instead of layering visual tricks

**Option A: More hand-built procedural meshes and GLSL on the current 3D foundation.** Lowest integration effort, but prior PR screenshots repeatedly showed odd sleeves, hips, mannequin anatomy, warped text and fabric artifacts. This has failed user-visible acceptance several times. **Do not prioritize.**

**Option B: Small, legally vetted garment block library, correctly authored print surfaces and calibrated render presets.** Choose 2–3 high-demand styles (boxy heavyweight tee, oversized pullover hoodie, zip hoodie only if assets pass review). Each block has front/back art mapping, size/material metadata, variant slots, LOD and camera angles. Canonical source design stays unchanged. Start with product-only view; human display form is optional. **Recommended first** because it can achieve a credible founder workflow without falsely claiming CLO physics.

**Option C: Full garment CAD/pattern simulation stack.** Highest potential for fit/manufacturer legitimacy, but major engine and validation investment with licensing and performance exposure. Explore once base visual workflow, brand-founder preference and pattern partnership are proven. **Not the next implementation.**

**Exact P0 implementation order:**
1. Hold PR #11/#12. Investigate PR #12 GPU texture regression (+4 vs allowed +3 across Chromium, mobile, WebKit), fix the real lifecycle problem or justify a measured budget with warming and steady-state baselines. Do not relax assertions to force green.
2. Build *one* excellent hoodie reference: approved geometry source/license, correct shoulder/hood/hem, consistent UV map or physical decal, high-res PBR materials, front/back and three-quarter exports. Reconcile source mesh coordinate systems against actual GLB vertex data.
3. Lock a **visual golden set**: default, dark fabric with light lettering, light fabric with dark lettering, graphic image, oversized/regular, front/back, and both mobile/desktop. Automated screenshot diff must flag geometry and artwork regressions, supplemented by actual human acceptance (pixel difference alone cannot prove aesthetics).
4. Prove a complete **idea → edit garment → colorway → visible front/back → save → reopen → export** workflow. Choose an immutable canonical design and derive all output from it.
5. Only after step 4, build calibrated decoration zones and mockup-scene templates, then structured sample packs.

## 6. Measurable acceptance contracts

These are proposed targets, not completed results:
- **Fidelity:** reviewers can identify garment style and sleeve/hood construction in every reference angle. No exposed body geometry, clipping, mirror-impaired text, floating joints, hem-placed logos or disconnected arms.
- **Artwork:** 100% of seeded projects preserve side, design coordinates, order and colors across editing → 3D → board → JSON export/import → reload. Every defined print region displays an unambiguous unit/method provenance.
- **Performance:** measure median and P95 changes in paint/view switch/orbit on actual mid-range mobile plus Apple Silicon; publish budgets only after measurement. No unbounded GPU texture or geometry increase across >50 sustained edits, after initial load settles.
- **Reliability:** no data loss on autosave, storage quota, import failure, interrupted render, non-WebGL browser, bad/missing GLB, and changing garments rapidly. Every failure shows an actionable fallback.
- **Consumer preference:** 5 independent clothing-brand founders, all attempt a realistic hoodie with front/back branding, a second colorway and an exported proof; target ≥4/5 finish unaided and ≥4/5 prefer that specific workflow to their current alternative. This is a gate, not an achieved statistic.
- **Sampling honesty:** manufacturer-facing documentation is labeled an unverified concept until all required measurements, BOM components, print dimensions, materials and approvals have actual sources.

## 7. What NOT to do next

- Add more prompts or call the rule-based parser generative AI.
- Add 15 new garment types before one hoodie looks and edits credibly.
- Claim fabric physics or body fit from shading, GLB loading or passing Playwright.
- Copy CLO/Pacdora/Printful assets or source without licensing.
- Merge PR #12 on an older passing SHA while newer head is red.
- Replace the versioned canonical document with derived geometry data.
- Treat a successful GitHub Action or static deployment as validated customer preference.

## 8. Source-of-truth review and follow-up

The first product decision should be a **quality bar for the hoodie**: a five-image reference set and seeded front/back design with actual visible output. After that, scope only high-value stories that improve it. Keep the open experimentation out of `main` until current-head tests pass and screenshots pass a human visual review. Use evidence-linked lessons as *proposals* to the AI repo; do not silently activate a global rule.

Last observation: 30 October 2026, GitHub branch `feat/reference-artwork-projection` SHA `068142654877b772aebbe3f3750232d5ca56a631`, PR #12, CI run 40727227050.
