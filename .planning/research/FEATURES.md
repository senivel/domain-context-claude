# Feature Research

**Domain:** Developer tool documentation site (for a Claude Code extension)
**Researched:** 2026-03-17
**Confidence:** HIGH

## Scope

This file covers the v1.4 milestone features only: a documentation site for domain-context-cc, deployed on GitHub Pages. Features from v1.0-v1.3 (skills, hooks, rule, agent, installer) are prerequisites, not scope.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist on any developer documentation site in 2026. Missing these makes the project look amateur or unfinished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Sidebar navigation | Every doc site has one. Developers navigate by scanning headings, not reading linearly. | LOW | All major JS doc frameworks generate this from file structure or config. Zero custom code. |
| Full-text search | Developers search, not browse. No search = users leave immediately. | LOW | Built-in with all modern frameworks. VitePress uses MiniSearch, Starlight uses Pagefind. Zero config. |
| Dark/light mode toggle | Developer audience overwhelmingly uses dark mode. Must support both with a toggle. | LOW | Built into VitePress, Starlight, and Docusaurus default themes. Single config line. |
| Code syntax highlighting | Documentation for a CLI/code tool without highlighted code blocks is unusable. | LOW | All frameworks use Shiki or Prism. Supports 100+ languages out of the box. |
| Copy-to-clipboard on code blocks | Users copy install commands and code snippets constantly. Missing this is noticeable friction. | LOW | Built into VitePress and Starlight by default. |
| Responsive/mobile layout | Users read docs on phones and on laptops with limited screen space. | LOW | All modern doc frameworks are responsive by default. No effort required. |
| GitHub Pages deployment | Free, standard hosting for open-source projects. Users expect docs at a predictable URL. | LOW | All JS doc frameworks output static files. GitHub Actions workflow is straightforward. |
| CI/CD automated builds | Docs must rebuild on push to main. Manual deployment is a maintenance failure waiting to happen. | LOW | Single GitHub Actions workflow file. Frameworks have official deploy guides. |
| Quickstart page | First thing a new user looks for. Must get them from zero to working in under 5 minutes. | MEDIUM | Content effort, not framework effort. Existing README quickstart can be expanded. |
| CLI command reference | For a tool with 6 commands, users need a reference page with descriptions, usage, and examples. | MEDIUM | Content effort. Each dc:* command needs its own section. Existing README has a compact version. |
| Architecture/concepts page | Users need to understand how the bridge pattern works, what hooks do, what .context/ contains. | MEDIUM | Content effort. ARCHITECTURE.md exists but is written for contributors, not end users. |
| Spec overview page | Users need to understand Domain Context without reading the full spec. | MEDIUM | Content effort. Summarize key concepts, link to full spec repo. |
| Contributing guide | Open-source project without contribution docs discourages community involvement. | LOW | Content effort. Standard structure: setup, conventions, PR process. |
| Landing/home page | First impression. Must communicate what the tool does and how to install it in seconds. | LOW | Hero section with tagline, install command, and feature highlights. Framework-provided layout. |

### Differentiators (Competitive Advantage)

Features that would make this doc site stand out from typical small-project documentation.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Architecture diagrams (Mermaid) | Visual representation of the AGENTS.md bridge pattern and hook lifecycle. Makes "how it works" immediately clear. | LOW | Mermaid renders natively in VitePress and Starlight. Embed in markdown. |
| Tabbed content blocks | Show install commands for global vs local, or before/after examples. Reduces page clutter. | LOW | Built into VitePress (code groups), Starlight (Tabs component). |
| "Edit this page" links | Each page links to its GitHub source. Lowers the contribution barrier for doc fixes. | LOW | Single config option in all major frameworks. |
| Terminal demo recordings | Showing dc:init creating a .context/ directory is worth 1000 words. Animated SVG recordings make the tool tangible. | MEDIUM | Requires recording terminal sessions with asciinema or similar. Content creation effort. |
| Diataxis content architecture | Separating tutorials, explanations, how-tos, and reference following the Diataxis framework. Most small projects dump everything into one flat structure. | MEDIUM | Content organization effort. Requires deliberate information architecture decisions. |
| Spec cross-references | Link documentation back to the Domain Context specification. Unique positioning as the reference implementation. | LOW | Internal linking between doc pages. Content effort only. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for a project of this scope.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Version selector / versioned docs | "Users on old versions need matching docs" | Project is pre-1.0 in adoption terms. Versioned docs add build complexity, maintenance burden, and confuse users when only one meaningful version exists. | Add a Changelog page later. Version docs only when breaking changes affect a real user population. |
| Blog section | "Announce releases and share updates" | Blog content goes stale, creates maintenance burden, splits attention from core docs. GitHub Releases serves the same purpose for a small project. | Link to GitHub Releases from the docs. |
| i18n / multilingual | "Reach international audience" | Translation maintenance is enormous. One stale translation is worse than no translation. This project targets English-speaking Claude Code users. | Keep English-only. Accept community translation PRs only with a maintenance commitment. |
| Custom theme / heavy branding | "Stand out visually" | Custom CSS requires maintenance, breaks on framework upgrades, and delays launch. Modern doc framework defaults look professional. | Use framework default theme with minor color/logo customization only. |
| API docs auto-generation | "Generate docs from code comments" | This project has no runtime API. It is markdown skills, Node.js hooks, and shell scripts. JSDoc generation adds complexity for zero value. | Write CLI reference manually. The 6 commands are stable and well-defined. |
| Comments / discussion on pages | "Let users ask questions in context" | Adds third-party dependency (Giscus/Disqus), moderation burden, fragments discussion away from GitHub Issues. | Link to GitHub Issues from pages. |
| Full CMS / WYSIWYG editing | "Easy for non-technical contributors" | All contributors are developers. Markdown in Git is the natural workflow. A CMS adds deployment complexity for no audience benefit. | Standard Git workflow with "Edit this page" links. |

