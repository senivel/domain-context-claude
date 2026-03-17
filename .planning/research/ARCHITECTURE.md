# Architecture Research

**Domain:** Claude Code extension integration -- dc:extract skill and AGENTS.md.snippet template added to existing project
**Researched:** 2026-03-16
**Confidence:** HIGH

## Context: This Is a v1.2 Integration Research Document

This document supersedes the v1.1 ARCHITECTURE.md for the v1.2 milestone. It answers a single question: how do `dc:extract` and the GSD-aware `AGENTS.md.snippet` template integrate into the architecture that already exists? The v1.0 research covers the skill layer; v1.1 covers hooks, rules, and agents. Those analyses are not repeated here.

## Existing Architecture (v1.1 Baseline)

```
domain-context-claude/
├── commands/dc/              [5 skills] init, explore, validate, add, refresh
├── hooks/                    [2 hooks] freshness-check, context-reminder
├── agents/                   [1 agent] domain-validator
├── rules/                    [1 rule] context-editing
├── templates/                [8 templates] manifest, architecture, agents-snippet,
│                              claude, context, domain-concept, decision, constraint
├── tools/                    [1 script] validate-templates.sh
└── .claude/                  [installed copies]
```

**Key patterns established:**
- Skills read templates from TEMPLATE_DIR (local `.claude/domain-context/templates/` or global `~/.claude/domain-context/templates/`)
- Skills follow YAML frontmatter + `<objective>` + `<execution_context>` + `<process>` format
- Templates use `{placeholder}` tokens with snake_case names
- Sentinel comments (`<!-- domain-context:start/end -->`) for idempotent injection
- All generated files follow Domain Context spec format
- Skills handle MANIFEST.md updates (entry registration, section detection, `(none yet)` replacement)

## New Components: What Gets Added

| Component | Type | Source Path | Install Path |
|-----------|------|-------------|--------------|
| dc:extract | Skill | `commands/dc/extract.md` | `.claude/commands/dc/extract.md` |
| gsd-agents-snippet.md | Template | `templates/gsd-agents-snippet.md` | `~/.claude/domain-context/templates/gsd-agents-snippet.md` |

### What Does NOT Change

- No existing skill files are modified
- No hooks, agents, or rules are modified
- No existing templates change (the current `agents-snippet.md` is the Domain Context snippet, not the GSD snippet -- these are separate)
- `settings.json` is unchanged
- The v1.0 and v1.1 layers are entirely unaffected

## System Overview (v1.2)

```
┌───────────────────────────────────────────────────────────────────┐
│                     Active Layer (user-invoked)                    │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────┐  ┌──────────┐ │
│  │ dc:init │  │dc:explore│  │dc:validate│  │dc:add│  │dc:refresh│ │
│  └────┬────┘  └──────────┘  └──────────┘  └─────┘  └──────────┘ │
│       │ uses                                                      │
│       v                                                           │
│  ┌────────────────┐      ┌────────────────────────────────────┐  │
│  │gsd-agents-      │      │ dc:extract                [NEW]   │  │
│  │snippet.md [NEW] │      │ Reads .planning/ artifacts        │  │
│  │template for     │      │ Cross-references .context/        │  │
│  │dc:init GSD wire │      │ Proposes domain concepts, ADRs,   │  │
│  └────────────────┘      │ CONTEXT.md updates                │  │
│                           └──────────┬────────────────────────┘  │
│                                      │ reuses                     │
│                                      v                            │
│                            dc:add patterns (template fill,        │
│                            MANIFEST.md update, duplicate detect)  │
├───────────────────────────────────────────────────────────────────┤
│                  Passive Layer (v1.1, unchanged)                   │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐  │
│  │  SessionStart Hook   │  │       PostToolUse Hook           │  │
│  └──────────────────────┘  └──────────────────────────────────┘  │
├───────────────────────────────────────────────────────────────────┤
│                 Target Project Filesystem                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐     │
│  │.context/ │  │.planning/│  │AGENTS.md │  │ARCHITECTURE │     │
│  │MANIFEST  │  │(GSD)     │  │          │  │.md          │     │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘     │
└───────────────────────────────────────────────────────────────────┘
```

## Component 1: dc:extract Skill

### Purpose

Extract durable domain knowledge from completed GSD `.planning/` artifacts into `.context/` files. This is the "episodic to semantic memory consolidation" described in the integration model: transient planning knowledge becomes permanent domain context.

