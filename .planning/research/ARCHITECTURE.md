# Architecture Research

**Domain:** Claude Code extension integration — hooks, rules, and agents added to existing skill project
**Researched:** 2026-03-16
**Confidence:** HIGH

## Context: This Is an Integration Research Document

This document supersedes the v1.0 ARCHITECTURE.md (2026-03-11) for the v1.1 milestone. It answers a single question: how do hooks, rules, and the domain-validator agent integrate into the architecture that already exists? The v1.0 research covers the skill layer in depth; that analysis is not repeated here.

## Existing Architecture (v1.0 Baseline)

```
domain-context-claude/
├── commands/dc/              [COMPLETE] 5 skill files
├── templates/                [COMPLETE] 8 template files
├── tools/validate-context.sh [COMPLETE] standalone validation
├── .claude/commands/dc/      [INSTALLED] live copies of skills
├── .claude/hooks/            [PARTIAL] GSD hooks present, no dc: hooks yet
├── .claude/agents/           [PARTIAL] GSD agents present, no dc: agents yet
└── .claude/settings.json     [LIVE] registers hooks; no dc: entries yet
```

The project uses a split layout: source files live in `commands/`, `hooks/`, `agents/`, `rules/` at the project root. Installed copies live in `.claude/`. The installer (`bin/install.js`, not yet built) bridges the two. For v1.1 work, files are created in the source directories and manually installed by copying to `.claude/`.

## New Components: What Gets Added

| Component | Source Path | Install Path | Claude Code Type |
|-----------|-------------|--------------|-----------------|
| dc-freshness-check.js | `hooks/dc-freshness-check.js` | `.claude/hooks/dc-freshness-check.js` | Hook (SessionStart) |
| dc-context-reminder.js | `hooks/dc-context-reminder.js` | `.claude/hooks/dc-context-reminder.js` | Hook (PostToolUse) |
| domain-context.md | `rules/domain-context.md` | `.claude/rules/domain-context.md` | Rule (path-scoped) |
| domain-validator.md | `agents/domain-validator.md` | `.claude/agents/domain-validator.md` | Agent (subagent) |

### What Does NOT Change

- No existing skill files are modified
- No templates change
- `settings.json` gains two new hook entries (append-only, existing entries preserved)
- The v1.0 skill layer is entirely unaffected

## System Overview (v1.1)

```
┌───────────────────────────────────────────────────────────────────┐
│                     Active Layer (user-invoked)                    │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────┐  ┌──────────┐  │
│  │ dc:init │  │dc:explore│  │dc:validate│  │dc:add│  │dc:refresh│  │
│  └─────────┘  └──────────┘  └──────────┘  └─────┘  └──────────┘  │
├───────────────────────────────────────────────────────────────────┤
│                  Passive Layer (automatic)   [NEW IN v1.1]         │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐   │
│  │  SessionStart Hook   │  │       PostToolUse Hook           │   │
│  │ dc-freshness-check   │  │     dc-context-reminder          │   │
│  │ Reads MANIFEST.md    │  │ Watches Write/Edit tool output   │   │
│  │ Warns if stale >90d  │  │ Reminds CONTEXT.md on edit       │   │
│  └──────────────────────┘  └──────────────────────────────────┘   │
├───────────────────────────────────────────────────────────────────┤
│               Contextual Layer (path-triggered)  [NEW IN v1.1]    │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │  Rule: rules/domain-context.md                            │    │
│  │  paths: [".context/**", "*/CONTEXT.md"]                   │    │
│  │  Auto-loaded when editing .context/ files                 │    │
│  └───────────────────────────────────────────────────────────┘    │
├───────────────────────────────────────────────────────────────────┤
│               On-Demand Layer (spawned)        [NEW IN v1.1]       │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │  Agent: agents/domain-validator.md                        │    │
│  │  tools: Read, Glob, Grep                                  │    │
│  │  Checks code against .context/ business rules             │    │
│  └───────────────────────────────────────────────────────────┘    │
├───────────────────────────────────────────────────────────────────┤
│                   Target Project Filesystem                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │.context/ │  │AGENTS.md │  │ CONTEXT.md   │  │ARCHITECTURE │  │
│  │MANIFEST  │  │          │  │ (per-module) │  │.md          │  │
│  └──────────┘  └──────────┘  └──────────────┘  └─────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

## Hook Integration

### How Claude Code Hooks Work (Verified Against Official Docs)

Hooks are registered in `settings.json` under `hooks.{EventName}`. Each entry is an object with a `hooks` array of command objects:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/dc-freshness-check.js" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/dc-context-reminder.js" }
        ]
      }
    ]
  }
}
```

