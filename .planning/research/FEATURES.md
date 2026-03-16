# Feature Research

**Domain:** Claude Code passive integrations — hooks, path-matched rules, and custom agents
**Researched:** 2026-03-16
**Confidence:** HIGH (verified against official Claude Code docs and real hook examples in this codebase)

---

## Scope

This file covers the v1.1 milestone features only:
- SessionStart hook (`dc-freshness-check.js`) — warns about stale domain context entries
- PostToolUse hook (`dc-context-reminder.js`) — reminds about CONTEXT.md updates when editing nearby files
- Path-specific rule for `.context/` file editing guidance
- Domain validator agent for checking code against documented business rules

Features from v1.0 (dc:init, dc:explore, dc:validate, dc:add, dc:refresh) are documented in milestone archives and are prerequisites, not scope.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that must work for each new component to feel functional. Missing any of these = the component feels broken.

#### SessionStart Hook

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Read MANIFEST.md from cwd at session start | Hooks receive `cwd` in JSON input; the point is to surface stale context | LOW | Use `data.cwd` from stdin JSON, fall back to `process.cwd()` |
| Parse `[verified: YYYY-MM-DD]` dates from manifest | Same parser pattern as v1.0 skills | LOW | Regex on manifest entries |
| Identify entries older than 90 days | Must surface what needs attention | LOW | Date arithmetic; today minus verified date |
| Return `additionalContext` with stale entry names | SessionStart hook injects context via `hookSpecificOutput.additionalContext` | LOW | Claude sees this as session-start context |
| Exit 0 silently when no .context/ or MANIFEST.md | No .context/ = project not initialized; must not error | LOW | Graceful fallback per PROJECT.md constraint |
| Exit 0 on any unexpected error | PROJECT.md constraint: hooks must never block | LOW | Wrap all logic in try/catch, exit 0 on catch |
| Read stdin with timeout guard | Claude Code may close stdin before hook runs; hanging blocks session | LOW | 5-second timeout pattern (established in gsd-context-monitor.js) |
| No output when everything is fresh | Noisy hooks that always fire degrade the tool | LOW | Only emit additionalContext when staleness found |

#### PostToolUse Hook

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Trigger only on Write or Edit tool events | Reminder only makes sense when files are being modified | LOW | Matcher: `"Edit\|Write"` in settings.json |
| Extract the edited file path from tool input | PostToolUse receives `tool_input` in JSON; file path is in `tool_input.file_path` | LOW | Parse `data.tool_input.file_path` |
| Check for CONTEXT.md in same directory as edited file | Reminder is only relevant if a CONTEXT.md exists nearby | LOW | `fs.existsSync(path.join(dir, 'CONTEXT.md'))` |
| Return `additionalContext` reminder when CONTEXT.md found | PostToolUse hook injects context via `hookSpecificOutput.additionalContext` | LOW | One-line reminder, not a command |
| Debounce to avoid firing on every file edit | Repeated reminders are annoying; once per directory per session is enough | MED | Track seen directories in /tmp using session_id |
| Exit 0 silently when edited file has no nearby CONTEXT.md | Most edits have no CONTEXT.md; must not spam | LOW | Graceful no-op |
| Exit 0 on any unexpected error | Same constraint as SessionStart | LOW | try/catch, exit 0 |

#### Path-Specific Rule

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Rule file loads when editing `.context/**` files | Path-specific rules only trigger when Claude works with matching files; non-matching sessions get no overhead | LOW | `paths: ["**/.context/**/*.md"]` in YAML frontmatter |
| Guidance on valid Domain Context spec sections | Editing domain files without spec awareness produces non-compliant content | LOW | Reference required sections per file type |
| Guidance on MANIFEST.md update requirement | MANIFEST.md must stay in sync; easiest to enforce at edit time | LOW | Remind to update `[verified: YYYY-MM-DD]` |
| Keep rule content short (under 50 lines) | Rules load into context; bloated rules consume tokens without value | LOW | Focused, scannable bullets only |

