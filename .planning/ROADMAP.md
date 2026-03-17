# Roadmap: Domain Context for Claude Code

## Milestones

- ✅ **v1.0 Core Skills** - Phases 1-9 (shipped 2026-03-16)
- ✅ **v1.1 Hooks, Rules & Agent** - Phases 10-13 (shipped 2026-03-17)
- 🚧 **v1.2 GSD Integration** - Phases 14-16 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

<details>
<summary>✅ v1.0 Core Skills (Phases 1-9) - SHIPPED 2026-03-16</summary>

See .planning/milestones/ for archived phase details.

</details>

<details>
<summary>✅ v1.1 Hooks, Rules & Agent (Phases 10-13) - SHIPPED 2026-03-17</summary>

See .planning/milestones/ for archived phase details.

</details>

### 🚧 v1.2 GSD Integration (In Progress)

**Milestone Goal:** Enable bidirectional relationship between GSD's .planning/ artifacts and domain context.

- [x] **Phase 14: GSD Bridge Template** - Static template with GSD bridge text and sentinel markers for AGENTS.md injection (completed 2026-03-17)
- [ ] **Phase 15: dc:init GSD Detection** - Conditional GSD snippet injection in dc:init with idempotent re-run support
- [ ] **Phase 16: dc:extract Skill** - Full Scan-Propose-Confirm skill extracting domain knowledge from completed GSD phases

## Phase Details

### Phase 14: GSD Bridge Template
**Goal**: New projects initialized with dc:init receive GSD-aware instructions in their AGENTS.md
**Depends on**: Nothing (first phase in v1.2)
**Requirements**: BRIDGE-01, BRIDGE-03
**Success Criteria** (what must be TRUE):
  1. A `templates/gsd-agents-snippet.md` file exists with `<!-- gsd-bridge:start/end -->` sentinel markers
  2. The template text instructs agents to consult .context/ during planning and references /dc:extract for post-phase knowledge capture
  3. The template references .planning/PROJECT.md and .planning/STATE.md as GSD entry points
**Plans**: 1 plan

Plans:
- [ ] 14-01-PLAN.md — Create GSD bridge template and update validation script

### Phase 15: dc:init GSD Detection
**Goal**: Running dc:init on any project (new or existing) injects GSD bridge content into AGENTS.md when GSD is detected
**Depends on**: Phase 14
**Requirements**: BRIDGE-02
**Success Criteria** (what must be TRUE):
  1. dc:init detects GSD presence (via .planning/PROJECT.md or user confirmation) and appends GSD bridge snippet to AGENTS.md
  2. Re-running dc:init on an existing project updates GSD bridge content via sentinel replacement without duplicating it
  3. Projects without GSD (.planning/ absent and user declines) receive no GSD bridge text
**Plans**: TBD

Plans:
- [ ] 15-01: TBD

### Phase 16: dc:extract Skill
**Goal**: Users can extract durable domain knowledge from completed GSD phases into permanent .context/ entries
**Depends on**: Phase 15
**Requirements**: SCAN-01, SCAN-02, SCAN-03, CLASS-01, CLASS-02, CLASS-03, PROP-01, PROP-02, PROP-03, PROP-04, PROP-05
**Success Criteria** (what must be TRUE):
  1. Running /dc:extract scans .planning/ for completed phase artifacts (CONTEXT.md, SUMMARY.md) and presents extractable findings grouped by type (domain concepts, decisions, constraints)
  2. User sees a preview of each proposal with source attribution before any files are written, and can selectively accept or reject individual proposals
  3. Accepted proposals create spec-compliant .context/ files using existing templates and update MANIFEST.md, following dc:add's established patterns
  4. Running /dc:extract when .context/ or .planning/ is missing shows a clear error with guidance on what to do
  5. User can scope extraction to specific phases (e.g., `/dc:extract 7-9`) and sees a summary of what was extracted after completion
**Plans**: TBD

Plans:
- [ ] 16-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 14 → 15 → 16

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 14. GSD Bridge Template | 1/1 | Complete   | 2026-03-17 | - |
| 15. dc:init GSD Detection | v1.2 | 0/? | Not started | - |
| 16. dc:extract Skill | v1.2 | 0/? | Not started | - |
