# Architecture Research

**Domain:** Claude Code skill system -- file scaffolding and manifest management
**Researched:** 2026-03-11
**Confidence:** HIGH

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Skill Layer (commands/dc/)               │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────┐  ┌─────┐│
│  │ dc:init │  │dc:explore│  │dc:validate│  │dc:add│  │dc:  ││
│  │         │  │          │  │           │  │      │  │refr.││
│  └────┬────┘  └────┬─────┘  └─────┬─────┘  └──┬───┘  └──┬──┘│
│       │            │              │            │         │   │
├───────┴────────────┴──────────────┴────────────┴─────────┴──┤
│                   Shared Concerns                            │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │ Template     │  │ Manifest      │  │ Path             │  │
│  │ Resolution   │  │ Parsing       │  │ Resolution       │  │
│  └──────────────┘  └───────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   Target Project Filesystem                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ .context/│  │AGENTS.md │  │CLAUDE.md  │  │ARCHITECTURE│  │
│  │  (files) │  │          │  │           │  │.md         │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| dc:init | Scaffold .context/ structure, wire AGENTS.md/CLAUDE.md | Skill markdown -- reads templates, creates dirs/files, appends snippets |
| dc:explore | Parse and summarize MANIFEST.md, show freshness, search entries | Skill markdown -- reads MANIFEST.md, parses verified dates, presents summary |
| dc:validate | Check manifest sync, freshness, orphans | Skill markdown -- wraps validate-context.sh, presents results, offers fixes |
| dc:add | Create new domain concept, ADR, or constraint from conversation | Skill markdown -- auto-detects numbering, fills templates, updates MANIFEST.md |
| dc:refresh | Review and update stale entries (>90 days) | Skill markdown -- parses dates, reads source code, proposes updates |
| Template Resolution | Locate templates in global or local install path | Inline logic in each skill (check two paths) |
| Manifest Parsing | Parse MANIFEST.md sections and verified dates | Inline logic -- markdown section parsing and regex date extraction |
| Path Resolution | Determine install location (global vs local) | Inline logic -- check ~/.claude/domain-context/ then .claude/domain-context/ |

## Recommended Project Structure

```
commands/
└── dc/
    ├── init.md              # Scaffolding skill
    ├── explore.md           # Read-only browsing skill
    ├── validate.md          # Validation + repair skill
    ├── add.md               # Content creation skill
    └── refresh.md           # Maintenance skill

templates/
├── MANIFEST.md              # .context/MANIFEST.md scaffold
├── CONTEXT.md               # Module-level CONTEXT.md scaffold
├── domain-concept.md        # .context/domain/ file scaffold
├── decision.md              # .context/decisions/ ADR scaffold
├── constraint.md            # .context/constraints/ file scaffold
└── AGENTS.md.snippet        # Text appended to project's AGENTS.md

tools/
└── validate-context.sh      # Standalone validation (called by dc:validate)
```

### Structure Rationale

- **commands/dc/:** Each skill is a standalone markdown file. No shared code between skills because Claude Code skills are markdown prompts, not executable code. Shared logic is described in each skill's process section.
- **templates/:** Flat directory. Templates are simple markdown with placeholder tokens. No nesting needed because the Domain Context spec has a flat namespace per category (domain/, decisions/, constraints/).
- **tools/:** Shell script for validation, kept separate because it is also usable standalone outside of Claude Code.

## Architectural Patterns

### Pattern 1: Self-Contained Skill (Primary Pattern)

**What:** Each skill file contains all the logic it needs as prose instructions in its `<process>` section. No shared code extraction. Shared concerns (template location, manifest parsing) are described inline in each skill that needs them.

**When to use:** Always, for this project. Claude Code skills are markdown prompts interpreted by the LLM -- they cannot import shared modules.

**Trade-offs:**
- Pro: Each skill is fully self-contained and independently testable
- Pro: No indirection -- the full behavior is readable in one file
- Con: Duplicated descriptions of manifest parsing logic across explore, validate, add, refresh
- Con: If the manifest format changes, multiple skills need updating

**Example:**
```markdown
---
name: dc:explore
description: Browse and summarize domain context
allowed-tools:
  - Read
  - Glob
  - Grep
---
<objective>
Parse and present .context/ contents with freshness status.
</objective>

<execution_context>
@~/.claude/domain-context/templates/MANIFEST.md
</execution_context>

<process>
1. Read .context/MANIFEST.md
2. Parse sections: Domain Concepts, Architecture Decisions, Constraints, Module Context Files
3. For each entry, extract: name, path, access level, verified date
4. Calculate freshness: entries with verified date >90 days ago are stale
5. Present summary table with freshness indicators
...
</process>
```

