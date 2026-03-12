# ADR-001: Single Project for Claude Code and GSD Integration

<!-- verified: 2026-03-11 -->

## Status

Accepted

## Context

Domain Context needs tooling for two consumers: Claude Code (skills, hooks, agents, rules) and GSD (knowledge extraction from .planning/ artifacts). The question was whether to maintain separate repositories or a single project.

## Decision

A single project (`domain-context-cc`) provides both Claude Code and GSD integration.

## Rationale

- Both integrations are Claude Code configuration files — skills are markdown, hooks are Node.js, agents are markdown. There is no difference in artifact type.
- The GSD integration is thin: the AGENTS.md `@import` pattern automatically makes GSD agents domain-context-aware (since GSD agents read CLAUDE.md which imports AGENTS.md). The only GSD-specific addition is the `/dc:extract` skill.
- Separate repos would require coordinating versions, duplicating the installer, and splitting templates that serve both use cases.
- A single `npx domain-context-cc` install is simpler for users than installing two packages.

## Consequences

- The package has a dependency on GSD conventions (understanding .planning/ structure) even for users who don't use GSD. This is acceptable because `/dc:extract` simply does nothing if .planning/ doesn't exist.
- If GSD integration grows significantly, it could be extracted later without breaking the Claude Code integration.

## Affected Modules

- All modules — this decision shapes the entire project structure.
