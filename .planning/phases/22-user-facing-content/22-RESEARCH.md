# Phase 22: User-Facing Content - Research

**Researched:** 2026-03-17
**Domain:** Starlight (Astro) documentation content authoring, MDX, sidebar navigation
**Confidence:** HIGH

## Summary

This phase delivers four content pages for the existing Starlight documentation site: a splash landing page, quickstart guide, user guide, and CLI reference. The site infrastructure (Astro 6.0.5, Starlight 0.38.1) is already scaffolded and deployed via GitHub Pages from Phase 20-21. The work is primarily content authoring in MDX using Starlight's built-in components and frontmatter configuration, plus sidebar restructuring from one group to three.

Content sources are well-defined: the README.md contains comprehensive install instructions, command descriptions, and GSD integration details; the six skill files in `commands/dc/` contain detailed usage, descriptions, and process steps for each CLI command. The existing `index.mdx` is a placeholder that needs full hero content.

**Primary recommendation:** Use Starlight's built-in components (Steps, Card/CardGrid, LinkCard) for structured content, keep all pages as `.mdx` files, and structure the sidebar with three explicit groups using `autogenerate` for the `guides/` and `reference/` directories with `sidebar.order` frontmatter to control page ordering.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Three sidebar groups: "Start Here", "Guides", "Reference"
- Single-page quickstart (not multi-step wizard)
- Single-page CLI reference with anchor sections per command
- Splash hero landing page with value prop and install command
- Concise and practical tone, short sentences, action-oriented
- CLI reference: usage syntax + 1-line description + 2-3 examples with output
- Terminal output code blocks (no screenshots)
- Single recommended install path (global npx) with note about local
- Source CLI command details from skill files in `commands/dc/`
- Inline links at point of mention for cross-references
- GSD integration as a dedicated subsection in the user guide
- README.md workflow sections as primary content source for quickstart and user guide

### Claude's Discretion
- Page ordering within sidebar groups
- Exact heading hierarchy within pages
- Whether to include a "What is Domain Context?" intro paragraph on the landing page vs jumping straight to value prop

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-01 | Landing page with project overview, value proposition, and install command | Starlight splash template with hero frontmatter; Card/CardGrid components for feature highlights |
| CONT-02 | Quickstart guide -- zero to working in under 5 minutes | Steps component for numbered instructions; content sourced from README Quick Start and dc:init skill |
| CONT-03 | User guide -- full workflow walkthrough of all features | MDX with code blocks, asides, and inline cross-links; content sourced from README command descriptions and all 6 skill files |
| CONT-04 | CLI command reference -- all 6 dc:* commands with usage, descriptions, and examples | Single page with H2 anchors per command; usage syntax in code blocks; content sourced from skill file frontmatter and process steps |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @astrojs/starlight | 0.38.1 | Documentation framework | Already installed in Phase 20 |
| astro | 6.0.5 | Build framework | Already installed in Phase 20 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @astrojs/starlight/components | (bundled) | Steps, Card, CardGrid, LinkCard | Landing page features, quickstart numbered steps |

### Alternatives Considered
No new libraries needed -- this phase is pure content authoring using existing infrastructure.

## Architecture Patterns

### Recommended Content Structure
```
docs/src/content/docs/
├── index.mdx                      # Landing page (splash template)
├── getting-started/
│   └── quickstart.mdx             # Quickstart guide
├── guides/
│   └── user-guide.mdx             # Full workflow user guide
└── reference/
    └── cli.mdx                    # CLI command reference
```

### Pattern 1: Sidebar Configuration with Three Groups
**What:** Replace the single autogenerate group with three labeled groups
**When to use:** This is the required sidebar structure from user decisions
**Example:**
```javascript
// Source: https://starlight.astro.build/guides/sidebar/
sidebar: [
  {
    label: 'Start Here',
    autogenerate: { directory: 'getting-started' },
  },
  {
    label: 'Guides',
    autogenerate: { directory: 'guides' },
  },
  {
    label: 'Reference',
    autogenerate: { directory: 'reference' },
  },
],
```