### Pattern 2: Workflow Delegation (GSD Pattern -- Not Recommended Here)

**What:** Skill file is thin; delegates to a separate workflow markdown file via `@path` reference in `<execution_context>`.

**When to use:** When skills share significant workflow logic or when the process is long enough (100+ lines) that separation improves readability. GSD uses this pattern because its skills share complex multi-step workflows.

**Trade-offs:**
- Pro: Workflow reuse across multiple entry points
- Pro: Separation of "what to invoke" from "how to do it"
- Con: Adds indirection -- must follow @references to understand behavior
- Con: Unnecessary for dc: skills which are each ~30-50 lines of process

**Recommendation:** Do NOT use workflow delegation for this project. The dc: skills are short and self-contained. The added indirection is not worth it for 5 skills of moderate complexity.

### Pattern 3: Template-Driven Scaffolding

**What:** Skills that create files read from template files and fill in context-specific values. Templates are plain markdown with `{placeholder}` tokens or structural markers.

**When to use:** dc:init and dc:add, which create new files from templates.

**Trade-offs:**
- Pro: Template changes do not require skill changes
- Pro: Templates serve as documentation of the expected file format
- Con: Template location must be resolved at runtime (global vs local install)

**Example flow:**
```
dc:init invoked
  -> Check: does .context/ already exist?
  -> Resolve template path: ~/.claude/domain-context/templates/ OR ./.claude/domain-context/templates/
  -> Read templates/MANIFEST.md
  -> Create .context/MANIFEST.md (fill project name, date)
  -> Create .context/domain/.gitkeep, .context/decisions/.gitkeep, .context/constraints/.gitkeep
  -> Read templates/AGENTS.md.snippet
  -> Append snippet to AGENTS.md (create if missing)
  -> Create CLAUDE.md with @AGENTS.md pointer (if missing)
  -> Create ARCHITECTURE.md skeleton (if missing)
```

## Data Flow

### Scaffolding Flow (dc:init)

```
User: /dc:init
    |
    v
Skill reads templates from install location
    |
    v
Creates .context/ directory structure
    |
    v
Creates/updates AGENTS.md, CLAUDE.md, ARCHITECTURE.md
    |
    v
User confirms -> files written to target project
```

### Read Flow (dc:explore, dc:validate, dc:refresh)

```
User: /dc:explore [topic]
    |
    v
Skill reads .context/MANIFEST.md
    |
    v
Parses markdown sections + verified dates
    |
    v
If topic given: Glob/Read matching .context/ files
    |
    v
Presents summary (freshness, counts, content)
```

### Write Flow (dc:add)

```
User: /dc:add [type]
    |
    v
Skill determines type (domain/decision/constraint)
    |
    v
For decisions: scans .context/decisions/ for next ADR number
    |
    v
Reads template from install location
    |
    v
Asks user to describe the concept
    |
    v
Fills template sections from user description
    |
    v
Creates file + updates MANIFEST.md with new entry
```

### Key Data Flows

1. **Template resolution:** Every scaffolding skill must check `~/.claude/domain-context/templates/` first (global install), then `.claude/domain-context/templates/` (local install). This is the one piece of logic duplicated across init and add.
2. **Manifest parsing:** Skills that read MANIFEST.md (explore, validate, add, refresh) all parse the same markdown structure: section headers, entry lines with `[name](path) -- description [access] [verified: date]` format.
3. **Freshness calculation:** Verified dates are parsed from `[verified: YYYY-MM-DD]` markers. Entries older than 90 days are flagged as stale. Used by explore (display), validate (report), and refresh (action).

## Component Boundaries and Dependencies

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Skill <-> Templates | Skill reads template files via Read tool | One-way; templates are passive data |
| Skill <-> Target .context/ | Skill reads/writes .context/ files via Read/Write/Glob tools | Skills operate on the target project, never on this project's own files |
| Skill <-> validate-context.sh | dc:validate runs the shell script via Bash tool | Script returns structured text output; skill interprets and presents it |
| Skill <-> User | AskUserQuestion for confirmations, direct output for results | dc:add requires user input; dc:init confirms before writing |

### What Does NOT Communicate

- Skills do not call other skills. Each is a standalone entry point.
- Skills do not share state between invocations. No session persistence.
- Templates do not reference each other. Each is independent.

## Build Order (Dependency-Driven)

