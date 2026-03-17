# Stack Research

**Domain:** GSD integration — dc:extract skill and AGENTS.md.snippet template
**Researched:** 2026-03-16
**Confidence:** HIGH (no new technology; all patterns verified from existing v1.0/v1.1 implementations in this repo)

---

## What Changed in v1.2

This is a focused delta from the v1.1 research (hooks, rules, agent). All prior content remains valid. This document covers what is needed for TWO new artifacts:

1. **dc:extract skill** — reads .planning/ artifacts, cross-references against .context/, proposes new domain files
2. **AGENTS.md.snippet template update** — adds GSD bridge text to the existing agents-snippet.md template

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Claude Code skill format | current (2026) | dc:extract skill definition | Same format as all 5 existing skills. YAML frontmatter + objective/execution_context/process sections. No change needed. |
| Markdown templates | n/a | AGENTS.md.snippet update | Same `{placeholder}` token system and sentinel comment pattern established in v1.0. |

### Node.js Built-in APIs

**None new.** dc:extract is a skill (markdown instructions for Claude), not a hook (Node.js script). The LLM reads .planning/ files using Read/Glob tools at runtime. No programmatic parsing required.

### Supporting Libraries

**None.** Zero new dependencies. The existing zero-dependency constraint holds unchanged.

---

## What dc:extract Needs (and How Existing Stack Provides It)

dc:extract is a **skill** (like dc:add, dc:validate). Skills are markdown files that instruct the LLM what to do. The LLM itself is the "runtime" -- it reads files, identifies patterns, and proposes changes using its allowed tools.

### Input: GSD .planning/ Artifacts

The skill instructs Claude to read these artifact types from `.planning/`:

| Artifact | Path Pattern | What It Contains | What to Extract |
|----------|-------------|------------------|-----------------|
| Phase CONTEXT.md | `.planning/phases/*/NN-CONTEXT.md` or `.planning/milestones/*/NN-CONTEXT.md` | Domain boundaries, implementation decisions, deferred ideas | Domain concepts, architecture decisions, constraints |
| Phase SUMMARY.md | `.planning/phases/*/NN-NN-SUMMARY.md` or `.planning/milestones/*/NN-NN-SUMMARY.md` | Key decisions made, patterns established, issues encountered | Architecture decisions, new patterns |
| RETROSPECTIVE.md | `.planning/RETROSPECTIVE.md` | Cross-cutting learnings from completed milestones | Constraints, anti-patterns |
| Research files | `.planning/research/*.md` | Technology recommendations, architecture patterns, pitfalls | Domain concepts, architecture decisions |
| PROJECT.md | `.planning/PROJECT.md` | Key decisions table with rationale | Architecture decisions |

All of these are plain markdown files. Claude reads them with the `Read` tool and parses them with its native language understanding -- no regex, no AST, no library needed.

### Output: Proposed .context/ Changes

The skill instructs Claude to propose (not auto-apply) these outputs:

| Output Type | Uses Existing Template | Template File |
|-------------|----------------------|---------------|
| New domain concept | Yes | `templates/domain-concept.md` |
| New architecture decision | Yes | `templates/decision.md` |
| New constraint | Yes | `templates/constraint.md` |
| MANIFEST.md updates | Yes (entry format from dc:add pattern) | n/a (entry lines, not full file) |

### Cross-Reference: .context/ Deduplication

The skill reads existing `.context/MANIFEST.md` and compares entry names/descriptions against proposed extractions. This is LLM-native comparison -- no fuzzy matching library needed. Claude can determine "this phase decision about 'AGENTS.md bridge pattern' maps to existing entry [002: AGENTS.md Bridge]" through semantic understanding.

### Tools Required

| Tool | Purpose | Same as Existing Skills? |
|------|---------|--------------------------|
| Read | Read .planning/ artifacts and .context/ files | Yes (all 5 skills use Read) |
| Glob | Find phase directories and artifact files | Yes (dc:validate, dc:explore use Glob) |
| Write | Create new .context/ files from templates | Yes (dc:add, dc:init use Write) |
| Edit | Update MANIFEST.md with new entries | Yes (dc:validate, dc:add use Edit) |
| AskUserQuestion | Confirm/reject each proposed extraction | Yes (dc:validate, dc:add use it) |

No new tools. The exact same `allowed-tools` set as dc:add.

---

## AGENTS.md.snippet Template Update

The existing `templates/agents-snippet.md` contains the "Project Context" and "Confidential Context" sections wrapped in `<!-- domain-context:start -->` / `<!-- domain-context:end -->` sentinels.

### What Needs Adding

A GSD bridge paragraph that tells Claude how to use dc:extract after completing GSD phases. This is **static text** -- no new placeholders, no new template mechanics.

The snippet already has no `{placeholder}` tokens (it is identical for every project). The GSD bridge text follows the same pattern: static instructional text within the sentinel block.

### Template Integration

dc:init already handles injecting the agents-snippet.md content into target project AGENTS.md files. The sentinel comments enable idempotent re-injection. No changes to dc:init's injection logic are needed -- only the template content changes.

---

## What NOT to Add

