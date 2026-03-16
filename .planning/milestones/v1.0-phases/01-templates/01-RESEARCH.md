# Phase 1: Templates - Research

**Researched:** 2026-03-11
**Domain:** Markdown template files for Domain Context specification
**Confidence:** HIGH

## Summary

Phase 1 is a greenfield creation of markdown template files in the `templates/` directory. Each template must match the required sections defined in the Domain Context spec (~/code/domain-context/SPEC.md, Section 6). Templates use `{placeholder}` tokens with snake_case names for dynamic content that skills fill at runtime.

The spec is the single authoritative source. I read Sections 6.1 through 6.7 in full. Every required section for every file type is documented below with exact headings. The project's own `.context/` files (MANIFEST.md, domain/integration-model.md, decisions/001-single-project.md) serve as verified real-world examples of spec-compliant files.

**Primary recommendation:** Create each template by transcribing the spec's required sections verbatim, inserting `{placeholder}` tokens where content varies per-project, and adding brief HTML comment guidance near each placeholder.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Placeholder token design**: Use `{placeholder}` syntax (single curly braces), snake_case names (`{project_name}`, `{one_line_description}`, `{verified_date}`). Multi-line content uses a single prose placeholder. No required/optional distinction in templates.
- **Template completeness**: Include ALL spec-required sections, even situational ones. Skills remove irrelevant sections at fill time.
- **Template file list**: MANIFEST.md, CONTEXT.md (module-level), domain-concept.md, decision.md, constraint.md, AGENTS.md.snippet, architecture.md, claude.md
- **architecture.md and claude.md included**: Even though not in TMPL-01 explicitly, dc:init needs them (INIT-03) and they have spec-defined required sections.
- **No templates for sync-context.sh or .gitignore**: Those are project config, not spec files; dc:init generates them directly.
- **AGENTS.md snippet scope**: Contains both "Project Context" and "Confidential Context" sections. Static content, no placeholders. Wrapped in `<!-- domain-context:start -->` / `<!-- domain-context:end -->` sentinel comments. Uses both `@` import syntax and plain path.
- **Guidance content**: Brief HTML comments near placeholders as inline guidance. One-line hints only. Skills strip all `<!-- guidance -->` comments at runtime.
- **Verified date**: Uses `{verified_date}` placeholder, filled with today's date at runtime.

### Claude's Discretion

- Exact wording of guidance comments per section
- Whether any template needs additional non-spec sections for usability
- File naming within templates/ directory (e.g., `domain-concept.md` vs `domain.md`)

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TMPL-01 | Template files exist for MANIFEST.md, CONTEXT.md, domain-concept.md, decision.md, constraint.md, and AGENTS.md.snippet | Spec Sections 6.1-6.7 define exact required sections for each file type. User decisions add architecture.md and claude.md to the list. |
| TMPL-02 | Templates match the Domain Context spec's required sections exactly | Full section-by-section mapping extracted from spec below (Architecture Patterns section) |
| TMPL-03 | Templates use `{placeholder}` tokens for dynamic content | Placeholder design locked: single curly braces, snake_case names, prose placeholders for multi-line content |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Markdown | N/A | Template file format | Spec requires plain markdown files |
| Domain Context Spec | 0.1.0-draft | Authoritative source for required sections | All templates must match spec Section 6 |

### Supporting

No libraries needed. This phase produces static markdown files only.

### Alternatives Considered

None. The spec dictates the format. There are no alternative choices to make.

**Installation:** None required. These are plain markdown files.

## Architecture Patterns

### Project Structure

```
templates/
  manifest.md
  context.md
  domain-concept.md
  decision.md
  constraint.md
  agents-snippet.md
  architecture.md
  claude.md
```

**File naming rationale:** Use kebab-case per project convention. Names match their spec counterparts lowercased. `agents-snippet.md` (not `AGENTS.md.snippet`) avoids confusion with the actual AGENTS.md file while remaining valid on all filesystems.

### Pattern: Spec Section Transcription

Each template follows the same creation pattern:

