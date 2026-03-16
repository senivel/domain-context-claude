# Phase 07: Add - Research

**Researched:** 2026-03-16
**Domain:** Claude Code skill authoring (markdown skill for domain context entry creation)
**Confidence:** HIGH

## Summary

Phase 07 creates a new Claude Code skill (`dc:add`) that lets users create domain concepts, architecture decisions, or constraints from a freeform conversation. The skill follows established patterns from dc:init, dc:explore, and dc:validate -- it is a single markdown file in `commands/dc/` that uses Read/Write/Glob/AskUserQuestion tools. No new libraries or runtime dependencies are needed.

The core complexity is in content extraction: parsing a user's freeform description into structured template sections. This is a Claude-native operation (the LLM extracts structure from prose), so no NLP libraries are needed. The skill must also handle ADR auto-numbering, MANIFEST.md integration, and the public/private access level distinction.

**Primary recommendation:** Build dc:add as a single skill file following the exact patterns of dc:init (template resolution, HTML comment stripping) and dc:validate (MANIFEST.md section detection, entry format). The skill's unique contribution is the freeform-to-template extraction step, which Claude handles natively.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Freeform text prompt: single AskUserQuestion asking user to describe what to add, then Claude extracts template sections
- If type not given as argument, present AskUserQuestion with 3 options: Domain concept, Architecture decision, Constraint
- Auto-derive kebab-case filename from the title Claude extracts, no user prompt
- Show filled content preview before writing -- ask "Create this entry?" with Accept/Edit options
- For decisions, default status is "accepted" (most new decisions are recorded after being made)
- Unmentioned template sections filled with "Not yet documented" placeholder
- HTML comments from templates are stripped (same pattern as dc:init)
- Claude infers lifecycle/invariants/etc from freeform description where reasonable -- preview step catches bad inferences
- New entries appended to bottom of the relevant MANIFEST.md section (chronological order)
- Validate no duplicate entry exists (check filename and entry name) -- warn and stop if duplicate found
- Default access level is public (.context/) -- only prompt for private if user mentions confidential/private
- For private entries, create .context.local/ subdirectory structure if needed (mirror .context/ layout)

### Claude's Discretion
- Exact wording of the freeform description prompt
- How to parse the user's freeform text into template sections
- Preview formatting and layout
- How to detect keywords suggesting private access level
- Commit message wording after file creation

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADDC-01 | User can run /dc:add to create a new domain concept, decision, or constraint | Skill file structure, template resolution pattern, AskUserQuestion flow |
| ADDC-02 | Add accepts type as argument or prompts user interactively | AskUserQuestion with 3 options pattern from dc:explore |
| ADDC-03 | Add auto-detects next ADR number for decisions by scanning existing files | Glob pattern for `.context/decisions/NNN-*.md`, parse max number |
| ADDC-04 | Add fills template sections from user's freeform description (conversational extraction) | Template placeholder tokens, Claude-native extraction, "Not yet documented" defaults |
| ADDC-05 | Add creates file with kebab-case naming convention | Title-to-kebab-case conversion pattern |
| ADDC-06 | Add updates MANIFEST.md with new entry in correct section, verified date = today | MANIFEST.md section detection from dc:validate, entry line formats |
| ADDC-07 | Add respects access levels (public to .context/, private to .context.local/) | Keyword detection for private, .context.local/ directory mirroring |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Claude Code skill format | N/A | Skill file in `commands/dc/add.md` | All dc:* skills use this format |
| YAML frontmatter | N/A | Skill metadata (name, description, allowed-tools) | Required by Claude Code |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Read tool | N/A | Read templates, MANIFEST.md, existing files | Template resolution, duplicate detection |
| Write tool | N/A | Create new context files, update MANIFEST.md | File creation after preview approval |
| Edit tool | N/A | Append entries to MANIFEST.md | Inserting new entry lines in correct section |
| Glob tool | N/A | Scan decisions directory for ADR numbering | Auto-detect next ADR number |
| Bash tool | N/A | mkdir -p for .context.local/ subdirs | Private entry directory creation |
| AskUserQuestion | N/A | Type selection, freeform input, preview confirmation | Interactive flow |

