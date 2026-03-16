---
phase: 5
slug: validate-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual validation (skill files are Claude instructions, not executable code) |
| **Config file** | none |
| **Quick run command** | Run `/dc:validate` on this project's own `.context/` |
| **Full suite command** | Run `/dc:validate` on projects with known issues (broken links, orphans, stale entries) |
| **Estimated runtime** | ~30 seconds (Claude execution time) |

---

## Sampling Rate

- **After every task commit:** Run `/dc:validate` on this project's own `.context/`
- **After every plan wave:** Verify all three check types produce correct output
- **Before `/gsd:verify-work`:** All three checks work correctly on clean state and error state
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | VALD-01 | manual | Run dc:validate on project with deleted .context/ files | N/A | ⬜ pending |
| 05-01-02 | 01 | 1 | VALD-02 | manual | Run dc:validate on project with unregistered files in .context/ subdirs | N/A | ⬜ pending |
| 05-01-03 | 01 | 1 | VALD-03 | manual | Run dc:validate on project with old verified dates | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

Skill files have no test infrastructure — verification is manual execution of the skill against known good/bad `.context/` states.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Broken link detection | VALD-01 | Skill file is Claude instructions, not executable code | 1. Delete a referenced .context/ file 2. Run /dc:validate 3. Verify broken link reported |
| Orphan file detection | VALD-02 | Skill file is Claude instructions, not executable code | 1. Add unreferenced file to .context/domain/ 2. Run /dc:validate 3. Verify orphan reported |
| Stale entry detection | VALD-03 | Skill file is Claude instructions, not executable code | 1. Set verified date >90 days ago 2. Run /dc:validate 3. Verify stale warning shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
