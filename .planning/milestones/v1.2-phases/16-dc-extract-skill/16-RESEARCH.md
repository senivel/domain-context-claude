# Phase 16: dc:extract Skill - Research

**Researched:** 2026-03-17
**Domain:** Claude Code skill authoring, GSD artifact scanning, domain context file creation
**Confidence:** HIGH

## Summary

This phase creates the dc:extract skill -- a markdown skill file at `commands/dc/extract.md` that scans completed GSD phase artifacts in `.planning/phases/`, classifies extractable domain knowledge into three types (domain concepts, decisions, constraints), and lets users selectively accept proposals that create spec-compliant `.context/` files. The skill reuses established patterns from dc:add (template resolution, file writing, MANIFEST.md updates, ADR numbering, commit prompting) and dc:explore (MANIFEST.md parsing for duplicate detection).

The implementation is a single markdown skill file following the project's established Claude Code skill format (YAML frontmatter + objective/execution_context/process sections). No runtime code, no libraries, no build step. The skill's intelligence comes from Claude's analysis of planning artifacts -- the skill file provides the procedural instructions for that analysis.

**Primary recommendation:** Build dc:extract as a single `commands/dc/extract.md` skill file that follows dc:add's 12-step pattern, adapted for batch extraction: scan -> classify -> preview table -> accept/reject loop -> write files -> summary -> commit.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Scan CONTEXT.md and SUMMARY.md from phase directories -- these contain decisions and outcomes
- Phase scoping via range argument (`/dc:extract 7-9`) -- parse range, filter phases by number
- When .planning/ has no completed phases, show "No completed phase artifacts found in .planning/" and stop
- Detect completed phases by checking for SUMMARY.md presence in phase directory
- Group findings by type (domain concepts, decisions, constraints) -- matches .context/ subdirectory structure
- No hard limit on proposal count -- aim for quality over quantity, typically 3-8 per run
- Cross-reference MANIFEST.md with title similarity check -- skip entries with similar names, note them
- dc:extract creates NEW entries only -- dc:refresh handles updates
- Show all proposals in a summary table first, then let user accept/reject each individually via AskUserQuestion
- Reuse dc:add's template resolution, file writing, and MANIFEST.md update patterns for consistency
- Post-extraction summary shows count by type (N domain concepts, M decisions, K constraints extracted) with file paths
- Prompt with AskUserQuestion "Commit extracted entries?" -- matches dc:add's commit pattern

### Claude's Discretion
No items delegated to Claude's discretion -- all grey areas resolved.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCAN-01 | dc:extract scans .planning/ for completed phase CONTEXT.md, SUMMARY.md, RESEARCH.md, and RETROSPECTIVE.md | Scanning pattern documented; SUMMARY.md presence = completed phase; read all four artifact types from each phase dir |
| SCAN-02 | dc:extract shows clear error with guidance when .context/ or .planning/ is missing | Follows dc:add Step 1 pattern for .context/ check; add parallel check for .planning/ |
| SCAN-03 | User can scope extraction to specific phases (e.g., `/dc:extract 7-9`) | Parse argument as single number or range (N-M); filter phase directories by number prefix |
| CLASS-01 | Identifies extractable domain concepts (business rules, invariants, lifecycle models) | Claude analyzes artifact content; skill instructions define what qualifies as a domain concept |
| CLASS-02 | Identifies architecture decisions worthy of formal ADRs | Skill instructions define ADR-worthy criteria: significant tradeoffs, alternatives considered, lasting impact |
| CLASS-03 | Identifies external constraints (regulatory, API limits, security policies) | Skill instructions define constraint criteria: external sources, non-negotiable requirements |
| PROP-01 | Cross-references proposals against existing MANIFEST.md to avoid duplicates | dc:explore's MANIFEST.md parsing pattern + title similarity check |
| PROP-02 | Previews all proposed extractions with source attribution before writing | Summary table with type, title, source phase, and source file for each proposal |
| PROP-03 | User can selectively accept or reject individual proposals | AskUserQuestion loop per proposal after summary table |
| PROP-04 | Accepted proposals create spec-compliant .context/ files using existing templates and update MANIFEST.md | Reuse dc:add's template resolution, file writing, MANIFEST.md update, ADR numbering patterns |
| PROP-05 | dc:extract shows summary of what was extracted after completion | Count by type with file paths, matching dc:add's summary format |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| N/A (markdown skill) | N/A | This is a Claude Code skill file, not runtime code | Project convention: skills are markdown with YAML frontmatter |

