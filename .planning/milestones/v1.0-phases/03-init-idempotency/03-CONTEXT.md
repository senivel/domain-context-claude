# Phase 3: Init Idempotency - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Make dc:init safe and informative when re-run on an existing project. Nothing is overwritten, only missing files are created, and the user sees a summary of what happened. This phase modifies the existing dc:init skill (commands/dc/init.md) to add idempotent behavior and summary output. No new skills or files are created.

</domain>

<decisions>
## Implementation Decisions

### Warning behavior
- Remove the Phase 2 "Proceed anyway?" AskUserQuestion prompt entirely
- When .context/ directory exists, show a non-blocking warning: "Existing .context/ detected. Only missing files will be created." and continue automatically
- Only trigger the warning when .context/ directory exists — AGENTS.md or ARCHITECTURE.md existing alone does not trigger a warning
- Always run through all steps even when everything exists — the summary confirms idempotency (INIT-10)

### Per-file status logic
- Three statuses: created (new file written), skipped (file already exists, no change), updated (existing file modified by append)
- AGENTS.md snippet appended = "updated"; sentinel already present = "skipped"; file didn't exist = "created"
- Same logic for CLAUDE.md (@AGENTS.md pointer) and .gitignore (.context.local/ entry)
- Each directory (.context/domain/, .context/decisions/, .context/constraints/) gets its own line in the summary
- .gitkeep files are implied by their parent directory line — not shown separately
- Partial .context/ setups are filled silently — the warning message and summary cover it, no special messaging needed

### Summary output
- Show an aligned list at the end with file paths left-aligned and statuses right-aligned
- Replace the per-step narration messages from Phase 2 — no more "Created .context/MANIFEST.md" during execution, only the final summary
- Always include a count line at the bottom: "N created, N skipped, N updated"
- Commit prompt appears after the summary (same AskUserQuestion as Phase 2)
- Skip commit prompt if nothing was created or updated (0 created, all skipped, 0 updated)

### Template resolution
- Keep Phase 2's existing resolution logic unchanged: local (.claude/domain-context/templates/) first, global (~/.claude/domain-context/templates/) fallback
- Same error message regardless of whether .context/ exists — "Templates not found. Run the installer."
- Phase 3 verifies both paths work but does not change the resolution code

### Claude's Discretion
- Exact column alignment width for the summary
- Whether to use status symbols (checkmarks) alongside text statuses
- Internal implementation of status tracking (array, object, etc.)

</decisions>

<specifics>
## Specific Ideas

- Summary format follows this pattern:
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
- Second run should show all items as "skipped" with "0 created, N skipped, 0 updated"

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- commands/dc/init.md: The existing dc:init skill with 10 steps — Phase 3 modifies this file
- Templates already exist in templates/ directory (8 files from Phase 1)

### Established Patterns
- AskUserQuestion with concrete options, recommended choice, built-in "Other"
- Step-by-step narration ("Created X", "Skipped Y") — Phase 3 replaces this with summary
- Template resolution: local-first, global-fallback (Step 1 of init.md)

### Integration Points
- commands/dc/init.md is the only file that needs modification
- Phase 2's basic safety check (Step 2) is removed and replaced with warn-and-continue
- Per-step narration messages throughout Steps 4-9 are removed in favor of summary at end

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-init-idempotency*
*Context gathered: 2026-03-13*
