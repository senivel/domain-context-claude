---
status: awaiting_human_verify
trigger: "docs-sidebar-missing: The documentation site's left sidebar navigation is not showing"
created: 2026-03-18T00:00:00Z
updated: 2026-03-18T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - index.mdx uses `template: splash` which suppresses sidebar in Starlight
test: Verified built HTML - splash page has no <nav class="sidebar">, quickstart page does
expecting: Removing splash template will restore sidebar on landing page
next_action: Apply fix - change template from splash to doc

## Symptoms

expected: Left sidebar navigation visible on all documentation pages with three groups: Start Here, Guides, Reference — containing quickstart, user-guide, architecture, spec-overview, contributing, and cli pages
actual: No left column sidebar showing. Only the landing page displays.
errors: No specific error messages reported
reproduction: Visit the docs site (locally via `cd docs && npm run dev` or the deployed GitHub Pages site)
started: Just completed building all docs content (phases 20-24). The sidebar config is in docs/astro.config.mjs with three autogenerate groups.

## Eliminated

## Evidence

- timestamp: 2026-03-18T00:01:00Z
  checked: astro.config.mjs sidebar configuration
  found: Three autogenerate groups correctly configured (getting-started, guides, reference). Directories and content files exist.
  implication: Sidebar config is correct, issue is not configuration

- timestamp: 2026-03-18T00:02:00Z
  checked: Built HTML output (dist/index.html vs dist/getting-started/quickstart/index.html)
  found: index.html has NO <nav class="sidebar"> element and contains `display: none` for sidebar. quickstart/index.html HAS full sidebar with Start Here, Guides, Reference groups.
  implication: Splash template suppresses sidebar; inner pages render it correctly

- timestamp: 2026-03-18T00:03:00Z
  checked: index.mdx frontmatter
  found: `template: splash` is set in frontmatter
  implication: This is the root cause - Starlight splash template intentionally hides sidebar

## Resolution

root_cause: index.mdx uses `template: splash` in frontmatter, which is a Starlight feature that suppresses the sidebar navigation and renders a full-width hero layout. The sidebar config in astro.config.mjs is correct and works on all non-splash pages.
fix: Removed `template: splash` from index.mdx frontmatter. The hero frontmatter is retained (works without splash template in Starlight). The page now uses the default doc layout which includes the sidebar.
verification: Built docs successfully. Confirmed dist/index.html now contains `<nav class="sidebar">` with Start Here, Guides, and Reference groups. Hero content is preserved.
files_changed: [docs/src/content/docs/index.mdx]