**IMPORTANT:** The existing `settings.json` already has `SessionStart` and `PostToolUse` entries (GSD hooks). New entries must be appended to the existing arrays, not replace them. The structure is an array of hook group objects; the existing GSD entries occupy index 0. DC hooks go at index 1.

### SessionStart Hook: dc-freshness-check.js

**Trigger:** Once per session, when Claude Code starts.

**Input JSON from Claude Code (verified schema):**
```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/path/to/project",
  "permission_mode": "default",
  "hook_event_name": "SessionStart",
  "source": "startup",
  "model": "claude-sonnet-4-6"
}
```

**Behavior:**
1. Read `cwd` from input JSON
2. Check if `.context/MANIFEST.md` exists in `cwd`; if not, exit 0 silently
3. Parse `[verified: YYYY-MM-DD]` dates from MANIFEST.md entries
4. Count entries older than 90 days
5. If stale entries found: write `additionalContext` warning to stdout
6. Exit 0 always (never block session start)

**Output JSON:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Domain context warning: N entries are stale (>90 days)..."
  }
}
```

**Established pattern to copy:** `gsd-check-update.js` — same event, same boilerplate. The stdin drain pattern, JSON parse, try/catch, and exit 0 on error are all identical.

**Key difference from gsd-check-update.js:** That hook spawns a background process and returns immediately. This hook needs to parse MANIFEST.md synchronously before responding. Use synchronous `fs.readFileSync`, not `fs/promises`.

### PostToolUse Hook: dc-context-reminder.js

**Trigger:** After every tool use in the session.

**Input JSON from Claude Code (verified schema):**
```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/path/to/project",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/edited/file.ts",
    "content": "..."
  },
  "tool_response": {
    "filePath": "/path/to/edited/file.ts",
    "success": true
  },
  "tool_use_id": "toolu_01ABC123"
}
```

**Behavior:**
1. Read `tool_name` and `tool_input.file_path` from input
2. If tool is not Write or Edit, exit 0 silently
3. Derive the directory containing the edited file
4. Check if a `CONTEXT.md` exists in that directory or any parent up to project root
5. If CONTEXT.md exists nearby: write reminder to `additionalContext`
6. Exit 0 always

**Output JSON:** Same shape as SessionStart output, with `hookEventName: "PostToolUse"`.

**Established pattern to copy:** `gsd-context-monitor.js` — same event, same protocol. The stdin drain with 3-second timeout guard, JSON parse, try/catch, and exit 0 on error are the canonical pattern.

**Key difference:** gsd-context-monitor reads from a tmp file bridge. This hook reads from the input JSON directly (`tool_input.file_path`).

### settings.json Integration

The current `settings.json`:
```json
{
  "hooks": {
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "node .claude/hooks/gsd-check-update.js" }] }],
    "PostToolUse": [{ "hooks": [{ "type": "command", "command": "node .claude/hooks/gsd-context-monitor.js" }] }]
  }
}
```

After v1.1, each event's array gains one additional entry:
```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node .claude/hooks/gsd-check-update.js" }] },
      { "hooks": [{ "type": "command", "command": "node .claude/hooks/dc-freshness-check.js" }] }
    ],
    "PostToolUse": [
      { "hooks": [{ "type": "command", "command": "node .claude/hooks/gsd-context-monitor.js" }] },
      { "hooks": [{ "type": "command", "command": "node .claude/hooks/dc-context-reminder.js" }] }
    ]
  }
}
```

**This is a manual edit for v1.1.** The installer (future milestone) will automate this merge. The critical rule: never replace the hooks object, always append to existing arrays.

## Rule Integration

### How Claude Code Rules Work (Verified Against Official Docs)

Rules are markdown files in `.claude/rules/`. They load automatically based on `paths` frontmatter. When Claude reads or edits files matching the glob patterns, the rule file is injected into context.

**Format:**
```markdown
---
paths:
  - ".context/**"
  - "**/CONTEXT.md"
---

Rule content here in plain markdown.
```

Rules without `paths` frontmatter load at every session start (global rules). Rules with `paths` frontmatter load only when Claude works with matching files — this is the right choice for domain-context guidance because it is only relevant when editing `.context/` files.

### domain-context.md Rule

**Source:** `rules/domain-context.md`
**Install path:** `.claude/rules/domain-context.md`
**Trigger paths:**
```yaml
paths:
  - ".context/**"
  - "**/CONTEXT.md"
