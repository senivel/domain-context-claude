# Phase 7: Add - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

dc:add creates new domain concepts, architecture decisions, or constraints from a freeform conversation. The user describes what to add, Claude extracts structured template sections, creates the file, and updates MANIFEST.md. This phase delivers the complete add workflow including type selection, content extraction, preview, file creation, and manifest integration.

</domain>

<decisions>
## Implementation Decisions

### Input & Invocation Flow
- Freeform text prompt: single AskUserQuestion asking user to describe what to add, then Claude extracts template sections
- If type not given as argument, present AskUserQuestion with 3 options: Domain concept, Architecture decision, Constraint
- Auto-derive kebab-case filename from the title Claude extracts, no user prompt
- Show filled content preview before writing — ask "Create this entry?" with Accept/Edit options

### Content Extraction & Template Filling
- For decisions, default status is "accepted" (most new decisions are recorded after being made)
- Unmentioned template sections filled with "Not yet documented" placeholder
- HTML comments from templates are stripped (same pattern as dc:init)
- Claude infers lifecycle/invariants/etc from freeform description where reasonable — preview step catches bad inferences

### MANIFEST.md Integration & Access Levels
- New entries appended to bottom of the relevant MANIFEST.md section (chronological order)
- Validate no duplicate entry exists (check filename and entry name) — warn and stop if duplicate found
- Default access level is public (.context/) — only prompt for private if user mentions confidential/private
- For private entries, create .context.local/ subdirectory structure if needed (mirror .context/ layout)

### Claude's Discretion
- Exact wording of the freeform description prompt
- How to parse the user's freeform text into template sections
- Preview formatting and layout
- How to detect keywords suggesting private access level
- Commit message wording after file creation

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- commands/dc/init.md: Template resolution pattern (local vs global install path), MANIFEST.md creation, AGENTS.md snippet injection
- commands/dc/explore.md: MANIFEST.md parsing logic (entry line formats, section detection)
- commands/dc/validate.md: MANIFEST.md section detection, entry format validation
- templates/domain-concept.md, decision.md, constraint.md: Target file templates with {placeholder} tokens

### Established Patterns
- Pure skill file: single markdown in commands/dc/, Claude reads files directly with Read/Write/Glob tools
- AskUserQuestion for interactive choices with concrete options
- Template resolution: check .claude/domain-context/templates/ then ~/.claude/domain-context/templates/
- No runtime dependencies — Claude does the work
- Kebab-case naming for all files, dc: prefix for skill names
- MANIFEST.md entry format: `- [Entry Name](path/to/file.md) -- Description [access_level] [verified: YYYY-MM-DD]`

### Integration Points
- commands/dc/add.md will be the new skill file
- Reads templates from same TEMPLATE_DIR as dc:init
- Writes to .context/domain/, .context/decisions/, or .context/constraints/
- Updates .context/MANIFEST.md with new entry line
- For private entries, writes to .context.local/ instead
- ADR number auto-detection scans .context/decisions/ for existing NNN-*.md files

</code_context>

<specifics>
## Specific Ideas

- Follow dc:init's template resolution pattern exactly (Step 1)
- ADR numbering: scan .context/decisions/ for files matching pattern NNN-*.md, take max + 1, zero-pad to 3 digits
- MANIFEST.md entry line format must match existing entries exactly for consistency with dc:explore and dc:validate parsing
- Preview should show the complete file content so user can verify before write

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 07-add*
*Context gathered: 2026-03-16*