### Pattern 2: Splash Landing Page with Hero
**What:** Full-width landing page with hero section, install command, and feature cards
**When to use:** index.mdx -- the site's entry point
**Example:**
```yaml
# Source: https://starlight.astro.build/reference/frontmatter/
---
title: Domain Context for Claude Code
description: Codify and maintain domain knowledge alongside code so AI assistants always have accurate business context.
template: splash
hero:
  tagline: Make Claude Code natively aware of your project's domain knowledge.
  actions:
    - text: Get Started
      link: /domain-context-claude/getting-started/quickstart/
      icon: right-arrow
      variant: primary
    - text: View on GitHub
      link: https://github.com/senivel/domain-context-claude
      icon: external
      variant: minimal
---
```

### Pattern 3: Steps Component for Quickstart
**What:** Visually styled numbered steps for sequential instructions
**When to use:** Quickstart guide's install-and-init flow
**Example:**
```mdx
// Source: https://starlight.astro.build/components/steps/
import { Steps } from '@astrojs/starlight/components';

<Steps>
1. Install domain-context-cc:
   ```bash
   npx domain-context-cc
   ```

2. Initialize domain context in your project:
   ```
   /dc:init
   ```

3. Start working -- Claude Code is now domain-context-aware.
</Steps>
```

### Pattern 4: CLI Reference with Anchor Sections
**What:** Single page with H2 per command for deep-linkable reference
**When to use:** CLI reference page (CONT-04)
**Example:**
```mdx
---
title: CLI Reference
description: Complete reference for all dc:* commands.
---

## dc:init

Initialize Domain Context in the current project.

**Usage:**
```
/dc:init
```

**What it does:**
Creates the `.context/` directory with MANIFEST.md, domain/, decisions/, and constraints/ subdirectories.

**Examples:**
```bash title="Initialize a new project"
/dc:init
```
```
Domain Context initialized:
  .context/MANIFEST.md     created
  .context/domain/         created
  ...
```
```

### Pattern 5: Asides for Important Notes
**What:** Callout boxes for tips, cautions, and important notes
**When to use:** Throughout guides for important context
**Example:**
```mdx
:::note
Domain Context requires Node.js 20+ and Claude Code.
:::

:::tip
If you use GSD, `/dc:init` automatically adds the bridge snippet to AGENTS.md.
:::
```

### Pattern 6: Card/CardGrid for Landing Page Features
**What:** Feature highlight cards on the splash page
**When to use:** Landing page feature overview section
**Example:**
```mdx
// Source: https://starlight.astro.build/components/cards/
import { Card, CardGrid } from '@astrojs/starlight/components';

<CardGrid>
  <Card title="Initialize" icon="pencil">
    Scaffold `.context/` with templates, MANIFEST.md, and project wiring.
  </Card>
  <Card title="Explore" icon="open-book">
    Browse domain knowledge with freshness tracking and keyword search.
  </Card>
  <Card title="Validate" icon="approve-check-circle">
    Check structural integrity -- broken links, orphans, stale entries.
  </Card>
  <Card title="Extract" icon="rocket">
    Promote knowledge from GSD planning artifacts into permanent context.
  </Card>
</CardGrid>
```

### Pattern 7: Base URL in Internal Links
**What:** All internal links must include the `/domain-context-claude/` base path
**When to use:** Every internal cross-reference
**Why:** The site is deployed at `https://senivel.github.io/domain-context-claude/`
**Example:**
```mdx
See the [CLI Reference](/domain-context-claude/reference/cli/) for full command details.
```

