# Phase 20: Scaffold Starlight Site - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up an Astro Starlight documentation site in `docs/` with its own package.json, isolated from the root npm package. The site must run locally with all framework defaults (sidebar, search, dark/light mode, code highlighting, responsive layout).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Root `package.json` uses `files` whitelist (commands/, agents/, hooks/, rules/, templates/, tools/, bin/) — docs/ is already implicitly excluded from npm tarball
- `.gitignore` has standard Node patterns but no docs-specific entries

### Established Patterns
- Project is CommonJS (`"type": "commonjs"`) with Node.js >=20
- Zero runtime dependencies — docs site should similarly be self-contained in its own directory

### Integration Points
- `docs/` directory will be new — no existing docs infrastructure
- Root package.json must remain unchanged
- npm pack dry-run must confirm docs/ exclusion

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>
