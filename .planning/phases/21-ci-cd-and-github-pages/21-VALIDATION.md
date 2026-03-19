---
phase: 21
slug: ci-cd-and-github-pages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | GitHub Actions (CI workflow validation) |
| **Config file** | `.github/workflows/deploy-docs.yml` |
| **Quick run command** | `cd docs && npm run build` |
| **Full suite command** | Push to main with docs/ changes, observe Actions run |
| **Estimated runtime** | ~30 seconds (local build) |

---

## Sampling Rate

- **After every task commit:** Run `cd docs && npm run build`
- **After every plan wave:** Run `cd docs && npm run build` + verify workflow YAML syntax
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 1 | INFRA-02 | smoke | `cd docs && npm run build` | ❌ W0 | ⬜ pending |
| 21-01-02 | 01 | 1 | INFRA-03 | smoke | `cd docs && npm run build` | ❌ W0 | ⬜ pending |
| 21-01-03 | 01 | 1 | INFRA-02 | manual-only | Push to main, check Actions tab | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.github/workflows/deploy-docs.yml` — the entire workflow file (core deliverable)
- [ ] `.lycheeignore` — exclusion list for flaky external URLs
- [ ] `docs/astro.config.mjs` — needs `site` and `base` added

*Wave 0 IS the phase — CI/CD scaffolding creates the deployment infrastructure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GitHub Action triggers on push | INFRA-02 | Requires actual push to main | Push docs/ change, verify Actions tab shows run |
| Deployed site accessible at correct URL | INFRA-02 | Requires live deployment | Visit `https://senivel.github.io/domain-context-claude/`, verify CSS/JS/links |
| Link checker blocks deploy on broken links | INFRA-03 | Requires CI pipeline run | Add intentional broken link, push, verify workflow fails |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