### Data Flow

```
User invokes /dc:extract
    |
    v
Discover .planning/ artifacts
    |
    +-- .planning/phases/*/CONTEXT.md    (domain boundaries, implementation decisions)
    +-- .planning/phases/*/*-SUMMARY.md  (key decisions, patterns established)
    +-- .planning/RETROSPECTIVE.md       (cross-phase lessons, patterns)
    +-- .planning/milestones/*/REQUIREMENTS.md (optional: constraint sources)
    |
    v
Read existing .context/ to understand what's already documented
    |
    +-- .context/MANIFEST.md             (current entries)
    +-- .context/domain/*.md             (existing concepts)
    +-- .context/decisions/*.md          (existing ADRs)
    +-- .context/constraints/*.md        (existing constraints)
    |
    v
Cross-reference: what knowledge in .planning/ is NOT in .context/?
    |
    v
Propose extraction candidates (grouped by type)
    |
    +-- New domain concepts   (from CONTEXT.md domain sections, SUMMARY patterns)
    +-- New ADRs              (from CONTEXT.md decisions sections, SUMMARY key-decisions)
    +-- New constraints       (from requirements, CONTEXT.md constraints)
    +-- CONTEXT.md updates    (suggest module-level CONTEXT.md files for code areas)
    |
    v
User reviews each proposal → Accept / Edit / Skip
    |
    v
For accepted proposals: create file + update MANIFEST.md
(reuse dc:add Step 5-11 patterns: template fill, ADR numbering, duplicate detect, preview, write, register)
```

### Input: .planning/ Artifact Format

GSD phase artifacts follow a consistent structure. The dc:extract skill reads these sections:

**Phase CONTEXT.md files** (`<domain>`, `<decisions>`, `<specifics>`, `<code_context>`, `<deferred>` XML sections):
- `<domain>` -- phase boundary description, often contains domain concept candidates
- `<decisions>` -- implementation decisions with rationale, prime ADR candidates
- `<code_context>` -- established patterns, integration points
- `<deferred>` -- deferred ideas (may contain future constraint or concept seeds)

**Phase SUMMARY.md files** (YAML frontmatter + markdown):
- `key-decisions` -- list of decisions made during execution
- `patterns-established` -- reusable patterns (potential domain concepts)
- `tech-stack.patterns` -- technical patterns used

**RETROSPECTIVE.md** (milestone-level):
- `Patterns Established` sections -- cross-phase patterns worth documenting
- `Key Lessons` sections -- may surface constraints or domain rules

### Output: .context/ Files

dc:extract produces the same file types as dc:add:
- Domain concept files in `.context/domain/` using `domain-concept.md` template
- ADR files in `.context/decisions/` using `decision.md` template
- Constraint files in `.context/constraints/` using `constraint.md` template
- (Does NOT create CONTEXT.md files directly -- instead recommends locations)

### Relationship to dc:add

dc:extract is NOT a replacement for dc:add. The key distinction:
- **dc:add** -- user describes a single entry from their head; skill creates it
- **dc:extract** -- skill reads .planning/ artifacts and proposes entries; user confirms

dc:extract reuses dc:add's internal patterns:
- Template resolution (Step 2 of dc:add)
- Template filling (Step 5 of dc:add)
- ADR auto-numbering (Step 6 of dc:add)
- Duplicate detection (Step 8 of dc:add)
- MANIFEST.md registration (Step 11 of dc:add)

However, dc:extract does NOT literally call dc:add. It is a standalone skill that follows the same patterns. Skills cannot invoke other skills -- they are prompts, not functions.

### Allowed Tools

```yaml
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
```

Grep is needed (dc:add does not use Grep) because dc:extract must search .planning/ artifacts for knowledge patterns and cross-reference against existing .context/ content.

### Key Design Decisions

**1. Scan-then-propose, not stream-of-consciousness.**
Read all .planning/ artifacts first, build a complete candidate list, deduplicate against .context/, then present proposals. Do not propose entries one-at-a-time as artifacts are read -- the user would face redundant proposals.

**2. Group proposals by type, not by source phase.**
Present "3 domain concepts, 2 ADRs, 1 constraint" rather than "Phase 1 has X, Phase 2 has Y." The user cares about what goes into .context/, not where it came from.

