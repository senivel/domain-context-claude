# Roadmap: Domain Context for Claude Code

## Milestones

- ✅ **v1.0 Core Skills** - Phases 1-9 (shipped 2026-03-16)
- ✅ **v1.1 Hooks, Rules & Agent** - Phases 10-13 (shipped 2026-03-17)
- ✅ **v1.2 GSD Integration** - Phases 14-16 (shipped 2026-03-17)
- 🚧 **v1.3 Installation & Distribution** - Phases 17-19 (in progress)

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

<details>
<summary>✅ v1.2 GSD Integration (Phases 14-16) - SHIPPED 2026-03-17</summary>

- [x] Phase 14: GSD Bridge Template (1/1 plans) — completed 2026-03-17
- [x] Phase 15: dc:init GSD Detection (1/1 plans) — completed 2026-03-17
- [x] Phase 16: dc:extract Skill (2/2 plans) — completed 2026-03-17

See .planning/milestones/ for archived phase details.

</details>

### 🚧 v1.3 Installation & Distribution (In Progress)

**Milestone Goal:** Package domain-context-cc for npm distribution so users can install with `npx domain-context-cc`.

- [ ] **Phase 17: Package Configuration** - package.json with correct metadata, bin entry, files whitelist, and engine constraint
- [ ] **Phase 18: Installer Logic** - bin/install.js supporting global, local, and uninstall modes with idempotent settings.json merge
- [ ] **Phase 19: README & Publishing** - Final README with install, quick start, command reference, GSD integration, and uninstall docs

## Phase Details

### Phase 17: Package Configuration
**Goal**: npm tarball contains exactly the right files so `npx domain-context-cc` invokes the installer
**Depends on**: Nothing (first phase of v1.3)
**Requirements**: PKG-01, PKG-02, PKG-03, PKG-04, PKG-05
**Success Criteria** (what must be TRUE):
  1. `npm pack --dry-run` lists all files from commands/, agents/, hooks/, rules/, templates/, tools/, and bin/ directories
  2. `npm pack --dry-run` does NOT list .planning/, .context/, .claude/, or other dev artifacts
  3. Running `npx ./domain-context-cc-*.tgz` invokes bin/install.js (bin entry works)
  4. package.json declares zero dependencies and `"type": "commonjs"`
**Plans**: TBD

Plans:
- [ ] 17-01: TBD

### Phase 18: Installer Logic
**Goal**: Users can install, reinstall, and uninstall domain-context-cc with a single command
**Depends on**: Phase 17
**Requirements**: INST-01, INST-02, INST-03, INST-04, INST-05, INST-06, INST-07, INST-08, INST-09
**Success Criteria** (what must be TRUE):
  1. Running `npx domain-context-cc` copies all dc skills, hooks, agents, rules, and templates to `~/.claude/`
  2. Running `npx domain-context-cc --local` copies all files to `./.claude/` in the current project
  3. After install, `~/.claude/settings.json` contains SessionStart and PostToolUse hook entries for dc hooks, and any pre-existing hooks (e.g., GSD) are preserved
  4. Running install a second time produces the same result as the first time (no duplicate hooks, files overwritten cleanly)
  5. Running `npx domain-context-cc --uninstall` removes dc-prefixed files and dc hook entries from settings.json, leaving other hooks intact
**Plans**: TBD

Plans:
- [ ] 18-01: TBD

### Phase 19: README & Publishing
**Goal**: A new user can discover, install, and start using domain-context-cc from the README alone
**Depends on**: Phase 18
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05
**Success Criteria** (what must be TRUE):
  1. README contains a one-line install command that a new user can copy-paste
  2. README walks through install, run `/dc:init`, start working as a 3-step quick start
  3. README documents all 6 dc:* skills with what each does and when to use it
  4. README explains the GSD bridge pattern for users who also use get-shit-done-cc
  5. README contains uninstall instructions matching the `--uninstall` flag behavior
**Plans**: TBD

Plans:
- [ ] 19-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 17 → 18 → 19

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 17. Package Configuration | v1.3 | 0/? | Not started | - |
| 18. Installer Logic | v1.3 | 0/? | Not started | - |
| 19. README & Publishing | v1.3 | 0/? | Not started | - |
