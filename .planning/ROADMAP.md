# Roadmap: Domain Context for Claude Code

## Overview

This milestone delivers the five core skills (dc:init, dc:explore, dc:validate, dc:add, dc:refresh) that give Claude Code native awareness of the Domain Context specification. The build order follows the dependency chain: templates first (all skills read them), then dc:init (creates the .context/ that all other skills operate on), then read-only skills (establish manifest parsing), then mutation skills (reuse parsing patterns for writes). Each phase delivers a verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Templates** - Create and verify all template files against the Domain Context spec
- [x] **Phase 2: Init Core** - dc:init creates .context/ structure on fresh projects
- [x] **Phase 3: Init Idempotency** - dc:init handles existing projects safely
- [x] **Phase 4: Explore** - dc:explore parses and displays domain context (completed 2026-03-16)
- [x] **Phase 5: Validate Core** - dc:validate checks structural integrity (completed 2026-03-16)
- [x] **Phase 6: Validate UX** - dc:validate presents results conversationally and offers fixes (completed 2026-03-16)
- [x] **Phase 7: Add** - dc:add creates new domain entries from conversation (completed 2026-03-16)
- [ ] **Phase 8: Refresh** - dc:refresh reviews and updates stale entries
- [ ] **Phase 9: Integration Bug Fixes** - Fix 3 minor cross-phase integration issues from audit

## Phase Details

### Phase 1: Templates
**Goal**: All template files exist, match the Domain Context spec exactly, and use placeholder tokens for dynamic content
**Depends on**: Nothing (first phase)
**Requirements**: TMPL-01, TMPL-02, TMPL-03
**Success Criteria** (what must be TRUE):
  1. Template files exist for MANIFEST.md, CONTEXT.md, domain-concept.md, decision.md, constraint.md, and AGENTS.md.snippet in the templates/ directory
  2. Each template's required sections match the Domain Context spec at ~/code/domain-context/SPEC.md
  3. All dynamic content positions use `{placeholder}` tokens that skills can fill at runtime
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Create all 8 template files matching Domain Context spec
- [ ] 01-02-PLAN.md — Create validation script and verify templates are spec-compliant

### Phase 2: Init Core
**Goal**: User can run /dc:init on a fresh project and get a complete, correct .context/ setup
**Depends on**: Phase 1
**Requirements**: INIT-01, INIT-02, INIT-03, INIT-04, INIT-05, INIT-06
**Success Criteria** (what must be TRUE):
  1. Running /dc:init creates .context/MANIFEST.md populated from the template
  2. Running /dc:init creates domain/, decisions/, constraints/ subdirectories with .gitkeep files
  3. ARCHITECTURE.md skeleton exists in the project root after init (created if absent)
  4. AGENTS.md contains the domain context snippet with sentinel comment after init
  5. CLAUDE.md exists with @AGENTS.md pointer after init (created if absent)
  6. .gitignore contains .context.local/ entry after init
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Create dc:init skill file with template resolution, metadata inference, and file scaffolding
- [ ] 02-02-PLAN.md — End-to-end test of dc:init on fresh project with human verification

### Phase 3: Init Idempotency
**Goal**: Running /dc:init on an existing project is safe and informative -- nothing is overwritten, the user sees what happened
**Depends on**: Phase 2
**Requirements**: INIT-07, INIT-08, INIT-09, INIT-10
**Success Criteria** (what must be TRUE):
  1. Running /dc:init on a project with existing .context/ warns the user and only creates missing files
  2. dc:init resolves templates from either global (~/.claude/domain-context/templates/) or local (.claude/domain-context/templates/) install location
  3. dc:init prints a summary showing each file with created/skipped/updated status
  4. Running /dc:init twice produces identical results -- second run reports all files as skipped
**Plans**: 1 plan

Plans:
- [x] 03-01-PLAN.md — Rewrite dc:init for idempotent behavior with summary output

### Phase 4: Explore
**Goal**: User can browse and search domain context from within Claude Code
**Depends on**: Phase 2
**Requirements**: EXPL-01, EXPL-02, EXPL-03, EXPL-04, EXPL-05, EXPL-06
**Success Criteria** (what must be TRUE):
  1. Running /dc:explore shows a summary with counts by type (domain concepts, decisions, constraints)
  2. Each manifest entry displays its freshness status, with entries older than 90 days flagged as stale
  3. Running /dc:explore [keyword] finds and displays the content of matching entries
  4. Running /dc:explore on a project without .context/ suggests running /dc:init
  5. Explore shows the manifest summary first, then drills into specific entries only when the user asks
  6. Explore discovers and lists per-module CONTEXT.md files found throughout the codebase
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — Create dc:explore skill file with manifest parsing, freshness display, keyword search, and progressive disclosure
- [x] 04-02-PLAN.md — Human verification of dc:explore on this project's .context/
- [ ] 04-03-PLAN.md — Gap closure: Add Glob-based CONTEXT.md filesystem discovery (EXPL-06)

