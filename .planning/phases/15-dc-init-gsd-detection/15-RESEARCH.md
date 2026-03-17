# Phase 15: dc:init GSD Detection - Research

**Researched:** 2026-03-16
**Domain:** Claude Code skill modification (markdown process specification)
**Confidence:** HIGH

## Summary

This phase modifies the existing `dc:init` skill (`commands/dc/init.md`) to detect GSD presence and conditionally inject a GSD bridge snippet into AGENTS.md. The implementation is entirely within the skill's markdown process specification -- no runtime code, no libraries, no build system. The patterns are already established by Phase 14's template and by Step 7's existing AGENTS.md injection logic.

The key challenge is surgical: insert a new Step 7.5 between existing Steps 7 and 8, update the execution_context to reference the new template, expand the status tracking from 8 to 9 items, and update Step 10's summary format. The sentinel replacement pattern (`<!-- gsd-bridge:start/end -->`) mirrors the existing `<!-- domain-context:start/end -->` pattern exactly.

**Primary recommendation:** Follow the established Step 7 pattern (create/skip/update) for Step 7.5, adding GSD-specific detection logic (check `.planning/PROJECT.md`) and a user confirmation prompt when GSD is absent.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Detect GSD presence by checking for `.planning/PROJECT.md` (canonical GSD entry point)
- When `.planning/PROJECT.md` is absent, ask user "This project doesn't have GSD set up yet. Add GSD bridge to AGENTS.md anyway?" with Yes/No options
- GSD detection happens after Step 7 (AGENTS.md domain-context snippet) as a new Step 7.5
- New Step 7.5 keeps domain-context and GSD bridge logic cleanly separated
- GSD bridge appears after the domain-context snippet in AGENTS.md
- On re-run, replace content between `<!-- gsd-bridge:start -->` and `<!-- gsd-bridge:end -->` with fresh template (same sentinel pattern as domain-context snippet)
- If user previously had GSD bridge but removed GSD, leave existing bridge text -- user can remove manually
- Two blank lines separate GSD bridge from domain-context snippet (matches Step 7's append pattern)
- Confirmation prompt: "This project doesn't have GSD set up yet. Add GSD bridge to AGENTS.md anyway?" with "Yes" / "No" options
- GSD bridge appears as a 9th tracked item in Step 10 summary: `AGENTS.md (GSD)` with created/skipped/updated status
- If AGENTS.md doesn't exist yet (Step 7 creates it), Step 7.5 appends GSD bridge separately for clean separation

### Claude's Discretion
No items delegated to Claude's discretion -- all grey areas resolved.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BRIDGE-02 | Re-running dc:init on existing projects updates GSD bridge content via sentinel replacement | Step 7.5 uses `<!-- gsd-bridge:start/end -->` sentinels from Phase 14 template; sentinel replacement pattern documented in Architecture Patterns below |
</phase_requirements>

## Standard Stack

Not applicable -- this phase modifies a markdown skill file only. No libraries, packages, or runtime dependencies are involved. The project has zero runtime dependencies by design (see AGENTS.md: "No runtime dependencies -- Node.js built-ins only").

## Architecture Patterns

### Current dc:init Structure (before modification)
```
commands/dc/init.md
├── YAML frontmatter (name, description, allowed-tools)
├── <objective>
├── <execution_context>     ← Must add gsd-agents-snippet.md reference
└── <process>
    ├── Step 1: Resolve Template Path
    ├── Step 2: Detect Existing Context
    ├── Step 3: Infer Project Metadata
    ├── Step 4: Create .context/ Directory Structure
    ├── Step 5: Fill and Write MANIFEST.md
    ├── Step 6: Fill and Write ARCHITECTURE.md
    ├── Step 7: Inject AGENTS.md Snippet        ← GSD bridge appends AFTER this
    ├── Step 8: Handle CLAUDE.md                ← Renumber NOT needed (Step 7.5)
    ├── Step 9: Handle .gitignore
    └── Step 10: Summary and Commit             ← Add 9th item, update counts
```

### Pattern 1: Sentinel-Based Injection (Existing Pattern from Step 7)
**What:** Read template with sentinel markers, check target file for existing sentinels, create/skip/update accordingly.
**When to use:** Any time content must be injected into a file that may or may not already contain it.

The existing Step 7 logic:
```
1. Read template from TEMPLATE_DIR
2. Read target file (AGENTS.md)
3. If target doesn't exist → create with template content → status "created"
4. If target contains start sentinel → status "skipped"
5. If target exists without sentinel → append with 2 blank lines → status "updated"
```

Step 7.5 follows the same pattern but with additions:
```
1. Read gsd-agents-snippet.md from TEMPLATE_DIR
2. Check for .planning/PROJECT.md (GSD detection)
3. If .planning/PROJECT.md absent → prompt user → if "No" → status "skipped", stop
4. Read AGENTS.md (which now exists, Step 7 ensured this)
5. If AGENTS.md contains <!-- gsd-bridge:start --> → replace between sentinels → status "updated"
6. If AGENTS.md does not contain <!-- gsd-bridge:start --> → append with 2 blank lines → status "created"
```

### Pattern 2: Sentinel Replacement (BRIDGE-02 Core Pattern)
**What:** Replace content between `<!-- prefix:start -->` and `<!-- prefix:end -->` markers with fresh template content.
**When to use:** Re-running dc:init on a project that already has the bridge snippet.

The replacement must be inclusive of the sentinel lines themselves (the template already contains them). This means: find the start sentinel line, find the end sentinel line, replace everything from start to end (inclusive) with the fresh template content.

### Pattern 3: Step 7.5 Numbering Convention
**What:** Using "Step 7.5" instead of renumbering Steps 8-10.
**Why:** Avoids a large diff that touches steps unrelated to this phase. The CONTEXT.md explicitly calls for "Step 7.5."

### Anti-Patterns to Avoid
- **Renumbering existing steps:** Do NOT renumber Steps 8, 9, 10 to 9, 10, 11. Use "Step 7.5" as specified.
- **Merging GSD logic into Step 7:** The CONTEXT.md explicitly requires clean separation. Step 7 handles domain-context snippet. Step 7.5 handles GSD bridge. These are independent concerns.
- **Duplicating template content in the skill:** The skill must READ `gsd-agents-snippet.md` from TEMPLATE_DIR, not embed the bridge text inline.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GSD bridge content | Inline markdown in skill | `templates/gsd-agents-snippet.md` | Template already exists from Phase 14 with correct sentinels |
| Sentinel pattern | Novel marker scheme | `<!-- gsd-bridge:start/end -->` | Matches established `<!-- domain-context:start/end -->` convention |
| User prompting | Custom output | `AskUserQuestion` tool | Already in skill's allowed-tools list |

## Common Pitfalls

### Pitfall 1: Forgetting to Update execution_context
**What goes wrong:** The skill's `<execution_context>` section lists template files. If `gsd-agents-snippet.md` isn't listed there, the skill description is incomplete.
**How to avoid:** Add `gsd-agents-snippet.md` to the template files list in `<execution_context>` with its sentinel markers noted.

### Pitfall 2: Status Tracking Count Mismatch
**What goes wrong:** Step 1 says "8 items to track" and Step 10 shows 8 items. Adding a 9th item (AGENTS.md (GSD)) requires updating BOTH locations.
**How to avoid:** Update Step 1's status tracking note to say "9 items" and add the 9th row to Step 10's summary format.

### Pitfall 3: AGENTS.md Not Yet Existing at Step 7.5
**What goes wrong:** If Step 7 created AGENTS.md for the first time, Step 7.5 needs to read it and append. But the skill is a process specification, not code -- Claude will execute steps sequentially. Step 7 always runs before 7.5, so AGENTS.md will exist.
**How to avoid:** Step 7.5's logic can safely assume AGENTS.md exists (Step 7 guarantees it). The "create" case in Step 7.5 means "append GSD bridge to existing AGENTS.md for the first time" not "create AGENTS.md."

### Pitfall 4: Sentinel Replacement Edge Case with Whitespace
**What goes wrong:** When replacing between sentinels, trailing/leading whitespace around the old content could accumulate across multiple re-runs.
**How to avoid:** Replace the entire block (start sentinel through end sentinel, inclusive) with the exact template content. The template already includes its own sentinels and proper formatting.

### Pitfall 5: Step 10 Summary Alignment
**What goes wrong:** The summary display uses aligned columns. Adding "AGENTS.md (GSD)" (which is longer than most items) could misalign the table.
**How to avoid:** Ensure the example in Step 10 shows proper spacing with the new 9th item included.

## Code Examples

### Step 7.5 Process Specification (to insert into init.md)

The new step should follow this structure:

```markdown
## Step 7.5: Inject GSD Bridge Snippet

1. Read `gsd-agents-snippet.md` from TEMPLATE_DIR.
2. Check if `.planning/PROJECT.md` exists in the project root.
3. If `.planning/PROJECT.md` does not exist:
   - Ask the user using AskUserQuestion:
     - Prompt: "This project doesn't have GSD set up yet. Add GSD bridge to AGENTS.md anyway?"
     - Options:
       1. "Yes" -- continue to inject GSD bridge
       2. "No" -- Record status `AGENTS.md (GSD): skipped` and move to the next step
4. Read `AGENTS.md` from the project root (it exists -- Step 7 ensured this).
5. If `AGENTS.md` contains `<!-- gsd-bridge:start -->`:
   - Replace everything from `<!-- gsd-bridge:start -->` through `<!-- gsd-bridge:end -->` (inclusive) with the fresh template content.
   - Record status `AGENTS.md (GSD): updated`.
6. If `AGENTS.md` does not contain `<!-- gsd-bridge:start -->`:
   - Read the existing content.
   - Write the existing content followed by two blank lines and the GSD bridge snippet.
   - Record status `AGENTS.md (GSD): created`.
```

### Updated execution_context Addition

Add after the `agents-snippet.md` bullet:
```markdown
- `gsd-agents-snippet.md` -- GSD bridge snippet with `<!-- gsd-bridge:start/end -->` sentinels
```

### Updated Step 1 Status Tracking Note

Change "8 items to track" to "9 items to track" and add `AGENTS.md (GSD)` to the list.

### Updated Step 10 Summary Format

```
Domain Context initialized:

  .context/MANIFEST.md     created
  .context/domain/         created
  .context/decisions/      created
  .context/constraints/    created
  ARCHITECTURE.md          skipped
  AGENTS.md                updated
  AGENTS.md (GSD)          created
  CLAUDE.md                skipped
  .gitignore               updated

  5 created, 2 skipped, 2 updated
```

Note: `AGENTS.md (GSD)` appears immediately after `AGENTS.md` since they relate to the same file.

## State of the Art

Not applicable -- this is a project-internal skill modification, not a technology adoption.

## Open Questions

1. **Step 10 ordering of AGENTS.md (GSD)**
   - What we know: CONTEXT.md says it's the "9th tracked item" but doesn't specify position in the list.
   - Recommendation: Place it immediately after `AGENTS.md` since they modify the same file. This is intuitive and groups related items.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual verification (no automated test framework in project) |
| Config file | none |
| Quick run command | Manual: run `/dc:init` on a test project |
| Full suite command | Manual: run `/dc:init` across 3 scenarios |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRIDGE-02 | Re-run dc:init updates GSD bridge via sentinel replacement | manual-only | Run `/dc:init` twice on same project, verify bridge content replaced not duplicated | N/A |

### Sampling Rate
- **Per task commit:** Read `commands/dc/init.md` and verify Step 7.5 structure matches specification
- **Per wave merge:** Manual run of `/dc:init` on a scratch project
- **Phase gate:** Verify all 3 scenarios (new project, re-run, no-GSD decline)

### Wave 0 Gaps
None -- this project has no automated test infrastructure. Validation is manual by design (skill files are markdown process specifications executed by Claude Code).

### Manual Verification Scenarios
1. **New project with GSD:** `.planning/PROJECT.md` exists, AGENTS.md gets bridge snippet, status shows "created"
2. **Re-run on existing project:** AGENTS.md already has bridge, content replaced between sentinels, status shows "updated"
3. **Project without GSD, user declines:** `.planning/PROJECT.md` absent, user says "No", no bridge injected, status shows "skipped"

## Sources

### Primary (HIGH confidence)
- `commands/dc/init.md` -- Current skill file (187 lines, 10 steps), read directly
- `templates/gsd-agents-snippet.md` -- Phase 14 output, 14 lines with sentinels, read directly
- `templates/agents-snippet.md` -- Existing domain-context snippet pattern, read directly
- `.planning/phases/15-dc-init-gsd-detection/15-CONTEXT.md` -- All implementation decisions locked

### Secondary (MEDIUM confidence)
None needed -- all information sourced from project files.

### Tertiary (LOW confidence)
None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no external dependencies, project-internal change only
- Architecture: HIGH - pattern directly replicates existing Step 7 logic
- Pitfalls: HIGH - identified from reading the actual skill file and template

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable -- skill format unlikely to change)
