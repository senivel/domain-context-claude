---
phase: 14
slug: gsd-bridge-template
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bash (validate-templates.sh) |
| **Config file** | tools/validate-templates.sh |
| **Quick run command** | `bash tools/validate-templates.sh .` |
| **Full suite command** | `bash tools/validate-templates.sh .` |
| **Estimated runtime** | ~1 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bash tools/validate-templates.sh .`
- **After every plan wave:** Run `bash tools/validate-templates.sh .`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | BRIDGE-01 | file-exists | `test -f templates/gsd-agents-snippet.md` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | BRIDGE-01 | content-check | `grep 'gsd-bridge:start' templates/gsd-agents-snippet.md` | ❌ W0 | ⬜ pending |
| 14-01-03 | 01 | 1 | BRIDGE-03 | content-check | `grep -q 'dc:extract' templates/gsd-agents-snippet.md` | ❌ W0 | ⬜ pending |
| 14-01-04 | 01 | 1 | BRIDGE-03 | content-check | `grep -q '.planning/PROJECT.md' templates/gsd-agents-snippet.md` | ❌ W0 | ⬜ pending |
| 14-01-05 | 01 | 1 | BRIDGE-01 | integration | `bash tools/validate-templates.sh .` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `templates/gsd-agents-snippet.md` — the template file itself (created by plan)

*Existing infrastructure covers validation script updates.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Template content is clear and helpful | BRIDGE-03 | Subjective quality | Read template, verify instructions are actionable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
