# Pitfalls Research

**Domain:** Claude Code hooks, path-specific rules, and domain validator agent
**Researched:** 2026-03-16
**Confidence:** HIGH (hooks: official docs verified; rules frontmatter: verified against GitHub issue tracker; agents: official docs verified)

> **Note:** This file extends the v1.0 PITFALLS.md (skills, templates, manifest parsing).
> It covers pitfalls specific to the v1.1 milestone: hooks, rules, and agents.
> The v1.0 pitfalls (Pitfalls 1–7) still apply but are not repeated here.

---

## Critical Pitfalls

### Pitfall 8: Rules `paths:` Frontmatter Is Unreliable — Use `globs:` Instead

**What goes wrong:**
The official Claude Code docs describe `paths:` as the frontmatter key for scoping rules to specific file patterns. Using `paths:` with YAML array syntax (the documented form) silently fails — the rule loads globally or not at all. The `.context/` scoping is lost.

**Why it happens:**
Claude Code's internal parser for the `paths:` field is a character-by-character CSV parser that breaks when it receives a YAML array or quoted values. The documented syntax is wrong. The working syntax is the undocumented `globs:` key with comma-separated unquoted patterns. This is confirmed in GitHub issue #17204 (closed: acknowledged but not fixed as of early 2026).

**How to avoid:**
Use `globs:` with comma-separated unquoted patterns, never `paths:` with YAML array syntax:

```yaml
---
globs: .context/**/*.md, .context/MANIFEST.md
---
```

Do not quote the patterns. Do not use YAML array syntax. Do not use `paths:`.

**Warning signs:**
- The `.context/` rule fires on every file edit, not just `.context/` files
- The rule never fires at all, even when editing `.context/MANIFEST.md`
- No visible error — silent failure

**Phase to address:**
Phase implementing the path-specific rule — use `globs:` from day one.

---

### Pitfall 9: Rules Load on Read, Not Write — Rule Won't Fire on New File Creation

**What goes wrong:**
Path-scoped rules in `.claude/rules/` trigger when Claude reads a file matching the glob pattern, not when Claude writes or creates one. If the domain-context rule is supposed to guide how Claude writes `.context/` files, it will be silently absent during `dc:add` (which creates new files via the Write tool without reading first).

