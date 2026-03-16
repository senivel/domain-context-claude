# Phase 6: Validate UX - Research

**Researched:** 2026-03-15
**Domain:** Claude Code skill enhancement (markdown skill files with interactive fix flows)
**Confidence:** HIGH

## Summary

Phase 6 enhances the existing `commands/dc/validate.md` skill to make validation results conversational and actionable. The current skill (from Phase 5) performs three read-only checks (broken links, orphan files, stale entries) and reports results in grouped format. This phase adds: (1) plain-language explanation lines under each group header, (2) per-group fix offers via AskUserQuestion, and (3) a new 4th check group for AGENTS.md imports.

The implementation is entirely within a single file (`commands/dc/validate.md`). The skill's `allowed-tools` must expand from `[Read, Glob]` to `[Read, Glob, Write, Edit, AskUserQuestion]` to support file modifications and interactive prompts. All patterns needed (AskUserQuestion flow, MANIFEST.md editing, file creation from templates, AGENTS.md snippet injection) already exist in `dc:init` and `dc:explore`.

**Primary recommendation:** Modify `commands/dc/validate.md` in-place -- extend Steps 3-6 with explanation lines, add Steps 7-10 for the fix flow, and insert the AGENTS.md check as a new Step 5.5 (renumbering as needed).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Per-group fix offers: after showing all validation results, walk through each group that has issues. Each group gets its own AskUserQuestion with fix options + Skip. Groups with 0 issues are not offered. Clean state skips fix flow entirely.
- Broken link fixes: two options per group ("Remove from MANIFEST.md" or "Create missing files from template"). One action applies to all broken links in the group.
- Orphan file fixes: single option "Register in MANIFEST.md" (or Skip). No delete option. Orphans placed in appropriate MANIFEST.md section based on subdirectory.
- Stale entry fixes: offer to bump verified date to today in both context file and MANIFEST.md. Single prompt for all stale entries.
- Conversational output: keep Phase 5's grouped structure, add plain-language explanation line under each group header when issues exist. Clean state output unchanged. Groups with 0 issues show header only.
- Post-fix summary: show summary of what changed, end with "Run /dc:validate again to confirm." Do NOT auto-re-run validation.
- AGENTS.md cross-reference (VALD-06): new 4th check group "AGENTS.md Imports". Checks for @.context/MANIFEST.md and @ARCHITECTURE.md. Severity: warning. Missing AGENTS.md is a note, not error. Fix: append missing import lines. Scope: only check imports, not sentinel, not CLAUDE.md chain.

### Claude's Discretion
- Exact wording of plain-language explanation lines per group
- How to determine the appropriate MANIFEST.md section when registering orphans
- Template selection when creating missing files for broken links
- Where in AGENTS.md to append missing import lines
- Fix confirmation prompt wording

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VALD-04 | Validate presents results conversationally (plain language, not raw script output) | Add explanation lines under group headers; existing grouped output format preserved |
| VALD-05 | Validate offers to fix issues found (update MANIFEST.md, create missing files, update dates) | Per-group AskUserQuestion flow after results display; templates for file creation; Edit for MANIFEST.md updates |
| VALD-06 | Validate cross-references AGENTS.md to confirm it imports @.context/MANIFEST.md and @ARCHITECTURE.md | New 4th check group; string search in AGENTS.md; warning severity |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Claude Code Skill Format | N/A | Markdown skill file with YAML frontmatter | Project convention per AGENTS.md |
| Read tool | N/A | Read MANIFEST.md, AGENTS.md, context files | Already used in Phase 5 |
| Glob tool | N/A | Discover files for orphan/broken link checks | Already used in Phase 5 |
| Write tool | N/A | Create missing files from templates | Used by dc:init |
| Edit tool | N/A | Modify MANIFEST.md lines, update dates | Precise edits to existing files |
| AskUserQuestion tool | N/A | Per-group fix offer prompts | Used by dc:init, dc:explore |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Templates (domain-concept.md, decision.md, constraint.md) | N/A | Scaffold missing files for broken link fixes | When user chooses "Create missing files" |

No npm packages. No runtime dependencies. Skills are markdown instruction files that Claude Code interprets.

## Architecture Patterns

### Skill File Structure (Unchanged)
```
commands/dc/validate.md
  YAML frontmatter (name, description, allowed-tools)
  <objective> ... </objective>
  <execution_context> ... </execution_context>
  <process> Steps 1-N </process>
```

### Pattern 1: Existing Check Flow (Phase 5, preserved)
**What:** Steps 1-6 remain as-is from Phase 5 with minor enhancements to Step 6
**When to use:** Always -- the base validation logic does not change