No npm packages or runtime dependencies needed. This is a pure skill file.

## Architecture Patterns

### Recommended Project Structure
```
commands/dc/
  add.md           # NEW - the dc:add skill file
templates/
  domain-concept.md  # EXISTING - read by dc:add
  decision.md        # EXISTING - read by dc:add
  constraint.md      # EXISTING - read by dc:add
```

### Pattern 1: Template Resolution (from dc:init)
**What:** Check local install path first, then global install path for template files.
**When to use:** Every time dc:add needs to read a template.
**Example:**
```
1. Check .claude/domain-context/templates/ exists in project dir
2. If yes, TEMPLATE_DIR = that path
3. If no, check ~/.claude/domain-context/templates/
4. If yes, TEMPLATE_DIR = that path
5. If neither, error with install instructions
```

### Pattern 2: MANIFEST.md Section Insertion (from dc:validate orphan registration)
**What:** Find the correct section header in MANIFEST.md and append an entry at the bottom of that section.
**When to use:** After creating the new context file.
**Example entry line formats (from existing MANIFEST.md):**
```markdown
# Domain Concepts:
- [Integration Model](domain/integration-model.md) -- Three-concern model... [public] [verified: 2026-03-11]

# Architecture Decisions:
- [001: Single Project](decisions/001-single-project.md) -- Single repo... [verified: 2026-03-11]

# Constraints:
- [Data Retention Policy](constraints/data-retention-policy.md) -- ... [public] [verified: 2026-03-11]
```

### Pattern 3: ADR Number Auto-Detection
**What:** Scan `.context/decisions/` for files matching `NNN-*.md`, find the highest number, increment by 1, zero-pad to 3 digits.
**When to use:** When creating a new architecture decision.
**Example:**
```
Existing files: 001-single-project.md, 002-agents-md-bridge.md, 003-no-mcp-mvp.md
Next number: 004
Filename: 004-kebab-case-title.md
```

