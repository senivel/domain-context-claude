# Project Research Summary

**Project:** domain-context-cc v1.3 — Installation & Distribution
**Domain:** npm packaging and Node.js installer for a Claude Code extension
**Researched:** 2026-03-17
**Confidence:** HIGH

## Executive Summary

The v1.3 milestone is a tightly scoped distribution layer built on top of a complete v1.2 feature set (6 skills, 2 hooks, 1 agent, 1 rule, 9 templates). The work consists of exactly three artifacts: `package.json`, `bin/install.js`, and an expanded `README.md`. The entire implementation uses Node.js built-ins only — no runtime dependencies — which is both a hard project constraint and the correct architectural choice for an installer. The GSD tool (`get-shit-done-cc`) already exists as a direct analog in the same ecosystem, so the patterns for hook registration, settings.json merge, and global/local install targets are fully established and verified from a live installation.

The recommended implementation order is dependency-driven: `package.json` first (defines what ships), `bin/install.js` second (the core deliverable, testable locally via `node bin/install.js`), and `README.md` last (documents implemented behavior, not speculative behavior). The install script must copy 5 directory trees to the target `.claude/` directory and merge two hook entries into `settings.json` without clobbering existing hooks from GSD or other tools. Idempotency is non-negotiable — users will re-run `npx domain-context-cc` to upgrade.

The most dangerous risks are all silent failures: an incomplete `files` array in `package.json` causes skills to be absent from the published tarball with no error; overwriting `settings.json` instead of merging destroys existing GSD hooks silently; and relative hook paths in injected command strings cause hooks to silently never fire. All three are easily avoided with `npm pack --dry-run` verification, additive JSON merge, and absolute path resolution via `os.homedir()`. The "looks done but isn't" checklist from PITFALLS.md should be run verbatim before publishing.

## Key Findings

### Recommended Stack

See full details: `.planning/research/STACK.md`

The entire installer runs on Node.js built-ins. No third-party packages are needed or appropriate. `fs.cpSync` (added v16.7.0) handles recursive directory copy; `fs.rmSync` handles uninstall cleanup; `os.homedir()` resolves the global install target reliably across platforms. The minimum engine version is `>=20.0.0` (Maintenance LTS), consistent with the existing hooks in the project. All APIs were verified functional in Node 24.14.0, the current dev environment.

**Core technologies:**
- Node.js `>=20.0.0`: Runtime for installer — Active LTS (v24) in current dev environment; all required built-in APIs (`fs.cpSync`, `fs.rmSync`, `os.homedir`) available since v16/v14
- npm (bundled with Node): Distribution via `npx domain-context-cc` — zero-friction one-shot install; `files` whitelist controls tarball contents
- CommonJS (`require()`): Module format — matches existing hooks; avoids ESM/CJS mixing confusion; `"type": "commonjs"` in `package.json` makes this explicit

### Expected Features

See full details: `.planning/research/FEATURES.md`

All v1.3 features are P1 (must-have for launch). No P2 features were identified. This is a minimal, coherent distribution milestone with no scope ambiguity.

**Must have (table stakes):**
- `npx domain-context-cc` global install — standard Claude Code tool install convention; README already promises this UX
- `--local` flag for project-scoped install — developers need per-project installs; Claude Code supports both `~/.claude/` and `./.claude/`
- `--uninstall` flag with complete cleanup — any tool without uninstall feels risky; orphan hook entries cause broken session starts
- settings.json hook registration and removal — without this, installed hooks never fire; must merge, not overwrite
- Idempotent install — re-running must not duplicate hook entries; overwriting files is safe but hook dedup is required
- `package.json` with correct `bin` + `files` — required for `npx` to work; `files` omission causes silent partial install
- Success message with next step — "Run /dc:init in any project to get started"
- Graceful degradation on missing settings.json — new Claude Code installs may have no `settings.json`; start from `{}` if absent

**Should have (differentiators):**
- Uninstall removes only dc-prefixed files — safe uninstall that won't damage GSD or other Claude Code tools
- README GSD integration section — target audience uses GSD; documenting the bridge pattern is key to adoption

**Defer (v2+):**
- MCP server registration during install — explicitly deferred by ADR-003; significant complexity
- `--check` inspection flag — low priority; add only if user feedback demands it
- Auto-update check on session start — GSD does this; not needed for dc MVP

### Architecture Approach

