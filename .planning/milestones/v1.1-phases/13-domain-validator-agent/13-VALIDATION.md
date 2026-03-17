---
phase: 13
slug: domain-validator-agent
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual validation (no automated test framework for agent markdown files) |
| **Config file** | none |
| **Quick run command** | `head -5 agents/dc-domain-validator.md \| grep "tools: Read, Grep, Glob"` |
| **Full suite command** | Manual: copy agent to `.claude/agents/`, invoke in project with `.context/` |
| **Estimated runtime** | ~1 second (smoke), manual for live test |

---

## Sampling Rate

- **After every task commit:** `head -5 agents/dc-domain-validator.md` to verify frontmatter
- **After every plan wave:** Manual agent invocation test
- **Before `/gsd:verify-work`:** Full manual validation
- **Max feedback latency:** 1 second (smoke tests)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | AGNT-01 | unit | `head -5 agents/dc-domain-validator.md \| grep "tools: Read, Grep, Glob"` | No — Wave 0 | ⬜ pending |
| 13-01-02 | 01 | 1 | AGNT-02 | manual-only | Invoke agent in project with .context/ domain files | N/A | ⬜ pending |
| 13-01-03 | 01 | 1 | AGNT-03 | manual-only | Invoke agent and verify it scans code directories | N/A | ⬜ pending |
| 13-01-04 | 01 | 1 | AGNT-04 | manual-only | Invoke agent and verify markdown table output | N/A | ⬜ pending |
| 13-01-05 | 01 | 1 | AGNT-05 | unit | `grep -c "@" agents/dc-domain-validator.md` (should be 0 in body) | No — Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- None — single markdown file, verified by structural checks and manual invocation

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Reads .context/domain/ files and extracts rules | AGNT-02 | Requires active agent invocation in a project with domain context | Copy agent to .claude/agents/, invoke, verify it reads domain files |
| Scans code for violations | AGNT-03 | Requires agent to use Grep/Glob on actual code | Invoke agent in project with known violations, verify detection |
| Produces structured findings table | AGNT-04 | Requires agent output inspection | Invoke agent, verify markdown table format in output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 1s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
