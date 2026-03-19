# Pitfalls Research

**Domain:** Adding a documentation site to an existing npm package (domain-context-cc v1.4)
**Researched:** 2026-03-17
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: npm Package Bloat from docs/ Directory

**What goes wrong:**
The documentation site source files (markdown, images, framework config, node_modules, build output) get published to npm, inflating the package size from kilobytes to megabytes. Users installing via `npx domain-context-cc` download documentation assets they never use.

**Why it happens:**
Developers add a `docs/` directory without checking whether the npm publish whitelist covers it. If using `.npmignore`, adding it silently replaces `.gitignore` rules entirely. If the `files` array in package.json is misconfigured, everything not in `.gitignore` ships.

**How to avoid:**
This project already uses a `files` whitelist in package.json (`commands/`, `agents/`, `hooks/`, `rules/`, `templates/`, `tools/`, `bin/`). As long as `docs/` is NOT added to this array, the docs directory is automatically excluded from the npm tarball. Verify with `npm pack --dry-run` after adding the docs directory. Do NOT add a `.npmignore` file -- the `files` whitelist is the safer approach and is already in place.

**Warning signs:**
- `npm pack --dry-run` shows `docs/` files in the tarball listing
- Package size jumps from ~50KB to multiple MB
- `npm publish` warnings about package size

**Phase to address:**
Phase 1 (project scaffolding) -- confirm `files` whitelist excludes docs before any content is written.

---

### Pitfall 2: Wrong baseUrl Causes Broken Site on GitHub Pages

**What goes wrong:**
The documentation site works perfectly at `localhost:4321` during development but shows 404 errors, broken CSS, broken images, and broken internal links when deployed to GitHub Pages. The site renders as unstyled HTML or a blank page.

**Why it happens:**
GitHub Pages serves project sites at `https://{user}.github.io/{repo}/`, adding a path prefix. Most doc frameworks default to `base: "/"` which resolves assets from the root domain, not the repo subdirectory. Every absolute link, CSS import, and image reference breaks.

**How to avoid:**
Set the base URL in the framework config to match the repository name on day one. For Starlight/Astro: `base: '/domain-context-claude'` in `astro.config.mjs`. Test the production build locally with the base path before the first deployment. Run `npm run build && npx serve dist` (or equivalent preview command) to catch path issues before pushing.

**Warning signs:**
- Site loads but CSS/JS is missing (view source shows paths starting with `/assets/` instead of `/domain-context-claude/assets/`)
- Internal navigation links produce 404 errors
- Images show broken icons

**Phase to address:**
Phase 1 (project scaffolding) -- set base URL in initial framework configuration. Never defer this.

---

### Pitfall 3: GitHub Actions Workflow Deploys Wrong Artifact or Directory

**What goes wrong:**
The GitHub Actions workflow runs successfully (green check) but the deployed site is empty, shows the README, or shows wrong content. Alternatively, the workflow fails with cryptic permission errors.

**Why it happens:**
Three common causes: (1) The workflow uploads the wrong directory (e.g., `docs/` instead of `docs/dist/`). (2) GitHub Pages is configured to "Deploy from a branch" instead of "GitHub Actions" as the source. (3) The workflow is missing the `pages: write` and `id-token: write` permissions, or is missing the `actions/configure-pages` step.

**How to avoid:**
Use the official GitHub Pages deployment pattern with three steps: `actions/configure-pages`, `actions/upload-pages-artifact` (pointing at the correct build output directory), and `actions/deploy-pages`. Set the Pages source to "GitHub Actions" in repository settings BEFORE the first workflow run. Include explicit permissions in the workflow YAML. Test the workflow on a branch before merging to main.

**Warning signs:**
- Workflow succeeds but site shows 404
- Workflow fails with "Error: Resource not accessible by integration"
- Deployed site shows raw markdown or repo README instead of built docs

**Phase to address:**
Phase 2 (CI/CD setup) -- configure GitHub Action and repository settings together as a single task.

---

### Pitfall 4: docs/ Dev Dependencies Leak into Project Root

**What goes wrong:**
Running `npm install` in the project root installs hundreds of documentation framework dependencies (Astro, Vite, React, etc.), polluting the project's zero-dependency development environment. Lock file diffs become enormous. CI time increases.

**Why it happens:**
Developers add the docs framework as a devDependency in the root `package.json` instead of keeping it isolated. This project currently has zero dependencies by design, and mixing docs framework deps into the root breaks this core constraint.

**How to avoid:**
Keep the docs site in a self-contained subdirectory (`docs/`) with its own `package.json`, its own `node_modules/`, and its own lock file. The root `package.json` should never reference docs framework packages. The GitHub Action installs docs dependencies separately: `cd docs && npm ci && npm run build`. Add `docs/node_modules/` to `.gitignore`.

**Warning signs:**
- Root `package.json` gains `devDependencies` for the first time
- `npm install` at root takes noticeably longer
- Root `node_modules/` appears or grows significantly
- Root `package-lock.json` appears or changes

**Phase to address:**
Phase 1 (project scaffolding) -- establish the isolated `docs/package.json` pattern from the start. This is a structural decision that is painful to change later.

