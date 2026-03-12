# Project Research Summary

**Project:** domain-context-cc — Claude Code skills for Domain Context management
**Domain:** Claude Code skill development (file scaffolding, manifest parsing, validation)
**Researched:** 2026-03-11
**Confidence:** HIGH

## Executive Summary

This project delivers a set of five Claude Code skills (dc:init, dc:explore, dc:validate, dc:add, dc:refresh) plus two lifecycle hooks that give Claude Code native awareness of the Domain Context specification. The skills are markdown instruction files — not executable programs — which means the implementation medium is well-understood prose prompts interpreted by the LLM, not code. The established patterns from the GSD skill suite are directly applicable: YAML frontmatter, `<objective>` + `<execution_context>` + `<process>` sections, inline process logic for simple skills, and a hard constraint of zero runtime dependencies.

The recommended approach is to build skills as self-contained markdown files with inline process logic, driven by template files that are resolved at runtime from the install location. Templates define file format, skills instruct the LLM to read them and fill placeholders. The critical dependency chain is: templates first, then dc:init (scaffolding), then dc:explore (read-only, validates parsing), then dc:validate (integrity checking), then dc:add and dc:refresh (mutation). This order mirrors the ARCHITECTURE.md dependency graph and ensures each skill is testable as it is built.

The primary risks are operational, not architectural: template path resolution across global/local install modes, MANIFEST.md parsing brittleness against human-edited markdown, AGENTS.md append idempotency on re-init, and hook stdout/stdin protocol compliance. All are mitigated by established patterns from GSD. The one area of medium confidence is spec-format accuracy — the authoritative Domain Context spec at `~/code/domain-context/SPEC.md` was not directly accessible during research; feature completeness against it should be verified during implementation of dc:init and dc:add.

## Key Findings

### Recommended Stack

See full details: `.planning/research/STACK.md`

Skills in this project are markdown prompts executed by Claude Code's LLM — not Node.js programs. The only code written is hooks (Node.js) and the installer/validator (Node.js + bash). This constraint eliminates the majority of stack decisions: there is no framework to choose, no database, no API layer.

**Core technologies:**
- Claude Code Skill Format (current): Skill definition via YAML frontmatter + structured sections — the only supported format, no alternative exists
- Node.js >= 20 LTS: Hooks and installer only — Node 20+ gives stable `fs/promises` and modern path APIs; v24.14.0 verified locally
- Bash >= 3.2: `validate-context.sh` validation script — must target macOS default bash; avoid bash 4+ features
- Markdown: All skill files, templates, rules, agents — Claude Code's native configuration format

**No runtime dependencies.** Everything uses Node.js built-ins: `fs`, `fs/promises`, `path`, `process.stdin`, `process.stdout`.

### Expected Features

See full details: `.planning/research/FEATURES.md`

**Must have (table stakes) — ship all five skills with at minimum:**
- dc:init: Create .context/ structure, append to AGENTS.md idempotently, create CLAUDE.md and ARCHITECTURE.md if absent, add .context.local/ to .gitignore, print created/skipped summary
- dc:explore: Parse and display MANIFEST.md, show freshness status per entry, keyword search, suggest dc:init if .context/ absent
- dc:validate: Check manifest-file sync, detect orphan files, check freshness, present results conversationally, offer to fix issues
- dc:add: Accept domain/decision/constraint type, auto-detect ADR number, fill template from user description, update MANIFEST.md
- dc:refresh: Identify stale entries, read source code alongside context to assess drift, update verified dates and propose content updates

**Should have (differentiators):**
- Intelligent refresh with code awareness (dc:refresh reads source code, not just dates)
- Idempotent init (running dc:init twice is safe)
- Cross-reference validation (AGENTS.md actually references .context/MANIFEST.md)
- Progressive disclosure in explore (summary first, drill-in on demand)
- Conversational add (extract from freeform description, not form-fill)

**Defer to Phase 3+:**
- Module CONTEXT.md deep integration — dc:explore lists per-module CONTEXT.md files if found, but the dc-context-reminder.js hook (Phase 3) drives the full feature
- Access level awareness for .context.local/ — implement basic public/private distinction, defer complex access control

**Do not build:**
- Auto-generate domain context from code analysis (produces descriptions, not business rules)
- Auto-refresh on session start (slow, noisy, unreliable)
- Schema enforcement on prose content
- Interactive wizard for dc:init
- Custom merge/diff tooling for context conflicts

### Architecture Approach

See full details: `.planning/research/ARCHITECTURE.md`