1. Copy the required sections from the spec (Section 6.x) as markdown headings
2. Replace per-project content with `{placeholder}` tokens
3. Add one-line HTML comment guidance near each placeholder
4. Include ALL sections (even situational ones like Lifecycle in domain-concept.md)

### Required Sections Per Template (from Spec Section 6)

#### manifest.md (Spec 6.3)

```markdown
# Context Manifest

> {one_line_description}

## Access Levels

- **public**: Committed in `.context/`, available to all contributors
- **internal**: Committed in `.context/confidential/` (requires git-crypt or team access)
- **restricted**: Stored in `.context.local/` (requires sync, see scripts/sync-context.sh)

## Domain Concepts

(none yet)

## Architecture Decisions

(none yet)

## Constraints

(none yet)

## Module Context Files

(none yet)

## If Restricted Context Is Unavailable

{restricted_context_instructions}
```

Placeholder: `{one_line_description}`, `{restricted_context_instructions}`

Note: The Access Levels section is static boilerplate per the spec. The content sections start empty because dc:init creates the structure; dc:add populates entries.

#### context.md -- Module CONTEXT.md (Spec 6.7)

```markdown
# {module_name}

<!-- verified: {verified_date} -->

## What This Module Does

{module_description}

## Domain Concepts Owned

{domain_concepts_owned}

## Business Rules

{business_rules}

## Non-Obvious Decisions

{non_obvious_decisions}

## What This Module Does NOT Do

{module_exclusions}

## Dependencies

{dependencies}
```

Placeholders: `{module_name}`, `{verified_date}`, `{module_description}`, `{domain_concepts_owned}`, `{business_rules}`, `{non_obvious_decisions}`, `{module_exclusions}`, `{dependencies}`

#### domain-concept.md (Spec 6.4)

```markdown
# {concept_name}

<!-- verified: {verified_date} -->

## What This Is

{concept_description}

## Lifecycle

{lifecycle}

## Key Attributes

{key_attributes}

## Business Rules

{business_rules}

## Invariants

{invariants}

## Related Concepts

{related_concepts}
```

Placeholders: `{concept_name}`, `{verified_date}`, `{concept_description}`, `{lifecycle}`, `{key_attributes}`, `{business_rules}`, `{invariants}`, `{related_concepts}`

#### decision.md (Spec 6.5)

```markdown
# ADR-{number}: {decision_title}

<!-- verified: {verified_date} -->

## Status

{status}

## Context

{context}

## Decision

{decision}

## Rationale

{rationale}

## Consequences

{consequences}

## Affected Modules

{affected_modules}
```

Placeholders: `{number}`, `{decision_title}`, `{verified_date}`, `{status}`, `{context}`, `{decision}`, `{rationale}`, `{consequences}`, `{affected_modules}`

#### constraint.md (Spec 6.6)

```markdown
# {constraint_area}

<!-- verified: {verified_date} -->

## Source

{source}

## Requirements

{requirements}

## Impact on Code

{impact_on_code}

## Verification

{verification}
```

Placeholders: `{constraint_area}`, `{verified_date}`, `{source}`, `{requirements}`, `{impact_on_code}`, `{verification}`

#### agents-snippet.md (Spec 6.1 -- partial)

Static content, no placeholders. Sentinel-wrapped:

```markdown
<!-- domain-context:start -->
## Project Context

This project uses [Domain Context](https://github.com/senivel/domain-context) for domain knowledge documentation.

- Architecture overview: @ARCHITECTURE.md
- Domain & business context: @.context/MANIFEST.md
- Per-module context: CONTEXT.md files in each source directory

When working in a module, read its CONTEXT.md first. When a task involves
business rules, consult the relevant .context/domain/ files via the manifest.

## Confidential Context

If `.context.local/` exists, read its contents alongside `.context/`.
If unavailable, do not infer business rules from code. Ask the developer.
<!-- domain-context:end -->
```

