# Phase 12: Path-Scoped Rule - Research

**Researched:** 2026-03-16
**Domain:** Claude Code rules, Domain Context spec formatting
**Confidence:** HIGH

## Summary

This phase creates a single markdown file (`rules/dc-context-editing.md`) that provides Domain Context spec formatting guidance whenever Claude reads `.context/` files or `CONTEXT.md` files. Claude Code rules are markdown files placed in `.claude/rules/` with optional YAML frontmatter for path scoping. The rule auto-loads into context when matching files are read -- no hook or skill infrastructure needed.

The key technical finding is that `globs:` frontmatter (comma-separated, unquoted patterns) is the reliable format for path scoping. The documented `paths:` format has parser bugs with quoted values and YAML arrays. The rule content should distill the most critical formatting conventions from the spec and templates into ~30-40 lines of concise bullets.

**Primary recommendation:** Create `rules/dc-context-editing.md` with `globs:` frontmatter covering `.context/**` and `**/CONTEXT.md`, containing concise spec formatting guidance organized by file type.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Rule file at `rules/dc-context-editing.md` -- matches project `rules/` directory convention with `dc-` prefix
- Concise bullet points (~30-40 lines) -- rules load into context on every matching file read, so brevity is critical
- Reference `~/code/domain-context/SPEC.md` as the authoritative source for edge cases
- Cover both `.context/**` and `**/CONTEXT.md` in the globs frontmatter -- same formatting conventions apply to module-level CONTEXT.md files

