# Stack Research

**Domain:** Claude Code skill development (file scaffolding, manifest parsing, validation)
**Researched:** 2026-03-11
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Claude Code Skill Format | current | Skill definition via markdown + YAML frontmatter | Only format Claude Code supports. YAML frontmatter (`name`, `description`, `allowed-tools`, `argument-hint`) + `<objective>`, `<execution_context>`, `<process>` body sections. |
| Node.js | >= 20 LTS | Hooks, validation tooling, installer | Project constraint: no runtime deps. Node 20+ gives stable `fs/promises`, `path`, `readline` built-ins. Already on v24.14.0 locally. |
| Bash | 3.2+ (macOS default) | validate-context.sh validation script | Shell-based validation matches the upstream Domain Context spec's existing tooling pattern. Must work on macOS default bash (no bash 5+ features). |
| Markdown | n/a | All skill files, templates, rules, agents | Claude Code's native configuration format. No alternatives exist. |

### Supporting Libraries

None. This project has a hard constraint of zero runtime dependencies (Node.js built-ins only), matching GSD's pattern. Everything below describes built-in Node.js APIs used directly.

| Built-in API | Purpose | When to Use |
|--------------|---------|-------------|
| `fs` (sync) | Read/write templates, manifest files in hooks | Hooks and install scripts where async is unnecessary overhead |
| `fs/promises` | Async file operations in longer-running scripts | Installer, validation tooling |
| `path` | Cross-platform path resolution for template locations | Every skill that resolves template paths (global vs local install) |
| `process.stdin` | Read JSON input in hooks | All hooks (SessionStart, PostToolUse) |
| `process.stdout` | Write JSON output from hooks | All hooks returning `additionalContext` or `decision` |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `npm pack` | Test package before publishing | Run `npm pack && npx ./domain-context-cc-*.tgz` to test full install flow |
| `bash tools/validate-context.sh .` | Validate this project's own .context/ | Dogfooding: project validates itself |

## Skill Authoring Patterns

This section is the most critical for the milestone. Skills in this project are NOT Node.js programs -- they are markdown instruction files that tell Claude Code what to do. Claude Code's LLM executes the instructions using the allowed tools.

### Skill File Anatomy

```markdown
---
name: dc:skill-name
description: One-line description shown in command palette
argument-hint: "[optional-arg]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---
<objective>
What this skill accomplishes. What files it creates/modifies.
After this command: what the user should do next.
</objective>

<execution_context>
@path/to/template.md          (loaded automatically)
@path/to/reference.md         (loaded automatically)
</execution_context>

<process>
Step-by-step instructions the LLM follows.
These are natural language, not code.
</process>
```

### Key Pattern: Skill = Thin Router vs Inline Logic

GSD establishes a pattern: skill `.md` is a thin entry point referencing a workflow file via `@path` in `<execution_context>`. The workflow file contains the actual step-by-step logic.

**For dc: skills, adopt a simpler variant.** GSD needs separate workflows because it has a JS tooling layer (`gsd-tools.cjs`). The dc: skills have no JS tooling -- they instruct the LLM to use Read/Write/Bash/Glob directly. This means the process logic can live directly in the skill file.

**Recommended approach:** Inline the process in the skill file. Extract to a workflow file only if a skill exceeds ~100 lines or shares logic with another skill.

### Tool Selection Per Skill

| Skill | Tools Needed | Rationale |
|-------|-------------|-----------|
| dc:init | Read, Write, Bash, Glob, AskUserQuestion | Reads templates, writes scaffolded files, creates directories, checks existing files, asks about overwrite |
| dc:explore | Read, Glob, Grep | Read-only: parses MANIFEST.md, searches for matching entries, reads context files |
| dc:validate | Read, Bash, Glob, Grep | Runs validate-context.sh via Bash, reads results, reads files to diagnose issues |
| dc:add | Read, Write, Glob, AskUserQuestion | Reads templates, asks user for content, writes new files, updates MANIFEST.md |
| dc:refresh | Read, Write, Glob, Grep | Reads MANIFEST.md for dates, reads context files, reads source code, updates verified dates |

### Template Resolution Pattern

Skills that read templates must check two locations (global install, then local install):

```
1. ~/.claude/domain-context/templates/{template-name}.md
2. ./.claude/domain-context/templates/{template-name}.md
```

The skill's `<process>` should instruct the LLM to check both paths and use whichever exists. This is a Read + Glob operation, not a Node.js operation.

### MANIFEST.md Parsing Pattern

MANIFEST.md is structured markdown with a predictable format. Skills parse it by reading the file and interpreting its sections:

- **Domain Concepts** section: entries like `- [Name](domain/file.md) -- description [access] [verified: YYYY-MM-DD]`
- **Architecture Decisions** section: entries like `- [NNN: Title](decisions/NNN-slug.md) -- description [verified: YYYY-MM-DD]`
- **Constraints** section: same pattern