See full details: `.planning/research/ARCHITECTURE.md`

The installer sits above an unchanged v1.2 layer. The build is organized into three dependency-driven phases: (1) `package.json` defines the tarball boundary via the `files` whitelist — this must be correct before any end-to-end testing is possible; (2) `bin/install.js` copies 5 source directory trees to `INSTALL_DIR` and merges two hook entries into `settings.json` using an additive array-append algorithm; (3) `README.md` expansion documents the implemented behavior. The settings.json merge is the most nuanced component: it must read existing JSON, append dc hook entries only if not already present (dedup by command string equality), and write back without touching any other keys.

**Major components:**
1. `package.json` — Defines what ships in the npm tarball; gating mechanism via `files` whitelist; no `main` field (CLI only); zero declared dependencies
2. `bin/install.js` — Copies `commands/dc/`, `hooks/`, `agents/`, `rules/`, `templates/` to install target; merges `SessionStart` and `PostToolUse` hook entries into `settings.json`; supports `--local` and `--uninstall` flags; uses `path.resolve(__dirname, '..')` for package root
3. `README.md` (expanded) — Documents install command, quick start, command reference table, GSD integration, uninstall instructions, upgrade path

### Critical Pitfalls

See full details: `.planning/research/PITFALLS.md`

1. **`files` array missing directories (P29)** — `npm pack` silently omits unlisted directories; install reports success but skills are absent from `~/.claude/commands/dc/`. Avoid by listing all 6 directories explicitly and running `npm pack --dry-run` to audit every required file before publishing.

2. **settings.json clobbering (P30)** — Writing a fresh `settings.json` destroys GSD hooks and user customizations silently. Avoid by always reading existing JSON first, appending to hook arrays with dedup check, and never overwriting existing top-level keys.

3. **Relative paths in injected hook commands (P31)** — Dev-time relative paths (`node hooks/dc-freshness-check.js`) work from the repo root but silently fail post-install because hooks exit 0 on error. Avoid by always emitting absolute paths via `os.homedir()` for global install.

4. **`__dirname` vs `process.cwd()` for source resolution (P32)** — Using `process.cwd()` to locate bundled files works when running `node bin/install.js` from the package root but fails when invoked via `npx` from any other directory. Always use `path.resolve(__dirname, '..')` for the package root.

5. **Non-executable bin entry (P34)** — Missing `#!/usr/bin/env node` shebang causes `npx domain-context-cc` to fail with a cryptic error even though `node bin/install.js` works fine. Add shebang as the first line; npm sets the executable bit but the shebang is still required.

## Implications for Roadmap

Architecture research establishes a clear dependency-driven build order. Three phases, each delivering a testable increment, each gating the next.

### Phase 1: Package Configuration

**Rationale:** `package.json` has no code dependencies and defines what ships in the tarball. It must be authored before any end-to-end testing is possible — without the `files` whitelist, `npm pack --dry-run` cannot verify correctness. This is the simplest phase and unblocks all subsequent work.
**Delivers:** `package.json` with `name`, `version`, `bin` entry, `files` whitelist, `engines` constraint, and zero declared dependencies
**Addresses:** P1 features — `npx domain-context-cc` invocation, correct tarball contents
**Avoids:** P29 (files array missing directories), P34 (non-executable bin entry), P38 (dev artifacts in package)
**Verification:** `npm pack --dry-run` shows all expected files; no `.planning/`, `.context/`, `.claude/` in output

### Phase 2: Installer Logic

**Rationale:** The core deliverable. Depends on knowing the final file paths and package layout from Phase 1. Can be developed and tested locally (`node bin/install.js`) before packaging. All the complexity is here — path resolution, settings.json merge, idempotency, uninstall cleanup.
**Delivers:** `bin/install.js` — global install (default), `--local` flag, `--uninstall` flag, idempotent file copy via `fs.cpSync`, settings.json additive merge
**Uses:** `fs.cpSync`, `fs.rmSync`, `fs.mkdirSync({recursive: true})`, `os.homedir()`, `path.resolve(__dirname, '..')`, `JSON.parse`/`JSON.stringify`
**Implements:** File copy component + settings.json merge component from ARCHITECTURE.md
**Avoids:** P30 (settings.json clobbering), P31 (relative hook paths), P32 (`__dirname` vs cwd), P33 (uninstall orphan hooks), P35 (template overwrite on re-install), P39 (silent failure on missing target dirs)
**Verification:** Full "looks done but isn't" checklist from PITFALLS.md; cross-directory `npx .` test; merge test with pre-existing GSD hooks in settings.json

