---
name: dc:validate
description: Check structural integrity of domain context and fix issues found.
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
---

<objective>
Check the structural integrity of the project's domain context, report issues grouped by check type with severity levels, and offer to fix any issues found. Detects broken links (MANIFEST.md entries pointing to nonexistent files), orphan files (files in .context/ subdirectories not referenced in MANIFEST.md), stale entries (verified dates older than 90 days), and missing AGENTS.md imports. When issues are found, offers per-group fixes via interactive prompts.
</objective>

<execution_context>
The primary data source is `.context/MANIFEST.md` in the project root.

MANIFEST.md organizes entries under four section headers:
- `## Domain Concepts`
- `## Architecture Decisions`
- `## Constraints`
- `## Module Context Files`

Entry line formats:
- Linked entries: `- [{Name}]({path}) — {description} [{access}] [verified: {YYYY-MM-DD}]`
- Architecture decisions: `- [{NNN}: {Title}]({path}) — {description} [verified: {YYYY-MM-DD}]`
- Module context entries: `- {path} [verified: {YYYY-MM-DD}]`
- Empty sections contain parenthetical text like `(none yet)` -- these are NOT entries.

Path resolution:
- MANIFEST.md paths are relative to the `.context/` directory. Prepend `.context/` when checking file existence.
- Module Context File paths may use `../` to reference files outside `.context/`. Resolve relative to the `.context/` directory to get project-root-relative paths.
- Glob results are project-root-relative.

AGENTS.md import check:
- AGENTS.md should contain `@.context/MANIFEST.md` and `@ARCHITECTURE.md` as substrings.
- Missing imports are warnings, not errors. AGENTS.md may intentionally use a different structure.
- If AGENTS.md does not exist, record a note (not an error).

Fix flow documentation:
- After displaying results, offer per-group fixes via AskUserQuestion for each group with issues.
- Groups with 0 issues are not offered for fixing.
- Clean state (all groups with 0 issues) skips the fix flow entirely.

Path-to-section mapping for orphan registration:
| Path prefix | MANIFEST.md section |
|-------------|---------------------|
| `.context/domain/` | `## Domain Concepts` |
| `.context/decisions/` | `## Architecture Decisions` |
| `.context/constraints/` | `## Constraints` |
| `**/CONTEXT.md` (outside .context/) | `## Module Context Files` |

Path-to-template mapping for broken link file creation:
| MANIFEST.md section | Template file |
|---------------------|---------------|
| Domain Concepts | `templates/domain-concept.md` |
| Architecture Decisions | `templates/decision.md` |
| Constraints | `templates/constraint.md` |

Entry formats for orphan registration:
- Domain concepts: `- [{Name}]({relative-path}) — {placeholder description} [public] [verified: {today}]`
- Decisions: `- [{NNN}: {Title}]({relative-path}) — {placeholder description} [verified: {today}]`
- Constraints: `- [{Name}]({relative-path}) — {placeholder description} [public] [verified: {today}]`
- Module context: `- {project-root-relative-path} [verified: {today}]`

Name derivation for orphan registration:
- Convert filename to title case (e.g., `integration-model.md` -> `Integration Model`).
- For decisions, extract ADR number from filename (e.g., `004-foo.md` -> `004: Foo`).

Template resolution (same as dc:init Step 1):
- Check `.claude/domain-context/templates/` (local install) first.
- Then check `~/.claude/domain-context/templates/` (global install).

Important:
- Do NOT check the Access Levels section (metadata, not entries).
- Do NOT flag .gitkeep files as orphans.
- Do NOT flag files in .context/ root (like MANIFEST.md itself) as orphans -- only scan subdirectories.
</execution_context>

<process>

## Step 1: Check for .context/ Directory

Check if the `.context/` directory exists in the project root.

If it does not exist, display:
"No .context/ directory found. Run /dc:init to set up domain context."
Then stop.

## Step 2: Read and Parse MANIFEST.md

1. Read `.context/MANIFEST.md`.
2. Parse entries under each of the four section headers: Domain Concepts, Architecture Decisions, Constraints, Module Context Files.
3. For each entry line (lines starting with `- [` for linked entries, or `- ` followed by a file path for module context):
   - Extract the entry name (text inside `[...]` before `](`).
   - Extract the file path (text inside `(...)` after the name, or the path text for module context entries).
   - Extract the verified date from `[verified: YYYY-MM-DD]`.
   - Track which section the entry belongs to.
