# Phase 13: Domain Validator Agent - Research

**Researched:** 2026-03-16
**Domain:** Claude Code agent authoring, domain knowledge validation
**Confidence:** HIGH

## Summary

This phase creates a single markdown file: a Claude Code agent at `agents/dc-domain-validator.md`. The agent reads `.context/domain/` and `.context/constraints/` files, extracts business rules and invariants, then scans project code for violations using read-only tools (Read, Grep, Glob). Output is a structured markdown table of violations.

The technical challenge is not in the file format (well-established by 15+ existing agents in `.claude/agents/`) but in crafting a self-contained system prompt that reliably extracts enforceable rules from domain files and maps them to code patterns. The agent must be pragmatic about what is code-enforceable vs. requiring human judgment.

**Primary recommendation:** Create a single agent markdown file following the established frontmatter format, with a self-contained prompt that implements a three-phase workflow: (1) discover and extract rules, (2) scan code for violations, (3) produce structured report.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Violations reported as a markdown table: violation description, file:line location, rule source -- structured, scannable, copy-pasteable
- Report-only -- the agent does NOT suggest or make fixes (per REQUIREMENTS: "validator reports, it does not fix")
- When no violations found, report "No violations found" with a summary of rules checked -- confirms the check ran
- Check both `.context/domain/` and `.context/constraints/` files -- constraints are business rules that constrain code
- Agent file at `agents/dc-domain-validator.md` -- matches project `agents/` directory convention with `dc-` prefix
- Scan common code directories: `src/`, `app/`, `lib/`, `commands/`, `hooks/` -- skip `.planning/`, `node_modules/`, templates
- Extract rules from "Business Rules" and "Invariants" sections of domain/constraint files -- spec-defined sections containing enforceable rules
- Fully self-contained system prompt (~80-100 lines) -- satisfies AGNT-05 (no reliance on parent context, CLAUDE.md, or conversation history)

### Claude's Discretion
- Exact rule-to-code matching heuristics
- How to handle ambiguous or non-code-enforceable rules
- Internal agent workflow structure

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AGNT-01 | Domain validator agent uses read-only tools (Read, Grep, Glob) only | Agent frontmatter `tools: Read, Grep, Glob` -- format verified from existing agents |
| AGNT-02 | Agent reads `.context/domain/` files and extracts business rules/constraints | Workflow phase 1: read MANIFEST.md, then read domain/ and constraints/ files, extract "Business Rules" and "Invariants" sections |
| AGNT-03 | Agent checks code for violations against documented domain rules | Workflow phase 2: for each extracted rule, use Grep/Glob to search code directories for violations |
| AGNT-04 | Agent produces structured findings (violation, file, rule violated) | Output format: markdown table with columns for violation description, file:line, rule source |
| AGNT-05 | Agent system prompt is fully self-contained (no reliance on parent context) | Prompt includes all instructions inline -- no `@` references, no assumptions about conversation history |
</phase_requirements>

## Standard Stack

### Core
| Component | Purpose | Why Standard |
|-----------|---------|--------------|
| Claude Code Agent (.md) | Agent definition file | Only format Claude Code supports for agents |
| YAML frontmatter | Agent metadata (name, tools, description) | Required by Claude Code agent parser |
| Markdown body | System prompt content | Standard agent prompt format |

### No Libraries Required

This phase produces a single markdown file. No npm packages, no Node.js code, no dependencies. The "stack" is the Claude Code agent file format.

## Architecture Patterns

### Agent File Structure (Verified from existing agents)
```
agents/dc-domain-validator.md
```

### Pattern 1: Agent Frontmatter
**What:** YAML frontmatter with required fields
**When to use:** Every Claude Code agent file
**Example:**
```yaml
---
name: dc-domain-validator
description: Checks project code against business rules documented in .context/domain/ and .context/constraints/ files. Reports violations as structured findings.
tools: Read, Grep, Glob
color: yellow
---
```

Source: Verified from `.claude/agents/gsd-plan-checker.md` and 14 other existing agent files. Fields: `name` (string), `description` (string), `tools` (comma-separated tool names), `color` (string).

### Pattern 2: Three-Phase Agent Workflow
**What:** Self-contained prompt that guides the agent through discovery, analysis, and reporting
**When to use:** This agent's internal workflow

Phase 1 -- Rule Discovery:
1. Read `.context/MANIFEST.md` to discover domain concept and constraint file paths
2. Read each domain file from `domain/` directory
3. Read each constraint file from `constraints/` directory
4. Extract numbered items from "Business Rules" and "Invariants" sections
5. Classify each rule as code-enforceable or human-judgment-only
6. Skip rules that cannot be checked via code scanning (e.g., "knowledge extraction MUST be user-initiated")

Phase 2 -- Code Scanning:
1. Use Glob to find code files in scan directories (`src/`, `app/`, `lib/`, `commands/`, `hooks/`)
2. For each code-enforceable rule, use Grep to search for patterns that would indicate violations
3. Use Read to examine flagged files in context for false-positive filtering

