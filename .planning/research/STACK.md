# Stack Research

**Domain:** Claude Code extension development — hooks, path-specific rules, subagent
**Researched:** 2026-03-16
**Confidence:** HIGH (hooks/agents verified against official docs; rules format verified; Node.js patterns verified against working GSD hooks in this repo)

---

## What Changed in v1.1

This is a focused delta from the v1.0 research (skills, templates, validator). The v1.0 content remains valid. This document adds what is needed for the NEW milestone features:

1. SessionStart hook — warns about stale domain context entries
2. PostToolUse hook — reminds about CONTEXT.md updates when editing nearby files
3. Path-specific rule — guides `.context/` file editing
4. Domain validator agent — checks code against documented business rules

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | >= 20 LTS | Hook scripts (SessionStart, PostToolUse) | Project constraint: no runtime deps; all built-ins. Verified: hooks in this repo use `fs`, `path`, `os`, `child_process`. |
| Claude Code hooks contract | current (2026) | Communication protocol for hooks | Verified against official docs: JSON on stdin, JSON `hookSpecificOutput.additionalContext` on stdout, exit 0 on all errors. |
| Claude Code agents format | current (2026) | Domain validator subagent | Verified: YAML frontmatter (`name`, `description`, `tools`, `model`) + markdown body as system prompt. Lives in `.claude/agents/`. |
| Claude Code rules format | current (2026) | Path-specific editing guidance | Verified: markdown with `paths:` YAML frontmatter using glob patterns. Lives in `.claude/rules/`. Loaded lazily when matching files accessed. |

### Node.js Built-in APIs (Hooks Only)

No external packages. These built-ins are sufficient:

| Built-in API | Hook Where Used | Purpose |
|--------------|-----------------|---------|
| `fs` (sync) | Both hooks | Read MANIFEST.md, read/write debounce state files |
| `path` | Both hooks | Resolve MANIFEST.md path relative to `data.cwd` |
| `os` | PostToolUse only | `os.tmpdir()` for session-scoped debounce files (matches GSD pattern) |
| `process.stdin` | Both hooks | Read JSON input event |
| `process.stdout` | Both hooks | Write JSON `hookSpecificOutput` response |

### Development Tools (Unchanged from v1.0)

| Tool | Purpose | Notes |
|------|---------|-------|
| `bash tools/validate-context.sh .` | Validate this project's own .context/ | Dogfooding |
| `npm pack` | Test package before publishing | `npm pack && npx ./domain-context-cc-*.tgz` |

---

## Hook Authoring Pattern (Verified)

Both hooks follow the established GSD pattern exactly (verified from `.claude/hooks/gsd-context-monitor.js` in this repo).

### stdin/stdout Contract

**stdin — SessionStart:**
```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../session.jsonl",
  "cwd": "/Users/...",
  "permission_mode": "default",
  "hook_event_name": "SessionStart",
  "source": "startup",
  "model": "claude-sonnet-4-6"
}
```

**stdin — PostToolUse:**
```json
{
  "session_id": "abc123",
  "cwd": "/Users/...",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": { "file_path": "/path/to/file.ts", "content": "..." },
  "tool_response": { "filePath": "/path/to/file.ts", "success": true },
  "tool_use_id": "toolu_01..."
}
```

**stdout — both hooks:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Message injected into Claude's context"
  }
}
```

### Mandatory Constraints

```javascript
// REQUIRED pattern — every hook must have this structure:
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    // ... work ...
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { ... } }));
  } catch (e) {
    process.exit(0); // MUST exit 0 on any error
  }
});
```

- **3-second stdin timeout guard** — prevents hanging on pipe issues (Windows/Git Bash). Used by all GSD hooks.
- **exit 0 on any error** — hooks must never block tool execution (project constraint).
- **`data.cwd`** — always use `data.cwd`, never `process.cwd()`, for the project root. GSD hooks verify this.
- **No async/await at top level** — stdin reading is event-driven; async inside the callback is fine.

### Debounce Pattern (PostToolUse)

PostToolUse fires on every tool use. For CONTEXT.md reminders, debounce is required to avoid spam. GSD uses session-scoped tmp files:

```javascript
const debounceFile = path.join(os.tmpdir(), `dc-ctx-${data.session_id}.json`);
// Read debounce state, check call count, reset and warn, or increment and exit
```

This pattern is already proven in `gsd-context-monitor.js`. Use the same approach.

### MANIFEST.md Parsing in Hooks (JS Regex, Not LLM)

Hooks run outside of LLM context — they are Node.js scripts. Parse MANIFEST.md with regex:

```javascript
const verifiedDateRe = /\[verified:\s*(\d{4}-\d{2}-\d{2})\]/g;
```

This is the only place in the project where JS-based MANIFEST.md parsing is appropriate. Skills let the LLM parse it natively.

---

## Hook Registration Pattern (settings.json)

Hooks register in `.claude/settings.json`. The domain-context hooks install at the project or global level alongside GSD's existing hooks.

**PostToolUse with tool matcher:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/dc-context-reminder.js"
          }
        ]
      }
    ]
  }
}
```

