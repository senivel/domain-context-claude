@AGENTS.md

## GSD Overrides

- Do NOT create git tags when completing milestones. release-please handles versioning and tagging via GitHub Actions.

## Claude Code Specifics

- Skills use Claude Code format: YAML frontmatter (`name`, `description`, `allowed-tools`) + `<objective>`, `<execution_context>`, `<process>` sections
- Hooks are registered in `.claude/settings.json` under `hooks.SessionStart` and `hooks.PostToolUse`
- Rules use `.claude/rules/` with `globs` frontmatter for path matching
- Agents use `.claude/agents/` with `allowed-tools` frontmatter
