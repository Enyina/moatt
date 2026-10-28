# Third-party mannequin asset
- Model: `assets/human_posed.glb`, from https://github.com/UMRAM-Bilkent/supine-human-model
- Source Git blob SHA-1: `159784ffb1d1437f42ffb316ccc8e28dcdb64636`
- License: CC0 1.0, as declared in that source repository's LICENSE and README.
- Attribution (courtesy): original CC0 character by Quaternius; prepared model by UMRAM, Bilkent University.
- Downloaded at build/development setup via `scripts/sync-mannequin.mjs`, with Git blob identity verification. No runtime third-party CDN dependency.
- This is a low-poly stylized 3D reference mesh, NOT verified body measurements, apparel sizing, or manufacturing CAD. It may not fit the project's placeholder garments.
- If acquisition is unavailable, the procedural mannequin remains available.

## Current display mannequin (October 27, 2026)

Moatt now defaults to a **procedurally authored, smooth, faceless display mannequin**. It is constructed from ordinary Three.js geometries inside the repository, with no additional third-party asset or downloaded character data. The earlier, verified CC0 Quaternius/UMRAM mannequin remains available through the **Classic mannequin** view choice, with the same pinned source and license stated above. Neither figure is a body-scan, measurement standard or apparel fit model.

## On-demand human fit reference (2026-10-28)

Moatt now optionally downloads three *generated* GLB assets from the public CharacterCreator project, pinned to source commit `852e48f316b90a0937234886630e4fb4cdfd1f78`:

- `output/base_body.glb` — Git blob SHA `a5632913dddae4f7f50188e9f8eb273b78d7d1b0`
- `output/clothing_tshirt.glb` — Git blob SHA `ce7966dfd52c4bc6158e1e3b21969e6a63b066da`
- `output/clothing_hoodie.glb` — Git blob SHA `85999d3584078c11e9e4637ea53d88b150a775c3`

Source: https://github.com/kblood/CharacterCreator. Origin project `LICENSE-NOTES.md` declares the generated `output/*.glb` CC0-1.0; it documents that the sources are MakeHuman system CC0 meshes/textures plus author-generated derivatives. **The upstream application's source code is GPL-3.0-or-later; none of it is copied into Moatt.** Moatt's downloader is independently authored and validates full Git object SHA-1 plus GLB headers and expected byte length before installation.

The new **Human fit reference** button loads these original body-fitted assets as a reference, leaving the existing separately authored Moatt garment preview available for editing. The reference currently **does not receive the user's front/back artwork or tailoring choices**, so it is not ready as a final designer outcome or physical fit simulation. It must not be used as a production pattern, and external third-party source hosting remains an operational dependency at build time.
