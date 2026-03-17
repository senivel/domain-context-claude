# Feature Research

**Domain:** CLI tool installer / npm package for a Claude Code extension
**Researched:** 2026-03-17
**Confidence:** HIGH — based on existing GSD installer pattern in the same ecosystem, Claude Code hooks/settings.json verified in live environment, and established npm/npx conventions

## Scope

This file covers the v1.3 milestone features only:
- `package.json` — npm packaging configuration
- `bin/install.js` — Node.js installer (--global, --local, --uninstall, settings.json merge)
- Final `README.md` — install instructions, quick start, command reference, GSD integration

Features from v1.0–v1.2 (skills, hooks, rule, agent, templates) are prerequisites, not scope.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `npx domain-context-cc` global install | Standard convention for Claude Code tools; README already promises this UX | LOW | Copies commands/, agents/, hooks/, rules/, templates/, tools/ to ~/.claude/ |
| `--local` flag for project-scoped install | Developers want per-project installs; Claude Code supports both ~/.claude/ and ./.claude/ | LOW | Target is ./.claude/ instead of ~/.claude/ |
| `--uninstall` flag | Users must be able to reverse the install; any tool without uninstall feels risky | MEDIUM | Remove dc-prefixed files only; avoid clobbering other installed tools |
| settings.json hook registration (install) | Without this the SessionStart and PostToolUse hooks never fire; install is incomplete | MEDIUM | Must merge into existing settings.json without clobbering other hooks; append to arrays |
| settings.json hook removal (uninstall) | Stale hook entries cause confusing session behavior after uninstall | MEDIUM | Parse JSON, filter out dc hook command strings, write back |
| Idempotent install | Running `npx domain-context-cc` twice must not duplicate hook entries or files | LOW | Check if dc hooks already present before appending; overwriting files is safe |
| package.json with correct `bin` entry | Required for `npx domain-context-cc` to resolve to the install script | LOW | `"bin": { "domain-context-cc": "bin/install.js" }` |
| `files` list in package.json | Without it npm publishes everything including .planning/, .context/, test artifacts | LOW | Include: commands/, agents/, hooks/, rules/, templates/, tools/, bin/, README.md |
| Success message with next step | Users don't know what to do after install; clear next-step instruction prevents abandonment | LOW | "Installed. Run /dc:init in any project to get started." |
| Graceful degradation when settings.json missing | New Claude Code installs may not have settings.json; installer must handle absent file | LOW | `fs.existsSync()` check; create minimal `{ "hooks": { ... } }` if absent |
| README install + quick start | First thing users read; must answer "how do I install" and "what do I do next" | LOW | Already drafted; needs final polish to match actual install command |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Uninstall removes only dc-prefixed files | Safe uninstall — users trust it won't wreck other Claude Code tools | MEDIUM | Match dc- prefix for hooks, dc/ subdir for commands, domain-context.md for rules, domain-validator.md for agents |
| Installer copies templates/ and tools/ subdirectory | dc:init and dc:validate need these files at runtime; most Claude Code tools don't have runtime assets | LOW | Copy to {target}/domain-context/templates/ and {target}/domain-context/tools/ — not directly to .claude/ root |
| README GSD integration section | Target audience uses GSD; documenting the bridge pattern is key to adoption | LOW | AGENTS.md bridge explanation + /dc:extract workflow already drafted in current README |
| README command reference table | All 6 commands documented in one place; reduces "what can this do?" friction | LOW | Already exists in README; verify it's complete and accurate |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Auto-run `/dc:init` during install | "Zero configuration" appeal | install.js runs outside Claude Code — cannot invoke skills; also not all users want to init immediately | Print "Run /dc:init in any project to initialize" in success message |
| Interactive prompts during install | Friendly UX for global vs local choice | Breaks `npx` piped/CI usage; Node.js readline adds complexity | Use explicit flags: default = global, `--local` for local |
| Post-install script that edits CLAUDE.md or AGENTS.md | Feels magical | Crosses a boundary — installer should not modify project source files; only ~/.claude/ config | Leave project-level changes to `/dc:init` which the user invokes consciously |
| MCP server registration during install | Future capability | ADR-003 explicitly deferred; Claude Code MCP config is separate from hooks settings.json | Document as future work; keep installer focused on file copy + settings.json merge |
| `--dry-run` flag | Safety verification | Low value for a file-copy installer; adds test surface area | Print a banner listing what will be installed before doing it |
| Version pinning individual skill files | "I want dc:init v1.2 but dc:validate v1.3" | No real use case; all files are a coherent release | Version the package as a whole; semver the npm package |

---

## Feature Dependencies

```
[package.json with bin + files]
    └──enables──> [npx domain-context-cc invocation]
                      └──requires──> [bin/install.js exists]
                                         ├──copies──> [commands/, agents/, hooks/, rules/]
                                         ├──copies──> [templates/, tools/ into domain-context/ subdir]
                                         └──merges──> [settings.json hook registration]

[settings.json hook merge]
    └──activates──> [dc-freshness-check.js (SessionStart)]
    └──activates──> [dc-context-reminder.js (PostToolUse)]
    depends on   -> [live settings.json schema: hooks.SessionStart[].hooks[].command]

[--uninstall flag]
    └──reverses──> [file copy] (dc-prefixed hook files, dc/ commands, domain-context/ subdir)
    └──reverses──> [settings.json hook merge] (filter out dc hook command strings)

[README.md final polish]
    └──documents──> [npx install command from package.json]
    └──documents──> [all 6 dc:* skills from v1.0-v1.2]
    └──documents──> [GSD integration from v1.2]
    no code dependencies — documentation only
```

