# Stack Research

**Domain:** Documentation site for Claude Code extension (npm package)
**Researched:** 2026-03-17
**Confidence:** HIGH

---

## Decision: Use Starlight (Astro) for Documentation

**Recommendation: Starlight** because it delivers every Material for MkDocs feature out of the box (sidebar nav, Pagefind search, dark/light toggle, code blocks, responsive layout) with zero configuration, ships the lightest pages of any JS doc framework (<50KB first load), has first-party GitHub Pages deployment via `withastro/action@v5`, and keeps the docs site completely isolated from the main npm package (no React/Vue runtime leaking into `domain-context-cc`).

---

## Comparison: Starlight vs VitePress vs Docusaurus

| Criterion | Starlight (Astro) | VitePress | Docusaurus |
|-----------|-------------------|-----------|------------|
| **Version** | 0.38.1 (active development, pre-1.0) | 1.6.4 (stable) | 3.9.2 (stable) |
| **Weekly npm downloads** | ~98K | ~220K | ~320K |
| **Built-in search** | Pagefind (full-text, zero config) | MiniSearch (local, zero config) | Algolia plugin (requires account) or community local search |
| **Dark/light mode** | Built-in toggle, zero config | Built-in toggle, zero config | Built-in toggle, zero config |
| **Sidebar nav** | Config-driven + auto-generated from file structure | Config-driven + auto-generated | Config-driven + auto-generated |
| **Code blocks** | Shiki syntax highlighting, line highlights, diffs, titles | Shiki highlighting, line highlights, code groups | Prism (default) or Shiki, tabs |
| **Responsive** | Yes, built-in | Yes, built-in | Yes, built-in |
| **First-load size** | <50KB compressed | ~100KB compressed | ~200KB+ compressed (React runtime) |
| **Build speed** | Fast (Go-based Astro compiler) | Fast (Vite) | Slow (Webpack-based, React SSR) |
| **Content format** | Markdown, MDX, Markdoc | Markdown (Vue components inline) | Markdown, MDX |
| **JS framework** | Framework-agnostic (Astro) | Vue.js required for customization | React required for customization |
| **GitHub Pages action** | Official `withastro/action@v5` | Manual workflow (standard actions) | Manual workflow (standard actions) |
| **i18n** | Built-in | Built-in | Built-in |
| **Node.js requirement** | >=20.3.0 (Astro 5.x) | >=18.0.0 | >=18.0.0 |

### Why Starlight wins for this project

