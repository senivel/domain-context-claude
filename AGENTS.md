# Domain Context for Claude Code

## Build & Run

- No build step — this project is markdown skills, Node.js hooks, and an install script
- Install locally: `node bin/install.js --local`
- Install globally: `node bin/install.js --global`
- Validate context: `bash tools/validate-context.sh .`
- Test install: `npm pack && npx ./domain-context-cc-*.tgz`

## Code Conventions

- Skills: markdown files in `commands/dc/` following Claude Code skill format (YAML frontmatter + `<objective>`, `<execution_context>`, `<process>` sections)
- Hooks: Node.js scripts reading JSON from stdin, writing JSON to stdout. Timeout-safe, graceful degradation (exit 0 on error)
- Templates: plain markdown with `{placeholder}` tokens
- Naming: kebab-case for all files, `dc:` prefix for all skill names
- No runtime dependencies — Node.js built-ins only
- When creating dc:* skills, use the /skill-creator skill

## Workflow

- Main branch: `main`
- Commit messages: imperative mood, concise
- All context changes go through the same review process as code

## Project Context

This project uses [Domain Context](https://github.com/senivel/domain-context) for domain knowledge documentation.

- Architecture overview: @ARCHITECTURE.md
- Domain & business context: @.context/MANIFEST.md
- Authoritative spec: ~/code/domain-context/SPEC.md

When working on skills or hooks, consult the spec for file format requirements.
When modifying templates, ensure they match the spec's required sections exactly.

## Confidential Context

If `.context.local/` exists, read its contents alongside `.context/`.
If unavailable, do not infer business rules from code. Ask the developer.