---

## Feature Dependencies

```
[Framework Setup + Config]
    ├──enables──> [Sidebar Navigation] (auto-generated)
    ├──enables──> [Full-Text Search] (built-in)
    ├──enables──> [Dark/Light Mode] (built-in)
    ├──enables──> [Code Highlighting + Copy] (built-in)
    ├──enables──> [Responsive Design] (built-in)
    └──enables──> [Content Pages]
                      ├── [Landing Page]
                      ├── [Quickstart Guide]
                      ├── [User Guide]
                      ├── [CLI Command Reference]
                      ├── [Architecture/Concepts Page]
                      ├── [Spec Overview Page]
                      └── [Contributing Guide]

[GitHub Pages + CI/CD]
    └──requires──> [Framework Setup]

[Mermaid Diagrams] ──enhances──> [Architecture/Concepts Page]
    └──requires──> [Framework Setup] (plugin/config)

[Tabbed Content] ──enhances──> [CLI Command Reference]
    └──requires──> [Framework Setup]

[Terminal Demos] ──enhances──> [Quickstart Guide]
    └──independent of──> [Framework] (external recordings embedded as images/SVG)

["Edit This Page" Links]
    └──requires──> [GitHub Pages Deploy Config]
```

### Dependency Notes

- **Framework setup is the critical path**: Every other feature depends on having the doc framework initialized. This must be the first task.
- **Content pages are independent of each other**: Quickstart, CLI reference, architecture page, etc. can be written in parallel once the framework is set up.
- **Built-in features come free with framework setup**: Sidebar, search, dark mode, code highlighting, copy button, and responsive design require zero custom implementation. They are configuration, not code.
- **CI/CD depends on framework setup**: The GitHub Actions workflow needs to know the build command and output directory.
- **Mermaid diagrams need a framework plugin/config**: Not all frameworks support Mermaid out of the box, but both VitePress and Starlight have trivial plugin setup.

---

## MVP Definition

### Launch With (v1.4)

Minimum viable documentation site -- what is needed to replace the README as the primary documentation surface.

- [ ] Framework initialized with build tooling -- foundation for everything else
- [ ] GitHub Pages deployment with GitHub Actions CI/CD -- docs are live and auto-update
- [ ] Landing/home page -- project overview, value prop, install command
- [ ] Quickstart guide -- expanded from README, get users from zero to working
- [ ] User guide -- how to use each feature in a workflow context
- [ ] CLI command reference -- all 6 dc:* commands with descriptions, usage, examples
- [ ] Architecture/concepts page -- bridge pattern, hook lifecycle, .context/ structure
- [ ] Domain Context spec overview -- what the spec is and how this tool implements it
- [ ] Contributing guide -- setup, conventions, PR process
- [ ] Sidebar navigation, search, dark/light mode, code highlighting, copy button, responsive design -- all framework defaults, no custom work

### Add After Validation (v1.x)

Features to add once the docs site is live and receiving traffic.

- [ ] Mermaid architecture diagrams -- when users report confusion about component relationships
- [ ] Tabbed content blocks -- when CLI reference benefits from global/local variants side by side
- [ ] "Edit this page" links -- when contribution rate is low and docs have known gaps
- [ ] Terminal demo recordings -- when quickstart page bounce rate suggests users need visual guidance

### Future Consideration (v2+)

Features to defer until the project has meaningful adoption.