### Dependency Notes

- **bin/install.js must know the final file list**: All source directories (commands/, agents/, hooks/, rules/, templates/, tools/) are stable from v1.0–v1.2. No new skills are being added in v1.3. File list is safe to hardcode.
- **settings.json merge requires matching live schema**: The live `~/.claude/settings.json` uses `hooks.SessionStart[].hooks[]` array nesting — verified directly. Installer must emit this exact structure.
- **package.json `files` must include `bin/`**: The `bin/` directory does not yet exist in the repo. Creating `bin/install.js` and `package.json` together is the natural first task of this milestone.
- **templates/ and tools/ are runtime assets, not just install-time files**: Unlike commands/ and hooks/, these are read by dc:init and dc:validate at skill invocation time. They must land at a predictable sub-path inside .claude/ (e.g., `domain-context/templates/`) not at the .claude/ root.
- **Uninstall requires predictable naming**: The dc-prefix convention (already established) makes file removal reliable. Hooks match `dc-*.js`, commands are in `dc/` subdir, rule is `domain-context.md`, agent is `domain-validator.md`.

---

## MVP Definition

### Launch With (v1.3)

Minimum viable product — what's needed to distribute the package.

- [ ] `package.json` — name, version, bin entry, files list, no runtime deps declared
- [ ] `bin/install.js` — global install (default), --local flag, --uninstall flag, file copy, settings.json merge, idempotent
- [ ] Final `README.md` — install command, quick start (3 steps), command reference table, GSD integration section, links

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] `--check` flag that reports what is installed without making changes — trigger: user feedback about wanting to verify install state
- [ ] Installer prints version on success — trigger: if users report confusion about which version is installed

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] MCP server registration during install — explicitly deferred by ADR-003; significant complexity
- [ ] Auto-update check on session start — adds hook weight; GSD already does this pattern but it is not needed for dc MVP

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| package.json with bin + files | HIGH | LOW | P1 |
| bin/install.js global file copy | HIGH | LOW | P1 |
| settings.json hook merge (add) | HIGH | MEDIUM | P1 |
| Idempotent install (no duplicate hooks) | HIGH | LOW | P1 |
| --local flag | MEDIUM | LOW | P1 |
| --uninstall flag + file removal | MEDIUM | MEDIUM | P1 |
| settings.json hook removal on uninstall | HIGH | MEDIUM | P1 |
| Graceful degradation (missing settings.json) | MEDIUM | LOW | P1 |
| Success message with next step | MEDIUM | LOW | P1 |
| README.md final polish | HIGH | LOW | P1 |
| --check / inspection flag | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Comparable Pattern: GSD Installer

The GSD project (`get-shit-done-cc`) is the closest analog — same ecosystem, same install target, same hook registration pattern. Installed files visible at `~/.claude/get-shit-done/`. Key observations from the live install:

| Aspect | GSD Pattern | domain-context-cc Plan |
|--------|-------------|------------------------|
| Install target (global) | `~/.claude/` | Same |
| Install target (local) | `./.claude/` | Same |
| Hook schema | `hooks.SessionStart[].hooks[].command` | Same (verified from live settings.json) |
| Existing hooks in settings.json | gsd-check-update.js, gsd-context-monitor.js | Must coexist; installer must not clobber |
| Runtime asset subdir | `~/.claude/get-shit-done/` | `~/.claude/domain-context/` for templates/ and tools/ |
| Command files | `~/.claude/commands/gsd/` | `~/.claude/commands/dc/` |

**Critical finding:** GSD and domain-context-cc both register PostToolUse hooks. The settings.json merge must append to the existing `hooks.PostToolUse[0].hooks[]` array (or create new entries), not replace the array. This was confirmed by inspecting the live settings.json which contains both gsd-context-monitor.js and the dc hooks from a manual install test.

---

## Sources

- Live `~/.claude/settings.json` inspected directly (2026-03-17) — confirms hook schema: `hooks.SessionStart[].hooks[].command`, `hooks.PostToolUse[].hooks[].command` — HIGH confidence
- `PLAN.md` Phase 5 specification — authoritative installer requirements for this project — HIGH confidence
- `PROJECT.md` v1.3 milestone definition — confirms scope boundaries — HIGH confidence
- `README.md` current state — install commands already defined; implementation must match — HIGH confidence
- Existing hooks `dc-freshness-check.js` and `dc-context-reminder.js` — confirm Node.js stdin/stdout pattern and graceful degradation requirements — HIGH confidence
- `~/.claude/` directory structure inspected — confirms GSD install layout as reference pattern — HIGH confidence

---
*Feature research for: npm installer and packaging for domain-context-cc Claude Code extension*
*Researched: 2026-03-17*
*Milestone scope: v1.3 — installer, packaging, and final README*
