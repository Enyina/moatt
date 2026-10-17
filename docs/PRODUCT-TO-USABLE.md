# Moatt: uninterrupted execution plan to a usable clothing studio

Updated: 2026-10-17. Source: current committed starter, not an audited legacy app.

## Product contract

Moatt v1 is a browser fashion **design and mockup studio** for regular people and independent clothing brands. A user can start with a garment, choose a mannequin, change garment shape and fabric appearance, add artwork on front/back, save and reopen their design, export correct files and images, and share an outcome. It must not pretend to generate manufacturing-ready paper patterns, exact body fit or physically simulated cloth.

**The job to be done:** In one session, a newcomer can create a two-sided shirt or hoodie design they would confidently share with another person, and reopen that project without losing work.

## Done means all these are true

1. New user can load the studio on a typical laptop and modern mobile browser; no blank WebGL-only failure state.
2. Select from at least T-shirt and hoodie and from at least two visual body/mannequin presets (not medically accurate measurements). Clear view options and intuitive orbit/zoom.
3. Adjust color and meaningful silhouette options that match the selected garment; changes are visibly distinguishable.
4. Add, select, reposition, resize, rotate, reorder and delete text and uploaded graphic layers on the *front and back independently*; transparent PNG upload works.
5. Brush/erase on a garment side without orbit conflicts; provide undo/redo for every committed artwork and garment edit. Support basic mouse, trackpad and touch.
6. 2D artwork preview and 3D mannequin display agree for the same document; no mirrored/stretched/incorrectly placed artwork on either side.
7. Autosave persists across reload, with explicit saved indicator, failure messaging, safe restore and JSON project import/export. Switching garments warns or migrates safely; no silent content loss.
8. Export separate high-resolution PNG design outputs and useful front/back mannequin screenshot assets, with a clear note that these are *mockup/design exports*, not production patterns.
9. Screens remain usable with keyboard controls, label associations, mobile responsive layout, visible selection indicators, adequate contrast, helpful empty states and controlled pointer events.
10. Automated typecheck, unit tests, integration tests and production build all pass. Critical end-to-end scenarios pass in real browser testing; no known critical blocker, save loss or GPU resource leak.
11. No secrets or unlicensed assets are shipped; dependency and licensing checks completed. Update README instructions for new machine.
12. Only after these acceptance gates: ask owner to run hands-on acceptance testing. Do not ask them to approve every phase.

## Execution order (continue autonomously across steps during an active work session)

### 0. Baseline truth and governance
- Locate and inspect current remote code, dependency health and any original local source if accessible.
- Preserve existing work. Establish a passing typecheck/build baseline and record actual result.
- Use `AGENTS.md` and (when accessible) private central core/category/Moatt overlays.
- Build a measurable reference checklist for Canva, Tailornova, CLO, Pacdora and Printful using public docs and legitimately accessible demonstrations.
- Keep `docs/ENGINEERING-LEARNINGS.md` and promote broadly applicable lessons into the private rules repository.

### 1. Fix the model before adding features
- Versioned design schema with garment ID, body preset, fabric material and per-side ordered layers, stable IDs, transforms, locks, visibility and serialized brush strokes.
- Explicit migration from the initial v1 one-string-artwork schema. Unit tests for backward compatibility and invalid imports.
- Pure reducer/command operations with undo/redo, bounded history and grouping for drawing gestures.
- Separate persisted model from derived textures/meshes and viewport state.

### 2. Make the 2D editor dependable (Canva / Printful benchmark)
- Garment-side 2D artboard with bounds and print-safe zones.
- Text layer support (font, font size, color, bold/line spacing), drag handles, positioning and transformation.
- Image layer upload with supported formats, validation, size limits, and appropriate browser-side caching.
- Multiple layers, select, duplicate, reorder, lock, hide, remove and keyboard shortcuts.
- Brush, erase and clear drawing strokes; explicit mode switch when manipulating 3D view.
- Full history coverage and tests for front/back independence, drag-to-paint behavior, and touch gestures.

