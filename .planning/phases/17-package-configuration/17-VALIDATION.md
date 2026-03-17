---
phase: 17
slug: package-configuration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell commands (npm pack --dry-run, npx) |
| **Config file** | none — uses npm built-in commands |
| **Quick run command** | `npm pack --dry-run 2>&1` |
| **Full suite command** | `npm pack && npx ./domain-context-cc-*.tgz` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm pack --dry-run 2>&1`
- **After every plan wave:** Run `npm pack && npx ./domain-context-cc-*.tgz`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | PKG-01 | smoke | `node -e "const p=require('./package.json'); console.assert(p.name==='domain-context-cc')"` | N/A | ⬜ pending |
| 17-01-02 | 01 | 1 | PKG-02 | smoke | `node -e "const p=require('./package.json'); console.assert(p.bin['domain-context-cc']==='./bin/install.js')"` | N/A | ⬜ pending |
| 17-01-03 | 01 | 1 | PKG-03 | smoke | `npm pack --dry-run 2>&1` | N/A | ⬜ pending |
| 17-01-04 | 01 | 1 | PKG-04 | smoke | `node -e "const p=require('./package.json'); console.assert(p.engines.node==='>=20.0.0')"` | N/A | ⬜ pending |
| 17-01-05 | 01 | 1 | PKG-05 | smoke | `node -e "const p=require('./package.json'); console.assert(!p.dependencies); console.assert(p.type==='commonjs')"` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `bin/install.js` — stub with shebang for npm pack testability

*Existing infrastructure covers all other phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| npx invocation works end-to-end | PKG-02 | Requires actual npx execution | Run `npm pack && npx ./domain-context-cc-*.tgz` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
