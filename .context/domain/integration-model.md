# Integration Model

<!-- verified: 2026-03-11 -->

## What This Is

The integration model defines how Domain Context (The Why) connects to Claude Code's instruction system (The How) and GSD's planning artifacts (The What). It is the conceptual foundation for every skill, hook, and template in this project.

## Lifecycle

Domain context flows through three stages:

1. **Initialization** — `/dc:init` creates the .context/ structure and wires AGENTS.md to reference it
2. **Consumption** — AI agents read .context/ files during normal work, guided by MANIFEST.md for progressive disclosure
3. **Extraction** — `/dc:extract` promotes transient knowledge from GSD's .planning/ into durable .context/ files (episodic → semantic memory consolidation)

## Key Attributes

- **Three Concerns**: The How (AGENTS.md — procedural instructions), The What (.planning/ — current dev specs), The Why (.context/ — durable domain knowledge)
- **AGENTS.md Bridge**: AGENTS.md is vendor-neutral and references @ARCHITECTURE.md and @.context/MANIFEST.md. CLAUDE.md does `@AGENTS.md`. Since GSD agents read CLAUDE.md, they inherit domain context awareness without any GSD modifications.
- **Progressive Disclosure**: MANIFEST.md is cheap to scan (~300 tokens). Individual context files are loaded on-demand per task relevance.

## Business Rules

1. AGENTS.md MUST be the primary instruction file; CLAUDE.md is a thin pointer that imports it.
2. The AGENTS.md bridge pattern MUST NOT require modifications to GSD internals.
3. Knowledge extraction from .planning/ → .context/ MUST be an explicit user-initiated step (not automatic).
4. Context files MUST follow the formats defined in the Domain Context spec (~/code/domain-context/SPEC.md).

## Invariants

- Every project using domain-context-cc has an AGENTS.md that references @ARCHITECTURE.md and @.context/MANIFEST.md.
- The .context/ directory structure always includes MANIFEST.md, domain/, decisions/, and constraints/ subdirectories.

## Related Concepts

- [Claude Code Extensions](claude-code-extensions.md) — the specific extension points used to implement this model
- [ADR-002: AGENTS.md Bridge](../decisions/002-agents-md-bridge.md) — decision rationale for the bridge pattern
