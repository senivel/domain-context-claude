# Project Research Summary

**Project:** domain-context-cc v1.4 — Documentation Site
**Domain:** Developer tool documentation site (static, GitHub Pages, npm package companion)
**Researched:** 2026-03-17
**Confidence:** HIGH

## Executive Summary

The v1.4 milestone adds a documentation site to domain-context-cc, a zero-dependency npm package of Claude Code skills, hooks, and templates. The task is architecturally simple: add a `docs/` subdirectory containing a Starlight (Astro) static site, a GitHub Actions workflow to deploy it, and hand-authored content. Nothing in the existing package changes — the root `package.json` stays untouched, the npm tarball stays lean, and the v1.3 skills/hooks/templates are source material for documentation pages, not code to be modified.

The recommended stack is Starlight 0.38.x on Astro 5.x, deployed to GitHub Pages via `withastro/action@v5`. Starlight delivers every expected documentation feature (full-text search via Pagefind, dark/light mode, sidebar navigation, Shiki code highlighting, copy buttons, responsive layout) as framework defaults requiring zero custom implementation. The entire infrastructure can be scaffolded in an afternoon; the bulk of work is writing content for roughly 9-10 pages adapted from existing README and ARCHITECTURE.md assets.

The primary risks are all configuration mistakes made in Phase 1 that are expensive to fix later: docs dependencies leaking into root `package.json`, forgetting the `base: '/domain-context-claude'` path for GitHub Pages, and incorrect GitHub Actions permissions or source settings. All three are prevented by establishing correct structure from the first commit. Content drift (docs falling out of sync with skills) is the main ongoing risk post-launch, mitigated by a docs-to-code mapping convention and optional CI warning.

## Key Findings

### Recommended Stack

Starlight (Astro) is the clear winner over VitePress and Docusaurus for this project. Its Go-based compiler produces sub-50KB first loads, it ships zero JS runtime by default, and every table-stakes documentation feature works out of the box with no plugins or external accounts. The first-party `withastro/action@v5` GitHub Action makes deployment a single YAML file. VitePress would be the second choice but requires Vue for any customization and has no official deploy action. Docusaurus is disqualified by its React runtime overhead (~200KB+) and Algolia dependency for real search.

Starlight is pre-1.0 at v0.38.1, but this is a formality: 98K weekly downloads, monthly releases, and an API surface small enough that breaking changes affect only a few config lines. The risk is negligible for a project using zero custom components.

**Core technologies:**
- Astro 5.x: static site framework — Go-based compiler, zero JS runtime default, official Pages action
- @astrojs/starlight 0.38.x: documentation theme — search, dark/light, sidebar, code blocks all zero-config
- Node.js >=20.3.0: build-time runtime — matches existing project `engines.node: ">=20.0.0"`
- withastro/action@v5: GitHub Actions deployment — first-party, auto-detects package manager

### Expected Features

The feature research categorizes all documentation features clearly. Every table-stakes feature (search, dark mode, sidebar, code highlighting, copy button, responsive layout) is provided by Starlight defaults — they cost zero implementation effort. Content pages are the real work, and substantial content already exists in README.md and ARCHITECTURE.md to adapt.

**Must have (table stakes, v1.4):**
- Framework setup and GitHub Pages CI/CD — everything else depends on this
- Landing/home page — first impression, install command, value prop
- Quickstart guide — expand from README, zero-to-working in under 5 minutes
- User guide — full workflow walkthrough
- CLI command reference — all 6 dc:* commands with usage and examples
- Architecture/concepts page — bridge pattern, hook lifecycle, .context/ structure
- Domain Context spec overview — what the spec is and how this tool implements it
- Contributing guide — setup, conventions, PR process
- Sidebar navigation, search, dark/light mode, code highlighting, copy button, responsive design (framework defaults, no custom work)

**Should have (v1.x post-launch):**
- Mermaid architecture diagrams — enhances architecture/concepts page
- Tabbed content for global vs local install variants
- "Edit this page" links — lowers contribution barrier
- Terminal demo recordings — animated SVG via asciinema

**Defer (v2+):**
- Versioned documentation — only when breaking changes affect a real installed base
- Blog/announcements section — GitHub Releases is sufficient for now
- i18n — translation maintenance overhead exceeds value for this audience

### Architecture Approach

The architecture is a strict separation: `docs/` is a self-contained Starlight site with its own `package.json` and `node_modules`, completely isolated from the npm package. The root `package.json` already uses a `files` whitelist that automatically excludes `docs/` — no npmignore needed, no risk of tarball bloat. The only new integration point is a GitHub Actions workflow that builds `docs/` and deploys to GitHub Pages. Zero existing files change. The CLI reference is written by hand (not auto-generated) because the Claude Code skill format is non-standard and only 6 stable commands exist — a parser would be overengineering.

