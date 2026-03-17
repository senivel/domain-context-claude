# Feature Landscape

**Domain:** Episodic-to-semantic knowledge extraction and GSD bridge integration
**Researched:** 2026-03-16
**Confidence:** HIGH (grounded in Domain Context spec Section 8.4 and 10.1, existing dc:add patterns, and GSD artifact structure)

---

## Scope

This file covers the v1.2 milestone features only:
- `dc:extract` skill -- extracts domain knowledge from completed GSD .planning/ artifacts into .context/
- `AGENTS.md.snippet` template update -- adds GSD bridge text so dc:init wires GSD awareness

Features from v1.0 (dc:init, dc:explore, dc:validate, dc:add, dc:refresh) and v1.1 (hooks, rule, agent) are prerequisites, not scope.

---

## Table Stakes

Features users expect. Missing = product feels incomplete.

### dc:extract Skill

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Scan .planning/ for completed phase artifacts | Can't extract knowledge from artifacts you don't read. This is the input step. | LOW | Glob for `*-CONTEXT.md`, `*-SUMMARY.md`, `*-RESEARCH.md`, and `RETROSPECTIVE.md` |
| Identify extractable domain concepts | The core value proposition: surface business rules and domain knowledge buried in planning artifacts. | HIGH | Must distinguish durable domain knowledge ("subscriptions follow Trial > Active > Canceled") from ephemeral build notes ("used Glob to find templates"). Requires semantic understanding, not just pattern matching. |
| Identify extractable architecture decisions | Planning artifacts contain implementation decisions (in CONTEXT.md `<decisions>` sections and SUMMARY.md `key-decisions` frontmatter) that may warrant formal ADRs. | MED | Already-accepted decisions are documented inline; extraction promotes them to .context/decisions/ |
| Cross-reference against existing .context/ | Avoid proposing entries that already exist. Must read MANIFEST.md and compare. | LOW | Same MANIFEST.md parsing as dc:validate and dc:explore |
| Preview proposed extractions before writing | User must approve what gets created. Extraction MUST be an explicit user-initiated step per spec Section 8.4 and integration-model.md business rule #3. | LOW | Same preview/confirm pattern as dc:add |
| Create domain files using existing templates | Extracted knowledge must produce spec-compliant .context/ files using the same templates as dc:add. | LOW | Reuse dc:add's template resolution + filling pattern exactly |
| Update MANIFEST.md for each created entry | Same manifest registration as dc:add. | LOW | Identical logic: find section, append entry line, handle `(none yet)` placeholder |
| Handle missing .context/ gracefully | Project not initialized = clear error with guidance. | LOW | Same pattern as all other dc: skills: "Run /dc:init first" |
| Handle missing .planning/ gracefully | No planning artifacts = nothing to extract. | LOW | "No .planning/ directory found. This skill extracts domain knowledge from GSD planning artifacts." |
| Summary of what was extracted | User needs to see what happened. | LOW | Same summary pattern as dc:init and dc:add |

### AGENTS.md Snippet Template Update

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| GSD bridge text in agents-snippet.md | When dc:init runs, the AGENTS.md snippet should tell GSD agents to consult .context/ during planning. This is the "Why feeds The What" integration from spec Section 10.1. | LOW | Add 2-3 lines to existing `agents-snippet.md` template between sentinels |
| Sentinel-safe update | Existing projects that already ran dc:init should not break. The snippet uses `<!-- domain-context:start/end -->` sentinels. | LOW | New snippet replaces content between sentinels on re-init; existing projects can re-run dc:init to get the update |
| GSD-specific instructions in bridge text | The snippet should reference `.planning/` and suggest running `/dc:extract` after phases complete. | LOW | 2-3 actionable lines, not prose |

---

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Intelligent knowledge classification** | Not all planning content is domain knowledge. dc:extract should distinguish between durable domain truths (business rules, invariants, lifecycle models) and ephemeral build details (which tools were used, execution times, file paths). This is the episodic-to-semantic consolidation the spec describes. | HIGH | This is the hard problem. Claude does the classification using the semantic understanding in its prompt -- no rule engine, no regex. The skill instructions must clearly define what constitutes "durable domain knowledge" vs "build noise." |
| **Constraint extraction** | Planning artifacts sometimes surface external constraints (regulatory requirements, API rate limits, security policies) that should become formal .context/constraints/ entries. | MED | Less common than domain concepts or ADRs, but high-value when found. Scan CONTEXT.md `<decisions>` sections for constraint language. |
| **Batch proposal with selective acceptance** | Show all proposed extractions in a single table, let user accept/reject individual items rather than all-or-nothing. Per-group fix offers established as a pattern in v1.0 (dc:validate UX). | MED | More complex interaction flow but established pattern. Use AskUserQuestion with "Accept all (recommended)" plus individual toggles. |
| **Source attribution** | Each proposed extraction should cite which .planning/ artifact it came from (e.g., "From Phase 7 CONTEXT.md, decisions section"). Enables the user to verify the extraction is accurate. | LOW | Track source file path during scanning, include in preview |
| **Suggest CONTEXT.md updates** | Some extracted knowledge belongs in per-module CONTEXT.md files rather than .context/domain/ entries. dc:extract should identify when a finding is module-scoped and suggest a CONTEXT.md update instead of a global domain entry. | MED | Requires understanding module boundaries. Can use ARCHITECTURE.md module map as guide if present. |
| **Phase-scoped extraction** | Allow user to specify which phases to extract from (e.g., `/dc:extract phases 7-9`) rather than always scanning all artifacts. Useful when running extraction incrementally after each milestone. | LOW | Optional argument parsing; default is "all completed phases" |
| **Deduplication intelligence** | Not just exact-match dedup against MANIFEST.md, but semantic dedup: if a proposed extraction is conceptually covered by an existing domain entry (even under a different name), flag it as "possibly already documented" rather than silently creating a near-duplicate. | MED | Claude's semantic understanding handles this during the preview step. The skill instructions should explicitly ask Claude to check for conceptual overlap. |

