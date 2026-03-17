# Domain Pitfalls

**Domain:** Episodic-to-semantic knowledge extraction and GSD bridge integration for domain-context-cc
**Researched:** 2026-03-16
**Confidence:** HIGH (based on direct analysis of existing codebase patterns, GSD artifact structures in this project, and established skill conventions)

> **Note:** This file covers pitfalls specific to the v1.2 milestone: dc:extract skill and AGENTS.md.snippet GSD bridge.
> The v1.0 pitfalls (1-7) and v1.1 pitfalls (8-15) still apply but are not repeated here.

---

## Critical Pitfalls

### Pitfall 16: Treating All Phase Artifacts as Equal Knowledge Sources

**What goes wrong:** dc:extract naively reads every file in a phase directory (PLAN, SUMMARY, CONTEXT, RESEARCH, VALIDATION, VERIFICATION, UAT) and tries to extract domain knowledge from all of them. Plans contain speculative instructions. Summaries contain execution logs. Research contains third-party findings. Only CONTEXT.md and selected SUMMARY.md metadata contain durable domain knowledge worth promoting to .context/.

**Why it happens:** The temptation is to "be thorough" and scan everything. But GSD artifacts have different epistemological status -- a PLAN is prescriptive intent, a SUMMARY is historical record, CONTEXT.md is distilled domain insight.

**Consequences:** Extractions propose dozens of low-value entries (implementation details, timing data, task lists). The user rejects most proposals, loses trust in the skill, stops using it.

**Prevention:** Define a strict artifact hierarchy for extraction:
1. **Primary sources:** Phase CONTEXT.md files -- specifically the `<domain>`, `<decisions>`, and `<specifics>` sections
2. **Secondary sources:** SUMMARY.md `key-decisions` and `patterns-established` frontmatter fields
3. **Ignore:** PLAN.md, RESEARCH.md, VALIDATION.md, VERIFICATION.md, UAT.md

**Detection:** If dc:extract proposes more than 3-5 entries from a single milestone, the filter is probably too loose.

---

### Pitfall 17: Duplicating Knowledge Already in .context/

**What goes wrong:** dc:extract proposes creating a domain concept that already exists in .context/domain/ or an ADR that covers the same decision. The user sees "Add domain concept: Template Resolution" when .context/domain/integration-model.md already documents template resolution as part of the integration model.

**Why it happens:** Cross-referencing is done by exact name match or file path only. The extraction doesn't understand semantic overlap. Phase CONTEXT.md might call something "template path resolution" while .context/ calls it "integration model."

**Consequences:** Duplicate entries clutter .context/. If user accepts without checking, MANIFEST.md gets conflicting entries. dc:validate later flags inconsistencies.

**Prevention:**
1. Parse existing .context/ files fully -- read content, not just names from MANIFEST.md
2. Present each proposal alongside the most semantically similar existing entry: "Similar to: Integration Model in .context/domain/integration-model.md"
3. Offer "update existing" as an option alongside "create new" and "skip"
4. Default to "update existing" when similarity is high

**Detection:** dc:validate's orphan check will catch structural damage, but by then the user has already done unnecessary work.

---

### Pitfall 18: Generating Spec-Noncompliant Files by Reimplementing Template Fill

**What goes wrong:** dc:extract creates domain concept or ADR files that don't match the Domain Context spec format. Missing required sections, wrong heading structure, no verified date, incorrect MANIFEST.md entry format.

**Why it happens:** dc:extract builds its own file generation logic instead of reusing the template-fill pattern established by dc:add. Two code paths for the same output means two places to maintain spec compliance.

**Consequences:** dc:validate fails on files created by dc:extract. The files don't render correctly in dc:explore. User has to manually fix every extracted file.

**Prevention:** dc:extract MUST reuse dc:add's established patterns:
- Same template resolution (Step 2 of dc:add)
- Same content-to-section mapping (Step 5 of dc:add)
- Same MANIFEST.md entry insertion (Step 11 of dc:add)
- Same ADR auto-numbering (Step 6 of dc:add)
- Same duplicate detection (Step 8 of dc:add)

The skill instructions should explicitly reference dc:add's step patterns rather than reimplementing them.

**Detection:** Run dc:validate immediately after every dc:extract run. If any newly created files show issues, the generation path has diverged.

---

### Pitfall 19: AGENTS.md.snippet Update Breaking dc:init Idempotency

**What goes wrong:** The agents-snippet.md template is modified to include GSD bridge content, but dc:init's sentinel detection breaks. Projects that already ran dc:init either get the snippet re-injected (double content) or never get the GSD bridge content (silent skip).

**Why it happens:** The existing agents-snippet.md uses `<!-- domain-context:start -->` / `<!-- domain-context:end -->` sentinels. dc:init Step 7 checks: "If AGENTS.md exists and contains `<!-- domain-context:start -->`: Record status AGENTS.md: skipped." This means existing projects that already have the sentinel will NEVER receive updated snippet content, including new GSD bridge text.

