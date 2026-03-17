# Domain Context for Claude Code

## What This Is

A Claude Code extension (`domain-context-cc`) that makes Claude Code natively aware of the Domain Context specification. Provides 6 slash commands, 2 lifecycle hooks, 1 path-scoped rule, and 1 domain validator agent for initializing, browsing, validating, creating, refreshing, extracting, and passively maintaining domain knowledge as `.context/` directories in any project. Includes GSD integration for bridging planning artifacts with domain context. Installable via `npx domain-context-cc` with global/local modes and clean uninstall. Zero runtime dependencies.

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

- ✓ dc:extract — Extract domain knowledge from completed GSD phases into .context/ — v1.2
- ✓ GSD bridge template — AGENTS.md snippet with GSD instructions, injected by dc:init — v1.2
- ✓ dc:init GSD detection — Auto-detects GSD projects and injects bridge via sentinels — v1.2
- ✓ Template validation expanded to 91 checks covering all 6 dc:* skills — v1.2

- ✓ npm package with bin entry, 7-directory files whitelist, zero dependencies — v1.3
- ✓ Node.js installer with global/local/uninstall modes and idempotent settings.json merge — v1.3
- ✓ Production README with badges, command reference, quick start, and uninstall docs — v1.3
- ✓ 52-test suite covering install, reinstall, and uninstall — v1.3

### Active

(None — all current requirements shipped)

### Future

- [ ] Auto-update check on session start (DIST-01)
- [ ] `--check` inspection flag to show what's installed (DIST-02)

### Out of Scope

- MCP server — deferred post-MVP per ADR-003
- Auto-generate domain context from code — domain context captures WHY, not WHAT

## Current State

v1.3 shipped. All 4 milestones complete. Project is feature-complete for initial release.

- v1.0: 5 skills, 8 templates, 1 validation script
- v1.1: 2 hooks, 1 rule, 1 agent
- v1.2: dc:extract skill, GSD bridge template, dc:init GSD detection
- v1.3: npm installer (global/local/uninstall), 52-test suite, production README

## Context

- v1.0 shipped: 5 skills, 8 templates, 1 validation script (1,342 LOC markdown + shell)
- v1.1 shipped: 2 hooks, 1 rule, 1 agent (318 LOC JS + markdown)
- v1.2 shipped: dc:extract skill, GSD bridge template, dc:init GSD detection (675 LOC markdown + shell)
- v1.3 shipped: npm package, Node.js installer (241 LOC), 52-test suite, production README + LICENSE
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
| Sentinel-based GSD bridge injection | Reuse existing domain-context sentinel pattern for GSD bridge — idempotent updates on re-run | ✓ Good |
| Implicit template placeholder filling | dc:extract and dc:add both rely on Claude's judgment to fill template tokens — explicit enumeration unnecessary | ✓ Good |
| SUMMARY.md as completion signal | Detect completed phases by SUMMARY.md presence rather than ROADMAP.md status — more reliable | ✓ Good |
| Single CommonJS installer file | Installer is self-contained; no benefit to module splitting | ✓ Good |
| Filter-then-append hook merging | Guarantees idempotency by removing old dc entries before adding fresh ones | ✓ Good |
| INSTALL_MAP-driven install/uninstall | Same directory manifest drives both directions for symmetric behavior | ✓ Good |
| node:test for test framework | Built-in, zero dependencies, aligns with project constraints | ✓ Good |

---
*Last updated: 2026-03-17 after v1.3 milestone completed*
