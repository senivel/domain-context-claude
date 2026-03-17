# Domain Context for Claude Code

## What This Is

A Claude Code extension (`domain-context-cc`) that makes Claude Code natively aware of the Domain Context specification. Provides 5 slash commands, 2 lifecycle hooks, 1 path-scoped rule, and 1 domain validator agent for initializing, browsing, validating, creating, refreshing, and passively maintaining domain knowledge as `.context/` directories in any project. Distributed as markdown skill files and Node.js hooks with no runtime dependencies.

## Core Value

Developers can codify and maintain domain knowledge alongside code so that AI assistants always have accurate business context — without manual prompting or copy-pasting.

## Requirements

### Validated

- ✓ dc:init — Initialize .context/ in any project (scaffold dirs, templates, AGENTS.md snippet) — v1.0
- ✓ dc:explore — Browse and summarize domain context (manifest parsing, freshness status, search) — v1.0
- ✓ dc:validate — Check manifest sync, freshness, orphans with conversational fix offers — v1.0
- ✓ dc:add — Create domain concept, ADR, or constraint from conversation — v1.0
- ✓ dc:refresh — Review and update stale entries (>90 days) with code-aware assessment — v1.0
- ✓ 8 spec-compliant templates for all Domain Context file types — v1.0
- ✓ Template validation script (67 checks) — v1.0

- ✓ SessionStart hook warns about stale domain context entries — v1.1
- ✓ PostToolUse hook reminds about CONTEXT.md updates when editing nearby files — v1.1
- ✓ Path-scoped rule guides .context/ file editing — v1.1
- ✓ Domain validator agent checks code against documented business rules — v1.1

### Active

- [ ] GSD `/dc:extract` skill — extract domain knowledge from completed phases
- [ ] AGENTS.md.snippet template — GSD bridge text appended by dc:init

### Future

- [ ] npm packaging and installer — distribute as npx package
- [ ] Installer merges hook config into settings.json

### Out of Scope

- MCP server — deferred post-MVP per ADR-003
- Auto-generate domain context from code — domain context captures WHY, not WHAT

## Current Milestone: v1.2 GSD Integration

**Goal:** Enable bidirectional relationship between GSD's .planning/ artifacts and domain context.

**Target features:**
- dc:extract skill — extract domain knowledge from completed GSD phases into .context/
- AGENTS.md.snippet template — GSD bridge text appended by dc:init

## Context

- v1.0 shipped: 5 skills, 8 templates, 1 validation script (1,342 LOC markdown + shell)
- v1.1 shipped: 2 hooks, 1 rule, 1 agent (318 LOC JS + markdown)
- The Domain Context spec lives at ~/code/domain-context/SPEC.md
- Skills follow Claude Code format: YAML frontmatter + `<objective>`, `<execution_context>`, `<process>` sections
- Hooks follow Claude Code format: Node.js scripts reading JSON stdin, writing JSON stdout
- Templates read from install location (`~/.claude/domain-context/templates/` or `.claude/domain-context/templates/`)
- No runtime dependencies — Node.js built-ins only for hooks/installer
- All files use kebab-case naming, `dc:` prefix for skill/hook/agent names

## Constraints

- **Spec compliance**: All generated .context/ files must match the Domain Context spec exactly
- **No runtime deps**: Node.js built-ins only
- **Hook safety**: All hooks must exit 0 on error, never block the session

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AGENTS.md primary, thin CLAUDE.md pointer | Vendor-neutral instructions; agents get context via CLAUDE.md → AGENTS.md chain | ✓ Good |
| `dc:` command prefix | Short, matches GSD convention | ✓ Good |
| Node.js runtime | Matches GSD patterns, npm distribution, maximum reach | ✓ Good |
| Single project for Claude Code + GSD | Both are config files; GSD integration is thin | ✓ Good |
| No MCP server for MVP | File-based is simpler, aligns with framework-agnostic principle | ✓ Good |
| Per-group fix offers in validate | Better UX than bulk fix prompt — user controls each fix type | ✓ Good |
| AGENTS.md import check as warning | AGENTS.md is optional per spec — error would block valid projects | ✓ Good |
| Template-first build order | All skills consume templates; building them first prevents circular deps | ✓ Good |
| Dual-location verified date | Both MANIFEST.md and inline comment updated — dc:refresh can find dates in either | ✓ Good |
| 3-second stdin timeout for hooks | Prevents UI error warnings when stdin pipe is delayed or broken | ✓ Good |
| globs: not paths: for rules | Avoids Claude Code parser bug with paths: frontmatter (GitHub #17204) | ✓ Good |
| Read-only domain validator | Agent reports violations but never modifies files — separation of concerns | ✓ Good |
| Matcher + in-code allowlist for PostToolUse | Defense-in-depth: settings.json matcher prevents spawn, code allowlist is fallback | ✓ Good |

---
*Last updated: 2026-03-16 after v1.2 milestone started*
