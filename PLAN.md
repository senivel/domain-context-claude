# Plan: Domain Context Integration for Claude Code & GSD

## Context

The Domain Context specification (at ~/code/domain-context/) defines a pattern for codifying domain knowledge as `.context/` directories with MANIFEST.md, domain/, decisions/, and constraints/ files. This project (domain-context-claude) will provide the tooling that makes Claude Code and GSD natively aware of Domain Context — initializing it, consuming it, validating it, and extracting new knowledge back into it.

**Why a single project:** Both integrations are Claude Code configuration files (skills, hooks, agents, rules). The GSD integration is thin — the AGENTS.md @imports automatically make GSD agents domain-context-aware (since GSD agents read CLAUDE.md which imports AGENTS.md), plus one extra skill for knowledge extraction. Separate repos would add overhead without meaningful separation of concerns.

**Why no MCP server for MVP:** The file-based approach is simpler and aligns with the spec's "framework agnostic" principle. MCP can come later for centralized/remote domain context serving.

## Decisions

- **AGENTS.md primary, thin CLAUDE.md pointer** — `dc:init` creates AGENTS.md as the primary instruction file (vendor-neutral) and a CLAUDE.md that does `@AGENTS.md`. Claude-only additions can go in CLAUDE.md alongside the import. This project itself follows the same pattern.
- **`dc:` command prefix** — Short, matches GSD's convention (e.g., `/dc:init`, `/dc:explore`)
- **Node.js runtime** — For installer (`npx domain-context-cc`) and hooks. Matches GSD's patterns, maximum reach across developer types, closer shell integration in the Claude Code ecosystem.
- **npm package: `domain-context-cc`** — Follows the `-cc` convention from GSD's `get-shit-done-cc`.

## Project Structure

```
domain-context-claude/
├── AGENTS.md                           # Primary instructions (vendor-neutral)
├── CLAUDE.md                           # Thin pointer: @AGENTS.md
├── ARCHITECTURE.md                     # System structure
├── .context/                           # Dogfooding — this project uses domain context
│   ├── MANIFEST.md
│   ├── domain/
│   │   ├── integration-model.md        # Three-concern model, AGENTS.md bridge pattern
│   │   └── claude-code-extensions.md   # Skills, hooks, agents, rules taxonomy
│   └── decisions/
│       ├── 001-single-project.md
│       ├── 002-agents-md-bridge.md
│       └── 003-no-mcp-mvp.md
├── commands/                           # Skills (installed to .claude/commands/dc/)
│   └── dc/
│       ├── init.md                     # Initialize .context/ in a project
│       ├── explore.md                  # Browse and summarize domain context
│       ├── validate.md                 # Check manifest sync, freshness, orphans
│       ├── add.md                      # Create domain concept, ADR, or constraint
│       ├── refresh.md                  # Review and update stale entries
│       └── extract.md                  # GSD: extract knowledge from .planning/ → .context/
├── agents/
│   └── domain-validator.md             # Validates code against domain rules
├── hooks/
│   ├── dc-freshness-check.js           # SessionStart: warn about stale entries
│   └── dc-context-reminder.js          # PostToolUse: remind about CONTEXT.md updates
├── rules/
│   └── domain-context.md               # Path-specific rules for .context/ editing
├── templates/                          # Copied to target project by dc:init
│   ├── MANIFEST.md
│   ├── CONTEXT.md
│   ├── domain-concept.md
│   ├── decision.md
│   ├── constraint.md
│   └── AGENTS.md.snippet               # Appended to adopting project's AGENTS.md
├── tools/
│   └── validate-context.sh             # Standalone validation script
├── bin/
│   └── install.js                      # npx installer (Node.js)
├── package.json
├── README.md
└── .gitignore
```

---

## Phase 1: Project Foundation & Dogfooding

**Goal:** Set up the repo and create this project's own domain context.

### Tasks

