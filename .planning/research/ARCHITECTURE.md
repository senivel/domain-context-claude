# Architecture Research

**Domain:** Documentation site integration for existing npm CLI package
**Researched:** 2026-03-17
**Confidence:** HIGH

## Context: This Is a v1.4 Integration Research Document

This document answers: how does a Starlight documentation site integrate with the existing domain-context-cc npm package? The v1.0-v1.3 layers are unchanged. This focuses exclusively on new components, integration points, and build/deploy architecture.

## Existing Architecture (v1.3 Baseline)

```
domain-context-claude/
├── commands/dc/              [6 skills] init, explore, validate, add, refresh, extract
├── hooks/                    [2 hooks] freshness-check, context-reminder
├── agents/                   [1 agent] domain-validator
├── rules/                    [1 rule] context-editing
├── templates/                [9 templates] all Domain Context file types
├── tools/                    [1 script] validate-templates.sh
├── bin/                      [1 file] install.js (npm entry point)
├── tests/                    [52 tests] install, reinstall, uninstall
└── package.json              files whitelist: commands/, agents/, hooks/, rules/,
                              templates/, tools/, bin/  (7 directories)
```

**Key constraint:** Root package.json has zero dependencies and uses a `files` whitelist. Only the 7 listed directories are included in the npm tarball. Anything not listed is automatically excluded.

## System Overview (v1.4)

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Repository                           │
├──────────────────────────┬──────────────────────────────────────┤
│   npm Package (v1.3)     │   Documentation Site (NEW)           │
│   UNCHANGED              │                                      │
│                          │   docs/                              │
│  commands/dc/            │   ├── astro.config.mjs               │
│  hooks/                  │   ├── package.json                   │
│  agents/                 │   ├── src/                           │
│  rules/                  │   │   ├── content/docs/  (pages)     │
│  templates/              │   │   ├── assets/        (images)    │
│  tools/                  │   │   └── content.config.ts          │
│  bin/                    │   └── public/            (static)    │
│  tests/                  │                                      │
│  package.json            │                                      │
├──────────────────────────┴──────────────────────────────────────┤
│                     .github/workflows/                          │
│                     deploy-docs.yml  (NEW)                      │
│                          │                                      │
│                          v                                      │
│              GitHub Pages (static HTML)                         │
│    https://senivel.github.io/domain-context-claude/             │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Status |
|-----------|----------------|--------|
| `docs/` | Self-contained Starlight site with own package.json, node_modules, config | **NEW** |
| `docs/src/content/docs/` | All documentation pages as Markdown/MDX | **NEW** |
| `docs/astro.config.mjs` | Starlight config: sidebar, site URL, base path, theme | **NEW** |
| `.github/workflows/deploy-docs.yml` | CI/CD: build docs/ and deploy to GitHub Pages | **NEW** |
| `package.json` (root) | UNCHANGED. `files` whitelist excludes `docs/` from npm tarball | **UNCHANGED** |
| `commands/dc/*.md` | Existing skill files. Source of truth for CLI reference content | **UNCHANGED** |

### What Does NOT Change

- No existing skills, hooks, agents, rules, or templates are modified
- Root `package.json` is unchanged (no new dependencies, no `files` changes needed)
- `bin/install.js` is unchanged
- The npm tarball is unaffected -- `docs/` is excluded because only the 7 whitelisted directories ship

## Recommended Project Structure

