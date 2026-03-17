---
phase: 11
slug: posttooluse-reminder-hook
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual Node.js script execution + inline verification |
| **Config file** | none — hooks tested by running them directly |
| **Quick run command** | `echo '{"session_id":"test","tool_name":"Edit","tool_input":{"file_path":"/tmp/test/foo.js"},"cwd":"/tmp/test"}' \| node hooks/dc-context-reminder.js` |
| **Full suite command** | Run quick command + verify settings.json integrity |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick smoke test
- **After every plan wave:** Full test sequence for all 5 requirements
- **Before `/gsd:verify-work`:** All 5 requirements verified
- **Max feedback latency:** 3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | HOOK-03 | smoke | Create tmp dir with CONTEXT.md, pipe Edit event, check output | No — Wave 0 | ⬜ pending |
| 11-01-02 | 01 | 1 | HOOK-04 | smoke | Verify JSON output contains reminder message | No — Wave 0 | ⬜ pending |
| 11-01-03 | 01 | 1 | HOOK-05 | smoke | Pipe same event twice, verify second produces no output | No — Wave 0 | ⬜ pending |
| 11-01-04 | 01 | 1 | HOOK-06 | smoke | Pipe Read event, verify no output; pipe Edit event, verify output | No — Wave 0 | ⬜ pending |
| 11-01-05 | 01 | 1 | HOOK-08 | unit | `node -e` check that settings.json has both gsd and dc hooks | No — Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Create tmp directory fixtures with CONTEXT.md for proximity detection tests
- [ ] Session_id + debounce file cleanup between test runs
- [ ] No test framework needed — manual smoke tests proportionate for single hook file

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live session reminder appears in Claude context | HOOK-04 | Requires active Claude session to verify additionalContext surfaces | Edit a file near CONTEXT.md in a live session, verify reminder appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 3s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