The system has a clean three-layer structure: skill layer (markdown prompts in `commands/dc/`), shared concerns (template resolution, manifest parsing, path resolution — described inline in each skill's process section), and the target project filesystem (.context/, AGENTS.md, CLAUDE.md, ARCHITECTURE.md). Skills do not call each other and share no executable state between invocations. The self-contained skill pattern is the primary architectural choice: each skill file contains everything the LLM needs to execute, with no workflow delegation (the GSD pattern of thin skill + separate workflow file is explicitly not recommended here, as dc: skills are each ~30-50 lines of process).

**Major components:**
1. `commands/dc/` (5 skill files) — each self-contained markdown prompt with allowed-tools and inline process logic
2. `templates/` (6 template files) — passive data files read at runtime; define canonical file formats
3. `tools/validate-context.sh` — standalone bash validation; called by dc:validate via Bash tool
4. `hooks/` (2 Node.js hooks) — dc-freshness-check.js (SessionStart) and dc-context-reminder.js (PostToolUse); must follow strict stdin/stdout JSON protocol
5. `bin/install.js` — copies all above to ~/.claude/ or ./.claude/; must merge into settings.json without clobbering existing hooks

### Critical Pitfalls

See full details: `.planning/research/PITFALLS.md`

1. **Template path resolution fails silently** — Skills must explicitly check both `~/.claude/domain-context/templates/` (global) and `.claude/domain-context/templates/` (local); fail loudly if neither exists; never rely on `~` expansion in tool arguments. Address in dc:init first, carry the pattern to dc:add.

2. **MANIFEST.md parsing brittleness** — Users edit manifests by hand, introducing whitespace variations, different dash styles, and missing optional fields. Parse by section headers first, then entries leniently. Normalize on write-back via dc:add and dc:refresh to self-heal drift. Use strict parsing only in dc:validate.

3. **AGENTS.md append clobbers existing content** — dc:init must read AGENTS.md before appending and check for existing `@.context/MANIFEST.md` reference. Use a sentinel comment (`<!-- domain-context -->`) to detect prior init. Same logic for CLAUDE.md. Idempotency is a day-one requirement, not a v2 feature.

4. **Hook stdin/stdout protocol violations** — Hooks must drain stdin completely, parse JSON, do work in try/catch, write JSON to stdout only, and always exit(0) on error. All debug output goes to stderr. Copy GSD hook boilerplate exactly. Test by piping JSON manually before integration testing.

5. **Skill edge cases on existing projects** — Skills must handle both fresh directories and existing .context/ configurations. Every `<process>` section must specify what to do when files exist, not just the happy path. Test every skill against a project that already has partial domain context setup.

6. **ADR numbering in dc:add** — Glob decisions/ directory, parse numeric prefixes, find max, add 1, zero-pad to 3 digits. Cross-reference MANIFEST.md to catch filesystem/manifest divergence. Include an explicit example in the skill process to guide LLM arithmetic.

7. **Settings.json clobber during install** — The installer must read existing settings.json, merge dc hooks into existing arrays, and write back. Replacing the hooks object destroys GSD or other extensions' hooks. Recovery cost is HIGH.

## Implications for Roadmap

Based on research, the build order is well-defined by dependencies. PLAN.md already documents a 5-phase structure that aligns with the architecture research. The phases below reflect those dependencies and the pitfall prevention ordering.

### Phase 1: Templates and Scaffolding Foundation
**Rationale:** Templates define file formats consumed by all other skills. dc:init is the user's entry point and a dependency for all other skills. These have no upstream dependencies and can be built and tested independently.
**Delivers:** All 6 template files; dc:init skill that creates a correctly structured .context/ directory, wires AGENTS.md/CLAUDE.md, and handles idempotency
**Addresses:** dc:init table stakes (create structure, append AGENTS.md, detect existing .context/, print summary)
**Avoids:** Template path resolution pitfall (established here, carried forward), AGENTS.md clobber pitfall (idempotency built in from day one)

### Phase 2: Read-Only Skills (Explore + Validate)
**Rationale:** dc:explore is the simplest skill and validates the manifest parsing logic that explore, validate, add, and refresh all share. dc:validate provides the feedback loop to verify dc:init output. Building these before mutation skills prevents debugging broken manifests with broken mutation skills.
**Delivers:** dc:explore (manifest summary, freshness, keyword search); dc:validate (manifest sync, orphan detection, freshness check, conversational results); validate-context.sh shell script
**Uses:** MANIFEST.md parsing pattern established here; freshness date parsing (90-day threshold, both `[verified: ...]` and `<!-- verified: -->` formats)
**Avoids:** MANIFEST.md parsing brittleness (lenient parser defined here); freshness date inconsistency (single implementation, consistent behavior)

### Phase 3: Mutation Skills (Add + Refresh)
**Rationale:** dc:add and dc:refresh are the most complex skills. They depend on the manifest parsing patterns established in Phase 2 and the template reading patterns from Phase 1. dc:add must be built before dc:refresh because refresh follows the same update-MANIFEST.md path.
**Delivers:** dc:add (create domain concept/ADR/constraint from conversation, auto-number ADRs, update MANIFEST.md); dc:refresh (stale entry review with source code awareness, verified date updates in both locations)
**Implements:** Write flow and manifest mutation with confirmation-before-write discipline
**Avoids:** ADR numbering race condition (explicit algorithm in process section); silent manifest mutation (always show proposed change before writing); dc:refresh updating only one of two date locations

### Phase 4: Hooks
**Rationale:** Hooks require the same patterns as skills but with stricter runtime constraints (stdin/stdout JSON protocol, timeout guard). Building them after skills means the domain is well-understood and the install location is established.
**Delivers:** dc-freshness-check.js (SessionStart hook; warns about stale entries); dc-context-reminder.js (PostToolUse hook; reminds to update CONTEXT.md when editing relevant files)
**Avoids:** Hook stdin/stdout protocol violations (copy GSD boilerplate exactly); hook timeout issues (3s stdin guard)

### Phase 5: Installer
**Rationale:** The installer is the distribution mechanism. Building it last means all files it installs are complete and tested. It also requires the most careful error handling (settings.json merge safety).
**Delivers:** `bin/install.js` (npm entry point); correct settings.json hook merge; global and local install mode support; post-install verification
**Avoids:** Settings.json clobber (merge, never replace); path resolution after npm install (test with `npm pack && npx`)

### Phase Ordering Rationale

- Templates before skills because skills read templates at runtime; undefined template format = undefined skill output
- dc:init before all other skills because .context/ must exist for any other skill to function
- Read-only skills before mutation skills to establish parsing patterns before using them in writes
- dc:explore before dc:validate because explore defines the parser; validate can reuse and extend it
- dc:add before dc:refresh because refresh follows the same MANIFEST.md update path
- Hooks before installer because the installer registers hooks in settings.json; hooks must exist to be registered
- Installer last because it packages everything else; integration testing (npm pack + npx) is the final verification

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Hooks):** Hook input JSON schema varies by event type (SessionStart vs PostToolUse). Verify the exact stdin payload shape for each event before implementation. GSD hooks are the best reference but the Claude Code docs should be checked for any updates.
- **Phase 5 (Installer):** The settings.json merge logic must handle edge cases: file doesn't exist, hooks array is absent, dc hooks already registered from a previous install. Review the GSD installer pattern (`gsd-tools.cjs`) for the established merge approach before writing.

