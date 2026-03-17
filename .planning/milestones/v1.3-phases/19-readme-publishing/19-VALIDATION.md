---
phase: 19
slug: readme-publishing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none |
| **Quick run command** | `grep -q 'npx domain-context-cc' README.md` |
| **Full suite command** | `bash -c 'grep -q "npx domain-context-cc" README.md && grep -q "Quick Start" README.md && test $(grep -o "dc:" README.md | wc -l) -ge 6 && grep -q "GSD Integration" README.md && grep -q "\-\-uninstall" README.md'` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `grep -q 'npx domain-context-cc' README.md`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 1 | DOC-01 | smoke (grep) | `grep -q 'npx domain-context-cc' README.md` | N/A (inline) | ⬜ pending |
| 19-01-02 | 01 | 1 | DOC-02 | smoke (grep) | `grep -q 'Quick Start' README.md` | N/A (inline) | ⬜ pending |
| 19-01-03 | 01 | 1 | DOC-03 | smoke (grep) | `test $(grep -o 'dc:' README.md \| wc -l) -ge 6` | N/A (inline) | ⬜ pending |
| 19-01-04 | 01 | 1 | DOC-04 | smoke (grep) | `grep -q 'GSD Integration' README.md` | N/A (inline) | ⬜ pending |
| 19-01-05 | 01 | 1 | DOC-05 | smoke (grep) | `grep -q '\-\-uninstall' README.md` | N/A (inline) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Documentation validation uses simple grep checks, no test infrastructure needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Per-command paragraphs are accurate and helpful | DOC-03 | Content quality requires human judgment | Read each command paragraph; verify it matches the skill's actual behavior |
| Quick start flows end-to-end | DOC-02 | UX flow requires human walkthrough | Follow the 3 steps on a fresh project |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 1s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