### 3. 3D garment/model improvements (Tailornova / CLO benchmark)
- Replace crude shirt slabs with properly mapped meshes and distinct print panels or UV zones. Maintain consistent color management and avoid z-fighting/texture mirroring.
- Add hoodie; collar, sleeve and length options appropriate to each garment.
- Provide two supported body presets; camera presets (front/back/side), orbit reset, lighting presets; graceful fallback without WebGL.
- Measure and fix GPU disposal, excessive texture regeneration and slow interactions.

### 4. Trustworthy persistence and outputs (Pacdora / Printful benchmark)
- Debounced autosave to local storage or IndexedDB with quota/error messaging, last saved timestamp and deterministic restore.
- JSON project download and import with validation, schema migration, malicious/oversized data protections.
- Export 2D artwork as PNG for both sides at useful resolution, and front/back 3D previews where feasible.
- Visual and behavioral equality tests across export/import and reload.

### 5. Product polish and acceptance
- A guided empty state: Pick garment -> Choose fit/color -> Add artwork -> Preview -> Save/export.
- Responsive phone/tablet/desktop layout, accessible inputs, undo/redo hints and fast navigation.
- Typecheck, lint, unit and browser e2e tests in CI; test save, import, view switching, upload, painting, export, mobile gestures.
- Browser perf budget: responsive editing under normal device load, no observable growing GPU memory usage after repeated design swaps; document measured numbers, not imagined targets.
- Verify production build and basic deployment configuration, document supported browsers and known limitations.
- Invite the user's **first** acceptance test only when all release gates are met.

## Benchmarks / why each is useful
- **Canva:** layer editor, undo/redo, direct manipulation and approachability.
- **Tailornova:** approachable garment choices and configurable silhouettes.
- **CLO 3D:** coherent relationship between construction and 3D representation (professional simulation deferred).
- **Pacdora:** attractive shareable 3D mockup experience and previews.
- **Printful Design Maker:** print regions, separation of front/back placements and export clarity.
- **Browzwear:** future validation of professional fit and technical specifications (not v1).

## Out of scope for the first acceptance gate
- Real-world garment sizing guarantees, accurate pressure/tension simulation, production sewing pattern generation, automatic cutting files, server accounts, e-commerce checkout and paid generative AI.
- Those are future opt-in product layers once basic usability is demonstrated.

## Evidence table (update as work proceeds)

| Gate | Current evidence | Status |
| --- | --- | --- |
| GitHub scaffold | Starter files committed | Done |
| Typecheck / build | Not yet verified | Open |
| Layer editing | Initial version has text string only | Open |
| Realistic geometry | Initial stylized mannequin | Open |
| Save and import | Basic browser save + JSON export; no import | Open |
| Production PNG | Flat side-art preview only | Open |
| Browser e2e | Not run | Open |
| Owner acceptance request | Blocked until all gates pass | Not requested |

**Work policy:** keep progressing without interrupting the owner for intermediate decisions. If progress is externally blocked, document the blocker precisely and make the best safe progress possible; never claim future unattended work has been scheduled.


## Implementation evidence — 2026-10-17

Committed source now contains: v2 design document and v1 migration, front/back text/image/stroke layers, basic drag/transform, visibility/lock/reorder, undo/redo, local autosave, validated JSON import/export, 2D PNG exports, 3D mockup screenshot, regular/oversized T-shirt and hoodie previews, two stylized mannequin presets, brush ink size/color, WebGL failure fallback.