Step 6 enhancement: Add a plain-language explanation line under each group header when count > 0. Examples:
- Broken Links (2): "2 entries in MANIFEST.md point to files that don't exist."
- Orphan Files (1): "1 file in .context/ is not referenced in MANIFEST.md."
- Stale Entries (3): "3 entries have not been verified in over 90 days."

### Pattern 2: AGENTS.md Import Check (New Step)
**What:** New check group inserted between existing stale-entries check and results display
**When to use:** Always, as part of standard validation

Logic:
1. Try to read `AGENTS.md` from project root
2. If absent: record a note "No AGENTS.md found. Run /dc:init to set up project structure."
3. If present: check for `@.context/MANIFEST.md` and `@ARCHITECTURE.md` as substrings
4. Missing imports recorded as warnings (not errors)
5. Display as 4th group: `{icon} AGENTS.md Imports ({count})`
6. Explanation: "AGENTS.md is missing {N} recommended import(s)."
7. Items: `- Missing: @.context/MANIFEST.md` and/or `- Missing: @ARCHITECTURE.md`

### Pattern 3: Per-Group Fix Flow (New Steps after display)
**What:** After showing all results, iterate through groups with issues and offer fixes
**When to use:** Only when issues exist (skip entirely on clean state)

Flow:
```
For each group with count > 0:
  AskUserQuestion:
    prompt: "{Group}: {explanation}. Fix?"
    options: [fix-option-1, fix-option-2 (if applicable), Skip]

  If not Skip:
    Apply fix to all items in group
    Record what was changed

After all groups processed:
  Display post-fix summary
  "Run /dc:validate again to confirm."
```

### Pattern 4: AskUserQuestion Options (from dc:init, dc:explore)
**What:** Structured prompts with recommended choice
**When to use:** Every fix offer

Established convention from dc:init:
- Options are numbered, one marked "(recommended)"
- Maximum 4 options per prompt
- "Skip" is always the last option

### Pattern 5: MANIFEST.md Section Detection for Orphan Registration
**What:** Determine which MANIFEST.md section an orphan belongs in based on its path
**When to use:** When registering orphan files

Mapping:
| Path prefix | MANIFEST.md section |
|-------------|---------------------|
| `.context/domain/` | `## Domain Concepts` |
| `.context/decisions/` | `## Architecture Decisions` |
| `.context/constraints/` | `## Constraints` |
| `**/CONTEXT.md` (outside .context/) | `## Module Context Files` |

Entry format to append:
- Domain concepts: `- [{Name}]({relative-path}) -- {placeholder description} [public] [verified: {today}]`
- Decisions: `- [{NNN}: {Title}]({relative-path}) -- {placeholder description} [verified: {today}]`
- Constraints: `- [{Name}]({relative-path}) -- {placeholder description} [public] [verified: {today}]`
- Module context: `- {project-relative-path} [verified: {today}]`

Name derivation: convert filename to title case (e.g., `integration-model.md` -> `Integration Model`). For decisions, extract ADR number from filename (e.g., `004-foo.md` -> `004: Foo`).

### Pattern 6: Template Selection for Broken Link File Creation
**What:** Choose the right template based on which MANIFEST.md section the broken link is in
**When to use:** When user chooses "Create missing files from template" for broken links

Mapping:
| MANIFEST.md section | Template file |
|---------------------|---------------|
| Domain Concepts | `templates/domain-concept.md` |
| Architecture Decisions | `templates/decision.md` |
| Constraints | `templates/constraint.md` |

