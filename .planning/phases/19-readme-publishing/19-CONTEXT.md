# Phase 19: README & Publishing - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Write the final README.md so a new user can discover, install, and start using domain-context-cc from the README alone. Covers install instructions, quick start, command reference with per-command detail, GSD bridge explanation, and uninstall instructions.

</domain>

<decisions>
## Implementation Decisions

### Command Reference Depth
- One paragraph per command below the summary table — table for quick scan, paragraph for "what it does and when to use it"
- No usage examples — commands are self-explanatory slash commands, not CLI tools
- Only document flags/options where they exist (e.g., dc:init GSD detection)
- Flat list of all 6 commands — no grouping (small enough to scan)

### README Tone & Audience
- Primary audience: Claude Code users who already know the Domain Context spec — they need install + commands, not a spec tutorial
- One-sentence intro + link to spec repo for anyone unfamiliar
- Concise and practical tone — short sentences, action-oriented, no marketing language
- No "Why" or "Philosophy" section — the spec repo handles that

### Content Structure
- Keep the existing "What Gets Installed" section — users want to know what touches their .claude/ directory
- Add one-line prerequisites: "Requires Node.js 20+ and Claude Code"
- No "How It Works" section — GSD Integration section covers the bridge pattern, hooks/rules are self-explanatory
- Minimal badges at the top: npm version + license

### Claude's Discretion
- Exact wording of per-command paragraphs
- Badge formatting and placement
- Section ordering within the existing structure

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- README.md already exists with basic structure covering all 5 success criteria at a surface level
- 6 dc:* skills in commands/dc/ (add, explore, extract, init, refresh, validate) — source of truth for command descriptions
- package.json has name, version, repository URL for badges
- bin/install.js has --local, --uninstall flags documented in code

### Established Patterns
- Existing README uses table format for commands
- GSD Integration section already has the 4-bullet bridge pattern explanation
- "What Gets Installed" section uses bold labels + colon descriptions

### Integration Points
- package.json repository URL for npm/license badge links
- bin/install.js flag behavior for accurate uninstall documentation
- commands/dc/*.md frontmatter descriptions for accurate command reference

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
