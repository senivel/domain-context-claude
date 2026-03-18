---
phase: 22
slug: user-facing-content
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Astro build + lychee link checker |
| **Config file** | `docs/astro.config.mjs` + `.github/workflows/deploy-docs.yml` |
| **Quick run command** | `cd docs && npm run build` |
| **Full suite command** | `cd docs && npm run build && lychee --base 'https://senivel.github.io/domain-context-claude' dist/` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd docs && npm run build`
- **After every plan wave:** Run `cd docs && npm run build && lychee --base 'https://senivel.github.io/domain-context-claude' dist/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 01 | 1 | CONT-01 | smoke | `cd docs && npm run build` | N/A — content file | ⬜ pending |
| 22-01-02 | 01 | 1 | CONT-02 | smoke + link-check | `cd docs && npm run build` | N/A — content file | ⬜ pending |
| 22-01-03 | 01 | 1 | CONT-03 | smoke + link-check | `cd docs && npm run build` | N/A — content file | ⬜ pending |
| 22-01-04 | 01 | 1 | CONT-04 | smoke + link-check | `cd docs && npm run build` | N/A — content file | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed for content pages.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Landing page hero renders with correct value prop | CONT-01 | Visual layout verification | Run `cd docs && npm run dev`, visit localhost, verify hero section |
| Sidebar shows 3 groups with correct ordering | CONT-01 | Visual navigation structure | Run dev server, check sidebar has "Start Here", "Guides", "Reference" |
| CLI reference has all 6 commands with examples | CONT-04 | Content completeness | Open CLI reference page, verify dc:init through dc:extract present |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
