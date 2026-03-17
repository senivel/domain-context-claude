---
name: dc:extract
description: Extract domain knowledge from completed GSD phases into .context/ entries. Scans planning artifacts, classifies findings, and lets you selectively create domain concepts, decisions, and constraints.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - AskUserQuestion
---

<objective>
Extract durable domain knowledge from completed GSD phase artifacts (.planning/phases/) into permanent .context/ entries. Scans CONTEXT.md, SUMMARY.md, RESEARCH.md, and RETROSPECTIVE.md from completed phases, classifies findings into domain concepts, decisions, and constraints, previews proposals with source attribution, and creates spec-compliant files for accepted proposals.
</objective>

<execution_context>
Template resolution (same as dc:init Step 1):
- Local: `.claude/domain-context/templates/` (in the current project)
- Global: `~/.claude/domain-context/templates/` (user home)

Template files used:
- `domain-concept.md` -- sections: What This Is, Lifecycle, Key Attributes, Business Rules, Invariants, Related Concepts
- `decision.md` -- sections: Status, Context, Decision, Rationale, Consequences, Affected Modules
- `constraint.md` -- sections: Source, Requirements, Impact on Code, Verification

MANIFEST.md section headers and entry line formats:
- `## Domain Concepts` — `- [{Name}]({path}) — {description} [public] [verified: {YYYY-MM-DD}]`
- `## Architecture Decisions` — `- [{NNN}: {Title}]({path}) — {description} [verified: {YYYY-MM-DD}]`
- `## Constraints` — `- [{Name}]({path}) — {description} [public] [verified: {YYYY-MM-DD}]`

Path-to-section mapping:
| Subdirectory | MANIFEST.md section |
|--------------|---------------------|
| `domain/` | `## Domain Concepts` |
| `decisions/` | `## Architecture Decisions` |
| `constraints/` | `## Constraints` |

Extraction criteria — extract WHY, not WHAT or HOW:
- **Domain concepts:** Business rules, invariants, lifecycle models, domain terminology that define how the business works. NOT code patterns, file structures, or implementation details.
- **Architecture decisions:** Significant tradeoffs where alternatives were considered and the choice has lasting impact on system direction. NOT implementation choices like variable naming, file organization, or library minor version selection.
- **Constraints:** External requirements imposed by regulatory bodies, API limits, security policies, or third-party contracts. NOT internal conventions or team preferences.

Phase artifact locations: `.planning/phases/{N}-{name}/` with file patterns:
- `{N}-CONTEXT.md` — focus on `<decisions>` and `<domain>` blocks
- `{N}-*-SUMMARY.md` — focus on `key-decisions` and `patterns-established` in frontmatter, and `## Decisions Made` section
- `{N}-RESEARCH.md` — focus on architecture patterns and pitfalls
- `{N}-RETROSPECTIVE.md` — focus on lessons learned and patterns
</execution_context>

<process>

## Step 1: Check Prerequisites

1. Check if the `.context/` directory exists in the project root.
   If it does not exist, display:
   "No .context/ directory found. Run /dc:init to set up domain context first."
   Then stop.

2. Check if the `.planning/phases/` directory exists.
   If it does not exist, display:
   "No .planning/phases/ directory found. This skill extracts knowledge from GSD planning artifacts. Set up GSD first."
   Then stop.

## Step 2: Parse Phase Scope

1. Check if a range argument was provided when the skill was invoked (e.g., `/dc:extract 7` or `/dc:extract 7-9`).
2. If no argument was provided, set scope to "all" (scan all completed phases).
3. If a single number was provided (e.g., `7`), set scope to that single phase number.
4. If a range was provided (e.g., `7-9`), parse the start and end numbers and set scope to that inclusive range.
5. Use Glob to find all directories matching `.planning/phases/*/`.
6. For each directory, extract the phase number from the directory name prefix (the digits before the first hyphen, e.g., `14-gsd-bridge-template` -> 14).
7. Filter directories to only those whose phase number falls within the scope.

