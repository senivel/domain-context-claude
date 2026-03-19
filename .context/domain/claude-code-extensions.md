# Claude Code Extensions

<!-- verified: 2026-03-11 -->

## What This Is

Claude Code provides four extension points for adding capabilities. This project uses all four to make Claude Code domain-context-aware. Understanding this taxonomy is essential for knowing where new functionality belongs.

## Key Attributes

### Skills (commands/)

- Installed to `.claude/commands/{prefix}/`
- Invoked as `/{prefix}:{name}` (e.g., `/dc:init`)
- Markdown files with YAML frontmatter (`name`, `description`, `allowed-tools`, `argument-hint`)
- Body uses `<objective>`, `<execution_context>`, `<process>` sections
- Can reference other files via `@path` syntax in `<execution_context>`

### Hooks (hooks/)

- Registered in `.claude/settings.json` under `hooks.{event}`
- Events: `SessionStart`, `PreToolUse`, `PostToolUse`, `Notification`, `Stop`
- Node.js scripts that read JSON from stdin and write JSON to stdout
- Output fields: `additionalContext` (injected into conversation), `decision` (block/allow)
- MUST be timeout-safe and exit 0 on any error (graceful degradation)

### Agents (agents/)

- Installed to `.claude/agents/`
- Markdown files with `allowed-tools` frontmatter
- Spawned as subagents by skills or the user
- Can be read-only (tools: Read, Glob, Grep) or have write access

### Rules (rules/)

- Installed to `.claude/rules/`
- Markdown files with `globs` frontmatter for path matching
- Automatically loaded when the agent reads/edits files matching the glob pattern
- Used for enforcing conventions on specific file types

## Business Rules

1. All skills MUST use the `dc:` prefix to avoid collisions with other extensions.
2. Hooks MUST exit 0 on any error — a failing hook must never block the user's session.
3. The installer MUST merge hook config into settings.json without clobbering existing entries from other extensions (e.g., GSD hooks).
4. Skills MUST specify `allowed-tools` to follow the principle of least privilege.

## Invariants

- A skill file's `name` field always matches its `{prefix}:{filename}` path.
- Hook scripts always read JSON from stdin and write JSON (or nothing) to stdout.

## Related Concepts

- [Integration Model](integration-model.md) — how these extension points work together
