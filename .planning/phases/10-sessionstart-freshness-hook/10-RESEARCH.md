# Phase 10: SessionStart Freshness Hook - Research

**Researched:** 2026-03-16
**Domain:** Claude Code SessionStart hooks, MANIFEST.md parsing, Node.js stdin/stdout IPC
**Confidence:** HIGH

## Summary

This phase implements a SessionStart hook that parses `.context/MANIFEST.md` for `[verified: YYYY-MM-DD]` dates, identifies entries older than 90 days, and injects a warning into Claude's conversation context via `additionalContext`. The project already has two production GSD hooks that establish every pattern needed: stdin timeout guards, JSON IPC format, graceful error handling, and `additionalContext` injection.

The implementation is straightforward because: (1) the MANIFEST.md format is well-specified with a simple regex-parseable `[verified: YYYY-MM-DD]` pattern, (2) the existing `gsd-context-monitor.js` hook demonstrates the exact stdin/stdout contract and `additionalContext` injection pattern, and (3) the hook has no external dependencies -- only Node.js built-ins (`fs`, `path`).

**Primary recommendation:** Follow the `gsd-context-monitor.js` pattern exactly for stdin handling and output format, with MANIFEST.md-specific parsing logic as the only new code.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- List each stale entry with its overdue age (e.g., "Integration Model (35 days overdue)")
- Include a suggested action mentioning `/dc:refresh` so users know the remediation command
- Flag entries without a verified date as "never verified" -- missing dates are worse than stale dates
- Use "Domain Context: N stale entries" as the warning header for clear, scannable output
- Place hook file at `hooks/dc-freshness-check.js` matching existing `hooks/` directory convention with `dc-` prefix
- Parse verified dates via regex on `[verified: YYYY-MM-DD]` pattern -- matches the spec format exactly
- Read stdin JSON with a 3-second timeout then ignore content -- satisfies HOOK-07 without hanging
- Display staleness as "days overdue" (days since verified minus 90) for actionable specificity

### Claude's Discretion
- Internal implementation details (buffer handling, error message wording for edge cases)

### Deferred Ideas (OUT OF SCOPE)
None.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HOOK-01 | SessionStart hook reads MANIFEST.md and warns about entries with verified dates >90 days old | Regex pattern `\[verified:\s*(\d{4}-\d{2}-\d{2})\]` extracts dates; date arithmetic via `Date` constructor; output via `additionalContext` |
| HOOK-02 | SessionStart hook exits 0 gracefully when no .context/ exists or on any error | Check `.context/MANIFEST.md` existence early, wrap all logic in try/catch with `process.exit(0)` |
| HOOK-07 | Both hooks use stdin timeout guard (3-second) to prevent UI error warnings | `setTimeout(() => process.exit(0), 3000)` pattern proven in `gsd-context-monitor.js` |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `fs` | N/A | Read MANIFEST.md file | Project convention: no external deps |
| Node.js built-in `path` | N/A | Resolve `.context/MANIFEST.md` path | Project convention |

### Supporting
None needed. This hook uses only Node.js built-ins per project convention.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regex date parsing | `Date.parse()` only | Regex needed to extract from markdown line; `new Date('YYYY-MM-DD')` works for arithmetic after extraction |
| Manual line-by-line parsing | Markdown parser (remark) | Overkill; `[verified: YYYY-MM-DD]` is a fixed pattern, regex is sufficient and has no dependencies |

## Architecture Patterns

### Hook File Location
```
hooks/
  dc-freshness-check.js    # NEW - this phase's deliverable
```

Registered in `.claude/settings.json` under `hooks.SessionStart[]` alongside existing GSD hooks.

### Pattern 1: Stdin Timeout Guard (from gsd-context-monitor.js)
**What:** 3-second timeout on stdin to prevent hanging when pipe issues occur
**When to use:** Every Claude Code hook that reads stdin
**Example:**
```javascript
// Source: .claude/hooks/gsd-context-monitor.js lines 33-37
let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  // ... process input
});
```

