# Phase 2: Init Core - Research

**Researched:** 2026-03-12
**Domain:** Claude Code skill authoring, file scaffolding, template resolution
**Confidence:** HIGH

## Summary

Phase 2 creates `commands/dc/init.md` -- the first Claude Code skill in this project. The skill reads template files from the install location, infers project metadata for placeholder filling, and creates the complete `.context/` directory structure plus root-level files (ARCHITECTURE.md, AGENTS.md, CLAUDE.md, .gitignore entry). This is a pure skill file (no helper scripts) that uses Claude's built-in tools (Read, Write, Bash, Glob) to do all work.

The primary complexity is not in the file creation itself (straightforward Read + Write operations) but in three areas: (1) the template resolution logic (local vs global install paths), (2) placeholder inference across multiple language ecosystems, and (3) the append-safe injection patterns for AGENTS.md, CLAUDE.md, and .gitignore that must handle both fresh and existing projects.

**Primary recommendation:** Structure the skill as a linear process with clear steps: resolve templates, infer metadata, fill templates, create files in order, narrate each step. Keep the skill under 300 lines -- the logic is procedural and doesn't need complex branching.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Pure skill file: single markdown file at commands/dc/init.md
- No helper scripts -- Claude reads templates and writes files directly using its tools
- YAML frontmatter with allowed-tools: Read, Write, Bash, Glob
- Use /skill-creator skill when building to ensure best practices are followed
- No arguments -- operates on current working directory
- Template resolution: search .claude/domain-context/templates/ (local) first, fall back to ~/.claude/domain-context/templates/ (global)
- Placeholder inference: project metadata files first, README.md fallback, directory name fallback
- When inference finds nothing: prompt user using AskUserQuestion with GSD interaction pattern
- Full set created: .context/MANIFEST.md, .context/domain/.gitkeep, .context/decisions/.gitkeep, .context/constraints/.gitkeep, ARCHITECTURE.md, AGENTS.md, CLAUDE.md, .gitignore entry
- Narrate each step as it happens
- Offer to commit created files at the end
- AGENTS.md injection: create/append/skip based on sentinel comment detection
- CLAUDE.md handling: create/append/skip based on @AGENTS.md detection
- .gitignore handling: append .context.local/ if not present, create if needed
- Templates already exist in templates/ directory from Phase 1 -- this phase reads and fills them
- All user prompts must follow GSD's interaction pattern: AskUserQuestion with concrete options, recommended choice, and built-in "Other"

### Claude's Discretion
- Exact inference priority chain across language ecosystems
- Whether to add a basic safety check for existing .context/ or defer entirely to Phase 3
- Exact output formatting for narration messages
- Commit message wording

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INIT-01 | User can run /dc:init to create .context/ directory with MANIFEST.md | Skill file structure, template resolution pattern, placeholder filling logic |
| INIT-02 | Init creates domain/, decisions/, constraints/ subdirectories with .gitkeep | File creation sequence in skill process section |
| INIT-03 | Init scaffolds ARCHITECTURE.md skeleton if file doesn't already exist | Conditional file creation pattern, placeholder filling for {system_purpose} |
| INIT-04 | Init appends AGENTS.md snippet idempotently (sentinel comment prevents duplicate injection) | Sentinel detection pattern using Grep/Read, append-safe injection |
| INIT-05 | Init creates thin CLAUDE.md with @AGENTS.md pointer if file doesn't already exist | Conditional create/append pattern |
| INIT-06 | Init adds .context.local/ to .gitignore (append if not already present) | Grep-based detection, append pattern |

</phase_requirements>

## Standard Stack

