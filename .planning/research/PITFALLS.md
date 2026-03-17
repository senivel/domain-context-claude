# Domain Pitfalls

**Domain:** npm packaging and Node.js installer for a Claude Code extension
**Researched:** 2026-03-17
**Confidence:** HIGH (based on direct analysis of this project's file layout, hook registration patterns, existing settings.json structure, Node.js built-in behavior, and npm packaging behavior)

> **Note:** This file covers pitfalls specific to the v1.3 milestone: npm packaging, the `bin/install.js` installer, and settings.json hook merge. Prior milestone pitfalls (1-28) are archived but not repeated here.

---

## Critical Pitfalls

### Pitfall 29: `files` Array in package.json Missing Entire Directory Trees

**What goes wrong:** The installer copies files to `~/.claude/commands/dc/`, `~/.claude/hooks/`, `~/.claude/agents/`, `~/.claude/rules/`, and `~/.claude/domain-context/templates/` — but if `commands/`, `hooks/`, `agents/`, `rules/`, or `templates/` directories are not listed in the `files` array, `npm pack` silently omits them. The published package installs cleanly but the copied files are simply not present. The user sees no error during `npx domain-context-cc`; the install appears to succeed.

**Why it happens:** The `files` array uses globs relative to package root. Developers list individual files or top-level names but forget subdirectories. `"files": ["bin", "hooks"]` does NOT include `commands/dc/` because `commands` was omitted.

**Consequences:** Silent partial install. Skills missing, hooks missing. User opens Claude Code, `/dc:init` doesn't exist. Debugging is non-obvious because the install script reports success.

**How to avoid:**
- List every directory explicitly: `"files": ["bin", "commands", "hooks", "agents", "rules", "templates", "tools"]`
- After writing package.json, run `npm pack --dry-run` and manually verify every required file appears in the output list
- The install script should verify source files exist before copying — if `commands/dc/init.md` is missing from the npm package, throw a clear error: "Package is missing expected file: commands/dc/init.md — re-install the package"

**Warning signs:** `npm pack --dry-run` output is shorter than expected. Install completes but skill files are absent from `~/.claude/commands/dc/`.

**Phase to address:** Package Configuration phase (package.json authoring).

---

### Pitfall 30: settings.json Clobbering Existing Hooks

**What goes wrong:** The installer writes a new `settings.json` (or overwrites the existing one) instead of merging into it. The user has other hooks registered — for example, GSD hooks (`gsd-check-update.js`, `gsd-context-monitor.js`) or hooks from other extensions. After install, those hooks are gone. The user notices only when GSD stops working.

**Why it happens:** `JSON.parse` + `JSON.stringify` + `fs.writeFileSync` is the path of least resistance. A first-pass installer writes the template settings.json directly.

**Consequences:** Silent data loss. Existing hooks stop firing. If the user doesn't have the hooks backed up, they must manually reconstruct their settings.json from memory.

**How to avoid:**
- Always read the existing settings.json first (if it exists)
- Use deep array merge for hook arrays: append dc hook entries to existing `SessionStart` and `PostToolUse` arrays rather than replacing them
- Before appending, check whether an identical hook command already exists in the array — if so, skip (idempotency)
- Never overwrite top-level keys (`statusLine`, `permissions`, `env`, etc.) unless they are absent
- Write a backup of the original settings.json to `settings.json.bak` before any modification

**Warning signs:** User reports "my other hooks stopped working after install." Running `--install` twice produces duplicate hook entries.

**Phase to address:** Installer Logic phase (settings.json merge).

---

### Pitfall 31: Hook Commands Use Relative Paths That Break Outside the Source Directory

**What goes wrong:** The existing development settings.json uses relative paths: `"command": "node hooks/dc-freshness-check.js"`. This works when Claude Code's working directory is the project root. When the same command is injected by the installer into the global `~/.claude/settings.json`, the relative path breaks — `hooks/dc-freshness-check.js` no longer resolves to anything because the user's project root is not the install location.

**Why it happens:** The hooks were developed and tested from the project root. The path worked in development, so it gets copied as-is into the installer output.

**Consequences:** The installed hooks silently fail on every invocation (exit non-zero or error to stderr). Because the hooks use `exit 0` on error, the user may never notice the hooks are broken — they simply never fire. The freshness check never warns. The context reminder never fires.

**How to avoid:**
- The installer must inject absolute paths into settings.json, not relative paths
- For global install (`--global`): `"command": "node /Users/alice/.claude/hooks/dc-freshness-check.js"`
- For local install (`--local`): `"command": "node .claude/hooks/dc-freshness-check.js"` (relative to project root, which is Claude Code's cwd)
- Use `os.homedir()` or the resolved install destination to compute the absolute path at install time
- Test by running the injected command string verbatim from a random directory — if it fails, the path is wrong

**Warning signs:** Hooks installed but staleness warnings never appear. PostToolUse hook never fires context reminder. No error messages (because hooks exit 0 silently).

**Phase to address:** Installer Logic phase (hook command path resolution).

---

### Pitfall 32: `__dirname` vs `process.cwd()` in the Installer Itself

**What goes wrong:** The installer script (`bin/install.js`) uses `process.cwd()` to locate its own bundled files (skills, hooks, templates). This resolves to wherever the user invoked `npx`, not where the package is installed. When run via `npx domain-context-cc`, `process.cwd()` is the user's current directory — the package files are in a temporary npx cache directory, not in cwd.

**Why it happens:** `process.cwd()` is familiar and works during local development (when you run `node bin/install.js` from the package root). It fails when the script is run as an npm bin entry from a different location.

**Consequences:** Installer cannot find its own bundled files. Errors like "ENOENT: no such file or directory, open '/Users/alice/myproject/commands/dc/init.md'".

**How to avoid:**
- Always use `__dirname` (or `path.dirname(new URL(import.meta.url).pathname)` for ESM) to locate files relative to the script itself
- `const SOURCE_ROOT = path.resolve(__dirname, '..')` gives the package root regardless of invocation directory
- Verify by running `npx .` from a subdirectory during testing — not just from the package root

**Warning signs:** Install works when run from the package root (`node bin/install.js`) but fails when run via `npx domain-context-cc` from a different directory.

**Phase to address:** Installer Logic phase (path resolution).

---

### Pitfall 33: Uninstall Leaving Orphan Hook Entries in settings.json

**What goes wrong:** The `--uninstall` flag removes files from `~/.claude/commands/dc/`, `~/.claude/hooks/`, etc., but does not remove the corresponding hook entries from `~/.claude/settings.json`. On the next session start, Claude Code tries to execute `node ~/.claude/hooks/dc-freshness-check.js`, fails (file not found), and may produce error output that confuses the user.

**Why it happens:** Uninstall is typically an afterthought. The hook-removal logic mirrors the hook-injection logic but is not implemented, or the developer assumes "just delete the files."

**Consequences:** Broken session starts. Error output from missing hook commands. User must manually edit settings.json to clean up.

**How to avoid:**
- The `--uninstall` path must mirror `--install` in reverse: parse settings.json, filter out the exact hook command strings that were injected, write back the result
- Keep the injected command strings in a known format so they can be identified and removed precisely (e.g., always use the same path pattern)
- Test uninstall by running install followed by uninstall and asserting settings.json is identical to the pre-install state

**Warning signs:** After `--uninstall`, `settings.json` still contains dc hook entries. Session start produces "command not found" or "ENOENT" errors for dc hooks.

**Phase to address:** Installer Logic phase (uninstall cleanup).

---

### Pitfall 34: The `bin` Entry in package.json Points to a Non-Executable Script

**What goes wrong:** `"bin": {"domain-context-cc": "./bin/install.js"}` — but `bin/install.js` is missing a shebang (`#!/usr/bin/env node`) or has incorrect Unix permissions (not executable). When the user runs `npx domain-context-cc`, they get a "permission denied" or the script is run by the wrong interpreter.

**Why it happens:** The file is created normally (permissions 644) and lacks a shebang. Works fine when invoked explicitly as `node bin/install.js` but fails as a bin entry.

**Consequences:** `npx domain-context-cc` fails with a cryptic permission error or interpreter error.

**How to avoid:**
- Add `#!/usr/bin/env node` as the first line of `bin/install.js`
- Set file permissions: `chmod +x bin/install.js` (or ensure package.json does not override)
- npm automatically sets execute bits for bin entries during install, but the shebang is still required for direct execution
- Test via `npm pack && npx ./domain-context-cc-*.tgz` as documented in AGENTS.md

**Warning signs:** `npx domain-context-cc` returns "permission denied" or "bad interpreter." The script runs fine as `node bin/install.js` but not as `npx`.

**Phase to address:** Package Configuration phase (bin entry setup).

---

## Moderate Pitfalls

### Pitfall 35: Template Files Overwriting User-Customized Copies on Re-Install

**What goes wrong:** The installer copies templates to `~/.claude/domain-context/templates/`. If the user has customized those templates (e.g., added their own sections to `domain-concept.md`), a subsequent re-install overwrites their customizations silently.

**Why it happens:** Simple `fs.copyFileSync` with no existence check.

**How to avoid:** Before copying each template, check if a file already exists at the destination. If it does, skip it by default. Add a `--force` flag that allows overwriting. Log which files were skipped so the user knows their customizations are preserved.

**Phase to address:** Installer Logic phase (file copy behavior).

---

### Pitfall 36: Global vs Local Install Destination Confusion

**What goes wrong:** `--global` installs to `~/.claude/`. `--local` installs to `.claude/` in the current working directory. A user who runs `npx domain-context-cc --global` from inside a project expects the project's Claude Code config to gain the skills, not their home directory. Or vice versa.

**Why it happens:** The distinction is non-obvious, especially since Claude Code itself uses `~/.claude/` for user-level config and `.claude/` for project-level config — but users may not know this.

**How to avoid:**
- Print the resolved destination path before copying: "Installing to /Users/alice/.claude/ (global)"
- After install, print where to restart Claude Code or how to verify the install worked
- Make `--global` the default for `npx` invocations (users reaching this via npx are likely doing a one-time global install)

**Phase to address:** Installer Logic phase (destination resolution and UX).

---

### Pitfall 37: Symlinks Created by Global npm Install Break `__dirname` Resolution

**What goes wrong:** When installed globally via `npm install -g domain-context-cc`, npm creates a symlink from `/usr/local/bin/domain-context-cc` to the actual script in the npm global package directory. On some systems, `__dirname` in a symlinked script resolves to the symlink's location (the bin directory), not the actual package directory. `path.resolve(__dirname, '..', 'commands')` then points to the wrong place.

**Why it happens:** Node.js resolves `__dirname` to the real path (via `fs.realpath`) in most cases, but behavior can differ with certain Node.js versions and symlink configurations.

**How to avoid:**
- Use `fs.realpathSync(__dirname)` to normalize the path before computing relative paths: `const realDir = fs.realpathSync(__dirname)`
- Test global install scenario explicitly (not just `node bin/install.js` from the dev directory)

**Phase to address:** Installer Logic phase (path resolution).

---

### Pitfall 38: `npm pack` Includes `.planning/`, `.context/`, and Development Artifacts

**What goes wrong:** Without an explicit `files` array (or with an overly broad one), `npm pack` includes `.planning/`, `.context/`, `.claude/`, `PLAN.md`, research files, and other development artifacts. The published package becomes multi-megabyte and leaks internal project context to npm registry.

**Why it happens:** Developers test locally where all files are present and forget that `npm pack` includes everything not in `.npmignore` unless `files` is set.

**How to avoid:**
- Use the `files` array (more explicit than `.npmignore`)
- Or use `.npmignore` with explicit exclusions for `.planning/`, `.context/`, `.claude/`, `*.md` (except README), etc.
- `files` array takes precedence over `.npmignore` — use one, not both
- Run `npm pack --dry-run` and audit the file list before publishing

**Phase to address:** Package Configuration phase (files list).

---

### Pitfall 39: The Install Script Fails Silently When Target Directories Don't Exist

**What goes wrong:** The installer tries to copy `hooks/dc-freshness-check.js` to `~/.claude/hooks/dc-freshness-check.js` but `~/.claude/hooks/` doesn't exist yet. `fs.copyFileSync` throws ENOENT. The installer catches the error and exits 0 silently (following the "never block" hook safety pattern), leaving files uncopied.

**Why it happens:** The "exit 0 on error" pattern is correct for hooks but wrong for the installer. A hook silently failing is acceptable; an installer silently failing is a serious usability bug.

**Consequences:** User believes install succeeded. Commands are missing. No indication of what went wrong.

**How to avoid:**
- The installer is NOT a hook — do not apply the "exit 0 on error" pattern here
- Use `fs.mkdirSync(dest, {recursive: true})` before each copy operation to ensure directories exist
- Throw (or `process.exit(1)`) on installer errors with a descriptive message
- Print each copied file to stdout so the user can see what was installed

**Phase to address:** Installer Logic phase (directory creation and error handling).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Overwrite settings.json without merging | Simpler code | Destroys user's existing hooks on re-install | Never |
| Relative paths in injected hook commands | Works in dev | Hooks silently fail post-install | Never |
| Skip `npm pack --dry-run` verification | Faster iteration | Publishes incomplete package silently | Never |
| No `--uninstall` flag in v1 | Faster to ship | Orphan settings.json entries; no clean removal | Acceptable only if README documents manual cleanup |
| Copy templates unconditionally | Simpler code | Overwrites user customizations | Never after v1.0 |
| Use `process.cwd()` for source path | Works in dev | Fails when invoked via npx from other dirs | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Claude Code settings.json | Treat as write-only target | Read first, deep-merge arrays, write back |
| npm bin entries | Assume file is executable | Add shebang + `chmod +x` + test via `npx .` |
| npm `files` array | List only top-level files | List all directory names; run `--dry-run` audit |
| Global npm symlinks | Trust `__dirname` directly | Resolve via `fs.realpathSync(__dirname)` |
| SessionStart / PostToolUse hook arrays | Replace the array | Append entries; check for duplicates first |
| Template destination | Always overwrite | Check existence; skip if present; offer `--force` |

---

## "Looks Done But Isn't" Checklist

- [ ] **`npm pack --dry-run` audit:** Every file in `commands/dc/`, `hooks/`, `agents/`, `rules/`, `templates/`, `tools/`, `bin/` appears in the pack output — verify before publishing
- [ ] **Cross-directory invocation:** Run `npx .` from a subdirectory of the project, not just the root — verify installer finds its bundled files via `__dirname`
- [ ] **Merge, not overwrite:** Install with an existing settings.json containing GSD hooks — verify GSD hooks are still present after install
- [ ] **Idempotency:** Run `--install` twice — verify no duplicate hook entries in settings.json
- [ ] **Uninstall cleanup:** Run install then uninstall — verify settings.json is returned to pre-install state
- [ ] **Absolute paths in injected hooks:** After install, inspect settings.json and confirm hook commands use absolute paths (not `node hooks/...`)
- [ ] **Missing target directory:** Delete `~/.claude/hooks/` then run install — verify installer creates the directory rather than failing silently
- [ ] **Template preservation:** Customize a template file after install, then re-install — verify the customized file is not overwritten
- [ ] **Shebang present:** Run `head -1 bin/install.js` — must be `#!/usr/bin/env node`
- [ ] **Bin permissions:** Run `ls -la bin/install.js` — must be executable (755 or 644 via npm; shebang is the real guard)

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| `files` array missing directories | MEDIUM | Re-publish package with corrected files array; users must re-run `npx domain-context-cc` |
| settings.json clobbered | LOW | User restores from `settings.json.bak` (if installer created one) or manually re-adds lost hooks |
| Relative paths in hooks | MEDIUM | Re-publish; users re-run install; manually edit `~/.claude/settings.json` to replace relative with absolute paths |
| Uninstall orphans | LOW | User manually removes dc hook entries from `~/.claude/settings.json` (3-4 lines) |
| Templates overwritten | MEDIUM | User must manually recreate customizations; no recovery if no backup |
| Silent install failure (missing dirs) | LOW | Re-run install after ensuring `~/.claude/` exists |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| P29: `files` array missing directories | Package Configuration | `npm pack --dry-run` — all expected files present |
| P30: settings.json clobbered | Installer Logic | Install with pre-existing settings.json; diff before/after |
| P31: Relative paths in hooks | Installer Logic | Inspect injected commands; run hook from unrelated directory |
| P32: `__dirname` vs `process.cwd()` | Installer Logic | Run `npx .` from subdirectory; installer finds files |
| P33: Uninstall orphans | Installer Logic | Install + uninstall; settings.json diff equals zero |
| P34: Non-executable bin entry | Package Configuration | `npx domain-context-cc` succeeds (not just `node bin/install.js`) |
| P35: Template overwrite on re-install | Installer Logic | Customize template; re-install; customization preserved |
| P36: Global vs local confusion | Installer UX | Print resolved destination before copying |
| P37: Symlink `__dirname` | Installer Logic | Test `npm install -g .` scenario; `realpathSync` used |
| P38: Dev artifacts in package | Package Configuration | `npm pack --dry-run` shows no `.planning/`, `.context/`, `.claude/` |
| P39: Silent failure on missing dirs | Installer Logic | Delete target dir; run install; dir created; no silent skip |

---

## Sources

- Direct analysis of `/Users/alevine/code/domain-context-claude/hooks/dc-freshness-check.js` and `dc-context-reminder.js`: hook path patterns, stdin contract, exit 0 on error convention
- Direct analysis of `/Users/alevine/code/domain-context-claude/.claude/settings.json`: existing hook registration format (SessionStart array, PostToolUse array with matcher), GSD and dc hooks co-registered
- Direct analysis of `/Users/alevine/code/domain-context-claude/.claude/package.json`: current `{"type":"commonjs"}` — confirms CommonJS module format for all JS files
- npm documentation (training data, HIGH confidence): `files` array behavior, `.npmignore` precedence, `npm pack --dry-run`, bin entry requirements, symlink handling
- Node.js documentation (training data, HIGH confidence): `__dirname` behavior in CommonJS modules, `fs.realpathSync`, `fs.mkdirSync({recursive: true})`
- AGENTS.md (this project): `npm pack && npx ./domain-context-cc-*.tgz` as documented test install procedure
- PROJECT.md v1.3 milestone scope: installer flags (`--global`, `--local`, `--uninstall`), settings.json hook merge requirement
- Claude Code settings.json structure (observed in project): `hooks.SessionStart` and `hooks.PostToolUse` as arrays, `matcher` field on PostToolUse entries

---
*Pitfalls research for: npm packaging and installer (v1.3 milestone)*
*Researched: 2026-03-17*