### Claude's Discretion
- Exact wording and organization of guidance bullets
- Whether to group by file type (MANIFEST.md, domain files, decisions, constraints) or by concern (formatting, naming, dates)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RULE-01 | Path-scoped rule loads when Claude reads `.context/**` or `**/CONTEXT.md` files | `globs:` frontmatter format verified; comma-separated patterns for both glob patterns |
| RULE-02 | Rule provides Domain Context spec formatting guidance (template structure, MANIFEST.md updates, verified dates, naming conventions) | All 8 templates analyzed; spec sections 5.2, 6.x provide canonical formats; validation script encodes 67 checks |
| RULE-03 | Rule uses `globs:` frontmatter key (not `paths:`) | Confirmed: `globs:` works reliably; `paths:` has parser bugs with quoted/array values (GitHub issue #17204) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| N/A | N/A | This is a plain markdown file | No dependencies needed |

This phase produces a single markdown file with no code dependencies.

## Architecture Patterns

### Rule File Format
**What:** Claude Code rule files are markdown in `.claude/rules/` with optional YAML frontmatter for path scoping.
**Source:** [Claude Code official docs](https://code.claude.com/docs/en/memory)

```markdown
---
globs: .context/**, **/CONTEXT.md
---

# Rule Title

Rule content here as concise bullets.
```

**Critical format details:**
- Use `globs:` not `paths:` (RULE-03 requirement; `paths:` has parser bugs)
- Comma-separated patterns, unquoted (the CSV parser strips quotes incorrectly)
- Rules without frontmatter load unconditionally at launch -- we MUST have frontmatter
- Rule content loads into context every time a matching file is read, so brevity matters

### Recommended Project Structure
```
rules/
└── dc-context-editing.md    # Path-scoped rule (this phase)
```

This file lives in the project's `rules/` source directory. The installer (future milestone) copies it to `.claude/rules/` in target projects.

### Content Organization Pattern
**Recommendation (Claude's Discretion):** Group by file type, not by concern.

**Rationale:** When Claude reads a `.context/domain/billing.md` file, it needs to know domain concept file conventions immediately. Grouping by file type lets Claude scan to the relevant section. Grouping by concern (formatting, naming, dates) would force Claude to read the entire rule to find all guidance for the file type it is currently editing.

Suggested sections:
1. General conventions (naming, verified dates, token budgets)
2. MANIFEST.md format
3. Domain concept files
4. Decision records (ADRs)
5. Constraint files
6. Module CONTEXT.md files

### Anti-Patterns to Avoid
- **Verbose prose in rules:** Rules load on every matching file read. Each token costs context budget. Use terse bullets, not explanatory paragraphs.
- **Duplicating the spec:** The rule should reference `~/code/domain-context/SPEC.md` for edge cases, not reproduce it. Distill, don't duplicate.
- **Using `paths:` frontmatter:** Known parser bugs. Always use `globs:`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Path matching | Custom hook for context injection | `globs:` frontmatter in `.claude/rules/` | Claude Code handles this natively; zero code needed |

**Key insight:** This entire phase is a single markdown file. No code, no hooks, no scripts. The Claude Code rules system handles everything.

## Common Pitfalls

### Pitfall 1: Using `paths:` Instead of `globs:`
**What goes wrong:** Rule never loads; Claude gets no guidance when reading .context/ files.
**Why it happens:** Official docs show `paths:` as the frontmatter key, but the parser has bugs with quoted values and YAML arrays.
**How to avoid:** Always use `globs:` with comma-separated unquoted patterns.
**Warning signs:** Rule file exists but Claude doesn't mention formatting conventions when editing .context/ files.

### Pitfall 2: Rule Too Long
**What goes wrong:** Excessive token consumption on every .context/ file read; Claude may ignore later bullets.
**Why it happens:** Temptation to include every spec detail.
**How to avoid:** Target ~30-40 lines. Reference the spec for edge cases. Include only the guidance that prevents the most common mistakes.
**Warning signs:** Rule file exceeds 50 lines or 800 tokens.

### Pitfall 3: Glob Pattern Doesn't Match Module CONTEXT.md
**What goes wrong:** Rule loads for `.context/` files but not for `src/billing/CONTEXT.md`.
**Why it happens:** Using `.context/**` alone without `**/CONTEXT.md`.
**How to avoid:** Include both patterns: `.context/**, **/CONTEXT.md`.
**Warning signs:** Claude follows formatting conventions in `.context/` but not in module-level CONTEXT.md files.

### Pitfall 4: Quoting Glob Patterns in Frontmatter
**What goes wrong:** The CSV parser doesn't strip quotes properly, so `".context/**"` fails to match.
**Why it happens:** YAML convention suggests quoting strings with special characters.
**How to avoid:** Leave glob patterns unquoted in the `globs:` value.
**Warning signs:** Rule never loads despite correct pattern.

## Code Examples

### Complete Rule File Structure
```markdown
---
globs: .context/**, **/CONTEXT.md
---

# Domain Context Formatting

Authoritative spec: ~/code/domain-context/SPEC.md

## General
- Filenames: lowercase kebab-case (e.g., `billing-cycles.md`)
- Verified date: `<!-- verified: YYYY-MM-DD -->` as HTML comment after the H1
- MANIFEST.md entries: `[verified: YYYY-MM-DD]` inline (not HTML comment)
- Token budget: keep each file under 1500 tokens (~500-1000 ideal)

## MANIFEST.md
- One-line description in blockquote after H1
- Sections: Access Levels, Domain Concepts, Architecture Decisions, Constraints, Module Context Files
- Entry format: `- [Name](path) -- Description [access-level] [verified: YYYY-MM-DD]`
- ADR entries: `- [NNN: Title](path) -- Description [verified: YYYY-MM-DD]`
- Always update MANIFEST.md when adding/modifying context files

## Domain Concepts (.context/domain/)
- Required sections: What This Is, Key Attributes, Business Rules, Invariants, Related Concepts
- Optional: Lifecycle
- Business rules as numbered, testable statements
- One concept per file; split if >2000 tokens

## Decisions (.context/decisions/)
- Filename: `{NNN}-{slug}.md` (zero-padded three digits)
- Title: `ADR-{NNN}: {Title}`
- Required sections: Status, Context, Decision, Rationale, Consequences, Affected Modules
- Status values: accepted | superseded | deprecated

## Constraints (.context/constraints/)
- Required sections: Source, Requirements, Impact on Code, Verification

## Module CONTEXT.md
- Required sections: What This Module Does, Domain Concepts Owned, Business Rules, Non-Obvious Decisions, What This Module Does NOT Do, Dependencies
```

### Frontmatter Formats Comparison (for reference)
```yaml
# CORRECT - works reliably
---
globs: .context/**, **/CONTEXT.md
---

# INCORRECT - paths with quotes fails
---
paths:
  - ".context/**"
  - "**/CONTEXT.md"
---

# INCORRECT - paths unquoted may work but is unreliable
---
paths:
  - .context/**
  - **/CONTEXT.md
---
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `paths:` frontmatter key | `globs:` frontmatter key | Ongoing (parser bugs unfixed) | Must use `globs:` for reliable path matching |
| Rules load unconditionally | Path-scoped rules via frontmatter | Claude Code v2.x | Rules can be scoped to specific file types |

## Open Questions

1. **Will the installer need to handle this file specially?**
   - What we know: The installer (future DIST milestone) copies files to `.claude/`. This file lives in `rules/` source directory.
   - What's unclear: Whether the installer already handles `rules/` directory or needs modification.
   - Recommendation: Out of scope for this phase. The installer is a future milestone concern.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual verification (no automated test framework for rule files) |
| Config file | N/A |
| Quick run command | Verify file exists and frontmatter is valid YAML |
| Full suite command | Manual: open a .context/ file in Claude Code and confirm rule loads |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RULE-01 | Rule loads on `.context/**` and `**/CONTEXT.md` file reads | manual-only | N/A -- requires active Claude Code session | N/A |
| RULE-02 | Rule content covers template structure, MANIFEST.md, verified dates, naming | smoke | `grep -c "##" rules/dc-context-editing.md` (verify sections exist) | Wave 0 |
| RULE-03 | Uses `globs:` not `paths:` in frontmatter | smoke | `head -3 rules/dc-context-editing.md \| grep "globs:"` | Wave 0 |

### Sampling Rate
- **Per task commit:** Verify file parses as valid YAML frontmatter + markdown
- **Per wave merge:** Manual test in Claude Code session
- **Phase gate:** Confirm rule loads when reading a .context/ file

### Wave 0 Gaps
None -- no test infrastructure needed. This phase produces a single markdown file verified by inspection and manual testing.

## Sources

### Primary (HIGH confidence)
- [Claude Code official docs - Memory](https://code.claude.com/docs/en/memory) -- rules format, path scoping, frontmatter syntax
- [GitHub Issue #17204](https://github.com/anthropics/claude-code/issues/17204) -- `globs:` vs `paths:` parser bug documentation
- Domain Context SPEC.md (`~/code/domain-context/SPEC.md`) -- canonical file formats, naming conventions, required sections
- Project templates (`templates/`) -- all 8 template files showing exact formatting expectations

### Secondary (MEDIUM confidence)
- Existing rule example (`/Users/alevine/code/deforrest-ui/.claude/rules/task-workflow.md`) -- working rule file (no frontmatter, unconditional loading)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no dependencies, just a markdown file
- Architecture: HIGH -- Claude Code rules format verified via official docs and GitHub issues
- Pitfalls: HIGH -- `globs:` vs `paths:` bug is well-documented with test results

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable -- markdown file format unlikely to change)
