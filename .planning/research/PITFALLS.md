# Pitfalls Research

**Domain:** Claude Code skills for file scaffolding, markdown parsing, and manifest management
**Researched:** 2026-03-11
**Confidence:** HIGH (based on analysis of GSD patterns, Domain Context spec, and Claude Code extension conventions)

## Critical Pitfalls

### Pitfall 1: Template Location Resolution Fails Silently

**What goes wrong:**
`dc:init` needs to read templates from `~/.claude/domain-context/templates/` (global) or `.claude/domain-context/templates/` (local). If the skill hardcodes one path or resolves the wrong one, it silently generates empty or malformed files. Worse, `~` expansion behaves differently in Node.js (`os.homedir()`) vs shell expansion vs the `@path` references in skill markdown.

**Why it happens:**
Claude Code skills are markdown files that instruct the LLM. The LLM resolves `@path` references at skill load time, but template reading happens at runtime via Read/Bash tool calls. These are two different path resolution contexts. Developers conflate them and assume `~` works everywhere, or forget that a locally-installed skill needs to find locally-installed templates (not global ones).

**How to avoid:**
1. Skills must check both install locations in priority order: local `.claude/domain-context/templates/` first, then global `~/.claude/domain-context/templates/`.
2. Use absolute paths in all Read tool calls within skill `<process>` sections. Never rely on `~` expansion in tool arguments.
3. Fail loudly with a clear message: "Templates not found. Run `npx domain-context-cc` to install."

**Warning signs:**
- `dc:init` creates directories but files inside are empty or use placeholder text
- Works in development (templates in repo) but fails after npm install
- Works globally but not locally (or vice versa)

**Phase to address:**
Phase 2 (Core Skills) -- establish template resolution pattern in `dc:init` first, reuse in all other skills.

---

### Pitfall 2: MANIFEST.md Parsing Brittleness

**What goes wrong:**
MANIFEST.md is a structured markdown file with sections (Domain Concepts, Architecture Decisions, Constraints, Module Context Files), each containing list entries with a specific format: `- [Title](path) -- description [access-level] [verified: date]`. Skills that parse this with naive string matching break when users add extra whitespace, use different dash styles (em-dash vs double-hyphen), omit optional fields, or add custom sections.

**Why it happens:**
Markdown is human-writable, which means it is also human-variable. The spec defines a format, but developers will deviate: trailing spaces, inconsistent link formats, missing verified dates on some entries, extra blank lines between entries. A regex that matches the template output will not match real-world manifests after humans have edited them.