**Consequences:** Two classes of projects diverge: new projects (with GSD bridge) and existing projects (without). The user expects dc:init to be idempotent but also to deliver new capabilities -- these goals conflict silently.

**Prevention:**
1. Add a version marker inside the sentinel block: `<!-- dc-snippet-v2 -->` (the current template is implicitly v1)
2. dc:init Step 7 should check sentinel presence AND version, not just sentinel presence
3. If sentinel present but version outdated: replace the entire block between sentinels with new content, record status "AGENTS.md: updated"
4. If sentinel present and version current: skip as before
5. The GSD bridge content goes INSIDE the existing sentinel block, not as a separate template file

**Detection:** Run dc:init on a project initialized with v1.0/v1.1 templates. Second run should detect outdated snippet and offer update. Run dc:init twice on a fresh project -- second run should report "skipped."

---

## Moderate Pitfalls

### Pitfall 20: Rigid GSD Artifact Format Expectations

**What goes wrong:** dc:extract assumes all GSD phase artifacts follow the exact format seen in this project's .planning/ directory. Real-world GSD projects may have different phase naming, different CONTEXT.md section names, missing XML-like tags, or older GSD versions with different artifact structures.

**Prevention:** Parse defensively. Look for the section tags (`<domain>`, `<decisions>`, `<specifics>`, `<deferred>`) but handle their absence gracefully. If a CONTEXT.md doesn't have the expected sections, fall back to treating the whole file as unstructured text and present it to the user for manual categorization. Never produce empty output because a section tag is missing.

---

### Pitfall 21: Proposing Too Many Entries at Once

**What goes wrong:** A milestone with 9+ phases produces dozens of potential extractions. dc:extract dumps them all in a single list. The user is overwhelmed and either accepts all (creating noise) or rejects all (wasting the extraction).

**Prevention:** Group proposals by type (domain concepts, decisions, constraints). Show counts first: "Found 4 potential domain concepts, 3 decisions, 1 constraint." Let the user process one type at a time. For each proposal, show a one-line summary and the source phase -- not the full content until the user selects "preview."

---

### Pitfall 22: Not Handling "No .planning/ Directory" Case

**What goes wrong:** User runs dc:extract on a project that doesn't use GSD. The skill either crashes, shows a confusing error, or silently does nothing.

**Prevention:** Check for .planning/ existence as Step 1. If absent: "No .planning/ directory found. dc:extract works with GSD planning artifacts. Use /dc:add to create entries manually." This matches the guard pattern used by every other dc:* skill (check .context/ first, bail with helpful message if missing).

---

### Pitfall 23: Cross-Reference Ignoring .context.local/

**What goes wrong:** dc:extract cross-references proposals against .context/MANIFEST.md but forgets to also check .context.local/MANIFEST.md. A domain concept that exists as a private entry gets proposed again as a public entry.

**Prevention:** Cross-reference against both .context/ and .context.local/ manifests. dc:add already handles the public/private distinction -- dc:extract must follow the same dual-manifest awareness. When a match is found in .context.local/, note it: "Similar private entry exists: [name]."

---

### Pitfall 24: Milestone vs Phase Directory Structure Confusion

**What goes wrong:** dc:extract looks for phases in .planning/phases/ but this project uses .planning/milestones/v1.0-phases/ for older milestones and .planning/phases/ for newer ones. The extraction misses completed phases or conflates knowledge from different milestones.

**Prevention:** Support both directory patterns:
- `.planning/phases/` (single-milestone or current milestone)
- `.planning/milestones/{name}-phases/` (multi-milestone projects)

Accept a milestone parameter or auto-detect. If multiple milestones are found, ask the user which to extract from. Never silently merge knowledge from different milestones -- each milestone may have contradictory decisions where only the latest applies.

---

### Pitfall 25: Losing Source Attribution

**What goes wrong:** dc:extract creates .context/ files but doesn't record where the knowledge came from. Six months later, someone questions an ADR and has no way to trace it back to the GSD phase that produced the decision.

**Prevention:** Add a source comment in extracted files: `<!-- Extracted from .planning/milestones/v1.0-phases/07-add/07-CONTEXT.md on 2026-03-16 -->`. This is a comment (not a spec-required field) so it won't break spec compliance or dc:validate. It provides traceability without cluttering visible content.

---

## Minor Pitfalls

### Pitfall 26: Template Token Collision with GSD Artifact Content

**What goes wrong:** GSD artifacts contain literal `{placeholder}` text (this project documents its own template system with actual `{placeholder}` examples). When dc:extract reads these artifacts and passes content through template filling, the literal tokens get replaced or cause errors.

