# Phase 11: PostToolUse Reminder Hook - Research

**Researched:** 2026-03-16
**Domain:** Claude Code PostToolUse hooks, file-proximity detection, session-scoped debouncing
**Confidence:** HIGH

## Summary

This phase creates a PostToolUse hook (`hooks/dc-context-reminder.js`) that reminds Claude to update CONTEXT.md when files are edited near one. The implementation follows established patterns from Phase 10 (freshness hook) and the existing GSD context monitor hook, both of which are already working in this project.

The Claude Code PostToolUse hook contract is well-documented and stable. The hook receives JSON on stdin with `tool_name`, `tool_input` (including `file_path`), `session_id`, and `cwd`. It outputs JSON with `hookSpecificOutput.additionalContext` to inject reminders into Claude's conversation. The `matcher` field in settings.json can scope the hook to `Edit|Write|MultiEdit` at the registration level, which is cleaner than checking tool_name inside the hook -- but the user decided to use an internal allowlist check, so both layers should be implemented (belt and suspenders).

**Primary recommendation:** Reuse the exact stdin/output/timeout patterns from `dc-freshness-check.js`, add CONTEXT.md proximity detection via `fs.existsSync` on current + parent directory, and debounce via `/tmp/dc-reminder-{session_id}-{dir_hash}.json` files.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Reminder message: "CONTEXT.md may need updating: {path} -- you just edited files in this area" -- specific and actionable with the CONTEXT.md path included
- Show relative path to the specific CONTEXT.md file to help when multiple exist in a project
- Search depth: current directory + parent directory only -- matches success criteria exactly
- Debounce file naming: `/tmp/dc-reminder-{session_id}-{dir_hash}.json` -- session-scoped, per-directory, auto-cleans on reboot
- Extract edited file path from `tool_input.file_path` in stdin JSON -- PostToolUse provides tool input parameters
- Match tool names via `tool_name` field from stdin JSON against an allowlist of `["Edit", "Write", "MultiEdit"]` -- simple string comparison
- Hook file at `hooks/dc-context-reminder.js` -- matches `dc-` prefix convention from Phase 10

### Claude's Discretion
- Directory hash algorithm for debounce file naming
- Exact error handling and edge case wording
- Internal buffer/stdin handling details

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HOOK-03 | PostToolUse hook detects when edited file has a CONTEXT.md in its directory or parent | `fs.existsSync` on `path.join(dir, 'CONTEXT.md')` and `path.join(path.dirname(dir), 'CONTEXT.md')` -- standard Node.js pattern |
| HOOK-04 | PostToolUse hook emits advisory reminder to update CONTEXT.md when nearby one exists | `hookSpecificOutput.additionalContext` output format, verified against official docs |
| HOOK-05 | PostToolUse hook debounces reminders to once per directory per session via tmp file | `/tmp/dc-reminder-{session_id}-{dir_hash}.json` pattern, reuses GSD context monitor debounce approach |
| HOOK-06 | PostToolUse hook scopes to Edit/Write/MultiEdit tools only via matcher | `matcher: "Edit\|Write\|MultiEdit"` in settings.json + internal allowlist check |
| HOOK-08 | Hook registration merges into existing settings.json arrays without clobbering GSD hooks | Append new entry to `hooks.PostToolUse` array alongside existing `gsd-context-monitor.js` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `fs` | n/a | File existence checks, tmp file read/write | Project constraint: no external dependencies |
| Node.js built-in `path` | n/a | Path manipulation, dirname, join | Project constraint: no external dependencies |
| Node.js built-in `crypto` | n/a | Directory path hashing for debounce file names | Built-in, no deps needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `crypto.createHash` for dir hash | Simple string replace (slashes to dashes) | Crypto is cleaner for arbitrary paths, avoids filename collisions |
| `matcher` in settings.json | Internal tool_name check only | Matcher prevents hook from even running; internal check is defense-in-depth |

**Installation:** None -- all Node.js built-ins.

## Architecture Patterns

### Recommended Project Structure
```
hooks/
  dc-freshness-check.js    # Phase 10 - SessionStart
  dc-context-reminder.js   # Phase 11 - PostToolUse (NEW)
.claude/
  settings.json             # Hook registrations (MODIFIED)
```

### Pattern 1: PostToolUse Hook Stdin Contract
**What:** Claude Code passes JSON on stdin with tool execution details
**When to use:** All PostToolUse hooks
**Example:**
```javascript
// Source: https://code.claude.com/docs/en/hooks
// Input received on stdin:
{
  "session_id": "abc123",
  "cwd": "/Users/.../project",
  "hook_event_name": "PostToolUse",
  "tool_name": "Edit",          // or "Write", "MultiEdit"
  "tool_input": {
    "file_path": "/path/to/edited/file.ts",  // CRITICAL: this is the file path
    // ... other tool-specific fields
  },
  "tool_response": { ... }
}
```

