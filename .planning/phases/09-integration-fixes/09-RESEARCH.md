# Phase 9: Integration Bug Fixes - Research

**Researched:** 2026-03-16
**Domain:** Cross-phase integration quality (dc:add, dc:validate skill files)
**Confidence:** HIGH

## Summary

This phase fixes 3 minor integration bugs identified in the v1.0 milestone audit. All bugs are in markdown skill files (not runtime code), so the fixes are surgical text edits -- no new libraries, architecture changes, or test infrastructure needed.

The bugs stem from ordering issues (INT-01), copy-paste inconsistencies (INT-02), and missing edge-case guards (INT-03). Each fix is 1-3 lines changed in a single file. The fixes are fully specified in the audit report with exact line references and prescribed solutions.

The only non-trivial aspect is INT-01: the audit says "swap lines 92-93" but that alone is insufficient. Templates contain TWO kinds of HTML comments -- instructional guidance comments (e.g., `<!-- 2-4 sentences: ... -->`) that should be stripped, and the functional `<!-- verified: YYYY-MM-DD -->` comment that must be preserved. The fix must both reorder the steps AND update the strip instruction to preserve the verified comment.

**Primary recommendation:** Fix all 3 issues in a single plan with one task per bug. Each fix is independent and can be verified by reading the modified file.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADDC-04 | Add fills template sections from user's freeform description (conversational extraction) | INT-01 fix ensures `{verified_date}` token is replaced BEFORE HTML comments are stripped, so `<!-- verified: YYYY-MM-DD -->` survives in created files |
| REFR-04 | Refresh updates verified date in both context file and MANIFEST.md if content is still accurate | INT-01 fix ensures dc:add-created files have the inline verified comment that dc:refresh looks for when updating dates |
| EXPL-03 | User can run /dc:explore [keyword] to find and read a specific entry by name | INT-02 fix ensures orphan-registered entries use em dash matching the canonical MANIFEST.md format that dc:explore parses |
| VALD-05 | Validate offers to fix issues found (update MANIFEST.md, create missing files, update dates) | INT-02 fix (em dash in orphan registration) and INT-03 fix (mkdir -p before broken link file creation) both improve fix reliability |
</phase_requirements>

## Standard Stack

Not applicable -- this phase modifies existing markdown skill files only. No libraries or packages are involved.

## Architecture Patterns

### Files Being Modified

| File | Location | Bug IDs |
|------|----------|---------|
| `commands/dc/add.md` | Lines 92-93 in Step 5 | INT-01 |
| `commands/dc/validate.md` | Lines 62-64 in execution_context, Step 8 Broken Links fix point 7 | INT-02, INT-03 |

### Template HTML Comment Inventory (verified)

Templates contain two distinct kinds of HTML comments:

**Instructional comments (STRIP these):**
```markdown
<!-- 2-4 sentences: what this concept is and its role in the system -->
<!-- State transitions or stages this concept goes through -->
<!-- Important fields/properties and what they mean -->
<!-- Business rules that govern this concept -->
<!-- Conditions that must always be true for this concept -->
<!-- Links to other domain concepts and module context files -->
```

**Functional comment (PRESERVE this):**
```markdown
<!-- verified: {verified_date} -->
```

This distinction is critical for the INT-01 fix.

### Fix Details

#### INT-01: dc:add verified comment stripping (commands/dc/add.md)

**Current code (Step 5, lines 92-93):**
```markdown
4. Strip all HTML comments (`<!-- ... -->`) from the filled content.
5. Replace `{verified_date}` with today's date in YYYY-MM-DD format.
```

**Problem:** Step 4 removes the `<!-- verified: {verified_date} -->` comment before Step 5 can replace the token. Files created by dc:add lack the inline verified comment.

**Prescribed fix -- two changes:**

1. Swap the order (token replacement before stripping):
```markdown
4. Replace `{verified_date}` with today's date in YYYY-MM-DD format.
5. Strip HTML comments from the filled content, except for `<!-- verified: ... -->` lines (these are functional metadata, not guidance comments).
```

2. The strip instruction must explicitly preserve the verified comment. Without this, the swap alone still destroys the comment.

**Verification:** After the fix, mentally trace through `domain-concept.md` template:
- Step 4 replaces `{verified_date}` -> `<!-- verified: 2026-03-16 -->` on line 3
- Step 5 strips instructional comments (`<!-- 2-4 sentences: ... -->` etc.) but preserves the verified comment
- Result: created file contains `<!-- verified: 2026-03-16 -->` on line 3

#### INT-02: dc:validate orphan em dash format (commands/dc/validate.md)

**Current code (execution_context, lines 62-64):**
```markdown
- Domain concepts: `- [{Name}]({relative-path}) -- {placeholder description} [public] [verified: {today}]`
- Decisions: `- [{NNN}: {Title}]({relative-path}) -- {placeholder description} [verified: {today}]`
- Constraints: `- [{Name}]({relative-path}) -- {placeholder description} [public] [verified: {today}]`
```

**Prescribed fix -- replace `--` with em dash in all three lines:**
```markdown
- Domain concepts: `- [{Name}]({relative-path}) — {placeholder description} [public] [verified: {today}]`
- Decisions: `- [{NNN}: {Title}]({relative-path}) — {placeholder description} [verified: {today}]`
- Constraints: `- [{Name}]({relative-path}) — {placeholder description} [public] [verified: {today}]`
```

