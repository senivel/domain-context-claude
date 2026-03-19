# Phase 26: Release Workflow - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a GitHub Actions workflow that runs release-please on pushes to main, automatically creating release PRs and GitHub Releases from conventional commits.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `release-please-config.json` at repo root — Phase 25 output, configures node release type with changelog sections
- `.release-please-manifest.json` at repo root — tracks current version
- Existing workflows in `.github/workflows/` — claude.yml, claude-code-review.yml, deploy-docs.yml provide pattern for workflow structure

### Established Patterns
- GitHub Actions YAML workflows in `.github/workflows/`
- Single-package repo (not monorepo)

### Integration Points
- Workflow triggers on push to `main`
- References `release-please-config.json` created in Phase 25
- Uses `google-github-actions/release-please-action`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>

---

*Phase: 26-release-workflow*
*Context gathered: 2026-03-18*
