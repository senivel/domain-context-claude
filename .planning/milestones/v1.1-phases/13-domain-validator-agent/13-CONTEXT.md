# Phase 13: Domain Validator Agent - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a Claude Code agent that reads `.context/domain/` and `.context/constraints/` files, extracts business rules and invariants, scans project code for violations, and produces structured violation findings — all using read-only tools.

</domain>

<decisions>
## Implementation Decisions

### Agent Output & Behavior
- Violations reported as a markdown table: violation description, file:line location, rule source — structured, scannable, copy-pasteable
- Report-only — the agent does NOT suggest or make fixes (per REQUIREMENTS: "validator reports, it does not fix")
- When no violations found, report "No violations found" with a summary of rules checked — confirms the check ran
- Check both `.context/domain/` and `.context/constraints/` files — constraints are business rules that constrain code

### Agent Architecture
- Agent file at `agents/dc-domain-validator.md` — matches project `agents/` directory convention with `dc-` prefix
- Scan common code directories: `src/`, `app/`, `lib/`, `commands/`, `hooks/` — skip `.planning/`, `node_modules/`, templates
- Extract rules from "Business Rules" and "Invariants" sections of domain/constraint files — spec-defined sections containing enforceable rules
- Fully self-contained system prompt (~80-100 lines) — satisfies AGNT-05 (no reliance on parent context, CLAUDE.md, or conversation history)

### Claude's Discretion
- Exact rule-to-code matching heuristics
- How to handle ambiguous or non-code-enforceable rules
- Internal agent workflow structure

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.claude/agents/gsd-plan-checker.md` — demonstrates agent file format: YAML frontmatter (`name`, `description`, `tools`, `color`), system prompt body
- `.context/domain/integration-model.md` — example domain file with "Business Rules" and "Invariants" sections
- `.context/domain/claude-code-extensions.md` — another domain file with business rules to validate against

### Established Patterns
- Agent files: markdown with YAML frontmatter (`name`, `description`, `tools`, `color`)
- Read-only agents use `tools: Read, Grep, Glob` (no Edit, Write, Bash)
- Agents are spawned by skills or the user via the Agent tool

### Integration Points
- Agent file in `agents/` will be copied to `.claude/agents/` by the installer (future milestone)
- Agent reads `.context/MANIFEST.md` to discover domain and constraint files
- Agent uses Grep to search code for potential violations

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The agent should be pragmatic about what's enforceable via code scanning vs. what requires human judgment.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