**How to avoid:**
1. Parse MANIFEST.md by section headers first (## headings), then parse entries within each section.
2. Be lenient on entry format: treat verified date as optional, accept both `--` and `---` separators, trim whitespace.
3. When `dc:add` or `dc:refresh` writes entries back, normalize to the canonical format -- this self-heals drift over time.
4. Use `validate` as the strict parser; use a lenient parser for `explore`, `add`, and `refresh`.

**Warning signs:**
- `dc:explore` shows "0 domain concepts" when MANIFEST.md clearly has entries
- `dc:validate` reports errors on manifests that a human would consider valid
- `dc:add` appends to wrong section or creates duplicate sections

**Phase to address:**
Phase 2 (Core Skills) -- build the parser once in `dc:explore`, reuse in all other skills. Define parsing tolerance early.

---

### Pitfall 3: AGENTS.md Append Clobbers Existing Content

**What goes wrong:**
`dc:init` must append a snippet to AGENTS.md (the `## Project Context` section with `@ARCHITECTURE.md` and `@.context/MANIFEST.md` references). If the project already has an AGENTS.md with existing content, a naive append duplicates sections, breaks existing structure, or overwrites content. If the project already has Domain Context references (from a previous init), it adds them again.

**Why it happens:**
File modification in Claude Code skills happens through Write or Edit tool calls, which the LLM executes. Without explicit idempotency checks in the skill's `<process>`, the LLM may append blindly. The skill author assumes a fresh project, but users will run `dc:init` on projects with existing AGENTS.md files (including ones that already have partial domain context setup).

**How to avoid:**
1. Before appending, read AGENTS.md and check for existing `@.context/MANIFEST.md` reference. If present, skip or update rather than duplicate.
2. Use a sentinel comment (e.g., `<!-- domain-context -->`) to mark the injected section. Check for it before appending.
3. The skill's `<process>` must explicitly instruct: "Read AGENTS.md first. If it already contains references to .context/, do not append the snippet again."
4. Same logic for CLAUDE.md -- check if `@AGENTS.md` already exists before adding it.

**Warning signs:**
- Running `dc:init` twice produces duplicate `## Project Context` sections
- AGENTS.md grows each time `dc:init` runs
- Existing AGENTS.md structure is disrupted (e.g., snippet inserted in the middle)

**Phase to address:**
Phase 2 (Core Skills) -- `dc:init` is the first skill built, must be idempotent from day one.

---

### Pitfall 4: Skills Assume Claude Code Tool Semantics

**What goes wrong:**
Skills are instructions to an LLM, not imperative code. A skill's `<process>` section says "create the file at X" but the LLM interprets this through its own judgment. If the process is ambiguous about edge cases (file exists? directory missing? permission error?), the LLM may make surprising decisions: overwrite without asking, skip silently, or hallucinate a solution.

**Why it happens:**
Developers write skill `<process>` sections like pseudocode, assuming deterministic execution. But the LLM is the runtime, and it interprets instructions with latitude. GSD skills work well because they have been refined through extensive use. New skills lack this refinement and hit edge cases where LLM interpretation diverges from intent.

**How to avoid:**
1. Be explicit about every branch in `<process>`: "If .context/ already exists, inform the user and ask whether to overwrite or skip." Never leave the LLM to decide what to do with conflicts.
2. Include negative instructions: "Do NOT overwrite existing files without asking." "Do NOT create files outside .context/."
3. Use `allowed-tools` restrictively. If a skill only reads, do not grant Write access. (See the GSD pattern: `execute-phase.md` has Write+Edit, but `explore` equivalents would only need Read.)
4. Test each skill with pre-existing state, not just on clean directories.

**Warning signs:**
- Skill works perfectly on a fresh directory but behaves unpredictably on projects with existing .context/
- Users report files being overwritten without confirmation
- Skill does more than intended (creates extra files, modifies files it should not touch)

**Phase to address:**
Phase 2 (Core Skills) -- every skill must handle both fresh and existing-project cases.

---

### Pitfall 5: ADR Numbering Race Condition in dc:add

**What goes wrong:**
`dc:add` for decisions must auto-detect the next ADR number (e.g., existing 001, 002, 003 -> next is 004). If it scans `decisions/` directory and a file was recently created but MANIFEST.md was not yet updated (or vice versa), it assigns a duplicate number. More commonly: the skill reads the directory listing, but the LLM miscounts or misparses the filenames.

**Why it happens:**
ADR numbering requires reading the filesystem (Glob for `decisions/*.md`), extracting numbers from filenames, and computing max+1. This is multi-step logic that the LLM executes through tool calls. Each step is a point of failure: Glob returns results in unexpected order, filename parsing misses a file, or the LLM makes an arithmetic error on the number.

**How to avoid:**
1. The skill `<process>` must specify the exact algorithm: "Use Glob to list all files in .context/decisions/. Extract the numeric prefix from each filename (the digits before the first hyphen). Find the maximum number. Add 1. Zero-pad to 3 digits."
2. Also cross-reference MANIFEST.md's Architecture Decisions section -- use the higher of filesystem count and manifest count.
3. Include an explicit example in the skill: "If files are 001-foo.md, 002-bar.md, 003-baz.md, next number is 004."

**Warning signs:**
- Two ADRs with the same number
- ADR numbers that skip (001, 002, 004) -- not harmful but indicates unreliable counting
- New ADR overwrites an existing one

**Phase to address:**
Phase 2 (Core Skills) -- `dc:add` implementation.

---

### Pitfall 6: Freshness Date Parsing Inconsistency

**What goes wrong:**
The spec uses `[verified: YYYY-MM-DD]` in MANIFEST.md entries and `<!-- verified: YYYY-MM-DD -->` HTML comments inside context files. Skills that check freshness (explore, refresh, validate) must parse both formats. If they only parse one, or if the date format varies (ISO 8601 vs locale-specific), freshness checks produce wrong results: marking current entries as stale, or missing genuinely stale ones.

**Why it happens:**
Two different date locations (manifest entry vs file comment) with two different formats (markdown bracket notation vs HTML comment). The skill author implements one and forgets the other. Additionally, users may write dates as "2026-3-11" instead of "2026-03-11", or use different separators.

**How to avoid:**
1. Treat MANIFEST.md `[verified: ...]` as the authoritative freshness source. The in-file comment is supplementary.
2. Accept flexible date parsing: both zero-padded and non-padded month/day.
3. Define freshness threshold in one place (90 days default). Do not hardcode it in multiple skills.
4. `dc:refresh` must update BOTH locations when refreshing: the manifest entry AND the in-file HTML comment.

**Warning signs:**
- `dc:explore` says "2 stale entries" but `dc:validate` says "0 stale entries" (or vice versa)
- Refreshing an entry updates the manifest but not the file (or vice versa), causing permanent "stale" status

**Phase to address:**
Phase 2 (Core Skills) -- `dc:explore` and `dc:refresh` both need this. Establish date handling in explore, reuse in refresh.

---

### Pitfall 7: Hook stdin/stdout Protocol Violation

**What goes wrong:**
Claude Code hooks receive JSON on stdin and must write JSON to stdout (or nothing). If a hook writes anything else to stdout (debug logs, error messages, warnings), Claude Code either ignores the hook output or crashes. If the hook does not read stdin completely before exiting, the pipe breaks and Claude Code reports a hook error.

**Why it happens:**
Developers use `console.log()` for debugging during development and forget to remove it. Or they write error messages to stdout instead of stderr. The GSD hook pattern (stdin timeout guard, try/catch with exit(0), JSON.stringify to stdout) is not obvious from documentation -- you learn it from reading existing hooks.

**How to avoid:**
1. Copy the GSD hook boilerplate exactly: stdin timeout guard (3s), `process.stdin.setEncoding('utf8')`, accumulate chunks, parse on `end`, try/catch with `process.exit(0)`, output via `process.stdout.write(JSON.stringify(...))`.
2. All debug output goes to stderr (`console.error()`), never stdout.
3. Always drain stdin completely before exiting, even if the hook has nothing to do.
4. Test hooks by piping JSON manually: `echo '{"session_id":"test","cwd":"/tmp"}' | node hooks/dc-freshness-check.js`

**Warning signs:**
- Claude Code reports "hook error" or "hook timed out" on session start
- Hook output is silently ignored (no freshness warnings appear)
- Hook works in isolation but fails when Claude Code invokes it

**Phase to address:**
Phase 3 (Hooks) -- but the boilerplate pattern should be documented in Phase 2 so it is ready.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline manifest parsing in each skill | Faster to write each skill independently | Parsing logic diverges between skills; bugs fixed in one are not fixed in others | Never -- extract shared parsing instructions into a referenced file that all skills @import |
| Hardcoding template paths | Works for development | Breaks after npm install when paths change | Only in early prototyping; must be resolved before Phase 5 (installer) |
| Skipping idempotency checks in dc:init | Simpler first implementation | Users who run init twice get corrupted AGENTS.md | Never -- idempotency is a day-one requirement |
| Using Write instead of Edit for manifest updates | Simpler skill instructions | Overwrites concurrent changes; loses user edits outside the target section | Only when creating new files; use Edit for updates to existing files |
| Not validating after mutation | Faster operations | Drift accumulates silently between manifest and filesystem | Acceptable in dc:add (fast path) if dc:validate exists as a separate check |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GSD .planning/ directory | Assuming .planning/ structure is stable; hardcoding paths like `.planning/phases/1/PLAN.md` | Read `.planning/STATE.md` for current state; use Glob to discover phase files; handle missing .planning/ gracefully |
| Claude Code settings.json | Overwriting the entire hooks section when adding dc hooks | Read existing settings.json, merge dc hooks into existing arrays, write back. Never replace the hooks object. |
| AGENTS.md @import resolution | Assuming @path references work with relative paths from any working directory | @paths are resolved relative to the file containing them. `@.context/MANIFEST.md` in AGENTS.md means relative to AGENTS.md's location (project root). |
| validate-context.sh bundling | Assuming bash is available on all platforms; using bash-specific syntax | Node.js is the safe runtime (already required). Consider porting critical validation to the skill itself rather than shelling out to bash. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| dc:init creates 10+ files without preview | User does not understand what was created or why | Show a plan first: "I will create these files: [list]. Proceed?" Use AskUserQuestion. |
| dc:validate dumps raw validation output | User sees shell script output, not actionable guidance | Parse validation results and present conversationally: "Found 2 issues: [file] is in manifest but missing on disk. Want me to create it from template?" |
| dc:explore shows everything at once | Overwhelming for large .context/ directories | Show summary first (counts by category + freshness status), then offer to drill into specific areas |
| dc:add asks too many questions | User wanted to quickly capture a concept, not fill out a form | Accept inline description: `/dc:add domain "Payment processing rules for subscriptions"`. Only ask follow-up questions if needed. |
| dc:refresh updates dates without review | User does not know what was "refreshed" | Show diff of what changed, ask for confirmation before updating verified dates |

## "Looks Done But Isn't" Checklist

- [ ] **dc:init:** Often missing .gitignore update for `.context.local/` -- verify .gitignore is modified
- [ ] **dc:init:** Often creates AGENTS.md but forgets CLAUDE.md `@AGENTS.md` pointer -- verify both files
- [ ] **dc:init:** Often creates directories but skips .gitkeep files in empty dirs -- verify `decisions/`, `constraints/` have .gitkeep
- [ ] **dc:add:** Often creates the file but forgets to update MANIFEST.md -- verify manifest has new entry
- [ ] **dc:add (decision):** Often creates ADR file but misses the `## Status` section or uses wrong template -- verify all required sections present
- [ ] **dc:refresh:** Often updates manifest verified date but not the in-file `<!-- verified: -->` comment -- verify both locations
- [ ] **dc:validate:** Often checks file existence but not content format -- verify it catches malformed entries, not just missing files
- [ ] **Hooks:** Often work in development but fail silently after npm install because paths changed -- verify hooks work from installed location

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Duplicate AGENTS.md sections | LOW | Manually edit AGENTS.md to remove duplicates. Add idempotency check to dc:init. |
| Corrupted MANIFEST.md (bad parse + write-back) | MEDIUM | Restore from git. Fix parser to handle the format that caused corruption. |
| Wrong ADR numbers (duplicates) | LOW | Rename files manually. No downstream dependencies on ADR numbers. |
| Hooks blocking sessions | LOW | Remove hooks from settings.json. Fix hook to exit(0) on error. Re-register. |
| Template path resolution failure after install | MEDIUM | Uninstall, fix path resolution logic, reinstall. Users who already ran dc:init have files but future inits fail. |
| Settings.json clobbered (lost other hooks) | HIGH | Restore from git. Rewrite installer merge logic. Reinstall all affected extensions. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Template location resolution | Phase 2 (dc:init) | Run dc:init from both global and local install; verify templates found |
| MANIFEST.md parsing brittleness | Phase 2 (dc:explore, first parser) | Feed explore a hand-edited manifest with irregular formatting |
| AGENTS.md append clobber | Phase 2 (dc:init) | Run dc:init twice on same project; verify no duplication |
| Skill edge case handling | Phase 2 (all skills) | Test every skill on both fresh and existing .context/ directories |
| ADR numbering | Phase 2 (dc:add) | Create 3 ADRs in sequence; verify numbering is correct |
| Freshness date parsing | Phase 2 (dc:explore + dc:refresh) | Test with various date formats and missing dates |
| Hook protocol compliance | Phase 3 (hooks) | Pipe test JSON to each hook; verify valid JSON output or clean exit |
| Settings.json merge safety | Phase 5 (installer) | Install alongside GSD; verify both hook sets are preserved |
| Path resolution after npm install | Phase 5 (installer) | npm pack + npx install; verify all skills can find their templates |

## Sources

- GSD hook pattern analysis: `/Users/alevine/.claude/hooks/gsd-context-monitor.js` (stdin/stdout protocol, timeout guard, graceful degradation)
- GSD skill pattern analysis: `/Users/alevine/.claude/commands/gsd/new-project.md`, `execute-phase.md` (frontmatter format, @import resolution, allowed-tools)
- Domain Context integration model: `.context/domain/integration-model.md` (AGENTS.md bridge, three-concern model)
- Claude Code extensions taxonomy: `.context/domain/claude-code-extensions.md` (hooks, skills, agents, rules conventions)
- Project plan: `PLAN.md` (Phase 2 scope, template locations, validation approach)

---
*Pitfalls research for: Claude Code domain context skills*
*Researched: 2026-03-11*