## Step 3: Identify Completed Phases

1. For each phase directory in scope (from Step 2), use Glob to check for files matching `{N}-*-SUMMARY.md` within that directory.
2. A phase is considered completed only if at least one SUMMARY.md file is found.
3. Collect the list of completed phase directories.
4. If no completed phases are found within the scope, display:
   "No completed phase artifacts found in .planning/"
   Then stop.

## Step 4: Read Phase Artifacts

For each completed phase directory, read the following files if they exist:

1. `{N}-CONTEXT.md` — focus on `<decisions>` and `<domain>` blocks for extractable knowledge.
2. All `{N}-*-SUMMARY.md` files — focus on `key-decisions` and `patterns-established` in YAML frontmatter, and the `## Decisions Made` section in the body.
3. `{N}-RESEARCH.md` — focus on architecture patterns, pitfalls, and recommendations (if present).
4. `{N}-RETROSPECTIVE.md` — focus on lessons learned and established patterns (if present).

Collect all artifact content, noting the source phase number and filename for each piece of content.

## Step 5: Resolve Template Path

1. Check if `.claude/domain-context/templates/` exists in the current project directory.
2. If it exists, set TEMPLATE_DIR to that path.
3. If not, check if `~/.claude/domain-context/templates/` exists.
4. If it exists, set TEMPLATE_DIR to that path.
5. If neither exists, tell the user:
   "Domain Context templates not found. Run the installer first:
   `npx domain-context-cc` (global) or `npx domain-context-cc --local` (local)"
   Then stop.

## Step 6: Classify Extractable Knowledge

Analyze all collected artifact content from Step 4. Identify extractable entries using the criteria defined in the execution_context section.

For each finding, record:
1. **Type:** concept, decision, or constraint.
2. **Proposed title:** A concise, descriptive title.
3. **One-line description:** A single sentence summarizing the entry.
4. **Source:** The phase number and filename where this knowledge was found (e.g., "Phase 14 CONTEXT.md").
5. **Key content points:** The substantive content that will fill the template sections.

Important filtering rules:
- Extract WHY, not WHAT or HOW.
- Filter out implementation details, code patterns, file structures, and task lists.
- Focus on business rules, decision rationale, and external constraints.
- Aim for quality over quantity — typically 3-8 proposals per run.

## Step 7: Cross-Reference MANIFEST.md

1. Read `.context/MANIFEST.md`.
2. Parse entries under each section header: `## Domain Concepts`, `## Architecture Decisions`, `## Constraints`.
3. For each entry line (lines starting with `- [`), extract the entry name (text inside the first `[...]`).
4. Skip `(none yet)` placeholder lines.
5. For each proposal from Step 6, check if any existing entry name matches the proposal title using case-insensitive substring matching.
6. If a match is found, mark the proposal as "skipped" and record the reason (e.g., "already in MANIFEST.md").
7. Remove skipped proposals from the active proposal list but keep them for display in Step 8.

## Step 8: Present Proposal Table

Display all proposals in a summary table:

```
Proposed extractions from phases {range}:

  #  Type        Title                    Source
  1  Decision    {title}                  Phase {N} {file}
  2  Concept     {title}                  Phase {N} {file}
  ...

  {N} proposals ({breakdown by type})
  Skipped: "{title}" (already in MANIFEST.md)
```

Show the count breakdown by type (e.g., "2 concepts, 1 decision, 0 constraints").
Show each skipped proposal with its reason on a separate line.

If no proposals remain after filtering (all were skipped), display:
"No new domain knowledge found to extract from the scanned phases."
Then stop.

## Step 9: Accept/Reject Loop

For each proposal (in table order), show a detailed preview:

1. Display the proposal type, title, and source phase and file.
2. Show a content preview with the key content points that would be filled into the template sections.
3. Use AskUserQuestion with options:
   - "Accept (recommended)"
   - "Reject"
   - "Edit first"