Skills should use Grep to find entries matching a search term, or Read to load the entire MANIFEST.md for full parsing (it is intentionally small, ~300 tokens).

### File Naming Convention

All generated files must use kebab-case. ADR files use zero-padded three-digit numbering: `001-slug.md`, `002-slug.md`. The dc:add skill must scan existing decision files to determine the next number.

## What NOT to Build

| Avoid | Why | Do Instead |
|-------|-----|------------|
| Node.js CLI for skills | Skills are markdown instructions, not programs. Claude Code's LLM is the runtime. | Write clear `<process>` instructions using allowed tools |
| Custom markdown parser in JS | Unnecessary complexity. The LLM reads and understands markdown natively. | Let the LLM parse MANIFEST.md directly via Read tool |
| Workflow files for every skill | Over-engineering for simple skills. GSD needs workflows because it has a JS tooling layer. | Inline process in skill file; extract only if >100 lines or shared logic |
| Template engine / variable substitution in JS | Templates use `{placeholder}` tokens, but the LLM fills them directly when creating files. | Let the LLM read the template and write the filled version |
| Interactive menus / TUI | Claude Code skills use `AskUserQuestion` for user input, not readline or inquirer. | Use `AskUserQuestion` tool in allowed-tools list |
| MCP server | ADR-003 explicitly defers this. File-based approach is simpler for MVP. | File-based skills + hooks |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Inline process in skill files | Separate workflow .md files (GSD pattern) | If a skill exceeds ~100 lines or two skills share identical logic |
| Bash for validate-context.sh | Node.js validation script | If validation needs complex logic beyond shell capabilities (unlikely for file checks) |
| LLM-native markdown parsing | Custom JS parser for MANIFEST.md | Never for skills. Only if hooks need to parse MANIFEST.md (freshness hook does -- uses simple regex in JS) |
| `AskUserQuestion` tool | Multi-step conversation flow | AskUserQuestion is the only mechanism. No alternative exists in Claude Code. |

## Hook Authoring Patterns

Hooks are the one area where actual Node.js code is written. They follow a strict contract:

```javascript
// Read JSON from stdin
const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    // Do work here
    const result = { additionalContext: "Message for conversation" };
    process.stdout.write(JSON.stringify(result));
  } catch (e) {
    // MUST exit 0 on any error
    process.exit(0);
  }
});
```

**Critical constraints:**
- MUST exit 0 on any error (wrap everything in try/catch)
- MUST complete within timeout (5000ms for SessionStart)
- stdin JSON shape varies by event (SessionStart vs PostToolUse)
- stdout JSON fields: `additionalContext` (string, optional), `decision` ("block" or "allow", optional)

### Hook Pattern: Freshness Check (SessionStart)

The freshness hook is the one place where JS regex parsing of MANIFEST.md is appropriate (hooks cannot use the LLM). Parse verified dates with a regex like `/\[verified: (\d{4}-\d{2}-\d{2})\]/g`, calculate days since each date, and warn if any exceed 90 days.

## Version Compatibility

| Component | Requires | Notes |
|-----------|----------|-------|
| Node.js | >= 20.x LTS | For `fs/promises`, stable `readline`, modern `path` APIs |
| Bash | >= 3.2 | macOS ships 3.2. Avoid bash 4+ features (associative arrays, lowercase expansion) |
| Claude Code | current | Skills format is stable. No version pinning needed. |
| GSD | any installed version | dc:extract reads .planning/ structure, which is GSD's stable interface |

## Architecture Implications for Skills

### Each Skill is Self-Contained

A skill file contains everything the LLM needs to execute. The `<execution_context>` section loads reference files (templates, specs) at invocation time. The `<process>` section provides step-by-step instructions. There is no shared state between skill invocations.

### The Spec is the Source of Truth

Templates in `templates/` are derived from the Domain Context spec. Skills reference these templates when creating files. If the spec changes, templates change, and skills automatically use the new versions (they read templates at runtime, not at build time).

### No Build Step

Skills are deployed as-is. The installer copies markdown files to `.claude/commands/dc/`. There is no compilation, transpilation, or bundling. This is a strength -- skills are readable, editable, and debuggable by users.

## Sources

- GSD skill files at `~/.claude/commands/gsd/` -- examined `new-project.md`, `health.md`, `new-milestone.md`, `add-phase.md` for established patterns (HIGH confidence)
- Claude Code extensions taxonomy at `.context/domain/claude-code-extensions.md` -- project's own documented extension model (HIGH confidence)
- PLAN.md Phase 2 specification -- authoritative skill requirements (HIGH confidence)
- AGENTS.md project conventions -- constraints and naming rules (HIGH confidence)
- Node.js v24.14.0 runtime verified locally (HIGH confidence)

---
*Stack research for: Claude Code skill development (domain-context-cc)*
*Researched: 2026-03-11*