```

**Purpose:** When Claude edits any `.context/` file or a module-level `CONTEXT.md`, inject guidance on the Domain Context spec format, required sections, verified date placement, and MANIFEST.md update requirements.

**Content scope:** This file is guidance, not process. It should cover:
- Required sections for each file type (domain concept, decision, constraint)
- The `<!-- verified: YYYY-MM-DD -->` comment convention
- MANIFEST.md entry format when adding a new file
- What NOT to do (no auto-generating business rules from code)

**What it does NOT replace:** The dc:add and dc:validate skills. The rule provides ambient guidance when Claude is editing context files; the skills provide explicit commands for creating and validating them.

**Integration point with existing architecture:** The rule is purely additive. No existing files need to change. It is loaded automatically by Claude Code when the path conditions are met.

## Agent Integration

### How Claude Code Agents Work (Verified Against Official Docs)

Agents (subagents) are markdown files in `.claude/agents/` with YAML frontmatter. Required fields: `name`, `description`. Key optional fields: `tools`, `model`.

```markdown
---
name: domain-validator
description: When to invoke this agent
tools: Read, Glob, Grep
model: inherit
---

System prompt content here.
```

Agents are invoked when Claude delegates to them based on matching the task description to the agent's `description` field. They run in their own context window with only the system prompt above (not the full Claude Code system prompt).

**Tool access for domain-validator:** Read-only (Read, Glob, Grep). The agent checks code against rules; it does not modify files.

### domain-validator.md Agent

**Source:** `agents/domain-validator.md`
**Install path:** `.claude/agents/domain-validator.md`

**Purpose:** When invoked, read `.context/` domain concept files, extract business rules and invariants documented there, then scan the target codebase for code patterns that violate those rules.

**Invocation model:** Explicit delegation by the user ("check my code against the domain rules") or automatic delegation by Claude when it recognizes a validation task. The `description` field controls when Claude auto-delegates.

**Tool restriction rationale:** Read, Glob, Grep only (no Write, no Bash). The agent's job is checking, not modifying. Keeping it read-only prevents accidental changes and makes its behavior auditable.

**Relationship to dc:validate skill:** dc:validate checks structural integrity of the `.context/` directory (manifest sync, file existence, freshness). The domain-validator agent checks semantic integrity (does the code respect documented business rules?). These are complementary, not overlapping.

**Integration point with existing architecture:** Agents are self-contained. No existing skills, hooks, or rules depend on or call this agent. It is independently invokable.

## Data Flow Changes

### New: Session-Start Freshness Flow

```
Claude Code session starts
    |
    v
dc-freshness-check.js receives SessionStart JSON
    |
    v
Checks cwd for .context/MANIFEST.md
    |
    +-- Not found: exit 0 silently (not a domain-context project)
    |
    +-- Found: parse [verified: YYYY-MM-DD] from all entries
               |
               +-- All fresh: exit 0 silently
               |
               +-- Stale entries: write additionalContext warning
                   "N domain context entries are stale. Run /dc:refresh."
```

### New: Edit-Time CONTEXT.md Reminder Flow

```
Claude uses Write or Edit tool on any file
    |
    v
dc-context-reminder.js receives PostToolUse JSON
    |
    v
Extracts file_path from tool_input
    |
    +-- Tool is not Write/Edit: exit 0 silently
    |
    +-- Walk up from file directory toward project root
        looking for CONTEXT.md in same or parent dirs
        |
        +-- No CONTEXT.md found: exit 0 silently
        |
        +-- CONTEXT.md found nearby: write additionalContext reminder
            "Consider updating CONTEXT.md in [dir] if this change
             affects module-level business context."
```

### New: Path-Triggered Rule Flow

```
Claude reads or edits a file matching .context/** or **/CONTEXT.md
    |
    v
Claude Code loads .claude/rules/domain-context.md automatically
    |
    v
Rule content injected into Claude's context for the current operation
    |
    v
Claude applies Domain Context format guidance when writing the file
```

### New: On-Demand Validation Flow

```
User: "validate my code against the domain rules"
(or Claude auto-delegates based on task match)
    |
    v
domain-validator agent spawned in new context window
    |
    v