- `matcher` is a regex matched against `tool_name`. `Write|Edit` covers both file modification tools.
- For SessionStart, omit `matcher` (runs on every session start).
- The installed hook command path must be relative to the project root or use an absolute path. The installer must handle this.

---

## Rules Authoring Pattern (Verified)

Rules live in `.claude/rules/` as markdown files with `paths:` YAML frontmatter. They are loaded lazily when Claude accesses files matching the globs.

```markdown
---
paths:
  - .context/**/*.md
  - .context/MANIFEST.md
---

# Editing .context/ Files

[Guidance for Claude when editing domain context files...]
```

**Key facts (verified against official docs):**
- The `paths:` key takes an array of glob patterns.
- Rules are loaded automatically when a matching file is accessed — no explicit skill invocation needed.
- Multiple rules files can match the same path. All matching rules load.
- Rule files live in `.claude/rules/` at project level (committable) or `~/.claude/rules/` at user level.
- No `name` field required — rules are path-triggered, not command-triggered.

**For this project:** One rule file covering `.context/**/*.md` is sufficient. It should include:
- Spec compliance requirements for MANIFEST.md format
- Verified date format (`[verified: YYYY-MM-DD]`)
- Entry format for domain concepts, ADRs, constraints
- When to update MANIFEST.md vs individual files

---

## Agent Authoring Pattern (Verified)

The domain validator agent is a custom subagent. Subagents live in `.claude/agents/` as markdown files with YAML frontmatter.

**Minimal verified format:**
```markdown
---
name: dc-validator
description: Validates code against documented business rules in .context/. Use when checking if implementation matches domain constraints.
tools: Read, Grep, Glob
model: inherit
---

You are a domain context validator. When invoked, you check whether the
code being discussed matches the business rules documented in `.context/`.

[System prompt instructions here...]
```

**Supported frontmatter fields (relevant subset):**

| Field | Required | Value for This Agent |
|-------|----------|----------------------|
| `name` | Yes | `dc-validator` |
| `description` | Yes | When Claude should delegate to this agent |
| `tools` | No | `Read, Grep, Glob` (read-only — validator, not fixer) |
| `model` | No | `inherit` (same as main conversation) |
| `disallowedTools` | No | Omit — `tools` allowlist is cleaner |

**Tools for the domain validator:**
- `Read` — read domain context files and code
- `Grep` — search for rule violations in code
- `Glob` — find relevant files
- Do NOT include `Write` or `Edit` — the agent validates, it does not change code

**The markdown body becomes the agent's system prompt.** It receives only this prompt plus basic environment (cwd, session info). It does NOT inherit the parent conversation's history.

