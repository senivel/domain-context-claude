---
name: dc:init
description: Initialize Domain Context in the current project. Creates .context/ directory with MANIFEST.md, domain/, decisions/, and constraints/ subdirectories. Scaffolds ARCHITECTURE.md, wires AGENTS.md with domain-context snippet, and creates CLAUDE.md with @AGENTS.md pointer. Use when setting up domain context on a new or existing project.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - AskUserQuestion
---

<objective>
Initialize a complete Domain Context setup in the current working directory. Create the .context/ directory structure, fill templates with inferred project metadata, and wire root-level files (ARCHITECTURE.md, AGENTS.md, CLAUDE.md, .gitignore).
</objective>

<execution_context>
Templates are installed at one of two locations:
- Local: `.claude/domain-context/templates/` (in the current project)
- Global: `~/.claude/domain-context/templates/` (user home)

Templates use `{placeholder}` tokens for dynamic content and HTML guidance comments (`<!-- ... -->`) that must be stripped when filling.

Template files used by this skill:
- `manifest.md` — MANIFEST.md with `{one_line_description}`, `{restricted_context_instructions}`
- `architecture.md` — ARCHITECTURE.md with `{system_purpose}`, `{module_rows}`, `{data_flow}`, `{key_boundaries}`, `{technology_decisions}`
- `agents-snippet.md` — Static snippet with `<!-- domain-context:start/end -->` sentinels
- `gsd-agents-snippet.md` — GSD bridge snippet with `<!-- gsd-bridge:start/end -->` sentinels
- `claude.md` — Single line `@AGENTS.md`
</execution_context>

<process>

## Step 1: Resolve Template Path

1. Check if `.claude/domain-context/templates/` exists in the current project directory.
2. If it exists, set TEMPLATE_DIR to that path.
3. If not, check if `~/.claude/domain-context/templates/` exists.
4. If it exists, set TEMPLATE_DIR to that path.
5. If neither exists, tell the user:
   "Domain Context templates not found. Run the installer first:
   `npx domain-context-cc` (global) or `npx domain-context-cc --local` (local)"
   Then stop.

**Status tracking:** Throughout Steps 2-9, maintain a results list tracking each item's path and status (created/skipped/updated). This list is used in Step 10 to produce the summary. The 9 items to track are: `.context/MANIFEST.md`, `.context/domain/`, `.context/decisions/`, `.context/constraints/`, `ARCHITECTURE.md`, `AGENTS.md`, `AGENTS.md (GSD)`, `CLAUDE.md`, `.gitignore`.

## Step 2: Detect Existing Context

Check if the `.context/` directory exists in the project root.

If it exists, display this message (do not ask a question, just inform):
"Existing .context/ detected. Only missing files will be created."

Continue to the next step regardless of whether `.context/` exists or not.

## Step 3: Infer Project Metadata

If both `.context/MANIFEST.md` and `ARCHITECTURE.md` already exist, skip this step entirely (metadata is not needed).

Otherwise, try these sources in order to find the project description (`{one_line_description}`):

1. Read `package.json` -- use the `"description"` field
2. Read `pyproject.toml` -- use `[project].description`
3. Read `Cargo.toml` -- use `[package].description`
4. Read `composer.json` -- use the `"description"` field
5. Read `setup.cfg` -- use `[metadata].description`
6. Read `go.mod` -- derive project name from the module path (last segment, convert to title case)
7. Read `README.md` -- use the first substantive paragraph (skip badges, headings, blank lines)
8. Use the current directory name, converted to title case with hyphens and underscores replaced by spaces

Stop at the first source that produces a non-empty, meaningful description.

If none of these produce a useful description, ask the user using AskUserQuestion:
- Prompt: "I couldn't detect a project description automatically. What does this project do?"
- Options:
  1. "Type a description" (recommended) -- use the user's freeform input
  2. "Other" -- let the user provide alternative input

Set these values for template filling:
- `{one_line_description}`: the inferred or user-provided description
- `{system_purpose}`: expand the same description to 2-4 sentences describing what the system does and its primary value
- `{restricted_context_instructions}`: "Contact the project maintainer for access to restricted context."
- `{module_rows}`, `{data_flow}`, `{key_boundaries}`, `{technology_decisions}`: replace each with a TODO comment, e.g., `<!-- TODO: Document module map -->`

## Step 4: Create .context/ Directory Structure

For each of the three subdirectories (`.context/domain/`, `.context/decisions/`, `.context/constraints/`):

1. Check if the directory already exists.
2. If it exists, Record status `[directory path]: skipped`.
3. If it does not exist, create the directory with `mkdir -p` and create an empty `.gitkeep` file inside it. Record status `[directory path]: created`.

Do not show `.gitkeep` files as separate items in the results list.

## Step 5: Fill and Write MANIFEST.md

1. Check if `.context/MANIFEST.md` already exists. If it does, Record status `.context/MANIFEST.md: skipped` and move to the next step.
2. Read `manifest.md` from TEMPLATE_DIR.
3. Replace `{one_line_description}` with the inferred description.
4. Replace `{restricted_context_instructions}` with "Contact the project maintainer for access to restricted context."
5. Strip all HTML comments (`<!-- ... -->`) from the content.
6. Write the result to `.context/MANIFEST.md`.
7. Record status `.context/MANIFEST.md: created`.