CI run [39025853488](https://github.com/Enyina/moatt/actions/runs/39025853488) PASSED: typecheck, five unit tests, production build and 10 browser tests (desktop/mobile Chromium).

**Still not objectively completed:** photo-realistic garment assets/fit, production UV/print-safe calibration, rich collar/sleeve construction, multi-session GPU performance measurement, manual cross-browser/device accessibility review, real screenshot fidelity comparison, deployment and independent user acceptance. Existing geometry is visibly a simplified prototype. Do not mark the entire original release gate done because a subset of tests passed.

## Incremental implementation evidence — 2026-10-17 (continued)

- Added a shared suggested artwork safety area and non-blocking front/back diagnostics. Its dimensions are illustrative guidance only, not calibrated manufacturer printable regions.
- Replaced the purely rectangular shirt panels with a garment-shaped `ShapeGeometry` and explicit 2D UV coordinate mapping, plus hoodie silhouette and hood preview. These remain stylized flat meshes, **not fitted/sewn/simulated clothing**.
- Added four unit checks for placement diagnostics, a visible editor safe-area guide, and browser trace retention in CI.
- [GitHub CI run 39026492744](https://github.com/Enyina/moatt/actions/runs/39026492744) passed TypeScript, nine unit tests, production build and ten Chromium desktop/mobile tests.
- **Not complete under original acceptance contract:** photorealistic production garments/mannequins, collar/sleeve construction parameter editing, physical UV/print calibration, sustained GPU/performance measurements, full keyboard and assistive-tech validation, manual visual review and deployment. Do not request owner acceptance testing until these are actually addressed.

## Continued engineering pass (2026-10-17)

- Added editable sleeve length, hem length and neckline as fields in the versioned project document. Older v2 documents load with backward-compatible defaults.
- Changed custom garment geometry to respond to these parameters, with explicit persistence and migration unit tests.
- Added keyboard-based nudge controls (1 unit or 10 with Shift) and additional Playwright output screenshots for design/3D views.
- [GitHub Actions 39026997451](https://github.com/Enyina/moatt/actions/runs/39026997451) passed typecheck, unit tests, production build and desktop/mobile browser regression.
- Investigated properly licensed CC0 mannequin assets. The available connector could not import the binary GLB into the repository, so **no external mannequin asset has been installed**. Do not report asset integration as complete.

The acceptance gate remains open for material improvements to visual quality, physical fit and construction, explicit export-space calibration, real-device validation and deployment.

## 2026-10-17 continuation — release review evidence

- Integrated a reproducibly downloaded, Git-blob-verified CC0 mannequin (UMRAM-Bilkent / Quaternius) with a procedural fallback; licensing and asset identity are recorded in `docs/ASSET-PROVENANCE.md`. Its geometry remains **low-poly**, not a photorealistic fit avatar.
- Visually audited desktop/mobile Playwright screenshots. Corrected the initially sideways mannequin, torso/clothing intersection, extreme shirt width, and hidden forearms. Review screenshots revealed quality defects that ordinary canvas-presence tests missed.
- Replaced multiple transient CanvasTextures with stable per-side textures updated in-place. Verified GPU textures 2 → 2 and geometries 4 → 4 in desktop/mobile Chromium repeated-edit stress run 39028527243.
- Added visual cotton/denim/satin roughness presets and transparent print-artwork PNG exports (separate from fabric-colored previews), with schema migration and tests.
- Added mobile-first viewport arrangement and mobile shortcut controls.
- Added Firefox and WebKit cross-browser runs; Firefox headless can lack WebGL, so the app's explicit accessible 3D-unavailable fallback is tested instead of incorrectly requiring a GPU context. This is an environment fallback, **not evidence that 3D works on Firefox hardware**.
- Next.js static export and GitHub Pages workflow are configured. Static build succeeds, but Pages deployment is blocked by account-level permission: the repository lacks an enabled Pages site, and GitHub Actions token cannot create it (`Resource not accessible by integration`). Owner/admin must enable GitHub Pages with GitHub Actions as source, or connect an authorized hosting provider. The workflow now retains a static website ZIP even when Pages enablement fails.

**Still blocking final acceptance request:** live hosted URL, independent real-device/visual validation, garment fidelity still below the professional reference tools, and uncalibrated physical fit / actual production patterns (deferred beyond the mockup-only v1). Treat the implemented studio as a design mockup product, not garment CAD.
