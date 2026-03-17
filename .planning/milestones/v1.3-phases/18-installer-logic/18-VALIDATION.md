---
phase: 18
slug: installer-logic
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node --test` (Node 20+) |
| **Config file** | none — Wave 0 creates test file |
| **Quick run command** | `node --test tests/install.test.js` |
| **Full suite command** | `node --test tests/*.test.js` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/install.test.js`
- **After every plan wave:** Run `node --test tests/*.test.js`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 0 | INST-01..09 | unit/integration | `node --test tests/install.test.js` | No — W0 | ⬜ pending |
| 18-02-01 | 02 | 1 | INST-01 | integration | `node --test tests/install.test.js` | No — W0 | ⬜ pending |
| 18-02-02 | 02 | 1 | INST-02 | integration | `node --test tests/install.test.js` | No — W0 | ⬜ pending |
| 18-02-03 | 02 | 1 | INST-04, INST-05 | unit | `node --test tests/install.test.js` | No — W0 | ⬜ pending |
| 18-02-04 | 02 | 1 | INST-06 | unit | `node --test tests/install.test.js` | No — W0 | ⬜ pending |
| 18-02-05 | 02 | 1 | INST-03 | integration | `node --test tests/install.test.js` | No — W0 | ⬜ pending |
| 18-02-06 | 02 | 1 | INST-09 | integration | `node --test tests/install.test.js` | No — W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/install.test.js` — test file covering INST-01 through INST-09
- [ ] Test helper using `fs.mkdtempSync` for temp directories (mock home/project dirs)
- [ ] No framework install needed — `node --test` is built-in to Node 20+

*Existing infrastructure covers shebang check (INST-08) — stub already has shebang.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `npx domain-context-cc` end-to-end | INST-01 | Requires actual npm package install | `npm pack && npx ./domain-context-cc-*.tgz` |
| Hook triggers in Claude Code session | INST-04 | Requires running Claude Code | Start session, verify hook output in logs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