### Anti-Patterns to Avoid
- **Relative links without base path:** Links like `/getting-started/quickstart/` will 404 on GitHub Pages. Always prefix with `/domain-context-claude/`.
- **Screenshots instead of code blocks:** User decision specifies terminal output in code blocks, not screenshots.
- **Multiple install paths given equal weight:** User decision specifies single recommended path (global npx) with a note about local.
- **Duplicating skill file process steps verbatim:** The CLI reference should summarize behavior, not reproduce the full internal skill process. Focus on user-facing usage, not implementation detail.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Numbered steps styling | Custom CSS for numbered lists | `<Steps>` component | Built-in, consistent with Starlight design system |
| Feature cards layout | Custom grid HTML | `<CardGrid>` + `<Card>` | Responsive, themed, accessible out of the box |
| Navigation cards | Custom link boxes | `<LinkCard>` | Built-in hover states, consistent styling |
| Code syntax highlighting | Custom highlighter | Fenced code blocks with language tags | Expressive Code built into Starlight |
| Callout/aside boxes | Custom blockquote styling | `:::note` / `:::tip` / `:::caution` | Native Starlight aside syntax |

**Key insight:** Starlight provides all the components needed for documentation content. Using built-in components ensures theme consistency and avoids upgrade breakage.

## Common Pitfalls

### Pitfall 1: Base URL Omission in Internal Links
**What goes wrong:** Internal links work in dev (`localhost:4321`) but 404 on GitHub Pages
**Why it happens:** The site uses `base: '/domain-context-claude'` in astro.config.mjs, so all paths need the prefix
**How to avoid:** Always use absolute paths starting with `/domain-context-claude/` for internal links
**Warning signs:** Links work locally but break after deploy; lychee CI catches broken links post-push

### Pitfall 2: Using .md Instead of .mdx for Component Pages
**What goes wrong:** Starlight components (Steps, Card, etc.) silently fail or render as text
**Why it happens:** Component imports and JSX syntax require MDX, not plain Markdown
**How to avoid:** Use `.mdx` extension for any page that imports components
**Warning signs:** Raw JSX tags visible in rendered output

### Pitfall 3: Sidebar Directory Mismatch
**What goes wrong:** Pages don't appear in the sidebar
**Why it happens:** The `autogenerate: { directory: 'guides' }` expects files in `docs/src/content/docs/guides/`, not elsewhere
**How to avoid:** Ensure file paths match the sidebar `directory` values exactly
**Warning signs:** Empty sidebar sections; pages accessible by URL but not navigable

### Pitfall 4: Hero Action Links Without Base Path
**What goes wrong:** "Get Started" button on landing page leads to 404
**Why it happens:** Hero action `link` values need the full base path, same as regular links
**How to avoid:** Use `/domain-context-claude/getting-started/quickstart/` not `/getting-started/quickstart/`
**Warning signs:** Clicking hero buttons leads to GitHub Pages 404

### Pitfall 5: Content Drift from Source Material
**What goes wrong:** Documentation says one thing, skill files do another
**Why it happens:** Content is manually derived from README and skill files; easy to paraphrase incorrectly
**How to avoid:** Cross-reference each command's documented behavior against its skill file before finalizing; use README descriptions verbatim where possible
**Warning signs:** Users report documentation doesn't match actual command behavior

## Code Examples

Verified patterns from official sources:

### Complete Splash Landing Page
```mdx
// Source: https://starlight.astro.build/reference/frontmatter/
---
title: Domain Context for Claude Code
description: Codify and maintain domain knowledge alongside code so AI assistants always have accurate business context.
template: splash
hero:
  tagline: Make Claude Code natively aware of your project's domain knowledge.
  actions:
    - text: Get Started
      link: /domain-context-claude/getting-started/quickstart/
      icon: right-arrow
      variant: primary
    - text: View on GitHub
      link: https://github.com/senivel/domain-context-claude
      icon: external
      variant: minimal
---

import { Card, CardGrid } from '@astrojs/starlight/components';

## What you get

<CardGrid>
  <Card title="Initialize" icon="pencil">
    Scaffold `.context/` directories and wire your project files.
  </Card>
  <Card title="Validate" icon="approve-check-circle">
    Detect broken links, orphans, and stale entries.
  </Card>
</CardGrid>
```

