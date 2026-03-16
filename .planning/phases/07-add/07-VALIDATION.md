---
phase: 07
slug: add
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-16
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual validation (skill files are markdown, not executable code) |
| **Config file** | none |
| **Quick run command** | Run `/dc:add` in a test project |
| **Full suite command** | Run all dc:add scenarios below |
| **Estimated runtime** | ~2 minutes (manual testing) |

---

## Sampling Rate

- **After every task commit:** Verify skill file structure is valid markdown with correct frontmatter
- **After every plan wave:** Run `/dc:add` scenarios in test project
- **Before `/gsd:verify-work`:** All 7 scenarios must pass
- **Max feedback latency:** N/A (manual verification)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | ADDC-01 | manual | Run `/dc:add` and verify file created | N/A | ⬜ pending |
| 07-01-02 | 01 | 1 | ADDC-02 | manual | Run `/dc:add decision` and `/dc:add` (no arg) | N/A | ⬜ pending |
| 07-01-03 | 01 | 1 | ADDC-03 | manual | Create decisions 001-003, run `/dc:add decision`, verify 004 | N/A | ⬜ pending |
| 07-01-04 | 01 | 1 | ADDC-04 | manual | Provide rich description, verify template sections filled | N/A | ⬜ pending |
| 07-01-05 | 01 | 1 | ADDC-05 | manual | Add entry with multi-word title, verify filename | N/A | ⬜ pending |
| 07-01-06 | 01 | 1 | ADDC-06 | manual | After add, read MANIFEST.md and verify new entry line | N/A | ⬜ pending |
| 07-01-07 | 01 | 1 | ADDC-07 | manual | Mention "confidential" in description, verify .context.local/ used | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Skill files are markdown documents tested by manual execution — no test framework infrastructure needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| File creation from description | ADDC-01 | Skill output produced by Claude at runtime | Run `/dc:add`, provide description, verify file created |
| Type argument handling | ADDC-02 | Requires running skill with/without arguments | Run `/dc:add decision` vs `/dc:add` |
| ADR numbering | ADDC-03 | Requires existing decision files on disk | Create test decisions, run `/dc:add decision` |
| Freeform extraction | ADDC-04 | Claude interprets prose at runtime | Provide rich description, check template sections |
| Kebab-case naming | ADDC-05 | Runtime filename derivation | Add entry with multi-word title |
| MANIFEST.md update | ADDC-06 | File modification at runtime | Verify new entry line in correct section |
| Access level routing | ADDC-07 | Requires detecting private keywords | Mention "confidential", verify .context.local/ |

---

## Validation Sign-Off

- [x] All tasks have manual verification mapped
- [x] Sampling continuity: manual verification covers all requirements
- [x] Wave 0 covers all MISSING references (none needed)
- [x] No watch-mode flags
- [x] Feedback latency: N/A (manual)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-16
