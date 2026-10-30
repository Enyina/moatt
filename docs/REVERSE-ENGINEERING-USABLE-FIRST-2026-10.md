# Moatt reverse-engineering notebook — usable-first wave (30 October 2026)

## Goal
Make a newcomer able to produce a coherent two-sided fashion concept, edit it, compare colorways, save it, and share an attractive design board in one session. This is a conceptual mockup editor, **not verified garment CAD or a factory production tool**.

## Observed public product behavior versus Moatt adaptation

| Public product and official reference | Observed capability | Existing Moatt before this change | Original remix |
| --- | --- | --- | --- |
| Printful Design Maker: https://help.printful.com/hc/en-us/articles/50264179910673-How-does-the-Design-Maker-work | Editable placements, reusable product templates, artwork positioning, mockup preview and print-quality warnings | Front/back layers, suggested guide and multi-project library; no one-tap placement | Safe-guide alignment and non-destructive editable layouts; labels explicitly say dimensions are **not** calibrated |
| Printify Product Creator: https://printify.com/product-creator/ | Reusable layouts, independent layered print areas, mockups, color choices and a beginner-friendly editor | Basic layer editor and colorways, but blank-canvas setup is slow | Three fast concept starting compositions without replacing prior work |
| Kittl T-shirt maker: https://www.kittl.com/create/t-shirts | Typography, editable templates, placement tools, mockup/export workflow | Simple text with limited font styling, two-sided PNG and board already exist | Use readable prepositioned text compositions and direct selected-layer controls; do not duplicate advanced text effects prematurely |
| Kittl linked mockups: https://help.kittl.com/editing-and-design/mockup-generator/ | Original artboard stays linked while product scenes update | One canonical design document powers multiple derived views | Preserve canonical front/back layers and leave scene variants for a later verified phase |
| CLO: https://www.clo3d.com/explore/best-fashion-cad-3d-apparel-design-software-2026 | Related 2D patterns, 3D visualization, fit/simulation and technical design review | Current Moatt models are cosmetic and not physically validated | **Do not** claim supplier-ready fit, drape or calibrated print size based on viewport controls |

Public docs are behavioral research, not a license to copy source, commercial artwork, models or interface layouts.

## This slice — functionality added
- **Small chest mark:** quiet brand placement on front.
- **Centered statement:** one editable headline suitable for a merch concept.
- **Front + back branding:** two linked-by-intention but independently editable text layers, with existing artwork preserved.
- **Place selected artwork:** top, center, bottom or proportional fit to the current 1024px suggested design guide.
- **Copy selected artwork:** independent copy to the other side, preserving text, image and drawing data; unique layer identity.
- Controls remain keyboard-accessible buttons and use the existing undo/redo and saved document system. No new schema or browser storage requirements.

## Limits and honest status
- Safe guide coordinates do **not** correspond to real centimeters, actual printable locations or supplier-required file quality. Unknown supplier dimensions remain unknown.
- No new fonts, paid creative assets, "AI generation", automated background removal or real garment physics are implemented in this slice.
- All work is in a review branch until the exact head passes tests and visual inspection. A commit/PR is not a deployment.
- Existing 3D model quality and physical device acceptance are separate unresolved gates.
- Verify any prior stacked PR claimed as merged actually exists in current main. GitHub merge status alone is not sufficient when a PR was targeted at another feature branch.

## Next reusable workflows ranked by user outcome
1. Finish **one complete founder journey** (idea -> layout -> garment/colorway -> front/back preview -> save/reopen -> presentation PNG) with a real new-user completion test.
2. Build two coherent premium, licensed garment scene families (product-only T-shirt and hoodie). Accept screenshots only after shoulder/hem/artwork review.
3. Better typography: text wrapping, font selection, drag handles and guaranteed position correspondence across 2D/3D/presentation.
4. Reusable brand kits / comparisons with thumbnails and exportable multi-colorway proof sheets.
5. Honest supplier-supplied print region dimensions and effective artwork DPI checks, which must default to **unknown** until verified.

**Exit criterion for this wave:** non-destructive editable templates, a full layout workflow, accurate side separation, save/export regression, mobile browser tests, no fabricated production measurements, and a verified CI run tied to its exact commit.
