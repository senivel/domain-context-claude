# Requirements: Domain Context for Claude Code

**Defined:** 2026-03-18
**Core Value:** Developers can codify and maintain domain knowledge alongside code so AI assistants always have accurate business context

## v1.5 Requirements

Requirements for automated versioning and releasing via release-please.

### Release Config

- [ ] **RLSE-01**: release-please-config.json defines Node.js release type with package name and version bump settings
- [ ] **RLSE-02**: .release-please-manifest.json tracks current version starting at 1.3.0

### CI/CD

- [ ] **CICD-01**: GitHub Action workflow triggers release-please on push to main
- [ ] **CICD-02**: Workflow creates release PRs with auto-generated changelogs
- [ ] **CICD-03**: Merging a release PR creates a GitHub Release with changelog

### Documentation

- [ ] **DOCS-01**: Contributing docs explain conventional commit message format required by release-please

## Future Requirements

### Distribution

- **DIST-01**: Auto-update check on session start
- **DIST-02**: `--check` inspection flag to show what's installed
- **PUBL-01**: npm publish step in release workflow

## Out of Scope

| Feature | Reason |
|---------|--------|
| npm publish automation | Deferred to future milestone — establish release-please first |
| GitHub App token auth | Not needed — no downstream workflows triggered by release PRs |
| Monorepo config | Single package repo — no multi-package release-please needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RLSE-01 | — | Pending |
| RLSE-02 | — | Pending |
| CICD-01 | — | Pending |
| CICD-02 | — | Pending |
| CICD-03 | — | Pending |
| DOCS-01 | — | Pending |

**Coverage:**
- v1.5 requirements: 6 total
- Mapped to phases: 0
- Unmapped: 6 ⚠️

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after initial definition*
