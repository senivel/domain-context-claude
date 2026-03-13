# Phase 3: Init Idempotency - Research

**Researched:** 2026-03-13
**Domain:** Claude Code skill modification (markdown-based instruction files)
**Confidence:** HIGH

## Summary

Phase 3 modifies a single file -- `commands/dc/init.md` -- to make the dc:init skill idempotent and informative. The current skill has a blocking "Proceed anyway?" prompt when .context/ exists, per-step narration messages, and no summary output. Phase 3 replaces the blocking prompt with a non-blocking warning, removes per-step narration in favor of a final summary table, and ensures a second run reports all files as "skipped."

This is a content-editing task, not a coding task. The "code" is a Claude Code skill written in markdown with structured `<process>` steps. The changes are well-scoped: modify Steps 2, 4-9, and 10 of the existing skill, and add a new summary step. No new files are created, no dependencies are added, and the template resolution logic (Step 1) stays unchanged.

**Primary recommendation:** Treat this as a single-plan rewrite of init.md with careful attention to the three-status tracking model (created/skipped/updated) and the summary format specified in CONTEXT.md.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Remove the Phase 2 "Proceed anyway?" AskUserQuestion prompt entirely
- When .context/ directory exists, show a non-blocking warning: "Existing .context/ detected. Only missing files will be created." and continue automatically
- Only trigger the warning when .context/ directory exists -- AGENTS.md or ARCHITECTURE.md existing alone does not trigger a warning
- Always run through all steps even when everything exists -- the summary confirms idempotency (INIT-10)
- Three statuses: created (new file written), skipped (file already exists, no change), updated (existing file modified by append)
- AGENTS.md snippet appended = "updated"; sentinel already present = "skipped"; file didn't exist = "created"
- Same logic for CLAUDE.md (@AGENTS.md pointer) and .gitignore (.context.local/ entry)
- Each directory (.context/domain/, .context/decisions/, .context/constraints/) gets its own line in the summary
- .gitkeep files are implied by their parent directory line -- not shown separately
- Partial .context/ setups are filled silently -- the warning message and summary cover it, no special messaging needed
- Show an aligned list at the end with file paths left-aligned and statuses right-aligned
- Replace the per-step narration messages from Phase 2 -- no more "Created .context/MANIFEST.md" during execution, only the final summary
- Always include a count line at the bottom: "N created, N skipped, N updated"
- Commit prompt appears after the summary (same AskUserQuestion as Phase 2)
- Skip commit prompt if nothing was created or updated (0 created, all skipped, 0 updated)
- Keep Phase 2's existing resolution logic unchanged: local first, global fallback
- Same error message regardless of whether .context/ exists -- "Templates not found. Run the installer."
- Phase 3 verifies both paths work but does not change the resolution code

### Claude's Discretion
- Exact column alignment width for the summary
- Whether to use status symbols (checkmarks) alongside text statuses
- Internal implementation of status tracking (array, object, etc.)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INIT-07 | Init detects existing .context/ and warns user before proceeding | Replace Step 2 blocking prompt with non-blocking warning when .context/ directory exists |
| INIT-08 | Init resolves templates from global or local install | Step 1 already implements this -- Phase 3 verifies it works, no code changes needed |
| INIT-09 | Init prints summary showing each file with created/skipped/updated status | New summary step after all file operations; track status per-item throughout Steps 4-9 |
| INIT-10 | Running /dc:init twice is safe -- only creates what's missing | All steps already have existence checks; Phase 3 ensures second run reports all "skipped" |
</phase_requirements>

## Standard Stack

Not applicable -- this phase modifies a single markdown skill file. No libraries, frameworks, or dependencies involved.

### Technology in Use
| Asset | Location | Purpose |
|-------|----------|---------|
| Claude Code skill format | `commands/dc/init.md` | YAML frontmatter + objective/execution_context/process sections |
| Template files | `templates/*.md` | 8 template files consumed by dc:init |
| Validate script | `tools/validate-templates.sh` | Bash validation for template correctness |

## Architecture Patterns

### Current Skill Structure (init.md)
```
commands/dc/init.md
  Step 1: Resolve Template Path (unchanged)
  Step 2: Basic Safety Check (REPLACE with non-blocking warning)
  Step 3: Infer Project Metadata (unchanged)
  Step 4: Create .context/ Directory Structure (MODIFY: track status, remove narration)
  Step 5: Fill and Write MANIFEST.md (MODIFY: track status, remove narration)
  Step 6: Fill and Write ARCHITECTURE.md (MODIFY: track status, remove narration)
  Step 7: Inject AGENTS.md Snippet (MODIFY: track status, remove narration)
  Step 8: Handle CLAUDE.md (MODIFY: track status, remove narration)
  Step 9: Handle .gitignore (MODIFY: track status, remove narration)
  Step 10: Offer to Commit (MODIFY: add summary before prompt, skip if all skipped)
```

