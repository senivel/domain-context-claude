# Phase 10: SessionStart Freshness Hook - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a SessionStart hook that warns users about stale domain context entries (>90 days since verified) at session start, with graceful no-op when no .context/ exists and timeout safety on stdin.

</domain>

<decisions>
## Implementation Decisions

### Warning Presentation
- List each stale entry with its overdue age (e.g., "Integration Model (35 days overdue)")
- Include a suggested action mentioning `/dc:refresh` so users know the remediation command
- Flag entries without a verified date as "never verified" — missing dates are worse than stale dates
- Use "Domain Context: N stale entries" as the warning header for clear, scannable output

### Hook Architecture
- Place hook file at `hooks/dc-freshness-check.js` matching existing `hooks/` directory convention with `dc-` prefix
- Parse verified dates via regex on `[verified: YYYY-MM-DD]` pattern — matches the spec format exactly
- Read stdin JSON with a 3-second timeout then ignore content — satisfies HOOK-07 without hanging
- Display staleness as "days overdue" (days since verified minus 90) for actionable specificity

### Claude's Discretion
- Internal implementation details (buffer handling, error message wording for edge cases)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hooks/` directory exists but is empty — this will be the first project-level hook file
- `.claude/hooks/gsd-check-update.js` — GSD SessionStart hook provides boilerplate pattern (stdin handling, spawn, exit 0)
- `.context/MANIFEST.md` — live example of the manifest format to parse

### Established Patterns
- GSD hooks use Node.js with `require('fs')`, `require('path')`, `require('os')` — no external deps
- Hook output uses `additionalContext` field in JSON stdout to inject warnings into conversation
- Settings.json registers hooks under `hooks.SessionStart[]` with `{ hooks: [{ type: "command", command: "..." }] }`

### Integration Points
- `hooks/dc-freshness-check.js` will need registration in settings.json SessionStart array
- Installer (`bin/install.js`) will need to copy hook and register it — but installer updates are a future milestone
- For now, hook file lives in project `hooks/` directory as a distributable asset

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following the established GSD hook patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
