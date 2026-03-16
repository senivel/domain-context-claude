---
phase: 08
slug: refresh
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-16
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual validation (skill files are markdown, not executable code) |
| **Config file** | none |
| **Quick run command** | Run `/dc:refresh` in a test project |
| **Full suite command** | Run all dc:refresh scenarios below |
| **Estimated runtime** | ~2 minutes (manual testing) |

---

## Sampling Rate

- **After every task commit:** Verify skill file structure is valid markdown with correct frontmatter
- **After every plan wave:** Run `/dc:refresh` scenarios in test project
- **Before `/gsd:verify-work`:** All 5 scenarios must pass
- **Max feedback latency:** N/A (manual verification)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | REFR-01 | manual | Run `/dc:refresh` and verify stale entries identified | N/A | ⬜ pending |
| 08-01-02 | 01 | 1 | REFR-02 | manual | Verify entry shown alongside relevant source code | N/A | ⬜ pending |
| 08-01-03 | 01 | 1 | REFR-03 | manual | Confirm accurate entry, verify date bumped in both locations | N/A | ⬜ pending |
| 08-01-04 | 01 | 1 | REFR-04 | manual | Modify source code to create drift, verify diff proposed | N/A | ⬜ pending |
| 08-01-05 | 01 | 1 | REFR-05 | manual | Verify proposed updates show old vs new per section | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Skill files are markdown documents tested by manual execution — no test framework infrastructure needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stale entry identification | REFR-01 | Claude parses dates at runtime | Run `/dc:refresh` with entries >90 days old |
| Code-aware assessment | REFR-02 | Claude reads and reasons about code | Verify code snippets shown alongside entry |
| Date bump (both locations) | REFR-03 | File writes at runtime | Confirm both MANIFEST.md and context file updated |
| Drift detection with diffs | REFR-04 | Claude compares content vs code | Modify code, run refresh, verify diff |
| Specific content proposals | REFR-05 | Claude generates update proposals | Check old vs new shown per changed section |

---

## Validation Sign-Off

- [x] All tasks have manual verification mapped
- [x] Sampling continuity: manual verification covers all requirements
- [x] Wave 0 covers all MISSING references (none needed)
- [x] No watch-mode flags
- [x] Feedback latency: N/A (manual)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-16
