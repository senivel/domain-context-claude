---
phase: 20
slug: scaffold-starlight-site
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification (infrastructure phase) |
| **Config file** | none |
| **Quick run command** | `cd docs && npm run build` |
| **Full suite command** | `cd docs && npm run build && cd .. && npm pack --dry-run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd docs && npm run build`
- **After every plan wave:** Run `cd docs && npm run build && cd .. && npm pack --dry-run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | INFRA-01 | smoke | `test -f docs/package.json && cd docs && npm run build` | ❌ W0 | ⬜ pending |
| 20-01-02 | 01 | 1 | INFRA-04 | manual-only | `cd docs && npm run dev` (visual verify) | ❌ W0 | ⬜ pending |
| 20-01-03 | 01 | 1 | INFRA-01 | smoke | `npm pack --dry-run 2>&1 \| grep -c docs/ \| grep -q ^0$` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `docs/` directory — entire Starlight project (created by this phase)
- [ ] `.gitignore` updates for `docs/dist/`, `docs/.astro/`, `docs/node_modules/`

*Wave 0 IS the phase — scaffolding creates the test infrastructure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar navigation works | INFRA-04 | Visual/interactive feature | Run `cd docs && npm run dev`, verify sidebar renders and navigates |
| Full-text search works | INFRA-04 | Visual/interactive feature | Run dev server, type in search box, verify results appear |
| Dark/light mode toggle | INFRA-04 | Visual/interactive feature | Run dev server, click theme toggle, verify switch |
| Code highlighting with copy | INFRA-04 | Visual/interactive feature | Run dev server, verify code blocks have syntax highlighting and copy button |
| Responsive layout | INFRA-04 | Visual/interactive feature | Run dev server, resize browser, verify mobile layout |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
