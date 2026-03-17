# Phase 15: dc:init GSD Detection - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Modify the dc:init skill to detect GSD presence and inject the GSD bridge snippet into AGENTS.md. On re-run, update existing bridge content via sentinel replacement without duplication. Projects without GSD receive no bridge text.

</domain>

<decisions>
## Implementation Decisions

### GSD Detection Logic
- Detect GSD presence by checking for `.planning/PROJECT.md` (canonical GSD entry point)
- When `.planning/PROJECT.md` is absent, ask user "This project doesn't have GSD set up yet. Add GSD bridge to AGENTS.md anyway?" with Yes/No options
- GSD detection happens after Step 7 (AGENTS.md domain-context snippet) as a new Step 7.5
- New Step 7.5 keeps domain-context and GSD bridge logic cleanly separated

### Injection & Update Behavior
- GSD bridge appears after the domain-context snippet in AGENTS.md
- On re-run, replace content between `<!-- gsd-bridge:start -->` and `<!-- gsd-bridge:end -->` with fresh template (same sentinel pattern as domain-context snippet)
- If user previously had GSD bridge but removed GSD, leave existing bridge text — user can remove manually
- Two blank lines separate GSD bridge from domain-context snippet (matches Step 7's append pattern)

### User Interaction & Edge Cases
- Confirmation prompt: "This project doesn't have GSD set up yet. Add GSD bridge to AGENTS.md anyway?" with "Yes" / "No" options
- GSD bridge appears as a 9th tracked item in Step 10 summary: `AGENTS.md (GSD)` with created/skipped/updated status
- If AGENTS.md doesn't exist yet (Step 7 creates it), Step 7.5 appends GSD bridge separately for clean separation

### Claude's Discretion
No items delegated to Claude's discretion — all grey areas resolved.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `templates/gsd-agents-snippet.md` — GSD bridge template created in Phase 14 with `<!-- gsd-bridge:start/end -->` sentinels
- `templates/agents-snippet.md` — existing domain-context snippet with `<!-- domain-context:start/end -->` sentinels
- `commands/dc/init.md` — the skill file to modify (187 lines, 10 steps)

### Established Patterns
- Sentinel markers use `<!-- prefix:start -->` / `<!-- prefix:end -->` HTML comment format
- Step 7 handles AGENTS.md injection with 3 cases: create, skip (sentinel exists), append
- Template path resolution happens in Step 1 (local `.claude/domain-context/templates/` or global `~/.claude/domain-context/templates/`)
- Status tracking throughout steps for summary in Step 10

### Integration Points
- Step 7 (AGENTS.md snippet) — new Step 7.5 appends GSD bridge after this
- Step 10 (summary) — add 9th tracked item for GSD bridge status
- `templates/gsd-agents-snippet.md` — read from TEMPLATE_DIR like other templates

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
