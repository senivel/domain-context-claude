# Requirements: Domain Context for Claude Code — Core Skills

**Defined:** 2026-03-11
**Core Value:** Developers can codify and maintain domain knowledge alongside code so AI assistants always have accurate business context

## v1 Requirements

Requirements for Milestone 1 (Core Skills). Each maps to roadmap phases.

### Templates

- [x] **TMPL-01**: Template files exist for MANIFEST.md, CONTEXT.md, domain-concept.md, decision.md, constraint.md, and AGENTS.md.snippet
- [x] **TMPL-02**: Templates match the Domain Context spec's required sections exactly
- [x] **TMPL-03**: Templates use `{placeholder}` tokens for dynamic content

### Init

- [ ] **INIT-01**: User can run /dc:init to create .context/ directory with MANIFEST.md
- [ ] **INIT-02**: Init creates domain/, decisions/, constraints/ subdirectories with .gitkeep
- [ ] **INIT-03**: Init scaffolds ARCHITECTURE.md skeleton if file doesn't already exist
- [ ] **INIT-04**: Init appends AGENTS.md snippet idempotently (sentinel comment prevents duplicate injection)
- [ ] **INIT-05**: Init creates thin CLAUDE.md with @AGENTS.md pointer if file doesn't already exist
- [ ] **INIT-06**: Init adds .context.local/ to .gitignore (append if not already present)
- [ ] **INIT-07**: Init detects existing .context/ and warns user before proceeding
- [ ] **INIT-08**: Init resolves templates from global (~/.claude/domain-context/templates/) or local (.claude/domain-context/templates/) install
- [ ] **INIT-09**: Init prints summary showing each file with created/skipped/updated status
- [ ] **INIT-10**: Running /dc:init twice on the same project is safe — only creates what's missing

### Explore

- [ ] **EXPL-01**: User can run /dc:explore to see a summary of domain context (counts by type: domain concepts, decisions, constraints)
- [ ] **EXPL-02**: Explore shows freshness status per entry (flags entries with verified date >90 days old)
- [ ] **EXPL-03**: User can run /dc:explore [keyword] to find and read a specific entry by name
- [ ] **EXPL-04**: Explore suggests /dc:init when no .context/ directory exists
- [ ] **EXPL-05**: Explore uses progressive disclosure — shows manifest summary first, drills into specific entries on demand
- [ ] **EXPL-06**: Explore discovers and lists per-module CONTEXT.md files found throughout the codebase

### Validate

- [ ] **VALD-01**: User can run /dc:validate to check MANIFEST.md entries point to existing files
- [ ] **VALD-02**: Validate detects orphan files in .context/ subdirs not referenced in MANIFEST.md
- [ ] **VALD-03**: Validate checks freshness (flags entries with verified date >90 days old)
- [ ] **VALD-04**: Validate presents results conversationally (plain language, not raw script output)
- [ ] **VALD-05**: Validate offers to fix issues found (update MANIFEST.md, create missing files, update dates)
- [ ] **VALD-06**: Validate cross-references AGENTS.md to confirm it imports @.context/MANIFEST.md and @ARCHITECTURE.md

### Add

- [ ] **ADDC-01**: User can run /dc:add to create a new domain concept, decision, or constraint
- [ ] **ADDC-02**: Add accepts type as argument or prompts user interactively
- [ ] **ADDC-03**: Add auto-detects next ADR number for decisions by scanning existing files
- [ ] **ADDC-04**: Add fills template sections from user's freeform description (conversational extraction)
- [ ] **ADDC-05**: Add creates file with kebab-case naming convention
- [ ] **ADDC-06**: Add updates MANIFEST.md with new entry in correct section, verified date = today
- [ ] **ADDC-07**: Add respects access levels (public → .context/, private → .context.local/)

### Refresh

- [ ] **REFR-01**: User can run /dc:refresh to review stale domain context entries
- [ ] **REFR-02**: Refresh parses MANIFEST.md for verified dates and identifies entries older than 90 days
- [ ] **REFR-03**: Refresh reads each stale entry alongside relevant source code to assess accuracy (code-aware review)
- [ ] **REFR-04**: Refresh updates verified date in both context file and MANIFEST.md if content is still accurate
- [ ] **REFR-05**: Refresh proposes content updates with specific diffs when context has drifted from code

## v2 Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Hooks (Milestone 2)

- **HOOK-01**: SessionStart hook warns about stale domain context entries
- **HOOK-02**: PostToolUse hook reminds about nearby CONTEXT.md when editing files
- **HOOK-03**: Path-specific rules loaded when editing .context/ files

### GSD Integration (Milestone 3)

- **GSDX-01**: /dc:extract reads .planning/ artifacts and proposes new domain context
- **GSDX-02**: AGENTS.md snippet makes GSD agents domain-context-aware automatically

### Distribution (Milestone 4)

- **DIST-01**: npm package installable via npx domain-context-cc
- **DIST-02**: Installer merges hook config into settings.json without clobbering
- **DIST-03**: Uninstall removes all dc-prefixed files and hooks

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auto-generate domain context from code | Domain context captures WHY, not WHAT — auto-generation creates false confidence |
| Auto-refresh on session start | Too slow/noisy; spec requires extraction to be user-initiated |
| Schema enforcement / strict prose validation | Domain context is documentation, not config — validate structure only |
| Interactive wizard for dc:init | Multi-step prompts slow in Claude Code — create with defaults, customize after |
| Diff/merge for context conflicts | Git handles this; markdown files are trivial to merge |
| Template customization UI | Power users edit template files directly |
| Automatic full MANIFEST.md rewrite | Risk losing manual formatting — only append/update specific fields |
| MCP server | Deferred post-MVP per ADR-003 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TMPL-01 | Phase 1 | Complete |
| TMPL-02 | Phase 1 | Complete |
| TMPL-03 | Phase 1 | Complete |
| INIT-01 | Phase 2 | Pending |
| INIT-02 | Phase 2 | Pending |
| INIT-03 | Phase 2 | Pending |
| INIT-04 | Phase 2 | Pending |
| INIT-05 | Phase 2 | Pending |
| INIT-06 | Phase 2 | Pending |
| INIT-07 | Phase 3 | Pending |
| INIT-08 | Phase 3 | Pending |
| INIT-09 | Phase 3 | Pending |
| INIT-10 | Phase 3 | Pending |
| EXPL-01 | Phase 4 | Pending |
| EXPL-02 | Phase 4 | Pending |
| EXPL-03 | Phase 4 | Pending |
| EXPL-04 | Phase 4 | Pending |
| EXPL-05 | Phase 4 | Pending |
| EXPL-06 | Phase 4 | Pending |
| VALD-01 | Phase 5 | Pending |
| VALD-02 | Phase 5 | Pending |
| VALD-03 | Phase 5 | Pending |
| VALD-04 | Phase 6 | Pending |
| VALD-05 | Phase 6 | Pending |
| VALD-06 | Phase 6 | Pending |
| ADDC-01 | Phase 7 | Pending |
| ADDC-02 | Phase 7 | Pending |
| ADDC-03 | Phase 7 | Pending |
| ADDC-04 | Phase 7 | Pending |
| ADDC-05 | Phase 7 | Pending |
| ADDC-06 | Phase 7 | Pending |
| ADDC-07 | Phase 7 | Pending |
| REFR-01 | Phase 8 | Pending |
| REFR-02 | Phase 8 | Pending |
| REFR-03 | Phase 8 | Pending |
| REFR-04 | Phase 8 | Pending |
| REFR-05 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after roadmap creation (fine granularity, 8 phases)*
