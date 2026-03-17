# Roadmap: Domain Context for Claude Code

## Milestones

- [x] **v1.0 Core Skills** -- Phases 1-9 (shipped 2026-03-16)
- [ ] **v1.1 Hooks, Rules & Agent** -- Phases 10-13 (in progress)

## Phases

<details>
<summary>v1.0 Core Skills (Phases 1-9) -- SHIPPED 2026-03-16</summary>

- [x] Phase 1: Templates (2/2 plans) -- completed 2026-03-12
- [x] Phase 2: Init Core (2/2 plans) -- completed 2026-03-12
- [x] Phase 3: Init Idempotency (1/1 plan) -- completed 2026-03-13
- [x] Phase 4: Explore (3/3 plans) -- completed 2026-03-16
- [x] Phase 5: Validate Core (1/1 plan) -- completed 2026-03-16
- [x] Phase 6: Validate UX (1/1 plan) -- completed 2026-03-16
- [x] Phase 7: Add (2/2 plans) -- completed 2026-03-16
- [x] Phase 8: Refresh (2/2 plans) -- completed 2026-03-16
- [x] Phase 9: Integration Bug Fixes (1/1 plan) -- completed 2026-03-16

</details>

### v1.1 Hooks, Rules & Agent

**Milestone Goal:** Add passive integrations that make Claude Code domain-context-aware without explicit commands -- hooks fire automatically, rules inject guidance when editing .context/ files, and a validator agent checks code against documented business rules.

- [x] **Phase 10: SessionStart Freshness Hook** - Warn about stale domain context entries when a session begins (completed 2026-03-17)
- [x] **Phase 11: PostToolUse Reminder Hook** - Remind about CONTEXT.md updates when editing files near one (completed 2026-03-17)
- [x] **Phase 12: Path-Scoped Rule** - Inject Domain Context spec guidance when editing .context/ files (completed 2026-03-17)
- [ ] **Phase 13: Domain Validator Agent** - Check code against documented business rules on demand

## Phase Details

### Phase 10: SessionStart Freshness Hook
**Goal**: Users are warned about stale domain context entries at the start of every session, with graceful no-op when no .context/ exists
**Depends on**: Nothing (first phase of v1.1; v1.0 skills are unchanged)
**Requirements**: HOOK-01, HOOK-02, HOOK-07
**Success Criteria** (what must be TRUE):
  1. When a session starts in a project with stale .context/ entries (>90 days), Claude's context includes a warning listing which entries are stale
  2. When a session starts in a project without .context/, the hook exits silently with no error or warning
  3. When stdin is delayed or malformed, the hook times out after 3 seconds and exits 0 without producing a UI error
**Plans:** 1/1 plans complete

Plans:
- [ ] 10-01-PLAN.md -- Create SessionStart freshness hook and register in settings.json

### Phase 11: PostToolUse Reminder Hook
**Goal**: Users are reminded to update CONTEXT.md when they edit files near one, with debouncing to prevent noise
**Depends on**: Phase 10 (reuses hook boilerplate pattern)
**Requirements**: HOOK-03, HOOK-04, HOOK-05, HOOK-06, HOOK-08
**Success Criteria** (what must be TRUE):
  1. When a file is edited (via Edit, Write, or MultiEdit) in a directory that contains a CONTEXT.md or whose parent contains one, Claude's context includes a reminder to update it
  2. After the first reminder for a directory, subsequent edits in that same directory during the same session do not produce additional reminders
  3. Tool calls other than Edit, Write, and MultiEdit do not trigger the reminder
  4. Hook registration in settings.json preserves all existing GSD hooks (appends to arrays, never replaces)
**Plans:** 1/1 plans complete

Plans:
- [ ] 11-01-PLAN.md -- Create PostToolUse reminder hook and register in settings.json

### Phase 12: Path-Scoped Rule
**Goal**: Claude receives Domain Context spec formatting guidance automatically when reading .context/ files
**Depends on**: Nothing (independent of hooks)
**Requirements**: RULE-01, RULE-02, RULE-03
**Success Criteria** (what must be TRUE):
  1. When Claude reads any file matching `.context/**` or `**/CONTEXT.md`, the rule content is loaded into context
  2. The rule provides actionable guidance on template structure, MANIFEST.md updates, verified date format, and naming conventions
  3. The rule uses `globs:` frontmatter (not `paths:`) to ensure correct pattern matching
**Plans:** 1/1 plans complete

Plans:
- [ ] 12-01-PLAN.md -- Create path-scoped rule file with Domain Context spec formatting guidance

### Phase 13: Domain Validator Agent
**Goal**: Users can invoke a domain validator that checks code against documented business rules and reports structured violations
**Depends on**: Nothing (independent of hooks and rules)
**Requirements**: AGNT-01, AGNT-02, AGNT-03, AGNT-04, AGNT-05
**Success Criteria** (what must be TRUE):
  1. User can invoke the domain validator agent, which reads .context/domain/ files and identifies business rules and constraints documented there
  2. The agent scans code for violations against those documented rules and produces structured findings (violation description, file location, rule violated)
  3. The agent uses only read-only tools (Read, Grep, Glob) and makes no changes to any files
  4. The agent system prompt is fully self-contained and does not rely on CLAUDE.md, parent session context, or conversation history
**Plans:** 1 plan

Plans:
- [ ] 13-01-PLAN.md -- Create domain validator agent with self-contained prompt and structured violation reporting

## Progress

**Execution Order:**
Phases execute in numeric order: 10 -> 11 -> 12 -> 13

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Templates | v1.0 | 2/2 | Complete | 2026-03-12 |
| 2. Init Core | v1.0 | 2/2 | Complete | 2026-03-12 |
| 3. Init Idempotency | v1.0 | 1/1 | Complete | 2026-03-13 |
| 4. Explore | v1.0 | 3/3 | Complete | 2026-03-16 |
| 5. Validate Core | v1.0 | 1/1 | Complete | 2026-03-16 |
| 6. Validate UX | v1.0 | 1/1 | Complete | 2026-03-16 |
| 7. Add | v1.0 | 2/2 | Complete | 2026-03-16 |
| 8. Refresh | v1.0 | 2/2 | Complete | 2026-03-16 |
| 9. Integration Fixes | v1.0 | 1/1 | Complete | 2026-03-16 |
| 10. SessionStart Freshness Hook | v1.1 | 1/1 | Complete | 2026-03-17 |
| 11. PostToolUse Reminder Hook | 1/1 | Complete    | 2026-03-17 | - |
| 12. Path-Scoped Rule | 1/1 | Complete    | 2026-03-17 | - |
| 13. Domain Validator Agent | v1.1 | 0/1 | Not started | - |
