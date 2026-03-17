# Architecture Research

**Domain:** npm installer / packaging integration for Claude Code extension
**Researched:** 2026-03-17
**Confidence:** HIGH

## Context: This Is a v1.3 Integration Research Document

This document supersedes the v1.2 ARCHITECTURE.md for the v1.3 milestone. It answers a single question: how do `bin/install.js`, `package.json`, and `README.md` integrate with the architecture that already exists? The v1.0, v1.1, and v1.2 analyses are not repeated here — those layers are unchanged.

## Existing Architecture (v1.2 Baseline)

```
domain-context-claude/
├── commands/dc/              [6 skills] init, explore, validate, add, refresh, extract
├── hooks/                    [2 hooks] freshness-check, context-reminder
├── agents/                   [1 agent] domain-validator
├── rules/                    [1 rule] context-editing
├── templates/                [9 templates] manifest, architecture, agents-snippet,
│                              claude, context, domain-concept, decision, constraint,
│                              gsd-agents-snippet
├── tools/                    [1 script] validate-templates.sh
├── bin/                      [EMPTY — placeholder only]
└── .claude/                  [local dev copies, NOT shipped to users]
```

**Key patterns established:**
- Skills resolve templates from `~/.claude/domain-context/templates/` (global) or `.claude/domain-context/templates/` (local)
- Hooks registered under `SessionStart` and `PostToolUse` in `settings.json`
- `settings.json` hook entries use path-scoped `command` strings that must resolve at the target install location
- All Node.js hooks use built-ins only (fs, path, crypto, os) — zero runtime dependencies
- Hooks must exit 0 on all error paths (graceful degradation constraint)

## New Components: What Gets Added

| Component | Type | Source Path | Destination |
|-----------|------|-------------|-------------|
| `bin/install.js` | Node.js CLI script | `bin/install.js` | Runs via `npx domain-context-cc` at install time |
| `package.json` | npm package manifest | `package.json` | Consumed by npm/npx; never shipped to target projects |
| `README.md` | Documentation | `README.md` (already exists, needs expansion) | npm package page, GitHub |

### What Does NOT Change

- No existing skills, hooks, agents, rules, or templates are modified
- The `.claude/` directory in this repo is for local dev only and is not shipped
- The v1.0, v1.1, and v1.2 layers are entirely unaffected at runtime

## System Overview (v1.3)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Distribution Layer (NEW)                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  npm registry: domain-context-cc                                      │   │
│  │  npx domain-context-cc  →  bin/install.js                            │   │
│  │                                    |                                   │   │
│  │                   ┌────────────────┼────────────────┐                 │   │
│  │                   v                v                v                 │   │
│  │             --global           --local         --uninstall           │   │
│  │          ~/.claude/         ./.claude/          removes files         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│                          Target Project Filesystem                           │
│                         (what the installer writes)                          │
│  ┌───────────────────┐  ┌───────────────────┐  ┌──────────────────────┐    │
│  │  ~/.claude/        │  │  .claude/          │  │  ~/.claude/          │    │
│  │  commands/dc/      │  │  commands/dc/      │  │  settings.json       │    │
│  │  hooks/            │  │  hooks/            │  │  (hook entries       │    │
│  │  agents/           │  │  agents/           │  │   merged in)         │    │
│  │  rules/            │  │  rules/            │  └──────────────────────┘    │
│  │  domain-context/   │  │  domain-context/   │                              │
│  │    templates/      │  │    templates/      │                              │
│  └───────────────────┘  └───────────────────┘                              │
│         global                  local                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                     Active Layer (user-invoked, v1.0–v1.2, unchanged)        │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────┐  ┌──────────┐  ┌──────┐ │
│  │ dc:init │  │dc:explore│  │dc:validate│  │dc:add│  │dc:refresh│  │dc:   │ │
│  └─────────┘  └──────────┘  └──────────┘  └─────┘  └──────────┘  │extrac│ │
│                                                                     └──────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                  Passive Layer (hooks, v1.1, unchanged)                       │
│  ┌────────────────────────┐  ┌──────────────────────────────────────────┐   │
│  │  SessionStart Hook     │  │  PostToolUse Hook                         │   │
│  │  dc-freshness-check.js │  │  dc-context-reminder.js                  │   │
│  └────────────────────────┘  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component 1: bin/install.js