1. **`.gitignore`** — node_modules/, .context.local/, .planning/, .DS_Store
2. **`AGENTS.md`** — Primary instruction file. Document that this is a Claude Code extension project (skills as markdown, hooks as Node.js, no runtime code beyond install script). Include project context pointers to @ARCHITECTURE.md and @.context/MANIFEST.md. Reference the Domain Context spec at ~/code/domain-context/SPEC.md as authoritative.
3. **`CLAUDE.md`** — Thin pointer: `@AGENTS.md` plus any Claude-specific instructions (e.g., skill format conventions for Claude Code).
4. **`ARCHITECTURE.md`** — Module map: commands/ (skills), hooks/ (lifecycle scripts), agents/ (subagents), rules/ (conditional guidance), templates/ (project scaffolding), tools/ (standalone scripts), bin/ (installer). Data flow: install.js copies files → AGENTS.md imports .context/ → skills operate on .context/ → hooks monitor freshness.
5. **`.context/MANIFEST.md`** — Index of this project's domain concepts and decisions.
6. **`.context/domain/integration-model.md`** — The three-concern model (How/What/Why), the AGENTS.md bridge pattern for GSD, episodic→semantic memory extraction.
7. **`.context/domain/claude-code-extensions.md`** — Skills (commands/ → .claude/commands/), hooks (settings.json lifecycle events), agents (.claude/agents/), rules (.claude/rules/ with path matchers).
8. **`.context/decisions/001-single-project.md`** — ADR: single project for both Claude Code and GSD integration. Rationale: both are Claude Code config files; GSD integration is thin.
9. **`.context/decisions/002-agents-md-bridge.md`** — ADR: use AGENTS.md as primary instruction file with thin CLAUDE.md pointer. CLAUDE.md does `@AGENTS.md`. This makes domain context available to GSD agents (which read CLAUDE.md) without modifying GSD internals.
10. **`.context/decisions/003-no-mcp-mvp.md`** — ADR: no MCP server for MVP. Rationale: file-based approach is simpler, aligns with framework-agnostic principle.
11. **`README.md`** — Project overview, installation placeholder, feature list.

### Verification
- Run `bash ~/code/domain-context/tools/validate-context.sh .` — should pass
- CLAUDE.md @AGENTS.md import resolves correctly
- Commit

---

## Phase 2: Core Claude Code Skills

**Goal:** Build the five core skills that work for any Claude Code user.

### 2.1: `commands/dc/init.md`
Initialize .context/ in any project:
1. Check if .context/ already exists
2. Create directory structure (MANIFEST.md, domain/, decisions/, constraints/ with .gitkeep)
3. Create ARCHITECTURE.md skeleton if missing
4. Create or update AGENTS.md: append AGENTS.md.snippet (domain context pointers including @ARCHITECTURE.md, @.context/MANIFEST.md)
5. Create CLAUDE.md if missing: thin `@AGENTS.md` pointer
6. Update .gitignore with .context.local/
7. Print summary of created files

Templates are read from `~/.claude/domain-context/templates/` (global install) or `.claude/domain-context/templates/` (local install). The skill should check both locations.

### 2.2: `commands/dc/explore.md`
Browse domain context:
1. Read .context/MANIFEST.md
2. Summarize: N domain concepts, N decisions, N constraints, N module CONTEXT.md files
3. Show freshness status (entries approaching or past 90-day threshold)
4. If argument given (e.g., `/dc:explore subscriptions`), find and read matching entry
5. If no .context/ exists, suggest `/dc:init`

### 2.3: `commands/dc/validate.md`
Validate domain context integrity:
1. Run validate-context.sh (bundled at ~/.claude/domain-context/tools/)
2. Present results conversationally
3. Offer to fix issues: update MANIFEST.md for orphans, create missing files from templates, update stale verified dates after review

### 2.4: `commands/dc/add.md`
Create new domain context files:
1. Accept type as argument or ask: domain concept, decision, or constraint
2. For decisions: auto-detect next ADR number from existing files
3. Ask user to describe the concept/decision/constraint
4. Fill template sections from user's description
5. Create file with kebab-case naming
6. Update MANIFEST.md with new entry (correct section, verified date = today)

### 2.5: `commands/dc/refresh.md`
Review stale entries:
1. Parse MANIFEST.md for verified dates
2. Identify entries older than 90 days (or configured threshold)
3. For each stale entry: read context file, read relevant source code, assess accuracy
4. If still accurate: update verified date. If drifted: propose content updates
5. Update MANIFEST.md

### Verification
- Install skills locally to .claude/commands/dc/
- Test `/dc:init` on a fresh temp directory
- Test `/dc:validate` on this project (should pass)
- Test `/dc:add` to create a new domain concept
- Test `/dc:explore` to browse context
- Test `/dc:refresh` with artificially old verified dates
- Commit

---

## Phase 3: Hooks, Rules, and Agent

**Goal:** Add passive integrations that make Claude Code domain-context-aware without explicit commands.

### 3.1: `hooks/dc-freshness-check.js` (SessionStart)
- Follow GSD hook pattern (Node.js, stdin JSON, stdout JSON)
- On session start: check if .context/MANIFEST.md exists in cwd
- Parse verified dates, warn if entries are >90 days old
- Output via `additionalContext`: "N domain context entries are stale. Run /dc:refresh."
- Timeout: 5000ms, graceful degradation (exit 0 on any error)

### 3.2: `hooks/dc-context-reminder.js` (PostToolUse)
- Trigger on Write/Edit tool uses only
- Check if modified file is in a directory with a CONTEXT.md
- If CONTEXT.md exists but wasn't touched this session, output gentle reminder
- Debounce: one reminder per module per session (track in /tmp file)

