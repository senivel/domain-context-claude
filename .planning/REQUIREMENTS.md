# Requirements: domain-context-cc

**Defined:** 2026-03-17
**Core Value:** Developers can codify and maintain domain knowledge alongside code so AI assistants always have accurate business context

## v1.3 Requirements

Requirements for Installation & Distribution milestone. Each maps to roadmap phases.

### Packaging

- [x] **PKG-01**: package.json has correct name (`domain-context-cc`), version, and description
- [x] **PKG-02**: package.json bin entry maps package name to `./bin/install.js`
- [x] **PKG-03**: package.json files whitelist includes all 7 distributable directories (commands/, agents/, hooks/, rules/, templates/, tools/, bin/)
- [x] **PKG-04**: package.json engines constraint set to `>=20.0.0`
- [x] **PKG-05**: package.json has zero runtime dependencies and `type: "commonjs"`

### Installation

- [x] **INST-01**: User can run `npx domain-context-cc` to install globally to `~/.claude/`
- [x] **INST-02**: User can run `npx domain-context-cc --local` to install to `./.claude/`
- [x] **INST-03**: User can run `npx domain-context-cc --uninstall` to remove dc-prefixed files and hook entries
- [x] **INST-04**: Installer merges hook entries into settings.json without clobbering existing hooks
- [x] **INST-05**: Re-running install is idempotent (no duplicate hook entries, files safely overwritten)
- [x] **INST-06**: Global install uses absolute paths in settings.json hook commands
- [x] **INST-07**: Installer uses `__dirname` (not `process.cwd()`) to locate bundled files
- [x] **INST-08**: bin/install.js has `#!/usr/bin/env node` shebang
- [x] **INST-09**: Installer prints success message with next steps after install

### Documentation

- [x] **DOC-01**: README has install command (`npx domain-context-cc`)
- [x] **DOC-02**: README has quick start section (install → `/dc:init` → start working)
- [x] **DOC-03**: README has command reference for all 6 dc:* skills
- [x] **DOC-04**: README has GSD integration section explaining the bridge pattern
- [x] **DOC-05**: README has uninstall instructions

## Future Requirements

### Distribution

- **DIST-01**: Auto-update check on session start
- **DIST-02**: `--check` inspection flag to show what's installed

## Out of Scope

| Feature | Reason |
|---------|--------|
| MCP server registration | Deferred per ADR-003 |
| Auto-run `/dc:init` during install | Cannot invoke skills from Node.js |
| Interactive prompts during install | Breaks npx piped usage |
| Modifying project CLAUDE.md/AGENTS.md | That's dc:init's job, not the installer |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PKG-01 | Phase 17 | Complete |
| PKG-02 | Phase 17 | Complete |
| PKG-03 | Phase 17 | Complete |
| PKG-04 | Phase 17 | Complete |
| PKG-05 | Phase 17 | Complete |
| INST-01 | Phase 18 | Complete |
| INST-02 | Phase 18 | Complete |
| INST-03 | Phase 18 | Complete |
| INST-04 | Phase 18 | Complete |
| INST-05 | Phase 18 | Complete |
| INST-06 | Phase 18 | Complete |
| INST-07 | Phase 18 | Complete |
| INST-08 | Phase 18 | Complete |
| INST-09 | Phase 18 | Complete |
| DOC-01 | Phase 19 | Complete |
| DOC-02 | Phase 19 | Complete |
| DOC-03 | Phase 19 | Complete |
| DOC-04 | Phase 19 | Complete |
| DOC-05 | Phase 19 | Complete |

**Coverage:**
- v1.3 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-17 after roadmap creation*
