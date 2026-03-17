---
phase: 12
slug: path-scoped-rule
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification (no automated test framework for rule files) |
| **Config file** | N/A |
| **Quick run command** | `head -3 rules/dc-context-editing.md \| grep "globs:"` |
| **Full suite command** | Manual: open a .context/ file in Claude Code and confirm rule loads |
| **Estimated runtime** | ~1 second (smoke), manual for live test |

---

## Sampling Rate

- **After every task commit:** Verify file parses as valid YAML frontmatter + markdown
- **After every plan wave:** Manual test in Claude Code session
- **Before `/gsd:verify-work`:** Confirm rule loads when reading a .context/ file
- **Max feedback latency:** 1 second (smoke tests)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | RULE-01 | manual-only | N/A — requires active Claude Code session | N/A | ⬜ pending |
| 12-01-02 | 01 | 1 | RULE-02 | smoke | `grep -c "##" rules/dc-context-editing.md` (verify sections exist) | No — Wave 0 | ⬜ pending |
| 12-01-03 | 01 | 1 | RULE-03 | smoke | `head -3 rules/dc-context-editing.md \| grep "globs:"` | No — Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- None — no test infrastructure needed. This phase produces a single markdown file verified by inspection and manual testing.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Rule loads on `.context/**` and `**/CONTEXT.md` reads | RULE-01 | Requires active Claude Code session with rule installed | Copy rule to `.claude/rules/`, read a `.context/` file, verify guidance appears in context |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 1s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
