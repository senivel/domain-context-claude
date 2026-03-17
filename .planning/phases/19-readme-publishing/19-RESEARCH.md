# Phase 19: README & Publishing - Research

**Researched:** 2026-03-17
**Domain:** Technical documentation (README.md for npm package)
**Confidence:** HIGH

## Summary

This phase is a documentation-only effort: rewriting the existing README.md to meet the five DOC requirements. The existing README already has the correct section structure and covers all five areas at a surface level. The work is expanding depth (per-command paragraphs, prerequisites line, badges) and ensuring accuracy against the actual installer behavior and skill frontmatter descriptions.

No new libraries, build steps, or code changes are needed. The source of truth for each section already exists in the codebase: command descriptions in `commands/dc/*.md` frontmatter, install/uninstall behavior in `bin/install.js`, and the GSD bridge pattern already documented in the current README.

**Primary recommendation:** Treat this as a single-plan rewrite of README.md, using existing codebase artifacts as source material. No research into external tools or patterns needed beyond badge URL formatting.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- One paragraph per command below the summary table -- table for quick scan, paragraph for "what it does and when to use it"
- No usage examples -- commands are self-explanatory slash commands, not CLI tools
- Only document flags/options where they exist (e.g., dc:init GSD detection)
- Flat list of all 6 commands -- no grouping (small enough to scan)
- Primary audience: Claude Code users who already know the Domain Context spec -- they need install + commands, not a spec tutorial
- One-sentence intro + link to spec repo for anyone unfamiliar
- Concise and practical tone -- short sentences, action-oriented, no marketing language
- No "Why" or "Philosophy" section -- the spec repo handles that
- Keep the existing "What Gets Installed" section -- users want to know what touches their .claude/ directory
- Add one-line prerequisites: "Requires Node.js 20+ and Claude Code"
- No "How It Works" section -- GSD Integration section covers the bridge pattern, hooks/rules are self-explanatory
- Minimal badges at the top: npm version + license

### Claude's Discretion
- Exact wording of per-command paragraphs
- Badge formatting and placement
- Section ordering within the existing structure

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOC-01 | README has install command (`npx domain-context-cc`) | Existing README already has this; verify accuracy against `bin/install.js` flags |
| DOC-02 | README has quick start section (install -> `/dc:init` -> start working) | Existing README has 3-step quick start; keep as-is or expand minimally |
| DOC-03 | README has command reference for all 6 dc:* skills | Existing table present; add per-command paragraphs from skill frontmatter descriptions |
| DOC-04 | README has GSD integration section explaining the bridge pattern | Existing 4-bullet section present; verify completeness |
| DOC-05 | README has uninstall instructions | Existing README has `npx domain-context-cc --uninstall` in install block |
</phase_requirements>

## Standard Stack

Not applicable -- this phase produces only a markdown file (README.md). No libraries or dependencies involved.

## Architecture Patterns

### Current README Structure (to preserve/expand)
```
README.md
  - Badges (NEW: npm version + license)
  - Title + one-liner description
  - Prerequisites line (NEW)
  - Installation (3 commands: global, local, uninstall)
  - Quick Start (3 steps)
  - Commands (table + NEW per-command paragraphs)
  - GSD Integration (4-bullet bridge pattern)
  - What Gets Installed (5 categories)
  - Links
```

### Badge Format
Standard shields.io badges for npm packages:

```markdown
[![npm version](https://img.shields.io/npm/v/domain-context-cc)](https://www.npmjs.com/package/domain-context-cc)
[![license](https://img.shields.io/npm/l/domain-context-cc)](https://github.com/senivel/domain-context-claude/blob/main/LICENSE)
```

