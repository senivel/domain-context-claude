# Phase 5: Validate Core - Research

**Researched:** 2026-03-15
**Domain:** Claude Code skill file / MANIFEST.md structural validation
**Confidence:** HIGH

## Summary

Phase 5 creates a single skill file (`commands/dc/validate.md`) that instructs Claude to perform three structural checks on `.context/MANIFEST.md`: broken links, orphan files, and stale entries. This is the same delivery pattern as Phase 4 (dc:explore) -- a markdown skill file with YAML frontmatter and process steps. Claude is the runtime; the skill file provides instructions, not executable code.

The parsing logic is already proven in `dc:explore` (entry line formats, freshness computation, Glob-based CONTEXT.md discovery). Phase 5 reuses these patterns and adds two new behaviors: file existence verification for each MANIFEST.md entry, and reverse discovery to find orphan files in `.context/` subdirectories. Output formatting follows a grouped-by-check-type structure with severity levels (errors vs warnings) decided in CONTEXT.md.

**Primary recommendation:** Create one skill file that reuses dc:explore's parsing approach, adds file existence and orphan checks, and formats output per the locked decisions in CONTEXT.md.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Results grouped by check type (Broken Links, Orphan Files, Stale Entries), not by entry
- Each group shows count in parentheses with status icon: checkmark (pass), X (errors), warning (warnings)
- Broken links and orphan files are errors; stale entries are warnings
- Summary line uses severity: "2 errors, 1 warning"
- Clean state shows all three check types with checkmark and (0), ending with "All checks passed. N entries validated."
- Validation scope: four entry sections only (Domain Concepts, Architecture Decisions, Constraints, Module Context Files)
- Access Levels section is metadata, not checked
- AGENTS.md cross-reference is Phase 6 (out of scope)
- Orphan detection: scan domain/, decisions/, constraints/ subdirs; exclude .gitkeep; root .context/ files not flagged
- CONTEXT.md discovery uses Glob (same as dc:explore Step 3.5); unregistered CONTEXT.md files count as orphans
- No-context fallback: same as dc:explore

### Claude's Discretion
- Exact wording of result descriptions
- How to handle malformed MANIFEST.md entries (missing dates, broken link syntax)
- Whether to show file paths alongside entry names in results
- Order of items within each check group

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VALD-01 | Check MANIFEST.md entries point to existing files | Broken Links check: resolve each entry path relative to .context/, verify with Read tool |
| VALD-02 | Detect orphan files in .context/ subdirs not referenced in MANIFEST.md | Orphan Files check: Glob .context/ subdirs + codebase CONTEXT.md, diff against MANIFEST.md entries |
| VALD-03 | Check freshness (flag entries with verified date >90 days old) | Stale Entries check: reuse dc:explore's freshness computation |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Claude Code skill file | N/A | Skill markdown with YAML frontmatter + process steps | Established pattern in this project (dc:init, dc:explore) |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| Read | Read MANIFEST.md, verify file existence | Entry parsing and broken link detection |
| Glob | Discover files in .context/ subdirs and CONTEXT.md across codebase | Orphan detection |
| Bash | None needed | N/A -- Claude handles all logic |
| AskUserQuestion | Not needed in Phase 5 | Phase 6 adds interactive fix-it offers |

### Alternatives Considered
None -- the skill file pattern is the only delivery mechanism for this project.

## Architecture Patterns

### Recommended Project Structure
```
commands/dc/
  validate.md      # New skill file (this phase)
  explore.md       # Existing -- source of reusable parsing patterns
  init.md          # Existing -- reference for skill file format
```

### Pattern 1: Skill File Structure
**What:** YAML frontmatter (name, description, allowed-tools) + `<objective>`, `<execution_context>`, `<process>` sections
**When to use:** Every dc:* skill
**Example:** (from dc:explore)
```yaml
---
name: dc:validate
description: Check structural integrity of domain context...
allowed-tools:
  - Read
  - Glob
---
```