### Pattern: Status Tracking Through Steps

Each step that creates/checks files must record status for the summary. The skill instructions should tell Claude to maintain a tracking structure. Recommended approach: instruct Claude to maintain a list of `[path, status]` pairs that accumulates through Steps 4-9, then render as summary in Step 10.

Items to track (10 total):
1. `.context/MANIFEST.md` -- created/skipped
2. `.context/domain/` -- created/skipped
3. `.context/decisions/` -- created/skipped
4. `.context/constraints/` -- created/skipped
5. `ARCHITECTURE.md` -- created/skipped
6. `AGENTS.md` -- created/skipped/updated
7. `CLAUDE.md` -- created/skipped/updated
8. `.gitignore` -- created/skipped/updated

Note: Directories can be created or skipped (already exist). MANIFEST.md can be created or skipped. ARCHITECTURE.md can be created or skipped. AGENTS.md, CLAUDE.md, and .gitignore can be any of the three statuses.

### Pattern: Per-File Status Logic

The three-way status determination follows this pattern for append-capable files:

| File | "created" | "skipped" | "updated" |
|------|-----------|-----------|-----------|
| AGENTS.md | File didn't exist | Sentinel `<!-- domain-context:start -->` present | Snippet appended (no sentinel before) |
| CLAUDE.md | File didn't exist | `@AGENTS.md` already present | `@AGENTS.md` appended |
| .gitignore | File didn't exist | `.context.local/` already present | `.context.local/` appended |
| ARCHITECTURE.md | File didn't exist | File already exists | N/A (never appends) |
| MANIFEST.md | File didn't exist | File already exists | N/A (never appends) |
| Directories | Directory didn't exist | Directory already exists | N/A |

### Summary Output Format (from CONTEXT.md)

```
Domain Context initialized:

  .context/MANIFEST.md     created
  .context/domain/         created
  .context/decisions/      created
  .context/constraints/    created
  ARCHITECTURE.md          skipped
  AGENTS.md                updated
  CLAUDE.md                skipped
  .gitignore               updated

  5 created, 2 skipped, 1 updated
```

### Discretion Recommendations

- **Column alignment:** Use 25-character left column for paths (longest is `.context/constraints/` at 22 chars), pad with spaces to align statuses. The skill can simply instruct Claude to "present as an aligned table."
- **Status symbols:** Use plain text only (no checkmarks/emojis). Keeps output clean and avoids encoding issues in terminals.
- **Status tracking:** Instruct Claude to "maintain a results list" -- the AI will naturally use whatever internal representation works. No need to specify array vs object in skill instructions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File existence checks | Custom detection logic | Existing Step 4-9 patterns | Steps already have if-exists checks; just track the outcome |
| Summary formatting | Complex alignment code | Markdown-style aligned list in narration | Claude renders text naturally; just specify the format |

## Common Pitfalls

### Pitfall 1: MANIFEST.md Overwrite on Re-run
**What goes wrong:** Step 5 currently always writes MANIFEST.md (no existence check). A second run would overwrite a customized MANIFEST.md.
**Why it happens:** Phase 2 designed for first-run only; MANIFEST.md creation had no guard.
**How to avoid:** Add existence check to Step 5: if `.context/MANIFEST.md` exists, record "skipped" and move on.
**Warning signs:** Second run shows MANIFEST.md as "created" instead of "skipped."

### Pitfall 2: Directory Status Detection
**What goes wrong:** `mkdir -p` succeeds silently whether directory exists or not. Can't tell if it was created or already existed.
**Why it happens:** mkdir -p is idempotent by design but gives no feedback.
**How to avoid:** Check directory existence BEFORE calling mkdir. If exists, record "skipped." If not, create and record "created."

### Pitfall 3: .gitkeep Confusion in Summary
**What goes wrong:** .gitkeep files shown as separate lines bloat the summary.
**Why it happens:** Steps currently create .gitkeep files alongside directories.
**How to avoid:** Per CONTEXT.md decision: .gitkeep files are implied by their parent directory line. Don't show them separately. Still create them, but only show the directory in summary.

