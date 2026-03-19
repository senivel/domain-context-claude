# Phase 23: Conceptual and Contributor Content - Research

**Researched:** 2026-03-18
**Domain:** Starlight MDX documentation content (conceptual/architectural pages + contributor guide)
**Confidence:** HIGH

## Summary

This phase creates three MDX pages in the existing Starlight docs site: an architecture/concepts page, a spec overview page, and a contributing guide. All three go in `docs/src/content/docs/guides/` and will appear in the "Guides" sidebar group via autogeneration.

The primary source material already exists in the project: ARCHITECTURE.md, `.context/domain/integration-model.md`, `.context/domain/claude-code-extensions.md`, `.context/decisions/`, AGENTS.md, and README.md. The work is content authoring -- transforming internal project documentation into user-facing explanations -- not technical implementation.

**Primary recommendation:** Author three `.mdx` files following the established tone and patterns from Phase 22 (concise, action-oriented, Starlight admonitions, cross-links at point of mention). Source content verbatim from existing project files rather than inventing descriptions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Architecture/concepts page: conceptual bridge pattern overview with text diagram (CLAUDE.md -> AGENTS.md -> .context/ chain), reproduce module map table from ARCHITECTURE.md, brief hook lifecycle section (what users observe, not internals), .context/ directory tree with annotations
- Spec overview page: cover what the spec is, three pillars (domain concepts, decisions, constraints), required directory structure, how this tool implements it. Clear positioning: "The spec defines the format; this tool automates the workflow." One brief example of domain concept file structure. Prominent link to github.com/senivel/domain-context at top and bottom
- Contributing guide: step-by-step local dev setup (clone, node bin/install.js --local, validate, test with npm pack), code conventions (skill/hook/template format, naming from AGENTS.md), brief PR process (fork, branch from main, imperative commits, context changes reviewed like code), brief directory listing with purpose

### Claude's Discretion
- Exact heading hierarchy within pages
- Whether to use Starlight admonitions (:::tip, :::note) for callouts
- Order of sections within each page
- Whether to include a "Prerequisites" section on the contributing guide

### Deferred Ideas (OUT OF SCOPE)
- Mermaid diagrams for architecture page -- deferred to Phase 24 (Visual Enhancements)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-05 | Architecture/concepts page -- bridge pattern, hook lifecycle, .context/ structure | Source from ARCHITECTURE.md, integration-model.md, claude-code-extensions.md. Text diagram of bridge chain. Module map table. Directory tree annotation. |
| CONT-06 | Domain Context spec overview -- what the spec is and how this tool implements it | Source from integration-model.md, README.md spec links. Three pillars structure. Example domain concept file. Link to github.com/senivel/domain-context. |
| CONT-07 | Contributing guide -- setup, conventions, PR process | Source from AGENTS.md (Build & Run, Code Conventions, Workflow sections). Root directory listing. npm pack test flow. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @astrojs/starlight | 0.33+ | Documentation framework | Already installed and configured in Phase 20 |
| Astro | 6.x | Site generator | Already installed |

### Supporting
No additional libraries needed. All three pages are pure MDX content using existing Starlight components.

### Starlight Components Available
| Component | Import | Use Case |
|-----------|--------|----------|
| Steps | `@astrojs/starlight/components` | Step-by-step setup in contributing guide |
| Card/CardGrid | `@astrojs/starlight/components` | Not needed for these pages |
| Admonitions | Built-in (:::tip, :::note, :::caution) | Callouts for important notes |

## Architecture Patterns

### File Placement
All three pages go in:
```
docs/src/content/docs/guides/
  architecture.mdx      # CONT-05
  spec-overview.mdx     # CONT-06
  contributing.mdx      # CONT-07
```

These will auto-appear in the "Guides" sidebar group due to the `autogenerate: { directory: 'guides' }` config in `astro.config.mjs`. Starlight sorts alphabetically by default, so filenames affect sidebar order. The existing `user-guide.mdx` will sort after all three new files.

### Sidebar Ordering
Starlight autogenerate uses alphabetical file sorting. Current and new files:
- `architecture.mdx` (new)
- `contributing.mdx` (new)
- `spec-overview.mdx` (new)
- `user-guide.mdx` (existing)