The following order reflects true dependencies between components:

```
Phase A: Templates (no dependencies)
   templates/MANIFEST.md
   templates/domain-concept.md
   templates/decision.md
   templates/constraint.md
   templates/CONTEXT.md
   templates/AGENTS.md.snippet
         |
         v
Phase B: Foundation skills (depend on templates)
   commands/dc/init.md      -- depends on templates for scaffolding
   commands/dc/explore.md   -- depends on MANIFEST.md format (defined by template)
         |
         v
Phase C: Validation (depends on understanding manifest format from B)
   tools/validate-context.sh  -- standalone but informed by same format
   commands/dc/validate.md    -- depends on validate-context.sh
         |
         v
Phase D: Mutation skills (depend on templates + manifest format from B)
   commands/dc/add.md         -- depends on templates + manifest update logic
   commands/dc/refresh.md     -- depends on manifest parsing + freshness logic
```

**Rationale:**
- Templates first because they define the file formats that all skills produce or consume.
- init and explore first because they establish the scaffolding and reading patterns. init is the entry point for new users; explore validates that the manifest format is correctly understood.
- validate next because it verifies the integrity of what init creates, providing a feedback loop.
- add and refresh last because they are the most complex (mutation + manifest updates) and benefit from patterns established in earlier skills.

## Anti-Patterns

### Anti-Pattern 1: Shared Code Extraction

**What people do:** Extract "shared utilities" (manifest parsing, template resolution) into separate files that skills reference.
**Why it's wrong:** Claude Code skills are markdown prompts. There is no import mechanism. You cannot share executable code. Attempting to `@reference` a "utils.md" file as execution context adds indirection without actual code sharing -- the LLM just reads more text.
**Do this instead:** Describe the logic inline in each skill's `<process>` section. Accept the duplication. If the manifest format changes, update each skill. There are only 5 skills -- this is manageable.

### Anti-Pattern 2: Overly Prescriptive Process Steps

**What people do:** Write 50+ detailed steps in the `<process>` section, trying to control every conditional branch.
**Why it's wrong:** Skills are prompts for an LLM, not programs. Over-specification leads to rigid behavior and missed edge cases. The LLM handles edge cases better when given intent rather than exhaustive conditionals.
**Do this instead:** Describe the intent and key decision points. Trust the LLM to handle file-not-found, permission errors, and edge cases. Specify the happy path and the most important error cases (e.g., ".context/ already exists" for init).

### Anti-Pattern 3: Silent Manifest Mutation

**What people do:** Have skills silently update MANIFEST.md without showing the user what changed.
**Why it's wrong:** MANIFEST.md is the index of domain knowledge. Silent mutations lead to entries the user does not know about, stale entries that were "refreshed" without review, or incorrect descriptions.
**Do this instead:** Always show the proposed MANIFEST.md change and get confirmation before writing. dc:add should show the new entry line. dc:refresh should show which dates it will update.

## Scaling Considerations

This project does not scale in the traditional sense (it has no users/requests). The relevant scaling dimension is **number of .context/ entries in a target project**.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-20 entries | No issues. MANIFEST.md fits in a single context window. |
| 20-50 entries | dc:explore should summarize by section, not dump everything. Already planned. |
| 50+ entries | MANIFEST.md may exceed comfortable scanning size. Consider section-level summaries in explore. Refresh should batch by staleness priority, not process all at once. |

### First Bottleneck

**MANIFEST.md token count.** At 50+ entries, the manifest itself becomes expensive to include in context. Mitigation: skills should parse MANIFEST.md programmatically (Grep for specific entries) rather than reading the whole file when looking for a specific entry.

## Sources

- GSD skill patterns: `/Users/alevine/.claude/commands/gsd/` (examined new-project.md, health.md as reference implementations) -- HIGH confidence
- GSD workflow pattern: `/Users/alevine/.claude/get-shit-done/workflows/health.md` -- HIGH confidence
- Claude Code extension taxonomy: `/Users/alevine/code/domain-context-claude/.context/domain/claude-code-extensions.md` -- HIGH confidence
- Integration model: `/Users/alevine/code/domain-context-claude/.context/domain/integration-model.md` -- HIGH confidence
- Project plan: `/Users/alevine/code/domain-context-claude/PLAN.md` (Phase 2 skill specifications) -- HIGH confidence
- Existing architecture: `/Users/alevine/code/domain-context-claude/ARCHITECTURE.md` -- HIGH confidence

---
*Architecture research for: Claude Code domain context skills*
*Researched: 2026-03-11*
