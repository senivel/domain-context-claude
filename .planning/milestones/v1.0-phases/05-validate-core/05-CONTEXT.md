# Phase 5: Validate Core - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

dc:validate checks the structural integrity of domain context: broken links in MANIFEST.md, orphan files not referenced in the manifest, and stale entries. This phase delivers the checks and output only — conversational presentation and fix-it offers are Phase 6 (Validate UX).

</domain>

<decisions>
## Implementation Decisions

### Output grouping
- Results grouped by check type, not by entry: Broken Links, Orphan Files, Stale Entries
- Each group shows count in parentheses with status icon: ✓ (pass), ✘ (errors), ⚠ (warnings)
- Items listed under their group with relevant details (entry name, path, day count)

### Severity levels
- Broken links and orphan files are **errors** (structural problems)
- Stale entries are **warnings** (informational, not broken)
- Summary line uses severity: "2 errors, 1 warning" not "3 issues"

### Clean state output
- When everything passes, show all three check types with ✓ and (0) counts
- End with "All checks passed. N entries validated."
- Don't collapse to a single line — user should see what was checked

### Validation scope
- Check the four entry sections only: Domain Concepts, Architecture Decisions, Constraints, Module Context Files
- Access Levels section is metadata, not checked
- AGENTS.md cross-reference is Phase 6 (VALD-06)

### Orphan detection
- Scan domain/, decisions/, constraints/ subdirectories under .context/
- Exclude .gitkeep files — these are structural, not domain content
- Files in .context/ root (MANIFEST.md etc.) are not flagged as orphans
- Also discover CONTEXT.md files throughout the codebase using Glob (same as dc:explore's Step 3.5)
- Unregistered CONTEXT.md files (on disk but not in MANIFEST.md Module Context Files) count as orphans

### No-context fallback
- Same as dc:explore: "No .context/ directory found. Run /dc:init to set up domain context."

### Claude's Discretion
- Exact wording of result descriptions
- How to handle malformed MANIFEST.md entries (missing dates, broken link syntax)
- Whether to show file paths alongside entry names in results
- Order of items within each check group

</decisions>

<specifics>
## Specific Ideas

- Output style follows the preview mockup pattern — clean, indented, with aligned status icons
- Reuse dc:explore's MANIFEST.md parsing approach (same entry line formats, same freshness computation)
- Module CONTEXT.md discovery reuses same Glob pattern and exclusions as dc:explore Step 3.5

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- commands/dc/explore.md: MANIFEST.md parsing logic (entry line formats, freshness computation, Glob discovery)
- commands/dc/init.md: Skill file pattern (YAML frontmatter, allowed-tools, process steps)
- .context/MANIFEST.md: Real-world example of the format dc:validate must parse

### Established Patterns
- Pure skill file: single markdown in commands/dc/, Claude reads files directly with Read/Glob tools
- AskUserQuestion for interactive choices (though Phase 5 is mostly output-focused)
- Plain text status labels, no emoji (Phase 3 decision) — but validation uses ✓/✘/⚠ as structural markers
- No runtime dependencies — Claude does the work

### Integration Points
- commands/dc/validate.md will be the new skill file
- Reads .context/MANIFEST.md as primary data source (same as dc:explore)
- Globs .context/ subdirs for orphan detection
- Globs codebase for CONTEXT.md discovery (same as dc:explore)
- Phase 6 (Validate UX) builds on this — adds conversational presentation and fix offers

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-validate-core*
*Context gathered: 2026-03-15*