Agent reads .context/domain/*.md and .context/constraints/*.md
    |
    v
Agent extracts business rules and invariants
    |
    v
Agent globs/greps codebase for violations
    |
    v
Agent returns summary to main conversation
```

## Recommended Project Structure (v1.1 Complete)

```
domain-context-claude/
├── commands/dc/              # Skill source files (v1.0, unchanged)
│   ├── init.md
│   ├── explore.md
│   ├── validate.md
│   ├── add.md
│   └── refresh.md
├── hooks/                    # Hook source files [NEW IN v1.1]
│   ├── dc-freshness-check.js   # SessionStart hook
│   └── dc-context-reminder.js  # PostToolUse hook
├── agents/                   # Agent source files [NEW IN v1.1]
│   └── domain-validator.md     # Read-only domain rule checker
├── rules/                    # Rule source files [NEW IN v1.1]
│   └── domain-context.md       # Path-scoped .context/ editing guidance
├── templates/                # Template files (v1.0, unchanged)
└── .claude/
    ├── hooks/
    │   ├── gsd-check-update.js     # Existing GSD hook
    │   ├── gsd-context-monitor.js  # Existing GSD hook
    │   ├── dc-freshness-check.js   # [NEW] copied from hooks/
    │   └── dc-context-reminder.js  # [NEW] copied from hooks/
    ├── agents/
    │   ├── [existing GSD agents]
    │   └── domain-validator.md     # [NEW] copied from agents/
    ├── rules/
    │   └── domain-context.md       # [NEW] copied from rules/
    └── settings.json               # [MODIFIED] two new hook entries appended
```

## Component Boundaries

| Component | Inputs | Outputs | Depends On |
|-----------|--------|---------|------------|
| dc-freshness-check.js | SessionStart JSON (cwd, session_id) | additionalContext string or nothing | .context/MANIFEST.md in target project |
| dc-context-reminder.js | PostToolUse JSON (tool_name, file_path) | additionalContext string or nothing | CONTEXT.md files in target project |
| domain-context.md rule | File path matching .context/** | Injected guidance text | Domain Context spec (embedded in rule) |
| domain-validator.md agent | User prompt / Claude delegation | Validation report text | .context/ files in target project |

### What Does NOT Communicate

- Hooks do not call agents
- Agents do not trigger hooks
- Rules do not call skills or hooks
- New components do not modify existing skill files
- Hook outputs are advisory (additionalContext) — they cannot force behavior

## Build Order (Dependency-Driven)

```
Step 1: dc-freshness-check.js  (no dependencies except MANIFEST.md format, already known)
        |
        v
Step 2: dc-context-reminder.js  (no dependencies except PostToolUse JSON schema, now verified)
        |
        v
Step 3: settings.json update    (depends on both hooks existing; append to existing arrays)
        |
        v
Step 4: rules/domain-context.md  (no code dependencies; content depends on Domain Context spec)
        |
        v
Step 5: agents/domain-validator.md  (no code dependencies; content depends on understanding
                                      of .context/ file formats, established in v1.0)
```

**Rationale:**
- Hooks before settings.json update: must exist before being registered
- Hooks are independent of each other: can be built in any order, shown sequential for clarity
- Rule before agent: both are independent, but rule is simpler and validates understanding of .context/ format before encoding it in the agent's system prompt
- Agent last: most complex content to write; benefits from having worked through the hook and rule patterns first

**Total new files:** 4 source files + 1 settings.json modification

## Architectural Patterns

### Pattern 1: Passive Awareness (Hook Pattern)

**What:** A Node.js script that observes session/tool events via stdin JSON, performs a read-only check, and optionally injects advisory context. Never blocks, never writes files.

**When to use:** For notifications the user did not explicitly request — freshness warnings, CONTEXT.md reminders. The key is that these must be silent when not relevant and advisory (not imperative) when they fire.

**Established implementation:**
```javascript
// Boilerplate from gsd-context-monitor.js — copy exactly
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    // ... check logic ...
    // On nothing to report:
    process.exit(0);
    // On something to report:
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: data.hook_event_name,
        additionalContext: "..."
      }
    }));
  } catch (e) {
    process.exit(0); // Never throw, never block
  }
});
```

### Pattern 2: Path-Scoped Guidance (Rule Pattern)

**What:** A markdown file with `paths` frontmatter that is automatically injected when Claude works with matching files. Contains prescriptive guidance, not process steps.

**When to use:** When there are formatting conventions, required sections, or constraints that apply specifically to editing a particular file type — in this case, `.context/` domain knowledge files.

**Format:**
```markdown
---
paths:
  - ".context/**"
  - "**/CONTEXT.md"
---

# Domain Context Editing Guidelines