### Pattern 2: MANIFEST.md Entry Parsing (reuse from dc:explore)
**What:** Parse entry lines under four section headers using established formats
**When to use:** Any skill that reads MANIFEST.md
**Key formats:**
- Linked: `- [{Name}]({path}) -- {description} [{access}] [verified: {YYYY-MM-DD}]`
- Decisions: `- [{NNN}: {Title}]({path}) -- {description} [verified: {YYYY-MM-DD}]`
- Module context: `- {path} [verified: {YYYY-MM-DD}]`
- Empty sections: `(none yet)` or similar parenthetical -- skip these

All paths are relative to `.context/` directory.

### Pattern 3: Glob-Based CONTEXT.md Discovery (reuse from dc:explore Step 3.5)
**What:** Find `**/CONTEXT.md` files, exclude `.context/`, `node_modules/`, `.git/`, `.planning/`
**When to use:** Orphan detection for module context files

### Pattern 4: Check-Type Grouped Output
**What:** Results grouped by check type with status icons and severity
**Example output (issues found):**
```
Domain Context Validation:

  X Broken Links (2)
    - Integration Model -> domain/integration-model.md
    - 001: Single Project -> decisions/001-single-project.md

  X Orphan Files (1)
    - .context/domain/unused-concept.md

  ! Stale Entries (1)
    - Claude Code Extensions [verified: 2025-11-01, 135 days ago]

  2 errors, 1 warning
```

**Example output (all clean):**
```
Domain Context Validation:

  checkmark Broken Links (0)
  checkmark Orphan Files (0)
  checkmark Stale Entries (0)

  All checks passed. 5 entries validated.
```

### Anti-Patterns to Avoid
- **Duplicating parsing instructions:** Don't rewrite entry format documentation from scratch -- reference the same formats as dc:explore's execution_context
- **Checking Access Levels section:** Out of scope per user decision
- **Interactive fix-it prompts:** Phase 6 scope, not Phase 5
- **Flagging .gitkeep as orphans:** Explicitly excluded
- **Flagging root .context/ files (MANIFEST.md itself):** Only scan subdirectories

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MANIFEST.md parsing | New parsing approach | Same entry line formats as dc:explore | Consistency, already proven |
| CONTEXT.md discovery | Custom file walk | Glob with same exclusions as dc:explore Step 3.5 | Established pattern |
| Date calculation | Complex date logic | Claude computes days between dates natively | Claude is the runtime |

**Key insight:** Claude Code skills are instructions, not programs. Claude handles parsing, date math, and file operations natively. The skill file just needs clear, unambiguous instructions.

## Common Pitfalls

### Pitfall 1: Path Resolution Errors
**What goes wrong:** MANIFEST.md paths are relative to `.context/`, but Glob returns paths relative to project root. Comparing them requires normalization.
**Why it happens:** Two different path reference frames in the same check.
**How to avoid:** Skill instructions must explicitly state: "MANIFEST.md paths are relative to .context/. Prepend .context/ when checking file existence. Glob results are relative to project root."
**Warning signs:** Broken link false positives when files exist but paths don't match.

### Pitfall 2: Orphan Detection False Positives
**What goes wrong:** Flagging MANIFEST.md, .gitkeep, or root-level .context/ files as orphans.
**Why it happens:** Incomplete exclusion rules.
**How to avoid:** Explicit exclusion list in skill instructions: .gitkeep files, files in .context/ root (not subdirectories), and standard files like MANIFEST.md.

### Pitfall 3: Module Context File Path Mismatch
**What goes wrong:** Module CONTEXT.md paths in MANIFEST.md are relative to .context/, but discovered CONTEXT.md files (from Glob) use project-root-relative paths. These are different reference frames entirely -- MANIFEST.md Module Context File entries use paths like `../src/auth/CONTEXT.md` (relative to .context/) while Glob returns `src/auth/CONTEXT.md` (relative to project root).
**Why it happens:** Module Context Files inherently reference files outside .context/.
**How to avoid:** Normalize both to project-root-relative paths before comparing. Resolve MANIFEST.md paths from .context/ directory, resolve Glob paths from project root.

### Pitfall 4: Empty Section Miscount
**What goes wrong:** Counting `(none yet)` parenthetical as an entry, inflating validated count.
**Why it happens:** Naive line parsing.
**How to avoid:** Same as dc:explore: lines like `(none yet)` or `(none ...)` are placeholders, not entries.

