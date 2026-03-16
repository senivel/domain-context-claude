---
phase: 06-validate-ux
plan: 01
subsystem: validation
tags: [manifest-parsing, interactive-fixes, agents-md, domain-context]

# Dependency graph
requires:
  - phase: 05-validate-core
    provides: dc:validate skill with read-only structural checks and grouped output format
provides:
  - dc:validate enhanced with conversational output, AGENTS.md import check, and per-group interactive fix flow
affects: [07-add, 08-refresh]

# Tech tracking
tech-stack:
  added: []
  patterns: [interactive-fix-flow, AskUserQuestion-per-group, template-based-file-creation]

key-files:
  created: []
  modified: [commands/dc/validate.md]

key-decisions:
  - "Per-group fix offers via AskUserQuestion rather than a single bulk fix prompt"
  - "AGENTS.md import check uses warning severity (not error) since AGENTS.md is optional"
  - "Template resolution reuses dc:init pattern: local .claude/domain-context/templates/ then global ~/.claude/domain-context/templates/"
  - "Post-fix summary ends with 'Run /dc:validate again to confirm.' -- no automatic re-run"

patterns-established:
  - "Interactive fix flow: display issues grouped, then offer per-group fixes with recommended option first"
  - "Path-to-section mapping for MANIFEST.md registration (domain/ -> Domain Concepts, decisions/ -> Architecture Decisions, etc.)"
  - "Path-to-template mapping for file creation from broken links"

requirements-completed: [VALD-04, VALD-05, VALD-06]

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 6 Plan 01: Validate UX Summary

**dc:validate enhanced with plain-language explanations, AGENTS.md import checking, and per-group interactive fix offers using AskUserQuestion**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-16T02:30:00Z
- **Completed:** 2026-03-16T02:50:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Enhanced dc:validate with plain-language explanation lines under each group header that has issues (VALD-04)
- Added 4th check group "AGENTS.md Imports" that verifies @.context/MANIFEST.md and @ARCHITECTURE.md presence (VALD-06)
- Implemented per-group interactive fix flow via AskUserQuestion with options for broken links, orphan files, stale entries, and AGENTS.md imports (VALD-05)
- Broken link fixes can remove entries or create missing files from templates
- Orphan file fixes register untracked files in the correct MANIFEST.md section
- Stale entry fixes update verified dates in both MANIFEST.md and context files
- AGENTS.md import fixes add missing imports using sentinel block detection
- Post-fix summary displays changes made and prompts user to re-run validation
- Clean state (no issues) skips fix flow entirely, preserving Phase 5 behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance dc:validate with conversational output, AGENTS.md check, and fix flow** - `3be3196` (feat)
2. **Task 2: Verify dc:validate conversational output and fix flow** - checkpoint:human-verify (approved)

## Files Created/Modified
- `commands/dc/validate.md` - Enhanced validation skill with conversational output, AGENTS.md check, and interactive fix flow (163 lines added)

## Decisions Made
- Per-group AskUserQuestion pattern chosen over single bulk fix prompt for granular user control
- AGENTS.md warnings use warning severity (same icon as stale entries), not error severity
- Template resolution follows same pattern as dc:init (local then global install location)
- No automatic re-validation after fixes -- user explicitly re-runs to confirm

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- dc:validate now covers all VALD requirements (01-06) -- validation skill is feature-complete
- Interactive fix patterns (AskUserQuestion, template resolution, MANIFEST.md mutation) can be reused by dc:add and dc:refresh
- Path-to-section and path-to-template mappings established for future skills that register or create context files

## Self-Check: PASSED

- FOUND: commands/dc/validate.md
- FOUND: 3be3196

---
*Phase: 06-validate-ux*
*Completed: 2026-03-15*
