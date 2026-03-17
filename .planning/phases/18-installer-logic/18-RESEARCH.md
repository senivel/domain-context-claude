# Phase 18: Installer Logic - Research

**Researched:** 2026-03-17
**Domain:** Node.js CLI installer (file copying, JSON merging, idempotency)
**Confidence:** HIGH

## Summary

This phase implements `bin/install.js` — a zero-dependency Node.js CLI that copies distributable files to `~/.claude/` (global) or `./.claude/` (local) and merges hook entries into `settings.json`. The domain is straightforward: recursive directory copying with `fs.cpSync`, JSON read-modify-write for settings.json, and CLI argument parsing via `process.argv`.

The critical complexity is settings.json hook merging. The installer must add dc hook entries without clobbering existing hooks (e.g., GSD hooks), handle idempotent re-install (no duplicate entries), and cleanly remove only dc entries on uninstall. The settings.json structure uses arrays of hook-group objects under `hooks.SessionStart`, `hooks.PostToolUse`, etc.

**Primary recommendation:** Use `fs.cpSync` with `{ recursive: true }` for directory copies, identify dc hooks by matching `dc-` in command strings, and use a filter-then-append strategy for idempotent hook merging.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Overwrite existing files silently -- installer files are canonical; user customizations belong in separate files
- Copy templates/ to the install target (not read from npm cache) -- skills reference install-location templates
- Mirror source layout under target `.claude/` -- `commands/dc/`, `hooks/`, `agents/`, `rules/`, `templates/`
- Include tools/validate-templates.sh in the install
- Identify dc hooks by matching command path containing `dc-` -- consistent with `dc:` prefix convention
- Global installs use absolute paths -- `node ~/.claude/hooks/dc-freshness-check.js`
- Local installs use relative paths -- `node .claude/hooks/dc-freshness-check.js` -- portable across machines
- Create settings.json if it doesn't exist -- minimal valid file with just dc hook entries
- Remove dc-prefixed files only on uninstall -- leave directories intact
- Respect `--local` scope -- `--uninstall` alone cleans global, `--uninstall --local` cleans local `.claude/`
- Leave empty hooks object after removing dc hooks -- don't delete settings.json
- Print each removed file/hook entry to confirm what was cleaned up

### Claude's Discretion
- Internal code structure (helper functions, error handling patterns)
- Console output formatting and colors
- File copy order and parallelism

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INST-01 | `npx domain-context-cc` installs globally to `~/.claude/` | Default mode, `os.homedir()` + `.claude/` target path |
| INST-02 | `--local` installs to `./.claude/` | `process.argv` parsing, `process.cwd()` + `.claude/` target |
| INST-03 | `--uninstall` removes dc-prefixed files and hook entries | Filter-and-rewrite strategy for settings.json, `fs.rmSync` for files |
| INST-04 | Merges hook entries without clobbering existing hooks | Read-filter-append pattern on settings.json hook arrays |
| INST-05 | Re-running is idempotent (no duplicates) | Filter existing dc entries before appending fresh ones |
| INST-06 | Global install uses absolute paths in hook commands | Path construction: `node "${absoluteTarget}/hooks/dc-*.js"` |
| INST-07 | Uses `__dirname` to locate bundled files | `path.resolve(__dirname, '..')` to find package root |
| INST-08 | Has `#!/usr/bin/env node` shebang | Already present in stub |
| INST-09 | Prints success message with next steps | Console output after install/uninstall completes |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `fs` (Node built-in) | Node 20+ | File copying, reading, removing | Zero dependencies requirement |
| `path` (Node built-in) | Node 20+ | Path resolution and joining | Cross-platform path handling |
| `os` (Node built-in) | Node 20+ | `os.homedir()` for global install target | Portable home directory |