**Note:** The correct format uses ` — ` (space-em-dash-space), matching the canonical format already used in dc:add's execution_context (line 28-30) and dc:validate's own entry line format documentation (line 27).

#### INT-03: dc:validate broken link fix directory guard (commands/dc/validate.md)

**Current code (Step 8, Broken Links "Create" fix, point 7):**
```markdown
  7. Write the file to the expected path (`.context/` + the entry's relative path).
```

**Prescribed fix -- add mkdir -p before write:**
```markdown
  7. Ensure the target directory exists by running `mkdir -p` on the parent directory of the file path.
  8. Write the file to the expected path (`.context/` + the entry's relative path).
```

**Note:** Renumber subsequent point (old 8 becomes 9).

## Don't Hand-Roll

Not applicable -- fixes are text edits to existing skill files.

## Common Pitfalls

### Pitfall 1: INT-01 Fix Incomplete -- Stripping ALL HTML Comments After Token Replace
**What goes wrong:** Simply swapping lines 92-93 still strips the `<!-- verified: YYYY-MM-DD -->` comment because the strip step says "strip all HTML comments."
**Why it happens:** The original instruction does not distinguish between instructional comments and the functional verified-date comment.
**How to avoid:** Update the strip instruction wording to explicitly exclude `<!-- verified: ... -->` comments from stripping. The simplest wording: "Strip HTML comments from the filled content, except for `<!-- verified: ... -->` lines."
**Warning signs:** If the fixed Step 5 still says "Strip all HTML comments" -- the fix is incomplete.

### Pitfall 2: Numbering Shift in Step 8
**What goes wrong:** Adding a mkdir-p step in the broken link fix shifts subsequent numbered points.
**Why it happens:** The fix inserts a step between existing numbered points.
**How to avoid:** Renumber the subsequent point (old 7 "Write the file" becomes 8, old 8 "Record count" becomes 9).

### Pitfall 3: Missing Em Dash in Module Context Entry Format
**What goes wrong:** Only fixing domain/decision/constraint entry formats but missing the module context format.
**Why it happens:** Module context entries use a different format (`- {path} [verified: {today}]`) that does not include a description separator.
**How to avoid:** Verify: module context format on line 65 uses no dash separator -- only the three formats on lines 62-64 need the fix.

## Code Examples

### Template Verified Date Pattern (verified from templates/domain-concept.md line 3)
```markdown
<!-- verified: {verified_date} -->
```

All four template files (domain-concept.md, decision.md, constraint.md, context.md) have this on line 3.

### MANIFEST.md Canonical Entry Format (from dc:add execution_context)
```markdown
- [Integration Model](domain/integration-model.md) — One-line description [public] [verified: 2026-03-16]
```

Note: em dash ` — ` (U+2014), not double-dash ` -- `.

### dc:validate Broken Link Fix -- Current Step 8 Structure (lines 199-214)

The "Create missing files" path currently has 8 numbered sub-steps. The mkdir-p guard inserts between steps 6 (strip HTML comments) and 7 (write file), shifting write to 8 and record-count to 9.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual verification (markdown skill files, no automated tests) |
| Config file | none |
| Quick run command | Read modified lines in changed files |
| Full suite command | Read both skill files end-to-end, trace logic for each fix |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADDC-04 | dc:add created files include verified inline comment | manual-only | Read `commands/dc/add.md` Step 5, verify token replace before comment strip and verified comment exemption | N/A |
| REFR-04 | dc:refresh can find verified date in dc:add-created files | manual-only | Trace dc:add Step 5 output through dc:refresh date-finding logic | N/A |
| EXPL-03 | dc:validate orphan registration uses em dash | manual-only | Read `commands/dc/validate.md` execution_context orphan entry formats, verify em dash | N/A |
| VALD-05 | dc:validate broken link fix handles missing dirs | manual-only | Read `commands/dc/validate.md` Step 8 Broken Links fix, verify mkdir-p before write | N/A |

### Sampling Rate
- **Per task commit:** Read the modified file, verify the specific lines changed
- **Per wave merge:** Read both skill files end-to-end, trace all 3 fixes
- **Phase gate:** Full read of both files confirms fixes applied correctly

### Wave 0 Gaps
None -- no test infrastructure needed. These are markdown skill file edits verified by reading.

## Sources

### Primary (HIGH confidence)
- `.planning/v1.0-MILESTONE-AUDIT.md` -- exact bug descriptions, affected requirements, prescribed fixes
- `commands/dc/add.md` -- current dc:add skill file (lines 92-93 confirmed as the bug location)
- `commands/dc/validate.md` -- current dc:validate skill file (lines 62-64 for INT-02, Step 8 for INT-03)
- `templates/domain-concept.md` -- verified line 3 contains `<!-- verified: {verified_date} -->` and lines 7/12/17/22/27/32 contain instructional comments
- `templates/decision.md`, `templates/constraint.md` -- same verified comment pattern on line 3

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no stack, just text edits to markdown files
- Architecture: HIGH - exact files and line numbers verified by reading source
- Pitfalls: HIGH - the INT-01 nuance (comment preservation) discovered and documented with evidence from template files

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable -- fixes to existing files with no external dependencies)