### Pitfall 5: Stale Check on Entries Without Dates
**What goes wrong:** Entries missing `[verified: YYYY-MM-DD]` cause errors or are silently ignored.
**Why it happens:** Malformed or incomplete MANIFEST.md entries.
**How to avoid:** Claude's discretion per CONTEXT.md. Recommendation: treat missing date as a warning ("no verified date") rather than an error or silent skip.

## Code Examples

### Skill File Frontmatter
```yaml
---
name: dc:validate
description: Check structural integrity of domain context. Reports broken links in MANIFEST.md, orphan files not referenced in the manifest, and stale entries. Use when you want to verify domain context health.
allowed-tools:
  - Read
  - Glob
---
```

Note: Only Read and Glob are needed. No Bash (Claude does computation), no Write (Phase 5 is read-only), no AskUserQuestion (Phase 6 adds interactivity).

### Entry Path Resolution
```
MANIFEST.md entry path: domain/integration-model.md
File to check: .context/domain/integration-model.md

MANIFEST.md entry path: decisions/001-single-project.md
File to check: .context/decisions/001-single-project.md

MANIFEST.md module context path: ../src/auth/CONTEXT.md
File to check: src/auth/CONTEXT.md (resolve relative to .context/)
```

### Orphan Detection Logic
```
1. Glob: .context/domain/*.md, .context/decisions/*.md, .context/constraints/*.md
2. Remove: .gitkeep files
3. For each file found:
   - Convert to path relative to .context/ (e.g., domain/integration-model.md)
   - Check if any MANIFEST.md entry references this path
   - If no reference found: orphan

4. Glob: **/CONTEXT.md (with standard exclusions)
5. For each discovered CONTEXT.md:
   - Check if any MANIFEST.md Module Context Files entry resolves to this path
   - If no reference found: orphan
```

## State of the Art

Not applicable -- this is a project-specific skill file, not a library or framework. The "state of the art" is the established skill file pattern in this project.

## Open Questions

1. **Malformed entry handling**
   - What we know: CONTEXT.md gives Claude discretion on handling malformed entries
   - What's unclear: Should malformed entries be a separate check group or listed under broken links?
   - Recommendation: List malformed entries as warnings with a note like "could not parse entry on line N"

2. **Show file paths in results?**
   - What we know: CONTEXT.md gives Claude discretion
   - What's unclear: Whether to show paths alongside entry names in broken link results
   - Recommendation: Show paths -- they help the user locate the problem (e.g., "Integration Model -> domain/integration-model.md")

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual validation (skill files are instructions for Claude, not executable code) |
| Config file | none |
| Quick run command | Run `/dc:validate` on a test project |
| Full suite command | Run `/dc:validate` on projects with known issues (broken links, orphans, stale entries) |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VALD-01 | Broken link detection | manual | Run dc:validate on project with deleted .context/ files | N/A |
| VALD-02 | Orphan file detection | manual | Run dc:validate on project with unregistered files in .context/ subdirs | N/A |
| VALD-03 | Stale entry detection | manual | Run dc:validate on project with old verified dates | N/A |

### Sampling Rate
- **Per task commit:** Manual run of /dc:validate on this project's own .context/
- **Per wave merge:** Verify all three check types produce correct output
- **Phase gate:** All three checks work correctly on clean state and error state

### Wave 0 Gaps
None -- skill files have no test infrastructure. Verification is manual execution of the skill.

## Sources

### Primary (HIGH confidence)
- `commands/dc/explore.md` -- MANIFEST.md parsing patterns, entry line formats, freshness computation, CONTEXT.md discovery (Glob exclusions)
- `commands/dc/init.md` -- skill file structure pattern (frontmatter, sections, process steps)
- `.context/MANIFEST.md` -- real-world example of the format being validated
- `.planning/phases/05-validate-core/05-CONTEXT.md` -- locked user decisions on output format, severity, scope

### Secondary (MEDIUM confidence)
- `~/code/domain-context/SPEC.md` -- Domain Context spec for canonical MANIFEST.md format

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- same pattern as two completed phases
- Architecture: HIGH -- single skill file, established format
- Pitfalls: HIGH -- path resolution edge cases are well-understood from dc:explore

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable -- project patterns are locked)