4. If "Accept": mark the proposal as accepted and continue to the next proposal.
5. If "Reject": mark the proposal as rejected and continue to the next proposal.
6. If "Edit first": use AskUserQuestion to collect freeform corrections from the user. Apply the changes to the proposal content. Show the updated preview with options:
   - "Accept"
   - "Cancel"
   If "Cancel": mark as rejected.

After processing all proposals, if no proposals were accepted, display:
"No proposals accepted. Nothing to extract."
Then stop.

## Step 10: Write Accepted Entries

Write all accepted proposals after the full accept/reject loop completes (not incrementally). For each accepted proposal:

1. Read the appropriate template from TEMPLATE_DIR:
   - Domain concept: `domain-concept.md`
   - Decision: `decision.md`
   - Constraint: `constraint.md`
2. Map the proposal's key content points to the template sections. For each section:
   - If relevant content was extracted, fill that section.
   - If not, fill with "Not yet documented."
3. Replace `{verified_date}` with today's date in YYYY-MM-DD format.
4. For decisions: set `{status}` to "accepted".
5. Strip HTML comments from the filled content, except for `<!-- verified: ... -->` lines (these are functional metadata, not guidance comments).
6. Auto-derive a kebab-case filename from the title:
   - Lowercase the title.
   - Replace spaces with hyphens.
   - Remove special characters except hyphens.
   - Collapse multiple consecutive hyphens into one.
   - Trim leading and trailing hyphens.
7. For decisions only — ADR number auto-detection:
   a. Use Glob to find files matching `.context/decisions/[0-9][0-9][0-9]-*.md`.
   b. For each file found, extract the first 3 characters of the filename as a number.
   c. Set the next number to: max of all extracted numbers + 1. If no files were found, start at 1.
   d. Zero-pad the number to 3 digits (e.g., 1 becomes "001", 12 becomes "012").
   e. Prepend the padded number to the kebab-case filename: `{NNN}-{kebab-title}.md`.
   f. Replace `{number}` in the template content with the padded number.
   g. For multiple accepted decisions, increment the number for each subsequent decision.
8. Write the file to `.context/{subdir}/{filename}.md` where subdir is `domain/`, `decisions/`, or `constraints/` based on the entry type.

## Step 11: Update MANIFEST.md

For each written file (from Step 10), update `.context/MANIFEST.md`:

1. Read `.context/MANIFEST.md`.
2. Find the correct section header using the path-to-section mapping from the execution_context.
3. Construct the entry line using the format matching the entry type:
   - Domain concepts: `- [{Title}](domain/{filename}.md) — {one-line description} [public] [verified: {today}]`
   - Decisions: `- [{NNN}: {Title}](decisions/{NNN}-{filename}.md) — {one-line description} [verified: {today}]`
   - Constraints: `- [{Title}](constraints/{filename}.md) — {one-line description} [public] [verified: {today}]`
   Note: Use em dash ` — ` (space-emdash-space). Paths are relative to `.context/`.
4. If the section contains `(none yet)` or a `(none` placeholder line, replace that line with the new entry.
5. Otherwise, insert the new entry as the last line before the next `##` header (or at the end of the file if it is the last section).

## Step 12: Post-Extraction Summary

Display a summary of what was extracted:

```
Extraction complete:
  {N} domain concept(s) created
  {M} architecture decision(s) created (ADR-{numbers})
  {K} constraint(s) created

  Files:
    {list of created file paths}

  MANIFEST.md updated with {total} new entries
```

## Step 13: Commit Prompt

1. Use AskUserQuestion:
   - Prompt: "Commit extracted entries?"
   - Options: "Yes (recommended)", "No"
2. If "Yes": stage all created files and `.context/MANIFEST.md` with `git add`, then commit with message `docs: extract {N} domain context entries from phases {range}`.

</process>
