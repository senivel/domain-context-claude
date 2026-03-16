---
phase: 05-validate-core
plan: 01
subsystem: validation
tags: [manifest-parsing, structural-integrity, domain-context]

# Dependency graph
requires:
  - phase: 04-explore
    provides: MANIFEST.md parsing patterns and entry format conventions
provides:
  - dc:validate skill with broken link, orphan file, and stale entry detection
affects: [06-validate-ux, 08-refresh]

# Tech tracking
tech-stack:
  added: []
  patterns: [read-only validation skill, grouped check output format, severity-based reporting]

key-files:
  created: [commands/dc/validate.md]
  modified: []

key-decisions:
  - "Read-only skill: allowed-tools limited to Read + Glob only (no Write, no Bash) -- validation never mutates"
  - "Reused dc:explore MANIFEST.md parsing patterns exactly for consistency"
  - "Three-group output format with severity levels: errors (broken links, orphans) vs warnings (stale entries)"

patterns-established:
  - "Grouped validation output: header with icon + count, items beneath, summary line"
  - "Clean state displays all check groups with checkmark and (0) -- never hides passing checks"

requirements-completed: [VALD-01, VALD-02, VALD-03]

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 5 Plan 01: Validate Core Summary

**dc:validate skill with broken link detection, orphan file discovery, and stale entry flagging -- grouped output with severity levels**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-16T02:08:00Z
- **Completed:** 2026-03-16T02:23:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Created dc:validate skill file covering all three structural integrity checks (VALD-01, VALD-02, VALD-03)
- Broken link detection resolves MANIFEST.md paths relative to .context/ and verifies file existence
- Orphan file discovery scans .context/ subdirectories and CONTEXT.md files, excluding .gitkeep and root files
- Stale entry flagging checks verified dates against 90-day threshold
- Verified on this project's own .context/ -- all checks pass with 0 issues across 5 entries

## Task Commits

Each task was committed atomically:

1. **Task 1: Create dc:validate skill file** - `ef8e0d3` (feat)
2. **Task 2: Verify dc:validate on this project** - checkpoint:human-verify (approved by orchestrator)

## Files Created/Modified
- `commands/dc/validate.md` - dc:validate skill file with structural integrity checks (122 lines)

## Decisions Made
- Allowed-tools restricted to Read and Glob only -- validation is strictly read-only, mutation deferred to Phase 6
- Reused exact MANIFEST.md entry format parsing from dc:explore for consistency across skills
- Output groups always shown (even when count is 0) so users see the full validation scope
- Anti-patterns explicitly documented in skill: no Access Levels checking, no .gitkeep flagging, no auto-fix offers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- dc:validate is complete and verified -- ready for Phase 6 (Validate UX) to add conversational presentation and fix offers
- MANIFEST.md parsing patterns now established across two skills (dc:explore, dc:validate), providing stable foundation for mutation skills

## Self-Check: PASSED

- FOUND: commands/dc/validate.md
- FOUND: ef8e0d3

---
*Phase: 05-validate-core*
*Completed: 2026-03-15*
