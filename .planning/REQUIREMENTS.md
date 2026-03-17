# Requirements: Domain Context for Claude Code

**Defined:** 2026-03-16
**Core Value:** Developers can codify and maintain domain knowledge alongside code so AI assistants always have accurate business context

## v1.2 Requirements

Requirements for GSD Integration milestone. Each maps to roadmap phases.

### GSD Bridge

- [ ] **BRIDGE-01**: dc:init appends GSD bridge text to AGENTS.md snippet referencing .context/ for domain knowledge
- [ ] **BRIDGE-02**: Re-running dc:init on existing projects updates GSD bridge content via sentinel replacement
- [ ] **BRIDGE-03**: GSD bridge text instructs agents to consult .context/ during planning and suggests /dc:extract after phases

### Extraction Scanning

- [ ] **SCAN-01**: dc:extract scans .planning/ for completed phase CONTEXT.md, SUMMARY.md, RESEARCH.md, and RETROSPECTIVE.md
- [ ] **SCAN-02**: dc:extract shows clear error with guidance when .context/ or .planning/ is missing
- [ ] **SCAN-03**: User can scope extraction to specific phases (e.g., `/dc:extract 7-9`)

### Knowledge Classification

- [ ] **CLASS-01**: dc:extract identifies extractable domain concepts (business rules, invariants, lifecycle models) from planning artifacts
- [ ] **CLASS-02**: dc:extract identifies architecture decisions worthy of formal ADRs from planning artifacts
- [ ] **CLASS-03**: dc:extract identifies external constraints (regulatory, API limits, security policies) from planning artifacts

### Proposal & Creation

- [ ] **PROP-01**: dc:extract cross-references proposals against existing .context/ MANIFEST.md to avoid duplicates
- [ ] **PROP-02**: dc:extract previews all proposed extractions with source attribution before writing any files
- [ ] **PROP-03**: User can selectively accept or reject individual proposals
- [ ] **PROP-04**: Accepted proposals create spec-compliant .context/ files using existing templates and update MANIFEST.md
- [ ] **PROP-05**: dc:extract shows summary of what was extracted after completion

## Future Requirements

### Installation & Distribution

- **INST-01**: npm packaging with npx entry point
- **INST-02**: Installer copies all components to ~/.claude/ or ./.claude/
- **INST-03**: Installer merges hook config into settings.json without clobbering
- **INST-04**: Uninstall removes all dc-prefixed files and hook entries

### Module Context

- **MODCTX-01**: dc:extract suggests CONTEXT.md updates for module-scoped findings

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auto-extract on phase completion | Spec Section 8.4 requires explicit user initiation |
| Delete/archive .planning/ artifacts | .planning/ is GSD's domain — dc:extract is read-only on it |
| Extract code patterns/implementation details | Domain context captures WHY, not WHAT or HOW |
| Modify existing .context/ entries | dc:extract creates NEW entries; dc:refresh handles updates |
| Generate ARCHITECTURE.md updates | Architectural insights belong as ADRs in .context/decisions/ |
| Require GSD to be installed | .planning/ file format is the contract, not a programmatic API |
| Semantic deduplication engine | Claude's judgment in the preview step handles conceptual overlap |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRIDGE-01 | Phase 14 | Pending |
| BRIDGE-02 | Phase 15 | Pending |
| BRIDGE-03 | Phase 14 | Pending |
| SCAN-01 | Phase 16 | Pending |
| SCAN-02 | Phase 16 | Pending |
| SCAN-03 | Phase 16 | Pending |
| CLASS-01 | Phase 16 | Pending |
| CLASS-02 | Phase 16 | Pending |
| CLASS-03 | Phase 16 | Pending |
| PROP-01 | Phase 16 | Pending |
| PROP-02 | Phase 16 | Pending |
| PROP-03 | Phase 16 | Pending |
| PROP-04 | Phase 16 | Pending |
| PROP-05 | Phase 16 | Pending |

**Coverage:**
- v1.2 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after roadmap creation*
