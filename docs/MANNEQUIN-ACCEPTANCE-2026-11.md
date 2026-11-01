# Moatt mannequin-first quality gate

## Why
Visual review of the previous mannequin and garment reference found oversized head proportions, high-ending hands, angular garment shoulder/hem outlines, shiny/harsh lighting and a mannequin sometimes interfering with the user's clothing design. A green WebGL load test alone does not establish natural-looking anatomy.

## Legitimate reverse-engineering sources
- three.js official custom BufferGeometry guide: https://threejs.org/manual/pages/custom-buffergeometry.html — indexed geometry, normals, duplicated UV seam vertices and manual seam smoothing.
- Ghost-mannequin apparel references (for the target of a clean clothing silhouette): https://www.photorobot.com/tutorials/how-to-photograph-a-zip-up-hoodie and https://www.perfectretouching.com/blog/invisible-ghost-mannequin-photography
- The existing licensed CharacterCreator GLBs are pinned and attributed in `docs/ASSET-PROVENANCE.md`. Their source is GPL, but independently obtained original CC0 output assets can serve as reference. No upstream code is copied.

## This branch — mannequin-specific scope
- Smaller balanced neutral mannequin head and longer natural hand silhouette, sculpt-like matte finish (not an anatomical scan)
- Smooth radii instead of piecewise-linear changes at each control ring, explicit mesh end caps and UV seam normal matching (front/back/side shading)
- More balanced studio lighting, with accessible face-on and side-profile camera presets; save/export project schema is unchanged
- Bare full-body mannequin front/profile inspection without sleeve-hidden arms; front, back and side screenshot evidence for shirt and hoodie across Chromium, mobile, Firefox and WebKit where WebGL is available
- Existing garment-only view remains the default: user can choose Studio mannequin or Human reference without losing artwork

## Acceptance criteria
1. Consistent approximately seven-to-eight-head display figure without exaggerated head, shoulders, elbow bumps or abrupt anatomical transitions
2. No obvious open end rings, jagged seam shading, detached joints or sleeve/skin clipping at front/back/profile
3. T-shirt and hoodie fit shapes and artwork still render and can be independently edited
4. No WebGL texture/geometry leak; no ongoing idle render loop; graceful non-WebGL fallback remains accessible
5. Exact-head asset integrity, type checking, lint, units, static build and Playwright pass; inspect actual screenshot artifacts before release
6. Physically measured fit, detailed facial anatomy, true real-world drape and human likeness are **not claimed**. A perfect photorealistic or production mannequin requires calibrated/rigged higher-quality assets and independent aesthetics review.

This branch is deliberately isolated and does not auto-release.

## Screenshot-driven second correction pass

The first exact-head CI was green, but the actual Chromium screenshots **failed visual review**. They visibly showed detached upper-arm openings, a neck sphere segmented from the head/torso, oversized ball-shaped feet and a floating half-dome hoodie hood behind the head. Those are real product defects, not test-only artifacts.

Corrections: overlap the arm roots into the shoulder torso, model the neck directly into the torso geometry, remove the decorative neck ball, flatten shoe/foot forms and attach a folded hood cowl at the garment's rear neckline. A geometry regression test now checks the head/neck and shoulder overlap. These corrections require **new exact-head** CI and new full-size screenshots; the previous passing screenshot run does not authorize release of the new revision.