### Purpose

Copy all distributable files from the npm package to the target Claude Code configuration directory (`~/.claude/` for global, `.claude/` for local). Merge hook entries into the target `settings.json` without clobbering existing hooks. Support uninstall.

### Data Flow: Install

```
User runs: npx domain-context-cc [--local] [--uninstall]
    |
    v
bin/install.js starts
    |
    v
Parse argv:
    --local     → INSTALL_DIR = path.join(process.cwd(), '.claude')
    --uninstall → run uninstall flow
    (default)   → INSTALL_DIR = path.join(os.homedir(), '.claude')
    |
    v
Resolve SOURCE_DIR = path of the npm package itself
    (use __dirname or path.resolve(__dirname, '..') depending on bin/ depth)
    |
    v
Create target directories (mkdir -p):
    INSTALL_DIR/commands/dc/
    INSTALL_DIR/hooks/
    INSTALL_DIR/agents/
    INSTALL_DIR/rules/
    INSTALL_DIR/domain-context/templates/
    |
    v
Copy files (fs.copyFileSync, overwrite):
    commands/dc/*.md    → INSTALL_DIR/commands/dc/
    hooks/*.js          → INSTALL_DIR/hooks/
    agents/*.md         → INSTALL_DIR/agents/
    rules/*.md          → INSTALL_DIR/rules/
    templates/*         → INSTALL_DIR/domain-context/templates/
    |
    v
Merge settings.json:
    (see settings.json merge strategy below)
    |
    v
Print success summary
```

### Data Flow: Uninstall

```
User runs: npx domain-context-cc --uninstall
    |
    v
Resolve INSTALL_DIR (same logic as install)
    |
    v
Remove files installed by domain-context-cc:
    INSTALL_DIR/commands/dc/*.md  (rmdir if empty)
    INSTALL_DIR/hooks/dc-*.js
    INSTALL_DIR/agents/dc-*.md
    INSTALL_DIR/rules/dc-*.md
    INSTALL_DIR/domain-context/  (rmdir if empty)
    |
    v
Remove hook entries from settings.json:
    Read settings.json, remove only dc hook entries, write back
    |
    v
Print success summary
```

### Source Directory Resolution

The installer runs from the npm cache as an npx one-shot. `__dirname` refers to the `bin/` directory inside the unpacked package. Source files live one level up:

```javascript
const PKG_ROOT = path.resolve(__dirname, '..');
const SOURCES = {
  commands: path.join(PKG_ROOT, 'commands', 'dc'),
  hooks:    path.join(PKG_ROOT, 'hooks'),
  agents:   path.join(PKG_ROOT, 'agents'),
  rules:    path.join(PKG_ROOT, 'rules'),
  templates: path.join(PKG_ROOT, 'templates'),
};
```

This is straightforward because `package.json` `bin` entry points to `bin/install.js` and all source dirs are at the package root.

### Hook Command Path Conventions

This is the most critical integration detail. Hooks registered in `settings.json` use command strings that Claude Code resolves at runtime. The path format must match where the hook file is installed:

**Global install:**
```json
"command": "node \"/Users/<user>/.claude/hooks/dc-freshness-check.js\""
```

**Local install:**
```json
"command": "node \".claude/hooks/dc-freshness-check.js\""
```

The installer must generate these strings using the actual resolved path, not a hardcoded template. For global install, expand `os.homedir()`. For local install, use a relative path from the project root (`.claude/hooks/...`).

