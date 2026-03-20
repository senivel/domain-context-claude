[![npm version](https://img.shields.io/npm/v/domain-context-cc)](https://www.npmjs.com/package/domain-context-cc)
[![license](https://img.shields.io/github/license/senivel/domain-context-claude)](https://github.com/senivel/domain-context-claude/blob/main/LICENSE)

# Domain Context for Claude Code

**[Read the full documentation](https://senivel.github.io/domain-context-claude)**

> Make Claude Code and GSD natively aware of your project's domain knowledge.

**domain-context-cc** provides skills, hooks, agents, and rules that integrate the [Domain Context specification](https://github.com/senivel/domain-context) into Claude Code. Initialize `.context/` directories, browse domain knowledge, validate integrity, and extract new knowledge from GSD planning artifacts.

Requires Node.js 20+ and Claude Code.

## Installation

```bash
# Global install (recommended)
npx domain-context-cc

# Local install (project-specific)
npx domain-context-cc --local

# Uninstall
npx domain-context-cc --uninstall
```

## Quick Start

1. Install: `npx domain-context-cc`
2. Initialize a project: `/dc:init`
3. Start working -- Claude Code is now domain-context-aware

## Commands

| Command | Description |
|---------|-------------|
| `/dc:init` | Initialize `.context/` in any project |
| `/dc:explore` | Browse and summarize domain context |
| `/dc:validate` | Check manifest sync, freshness, orphans |
| `/dc:add` | Create a new domain concept, ADR, or constraint |
| `/dc:refresh` | Review and update stale entries |
| `/dc:extract` | Extract knowledge from GSD `.planning/` into `.context/` |

**`/dc:init`** -- Initialize Domain Context in the current project. Creates the `.context/` directory with MANIFEST.md, domain/, decisions/, and constraints/ subdirectories. Scaffolds ARCHITECTURE.md, wires AGENTS.md with the domain-context snippet, and creates CLAUDE.md with an `@AGENTS.md` pointer. Detects GSD projects and adds the bridge snippet automatically.

**`/dc:explore`** -- Browse and search domain context in the current project. Shows a summary of all entries with freshness status, supports keyword search, and lets you drill into specific entries. Use when you want to understand what domain knowledge exists.

**`/dc:validate`** -- Check structural integrity of domain context. Reports broken links, orphan files, stale entries, and AGENTS.md imports. Offers to fix issues found.

**`/dc:add`** -- Add a new domain concept, architecture decision, or constraint from a freeform description. Creates the file from the appropriate template and updates MANIFEST.md.

**`/dc:refresh`** -- Review stale domain context entries and update them based on current code reality. Identifies entries older than 90 days, assesses accuracy against source code, and proposes updates.

**`/dc:extract`** -- Extract domain knowledge from completed GSD phases into `.context/` entries. Scans planning artifacts, classifies findings into domain concepts, decisions, and constraints, and lets you selectively create entries.

## GSD Integration

If you use [GSD](https://github.com/cyanheads/get-shit-done-cc), domain context works automatically through the AGENTS.md bridge pattern:

- `/dc:init` adds domain context pointers to your AGENTS.md
- CLAUDE.md imports AGENTS.md via `@AGENTS.md`
- GSD agents read CLAUDE.md -- they see domain context -- they make domain-aware decisions
- After completing GSD phases, run `/dc:extract` to promote new domain knowledge from `.planning/` into `.context/`

No GSD configuration changes needed.

## What Gets Installed

- **Skills**: `.claude/commands/dc/` -- the six commands above
- **Hooks**: session-start freshness warnings, edit-time CONTEXT.md reminders, post-edit lint checks
- **Agent**: domain validator for checking code against business rules
- **Rules**: formatting guidance when editing `.context/` files
- **Templates**: scaffolding files used by `/dc:init`

## Development

For contributors working on domain-context-cc itself, use `--link` to symlink source files instead of copying. Edits to skills, hooks, and templates are immediately live — no re-install needed.

```bash
# Clone and link
git clone https://github.com/senivel/domain-context-claude.git
cd domain-context-claude
node bin/install.js --link
```

`--link` works with `--local` for project-scoped dev installs. Use `--uninstall` to remove symlinks the same way as copies.

## Uninstall

```bash
# Global uninstall
npx domain-context-cc --uninstall

# Local uninstall
npx domain-context-cc --local --uninstall
```

Removes dc-prefixed skill files, hooks, agents, rules, and templates. Cleans dc hook entries from settings.json while leaving other hooks intact.

## Links

- [Documentation](https://senivel.github.io/domain-context-claude) -- guides, architecture, CLI reference
- [Domain Context Specification](https://github.com/senivel/domain-context)
- [GSD (Get Shit Done)](https://github.com/cyanheads/get-shit-done-cc)
