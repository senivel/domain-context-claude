# Phase 14: GSD Bridge Template - Research

**Researched:** 2026-03-16
**Domain:** Markdown template creation (static content, sentinel markers)
**Confidence:** HIGH

## Summary

Phase 14 creates a single static markdown file: `templates/gsd-agents-snippet.md`. This file follows the exact same pattern as the existing `templates/agents-snippet.md` -- plain markdown wrapped in HTML comment sentinels. No code, no placeholders, no dependencies.

The template instructs AI agents to consult `.planning/PROJECT.md` and `.planning/STATE.md` when working in a GSD-enabled project, and to run `/dc:extract` after completing milestones to consolidate domain knowledge into `.context/`. Phase 15 will handle injecting this template into AGENTS.md via dc:init; this phase only creates the template file itself.

**Primary recommendation:** Create `templates/gsd-agents-snippet.md` as a static markdown file with `<!-- gsd-bridge:start -->` / `<!-- gsd-bridge:end -->` sentinels, matching the exact format of the existing `agents-snippet.md`. The content structure from the project's architecture research (`.planning/research/ARCHITECTURE.md` Component 2) already defines the recommended content.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None -- all implementation choices are at Claude's discretion.

### Claude's Discretion
All implementation choices are at Claude's discretion -- pure infrastructure phase.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BRIDGE-01 | dc:init appends GSD bridge text to AGENTS.md snippet referencing .context/ for domain knowledge | This phase creates the template file. BRIDGE-01 is partially addressed here (the template content exists) and completed in Phase 15 (dc:init injection logic). The template must contain text that references .context/ for domain knowledge. |
| BRIDGE-03 | GSD bridge text instructs agents to consult .context/ during planning and suggests /dc:extract after phases | The template content must include: (1) instruction to consult .context/ during planning, (2) reference to /dc:extract for post-phase knowledge capture. Both are addressed by the template prose. |
</phase_requirements>

## Standard Stack

### Core

No libraries. This phase creates a single static markdown file.

| Tool | Purpose | Why Standard |
|------|---------|--------------|
| Plain markdown | Template content | All templates in this project are plain markdown with no build step |
| HTML comment sentinels | Idempotent injection markers | Established pattern from `agents-snippet.md` using `<!-- prefix:start/end -->` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate `gsd-agents-snippet.md` | Appending GSD content to existing `agents-snippet.md` | Separate file enables independent conditional injection in Phase 15 -- GSD snippet is only added when GSD is detected, while domain-context snippet is always added |
| Static content (no placeholders) | Templated content with `{placeholder}` tokens | No dynamic content needed -- project name, paths are all fixed. Static is simpler and matches the existing agents-snippet.md pattern |

## Architecture Patterns

### Recommended Project Structure

No structural changes. The file goes in the existing `templates/` directory:

```
templates/
  agents-snippet.md          # existing: domain-context AGENTS.md snippet
  gsd-agents-snippet.md      # NEW: GSD bridge AGENTS.md snippet
  architecture.md
  claude.md
  manifest.md
  context.md
  domain-concept.md
  decision.md
  constraint.md
```

### Pattern 1: Sentinel-Wrapped Snippet

**What:** A markdown snippet wrapped in HTML comment sentinels that enable idempotent detection, injection, and replacement in target AGENTS.md files.

**When to use:** Any content that dc:init injects into a target project's AGENTS.md.

**Example (existing pattern from `templates/agents-snippet.md`):**
```markdown
<!-- domain-context:start -->
## Project Context

This project uses [Domain Context](...) for domain knowledge documentation.

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

**Key structural rules derived from this pattern:**
1. First line is the opening sentinel: `<!-- prefix:start -->`
2. Last line is the closing sentinel: `<!-- prefix:end -->`
3. Content between sentinels is valid standalone markdown
4. No `{placeholder}` tokens (static content)
5. Uses `##` heading level (subsection of AGENTS.md)
6. References use `@` prefix for Claude Code imports (e.g., `@.planning/PROJECT.md`)

### Pattern 2: GSD Bridge Content Structure