1. **Zero-config features match MkDocs parity requirements.** Pagefind search, dark/light toggle, sidebar navigation, and responsive design are all enabled by default. No plugins to configure, no third-party accounts (unlike Docusaurus's Algolia dependency for good search).

2. **Framework-agnostic is the right fit.** This project has zero frontend framework dependencies. Docusaurus locks you into React. VitePress locks you into Vue. Starlight runs on Astro, which outputs static HTML and ships zero JS runtime by default. If you need interactive components later, you can use any framework (React, Vue, Svelte) via Astro islands.

3. **Lightest output.** First load under 50KB. For a documentation site that should feel fast and professional (like Material for MkDocs), this matters. Docusaurus ships the entire React runtime (~200KB+).

4. **First-party GitHub Pages support.** `withastro/action@v5` is maintained by the Astro team. One YAML file, no custom build scripts. VitePress and Docusaurus require assembling your own workflow from generic actions.

5. **Best code block support.** Shiki-based highlighting with line numbers, diff highlighting, code titles, and frame styles (terminal vs code) -- all features that matter for a CLI tool's documentation.

### Why NOT VitePress

VitePress is an excellent tool and would be the second choice. It loses on two points:
- **Vue dependency.** Customizing VitePress beyond config requires writing Vue components. This project has no Vue expertise context and no reason to adopt Vue.
- **No official deploy action.** You write your own workflow, which is straightforward but more maintenance than `withastro/action@v5`.

VitePress would be the right choice if this were a Vue ecosystem project or if Starlight's pre-1.0 status is a dealbreaker.

### Why NOT Docusaurus

Docusaurus is disqualified for this project:
- **React runtime overhead.** Ships ~200KB+ of React to the browser for a static documentation site. Antithetical to the "lightweight, zero-dependency" philosophy of `domain-context-cc`.
- **Slow builds.** Webpack-based build is noticeably slower than Vite/Astro-based alternatives.
- **Search requires Algolia.** The built-in search is basic; real search requires an Algolia account and API key, or a community plugin.
- **Heavier dependency tree.** `npm install` pulls hundreds of transitive dependencies.

Docusaurus would be the right choice for a large enterprise project with versioned docs, blog, plugin ecosystem needs, and existing React investment.

### Pre-1.0 risk assessment for Starlight

Starlight is at v0.38.1, not yet 1.0. This is a real consideration. Mitigating factors:
- **Active development.** Published 2 days ago as of research date. Monthly releases.
- **98K weekly downloads.** Widely adopted despite pre-1.0 label.
- **Astro itself is stable.** Astro 5.x is mature. Starlight is a theme on top of stable Astro.
- **Breaking changes are config-only.** Starlight API surface is small (astro.config.mjs + frontmatter). Upgrades are `@astrojs/upgrade` + minor config fixes.
- **Our docs are simple.** We use zero custom components. Risk of breaking changes affecting us is minimal.

**Verdict:** The pre-1.0 label is a formality, not a real risk for this use case.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Astro | 5.x (latest) | Static site framework | Go-based compiler, zero JS runtime by default, official GitHub Pages action |
| @astrojs/starlight | 0.38.x (latest) | Documentation theme | Full-featured docs theme: search, dark/light, sidebar, code blocks, responsive -- all zero-config |
| Node.js | >=20.3.0 | Build-time runtime | Matches existing project constraint (`engines.node: ">=20.0.0"` in package.json). Astro 5.x requires >=20.3.0. |

### Built-in Features (no additional packages needed)

| Feature | Provider | Notes |
|---------|----------|-------|
| Full-text search | Pagefind (bundled with Starlight) | Indexes at build time, serves from static files. No external service. |
| Dark/light mode | Starlight built-in | Toggle in header, respects system preference, zero config. |
| Sidebar navigation | Starlight built-in | Auto-generated from file structure or manually configured in astro.config.mjs. |
| Syntax highlighting | Shiki (bundled with Astro) | Line numbers, line highlights, diff markers, code titles, terminal frames. |
| Responsive layout | Starlight built-in | Mobile-first, collapsible sidebar on mobile. |
| SEO | Astro built-in | Automatic sitemap, meta tags from frontmatter. |
| Table of contents | Starlight built-in | Right sidebar, auto-generated from headings. |

### Development Dependencies

| Package | Purpose | Install Location |
|---------|---------|------------------|
| `astro` | Core framework + dev server | `docs/package.json` devDependencies |
| `@astrojs/starlight` | Documentation theme | `docs/package.json` devDependencies |
| `sharp` | Image optimization (Astro peer dep) | `docs/package.json` devDependencies |

### GitHub Actions Dependencies

| Action | Version | Purpose |
|--------|---------|---------|
| `actions/checkout@v5` | v5 | Clone repository |
| `withastro/action@v5` | v5 | Build Astro site + upload Pages artifact |
| `actions/deploy-pages@v4` | v4 | Deploy artifact to GitHub Pages |

---

## Project Structure: Isolated docs/ Subdirectory

**Critical decision: The docs site MUST live in a `docs/` subdirectory with its own `package.json`, NOT in the project root.**

Rationale:
- The main `package.json` has `"files"` whitelist controlling the npm tarball. Adding Astro dependencies to root would either bloat the published package or require careful exclusion.
- The main package has zero runtime dependencies as a hard constraint. Docs dependencies (astro, starlight, sharp) must not appear in the published package.
- Separate `docs/package.json` means `npm install` in root remains unchanged. Docs build is independent.
- GitHub Action installs docs dependencies in `docs/` only.

```
domain-context-cc/
  package.json              # npm package (unchanged, zero deps)
  docs/
    package.json            # docs-only dependencies (astro, starlight)
    astro.config.mjs        # Starlight configuration
    src/
      content/
        docs/               # Markdown content files
          index.mdx         # Landing page
          getting-started/
          guides/
          reference/
    public/                 # Static assets (logo, favicon)
```

### docs/package.json

```json
{
  "name": "domain-context-cc-docs",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/starlight": "^0.38.0",
    "sharp": "^0.33.0"
  }
}
```

`"private": true` prevents accidental publishing of the docs package.

---

## Installation

```bash
# From project root — docs site setup
cd docs
npm install

# Development server
npm run dev

# Production build (outputs to docs/dist/)
npm run build

# Preview production build locally
npm run preview
```

**Do NOT add docs dependencies to the root package.json.** The root package is the npm-published artifact. Docs dependencies are build-time only and must stay isolated.

---

## GitHub Actions Workflow

```yaml
# .github/workflows/docs.yml
name: Deploy docs to GitHub Pages

on:
  push:
    branches: [main]
    paths: ['docs/**']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: withastro/action@v5
        with:
          path: ./docs

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Key configuration points:
- `paths: ['docs/**']` ensures the workflow only triggers on docs changes, not on every push.
- `path: ./docs` tells the Astro action where the Astro project lives.
- `withastro/action@v5` auto-detects package manager from lockfile presence.
- `concurrency` prevents parallel deployments from conflicting.

---

## Astro Configuration

```javascript
// docs/astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://senivel.github.io',
  base: '/domain-context-claude',
  integrations: [
    starlight({
      title: 'Domain Context',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/senivel/domain-context-claude' },
      ],
      sidebar: [
        { label: 'Getting Started', autogenerate: { directory: 'getting-started' } },
        { label: 'Guides', autogenerate: { directory: 'guides' } },
        { label: 'Reference', autogenerate: { directory: 'reference' } },
      ],
    }),
  ],
});
```

- `site` + `base` are required for GitHub Pages deployment on a project repository.
- `autogenerate` creates sidebar entries from the file structure automatically.

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Docusaurus | Ships React runtime (~200KB+), slow Webpack builds, Algolia search dependency | Starlight (lighter, faster, search built-in) |
| VitePress | Vue lock-in, no official deploy action | Starlight (framework-agnostic, official action) |
| Tailwind CSS | Starlight's built-in styling covers all documentation needs. Adding Tailwind introduces config overhead for zero gain. | Starlight CSS variables for minor tweaks |
| Custom React/Vue components | No interactive features needed for static docs | Starlight's built-in components (Cards, Tabs, Aside, etc.) |
| Algolia DocSearch | Requires external account, API key management, indexing setup | Pagefind (bundled, zero config, runs locally) |
| `@astrojs/mdx` separately | Starlight bundles MDX support already | Starlight's built-in MDX |
| Docs deps in root package.json | Would bloat npm tarball or require exclusion complexity | Separate `docs/package.json` |
| Monorepo tools (Turborepo, Lerna) | Two package.jsons do not warrant monorepo tooling. `cd docs && npm install` is sufficient. | Direct `cd docs` commands |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Starlight (Astro) | VitePress | If you need Vue ecosystem integration or if Starlight pre-1.0 status becomes a blocking concern for your team |
| Starlight (Astro) | Docusaurus | If you need doc versioning (v1, v2 side-by-side), blog integration, or are already invested in React |
| Starlight (Astro) | Material for MkDocs | If you prefer Python tooling over JS. MkDocs is what the reference site uses and is excellent, but introduces a Python dependency into a Node.js project |
| Separate docs/ dir | Root-level Astro | Never for this project. Root package.json must stay clean for npm publishing. |
| Pagefind (Starlight built-in) | Algolia DocSearch | If you have >10K pages and need server-side search with analytics |
| GitHub Pages | Netlify / Vercel | If you need server-side rendering, edge functions, or preview deploys for PRs. GitHub Pages is sufficient for static docs. |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Astro 5.x | Node.js >=20.3.0 | Project already requires >=20.0.0. The 0.3.0 difference is negligible. |
| @astrojs/starlight 0.38.x | Astro 5.x | Starlight tracks Astro major versions. |
| withastro/action@v5 | Astro 5.x | Official action, auto-detects package manager. |
| sharp 0.33.x | Node.js >=18.17.0 | Image optimization peer dependency. Well within our Node range. |
| Pagefind (bundled) | Any (static output) | Generates a search index at build time. No runtime dependency. |

---

## Sources

- https://starlight.astro.build/ -- Starlight official docs. Built-in features (Pagefind search, dark/light, sidebar, i18n) verified. HIGH confidence.
- https://starlight.astro.build/getting-started/ -- Install command and beta status confirmed. HIGH confidence.
- https://docs.astro.build/en/guides/deploy/github/ -- Official GitHub Pages deployment guide with `withastro/action@v5`. HIGH confidence.
- https://github.com/withastro/action -- Official Astro GitHub Action, v5 verified. HIGH confidence.
- https://vitepress.dev/ -- VitePress 1.6.4 features verified. HIGH confidence.
- https://docusaurus.io/versions -- Docusaurus 3.9.2 confirmed. HIGH confidence.
- https://www.npmjs.com/package/@astrojs/starlight -- v0.38.1, ~98K weekly downloads. MEDIUM confidence (npm 403'd direct fetch, data from search results).
- https://blog.logrocket.com/starlight-vs-docusaurus-building-documentation/ -- Performance comparison (build speed, bundle size). MEDIUM confidence.
- https://distr.sh/blog/distr-docs/ -- Real-world Docusaurus-to-Starlight migration case study. MEDIUM confidence.
- https://astro.build/blog/whats-new-february-2026/ -- Astro ecosystem activity confirmed current as of Feb 2026. HIGH confidence.

---
*Stack research for: Documentation site (domain-context-cc v1.4)*
*Researched: 2026-03-17*