Phase 3 -- Report:
1. Produce markdown table of violations (or "No violations found" with rules-checked summary)
2. Include rule source attribution for each finding

### Pattern 3: Rule Classification Heuristic (Claude's Discretion)
**What:** How the agent decides which rules are code-enforceable
**Recommendation:** Rules that reference specific file patterns, naming conventions, structural requirements, or import/reference patterns are enforceable. Rules about process, timing, or human intent are not.

Examples from existing domain files:
- ENFORCEABLE: "AGENTS.md MUST be the primary instruction file; CLAUDE.md is a thin pointer that imports it" -- can check if CLAUDE.md contains `@AGENTS.md`
- ENFORCEABLE: "All skills MUST use the `dc:` prefix" -- can grep skill files for name field
- ENFORCEABLE: "Hooks MUST exit 0 on any error" -- can check for try/catch and process.exit patterns
- NOT ENFORCEABLE: "Knowledge extraction from .planning/ to .context/ MUST be an explicit user-initiated step" -- process rule, not code pattern

### Anti-Patterns to Avoid
- **Referencing external context:** Agent prompt must NOT use `@AGENTS.md`, `@CLAUDE.md`, or assume any parent session state. Everything needed must be inline.
- **Suggesting fixes:** The agent reports violations only. No "you should change X to Y" -- that violates the locked decision and REQUIREMENTS out-of-scope table.
- **Over-scanning:** Don't scan `node_modules/`, `.planning/`, `templates/`, `.git/`, test fixtures. These are not project code subject to business rules.
- **False confidence on ambiguous rules:** When a rule is borderline enforceable, skip it rather than produce noisy false positives. Report it in the "rules checked" summary as "skipped (requires human judgment)".

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File discovery | Custom directory walker | Glob tool with patterns | Agent has Glob tool built in |
| Pattern matching | Custom regex engine | Grep tool | Agent has Grep tool built in |
| MANIFEST.md parsing | Custom parser | Read tool + agent reasoning | Agent can parse markdown natively |
| Rule extraction | Custom NLP | Agent's own language understanding | LLM agents excel at extracting structured info from natural language |

**Key insight:** The agent IS the tool. Unlike hooks (Node.js scripts), this agent leverages Claude's language understanding to interpret business rules and map them to code patterns. No custom code needed.

## Common Pitfalls

### Pitfall 1: Non-Self-Contained Prompt
**What goes wrong:** Agent references `@AGENTS.md` or assumes conversation history exists
**Why it happens:** Developer habit of using `@` imports in prompts
**How to avoid:** Include ALL instructions inline in the agent markdown. Test by reading the file in isolation -- it must make complete sense without any other file.
**Warning signs:** Any `@` reference in the agent file body, any "as discussed" or "per the project" phrasing

### Pitfall 2: Over-Reporting (False Positives)
**What goes wrong:** Agent flags violations for rules that aren't truly code-enforceable, producing noisy output
**Why it happens:** Trying to validate process rules or intent-based rules via code patterns
**How to avoid:** Prompt explicitly instructs agent to classify rules before scanning, skip non-enforceable ones
**Warning signs:** Violations like "code doesn't ensure user-initiated extraction" -- untestable via grep

### Pitfall 3: Missing the constraints/ Directory
**What goes wrong:** Agent only checks `domain/` files and misses `constraints/` files
**Why it happens:** Constraints directory is currently empty in this project, easy to forget
**How to avoid:** Prompt explicitly lists both directories. Even if constraints/ is empty now, other projects will use it.
**Warning signs:** Prompt only mentions "domain files" without "constraint files"

### Pitfall 4: Write Tools in Frontmatter
**What goes wrong:** Agent has Write, Edit, or Bash in its tools list, violating AGNT-01
**Why it happens:** Copy-paste from other agents that have write access
**How to avoid:** Frontmatter must be exactly `tools: Read, Grep, Glob` -- nothing else
**Warning signs:** Any tool other than Read, Grep, Glob in the frontmatter

### Pitfall 5: Prompt Too Long
**What goes wrong:** Prompt exceeds ~100 lines, consuming excessive context on every invocation
**Why it happens:** Over-specifying edge cases or including examples of every possible violation
**How to avoid:** Keep prompt to 80-100 lines per locked decision. Trust the LLM to reason about violations.
**Warning signs:** Prompt exceeding 150 lines

## Code Examples

### Example: Agent File (Complete Structure)

```markdown
---
name: dc-domain-validator
description: Checks project code against business rules documented in .context/ files. Reports structured violation findings.
tools: Read, Grep, Glob
color: yellow
---

[Self-contained system prompt here -- 80-100 lines covering:
- Role definition (domain validator, read-only, report-only)
- Step 1: Read MANIFEST.md, discover domain and constraint files
- Step 2: Read each file, extract Business Rules and Invariants sections
- Step 3: Classify rules as code-enforceable or skip
- Step 4: For each enforceable rule, scan code directories
- Step 5: Produce violation table or clean report
- Output format specification (markdown table)
- Scan scope (which directories to include/exclude)
- Explicit constraints (no fixes, no file modifications)]
```