- [ ] Versioned documentation -- only when breaking changes affect a real installed base
- [ ] Blog / announcements section -- only if GitHub Releases proves insufficient
- [ ] Changelog page -- only when release history warrants a dedicated page

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Framework setup + config | HIGH | MEDIUM | P1 |
| GitHub Pages + CI/CD workflow | HIGH | LOW | P1 |
| Landing page | HIGH | LOW | P1 |
| Quickstart guide | HIGH | MEDIUM | P1 |
| CLI command reference | HIGH | MEDIUM | P1 |
| User guide | HIGH | MEDIUM | P1 |
| Architecture/concepts page | MEDIUM | MEDIUM | P1 |
| Spec overview page | MEDIUM | LOW | P1 |
| Contributing guide | MEDIUM | LOW | P1 |
| Sidebar navigation | HIGH | LOW | P1 (framework default) |
| Full-text search | HIGH | LOW | P1 (framework default) |
| Dark/light mode | MEDIUM | LOW | P1 (framework default) |
| Code highlighting + copy | HIGH | LOW | P1 (framework default) |
| Responsive design | MEDIUM | LOW | P1 (framework default) |
| Mermaid architecture diagrams | MEDIUM | LOW | P2 |
| Tabbed content blocks | LOW | LOW | P2 |
| "Edit this page" links | LOW | LOW | P2 |
| Terminal demo recordings | MEDIUM | MEDIUM | P2 |
| Versioned docs | LOW | HIGH | P3 |
| Blog section | LOW | MEDIUM | P3 |
| i18n | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch -- these define the v1.4 milestone
- P2: Should have, add when possible -- low-effort enhancements post-launch
- P3: Nice to have, future consideration -- only with demonstrated need

---

## Competitor Feature Analysis

| Feature | Material for MkDocs (reference) | VitePress | Starlight (Astro) | Our Approach |
|---------|--------------------------------|-----------|-------------------|--------------|
| Sidebar nav | Config-based, collapsible | Config or auto-gen, collapsible | Auto-gen from file structure | Use framework auto-generation |
| Search | Built-in, runs in browser | MiniSearch, one-line config | Pagefind, zero config | Framework built-in, no external service |
| Dark/light mode | Toggle built-in | Toggle built-in | Dark default, toggle available | Framework default toggle |
| Code highlighting | Pygments | Shiki (100+ languages) | Shiki | Framework default (Shiki preferred) |
| Copy button | Built-in | Built-in | Built-in | Framework default |
| Tabs | Built-in | Code groups (code blocks only) | Starlight Tabs component (any content) | Framework's tab mechanism |
| Versioning | mike plugin | No built-in | No built-in | Skip for v1.4 |
| Mermaid diagrams | Plugin available | Plugin available | Plugin available | Add as P2 enhancement |
| Deploy to GitHub Pages | Supported | Official guide | Official guide | GitHub Pages with Actions |
| Language ecosystem | Python/pip | Node.js/npm | Node.js/npm | Must be Node.js (matches project stack) |

**Key insight:** Material for MkDocs requires Python, which conflicts with this project's Node.js ecosystem. VitePress and Starlight are both Node.js-native and provide all table-stakes features out of the box. The framework choice is a STACK.md decision, not a features decision.

---

## Content Inventory (Existing Assets)

Content that already exists and can be adapted for the doc site, reducing content creation effort.

| Target Page | Source | Adaptation Needed |
|-------------|--------|-------------------|
| Landing page | README.md | Extract hero content, badges, value prop |
| Quickstart | README.md "Quick Start" section | Expand with more detail and expected output |
| CLI command reference | README.md "Commands" section | Split into per-command sections with examples and edge cases |
| Architecture/concepts | ARCHITECTURE.md | Restructure for external audience (less contributor-focused) |
| GSD integration | README.md "GSD Integration" section | Expand into standalone user guide section |
| Spec overview | ~/code/domain-context/SPEC.md | Summarize key concepts, link to full spec |
| Installation details | README.md "Installation" + "Uninstall" sections | Document all modes (global/local/uninstall) with examples |
| What gets installed | README.md "What Gets Installed" section | Expand into architecture explanation |

---

## Sources

- [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) -- reference site, feature inventory
- [VitePress](https://vitepress.dev/) -- framework features, config options, markdown extensions
- [Starlight by Astro](https://starlight.astro.build/) -- framework features, built-in search and i18n
- [Docusaurus](https://docusaurus.io/docs/) -- framework comparison baseline
- [Starlight vs Docusaurus - LogRocket](https://blog.logrocket.com/starlight-vs-docusaurus-building-documentation/) -- framework feature comparison
- [VitePress vs Starlight - DEV Community](https://dev.to/kevinbism/coding-the-perfect-documentation-deciding-between-vitepress-and-astro-starlight-2i11) -- framework comparison
- [Documentation Generator Comparison 2025](https://okidoki.dev/documentation-generator-comparison) -- multi-framework overview

---
*Feature research for: domain-context-cc documentation site (v1.4 milestone)*
*Researched: 2026-03-17*
