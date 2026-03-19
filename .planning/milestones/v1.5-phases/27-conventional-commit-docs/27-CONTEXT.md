# Phase 27: Conventional Commit Docs - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Create contributing documentation that explains the conventional commit format and how commit messages map to version bumps via release-please. References the Phase 25 config for recognized commit types.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure documentation phase. Standard conventional commit format documentation referencing the project's release-please config.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `release-please-config.json` — defines recognized commit types and changelog sections (feat, fix, perf, docs visible; chore, ci, test, refactor, style, build hidden)

### Established Patterns
- Project uses markdown for all documentation
- AGENTS.md serves as primary instruction file with CLAUDE.md as pointer

### Integration Points
- Documentation should reference the commit types configured in release-please-config.json
- CONTRIBUTING.md or similar at repo root

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard conventional commit documentation.

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>

---

*Phase: 27-conventional-commit-docs*
*Context gathered: 2026-03-18*
