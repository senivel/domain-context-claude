# Phase 6: Validate UX - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

dc:validate presents results conversationally and offers to fix issues in-place. This phase modifies the existing dc:validate skill (commands/dc/validate.md) to add plain-language explanations, per-group fix offers, and an AGENTS.md cross-reference check. The structural checks from Phase 5 are unchanged — this phase enhances the output and adds interactivity.

</domain>

<decisions>
## Implementation Decisions

### Fix offer flow
- Per-group offers: after showing all validation results, walk through each group that has issues
- Each group gets its own AskUserQuestion with fix options + Skip
- Groups with 0 issues are not offered for fixing
- Clean state (no issues) skips the fix flow entirely

### Broken link fixes
- Two options offered per group: "Remove from MANIFEST.md" or "Create missing files from template"
- One action applies to all broken links in the group (not per-item)
- "Create missing files" uses the appropriate template (domain-concept.md, decision.md, constraint.md)

### Orphan file fixes
- Single option: "Register in MANIFEST.md" (or Skip)
- No delete option — registering is the safe default, no data loss
- Orphans are placed in the appropriate MANIFEST.md section based on their subdirectory (domain/ → Domain Concepts, decisions/ → Architecture Decisions, constraints/ → Constraints)
- Orphan CONTEXT.md files → Module Context Files section

### Stale entry fixes
- Offer to bump verified date to today in both the context file and MANIFEST.md
- Single prompt for all stale entries: "Update N stale entries to today's date?" Yes/Skip

### Conversational output
- Keep Phase 5's grouped structure (Broken Links, Orphan Files, Stale Entries)
- Add plain-language explanation line under each group header when issues exist (e.g., "2 entries in MANIFEST.md point to files that don't exist.")
- Clean state output unchanged from Phase 5: all groups with ✓ and (0), "All checks passed. N entries validated."
- Groups with 0 issues show header only (no explanation line needed)

### Post-fix summary
- After all fixes applied, show a summary of what changed (e.g., "Removed 1 entry from MANIFEST.md. Registered 1 orphan file.")
- End with "Run /dc:validate again to confirm."
- Do NOT automatically re-run validation after fixes

### AGENTS.md cross-reference (VALD-06)
- New 4th check group: "AGENTS.md Imports"
- Checks that AGENTS.md contains @.context/MANIFEST.md and @ARCHITECTURE.md
- Severity: **warning** (not error) — AGENTS.md might use a different structure intentionally
- If AGENTS.md doesn't exist: "No AGENTS.md found. Run /dc:init to set up project structure." (not an error, just a note)
- Fix offer: append missing import lines to AGENTS.md (same approach as dc:init's snippet injection)
- Scope: only check AGENTS.md imports, not sentinel comment, not CLAUDE.md → AGENTS.md chain

### Claude's Discretion
- Exact wording of plain-language explanation lines per group
- How to determine the appropriate MANIFEST.md section when registering orphans
- Template selection when creating missing files for broken links
- Where in AGENTS.md to append missing import lines
- Fix confirmation prompt wording

</decisions>

<specifics>
## Specific Ideas

- Fix flow follows the preview mockup pattern: validation results first, then per-group fix offers via AskUserQuestion
- Explanation lines are brief (one line) and describe the problem in plain terms, not technical jargon
- Stale date bumping updates both the `[verified: YYYY-MM-DD]` in MANIFEST.md AND the frontmatter/inline date in the context file itself

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- commands/dc/validate.md: Existing skill with 6-step process — Phase 6 extends Steps 3-6 and adds fix logic after Step 6
- commands/dc/init.md: AGENTS.md snippet injection pattern (sentinel comment detection, append logic)
- commands/dc/explore.md: MANIFEST.md parsing logic reused by validate
- templates/: domain-concept.md, decision.md, constraint.md templates for creating missing files

### Established Patterns
- AskUserQuestion with concrete options and recommended choice (Phase 3, 4 pattern)
- Per-group status with ✓/✘/⚠ icons (Phase 5 pattern)
- Clean aligned output with indentation (Phase 3 summary pattern)
- Skills use Read, Glob, Edit, Write tools directly — no runtime dependencies

### Integration Points
- commands/dc/validate.md is the only file that needs modification
- allowed-tools must add Edit and Write (currently only Read and Glob) for fix capabilities
- AskUserQuestion needed for fix offer prompts
- Phase 5's output format is preserved and enhanced, not replaced

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-validate-ux*
*Context gathered: 2026-03-15*
