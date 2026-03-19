# Phase 21: CI/CD and GitHub Pages - Research

**Researched:** 2026-03-17
**Domain:** GitHub Actions, Astro deployment, link checking
**Confidence:** HIGH

## Summary

This phase creates a GitHub Actions workflow that builds the Starlight docs site and deploys it to GitHub Pages, plus a link checker step that fails on broken links. The Astro ecosystem has a first-party GitHub Action (`withastro/action@v5`) that handles build, artifact upload, and caching automatically. The docs site lives in a `docs/` subdirectory, so the action's `path` input must be set. The `astro.config.mjs` needs `site` and `base` properties for correct asset/link resolution on GitHub Pages.

For link checking, `lychee` (via `lycheeverse/lychee-action@v2`) is the standard choice -- fast, Rust-based, checks both internal and external links in HTML output. It runs after the build step but before deploy, failing the workflow on broken links.

**Primary recommendation:** Use `withastro/action@v5` with `path: ./docs` for build, `lycheeverse/lychee-action@v2` for link checking on the built output, and `actions/deploy-pages@v4` for deployment. Configure `astro.config.mjs` with `site: 'https://senivel.github.io'` and `base: '/domain-context-claude'`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None -- all implementation choices at Claude's discretion.

### Claude's Discretion
All implementation choices are at Claude's discretion -- pure infrastructure phase.

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-02 | Site deploys to GitHub Pages via GitHub Action on pushes to `docs/**` | withastro/action@v5 with path input, actions/deploy-pages@v4, push paths filter on `docs/**` |
| INFRA-03 | CI link checker validates all internal and external links before deploy | lycheeverse/lychee-action@v2 run on built HTML output between build and deploy jobs |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| withastro/action | v5 (5.2.0) | Build Astro site + upload Pages artifact | Official first-party action from Astro team |
| actions/deploy-pages | v4 | Deploy artifact to GitHub Pages | Official GitHub action for Pages deployment |
| actions/checkout | v5 | Checkout repository | Standard checkout action |
| lycheeverse/lychee-action | v2 (2.8.0) | Check links in built HTML | Fast Rust-based checker, most popular for GH Actions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| actions/configure-pages | v5 | Configure Pages settings | Automatically handled by withastro/action |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| lychee | htmltest | htmltest is HTML-only, lychee handles markdown too and is faster |
| lychee | linkchecker | linkchecker is Python-based, slower, less CI integration |
| withastro/action | manual npm build + actions/upload-pages-artifact | More config, no caching, no lockfile detection |

## Architecture Patterns

### Recommended Workflow Structure
```
.github/
└── workflows/
    └── deploy-docs.yml    # Single workflow: build -> check links -> deploy
```

### Pattern 1: Three-Job Workflow (Build, Check, Deploy)
**What:** Separate jobs for build, link check, and deploy with artifact passing
**When to use:** When you want the link check to gate deployment
**Example:**
```yaml
# Source: https://docs.astro.build/en/guides/deploy/github/
# + lycheeverse/lychee-action README
name: Deploy Docs

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: withastro/action@v5
        with:
          path: ./docs

  check-links:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/download-artifact@v4
        with:
          name: github-pages
          path: ./dist
      - name: Extract artifact
        run: tar -xf ./dist/artifact.tar -C ./dist
      - name: Check links
        uses: lycheeverse/lychee-action@v2
        with:
          args: '--base https://senivel.github.io/domain-context-claude --no-progress ./dist/**/*.html'
          fail: true
          jobSummary: true

  deploy:
    needs: [build, check-links]
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

### Pattern 2: Single-Job with Steps (Simpler Alternative)
**What:** All steps in one job -- build, check, deploy
**When to use:** Simpler, fewer artifacts to manage, but less granular failure reporting
**Note:** Cannot use withastro/action in single-job because it uploads a Pages artifact automatically. The three-job pattern is the natural fit.

### Anti-Patterns to Avoid
- **Skipping concurrency settings:** Multiple pushes can cause conflicting deployments. Always set `concurrency` with `cancel-in-progress: false` for Pages.
- **Checking source markdown instead of built HTML:** Source links may differ from rendered output (Starlight rewrites paths). Always check the built output.
- **Missing `workflow_dispatch`:** Without it, you cannot manually re-deploy. Always include it.
- **Setting `base` with trailing slash:** Astro `base` should be `/domain-context-claude` not `/domain-context-claude/`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Astro build + artifact upload | Custom npm build + upload-pages-artifact steps | `withastro/action@v5` | Handles lockfile detection, caching, correct artifact format |
| Link checking | Custom script with fetch calls | `lycheeverse/lychee-action@v2` | Handles redirects, retries, rate limiting, concurrent checks |
| Pages configuration | Manual pages config API calls | `actions/configure-pages` (built into withastro/action) | Handles base URL injection |

## Common Pitfalls

### Pitfall 1: Missing `base` in astro.config.mjs
**What goes wrong:** All CSS, JS, and internal links break on the deployed site because they reference `/` instead of `/domain-context-claude/`
**Why it happens:** GitHub Pages serves from a subdirectory for non-user repos
**How to avoid:** Set `site: 'https://senivel.github.io'` and `base: '/domain-context-claude'` in astro.config.mjs
**Warning signs:** Site loads but looks unstyled, or all links 404

### Pitfall 2: No lockfile committed
**What goes wrong:** `withastro/action` fails because it detects package manager from lockfile
**Why it happens:** `.gitignore` might exclude lockfile, or it was never committed
**How to avoid:** Ensure `docs/package-lock.json` is committed (it already is in this project)
**Warning signs:** Action fails with "could not detect package manager"

### Pitfall 3: Link checker finds false positives on external links
**What goes wrong:** Rate-limited or geoblocked external URLs cause CI failures
**Why it happens:** GitHub Actions IPs are rate-limited by many sites
**How to avoid:** Use `.lycheeignore` file for known-flaky external URLs; consider `--timeout 30` flag
**Warning signs:** External link failures that work fine in browser

### Pitfall 4: Pages artifact format mismatch
**What goes wrong:** Deploy step fails because artifact was uploaded incorrectly
**Why it happens:** Using `actions/upload-artifact` instead of `actions/upload-pages-artifact`
**How to avoid:** Use `withastro/action@v5` which handles this correctly
**Warning signs:** Deploy step errors about missing or invalid artifact

### Pitfall 5: GitHub Pages not enabled in repo settings
**What goes wrong:** Deploy fails with permissions error
**Why it happens:** GitHub Pages must be configured to use "GitHub Actions" as source (not "Deploy from a branch")
**How to avoid:** Go to repo Settings > Pages > Source > select "GitHub Actions"
**Warning signs:** 403 or "not found" errors in deploy step

### Pitfall 6: Link checker runs on source instead of build output
**What goes wrong:** False positives/negatives because Starlight transforms links during build
**Why it happens:** Checking `docs/src/` markdown instead of built HTML
**How to avoid:** Download the Pages artifact after build, extract it, run lychee on the HTML
**Warning signs:** Links reported broken that work on the actual site

## Code Examples

### astro.config.mjs with GitHub Pages configuration
```javascript
// Source: https://docs.astro.build/en/guides/deploy/github/
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
        {
          label: 'Getting Started',
          autogenerate: { directory: 'getting-started' },
        },
      ],
    }),
  ],
});
```

### .lycheeignore for known-flaky URLs
```
# Rate-limited social media
https://twitter.com/.*
https://x.com/.*

