# Project Research Summary

**Project:** domain-context-cc v1.2 — GSD Integration (dc:extract + AGENTS.md GSD bridge)
**Domain:** Claude Code skill extension — episodic-to-semantic knowledge extraction
**Researched:** 2026-03-16
**Confidence:** HIGH

## Executive Summary

This milestone adds two tightly scoped deliverables to an existing, well-tested codebase: a `dc:extract` skill that converts completed GSD planning artifacts into permanent `.context/` domain entries, and a `gsd-agents-snippet.md` template that wires GSD awareness into any project's `AGENTS.md` at init time. There is no new technology, no new dependencies, and no new architectural patterns — everything reuses conventions established in v1.0 and v1.1. The core engineering challenge is not building new infrastructure; it is writing clear enough skill instructions that the LLM correctly classifies "durable domain knowledge" vs. "ephemeral build noise" when reading `.planning/` artifacts.

The recommended approach is to build in dependency order: template first, dc:init modification second, dc:extract last. This order is supported by the v1.0 retrospective lesson ("template-first prevents circular dependencies") and ensures the full GSD integration story (init with GSD awareness → plan phases → extract knowledge) can be tested end-to-end before the milestone closes. dc:extract must explicitly reuse dc:add's established patterns for template resolution, file creation, MANIFEST.md registration, and ADR numbering — reimplementing any of these is the primary risk for spec noncompliance.

The key risks are: (1) over-eager extraction proposing low-value entries from the wrong artifact types, mitigated by a strict source hierarchy (CONTEXT.md `<decisions>` and `<domain>` sections first, SUMMARY.md `key-decisions` frontmatter second, everything else ignored); (2) duplicate proposals against existing `.context/` entries, mitigated by semantic cross-referencing before presenting any proposal; and (3) dc:init idempotency breakage when the AGENTS.md snippet gains new GSD content, mitigated by adding a version marker inside the sentinel block and replacing stale blocks on re-run.

---

## Key Findings

### Recommended Stack

See full details: `.planning/research/STACK.md`

This milestone adds zero new technologies. The existing stack — Claude Code skill format (YAML frontmatter + `<objective>/<execution_context>/<process>` sections), `{placeholder}` markdown templates, Node.js built-ins, and zero npm dependencies — fully supports both deliverables. `dc:extract` is a skill (markdown instructions), not a hook (Node.js script). The LLM is the runtime: it uses `Read`, `Glob`, `Grep`, `Write`, `Edit`, and `AskUserQuestion` tools — the same set as dc:add plus `Grep` for content searching across `.planning/` artifacts. `gsd-agents-snippet.md` is static markdown with `<!-- gsd-bridge:start/end -->` sentinels and no placeholders.

**Core technologies:**
- Claude Code skill format (current 2026): `dc:extract` skill definition — same YAML frontmatter and process section pattern as all 5 existing skills
- Markdown templates with sentinel comments: `gsd-agents-snippet.md` — same `{placeholder}` + sentinel pattern established in v1.0; new `<!-- gsd-bridge:start/end -->` sentinel pair independent of existing domain-context sentinels
- Node.js >= 20 LTS: no new JS code in this milestone; constraint preserved for future hooks

### Expected Features

See full details: `.planning/research/FEATURES.md`

**Must have (table stakes):**
- Scan `.planning/` for extractable artifacts (CONTEXT.md, SUMMARY.md, RETROSPECTIVE.md) — core input step; without it no extraction is possible
- Identify and classify durable domain concepts, ADR candidates, and constraints — the primary value proposition; must distinguish business rules from build notes
- Cross-reference proposals against existing `.context/` to avoid duplicates — without this the user faces redundant proposals and loses trust
- Preview each proposal individually before writing — spec Section 8.4 and integration-model Business Rule 3 mandate explicit user approval; no auto-creation
- Create `.context/` files using existing templates and update MANIFEST.md — same output path as dc:add; must produce spec-compliant output
- Handle missing `.planning/` gracefully with helpful guidance — consistent with guard patterns across all dc:* skills
- GSD bridge text in `agents-snippet.md` injected by dc:init — wires "Why feeds The What" for all new projects

**Should have (differentiators):**
- Intelligent knowledge classification: distinguish business rules and domain invariants from implementation details and build notes — the hard classification problem that makes extraction useful rather than noisy
- Constraint extraction from planning artifacts — less common but high-value when found
- Batch proposal UX: group by type (domain concepts, decisions, constraints), show counts first, allow per-entry review
- Source attribution: cite which `.planning/` artifact each proposal came from for traceability
- Semantic deduplication: flag conceptual overlap with existing entries even when names differ

**Defer (v2+):**
- Phase-scoped extraction (`/dc:extract phases 7-9`) — "scan all completed phases" is sufficient for v1.2
- CONTEXT.md update suggestions for module-scoped findings — adds a second output path beyond `.context/` entries; reserve for v1.3

### Architecture Approach

See full details: `.planning/research/ARCHITECTURE.md`

