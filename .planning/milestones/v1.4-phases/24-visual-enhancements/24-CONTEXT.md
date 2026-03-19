# Phase 24: Visual Enhancements - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase adds visual polish to the documentation site: Mermaid diagrams on the architecture page and tabbed install variant blocks on the landing page and quickstart. No new content pages — only visual upgrades to existing pages.

</domain>

<decisions>
## Implementation Decisions

### Mermaid Diagram Design
- Two diagrams: (1) component relationship diagram showing module ownership and dependencies, (2) data flow diagram showing install → init → session → edit lifecycle
- Use Starlight's built-in Mermaid support (plugin or expressive-code integration) — no custom CSS
- Replace the existing text tree diagram with a Mermaid equivalent — cleaner rendering
- Default Mermaid theme with Starlight's dark/light mode — no custom styling

### Tabbed Install Variants
- Tabbed install blocks on landing page (index.mdx) and quickstart (quickstart.mdx)
- Tab labels: "Global (recommended)" and "Local"
- Use Starlight's built-in `<Tabs>` and `<TabItem>` components — zero config, dark/light compatible
- Add a third "Uninstall" tab on the quickstart page only

### Claude's Discretion
- Exact Mermaid diagram syntax and node labels
- Whether to add Mermaid as an Astro integration or use fenced code blocks
- Tab content wording (adapt from existing install commands)
- Order of tabs (Global first as recommended)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docs/src/content/docs/guides/architecture.mdx` — has text tree diagram to be replaced with Mermaid
- `docs/src/content/docs/index.mdx` — landing page with single install code block to become tabbed
- `docs/src/content/docs/getting-started/quickstart.mdx` — quickstart with install step to become tabbed
- `ARCHITECTURE.md` — module map and data flow for diagram content

### Established Patterns
- Starlight components imported at top of MDX files (Card, CardGrid, Steps already used)
- All content in `docs/src/content/docs/` as `.mdx` files
- Build: `cd docs && npm run build`

### Integration Points
- `docs/astro.config.mjs` may need Mermaid plugin configuration
- `docs/package.json` may need a Mermaid rendering package
- Existing pages edited in-place (no new files created for content)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard Starlight Mermaid and Tabs patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
