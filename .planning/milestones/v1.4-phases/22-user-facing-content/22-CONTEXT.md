# Phase 22: User-Facing Content - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers all user-facing documentation content: landing page, quickstart guide, user guide, and CLI command reference. It transforms the scaffolded Starlight site into a complete documentation resource that lets users learn about, install, and use every feature of domain-context-cc.

</domain>

<decisions>
## Implementation Decisions

### Content Structure & Navigation
- Three sidebar groups: "Start Here", "Guides", "Reference"
- Single-page quickstart (not multi-step wizard)
- Single-page CLI reference with anchor sections per command
- Splash hero landing page with value prop and install command

### Content Tone & Depth
- Concise and practical tone, short sentences, action-oriented
- CLI reference: usage syntax + 1-line description + 2-3 examples with output
- Terminal output code blocks (no screenshots)
- Single recommended install path (global npx) with note about local

### Content Sourcing & Flow
- Source CLI command details from skill files in `commands/dc/` (usage, description, process steps)
- Inline links at point of mention for cross-references (e.g., "see [CLI Reference](/reference/cli)")
- GSD integration as a dedicated subsection in the user guide — brief explanation of `dc:extract` and GSD bridge
- README.md workflow sections as primary content source for quickstart and user guide

### Claude's Discretion
- Page ordering within sidebar groups
- Exact heading hierarchy within pages
- Whether to include a "What is Domain Context?" intro paragraph on the landing page vs jumping straight to value prop

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `commands/dc/init.md` — full init workflow, template list, GSD detection logic
- `commands/dc/explore.md` — manifest parsing, freshness display, search
- `commands/dc/validate.md` — validation checks, fix offers
- `commands/dc/add.md` — domain concept/ADR/constraint creation
- `commands/dc/refresh.md` — staleness review, code-aware assessment
- `commands/dc/extract.md` — GSD phase extraction into .context/
- `README.md` — comprehensive install instructions, command table, GSD integration section, "What Gets Installed" breakdown

### Established Patterns
- Starlight content in `docs/src/content/docs/` as `.mdx` files
- Sidebar configured in `docs/astro.config.mjs` with label + autogenerate groups
- Site deployed at `https://senivel.github.io/domain-context-claude/`

### Integration Points
- `docs/astro.config.mjs` sidebar config needs expansion from 1 group to 3
- `docs/src/content/docs/index.mdx` exists as placeholder — needs hero content
- New directories needed: `docs/src/content/docs/guides/`, `docs/src/content/docs/reference/`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches based on README and skill file content.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