4. Lines like `(none yet)` or `(none ...)` are placeholders for empty sections -- skip them.

## Step 3: Broken Links Check

For each parsed entry from Step 2:
1. Resolve the file path relative to `.context/` (prepend `.context/` to get the project-root-relative path).
   - For Module Context File entries that use `../`, resolve relative to `.context/` to get the final project-root-relative path.
2. Attempt to read the file at the resolved path.
3. If the file does not exist, record as a broken link with the entry name, path, and which MANIFEST.md section it belongs to.

## Step 4: Orphan Files Check

**Part A -- .context/ subdirectory files:**
1. Use Glob to find files matching these patterns:
   - `.context/domain/*.md`
   - `.context/decisions/*.md`
   - `.context/constraints/*.md`
2. Remove any `.gitkeep` files from the results.
3. For each file found, convert to a path relative to `.context/` (e.g., `domain/integration-model.md`).
4. Check if any MANIFEST.md entry references this relative path. If no entry references it: record as orphan.

**Part B -- CONTEXT.md files in codebase:**
1. Use Glob to find all `**/CONTEXT.md` files in the project.
2. Exclude results inside `.context/`, `node_modules/`, `.git/`, and `.planning/` directories.
3. For each discovered CONTEXT.md file, check if any Module Context Files entry in MANIFEST.md resolves to this path.
4. If not referenced in MANIFEST.md: record as orphan. Show these as project-root-relative paths (e.g., `src/auth/CONTEXT.md`).

## Step 5: Stale Entries Check

For each parsed entry from Step 2:
1. If the entry has a verified date (`[verified: YYYY-MM-DD]`):
   - Parse the date and compute the number of days between that date and today.
   - If more than 90 days old: record as stale with the entry name, verified date, and day count.
2. If the entry has no verified date: record as a warning ("no verified date").

Track the total count of validated entries (entries that have a parseable verified date or path, excluding empty-section placeholders).

## Step 6: AGENTS.md Import Check

1. Try to read `AGENTS.md` from the project root.
2. If the file does not exist:
   - Record a note: "No AGENTS.md found. Run /dc:init to set up project structure."
   - This is not an error, just an informational note.
3. If `AGENTS.md` exists:
   - Check if the file content contains the substring `@.context/MANIFEST.md`.
   - Check if the file content contains the substring `@ARCHITECTURE.md`.
   - For each missing import, record as a **warning** (not an error).
4. Track whether AGENTS.md exists (needed for fix flow -- only offer fix if the file exists).

## Step 7: Format and Display Results

Group results by check type and display in this format:

```
Domain Context Validation:

  {icon} Broken Links ({count})
    {explanation line, if count > 0}
    - {Entry Name} -> {path}

  {icon} Orphan Files ({count})
    {explanation line, if count > 0}
    - {file path}

  {icon} Stale Entries ({count})
    {explanation line, if count > 0}
    - {Entry Name} [verified: {date}, {N} days ago]

  {icon} AGENTS.md Imports ({count})
    {explanation line, if count > 0}
    - Missing: @.context/MANIFEST.md
    - Missing: @ARCHITECTURE.md

  {summary line}
```

Explanation lines (only shown when count > 0):
- Broken Links: "{N} entries in MANIFEST.md point to files that don't exist."
- Orphan Files: "{N} file(s) in .context/ {is/are} not referenced in MANIFEST.md." (use "is" for 1, "are" for 2+; "file" for 1, "files" for 2+)
- Stale Entries: "{N} {entry/entries} {has/have} not been verified in over 90 days." (use "entry has" for 1, "entries have" for 2+)
- AGENTS.md Imports: "AGENTS.md is missing {N} recommended {import/imports}." (use "import" for 1, "imports" for 2+)
- If AGENTS.md not found: show the note as a single item under the group instead of an explanation line.

Rules:
- Icons: checkmark for pass (0 issues), X for errors (broken links, orphans), warning symbol for warnings (stale entries, AGENTS.md imports).
- Show all four groups even when counts are 0 (clean state shows all four with checkmark and (0)).
- For groups with 0 items, show just the header line with (0) and no items beneath. No explanation line for clean groups.
- Broken links and orphan files are **errors** (structural problems).
- Stale entries and AGENTS.md imports are **warnings** (informational, not broken).
- Summary line: If issues found, show "{N} errors, {M} warnings" using severity counts. If clean: "All checks passed. {N} entries validated."