# LinkedIn blocks crawlers
https://www.linkedin.com/.*
```

### Extracting Pages artifact for link checking
```yaml
# The withastro/action uploads a tar archive as 'github-pages' artifact
- uses: actions/download-artifact@v4
  with:
    name: github-pages
    path: ./dist
- run: tar -xf ./dist/artifact.tar -C ./dist
- uses: lycheeverse/lychee-action@v2
  with:
    args: '--base https://senivel.github.io/domain-context-claude --no-progress ./dist/**/*.html'
    fail: true
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `peaceiris/actions-gh-pages` | `withastro/action` + `actions/deploy-pages` | 2023 | First-party, no PAT needed, uses Pages API |
| Branch-based deployment (gh-pages branch) | Actions-based deployment (artifact upload) | GitHub 2022 | Cleaner history, no orphan branch needed |
| `linkchecker` (Python) | `lychee` (Rust) | 2021+ | 10-100x faster, better CI integration |
| htmlproofer (Ruby) | lychee | 2022+ | No Ruby dependency, faster, actively maintained |

## Open Questions

1. **Artifact extraction for link checking**
   - What we know: `withastro/action` uploads a tar archive named `github-pages`
   - What's unclear: Exact tar structure (may be `artifact.tar` containing the site root, or nested)
   - Recommendation: Test locally or add a `ls -la` debug step in first run; adjust tar extraction path accordingly

2. **External link rate limiting**
   - What we know: GitHub Actions IPs get rate-limited; lychee supports `--max-retries` and `--timeout`
   - What's unclear: Which external links in the docs will be problematic
   - Recommendation: Start with `fail: true`, add `.lycheeignore` entries as false positives are discovered

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | GitHub Actions (CI workflow validation) |
| Config file | `.github/workflows/deploy-docs.yml` |
| Quick run command | `cd docs && npm run build` (local build test) |
| Full suite command | Push to main with docs/ changes, observe Actions run |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-02 | Docs build and deploy on push to docs/** | smoke | `cd /Users/alevine/code/domain-context-claude/docs && npm run build` | N/A - workflow file |
| INFRA-03 | Link checker fails on broken links | smoke | `cd /Users/alevine/code/domain-context-claude/docs && npm run build` (then check HTML) | N/A - workflow file |

### Sampling Rate
- **Per task commit:** `cd docs && npm run build` (verifies site builds with base URL)
- **Per wave merge:** Push to branch, check Actions tab
- **Phase gate:** Full workflow run on main with successful deploy

### Wave 0 Gaps
- [ ] `.github/workflows/deploy-docs.yml` -- the entire workflow file (core deliverable)
- [ ] `.lycheeignore` -- exclusion list for flaky external URLs
- [ ] `docs/astro.config.mjs` -- needs `site` and `base` added

## Sources

### Primary (HIGH confidence)
- [Astro GitHub Pages deployment guide](https://docs.astro.build/en/guides/deploy/github/) - official workflow YAML, config requirements
- [withastro/action README](https://github.com/withastro/action) - v5.2.0, path input, all accepted inputs
- [lycheeverse/lychee-action README](https://github.com/lycheeverse/lychee-action) - v2.8.0, configuration options, example workflows

### Secondary (MEDIUM confidence)
- [GitHub Actions workflow syntax](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions) - paths filter, concurrency settings
- [lychee CLI docs](https://lychee.cli.rs/recipes/base-url/) - `--base` flag for resolving relative URLs

### Tertiary (LOW confidence)
- Artifact extraction pattern (tar -xf) -- inferred from Pages artifact format, needs validation in first run

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - official first-party actions with clear documentation
- Architecture: HIGH - well-documented three-job pattern from official sources
- Pitfalls: HIGH - common GitHub Pages issues well-known in ecosystem

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable infrastructure, slow-moving)