**Why it happens:**
This is a confirmed Claude Code behavior (GitHub issue #23478, closed as NOT_PLANNED in February 2026). The rules injection is tied to the Read tool's file path, not to Write/Edit tool paths. New file creation via Write never triggers a Read, so the rule never loads.

**How to avoid:**
1. Do not rely on the path-scoped rule alone for write-time enforcement. The rule is best used as "when editing existing `.context/` files" — it will catch most real-world edits.
2. For creation-time enforcement (e.g., ensuring new domain files include required sections), embed the requirements in the `dc:add` skill's `<process>` directly. The skill is the write-time contract; the rule is the edit-time reminder.
3. Accept the limitation: the rule is a best-effort reminder, not a hard enforcement mechanism.

**Warning signs:**
- A newly created `.context/domain/foo.md` file violates rule conventions but no rule fired
- Rule works perfectly when editing existing `.context/` files but not when `dc:add` creates new ones

**Phase to address:**
Phase implementing the path-specific rule — document this limitation explicitly in the rule's frontmatter as a comment so future maintainers know why write-time enforcement lives in the skills.

---

### Pitfall 10: PostToolUse `additionalContext` Does Not Fire for MCP Tool Calls

**What goes wrong:**
The PostToolUse hook for CONTEXT.md reminders fires after tool execution and injects `additionalContext` into the conversation. This works for standard tools (Read, Write, Edit, Bash) but is silently ignored when the triggering tool is an MCP tool call. The reminder is never shown.

**Why it happens:**
This is a confirmed Claude Code bug (GitHub issue #24788, reported February 2026). The `additionalContext` field from PostToolUse hooks is not surfaced when the hook was triggered by an MCP tool execution. The hook runs successfully and exits 0, but the output is discarded.

**How to avoid:**
1. The dc PostToolUse hook targets standard file editing tools (Write, Edit, MultiEdit) — not MCP tools. Scope the hook with a matcher to only fire on Edit/Write/MultiEdit to avoid surprising silence in other contexts.
2. Accept that MCP-triggered file edits will not receive CONTEXT.md reminders. Document this gap.
3. Use the matcher field to be explicit:
```json
{
  "matcher": "Edit|Write|MultiEdit"
}
```

**Warning signs:**
- Hook works in manual testing (`echo '...' | node hooks/dc-context-reminder.js`) but reminder never appears
- Hook works when user edits with Edit tool but not after MCP tool modifies files

**Phase to address:**
Phase implementing the PostToolUse hook — use the Edit|Write|MultiEdit matcher from day one to constrain scope and document the MCP limitation.

---

### Pitfall 11: settings.json Hook Registration Clobbers Existing Hooks

**What goes wrong:**
The installer or setup script writes the dc hooks to settings.json. If it replaces the entire `hooks` object rather than merging, it destroys existing hooks (GSD's `gsd-check-update.js` and `gsd-context-monitor.js`). The existing hooks silently vanish.

**Why it happens:**
JSON merge requires reading the existing file, merging arrays at the event level (not replacing them), and writing back. A naive write replaces the object. This is already documented in v1.0 PITFALLS.md but is especially critical for hooks because the project's own `.claude/settings.json` already has two live hooks (SessionStart: gsd-check-update, PostToolUse: gsd-context-monitor) that must coexist.

**How to avoid:**
1. Before writing hooks to settings.json, read the current file.
2. Append dc hooks to each event's `hooks` array — never replace the array.
3. Check for existing dc hook entries before appending (idempotency).
4. The merge pattern from `gsd-context-monitor.js` and `gsd-check-update.js` already shows the correct registration format — add dc hooks as additional objects in the same arrays.

**Warning signs:**
- After adding dc hooks, GSD context warnings stop appearing
- `gsd-check-update.js` no longer fires on session start
- settings.json has only dc hooks (no GSD hooks)

**Phase to address:**
Phase implementing the hooks registration — write idempotent merge logic first, test on the existing settings.json.

---

### Pitfall 12: Agent System Prompt Does Not Inherit Parent Context — Must Be Self-Contained

**What goes wrong:**
The domain validator agent's markdown body becomes its entire system prompt. It does NOT inherit the parent session's CLAUDE.md, skills, or context. If the agent body says "validate against the Domain Context spec" without including what the spec requires, the agent makes up validation rules or uses stale training data.

**Why it happens:**
Subagent system prompts are isolated — the agent receives only its own markdown body plus basic environment details (working directory). The official docs confirm: "Subagents receive only this system prompt (plus basic environment details like working directory), not the full Claude Code system prompt." The parent conversation's CLAUDE.md is invisible.

**How to avoid:**
1. The domain validator agent must be fully self-contained. Either inline the critical validation rules (what sections are required, what formats are valid) or use the `skills:` frontmatter field to preload relevant skills into the agent's context.
2. Use `skills: [dc-validation-rules]` if the rules are packaged as a skill. Otherwise inline them directly in the agent body.
3. Do not use `@path` references to load external files from the agent body — `@` imports work in CLAUDE.md but agents use standard `Read` tool calls to load files at runtime.

**Warning signs:**
- Agent validates `.context/` files correctly for formats described in its body but ignores rules from CLAUDE.md
- Agent hallucinates validation rules not present in its system prompt
- Agent behavior changes between sessions (training data variance instead of spec-derived rules)

**Phase to address:**
Phase implementing the domain validator agent — write the agent body as a completely standalone spec for validation behavior.

---

### Pitfall 13: Subagents Cannot Spawn Other Subagents — Validator Cannot Delegate

**What goes wrong:**
If the domain validator agent tries to spawn a sub-subagent (e.g., to check a specific file type), the spawn silently fails or errors. The agent hangs or skips the delegation step without reporting the failure.

**Why it happens:**
This is a hard Claude Code constraint confirmed in official docs: "Subagents cannot spawn other subagents." An agent spawned from a skill cannot itself spawn agents. The validator must do all its work in a single agent turn without delegation.

**How to avoid:**
Design the validator as a single-agent workflow. All validation steps (read MANIFEST.md, check file existence, check freshness dates, check required sections) must happen in the agent's own execution using its allowed tools (Read, Glob, Grep). Do not design workflows that require nested delegation.

**Warning signs:**
- Agent silently skips validation steps that were supposed to be delegated
- Agent hits `maxTurns` limit because it loops waiting for a sub-delegation that never returns

**Phase to address:**
Phase implementing the domain validator agent — structure the agent's process as a single linear workflow.

---

### Pitfall 14: Hook stdin Timeout Guard Is Required — Missing It Causes "Hook Error" Reports

**What goes wrong:**
Without a stdin timeout guard (3-second timer that calls `process.exit(0)`), the hook hangs indefinitely if the stdin pipe has issues (e.g., on Windows/Git Bash, or if Claude Code's pipe implementation changes). Claude Code kills the hung process and reports "hook error" in the UI, which the user sees as a red warning on every session start or tool use.

**Why it happens:**
This is inherited from Pitfall 7 in the v1.0 research but is critical enough to repeat for hooks added in v1.1. The GSD `gsd-context-monitor.js` hook already implements the correct pattern. The dc hooks must copy it exactly.

**How to avoid:**
Copy this boilerplate verbatim at the top of every hook script:
```javascript
let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    // ... hook logic ...
  } catch (e) {
    process.exit(0); // Silent fail — never block
  }
});
```

All debug output goes to `console.error()`, never `console.log()`.

**Warning signs:**
- "Hook error" or "hook timed out" appears in Claude Code UI on session start
- Hook works in manual testing (`echo '{}' | node hook.js`) but fails in Claude Code

**Phase to address:**
Both hook phases — use the boilerplate from the first line of the first hook written.

---

### Pitfall 15: SessionStart Hook Receives No `.context/` Path — Must Discover It

**What goes wrong:**
The SessionStart hook receives `session_id` and `cwd` in its JSON input. It does not receive the path to `.context/MANIFEST.md`. If the hook hardcodes `path.join(cwd, '.context/MANIFEST.md')`, it works for standard projects but fails silently for projects where `.context/` is not in the root (e.g., monorepo subdirectories).

**Why it happens:**
The hook's only location signal is `cwd`. Projects may run Claude Code from a subdirectory while `.context/` is in a parent. The hook must either (a) accept that it only handles the standard case (`.context/` in `cwd`) or (b) walk up the directory tree to find `.context/`.

**How to avoid:**
1. For v1.1, accept the standard case: look for `.context/MANIFEST.md` relative to `cwd`. If not found, exit silently (no error, no warning).
2. Do not walk the directory tree — that adds complexity with unclear stopping conditions.
3. The hook's contract: "If this project has `.context/MANIFEST.md` in its working directory, check freshness. Otherwise, do nothing."

**Warning signs:**
- Hook warns about stale context in projects that don't use Domain Context
- Hook silently fails in monorepo subdirectory setups

**Phase to address:**
Phase implementing the SessionStart hook — the "not found → exit silently" path must be the first thing implemented and tested.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `paths:` frontmatter (documented format) | Follows official docs | Rule never triggers correctly; silent failure | Never — use `globs:` from the start |
| Omitting matcher from PostToolUse hook | Hook runs on all tool use | Fires on every tool call including bash reads; CONTEXT.md reminder is spammy | Never — matcher is essential for PostToolUse hooks |
| Relying on rule for write-time enforcement | Simpler than embedding in skill | New files bypass rule silently (rules only trigger on Read) | Never — dc:add skill must carry write-time requirements |
| Registering hooks by replacing settings.json hooks object | Simpler code | Destroys GSD hooks and any other registered hooks | Never — always merge |
| Agent body that references external spec without inlining it | Smaller agent file | Agent uses training data for spec rules instead of actual spec; nondeterministic | Never — agent must be self-contained |
| Debounce skipped in PostToolUse hook | Simpler implementation | CONTEXT.md reminder fires on every single Edit tool call during dc:add (which calls Edit multiple times) | Only acceptable if reminder rate is tested and not annoying |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| settings.json hook arrays | Replacing `hooks.PostToolUse` array with a new array containing only dc hooks | Read settings.json → find `hooks.PostToolUse` array → push dc hook object → write back |
| PostToolUse matcher | Omitting `matcher` field entirely | Use `"matcher": "Edit\|Write\|MultiEdit"` to prevent CONTEXT.md reminders on Bash/Read calls |
| `globs:` frontmatter | Using `paths:` with quoted strings or YAML arrays | `globs: .context/**/*.md` — unquoted, comma-separated if multiple patterns |
| Agent `tools:` field | Omitting `tools:` so validator agent inherits all tools including Write/Edit | Explicitly set `tools: Read, Glob, Grep` for a read-only validator — principle of least privilege |
| Agent `skills:` field | Expecting inherited skills from parent conversation | Skills do NOT inherit — must be listed explicitly in agent's `skills:` frontmatter |
| SessionStart hook `source` field | Not checking `source` field; running freshness check on every source type | Check `data.source` — may want to skip `compact` or `clear` sources if freshness was already checked recently |

---

## "Looks Done But Isn't" Checklist

- [ ] **SessionStart hook:** Often missing the "no .context/ found → exit silently" path — verify hook does not error or warn in non-domain-context projects
- [ ] **SessionStart hook:** Often missing stdin timeout guard — verify `echo '{"session_id":"test","cwd":"/tmp"}' | node hooks/dc-freshness-check.js` exits cleanly within 3 seconds
- [ ] **PostToolUse hook:** Often missing matcher — verify hook only fires on Edit/Write/MultiEdit, not on every Bash or Read call
- [ ] **PostToolUse hook:** Often uses `console.log()` for debug output — verify all debug output goes to `console.error()`
- [ ] **Path-specific rule:** Often uses `paths:` frontmatter — verify rule uses `globs:` key and fires correctly on `.context/MANIFEST.md` edits
- [ ] **Path-specific rule:** Often assumed to fire on file creation — verify dc:add skill carries write-time requirements independently
- [ ] **Domain validator agent:** Often missing self-contained validation spec — verify agent body alone (without CLAUDE.md or parent context) is sufficient to validate correctly
- [ ] **Domain validator agent:** Often not constrained to read-only tools — verify `tools: Read, Glob, Grep` is set and Write/Edit are not accessible
- [ ] **Hook registration:** Often replaces hooks object — verify settings.json after adding dc hooks still contains GSD hooks (`gsd-check-update.js`, `gsd-context-monitor.js`)

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong `paths:` frontmatter (rule never fires) | LOW | Change `paths:` to `globs:` with unquoted comma-separated values; no other changes needed |
| Rule fires globally (no path scoping) | LOW | Add correct `globs:` frontmatter; verify with InstructionsLoaded hook event if debugging is needed |
| settings.json clobbered (GSD hooks lost) | MEDIUM | Restore settings.json from git; fix hook registration to merge rather than replace; re-register |
| Agent not self-contained (uses training data for rules) | MEDIUM | Audit agent body against actual spec; inline required sections; re-test with fresh session to verify spec compliance |
| PostToolUse spammy (no matcher) | LOW | Add `"matcher": "Edit\|Write\|MultiEdit"` to hook registration in settings.json |
| Hook blocking sessions (no timeout guard, no exit 0) | LOW | Add timeout guard boilerplate; verify with manual pipe test; re-register |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| `globs:` vs `paths:` frontmatter (P8) | Phase: path-specific rule | Manually edit `.context/MANIFEST.md`; verify rule fires. Edit unrelated file; verify rule does not fire. |
| Rules load on Read not Write (P9) | Phase: path-specific rule | Run `dc:add` to create a new domain concept; verify dc:add skill enforces format independently of rule |
| PostToolUse additionalContext skipped for MCP (P10) | Phase: PostToolUse hook | Test hook with Edit tool (should fire); note MCP limitation in comments |
| settings.json merge safety (P11) | Phase: hook registration | After registration, verify settings.json contains both GSD hooks and dc hooks |
| Agent not self-contained (P12) | Phase: domain validator agent | Create fresh session with no CLAUDE.md loaded; run agent; verify correct behavior |
| Subagents cannot spawn subagents (P13) | Phase: domain validator agent | Design agent as single-turn workflow; test `maxTurns` ceiling |
| Missing stdin timeout guard (P14) | Both hook phases | `echo '{}' \| node hook.js` completes within 3 seconds; hook exits 0 on malformed input |
| SessionStart cwd-only discovery (P15) | Phase: SessionStart hook | Test hook in project without `.context/` — verify silent exit, not error |

---

## Sources

- Official Claude Code hooks documentation: https://code.claude.com/docs/en/hooks (verified 2026-03-16) — hook event schema, output fields, exit code semantics, PostToolUse MCP limitation
- Official Claude Code subagents documentation: https://code.claude.com/docs/en/sub-agents (verified 2026-03-16) — frontmatter fields, tool inheritance, context isolation, no-subagent-spawning constraint
- Official Claude Code memory/rules documentation: https://code.claude.com/docs/en/memory (verified 2026-03-16) — rules load behavior, path-scoped rules, `paths:` vs `globs:`
- GitHub issue #17204: `globs:` works, `paths:` with YAML array/quotes fails (confirmed, not fixed)
- GitHub issue #23478: Rules only load on Read tool, not Write/Create (confirmed, closed NOT_PLANNED, Feb 2026)
- GitHub issue #24788: PostToolUse `additionalContext` not surfaced for MCP tool calls (confirmed, Feb 2026)
- GSD hook pattern: `/Users/alevine/code/domain-context-claude/.claude/hooks/gsd-context-monitor.js` — stdin timeout guard, try/catch exit(0), JSON output pattern
- Project settings.json: `/Users/alevine/code/domain-context-claude/.claude/settings.json` — existing hook registration format to coexist with

---
*Pitfalls research for: Claude Code hooks, rules, and agent (v1.1 milestone)*
*Researched: 2026-03-16*
