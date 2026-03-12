# Context Manifest

> Claude Code tooling for the Domain Context specification — skills, hooks, agents, and installer.

## Access Levels

- **public**: Committed in `.context/`, available to all contributors

## Domain Concepts

- [Integration Model](domain/integration-model.md) — Three-concern model (How/What/Why), AGENTS.md bridge pattern, episodic→semantic extraction [public] [verified: 2026-03-11]
- [Claude Code Extensions](domain/claude-code-extensions.md) — Skills, hooks, agents, and rules taxonomy for Claude Code [public] [verified: 2026-03-11]

## Architecture Decisions

- [001: Single Project](decisions/001-single-project.md) — Single repo for both Claude Code and GSD integration [verified: 2026-03-11]
- [002: AGENTS.md Bridge](decisions/002-agents-md-bridge.md) — AGENTS.md as primary instruction file with thin CLAUDE.md pointer [verified: 2026-03-11]
- [003: No MCP for MVP](decisions/003-no-mcp-mvp.md) — File-based approach, no MCP server for initial release [verified: 2026-03-11]

## Constraints

(none yet)

## Module Context Files

(none — this project has no source modules, only configuration files)
