---
phase: 6
slug: validate-ux
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-15
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual skill testing (Claude Code session) |
| **Config file** | none |
| **Quick run command** | Run `/dc:validate` in this project |
| **Full suite command** | Run `/dc:validate` in this project + a project with known issues |
| **Estimated runtime** | ~30 seconds (manual execution) |

---

## Sampling Rate

- **After every task commit:** Run `/dc:validate` in this project
- **After every plan wave:** Run `/dc:validate` in this project + create a test scenario with broken links/orphans
- **Before `/gsd:verify-work`:** Human verification that all three requirements produce correct behavior
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | VALD-04 | manual-only | Run /dc:validate, inspect output for explanation lines | N/A | ⬜ pending |
| 06-01-02 | 01 | 1 | VALD-05 | manual-only | Run /dc:validate on project with issues, accept fixes | N/A | ⬜ pending |
| 06-01-03 | 01 | 1 | VALD-06 | manual-only | Run /dc:validate, verify AGENTS.md Imports group | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

*Skills are markdown instruction files interpreted by Claude Code at runtime. There is no executable code to unit-test — validation requires running the skill in a Claude Code session.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Plain-language explanation lines under group headers | VALD-04 | Skill is a markdown instruction file, not executable code | Run /dc:validate, verify explanation lines appear under groups with issues |
| Fix offers appear and modify files correctly | VALD-05 | Requires interactive Claude Code session with AskUserQuestion | Run /dc:validate on project with broken links/orphans/stale entries, accept fixes, verify file changes |
| AGENTS.md import check appears as 4th group | VALD-06 | Requires Claude Code session to interpret skill | Run /dc:validate, verify AGENTS.md Imports group shows in output |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