**Why absolute paths for global:** `~` is not expanded by Claude Code's hook runner. The existing GSD install (in `~/.claude/settings.json`) uses full absolute paths: `"node \"/Users/alevine/.claude/hooks/gsd-check-update.js\""`. Follow this pattern.

**Why relative paths for local:** The project's `.claude/settings.json` uses relative paths: `"node hooks/dc-freshness-check.js"`. This allows the project to be moved without breaking local hooks.

## Component 2: settings.json Merge Strategy

### The Core Problem

`settings.json` belongs to the user. It may already contain:
- Other tools' hooks (GSD hooks, custom hooks)
- `env`, `permissions`, `statusLine`, `enabledPlugins` keys
- Other `SessionStart` and `PostToolUse` hook arrays

The installer must add dc hooks without:
1. Deleting existing hooks
2. Creating duplicate entries on re-install
3. Corrupting the JSON
4. Changing the order of unrelated keys

### Merge Algorithm

```
function mergeSettings(installDir, dcHookEntries):
    settingsPath = path.join(installDir, 'settings.json')

    // Load existing settings or start with empty object
    if file exists:
        existing = JSON.parse(readFile(settingsPath))
    else:
        existing = {}

    // Ensure hooks key structure exists
    existing.hooks = existing.hooks || {}
    existing.hooks.SessionStart = existing.hooks.SessionStart || []
    existing.hooks.PostToolUse = existing.hooks.PostToolUse || []

    // For each DC hook entry to add:
    for entry in dcHookEntries:
        // Dedup: check if a hook with this exact command already exists
        hookCommand = entry.hooks[0].command
        targetArray = existing.hooks[entry.event]  // SessionStart or PostToolUse
        alreadyPresent = targetArray.some(
            existing => existing.hooks?.[0]?.command === hookCommand
        )
        if not alreadyPresent:
            targetArray.push(entry)

    // Write back (preserves all existing keys, only hooks array is mutated)
    writeFile(settingsPath, JSON.stringify(existing, null, 2))
```

### Hook Entries to Inject

**Global install (`~/.claude/settings.json`):**

```json
{
  "event": "SessionStart",
  "hooks": [{
    "type": "command",
    "command": "node \"/Users/<user>/.claude/hooks/dc-freshness-check.js\""
  }]
}
```

```json
{
  "event": "PostToolUse",
  "matcher": "Edit|Write|MultiEdit",
  "hooks": [{
    "type": "command",
    "command": "node \"/Users/<user>/.claude/hooks/dc-context-reminder.js\""
  }]
}
```

**Local install (`.claude/settings.json`):**

```json
{
  "event": "SessionStart",
  "hooks": [{
    "type": "command",
    "command": "node \".claude/hooks/dc-freshness-check.js\""
  }]
}
```

```json
{
  "event": "PostToolUse",
  "matcher": "Edit|Write|MultiEdit",
  "hooks": [{
    "type": "command",
    "command": "node \".claude/hooks/dc-context-reminder.js\""
  }]
}
```

### Uninstall Hook Removal

Match hook entries to remove by command string suffix (the filename):

```javascript
const DC_HOOK_COMMANDS = [
  'dc-freshness-check.js',
  'dc-context-reminder.js',
];

// Remove any hook entry whose command ends with a dc hook filename
existing.hooks.SessionStart = existing.hooks.SessionStart.filter(
  entry => !DC_HOOK_COMMANDS.some(
    cmd => entry.hooks?.[0]?.command?.endsWith(cmd)
  )
);
// same for PostToolUse
```

This removes dc hooks regardless of the path prefix, so it works whether originally installed globally or locally.

## Component 3: package.json

### Structure

```json
{
  "name": "domain-context-cc",
  "version": "1.3.0",
  "description": "Claude Code extension for Domain Context specification — skills, hooks, agents, rules",
  "bin": {
    "domain-context-cc": "bin/install.js"
  },
  "files": [
    "bin/",
    "commands/",
    "hooks/",
    "agents/",
    "rules/",
    "templates/",
    "README.md"
  ],
  "engines": {
    "node": ">=18"
  },
  "license": "MIT"
}
```