**What:** The recommended content for the GSD bridge snippet, derived from the project's architecture research.

**Content must address three concerns per requirements BRIDGE-01 and BRIDGE-03:**
1. Reference `.planning/PROJECT.md` and `.planning/STATE.md` as GSD entry points
2. Instruct agents to consult `.context/` during GSD planning
3. Reference `/dc:extract` for post-phase knowledge capture

**Recommended content (from `.planning/research/ARCHITECTURE.md` Component 2, adapted):**
```markdown
<!-- gsd-bridge:start -->
## GSD Integration

This project uses [GSD](https://github.com/senivel/get-shit-done) for planning and execution.

- Project context: @.planning/PROJECT.md
- Current state: @.planning/STATE.md
- Domain knowledge extracted from planning: run /dc:extract after completing milestones

When starting a task, check .planning/STATE.md for current phase and accumulated context.
During planning, consult .context/ for domain knowledge that informs technical decisions.
After completing a milestone, run /dc:extract to consolidate domain knowledge into .context/.
<!-- gsd-bridge:end -->
```

**Adjustments from the architecture research version:**
- Added "During planning, consult .context/ for domain knowledge that informs technical decisions." to explicitly satisfy BRIDGE-03's requirement that the text instructs agents to consult .context/ during planning. The original architecture research version only had this implicitly.

### Anti-Patterns to Avoid

- **Mixing domain-context and gsd-bridge sentinels:** The two snippets use different sentinel prefixes (`domain-context:` vs `gsd-bridge:`) and must remain independent. Never nest one inside the other.
- **Adding placeholders:** This template is static. Do not add `{project_name}` or similar tokens -- they would require dc:init to do template filling, which is unnecessary complexity.
- **Using `#` heading level:** The snippet is injected into AGENTS.md which owns the `#` level. Snippet headings use `##`.

## Don't Hand-Roll

Not applicable -- this phase creates a single static file with no logic.

## Common Pitfalls

### Pitfall 1: Missing .context/ Reference in GSD Bridge Text
**What goes wrong:** The template only references .planning/ files but doesn't tell agents to consult .context/ during planning.
**Why it happens:** The GSD bridge naturally focuses on GSD artifacts (.planning/) and may omit the domain-context connection.
**How to avoid:** BRIDGE-03 explicitly requires the text to instruct agents to consult .context/ during planning. Include a line like "During planning, consult .context/ for domain knowledge that informs technical decisions."
**Warning signs:** Template text only mentions .planning/ paths and /dc:extract without mentioning .context/.

### Pitfall 2: Sentinel Format Mismatch
**What goes wrong:** The sentinel format differs from the established pattern, causing Phase 15's dc:init injection logic to not detect it properly.
**Why it happens:** Using a different comment style, extra whitespace, or different prefix format.
**How to avoid:** Follow the exact format: `<!-- gsd-bridge:start -->` and `<!-- gsd-bridge:end -->` on their own lines, matching the `<!-- domain-context:start -->` / `<!-- domain-context:end -->` pattern character-for-character (except the prefix name).
**Warning signs:** Sentinels with extra spaces, different casing, or missing `-->` closing.

### Pitfall 3: Validation Script Not Updated
**What goes wrong:** The `tools/validate-templates.sh` script checks for exactly 8 template files. Adding a 9th file without updating the script causes validation to miss the new template.
**Why it happens:** The FILES array in validate-templates.sh is hardcoded.
**How to avoid:** Update `tools/validate-templates.sh` to include `gsd-agents-snippet.md` in the FILES array and add appropriate heading checks.
**Warning signs:** Running `bash tools/validate-templates.sh` does not check the new file.

## Code Examples

### The Complete Template File

Based on the established pattern from `agents-snippet.md` and the architecture research:

```markdown
<!-- gsd-bridge:start -->
## GSD Integration

This project uses [GSD](https://github.com/senivel/get-shit-done) for planning and execution.

- Project context: @.planning/PROJECT.md
- Current state: @.planning/STATE.md
- Domain knowledge extracted from planning: run /dc:extract after completing milestones

When starting a task, check .planning/STATE.md for current phase and accumulated context.
During planning, consult .context/ for domain knowledge that informs technical decisions.
After completing a milestone, run /dc:extract to consolidate domain knowledge into .context/.
<!-- gsd-bridge:end -->
```

