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

- T-shirt and hoodie silhouette presets, adjustable sleeves/hem/neckline, regular/oversized fit, standard/tall mannequin presets, cotton/denim/satin appearance and fabric colors
- A 1024×1024 artboard and a verified CC0 mannequin GLB (with procedural fallback), with distinct front/back artwork
- Layered text, image upload (PNG/JPEG/WebP), drawing strokes, selection, basic dragging, width/height/rotation, show/hide, lock, duplicate, delete, reorder forward
- Undo/redo, browser-local autosave, JSON project export/import with schema migration from v1 and asset checks
- Independent transparent PNG exports for both sides; 3D preview screenshot from the viewport

## Important limitations

Garments are **procedural stylized mockups**, not simulated fitted clothing or production-ready sewing patterns. 2D exports represent a flat artboard, not physically calibrated garment UVs. 3D screenshots depend on working browser WebGL. Browser-local saves are specific to one device/browser and may be erased by the browser; export JSON backups. Uploaded images are embedded in project JSON and may hit browser storage limits. No accounts, sharing, cloud backups or professional production patterns.

## Quality bar

[Full end-to-end usability gate](docs/PRODUCT-TO-USABLE.md). **Do not call the app fully release-ready solely because the source has been committed.** Confirm actual CI and browser test outcomes first.

## Instructions

[Project AGENTS.md](AGENTS.md) is the public fallback. The personal private instruction library is `Enyina/ai-engineering-config`, with scoped core, web-product, 3D-editor and Moatt project guidance. Log generalizable observations to [engineering learnings](docs/ENGINEERING-LEARNINGS.md) and promote sanitized verified rules to the private repository.

## Assets and hosting

The mannequin is downloaded during dev/build by `scripts/sync-mannequin.mjs` and checked against a pinned Git blob SHA. Its CC0 license and provenance are documented in `docs/ASSET-PROVENANCE.md`. `npm run assets:verify` fails if the pinned source cannot be verified.

The project builds as a static Next.js website. The GitHub Pages workflow also uploads a static-site artifact, but **hosting remains blocked** until Pages is enabled for this repository or another hosting provider is connected. Build success does not establish a live website.

Visual output is a conceptual clothing mockup, **not reliable apparel fitting, calibrated print positioning or professional manufacturing CAD**.
