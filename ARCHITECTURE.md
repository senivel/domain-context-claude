# Architecture

## System Purpose

Domain Context for Claude Code (`domain-context-cc`) provides the tooling that makes Claude Code and GSD natively aware of the Domain Context specification. It enables initializing, consuming, validating, and extracting domain knowledge as `.context/` directories in any project.

## Module Map

| Module | Owns | Key Domain Concepts | Dependencies |
|--------|------|---------------------|--------------|
| commands/dc/ | Skills (slash commands) for managing domain context | [Integration Model](/.context/domain/integration-model.md) | templates/, tools/ |
| hooks/ | Lifecycle scripts for passive domain-context awareness | [Claude Code Extensions](/.context/domain/claude-code-extensions.md) | .context/MANIFEST.md in target project |
| agents/ | Subagents for domain validation | — | .context/ in target project |
| rules/ | Path-specific editing guidance for .context/ files | — | — |
| templates/ | Scaffolding files copied to target projects by dc:init | — | ~/code/domain-context/SPEC.md (format source) |
| tools/ | Standalone validation script | — | — |
| bin/ | npm installer (npx entry point) | — | All other modules |

## Data Flow

```
npx domain-context-cc
  → bin/install.js copies files to ~/.claude/ (or ./.claude/)
  → hooks registered in settings.json

User runs /dc:init in a project
  → Reads templates/ from install location
  → Creates .context/, ARCHITECTURE.md, AGENTS.md, CLAUDE.md in target project

Session starts
  → hooks/dc-freshness-check.js reads .context/MANIFEST.md
  → Warns about stale entries via additionalContext

User edits code
  → hooks/dc-context-reminder.js checks for nearby CONTEXT.md
  → Reminds to update if relevant

User runs /dc:extract (GSD integration)
  → Reads .planning/ artifacts from completed phases
  → Cross-references against .context/
  → Proposes new domain files, ADRs, CONTEXT.md updates
```

## Key Boundaries

- This project produces **configuration files only** (markdown, JS hooks, shell scripts). No runtime library code.
- Skills operate on the **target project's** .context/, not this project's.
- The installer copies files but does **not** modify the target project's source code or .context/.
- Hooks must **never block** — graceful degradation (exit 0) on any error.

## Technology Decisions

- Node.js for hooks and installer — see [ADR-001](.context/decisions/001-single-project.md)
- No MCP server for MVP — see [ADR-003](.context/decisions/003-no-mcp-mvp.md)
- AGENTS.md as primary instruction file — see [ADR-002](.context/decisions/002-agents-md-bridge.md)
