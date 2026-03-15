---
name: dc:explore
description: Browse and search domain context in the current project. Shows summary of all entries with freshness status, supports keyword search, and lets you drill into specific entries. Use when you want to understand what domain knowledge exists.
allowed-tools:
  - Read
  - Glob
  - Bash
  - AskUserQuestion
---

<objective>
Browse and search the project's domain context. Display a summary of all entries grouped by section with freshness status, support keyword search to find specific entries, and provide progressive disclosure for drilling into full entry content.
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

All paths in MANIFEST.md are relative to the `.context/` directory.
</execution_context>

<process>

## Step 1: Check for .context/ Directory

Check if the `.context/` directory exists in the project root.

If it does not exist, display:
"No .context/ directory found. Run /dc:init to set up domain context."
Then stop.

## Step 2: Check for Keyword Argument

If the user provided a keyword argument (e.g., `/dc:explore integration`), go to Step 6.

If no keyword was provided, continue to Step 3.

## Step 3: Read and Parse MANIFEST.md

1. Read `.context/MANIFEST.md`.
2. Parse entries under each of the four section headers: Domain Concepts, Architecture Decisions, Constraints, Module Context Files.
3. For each entry line (lines starting with `- [` for linked entries, or `- ` followed by a file path for module context):
   - Extract the entry name (text inside `[...]` before `](`).
   - Extract the file path (text inside `(...)` after the name, or the path text for module context entries).
   - Extract the verified date from `[verified: YYYY-MM-DD]`.
4. Lines like `(none yet)` or `(none ...)` are placeholders for empty sections -- skip them.
5. For each entry, compute freshness:
   - Parse the `[verified: YYYY-MM-DD]` date.
   - Calculate the number of days between that date and today.
   - If more than 90 days old: mark as stale with the day count.
   - If no verified date is found on the entry line: mark as `[no date]`.

## Step 4: Display Summary

Format the output exactly as follows:

```
Domain Context:

  Domain Concepts (N)
    - Entry Name                    [verified: YYYY-MM-DD]
    - Another Entry                 [STALE - 94 days]

  Architecture Decisions (N)
    - 001: Title                    [verified: YYYY-MM-DD]

  Constraints (N)

  Module Context Files (N)
    - path/to/CONTEXT.md            [verified: YYYY-MM-DD]
```

Rules:
- Each section shows its entry count in parentheses.
- Empty sections show count (0) with no entries listed beneath them.
- Entry names are left-aligned, freshness tags are right-aligned with consistent spacing.
- Show names and freshness only -- no descriptions in the summary.
- Stale entries (>90 days) display `[STALE - N days]` instead of the verified date.

## Step 5: Progressive Disclosure

After showing the summary, use AskUserQuestion to offer drill-in navigation.

**Section selection (first level):**
- Prompt: "Explore an entry?"
- Show only sections that have entries (count > 0), plus "Done".
- If there are 4 or more non-empty sections, group the last section with "Done" or use pagination to stay within the 4-option limit.
- Set the recommended option to the first non-empty section.
- If the user picks "Done", stop.

**Entry selection (second level):**
- Show entries from the chosen section, respecting the 4-option limit:
  - 1-2 entries: list entries + "Back" + "Done" (up to 4 options).
  - 3 entries: list entries + "Back" (4 options; Back returns to section level).
  - 4+ entries: show first 2 entries + "More" + "Back". "More" shows the next batch.
- Set the recommended option to the first entry.

**Viewing an entry:**
- Resolve the entry's path relative to the `.context/` directory.
- Read the full file content.
- Display the content with the file path as a header.
- After displaying, loop back: prompt "Explore another entry?" and return to section selection.

## Step 6: Keyword Search

1. Read `.context/MANIFEST.md` and parse all entries (same as Step 3).
2. For each entry, check if the keyword matches as a case-insensitive substring in:
   - The entry name
   - The entry description (text after the em dash in the MANIFEST.md line)
   - The file content (read each entry's file and search within it)
3. Collect all matches, noting where the match was found (name, description, or content).
4. If no matches: display "No entries matching '[keyword]' found. Run /dc:explore to see all entries." and stop.
5. If exactly one match: read and display the full file content immediately.
6. If multiple matches: list matching entries with their match location, then use AskUserQuestion to let the user pick which entry to view. After viewing, offer to view another match or stop.

</process>