---

### Pitfall 5: Docs Drift from Actual CLI Behavior

**What goes wrong:**
Documentation describes features, flags, or behaviors that no longer match the actual code. Users follow the quickstart guide and it fails. Command reference shows wrong syntax. Architecture diagrams are outdated.

**Why it happens:**
Documentation and code live in the same repo but have no automated coupling. A developer updates a skill's behavior but forgets to update the corresponding docs page. This is especially acute for domain-context-cc where skills are markdown files -- changes feel small and "not worth a docs update."

**How to avoid:**
Structure docs pages to mirror the code directory structure so the mapping is obvious. Keep a documentation checklist in the PR template: "If you changed a skill/hook/template, did you update the corresponding docs page?" Consider a CI step that checks modification timestamps -- if files in `commands/` changed but `docs/` did not, emit a warning (not a blocker).

**Warning signs:**
- User issues reporting "docs say X but actual behavior is Y"
- Docs reference features or flags that no longer exist
- Quickstart guide fails on a clean install

**Phase to address:**
Phase 3 (content creation) -- establish the docs-to-code mapping convention. Phase 4 (polish) -- add CI warning check.

---

### Pitfall 6: Trailing Slash Inconsistency Causes Duplicate Pages or 404s

**What goes wrong:**
Some links work with trailing slashes (`/guide/quickstart/`) but not without (`/guide/quickstart`), or vice versa. GitHub Pages redirects inconsistently. Search engines index both variants, diluting SEO. Users bookmark one form and it breaks when the other becomes canonical.

**Why it happens:**
GitHub Pages has specific behavior around trailing slashes and `index.html` files. If the docs framework generates `quickstart/index.html`, GitHub Pages expects the trailing slash. If it generates `quickstart.html`, it does not. Most frameworks have a `trailingSlash` config option but the default varies and often mismatches GitHub Pages behavior.

**How to avoid:**
Explicitly set the trailing slash configuration in the framework config to match what GitHub Pages expects. For Starlight/Astro: set `trailingSlash: 'always'` in `astro.config.mjs` (Astro generates directory-style output by default, matching GitHub Pages expectations). Test both URL forms on the deployed site.

**Warning signs:**
- Same page accessible at two different URLs
- Redirects adding or removing trailing slashes
- Broken internal links that work in development but not production

**Phase to address:**
Phase 1 (project scaffolding) -- set trailing slash config alongside base URL.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding content instead of generating from source | Faster initial content creation | Every code change requires manual docs update | MVP only -- add generation for CLI reference later |
| Skipping link checking in CI | Simpler pipeline | Broken internal links accumulate silently | Never -- add a link checker from the start |
| Using default theme without customization | Ship faster | Docs look generic, no brand identity | Phase 1 only -- customize in polish phase |
| Committing `docs/node_modules/` | Avoids npm install in CI | Massive repo bloat, merge conflicts, slow clones | Never |
| Single monolithic docs page | No sidebar/navigation decisions needed | Unusable once content exceeds 3 pages | Never -- structure from day one |
| Skipping `docs/package-lock.json` from git | Smaller diffs | Non-reproducible builds, CI installs different versions | Never -- always commit the lock file |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub Pages source setting | Leaving on "Deploy from a branch" while using Actions workflow | Set to "GitHub Actions" in repo Settings > Pages > Source |
| GitHub Actions permissions | Relying on default permissions (insufficient for Pages) | Explicitly set `permissions: { pages: write, id-token: write, contents: read }` |
| npm publish pipeline | Docs build failure blocks npm publish | Keep docs deployment as a separate workflow file, not gated on npm publish |
| `.gitignore` vs npm `files` | Adding docs to `.gitignore` thinking it handles npm exclusion | The `files` whitelist in package.json handles npm exclusion independently |
| GitHub Actions caching | Not caching docs `node_modules` | Cache based on `docs/package-lock.json` hash to avoid 2-3 min install per build |
| Astro/Starlight build output | Uploading `docs/` instead of `docs/dist/` | Verify the exact output directory name in the framework docs |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Large unoptimized images | Slow page loads, artifact size limit hit | Use compressed PNGs/SVGs, avoid screenshots when diagrams suffice | Perceived performance degrades at 5MB+ per page |
| No dependency caching in GitHub Actions | Every build reinstalls all deps from scratch | Cache `docs/node_modules` keyed on `docs/package-lock.json` | Immediately -- every push takes 3+ minutes |
| Importing entire icon libraries | Bundle size bloats, build takes 30s+ | Import only specific icons used | When docs framework pulls in hundreds of unused SVGs |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing internal paths or secrets in docs screenshots | Leaks directory structure or credentials | Review all images before committing; use sanitized examples |
| GitHub Actions workflow with excessive permissions | Compromised action could write to repo | Use minimal permissions; pin action versions to commit SHA, not tags |
| Not pinning action versions | Supply chain attack via compromised tag | Pin to full SHA: `uses: actions/deploy-pages@abc123` |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visible version indicator | Users unsure if docs match their installed version | Show version in footer or sidebar, link to changelog |
| Dark mode flash on page load (FOUC) | Page flashes white then switches to dark | Starlight handles this via inline script reading preference before render -- do not customize this behavior |
| Sidebar too deep (3+ nesting levels) | Users get lost navigating | Keep sidebar to 2 levels max; use separate sections for major topics |
| Code examples without copy button | Users manually select and copy, introducing errors | Starlight includes copy buttons by default -- verify they work |
| Missing "Edit this page" link | Users who spot errors cannot contribute fixes | Enable `editLink` in Starlight config pointing to GitHub source |
| Search not keyboard accessible | Power users cannot use Cmd+K to search | Starlight provides Cmd+K by default -- do not break this |
| No 404 page with navigation | Users who hit a broken link are stranded | Configure a custom 404 page that includes site navigation |