### Pattern 2: additionalContext Output (from gsd-context-monitor.js)
**What:** JSON stdout format that injects text into Claude's conversation context
**When to use:** When a hook needs to communicate information to the AI agent
**Example:**
```javascript
// Source: .claude/hooks/gsd-context-monitor.js lines 142-149
const output = {
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: message
  }
};
process.stdout.write(JSON.stringify(output));
```

### Pattern 3: MANIFEST.md Line Parsing
**What:** Extract entry name and verified date from manifest lines
**When to use:** Parsing `[verified: YYYY-MM-DD]` from each manifest entry
**Example:**
```javascript
// Manifest line format (from Domain Context spec section 6.3):
// - [Integration Model](domain/integration-model.md) — Description [public] [verified: 2026-03-11]
// - [001: Single Project](decisions/001-single-project.md) — Description [verified: 2026-03-11]

const datePattern = /\[verified:\s*(\d{4}-\d{2}-\d{2})\]/;
const namePattern = /^-\s*\[([^\]]+)\]/;

const lines = content.split('\n');
for (const line of lines) {
  const nameMatch = line.match(namePattern);
  const dateMatch = line.match(datePattern);

  if (nameMatch && !dateMatch) {
    // Entry exists but has no verified date -> "never verified"
  } else if (nameMatch && dateMatch) {
    const verified = new Date(dateMatch[1]);
    const daysSince = Math.floor((now - verified) / (1000 * 60 * 60 * 24));
    if (daysSince > 90) {
      const overdue = daysSince - 90;
      // -> "Integration Model (35 days overdue)"
    }
  }
}
```

### Pattern 4: Graceful No-Op (HOOK-02)
**What:** Exit 0 silently when no `.context/` exists or on any error
**When to use:** Before any parsing logic; as outer try/catch
**Example:**
```javascript
try {
  const cwd = process.cwd();
  const manifestPath = path.join(cwd, '.context', 'MANIFEST.md');

  if (!fs.existsSync(manifestPath)) {
    process.exit(0); // No .context/ -- silent exit
  }

  // ... parsing logic ...
} catch (e) {
  process.exit(0); // Any error -- silent exit
}
```

### Anti-Patterns to Avoid
- **Using `fs.readFileSync` before existence check:** Always check `existsSync` first to avoid throwing
- **Using `Date.parse()` on ambiguous formats:** `YYYY-MM-DD` is safe with `new Date()`, but never rely on locale-dependent parsing
- **Writing to stderr:** Hooks must never produce stderr output; it would show as a hook error in the UI
- **Returning exit code != 0:** Any non-zero exit is treated as a hook failure by Claude Code

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date arithmetic | Custom day-counting | `new Date()` subtraction + `Math.floor(ms / 86400000)` | Edge cases with DST, leap years handled by Date |
| Manifest parsing | Full markdown AST parser | Line-by-line regex | The `[verified: YYYY-MM-DD]` pattern is fixed by spec; full parsing is overkill |
| Stdin handling | Custom stream reader | Copy exact pattern from `gsd-context-monitor.js` | Proven in production, handles timeout edge cases |

**Key insight:** This hook is simple enough that the only "library" needed is the existing GSD hook pattern. Do not over-engineer.

## Common Pitfalls

### Pitfall 1: Stdin Hang Without Timeout
**What goes wrong:** Hook blocks forever waiting for stdin, Claude Code kills it after internal timeout, shows "hook error" to user
**Why it happens:** Pipe issues on some platforms (Windows/Git Bash), or if stdin JSON is not sent
**How to avoid:** 3-second `setTimeout(() => process.exit(0), 3000)` before any stdin reading
**Warning signs:** Hook works locally but users report "hook error" intermittently

