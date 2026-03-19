---
phase: 20-scaffold-starlight-site
plan: 01
subsystem: infra
tags: [astro, starlight, documentation, static-site]

requires: []
provides:
  - Starlight documentation site scaffolded in docs/ with own package.json
  - Astro build pipeline producing static HTML with Pagefind search index
  - Splash landing page at docs/src/content/docs/index.mdx
affects: [21-content-architecture, 22-write-core-guides, 23-api-reference, 24-deploy-github-pages]

tech-stack:
  added: [astro 6.x, "@astrojs/starlight 0.38.x"]
  patterns: [isolated-subdirectory-project, content-collection-with-docsLoader]

key-files:
  created:
    - docs/package.json
    - docs/astro.config.mjs
    - docs/tsconfig.json
    - docs/src/content.config.ts
    - docs/src/content/docs/index.mdx
  modified:
    - .gitignore

key-decisions:
  - "Starlight social config uses new array syntax (v0.33+) with icon/label/href properties"
  - "Manual scaffolding instead of interactive npm create wizard for deterministic results"

patterns-established:
  - "Isolated docs/ project: all docs commands run inside docs/, root package.json untouched"
  - "Content collection schema: docsLoader + docsSchema in src/content.config.ts (Astro 6 API)"

requirements-completed: [INFRA-01, INFRA-04]

duration: 2min
completed: 2026-03-17
---

# Phase 20 Plan 01: Scaffold Starlight Site Summary

**Astro Starlight documentation site in docs/ with sidebar nav, Pagefind search, dark/light toggle, Expressive Code, and responsive layout -- all framework defaults, zero custom CSS**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-17T23:46:51Z
- **Completed:** 2026-03-17T23:49:25Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Scaffolded complete Starlight project in docs/ with isolated package.json and dependencies
- Site builds successfully producing static HTML with Pagefind full-text search index
- All five framework defaults active: sidebar navigation, full-text search, dark/light toggle, code highlighting with copy, responsive layout
- npm tarball verified to exclude all docs/ files via root package.json files whitelist

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Starlight project in docs/** - `2f086f7` (feat)
2. **Task 2: Gitignore updates and npm pack isolation verification** - `fad433d` (chore)

## Files Created/Modified
- `docs/package.json` - Isolated Astro/Starlight dependencies (private, own scripts)
- `docs/astro.config.mjs` - Starlight integration with title, GitHub social link, sidebar config
- `docs/tsconfig.json` - Extends Astro strict TypeScript config
- `docs/src/content.config.ts` - Content collection schema with docsLoader and docsSchema
- `docs/src/content/docs/index.mdx` - Splash landing page with hero and GitHub action link
- `.gitignore` - Added docs/dist/, docs/.astro/, docs/node_modules/ entries

## Decisions Made
- Used new Starlight v0.33+ social array syntax (`{icon, label, href}`) instead of deprecated object syntax
- Manual file creation instead of interactive `npm create astro` wizard for deterministic, non-interactive scaffolding

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Starlight social config syntax**
- **Found during:** Task 1 (Create Starlight project)
- **Issue:** Research documented pre-v0.33 object syntax (`social: { github: "url" }`), but Starlight v0.38.x requires array syntax with `icon`, `label`, and `href` properties
- **Fix:** Updated astro.config.mjs to use `social: [{ icon: 'github', label: 'GitHub', href: 'url' }]`
- **Files modified:** docs/astro.config.mjs
- **Verification:** `npm run build` succeeds
- **Committed in:** 2f086f7 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Research had slightly outdated social config syntax. Fixed inline. No scope creep.

## Issues Encountered
None beyond the social config syntax deviation.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Starlight site builds and serves locally, ready for content architecture (Phase 21)
- Sidebar configured with autogenerate for "Getting Started" directory -- content phases can add pages there
- No base URL configured yet (Phase 21/24 for GitHub Pages deployment)

---
*Phase: 20-scaffold-starlight-site*
*Completed: 2026-03-17*
