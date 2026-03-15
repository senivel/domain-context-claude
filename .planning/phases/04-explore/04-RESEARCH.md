# Phase 4: Explore - Research

**Researched:** 2026-03-14
**Domain:** Claude Code skill file for reading/browsing .context/ domain knowledge
**Confidence:** HIGH

## Summary

Phase 4 creates `dc:explore`, a read-only Claude Code skill that parses `.context/MANIFEST.md` and presents domain context entries with freshness status, keyword search, and progressive drill-in. This is a single markdown skill file (`commands/dc/explore.md`) that uses Claude's built-in tools (Read, Glob, AskUserQuestion) -- no runtime code, no dependencies, no build step.

The technical challenge is entirely in the skill file's process instructions: parsing MANIFEST.md's specific line format, computing date-based freshness, structuring AskUserQuestion flows within its 4-option limit, and handling edge cases (empty sections, missing files, malformed entries). All patterns are established by the existing `dc:init` skill.

**Primary recommendation:** Build a single `commands/dc/explore.md` skill file that follows `dc:init`'s exact structure (YAML frontmatter + objective/execution_context/process sections). The skill reads files with Claude's Read tool and interacts via AskUserQuestion -- no custom code needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Summary output grouped by MANIFEST.md section: Domain Concepts, Architecture Decisions, Constraints, Module Context Files
- Each section shows count in parentheses
- Each entry shows name + verified date: `- Integration Model [verified: 2026-03-11]`
- Stale entries (>90 days) replace verified date with inline warning: `[STALE - 94 days]`
- No descriptions in the summary -- names and freshness only
- Empty sections shown with count (0), no entries listed
- No-context fallback: "No .context/ directory found. Run /dc:init to set up domain context."
- Keyword search searches entry names, descriptions (from MANIFEST.md), AND file content; case-insensitive
- Multiple matches: list matching entry names with match location, user picks via AskUserQuestion
- No matches: "No entries matching '[keyword]' found. Run /dc:explore to see all entries."
- No fuzzy matching or "did you mean" suggestions
- Progressive disclosure: summary first, then AskUserQuestion "Explore an entry?" with section grouping
  - First level: pick a section type (Domain Concepts / Decisions / Constraints / Module Context Files / Done)
  - Second level: pick an entry within that section (entries + Back + Done)
- After viewing entry content: loop back with "Explore another entry?"
- Module CONTEXT.md files sourced from MANIFEST.md's "Module Context Files" section only -- no filesystem glob/discovery
- Module CONTEXT.md shown as separate section at bottom of summary

### Claude's Discretion
- Exact wording of AskUserQuestion prompts
- How to display full entry content (raw markdown vs formatted)
- Whether to show file path when displaying entry content
- Handling of malformed MANIFEST.md entries (missing dates, broken links)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXPL-01 | Summary with counts by type (domain concepts, decisions, constraints) | MANIFEST.md section parsing pattern; section headers are fixed per spec |
| EXPL-02 | Freshness status per entry (flags >90 days old) | Verified date regex pattern `[verified: YYYY-MM-DD]`; date arithmetic in skill instructions |
| EXPL-03 | Keyword search to find and read entries | Search across name, description, and file content; case-insensitive matching |
| EXPL-04 | Suggests /dc:init when no .context/ exists | Simple directory existence check pattern from dc:init |
| EXPL-05 | Progressive disclosure -- summary first, drill-in on demand | AskUserQuestion flow with section/entry selection within 4-option limit |
| EXPL-06 | Discovers and lists per-module CONTEXT.md files | Parse "Module Context Files" section of MANIFEST.md only (no filesystem discovery) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Claude Code Skill | N/A | Single markdown file defining the dc:explore command | Project convention -- all dc: commands are skill files in commands/dc/ |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Read tool | built-in | Read .context/MANIFEST.md and individual entry files | Every invocation |
| AskUserQuestion | built-in | Progressive disclosure navigation | Drill-in and keyword disambiguation |
| Glob tool | built-in | Not used (CONTEXT.md discovery is from MANIFEST.md only) | Listed in allowed-tools for consistency |
| Bash tool | built-in | Not used directly but available | Date computation if needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| MANIFEST.md-only discovery | Filesystem glob for CONTEXT.md | User locked: MANIFEST.md only, no glob discovery |
| AskUserQuestion navigation | Free-form prompts | AskUserQuestion provides structured options, matches dc:init pattern |

