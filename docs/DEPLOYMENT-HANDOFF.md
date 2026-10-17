# Moatt deployment handoff

The Moatt application builds to a static Next.js `out/` directory with no server backend and includes a pinned, verified CC0 mannequin asset. The public mockup editor saves designs in the browser; it does not use a shared account or database.

## Current status

Source tests, production build and multi-browser checks can be verified in GitHub Actions. **This does not mean the site is live.** The GitHub Pages workflow fails on `actions/configure-pages` with "Resource not accessible by integration", even with `enablement: true`.

## Activate GitHub Pages (repository owner/admin)

1. Open https://github.com/Enyina/moatt/settings/pages
2. Under Build and deployment, set Source to **GitHub Actions**. Save.
3. Open https://github.com/Enyina/moatt/actions/workflows/deploy.yml and run the workflow.
4. Confirm the workflow's deployment job succeeded and the published site contains the 3D model at `/moatt/models/mannequin.glb`.
5. Visit the **actual** site and complete final acceptance; do not infer its URL is accessible from a successful build alone.

Alternatively connect a supported authorized hosting provider and import `Enyina/moatt`. If host builds directly from Next.js, use `npm run build`; for static uploads, publish `out/` and configure the `/moatt` base path only when hosting under that prefix.

## Release gate

- `npm run assets:verify`, `npm test`, `npm run typecheck`, `npm run build`, `node scripts/check-static-release.mjs`, `npm run e2e` pass.
- Verify front/back editing, import/export, save/reload and mockup rendering on the deployed origin.
- Verify mobile/touch interactions on an actual device.
- Confirm simulated clothing and illustration-only print zone disclaimers remain visible.

Build artifacts can be obtained from the GitHub Pages workflow's `moatt-static-site` artifact without enabling Pages. Exporting an artifact is **not** publishing a website.
