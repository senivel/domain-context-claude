---
phase: 3
slug: init-idempotency
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification via dc:init execution in temp directory |
| **Config file** | none — skill is tested by running it |
| **Quick run command** | Run `/dc:init` in a temp directory, verify output |
| **Full suite command** | `bash tools/validate-templates.sh` (template validation only) |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Review init.md diff for correctness
- **After every plan wave:** Run dc:init in fresh temp dir + run on already-initialized dir
- **Before `/gsd:verify-work`:** Both runs produce expected output; `bash tools/validate-templates.sh` passes
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | INIT-07 | manual | Run dc:init on project with existing .context/, verify warning text | N/A | ⬜ pending |
| 03-01-02 | 01 | 1 | INIT-08 | manual | Run dc:init with templates in each location, verify both work | N/A | ⬜ pending |
| 03-01-03 | 01 | 1 | INIT-09 | manual | Run dc:init, verify summary format matches spec | N/A | ⬜ pending |
| 03-01-04 | 01 | 1 | INIT-10 | manual | Run dc:init twice, verify second run shows all "skipped" | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework setup needed — verification is manual (run the skill, observe output).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Warning shown when .context/ exists | INIT-07 | Skill output is conversational text, not programmatic | Run dc:init on project with existing .context/, verify warning appears |
| Templates resolve from global or local | INIT-08 | Requires testing with different install locations | Run dc:init with templates in each location |
| Summary shows created/skipped/updated | INIT-09 | Output format verification | Run dc:init, check summary table format |
| Second run is safe, all skipped | INIT-10 | End-to-end idempotency check | Run dc:init twice, verify second run shows all "skipped" |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