#### Domain Validator Agent

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `name` and `description` in frontmatter so Claude auto-delegates | Claude uses description to decide when to use an agent; vague description = agent is never invoked | LOW | Required fields per official docs |
| Read `.context/domain/` files and extract business rules | Can't validate against rules that aren't read | LOW | Read tool; iterate domain/ files |
| Check code files for violations of documented business rules | The core value: domain knowledge as automated guardrails | HIGH | Requires understanding business rules well enough to grep/reason about code |
| Return structured findings (violations, file, rule violated) | Output must be actionable; vague "might violate" is not useful | MED | Consistent output format per finding |
| Read-only tool access (`tools: Read, Grep, Glob`) | Validation agent must not modify anything | LOW | Standard pattern for read-only agents per official docs |
| Exit gracefully when no `.context/` exists | Agent spawned in non-initialized project must not crash | LOW | Check existence before iterating |

---

### Differentiators (Competitive Advantage)

Features that make these passive integrations notably better than "edit markdown manually."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Freshness warning at session start** | Stale domain context causes silent AI errors throughout a session. Surfacing it at start prompts the developer to refresh before it causes downstream damage. | LOW | SessionStart is ideal for this — fires before any work begins |
| **Edit-proximity awareness in PostToolUse** | Most domain violations happen when editing code near a CONTEXT.md that documents invariants for that module. Triggering only when a nearby CONTEXT.md exists makes the reminder highly relevant rather than generic. | MED | Requires directory traversal to find CONTEXT.md |
| **Scoped rule for .context/ editing** | Without a rule, Claude edits .context/ files like any markdown, ignoring spec structure. A path-scoped rule injects spec awareness exactly when needed (editing those files) and nowhere else. | LOW | Path-matching means zero cost for non-.context/ work |
| **Business rule extraction from domain concepts** | The validator agent reads documented domain concepts and translates them into verification checks against code. This closes the loop between documentation and enforcement. | HIGH | This is the differentiator for the whole milestone — passive enforcement |
| **Debounced reminders** | A PostToolUse hook that fires on every edit is discarded as noise. Debouncing to once-per-directory per session makes the reminder feel like a thoughtful nudge rather than a harassing popup. | MED | Track debounce state in /tmp keyed by session_id + dir |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Auto-update verified dates in PostToolUse** | Seems like it would keep manifest fresh automatically | The hook fires on any Edit/Write, including unrelated code changes. Silent manifest mutation is surprising and error-prone. Context freshness requires human judgment, not timestamp bumping. | Remind, then user explicitly runs dc:refresh |
| **Block tool use when context is stale (exit 2)** | Feels like strong enforcement | Exit 2 blocks the tool execution. Staleness is a soft concern; blocking edits over stale docs would make the tool unusable and violate the spirit of PROJECT.md's "hooks must never block" constraint. | Inject `additionalContext` advisory; never exit 2 |
| **Spawn subagent from hook** | Hook type: "agent" exists in the docs | Spawning agents from SessionStart/PostToolUse hooks is unpredictable, slow, and can consume significant context. The hook runs on every session start or every tool use — agent spawn at that rate is expensive. | Reserve agents for on-demand invocation via `/agents` |
| **Write to .context/ files from hooks** | Would allow hooks to auto-update verified dates | Hooks are lifecycle listeners, not content editors. Writing domain context from a hook violates the "extraction must be user-initiated" business rule from integration-model.md. | dc:refresh is the explicit user-initiated update path |
| **Use HTTP hook type for remote validation** | HTTP hooks support posting to endpoints | For a tool distributed with no runtime dependencies, requiring an endpoint defeats the no-runtime-deps constraint. | All validation logic in local Node.js; built-ins only |
| **Global validator agent (not project-scoped)** | User wants it available in all projects | A validator agent without project-specific `.context/` files has nothing to validate against. The agent must live in `.claude/agents/` per project or be invoked only when .context/ exists. | Ship as a project-scoped agent in `.claude/agents/`; agent body handles missing .context/ gracefully |