### Pattern 2: Matcher-Based Tool Scoping (settings.json)
**What:** The `matcher` field in hook registration filters which tools trigger the hook
**When to use:** When hook should only fire for specific tools
**Example:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node hooks/dc-context-reminder.js"
          }
        ]
      }
    ]
  }
}
```
This prevents the hook process from even spawning for non-matching tools (Read, Grep, Bash, etc.), which is more efficient than checking tool_name inside the hook. Use BOTH matcher AND internal check for defense-in-depth per user decision.

### Pattern 3: Session-Scoped Debounce via Tmp Files
**What:** Use `/tmp/` files keyed by session_id to track state across hook invocations
**When to use:** When a hook should only fire once per condition per session
**Example:**
```javascript
// Source: .claude/hooks/gsd-context-monitor.js (lines 85-96)
const tmpDir = require('os').tmpdir();
const debounceFile = path.join(tmpDir, `dc-reminder-${sessionId}-${dirHash}.json`);

if (fs.existsSync(debounceFile)) {
  process.exit(0); // Already reminded for this directory
}

// First reminder -- create debounce marker
fs.writeFileSync(debounceFile, JSON.stringify({ reminded: Date.now() }));
```

### Pattern 4: CONTEXT.md Proximity Detection
**What:** Check if edited file's directory or parent directory contains CONTEXT.md
**When to use:** This phase specifically
**Example:**
```javascript
const editedDir = path.dirname(filePath);
const candidates = [
  path.join(editedDir, 'CONTEXT.md'),
  path.join(path.dirname(editedDir), 'CONTEXT.md')
];
const found = candidates.find(p => fs.existsSync(p));
if (!found) process.exit(0); // No nearby CONTEXT.md
```

### Anti-Patterns to Avoid
- **Recursive upward search:** Only check current dir + parent, NOT walk up to root. User decision locks this to 2 levels.
- **Absolute path in reminder message:** Show relative path from cwd, not absolute path. Helps when multiple CONTEXT.md files exist.
- **Blocking on debounce file write errors:** If tmp write fails, still emit the reminder -- debounce is a courtesy, not critical.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Directory hashing | Custom hash function | `crypto.createHash('md5').update(dir).digest('hex').slice(0,8)` | Short, collision-resistant, built-in |
| Stdin reading | Custom stream reader | Copy exact pattern from dc-freshness-check.js | Battle-tested in Phase 10, includes timeout guard |
| JSON output format | Custom serializer | Copy exact `hookSpecificOutput` structure from Phase 10 | Must match Claude Code contract exactly |

## Common Pitfalls

### Pitfall 1: File Path Extraction Varies by Tool
**What goes wrong:** `tool_input.file_path` is the field name for Edit/Write/MultiEdit, but other tools may use different field names.
**Why it happens:** Each tool has its own input schema.
**How to avoid:** The matcher already scopes to Edit/Write/MultiEdit only. These three all use `file_path`. No need to handle other schemas.
**Warning signs:** `tool_input.file_path` is undefined -- means matcher isn't working or a new tool was added.

### Pitfall 2: Relative vs Absolute File Paths
**What goes wrong:** `tool_input.file_path` is always an absolute path from Claude Code. The reminder should show a relative path.
**Why it happens:** Claude Code resolves all paths to absolute before passing to tools.
**How to avoid:** Use `path.relative(cwd, contextMdPath)` where `cwd` comes from stdin JSON or `process.cwd()`.
**Warning signs:** Reminder shows `/Users/alice/project/src/CONTEXT.md` instead of `src/CONTEXT.md`.

### Pitfall 3: Debounce File Permissions in /tmp
**What goes wrong:** On shared machines, tmp files from other users could collide or have wrong permissions.
**Why it happens:** `/tmp` is world-writable.
**How to avoid:** Include session_id in filename (already planned). Session IDs are unique per session.
**Warning signs:** EACCES errors on tmp file read/write. Handle with try/catch and proceed without debounce.

### Pitfall 4: Hook Must Never Block
**What goes wrong:** If the hook throws or hangs, Claude Code reports a hook error to the user.
**Why it happens:** Missing try/catch or stdin timeout.
**How to avoid:** Wrap ALL logic in try/catch with `process.exit(0)`. Use 3-second stdin timeout guard. This is already the established pattern.
**Warning signs:** Users see "hook error" messages in Claude Code UI.

### Pitfall 5: settings.json Array Append
**What goes wrong:** Replacing the PostToolUse array instead of appending to it removes the GSD context monitor hook.
**Why it happens:** Careless JSON editing.
**How to avoid:** Read existing settings.json, verify GSD hook is preserved, append new entry.
**Warning signs:** `gsd-context-monitor.js` missing from PostToolUse array after edit.

## Code Examples

### Complete Hook Structure (Skeleton)
```javascript
#!/usr/bin/env node
// Domain Context Reminder - PostToolUse hook
// Reminds to update CONTEXT.md when files are edited nearby.
// Debounces: one reminder per directory per session.
// Scoped to Edit/Write/MultiEdit via settings.json matcher + internal check.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_TOOLS = ['Edit', 'Write', 'MultiEdit'];

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);

    // Tool scoping (defense-in-depth; matcher handles this too)
    if (!ALLOWED_TOOLS.includes(data.tool_name)) {
      process.exit(0);
    }

    const filePath = data.tool_input && data.tool_input.file_path;
    if (!filePath) process.exit(0);

    const sessionId = data.session_id;
    if (!sessionId) process.exit(0);

    const cwd = data.cwd || process.cwd();
    const editedDir = path.dirname(filePath);

    // Check current dir + parent for CONTEXT.md
    const candidates = [
      path.join(editedDir, 'CONTEXT.md'),
      path.join(path.dirname(editedDir), 'CONTEXT.md')
    ];
    const contextPath = candidates.find(p => fs.existsSync(p));
    if (!contextPath) process.exit(0);

    // Debounce: one reminder per directory per session
    const dirHash = crypto.createHash('md5').update(editedDir).digest('hex').slice(0, 8);
    const tmpDir = require('os').tmpdir();
    const debounceFile = path.join(tmpDir, `dc-reminder-${sessionId}-${dirHash}.json`);

    if (fs.existsSync(debounceFile)) {
      process.exit(0); // Already reminded
    }

    // Mark as reminded
    try {
      fs.writeFileSync(debounceFile, JSON.stringify({ reminded: Date.now() }));
    } catch (e) {
      // Proceed even if debounce write fails
    }

    // Build reminder with relative path
    const relPath = path.relative(cwd, contextPath);
    const message = `CONTEXT.md may need updating: ${relPath} — you just edited files in this area`;

    const output = {
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: message
      }
    };

    process.stdout.write(JSON.stringify(output));
  } catch (e) {
    process.exit(0);
  }
});
```

### Settings.json Registration (Append Pattern)
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/gsd-context-monitor.js"
          }
        ]
      },
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node hooks/dc-context-reminder.js"
          }
        ]
      }
    ]
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Env vars for hook input | JSON on stdin | Claude Code 2.1+ | All hooks must read stdin JSON |
| No matcher field | `matcher` regex in settings.json | Claude Code 2.x | Hooks can be scoped to specific tools at registration level |
| `hookEventName` only | `hookEventName` + `additionalContext` | Claude Code 2.x | Richer hook output contract |

## Open Questions

1. **Does `MultiEdit` use `file_path` or `file_paths` (plural)?**
   - What we know: Edit and Write both use `tool_input.file_path` (singular)
   - What's unclear: MultiEdit may edit multiple files and could use an array field
   - Recommendation: Check `tool_input.file_path` first. If undefined, check for array fields like `tool_input.edits[0].file_path` or similar. Fall back to exit 0 if no path found. The matcher + allowlist still prevents false triggers.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual Node.js script execution + inline verification |
| Config file | none -- hooks are tested by running them directly |
| Quick run command | `echo '{"session_id":"test","tool_name":"Edit","tool_input":{"file_path":"/tmp/test/foo.js"},"cwd":"/tmp/test"}' \| node hooks/dc-context-reminder.js` |
| Full suite command | Run quick command + verify settings.json integrity |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOOK-03 | Detects CONTEXT.md in dir or parent | smoke | Create tmp dir with CONTEXT.md, pipe Edit event, check output | -- Wave 0 |
| HOOK-04 | Emits advisory reminder via additionalContext | smoke | Verify JSON output contains reminder message | -- Wave 0 |
| HOOK-05 | Debounces per directory per session | smoke | Pipe same event twice, verify second produces no output | -- Wave 0 |
| HOOK-06 | Scopes to Edit/Write/MultiEdit only | smoke | Pipe Read event, verify no output; pipe Edit event, verify output | -- Wave 0 |
| HOOK-08 | Registration preserves existing hooks | unit | `node -e` check that settings.json has both gsd and dc hooks | -- Wave 0 |

### Sampling Rate
- **Per task commit:** Run quick smoke test
- **Per wave merge:** Full test sequence
- **Phase gate:** All 5 requirements verified before completion

### Wave 0 Gaps
- No existing test infrastructure for hooks -- tests are run as one-off shell commands
- Need tmp directory fixtures with CONTEXT.md for proximity detection tests
- Need session_id + debounce file cleanup between test runs

## Sources

### Primary (HIGH confidence)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) - PostToolUse stdin JSON schema, matcher syntax, output format
- `hooks/dc-freshness-check.js` (local) - Established stdin timeout, output, and graceful-exit patterns
- `.claude/hooks/gsd-context-monitor.js` (local) - Debounce via tmp file, session_id extraction, PostToolUse hook example

### Secondary (MEDIUM confidence)
- [Claude Code Hooks Guide 2026](https://dev.to/serenitiesai/claude-code-hooks-guide-2026-automate-your-ai-coding-workflow-dde) - MultiEdit tool name confirmation

### Tertiary (LOW confidence)
- MultiEdit `tool_input` schema (exact field names for multi-file edits) -- needs validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all Node.js built-ins, no external deps
- Architecture: HIGH - direct reuse of Phase 10 and GSD patterns, verified against official docs
- Pitfalls: HIGH - drawn from established patterns and official hook contract
- MultiEdit input schema: LOW - exact field names for multi-file case unverified

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable domain, Claude Code hook contract unlikely to change)
