# Phase 25: Release Please Configuration - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the two release-please config files (`release-please-config.json` and `.release-please-manifest.json`) at repo root so release-please can parse this repo and version it correctly. No workflow, no docs — just config.

</domain>

<decisions>
## Implementation Decisions

### Changelog Sections
- Visible sections: Features (feat), Bug Fixes (fix), Performance (perf), Documentation (docs)
- Hidden types completely excluded: chore, ci, test, refactor, style, build — not in changelog at all
- Breaking changes get their own prominent section (default release-please behavior)

### Config Options
- Release PRs created as regular PRs (not drafts), ready to merge immediately
- Simple git tags: `v1.4.0` format, no package-name prefix
- Default PR labels: `autorelease: pending` / `autorelease: tagged`
- No bump-minor-pre-major setting — already past v1.0, not applicable

### Version Strategy
- Default semver: feat → minor, fix → patch, BREAKING CHANGE → major
- No version bump when only hidden commit types — no PR created
- release-please updates version in package.json automatically
- CHANGELOG.md at repo root, single cumulative file
- No extra files to update (README doesn't reference specific versions)

### Claude's Discretion
- Exact JSON formatting and key ordering in config files
- Whether to include inline comments or documentation links in config

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. All decisions align with release-please defaults and conventions.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `package.json`: Already at version 1.3.0, name `domain-context-cc` — config references these values

### Established Patterns
- Single-package repo (not monorepo) — simplifies release-please config significantly
- CommonJS module type in package.json

### Integration Points
- `.release-please-manifest.json` must track version 1.3.0 as baseline (matches package.json)
- `release-please-config.json` at repo root, referenced by Phase 26 GitHub Action workflow
- CHANGELOG.md will be created at repo root by release-please on first release

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 25-release-please-configuration*
*Context gathered: 2026-03-18*