### Pitfall 2: Date Constructor Timezone Trap
**What goes wrong:** `new Date('2026-03-11')` is interpreted as UTC midnight, which can shift to previous day in negative UTC offsets
**Why it happens:** `YYYY-MM-DD` strings without time component are parsed as UTC per ECMAScript spec
**How to avoid:** Since we only need day-level precision (90-day threshold), this 1-day ambiguity is acceptable. Both `now` and `verified` should use consistent comparison. For maximum safety, parse components manually: `new Date(year, month - 1, day)` to get local midnight.
**Warning signs:** Off-by-one day in staleness calculation near timezone boundaries

### Pitfall 3: Manifest Lines Without Entries
**What goes wrong:** Section headers, blank lines, or non-entry lines match partial regex
**Why it happens:** Matching too broadly (e.g., any line with `[verified:`)
**How to avoid:** Require the line to start with `- [` (list item with link) before extracting verified date
**Warning signs:** Section headers or comments appearing as "never verified" entries

### Pitfall 4: Non-Zero Exit on Parse Error
**What goes wrong:** Malformed MANIFEST.md causes unhandled exception, process exits with code 1, Claude Code shows hook error
**Why it happens:** Missing try/catch around parsing logic
**How to avoid:** Wrap ALL logic after stdin handling in try/catch with `process.exit(0)` in catch
**Warning signs:** Any uncaught exception = hook error in UI

### Pitfall 5: hookEventName Mismatch
**What goes wrong:** `additionalContext` is silently ignored by Claude Code
**Why it happens:** Using wrong `hookEventName` (e.g., "PostToolUse" instead of "SessionStart")
**How to avoid:** Set `hookEventName: "SessionStart"` since this is a SessionStart hook
**Warning signs:** Hook runs successfully but no warning appears in conversation

## Code Examples

### Complete Hook Structure (Verified Pattern)
```javascript
#!/usr/bin/env node
// dc-freshness-check.js - SessionStart hook
// Warns about stale .context/ entries (>90 days since verified)

const fs = require('fs');
const path = require('path');

// HOOK-07: 3-second stdin timeout guard
let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const cwd = process.cwd();
    const manifestPath = path.join(cwd, '.context', 'MANIFEST.md');

    // HOOK-02: graceful no-op when no .context/
    if (!fs.existsSync(manifestPath)) {
      process.exit(0);
    }

    const content = fs.readFileSync(manifestPath, 'utf8');
    const now = new Date();
    const THRESHOLD_DAYS = 90;
    const staleEntries = [];

    const lines = content.split('\n');
    for (const line of lines) {
      // Only match manifest entry lines: "- [Name](path) -- description [verified: YYYY-MM-DD]"
      const nameMatch = line.match(/^-\s*\[([^\]]+)\]/);
      if (!nameMatch) continue;

      const name = nameMatch[1];
      const dateMatch = line.match(/\[verified:\s*(\d{4})-(\d{2})-(\d{2})\]/);

      if (!dateMatch) {
        staleEntries.push(`${name} (never verified)`);
        continue;
      }

      const verified = new Date(
        parseInt(dateMatch[1]),
        parseInt(dateMatch[2]) - 1,
        parseInt(dateMatch[3])
      );
      const daysSince = Math.floor((now - verified) / (1000 * 60 * 60 * 24));

      if (daysSince > THRESHOLD_DAYS) {
        const overdue = daysSince - THRESHOLD_DAYS;
        staleEntries.push(`${name} (${overdue} days overdue)`);
      }
    }

    if (staleEntries.length === 0) {
      process.exit(0);
    }

    // Build warning message per user decisions
    const header = `Domain Context: ${staleEntries.length} stale entries`;
    const list = staleEntries.map(e => `  - ${e}`).join('\n');
    const action = 'Run /dc:refresh to review and update verified dates.';
    const message = `${header}\n${list}\n${action}`;

    const output = {
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: message
      }
    };

    process.stdout.write(JSON.stringify(output));
  } catch (e) {
    // HOOK-02: silent exit on any error
    process.exit(0);
  }
});
```

