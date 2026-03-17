# Phase 18: Installer Logic - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the full bin/install.js installer so users can install, reinstall, and uninstall domain-context-cc with a single command. Covers file copying, settings.json hook merging, idempotency, and uninstall cleanup.

</domain>

<decisions>
## Implementation Decisions

### File Copy Strategy
- Overwrite existing files silently — installer files are canonical; user customizations belong in separate files
- Copy templates/ to the install target (not read from npm cache) — skills reference install-location templates
- Mirror source layout under target `.claude/` — `commands/dc/`, `hooks/`, `agents/`, `rules/`, `templates/`
- Include tools/validate-templates.sh in the install — useful for users validating their own context

### settings.json Hook Merging
- Identify dc hooks by matching command path containing `dc-` — consistent with `dc:` prefix convention
- Global installs use absolute paths — `node ~/.claude/hooks/dc-freshness-check.js`
- Local installs use relative paths — `node .claude/hooks/dc-freshness-check.js` — portable across machines
- Create settings.json if it doesn't exist — minimal valid file with just dc hook entries

### Uninstall Behavior
- Remove dc-prefixed files only — leave directories intact so other plugins aren't affected
- Respect `--local` scope — `--uninstall` alone cleans global, `--uninstall --local` cleans local `.claude/`
- Leave empty hooks object after removing dc hooks — don't delete settings.json
- Print each removed file/hook entry to confirm what was cleaned up

### Claude's Discretion
- Internal code structure (helper functions, error handling patterns)
- Console output formatting and colors
- File copy order and parallelism

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- bin/install.js — stub with shebang, ready to replace
- 6 dc:* skills in commands/dc/ (add, explore, extract, init, refresh, validate)
- 2 hooks: dc-freshness-check.js (SessionStart), dc-context-reminder.js (PostToolUse)
- 1 agent: dc-domain-validator.md
- 1 rule: dc-context-editing.md
- 9 templates in templates/
- tools/validate-templates.sh

### Established Patterns
- CommonJS (`require`/`module.exports`) — hooks use this
- No runtime dependencies — Node.js built-ins only (fs, path)
- Graceful degradation — hooks exit 0 on any error
- 3-second stdin timeout pattern in hooks

### Integration Points
- package.json bin entry maps `domain-context-cc` to `./bin/install.js`
- `__dirname` used to locate bundled files relative to install.js
- settings.json hooks array structure: `{ hooks: { SessionStart: [...], PostToolUse: [...] } }`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