## Step 8: Fix Flow

Only execute this step if any group has count > 0. If all groups are clean (0 issues), skip this step and Step 9 entirely.

Track whether any fixes were applied across all groups.

For each group with issues, in order (Broken Links, Orphan Files, Stale Entries, AGENTS.md Imports):

**Broken Links fix:**
- Use AskUserQuestion with prompt: "Broken Links: {N} entries point to files that don't exist."
- Options:
  1. "Remove entries from MANIFEST.md"
  2. "Create missing files from template (recommended)"
  3. "Skip"
- If "Remove": Use Edit to remove each broken link's entry line from `.context/MANIFEST.md`. Record count of removals.
- If "Create": For each broken link:
  1. Determine which MANIFEST.md section the entry is in.
  2. Select the matching template (domain-concept.md, decision.md, or constraint.md) per the path-to-template mapping.
  3. Resolve the template path: check `.claude/domain-context/templates/` (local) first, then `~/.claude/domain-context/templates/` (global).
  4. Read the template file.
  5. Replace `{placeholder}` tokens with reasonable defaults: use the entry name for `{concept_name}`, `{decision_title}`, or `{constraint_area}`; use today's date for `{verified_date}`. Replace remaining `{placeholder}` tokens with `TODO: Add content`.
  6. Strip HTML comments (`<!-- ... -->`) from the template content.
  7. Ensure the target directory exists by running `mkdir -p` on the parent directory of the file path.
  8. Write the file to the expected path (`.context/` + the entry's relative path).
  9. Record count of files created.

**Orphan Files fix:**
- Use AskUserQuestion with prompt: "Orphan Files: {N} file(s) not referenced in MANIFEST.md."
- Options:
  1. "Register in MANIFEST.md (recommended)"
  2. "Skip"
- If "Register": For each orphan file:
  1. Determine the appropriate MANIFEST.md section based on its path (see path-to-section mapping).
  2. Derive the entry name from the filename (kebab-case to Title Case; for decisions, extract ADR number from `NNN-title.md` pattern).
  3. Read `.context/MANIFEST.md` to find the target section.
  4. If the section contains `(none yet)`, use Edit to replace that line with the new entry.
  5. Otherwise, use Edit to insert the entry line before the next `##` header (or at end of file if last section).
  6. Use the entry format matching the section type (see entry formats in execution_context).
  7. Record count of registrations.

**Stale Entries fix:**
- Use AskUserQuestion with prompt: "Stale Entries: {N} entries are overdue for review."
- Options:
  1. "Update verified dates to today (recommended)"
  2. "Skip"
- If "Update": For each stale entry:
  1. Use Edit to find and replace the `[verified: {old-date}]` pattern with `[verified: {today}]` in `.context/MANIFEST.md`.
  2. Read the corresponding context file and look for `[verified: YYYY-MM-DD]` or `<!-- verified: YYYY-MM-DD -->` patterns. If found, use Edit to replace with today's date.
  3. Record count of date updates.

**AGENTS.md Imports fix:**
- Only offer if AGENTS.md exists and has missing imports (not if AGENTS.md is absent).
- Use AskUserQuestion with prompt: "AGENTS.md Imports: {N} recommended import(s) missing."
- Options:
  1. "Add missing imports to AGENTS.md (recommended)"
  2. "Skip"
- If "Add":
  1. Read `AGENTS.md`.
  2. If `<!-- domain-context:start -->` sentinel exists, insert missing lines inside that block (after the `## Project Context` line, or at end of block before `<!-- domain-context:end -->`).
  3. If no sentinel exists, append missing lines at end of file.
  4. Import line formats: `- Architecture overview: @ARCHITECTURE.md` and/or `- Domain & business context: @.context/MANIFEST.md`
  5. Record count of imports added.

## Step 9: Post-Fix Summary

Only execute this step if any fixes were applied in Step 8. If the user skipped all groups, do not show any summary.

Display a summary of changes applied:

```
Fixes applied:

  {action summary lines}

Run /dc:validate again to confirm.
```

Action summary lines (only include lines for actions that were taken):
- "Removed {N} entries from MANIFEST.md."
- "Created {N} files from templates."
- "Registered {N} orphan(s) in MANIFEST.md."
- "Updated {N} verified dates."
- "Added {N} import(s) to AGENTS.md."

Do NOT automatically re-run validation after fixes.

</process>
