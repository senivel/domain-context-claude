# Phase 11: PostToolUse Reminder Hook - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a PostToolUse hook that reminds users to update CONTEXT.md when they edit files near one, with per-directory debouncing to prevent noise and tool-name scoping to Edit/Write/MultiEdit only.

</domain>

<decisions>
## Implementation Decisions

### Reminder Content & Behavior
- Reminder message: "CONTEXT.md may need updating: {path} — you just edited files in this area" — specific and actionable with the CONTEXT.md path included
- Show relative path to the specific CONTEXT.md file to help when multiple exist in a project
- Search depth: current directory + parent directory only — matches success criteria exactly

### Debounce & Hook Architecture
- Debounce file naming: `/tmp/dc-reminder-{session_id}-{dir_hash}.json` — session-scoped, per-directory, auto-cleans on reboot
- Extract edited file path from `tool_input.file_path` in stdin JSON — PostToolUse provides tool input parameters
- Match tool names via `tool_name` field from stdin JSON against an allowlist of `["Edit", "Write", "MultiEdit"]` — simple string comparison
- Hook file at `hooks/dc-context-reminder.js` — matches `dc-` prefix convention from Phase 10

### Claude's Discretion
- Directory hash algorithm for debounce file naming
- Exact error handling and edge case wording
- Internal buffer/stdin handling details

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hooks/dc-freshness-check.js` — Phase 10 hook provides stdin timeout guard pattern, JSON output format, graceful exit-0 pattern
- `.claude/hooks/gsd-context-monitor.js` — GSD PostToolUse hook demonstrates debounce via tmp file, `additionalContext` injection, session_id extraction, tool_name parsing

### Established Patterns
- Stdin: 3-second timeout guard via `setTimeout(() => process.exit(0), 3000)`
- Output: `{ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: "..." } }`
- Debounce: tmp file with session_id for session-scoped state (see gsd-context-monitor.js lines 85-96)
- Tool detection: `data.tool_name` field from stdin JSON

### Integration Points
- `.claude/settings.json` — append to `hooks.PostToolUse` array alongside existing `gsd-context-monitor.js`
- Hook must check for CONTEXT.md in edited file's directory and parent directory via `fs.existsSync`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following the established hook patterns from Phase 10 and GSD.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
