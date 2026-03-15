---
phase: 4
slug: explore
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bash (shell smoke tests) |
| **Config file** | none — inline shell commands |
| **Quick run command** | `test -f commands/dc/explore.md && echo PASS` |
| **Full suite command** | `bash -c 'test -f commands/dc/explore.md && head -20 commands/dc/explore.md | grep -q "name: dc:explore" && echo ALL_PASS'` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `test -f commands/dc/explore.md && echo PASS`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | EXPL-01 | manual-only | N/A — skill output is conversational | N/A | ⬜ pending |
| 04-01-02 | 01 | 1 | EXPL-02 | manual-only | N/A — requires Claude to run the skill | N/A | ⬜ pending |
| 04-01-03 | 01 | 1 | EXPL-03 | manual-only | N/A — requires Claude to run the skill | N/A | ⬜ pending |
| 04-01-04 | 01 | 1 | EXPL-04 | manual-only | N/A — requires Claude to run the skill | N/A | ⬜ pending |
| 04-01-05 | 01 | 1 | EXPL-05 | manual-only | N/A — requires Claude to run the skill | N/A | ⬜ pending |
| 04-01-06 | 01 | 1 | EXPL-06 | manual-only | N/A — requires Claude to run the skill | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `commands/dc/explore.md` — skill file created with valid frontmatter and required sections

*Structural smoke tests validate file existence and format only.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Summary with counts by type | EXPL-01 | Skill output is conversational, produced by Claude interpreting markdown | Run `/dc:explore` on a project with .context/, verify grouped counts |
| Freshness status per entry | EXPL-02 | Requires Claude runtime to parse dates and calculate staleness | Run `/dc:explore` with entries >90 days old, verify STALE flag |
| Keyword search finds entries | EXPL-03 | Requires Claude runtime to search file content | Run `/dc:explore bridge`, verify matching entries shown |
| Suggests dc:init when no .context/ | EXPL-04 | Requires Claude runtime in a project without .context/ | Run `/dc:explore` in bare project, verify suggestion |
| Progressive disclosure flow | EXPL-05 | Requires interactive AskUserQuestion flow | Run `/dc:explore`, verify summary-first then drill-in |
| Lists module CONTEXT.md files | EXPL-06 | Requires Claude runtime to read MANIFEST.md | Run `/dc:explore` with Module Context Files in MANIFEST.md |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: all behaviors are manual-only (no automated gaps possible)
- [ ] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 1s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
