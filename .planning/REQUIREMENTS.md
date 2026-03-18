# Requirements: Domain Context for Claude Code

**Defined:** 2026-03-17
**Core Value:** Developers can codify and maintain domain knowledge alongside code so that AI assistants always have accurate business context

## v1.4 Requirements

Requirements for Documentation milestone. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: Starlight (Astro) doc site scaffolded in isolated `docs/` directory with own package.json
- [x] **INFRA-02**: Site deploys to GitHub Pages via GitHub Action on pushes to `docs/**`
- [x] **INFRA-03**: CI link checker validates all internal and external links before deploy
- [x] **INFRA-04**: Framework defaults active: sidebar nav, full-text search, dark/light mode, code highlighting with copy, responsive layout

### Content

- [x] **CONT-01**: Landing page with project overview, value proposition, and install command
- [x] **CONT-02**: Quickstart guide — zero to working in under 5 minutes
- [x] **CONT-03**: User guide — full workflow walkthrough of all features
- [x] **CONT-04**: CLI command reference — all 6 dc:* commands with usage, descriptions, and examples
- [ ] **CONT-05**: Architecture/concepts page — bridge pattern, hook lifecycle, .context/ structure
- [ ] **CONT-06**: Domain Context spec overview — what the spec is and how this tool implements it
- [ ] **CONT-07**: Contributing guide — setup, conventions, PR process

### Enhancements

- [ ] **ENH-01**: Mermaid architecture diagrams on concepts/architecture pages
- [ ] **ENH-02**: Tabbed content blocks for global vs local install variants

## Future Requirements

Deferred to post-launch. Tracked but not in current roadmap.

### Enhancements

- **ENH-03**: "Edit this page" links on each documentation page
- **ENH-04**: Terminal demo recordings (animated SVG via asciinema)

### Versioning

- **VER-01**: Versioned documentation with version selector
- **VER-02**: Changelog page

### Community

- **COMM-01**: Blog/announcements section

## Out of Scope

| Feature | Reason |
|---------|--------|
| MCP server for docs | File-based approach per ADR-003 |
| Auto-generated API docs | No runtime API; project is markdown skills and hooks |
| i18n / multilingual | Translation maintenance exceeds value for this audience |
| Custom theme / heavy branding | Framework defaults are professional; custom CSS breaks on upgrades |
| Comments / discussion on pages | Fragments discussion away from GitHub Issues |
| CMS / WYSIWYG editing | All contributors are developers; markdown in Git is natural |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 20 | Complete |
| INFRA-02 | Phase 21 | Complete |
| INFRA-03 | Phase 21 | Complete |
| INFRA-04 | Phase 20 | Complete |
| CONT-01 | Phase 22 | Complete |
| CONT-02 | Phase 22 | Complete |
| CONT-03 | Phase 22 | Complete |
| CONT-04 | Phase 22 | Complete |
| CONT-05 | Phase 23 | Pending |
| CONT-06 | Phase 23 | Pending |
| CONT-07 | Phase 23 | Pending |
| ENH-01 | Phase 24 | Pending |
| ENH-02 | Phase 24 | Pending |

**Coverage:**
- v1.4 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-17 after roadmap creation*