**`files` field is the critical gating mechanism.** Only listed paths are included in the npm tarball. This prevents shipping `.claude/` (local dev copies), `.planning/`, `.git/`, `tools/` (dev-only validation script), `.context/`, `.gitignore`, `PLAN.md`, `ARCHITECTURE.md`, `AGENTS.md`, `CLAUDE.md`.

**No `main` field** — this is a CLI tool, not a library. The `bin` entry is sufficient.

**No `dependencies`** — existing constraint (Node.js built-ins only). The package installs zero dependencies.

**`engines.node: ">=18"`** — Node 18+ for stable `fs.cpSync` (available since Node 16.7 but stable in 18). If targeting older Node, use manual recursive copy instead.

### Integration with README.md

The README already exists and documents the CLI flags (`--local`, `--uninstall`). The v1.3 work expands it to include:
- What gets installed (file list per install mode)
- Uninstall instructions
- Upgrade path (`npx domain-context-cc` again — overwrites existing files)

## Architectural Patterns

### Pattern 1: Package Root Resolution via __dirname

**What:** Resolve all source paths relative to `__dirname` in `bin/install.js`, treating the package root as `path.resolve(__dirname, '..')`.

**When to use:** Any Node.js CLI in an npm package where the bin script is in a subdirectory.

**Trade-offs:** Simple and reliable. Works in npx (temp cache dir), global npm install, and local dev. No reliance on `npm_package_*` env vars which are absent in npx context.

### Pattern 2: Additive-Only JSON Merge

**What:** Read existing JSON, add new entries, write back. Never replace existing top-level keys or remove array entries that belong to other tools.

**When to use:** Any installer that shares a config file (`settings.json`) with other tools.

**Trade-offs:** Safe but requires dedup logic. Uninstall must track which entries were added. Dedup by command string is simpler than by entry identity hash — the command string is the semantic identifier of a hook.

### Pattern 3: Idempotent Install

**What:** Running the installer twice produces the same result as running it once. Achieved by: overwriting files (copyFileSync), deduplicating hook entries before appending.

**When to use:** All installers. Users will re-run `npx domain-context-cc` to upgrade.

**Trade-offs:** Requires the dedup check in merge. File overwrite means in-place upgrades work transparently (no version tracking needed in the installer itself).

### Pattern 4: Suffix-Based Hook Matching for Uninstall

**What:** Identify dc-owned hook entries by checking if the command string ends with a known dc hook filename (`dc-freshness-check.js`, `dc-context-reminder.js`).

**When to use:** Uninstall flows where the exact command path varies by OS, user, or install mode.

**Trade-offs:** Slightly fragile if user has a non-dc hook with the same filename (unlikely in practice). Alternative is writing a manifest of installed hook commands at install time — adds complexity without meaningful benefit.

## Data Flow Diagrams

### Install Flow (Global)

```
npx domain-context-cc
    |
    v
bin/install.js
    |
    +--[resolve PKG_ROOT from __dirname]
    |
    +--[resolve INSTALL_DIR = ~/.claude/]
    |
    +--[mkdir -p for 5 target directories]
    |
    +--[copyFileSync: 6 skills → INSTALL_DIR/commands/dc/]
    +--[copyFileSync: 2 hooks  → INSTALL_DIR/hooks/]
    +--[copyFileSync: 1 agent  → INSTALL_DIR/agents/]
    +--[copyFileSync: 1 rule   → INSTALL_DIR/rules/]
    +--[copyFileSync: 9 templates → INSTALL_DIR/domain-context/templates/]
    |
    +--[read INSTALL_DIR/settings.json (or {})]
    +--[append SessionStart hook entry if not present]
    +--[append PostToolUse hook entry if not present]
    +--[write INSTALL_DIR/settings.json]
    |
    v
stdout: "domain-context-cc installed globally."
stdout: "  Skills:    ~/.claude/commands/dc/ (6 files)"
stdout: "  Hooks:     ~/.claude/hooks/ (2 files)"
stdout: "  Templates: ~/.claude/domain-context/templates/ (9 files)"
stdout: "  Hooks registered in ~/.claude/settings.json"
```

