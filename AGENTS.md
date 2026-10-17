# Moatt engineering rules
Canonical personal rules: https://github.com/Enyina/ai-engineering-config
Scope: **global** + **web-product** + **Moatt**. Exclude game-development, backend-reliability and AI-media unless the specific feature requires them.

Reverse Engineer First: inspect existing code, benchmark working garment visualization / fit / shopping experiences, record observed versus inferred details, compare trade-offs, then implement original features suited to Moatt. Prioritize garment fidelity, accessibility, mobile UX, performance and reproducible tests. Do not replace current architecture without evidence. Never copy protected product assets or proprietary code.

See https://github.com/Enyina/ai-engineering-config/blob/main/projects/moatt.md and https://github.com/Enyina/ai-engineering-config/blob/main/categories/web-product.md. Rules are also summarized here for agents without remote access. Revisit upstream revisions before adopting changes.

## Product-to-usable execution contract (2026-10-17)

Read [docs/PRODUCT-TO-USABLE.md](docs/PRODUCT-TO-USABLE.md) before major changes. It defines the end-to-end release gate and explicitly avoids owner approval checkpoints until the workflow is truly usable. Do not imply background execution or ask for acceptance until objective criteria are met.

Additional scoped private rules now maintained under `ai-engineering-config/rules/`:
- `CORE-ENGINEERING.md`
- `categories/3D-EDITORS.md`
- `projects/moatt.md`
- `LEARNING-PROTOCOL.md`

These complement (not replace) the pre-existing central `AGENTS.md`, `categories/web-product.md` and `projects/moatt.md` guides. Apply only relevant scopes; resolve overlap by the more specific project rule, subject to security and ownership constraints. References to private files are *not* automatic live imports.

Local fallback invariants: keep one canonical versioned design document; front/back layers are independent; explicit gesture modes prevent drawing from orbiting the mannequin; test save/reload and exports; do not confuse a stylized model with physically accurate garments; report committed vs built/tested/deployed separately.

Record and verify lessons in [docs/ENGINEERING-LEARNINGS.md](docs/ENGINEERING-LEARNINGS.md), then promote generalized, non-confidential rules into the private central library. Keep Moatt-specific rules scoped to Moatt.

## Research-backed design and engineering choices

For meaningful changes to the clothing editor, first inspect the actual product and user journey. Compare 2–3 genuinely different, lawful reference-based solutions where useful, rather than adopting the first attractive design. Explain user benefits, disadvantages, accessibility and touch/mouse behavior, and how each option could be tested. Preserve Moatt's established product identity and its specific 3D editing and garment accuracy requirements. Do not copy branded screens, private designs, proprietary assets, or other projects' styles.

Use the personal knowledge catalog and scoped, read-only advisor from `Enyina/ai-engineering-config` when available: `bin/ai-intelligence suggest --workspace <this-repository> --project moatt --feature garment-editor --domain design --task "<specific task>"` (or `--domain engineering` for an implementation problem). A remote private link does **not** automatically load the catalog in an agent; the central repository must be available to use the CLI. Public, credible sources are research inputs, not mandatory visual themes. No automated choice replaces checking the actual editor.

After implementing an authorized change, test the real screen and workflow, record evidence, and suggest a **sanitized, scoped** lesson for human review in the personal rules repository. Never silently modify shared rules or apply employer-owned instructions.

## Saving work and explaining updates

When an authorized change is complete, save it in a focused Git commit with a clear description. Do not leave completed work uncommitted. Keep unrelated work and private information out of the commit. Follow this project's existing delivery and approval requirements; do not assume committing gives permission to push or publish. If a higher-priority rule or direct instruction prevents a commit, explain that clearly.

For each meaningful change, update `RELEASE_NOTES.md` using **only everyday English that a person with no software background can understand**. Explain what changed, why it matters, and anything people still cannot use. Avoid technical language, implementation details, command names, source filenames, abbreviations and internal test names. Do not say a change is live or available until publication is verified. Keep technical checks in engineering reports, not release notes.
