# Roadmap: Domain Context for Claude Code

## Milestones

- ✅ **v1.0 Core Skills** — Phases 1-9 (shipped 2026-03-16)
- ✅ **v1.1 Hooks, Rules & Agent** — Phases 10-13 (shipped 2026-03-17)
- ✅ **v1.2 GSD Integration** — Phases 14-16 (shipped 2026-03-17)
- ✅ **v1.3 Installation & Distribution** — Phases 17-19 (shipped 2026-03-17)
- 🚧 **v1.4 Documentation** — Phases 20-24 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

<details>
<summary>✅ v1.0 Core Skills (Phases 1-9) — SHIPPED 2026-03-16</summary>

See .planning/milestones/ for archived phase details.

</details>

<details>
<summary>✅ v1.1 Hooks, Rules & Agent (Phases 10-13) — SHIPPED 2026-03-17</summary>

See .planning/milestones/ for archived phase details.

</details>

<details>
<summary>✅ v1.2 GSD Integration (Phases 14-16) — SHIPPED 2026-03-17</summary>

- [x] Phase 14: GSD Bridge Template (1/1 plans) — completed 2026-03-17
- [x] Phase 15: dc:init GSD Detection (1/1 plans) — completed 2026-03-17
- [x] Phase 16: dc:extract Skill (2/2 plans) — completed 2026-03-17

See .planning/milestones/ for archived phase details.

</details>

<details>
<summary>✅ v1.3 Installation & Distribution (Phases 17-19) — SHIPPED 2026-03-17</summary>

- [x] Phase 17: Package Configuration (1/1 plans) — completed 2026-03-17
- [x] Phase 18: Installer Logic (2/2 plans) — completed 2026-03-17
- [x] Phase 19: README & Publishing (1/1 plans) — completed 2026-03-17

See .planning/milestones/ for archived phase details.

</details>

### 🚧 v1.4 Documentation (In Progress)

**Milestone Goal:** Create a polished documentation site with comprehensive guides, published on GitHub Pages with automated builds.

- [x] **Phase 20: Scaffold Starlight Site** - Initialize docs/ with Astro/Starlight, verify framework defaults, confirm npm tarball isolation (completed 2026-03-17)
- [x] **Phase 21: CI/CD and GitHub Pages** - Deploy pipeline with GitHub Action, link checker, live placeholder site (completed 2026-03-18)
- [x] **Phase 22: User-Facing Content** - Landing page, quickstart, user guide, CLI command reference (completed 2026-03-18)
- [x] **Phase 23: Conceptual and Contributor Content** - Architecture/concepts, spec overview, contributing guide (completed 2026-03-18)
- [x] **Phase 24: Visual Enhancements** - Mermaid diagrams on architecture pages, tabbed install variants (completed 2026-03-18)

## Phase Details

### Phase 20: Scaffold Starlight Site
**Goal**: A working Starlight documentation site runs locally with all framework defaults active and zero impact on the npm package
**Depends on**: Nothing (first phase of v1.4)
**Requirements**: INFRA-01, INFRA-04
**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` inside `docs/` serves a Starlight site on localhost with a placeholder page
  2. Sidebar navigation, full-text search, dark/light mode toggle, code highlighting with copy button, and responsive layout all function using framework defaults (no custom code)
  3. The `docs/` directory has its own `package.json` with Astro/Starlight dependencies, and the root `package.json` is unchanged
  4. Running `npm pack --dry-run` from the project root confirms docs/ is excluded from the npm tarball
**Plans**: 1 plan

Plans:
- [ ] 20-01-PLAN.md — Scaffold Starlight site in docs/ with gitignore and npm pack isolation

### Phase 21: CI/CD and GitHub Pages
**Goal**: The documentation site auto-deploys to GitHub Pages on pushes to docs/ with link validation in CI
**Depends on**: Phase 20
**Requirements**: INFRA-02, INFRA-03
**Success Criteria** (what must be TRUE):
  1. Pushing changes to `docs/**` on main triggers a GitHub Action that builds and deploys the site to GitHub Pages
  2. The deployed site is accessible at `https://senivel.github.io/domain-context-claude/` with correct base URL (no broken CSS/JS/links)
  3. A CI link checker runs before deploy and fails the workflow if any internal or external link is broken
**Plans**: 1 plan

Plans:
- [ ] 21-01-PLAN.md — GitHub Actions workflow with build, link check, and deploy jobs plus Astro base URL config

### Phase 22: User-Facing Content
**Goal**: Users can learn about the project, install it, and use every feature through comprehensive documentation
**Depends on**: Phase 21
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04
**Success Criteria** (what must be TRUE):
  1. The landing page communicates what domain-context-cc does, its value proposition, and shows the install command
  2. A user following the quickstart guide goes from zero to a working `.context/` directory in under 5 minutes
  3. The user guide walks through the complete workflow: init, explore, add, validate, refresh, extract
  4. The CLI reference documents all 6 dc:* commands with usage syntax, descriptions, and examples
**Plans**: 2 plans

Plans:
- [ ] 22-01-PLAN.md — Sidebar navigation, splash landing page, and quickstart guide
- [ ] 22-02-PLAN.md — User guide and CLI command reference

### Phase 23: Conceptual and Contributor Content
**Goal**: Users understand the architecture and spec underpinning the tool, and contributors know how to participate
**Depends on**: Phase 22
**Requirements**: CONT-05, CONT-06, CONT-07
**Success Criteria** (what must be TRUE):
  1. The architecture/concepts page explains the bridge pattern, hook lifecycle, and `.context/` directory structure
  2. The spec overview page explains what the Domain Context specification is and how this tool implements it
  3. The contributing guide covers local development setup, code conventions, and PR process
**Plans**: 2 plans

Plans:
- [ ] 23-01-PLAN.md — Architecture/concepts page and spec overview page
- [ ] 23-02-PLAN.md — Contributing guide

### Phase 24: Visual Enhancements
**Goal**: Architecture pages include diagrams and install instructions use tabbed variants for clarity
**Depends on**: Phase 23
**Requirements**: ENH-01, ENH-02
**Success Criteria** (what must be TRUE):
  1. The architecture/concepts page renders Mermaid diagrams showing component relationships and data flow
  2. Install instructions across the site use tabbed content blocks to show global vs local install variants side-by-side
**Plans**: 1 plan

Plans:
- [ ] 24-01-PLAN.md — Mermaid diagrams on architecture page and tabbed install blocks on landing/quickstart

## Progress

**Execution Order:** 20 -> 21 -> 22 -> 23 -> 24

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-9 | v1.0 | 15/15 | Complete | 2026-03-16 |
| 10-13 | v1.1 | 4/4 | Complete | 2026-03-17 |
| 14-16 | v1.2 | 4/4 | Complete | 2026-03-17 |
| 17-19 | v1.3 | 4/4 | Complete | 2026-03-17 |
| 20. Scaffold Starlight Site | 1/1 | Complete    | 2026-03-17 | - |
| 21. CI/CD and GitHub Pages | 1/1 | Complete    | 2026-03-18 | - |
| 22. User-Facing Content | 2/2 | Complete    | 2026-03-18 | - |
| 23. Conceptual and Contributor Content | 2/2 | Complete    | 2026-03-18 | - |
| 24. Visual Enhancements | 1/1 | Complete    | 2026-03-18 | - |