---

## Feature Dependencies

```
[SessionStart hook]
    depends on ──> .context/MANIFEST.md (created by dc:init — v1.0 prerequisite)
    depends on ──> stdin JSON with session_id + cwd fields (Claude Code hook contract)

[PostToolUse hook]
    depends on ──> stdin JSON with tool_input.file_path (Claude Code hook contract)
    enhances  ──> module CONTEXT.md files (spec feature: per-module context)
    no dep on ──> .context/MANIFEST.md (looks for directory-local CONTEXT.md only)

[Path-specific rule]
    depends on ──> .claude/rules/ directory support (Claude Code v2.0.64+)
    uses       ──> YAML frontmatter `paths` field for scoping
    no runtime dep on existing .context/ structure

[Domain validator agent]
    depends on ──> .context/domain/ files (created by dc:add — v1.0 prerequisite)
    depends on ──> .claude/agents/ directory (Claude Code standard)
    tools      ──> Read, Grep, Glob only (no Write/Edit)

[settings.json hook registration]
    required by ──> SessionStart hook (wires the command)
    required by ──> PostToolUse hook (wires the command with Edit|Write matcher)
    NOT required by ──> Path-specific rule (rules are auto-discovered from .claude/rules/)
    NOT required by ──> Domain validator agent (agents are auto-discovered from .claude/agents/)
```

### Dependency Notes

- **Both hooks require manual settings.json wiring.** Rules and agents are auto-discovered from their directories; hooks are not. The hook scripts must be distributed via the installer AND registered in settings.json. This is the most complex distribution concern for the milestone.
- **PostToolUse hook enhances module CONTEXT.md.** The spec supports per-module CONTEXT.md files throughout the source tree. The hook's directory proximity check means it naturally works with these even without knowing about them in advance.
- **Domain validator agent requires initialized project.** The agent should handle the case where `.context/` does not exist and report it gracefully rather than erroring.

---

## MVP Definition

### Launch With (v1.1)

These are the four features called out in PROJECT.md as the milestone scope. All four are needed together — partial delivery devalues the milestone.

- [ ] **SessionStart hook** — core passive freshness awareness; the most user-visible win
- [ ] **PostToolUse hook** — closes the loop between editing code and maintaining context
- [ ] **Path-specific rule** — lowest complexity; highest context-quality ROI for .context/ editing
- [ ] **Domain validator agent** — the differentiator for the milestone; makes domain context actionable

### Add After Validation (v1.1.x)

- [ ] **Debounce improvements to PostToolUse** — basic debounce ships with v1.1; smarter session-aware debounce can be added once real-world usage patterns are known
- [ ] **Validator agent memory** — `memory: project` scope would let the agent accumulate knowledge of which violations it has already flagged; useful for large codebases

### Future Consideration (v2+)

- [ ] **GSD dc:extract skill** — already listed as a future milestone in PROJECT.md; extracts .planning/ artifacts into .context/ at phase completion
- [ ] **npm packaging and installer** — future milestone; hooks + agent are distributed as files today
- [ ] **MCP server** — deferred per ADR-003; file-based approach is sufficient and simpler

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| SessionStart freshness hook | HIGH — surfaces silent errors before work begins | LOW — straightforward stdin/stdout + date parsing | P1 |
| PostToolUse CONTEXT.md reminder | HIGH — closes doc/code gap at the moment of editing | LOW-MED — requires debounce logic | P1 |
| Path-specific rule for .context/ | MEDIUM — improves editing quality; saves spec lookup | LOW — markdown file with YAML frontmatter | P1 |
| Domain validator agent | HIGH — makes domain docs actionable as guardrails | HIGH — requires business rule extraction + code reasoning | P1 |
| Debounce improvements | MEDIUM — prevents noise | MED | P2 |
| Validator agent memory | MEDIUM — cross-session learning | MED | P2 |

