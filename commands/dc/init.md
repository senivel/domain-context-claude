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

## Step 2: Basic Safety Check

Check if `.context/MANIFEST.md` already exists in the project root.

If it exists, ask the user using AskUserQuestion:
- Prompt: "This project already has a .context/ directory. Proceed anyway? (Recommended: No -- use /dc:explore to review existing context)"
- Options:
  1. "Yes -- proceed with initialization"
  2. "No -- stop (recommended)"
- If the user selects "No", stop execution.

## Step 3: Infer Project Metadata

Try these sources in order to find the project description (`{one_line_description}`):

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

Run:
```bash
mkdir -p .context/domain .context/decisions .context/constraints
```

Create empty .gitkeep files:
- `.context/domain/.gitkeep`
- `.context/decisions/.gitkeep`
- `.context/constraints/.gitkeep`

Narrate: "Created .context/ directory with domain/, decisions/, constraints/ subdirectories"

## Step 5: Fill and Write MANIFEST.md

1. Read `manifest.md` from TEMPLATE_DIR.
2. Replace `{one_line_description}` with the inferred description.
3. Replace `{restricted_context_instructions}` with "Contact the project maintainer for access to restricted context."
4. Strip all HTML comments (`<!-- ... -->`) from the content.
5. Write the result to `.context/MANIFEST.md`.
6. Narrate: "Created .context/MANIFEST.md"

## Step 6: Fill and Write ARCHITECTURE.md

1. Check if `ARCHITECTURE.md` already exists in the project root. If it does, narrate "ARCHITECTURE.md already exists -- skipped" and move to the next step.
2. Read `architecture.md` from TEMPLATE_DIR.
3. Replace `{system_purpose}` with the expanded description (2-4 sentences).
4. Replace `{module_rows}` with `<!-- TODO: Document module map -->`.
5. Replace `{data_flow}` with `<!-- TODO: Document data flow -->`.
6. Replace `{key_boundaries}` with `<!-- TODO: Document key boundaries -->`.
7. Replace `{technology_decisions}` with `<!-- TODO: Document technology decisions -->`.
8. Strip all HTML comments (`<!-- ... -->`) from the content.
9. Write the result to `ARCHITECTURE.md`.
10. Narrate: "Created ARCHITECTURE.md"

## Step 7: Inject AGENTS.md Snippet

1. Read `agents-snippet.md` from TEMPLATE_DIR.
2. Try to read `AGENTS.md` from the project root.
3. If `AGENTS.md` does not exist:
   - Create `AGENTS.md` with just the snippet content.
   - Narrate: "Created AGENTS.md with domain-context snippet"
4. If `AGENTS.md` exists and contains `<!-- domain-context:start -->`:
   - Narrate: "AGENTS.md already has domain-context snippet -- skipped"
5. If `AGENTS.md` exists but does not contain `<!-- domain-context:start -->`:
   - Read the existing content.
   - Write the existing content followed by two blank lines and the snippet.
   - Narrate: "Appended domain-context snippet to AGENTS.md"

## Step 8: Handle CLAUDE.md

1. Read `claude.md` from TEMPLATE_DIR (contains `@AGENTS.md`).
2. Try to read `CLAUDE.md` from the project root.
3. If `CLAUDE.md` does not exist:
   - Create `CLAUDE.md` with the template content.
   - Narrate: "Created CLAUDE.md"
4. If `CLAUDE.md` exists and contains `@AGENTS.md`:
   - Narrate: "CLAUDE.md already references @AGENTS.md -- skipped"
5. If `CLAUDE.md` exists but does not contain `@AGENTS.md`:
   - Read the existing content.
   - Append a blank line followed by `@AGENTS.md` to the existing content.
   - Narrate: "Added @AGENTS.md reference to CLAUDE.md"

## Step 9: Handle .gitignore

1. Try to read `.gitignore` from the project root.
2. If `.gitignore` does not exist:
   - Create `.gitignore` with `.context.local/` as its content.
   - Narrate: "Created .gitignore with .context.local/ entry"
3. If `.gitignore` exists and contains `.context.local/`:
   - Narrate: ".gitignore already has .context.local/ -- skipped"
4. If `.gitignore` exists but does not contain `.context.local/`:
   - Read the existing content.
   - Append a blank line followed by `.context.local/` to the existing content.
   - Narrate: "Added .context.local/ to .gitignore"

## Step 10: Offer to Commit

Ask the user using AskUserQuestion:
- Prompt: "Domain Context initialized successfully. Commit the created files?"
- Options:
  1. "Yes (recommended)" -- stage all created and modified files with `git add`, then commit with message `chore: initialize domain context`
  2. "No" -- skip commit, files remain unstaged

</process>
