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

## Milestone: v1.1 — Hooks, Rules & Agent

**Shipped:** 2026-03-17
**Phases:** 4 | **Plans:** 4

### What Was Built
- SessionStart hook (`dc-freshness-check.js`, 91 lines) — warns about stale domain context entries >90 days
- PostToolUse hook (`dc-context-reminder.js`, 97 lines) — reminds to update CONTEXT.md when editing nearby files
- Path-scoped rule (`dc-context-editing.md`, 44 lines) — auto-injects formatting guidance for .context/ files
- Domain validator agent (`dc-domain-validator.md`, 86 lines) — checks code against documented business rules

### What Worked
- Autonomous execution mode worked end-to-end: discuss → plan → execute → verify for all 4 phases without manual intervention
- Pattern reuse from Phase 10 (stdin timeout, JSON output, graceful exit) made Phase 11 implementation fast
- Smart discuss with batch table proposals + "Accept all" reduced discussion overhead to ~2 questions per phase
- All 4 phases had clean verification passes on first attempt — no gap closure cycles needed

### What Was Inefficient
- VALIDATION.md frontmatter (`nyquist_compliant: false`) was never updated to `true` after execution — a documentation gap across all 4 phases
- Integration checker correctly identified that artifacts are in source dirs (hooks/, rules/, agents/) not install dirs (.claude/*) — but this is the planned Distribution milestone, not a v1.1 gap

### Patterns Established
- 3-second stdin timeout guard as universal hook safety pattern
- `globs:` (not `paths:`) for rule frontmatter — avoids Claude Code parser bug
- Defense-in-depth for tool scoping: settings.json `matcher` + in-code allowlist
- Session-scoped debouncing via `/tmp/{prefix}-{session_id}-{hash}.json` files
- Self-contained agent prompts with zero `@` references for portability

### Key Lessons
1. Autonomous mode is highly efficient for well-specified milestones — 4 phases completed in a single session
2. Infrastructure phases (rules, agents) are simpler than behavioral phases (hooks) — fewer grey areas, cleaner verification
3. VALIDATION.md frontmatter should be auto-updated by the executor, not left as manual post-execution work

### Cost Observations
- Model mix: ~50% opus (orchestration, execution), ~30% sonnet (verification, plan checking), ~20% sonnet (research)
- Single-session execution for entire milestone
- Notable: All phases were 1-plan phases — lean scope kept execution fast

---

## Milestone: v1.2 — GSD Integration

**Shipped:** 2026-03-17
**Phases:** 3 | **Plans:** 4

### What Was Built
- GSD bridge template (`templates/gsd-agents-snippet.md`, 13 lines) — sentinel-marked snippet for AGENTS.md injection
- dc:init GSD detection (Step 7.5 in `commands/dc/init.md`) — auto-detects .planning/PROJECT.md, prompts user if absent, sentinel-based idempotent injection/replacement
- dc:extract skill (`commands/dc/extract.md`, 244 lines) — 13-step scan-classify-propose-create pipeline extracting domain knowledge from completed GSD phases
- Template validation expanded to 91 checks covering all 6 dc:* skill files

### What Worked
- Autonomous execution continued to work well: all 3 phases completed in a single session with smart discuss → plan → execute → verify per phase
- Phase 14 (infrastructure) was correctly identified as pure infrastructure and skipped discuss — saved time
- Pattern reuse from dc:add for dc:extract (template resolution, MANIFEST.md updates, ADR numbering, kebab-case) made the most complex skill straightforward to plan
- Single-file modifications (Phases 14 and 15) resulted in clean, focused plans with instant verification

### What Was Inefficient
- Human verification checkpoints (Plan 16-02) were deferred again because skills aren't installed in a testable environment — same issue as v1.0
- VALIDATION.md nyquist_compliant frontmatter still not being flipped to true — third consecutive milestone with this gap
- Integration checker flagged implicit template placeholder replacement as a gap, but this is a shared design choice across dc:add and dc:extract — the checker doesn't have enough context to know this is intentional

### Patterns Established
- Step numbering with decimals (Step 7.5) to avoid renumbering when inserting into existing skills
- SUMMARY.md presence as completion signal — more reliable than ROADMAP.md status for dc:extract scanning
- Batch proposal table + per-item AskUserQuestion accept/reject — new UX pattern for multi-item review flows

### Key Lessons
1. Human verification continues to be the gap — a testing strategy for Claude Code skills (running them against real projects) would eliminate the largest category of deferred work
2. Infrastructure phases are fast wins — Phase 14 (template creation) took ~2 minutes end-to-end
3. Smart discuss batch tables work well when prior decisions exist to seed recommendations — Phase 15 and 16 had strong recommendations because of Phase 14 context

### Cost Observations
- Model mix: ~50% opus (orchestration, execution), ~35% sonnet (verification, plan checking, integration), ~15% sonnet (research)
- Single-session execution for entire milestone (same as v1.1)
- Notable: 3 phases × 4 plans is the leanest milestone yet — GSD integration was well-scoped

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 9 | 15 | Established template-first build order and gap closure cycle |
| v1.1 | 4 | 4 | Autonomous execution mode; pattern reuse across phases |
| v1.2 | 3 | 4 | Lean scoping; smart discuss with prior-decision seeding |

### Top Lessons (Verified Across Milestones)

1. Build shared infrastructure (templates, parsers) before consumers — eliminates blocking dependencies
2. Integration verification at milestone boundary catches cross-phase wiring issues that per-phase verification misses
3. Pattern reuse between phases accelerates both planning and execution — establish patterns early in a milestone
4. Human verification of Claude Code skills remains the primary gap — a testable environment is needed (3 milestones running)
5. Nyquist VALIDATION.md sign-off should be automated — manual frontmatter updates are consistently missed
