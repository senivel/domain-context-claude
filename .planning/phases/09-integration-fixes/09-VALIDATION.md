---
phase: 9
slug: integration-fixes
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-03-16
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification (markdown skill files, no automated tests) |
| **Config file** | none |
| **Quick run command** | Read modified lines in changed files |
| **Full suite command** | Read both skill files end-to-end, trace logic for each fix |
| **Estimated runtime** | ~10 seconds (file reads only) |

---

## Sampling Rate

- **After every task commit:** Read the modified file, verify the specific lines changed
- **After every plan wave:** Read both skill files end-to-end, trace all 3 fixes
- **Before `/gsd:verify-work`:** Full read of both files confirms fixes applied correctly
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | ADDC-04, REFR-04 | manual-only | Read `commands/dc/add.md` Step 5, verify token replace before comment strip and verified comment exemption | N/A | ⬜ pending |
| 09-01-02 | 01 | 1 | EXPL-03, VALD-05 | manual-only | Read `commands/dc/validate.md` execution_context orphan entry formats, verify em dash | N/A | ⬜ pending |
| 09-01-03 | 01 | 1 | VALD-05 | manual-only | Read `commands/dc/validate.md` Step 8 Broken Links fix, verify mkdir -p before write | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework or stubs needed — these are markdown skill file edits verified by reading.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| dc:add created files include verified inline comment | ADDC-04, REFR-04 | Markdown skill file — no runtime to test | Read Step 5 of add.md, confirm token replacement occurs before comment stripping and that verified comment is exempted |
| dc:validate orphan registration uses em dash | EXPL-03, VALD-05 | Markdown skill file — no runtime to test | Read execution_context orphan entry format lines in validate.md, confirm ` — ` not ` -- ` |
| dc:validate broken link fix handles missing dirs | VALD-05 | Markdown skill file — no runtime to test | Read Step 8 broken link fix in validate.md, confirm mkdir -p before file write |

---

## Validation Sign-Off

- [x] All tasks have manual verification instructions
- [x] Sampling continuity: every task has verification
- [x] Wave 0 covers all MISSING references (none needed)
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
