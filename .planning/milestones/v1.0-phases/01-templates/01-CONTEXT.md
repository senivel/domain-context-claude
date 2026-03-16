# Phase 1: Templates - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Create and verify all template files against the Domain Context spec. Templates are the source-of-truth scaffolding that dc:init and other skills use to generate .context/ files in target projects. This phase delivers template files only — no skill logic, no hooks, no installer.

</domain>

<decisions>
## Implementation Decisions

### Placeholder token design
- Use `{placeholder}` syntax (single curly braces)
- Placeholder names use snake_case: `{project_name}`, `{one_line_description}`, `{verified_date}`
- Multi-line content uses a single prose placeholder (e.g., `{business_rules}`) — the skill handles markdown formatting at fill time
- No distinction between required and optional placeholders in the template — skills know which are required from spec knowledge

### Template completeness
- Include ALL spec-required sections in every template, even situational ones (e.g., Lifecycle in domain-concept.md) — skills can remove irrelevant sections at fill time
- Template file list: MANIFEST.md, CONTEXT.md (module-level), domain-concept.md, decision.md, constraint.md, AGENTS.md.snippet, architecture.md, claude.md
- architecture.md template included (even though not in TMPL-01) because dc:init needs it (INIT-03) and it has spec-defined required sections
- claude.md template included — the thin @AGENTS.md pointer file, templated for consistency
- No templates for sync-context.sh or .gitignore — those are project config, not spec files; dc:init generates them directly

### AGENTS.md snippet scope
- Snippet contains both "Project Context" and "Confidential Context" sections from the spec
- Static content — no placeholders needed, same for every project
- Wrapped in `<!-- domain-context:start -->` / `<!-- domain-context:end -->` sentinel comments for idempotent injection (INIT-04)
- References use both @-import syntax and plain path: `@.context/MANIFEST.md` (Claude Code aware, framework agnostic)

### Guidance content
- Templates include brief HTML comments near placeholders as inline guidance (e.g., `<!-- 2-4 sentences: what this concept is and its role -->`)
- One-line hints only — orient, don't tutor
- Skills strip all `<!-- guidance -->` comments when filling templates at runtime — clean output
- Verified date uses `{verified_date}` placeholder, filled with today's date at runtime

### Claude's Discretion
- Exact wording of guidance comments per section
- Whether any template needs additional non-spec sections for usability
- File naming within templates/ directory (e.g., `domain-concept.md` vs `domain.md`)

</decisions>

<specifics>
## Specific Ideas

- Templates must match the Domain Context spec at ~/code/domain-context/SPEC.md — Section 6 defines all required sections
- The spec's AGENTS.md snippet (Section 6.1) shows exact text for Project Context and Confidential Context sections
- MANIFEST.md template should include all four content sections: Domain Concepts, Architecture Decisions, Constraints, Module Context Files

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- No templates/ directory exists yet — this is a greenfield phase
- Existing .context/ files in this project (MANIFEST.md, domain concepts, decisions) serve as real-world examples of spec-compliant files

### Established Patterns
- Project uses kebab-case for all file names
- No runtime dependencies — Node.js built-ins only (relevant for any validation scripts)
- This project's own AGENTS.md and ARCHITECTURE.md follow the spec format and can serve as reference

### Integration Points
- templates/ directory will be read by dc:init skill (Phase 2)
- Installer (bin/install.js) copies templates/ to install location (~/.claude/domain-context/templates/ or .claude/domain-context/templates/)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-templates*
*Context gathered: 2026-03-11*