**Scope:** `.claude/agents/dc-validator.md` at project level. This makes it available in this repo and committable — users who install the package will get it via the installer.

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `node-cron`, `chokidar`, any npm package | Hard constraint: zero runtime deps | Node.js built-ins only |
| MCP server | ADR-003 explicitly defers this | File-based hooks |
| Top-level async/await in hook scripts | Hooks use event-driven stdin pattern; top-level async is incompatible | Put async code inside the `stdin.on('end')` callback |
| `process.cwd()` in hooks | Returns Claude Code process cwd, not the project root | Always use `data.cwd` from stdin JSON |
| Dynamic code execution | Security risk in hook scripts | Direct logic only — parse JSON, do file I/O, exit |
| Write/Edit tools in dc-validator agent | Validator should not modify files; scope creep | Read-only tools: Read, Grep, Glob |
| Path rules with overly broad recursion | Every file access triggers rule loading; over-broad rules add latency | Scope to `.context/**/*.md` specifically |
| Single monolithic hook for all concerns | Harder to debug, harder to disable individually | Separate hooks for freshness (SessionStart) and CONTEXT.md reminder (PostToolUse) |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Separate `dc-freshness-check.js` and `dc-context-reminder.js` | Single combined hook | If hooks share significant state (they don't here) |
| `paths:` frontmatter in rules | `globs:` key | `paths:` is the current (2026) verified format. `globs:` appears in some older examples — do not use it. |
| Agent with `tools: Read, Grep, Glob` | Agent with all tools | Validator is read-only; granting write access violates principle of least privilege |
| `model: inherit` for agent | `model: haiku` | Use haiku if cost is a concern at scale; inherit is simpler for a validation-only agent |
| `matcher: "Write|Edit"` for PostToolUse | No matcher (runs on every tool) | Matcher prevents unnecessary invocations on Read/Grep/etc. |

---

## Version Compatibility

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | >= 20 LTS | Stable `fs`, `path`, `os` built-ins. v24.14.0 verified locally. |
| Bash | >= 3.2 | For validate-context.sh only. No Bash additions in this milestone. |
| Claude Code | current (2026) | Hooks format, agents format, rules `paths:` frontmatter all verified against live docs. |
| GSD | any | Hooks must not conflict with GSD's `gsd-check-update.js` (SessionStart) or `gsd-context-monitor.js` (PostToolUse). Both can coexist in the same `hooks` array. |

---

## Integration Points

### Coexistence with GSD Hooks

GSD already registers hooks in `.claude/settings.json`. The domain-context hooks must be ADDED to the existing arrays, not replace them. The installer must merge, not overwrite:

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node .claude/hooks/gsd-check-update.js" }] },
      { "hooks": [{ "type": "command", "command": "node .claude/hooks/dc-freshness-check.js" }] }
    ],
    "PostToolUse": [
      { "hooks": [{ "type": "command", "command": "node .claude/hooks/gsd-context-monitor.js" }] },
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/dc-context-reminder.js" }]
      }
    ]
  }
}
```

Both hooks arrays are processed in order. All hooks run independently — one hook failure does not block others (each exits 0 on error).

### Hook File Locations (Install Path)

The installer copies hooks to the target project's `.claude/hooks/` directory. This mirrors the GSD pattern (`.claude/hooks/gsd-*.js`). The domain-context hooks use the `dc-` prefix:
- `.claude/hooks/dc-freshness-check.js`
- `.claude/hooks/dc-context-reminder.js`

The rule file installs to `.claude/rules/dc-context-files.md`.

The agent file installs to `.claude/agents/dc-validator.md`.

---

## Sources

- Official Claude Code Hooks docs at `https://code.claude.com/docs/en/hooks` — stdin/stdout format, `hookSpecificOutput`, `additionalContext`, matcher regex format, settings.json structure (HIGH confidence, fetched 2026-03-16)
- Official Claude Code Sub-agents docs at `https://code.claude.com/docs/en/sub-agents` — frontmatter fields (`name`, `description`, `tools`, `model`, `disallowedTools`), agent file location, system prompt as body (HIGH confidence, fetched 2026-03-16)
- Official Claude Code Skills docs at `https://code.claude.com/docs/en/skills` — `paths:` frontmatter for rules, `.claude/rules/` location (HIGH confidence, fetched 2026-03-16)
- GSD hooks in this repo (`.claude/hooks/gsd-context-monitor.js`, `gsd-check-update.js`, `gsd-statusline.js`) — stdin timeout pattern, `data.cwd`, `hookSpecificOutput` format, debounce via tmp files (HIGH confidence, read from working code)
- GSD agents in this repo (`.claude/agents/gsd-verifier.md`) — agent file format, tools list as comma-separated string (HIGH confidence, read from working code)

---
*Stack research for: Claude Code hooks, rules, and agent (domain-context-cc v1.1)*
*Researched: 2026-03-16*
