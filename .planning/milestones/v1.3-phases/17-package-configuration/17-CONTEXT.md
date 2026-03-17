# Phase 17: Package Configuration - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Configure package.json, .npmignore, and bin entry so the npm tarball includes exactly the distributable files (commands/, agents/, hooks/, rules/, templates/, tools/, bin/) and excludes dev artifacts (.planning/, .context/, .claude/).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- bin/install.js — referenced in AGENTS.md but does not exist yet (must be created)
- 6 dc:* skills in commands/dc/
- 2 hooks in hooks/ (dc-context-reminder.js, dc-freshness-check.js)
- 1 agent in agents/ (dc-domain-validator.md)
- 1 rule in rules/ (dc-context-editing.md)
- Templates in templates/ (9 .md files)
- tools/validate-templates.sh

### Established Patterns
- No package.json exists yet — greenfield for npm config
- Project uses Node.js for hooks (CommonJS based on hook files)
- No runtime dependencies per AGENTS.md

### Integration Points
- bin/install.js will be the npx entry point
- package.json bin field maps to bin/install.js

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