---

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Auto-extract on phase completion** | Spec Section 8.4 and integration-model.md business rule #3: "Knowledge extraction from .planning/ to .context/ MUST be an explicit user-initiated step (not automatic)." Silent extraction violates user agency. | User explicitly runs `/dc:extract` when ready. |
| **Delete or archive .planning/ artifacts after extraction** | .planning/ is GSD's domain. dc:extract reads from it but must not modify it. GSD manages its own artifact lifecycle. | dc:extract is read-only on .planning/; user manages .planning/ separately. |
| **Extract code patterns or implementation details** | Domain context captures WHY, not WHAT or HOW. "We use a 3-second stdin timeout" is an implementation detail, not domain knowledge. Per PROJECT.md out-of-scope: "Auto-generate domain context from code -- domain context captures WHY, not WHAT." | Only extract business rules, domain invariants, architectural rationale, and external constraints. Skip build patterns, tool choices, and code structure notes. |
| **Require GSD to be installed** | dc:extract should work by scanning the .planning/ directory structure. It should not import GSD modules, call GSD commands, or depend on GSD being installed. | Read .planning/ files directly with Read/Glob. The file format is the contract, not a programmatic API. |
| **Modify existing .context/ entries** | dc:extract creates NEW entries. It should never update existing domain files -- that is dc:refresh's job. Mixing creation and update in one skill creates confusion about what changed. | Propose new entries only. If overlap detected, inform user and suggest running dc:refresh on the existing entry instead. |
| **Generate ARCHITECTURE.md updates** | ARCHITECTURE.md is a single root-level file with a specific structure. Appending extracted content to it would produce an incoherent document. | If architectural insights are found, propose them as ADRs in .context/decisions/ which is the proper location for architectural rationale per the spec. |
| **Hook-triggered extraction** | A PostPhaseComplete hook that auto-runs extraction would violate the explicit-initiation business rule and would be expensive (spawning an LLM analysis on every phase completion). | User runs `/dc:extract` when they want to consolidate knowledge. The AGENTS.md bridge text reminds them. |

---

## Feature Dependencies

```
[dc:extract skill]
    reads     --> .planning/*-CONTEXT.md (GSD phase context files)
    reads     --> .planning/*-SUMMARY.md (GSD plan summaries)
    reads     --> .planning/*-RESEARCH.md (GSD phase research)
    reads     --> .planning/RETROSPECTIVE.md (GSD milestone retrospective)
    reads     --> .context/MANIFEST.md (for deduplication)
    reads     --> .context/domain/*.md (for semantic dedup)
    reads     --> .context/decisions/*.md (for ADR dedup)
    creates   --> .context/domain/*.md (new domain concepts)
    creates   --> .context/decisions/*.md (new ADRs)
    creates   --> .context/constraints/*.md (new constraints)
    updates   --> .context/MANIFEST.md (registers new entries)
    reuses    --> dc:add template resolution pattern
    reuses    --> dc:add template filling pattern
    reuses    --> dc:add MANIFEST.md update pattern
    reuses    --> dc:add ADR auto-numbering
    reuses    --> dc:validate MANIFEST.md parsing
    depends on -> .context/ exists (dc:init prerequisite)
    depends on -> .planning/ exists (GSD prerequisite)
    depends on -> templates/ installed (same as all dc: skills)

[AGENTS.md snippet update]
    modifies  --> templates/agents-snippet.md
    consumed by -> dc:init Step 7 (AGENTS.md injection)
    idempotent via -> <!-- domain-context:start/end --> sentinels
    no runtime dependencies
```

### Dependency Notes