### Pitfall 4: Count Mismatch
**What goes wrong:** The "N created, N skipped, N updated" counts don't add up to total items.
**Why it happens:** Off-by-one when counting, or forgetting to track a file/directory.
**How to avoid:** Exactly 8 items tracked (4 dirs/files in .context/, plus ARCHITECTURE.md, AGENTS.md, CLAUDE.md, .gitignore). Counts must sum to 8.

### Pitfall 5: Metadata Inference Runs Unnecessarily
**What goes wrong:** Step 3 (Infer Project Metadata) runs even when everything will be skipped, potentially prompting the user for a description that won't be used.
**Why it happens:** Steps run sequentially regardless of what's needed.
**How to avoid:** Step 3 should still run (metadata is needed for MANIFEST.md and ARCHITECTURE.md), but the AskUserQuestion in Step 3 should only trigger if MANIFEST.md or ARCHITECTURE.md will actually be created. If both exist, metadata inference can be skipped entirely.

## Code Examples

### Current Step 2 (to be replaced)
```markdown
## Step 2: Basic Safety Check

Check if `.context/MANIFEST.md` already exists in the project root.

If it exists, ask the user using AskUserQuestion:
- Prompt: "This project already has a .context/ directory. Proceed anyway?"
- Options:
  1. "Yes -- proceed with initialization"
  2. "No -- stop (recommended)"
- If the user selects "No", stop execution.
```

### New Step 2 (non-blocking warning)
```markdown
## Step 2: Detect Existing Context

Check if `.context/` directory exists in the project root.

If it exists, display this message (do not ask a question, just inform):
"Existing .context/ detected. Only missing files will be created."

Continue to the next step regardless.
```

### New Step 5 with existence check (example)
```markdown
## Step 5: Fill and Write MANIFEST.md

1. Check if `.context/MANIFEST.md` already exists. If it does, record status "skipped" for `.context/MANIFEST.md` and move to the next step.
2. Read `manifest.md` from TEMPLATE_DIR.
3. Replace `{one_line_description}` with the inferred description.
4. Replace `{restricted_context_instructions}` with "Contact the project maintainer for access to restricted context."
5. Strip all HTML comments (`<!-- ... -->`) from the content.
6. Write the result to `.context/MANIFEST.md`.
7. Record status "created" for `.context/MANIFEST.md`.
```

## State of the Art

Not applicable -- Claude Code skill format is stable and project-specific. No external ecosystem changes affect this phase.

## Open Questions

1. **Metadata inference when all files exist**
   - What we know: Step 3 infers project description for MANIFEST.md and ARCHITECTURE.md. If both already exist, this work is wasted.
   - What's unclear: Should Step 3 be skipped entirely, or should it still run for potential future use?
   - Recommendation: Skip metadata inference (Step 3) if both MANIFEST.md and ARCHITECTURE.md already exist. This avoids unnecessary user prompts and speeds up re-runs.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual verification via dc:init execution in temp directory |
| Config file | none -- skill is tested by running it |
| Quick run command | Run `/dc:init` in a temp directory, verify output |
| Full suite command | `bash tools/validate-templates.sh` (template validation only) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INIT-07 | Warning shown when .context/ exists | manual | Run dc:init on project with existing .context/, verify warning text | N/A |
| INIT-08 | Templates resolve from global or local | manual | Run dc:init with templates in each location, verify both work | N/A |
| INIT-09 | Summary shows created/skipped/updated | manual | Run dc:init, verify summary format matches spec | N/A |
| INIT-10 | Second run is safe, all skipped | manual | Run dc:init twice, verify second run shows all "skipped" | N/A |

### Sampling Rate
- **Per task commit:** Review init.md diff for correctness
- **Per wave merge:** Run dc:init in fresh temp dir + run on already-initialized dir
- **Phase gate:** Both runs produce expected output; `bash tools/validate-templates.sh` still passes

### Wave 0 Gaps
None -- this phase modifies an existing skill file. No test framework setup needed. Verification is manual (run the skill, observe output).

## Sources

### Primary (HIGH confidence)
- `commands/dc/init.md` -- current skill implementation, read directly
- `.planning/phases/03-init-idempotency/03-CONTEXT.md` -- user decisions, read directly
- `.planning/REQUIREMENTS.md` -- requirement definitions, read directly

### Secondary (MEDIUM confidence)
- None needed -- this phase is entirely internal to the project

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no external dependencies, single file modification
- Architecture: HIGH - current skill structure fully understood, changes well-scoped
- Pitfalls: HIGH - identified from direct analysis of current code vs. requirements

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable -- no external dependencies)
