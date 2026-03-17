---
phase: 15
slug: dc-init-gsd-detection
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bash (manual content checks) |
| **Config file** | none — inline grep/test commands |
| **Quick run command** | `grep -q 'gsd-bridge:start' commands/dc/init.md` |
| **Full suite command** | `grep -c 'Step 7.5' commands/dc/init.md && grep -c 'gsd-bridge' commands/dc/init.md && grep -c 'AGENTS.md (GSD)' commands/dc/init.md` |
| **Estimated runtime** | ~1 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 1 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | BRIDGE-02 | content-check | `grep -q 'gsd-bridge:start' commands/dc/init.md` | ✅ | ⬜ pending |
| 15-01-02 | 01 | 1 | BRIDGE-02 | content-check | `grep -q 'Step 7.5' commands/dc/init.md` | ✅ | ⬜ pending |
| 15-01-03 | 01 | 1 | BRIDGE-02 | content-check | `grep -q 'AGENTS.md (GSD)' commands/dc/init.md` | ✅ | ⬜ pending |
| 15-01-04 | 01 | 1 | BRIDGE-02 | content-check | `grep -q '.planning/PROJECT.md' commands/dc/init.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GSD detection flow is clear and follows existing patterns | BRIDGE-02 | Subjective quality | Read Step 7.5, verify it mirrors Step 7 structure |
| Sentinel replacement logic handles all 3 cases | BRIDGE-02 | Logic review | Verify create/skip/update branches exist |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 1s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
