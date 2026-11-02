# Moatt mannequin quality — November 2, 2026

## What's merged already
PR #22 was merged after exact-head 188/188 browser checks. It improved the procedural head/shoulders/neck and connected the hoodie cowl. The model is still stylized, not a photorealistic figure, and these improvements do not establish fit validation.

## This pass
Replace oval ball-foot primitives with a tapered heel/instep/toe mesh and add distinguishable hand digits rather than ending the arm as a mitt. Every mesh is disposed on remount. The changes affect display geometry only; front/back artwork and saved designs remain the canonical source.

## Reverse engineering: higher-quality model alternatives

| Candidate | License evidence | Potential advantage | Release blocker |
| --- | --- | --- | --- |
| Innerscene male/female rigged A-pose base meshes | Source describes CC0 adaptation from MakeHuman; see https://www.innerscene.com/tools/library/3d-parts/male-base-mesh-3d-person-rigged-a-pose-380e6d89 and https://www.innerscene.com/tools/library/3d-parts/female-base-mesh-3d-person-rigged-a-pose-dba97ed5 | Detailed topology, fingers, rig and UVs in a compact GLB | Need obtain the actual immutable bytes, independently verify rights/hash, evaluate performance and fit **our garments** without body clipping |
| MakeHuman CC0 exports | https://static.makehumancommunity.org/makehuman/faq/can_i_sell_models_created_with_makehuman.html | Author our own body and matched garment meshes from first principles | Need exporter setup, visual review, actual fit and production-safe licensing for all optional clothing assets |
| Khronos sample assets | https://github.khronos.org/glTF-Assets/ | Excellent validation/reference formats with per-asset licenses | No coherent ready-made unisex apparel mannequin + editable shirt/hoodie pair found in the samples |

These references are research only. No new external model has been installed into Moatt; do not claim a higher-resolution mannequin until a source file is verified and tested. Do not copy third-party rendering/UI code or proprietary garments.

## Acceptance next
1. Exact-head TypeScript, lint, unit, build and cross-browser tests plus the bare and dressed screenshots.
2. Review enlarged head, hand, foot, shoulder and hood crops on desktop and narrow mobile sizes. If model still reads as a toy, reject.
3. Evaluate at least one properly licensed high-resolution source asset **together with** matched clothing meshes. A more realistic naked body paired with intersecting clothing does not count as an improvement.
4. Preserve 2D editor, independent side artwork, zoom, export and active colourway during model replacement. No calibration or physical drape claims.
5. Keep the new PR in review until real screenshots demonstrate substantial visible gains and no regressions; merging intermediate code is not the same as accepting perfection.