**Major components:**
1. `docs/` subdirectory — self-contained Starlight site with own package.json and config
2. `docs/src/content/docs/` — all documentation pages as Markdown/MDX (landing, getting-started, guides, reference, concepts, contributing)
3. `docs/astro.config.mjs` — Starlight config: sidebar, site URL, base path (`/domain-context-claude`), theme
4. `.github/workflows/deploy-docs.yml` — CI/CD with path filtering (`docs/**`), official Astro action, explicit permissions
5. Root package.json — unchanged; `files` whitelist already excludes docs/

### Critical Pitfalls

1. **docs/ dependencies leaking into root package.json** — add Astro/Starlight only to `docs/package.json`, never root; verify with `git diff package.json` showing no changes
2. **Missing base URL for GitHub Pages** — set `base: '/domain-context-claude'` in `astro.config.mjs` on day one; without it, all CSS, JS, and links break on the deployed site
3. **GitHub Actions misconfiguration** — set Pages source to "GitHub Actions" (not "Deploy from a branch") in repo Settings before first workflow run; include explicit `pages: write` and `id-token: write` permissions
4. **npm tarball bloat** — the existing `files` whitelist handles this automatically, but verify with `npm pack --dry-run` after adding `docs/`
5. **Documentation drift from CLI behavior** — structure docs pages to mirror the code directory; add a PR checklist item for docs updates when skills/hooks change

## Implications for Roadmap

Research strongly suggests a four-phase structure matching the build order identified in ARCHITECTURE.md. The dependencies are clear: scaffold first, verify CI before writing content, write content with a working dev server, then polish.

### Phase 1: Scaffold Starlight Site

**Rationale:** Every subsequent phase depends on having a working Starlight project. This is the critical path. All structural configuration decisions (base URL, trailing slash, isolated package.json) must be made here — they are painful to change later.

**Delivers:** A working `docs/` directory with Astro/Starlight installed, placeholder index page, `npm run dev` serving locally, and all configuration correct for GitHub Pages.

**Addresses:** Framework setup, sidebar skeleton, dark/light mode, code highlighting, copy button, responsive layout (all framework defaults, zero custom code).

**Avoids:** All Phase 1 pitfalls — wrong base URL, docs deps in root package.json, trailing slash misconfiguration, npm tarball bloat.

**Research flag:** Standard, well-documented pattern. Skip deeper research. Follow STACK.md config exactly.

### Phase 2: CI/CD and GitHub Pages Deployment

**Rationale:** Deploying a placeholder site early proves the pipeline before investing hours in content. Discovering a CI misconfiguration after writing 10 pages is expensive. This phase decouples "does the deployment work" from "is the content good."

**Delivers:** A live site on GitHub Pages (`https://senivel.github.io/domain-context-claude/`) that auto-deploys on pushes to `docs/**`. Link checker integrated in CI.

**Uses:** `.github/workflows/deploy-docs.yml` with `withastro/action@v5`, path filtering, correct permissions, and `actions/deploy-pages@v4`.

**Avoids:** GitHub Actions permissions errors, wrong artifact directory, wrong Pages source setting, broken search index.

**Research flag:** Standard pattern. Skip deeper research. Use the exact workflow from ARCHITECTURE.md.

### Phase 3: Documentation Content

**Rationale:** The largest phase by effort. Benefits from Phases 1 and 2 being complete: a working dev server for preview and a deployed site for validation. Pages can be written in parallel (they have no dependencies on each other once the framework is scaffolded).

**Delivers:** All 9-10 documentation pages: landing page, installation, quickstart, user guide, GSD integration guide, CLI command reference (all 6 dc:* commands), hooks reference, templates reference, architecture/concepts, spec overview, contributing guide.

**Implements:** Diataxis-influenced content structure (getting-started, guides, reference, concepts sections). Manual CLI reference adapted from `commands/dc/*.md` skill files.

**Addresses:** All P1 content features from FEATURES.md. Existing content inventory (README.md, ARCHITECTURE.md) reduces authoring effort significantly.

**Avoids:** Docs drift — establish docs-to-code mapping convention here. Each docs page should explicitly reference its source skill/hook file.

**Research flag:** Content authoring — no research needed. Source material exists in README.md and ARCHITECTURE.md. Map content inventory from FEATURES.md.

### Phase 4: Polish and Verification

**Rationale:** Iterative refinement on top of complete content. Also the right time to add P2 enhancements (Mermaid diagrams, tabbed content, edit links) if they are low-effort.

