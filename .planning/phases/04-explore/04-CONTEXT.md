# Phase 4: Explore - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

dc:explore is a read-only skill that parses and displays domain context from within Claude Code. User can browse the manifest summary, drill into specific entries, and search by keyword. No mutations — this phase only reads .context/ files and presents them.

</domain>

<decisions>
## Implementation Decisions

### Summary output format
- Grouped by MANIFEST.md section: Domain Concepts, Architecture Decisions, Constraints, Module Context Files
- Each section shows count in parentheses
- Each entry shows name + verified date: `- Integration Model [verified: 2026-03-11]`
- Stale entries (>90 days) replace verified date with inline warning: `[STALE - 94 days]`
- No descriptions in the summary — names and freshness only
- Empty sections shown with count (0), no entries listed

### No-context fallback
- When .context/ doesn't exist: "No .context/ directory found. Run /dc:init to set up domain context."
- Simple, no explanation of what domain context is

### Keyword search behavior
- `/dc:explore [keyword]` searches entry names, descriptions (from MANIFEST.md), AND file content
- Case-insensitive matching
- Multiple matches: list matching entry names with match location (name/description/content), user picks one via AskUserQuestion to view full content
- No matches: "No entries matching '[keyword]' found. Run /dc:explore to see all entries."
- No fuzzy matching or "did you mean" suggestions

### Progressive disclosure flow
- Summary shown first (always)
- After summary: AskUserQuestion "Explore an entry?" with section grouping
  - First level: pick a section type (Domain Concepts / Decisions / Constraints / Module Context Files / Done)
  - Second level: pick an entry within that section (entries + Back + Done)
- After viewing an entry's full content: loop back with "Explore another entry?" — same section/entry selection flow
- User exits by picking "Done" at any level
- This handles projects with many entries by staying within AskUserQuestion's 4-option limit

### Module CONTEXT.md discovery
- Module CONTEXT.md files sourced from MANIFEST.md's "Module Context Files" section only — no filesystem glob/discovery
- Shown as a separate section at the bottom of the summary
- Browseable in the drill-in flow — same as other entry types

### Claude's Discretion
- Exact wording of AskUserQuestion prompts
- How to display full entry content (raw markdown vs formatted)
- Whether to show file path when displaying entry content
- Handling of malformed MANIFEST.md entries (missing dates, broken links)

</decisions>

<specifics>
## Specific Ideas

- Summary format follows dc:init's established pattern — clean aligned output, plain text statuses
- AskUserQuestion with concrete options and recommended choice — same interaction pattern as dc:init
- Keyword search reads all .context/ files, so it's thorough but may be slower on large projects — acceptable since this is user-initiated

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- commands/dc/init.md: Establishes the skill file pattern (YAML frontmatter, allowed-tools, process steps)
- .context/MANIFEST.md: Real-world example of the format dc:explore must parse — entry lines with `[link](path) — description [access] [verified: date]`
- templates/manifest.md: Shows the template structure with section headers that dc:explore groups by

### Established Patterns
- Pure skill file: single markdown in commands/dc/, Claude reads files directly with its tools
- AskUserQuestion with concrete options, recommended choice, built-in "Other"
- No runtime dependencies — Claude uses Read, Glob tools directly
- kebab-case file naming, dc: prefix for skill names

### Integration Points
- commands/dc/explore.md will be the new skill file
- Reads .context/MANIFEST.md as its primary data source
- Reads individual .context/ files when user drills in or searches
- Phase 5 (Validate Core) depends on this phase — likely reuses manifest parsing patterns

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-explore*
*Context gathered: 2026-03-14*
