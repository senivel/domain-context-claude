# Project Research Summary

**Project:** domain-context-cc v1.1 — Passive Claude Code Integrations (Hooks, Rules, Agent)
**Domain:** Claude Code extension development — hooks, path-scoped rules, and custom subagents
**Researched:** 2026-03-16
**Confidence:** HIGH

## Executive Summary

This milestone adds passive, automatic integrations to the existing `domain-context-cc` skill project. Where v1.0 built five user-invoked skills (`dc:init`, `dc:explore`, `dc:validate`, `dc:add`, `dc:refresh`), v1.1 adds four components that work without user invocation: a SessionStart hook that warns when domain context entries are stale, a PostToolUse hook that reminds about CONTEXT.md updates when editing nearby files, a path-scoped rule that injects Domain Context spec guidance when editing `.context/` files, and a read-only domain validator agent that checks code against documented business rules. These are additive — the v1.0 skill layer is entirely unchanged, and no existing files are modified except for two appended entries in `settings.json`.

The recommended approach is well-established within this codebase. All four new components follow patterns already present: hooks copy the `gsd-context-monitor.js` boilerplate verbatim (stdin timeout guard, JSON parse, try/catch, exit 0 on any error), the agent mirrors the `gsd-verifier.md` format, and the rule uses path-scoped frontmatter for zero-overhead delivery. The technology is exclusively Node.js built-ins plus Claude Code's existing extension contracts — no new runtime dependencies. The most complex component is the domain validator agent, which requires a fully self-contained system prompt that cannot rely on inheriting any parent session context.