Source: [Shields.io NPM Version Badge](https://shields.io/badges/npm-version) (HIGH confidence)

### Per-Command Paragraph Pattern
Each command gets: one paragraph below the table explaining what it does and when to use it. Source material is the `description` field from each skill's YAML frontmatter in `commands/dc/*.md`.

| Command | Frontmatter Description (source of truth) |
|---------|-------------------------------------------|
| dc:init | Initialize Domain Context in the current project. Creates .context/ directory with MANIFEST.md, domain/, decisions/, and constraints/ subdirectories. Scaffolds ARCHITECTURE.md, wires AGENTS.md with domain-context snippet, and creates CLAUDE.md with @AGENTS.md pointer. |
| dc:explore | Browse and search domain context in the current project. Shows summary of all entries with freshness status, supports keyword search, and lets you drill into specific entries. |
| dc:validate | Check structural integrity of domain context. Reports broken links, orphan files, stale entries, and AGENTS.md imports. Offers to fix issues found. |
| dc:add | Add a new domain concept, architecture decision, or constraint from a freeform description. Creates the file and updates MANIFEST.md. |
| dc:refresh | Review stale domain context entries and update them based on current code reality. Identifies entries older than 90 days, assesses accuracy against source code, and proposes updates. |
| dc:extract | Extract domain knowledge from completed GSD phases into .context/ entries. Scans planning artifacts, classifies findings, and lets you selectively create domain concepts, decisions, and constraints. |

### Install/Uninstall Commands (verified from bin/install.js)
```bash
# Global install (recommended)
npx domain-context-cc

# Local install (project-specific)
npx domain-context-cc --local

# Uninstall
npx domain-context-cc --uninstall
```

The `--uninstall` flag removes dc-prefixed files from the target `.claude/` directory and removes dc hook entries from `settings.json`. It uses the same INSTALL_MAP for symmetric removal. No `--local --uninstall` combination is shown in the current README but the code supports it (uninstall defaults to global just like install).

### Anti-Patterns to Avoid
- **Duplicating spec content:** The README links to the spec repo; it does not explain what Domain Context is in detail.
- **Usage examples for slash commands:** These are interactive commands, not CLI tools. No `--flag` syntax to document.
- **Over-explaining hooks/rules:** The "What Gets Installed" section lists them; users do not configure them directly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Badges | Custom SVG/HTML | shields.io URLs | Standard, auto-updating, widely recognized |
| License file | N/A | Verify LICENSE file exists in repo root | Badge links to it; must exist |

## Common Pitfalls

### Pitfall 1: Badge Links to Non-Existent npm Package
**What goes wrong:** Badge shows "not found" if package is not yet published to npm.
**Why it happens:** Shields.io queries npm registry in real-time.
**How to avoid:** Badges will work once published. Note in README PR that badges activate on first `npm publish`.
**Warning signs:** Badge shows gray "not found" instead of version number.

### Pitfall 2: Stale Command Descriptions
**What goes wrong:** README describes commands differently than the actual skill frontmatter.
**Why it happens:** README written independently of source files.
**How to avoid:** Use `commands/dc/*.md` frontmatter `description` fields as the source of truth. The planner should direct the implementer to read these files.

### Pitfall 3: Missing --local --uninstall Combination
**What goes wrong:** Users who installed locally cannot figure out how to uninstall locally.
**Why it happens:** Current README only shows `--uninstall` without mentioning `--local --uninstall`.
**How to avoid:** Document both: `npx domain-context-cc --uninstall` (global) and `npx domain-context-cc --local --uninstall` (local).

### Pitfall 4: Missing LICENSE File
**What goes wrong:** License badge links to a file that does not exist.
**Why it happens:** package.json declares `"license": "MIT"` but no LICENSE file may exist at repo root.
**How to avoid:** Verify LICENSE file exists before adding badge. If missing, create it as part of this phase.

## Code Examples

Not applicable -- this phase produces markdown content only.

## State of the Art

Not applicable -- README formatting conventions are stable.

## Open Questions

1. **LICENSE file existence**
   - What we know: package.json has `"license": "MIT"`
   - What's unclear: Whether a LICENSE file exists at repo root
   - Recommendation: Check during implementation; create if missing

2. **Local uninstall documentation**
   - What we know: `bin/install.js` supports `--local --uninstall` combination
   - What's unclear: Whether this should be documented or if it clutters the README
   - Recommendation: Include it inline in the uninstall section (one extra line, high value)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | none |
| Quick run command | `node --test tests/` |
| Full suite command | `node --test tests/` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOC-01 | README contains `npx domain-context-cc` | smoke (grep) | `grep -q 'npx domain-context-cc' README.md` | N/A (inline check) |
| DOC-02 | README has quick start section | smoke (grep) | `grep -q 'Quick Start' README.md` | N/A (inline check) |
| DOC-03 | README has all 6 command names | smoke (grep) | `grep -c 'dc:' README.md` (expect >= 6 unique) | N/A (inline check) |
| DOC-04 | README has GSD integration section | smoke (grep) | `grep -q 'GSD Integration' README.md` | N/A (inline check) |
| DOC-05 | README has uninstall instructions | smoke (grep) | `grep -q '\-\-uninstall' README.md` | N/A (inline check) |

### Sampling Rate
- **Per task commit:** Visual review of rendered README + grep checks above
- **Per wave merge:** Full grep validation suite
- **Phase gate:** All 5 grep checks pass

### Wave 0 Gaps
None -- documentation validation uses simple grep checks, no test infrastructure needed.

## Sources

### Primary (HIGH confidence)
- `commands/dc/*.md` frontmatter - Source of truth for all 6 command descriptions
- `bin/install.js` - Source of truth for install flags and uninstall behavior
- `package.json` - Package name, version, repository URL, license
- Existing `README.md` - Current structure to preserve and expand

### Secondary (MEDIUM confidence)
- [Shields.io NPM Version Badge](https://shields.io/badges/npm-version) - Badge URL format

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No libraries involved, pure markdown
- Architecture: HIGH - Existing README structure verified, expansion points clear
- Pitfalls: HIGH - Identified from direct code inspection

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable domain, no moving parts)