## Step 6: Fill and Write ARCHITECTURE.md

1. Check if `ARCHITECTURE.md` already exists in the project root. If it does, Record status `ARCHITECTURE.md: skipped` and move to the next step.
2. Read `architecture.md` from TEMPLATE_DIR.
3. Replace `{system_purpose}` with the expanded description (2-4 sentences).
4. Replace `{module_rows}` with `<!-- TODO: Document module map -->`.
5. Replace `{data_flow}` with `<!-- TODO: Document data flow -->`.
6. Replace `{key_boundaries}` with `<!-- TODO: Document key boundaries -->`.
7. Replace `{technology_decisions}` with `<!-- TODO: Document technology decisions -->`.
8. Strip all HTML comments (`<!-- ... -->`) from the content.
9. Write the result to `ARCHITECTURE.md`.
10. Record status `ARCHITECTURE.md: created`.

## Step 7: Inject AGENTS.md Snippet

1. Read `agents-snippet.md` from TEMPLATE_DIR.
2. Try to read `AGENTS.md` from the project root.
3. If `AGENTS.md` does not exist:
   - Create `AGENTS.md` with just the snippet content.
   - Record status `AGENTS.md: created`.
4. If `AGENTS.md` exists and contains `<!-- domain-context:start -->`:
   - Record status `AGENTS.md: skipped`.
5. If `AGENTS.md` exists but does not contain `<!-- domain-context:start -->`:
   - Read the existing content.
   - Write the existing content followed by two blank lines and the snippet.
   - Record status `AGENTS.md: updated`.

## Step 7.5: Inject GSD Bridge Snippet

1. Read `gsd-agents-snippet.md` from TEMPLATE_DIR.
2. Check if `.planning/PROJECT.md` exists in the project root.
3. If `.planning/PROJECT.md` does not exist:
   - Ask the user using AskUserQuestion:
     - Prompt: "This project doesn't have GSD set up yet. Add GSD bridge to AGENTS.md anyway?"
     - Options:
       1. "Yes" -- continue to inject GSD bridge
       2. "No" -- Record status `AGENTS.md (GSD): skipped` and move to the next step
4. Read `AGENTS.md` from the project root (it exists -- Step 7 ensured this).
5. If `AGENTS.md` contains `<!-- gsd-bridge:start -->`:
   - Replace everything from `<!-- gsd-bridge:start -->` through `<!-- gsd-bridge:end -->` (inclusive) with the fresh template content.
   - Record status `AGENTS.md (GSD): updated`.
6. If `AGENTS.md` does not contain `<!-- gsd-bridge:start -->`:
   - Read the existing content.
   - Write the existing content followed by two blank lines and the GSD bridge snippet.
   - Record status `AGENTS.md (GSD): created`.

## Step 8: Handle CLAUDE.md

1. Read `claude.md` from TEMPLATE_DIR (contains `@AGENTS.md`).
2. Try to read `CLAUDE.md` from the project root.
3. If `CLAUDE.md` does not exist:
   - Create `CLAUDE.md` with the template content.
   - Record status `CLAUDE.md: created`.
4. If `CLAUDE.md` exists and contains `@AGENTS.md`:
   - Record status `CLAUDE.md: skipped`.
5. If `CLAUDE.md` exists but does not contain `@AGENTS.md`:
   - Read the existing content.
   - Append a blank line followed by `@AGENTS.md` to the existing content.
   - Record status `CLAUDE.md: updated`.

## Step 9: Handle .gitignore

1. Try to read `.gitignore` from the project root.
2. If `.gitignore` does not exist:
   - Create `.gitignore` with `.context.local/` as its content.
   - Record status `.gitignore: created`.
3. If `.gitignore` exists and contains `.context.local/`:
   - Record status `.gitignore: skipped`.
4. If `.gitignore` exists but does not contain `.context.local/`:
   - Read the existing content.
   - Append a blank line followed by `.context.local/` to the existing content.
   - Record status `.gitignore: updated`.

## Step 10: Summary and Commit

**Part A -- Summary:** Display the accumulated results list in this format:

```
Domain Context initialized:

  .context/MANIFEST.md     created
  .context/domain/         created
  .context/decisions/      created
  .context/constraints/    created
  ARCHITECTURE.md          skipped
  AGENTS.md                updated
  AGENTS.md (GSD)          created
  CLAUDE.md                skipped
  .gitignore               updated

  5 created, 2 skipped, 2 updated
```

Items appear in the order listed above (9 items total). File paths left-aligned, statuses right-aligned with consistent spacing. Use plain text statuses (no emoji or checkmarks). The count line shows the totals for each status category.

**Part B -- Commit prompt:** If ALL items are "skipped" (0 created and 0 updated), display: "Everything is already set up. No changes needed." and do NOT show the commit prompt.

Otherwise, ask the user using AskUserQuestion:
- Prompt: "Commit the created files?"
- Options:
  1. "Yes (recommended)" -- stage all created and modified files with `git add`, then commit with message `chore: initialize domain context`
  2. "No" -- skip commit, files remain unstaged

</process>