v1.2 adds two components to the existing layered architecture without modifying any v1.0 or v1.1 artifacts (skills, hooks, agents, rules) except for a single sub-step added to dc:init Step 7. The new `gsd-agents-snippet.md` template uses independent sentinels (`<!-- gsd-bridge:start/end -->`) distinct from the existing domain-context sentinels, enabling independent lifecycle management. `dc:extract` follows the Scan-Propose-Confirm pattern: discover `.planning/` artifacts, read existing `.context/` for dedup context, cross-reference to identify gaps, present grouped proposals, and create files using dc:add's template fill and MANIFEST.md registration logic for spec compliance.

**Major components:**
1. `templates/gsd-agents-snippet.md` — static GSD bridge template; injected by dc:init when GSD is detected (`.planning/PROJECT.md` exists or user confirms); uses `<!-- gsd-bridge:start/end -->` sentinels for idempotency; no placeholders
2. `commands/dc/init.md` (modified Step 7b) — gains conditional GSD snippet injection sub-step; only change to an existing file in this milestone
3. `commands/dc/extract.md` — new skill; reads `.planning/` artifacts (CONTEXT.md and SUMMARY.md frontmatter only), cross-references `.context/`, proposes domain concepts/ADRs/constraints grouped by type, creates files and updates MANIFEST.md reusing dc:add patterns

### Critical Pitfalls

See full details: `.planning/research/PITFALLS.md`

1. **Treating all phase artifacts as equal knowledge sources** — Only `CONTEXT.md` (`<domain>`, `<decisions>`, `<specifics>` sections) and `SUMMARY.md` (`key-decisions`, `patterns-established` frontmatter) are primary sources. `PLAN.md`, `RESEARCH.md`, `VALIDATION.md`, `VERIFICATION.md` must be ignored or they flood the user with low-value proposals and erode trust in the skill.

2. **Reimplementing template fill instead of reusing dc:add patterns** — dc:extract must explicitly follow dc:add Steps 2, 5, 6, 8, and 11 for template resolution, content-to-section mapping, ADR numbering, duplicate detection, and MANIFEST.md registration. Any divergence produces spec-noncompliant files that fail dc:validate.

3. **Breaking dc:init idempotency with the AGENTS.md snippet update** — The existing sentinel (`<!-- domain-context:start/end -->`) causes dc:init to silently skip already-initialized projects, so new GSD bridge content never reaches them. Add a version marker (`<!-- dc-snippet-v2 -->`) inside the sentinel block; dc:init Step 7 must check version and replace the block when outdated.

4. **Semantic duplicate proposals** — Name-only dedup against MANIFEST.md is insufficient. dc:extract must read existing `.context/` file content to flag conceptual overlap, offering "update existing" (via dc:refresh) as an option alongside "create new" and "skip."

5. **Milestone directory structure confusion** — This project uses both `.planning/phases/` (current milestone) and `.planning/milestones/{name}-phases/` (archived). dc:extract must support both patterns and ask the user which milestone to extract from when multiple are present, rather than silently merging potentially contradictory decisions.

---

## Implications for Roadmap

Architecture research establishes a clear dependency-driven build order. Three phases, each delivering a testable increment.

### Phase 1: GSD Agents Snippet Template

**Rationale:** No dependencies; static content; establishes the `gsd-bridge` sentinel pattern that Phase 2 depends on. Template-first is the validated lesson from v1.0 retrospective. Smallest scope in the milestone — delivers real value immediately for any new project running dc:init after v1.2 ships.
**Delivers:** `templates/gsd-agents-snippet.md` with `<!-- gsd-bridge:start/end -->` sentinels and GSD bridge prose referencing `.planning/PROJECT.md`, `.planning/STATE.md`, and `/dc:extract`
**Addresses:** AGENTS.md snippet update (all table-stakes features); "Why feeds The What" integration from spec Section 10.1
**Avoids:** P19 (idempotency breakage) — version marker goes in from the start; P3 (combined snippet anti-pattern) — separate template file with independent sentinels preserves independent injection lifecycle

### Phase 2: dc:init GSD Detection and Injection

**Rationale:** Small scope (one sub-step added to Step 7 of an existing skill); validates the template in practice; establishes the GSD detection heuristic (`.planning/PROJECT.md` existence check + user prompt) that informs dc:extract's behavior. Completing this phase before dc:extract means the full workflow (init with GSD awareness → plan → extract) is testable end-to-end.
**Delivers:** dc:init gains Step 7b — conditional injection of `gsd-agents-snippet.md` when GSD is detected; existing projects can re-run dc:init to receive the GSD bridge content
**Uses:** `gsd-agents-snippet.md` template (Phase 1 output); existing dc:init sentinel detection and file injection logic
**Implements:** Conditional Template Injection pattern (defined in ARCHITECTURE.md)
**Avoids:** P19 (idempotency) — version marker check and block replacement logic; P3 (single snippet anti-pattern) — conditional injection preserves "DC always, GSD when present" semantics

### Phase 3: dc:extract Skill