All four v1.1 features are P1 because they are the stated milestone scope. The cost differential determines build order: rule and hooks first (low complexity, unblocking), agent last (highest complexity).

---

## How the Claude Code Extension Points Actually Work

This section documents the verified behavior of each mechanism used in this milestone.

### SessionStart Hook

- Fires when a session starts, resumes, or is cleared/compacted
- Receives JSON on stdin: `{ session_id, cwd, source, model, hook_event_name, transcript_path, permission_mode }`
- Output format: `{ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: "..." } }`
- `additionalContext` is injected into Claude's context silently (not shown to user as of Claude Code 2.1.0)
- Must exit 0 to be parsed; exit 2 shows error to user/Claude; any other non-zero is non-blocking error
- Stdin may close before the hook reads all data — requires timeout guard (5s is sufficient per real hook examples)

### PostToolUse Hook

- Fires after a tool completes successfully
- Receives JSON on stdin: `{ session_id, cwd, tool_name, tool_input, tool_response, tool_use_id, hook_event_name, ... }`
- For Edit/Write tools, `tool_input.file_path` contains the edited file path
- Output format: `{ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: "..." } }`
- Matcher in settings.json uses regex against tool name: `"matcher": "Edit|Write"`
- All matching hooks run in parallel; no guaranteed ordering with other hooks
- Must follow same exit-code safety rules as SessionStart

### Path-Specific Rules

- Files in `.claude/rules/` are auto-discovered recursively; no registration needed
- Files without YAML frontmatter load at every session launch (same as CLAUDE.md)
- Files with `paths:` frontmatter only load when Claude reads matching files
- `paths` field accepts glob patterns: `**/.context/**/*.md` matches all markdown under any `.context/` directory
- Multiple patterns in `paths:` use OR logic (any match triggers the rule)
- Rules are loaded as user messages, not system prompt; they inform but do not enforce
- Keep under 200 lines; shorter is better for adherence

### Custom Agents

- Files in `.claude/agents/` with `.md` extension are auto-discovered (no registration needed)
- Required frontmatter: `name` (lowercase, hyphens), `description` (what Claude uses for auto-delegation)
- Optional frontmatter: `tools` (allowlist), `disallowedTools` (denylist), `model`, `permissionMode`, `maxTurns`, `hooks`, `memory`, `skills`
- `tools` field uses comma-separated tool names: `Read, Grep, Glob`
- Body is the system prompt — agents receive only this, not the full Claude Code system prompt
- Agents do NOT inherit skills from the parent conversation; must list explicitly in `skills` field
- Subagents cannot spawn other subagents
- Auto-delegation: Claude reads `description` and delegates when task matches; write descriptions that say when to use ("Use when verifying code against domain rules")

---

## Sources

- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) — HIGH confidence; official docs verified 2026-03-16
- [Claude Code Memory and Rules](https://code.claude.com/docs/en/memory) — HIGH confidence; official docs verified 2026-03-16
- [Claude Code Subagents](https://code.claude.com/docs/en/sub-agents) — HIGH confidence; official docs verified 2026-03-16
- `/Users/alevine/.claude/hooks/gsd-context-monitor.js` — HIGH confidence; real PostToolUse hook showing exact stdin/stdout pattern
- `/Users/alevine/.claude/hooks/gsd-check-update.js` — HIGH confidence; real SessionStart hook showing background spawn pattern
- `/Users/alevine/.claude/agents/gsd-verifier.md` — HIGH confidence; real agent file showing frontmatter format
- `/Users/alevine/.claude/settings.json` — HIGH confidence; real settings.json showing hook registration format
- `.planning/PROJECT.md` — project requirements and constraints

---

*Feature research for: Claude Code passive integrations (hooks, rules, agents)*
*Researched: 2026-03-16*
*Milestone scope: v1.1 — adding hooks, rules, and validator agent to existing dc:* skill project*
