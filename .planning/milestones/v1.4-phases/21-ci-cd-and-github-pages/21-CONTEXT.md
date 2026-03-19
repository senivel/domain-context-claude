# Phase 21: CI/CD and GitHub Pages - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a GitHub Actions workflow that builds and deploys the Starlight docs site to GitHub Pages on pushes to `docs/**` on main. Configure the correct base URL (`/domain-context-claude/`) and add a CI link checker that fails the workflow on broken links.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docs/astro.config.mjs` — Starlight config, no base URL configured yet
- `docs/package.json` — has `build` and `preview` scripts
- No `.github/workflows/` directory exists yet

### Established Patterns
- Isolated docs/ project with its own package.json and node_modules
- Astro 6.x with Starlight 0.38.x

### Integration Points
- `docs/astro.config.mjs` needs `base` and `site` configuration for GitHub Pages
- `.github/workflows/` — new directory for CI/CD workflow
- GitHub Pages deployment target: `https://senivel.github.io/domain-context-claude/`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>