### Key APIs
| API | Availability | Purpose |
|-----|-------------|---------|
| `fs.cpSync(src, dest, { recursive: true })` | Node 16.7+ (stable 20+) | Recursive directory copy |
| `fs.mkdirSync(path, { recursive: true })` | Node 10+ | Ensure target directories exist |
| `fs.rmSync(path)` | Node 14+ | Remove individual files on uninstall |
| `fs.existsSync(path)` | All versions | Check for existing settings.json |
| `fs.readFileSync` / `fs.writeFileSync` | All versions | settings.json read-modify-write |
| `JSON.parse` / `JSON.stringify` | Built-in | settings.json manipulation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `fs.cpSync` recursive | Manual recursive walk + `fs.copyFileSync` | More code, same result; cpSync is stable in Node 20 |
| `process.argv` manual parsing | `util.parseArgs` (Node 18.3+) | parseArgs is available but overkill for 2 flags |

**No installation needed** -- all Node.js built-ins, zero dependencies.

## Architecture Patterns

### Recommended File Structure
```
bin/
  install.js          # Single-file installer (~200-300 lines)
```

No separate modules needed. The installer is a single-file script with helper functions.

### Pattern 1: Source-to-Target Directory Map
**What:** A manifest of which source directories map to which target subdirectories.
**When to use:** Always -- drives both install and uninstall.
**Example:**
```javascript
// Source dirs (relative to package root) -> target subdirs (under .claude/)
const INSTALL_MAP = [
  { src: 'commands/dc', dest: 'commands/dc' },
  { src: 'hooks',       dest: 'hooks',      filter: f => f.startsWith('dc-') },
  { src: 'agents',      dest: 'agents',     filter: f => f.startsWith('dc-') },
  { src: 'rules',       dest: 'rules',      filter: f => f.startsWith('dc-') },
  { src: 'templates',   dest: 'templates' },
  { src: 'tools',       dest: 'tools',      filter: f => f.startsWith('validate-') },
];
```

### Pattern 2: Filter-Then-Append for Idempotent Hook Merging
**What:** Remove all existing dc hook entries from settings.json arrays, then append fresh ones.
**When to use:** Every install (handles both first install and re-install).
**Example:**
```javascript
function isDcHook(entry) {
  // Match hook entries whose command contains 'dc-'
  return entry.hooks?.some(h => h.command && h.command.includes('dc-'));
}

function mergeHooks(settings, dcEntries) {
  for (const [event, entries] of Object.entries(dcEntries)) {
    const existing = settings.hooks?.[event] || [];
    // Filter out old dc entries, then append new ones
    const cleaned = existing.filter(e => !isDcHook(e));
    settings.hooks = settings.hooks || {};
    settings.hooks[event] = [...cleaned, ...entries];
  }
  return settings;
}
```

### Pattern 3: Path Strategy by Install Mode
**What:** Global installs use absolute paths in hook commands; local installs use relative paths.
**When to use:** When constructing hook command strings for settings.json.
**Example:**
```javascript
function hookCommand(hookFile, targetDir, isLocal) {
  if (isLocal) {
    return `node .claude/hooks/${hookFile}`;
  }
  // Absolute path with quotes for spaces in home dir
  return `node "${path.join(targetDir, 'hooks', hookFile)}"`;
}
```

### Pattern 4: CLI Argument Parsing
**What:** Simple argv parsing for `--local` and `--uninstall` flags.
**Example:**
```javascript
const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const isUninstall = args.includes('--uninstall');
```

### Anti-Patterns to Avoid
- **Reading from `process.cwd()` to find source files:** The installer is executed from the user's project directory. Source files must be located via `__dirname`, not `cwd()`.
- **Using `fs.cpSync` on the entire package root:** Would copy `.git/`, `.planning/`, etc. Must copy only the mapped directories.
- **Stringifying settings.json without preserving formatting:** Always use `JSON.stringify(obj, null, 2)` for readable output.
- **Deleting directories on uninstall:** Other tools (GSD) share the same directory structure. Only remove dc-prefixed files.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recursive directory copy | Manual fs.readdirSync walk | `fs.cpSync(src, dest, { recursive: true })` | Handles nested dirs, permissions, symlinks |
| Home directory resolution | `process.env.HOME` | `os.homedir()` | Cross-platform (Windows USERPROFILE, etc.) |
| Path joining | String concatenation | `path.join()` / `path.resolve()` | Handles separators, normalization |

## Common Pitfalls