### Core
| Component | Format | Purpose | Why Standard |
|-----------|--------|---------|--------------|
| commands/dc/init.md | Claude Code skill (markdown) | The dc:init slash command | Claude Code's native skill format -- YAML frontmatter + markdown body |
| templates/*.md | Markdown with {placeholder} tokens | Source templates for scaffolding | Already built in Phase 1, verified against spec |

### Supporting
| Tool | Used By | Purpose | When to Use |
|------|---------|---------|-------------|
| Read | Skill | Load templates from install path, check existing files | Template resolution, file existence checks |
| Write | Skill | Create new files, write filled templates | All file creation |
| Bash | Skill | mkdir -p, check directories, git operations | Directory creation, commit offer |
| Glob | Skill | Find template files, detect project metadata files | Template resolution, inference |
| AskUserQuestion | Skill | Prompt user when inference fails, commit offer | Fallback for {one_line_description}, end-of-flow commit |

### No Alternatives Needed
This phase uses only Claude Code's built-in tools. No external libraries, no npm packages, no runtime dependencies.

## Architecture Patterns

### Project Structure After Init
```
target-project/
├── .context/
│   ├── MANIFEST.md          # From templates/manifest.md, filled
│   ├── domain/
│   │   └── .gitkeep
│   ├── decisions/
│   │   └── .gitkeep
│   └── constraints/
│       └── .gitkeep
├── ARCHITECTURE.md           # From templates/architecture.md, partially filled
├── AGENTS.md                 # Existing + injected snippet, or new with snippet
├── CLAUDE.md                 # Existing + @AGENTS.md, or new from template
└── .gitignore                # Existing + .context.local/, or new
```

### Pattern 1: Claude Code Skill File Structure
**What:** A markdown file with YAML frontmatter and structured sections that Claude Code loads when the user invokes the slash command.
**When to use:** For every dc:* command.
**Example:**
```markdown
---
name: dc:init
description: Initialize Domain Context in the current project. Creates .context/ directory structure, MANIFEST.md, ARCHITECTURE.md skeleton, and wires AGENTS.md and CLAUDE.md. Use when setting up domain context for a new or existing project.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - AskUserQuestion
---

<objective>
Initialize a complete Domain Context setup in the current working directory.
</objective>

<execution_context>
[Template paths, current directory info]
</execution_context>

<process>
[Step-by-step instructions for Claude to follow]
</process>
```

### Pattern 2: Template Resolution (Local-First Fallback)
**What:** Check local install path first, fall back to global.
**When to use:** Every time the skill needs to read a template.
**Example logic in skill:**
```
1. Check if .claude/domain-context/templates/ exists in current project
2. If yes, use that path
3. If no, use ~/.claude/domain-context/templates/
4. If neither exists, error with guidance to run the installer
```

### Pattern 3: Append-Safe Injection (Sentinel Pattern)
**What:** Use HTML comment sentinels to detect whether content has already been injected.
**When to use:** AGENTS.md injection (<!-- domain-context:start/end --> sentinels).
**How it works:**
```
1. Read target file (or note it doesn't exist)
2. Search for sentinel string
3. If sentinel found: skip (already injected)
4. If file exists but no sentinel: append content after existing content
5. If file doesn't exist: create with content
```

### Pattern 4: Metadata Inference Chain
**What:** Try multiple sources to infer project description, falling back gracefully.
**Recommended priority chain:**
1. package.json -> "description" field
2. pyproject.toml -> [project] description
3. Cargo.toml -> [package] description
4. go.mod -> module name (derive project name)
5. setup.py/setup.cfg -> description
6. composer.json -> description
7. README.md -> first non-heading, non-badge paragraph
8. Directory name / git remote name
9. AskUserQuestion fallback

**Why this order:** JSON/TOML metadata fields are structured and unambiguous. README requires parsing prose. Directory name is least informative.

### Anti-Patterns to Avoid
- **Over-engineering the skill:** The skill is instructions for Claude, not executable code. Don't write it like a program with error handling branches -- write it like a clear procedure Claude follows.
- **Hardcoding template content:** The skill must READ templates from the install location, not contain template content inline. Templates are maintained separately and the skill must always use the current versions.
- **Modifying existing file content:** For AGENTS.md and CLAUDE.md, only append or create -- never rewrite or reorder existing content. Users may have custom content that must be preserved.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Template placeholder filling | Custom regex engine | Claude's native string understanding | Claude reads the template, understands {placeholder} tokens, and writes the filled version. No code needed. |
| File existence checks | Shell scripts | Read tool + error handling | Claude can attempt to Read a file; if it doesn't exist, it knows to create it. |
| TOML/JSON parsing for inference | Parser libraries | Claude's native ability to read these formats | Claude can read package.json or pyproject.toml and extract the description field directly. |
| Directory creation | Complex mkdir logic | `mkdir -p` via Bash | Single command handles nested creation and is idempotent. |

**Key insight:** Since dc:init is a Claude Code skill (instructions for Claude, not executable code), most "implementation" is just clear procedural instructions. Claude's built-in capabilities handle file I/O, text parsing, and user interaction natively.

## Common Pitfalls

### Pitfall 1: Template Path Not Found
**What goes wrong:** Skill can't find templates because neither local nor global install path exists.
**Why it happens:** User ran /dc:init before running the installer, or the installer path changed.
**How to avoid:** Check both paths explicitly at the start of the process. If neither exists, provide a clear error message with install instructions.
**Warning signs:** "File not found" errors on template reads.

### Pitfall 2: Overwriting Existing AGENTS.md Content
**What goes wrong:** Existing AGENTS.md gets clobbered instead of having the snippet appended.
**Why it happens:** Using Write to create the file instead of appending to existing content.
**How to avoid:** Always Read first, then Write the full content (existing + appended snippet). The skill instructions must emphasize "read existing content, then write existing + new".
**Warning signs:** User's existing AGENTS.md sections disappear after init.

### Pitfall 3: Duplicate Sentinel Blocks
**What goes wrong:** Running init twice adds the domain-context snippet twice to AGENTS.md.
**Why it happens:** Sentinel detection fails or is skipped.
**How to avoid:** The sentinel check must be the FIRST step before any injection. Search for `<!-- domain-context:start -->` in the file content.
**Warning signs:** AGENTS.md contains two copies of the Project Context section.

### Pitfall 4: Placeholder Left Unfilled
**What goes wrong:** MANIFEST.md or ARCHITECTURE.md contains literal `{placeholder}` text.
**Why it happens:** Inference chain returns nothing and the fallback prompt is skipped.
**How to avoid:** After filling templates, verify no `{...}` tokens remain in critical files (MANIFEST.md). For ARCHITECTURE.md, unfilled placeholders are expected (replaced with TODO comments per CONTEXT.md decisions).
**Warning signs:** Literal curly-brace tokens in created files.

### Pitfall 5: HTML Guidance Comments Left in Output
**What goes wrong:** Created files contain `<!-- ... -->` guidance comments from templates.
**Why it happens:** The skill doesn't instruct Claude to strip them during template filling.
**How to avoid:** Skill instructions must explicitly state: "Remove all HTML comments (<!-- ... -->) from templates when filling them." This was noted in the CONTEXT.md code_context as an established pattern.
**Warning signs:** HTML comments visible in created .context/ files.

### Pitfall 6: AskUserQuestion Not Available
**What goes wrong:** Skill tries to use AskUserQuestion but it's not in allowed-tools.
**Why it happens:** Forgot to list it in the frontmatter.
**How to avoid:** Ensure allowed-tools includes AskUserQuestion. This is needed for: fallback description prompt, commit offer at end.
**Warning signs:** Claude can't prompt the user and either guesses or errors.

## Code Examples

### Skill Frontmatter
```yaml
---
name: dc:init
description: Initialize Domain Context in the current project. Creates .context/ directory with MANIFEST.md, domain/, decisions/, and constraints/ subdirectories. Scaffolds ARCHITECTURE.md, wires AGENTS.md with domain-context snippet, and creates CLAUDE.md with @AGENTS.md pointer. Use when starting domain context on a new or existing project.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - AskUserQuestion
---
```

### Template Resolution Logic (Skill Instructions)
```markdown
## Step 1: Resolve Template Path

1. Check if `.claude/domain-context/templates/` exists in the current project directory
2. If it exists, set TEMPLATE_DIR to that path
3. If not, check if `~/.claude/domain-context/templates/` exists
4. If it exists, set TEMPLATE_DIR to that path
5. If neither exists, tell the user:
   "Domain Context templates not found. Run the installer first:
   `npx domain-context-cc` (global) or `npx domain-context-cc --local` (local)"
   Then stop.
```

### AGENTS.md Injection Logic (Skill Instructions)
```markdown
## Step N: Inject AGENTS.md Snippet

1. Read the agents snippet template from {TEMPLATE_DIR}/agents-snippet.md
2. Try to read AGENTS.md from the project root
3. If AGENTS.md does not exist:
   - Create AGENTS.md with just the snippet content
   - Report: "Created AGENTS.md with domain-context snippet"
4. If AGENTS.md exists:
   - Search its content for "<!-- domain-context:start -->"
   - If found: report "AGENTS.md already has domain-context snippet -- skipped"
   - If not found: append two blank lines + the snippet to the end
   - Report: "Appended domain-context snippet to AGENTS.md"
```

### Placeholder Inference Logic (Skill Instructions)
```markdown
## Step 2: Infer Project Metadata

Try these sources in order to find the project description:

1. Read package.json -- use the "description" field
2. Read pyproject.toml -- use [project].description
3. Read Cargo.toml -- use [package].description
4. Read composer.json -- use the "description" field
5. Read setup.cfg -- use [metadata].description
6. Read go.mod -- derive project name from module path
7. Read README.md -- use the first substantive paragraph (skip badges, headings, blank lines)
8. Use the directory name, converted to title case with hyphens replaced by spaces

If none of these produce a useful description, ask the user:
"I couldn't detect a project description automatically. What does this project do?"
[Options: user provides description via AskUserQuestion]

For {system_purpose} in ARCHITECTURE.md, use the same description expanded to 2-4 sentences.
For {restricted_context_instructions}, use: "Contact the project maintainer for access to restricted context."
For remaining ARCHITECTURE.md placeholders ({module_rows}, {data_flow}, {key_boundaries}, {technology_decisions}), replace with TODO comments.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MCP-based init | Pure skill file | ADR-003 (MVP decision) | No server needed, simpler install |
| Shell script scaffolding | Claude-native file operations | Project design decision | Claude reads/writes directly, no script maintenance |
| Interactive wizard | Infer-first, ask-fallback | CONTEXT.md decision | Faster UX, fewer prompts |

**Relevant:** Claude Code skills are the current standard for extending Claude Code with custom commands. The format is YAML frontmatter + markdown body with `<objective>`, optional `<execution_context>`, and `<process>` sections (based on skill-creator documentation and existing GSD skills).

## Open Questions

1. **Should the skill check for existing .context/ before proceeding?**
   - What we know: Phase 3 adds full idempotency (INIT-07, INIT-10). This phase is "fresh project" focused.
   - What's unclear: Whether a basic "hey, .context/ already exists -- proceed?" check adds safety without overcomplicating Phase 2.
   - Recommendation: Add a simple check -- if .context/MANIFEST.md exists, warn the user and ask whether to proceed. This is minimal effort and prevents accidental overwrites before Phase 3 hardens idempotency. Marked as Claude's Discretion in CONTEXT.md.

2. **AskUserQuestion tool availability**
   - What we know: GSD skills use it. The CONTEXT.md specifies using it for user prompts.
   - What's unclear: Whether AskUserQuestion is always available or needs explicit allowed-tools listing.
   - Recommendation: Include it in allowed-tools to be safe. If it's always available, the listing is harmless.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual UAT (skill produces files, verify files exist with correct content) |
| Config file | none |
| Quick run command | `bash tools/validate-context.sh .` (validates created .context/ structure) |
| Full suite command | Manual: run /dc:init on a fresh temp directory, verify all 6 success criteria |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INIT-01 | .context/MANIFEST.md created from template | smoke | `test -f .context/MANIFEST.md && grep -q "Context Manifest" .context/MANIFEST.md` | N/A (manual) |
| INIT-02 | Subdirectories with .gitkeep | smoke | `test -f .context/domain/.gitkeep && test -f .context/decisions/.gitkeep && test -f .context/constraints/.gitkeep` | N/A (manual) |
| INIT-03 | ARCHITECTURE.md skeleton exists | smoke | `test -f ARCHITECTURE.md && grep -q "System Purpose" ARCHITECTURE.md` | N/A (manual) |
| INIT-04 | AGENTS.md has sentinel snippet | smoke | `grep -q "domain-context:start" AGENTS.md` | N/A (manual) |
| INIT-05 | CLAUDE.md has @AGENTS.md | smoke | `grep -q "@AGENTS.md" CLAUDE.md` | N/A (manual) |
| INIT-06 | .gitignore has .context.local/ | smoke | `grep -q ".context.local/" .gitignore` | N/A (manual) |

### Sampling Rate
- **Per task commit:** Run smoke checks on a temp directory after skill creation
- **Per wave merge:** Full manual UAT: /dc:init on fresh project, verify all 6 criteria
- **Phase gate:** All 6 success criteria pass before /gsd:verify-work

### Wave 0 Gaps
- [ ] `commands/dc/` directory -- needs to be created (first skill)
- [ ] No automated test framework -- this is a skill file (markdown), not executable code. Testing is UAT-based: run the skill, check outputs.

## Sources

### Primary (HIGH confidence)
- Project templates (templates/*.md) -- read directly, verified in Phase 1
- Domain Context spec (~/code/domain-context/SPEC.md) -- authoritative format reference
- CONTEXT.md decisions -- user's locked implementation choices
- Existing GSD skills (~/.claude/commands/gsd/*.md) -- Claude Code skill format reference
- Skill Creator SKILL.md -- skill authoring best practices and format documentation

### Secondary (MEDIUM confidence)
- Integration model (.context/domain/integration-model.md) -- domain context lifecycle

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - this is a markdown skill file using built-in Claude Code tools, no external dependencies
- Architecture: HIGH - file creation patterns are straightforward, template format is verified from Phase 1
- Pitfalls: HIGH - identified from existing project patterns and CONTEXT.md specifics

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- skill format and templates are unlikely to change)