**Delivers:** Favicon, custom branding (minor), sidebar tuning, Mermaid diagrams for architecture page, "Edit this page" links, mobile responsiveness verification, full "looks done but isn't" checklist from PITFALLS.md.

**Avoids:** FOUC in dark mode (don't customize Starlight's theme initialization), broken internal links (run link checker), missing 404 page.

**Research flag:** Standard. No research needed. Work through the PITFALLS.md verification checklist.

### Phase Ordering Rationale

- Scaffold before CI: The GitHub Action needs `docs/astro.config.mjs` and a valid Astro project to build against.
- CI before content: Failing to deploy a 1-page site is much faster to debug than failing to deploy a 10-page site. Proves the pipeline is correct before content investment.
- Content before polish: Polish is meaningless without complete content. P2 features (Mermaid, tabs, edit links) are post-content enhancements.
- All structural configuration in Phase 1: base URL, trailing slash, isolated package.json, and npm tarball verification are all Phase 1 tasks because they are architectural decisions that propagate everywhere.

### Research Flags

Phases with standard patterns (skip research-phase during planning):
- **Phase 1:** Starlight scaffold is fully documented. STACK.md has exact config. No ambiguity.
- **Phase 2:** GitHub Actions workflow is provided verbatim in ARCHITECTURE.md and PITFALLS.md. Repository settings are a one-time manual step.
- **Phase 3:** Content authoring. Source material exists. No technical unknowns.
- **Phase 4:** Polish tasks from PITFALLS.md checklist. Well-defined, no research needed.

No phases require `/gsd:research-phase`. All patterns are well-documented and research is complete.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Starlight, Astro, and GitHub Actions documentation verified. Comparison data from multiple sources. |
| Features | HIGH | Feature landscape well-established for developer documentation sites. Content inventory grounded in existing repo assets. |
| Architecture | HIGH | Pattern directly verified against existing `package.json` `files` whitelist. Official Astro subdirectory deployment guide followed exactly. |
| Pitfalls | HIGH | Pitfalls sourced from official deployment documentation and direct analysis of the repo's existing constraints. |

**Overall confidence:** HIGH

### Gaps to Address

- **Starlight version pin:** Research was done at v0.38.1. By implementation time, a newer patch may be available. Use `@astrojs/upgrade` to stay current; config changes are minor.
- **GitHub Pages repository settings:** Must be manually set to "GitHub Actions" as the Pages source before the first workflow run. This is a one-time repo settings change that cannot be done from code.
- **Exact `site` URL:** The Astro config uses `site: 'https://senivel.github.io'`. Verify this matches the actual GitHub Pages domain for the repository before deploying.
- **Content scope for quickstart:** The quickstart currently exists as a README section. Expanding it for the docs site may surface scope questions about detail level — treat as a content decision, not a technical blocker.

## Sources

### Primary (HIGH confidence)
- https://starlight.astro.build/ — Starlight features, project structure, sidebar config, built-in search
- https://starlight.astro.build/getting-started/ — Install command, Node.js requirements
- https://docs.astro.build/en/guides/deploy/github/ — GitHub Pages deployment, `base`/`site` config, workflow YAML
- https://github.com/withastro/action — Official Astro GitHub Action, `path` parameter for subdirectory builds
- https://github.com/actions/deploy-pages — Official GitHub Pages deployment action, permissions requirements
- https://docs.github.com/en/pages/ — GitHub Pages source settings, 404 troubleshooting
- Existing `package.json` in this repo — confirmed `files` whitelist excludes unlisted directories automatically

### Secondary (MEDIUM confidence)
- https://www.npmjs.com/package/@astrojs/starlight — v0.38.1, ~98K weekly downloads (npm API returned 403; data from search results)
- https://blog.logrocket.com/starlight-vs-docusaurus-building-documentation/ — Performance comparison (build speed, bundle size)
- https://distr.sh/blog/distr-docs/ — Real-world Docusaurus-to-Starlight migration case study
- https://astro.build/blog/whats-new-february-2026/ — Astro ecosystem activity as of Feb 2026
- https://dev.to/kevinbism/coding-the-perfect-documentation-deciding-between-vitepress-and-astro-starlight-2i11 — VitePress vs Starlight comparison
- https://medium.com/@jdxcode/for-the-love-of-god-dont-use-npmignore-f93c08909d8d — npm `files` whitelist vs `.npmignore` best practices

### Tertiary (LOW confidence)
- https://okidoki.dev/documentation-generator-comparison — Multi-framework overview; useful for context but not primary decision driver
- https://www.infoq.com/articles/continuous-documentation/ — Docs-code sync strategies; general guidance

---
*Research completed: 2026-03-17*
*Ready for roadmap: yes*