### Pitfall 1: Race Condition on settings.json
**What goes wrong:** Two concurrent installs (e.g., dc + another plugin) read-modify-write settings.json and one overwrites the other's changes.
**Why it happens:** No file locking in Node.js fs built-ins.
**How to avoid:** Acceptable risk for CLI installer. Not a server -- user runs one install at a time. Document that concurrent installs are unsupported.
**Warning signs:** Missing hook entries after install.

### Pitfall 2: settings.json Parse Failure
**What goes wrong:** Existing settings.json has trailing commas, comments, or is malformed.
**Why it happens:** Hand-edited or corrupted file.
**How to avoid:** Wrap `JSON.parse` in try-catch. On parse failure, back up the existing file to `settings.json.bak` and warn the user before creating a fresh one. Or abort with a clear error telling the user to fix the file.
**Warning signs:** `SyntaxError: Unexpected token` during install.

### Pitfall 3: __dirname Points to Wrong Location
**What goes wrong:** When run via `npx`, `__dirname` resolves to a temporary npm cache directory, not the project source.
**Why it happens:** npx downloads the package to a temp location and runs it from there.
**How to avoid:** This is actually correct behavior -- `__dirname` for the bin script points to wherever npm placed the package, and the distributable files are co-located. The `files` field in package.json ensures all needed directories are included in the tarball.
**Warning signs:** "File not found" errors during install.

### Pitfall 4: Permissions on Copied Files
**What goes wrong:** Copied shell scripts (validate-templates.sh) lose execute permission.
**Why it happens:** `fs.cpSync` preserves permissions by default, but some platforms may not.
**How to avoid:** After copying, explicitly `fs.chmodSync` shell scripts to `0o755`.
**Warning signs:** "Permission denied" when running validate-templates.sh.

### Pitfall 5: Matcher Field Not Preserved
**What goes wrong:** The dc-context-reminder hook requires a `matcher: "Edit|Write|MultiEdit"` field. If the hook entry template forgets this, the hook fires on every tool use.
**Why it happens:** Copy-paste error in the hook entry definition.
**How to avoid:** Define hook entries as constant objects with all required fields.
**Warning signs:** dc-context-reminder.js running on non-edit tools (it handles this gracefully but wastes cycles).

### Pitfall 6: Quoted Paths in Hook Commands
**What goes wrong:** Absolute paths with spaces (e.g., `/Users/John Smith/.claude/...`) break shell execution.
**Why it happens:** Path not quoted in the command string.
**How to avoid:** Always wrap absolute paths in double quotes within the command string: `node "/path/with spaces/hook.js"`.
**Warning signs:** "No such file or directory" on machines with spaces in username.

## Code Examples

### Hook Entry Definitions
```javascript
// The two dc hook entries to register in settings.json
function getDcHookEntries(targetDir, isLocal) {
  const hooksDir = isLocal ? '.claude/hooks' : path.join(targetDir, 'hooks');
  const quote = isLocal ? '' : '"';

  return {
    SessionStart: [{
      hooks: [{
        type: 'command',
        command: `node ${quote}${path.join(hooksDir, 'dc-freshness-check.js')}${quote}`
      }]
    }],
    PostToolUse: [{
      matcher: 'Edit|Write|MultiEdit',
      hooks: [{
        type: 'command',
        command: `node ${quote}${path.join(hooksDir, 'dc-context-reminder.js')}${quote}`
      }]
    }]
  };
}
```

### Settings.json Read-Modify-Write
```javascript
function updateSettings(settingsPath, dcEntries, isUninstall) {
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    const raw = fs.readFileSync(settingsPath, 'utf8');
    settings = JSON.parse(raw);
  }

  settings.hooks = settings.hooks || {};

  for (const event of ['SessionStart', 'PostToolUse']) {
    const existing = settings.hooks[event] || [];
    // Remove all dc entries
    const cleaned = existing.filter(entry => !isDcHook(entry));

    if (!isUninstall && dcEntries[event]) {
      settings.hooks[event] = [...cleaned, ...dcEntries[event]];
    } else {
      settings.hooks[event] = cleaned;
      // Remove empty arrays
      if (settings.hooks[event].length === 0) {
        delete settings.hooks[event];
      }
    }
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}
```