### Quickstart with Steps
```mdx
// Source: https://starlight.astro.build/components/steps/
---
title: Quickstart
description: Go from zero to a working .context/ directory in under 5 minutes.
---

import { Steps } from '@astrojs/starlight/components';

## Prerequisites

- Node.js 20+
- [Claude Code](https://claude.ai/code)

## Install and Initialize

<Steps>
1. Install domain-context-cc globally:
   ```bash
   npx domain-context-cc
   ```

2. Open your project in Claude Code and run:
   ```
   /dc:init
   ```

3. Claude Code is now domain-context-aware. Start working normally.
</Steps>
```

### CLI Reference Command Section
```mdx
## dc:init

Initialize Domain Context in the current project.

```
/dc:init
```

Creates the `.context/` directory with MANIFEST.md, domain/, decisions/, and constraints/ subdirectories. Scaffolds ARCHITECTURE.md, wires AGENTS.md with the domain-context snippet, and creates CLAUDE.md with an `@AGENTS.md` pointer.

Detects GSD projects (`.planning/PROJECT.md`) and adds the bridge snippet automatically.

**Example output:**
```
Domain Context initialized:

  .context/MANIFEST.md     created
  .context/domain/         created
  .context/decisions/      created
  .context/constraints/    created
  ARCHITECTURE.md          created
  AGENTS.md                created
  AGENTS.md (GSD)          skipped
  CLAUDE.md                created
  .gitignore               updated

  7 created, 1 skipped, 1 updated
```
```

