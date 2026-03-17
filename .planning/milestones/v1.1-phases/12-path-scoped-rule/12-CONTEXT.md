# Phase 12: Path-Scoped Rule - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a path-scoped rule file that automatically provides Domain Context spec formatting guidance when Claude reads `.context/` files or `CONTEXT.md` files anywhere in a project.

</domain>

<decisions>
## Implementation Decisions

### Rule Content & Structure
- Rule file at `rules/dc-context-editing.md` — matches project `rules/` directory convention with `dc-` prefix
- Concise bullet points (~30-40 lines) — rules load into context on every matching file read, so brevity is critical
- Reference `~/code/domain-context/SPEC.md` as the authoritative source for edge cases
- Cover both `.context/**` and `**/CONTEXT.md` in the globs frontmatter — same formatting conventions apply to module-level CONTEXT.md files

### Claude's Discretion
- Exact wording and organization of guidance bullets
- Whether to group by file type (MANIFEST.md, domain files, decisions, constraints) or by concern (formatting, naming, dates)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.context/domain/claude-code-extensions.md` — documents rules taxonomy: `globs` frontmatter, `.claude/rules/` install path, auto-loading behavior
- `templates/` directory — contains all 8 spec-compliant templates showing exact formatting expectations
- `tools/validate-context.sh` — 67 validation checks that encode the spec's formatting rules

### Established Patterns
- Claude Code rules: markdown files with `globs:` YAML frontmatter for path matching
- Rules auto-load when Claude reads/edits files matching the glob pattern
- No `allowed-tools` needed for rules (they're passive context injection)

### Integration Points
- Rule file in `rules/` will be copied to `.claude/rules/` by the installer (future milestone)
- Glob patterns must cover both `.context/**` (project-level) and `**/CONTEXT.md` (module-level)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The rule content should distill the most actionable guidance from the spec and templates.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
