# Requirements: Domain Context for Claude Code

**Defined:** 2026-03-16
**Core Value:** Developers can codify and maintain domain knowledge alongside code so AI assistants always have accurate business context

## v1.1 Requirements

Requirements for passive integrations milestone. Each maps to roadmap phases.

### Hooks

- [x] **HOOK-01**: SessionStart hook reads MANIFEST.md and warns about entries with verified dates >90 days old
- [x] **HOOK-02**: SessionStart hook exits 0 gracefully when no .context/ exists or on any error
- [x] **HOOK-03**: PostToolUse hook detects when edited file has a CONTEXT.md in its directory or parent
- [x] **HOOK-04**: PostToolUse hook emits advisory reminder to update CONTEXT.md when nearby one exists
- [x] **HOOK-05**: PostToolUse hook debounces reminders to once per directory per session via tmp file
- [x] **HOOK-06**: PostToolUse hook scopes to Edit/Write/MultiEdit tools only via matcher
- [x] **HOOK-07**: Both hooks use stdin timeout guard (3-second) to prevent UI error warnings
- [x] **HOOK-08**: Hook registration merges into existing settings.json arrays without clobbering GSD hooks

### Rules

- [x] **RULE-01**: Path-scoped rule loads when Claude reads `.context/**` or `**/CONTEXT.md` files
- [x] **RULE-02**: Rule provides Domain Context spec formatting guidance (template structure, MANIFEST.md updates, verified dates, naming conventions)
- [x] **RULE-03**: Rule uses `globs:` frontmatter key (not `paths:`)

### Agent

- [x] **AGNT-01**: Domain validator agent uses read-only tools (Read, Grep, Glob) only
- [x] **AGNT-02**: Agent reads `.context/domain/` files and extracts business rules/constraints
- [x] **AGNT-03**: Agent checks code for violations against documented domain rules
- [x] **AGNT-04**: Agent produces structured findings (violation, file, rule violated)
- [x] **AGNT-05**: Agent system prompt is fully self-contained (no reliance on parent context)

## Future Requirements

### GSD Integration

- **EXTR-01**: dc:extract skill reads .planning/ artifacts from completed phases
- **EXTR-02**: dc:extract cross-references against existing .context/ to find net-new knowledge
- **EXTR-03**: dc:extract proposes new domain files, ADRs, and CONTEXT.md updates

### Distribution

- **DIST-01**: npm installer copies all files to ~/.claude/ or ./.claude/
- **DIST-02**: Installer merges hook config into settings.json
- **DIST-03**: Uninstall removes dc-prefixed files and hook entries

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auto-update verified dates in hooks | Silent manifest mutation is surprising; staleness requires human judgment |
| Block tool use when context is stale (exit 2) | Hooks must never block per project constraint |
| Write tool access for domain validator | Validator reports, it does not fix |
| MCP server | Deferred by ADR-003; file-based approach sufficient |
| Auto-generate domain context from code | Domain context captures WHY, not WHAT |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HOOK-01 | Phase 10 | Complete |
| HOOK-02 | Phase 10 | Complete |
| HOOK-03 | Phase 11 | Complete |
| HOOK-04 | Phase 11 | Complete |
| HOOK-05 | Phase 11 | Complete |
| HOOK-06 | Phase 11 | Complete |
| HOOK-07 | Phase 10 | Complete |
| HOOK-08 | Phase 11 | Complete |
| RULE-01 | Phase 12 | Complete |
| RULE-02 | Phase 12 | Complete |
| RULE-03 | Phase 12 | Complete |
| AGNT-01 | Phase 13 | Complete |
| AGNT-02 | Phase 13 | Complete |
| AGNT-03 | Phase 13 | Complete |
| AGNT-04 | Phase 13 | Complete |
| AGNT-05 | Phase 13 | Complete |

**Coverage:**
- v1.1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after roadmap creation*
