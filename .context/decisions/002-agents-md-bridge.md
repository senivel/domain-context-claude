# ADR-002: AGENTS.md Bridge Pattern

<!-- verified: 2026-03-11 -->

## Status

Accepted

## Context

GSD agents need access to domain context, but modifying GSD's internals is not viable — GSD is a separate project with its own release cycle. We needed a way to make GSD agents domain-context-aware without changing GSD code.

## Decision

Use AGENTS.md as the primary instruction file (vendor-neutral). CLAUDE.md contains only `@AGENTS.md` plus any Claude-specific additions. The `dc:init` skill appends a "Project Context" section to AGENTS.md that references @ARCHITECTURE.md and @.context/MANIFEST.md.

## Rationale

- GSD agents read CLAUDE.md at session start. CLAUDE.md imports AGENTS.md via `@AGENTS.md`. Therefore, GSD agents automatically see the domain context pointers in AGENTS.md.
- AGENTS.md is vendor-neutral (originated by OpenAI, adopted broadly). Using it as the primary file means domain context works with any AI coding tool, not just Claude Code.
- The thin CLAUDE.md pointer pattern keeps Claude-specific instructions (skill format, hook registration) separate from vendor-neutral project instructions.
- This requires zero changes to GSD — it works through the existing `@import` mechanism.

## Consequences

- Projects must maintain two files (AGENTS.md + CLAUDE.md) instead of one. The overhead is minimal since CLAUDE.md is typically 5-10 lines.
- Tools that don't support `@import` syntax will only see CLAUDE.md's content, not AGENTS.md. The explicit path references in AGENTS.md (without `@`) ensure the information is still useful as plain text.

## Affected Modules

- commands/dc/init.md — creates both files
- templates/AGENTS.md.snippet — the text appended to AGENTS.md