### Uninstall File Removal
```javascript
function removeDcFiles(targetDir) {
  const removed = [];
  for (const mapping of INSTALL_MAP) {
    const dir = path.join(targetDir, mapping.dest);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      // Only remove dc-prefixed files (or all files in dc-owned dirs like commands/dc)
      const shouldRemove = mapping.filter ? mapping.filter(file) : true;
      if (shouldRemove) {
        const filePath = path.join(dir, file);
        fs.rmSync(filePath, { force: true });
        removed.push(filePath);
      }
    }
  }
  return removed;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `readdirSync` + `copyFileSync` recursion | `fs.cpSync(src, dest, { recursive: true })` | Node 16.7 (stable 20) | Much less code |
| `process.env.HOME` for home dir | `os.homedir()` | Node 2+ | Cross-platform |
| `fs.rmdirSync` with recursive | `fs.rmSync` | Node 14 | Cleaner API |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node --test` (Node 20+) |
| Config file | none -- see Wave 0 |
| Quick run command | `node --test tests/install.test.js` |
| Full suite command | `node --test tests/*.test.js` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INST-01 | Global install copies files to ~/.claude/ | integration | `node --test tests/install.test.js` | No -- Wave 0 |
| INST-02 | --local install copies files to ./.claude/ | integration | `node --test tests/install.test.js` | No -- Wave 0 |
| INST-03 | --uninstall removes dc files and hooks | integration | `node --test tests/install.test.js` | No -- Wave 0 |
| INST-04 | Hook merging preserves existing hooks | unit | `node --test tests/install.test.js` | No -- Wave 0 |
| INST-05 | Idempotent re-install (no duplicates) | unit | `node --test tests/install.test.js` | No -- Wave 0 |
| INST-06 | Global uses absolute paths | unit | `node --test tests/install.test.js` | No -- Wave 0 |
| INST-07 | Uses __dirname for source files | unit | `node --test tests/install.test.js` | No -- Wave 0 |
| INST-08 | Shebang present | unit | `node --test tests/install.test.js` | Yes (stub exists) |
| INST-09 | Success message printed | integration | `node --test tests/install.test.js` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test tests/install.test.js`
- **Per wave merge:** `node --test tests/*.test.js`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/install.test.js` -- covers INST-01 through INST-09
- [ ] Test helper to create temp directories and mock home/project dirs
- [ ] No framework install needed -- `node --test` is built-in to Node 20+

Note: Tests should use temp directories (via `fs.mkdtempSync`) to avoid touching the real `~/.claude/` or project `.claude/`. Extract core logic into testable functions (e.g., `mergeHooks`, `isDcHook`, `getDcHookEntries`) that can be unit tested without filesystem side effects.

## Open Questions

1. **Should the installer handle `commands/dc/` as a nested directory under `commands/`?**
   - What we know: The target structure is `.claude/commands/dc/*.md`. `fs.cpSync` with recursive handles this.
   - What's unclear: Whether `.claude/commands/` might already contain other skills from other tools.
   - Recommendation: Create `.claude/commands/dc/` via `mkdirSync({ recursive: true })`. Only touch files inside `dc/` subdirectory. Other skills live in separate subdirectories.

2. **Should the installer back up settings.json before modifying?**
   - What we know: Parse failures could lose existing settings.
   - What's unclear: Whether users expect backup behavior from a CLI installer.
   - Recommendation: On JSON parse failure, create `settings.json.bak` and warn. On successful parse, no backup needed (the operation is idempotent and reversible via uninstall).

## Sources

### Primary (HIGH confidence)
- Node.js 20 `fs` module documentation -- `cpSync`, `rmSync`, `mkdirSync` APIs verified via runtime check
- Existing project code -- `bin/install.js` stub, `package.json`, hooks, settings.json structure
- Real `~/.claude/settings.json` -- verified hook entry format with GSD hooks present

### Secondary (MEDIUM confidence)
- Claude Code hook format inferred from existing settings.json entries (both project-local and global)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all Node.js built-ins, verified available in Node 20
- Architecture: HIGH -- straightforward file-copy + JSON-merge pattern, all decisions locked
- Pitfalls: HIGH -- based on direct inspection of existing code and settings.json structure

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable domain, no external dependencies)
