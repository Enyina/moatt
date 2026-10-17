# AI agent integration — Moatt

Personal policy: `Enyina/ai-engineering-config`, source version `2fa5392dc21524c522b613cb6cc869fd3eace4f2`.

Trust marker: `.ai-rules/workspace.json`. The CLI additionally checks Git `origin`. The marker is an explicit owner declaration, not independent permission verification.

- **Codex**: existing `AGENTS.md` remains unchanged.
- **Google Antigravity**: can read existing root `AGENTS.md`; don't also generate `GEMINI.md` with duplicate rules.
- **Claude Code**: `CLAUDE.md` imports the original `AGENTS.md`.
- **Cursor**: `.cursor/rules/ai-engineering-context.mdc` points back to original project instructions.
- **Other agents**: read `AGENTS.md` explicitly, or adapt using the central generic renderer. Context behavior and enforcement differ by agent.

The centralized `bin/ai-rules` resolver can preview effective Moatt rules:

```sh
python3 /path/to/ai-engineering-config/bin/ai-rules resolve --workspace /path/to/moatt --project moatt --feature garment-editor
```

Do not run full `render --apply` against this repository: it contains a hand-authored `AGENTS.md`, which the generator correctly refuses to overwrite. Use feature-level review PRs and merge existing instructions deliberately. After completed authorized work, make a focused commit and report what was saved. Keep release notes in simple everyday language. Do not silently push or publish, and never auto-approve changes to the governing rule system.

No claim of actual running Codex, Cursor, Claude Code or Antigravity on this machine is made by the presence of their context files. Verify native loading in each app and run product tests independently.
