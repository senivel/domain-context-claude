# Roadmap: Domain Context for Claude Code

## Milestones

- ✅ **v1.0 Core Skills** — Phases 1-9 (shipped 2026-03-16)
- ✅ **v1.1 Hooks, Rules & Agent** — Phases 10-13 (shipped 2026-03-17)
- ✅ **v1.2 GSD Integration** — Phases 14-16 (shipped 2026-03-17)
- ✅ **v1.3 Installation & Distribution** — Phases 17-19 (shipped 2026-03-17)
- ✅ **v1.4 Documentation** — Phases 20-24 (shipped 2026-03-18)
- [ ] **v1.5 Release Please** — Phases 25-27

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

<details>
<summary>✅ v1.4 Documentation (Phases 20-24) — SHIPPED 2026-03-18</summary>

- [x] Phase 20: Scaffold Starlight Site (1/1 plans) — completed 2026-03-17
- [x] Phase 21: CI/CD and GitHub Pages (1/1 plans) — completed 2026-03-18
- [x] Phase 22: User-Facing Content (2/2 plans) — completed 2026-03-18
- [x] Phase 23: Conceptual and Contributor Content (2/2 plans) — completed 2026-03-18
- [x] Phase 24: Visual Enhancements (1/1 plans) — completed 2026-03-18

See .planning/milestones/ for archived phase details.

</details>

### v1.5 Release Please (Phases 25-27)

- [x] **Phase 25: Release Please Configuration** - Config files that tell release-please how to version this package (completed 2026-03-19)
- [x] **Phase 26: Release Workflow** - GitHub Action that automates release PR creation and GitHub Releases (completed 2026-03-19)
- [ ] **Phase 27: Conventional Commit Docs** - Contributing documentation explaining the commit format release-please requires

## Phase Details

### Phase 25: Release Please Configuration
**Goal**: release-please can read this repo's config and knows how to version it
**Depends on**: Nothing (foundational config)
**Requirements**: RLSE-01, RLSE-02
**Success Criteria** (what must be TRUE):
  1. release-please-config.json exists at repo root with release-type "node", package name "domain-context-cc", and changelog sections configured
  2. .release-please-manifest.json exists at repo root tracking version 1.3.0 as the baseline
  3. Running `release-please` locally (dry-run or CI) can parse both config files without errors
**Plans**: 1 plan
Plans:
- [ ] 25-01-PLAN.md — Create release-please config and version manifest

### Phase 26: Release Workflow
**Goal**: Pushing conventional commits to main automatically creates release PRs and GitHub Releases
**Depends on**: Phase 25
**Requirements**: CICD-01, CICD-02, CICD-03
**Success Criteria** (what must be TRUE):
  1. A push to main triggers the release-please GitHub Action workflow
  2. When conventional commits exist since last release, release-please opens a PR with version bump and auto-generated changelog
  3. Merging a release PR creates a GitHub Release with the changelog as the release body
  4. The workflow uses the google-github-actions/release-please-action with appropriate configuration
**Plans**: 1 plan
Plans:
- [x] 26-01-PLAN.md — Create release-please GitHub Action workflow

### Phase 27: Conventional Commit Docs
**Goal**: Contributors know what commit format to use so release-please can generate correct changelogs
**Depends on**: Phase 25 (references the config to explain what types are recognized)
**Requirements**: DOCS-01
**Success Criteria** (what must be TRUE):
  1. Contributing documentation explains conventional commit format (feat:, fix:, chore:, breaking changes)
  2. Documentation explains how commit messages map to version bumps (feat = minor, fix = patch, BREAKING CHANGE = major)
**Plans**: TBD




## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-9 | v1.0 | 15/15 | Complete | 2026-03-16 |
| 10-13 | v1.1 | 4/4 | Complete | 2026-03-17 |
| 14-16 | v1.2 | 4/4 | Complete | 2026-03-17 |
| 17-19 | v1.3 | 4/4 | Complete | 2026-03-17 |
| 20-24 | v1.4 | 7/7 | Complete | 2026-03-18 |
| 25 | 1/1 | Complete    | 2026-03-19 | - |
| 26 | v1.5 | 1/1 | Complete | 2026-03-19 |
| 27 | v1.5 | 0/? | Not started | - |
