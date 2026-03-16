---
name: dc:refresh
description: Review stale domain context entries and update them based on current code reality. Identifies entries older than 90 days, assesses accuracy against source code, and proposes updates.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
---

<objective>
Review stale domain context entries and update them based on current code reality. Parse MANIFEST.md entries, identify those with verified dates older than 90 days (or missing verified dates), then for each stale entry: read its content, find relevant source code via targeted Grep searches, assess whether the entry is still accurate or has drifted, and present findings to the user for confirmation. Updates verified dates in both MANIFEST.md and the context file's inline comment.
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

Verified date update (dual location):
1. MANIFEST.md: find `[verified: {old-date}]`, Edit to replace with `[verified: {today}]`
2. Context file: find `<!-- verified: YYYY-MM-DD -->`, Edit to replace with `<!-- verified: {today} -->`
3. If context file lacks the `<!-- verified: -->` comment, add it on line 3 (after H1 title and blank line)

Staleness threshold: 90 days from today's date.

Accuracy assessment criteria:
- "Still accurate" means content describes current behavior correctly -- no factual contradictions with code. Minor wording improvements don't count as drift.
- "Drifted" means content contradicts current code or misses significant changes.
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
   - Extract the verified date from `[verified: YYYY-MM-DD]` if present.
   - Track which section the entry belongs to.
4. Lines like `(none yet)` or `(none ...)` are placeholders for empty sections -- skip them.

## Step 3: Identify Stale Entries

For each parsed entry from Step 2:
1. If the entry has a verified date (`[verified: YYYY-MM-DD]`):
   - Parse the date and compute the number of days between that date and today.
   - If more than 90 days old: mark as stale, record the day count.
2. If the entry has no verified date: mark as stale with note "no verified date".
3. Track the total number of entries checked.

## Step 4: Handle Clean State

If no stale entries were found, display:
"All entries are fresh. {N} entries checked, none older than 90 days."
Then stop.

## Step 5: Process Each Stale Entry

Process stale entries one at a time, in the order they were found. For each stale entry:

### 5a: Verify File Exists

Read the entry's file (resolve path relative to `.context/`). If the file cannot be found, display:
"File not found at {path} -- run /dc:validate to fix broken links first."
Then skip to the next entry.

### 5b: Read Entry Content

Read the full content of the context file. Identify the key claims and structured sections within it.

### 5c: Find Relevant Source Code

Extract search terms from the entry's structured sections:
- For domain concepts: look at Related Concepts, Key Attributes, Business Rules sections for key terms.
- For architecture decisions: look at Affected Modules, Decision sections for key terms.
- For constraints: look at Impact on Code, Requirements sections for key terms.
- For module context files: grep within the module's directory only (the parent directory of the CONTEXT.md file).
- Fallback: use the entry title as a grep term.

Use Grep to search the codebase for 2-3 targeted terms. Exclude `.context/`, `.planning/`, `node_modules/`, `.git/` directories from search results. Show up to 3 most relevant code snippets, each a maximum of 10-15 lines.

### 5d: Assess Accuracy

Compare entry content against found source code. Determine if the entry is:
- **Still accurate** -- content describes current behavior correctly, no factual contradictions.
- **Drifted** -- content contradicts current code or misses significant changes.

Show brief reasoning (e.g., "Entry describes X, code still does X" or "Entry says X but code now does Y").

### 5e: Present to User

Display for each stale entry:
- Entry name, days stale (or "no verified date"), file path.
- Key claims from the entry (2-3 bullet points summarizing what the entry says).
- Relevant code snippets found.
- Accuracy assessment with reasoning.

### 5f: User Decision

Use AskUserQuestion to prompt the user.

If the entry is assessed as **still accurate**, prompt with:
- "Still accurate -- bump date"
- "Edit first"
- "Skip this entry"

If the entry is assessed as **drifted**, first show proposed changes in diff format (section header, old content prefixed with `-`, new content prefixed with `+`), then prompt with:
- "Apply changes"
- "Edit first"
- "Skip this entry"

### 5g: Execute User's Choice

- **"Still accurate -- bump date"** or **"Apply changes"**:
  1. If "Apply changes": write the proposed content updates to the context file using Edit.
  2. Update the verified date in MANIFEST.md: find `[verified: {old-date}]` on the entry's line, Edit to replace with `[verified: {today}]` (today in YYYY-MM-DD format).
  3. Update the verified date in the context file: find `<!-- verified: {old-date} -->`, Edit to replace with `<!-- verified: {today} -->`. If the context file lacks the `<!-- verified: -->` comment, add `<!-- verified: {today} -->` on line 3 (after the H1 title and blank line).

- **"Edit first"**:
  1. Use AskUserQuestion with prompt: "What would you like to change?"
  2. Collect the freeform response and apply the requested edits to the context file.
  3. Then bump the verified date in both MANIFEST.md and the context file (same as above).

- **"Skip this entry"**: Move to the next entry without making any changes.

Track all modified files (context files and MANIFEST.md) for the commit step.

## Step 6: Summary

After all stale entries have been processed, if any changes were made, display:

```
Refresh complete:
  {N} entries reviewed
  {M} dates updated
  {K} entries updated with new content
  {J} entries skipped
```

If all entries were skipped, display:
"No changes made."

## Step 7: Commit Prompt

Only execute this step if changes were made (at least one date bumped or content updated).

Use AskUserQuestion:
- Prompt: "Commit the changes?"
- Options: "Yes (recommended)", "No"

If "Yes": stage all modified files (context files + `.context/MANIFEST.md`) with `git add`, then commit with message `docs: refresh domain context -- {N} entries updated`.

</process>