**3. Per-proposal accept/edit/skip, not bulk accept.**
Consistent with dc:validate's per-group fix pattern. Each proposed entry is shown individually for review. This is critical because dc:extract's proposals are AI-interpreted summaries of planning artifacts -- the user must validate accuracy.

**4. Cross-reference deduplication is mandatory.**
Before proposing any entry, check if the concept/decision already exists in .context/. Planning artifacts often reference the same decisions across phases. Without dedup, the user gets 5 proposals for the same ADR.

**5. Tolerate missing .planning/ gracefully.**
Not every project uses GSD. If `.planning/` does not exist, display "No .planning/ directory found. This skill extracts knowledge from GSD planning artifacts." and stop.

**6. Tolerate incomplete .planning/ gracefully.**
Phases may lack CONTEXT.md or SUMMARY.md files. Some projects have milestones/, some have phases/, some have both. Scan what exists; do not error on missing files.

## Component 2: gsd-agents-snippet.md Template

### Purpose

A second AGENTS.md snippet (alongside the existing `agents-snippet.md`) that wires GSD awareness into AGENTS.md. When dc:init runs in a project that uses or will use GSD, this snippet adds GSD-specific instructions.

### How It Differs from agents-snippet.md

| Aspect | agents-snippet.md (existing) | gsd-agents-snippet.md (new) |
|--------|------------------------------|------------------------------|
| Purpose | Wire .context/ awareness | Wire .planning/ awareness |
| Content | "Read MANIFEST.md, consult domain files" | "Read .planning/PROJECT.md, consult STATE.md" |
| Sentinels | `<!-- domain-context:start/end -->` | `<!-- gsd-bridge:start/end -->` |
| When injected | Always (core DC functionality) | Conditionally (only if GSD detected or user requests) |
| Static? | Yes (no placeholders) | Yes (no placeholders) |

### Content Structure

```markdown
<!-- gsd-bridge:start -->
## GSD Integration

This project uses [GSD](https://github.com/senivel/get-shit-done) for planning and execution.

- Project context: @.planning/PROJECT.md
- Current state: @.planning/STATE.md
- Domain knowledge extracted from planning: run /dc:extract after completing milestones

When starting a task, check .planning/STATE.md for current phase and accumulated context.
After completing a milestone, run /dc:extract to consolidate domain knowledge into .context/.
<!-- gsd-bridge:end -->
```

### Integration with dc:init

dc:init Step 7 currently injects `agents-snippet.md` into AGENTS.md. The GSD snippet injection follows the same pattern:

1. Read `gsd-agents-snippet.md` from TEMPLATE_DIR
2. Check if AGENTS.md already contains `<!-- gsd-bridge:start -->`
3. If present: skip (idempotent)
4. If not present and GSD detected (`.planning/` exists or user confirms): append after the domain-context snippet

**Detection heuristic:** Check if `.planning/PROJECT.md` or `.planning/config.json` exists. If yes, GSD is in use. If not, ask the user: "Set up GSD integration in AGENTS.md? (GSD manages planning artifacts in .planning/)"

**dc:init modification scope:** Step 7 gains a sub-step (7b) for the GSD snippet. This is the ONLY change to dc:init.

### Sentinel-Based Idempotency

Uses `<!-- gsd-bridge:start -->` / `<!-- gsd-bridge:end -->` sentinels, distinct from the existing `<!-- domain-context:start -->` / `<!-- domain-context:end -->` sentinels. This means:
- Each snippet can be independently detected and skipped on re-run
- Future updates can replace one snippet without affecting the other
- Order in AGENTS.md: domain-context snippet first, gsd-bridge snippet second

## Data Flow: .planning/ to .context/ Bridge

```
.planning/ (episodic, per-milestone)        .context/ (semantic, permanent)
┌──────────────────────────────┐            ┌──────────────────────────────┐
│ phases/*/CONTEXT.md          │            │ domain/*.md                  │
│   <domain> sections       ───┼──extract──>│   Domain concepts            │
│   <decisions> sections    ───┼──extract──>│ decisions/*.md               │
│                              │            │   Architecture decisions     │
│ phases/*/*-SUMMARY.md        │            │ constraints/*.md             │
│   key-decisions           ───┼──extract──>│   Constraints                │
│   patterns-established    ───┼──extract──>│                              │
│                              │            │ MANIFEST.md                  │
│ RETROSPECTIVE.md             │            │   Updated with new entries   │
│   Patterns Established    ───┼──extract──>│                              │
│   Key Lessons             ───┼──extract──>│                              │
│                              │            │                              │
│ milestones/*/REQUIREMENTS.md │            │                              │
│   Constraints             ───┼──extract──>│                              │
└──────────────────────────────┘            └──────────────────────────────┘
        dc:extract reads                        dc:extract writes
        (never modifies)                        (same as dc:add)
```

