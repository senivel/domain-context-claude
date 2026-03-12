# Domain Context for Claude Code

> Make Claude Code and GSD natively aware of your project's domain knowledge.

**domain-context-cc** provides skills, hooks, agents, and rules that integrate the [Domain Context specification](https://github.com/senivel/domain-context) into Claude Code. Initialize `.context/` directories, browse domain knowledge, validate integrity, and extract new knowledge from GSD planning artifacts.

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
3. Start working — Claude Code is now domain-context-aware

## Commands

| Command | Description |
|---------|-------------|
| `/dc:init` | Initialize `.context/` in any project |
| `/dc:explore` | Browse and summarize domain context |
| `/dc:validate` | Check manifest sync, freshness, orphans |
| `/dc:add` | Create a new domain concept, ADR, or constraint |
| `/dc:refresh` | Review and update stale entries |
| `/dc:extract` | Extract knowledge from GSD `.planning/` into `.context/` |

## GSD Integration

If you use [GSD](https://github.com/cyanheads/get-shit-done-cc), domain context works automatically through the AGENTS.md bridge pattern:

- `/dc:init` adds domain context pointers to your AGENTS.md
- CLAUDE.md imports AGENTS.md via `@AGENTS.md`
- GSD agents read CLAUDE.md → they see domain context → they make domain-aware decisions
- After completing GSD phases, run `/dc:extract` to promote new domain knowledge from `.planning/` into `.context/`

No GSD configuration changes needed.

## What Gets Installed

- **Skills**: `.claude/commands/dc/` — the six commands above
- **Hooks**: session-start freshness warnings, edit-time CONTEXT.md reminders
- **Agent**: domain validator for checking code against business rules
- **Rules**: formatting guidance when editing `.context/` files
- **Templates**: scaffolding files used by `/dc:init`

## Links

- [Domain Context Specification](https://github.com/senivel/domain-context)
- [GSD (Get Shit Done)](https://github.com/cyanheads/get-shit-done-cc)
