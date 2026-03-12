# Domain Context for Claude Code

## What This Is

A Claude Code extension (`domain-context-cc`) that makes Claude Code and GSD natively aware of the Domain Context specification. It provides skills, hooks, agents, and rules for initializing, consuming, validating, and extracting domain knowledge as `.context/` directories in any project. Distributed as a public npm package for the Claude Code community.

## Core Value

Developers can codify and maintain domain knowledge alongside code so that AI assistants always have accurate business context — without manual prompting or copy-pasting.

## Requirements

### Validated

- ✓ Project repo with AGENTS.md, CLAUDE.md, ARCHITECTURE.md — Phase 1
- ✓ `.context/` dogfooding with MANIFEST.md, domain concepts, ADRs — Phase 1
- ✓ Domain Context spec reference at ~/code/domain-context/SPEC.md — Phase 1

### Active

- [ ] `/dc:init` — Initialize .context/ in any project (scaffold dirs, templates, AGENTS.md snippet)
- [ ] `/dc:explore` — Browse and summarize domain context (manifest parsing, freshness status, search)
- [ ] `/dc:validate` — Check manifest sync, freshness, orphans (wraps validate-context.sh)
- [ ] `/dc:add` — Create domain concept, ADR, or constraint from conversation
- [ ] `/dc:refresh` — Review and update stale entries (>90 days)

### Out of Scope

- Hooks and passive integrations — Milestone 2 (Phase 3)
- GSD `/dc:extract` skill — Milestone 3 (Phase 4)
- npm packaging and installer — Milestone 4 (Phase 5)
- MCP server — deferred post-MVP per ADR-003

## Context

- The Domain Context spec lives at ~/code/domain-context/SPEC.md — authoritative source for file formats, required sections, and validation rules
- Phase 1 is complete: repo structure, AGENTS.md, ARCHITECTURE.md, .context/ with domain concepts and ADRs all committed
- Skills follow Claude Code format: YAML frontmatter (`name`, `description`, `allowed-tools`) + `<objective>`, `<execution_context>`, `<process>` sections
- Templates are read from install location (`~/.claude/domain-context/templates/` or `.claude/domain-context/templates/`)
- This project has no runtime dependencies — Node.js built-ins only
- All files use kebab-case naming, `dc:` prefix for skill names

## Constraints

- **Spec compliance**: All generated .context/ files must match the Domain Context spec exactly — templates are the source of truth
- **No runtime deps**: Node.js built-ins only, matching GSD's pattern
- **Hook safety**: All hooks must exit 0 on error, never block the session
- **Existing patterns**: Follow GSD's established patterns for skills, hooks, and installer

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AGENTS.md primary, thin CLAUDE.md pointer | Vendor-neutral instructions; GSD agents get context via CLAUDE.md → AGENTS.md chain | ✓ Good |
| `dc:` command prefix | Short, matches GSD convention | ✓ Good |
| Node.js runtime | Matches GSD patterns, npm distribution, maximum reach | ✓ Good |
| Single project for Claude Code + GSD | Both are config files; GSD integration is thin | ✓ Good |
| No MCP server for MVP | File-based is simpler, aligns with framework-agnostic principle | — Pending |
| Each PLAN.md phase = separate GSD milestone | Phases are independently shippable; clean milestone boundaries | — Pending |

---
*Last updated: 2026-03-11 after initialization*