**Critical boundary:** dc:extract NEVER modifies .planning/ files. The flow is strictly one-directional. .planning/ is GSD's domain; .context/ is Domain Context's domain.

## Component Boundaries

| Component | Inputs | Outputs | Depends On |
|-----------|--------|---------|------------|
| dc:extract skill | .planning/ artifacts, .context/ current state | New .context/ files, MANIFEST.md updates | Templates (domain-concept, decision, constraint), MANIFEST.md format |
| gsd-agents-snippet.md | None (static template) | Injected into AGENTS.md by dc:init | Sentinel pattern from agents-snippet.md |
| dc:init (modified Step 7) | gsd-agents-snippet.md template, .planning/ existence | AGENTS.md with GSD snippet appended | gsd-agents-snippet.md template, existing dc:init logic |

### Communication Map

```
dc:extract ──reads──> .planning/ artifacts
dc:extract ──reads──> .context/ (dedup check)
dc:extract ──reads──> templates/ (domain-concept.md, decision.md, constraint.md)
dc:extract ──writes─> .context/ (new files)
dc:extract ──edits──> .context/MANIFEST.md (register new entries)

dc:init ──reads──> templates/gsd-agents-snippet.md [NEW]
dc:init ──reads──> .planning/ (existence check only) [NEW]
dc:init ──edits──> AGENTS.md (append snippet) [MODIFIED]
```

### What Does NOT Communicate

- dc:extract does not invoke dc:add (skills cannot call skills)
- dc:extract does not modify .planning/ (read-only from .planning/)
- gsd-agents-snippet does not reference dc:extract (it mentions the command name in prose, but has no code dependency)
- No hooks, agents, or rules are involved in the extract flow
- dc:extract does not modify ARCHITECTURE.md (only .context/ files)

## Architectural Patterns

### Pattern: Knowledge Extraction (Scan-Propose-Confirm)

**What:** A skill that reads one knowledge store, cross-references against another, and proposes additions with user confirmation.

**When to use:** When converting transient artifacts (planning docs, meeting notes, spike results) into durable structured documentation.

**Structure:**
```
1. Discover source artifacts (Glob)
2. Read and parse source content (Read)
3. Read existing target content (Read)
4. Cross-reference: identify gaps (in-skill logic)
5. Present proposals (conversational output)
6. For each accepted proposal: fill template, write file, register
```

**Key constraint:** The skill proposes; the user decides. Never auto-create domain context entries. This is Business Rule 3 from the integration model.

### Pattern: Conditional Template Injection

**What:** A template that is injected into a target file only when a condition is met (e.g., GSD is detected), using sentinel comments for idempotency.

**When to use:** When a feature is optional and its AGENTS.md snippet should only appear in projects that use the feature.

