# Phase 2: Init Core - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

dc:init creates a complete .context/ setup on a fresh project. User runs /dc:init and gets: MANIFEST.md, subdirectories (domain/, decisions/, constraints/), ARCHITECTURE.md skeleton, AGENTS.md with domain-context snippet, CLAUDE.md with @AGENTS.md pointer, and .context.local/ in .gitignore. This phase handles fresh projects and basic existing-file safety (append-safe for AGENTS.md, CLAUDE.md, .gitignore). Full idempotency and summary output are Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Skill structure
- Pure skill file: single markdown file at commands/dc/init.md
- No helper scripts — Claude reads templates and writes files directly using its tools
- YAML frontmatter with allowed-tools: Read, Write, Bash, Glob
- Use /skill-creator skill when building to ensure best practices are followed
- No arguments — operates on current working directory
- First skill in commands/dc/ — establishes the pattern for all dc: skills

### Template resolution
- Search both install paths: .claude/domain-context/templates/ (local) first, fall back to ~/.claude/domain-context/templates/ (global)
- Handles both local and global install modes from day one

### Placeholder filling
- Infer project description from common project metadata files first (package.json, pyproject.toml, Cargo.toml, go.mod, etc.)
- Fall back to README.md first paragraph, then directory/repo name
- Claude decides the exact priority chain across languages — should be generic, not JS-specific
- ARCHITECTURE.md: infer {system_purpose} from same sources, leave remaining placeholders ({module_rows}, {data_flow}, {key_boundaries}, {technology_decisions}) as TODO comments
- {restricted_context_instructions}: sensible default ("Contact the project maintainer for access")
- When inference finds nothing: prompt user using AskUserQuestion with GSD interaction pattern (concrete options, recommended choice, built-in "Other" for freeform)

### File creation
- Full set created: .context/MANIFEST.md, .context/domain/.gitkeep, .context/decisions/.gitkeep, .context/constraints/.gitkeep, ARCHITECTURE.md, AGENTS.md, CLAUDE.md, .gitignore entry
- Narrate each step as it happens ("Created .context/MANIFEST.md", etc.)
- Offer to commit created files at the end (AskUserQuestion: Yes (recommended) / No)

### AGENTS.md injection
- If AGENTS.md doesn't exist: create it with just the domain-context snippet (sentinel comments included)
- If AGENTS.md exists but no sentinel comments: append snippet at the end — doesn't modify existing content
- If sentinel comments already present: skip injection

### CLAUDE.md handling
- If CLAUDE.md doesn't exist: create with @AGENTS.md pointer (from claude.md template)
- If CLAUDE.md exists but doesn't contain @AGENTS.md: append @AGENTS.md line
- If @AGENTS.md already present: skip

### .gitignore handling
- Check first: only append .context.local/ if not already present
- Create .gitignore if it doesn't exist

### Existing project safety
- Claude's Discretion: whether to bail out or proceed when .context/ already exists (Phase 3 adds full idempotency handling)

### Claude's Discretion
- Exact inference priority chain across language ecosystems
- Whether to add a basic safety check for existing .context/ or defer entirely to Phase 3
- Exact output formatting for narration messages
- Commit message wording

</decisions>

<specifics>
## Specific Ideas

- All user prompts must follow GSD's interaction pattern: AskUserQuestion with concrete options, a recommended choice, and built-in "Other" for freeform input
- Use /skill-creator when building the skill file to ensure Claude Code skill best practices
- Templates already exist in templates/ directory (8 files from Phase 1) — this phase reads and fills them, doesn't create them

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- templates/manifest.md: MANIFEST.md template with {one_line_description}, {restricted_context_instructions} placeholders
- templates/architecture.md: ARCHITECTURE.md template with {system_purpose}, {module_rows}, {data_flow}, {key_boundaries}, {technology_decisions} placeholders
- templates/agents-snippet.md: Complete snippet with <!-- domain-context:start/end --> sentinels, ready to inject
- templates/claude.md: Single line "@AGENTS.md" — the thin pointer template
- templates/context.md, domain-concept.md, decision.md, constraint.md: Available but not used by dc:init directly

### Established Patterns
- kebab-case for all file names
- No runtime dependencies — Node.js built-ins only
- HTML guidance comments in templates (<!-- ... -->) stripped at fill time
- {placeholder} syntax with snake_case names (from Phase 1)

### Integration Points
- commands/dc/ directory doesn't exist yet — dc:init creates the first skill
- bin/install.js (not yet built) will copy templates to install location
- Phase 3 builds on this skill's file creation logic for idempotency

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-init-core*
*Context gathered: 2026-03-12*
