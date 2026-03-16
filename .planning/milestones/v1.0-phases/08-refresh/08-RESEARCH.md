# Phase 08: Refresh - Research

**Researched:** 2026-03-16
**Domain:** Claude Code skill file (markdown) for domain context refresh workflow
**Confidence:** HIGH

## Summary

Phase 08 delivers `dc:refresh` -- a single skill file (`commands/dc/refresh.md`) that identifies stale domain context entries, assesses their accuracy against current source code, and either bumps verified dates or proposes content diffs. This is a pure skill-file phase with no new libraries, templates, or infrastructure. The entire implementation follows established patterns from dc:validate (staleness detection, MANIFEST.md parsing, date updates) and dc:add (MANIFEST.md entry line manipulation, commit prompt).

The skill's distinguishing feature is **code-aware assessment**: for each stale entry, it reads the entry content, greps the codebase for relevant source code, compares the two, and presents findings to the user for per-entry confirmation. This is the only genuinely new logic -- everything else is pattern reuse.

**Primary recommendation:** Build dc:refresh as a single skill file reusing dc:validate's staleness detection and MANIFEST.md parsing patterns verbatim, with new logic only for the code-aware assessment and diff-proposal workflow.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Present stale entries one-at-a-time: show entry content + relevant code, then ask user to confirm accuracy or review proposed changes
- If no stale entries found: "All entries are fresh. N entries checked, none older than 90 days."
- Treat entries with missing verified dates as stale (same as dc:validate) to catch unverified entries
- Per-entry confirmation required -- each entry needs its own accuracy assessment, no batch skip
- Find relevant source code using entry's Related Concepts/Affected Modules sections + Grep for key terms -- targeted search, not full codebase scan
- "Still accurate" means content describes current behavior correctly -- no factual contradictions with code. Minor wording improvements don't count as drift
- Show brief reasoning for accuracy assessment (e.g., "Entry describes X, code still does X") so user can validate
- Show relevant code snippets alongside entry content -- enough for user to agree/disagree, not full files
- Show old vs new for each changed section (inline diff style) -- user sees exactly what changes
- Per-entry approval via AskUserQuestion: "Apply changes" / "Edit first" / "Skip this entry"
- When bumping verified date, update both MANIFEST.md and the file's inline comment (same pattern as dc:validate's stale fix)
- Offer a single commit after all entries are processed (same pattern as dc:init's commit prompt)

### Claude's Discretion
- Exact wording of accuracy assessment explanations
- How many code snippets to show per entry (balance between context and brevity)
- How to format inline diffs for proposed changes
- Grep search terms to derive from each entry
- Commit message wording

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REFR-01 | User can run /dc:refresh to review stale domain context entries | Skill file structure follows dc:validate pattern exactly -- YAML frontmatter + objective/execution_context/process sections |
| REFR-02 | Refresh parses MANIFEST.md for verified dates and identifies entries older than 90 days | Reuse dc:validate Steps 2+5 parsing logic verbatim -- same entry line formats, same 90-day threshold, same date computation |
| REFR-03 | Refresh reads each stale entry alongside relevant source code to assess accuracy | New logic: read entry file, extract key terms from Related Concepts/Affected Modules/Business Rules, Grep codebase for those terms, present both to user |
| REFR-04 | Refresh updates verified date in both context file and MANIFEST.md if content is still accurate | Reuse dc:validate's stale fix pattern -- Edit `[verified: old-date]` to `[verified: today]` in MANIFEST.md, Edit `<!-- verified: old-date -->` to `<!-- verified: today -->` in context file |
| REFR-05 | Refresh proposes content updates with specific diffs when context has drifted from code | New logic: generate proposed section updates, display old vs new with -/+ prefix formatting, AskUserQuestion for approval |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Claude Code skill format | N/A | Skill file in `commands/dc/` | Project convention -- all dc:* skills follow this format |
| Read/Write/Edit/Grep/Glob | Built-in | File operations | Claude Code native tools, no external dependencies |
| AskUserQuestion | Built-in | Interactive user prompts | Standard for per-item confirmation in this project |

### Supporting
No additional libraries needed. This project has zero runtime dependencies by design (ADR in ARCHITECTURE.md).

### Alternatives Considered
None -- the project convention is clear: pure skill files with Claude Code built-in tools only.

**Installation:**
No installation needed. Create `commands/dc/refresh.md` and it becomes available as `/dc:refresh`.

## Architecture Patterns

### Recommended Project Structure
```
commands/dc/
  refresh.md          # The single deliverable for this phase
```

### Pattern 1: Skill File Structure
**What:** YAML frontmatter with `name`, `description`, `allowed-tools`, followed by `<objective>`, `<execution_context>`, `<process>` sections.
**When to use:** Every dc:* skill in this project.
**Example:**
```markdown
---
name: dc:refresh
description: Review stale domain context entries...
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
---

<objective>
...
</objective>

<execution_context>
...
</execution_context>

<process>
## Step 1: ...
</process>
```
**Source:** Observed pattern in validate.md, add.md, explore.md, init.md

### Pattern 2: MANIFEST.md Entry Parsing
**What:** Parse entries under four section headers, extracting name, path, verified date, and section membership.
**When to use:** Any skill that reads MANIFEST.md entries.
**Key details:**
- Entry line formats documented in dc:validate's execution_context (see code_context in CONTEXT.md)
- `[verified: YYYY-MM-DD]` in MANIFEST.md lines
- `<!-- verified: YYYY-MM-DD -->` in context file headers (line 3 typically)
- Empty section placeholders like `(none yet)` must be skipped
- Paths are relative to `.context/` directory

### Pattern 3: Per-Item Interactive Workflow
**What:** Process items one at a time with AskUserQuestion for each, then offer a single commit at the end.
**When to use:** When the user needs to review and approve each item individually.
**Key details:**
- dc:validate uses per-group AskUserQuestion (Broken Links group, Stale group, etc.)
- dc:refresh needs per-ENTRY AskUserQuestion (each stale entry gets its own prompt)
- dc:add uses a single commit prompt at the end after all work is done
- dc:refresh should combine: per-entry prompts + single commit at end

### Pattern 4: Verified Date Update (Dual Location)
**What:** When updating a verified date, update both MANIFEST.md and the context file.
**When to use:** When bumping dates or when content changes are applied.
**Key details from dc:validate Step 8 (Stale Entries fix):**
1. Edit MANIFEST.md: find `[verified: {old-date}]`, replace with `[verified: {today}]`
2. Read context file, find `[verified: YYYY-MM-DD]` or `<!-- verified: YYYY-MM-DD -->`, Edit to replace with today's date
3. Both patterns may appear -- update whichever is found

### Anti-Patterns to Avoid
- **Full codebase scanning:** Don't grep the entire codebase for every term. Use targeted searches based on entry metadata (Related Concepts, Affected Modules sections).
- **Batch approval:** Don't ask "update all stale entries?" -- per-entry confirmation is a locked decision.
- **Auto-updating without assessment:** Don't bump dates without showing the user evidence of accuracy.
- **Modifying content without diff preview:** Always show old vs new before writing changes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MANIFEST.md parsing | Custom parser | Reuse dc:validate's parsing logic description | Already handles all entry formats, edge cases |
| Date staleness check | Custom date math | Same 90-day threshold + computation as dc:validate | Consistency across skills |
| Verified date updates | Custom update logic | Same dual-location Edit pattern as dc:validate Step 8 | Already handles both MANIFEST.md and context file formats |
| Commit flow | Custom commit logic | Same AskUserQuestion + git add + git commit as dc:add Step 12 | Consistent UX |

**Key insight:** dc:refresh is ~60% reused patterns from dc:validate and dc:add. The only new logic is code-aware assessment and diff proposal.

## Common Pitfalls

### Pitfall 1: Grep Search Term Quality
**What goes wrong:** Searching for overly generic terms floods results with irrelevant matches; overly specific terms miss relevant code.
**Why it happens:** Context file content uses domain language that may not map directly to code identifiers.
**How to avoid:** Extract search terms from structured sections (Related Concepts, Affected Modules, Key Attributes) rather than free text. Use 2-3 targeted grep searches per entry rather than one broad search.
**Warning signs:** Grep returns 50+ matches or 0 matches.

### Pitfall 2: Missing Verified Date in Context File
**What goes wrong:** The `<!-- verified: YYYY-MM-DD -->` comment might not exist in the context file (e.g., manually created files).
**Why it happens:** Only files created by dc:add or dc:init templates include this comment.
**How to avoid:** When bumping dates, check if the comment exists first. If missing, add it (line 3, after the title). Always update MANIFEST.md regardless.
**Warning signs:** Edit fails to find the pattern.

### Pitfall 3: Confusing "Drift" with "Style Difference"
**What goes wrong:** Flagging entries as drifted when the content is semantically accurate but phrased differently from the code.
**Why it happens:** Literal comparison between prose documentation and source code.
**How to avoid:** The locked decision defines "still accurate" as "content describes current behavior correctly -- no factual contradictions." Assess semantics, not syntax. Show reasoning so user can override.
**Warning signs:** Proposing rewrites for entries where behavior hasn't changed.

### Pitfall 4: Context Files Without Structured Sections
**What goes wrong:** The skill expects Related Concepts/Affected Modules sections but the file doesn't have them.
**Why it happens:** Not all context file types have the same sections (decisions have "Affected Modules", concepts have "Related Concepts", constraints have "Impact on Code").
**How to avoid:** Check which sections exist; fall back to the file title and key headings as grep terms if structured metadata is absent.

### Pitfall 5: Entry With No Corresponding File
**What goes wrong:** A stale entry in MANIFEST.md points to a file that doesn't exist (broken link + stale).
**Why it happens:** File was deleted but MANIFEST.md wasn't updated.
**How to avoid:** Before attempting code-aware assessment, verify the file exists. If missing, skip with a message like "File not found at {path} -- run /dc:validate to fix broken links first."

## Code Examples

### MANIFEST.md Entry Parsing (from dc:validate)
```markdown
Entry line formats:
- Linked entries: `- [{Name}]({path}) -- {description} [{access}] [verified: {YYYY-MM-DD}]`
- Architecture decisions: `- [{NNN}: {Title}]({path}) -- {description} [verified: {YYYY-MM-DD}]`
- Module context entries: `- {path} [verified: {YYYY-MM-DD}]`
- Empty sections contain parenthetical text like `(none yet)` -- these are NOT entries.
```

### Verified Date in Context File (from integration-model.md)
```markdown
# Integration Model

<!-- verified: 2026-03-11 -->

## What This Is
...
```
The `<!-- verified: YYYY-MM-DD -->` comment appears on line 3, after the H1 title and a blank line.

### Per-Entry AskUserQuestion Flow
```
For entry "Integration Model" (stale: 95 days):

1. Show entry content summary (key claims)
2. Show relevant code snippets from grep
3. Show accuracy assessment with reasoning
4. AskUserQuestion:
   - If still accurate: "Still accurate — bump date" / "Edit first" / "Skip this entry"
   - If drifted: "Apply changes" / "Edit first" / "Skip this entry"
```

### Diff Display Format (for drifted entries)
```
## What This Is

- The integration model defines how Domain Context connects to Claude Code's instruction system.
+ The integration model defines how Domain Context connects to Claude Code's instruction system and GSD's planning artifacts.

## Key Attributes

- **Three Concerns**: The How (AGENTS.md), The What (.planning/), The Why (.context/)
+ **Three Concerns**: The How (AGENTS.md + CLAUDE.md), The What (.planning/), The Why (.context/)
```

### Code-Aware Assessment Search Strategy
For a domain concept entry, extract search terms from:
1. **Related Concepts** section: entry names/paths mentioned
2. **Key Attributes/Business Rules** section: technical terms, function names, file paths
3. **Title itself**: as a fallback grep term

For a decision entry, extract from:
1. **Affected Modules** section: module paths, file references
2. **Decision** section: specific technical choices mentioned
3. **Title itself**: as a fallback

For a constraint entry, extract from:
1. **Impact on Code** section: code patterns, file paths
2. **Requirements** section: technical requirements mentioned

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual date bumping (dc:validate stale fix) | Code-aware assessment before date bump (dc:refresh) | Phase 08 | Users get evidence-based refresh, not blind date stamps |

**Existing approach (dc:validate stale fix):** Asks "Update verified dates to today?" and blindly bumps all stale dates. No assessment of whether content is still accurate.

**New approach (dc:refresh):** Reads entry + source code, assesses accuracy, shows evidence, per-entry approval. This is the value-add over dc:validate.

## Open Questions

1. **Module Context File refresh scope**
   - What we know: MANIFEST.md can list module context files (`src/auth/CONTEXT.md`). These are stale-checkable.
   - What's unclear: How to assess a CONTEXT.md file's accuracy -- it describes a module, so "relevant source code" is the module itself. This could be a large scope.
   - Recommendation: For module context files, grep within the module's directory only (the parent directory of the CONTEXT.md file). This naturally scopes the search.

2. **How many code snippets per entry**
   - What we know: User decided "enough for user to agree/disagree, not full files." This is Claude's discretion.
   - Recommendation: Show up to 3 most relevant snippets, each max 10-15 lines. If grep returns many matches, summarize the pattern rather than listing all.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual testing (no automated test framework in this project) |
| Config file | none |
| Quick run command | `/dc:refresh` in a project with stale entries |
| Full suite command | Manual: run against project with mix of fresh, stale, and drifted entries |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REFR-01 | User can invoke /dc:refresh | manual-only | Run `/dc:refresh` in a project with .context/ | N/A |
| REFR-02 | Identifies entries >90 days old | manual-only | Run in project with entries verified >90 days ago | N/A |
| REFR-03 | Reads entry + source code for assessment | manual-only | Run with stale entry, verify code snippets shown | N/A |
| REFR-04 | Updates verified date in both locations | manual-only | Accept "bump date", check MANIFEST.md and context file | N/A |
| REFR-05 | Proposes diffs for drifted content | manual-only | Run with entry that contradicts current code | N/A |

**Justification for manual-only:** This project produces markdown skill files consumed by Claude Code. There is no runtime code to unit test. Validation is functional -- invoke the skill and observe behavior. This is consistent with all previous phases (01-07).

### Sampling Rate
- **Per task commit:** Manually invoke `/dc:refresh` in the project
- **Per wave merge:** Full manual walkthrough: fresh entries, stale entries, drifted entries, missing files
- **Phase gate:** All 5 requirements verified via manual invocation

### Wave 0 Gaps
None -- no test infrastructure needed. This project has no automated test framework by design (it produces configuration files, not runtime code).

## Sources

### Primary (HIGH confidence)
- `commands/dc/validate.md` -- staleness detection, MANIFEST.md parsing, date update patterns
- `commands/dc/add.md` -- MANIFEST.md entry manipulation, commit prompt pattern
- `commands/dc/explore.md` -- MANIFEST.md parsing, entry format documentation
- `.context/MANIFEST.md` -- real-world example of entry formats and verified dates
- `.context/domain/integration-model.md` -- real-world example of `<!-- verified: -->` comment placement

### Secondary (MEDIUM confidence)
- `.planning/phases/08-refresh/08-CONTEXT.md` -- user decisions and code context analysis

### Tertiary (LOW confidence)
None -- all findings derived from primary sources within the codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no external dependencies, project conventions are clear from 7 completed phases
- Architecture: HIGH -- single skill file following established pattern, verified against 4 existing skills
- Pitfalls: HIGH -- derived from concrete analysis of existing code patterns and edge cases

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable -- no external dependencies to go stale)
