# Moatt Studio

Browser-based clothing design and mannequin mockup prototype. This repository started empty on 2026-10-17; any earlier local source must be reconciled before migrating.

## Run locally

```sh
npm install
npm run dev
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run e2e
```

Visit http://localhost:3000. CI runs typecheck, Vitest unit tests, the production build and Playwright browser checks.

## Workflows present in source

- Rounded T-shirt and hoodie mockup silhouettes, adjustable sleeves/hem/neckline/pockets, regular/oversized fit and mannequin presets; procedurally rendered cotton/denim/satin weaves, physical highlight profiles and fabric colors
- A 1024×1024 artboard, a smooth procedural studio mannequin (default), and a verified CC0 legacy mannequin GLB (optional), with distinct front/back artwork
- Layered text, image upload (PNG/JPEG/WebP), drawing strokes, selection, basic dragging, width/height/rotation, show/hide, lock, duplicate, delete, reorder forward
- Undo/redo, browser-local autosave, a multi-design library and colorway duplication, JSON project export/import with schema migration from v1 and asset checks
- Independent transparent PNG exports for both sides; 3D preview screenshot from the viewport
- An offline rule-based concept-to-editable-draft helper, plus brand/supplier notes and a printable supplier discussion sheet (not a technical manufacturing pack)

## Important limitations

The text idea helper recognizes a limited set of words, **not arbitrary sketches, AI fashion concepts or photographic garment reconstruction**. The supplier sheet is an unverified discussion brief. Garments are **procedural stylized mockups**, not simulated fitted clothing or production-ready sewing patterns. 2D exports represent a flat artboard, not physically calibrated garment UVs. 3D screenshots depend on working browser WebGL. Browser-local saves are specific to one device/browser and may be erased by the browser; export JSON backups. Uploaded images are embedded in project JSON and may hit browser storage limits. No accounts, sharing, cloud backups or professional production patterns.

## Quality bar

[Full end-to-end usability gate](docs/PRODUCT-TO-USABLE.md) and [automation acceptance matrix](docs/PRODUCT-ACCEPTANCE-AUTOMATION.md). **Do not call the app fully release-ready solely because the source has been committed.** Confirm actual CI and browser test outcomes first.

## Instructions

[Project AGENTS.md](AGENTS.md) is the public fallback. The personal private instruction library is `Enyina/ai-engineering-config`, with scoped core, web-product, 3D-editor and Moatt project guidance. Log generalizable observations to [engineering learnings](docs/ENGINEERING-LEARNINGS.md) and promote sanitized verified rules to the private repository.

## Assets and hosting

The optional classic mannequin is downloaded during dev/build by `scripts/sync-mannequin.mjs` and checked against a pinned Git blob SHA. Its CC0 license and provenance are documented in `docs/ASSET-PROVENANCE.md`. `npm run assets:verify` fails if the pinned source cannot be verified.

The smooth default mannequin and fabric textures are generated locally in code; these are visual approximations, not scanned assets or cloth physics. The project builds as a static Next.js website. The GitHub Pages workflow also uploads a static-site artifact, but **hosting remains blocked** until Pages is enabled for this repository or another hosting provider is connected. Build success does not establish a live website.

Visual output is a conceptual clothing mockup, **not reliable apparel fitting, calibrated print positioning or professional manufacturing CAD**.