**Installation:** None -- this is a markdown skill file, no packages needed.

## Architecture Patterns

### Recommended Project Structure
```
commands/dc/
├── init.md          # existing skill
└── explore.md       # new skill (this phase)
```

### Pattern 1: Skill File Structure
**What:** YAML frontmatter with name, description, allowed-tools; then objective, execution_context, process sections
**When to use:** Every dc: skill
**Example:**
```markdown
---
name: dc:explore
description: Browse and search domain context...
allowed-tools:
  - Read
  - Glob
  - Bash
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

### Pattern 2: MANIFEST.md Entry Parsing
**What:** Each MANIFEST.md entry follows a specific line format that must be parsed to extract name, path, description, access level, and verified date.
**When to use:** Summary generation, freshness calculation, keyword search

The spec defines these entry formats:
```
## Domain Concepts
- [{Name}]({relative-path}) — {description} [{access-level}] [verified: {YYYY-MM-DD}]

## Architecture Decisions
- [{NNN}: {Title}]({relative-path}) — {description} [verified: {YYYY-MM-DD}]

## Constraints
- [{Name}]({relative-path}) — {description} [{access-level}] [verified: {YYYY-MM-DD}]

## Module Context Files
- {relative-path-to-CONTEXT.md} [verified: {YYYY-MM-DD}]
```

Real-world example from this project:
```
- [Integration Model](domain/integration-model.md) — Three-concern model... [public] [verified: 2026-03-11]
```

Key parsing elements:
- Name: text inside `[...]` before `](`
- Path: text inside `(...)`  after `[name]`
- Description: text after ` — ` (em dash, not hyphen)
- Verified date: text matching `[verified: YYYY-MM-DD]`
- Access level: text matching `[public]`, `[internal]`, or `[restricted]`
- Empty sections contain `(none yet)` or similar parenthetical text -- no bullet entries

### Pattern 3: AskUserQuestion with Option Limit
**What:** AskUserQuestion works best with up to 4 options. The explore flow must stay within this limit.
**When to use:** Section selection and entry selection

Section selection example (4 sections + Done = needs careful structuring):
- Option 1: "Domain Concepts (2)" (recommended)
- Option 2: "Architecture Decisions (3)"
- Option 3: "Constraints (0)"
- Option 4: "Module Context Files / Done"

If there are 5 options (4 sections + Done), group the last section with Done or use "Other" for Done. The skill instructions should handle this.

Entry selection within a section:
- If section has 1-3 entries: list entries + "Back" option
- If section has 4+ entries: may need pagination or grouping strategy

### Pattern 4: Freshness Calculation
**What:** Compare verified date to current date, flag entries >90 days old
**When to use:** Summary display per entry

The skill instructs Claude to:
1. Parse `[verified: YYYY-MM-DD]` from each entry line
2. Calculate days since that date compared to today
3. If >90 days: display `[STALE - {N} days]` instead of the verified date
4. If <=90 days: display `[verified: YYYY-MM-DD]`

Claude can do date arithmetic natively -- no Bash needed.

### Anti-Patterns to Avoid
- **Filesystem discovery for Module CONTEXT.md:** User locked decision -- only parse MANIFEST.md's Module Context Files section
- **Showing descriptions in summary:** User locked -- names and freshness only
- **Fuzzy matching in search:** User locked -- exact substring matching only, case-insensitive
- **Auto-displaying entry content:** User locked -- progressive disclosure, summary first always

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MANIFEST.md parsing | Custom parser script | Claude's native text parsing via skill instructions | Claude reads markdown natively; skill instructions guide extraction |
| Date arithmetic | Bash date commands | Claude's native date computation | Claude can calculate day differences from dates in text |
| File content search | grep/rg scripts | Claude's Read tool + text matching instructions | Skill files don't run scripts; Claude reads files directly |
| Interactive navigation | Custom menu system | AskUserQuestion with structured options | Built-in Claude Code tool, established pattern from dc:init |

**Key insight:** dc:explore is a pure skill file -- Claude IS the runtime. The skill instructs Claude what to read, how to parse it, and how to present it. No external code needed.

## Common Pitfalls

### Pitfall 1: Overcomplicating the Skill File
**What goes wrong:** Trying to make the skill file handle every edge case with explicit branching logic
**Why it happens:** Treating the skill file like code instead of instructions for an intelligent agent
**How to avoid:** Write clear intent-based instructions. Claude handles edge cases naturally. Only specify behavior for cases the user locked in CONTEXT.md.
**Warning signs:** Skill file exceeds 200 lines; deeply nested if/else in process steps

### Pitfall 2: AskUserQuestion Option Overflow
**What goes wrong:** Presenting more than 4 options to AskUserQuestion, causing truncation or confusion
**Why it happens:** Not accounting for the 4-option practical limit
**How to avoid:** The CONTEXT.md specifies two-level navigation (section first, then entry). Sections are fixed at 4 types. For entries, use Back+Done as two of the 4 slots, leaving 2 for entries -- paginate if more than 2 entries.
**Warning signs:** Steps that list "all entries as options" without pagination

### Pitfall 3: Incorrect MANIFEST.md Line Format Assumptions
**What goes wrong:** Parsing breaks on real-world MANIFEST.md variations (missing descriptions, no access level tag, em dash vs hyphen)
**Why it happens:** Not studying actual MANIFEST.md files carefully
**How to avoid:** The spec uses ` — ` (space-em-dash-space) as separator. Access level is optional for decisions. Module Context entries have a different format (no link brackets). Handle these variations explicitly.
**Warning signs:** Parser works on template but fails on real manifests

### Pitfall 4: Empty Section Detection
**What goes wrong:** Treating "(none yet)" text as an entry, or crashing on sections with no entries
**Why it happens:** Assuming all lines under a section header are entries
**How to avoid:** Entries start with `- [` (for linked entries) or `- ` followed by a path (for module context). Lines like `(none yet)` or `(none ...)` are placeholders, not entries.
**Warning signs:** Summary shows incorrect counts

### Pitfall 5: Forgetting the Loop-Back After Viewing
**What goes wrong:** Skill exits after showing one entry instead of offering to explore more
**Why it happens:** Missing the "loop back" requirement from CONTEXT.md
**How to avoid:** After displaying entry content, always offer "Explore another entry?" and return to section selection.

## Code Examples

### Skill Frontmatter Pattern (from dc:init)
```markdown
---
name: dc:explore
description: Browse and search domain context in the current project. Shows summary of all entries with freshness status, supports keyword search, and lets you drill into specific entries. Use when you want to understand what domain knowledge exists.
allowed-tools:
  - Read
  - Glob
  - Bash
  - AskUserQuestion
---
```

### Summary Output Format (from CONTEXT.md decisions)
```
Domain Context:

  Domain Concepts (2)
    - Integration Model                [verified: 2026-03-11]
    - Claude Code Extensions           [verified: 2026-03-11]

  Architecture Decisions (3)
    - 001: Single Project              [verified: 2026-03-11]
    - 002: AGENTS.md Bridge            [verified: 2026-03-11]
    - 003: No MCP for MVP             [verified: 2026-03-11]

  Constraints (0)

  Module Context Files (0)
```

### Stale Entry Display
```
  Domain Concepts (2)
    - Integration Model                [STALE - 94 days]
    - Claude Code Extensions           [verified: 2026-03-11]
```

### MANIFEST.md Entry Regex Patterns
```
Entry with link:    /^- \[(.+?)\]\((.+?)\) — (.+?) \[verified: (\d{4}-\d{2}-\d{2})\]$/
With access level:  /^- \[(.+?)\]\((.+?)\) — (.+?) \[(public|internal|restricted)\] \[verified: (\d{4}-\d{2}-\d{2})\]$/
Module context:     /^- (.+?) \[verified: (\d{4}-\d{2}-\d{2})\]$/
Empty section:      /^\(none.*\)$/
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Runtime scripts for context browsing | Pure skill files -- Claude is the runtime | Project inception | No dependencies, no build step, no maintenance |
| Glob-based CONTEXT.md discovery | MANIFEST.md-only discovery | CONTEXT.md decision (Phase 4) | Simpler, authoritative, no stale orphan detection needed here |

## Open Questions

1. **AskUserQuestion pagination for large sections**
   - What we know: Sections with 4+ entries need pagination since AskUserQuestion has ~4 option limit. Back and Done take 2 slots.
   - What's unclear: Exact pagination UX (show 2 entries at a time? numbered pages?)
   - Recommendation: Show 2 entries + "More" + "Back" when section has >2 entries. Claude's discretion per CONTEXT.md.

2. **Handling entries with missing verified dates**
   - What we know: Spec says every entry MUST have verified date. Real manifests may not.
   - What's unclear: Whether to show "unknown" or skip freshness display
   - Recommendation: Show `[no date]` for entries missing verified date. Claude's discretion per CONTEXT.md.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | bash (validate-templates.sh pattern) |
| Config file | none -- shell script in tools/ |
| Quick run command | `bash tools/validate-templates.sh` |
| Full suite command | `bash tools/validate-templates.sh` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXPL-01 | Summary with counts by type | manual-only | N/A -- skill file output is conversational | N/A |
| EXPL-02 | Freshness status per entry | manual-only | N/A -- requires Claude to run the skill | N/A |
| EXPL-03 | Keyword search finds entries | manual-only | N/A -- requires Claude to run the skill | N/A |
| EXPL-04 | Suggests dc:init when no .context/ | manual-only | N/A -- requires Claude to run the skill | N/A |
| EXPL-05 | Progressive disclosure flow | manual-only | N/A -- requires Claude to run the skill | N/A |
| EXPL-06 | Lists module CONTEXT.md files | manual-only | N/A -- requires Claude to run the skill | N/A |

**Manual-only justification:** dc:explore is a Claude Code skill file (markdown instructions). Its behavior is produced by Claude interpreting the skill at runtime. There is no executable code to unit test. Validation is done by running `/dc:explore` in Claude Code and checking the output matches requirements.

### Structural Validation (automatable)
| Check | Test Type | Automated Command | File Exists? |
|-------|-----------|-------------------|-------------|
| Skill file exists | smoke | `test -f commands/dc/explore.md && echo PASS` | Wave 0 |
| YAML frontmatter valid | smoke | `head -20 commands/dc/explore.md \| grep -q "name: dc:explore"` | Wave 0 |
| Has required sections | smoke | `grep -c "<objective>\|<execution_context>\|<process>" commands/dc/explore.md` | Wave 0 |
| Allowed tools include Read | smoke | `head -10 commands/dc/explore.md \| grep -q "Read"` | Wave 0 |
| Allowed tools include AskUserQuestion | smoke | `head -10 commands/dc/explore.md \| grep -q "AskUserQuestion"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `test -f commands/dc/explore.md && head -20 commands/dc/explore.md | grep -q "name: dc:explore" && echo PASS`
- **Per wave merge:** Structural checks above + manual `/dc:explore` run
- **Phase gate:** Manual execution of `/dc:explore` on this project's .context/ verifying all 6 requirements

### Wave 0 Gaps
None -- no test infrastructure needed. The deliverable is a single skill file whose structure can be validated with simple bash checks.

## Sources

### Primary (HIGH confidence)
- `/Users/alevine/code/domain-context/SPEC.md` Section 6.3 -- MANIFEST.md format specification
- `/Users/alevine/code/domain-context-claude/commands/dc/init.md` -- Established skill file pattern
- `/Users/alevine/code/domain-context-claude/.context/MANIFEST.md` -- Real-world MANIFEST.md example
- `/Users/alevine/code/domain-context-claude/.planning/phases/04-explore/04-CONTEXT.md` -- User decisions

### Secondary (MEDIUM confidence)
- `/Users/alevine/code/domain-context-claude/templates/manifest.md` -- Template format (may differ from real manifests)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- this is a single skill file, same pattern as dc:init
- Architecture: HIGH -- all patterns verified against existing code and spec
- Pitfalls: HIGH -- derived from studying real MANIFEST.md format and AskUserQuestion constraints

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable -- skill file patterns unlikely to change)