## "Looks Done But Isn't" Checklist

- [ ] **Deployment:** Site renders on GitHub Pages -- verify CSS/JS loads, not just that HTML appears
- [ ] **Base URL:** Internal links work on deployed site, not just localhost -- click through every sidebar link
- [ ] **Search:** Search returns actual results on production build -- test with a real query like "install"
- [ ] **Mobile:** Site is readable on mobile viewport -- check sidebar collapse, code blocks do not overflow
- [ ] **Dark mode:** Both themes render correctly -- check code blocks, callouts, and admonitions in both modes
- [ ] **404 page:** Custom 404 exists with navigation back to docs -- test by visiting a broken URL
- [ ] **Trailing slashes:** URLs work consistently -- test with and without trailing slashes
- [ ] **npm package size:** `npm pack --dry-run` still shows only intended files -- docs directory is excluded
- [ ] **Favicon:** Custom favicon is set, not the framework default -- visible in browser tabs
- [ ] **Open Graph tags:** Sharing a docs link on Slack/Discord shows title and description, not a blank card
- [ ] **Link checker:** No broken internal links -- run a link checker against the built site
- [ ] **Root package.json unchanged:** No new dependencies added to root -- `git diff package.json` shows no changes

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Docs deps in root package.json | MEDIUM | Create `docs/package.json`, move deps, update CI, remove from root, regenerate lock file |
| Wrong base URL deployed | LOW | Fix config, redeploy -- but broken links may be cached by users and search engines |
| npm package includes docs | MEDIUM | Fix `files` array, publish patch version -- previous bloated version persists on npm |
| GitHub Actions permissions wrong | LOW | Update workflow YAML, re-run -- first deployment may require manual repo settings change |
| Stale documentation | HIGH | Audit all pages against current code -- time-consuming, prevention is far cheaper |
| Broken search index | LOW | Rebuild and redeploy -- usually a config fix |
| Trailing slash mismatch | MEDIUM | Fix framework config, redeploy, but old URLs may be bookmarked or indexed |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| npm package bloat | Phase 1 (scaffolding) | `npm pack --dry-run` shows no docs files |
| Wrong base URL | Phase 1 (scaffolding) | Production build serves correctly with `/domain-context-claude/` prefix |
| Wrong GitHub Actions artifact | Phase 2 (CI/CD) | Workflow deploys and site loads on GitHub Pages |
| Docs deps in root package.json | Phase 1 (scaffolding) | Root `package.json` has zero new dependencies |
| Docs drift from code | Phase 3 (content) + Phase 4 (polish) | Docs pages mirror code directory; CI warns on mismatch |
| Trailing slash inconsistency | Phase 1 (scaffolding) | Framework configured with explicit trailingSlash setting |
| Broken search | Phase 2 (CI/CD) | Search returns results on production build |
| Dark mode flash | Phase 1 (scaffolding) | No FOUC when loading in dark-preferred browser |
| Broken internal links | Phase 2 (CI/CD) | Link checker passes in CI |
| Missing mobile responsiveness | Phase 4 (polish) | Manual check on mobile viewport |
| GitHub Actions permissions | Phase 2 (CI/CD) | First workflow run succeeds without manual intervention |

## Sources

- [Docusaurus deployment documentation](https://docusaurus.io/docs/deployment) -- base URL and GitHub Pages configuration patterns
- [npm files and ignores documentation](https://github.com/npm/cli/wiki/Files-&-Ignores) -- `files` whitelist behavior, `.npmignore` precedence
- [Jeff Dickey: "Don't use .npmignore"](https://medium.com/@jdxcode/for-the-love-of-god-dont-use-npmignore-f93c08909d8d) -- whitelist vs blacklist for npm publish
- [GitHub Pages 404 troubleshooting](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites)
- [actions/deploy-pages](https://github.com/actions/deploy-pages) -- official GitHub Pages deployment action
- [VitePress site config](https://vitepress.dev/reference/site-config) -- dark mode appearance settings, FOUC prevention
- [InfoQ: Continuous Documentation](https://www.infoq.com/articles/continuous-documentation/) -- docs-code sync strategies
- Direct analysis of project `package.json` `files` whitelist: `["commands/", "agents/", "hooks/", "rules/", "templates/", "tools/", "bin/"]` -- docs automatically excluded

---
*Pitfalls research for: Adding documentation site to domain-context-cc npm package (v1.4)*
*Researched: 2026-03-17*
