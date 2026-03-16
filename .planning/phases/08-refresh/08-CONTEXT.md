# Phase 8: Refresh - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

dc:refresh reviews stale domain context entries and updates them based on current code reality. It identifies entries with verified dates older than 90 days, reads each alongside relevant source code, assesses accuracy, and either bumps the date (if still accurate) or proposes specific content updates with diffs (if drifted). This phase delivers the complete refresh workflow as a single skill file.

</domain>

<decisions>
## Implementation Decisions

### Review Flow & Presentation
- Present stale entries one-at-a-time: show entry content + relevant code, then ask user to confirm accuracy or review proposed changes
- If no stale entries found: "All entries are fresh. N entries checked, none older than 90 days."
- Treat entries with missing verified dates as stale (same as dc:validate) to catch unverified entries
- Per-entry confirmation required — each entry needs its own accuracy assessment, no batch skip

### Code-Aware Assessment
- Find relevant source code using entry's Related Concepts/Affected Modules sections + Grep for key terms — targeted search, not full codebase scan
- "Still accurate" means content describes current behavior correctly — no factual contradictions with code. Minor wording improvements don't count as drift
- Show brief reasoning for accuracy assessment (e.g., "Entry describes X, code still does X") so user can validate
- Show relevant code snippets alongside entry content — enough for user to agree/disagree, not full files

### Update & Diff Strategy
- Show old vs new for each changed section (inline diff style) — user sees exactly what changes
- Per-entry approval via AskUserQuestion: "Apply changes" / "Edit first" / "Skip this entry"
- When bumping verified date, update both MANIFEST.md and the file's inline comment (same pattern as dc:validate's stale fix)
- Offer a single commit after all entries are processed (same pattern as dc:init's commit prompt)

### Claude's Discretion
- Exact wording of accuracy assessment explanations
- How many code snippets to show per entry (balance between context and brevity)
- How to format inline diffs for proposed changes
- Grep search terms to derive from each entry
- Commit message wording

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- commands/dc/validate.md: Staleness detection logic (parse verified dates, compute days, flag >90 days)
- commands/dc/explore.md: MANIFEST.md parsing (entry line formats, section detection, freshness computation)
- commands/dc/add.md: MANIFEST.md entry line update pattern, em dash format
- .context/MANIFEST.md: Real-world example with verified dates

### Established Patterns
- Pure skill file: single markdown in commands/dc/, Claude reads files directly with Read/Write/Edit/Grep tools
- AskUserQuestion for per-item interactive choices
- Template resolution from install location (though dc:refresh doesn't need templates)
- Staleness threshold: 90 days (consistent across dc:explore and dc:validate)
- Verified date format: `[verified: YYYY-MM-DD]` in MANIFEST.md, `<!-- verified: YYYY-MM-DD -->` in context files

### Integration Points
- commands/dc/refresh.md will be the new skill file
- Reads .context/MANIFEST.md for entry list and verified dates
- Reads individual context files to assess content accuracy
- Greps codebase for relevant source code per entry
- Writes updates to both context files and MANIFEST.md
- No dependency on dc:add — only shares MANIFEST.md parsing pattern

</code_context>

<specifics>
## Specific Ideas

- Reuse dc:validate's staleness detection exactly (same 90-day threshold, same date parsing)
- For each stale entry, show a compact view: entry name, days stale, 2-3 key claims from the entry, relevant code snippets
- Diff format should be readable in terminal: show section header, old content (prefixed -), new content (prefixed +)
- "Edit first" option should let the user provide specific text changes before writing

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 08-refresh*
*Context gathered: 2026-03-16*
