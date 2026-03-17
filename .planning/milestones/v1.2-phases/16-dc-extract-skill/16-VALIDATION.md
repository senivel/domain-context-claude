---
phase: 16
slug: dc-extract-skill
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bash (content checks + template validation) |
| **Config file** | tools/validate-templates.sh |
| **Quick run command** | `test -f commands/dc/extract.md && echo OK` |
| **Full suite command** | `test -f commands/dc/extract.md && grep -q 'dc:extract' commands/dc/extract.md && grep -q 'MANIFEST.md' commands/dc/extract.md && grep -q 'AskUserQuestion' commands/dc/extract.md && echo "All checks passed"` |
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
| 16-01-01 | 01 | 1 | SCAN-01 | content-check | `grep -q '.planning/' commands/dc/extract.md` | ❌ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | SCAN-02 | content-check | `grep -q 'No .context/' commands/dc/extract.md` | ❌ W0 | ⬜ pending |
| 16-01-03 | 01 | 1 | SCAN-03 | content-check | `grep -q 'dc:extract' commands/dc/extract.md` | ❌ W0 | ⬜ pending |
| 16-01-04 | 01 | 1 | CLASS-01,CLASS-02,CLASS-03 | content-check | `grep -c 'domain concept\|decision\|constraint' commands/dc/extract.md` | ❌ W0 | ⬜ pending |
| 16-01-05 | 01 | 1 | PROP-01 | content-check | `grep -q 'MANIFEST.md' commands/dc/extract.md` | ❌ W0 | ⬜ pending |
| 16-01-06 | 01 | 1 | PROP-02,PROP-03 | content-check | `grep -q 'AskUserQuestion' commands/dc/extract.md` | ❌ W0 | ⬜ pending |
| 16-01-07 | 01 | 1 | PROP-04 | content-check | `grep -q 'template' commands/dc/extract.md` | ❌ W0 | ⬜ pending |
| 16-01-08 | 01 | 1 | PROP-05 | content-check | `grep -q 'summary' commands/dc/extract.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `commands/dc/extract.md` — the skill file itself (created by plan)

*Existing infrastructure covers template validation and pattern checks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Extraction flow produces correct .context/ files | PROP-04 | Requires running skill against real .planning/ | Run /dc:extract on a project with completed phases |
| Accept/reject flow works correctly | PROP-02, PROP-03 | Interactive AskUserQuestion flow | Test accepting and rejecting individual proposals |
| Phase scoping filters correctly | SCAN-03 | Requires running with range argument | Run /dc:extract 14-15 and verify scope |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 1s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
