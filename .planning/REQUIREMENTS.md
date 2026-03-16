# Requirements: Domain Context for Claude Code

**Defined:** 2026-03-16
**Core Value:** Developers can codify and maintain domain knowledge alongside code so AI assistants always have accurate business context

## v1.1 Requirements

Requirements for passive integrations milestone. Each maps to roadmap phases.

### Hooks

- [ ] **HOOK-01**: SessionStart hook reads MANIFEST.md and warns about entries with verified dates >90 days old
- [ ] **HOOK-02**: SessionStart hook exits 0 gracefully when no .context/ exists or on any error
- [ ] **HOOK-03**: PostToolUse hook detects when edited file has a CONTEXT.md in its directory or parent
- [ ] **HOOK-04**: PostToolUse hook emits advisory reminder to update CONTEXT.md when nearby one exists
- [ ] **HOOK-05**: PostToolUse hook debounces reminders to once per directory per session via tmp file
- [ ] **HOOK-06**: PostToolUse hook scopes to Edit/Write/MultiEdit tools only via matcher
- [ ] **HOOK-07**: Both hooks use stdin timeout guard (3-second) to prevent UI error warnings
- [ ] **HOOK-08**: Hook registration merges into existing settings.json arrays without clobbering GSD hooks

### Rules

- [ ] **RULE-01**: Path-scoped rule loads when Claude reads `.context/**` or `**/CONTEXT.md` files
- [ ] **RULE-02**: Rule provides Domain Context spec formatting guidance (template structure, MANIFEST.md updates, verified dates, naming conventions)
- [ ] **RULE-03**: Rule uses `globs:` frontmatter key (not `paths:`)

### Agent

- [ ] **AGNT-01**: Domain validator agent uses read-only tools (Read, Grep, Glob) only
- [ ] **AGNT-02**: Agent reads `.context/domain/` files and extracts business rules/constraints
- [ ] **AGNT-03**: Agent checks code for violations against documented domain rules
- [ ] **AGNT-04**: Agent produces structured findings (violation, file, rule violated)
- [ ] **AGNT-05**: Agent system prompt is fully self-contained (no reliance on parent context)

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
| HOOK-01 | — | Pending |
| HOOK-02 | — | Pending |
| HOOK-03 | — | Pending |
| HOOK-04 | — | Pending |
| HOOK-05 | — | Pending |
| HOOK-06 | — | Pending |
| HOOK-07 | — | Pending |
| HOOK-08 | — | Pending |
| RULE-01 | — | Pending |
| RULE-02 | — | Pending |
| RULE-03 | — | Pending |
| AGNT-01 | — | Pending |
| AGNT-02 | — | Pending |
| AGNT-03 | — | Pending |
| AGNT-04 | — | Pending |
| AGNT-05 | — | Pending |

**Coverage:**
- v1.1 requirements: 16 total
- Mapped to phases: 0
- Unmapped: 16

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after initial definition*