Template filling: replace `{placeholder}` tokens with reasonable defaults (name from entry, today's date for verified date). Strip HTML comments.

### Pattern 7: AGENTS.md Import Append
**What:** Add missing import lines to AGENTS.md
**When to use:** When user accepts the AGENTS.md import fix

Logic:
1. Read current AGENTS.md content
2. If `<!-- domain-context:start -->` sentinel exists, insert missing lines inside that block (after `## Project Context` line or at end of block)
3. If no sentinel, append missing lines at the end of the file
4. Preferred insertion format: `- Architecture overview: @ARCHITECTURE.md` and `- Domain & business context: @.context/MANIFEST.md` (matching the agents-snippet.md template format)

### Anti-Patterns to Avoid
- **Auto-re-running validation after fixes:** User decision explicitly forbids this. Show summary + "Run /dc:validate again to confirm."
- **Per-item fix prompts:** Fixes apply to ALL items in a group, not per-item. One AskUserQuestion per group.
- **Offering delete for orphans:** Only "Register in MANIFEST.md" or Skip. No data destruction.
- **Treating AGENTS.md missing imports as errors:** These are warnings, not errors. AGENTS.md might intentionally use a different structure.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File creation from templates | Custom file scaffolding | Existing templates in `templates/` directory | Templates already have correct structure per spec |
| AGENTS.md snippet injection | Custom append logic | Pattern from `dc:init` Step 7 | Sentinel comment detection already established |
| MANIFEST.md entry format | Custom line formatting | Copy formats from `dc:explore` execution_context | Entry formats are spec-defined, already documented |
| Date formatting | Custom date logic | Standard `YYYY-MM-DD` format matching existing entries | Consistency with existing verified dates |

## Common Pitfalls

### Pitfall 1: MANIFEST.md Section Boundary Detection
**What goes wrong:** When appending entries to a MANIFEST.md section, inserting at the wrong position (after the next section header, or before the last entry in the section).
**Why it happens:** Sections are delimited by `##` headers with no explicit end marker. The `(none yet)` placeholder must be replaced, not appended after.
**How to avoid:** Find the section header line, then find the next `##` header (or EOF). Insert new entries before the next header. If section contains `(none yet)`, replace that line with the new entry.
**Warning signs:** Entries appearing under wrong section headers in MANIFEST.md.

### Pitfall 2: Path Resolution Inconsistency
**What goes wrong:** Orphan registration uses the wrong path format in MANIFEST.md (project-root-relative instead of .context/-relative, or vice versa).
**Why it happens:** Glob returns project-root-relative paths, but MANIFEST.md stores paths relative to `.context/`.
**How to avoid:** For .context/ subdirectory files: strip `.context/` prefix to get MANIFEST.md-relative path. For CONTEXT.md files outside .context/: use `../` prefix from .context/ perspective, or use project-root-relative path for Module Context Files entries.
**Warning signs:** Newly registered entries show as broken links on next validation run.

### Pitfall 3: Template Path Resolution
**What goes wrong:** Cannot find templates when creating missing files for broken link fixes.
**Why it happens:** Templates are at install location, not project root. Same resolution logic as dc:init Step 1.
**How to avoid:** Reuse dc:init's template path resolution (check `.claude/domain-context/templates/` local, then `~/.claude/domain-context/templates/` global).
**Warning signs:** Fix fails silently or creates empty files.

### Pitfall 4: Stale Date Update in Context Files
**What goes wrong:** Updating verified date in MANIFEST.md but missing the date inside the context file itself, or vice versa.
**Why it happens:** Dates exist in two places: MANIFEST.md entry line (`[verified: YYYY-MM-DD]`) and context file frontmatter/comment (`<!-- verified: YYYY-MM-DD -->`).
**How to avoid:** Explicitly update both locations. Use Edit tool to find and replace the date pattern in each file.
**Warning signs:** Next validation run still shows entries as stale.

### Pitfall 5: allowed-tools Not Updated
**What goes wrong:** Skill tries to use Write, Edit, or AskUserQuestion but they're not in allowed-tools.
**Why it happens:** Phase 5 only needed Read and Glob; easy to forget adding new tools.
**How to avoid:** Update YAML frontmatter allowed-tools to: Read, Glob, Write, Edit, AskUserQuestion.
**Warning signs:** Claude Code refuses to execute fix actions.

## Code Examples

### Current validate.md Frontmatter (Phase 5)
```yaml
---
name: dc:validate
description: Check structural integrity of domain context. Reports broken links in MANIFEST.md, orphan files not referenced in the manifest, and stale entries.
allowed-tools:
  - Read
  - Glob
---
```

### Updated Frontmatter (Phase 6)
```yaml
---
name: dc:validate
description: Check structural integrity of domain context. Reports broken links, orphan files, stale entries, and AGENTS.md imports. Offers to fix issues found.
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
---
```

### Enhanced Step 6 Output Format (with explanation lines)
```
Domain Context Validation:

  X Broken Links (2)
    2 entries in MANIFEST.md point to files that don't exist.
    - Integration Model -> domain/integration-model.md
    - API Design -> domain/api-design.md

  checkmark Orphan Files (0)

  warning Stale Entries (1)
    1 entry has not been verified in over 90 days.
    - Claude Code Extensions [verified: 2025-11-15, 121 days ago]

  warning AGENTS.md Imports (1)
    AGENTS.md is missing 1 recommended import.
    - Missing: @ARCHITECTURE.md

  2 errors, 2 warnings
```

### Fix Flow AskUserQuestion Pattern
```
# Broken links fix prompt
AskUserQuestion:
  prompt: "Broken Links: 2 entries point to files that don't exist."
  options:
    1. "Remove entries from MANIFEST.md"
    2. "Create missing files from template (recommended)"
    3. "Skip"

# Orphan files fix prompt
AskUserQuestion:
  prompt: "Orphan Files: 1 file is not referenced in MANIFEST.md."
  options:
    1. "Register in MANIFEST.md (recommended)"
    2. "Skip"

# Stale entries fix prompt
AskUserQuestion:
  prompt: "Stale Entries: 3 entries are overdue for review."
  options:
    1. "Update verified dates to today (recommended)"
    2. "Skip"

# AGENTS.md imports fix prompt
AskUserQuestion:
  prompt: "AGENTS.md Imports: 1 recommended import is missing."
  options:
    1. "Add missing imports to AGENTS.md (recommended)"
    2. "Skip"
```

### Post-Fix Summary Format
```
Fixes applied:

  Created 2 files from templates
  Registered 1 orphan in MANIFEST.md
  Updated 3 verified dates
  Added 1 import to AGENTS.md

Run /dc:validate again to confirm.
```

### MANIFEST.md Entry Insertion (replacing placeholder)
```markdown
## Constraints

(none yet)
```
After registering orphan `compliance.md`:
```markdown
## Constraints

- [Compliance](constraints/compliance.md) -- TODO: Add description [public] [verified: 2026-03-15]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Read-only validation (Phase 5) | Interactive validation with fixes (Phase 6) | This phase | Users can resolve issues without manual file editing |
| 3 check groups | 4 check groups (+ AGENTS.md imports) | This phase | Catches missing AGENTS.md wiring |
| Raw grouped output | Conversational output with explanations | This phase | Users understand what's wrong without reading file paths |

## Open Questions

1. **Module Context File path format in MANIFEST.md**
   - What we know: Current entries use `../` relative to `.context/` (e.g., `../src/auth/CONTEXT.md`) based on spec
   - What's unclear: Whether the `- {path} [verified: YYYY-MM-DD]` format uses project-root-relative or .context/-relative paths for Module Context Files
   - Recommendation: Check existing MANIFEST.md entries in real projects; match whatever format dc:init/dc:explore uses

2. **Decision ADR number extraction from filename**
   - What we know: Decision files follow `NNN-title.md` naming
   - What's unclear: Edge cases (files without number prefix, non-standard naming)
   - Recommendation: Best-effort extraction; if no number prefix found, use filename as title

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual skill testing (run /dc:validate in target project) |
| Config file | none |
| Quick run command | Run `/dc:validate` in this project |
| Full suite command | Run `/dc:validate` in this project + a project with known issues |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VALD-04 | Plain-language explanation lines appear under group headers with issues | manual-only | Run /dc:validate and inspect output | N/A |
| VALD-05 | Fix offers appear after results; fixes modify files correctly | manual-only | Run /dc:validate on project with issues, accept fixes, verify files changed | N/A |
| VALD-06 | AGENTS.md import check appears as 4th group | manual-only | Run /dc:validate, verify AGENTS.md Imports group in output | N/A |

*Justification for manual-only: Skills are markdown instruction files interpreted by Claude Code at runtime. There is no executable code to unit-test. Validation requires running the skill in a Claude Code session and inspecting behavior.*

### Sampling Rate
- **Per task commit:** Run `/dc:validate` in this project
- **Per wave merge:** Run `/dc:validate` in this project + create a test scenario with broken links/orphans
- **Phase gate:** Human verification that all three requirements produce correct behavior

### Wave 0 Gaps
None -- no test infrastructure applicable for markdown skill files.

## Sources

### Primary (HIGH confidence)
- `commands/dc/validate.md` -- Current Phase 5 implementation, the file being modified
- `commands/dc/init.md` -- AGENTS.md snippet injection pattern, template resolution, AskUserQuestion usage
- `commands/dc/explore.md` -- MANIFEST.md parsing patterns, entry formats, AskUserQuestion navigation
- `templates/` directory -- Template files for creating missing context files
- `.planning/phases/06-validate-ux/06-CONTEXT.md` -- User decisions constraining implementation

### Secondary (MEDIUM confidence)
- `templates/agents-snippet.md` -- Format for AGENTS.md import lines (used to determine what to check/append)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools and patterns already used in this project
- Architecture: HIGH -- extending existing skill with established patterns
- Pitfalls: HIGH -- based on direct analysis of existing code and data formats

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable -- markdown skill files, no external dependencies)
