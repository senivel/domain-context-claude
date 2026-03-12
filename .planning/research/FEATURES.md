# Feature Landscape

**Domain:** Domain context management skills for Claude Code
**Researched:** 2026-03-11
**Skills in scope:** dc:init, dc:explore, dc:validate, dc:add, dc:refresh

## Table Stakes

Features users expect. Missing = the skill feels broken or useless.

### dc:init

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Create .context/ directory with MANIFEST.md | This is literally the point of init | Low | Must match spec format exactly |
| Create domain/, decisions/, constraints/ subdirs | Spec requires these directories | Low | Use .gitkeep for empty dirs |
| Scaffold ARCHITECTURE.md skeleton if missing | Spec references it; AGENTS.md imports it | Low | Only create if absent |
| Append AGENTS.md snippet (not clobber) | The AGENTS.md bridge is the core integration model | Med | Must detect existing content, append idempotently |
| Create thin CLAUDE.md with @AGENTS.md pointer | Claude Code needs this entry point | Low | Only create if absent |
| Add .context.local/ to .gitignore | Private context must never leak to git | Low | Append if not already present |
| Detect existing .context/ and warn before overwriting | Users will accidentally re-init | Low | Prompt to confirm or skip |
| Print summary of created/skipped files | User needs to know what happened | Low | List each file with created/skipped/updated status |
| Resolve template location (global vs local install) | Templates live in different places depending on install type | Low | Check ~/.claude/domain-context/templates/ then .claude/domain-context/templates/ |

### dc:explore

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Parse and display MANIFEST.md contents | Core purpose of the skill | Low | Count domain concepts, decisions, constraints |
| Show freshness status per entry | Stale context is the #1 domain context problem | Med | Parse `[verified: YYYY-MM-DD]` dates, flag >90 days |
| Read and summarize a specific entry by keyword | Users need to look up specific concepts | Med | Fuzzy match against manifest entry names |
| Suggest /dc:init when no .context/ exists | Dead end without guidance is bad UX | Low | One-line suggestion |

### dc:validate

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Check MANIFEST.md entries point to existing files | Core validation: manifest/file sync | Med | Parse manifest, check each file exists |
| Detect orphan files not in MANIFEST.md | Files outside the manifest are invisible to agents | Med | Glob .context/ subdirs, diff against manifest entries |
| Check freshness (>90 day threshold) | Stale entries = wrong context = bad AI output | Low | Date arithmetic on verified timestamps |
| Present results conversationally (not raw script output) | This is a Claude Code skill, not a CLI tool | Low | Translate validation errors into plain language |
| Offer to fix issues found | Validation without remediation is half a tool | Med | Update MANIFEST.md, create missing files, update dates |

### dc:add

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Accept type: domain concept, decision, or constraint | Three content types in the spec | Low | Argument or interactive prompt |
| Auto-detect next ADR number for decisions | Manual numbering causes collisions and errors | Low | Scan decisions/ for highest NNN prefix |
| Fill template sections from user description | The whole point is not hand-writing markdown | Med | Populate What This Is, Key Attributes, Business Rules etc. |
| Create file with kebab-case naming | Spec convention | Low | Slugify the concept name |
| Update MANIFEST.md with new entry | File without manifest entry is invisible | Med | Insert in correct section, set verified date = today |

### dc:refresh

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Parse MANIFEST.md for verified dates | Entry point for the refresh workflow | Low | Same parser as explore/validate |
| Identify entries older than 90 days | Must surface what needs review | Low | Date comparison |
| Read each stale entry and assess accuracy | The skill must actually review content, not just list stale files | High | Read context file + relevant source code, compare |
| Update verified date if still accurate | The happy path must be frictionless | Low | Update `<!-- verified: YYYY-MM-DD -->` and MANIFEST.md |
| Propose content updates if drifted | Stale + wrong needs correction, not just a date bump | High | Generate updated content based on current code |

## Differentiators

Features that set these skills apart from "just editing markdown files by hand."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Progressive disclosure in explore** | Show manifest summary first, drill into specific entries on demand -- mirrors how agents consume context (cheap scan, then deep read) | Low | Matches the spec's progressive disclosure principle |
| **Cross-reference validation** | Validate that AGENTS.md actually references @.context/MANIFEST.md and @ARCHITECTURE.md -- not just that .context/ files are internally consistent | Med | Catches broken bridge pattern |
| **Intelligent refresh with code awareness** | dc:refresh reads source code alongside context files to assess drift, not just date thresholds | High | This is the killer feature -- context that self-heals |
| **Conversational add from discussion** | dc:add extracts structured domain knowledge from freeform conversation, not a form-fill | Med | Leverages Claude's natural language understanding |
| **Idempotent init** | Running dc:init twice is safe -- it detects what exists, only creates what's missing, appends without duplicating | Med | Users will forget they already initialized |
| **Access level awareness** | dc:add and dc:explore respect public/private access levels from the spec | Low | Matters when .context.local/ exists alongside .context/ |
| **Module CONTEXT.md discovery** | dc:explore finds and summarizes per-module CONTEXT.md files scattered throughout the codebase, not just top-level .context/ | Med | The spec supports module-level context; most users won't find these manually |