### Supporting
No runtime dependencies. The skill file instructs Claude to use built-in tools (Read, Write, Edit, Glob, Bash, AskUserQuestion).

### Alternatives Considered
None -- the project convention is firmly established. All dc:* skills are markdown files in `commands/dc/`.

## Architecture Patterns

### Recommended Project Structure
```
commands/dc/
  extract.md          # NEW -- the dc:extract skill (this phase)
  add.md              # EXISTING -- pattern reference for file creation
  explore.md          # EXISTING -- pattern reference for MANIFEST.md parsing
  init.md             # EXISTING -- pattern reference for template resolution
  refresh.md          # EXISTING -- pattern reference for entry review flow
  validate.md         # EXISTING
```

### Pattern 1: Claude Code Skill File Format
**What:** YAML frontmatter (`name`, `description`, `allowed-tools`) + `<objective>`, `<execution_context>`, `<process>` sections
**When to use:** Every dc:* skill
**Example:**
```markdown
---
name: dc:extract
description: Extract domain knowledge from completed GSD phases into .context/ entries.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - AskUserQuestion
---

<objective>...</objective>
<execution_context>...</execution_context>
<process>...</process>
```

### Pattern 2: Reuse dc:add's File Creation Pipeline
**What:** Template resolution -> content filling -> HTML comment stripping -> file writing -> MANIFEST.md update
**When to use:** When creating .context/ entries (PROP-04)
**Key steps from dc:add to replicate:**
1. Template resolution (local `.claude/domain-context/templates/` then global `~/.claude/domain-context/templates/`)
2. Template filling with extracted content, replacing `{placeholder}` tokens
3. HTML comment stripping (except `<!-- verified: ... -->`)
4. Kebab-case filename derivation from title
5. ADR number auto-detection (for decisions): Glob `.context/decisions/[0-9][0-9][0-9]-*.md`, max+1, zero-pad to 3 digits
6. MANIFEST.md entry line construction with em dash separator and `[verified: YYYY-MM-DD]`
7. Section-aware insertion (replace `(none yet)` or append before next `##` header)

### Pattern 3: MANIFEST.md Parsing for Duplicate Detection
**What:** Parse MANIFEST.md section by section, extract entry names, compare against proposals
**When to use:** PROP-01 duplicate detection
**Key details from dc:explore:**
- Section headers: `## Domain Concepts`, `## Architecture Decisions`, `## Constraints`
- Entry format: `- [{Name}]({path}) -- {description} [{access}] [verified: {YYYY-MM-DD}]`
- Skip `(none yet)` placeholder lines
- Title similarity = case-insensitive substring match of proposal title against existing entry names

### Pattern 4: AskUserQuestion Interactive Flow
**What:** Use AskUserQuestion tool for each decision point, respecting 4-option limit
**When to use:** Preview/accept/reject loop (PROP-03)
**Key constraints:**
- Maximum 4 options per AskUserQuestion call
- Include a recommended option
- Freeform input supported when needed

### Anti-Patterns to Avoid
- **Calling dc:add programmatically:** Skills are instructions for Claude, not callable functions. Replicate dc:add's patterns within dc:extract's process steps.
- **Over-extracting implementation details:** Domain context captures WHY, not WHAT or HOW. The skill must instruct Claude to filter for business rules, invariants, decisions, and constraints -- not code patterns or task lists.
- **Writing files before user approval:** PROP-02 requires preview before any file writes. All proposals must be shown first.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Template resolution | Custom template finder | dc:add's 2-location resolution pattern | Consistency with existing skills |
| MANIFEST.md updates | Custom parser | dc:add's section-aware insertion pattern | Tested pattern handles `(none yet)` and section boundaries |
| ADR numbering | Custom numbering | dc:add's Glob + max+1 + zero-pad pattern | Edge cases (gaps, non-numeric) already handled |
| File naming | Custom slug generator | dc:add's kebab-case derivation | Consistent naming across all dc:* entries |

## Common Pitfalls

### Pitfall 1: Scanning Non-Completed Phases
**What goes wrong:** Extracting from phases that haven't finished leads to incomplete/wrong domain knowledge
**Why it happens:** Phase directories exist before completion
**How to avoid:** Check for SUMMARY.md presence in each phase directory (user decision). Only phases with at least one `*-SUMMARY.md` file are considered completed.
**Warning signs:** Proposals referencing "pending" or "planned" work

