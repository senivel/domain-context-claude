---
phase: 23
slug: conceptual-and-contributor-content
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Lychee link checker + Astro build |
| **Config file** | `docs/astro.config.mjs` |
| **Quick run command** | `cd docs && npm run build` |
| **Full suite command** | `cd docs && npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd docs && npm run build`
- **After every plan wave:** Run `cd docs && npm run build` + manual visual check
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 23-01-01 | 01 | 1 | CONT-05, CONT-06 | smoke | `cd docs && npm run build` | Will exist | ⬜ pending |
| 23-01-02 | 01 | 1 | CONT-07 | smoke | `cd docs && npm run build` | Will exist | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Architecture page content accuracy | CONT-05 | Content quality requires human review | Verify bridge pattern diagram, module map, hook lifecycle match ARCHITECTURE.md |
| Spec overview completeness | CONT-06 | Domain knowledge required | Verify three pillars, directory structure, tool positioning |
| Contributing guide accuracy | CONT-07 | Process knowledge required | Verify dev setup steps work, conventions match AGENTS.md |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