### Validation Script Update

The following additions are needed in `tools/validate-templates.sh`:

```bash
# In FILES array (line 43), add:
FILES=(manifest.md context.md domain-concept.md decision.md constraint.md agents-snippet.md architecture.md claude.md gsd-agents-snippet.md)

# New section after agents-snippet.md checks (after line 100):
echo -e "\n${BOLD}gsd-agents-snippet.md${RESET}"
check_heading "${TEMPLATES_DIR}/gsd-agents-snippet.md" "<!-- gsd-bridge:start -->"
check_heading "${TEMPLATES_DIR}/gsd-agents-snippet.md" "## GSD Integration"
check_heading "${TEMPLATES_DIR}/gsd-agents-snippet.md" "<!-- gsd-bridge:end -->"

# In NO_PLACEHOLDER_FILES array (line 127), add:
NO_PLACEHOLDER_FILES=(agents-snippet.md claude.md gsd-agents-snippet.md)
```

## State of the Art

Not applicable -- this is a project-internal markdown template, not a technology with versions or deprecations.

## Open Questions

1. **Exact wording of the .context/ consultation instruction**
   - What we know: BRIDGE-03 requires the text to instruct agents to consult .context/ during planning
   - What's unclear: Whether to reference .context/MANIFEST.md specifically or just .context/ generally
   - Recommendation: Reference .context/ generally -- the domain-context snippet (injected separately) already references @.context/MANIFEST.md. Avoid duplication.

2. **Whether to mention specific /dc:extract timing**
   - What we know: The requirement says "suggests /dc:extract after phases"
   - What's unclear: Whether "after phases" means after every phase or after milestones
   - Recommendation: Say "after completing milestones" -- extraction at milestone boundaries is more practical than after every phase, and aligns with the architecture research wording.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | bash (validate-templates.sh) |
| Config file | tools/validate-templates.sh |
| Quick run command | `bash tools/validate-templates.sh` |
| Full suite command | `bash tools/validate-templates.sh` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRIDGE-01 | Template file exists with GSD bridge text referencing .context/ | smoke | `bash tools/validate-templates.sh` | Partially (script exists but needs update for new file) |
| BRIDGE-03 | Template instructs agents to consult .context/ during planning and references /dc:extract | smoke | `grep -q "consult .context/" templates/gsd-agents-snippet.md && grep -q "dc:extract" templates/gsd-agents-snippet.md` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `bash tools/validate-templates.sh`
- **Per wave merge:** `bash tools/validate-templates.sh`
- **Phase gate:** Full validation script green before verification

### Wave 0 Gaps
- [ ] `tools/validate-templates.sh` -- needs update to include `gsd-agents-snippet.md` in FILES array, add heading checks, and add to NO_PLACEHOLDER_FILES
- [ ] Content verification -- validate-templates.sh checks structure (headings/sentinels) but not semantic content. A grep-based check for `.context/` and `dc:extract` in the template provides content coverage.

## Sources

### Primary (HIGH confidence)
- `templates/agents-snippet.md` -- read directly; sentinel pattern, content structure, heading level
- `commands/dc/init.md` -- read directly; how dc:init consumes and injects the agents-snippet template
- `tools/validate-templates.sh` -- read directly; validation checks for template files
- `.planning/research/ARCHITECTURE.md` Component 2 -- GSD agents-snippet design, recommended content structure

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` -- sentinel injection pitfalls for agents-snippet.md (applies to gsd-agents-snippet.md by analogy)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no libraries, just a markdown file following an established pattern
- Architecture: HIGH -- pattern is directly observable in existing `agents-snippet.md`
- Pitfalls: HIGH -- pitfalls derived from existing code analysis and architecture research

**Research date:** 2026-03-16
**Valid until:** Indefinite (static markdown template pattern is stable)