```
domain-context-claude/
├── commands/dc/                 # existing (UNCHANGED)
├── hooks/                       # existing (UNCHANGED)
├── agents/                      # existing (UNCHANGED)
├── rules/                       # existing (UNCHANGED)
├── templates/                   # existing (UNCHANGED)
├── tools/                       # existing (UNCHANGED)
├── bin/                         # existing (UNCHANGED)
├── tests/                       # existing (UNCHANGED)
├── package.json                 # existing (UNCHANGED)
│
├── docs/                        # NEW: self-contained Starlight site
│   ├── astro.config.mjs         # Starlight integration + sidebar config
│   ├── package.json             # docs-only deps (astro, @astrojs/starlight)
│   ├── tsconfig.json            # Astro TypeScript config
│   ├── src/
│   │   ├── content/
│   │   │   └── docs/            # documentation pages
│   │   │       ├── index.mdx              # landing/hero page
│   │   │       ├── getting-started/
│   │   │       │   ├── installation.md    # npx domain-context-cc
│   │   │       │   └── quickstart.md      # first dc:init walkthrough
│   │   │       ├── guides/
│   │   │       │   ├── user-guide.md      # full usage guide
│   │   │       │   └── gsd-integration.md # GSD bridge docs
│   │   │       ├── reference/
│   │   │       │   ├── commands.md        # all 6 dc:* commands
│   │   │       │   ├── hooks.md           # hook reference
│   │   │       │   └── templates.md       # template reference
│   │   │       ├── concepts/
│   │   │       │   ├── spec-overview.md   # Domain Context spec
│   │   │       │   └── architecture.md    # how dc-cc works
│   │   │       └── contributing.md
│   │   ├── content.config.ts    # content collection schema
│   │   └── assets/              # images, logos
│   └── public/                  # favicon, static assets
│
└── .github/
    └── workflows/
        └── deploy-docs.yml      # GitHub Actions: build + deploy to Pages
```

### Structure Rationale

- **`docs/` as subdirectory, not root-level Starlight:** Keeps the npm package as the primary artifact. The docs site is a companion. Avoids polluting root with `astro.config.mjs`, `tsconfig.json`, and Astro's `src/` directory.
- **Separate `docs/package.json`:** The docs site needs `astro` and `@astrojs/starlight` as dependencies. These MUST NOT go in root `package.json` (which has zero dependencies by design). A separate package.json isolates doc tooling completely.
- **No npm workspace:** The docs site has no code dependency on the main package. It reads no imports from root. `cd docs && npm install && npm run build` is sufficient. Workspaces add complexity for zero benefit.
- **Content in `docs/src/content/docs/`:** Starlight convention. Each `.md` file becomes a page. Directory structure becomes URL structure.

## Architectural Patterns

### Pattern 1: Self-Contained Subdirectory Site

**What:** The docs site lives in `docs/` with its own package.json, config, and node_modules. It shares no code with the parent project.
**When to use:** When adding a documentation site to an existing package that must not gain new dependencies.
**Trade-offs:** Slightly more setup (separate install step in CI), but clean separation. The npm tarball stays lean because the root `files` whitelist excludes unlisted directories automatically.

### Pattern 2: Manual CLI Reference (Not Auto-Generated)

**What:** The 6 `commands/dc/*.md` skill files use Claude Code's YAML frontmatter + XML section format (`<objective>`, `<execution_context>`, `<process>`). The CLI reference page should be hand-written markdown, not auto-generated from skill files.
**When to use:** When source files use a non-standard format that no existing doc generator understands.
**Trade-offs:** Requires manual sync when skills change. However:
- Only 6 commands exist, stable since v1.2
- The skill file format is not parseable by any standard API doc generator
- Hand-written prose produces better documentation than any auto-extractor
- A build-time parser script is feasible but overkill for 6 rarely-changing files

**If maintenance burden grows later:** Add a simple Node.js script (`docs/scripts/gen-reference.mjs`) that parses YAML frontmatter from `commands/dc/*.md` and extracts `<objective>` content into markdown. But do not build this for v1.4.

### Pattern 3: GitHub Action with Path Filtering

**What:** The deploy workflow only triggers on changes to `docs/` or the workflow file itself, not on every push.
**When to use:** When the docs site is a subdirectory of a project where most commits are unrelated to docs.
**Trade-offs:** Prevents unnecessary builds. Requires `paths:` filter in the workflow trigger. Include `workflow_dispatch` for manual triggers.

## Data Flow

### Build and Deploy Flow