- **dc:extract heavily reuses dc:add patterns.** Template resolution, template filling, MANIFEST.md registration, ADR auto-numbering, preview/confirm flow, and file creation are all identical. The new logic is exclusively in the scanning and classification steps.
- **The AGENTS.md snippet change is a template modification, not a skill change.** dc:init already reads agents-snippet.md and injects it. Updating the template content is sufficient; dc:init's code does not change.
- **.planning/ is the input, .context/ is the output.** dc:extract bridges The What to The Why. It never writes to .planning/ and never deletes from .context/.

---

## MVP Recommendation

### Prioritize

1. **AGENTS.md snippet update** -- lowest complexity, enables the bridge text in all new projects immediately. Template change only.
2. **dc:extract core scanning** -- read .planning/ artifacts, identify extractable knowledge, cross-reference against existing .context/.
3. **dc:extract preview and selective acceptance** -- show proposals, let user accept/reject individually.
4. **dc:extract file creation** -- create .context/ entries using dc:add's template patterns, update MANIFEST.md.

### Defer

- **Phase-scoped extraction** (`/dc:extract phases 7-9`): Nice-to-have but adds argument parsing complexity. Default "scan all" is sufficient for v1.2.
- **CONTEXT.md update suggestions**: Module-scoped extraction is valuable but adds a second output path beyond .context/ entries. Can be a v1.3 feature.
- **Semantic deduplication**: Basic name/path dedup is table stakes. Deep semantic overlap detection can rely on Claude's judgment in the preview step without explicit skill instructions.

---

## GSD Artifact Types and Extraction Value

Understanding what each .planning/ artifact type contains and what is extractable:

| Artifact | Location Pattern | Contains | Extraction Value |
|----------|-----------------|----------|-----------------|
| Phase CONTEXT.md | `.planning/**/NN-CONTEXT.md` | `<domain>` (boundary), `<decisions>` (implementation choices), `<specifics>` (ideas), `<code_context>` (existing patterns), `<deferred>` (out-of-scope ideas) | **HIGH** -- `<decisions>` sections contain rationale for architecture choices that may warrant ADRs. `<domain>` sections describe business boundaries. |
| Plan SUMMARY.md | `.planning/**/NN-MM-SUMMARY.md` | YAML frontmatter with `key-decisions`, `patterns-established`, `tech-stack`; body has accomplishments, deviations, decisions made | **MEDIUM** -- `key-decisions` frontmatter and "Decisions Made" body sections contain extractable ADR candidates. `patterns-established` may surface domain patterns. |
| Phase RESEARCH.md | `.planning/**/NN-RESEARCH.md` | Architecture patterns, pitfalls, standard stack, open questions | **LOW** -- Mostly implementation-focused. Occasionally surfaces domain constraints or architectural patterns worth preserving. |
| RETROSPECTIVE.md | `.planning/RETROSPECTIVE.md` | Patterns established, key lessons, what worked/failed | **MEDIUM** -- "Patterns Established" and "Key Lessons" sections may contain durable architectural insights. |
| ROADMAP.md | `.planning/**/ROADMAP.md` | Phase structure, requirements, success criteria | **LOW** -- Ephemeral planning; requirements are the WHAT not the WHY. |
| PLAN.md | `.planning/**/NN-MM-PLAN.md` | Task breakdown, implementation steps | **LOW** -- Pure execution artifacts; almost never contain domain knowledge. |
| VALIDATION.md | `.planning/**/NN-VALIDATION.md` | Test requirements, verification steps | **LOW** -- Testing methodology, not domain knowledge. |

### Recommended Scan Priority

1. **Phase CONTEXT.md files** -- richest source of extractable domain knowledge
2. **Plan SUMMARY.md files** -- key-decisions and patterns-established sections
3. **RETROSPECTIVE.md** -- cross-milestone patterns and lessons
4. **Phase RESEARCH.md files** -- scan for constraints and architecture decisions only

Skip: ROADMAP.md, PLAN.md, VALIDATION.md, VERIFICATION.md (ephemeral execution artifacts with no domain knowledge value).

---

## Sources

- Domain Context Specification Section 8.4 (Knowledge Extraction from SDD Artifacts) -- HIGH confidence; authoritative spec
- Domain Context Specification Section 10.1 (SDD Frameworks integration model) -- HIGH confidence; authoritative spec
- Domain Context Specification Section 3.1 (Three Separate Concerns) -- HIGH confidence; authoritative spec
- `.context/domain/integration-model.md` -- HIGH confidence; project's own domain documentation
- `.planning/PROJECT.md` -- HIGH confidence; project requirements and constraints
- Existing dc:add skill (`commands/dc/add.md`) -- HIGH confidence; reusable pattern source
- GSD .planning/ artifact examples in this project -- HIGH confidence; real artifacts showing extractable content patterns
- `.planning/RETROSPECTIVE.md` -- HIGH confidence; real retrospective showing extractable knowledge patterns

---

*Feature research for: Episodic-to-semantic knowledge extraction and GSD bridge integration*
*Researched: 2026-03-16*
*Milestone scope: v1.2 -- adding dc:extract skill and AGENTS.md snippet update to existing dc:* skill project*