**Rationale:** Most complex component; benefits from the GSD integration story being complete (Phases 1-2) so end-to-end workflow is testable. dc:extract does not technically depend on Phases 1-2 but testing and validation are stronger with all three components in place.
**Delivers:** `commands/dc/extract.md` — full Scan-Propose-Confirm skill; reads `.planning/` artifacts with strict hierarchy, cross-references `.context/` semantically, proposes grouped extractions, creates spec-compliant files via dc:add patterns
**Uses:** All existing domain content templates (domain-concept.md, decision.md, constraint.md); dc:add patterns for template fill, ADR numbering, and MANIFEST.md registration
**Implements:** Knowledge Extraction (Scan-Propose-Confirm) architectural pattern
**Avoids:** P16 (strict artifact hierarchy); P17 (semantic dedup — read file content, not just names); P18 (reuse dc:add patterns — no reimplementation); P21 (grouped proposals — type-first presentation); P24 (support both `.planning/phases/` and `.planning/milestones/` directory patterns)

### Phase Ordering Rationale

- Template before injection: dc:init Step 7b cannot reference a template that does not exist
- Injection before extraction: end-to-end workflow (init → plan → extract) requires all three components for complete testing; Phase 3 in isolation cannot validate the full GSD integration story
- Both Phases 1-2 are small (1 file each); Phase 3 is the primary deliverable; completing 1-2 first removes all blockers before the complex work begins
- This order directly mirrors the v1.0 build order (templates → init → skills) validated as correct in the retrospective

### Research Flags

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1 (GSD snippet template):** Static content with established sentinel pattern; format is identical to existing `agents-snippet.md`; no research needed
- **Phase 2 (dc:init modification):** Single sub-step addition to an existing, well-understood skill; the injection pattern is copy-and-adapt from Step 7; no research needed

Phase that may benefit from a planning pass:
- **Phase 3 (dc:extract):** The knowledge classification instructions are the hard problem. The right prompting approach for "durable domain knowledge vs. build noise" should be worked through with concrete examples during planning — not additional research, but a deliberate drafting exercise for the `<process>` section. Budget 30-60 minutes of examples-based prompt design before writing the skill.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies in-use in this repo; no new dependencies; verified from working code in 5 existing skills and 2 milestones of artifacts |
| Features | HIGH | Grounded in Domain Context spec Sections 8.4 and 10.1; integration-model.md Business Rule 3; full dc:add pattern analysis |
| Architecture | HIGH | Components, data flow, and boundaries derived from direct analysis of dc:add, dc:init, and dc:validate; build order validated against v1.0 retrospective |
| Pitfalls | HIGH | Each pitfall traced to a specific existing mechanism that would fail; not speculative; dc:add steps cited by number for P18 |

**Overall confidence:** HIGH

### Gaps to Address

- **Knowledge classification prompting:** The `<process>` section of dc:extract must produce reliable "durable domain knowledge vs. build noise" classification. The right balance of positive examples, negative examples, and explicit rules is not pre-determined and will require deliberate design during Phase 3 planning — likely against real `.planning/` artifacts from this repo.

- **Batch proposal UX flow:** FEATURES.md and ARCHITECTURE.md both recommend type-grouped proposals with count-first presentation, but the exact `AskUserQuestion` sequence for batch review is not specified in any existing skill. This interaction flow should be explicitly designed during Phase 3 planning before writing the process section.

- **Version marker backward compatibility for AGENTS.md snippet:** PITFALLS.md (P19) specifies adding `<!-- dc-snippet-v2 -->` inside the sentinel block and replacing the block when the version is outdated. The exact dc:init logic for detecting, extracting, and replacing the sentinel block content needs careful specification in Phase 2 planning to avoid edge cases (e.g., manually edited content between sentinels).

---

## Sources

### Primary (HIGH confidence)
- `commands/dc/add.md` — template fill pattern, MANIFEST.md insertion, ADR numbering (Steps 2, 5, 6, 8, 11); read from working code
- `commands/dc/init.md` — AGENTS.md sentinel detection (Step 7), idempotency contract, template injection pattern; read from working code
- `commands/dc/validate.md` — MANIFEST.md cross-reference and entry parsing patterns; read from working code
- `templates/agents-snippet.md` — sentinel comment format (`<!-- domain-context:start/end -->`); read from working code
- `.context/domain/integration-model.md` — three-concern model, Business Rule 3 on explicit extraction; project's own domain documentation
- `.planning/PROJECT.md` — v1.2 milestone scope, constraints, out-of-scope items
- Domain Context Specification Sections 3.1, 8.4, 10.1 — authoritative spec for extraction rules and GSD integration model
- GSD `.planning/` artifact structure in this repo — real CONTEXT.md, SUMMARY.md, and RETROSPECTIVE.md files showing extractable content patterns

### Secondary (MEDIUM confidence)
- `.planning/RETROSPECTIVE.md` — template-first build order lesson, cross-milestone patterns; high confidence within this project; may not generalize to other projects

---
*Research completed: 2026-03-16*
*Ready for roadmap: yes*
