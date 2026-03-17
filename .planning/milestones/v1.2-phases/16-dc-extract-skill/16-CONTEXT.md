# Phase 16: dc:extract Skill - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the dc:extract skill that scans completed GSD phase artifacts, classifies extractable domain knowledge, presents proposals grouped by type with source attribution, and lets users selectively accept/reject proposals that create spec-compliant .context/ files.

</domain>

<decisions>
## Implementation Decisions

### Scanning & Source Selection
- Scan CONTEXT.md and SUMMARY.md from phase directories — these contain decisions and outcomes
- Phase scoping via range argument (`/dc:extract 7-9`) — parse range, filter phases by number
- When .planning/ has no completed phases, show "No completed phase artifacts found in .planning/" and stop
- Detect completed phases by checking for SUMMARY.md presence in phase directory

### Classification & Proposal Format
- Group findings by type (domain concepts, decisions, constraints) — matches .context/ subdirectory structure
- No hard limit on proposal count — aim for quality over quantity, typically 3-8 per run
- Cross-reference MANIFEST.md with title similarity check — skip entries with similar names, note them
- dc:extract creates NEW entries only — dc:refresh handles updates (per Out of Scope in REQUIREMENTS.md)

### Preview & Acceptance Flow
- Show all proposals in a summary table first, then let user accept/reject each individually via AskUserQuestion
- Reuse dc:add's template resolution, file writing, and MANIFEST.md update patterns for consistency
- Post-extraction summary shows count by type (N domain concepts, M decisions, K constraints extracted) with file paths
- Prompt with AskUserQuestion "Commit extracted entries?" — matches dc:add's commit pattern

### Claude's Discretion
No items delegated to Claude's discretion — all grey areas resolved.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `commands/dc/add.md` — established pattern for template resolution, file creation, MANIFEST.md updates, preview, commit
- `templates/domain-concept.md`, `templates/decision.md`, `templates/constraint.md` — templates for all three entry types
- `templates/manifest.md` — MANIFEST.md template with section headers and entry line formats
- `commands/dc/explore.md` — pattern for reading and parsing MANIFEST.md

### Established Patterns
- Template resolution: local `.claude/domain-context/templates/` then global `~/.claude/domain-context/templates/`
- MANIFEST.md entry format: `- [{Name}]({path}) — {description} [public] [verified: {YYYY-MM-DD}]`
- ADR numbering: auto-detect from existing `.context/decisions/[0-9][0-9][0-9]-*.md` files
- Kebab-case filenames derived from title
- HTML comment stripping from templates (except `<!-- verified: ... -->`)
- AskUserQuestion for user interaction at each decision point

### Integration Points
- `.planning/phases/*/` — source directories for scanning
- `.context/MANIFEST.md` — target for registration and duplicate detection
- `.context/{domain,decisions,constraints}/` — target for file creation
- `commands/dc/add.md` — pattern reference (not called, patterns replicated)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
