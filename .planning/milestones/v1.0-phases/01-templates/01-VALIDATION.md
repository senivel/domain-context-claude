---
phase: 1
slug: templates
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell (bash) — no test framework detected |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `bash tools/validate-templates.sh` |
| **Full suite command** | `bash tools/validate-templates.sh` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `ls templates/*.md && grep -c '{' templates/*.md`
- **After every plan wave:** Run `bash tools/validate-templates.sh`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | TMPL-02, TMPL-03 | smoke | `bash tools/validate-templates.sh` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | TMPL-01 | smoke | `ls templates/{manifest,context,domain-concept,decision,constraint,agents-snippet,architecture,claude}.md` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | TMPL-02 | unit | `bash tools/validate-templates.sh` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | TMPL-03 | unit | `grep -P '\{[a-z_]+\}' templates/*.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tools/validate-templates.sh` — script that checks each template has correct headings per spec and uses `{placeholder}` pattern. Covers TMPL-02 and TMPL-03.
- [ ] `templates/` directory — does not exist yet (greenfield)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Templates match spec exactly | TMPL-02 | Heading text must be visually compared to spec Sections 6.1-6.7 | Open spec and template side-by-side, verify all required headings present |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