### Pitfall 2: Extracting Implementation Details Instead of Domain Knowledge
**What goes wrong:** Proposals capture HOW something was built rather than WHY decisions were made
**Why it happens:** SUMMARY.md files contain both implementation details and decision rationale
**How to avoid:** Skill instructions must explicitly define extraction criteria:
- Domain concepts: business rules, invariants, lifecycle models, not code patterns
- Decisions: significant tradeoffs with lasting impact, not implementation choices
- Constraints: external requirements, not internal conventions
**Warning signs:** Proposals about "file structure" or "code organization" rather than business logic

### Pitfall 3: Duplicate Proposals for Existing Entries
**What goes wrong:** Proposing entries that already exist in .context/
**Why it happens:** Planning artifacts discuss existing domain concepts
**How to avoid:** Cross-reference against MANIFEST.md before presenting proposals. Title similarity check (case-insensitive). Note skipped entries so user understands what was filtered.

### Pitfall 4: Breaking MANIFEST.md Format
**What goes wrong:** Entry lines don't match expected format, breaking dc:explore and dc:refresh parsing
**Why it happens:** Subtle format differences (wrong dash type, missing brackets, wrong path)
**How to avoid:** Use exact format strings from dc:add. Entry format per type:
- Domain: `- [{Title}]({path}) -- {desc} [public] [verified: {date}]`
- Decision: `- [{NNN}: {Title}]({path}) -- {desc} [verified: {date}]`
- Constraint: `- [{Title}]({path}) -- {desc} [public] [verified: {date}]`

### Pitfall 5: Phase Range Argument Parsing Edge Cases
**What goes wrong:** Incorrect phase filtering with range arguments
**Why it happens:** Various input formats: single number, range, no argument
**How to avoid:** Define clear parsing rules:
- No argument: scan all completed phases
- Single number (`/dc:extract 7`): scan only phase 7
- Range (`/dc:extract 7-9`): scan phases 7, 8, and 9
- Extract phase number from directory name prefix (e.g., `14-gsd-bridge-template` -> 14)

## Code Examples

### GSD Phase Directory Structure (Scanning Targets)
```
.planning/phases/
  14-gsd-bridge-template/
    14-CONTEXT.md          # Phase context with decisions
    14-RESEARCH.md         # Research findings
    14-01-SUMMARY.md       # Plan completion summary (presence = completed)
  15-dc-init-gsd-detection/
    15-CONTEXT.md
    15-RESEARCH.md
    15-01-SUMMARY.md
```

### CONTEXT.md Structure (Source for Extraction)
Key sections containing extractable knowledge:
- `<decisions>` block: Implementation decisions, patterns established
- `<code_context>` block: Established patterns, integration points
- `<domain>` block: Phase boundary description

### SUMMARY.md Structure (Source for Extraction)
Key sections containing extractable knowledge:
- YAML frontmatter: `key-decisions`, `patterns-established`, `tech-stack`
- `## Decisions Made` section: Rationale for choices
- `## Accomplishments` section: What was achieved (filter for WHY, not WHAT)

### Proposal Table Format
```
Proposed extractions from phases 10-15:

  #  Type        Title                    Source
  1  Decision    Stdin Timeout for Hooks   Phase 10 SUMMARY.md
  2  Concept     Sentinel Pattern          Phase 14 CONTEXT.md
  3  Constraint  4-Option AskUser Limit    Phase 12 CONTEXT.md

  3 proposals (1 concept, 1 decision, 1 constraint)
  Skipped: "Integration Model" (already in MANIFEST.md)
```

### Accept/Reject Loop Pattern
```
For proposal #1: "Stdin Timeout for Hooks" (Decision)
  Source: Phase 10 SUMMARY.md
  Content preview:
    Context: Hooks reading from stdin can hang indefinitely...
    Decision: Use a 3-second timeout on stdin reads...
    Rationale: Prevents UI error warnings while still...

  [Accept (recommended)] [Reject] [Edit first]
```

