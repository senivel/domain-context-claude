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

<objective>
Add a new domain context entry (domain concept, architecture decision, or constraint) from a freeform user description. Extracts structured content into the appropriate template, creates the file, and registers it in MANIFEST.md.
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

Access level behavior:
- Public entries (default): files in `.context/{subdir}/`, registered in `.context/MANIFEST.md`
- Private entries: files in `.context.local/{subdir}/`, registered in `.context.local/MANIFEST.md`
</execution_context>

<process>

## Step 1: Check for .context/ Directory

Check if the `.context/` directory exists in the project root.

If it does not exist, display:
"No .context/ directory found. Run /dc:init to set up domain context first."
Then stop.

## Step 2: Resolve Template Path

1. Check if `.claude/domain-context/templates/` exists in the current project directory.
2. If it exists, set TEMPLATE_DIR to that path.
3. If not, check if `~/.claude/domain-context/templates/` exists.
4. If it exists, set TEMPLATE_DIR to that path.
5. If neither exists, tell the user:
   "Domain Context templates not found. Run the installer first:
   `npx domain-context-cc` (global) or `npx domain-context-cc --local` (local)"
   Then stop.

## Step 3: Determine Entry Type

1. Check if a type was provided as an argument when the skill was invoked.
2. Accept these values (case-insensitive): "concept" or "domain concept", "decision", "constraint".
3. If no argument was provided or the argument is not recognized, use AskUserQuestion:
   - Prompt: "What type of entry would you like to add?"
   - Options: "Domain concept", "Architecture decision", "Constraint"

## Step 4: Collect Freeform Description

Use AskUserQuestion:
- Prompt: "Describe the [type] you want to add. Include as much detail as you'd like -- I'll organize it into the right template sections."
- Options:
  1. (freeform text area -- recommended)

## Step 5: Extract Title and Content

From the user's freeform description:

1. Extract or infer a concise title for the entry.
2. Read the appropriate template file from TEMPLATE_DIR:
   - Domain concept: `domain-concept.md`
   - Decision: `decision.md`
   - Constraint: `constraint.md`
3. Map the user's description to the template sections. For each section:
   - If the user mentioned relevant content, fill that section with the extracted information.
   - If the user did not mention it, fill with "Not yet documented."
4. Replace `{verified_date}` with today's date in YYYY-MM-DD format.
5. Strip HTML comments from the filled content, except for `<!-- verified: ... -->` lines (these are functional metadata, not guidance comments).
6. For decisions: set `{status}` to "accepted".
7. Auto-derive a kebab-case filename from the title:
   - Lowercase the title.
   - Replace spaces with hyphens.
   - Remove special characters except hyphens.
   - Collapse multiple consecutive hyphens into one.
   - Trim leading and trailing hyphens.

## Step 6: ADR Number Auto-Detection (Decisions Only)

Skip this step if the entry type is not a decision.

1. Use Glob to find files matching `.context/decisions/[0-9][0-9][0-9]-*.md`.
2. For each file found, extract the first 3 characters of the filename as a number.
3. Set the next number to: max of all extracted numbers + 1. If no files were found, start at 1.
4. Zero-pad the number to 3 digits (e.g., 1 becomes "001", 12 becomes "012").
5. Prepend the padded number to the kebab-case filename: `{NNN}-{kebab-title}.md`.
6. Replace `{number}` in the template content with the padded number.

## Step 7: Detect Access Level

1. Scan the user's freeform description for keywords (case-insensitive): "confidential", "private", "secret", "internal-only", "restricted".
2. If any keyword is found, use AskUserQuestion:
   - Prompt: "This sounds like it might be confidential. Should this be a private entry in .context.local/?"
   - Options: "Yes, make it private", "No, keep it public"
3. If no keywords are found, default to public.
4. Set the target directory:
   - Public: `.context/{subdir}/` (where subdir is `domain/`, `decisions/`, or `constraints/`)
   - Private: `.context.local/{subdir}/`

## Step 8: Duplicate Detection

1. Construct the full file path: `{target_dir}/{filename}.md` (or `{target_dir}/{NNN}-{filename}.md` for decisions).
2. Attempt to read the file at that path. If it exists, warn the user:
   "A file already exists at {path}. Aborting to avoid overwriting."
   Then stop.
3. Read `.context/MANIFEST.md` (and `.context.local/MANIFEST.md` if the target is private). Parse entries in the target section. Check if any entry name matches the extracted title (case-insensitive comparison).
4. If a match is found, warn the user:
   "An entry named '{name}' already exists in MANIFEST.md. Aborting."
   Then stop.

## Step 9: Preview

1. Show the user the complete file content that will be written.
2. Show the MANIFEST.md entry line that will be added.
3. Show the file path where the file will be created.
4. Use AskUserQuestion:
   - Prompt: "Create this entry?"
   - Options: "Accept (recommended)", "Edit"
5. If "Edit": use AskUserQuestion with prompt "What would you like to change? Describe your corrections." Collect the freeform response, apply the requested changes to the content, then show the updated preview with options "Accept" and "Cancel" only (one round of editing).
6. If "Cancel" at any point: stop without writing any files.

## Step 10: Write File

1. For private entries: run `mkdir -p` on the target directory (e.g., `.context.local/domain/`) to ensure it exists.
2. Write the filled template content to the target file path.

## Step 11: Update MANIFEST.md

1. Determine which MANIFEST.md to update:
   - Public entries: `.context/MANIFEST.md`
   - Private entries: `.context.local/MANIFEST.md`
2. For private entries: if `.context.local/MANIFEST.md` does not exist, create it with the basic section structure (copy from the manifest template in TEMPLATE_DIR, fill the description with "Private domain context entries", strip HTML comments).
3. Read the target MANIFEST.md.
4. Find the correct section header:
   - Domain concepts: `## Domain Concepts`
   - Decisions: `## Architecture Decisions`
   - Constraints: `## Constraints`
5. Construct the entry line using the format matching the entry type:
   - Domain concepts: `- [{Title}]({relative-path}) — {one-line description} [public] [verified: {today}]`
   - Decisions: `- [{NNN}: {Title}]({relative-path}) — {one-line description} [verified: {today}]`
   - Constraints: `- [{Title}]({relative-path}) — {one-line description} [public] [verified: {today}]`
   Note: Use em dash ` — ` (space-emdash-space). Paths are relative to `.context/` (or `.context.local/`).
6. If the section contains `(none yet)` or a `(none` placeholder line, replace that line with the new entry.
7. Otherwise, insert the new entry as the last line before the next `##` header (or at the end of the file if it is the last section).

## Step 12: Summary and Commit Prompt

1. Display a summary:
   ```
   Entry created:
     Type:     {Domain concept|Architecture decision|Constraint}
     File:     {file path}
     Manifest: {MANIFEST.md path} updated
   ```

2. Use AskUserQuestion:
   - Prompt: "Commit the new entry?"
   - Options: "Yes (recommended)", "No"
   - If "Yes": stage the created file and the updated MANIFEST.md with `git add`, then commit with message `docs: add {type} — {title}`.

</process>