### Install Flow (Local)

Identical to global, with `INSTALL_DIR = path.join(process.cwd(), '.claude')` and relative hook command paths in settings.json.

### Uninstall Flow

```
npx domain-context-cc --uninstall
    |
    v
bin/install.js --uninstall
    |
    +--[resolve INSTALL_DIR]
    |
    +--[remove INSTALL_DIR/commands/dc/*.md]
    +--[rmdir INSTALL_DIR/commands/dc/ if empty]
    +--[remove INSTALL_DIR/hooks/dc-*.js]
    +--[remove INSTALL_DIR/agents/dc-*.md]
    +--[remove INSTALL_DIR/rules/dc-*.md]
    +--[remove INSTALL_DIR/domain-context/ tree]
    |
    +--[read INSTALL_DIR/settings.json]
    +--[filter out dc hook entries by command suffix]
    +--[write INSTALL_DIR/settings.json]
    |
    v
stdout: "domain-context-cc uninstalled."
```

## Component Boundaries

| Component | Inputs | Outputs | Depends On |
|-----------|--------|---------|------------|
| `bin/install.js` | `argv` (--local, --uninstall), source files in PKG_ROOT, existing `settings.json` | Copied files in INSTALL_DIR, merged `settings.json` | Node.js `fs`, `path`, `os` (built-ins only) |
| `package.json` | npm registry, `files` field | npm tarball shipped to users | `bin/install.js` existing, `files` list accurate |
| `README.md` | Existing content (already accurate for commands) | Updated with install/uninstall/what-gets-installed sections | Current install UX decisions |

### Communication Map

```
npm publish reads package.json → generates tarball containing files listed in "files"
    |
    v
npx domain-context-cc → npm downloads tarball → runs bin/install.js
    |
    v
bin/install.js reads:
    PKG_ROOT/commands/dc/*.md
    PKG_ROOT/hooks/*.js
    PKG_ROOT/agents/*.md
    PKG_ROOT/rules/*.md
    PKG_ROOT/templates/*

bin/install.js writes:
    INSTALL_DIR/commands/dc/*.md      (skills)
    INSTALL_DIR/hooks/*.js            (hooks)
    INSTALL_DIR/agents/*.md           (agent)
    INSTALL_DIR/rules/*.md            (rule)
    INSTALL_DIR/domain-context/templates/*  (templates)
    INSTALL_DIR/settings.json         (merged, not overwritten)
```

### What Does NOT Communicate

- `bin/install.js` does not execute any hooks — it only copies and registers them
- `bin/install.js` does not read or write `.context/` directories — that is dc:init's domain
- `package.json` has no runtime effect — it is consumed by npm tooling only
- `README.md` is documentation — no code dependency on it
- `tools/validate-templates.sh` is NOT included in the npm package (dev-only)

## Anti-Patterns

### Anti-Pattern 1: Replacing settings.json Instead of Merging

**What people do:** Write a full `settings.json` template and overwrite the existing file.

**Why it's wrong:** Destroys existing hook registrations from GSD, user customizations, `env`, `permissions`, `enabledPlugins` keys. This is the most destructive mistake an installer can make.

**Do this instead:** Read, merge by appending to arrays with dedup, write back.

### Anti-Pattern 2: Hardcoding ~/.claude Path as a String

**What people do:** `const installDir = path.join(os.homedir(), '.claude');` as a hardcoded literal, then also emit hook commands like `"node ~/.claude/hooks/dc-freshness-check.js"`.