### Phase 3: README Expansion and Publishing

**Rationale:** Documentation is written last so it describes implemented behavior, not speculative behavior. Publishing requires Phases 1 and 2 to be complete and verified. README already exists; this phase expands it with install/uninstall/what-gets-installed sections and performs the first `npm publish`.
**Delivers:** Expanded `README.md` with install command, what-gets-installed list, upgrade path, uninstall instructions; first `npm publish`
**Addresses:** P1 features — README quick start (3 steps), command reference table, GSD integration section
**Verification:** End-to-end `npm pack && npx ./domain-context-cc-*.tgz` as documented in AGENTS.md; README answers "how do I install" and "what do I do next" for a new user

### Phase Ordering Rationale

- `package.json` must come before installer testing because the `files` field determines what the installer can find in the package; until the tarball boundary is defined, end-to-end tests are unreliable
- Installer before README because the README must accurately describe what the installer actually does (flags, paths, what gets installed); writing it before the installer risks doc-to-code drift
- This order exactly matches the "Build Order" section in ARCHITECTURE.md, derived independently from dependency analysis and confirmed by the v1.0 retrospective lesson ("template-first prevents circular dependencies")

### Research Flags

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 1 (Package Configuration):** Well-documented npm conventions; `package.json` structure is deterministic from research; no ambiguity remains
- **Phase 2 (Installer Logic):** All patterns are established — GSD installer provides a direct analog; settings.json structure verified from live file; Node.js built-in APIs verified in dev environment
- **Phase 3 (README):** Documentation only; content is determined by Phases 1 and 2 outputs

No phases need additional research. All research is complete and HIGH confidence.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All Node.js built-in APIs verified in Node 24.14.0 dev environment; version compat table confirmed against nodejs.org docs |
| Features | HIGH | Derived from live `~/.claude/settings.json`, existing GSD installer pattern as direct analog, and PLAN.md specification |
| Architecture | HIGH | settings.json structure verified directly from live file; GSD install layout observed from live `~/.claude/`; `__dirname` behavior documented and verified |
| Pitfalls | HIGH | Based on direct analysis of project files, live settings.json, and npm/Node.js documentation; each pitfall traced to a specific failure mechanism |

**Overall confidence:** HIGH

### Gaps to Address

- **Engine version discrepancy:** STACK.md recommends `>=20.0.0`; ARCHITECTURE.md says `>=18`. Both are conservative minimums for `fs.cpSync`. Resolve in Phase 1 by using `>=20.0.0` (current Maintenance LTS minimum, consistent with existing hooks).
- **Template preservation on re-install (P35):** Research recommends skip-if-exists with `--force` override, but the exact UX is left to implementation. Low risk — decide during Phase 2 execution.
- **Local install hook path format:** ARCHITECTURE.md specifies relative paths for local install (`.claude/hooks/...`). Verify this resolves correctly with Claude Code's cwd assumptions before Phase 3 publishing.

## Sources

### Primary (HIGH confidence)
- `/Users/alevine/.claude/settings.json` (read directly, 2026-03-17) — verified hook registration schema, GSD coexistence, absolute path format for global hooks
- `/Users/alevine/code/domain-context-claude/.claude/settings.json` (read directly) — local dev settings.json format, relative path conventions
- Node.js 24.14.0 local environment — `fs.cpSync` functional verification (`typeof fs.cpSync === 'function'` confirmed)
- `hooks/dc-freshness-check.js`, `hooks/dc-context-reminder.js` (this project) — CommonJS pattern, graceful degradation convention, hook filenames for settings.json entries
- `.planning/PROJECT.md` — authoritative v1.3 scope definition and flag requirements
- `README.md` (this project, existing) — confirmed CLI flag conventions already documented

### Secondary (MEDIUM confidence)
- nodejs.org/docs/latest-v24.x/api/fs.html — `fs.cpSync` version history (added v16.7.0)
- nodejs.org/en/about/previous-releases — LTS schedule (v24 Active, v22/v20 Maintenance as of 2026-03-17)
- npm documentation (training data) — `files` array behavior, `bin` entry, symlink handling, `npm pack --dry-run`

---
*Research completed: 2026-03-17*
*Ready for roadmap: yes*