### Warning Output Example
```
Domain Context: 2 stale entries
  - Integration Model (35 days overdue)
  - Billing Rules (never verified)
Run /dc:refresh to review and update verified dates.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hooks return plain text | Hooks return JSON with `hookSpecificOutput.additionalContext` | Claude Code hooks API | Structured format required for injection |
| No stdin timeout | 3-second stdin timeout guard | Discovered via production issues (see #775 in GSD) | Prevents UI error on pipe issues |

**Deprecated/outdated:**
- None relevant. The hooks API is stable and the patterns in this project are current.

## Open Questions

1. **Should the hook read `cwd` from stdin JSON or from `process.cwd()`?**
   - What we know: `gsd-context-monitor.js` uses `data.cwd || process.cwd()` fallback pattern. The SessionStart `gsd-check-update.js` uses `process.cwd()` directly (it doesn't parse stdin JSON at all).
   - What's unclear: Whether SessionStart hooks reliably receive a `cwd` field in stdin JSON.
   - Recommendation: Use `process.cwd()` since this is a SessionStart hook (not PostToolUse), matching `gsd-check-update.js` pattern. The stdin is read only to satisfy the pipe contract and prevent hanging.

2. **Should numbered ADR entries like "001: Single Project" show the full name or just the title portion?**
   - What we know: The regex `\[([^\]]+)\]` will capture "001: Single Project" as the full name.
   - What's unclear: Whether users prefer just "Single Project" without the number prefix.
   - Recommendation: Use the full captured text as-is. The number prefix provides useful identification.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected -- no test framework in project |
| Config file | none -- see Wave 0 |
| Quick run command | `node hooks/dc-freshness-check.js < /dev/null` (smoke test: should exit 0) |
| Full suite command | Manual test script (see below) |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOOK-01 | Warns about stale entries >90 days | smoke | `echo '{}' \| node hooks/dc-freshness-check.js` (in project with stale .context/) | No -- Wave 0 |
| HOOK-02 | Exits 0 gracefully with no .context/ | smoke | `cd /tmp && node /path/to/hooks/dc-freshness-check.js < /dev/null; echo $?` (should print 0) | No -- Wave 0 |
| HOOK-07 | 3-second stdin timeout | manual-only | Observe behavior when stdin pipe is not closed (manual verification) | N/A |

### Sampling Rate
- **Per task commit:** `node hooks/dc-freshness-check.js < /dev/null; echo "exit: $?"` (must print "exit: 0")
- **Per wave merge:** Run smoke tests for all three requirements
- **Phase gate:** All three requirements manually verified before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No test framework exists -- tests will be manual smoke tests via bash commands
- [ ] Create a test fixture with a stale MANIFEST.md for HOOK-01 verification

*(Note: This project has no test framework and uses manual verification. Given the hook is a single file with ~60 lines of logic, manual smoke tests are proportionate.)*

## Sources

### Primary (HIGH confidence)
- `.claude/hooks/gsd-context-monitor.js` -- Production PostToolUse hook demonstrating stdin timeout, JSON output, additionalContext pattern
- `.claude/hooks/gsd-check-update.js` -- Production SessionStart hook demonstrating background spawn, process.cwd() usage
- `.claude/settings.json` -- Hook registration format (SessionStart array structure)
- `/Users/alevine/code/domain-context/SPEC.md` section 6.3 -- MANIFEST.md format specification
- `/Users/alevine/code/domain-context/SPEC.md` section 8.2 -- Automated freshness check specification
- `.context/MANIFEST.md` -- Live example of manifest format with `[verified: 2026-03-11]` entries

### Secondary (MEDIUM confidence)
- None needed -- all patterns are verified from project source code

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No external dependencies; Node.js built-ins only, matching project convention
- Architecture: HIGH -- Exact patterns copied from two production GSD hooks in the same project
- Pitfalls: HIGH -- Stdin timeout issue documented in GSD codebase (comment references #775); date parsing pitfall is well-known ECMAScript behavior

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable -- hooks API unlikely to change)
