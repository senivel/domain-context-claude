---
phase: 2
slug: init-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual UAT + shell smoke checks |
| **Config file** | none |
| **Quick run command** | `bash tools/validate-context.sh .` |
| **Full suite command** | Manual: run /dc:init on fresh temp directory, verify all 6 success criteria |
| **Estimated runtime** | ~5 seconds (smoke checks) |

---

## Sampling Rate

- **After every task commit:** Run `bash tools/validate-context.sh .` on test output
- **After every plan wave:** Full manual UAT: /dc:init on fresh project, verify all 6 criteria
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | INIT-01 | smoke | `test -f .context/MANIFEST.md && grep -q "Context Manifest" .context/MANIFEST.md` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | INIT-02 | smoke | `test -f .context/domain/.gitkeep && test -f .context/decisions/.gitkeep && test -f .context/constraints/.gitkeep` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | INIT-03 | smoke | `test -f ARCHITECTURE.md && grep -q "System Purpose" ARCHITECTURE.md` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | INIT-04 | smoke | `grep -q "domain-context:start" AGENTS.md` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | INIT-05 | smoke | `grep -q "@AGENTS.md" CLAUDE.md` | ❌ W0 | ⬜ pending |
| 02-01-06 | 01 | 1 | INIT-06 | smoke | `grep -q ".context.local/" .gitignore` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `commands/dc/` directory — create for first skill file
- [ ] No automated test framework — skill is markdown, testing is UAT-based (run skill, check outputs)
- [ ] Smoke check scripts execute in a temporary directory to avoid polluting the project

*Note: validate-context.sh already exists from project tooling.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| /dc:init creates complete .context/ setup on fresh project | INIT-01 through INIT-06 | Requires running Claude Code skill interactively | 1. Create temp dir 2. Run /dc:init 3. Verify all 6 files/dirs exist with correct content |
| Placeholder inference from package.json | INIT-01 | Requires project with metadata file | 1. Create temp dir with package.json 2. Run /dc:init 3. Verify MANIFEST.md description matches |
| AskUserQuestion fallback when no metadata | INIT-01 | Requires interactive Claude session | 1. Create empty temp dir 2. Run /dc:init 3. Verify user is prompted for description |
| AGENTS.md append (not overwrite) | INIT-04 | Requires existing AGENTS.md content to verify preservation | 1. Create AGENTS.md with custom content 2. Run /dc:init 3. Verify custom content preserved + snippet appended |
| Idempotent sentinel detection | INIT-04 | Requires running init twice | 1. Run /dc:init 2. Run /dc:init again 3. Verify no duplicate snippet |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