### 3.3: `rules/domain-context.md`
- Path matcher: `.context/**`, `**/CONTEXT.md`
- Content: instructions for maintaining format (template structure, MANIFEST.md updates, verified dates, one-line descriptions, kebab-case naming, ADR numbering)

### 3.4: `agents/domain-validator.md`
- Read-only agent (tools: Read, Glob, Grep)
- Purpose: validate code changes against documented business rules and constraints
- Reads relevant .context/domain/ files and CONTEXT.md, compares against proposed changes, flags violations

### Verification
- Add hooks to settings.json, start new session, verify freshness warning appears
- Edit a file in a module with CONTEXT.md, verify reminder appears
- Test rule loads when editing .context/ files
- Test domain-validator agent on a sample project
- Commit

---

## Phase 4: GSD Integration

**Goal:** Enable the bidirectional relationship between GSD's .planning/ artifacts and domain context.

### 4.1: `commands/dc/extract.md`
Knowledge extraction skill — the key GSD integration:
1. Check for .planning/ directory
2. Read .planning/STATE.md for current project state
3. Scan .planning/phases/ for completed phases (PLAN.md, SUMMARY.md, CONTEXT.md, VERIFICATION.md)
4. Identify domain-relevant content: new business rules, entity definitions, invariants, architectural decisions, constraints
5. Cross-reference against existing .context/ files to find net-new knowledge
6. Propose:
   - New domain concept files for new entities/concepts
   - Updates to existing domain files for refined rules/invariants
   - New ADRs for architectural decisions made during the phase
   - New/updated module CONTEXT.md files
7. Present proposals to user for approval
8. Create approved files from templates, update MANIFEST.md

This implements the spec's episodic→semantic memory consolidation (spec §10.1 point 3, §8.4).

### 4.2: `templates/AGENTS.md.snippet`
The text that `dc:init` appends to AGENTS.md. Since CLAUDE.md does `@AGENTS.md`, GSD agents get this automatically:
```markdown
## Project Context

This project uses Domain Context for domain knowledge.

- Architecture overview: @ARCHITECTURE.md
- Domain knowledge index: @.context/MANIFEST.md

When working in a module, read its CONTEXT.md first.
When a task involves business rules, consult .context/domain/ via the manifest.
```

### Verification
- Set up a test project with both GSD and domain-context-cc installed
- Run `/gsd:new-project`, verify GSD agents reference .context/ when AGENTS.md includes imports
- Complete a phase, run `/dc:extract`, verify it identifies novel domain knowledge
- Commit

---

## Phase 5: Installation & Distribution

**Goal:** Package for npm distribution following GSD's installer pattern.

### 5.1: `package.json`
- name: `domain-context-cc`
- bin: `{ "domain-context-cc": "bin/install.js" }`
- files: commands/, agents/, hooks/, rules/, templates/, tools/, bin/
- No runtime dependencies (Node.js built-ins only)

### 5.2: `bin/install.js`
Node.js install script:
1. Parse args: `--global` (→ ~/.claude/), `--local` (→ ./.claude/), `--uninstall`
2. Display banner
3. Copy commands/dc/ → {target}/commands/dc/
4. Copy agents/domain-validator.md → {target}/agents/
5. Copy hooks/*.js → {target}/hooks/
6. Copy rules/domain-context.md → {target}/rules/
7. Copy templates/ and tools/ → {target}/domain-context/
8. Merge hook config into settings.json (SessionStart + PostToolUse) without clobbering existing entries
9. Print success message with next steps (`/dc:init` to initialize a project)

Uninstall: remove dc-prefixed files, remove hooks from settings.json.

### 5.3: Final README.md
- Install: `npx domain-context-cc` (global) or `npx domain-context-cc --local`
- Quick start: install → `/dc:init` → start working
- Commands: all 6 skills with descriptions
- GSD integration: AGENTS.md bridge explanation, `/dc:extract` workflow
- Link to spec repo

### Verification
- `npm pack`, inspect tarball
- Test install on clean .claude/ directory
- Verify settings.json merge doesn't clobber
- Test uninstall removes everything
- Test alongside GSD (no conflicts)

---

## Key Files to Reference During Implementation

| File | Purpose |
|------|---------|
| `~/code/domain-context/SPEC.md` | Authoritative spec (formats, sections, rules) |
| `~/code/domain-context/template/` | Templates for .context/ files |
| `~/code/domain-context/tools/validate-context.sh` | Validation logic to bundle |
| GSD skill files (installed via npx) | Pattern for skill markdown format |
| GSD hooks (installed via npx) | Pattern for Node.js hook format |
| GSD install.js | Pattern for npm installer |