### Sidebar Configuration
```javascript
// Source: https://starlight.astro.build/guides/sidebar/
// docs/astro.config.mjs
sidebar: [
  {
    label: 'Start Here',
    autogenerate: { directory: 'getting-started' },
  },
  {
    label: 'Guides',
    autogenerate: { directory: 'guides' },
  },
  {
    label: 'Reference',
    autogenerate: { directory: 'reference' },
  },
],
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Starlight v0.x sidebar strings | Sidebar with slug/link objects and autogenerate | Starlight 0.30+ | Sidebar items can reference pages by slug or use directory autogeneration |
| Astro content collections v1 API | `docsLoader()` + `docsSchema()` in content.config.ts | Astro 6.0 | Already configured in Phase 20 |
| Starlight social as object | Social as array with `{ icon, label, href }` | Starlight 0.33+ | Already configured in Phase 20 |

**Deprecated/outdated:**
- Starlight social `{ github: 'url' }` object syntax: replaced by array syntax in v0.33+

## Content Source Mapping

This section maps each page to its primary content sources to guide the planner.

### Landing Page (CONT-01)
- **Value proposition:** README.md first paragraph and project description
- **Install command:** README.md Installation section (`npx domain-context-cc`)
- **Feature highlights:** README.md Commands table (6 commands)
- **What Gets Installed:** README.md "What Gets Installed" section

### Quickstart (CONT-02)
- **Prerequisites:** README.md ("Requires Node.js 20+ and Claude Code")
- **Install steps:** README.md Quick Start section (3 steps)
- **Init details:** `commands/dc/init.md` (what gets created, output format from Step 10)
- **Next steps:** Links to user guide and CLI reference

### User Guide (CONT-03)
- **Workflow overview:** README.md command descriptions (paragraphs after the table)
- **dc:init workflow:** `commands/dc/init.md` (template resolution, metadata inference, GSD detection)
- **dc:explore usage:** `commands/dc/explore.md` (summary display, keyword search, drill-in)
- **dc:validate usage:** `commands/dc/validate.md` (check types, fix flow)
- **dc:add usage:** `commands/dc/add.md` (type selection, freeform input, preview)
- **dc:refresh usage:** `commands/dc/refresh.md` (staleness detection, accuracy assessment)
- **dc:extract usage:** `commands/dc/extract.md` (phase scanning, proposal table, accept/reject)
- **GSD integration:** README.md "GSD Integration" section + `commands/dc/extract.md`

### CLI Reference (CONT-04)
- **Per command:** Skill file frontmatter `description` field for 1-line summary
- **Usage syntax:** Each command is invoked as `/dc:{name}` with optional arguments
- **Examples with output:** Derived from skill file process steps (Step 10 summaries, display formats)
- **Arguments:** Skill file process steps that check for arguments (explore keyword, extract range, add type)

## Open Questions

1. **Starlight icon names for Card components**
   - What we know: Icons use string names like "pencil", "open-book", "rocket", "approve-check-circle"
   - What's unclear: Full list of available icon names in Starlight 0.38.1
   - Recommendation: Use well-known icon names from Starlight docs examples; test in dev mode to verify rendering

2. **Trailing slash behavior for internal links**
   - What we know: Astro/Starlight typically expects trailing slashes on internal links (e.g., `/path/to/page/`)
   - What's unclear: Whether the current build config enforces trailing slashes
   - Recommendation: Use trailing slashes consistently in all internal links to match Astro defaults

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Astro build + lychee link checker |
| Config file | `docs/astro.config.mjs` + `.github/workflows/deploy-docs.yml` |
| Quick run command | `cd docs && npm run build` |
| Full suite command | `cd docs && npm run build && lychee --base 'https://senivel.github.io/domain-context-claude' dist/` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | Landing page renders with hero, value prop, install command | smoke | `cd docs && npm run build` (build succeeds) | N/A -- content file |
| CONT-02 | Quickstart page renders and all links resolve | smoke + link-check | `cd docs && npm run build && lychee --base 'https://senivel.github.io/domain-context-claude' dist/` | N/A -- content file |
| CONT-03 | User guide page renders and all links resolve | smoke + link-check | Same as CONT-02 | N/A -- content file |
| CONT-04 | CLI reference page renders with all 6 commands documented | smoke + link-check | Same as CONT-02 | N/A -- content file |

### Sampling Rate
- **Per task commit:** `cd docs && npm run build` (build succeeds = no syntax errors)
- **Per wave merge:** Full build + lychee link check
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None -- existing test infrastructure (Astro build + lychee CI) covers all phase requirements. No new test files needed for content pages.

## Sources

### Primary (HIGH confidence)
- Starlight official docs - [Sidebar Navigation](https://starlight.astro.build/guides/sidebar/) - group configuration, autogenerate, frontmatter ordering
- Starlight official docs - [Frontmatter Reference](https://starlight.astro.build/reference/frontmatter/) - splash template, hero config, sidebar.order
- Starlight official docs - [Authoring Content](https://starlight.astro.build/guides/authoring-content/) - code blocks, asides, linking
- Starlight official docs - [Steps Component](https://starlight.astro.build/components/steps/) - numbered instruction styling
- Starlight official docs - [Cards Component](https://starlight.astro.build/components/cards/) - Card, CardGrid props and usage
- Starlight official docs - [LinkCard Component](https://starlight.astro.build/components/link-cards/) - navigation cards
- Installed packages verified: @astrojs/starlight 0.38.1, astro 6.0.5 (npm registry)

### Secondary (MEDIUM confidence)
- Existing project files: `README.md`, `docs/astro.config.mjs`, `docs/src/content/docs/index.mdx` (direct inspection)
- Skill files in `commands/dc/` (6 files, direct inspection) -- authoritative source for CLI behavior

### Tertiary (LOW confidence)
- Icon name availability for Card components -- inferred from Starlight docs examples, not exhaustively verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- already installed and verified in Phase 20-21
- Architecture: HIGH -- Starlight sidebar/content patterns well-documented in official docs
- Pitfalls: HIGH -- base URL issue verified from project config; MDX/md distinction documented
- Content sourcing: HIGH -- README and skill files directly inspected

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable -- Starlight API unlikely to change within 30 days)