To control order, use frontmatter `sidebar: { order: N }`. Recommended order:
1. User Guide (practical, most visited)
2. Architecture & Concepts (understanding)
3. Spec Overview (reference)
4. Contributing (contributor-facing)

### MDX Frontmatter Pattern
Follow established pattern from existing pages:
```mdx
---
title: Architecture & Concepts
description: How the bridge pattern, hooks, and .context/ directory work together.
sidebar:
  order: 2
---
```

### Content Tone (from Phase 22)
- Concise, practical, short sentences
- Action-oriented language
- Terminal code blocks for commands
- Inline cross-references at point of mention (e.g., "See the [User Guide](/domain-context-claude/guides/user-guide/)")
- Double dashes (--) instead of em dashes

### Cross-Link Pattern
All internal links MUST include `/domain-context-claude/` base path:
```
[Quickstart](/domain-context-claude/getting-started/quickstart/)
[User Guide](/domain-context-claude/guides/user-guide/)
[CLI Reference](/domain-context-claude/reference/cli/)
```

### Source Material Mapping

**Architecture/Concepts page sources:**
- `ARCHITECTURE.md` -- module map table (reproduce), data flow, key boundaries
- `.context/domain/integration-model.md` -- three concerns (How/What/Why), bridge pattern, progressive disclosure
- `.context/domain/claude-code-extensions.md` -- skills/hooks/agents/rules taxonomy
- `.context/decisions/002-agents-md-bridge.md` -- bridge pattern rationale

**Spec overview page sources:**
- `.context/domain/integration-model.md` -- three pillars, lifecycle
- `.context/MANIFEST.md` -- example of real manifest structure
- Domain Context spec repo link: `https://github.com/senivel/domain-context`

**Contributing guide sources:**
- `AGENTS.md` -- Build & Run section (install commands), Code Conventions, Workflow
- Root directory listing -- project structure overview
- `package.json` -- npm pack workflow

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sidebar ordering | Manual sidebar config entries | Frontmatter `sidebar.order` | Autogenerate handles it; manual entries break the pattern |
| Directory tree display | HTML/custom components | Markdown code blocks | Consistent with existing quickstart page pattern |
| Diagrams | Custom SVG/HTML | Text-based ASCII diagrams | Mermaid deferred to Phase 24; text diagrams are sufficient |

## Common Pitfalls

### Pitfall 1: Missing Base Path in Links
**What goes wrong:** Internal links break on GitHub Pages because the site is served from `/domain-context-claude/` base path.
**Why it happens:** Easy to write `/guides/user-guide/` instead of `/domain-context-claude/guides/user-guide/`.
**How to avoid:** Every internal link must start with `/domain-context-claude/`.
**Warning signs:** CI link checker (lychee) will catch these, but get it right the first time.

### Pitfall 2: Duplicating Rather Than Referencing
**What goes wrong:** Content drifts when the same information exists in ARCHITECTURE.md and the docs page.
**Why it happens:** Copying content verbatim creates two sources of truth.
**How to avoid:** The docs pages are the user-facing explanation of internal docs. They should explain concepts clearly for external readers, not just copy internal docs. Accept that they serve different audiences and will diverge naturally.

### Pitfall 3: Over-Explaining Internals
**What goes wrong:** Architecture page becomes a developer guide to the codebase instead of a conceptual overview.
**Why it happens:** Source material (ARCHITECTURE.md, domain files) contains implementation details.
**How to avoid:** Focus on "what users observe" per the locked decision. Hook lifecycle = freshness warnings and edit reminders, not stdin/stdout JSON protocol.

### Pitfall 4: Sidebar Order Surprise
**What goes wrong:** New pages appear in unexpected order in the sidebar.
**Why it happens:** Starlight autogenerate sorts alphabetically by filename unless frontmatter overrides order.
**How to avoid:** Use `sidebar: { order: N }` frontmatter on all pages in the guides directory, including updating the existing user-guide.mdx.

## Code Examples