Phases with well-documented patterns (can skip or minimize research-phase):
- **Phase 1 (Templates + dc:init):** File format defined by the Domain Context spec. Skill format defined by GSD pattern. Both are directly applicable.
- **Phase 2 (Read-only skills):** These are pure Read/Glob/Grep operations on well-understood file formats. No novel patterns.
- **Phase 3 (Mutation skills):** Complexity comes from ADR numbering logic and freshness date handling, both of which are fully specified in FEATURES.md and PITFALLS.md.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technology decisions are constrained by the project (Node.js only, no deps, markdown skills). No choices to make, just patterns to follow. |
| Features | MEDIUM | PLAN.md and project .context/ files are authoritative. The upstream Domain Context spec (~/code/domain-context/SPEC.md) was not directly readable during research. Format details should be verified against spec during Phase 1 and Phase 3. |
| Architecture | HIGH | Self-contained skill pattern is verified against GSD implementations. Component boundaries are clear and documented in ARCHITECTURE.md. |
| Pitfalls | HIGH | Derived from analysis of GSD hook boilerplate, GSD skill patterns, and direct analysis of likely failure modes in the target operations. |

**Overall confidence:** HIGH

### Gaps to Address

- **Domain Context spec format:** `~/code/domain-context/SPEC.md` was not accessible during research. Templates and skill process sections should be validated against the spec before Phase 1 is closed. Specifically: exact MANIFEST.md entry format, required sections in domain concept / decision / constraint files, and the `<!-- verified: -->` comment convention.
- **Hook input schemas:** The exact JSON shape of SessionStart and PostToolUse hook inputs should be verified against current Claude Code documentation before Phase 4 implementation. GSD's `dc-freshness-check.js` (when it exists) and the existing `gsd-context-monitor.js` are the best references.
- **validate-context.sh scope:** Whether the existing shell script fully covers the validation needed for dc:validate, or whether additional checks need to be added, should be assessed at the start of Phase 2.

## Sources

### Primary (HIGH confidence)
- GSD skill files (`~/.claude/commands/gsd/`) — established skill format patterns; new-project.md, health.md, execute-phase.md examined
- GSD hook (`~/.claude/hooks/gsd-context-monitor.js`) — stdin/stdout protocol, timeout guard, graceful degradation pattern
- Project `.context/domain/claude-code-extensions.md` — skills, hooks, agents, rules taxonomy
- Project `.context/domain/integration-model.md` — three-concern model, AGENTS.md bridge pattern
- `PLAN.md` — authoritative Phase 2 skill specifications and build order
- `ARCHITECTURE.md` — component boundaries and data flow
- `AGENTS.md` — project constraints and naming conventions

### Secondary (MEDIUM confidence)
- Project PLAN.md Phase 2 feature specs — derived from SPEC.md references; not independently verified against authoritative spec
- Project `.context/MANIFEST.md` — dogfood reference for manifest format; matches expected spec format but unverified against upstream

### Tertiary (not consulted — gap)
- `~/code/domain-context/SPEC.md` — authoritative format reference; not readable during research; should be consulted before Phase 1 templates are finalized

---
*Research completed: 2026-03-11*
*Ready for roadmap: yes*