The key risks are all known and avoidable. The most critical: use `globs:` not `paths:` in the rule frontmatter — the documented `paths:` format silently fails (confirmed GitHub issue #17204). The second critical risk: hook registration in `settings.json` must merge into existing arrays, never replace them, to preserve GSD's live hooks. Everything else is applying established boilerplate correctly. Total new file count is four source files plus one `settings.json` edit.

## Key Findings

### Recommended Stack

See full details: `.planning/research/STACK.md`

The entire v1.1 milestone uses Node.js built-ins only — `fs`, `path`, `os`, `process.stdin`, `process.stdout`. No new packages. Claude Code's hook contract (JSON on stdin, `hookSpecificOutput.additionalContext` on stdout) is verified against official docs and live GSD hooks in the repo. Agent and rule formats are verified against both official docs and working examples in `.claude/agents/` and `.claude/rules/`.

**Core technologies:**
- Node.js >= 20 LTS: Hook scripts — zero runtime dependencies, built-ins sufficient
- Claude Code hooks contract (2026): stdin/stdout JSON protocol for SessionStart and PostToolUse events — verified against official docs and working GSD hooks
- Claude Code agents format (2026): YAML frontmatter (`name`, `description`, `tools`, `model`) + markdown system prompt body — verified against `gsd-verifier.md`
- Claude Code rules format (2026): Markdown with `globs:` YAML frontmatter (NOT `paths:`) for lazy path-triggered loading

**Critical version note:** Rules frontmatter uses `globs:` key with unquoted comma-separated patterns. The documented `paths:` key silently fails (GitHub issue #17204, unresolved as of early 2026).

### Expected Features

See full details: `.planning/research/FEATURES.md`

All four v1.1 features are table stakes for the milestone to feel complete — partial delivery devalues it.

**Must have (table stakes):**
- SessionStart freshness hook — stale context causes silent errors; surface at session start before work begins
- PostToolUse CONTEXT.md reminder with debounce — closes the doc/code gap at the moment of editing; once-per-directory-per-session to prevent noise
- Path-scoped rule for `.context/` editing — injects spec awareness exactly when Claude edits context files, zero cost otherwise
- Domain validator agent (read-only) — checks code against `.context/domain/` business rules; Read, Grep, Glob only

**Differentiators (ship with table stakes):**
- Edit-proximity awareness in PostToolUse — reminder only fires when a CONTEXT.md actually exists nearby, making it highly relevant rather than generic
- Business rule extraction in agent — reads documented domain concepts and translates them into verification checks against code; closes the documentation-to-enforcement loop

**Defer (v2+):**
- GSD dc:extract skill — extracts `.planning/` artifacts to `.context/` at phase completion
- npm installer automation — currently manual file copy; automate in a future milestone
- MCP server — deferred by ADR-003; file-based approach is sufficient

**Do not build:**
- Auto-update verified dates in hooks — silent manifest mutation is surprising; staleness requires human judgment
- Block tool use when context is stale (exit 2) — hooks must never block per project constraint
- Write tool access for domain validator agent — validator reports, it does not fix

### Architecture Approach

See full details: `.planning/research/ARCHITECTURE.md`

The four new components form three new layers beneath the existing active skill layer: a passive layer (two hooks that fire automatically on session events), a contextual layer (path-triggered rule), and an on-demand layer (domain validator agent). Each layer is fully independent — hooks do not call agents, rules do not call skills, the agent is invoked only on demand. All components operate on the target project's `.context/` directory. The project itself remains configuration-only: no hooks modify source files, and the components make no changes to the v1.0 skill layer.

**Major components:**
1. `hooks/dc-freshness-check.js` — SessionStart; reads MANIFEST.md, emits advisory warning for entries > 90 days old
2. `hooks/dc-context-reminder.js` — PostToolUse (Write/Edit/MultiEdit matcher); checks for CONTEXT.md near edited file, emits debounced advisory reminder
3. `rules/domain-context.md` — Path-scoped rule; injects Domain Context spec guidance when editing `.context/**` or `**/CONTEXT.md`
4. `agents/domain-validator.md` — Read-only subagent; reads `.context/domain/` files, checks code for business rule violations

**Build order** (dependency-driven): SessionStart hook → PostToolUse hook → settings.json update → path-scoped rule → domain validator agent

### Critical Pitfalls

See full details: `.planning/research/PITFALLS.md`

1. **`globs:` not `paths:` in rule frontmatter** — `paths:` silently fails (wrong internal parser, GitHub #17204). Use `globs: .context/**/*.md` with unquoted comma-separated patterns. No YAML array syntax, no quoted strings.

2. **settings.json hook registration clobbers existing hooks** — Must read existing `settings.json`, append dc hooks to existing event arrays, and write back. Replacing the hooks object destroys GSD's live hooks. Verify settings.json contains both GSD and dc hooks after every registration change.

3. **Agent system prompt is not inherited — must be self-contained** — The domain validator receives only its own markdown body as context. CLAUDE.md, parent session skills, and conversation history are invisible. Inline all validation rules directly in the agent body.

4. **Rules only trigger on Read tool, not Write/Create** — Path-scoped rules load when Claude reads matching files, not when it creates them. New `.context/` files created via `dc:add` bypass the rule entirely (GitHub #23478, closed NOT_PLANNED). Write-time requirements must live in the `dc:add` skill directly (already done in v1.0).

5. **Missing stdin timeout guard causes "hook error" UI warnings** — Without a 3-second timeout guard calling `process.exit(0)`, pipe issues produce visible red errors in Claude Code's UI. Copy the boilerplate from `gsd-context-monitor.js` verbatim; do not improvise.

## Implications for Roadmap

Based on research, the build order is fully determined by dependencies and complexity gradient. All four components are independent of each other architecturally, but follow a natural complexity ramp that informs sequencing.

### Phase 1: SessionStart Freshness Hook

**Rationale:** Simplest hook — no debounce needed, no matcher, synchronous file read. Establishes the hook boilerplate pattern that the PostToolUse hook will reuse. Most user-visible win; fires on every session start in initialized projects.

**Delivers:** `hooks/dc-freshness-check.js` + first `settings.json` entry (SessionStart)

**Addresses:** Stale context warning at session start; graceful no-op in non-domain-context projects

**Avoids:** Pitfall 15 (cwd-only discovery — implement "not found → exit 0" as the first code path), Pitfall 14 (stdin timeout guard from the first line of the file)

### Phase 2: PostToolUse CONTEXT.md Reminder Hook

**Rationale:** Reuses hook boilerplate from Phase 1. Adds debounce complexity via session-scoped tmp file (identical pattern to `gsd-context-monitor.js`). Must use `Edit|Write|MultiEdit` matcher to avoid spamming on every tool call. PostToolUse MCP limitation (Pitfall 10) is handled by the matcher scope.

**Delivers:** `hooks/dc-context-reminder.js` + second `settings.json` entry (PostToolUse with matcher)

**Addresses:** Edit-proximity CONTEXT.md awareness with debounce; advisory (not imperative) message tone

**Avoids:** Pitfall 10 (MCP tool limitation — matcher constrains scope to standard file tools), Pitfall 11 (settings.json merge — append, never replace)

### Phase 3: Path-Scoped Rule

**Rationale:** No code dependencies. Simple markdown file with frontmatter. Validates understanding of `.context/` file format before encoding that same understanding in the agent system prompt. Lowest complexity of the four new components.

**Delivers:** `rules/domain-context.md`

**Addresses:** Ambient spec compliance guidance when editing `.context/` files; zero overhead for sessions that never touch `.context/`

**Avoids:** Pitfall 8 (use `globs:` not `paths:` — verified correct key before writing), Pitfall 9 (document explicitly that rule does not fire on file creation; dc:add skill carries write-time requirements independently)

### Phase 4: Domain Validator Agent

**Rationale:** Most complex content. Requires encoding business rule extraction logic and code analysis process in a fully self-contained system prompt. Benefits from having worked through `.context/` format in Phase 3. Must be designed as a single linear workflow — subagents cannot spawn other subagents (Pitfall 13).

**Delivers:** `agents/domain-validator.md`

**Addresses:** Semantic validation of code against documented business rules; structured findings output (violation, file, rule violated)

**Avoids:** Pitfall 12 (agent body is a complete standalone spec — no reliance on CLAUDE.md or parent context), Pitfall 13 (single-turn workflow with no nested delegation)

### Phase Ordering Rationale

- Hooks before settings.json entries: hook files must exist before being registered
- SessionStart before PostToolUse: simpler (no debounce, no matcher) — establishes boilerplate pattern
- Rule before agent: both are independent of hooks, but rule validates format understanding before the agent encodes it
- Agent last: most complex content; writing the rule first forces clarity on spec format requirements before they become an agent system prompt

### Research Flags

Phases with standard, well-documented patterns (can skip research-phase):
- **Phase 1 (SessionStart hook):** Pattern fully established in `gsd-check-update.js`. Copy and adapt.
- **Phase 2 (PostToolUse hook):** Pattern fully established in `gsd-context-monitor.js`. Debounce pattern is identical.
- **Phase 3 (path-scoped rule):** Simple markdown file. Only constraint is `globs:` vs `paths:` (documented and clear).

Phase that warrants a design pass before implementation:
- **Phase 4 (domain validator agent):** The agent's system prompt must encode the Domain Context spec well enough to produce accurate, actionable findings. The *format* is known; the *content quality* requires a draft-and-review cycle. No additional API or documentation research needed — the spec is known from v1.0 work.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All patterns verified against official docs + working code in this repo. Zero ambiguity on hook/agent/rule formats. No runtime dependency decisions to make. |
| Features | HIGH | Milestone scope is explicitly defined in PROJECT.md. Feature behavior verified against official docs and live hook examples. All four features are clearly specified. |
| Architecture | HIGH | Build order is dependency-driven and unambiguous. Component boundaries verified against existing architecture. All four components are independent of each other. |
| Pitfalls | HIGH | All critical pitfalls sourced from official docs + confirmed GitHub issues with issue numbers. Mitigation patterns are verified working code from this repo. |

**Overall confidence:** HIGH

### Gaps to Address

- **Agent system prompt content quality:** The format is known (HIGH confidence). The *quality* of the business rule extraction instructions is not verifiable until the agent is tested against a real `.context/domain/` file and codebase. Budget a test-and-refine cycle at the end of Phase 4.

- **`globs:` pattern matching with nested paths:** The `globs:` key works. Verify the exact patterns fire correctly for both `.context/**/*.md` (standard project layout) and `**/CONTEXT.md` (per-module context files anywhere in the source tree). Test early in Phase 3 before writing the rule content.

- **Monorepo cwd behavior:** Both hooks use `data.cwd` as the project root. If Claude Code runs from a subdirectory with `.context/` in a parent, hooks silently do nothing. This is acceptable scope for v1.1 (check `cwd` only, no tree traversal). Document the limitation in each hook's comments so future maintainers understand why.

## Sources

### Primary (HIGH confidence)
- Official Claude Code Hooks docs (`https://code.claude.com/docs/en/hooks`) — stdin/stdout schema, exit code semantics, PostToolUse MCP limitation, matcher format; verified 2026-03-16
- Official Claude Code Subagents docs (`https://code.claude.com/docs/en/sub-agents`) — frontmatter fields, tool restriction, context isolation, no-nested-spawning constraint; verified 2026-03-16
- Official Claude Code Memory/Rules docs (`https://code.claude.com/docs/en/memory`) — path-scoped rule behavior, load triggers; verified 2026-03-16
- `.claude/hooks/gsd-context-monitor.js` — PostToolUse boilerplate, debounce via session-scoped tmp file, stdin timeout guard pattern
- `.claude/hooks/gsd-check-update.js` — SessionStart boilerplate structure
- `.claude/agents/gsd-verifier.md` — agent frontmatter format, tools field as comma-separated string
- `.claude/settings.json` — existing hook registration format, array structure for GSD hooks

### Secondary (community-confirmed bug reports)
- GitHub issue #17204 — `globs:` works; `paths:` with YAML array/quotes fails silently (confirmed, unresolved as of 2026)
- GitHub issue #23478 — Rules only trigger on Read tool, not Write/Create (confirmed, closed NOT_PLANNED, Feb 2026)
- GitHub issue #24788 — PostToolUse `additionalContext` not surfaced for MCP tool calls (confirmed, Feb 2026)

---
*Research completed: 2026-03-16*
*Ready for roadmap: yes*
