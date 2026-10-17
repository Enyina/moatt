# Moatt Studio

A browser-based, local-first clothing customization prototype. The repository was empty when this initial foundation was created; **it does not claim to contain or replace an earlier local Moatt codebase**.

## Run

```bash
npm install
npm run dev
npm run typecheck
```

Open http://localhost:3000. A modern browser with WebGL is required.

## First slice

- Procedural **stylized** mannequin and approximate T-shirt mesh, using Three.js and React Three Fiber (not fitted cloth simulation)
- Regular/oversized shirt silhouettes; shirt base color
- Distinct front/back artwork created from text, with independent canvas textures
- View selection, orbit, zoom; reset design; browser-local autosave and JSON export
- PNG export for each 2D garment-side artwork texture

## Boundaries / not yet supported

Freehand brushes, garment-pattern construction, actual UV production patterns, high-quality cloth physics, PDF tech packs, accounts/cloud save and precise body fitting are not in this slice. Procedural shirt surfaces are a **preview**, not manufacturing specifications.

## Reverse engineering practice

For each feature: document competitor behavior from legitimate use; formulate an independent interaction specification; implement it without copying licensed artwork/code; test visual and interaction outcomes; record trade-offs. Start from `docs/ROADMAP.md`.