### Bridge Pattern Text Diagram (for architecture page)
```
CLAUDE.md
  └─ @AGENTS.md
       ├─ @ARCHITECTURE.md
       └─ @.context/MANIFEST.md
            ├─ domain/
            ├─ decisions/
            └─ constraints/
```

### .context/ Directory Tree (for architecture page)
```
.context/
  MANIFEST.md          # Index of all domain knowledge
  domain/              # Business rules, models, terminology
  decisions/           # Architecture decision records (ADRs)
  constraints/         # External requirements, API contracts
```

### Module Map Table (reproduce from ARCHITECTURE.md for architecture page)
```markdown
| Module | Purpose |
|--------|---------|
| commands/dc/ | Six slash commands for managing domain context |
| hooks/ | Session-start freshness check, edit-time reminders |
| agents/ | Domain validator subagent |
| rules/ | Formatting guidance for .context/ files |
| templates/ | Scaffolding files for /dc:init |
| bin/ | npm installer (npx entry point) |
```

### Example Domain Concept File (for spec overview page)
```markdown
# Billing Model

<!-- verified: 2026-03-15 -->

## What This Is
[Description of the domain concept]

## Key Attributes
[Business rules, lifecycle, relationships]

## Business Rules
[Invariants and constraints]
```

### Contributing Guide Dev Setup (from AGENTS.md)
```bash
git clone https://github.com/senivel/domain-context-claude.git
cd domain-context-claude
node bin/install.js --local
bash tools/validate-context.sh .
npm pack && npx ./domain-context-cc-*.tgz
```

### Sidebar Order Frontmatter
```yaml
---
sidebar:
  order: 1  # User Guide
---
```

## State of the Art

No technology changes relevant to this phase. Starlight MDX authoring patterns are stable.

## Open Questions

1. **Sidebar ordering for existing user-guide.mdx**
   - What we know: It currently has no `sidebar.order` frontmatter
   - What's unclear: Whether adding order to it will cause any issues
   - Recommendation: Add `sidebar: { order: 1 }` to user-guide.mdx as part of this phase to ensure predictable ordering. This is a minor non-breaking change.

2. **Spec example depth**
   - What we know: User wants "one brief example showing a domain concept file structure"
   - What's unclear: How much of the actual spec format to show
   - Recommendation: Show the heading structure (title, verified comment, What This Is, Key Attributes, Business Rules) with placeholder descriptions. Do not reproduce the full spec.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Lychee link checker + Astro build |
| Config file | `docs/` (Astro config) |
| Quick run command | `cd docs && npm run build` |
| Full suite command | `cd docs && npm run build` (build catches broken MDX, missing imports) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-05 | Architecture page renders without errors | smoke | `cd docs && npm run build` | Will exist after implementation |
| CONT-06 | Spec overview page renders without errors | smoke | `cd docs && npm run build` | Will exist after implementation |
| CONT-07 | Contributing guide renders without errors | smoke | `cd docs && npm run build` | Will exist after implementation |
| ALL | Internal links resolve correctly | integration | CI lychee link checker | Existing CI pipeline |

### Sampling Rate
- **Per task commit:** `cd docs && npm run build`
- **Per wave merge:** `cd docs && npm run build` + manual visual check
- **Phase gate:** Build succeeds, link checker passes

### Wave 0 Gaps
None -- existing build infrastructure covers all phase requirements. No new test files needed.

## Sources

### Primary (HIGH confidence)
- Project files read directly: ARCHITECTURE.md, AGENTS.md, .context/domain/integration-model.md, .context/domain/claude-code-extensions.md, .context/decisions/*.md
- Existing docs pages: user-guide.mdx, quickstart.mdx, cli.mdx, index.mdx (established patterns)
- astro.config.mjs (sidebar configuration, base path)

### Secondary (MEDIUM confidence)
- Starlight sidebar ordering via frontmatter -- based on established Starlight conventions observed in Phase 20/22

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, using existing Starlight setup
- Architecture: HIGH - file placement and patterns established in Phase 22
- Pitfalls: HIGH - based on accumulated context from prior phases (base path, link checker)
- Content sourcing: HIGH - all source material read directly from project files

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable -- content authoring, no fast-moving dependencies)