| Avoid | Why | What to Do Instead |
|-------|-----|-------------------|
| Markdown parsing library (remark, unified, etc.) | Skills use Claude's native text understanding; hooks do not parse .planning/ | Let the LLM read and interpret .planning/ markdown directly |
| Diff/similarity library (diff, string-similarity) | Cross-referencing .context/ against .planning/ is semantic, not lexical | Claude compares concepts semantically; "same domain concept" is a judgment call, not string matching |
| Any npm package | Hard constraint: zero runtime deps | Node.js built-ins only (but this milestone adds no JS code at all) |
| New hook for .planning/ monitoring | dc:extract is user-invoked, not passive | Skill (user runs `/dc:extract`) not hook (auto-fires on events) |
| New agent for extraction | Extraction requires conversation context (which phases? what was built?) | Skill in main conversation, not delegated subagent |
| Template engine (Handlebars, EJS, etc.) | Existing `{placeholder}` + string replacement in skills is sufficient | Same pattern as dc:add's template filling |
| JSON schema for .planning/ artifact validation | .planning/ structure is GSD-internal; dc:extract reads whatever exists | Graceful degradation: if artifacts are missing or malformed, skill reports "no extractable content found" |

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Skill (markdown instructions) | Node.js extraction script | Skills leverage LLM's semantic understanding; a script would need complex NLP for cross-referencing |
| User-confirmed extraction (AskUserQuestion per proposal) | Auto-apply all extractions | Domain knowledge must be human-verified; auto-applying could pollute .context/ with noise |
| Single dc:extract skill | Separate skills per artifact type (dc:extract-decisions, dc:extract-concepts) | Over-fragmentation; one skill with scope selection is cleaner UX |
| Update existing agents-snippet.md | New separate gsd-agents-snippet.md template | One snippet file, one injection point; splitting creates maintenance burden |
| Read all completed phases | Only read latest phase | Cross-cutting patterns emerge across phases; limiting to latest misses cumulative knowledge |

---

## Version Compatibility

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | >= 20 LTS | No new JS code in this milestone. Constraint preserved for future hooks. |
| Claude Code | current (2026) | Skill format unchanged. Same YAML frontmatter + process sections. |
| GSD | any | dc:extract reads .planning/ artifacts. GSD structure is convention-based markdown; any version works. |
| Domain Context spec | current | Templates must match spec Section 6. No spec changes needed for extraction. |

---

## Integration Points

### With Existing Skills

| Existing Skill | Integration |
|----------------|-------------|
| dc:add | dc:extract reuses dc:add's template-filling and MANIFEST.md-updating patterns. Could even delegate to dc:add for individual entries, but inline is simpler. |
| dc:validate | User should run dc:validate after dc:extract to verify structural integrity of newly added entries. Skill should suggest this. |
| dc:init | dc:init injects agents-snippet.md into AGENTS.md. Updated snippet content takes effect on next dc:init run (or re-run in existing projects). |
| dc:explore | After extraction, dc:explore can browse the newly added domain context. No integration needed. |

### With GSD .planning/ Structure

dc:extract needs to understand GSD's directory conventions:

```
.planning/
  PROJECT.md                          # Key decisions table
  RETROSPECTIVE.md                    # Cross-cutting learnings
  research/                           # Stack, architecture, features, pitfalls
    STACK.md, ARCHITECTURE.md, etc.
  phases/                             # Current milestone phases
    NN-phase-name/
      NN-CONTEXT.md                   # Domain boundary, decisions, specifics
      NN-NN-SUMMARY.md               # Per-plan completion summaries
  milestones/                         # Archived milestone phases
    vX.Y-phases/
      NN-phase-name/
        (same structure)
```

This is **read-only** -- dc:extract never modifies .planning/ files. It only reads them and proposes .context/ changes.

### Template Resolution

Same as all existing skills:
1. Check `.claude/domain-context/templates/` (local install)
2. Check `~/.claude/domain-context/templates/` (global install)

No new resolution logic needed.

---

## Summary: Zero Stack Changes

This milestone requires **no new technologies, no new dependencies, no new patterns**. It produces:

1. One new markdown file: `commands/dc/extract.md` (skill)
2. One modified markdown file: `templates/agents-snippet.md` (template content update)

Both use patterns established in v1.0 and validated through v1.1. The "stack" for this milestone is the same stack the project already has.

---

## Sources

- Existing skills in this repo (`commands/dc/add.md`, `commands/dc/validate.md`) -- template resolution, MANIFEST.md update patterns, AskUserQuestion flow (HIGH confidence, read from working code)
- Existing templates in this repo (`templates/agents-snippet.md`, `templates/domain-concept.md`, `templates/decision.md`) -- template format, sentinel comment pattern, placeholder conventions (HIGH confidence, read from working code)
- GSD .planning/ artifacts in this repo -- directory structure, artifact naming conventions, content format (HIGH confidence, read from 13 completed phases across 2 milestones)
- v1.1 STACK.md research -- hook patterns, tool contracts, integration points (HIGH confidence, validated against official docs 2026-03-16)

---
*Stack research for: dc:extract skill and AGENTS.md.snippet template (domain-context-cc v1.2)*
*Researched: 2026-03-16*