Note: The spec includes `To sync: bash scripts/sync-context.sh` in the Confidential Context section, but the user decided no template for sync-context.sh. The snippet should still include the sync line since it references the target project's script, not something this project creates. However, since dc:init does not create the sync script (user decision), omit the sync line from the snippet to avoid referencing a non-existent file. Skills or users can add it if they create a sync script.

#### architecture.md (Spec 6.2)

```markdown
# Architecture

## System Purpose

{system_purpose}

## Module Map

| Module | Owns | Key Domain Concepts | Dependencies |
|--------|------|---------------------|--------------|
| {module_rows} |

## Data Flow

{data_flow}

## Key Boundaries

{key_boundaries}

## Technology Decisions

{technology_decisions}
```

Placeholders: `{system_purpose}`, `{module_rows}`, `{data_flow}`, `{key_boundaries}`, `{technology_decisions}`

#### claude.md (Thin pointer file)

```markdown
@AGENTS.md
```

This is static content per ADR-002. No placeholders needed since the pointer is the same for every project. However, per user decision it is templated for consistency and because dc:init needs to conditionally create it.

### Anti-Patterns to Avoid

- **Adding sections not in the spec:** Templates must match the spec. Do not invent new sections. The user granted discretion on "additional non-spec sections for usability" but the spec is comprehensive and adding sections creates drift risk.
- **Making guidance comments too verbose:** One-line hints only. Do not write tutorials inside templates.
- **Using double curly braces `{{placeholder}}`:** The locked decision is single curly braces `{placeholder}`.
- **Marking placeholders as required/optional:** The locked decision says no distinction in templates -- skills know which are required.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Template format | Custom DSL or YAML frontmatter | Plain markdown with `{placeholder}` | Spec mandates plain markdown; skills do the processing |
| Section ordering | Runtime section sorter | Match spec order in template files | Static ordering is simpler and spec-compliant |

**Key insight:** Templates are static markdown files. There is no processing logic in this phase. Keep them as close to the spec's examples as possible.

## Common Pitfalls

### Pitfall 1: Section Name Drift from Spec

**What goes wrong:** Template section headings differ slightly from spec (e.g., "What It Does" vs "What This Module Does")
**Why it happens:** Paraphrasing rather than copying spec headings exactly
**How to avoid:** Copy headings character-for-character from spec Section 6. The spec uses specific phrasing (e.g., "What This Module Does NOT Do" with capitalized NOT).
**Warning signs:** Template heading text does not match a grep of the spec

### Pitfall 2: Missing Verified Date Comment

**What goes wrong:** Forgetting the `<!-- verified: {verified_date} -->` HTML comment below the title
**Why it happens:** It appears in the spec but is easy to overlook since it is an HTML comment, not a heading
**How to avoid:** Every template except MANIFEST.md and AGENTS.md snippet includes this comment. MANIFEST.md uses verified dates inline per entry. The snippet is static.
**Warning signs:** Template file has no `{verified_date}` placeholder

### Pitfall 3: Sentinel Comment Mismatch

**What goes wrong:** AGENTS.md snippet sentinel comments don't match what dc:init expects for idempotent injection (INIT-04)
**Why it happens:** Template created in Phase 1, consumption logic in Phase 2 -- they can diverge
**How to avoid:** Use exact sentinels: `<!-- domain-context:start -->` and `<!-- domain-context:end -->` as locked in user decisions
**Warning signs:** Running dc:init twice duplicates the snippet

### Pitfall 4: Placeholder in Static Content

**What goes wrong:** Adding `{placeholder}` tokens to content that should be identical across all projects (e.g., the Access Levels section in MANIFEST.md)
**Why it happens:** Over-generalizing -- trying to make everything configurable
**How to avoid:** Only use placeholders where content genuinely varies per project. Static spec text stays verbatim.
**Warning signs:** Placeholder with no obvious per-project value

## Code Examples

### Guidance Comment Pattern

```markdown
## What This Is

<!-- 2-4 sentences: what this concept is and its role in the system -->
{concept_description}
```

Comments are placed BELOW the heading, ABOVE the placeholder. Brief, actionable.

### Verified Date Pattern (in file body)

```markdown
# {concept_name}

<!-- verified: {verified_date} -->
```

