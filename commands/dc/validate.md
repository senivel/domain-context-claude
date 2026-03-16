---
name: dc:validate
description: Check structural integrity of domain context. Reports broken links in MANIFEST.md, orphan files not referenced in the manifest, and stale entries.
allowed-tools:
  - Read
  - Glob
---

<objective>
Check the structural integrity of the project's domain context and report issues grouped by check type with severity levels. Detects broken links (MANIFEST.md entries pointing to nonexistent files), orphan files (files in .context/ subdirectories not referenced in MANIFEST.md), and stale entries (verified dates older than 90 days).
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

Important:
- Do NOT check the Access Levels section (metadata, not entries).
- Do NOT offer to fix issues (that is Phase 6 / VALD-05).
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
4. Lines like `(none yet)` or `(none ...)` are placeholders for empty sections -- skip them.

## Step 3: Broken Links Check

For each parsed entry from Step 2:
1. Resolve the file path relative to `.context/` (prepend `.context/` to get the project-root-relative path).
   - For Module Context File entries that use `../`, resolve relative to `.context/` to get the final project-root-relative path.
2. Attempt to read the file at the resolved path.
3. If the file does not exist, record as a broken link with the entry name and path.

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

## Step 6: Format and Display Results

Group results by check type and display in this format:

```
Domain Context Validation:

  {icon} Broken Links ({count})
    - {Entry Name} -> {path}

  {icon} Orphan Files ({count})
    - {file path}

  {icon} Stale Entries ({count})
    - {Entry Name} [verified: {date}, {N} days ago]

  {summary line}
```

Rules:
- Icons: checkmark for pass (0 issues), X for errors (broken links, orphans), warning symbol for warnings (stale entries).
- Show all three groups even when counts are 0 (clean state shows all three with checkmark and (0)).
- For groups with 0 items, show just the header line with (0) and no items beneath.
- Broken links and orphan files are **errors** (structural problems).
- Stale entries are **warnings** (informational, not broken).
- Summary line: If issues found, show "{N} errors, {M} warnings" using severity counts. If clean: "All checks passed. {N} entries validated."

</process>
