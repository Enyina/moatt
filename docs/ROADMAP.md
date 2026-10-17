# Moatt REA roadmap — 2026-10-17

## Product position
Beginner-friendly 3D clothing design on a mannequin, with advanced garment construction as progressive functionality. The current implementation is deliberately a scaffold; reconcile it with any separately existing Moatt application before migration.

## Benchmark map
- CLO 3D: synchronized pattern and 3D garment editing, advanced fabric simulation (longer horizon)
- Tailornova: template customization and adjustable silhouettes
- Canva: drag/drop editing, history, layers, typography, approachable controls
- Pacdora: preview presentation and exports
- Browzwear VStitcher: future fitting and technical specifications
- Printful Design Maker: print bounds, front/back placement and export validation

Benchmarks are behavioral references, not licensed source or asset sources.

## Vertical slices
1. **Foundation (in progress):** local save, mannequin, T-shirt, fit and base colors, front/back text artwork preview and export. Test on desktop and mobile.
2. **Editor interactions:** explicit orbit vs draw modes; pointer capture; UV-aware freehand painting; pan/zoom; multilayer designs; undo/redo; front/back masking. Acceptance: drawing never accidentally orbits mannequin.
3. **Design templates:** shirts/hoodies/trousers, parts (collars/sleeves/hem), shape-specific editable parameters.
4. **Material system:** texture maps, knit/weave presets, roughness, repeat scale, fabric color accuracy.
5. **Saved projects:** document versioning and migrations, multiple designs, thumbnails, persistent storage, sharing. Use server storage only once product flows are proved.
6. **Mannequin fit:** body parameters and garment separation, measurements and size presets.
7. **Professional construction:** true panels, seams, grading, optional cloth simulation, technical pattern exports. Validate against reference geometry and measurements; do not pretend a visual mockup is a production pattern.
8. **Optional AI:** prompt-to-editable design drafts, with reversible suggestions and provenance.

## Definition of done for each slice
- Observable reference workflow and reason for choosing it
- Independent implementation contract and state ownership
- Unit/integration interaction tests, including rotation/drawing conflict
- Performance baseline (initial load, editing latency, memory), manual mobile WebGL test
- Save/reload and export round trip
- Known gaps and explicit regressions documented

## Important architectural decisions
- Canonical versioned garment document, not competing 2D and 3D state
- Textures derived from canonical artwork state; front/back independent
- Interaction tools modeled as explicit modes, not implicit event handler overlaps
- Preserve user-authored assets and existing project source when later migrating this prototype