## Anti-Features

Features to explicitly NOT build. These are tempting but wrong.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Auto-generate domain context from code** | Domain context captures WHY, not WHAT. Code analysis produces descriptions, not business rules. Auto-generated context is worse than no context because it creates false confidence. | dc:add asks the developer to describe the concept. The developer is the source of truth for business intent. |
| **Auto-refresh on session start** | Refreshing stale entries requires reading source code and making judgments. Doing this silently would be slow, noisy, and produce unreliable updates. The spec requires extraction to be user-initiated. | Hook warns about staleness; user explicitly runs dc:refresh when ready. |
| **Schema enforcement / strict validation** | Domain context is documentation, not config. Over-validating markdown format creates friction that discourages adoption. Validate structure (files exist, manifest synced), not prose quality. | dc:validate checks structural integrity only. Content quality is the developer's responsibility. |
| **Interactive wizard for dc:init** | Multi-step interactive prompts are slow and annoying in Claude Code. The init should just work with sensible defaults. | Create everything with defaults, print summary. User customizes after. |
| **Diff/merge for context conflicts** | Git handles file conflicts. Building a custom merge tool for markdown is reinventing the wheel poorly. | Use standard git merge. Context files are small enough that conflicts are trivial to resolve manually. |
| **Template customization UI** | Users who want custom templates can edit the template files directly. A template management system adds complexity for a rare use case. | Document template file locations. Power users edit directly. |
| **Automatic MANIFEST.md rewriting** | Rewriting the entire manifest risks losing manual formatting, comments, or structure the user added. | Only append new entries (dc:add) or update specific fields (dc:refresh verified dates). Never rewrite the whole file. |

## Feature Dependencies

```
dc:init ------> dc:explore (explore needs .context/ to exist)
dc:init ------> dc:validate (validate needs .context/ to exist)
dc:init ------> dc:add (add needs .context/ and MANIFEST.md to exist)
dc:init ------> dc:refresh (refresh needs MANIFEST.md with verified dates)

dc:validate --> dc:add (validate can offer to create missing files, delegates to add's template logic)
dc:validate --> dc:refresh (validate identifies stale entries, can suggest dc:refresh)

dc:explore has no downstream dependencies (read-only)

Shared infrastructure:
  - MANIFEST.md parser (used by explore, validate, add, refresh)
  - Template reader (used by init, add)
  - Verified date parser/updater (used by explore, validate, refresh)
  - File path resolver for install location (used by init, add)
```

## MVP Recommendation

**Build in this order within the milestone:**

1. **dc:init** -- Everything else depends on .context/ existing. Build first, test on a fresh directory.
2. **dc:add** -- Second because it exercises template reading and MANIFEST.md updating, which other skills need.
3. **dc:explore** -- Third because it's the simplest read-only skill and validates the manifest parser.
4. **dc:validate** -- Fourth because it combines manifest parsing with file system checks and can reference dc:add for fixes.
5. **dc:refresh** -- Last because it's the most complex (code-aware review) and depends on patterns established by all other skills.

**Prioritize table stakes for all five skills before any differentiators.** The differentiators (progressive disclosure, cross-reference validation, intelligent refresh) are valuable but the skills must work at a basic level first.

**Defer to Phase 3:** Module CONTEXT.md discovery can be partially deferred -- dc:explore should list them if found, but deep integration with per-module context is more relevant to the hooks (dc-context-reminder.js) shipping in Phase 3.

## Shared Infrastructure to Extract

Several features repeat across skills. Extract these as shared patterns (not necessarily shared code, since skills are markdown, but shared process sections or referenced utilities):

| Shared Concern | Used By | Implementation |
|----------------|---------|----------------|
| MANIFEST.md parsing | explore, validate, add, refresh | Consistent parsing logic in each skill's process section |
| Template location resolution | init, add | Check global then local install path |
| Verified date parsing | explore, validate, refresh | Regex for `[verified: YYYY-MM-DD]` in manifest and `<!-- verified: -->` in files |
| Kebab-case slugification | add | Convert concept name to filename |
| ADR number detection | add | Scan decisions/ for highest NNN- prefix |

## Sources

- PROJECT.md -- project requirements and constraints
- PLAN.md -- detailed feature specs for each skill (Phase 2)
- .context/domain/integration-model.md -- three-concern model, AGENTS.md bridge pattern, business rules
- .context/domain/claude-code-extensions.md -- skills, hooks, agents, rules taxonomy
- .context/MANIFEST.md -- manifest format reference (dogfooding)

Note: Could not access ~/code/domain-context/SPEC.md directly. Feature completeness against the spec should be verified during implementation. Confidence on spec-specific format requirements is MEDIUM -- derived from the project's own .context/ files and PLAN.md references rather than the authoritative spec.