```
Developer pushes to main (docs/** changed)
    |
    v
GitHub Action triggers (paths filter: docs/**)
    |
    v
actions/checkout@v5 (clone full repo)
    |
    v
withastro/action@v5 (path: ./docs)
    ├── Detects package manager from docs/package-lock.json
    ├── npm install (in docs/ only)
    ├── astro build (outputs to docs/dist/)
    └── Uploads build artifact to GitHub Pages
    |
    v
actions/deploy-pages@v4
    └── Deploys static HTML to GitHub Pages
    |
    v
Live at: https://senivel.github.io/domain-context-claude/
```

### npm Tarball Flow (UNCHANGED)

```
npm pack / npm publish
    |
    v
Reads package.json "files": [commands/, agents/, hooks/, rules/, templates/, tools/, bin/]
    |
    v
docs/ is NOT in the whitelist --> excluded from tarball automatically
    |
    v
Tarball unchanged: only the 7 whitelisted directories ship (no bloat)
```

### Key Data Flows

1. **Docs content to site:** Markdown files in `docs/src/content/docs/` are compiled by Astro/Starlight into static HTML at build time. No runtime processing.
2. **Skill files to CLI reference:** Manual content sync. Developer reads `commands/dc/*.md` and writes corresponding reference content in the docs. One-time effort with rare updates.

## GitHub Action Configuration

### Workflow File: `.github/workflows/deploy-docs.yml`

```yaml
name: Deploy Docs
on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - '.github/workflows/deploy-docs.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

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

**Critical details:**
- `withastro/action@v5` `path` parameter tells the action where the Astro project root is. Without this, it looks for `astro.config.mjs` at the repo root and fails.
- The action auto-detects the package manager from the lockfile in `docs/`.
- `workflow_dispatch` allows manual re-deploys without a code change.
- `paths` filter prevents rebuilding docs on every skill/hook/template commit.

### Repository Settings Required

| Setting | Value | Why |
|---------|-------|-----|
| Settings > Pages > Source | "GitHub Actions" | Required for action-based deployment (not branch-based) |

## Astro/Starlight Configuration

### `docs/astro.config.mjs`

```javascript
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://senivel.github.io',
  base: '/domain-context-claude',
  integrations: [
    starlight({
      title: 'Domain Context',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/senivel/domain-context-claude',
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Quick Start', slug: 'getting-started/quickstart' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'User Guide', slug: 'guides/user-guide' },
            { label: 'GSD Integration', slug: 'guides/gsd-integration' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Commands', slug: 'reference/commands' },
            { label: 'Hooks', slug: 'reference/hooks' },
            { label: 'Templates', slug: 'reference/templates' },
          ],
        },
        {
          label: 'Concepts',
          items: [
            { label: 'Spec Overview', slug: 'concepts/spec-overview' },
            { label: 'Architecture', slug: 'concepts/architecture' },
          ],
        },
      ],
    }),
  ],
});
```

**Critical:** `base: '/domain-context-claude'` is required. GitHub Pages for project repos (not `username.github.io` repos) serves from `username.github.io/repo-name/`. Without this `base` setting, all asset and link paths break.

### `docs/package.json`

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
    "astro": "^5",
    "@astrojs/starlight": "^0.33"
  }
}
```

**`private: true`** prevents accidental npm publish of the docs package.

## Integration Points

### New Components

| Component | Type | Dependencies |
|-----------|------|--------------|
| `docs/` directory | New subdirectory | astro, @astrojs/starlight (in docs/package.json only) |
| `.github/workflows/deploy-docs.yml` | New workflow | GitHub Actions: checkout@v5, withastro/action@v5, deploy-pages@v4 |

### Existing Components Modified

**None.** Zero changes to any existing file. The root `package.json` `files` whitelist already excludes `docs/` because it uses an inclusion list, not an exclusion list.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| docs/ <-> root package | None at runtime | Docs build independently; no code imports cross the boundary |
| docs/ <-> commands/dc/ | Manual content sync | CLI reference written by hand from skill file content |
| GitHub Action <-> docs/ | `path: ./docs` parameter | Action builds from subdirectory, not repo root |
| npm tarball <-> docs/ | None | `files` whitelist excludes docs/ automatically |

## Anti-Patterns

### Anti-Pattern 1: Docs Dependencies in Root package.json

