---
phase: 10
slug: sessionstart-freshness-hook
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — manual smoke tests via bash commands |
| **Config file** | none |
| **Quick run command** | `node hooks/dc-freshness-check.js < /dev/null; echo "exit: $?"` |
| **Full suite command** | Run all three requirement smoke tests (see Per-Task Verification Map) |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node hooks/dc-freshness-check.js < /dev/null; echo "exit: $?"` (must print "exit: 0")
- **After every plan wave:** Run smoke tests for all three requirements
- **Before `/gsd:verify-work`:** All three requirements manually verified
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | HOOK-01 | smoke | `echo '{}' \| node hooks/dc-freshness-check.js` (in project with stale .context/) | No — Wave 0 | ⬜ pending |
| 10-01-02 | 01 | 1 | HOOK-02 | smoke | `cd /tmp && node $PWD/hooks/dc-freshness-check.js < /dev/null; echo $?` (should print 0) | No — Wave 0 | ⬜ pending |
| 10-01-03 | 01 | 1 | HOOK-07 | manual-only | Observe behavior when stdin pipe is not closed | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Create test fixture directory with stale MANIFEST.md for HOOK-01 verification
- [ ] No test framework needed — manual smoke tests are proportionate for a single ~60-line hook file

*Existing Node.js runtime covers all execution needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 3-second stdin timeout | HOOK-07 | Requires simulating delayed stdin pipe — not automatable in simple smoke test | Run hook with `sleep 5 \| node hooks/dc-freshness-check.js` and verify it exits within ~3s |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
