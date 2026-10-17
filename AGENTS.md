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