**Structure:**
```
1. Check condition (directory exists, config present, user confirms)
2. Read template with unique sentinels
3. Check if sentinels already present in target → skip
4. Append template to target file
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Auto-Extracting Without Confirmation

**What:** Reading .planning/ and automatically creating .context/ files without user review.

**Why bad:** Planning artifacts contain implementation details ("used HashMap for O(1) lookup"), not domain knowledge ("orders must be fulfilled within 48 hours"). AI interpretation of which is which will be wrong some percentage of the time. Silent creation of incorrect domain context is worse than no domain context.

**Instead:** Present each proposal with the extracted content for user confirmation. The user is the authority on what constitutes domain knowledge vs. implementation trivia.

### Anti-Pattern 2: Parsing .planning/ With Rigid Structure Expectations

**What:** Expecting every phase to have CONTEXT.md, every CONTEXT.md to have all XML sections, every SUMMARY.md to have all frontmatter fields.

**Why bad:** GSD's .planning/ format evolves. Different projects use different GSD configs. Rigid parsing breaks on real projects.

**Instead:** Use defensive reading. Check for file existence before reading. Parse sections that exist; skip sections that don't. Treat every .planning/ field as optional.

### Anti-Pattern 3: One Snippet Template for Both DC and GSD

**What:** Combining the domain-context snippet and GSD snippet into a single template file.

**Why bad:** The two snippets have independent lifecycles. A project may use Domain Context without GSD. Combining them forces GSD content on non-GSD projects or requires complex conditional logic in a single template.

**Instead:** Two separate templates with independent sentinel pairs. dc:init injects the domain-context snippet always and the GSD snippet conditionally.

### Anti-Pattern 4: dc:extract Modifying dc:init's Behavior at Runtime

**What:** Having dc:extract dynamically change how dc:init works (e.g., by writing config files that dc:init reads).

**Why bad:** Skills are stateless markdown prompts. They cannot share runtime state. Creating implicit coupling between skills via filesystem side-channels makes behavior unpredictable.

**Instead:** dc:init has its own logic for GSD detection. dc:extract has its own logic for .planning/ scanning. They share templates but not state.

## Build Order (Dependency-Driven)

```
Phase 1: gsd-agents-snippet.md template
         (no dependencies; static content; establishes sentinel pattern)
         |
         v
Phase 2: dc:init modification (Step 7b: conditional GSD snippet injection)
         (depends on: gsd-agents-snippet.md template existing)
         |
         v
Phase 3: dc:extract skill
         (depends on: understanding of .planning/ format, .context/ format,
          template fill patterns from dc:add, MANIFEST.md update patterns)
         (does NOT depend on gsd-agents-snippet or dc:init modification)
```

**Rationale:**
- Template first: consistent with v1.0's "template-first build order prevents circular deps" lesson. The template must exist before dc:init can reference it.
- dc:init modification second: small scope (one sub-step added to Step 7), verifies the template works in practice, establishes the GSD detection heuristic that dc:extract also benefits from understanding.
- dc:extract last: most complex component. Benefits from having the GSD bridge wired so the full workflow (init with GSD awareness, work phases, extract knowledge) can be tested end-to-end.

**Alternative considered:** Building dc:extract first because it's the larger deliverable. Rejected because dc:extract does not depend on the other two components, while testing the full GSD integration story (init -> plan -> extract) requires all three.

**Total new/modified files:**
- 1 new template: `templates/gsd-agents-snippet.md`
- 1 modified skill: `commands/dc/init.md` (Step 7 gains sub-step 7b)
- 1 new skill: `commands/dc/extract.md`

## Scalability Considerations

| Concern | Small project (5 phases) | Large project (50+ phases) |
|---------|--------------------------|----------------------------|
| .planning/ scan time | Negligible (Glob + Read) | May take 5-10 seconds for 50 CONTEXT.md + 50 SUMMARY.md files |
| Proposal count | 3-8 proposals typical | Could be 30+ proposals; need batching UX |
| Dedup complexity | Simple string matching | May need fuzzy matching for similar concepts across phases |

**Mitigation for large projects:** If more than 10 proposals are generated, group them by type and ask "Review domain concepts (N proposals)?" before showing individual entries. This prevents the user from facing 30 sequential accept/skip prompts.

## Sources

- `commands/dc/add.md` -- template fill, ADR numbering, MANIFEST.md update patterns; HIGH confidence
- `commands/dc/init.md` -- template injection, sentinel-based idempotency, Step 7 pattern; HIGH confidence
- `templates/agents-snippet.md` -- sentinel comment format, static snippet pattern; HIGH confidence
- `.context/domain/integration-model.md` -- three-concern model, episodic-to-semantic extraction rule; HIGH confidence
- `.planning/milestones/v1.0-phases/01-templates/01-CONTEXT.md` -- representative .planning/ CONTEXT.md format; HIGH confidence
- `.planning/milestones/v1.0-phases/01-templates/01-01-SUMMARY.md` -- representative SUMMARY.md format; HIGH confidence
- `.planning/RETROSPECTIVE.md` -- cross-milestone patterns, template-first build order lesson; HIGH confidence
- `.planning/PROJECT.md` -- v1.2 scope, constraints, existing architecture; HIGH confidence

---
*Architecture research for: v1.2 GSD Integration (dc:extract + AGENTS.md.snippet)*
*Researched: 2026-03-16*