### Post-Extraction Summary Format
```
Extraction complete:
  1 domain concept created
  1 architecture decision created (ADR-004)
  0 constraints created

  Files:
    .context/domain/sentinel-pattern.md
    .context/decisions/004-stdin-timeout-for-hooks.md

  MANIFEST.md updated with 2 new entries
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual .context/ creation | dc:add for individual entries | v1.0 | Single-entry workflow established |
| No GSD integration | dc:extract for batch extraction | v1.2 (this phase) | Bridges .planning/ -> .context/ |

## Open Questions

1. **RESEARCH.md and RETROSPECTIVE.md as scan sources**
   - What we know: SCAN-01 lists these as scan targets. RESEARCH.md files exist in phase directories. No RETROSPECTIVE.md files exist yet in this project.
   - What's unclear: CONTEXT.md decisions say "Scan CONTEXT.md and SUMMARY.md" only (2 files). SCAN-01 requirement says 4 file types.
   - Recommendation: Follow SCAN-01 requirement -- scan all four types when present. CONTEXT.md decisions are the primary sources but RESEARCH.md and RETROSPECTIVE.md may contain additional insights. The skill should look for all four but most extraction value comes from CONTEXT.md and SUMMARY.md.

2. **Batch file writing vs. incremental**
   - What we know: User accepts/rejects individually per proposal
   - What's unclear: Should files be written as each proposal is accepted, or all at once after the full accept/reject loop?
   - Recommendation: Write all accepted proposals after the full loop completes. This matches the "preview all first, then write" principle from PROP-02 and allows a clean "nothing written yet" state during the review.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | bash (validate-templates.sh) |
| Config file | tools/validate-templates.sh |
| Quick run command | `bash tools/validate-templates.sh .` |
| Full suite command | `bash tools/validate-templates.sh .` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCAN-01 | Scans .planning/ for phase artifacts | manual-only | N/A -- skill is markdown instructions, not runtime code | N/A |
| SCAN-02 | Error when .context/ or .planning/ missing | manual-only | N/A | N/A |
| SCAN-03 | Phase range scoping | manual-only | N/A | N/A |
| CLASS-01 | Identifies domain concepts | manual-only | N/A | N/A |
| CLASS-02 | Identifies ADR-worthy decisions | manual-only | N/A | N/A |
| CLASS-03 | Identifies constraints | manual-only | N/A | N/A |
| PROP-01 | Cross-references MANIFEST.md | manual-only | N/A | N/A |
| PROP-02 | Previews before writing | manual-only | N/A | N/A |
| PROP-03 | Selective accept/reject | manual-only | N/A | N/A |
| PROP-04 | Creates spec-compliant files | manual-only | N/A | N/A |
| PROP-05 | Shows extraction summary | manual-only | N/A | N/A |

**Justification for manual-only:** dc:extract is a markdown skill file -- Claude Code interprets it as instructions. There is no runtime code to unit test. Validation is done by running `/dc:extract` in a project with completed GSD phases and verifying the output. The existing `validate-templates.sh` can verify the skill file exists and has required frontmatter.

### Sampling Rate
- **Per task commit:** `bash tools/validate-templates.sh .`
- **Per wave merge:** Manual run of `/dc:extract` against this project's own .planning/ phases
- **Phase gate:** Skill file passes template validation; manual smoke test confirms end-to-end flow

### Wave 0 Gaps
None -- existing test infrastructure (validate-templates.sh) covers skill file validation. The script may need a minor update to include extract.md in its file list check, but that is a task-level concern, not a gap.

## Sources

### Primary (HIGH confidence)
- `commands/dc/add.md` -- 12-step file creation workflow with template resolution, MANIFEST.md updates, ADR numbering, preview, commit
- `commands/dc/explore.md` -- MANIFEST.md parsing pattern with section headers and entry formats
- `commands/dc/init.md` -- template resolution pattern (local then global)
- `commands/dc/refresh.md` -- entry review flow with AskUserQuestion per entry
- `templates/domain-concept.md`, `templates/decision.md`, `templates/constraint.md` -- target templates
- `.planning/phases/14-gsd-bridge-template/14-01-SUMMARY.md` -- real SUMMARY.md format example
- `.planning/phases/14-gsd-bridge-template/14-CONTEXT.md` -- real CONTEXT.md format example

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` -- SCAN-01 through PROP-05 requirement definitions

### Tertiary (LOW confidence)
None -- all findings verified against project source files.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- project convention is firmly established (all skills are markdown files)
- Architecture: HIGH -- dc:add provides a complete, tested pattern to follow
- Pitfalls: HIGH -- identified from actual project artifacts and existing skill edge cases

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable -- project conventions unlikely to change)