Source: Format verified from `/Users/alevine/code/domain-context-claude/.claude/agents/gsd-plan-checker.md`

### Example: Expected Output Format (Violations Found)

```markdown
## Domain Validation Report

**Scanned:** src/, commands/, hooks/
**Rules checked:** 6 (2 skipped -- require human judgment)

### Violations

| # | Violation | Location | Rule Source |
|---|-----------|----------|-------------|
| 1 | Skill name missing `dc:` prefix | commands/dc/foo.md:2 | claude-code-extensions.md, Rule 1 |
| 2 | CLAUDE.md does not import @AGENTS.md | CLAUDE.md:1 | integration-model.md, Rule 1 |

### Rules Checked

| Rule | Source | Status |
|------|--------|--------|
| Skills use dc: prefix | claude-code-extensions.md | Checked -- 1 violation |
| AGENTS.md is primary instruction file | integration-model.md | Checked -- 1 violation |
| Hooks exit 0 on error | claude-code-extensions.md | Checked -- no violations |
| Knowledge extraction is user-initiated | integration-model.md | Skipped -- requires human judgment |
```

### Example: Expected Output Format (No Violations)

```markdown
## Domain Validation Report

**Scanned:** src/, commands/, hooks/
**Rules checked:** 4 (2 skipped -- require human judgment)

No violations found.

### Rules Checked

| Rule | Source | Status |
|------|--------|--------|
| Skills use dc: prefix | claude-code-extensions.md | Checked -- no violations |
| AGENTS.md is primary instruction file | integration-model.md | Checked -- no violations |
| Hooks exit 0 on error | claude-code-extensions.md | Checked -- no violations |
| Knowledge extraction is user-initiated | integration-model.md | Skipped -- requires human judgment |
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual code review against docs | Agent-based automated scanning | Current (this phase) | Enables on-demand validation |

This is a new capability -- no "old approach" exists in this project. The agent format itself has been stable since Claude Code's agent feature launch.

## Open Questions

1. **How will the agent be invoked?**
   - What we know: Users can spawn agents via the Agent tool or skills can spawn them
   - What's unclear: Whether a `/dc:validate-domain` skill wrapper is needed
   - Recommendation: Phase scope is the agent file only. A skill wrapper can be added later. Users invoke via "use the dc-domain-validator agent" or the Agent tool directly.

2. **Installer integration**
   - What we know: `agents/` directory will be copied to `.claude/agents/` by the installer (CONTEXT.md notes "future milestone")
   - What's unclear: Whether installer changes are in scope for this phase
   - Recommendation: Out of scope. Phase delivers the agent file in `agents/`. Installer updates are a distribution concern (DIST-01).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual validation (no automated test framework for agent markdown files) |
| Config file | none |
| Quick run command | `cat agents/dc-domain-validator.md` (verify file exists and format) |
| Full suite command | Manual: copy agent to `.claude/agents/`, invoke in a project with `.context/` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AGNT-01 | Read-only tools only | unit | `head -5 agents/dc-domain-validator.md \| grep "tools: Read, Grep, Glob"` | Wave 0 |
| AGNT-02 | Reads .context/domain/ files | manual-only | Invoke agent in project with .context/ domain files | N/A |
| AGNT-03 | Checks code for violations | manual-only | Invoke agent and verify it scans code directories | N/A |
| AGNT-04 | Structured findings output | manual-only | Invoke agent and verify markdown table output | N/A |
| AGNT-05 | Self-contained prompt | unit | `grep -c "@" agents/dc-domain-validator.md` (should be 0 in body, only frontmatter) | Wave 0 |

### Sampling Rate
- **Per task commit:** `head -5 agents/dc-domain-validator.md` to verify frontmatter
- **Per wave merge:** Manual agent invocation test
- **Phase gate:** Full manual validation before `/gsd:verify-work`

### Wave 0 Gaps
None -- this phase creates a single markdown file. Verification is structural (frontmatter check) plus manual invocation. No test framework setup needed.

## Sources

### Primary (HIGH confidence)
- `.claude/agents/gsd-plan-checker.md` -- agent file format, frontmatter fields, tool specification
- `.claude/agents/gsd-verifier.md` -- additional agent format reference
- `.context/domain/integration-model.md` -- example domain file with Business Rules and Invariants sections
- `.context/domain/claude-code-extensions.md` -- example domain file with Business Rules
- `rules/dc-context-editing.md` -- documents required sections for domain, constraint, and decision files

### Secondary (MEDIUM confidence)
- `.context/MANIFEST.md` -- how domain/constraint files are discovered and listed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- agent format verified from 15+ existing agents in .claude/agents/
- Architecture: HIGH -- three-phase workflow is straightforward; domain file structure is well-documented in the project's own .context/ files
- Pitfalls: HIGH -- pitfalls derived from actual requirements (AGNT-01 through AGNT-05) and locked decisions

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable -- agent format unlikely to change)