### Phase 5: Validate Core
**Goal**: User can check the structural integrity of their domain context
**Depends on**: Phase 4
**Requirements**: VALD-01, VALD-02, VALD-03
**Success Criteria** (what must be TRUE):
  1. Running /dc:validate reports any MANIFEST.md entries that point to nonexistent files
  2. Running /dc:validate reports orphan files in .context/ subdirectories not referenced in MANIFEST.md
  3. Running /dc:validate flags entries with verified dates older than 90 days
**Plans**: 1 plan

Plans:
- [ ] 05-01-PLAN.md — Create dc:validate skill file with broken link, orphan, and stale entry checks plus human verification

### Phase 6: Validate UX
**Goal**: Validation results are conversational and actionable -- the user understands issues and can fix them in-place
**Depends on**: Phase 5
**Requirements**: VALD-04, VALD-05, VALD-06
**Success Criteria** (what must be TRUE):
  1. Validation results are presented in plain language (not raw script output or file paths alone)
  2. After showing issues, dc:validate offers to fix them (update MANIFEST.md, create missing files, update dates)
  3. dc:validate checks that AGENTS.md imports @.context/MANIFEST.md and @ARCHITECTURE.md
**Plans**: 1 plan

Plans:
- [ ] 06-01-PLAN.md — Enhance dc:validate with conversational output, AGENTS.md import check, and per-group fix offers

### Phase 7: Add
**Goal**: User can create new domain concepts, decisions, or constraints from a conversation without manually editing files
**Depends on**: Phase 5
**Requirements**: ADDC-01, ADDC-02, ADDC-03, ADDC-04, ADDC-05, ADDC-06, ADDC-07
**Success Criteria** (what must be TRUE):
  1. Running /dc:add creates a new domain concept, decision, or constraint file from the user's description
  2. dc:add accepts the entry type as an argument or asks the user to choose
  3. For decisions, dc:add auto-detects the next ADR number by scanning existing files
  4. dc:add extracts structured template sections from freeform user description
  5. Created files use kebab-case naming and MANIFEST.md is updated with the new entry and today's verified date
  6. dc:add respects access levels -- private entries go to .context.local/, public to .context/
**Plans**: 2 plans

Plans:
- [ ] 07-01-PLAN.md — Create dc:add skill file with type selection, freeform extraction, ADR numbering, and MANIFEST.md integration
- [ ] 07-02-PLAN.md — Human verification of dc:add end-to-end on this project

### Phase 8: Refresh
**Goal**: User can review stale domain context entries and update them based on current code reality
**Depends on**: Phase 7
**Requirements**: REFR-01, REFR-02, REFR-03, REFR-04, REFR-05
**Success Criteria** (what must be TRUE):
  1. Running /dc:refresh identifies all domain context entries with verified dates older than 90 days
  2. For each stale entry, dc:refresh reads the entry alongside relevant source code to assess whether it is still accurate
  3. If an entry is still accurate, dc:refresh updates the verified date in both the context file and MANIFEST.md
  4. If an entry has drifted from the code, dc:refresh proposes specific content updates with diffs before writing
**Plans**: 2 plans

Plans:
- [ ] 08-01-PLAN.md — Create dc:refresh skill file with staleness detection, code-aware assessment, and per-entry update workflow
- [ ] 08-02-PLAN.md — Human verification of dc:refresh end-to-end on this project

### Phase 9: Integration Bug Fixes
**Goal**: Fix 3 minor cross-phase integration issues identified by milestone audit — no requirements are unsatisfied, but integration quality is degraded
**Depends on**: Phase 7, Phase 6
**Requirements**: ADDC-04, REFR-04, EXPL-03, VALD-05 (integration quality fixes)
**Gap Closure:** Closes INT-01, INT-02, INT-03 from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. Files created by dc:add include `<!-- verified: YYYY-MM-DD -->` inline comment (INT-01 fix: swap token replacement and comment stripping order)
  2. dc:validate orphan registration writes ` — ` (em dash) not ` -- ` in MANIFEST.md entries (INT-02 fix)
  3. dc:validate broken link fix creates target directories before writing files (INT-03 fix: add mkdir -p guard)
**Plans**: TBD

Plans:
- [ ] 09-01-PLAN.md — Fix all 3 integration issues in dc:add and dc:validate skills

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Templates | 2/2 | Complete | 2026-03-12 |
| 2. Init Core | 2/2 | Complete | 2026-03-12 |
| 3. Init Idempotency | 1/1 | Complete | 2026-03-13 |
| 4. Explore | 3/3 | Complete | 2026-03-16 |
| 5. Validate Core | 1/1 | Complete   | 2026-03-16 |
| 6. Validate UX | 1/1 | Complete   | 2026-03-16 |
| 7. Add | 0/2 | Not started | - |
| 8. Refresh | 0/2 | Not started | - |
| 9. Integration Bug Fixes | 0/1 | Not started | - |