The verified date is an HTML comment on the line immediately following the title, per spec convention visible in Sections 6.4, 6.5, 6.6, 6.7.

### Verified Date Pattern (in MANIFEST.md entries)

```markdown
- [{name}]({relative_path}) -- {description} [{access_level}] [verified: {verified_date}]
```

MANIFEST.md does not use the HTML comment pattern. It uses inline `[verified: YYYY-MM-DD]` per spec Section 6.3.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N/A | Domain Context Spec 0.1.0-draft | 2026-03-11 | First version; templates match this draft |

**Note:** The spec is in draft status (0.1.0-draft). Templates should match the current draft exactly. If the spec changes, templates will need to be updated in a future phase.

## Open Questions

1. **sync-context.sh reference in AGENTS.md snippet**
   - What we know: The spec includes `To sync: bash scripts/sync-context.sh` in the Confidential Context section. The user decided no template for sync-context.sh.
   - What's unclear: Should the snippet include the sync line or omit it?
   - Recommendation: Omit it. The snippet should only reference things that dc:init guarantees exist. Users can add the sync line manually if they create the script.

2. **MANIFEST.md "If Restricted Context Is Unavailable" section**
   - What we know: Spec Section 6.3 includes this section. The default text is "ask the developer, do not guess."
   - What's unclear: Should this be a placeholder or default static text?
   - Recommendation: Use a `{restricted_context_instructions}` placeholder with a guidance comment suggesting the spec's default. This gives skills flexibility while guiding toward the standard.

3. **claude.md -- truly static or needs a placeholder?**
   - What we know: ADR-002 says CLAUDE.md is a thin `@AGENTS.md` pointer. Same for every project.
   - What's unclear: Whether any per-project customization is needed (e.g., additional Claude Code-specific sections).
   - Recommendation: Keep it static (`@AGENTS.md` only). The template exists for dc:init's conditional creation logic, not for customization. Users who want more can edit the file directly.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Shell (bash) -- no test framework detected |
| Config file | none -- see Wave 0 |
| Quick run command | `bash tools/validate-templates.sh` (to be created) |
| Full suite command | `bash tools/validate-templates.sh` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TMPL-01 | All 8 template files exist in templates/ | smoke | `ls templates/{manifest,context,domain-concept,decision,constraint,agents-snippet,architecture,claude}.md` | No -- Wave 0 |
| TMPL-02 | Each template contains spec-required section headings | unit | `bash tools/validate-templates.sh` (checks headings per file) | No -- Wave 0 |
| TMPL-03 | Templates use `{placeholder}` tokens (single curly brace, snake_case) | unit | `grep -P '\{[a-z_]+\}' templates/*.md` (verify pattern exists where expected) | No -- Wave 0 |

### Sampling Rate

- **Per task commit:** `ls templates/*.md && grep -c '{' templates/*.md`
- **Per wave merge:** `bash tools/validate-templates.sh` (full validation)
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps

- [ ] `tools/validate-templates.sh` -- script that checks each template has correct headings per spec and uses `{placeholder}` pattern. Covers TMPL-02 and TMPL-03.
- [ ] `templates/` directory -- does not exist yet (greenfield)

## Sources

### Primary (HIGH confidence)

- ~/code/domain-context/SPEC.md -- Sections 6.1 through 6.7 read in full. All required section headings extracted verbatim.
- .planning/phases/01-templates/01-CONTEXT.md -- User decisions and locked constraints
- Project's own .context/ files (MANIFEST.md, domain/integration-model.md, decisions/001-single-project.md) -- verified real-world examples of spec-compliant files

### Secondary (MEDIUM confidence)

None needed. The spec is the single authoritative source for this phase.

### Tertiary (LOW confidence)

None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- spec is the sole authority and was read in full
- Architecture: HIGH -- file list and section headings extracted directly from spec
- Pitfalls: HIGH -- derived from comparing spec text to template creation patterns

**Research date:** 2026-03-11
**Valid until:** Stable until spec version changes (currently 0.1.0-draft)
