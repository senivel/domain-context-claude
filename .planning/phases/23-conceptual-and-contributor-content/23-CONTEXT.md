# Phase 23: Conceptual and Contributor Content - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers conceptual documentation (architecture/concepts, spec overview) and contributor onboarding (contributing guide). These pages help users understand the system's design and the specification it implements, and enable contributors to participate effectively.

</domain>

<decisions>
## Implementation Decisions

### Architecture & Concepts Page Depth
- Conceptual bridge pattern overview with a text diagram showing CLAUDE.md → AGENTS.md → .context/ chain
- Reproduce the module map table from ARCHITECTURE.md — clearest way to show component ownership
- Brief hook lifecycle section: what users observe (freshness warnings, edit-time reminders), not stdin/stdout internals
- Show .context/ directory tree with brief annotations — users need to understand what goes where

### Spec Overview Page Scope
- Cover what the spec is, its three pillars (domain concepts, decisions, constraints), required directory structure, and how this tool implements it — not a full spec reproduction
- Clear positioning: "The spec defines the format; this tool automates the workflow"
- One brief example showing a domain concept file structure — enough to understand the format
- Prominent link to github.com/senivel/domain-context at top and bottom

### Contributing Guide Content
- Step-by-step local dev setup: clone, `node bin/install.js --local`, validate, test with npm pack
- Code conventions: skill format, hook format, template format, naming conventions from AGENTS.md
- Brief PR process: fork, branch from main, imperative commit messages, context changes reviewed like code
- Brief directory listing with what each top-level dir contains — orients new contributors quickly

### Claude's Discretion
- Exact heading hierarchy within pages
- Whether to use Starlight admonitions (:::tip, :::note) for callouts
- Order of sections within each page
- Whether to include a "Prerequisites" section on the contributing guide

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ARCHITECTURE.md` — module map, data flow diagram, key boundaries, technology decisions (primary source for concepts page)
- `AGENTS.md` — build/run instructions, code conventions, workflow, project context (primary source for contributing guide)
- `.context/domain/integration-model.md` — three-concern model (How/What/Why), bridge pattern details
- `.context/domain/claude-code-extensions.md` — skills, hooks, agents, rules taxonomy
- `.context/decisions/` — ADR-001 (single project), ADR-002 (AGENTS.md bridge), ADR-003 (no MCP)
- `README.md` — GSD integration section, "What Gets Installed" breakdown

### Established Patterns
- Starlight content in `docs/src/content/docs/` as `.mdx` files
- Three sidebar groups: Start Here, Guides, Reference (from Phase 22)
- Concise/practical tone, short sentences, action-oriented (from Phase 22)
- Terminal code blocks, inline cross-refs at point of mention (from Phase 22)

### Integration Points
- Architecture/concepts page goes in `docs/src/content/docs/guides/` (Guides sidebar group)
- Spec overview page goes in `docs/src/content/docs/guides/` (Guides sidebar group)
- Contributing guide goes in `docs/src/content/docs/guides/` (Guides sidebar group)
- Cross-links to existing pages: user-guide.mdx, cli.mdx, quickstart.mdx

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches based on ARCHITECTURE.md, AGENTS.md, and spec content.

</specifics>

<deferred>
## Deferred Ideas

- Mermaid diagrams for architecture page — deferred to Phase 24 (Visual Enhancements)

</deferred>