**What people do:** Add `astro` and `@astrojs/starlight` to root `package.json`.
**Why it's wrong:** This project has a zero-dependency constraint. Adding doc framework deps to root pollutes `npm install` for all users. The `files` whitelist currently prevents tarball bloat, but adding deps to root violates the project's design principle.
**Do this instead:** Keep all doc deps in `docs/package.json` only. The root package never knows about Astro.

### Anti-Pattern 2: Auto-Generating CLI Reference

**What people do:** Build a custom parser to extract structured data from Claude Code skill markdown and auto-generate API docs.
**Why it's wrong:** The skill format (YAML frontmatter with `allowed-tools` + XML `<objective>` blocks) is non-standard. Building a parser for 6 files that haven't changed since v1.2 is overengineering. The parser itself would need maintenance.
**Do this instead:** Write the CLI reference by hand. It takes 30 minutes and produces better documentation than any auto-generator.

### Anti-Pattern 3: npm Workspaces for Docs

**What people do:** Configure npm workspaces to link docs/ and root.
**Why it's wrong:** There is no code dependency between them. Workspaces add complexity (hoisted node_modules, workspace resolution) for zero benefit.
**Do this instead:** Treat `docs/` as a standalone project. `cd docs && npm install && npm run build`.

### Anti-Pattern 4: Building Docs on Every Push

**What people do:** Trigger the deploy workflow on all pushes to main.
**Why it's wrong:** Most commits touch skills, hooks, or templates -- not docs. Unnecessary builds waste CI minutes.
**Do this instead:** Use `paths: ['docs/**']` filter. Include `workflow_dispatch` for manual triggers.

### Anti-Pattern 5: Forgetting the `base` Path

**What people do:** Omit the `base` config in astro.config.mjs when deploying to a GitHub Pages project site.
**Why it's wrong:** GitHub Pages project repos serve from `username.github.io/repo-name/`. Without `base: '/repo-name'`, all internal links and static assets resolve to the wrong URLs, producing a broken site.
**Do this instead:** Always set `base: '/domain-context-claude'` in `docs/astro.config.mjs`.

## Build Order (Dependency-Driven)

```
Phase 1: Scaffold Starlight site
         Create docs/ with astro.config.mjs, package.json, tsconfig.json
         Add a placeholder index.mdx page
         Verify: cd docs && npm install && npm run dev
         |
         v
Phase 2: GitHub Action + Pages deployment
         Create .github/workflows/deploy-docs.yml
         Enable GitHub Pages with Actions source in repo settings
         Push placeholder site, verify it deploys
         |
         v
Phase 3: Write documentation content
         Author all pages: getting-started, guides, reference, concepts
         This is the bulk of work; depends on scaffold + working dev server
         |
         v
Phase 4: Polish
         Sidebar tuning, custom landing page hero
         Favicon/branding, final review
         Dark/light mode and search are built-in (no work needed)
```

**Rationale:**
- Scaffold first: all content depends on having a working Starlight project
- CI second: deploying a placeholder proves the pipeline works before investing hours in content. Discovering a CI issue after writing 10 pages is frustrating.
- Content third: the largest effort, benefits from a working dev server for previewing
- Polish last: iterative refinement on top of complete content

**Total new files:**
- `docs/` directory with ~15 files (config + content pages)
- `.github/workflows/deploy-docs.yml` (1 file)
- Zero modifications to existing files

## Sources

- [Astro Starlight documentation](https://starlight.astro.build/) -- framework features, project structure, sidebar config
- [Astro GitHub Pages deployment guide](https://docs.astro.build/en/guides/deploy/github/) -- workflow YAML, base/site config
- [withastro/action@v5](https://github.com/withastro/action) -- official GitHub Action with `path` parameter for subdirectory builds
- [Starlight project structure guide](https://starlight.astro.build/guides/project-structure/) -- directory conventions
- [npm package.json `files` field](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) -- whitelist behavior for tarball exclusion
- Existing `package.json` in this repo -- confirmed `files` whitelist pattern already excludes unlisted directories

---
*Architecture research for: v1.4 Documentation Site (Starlight + GitHub Pages)*
*Researched: 2026-03-17*