### Pattern 4: Freeform-to-Template Extraction
**What:** Claude reads the template to understand section names, then maps freeform user description to those sections.
**When to use:** After receiving freeform description from user.
**Process:**
1. Read the appropriate template file
2. Identify section headers (## What This Is, ## Lifecycle, etc.)
3. Map relevant parts of user's description to sections
4. Fill unmentioned sections with "Not yet documented"
5. Strip HTML comments
6. Replace `{placeholder}` tokens with extracted content

### Pattern 5: Duplicate Detection
**What:** Before creating a file, check both filename and entry name against existing entries.
**When to use:** After deriving the filename and before writing.
**Process:**
1. Derive kebab-case filename from extracted title
2. Check if file already exists at target path via Read
3. Parse MANIFEST.md entries in the target section
4. Check if any entry name matches (case-insensitive)
5. If duplicate found, warn user and stop

### Anti-Patterns to Avoid
- **Building a custom template engine:** The templates use simple `{placeholder}` tokens. String replacement is sufficient. No regex-based template engines needed.
- **Prompting for every section individually:** The user gives one freeform description. Claude extracts all sections at once. Multiple prompts would be tedious.
- **Modifying MANIFEST.md with regex-based find/replace:** Use Edit tool to insert lines at the right position. Reading the file, finding the section, and inserting before the next `##` header is the proven pattern from dc:validate.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Template filling | Custom template engine | Simple string replacement of `{placeholder}` tokens | Templates are simple, no conditionals or loops |
| MANIFEST.md parsing | Custom parser | Same parsing logic as dc:explore/dc:validate | Consistency with existing skills |
| ADR numbering | Manual counter | Glob + parse filenames | Edge cases (gaps, non-standard names) handled by pattern matching |
| Kebab-case conversion | Custom function | Standard lowercasing + replace spaces/special chars with hyphens | Simple transformation |

## Common Pitfalls

### Pitfall 1: MANIFEST.md Section Boundary Detection
**What goes wrong:** Inserting an entry after the wrong line or outside the section boundary.
**Why it happens:** Sections end at the next `##` header or end-of-file, but empty sections have `(none yet)` placeholder text that must be replaced, not appended after.
**How to avoid:** If section contains `(none yet)`, replace that line with the new entry. Otherwise, find the line before the next `##` header and insert after it.
**Warning signs:** Entry appears under wrong section or after the section boundary.

### Pitfall 2: ADR Number Gaps
**What goes wrong:** If decisions 001, 002, 004 exist (003 was deleted), next number should be 005 not 003.
**Why it happens:** Simple count of files doesn't account for gaps.
**How to avoid:** Parse the numeric prefix from each filename, take the max, add 1.
**Warning signs:** Duplicate ADR numbers.

### Pitfall 3: Private Entry Directory Structure
**What goes wrong:** Writing to `.context.local/domain/` without creating the directory first.
**Why it happens:** .context.local/ may not exist at all, or may exist without subdirectories.
**How to avoid:** Use `mkdir -p` to create the full path before writing the file.
**Warning signs:** Write tool failure on missing directory.

### Pitfall 4: MANIFEST.md Entry Format Mismatch
**What goes wrong:** New entry line format doesn't match existing entries, breaking dc:explore and dc:validate parsing.
**Why it happens:** Subtle format differences (em dash vs double dash, bracket placement, missing access level tag).
**How to avoid:** Use exact format from existing entries. Note: the actual MANIFEST.md uses ` -- ` (double dash with spaces) in some entries and ` — ` (em dash) in others. The dc:explore/dc:validate parsing handles both. Use em dash ` — ` for consistency with the display format.
**Warning signs:** dc:explore or dc:validate fails to parse the new entry.

### Pitfall 5: Preview Step Edit Loop
**What goes wrong:** If user picks "Edit" on the preview, the skill needs to handle re-prompting gracefully.
**Why it happens:** AskUserQuestion "Edit" option needs to collect new freeform input and re-extract.
**How to avoid:** When user picks "Edit", ask a new AskUserQuestion for corrections, re-extract, and show preview again. Keep it simple: one round of editing is sufficient.
**Warning signs:** Infinite edit loops or lost context.

### Pitfall 6: Private MANIFEST.md Handling
**What goes wrong:** Adding a private entry to the public `.context/MANIFEST.md` instead of `.context.local/MANIFEST.md`.
**Why it happens:** Private entries need their own MANIFEST.md in `.context.local/`.
**How to avoid:** For private entries, check if `.context.local/MANIFEST.md` exists. If not, create it with the basic section structure. Then add the entry there.
**Warning signs:** Private entries visible in public context.

## Code Examples

### Skill File Header (from dc:init pattern)
```yaml
---
name: dc:add
description: Add a new domain concept, architecture decision, or constraint from a freeform description. Creates the file and updates MANIFEST.md.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - AskUserQuestion
---
```

### Type Selection AskUserQuestion
```
Prompt: "What type of entry would you like to add?"
Options:
  1. "Domain concept" -- describes a core business concept
  2. "Architecture decision" -- records an ADR
  3. "Constraint" -- documents an external constraint
```

### Freeform Description Prompt
```
Prompt: "Describe the [domain concept/decision/constraint] you want to add. Include as much detail as you'd like -- I'll organize it into the right template sections."
Options:
  1. (freeform text input)
```

### Title-to-Kebab-Case Conversion
```
Input: "Data Retention Policy"
Output: "data-retention-policy"

Input: "ADR for API Gateway Choice"
Output: "api-gateway-choice" (strip "ADR for" prefix)

Steps:
1. Lowercase
2. Replace spaces with hyphens
3. Remove special characters except hyphens
4. Collapse multiple hyphens
5. Trim leading/trailing hyphens
```

### ADR Number Detection
```
1. Glob: .context/decisions/[0-9][0-9][0-9]-*.md
2. For each file, extract first 3 characters as number
3. Max of all numbers + 1
4. Zero-pad to 3 digits
5. If no files found, start at 001
```

### MANIFEST.md Entry Insertion
```
For "Domain Concepts" section, new entry "Data Model":
1. Read .context/MANIFEST.md
2. Find line "## Domain Concepts"
3. Find next "##" header (or EOF)
4. If section contains "(none yet)", replace that line with entry
5. Otherwise, insert new entry line before the next "##" header
6. Entry: - [Data Model](domain/data-model.md) — Description [public] [verified: 2026-03-16]
```

### Private Entry Keyword Detection
```
Keywords suggesting private access: "confidential", "private", "secret", "internal-only", "restricted"
Check user's freeform description for these keywords (case-insensitive).
If found, ask: "This sounds like it might be confidential. Should this be a private entry in .context.local/?"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual file creation + MANIFEST.md editing | dc:add skill with conversational extraction | Phase 07 | Users no longer need to know template structure |

## Open Questions

1. **Private MANIFEST.md bootstrapping**
   - What we know: Private entries go to `.context.local/` and its MANIFEST.md
   - What's unclear: Should dc:add create a full MANIFEST.md with all section headers, or just the minimum needed section?
   - Recommendation: Create a minimal MANIFEST.md with all four section headers (matching public structure) for consistency. Use the manifest template but with a modified description.

2. **Edit flow depth**
   - What we know: Preview has "Accept/Edit" options
   - What's unclear: How many rounds of editing to support before forcing accept/cancel
   - Recommendation: Support one round. If user picks Edit, collect corrections, re-extract, show preview again with Accept/Cancel only. Keeps the flow simple.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual validation (skill files are markdown, not executable code) |
| Config file | none |
| Quick run command | Run `/dc:add` in a test project |
| Full suite command | Run all dc:add scenarios below |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADDC-01 | Running /dc:add creates a file | manual | Run `/dc:add` and verify file created | N/A |
| ADDC-02 | Type argument or interactive prompt | manual | Run `/dc:add decision` and `/dc:add` (no arg) | N/A |
| ADDC-03 | ADR number auto-detection | manual | Create decisions 001-003, run `/dc:add decision`, verify 004 | N/A |
| ADDC-04 | Freeform extraction fills template | manual | Provide rich description, verify template sections filled | N/A |
| ADDC-05 | Kebab-case filename | manual | Add entry with multi-word title, verify filename | N/A |
| ADDC-06 | MANIFEST.md updated with entry | manual | After add, read MANIFEST.md and verify new entry line | N/A |
| ADDC-07 | Private entries to .context.local/ | manual | Mention "confidential" in description, verify .context.local/ used | N/A |

### Sampling Rate
- **Per task commit:** Manually run `/dc:add` in test project and verify output
- **Per wave merge:** Run all 7 scenarios above
- **Phase gate:** All scenarios pass before `/gsd:verify-work`

### Wave 0 Gaps
None -- skill files are markdown documents tested by manual execution. No test framework infrastructure needed.

## Sources

### Primary (HIGH confidence)
- `commands/dc/init.md` -- Template resolution pattern, HTML comment stripping, skill file structure
- `commands/dc/explore.md` -- MANIFEST.md entry line format, section parsing, AskUserQuestion patterns
- `commands/dc/validate.md` -- MANIFEST.md section detection, entry format for registration, duplicate handling
- `templates/domain-concept.md` -- Template structure with `{placeholder}` tokens and HTML comments
- `templates/decision.md` -- ADR template with `{number}`, `{decision_title}`, `{status}` placeholders
- `templates/constraint.md` -- Constraint template structure
- `.context/MANIFEST.md` -- Live example of entry line format

### Secondary (MEDIUM confidence)
- CONTEXT.md user decisions -- Locked implementation choices for flow and behavior

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No external dependencies, follows established project patterns exactly
- Architecture: HIGH - Directly modeled on existing dc:init, dc:explore, dc:validate skills
- Pitfalls: HIGH - Identified from concrete analysis of existing code and MANIFEST.md format

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable -- skill format and template structure are settled)