When editing .context/ files, follow the Domain Context spec format:
...
```

**Distinction from CLAUDE.md:** CLAUDE.md rules are global and always-loaded. Rules with `paths` frontmatter load only on demand, reducing context noise in sessions that never touch `.context/` files.

### Pattern 3: Read-Only Validator (Agent Pattern)

**What:** A subagent limited to Read, Glob, Grep that checks semantic correctness and returns a structured report. Runs in isolation; never modifies the project.

**When to use:** When validation requires reading multiple files and correlating findings — too complex for a hook, requires more depth than a skill's process steps can guide directly.

**Format:**
```markdown
---
name: domain-validator
description: Checks code against business rules in .context/. Use when validating implementation against documented domain constraints.
tools: Read, Glob, Grep
model: inherit
---

You are a domain rule validator...
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Hook That Reads Too Much

**What people do:** Parse every CONTEXT.md file in the project on every PostToolUse event to find relevant context.

**Why it's wrong:** PostToolUse fires after EVERY tool use. Reading dozens of files on every call adds latency to every operation. The hook becomes a performance problem.

**Do this instead:** Check only whether a CONTEXT.md exists in the same or parent directory as the edited file — a fast `fs.existsSync` check, not a recursive scan. The hook's job is to remind, not to summarize.

### Anti-Pattern 2: Imperative Hook Messages

**What people do:** Write hook messages that instruct Claude: "YOU MUST update CONTEXT.md now."

**Why it's wrong:** Hook messages that issue commands override user intent. The user may be making a quick tweak that doesn't warrant context updates. Imperative messages are annoying and erode trust.

**Do this instead:** Write advisory messages: "You may want to consider updating CONTEXT.md if this change affects module-level business context." Let Claude and the user decide.

### Anti-Pattern 3: Agent with Write Access

**What people do:** Give the domain-validator agent Write access so it can "fix" violations it finds.

**Why it's wrong:** An agent that silently modifies `.context/` files based on code analysis would produce generated descriptions, not documented business WHY. This violates the core principle of domain context: it captures intent, not code structure.

**Do this instead:** Read-only agent that reports findings. User decides which findings to address and how.

### Anti-Pattern 4: Global Rule for Domain Context

**What people do:** Put domain context editing guidance in CLAUDE.md or as a rule without `paths` frontmatter.

**Why it's wrong:** Guidance loads into every session's context, consuming tokens even when Claude never touches a `.context/` file. Over a day of typical use, this is wasted context.

**Do this instead:** Use `paths` frontmatter to scope the rule to `.context/**` and `**/CONTEXT.md`. It fires exactly when relevant and is silent otherwise.

## Integration Points

### With Existing Skills

| Existing Skill | New Component | Relationship |
|----------------|---------------|--------------|
| dc:validate | dc-freshness-check.js hook | Hook provides proactive warning; skill provides explicit deep validation. Complementary, not duplicated. |
| dc:refresh | dc-freshness-check.js hook | Hook surfaces staleness; skill does the actual refresh. Hook is the prompt, skill is the action. |
| dc:add / dc:init | domain-context.md rule | Rule provides ambient format guidance when editing .context/ files created by these skills. |
| dc:validate | domain-validator agent | Structural vs. semantic: validate checks file format/manifest sync; agent checks code against business rules. |

### With GSD

The new dc: hooks coexist with GSD hooks in `settings.json`. No GSD internals are modified. The hooks are additive entries in the existing arrays.

### External: Target Project

All four new components operate on the target project's `.context/` directory, the same as existing skills. The project itself remains configuration-only — no hooks or agents modify `domain-context-claude`'s own source files.

## Sources

- `.claude/hooks/gsd-context-monitor.js` — PostToolUse hook boilerplate pattern; HIGH confidence
- `.claude/hooks/gsd-check-update.js` — SessionStart hook structure; HIGH confidence
- `.claude/settings.json` — existing hook registration format; HIGH confidence
- `.context/domain/claude-code-extensions.md` — extension taxonomy; HIGH confidence
- Claude Code official docs (hooks): `https://code.claude.com/docs/en/hooks` — SessionStart and PostToolUse input/output schemas verified; HIGH confidence
- Claude Code official docs (subagents): `https://code.claude.com/docs/en/sub-agents` — agent frontmatter fields, tool restriction, invocation model verified; HIGH confidence
- Claude Code official docs (memory/rules): `https://code.claude.com/docs/en/memory` — `paths` frontmatter for rules verified; HIGH confidence

---
*Architecture research for: v1.1 hooks, rules, and agent integration*
*Researched: 2026-03-16*