**Prevention:** dc:extract should extract content as-is and only apply template tokens to the template structure (headings, metadata). Content from GSD artifacts goes into template section bodies verbatim -- never run token replacement on user content.

---

### Pitfall 27: MANIFEST.md Position Drift During Batch Insert

**What goes wrong:** dc:extract adds multiple entries to MANIFEST.md in a single run but inserts them at the wrong position. Each insertion shifts line numbers, so the second insertion uses stale position data.

**Prevention:** Insert entries one type at a time. After inserting all entries for one section (e.g., Domain Concepts), re-read MANIFEST.md before inserting entries for the next section (e.g., Architecture Decisions). Use the same insertion logic as dc:add: append to section, before next `##` header.

---

### Pitfall 28: The "Extract Everything" Anti-Pattern

**What goes wrong:** The user expects dc:extract to automatically extract all knowledge from all phases. The skill tries to be fully automatic, produces mediocre results, and the user doesn't review them carefully.

**Prevention:** The integration model's Business Rule 3 already states: "Knowledge extraction from .planning/ to .context/ MUST be an explicit user-initiated step (not automatic)." Extend this to mean each individual extraction proposal requires user approval. Design dc:extract as a proposal-and-review workflow, not a batch processor. Never auto-accept.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Artifact parsing logic | P16: Wrong artifact hierarchy, P20: Rigid format expectations | Parse only CONTEXT.md and SUMMARY.md frontmatter; handle missing XML tags gracefully |
| Cross-reference engine | P17: Semantic duplicates, P23: Missing .context.local/ | Read .context/ file content (not just names); check both manifests |
| Proposal generation UX | P21: Overwhelming lists, P28: Extract-everything anti-pattern | Group by type, require per-proposal approval, show source phase |
| Template fill for extracted files | P18: Spec noncompliance, P26: Token collision | Reuse dc:add's template logic; never run token replacement on user content |
| AGENTS.md.snippet update | P19: Idempotency breakage | Add version marker; modify existing template; test on pre-existing projects |
| Directory discovery | P22: No .planning/, P24: Milestone structure confusion | Guard check as Step 1; support both directory patterns; ask which milestone |
| Attribution and traceability | P25: Lost source chain | Add source comment to extracted files |
| MANIFEST.md updates | P27: Position drift in batch insert | Re-read MANIFEST.md between section insertions |

---

## "Looks Done But Isn't" Checklist

- [ ] **dc:extract artifact filter:** Verify only CONTEXT.md and SUMMARY.md frontmatter are parsed -- not PLAN.md, RESEARCH.md, VALIDATION.md, VERIFICATION.md
- [ ] **dc:extract duplicate detection:** Create a .context/domain/ file, then run extract on a phase that covers the same topic -- verify "similar to" is shown, not a blind "create new" proposal
- [ ] **dc:extract template reuse:** Verify extracted files pass dc:validate with zero issues (same format as dc:add output)
- [ ] **dc:extract on project without .planning/:** Verify helpful error message, not crash or silent nothing
- [ ] **dc:extract milestone detection:** Test against .planning/phases/ AND .planning/milestones/*-phases/ -- both must work
- [ ] **dc:extract batch insert:** Extract 3+ entries of the same type -- verify MANIFEST.md entries appear in correct positions without overwriting each other
- [ ] **AGENTS.md.snippet versioning:** Run dc:init on a project with v1.0/v1.1 snippet -- verify GSD bridge content is added without duplicating existing content
- [ ] **AGENTS.md.snippet idempotency:** Run dc:init twice on fresh project -- verify second run shows "skipped" for AGENTS.md
- [ ] **Token collision:** Run dc:extract on this project's own .planning/ (which contains literal `{placeholder}` text) -- verify tokens in content are preserved verbatim

---

## Sources

- Direct analysis of commands/dc/add.md: template fill pattern, MANIFEST.md insertion, ADR numbering (steps 2, 5, 6, 8, 11)
- Direct analysis of commands/dc/validate.md: cross-reference and entry parsing patterns
- Direct analysis of commands/dc/init.md: AGENTS.md sentinel detection (Step 7), idempotency contract
- Direct analysis of templates/agents-snippet.md: sentinel comment pattern (`<!-- domain-context:start/end -->`)
- GSD artifact structure analysis: .planning/milestones/v1.0-phases/ and .planning/phases/ directory layouts
- Phase CONTEXT.md structure analysis: XML-like section tags (`<domain>`, `<decisions>`, `<specifics>`, `<deferred>`, `<code_context>`)
- SUMMARY.md frontmatter analysis: `key-decisions`, `patterns-established` fields
- Integration model (.context/domain/integration-model.md): Business Rule 3 on explicit extraction
- PROJECT.md: v1.2 milestone scope and constraints

---
*Pitfalls research for: dc:extract and AGENTS.md.snippet GSD bridge (v1.2 milestone)*
*Researched: 2026-03-16*