**Why it's wrong:** `~` is a shell expansion that Claude Code's hook runner may not expand. The GSD installer uses fully resolved absolute paths. Tilde in the command string fails on some environments.

**Do this instead:** Use `os.homedir()` in JavaScript and emit the fully resolved path into the command string.

### Anti-Pattern 3: Including .claude/ in the npm Package

**What people do:** List `.claude/` in the `files` field, shipping the local dev copies.

**Why it's wrong:** The `.claude/` directory in this repo contains `settings.json` with local dev hook commands (`"node hooks/dc-freshness-check.js"` relative to the repo root). Shipping this and installing it to the user's `~/.claude/` would register broken hook paths.

**Do this instead:** `files` field lists only `bin/`, `commands/`, `hooks/`, `agents/`, `rules/`, `templates/`, `README.md`. The installer reads from these source directories and writes to INSTALL_DIR with correct paths.

### Anti-Pattern 4: Assuming settings.json Exists

**What people do:** `JSON.parse(fs.readFileSync(settingsPath, 'utf8'))` without checking if the file exists first.

**Why it's wrong:** Fresh Claude Code installs have no `settings.json`. New users will get a crash.

**Do this instead:** `fs.existsSync(settingsPath) ? JSON.parse(...) : {}` — start from empty object if missing.

## Build Order (Dependency-Driven)

```
Phase 1: package.json
         (no code dependencies; defines what gets shipped; must be correct
          before install can be tested end-to-end with npm pack)
         |
         v
Phase 2: bin/install.js
         (depends on: knowing final file paths, hook command format,
          settings.json merge strategy)
         (can be dev-tested without npm pack using node bin/install.js directly)
         |
         v
Phase 3: README.md expansion
         (depends on: knowing final install UX — flags, what gets installed,
          upgrade path; documents what Phase 2 actually implements)
```

**Rationale:**
- `package.json` first: the `files` field determines what ships. Defining it first ensures bin/ and all source dirs are correctly enumerated before writing code that depends on the package layout.
- `bin/install.js` second: the core deliverable. Can be tested locally with `node bin/install.js` before packaging.
- README last: documents the implemented behavior. Writing docs before the behavior is final risks having to revise them.

**Testing approach for each phase:**
- Phase 1: `npm pack --dry-run` to verify tarball contents
- Phase 2: `node bin/install.js` locally, then `npm pack && npx ./domain-context-cc-*.tgz` for end-to-end
- Phase 3: Read the README as a new user; does it answer "how do I install?" and "what happens?"

**Total new/modified files:**
- 1 new file: `package.json`
- 1 new file: `bin/install.js`
- 1 modified file: `README.md` (expanded install and what-gets-installed sections)

## Scalability Considerations

This is a file-copy installer, not a service. Scaling is not a concern. The only relevant "scale" question is: does the installer work when `~/.claude/settings.json` is very large (many existing hooks)?

Answer: Yes. JSON.parse/stringify handles arbitrarily large files. The dedup check is O(n) on the number of existing hook entries — negligible at any realistic size.

## Sources

- `/Users/alevine/.claude/settings.json` — real global settings.json structure showing GSD hook format (absolute paths, proper array structure); HIGH confidence
- `/Users/alevine/code/domain-context-claude/.claude/settings.json` — local dev settings.json showing local hook format (relative paths); HIGH confidence
- `hooks/dc-freshness-check.js`, `hooks/dc-context-reminder.js` — hook file names that must be referenced in settings.json command strings; HIGH confidence
- `commands/dc/init.md` (execution_context) — established template resolution pattern (local vs global TEMPLATE_DIR); HIGH confidence
- `.planning/PROJECT.md` — v1.3 scope, target flags (--global, --local, --uninstall); HIGH confidence
- `README.md` (existing) — already documents install UX; confirms CLI flag conventions; HIGH confidence

---
*Architecture research for: v1.3 Installation & Distribution (bin/install.js, package.json, README)*
*Researched: 2026-03-17*
