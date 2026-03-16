# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Core Skills

**Shipped:** 2026-03-16
**Phases:** 9 | **Plans:** 15

### What Was Built
- 8 spec-compliant templates covering all Domain Context file types
- 5 Claude Code skills: dc:init, dc:explore, dc:validate, dc:add, dc:refresh
- 1 validation script (67 automated checks)
- Full lifecycle coverage: create → browse → validate → add → refresh

### What Worked
- Template-first build order eliminated circular dependencies — every skill could reference templates immediately
- Phase-level verification caught 3 integration bugs before milestone close (INT-01, INT-02, INT-03)
- Gap closure cycle (audit → plan gaps → execute → re-audit) worked cleanly: 25/28 → 28/28 integration score
- Skills are self-contained markdown files — no compilation, no dependency management

### What Was Inefficient
- Human verification plans (02-02, 04-02, 07-02, 08-02) were largely deferred because skills weren't installed in the test environment
- Some ROADMAP.md plan checkboxes got out of sync with actual completion status — required manual fixes
- Phase 9 (integration fixes) could have been caught earlier if integration checking happened per-phase rather than only at milestone audit

### Patterns Established
- Dual-location verified dates (MANIFEST.md + inline comment) as the canonical freshness pattern
- Per-group fix offers with AskUserQuestion (validate UX pattern reusable for future skills)
- Sentinel-based idempotent injection for AGENTS.md modifications
- Skills reference templates by path, never inline — single source of truth

### Key Lessons
1. Integration bugs accumulate silently across phases — cross-phase integration checks should happen more frequently than just milestone audit
2. Format consistency matters at the character level — em dash vs double-dash caused a real parsing issue
3. Template ordering matters — replacing tokens before stripping comments is a non-obvious dependency that static verification caught

### Cost Observations
- Model mix: ~60% sonnet (verifiers, integration checker), ~40% opus (executors, orchestration)
- 6-day timeline for 9 phases, 15 plans
- Notable: Single-plan phases (3, 5, 6, 9) executed fastest; multi-plan phases with human verification added calendar time but not compute time

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 9 | 15 | Established template-first build order and gap closure cycle |

### Top Lessons (Verified Across Milestones)

1. Build shared infrastructure (templates, parsers) before consumers — eliminates blocking dependencies
2. Integration verification at milestone boundary catches cross-phase wiring issues that per-phase verification misses
