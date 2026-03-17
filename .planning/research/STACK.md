# Stack Research

**Domain:** npm packaging and Node.js installer for Claude Code extension
**Researched:** 2026-03-17
**Confidence:** HIGH

---

## What Changed in v1.3

This is a focused delta from the v1.2 research. All prior content (skills, hooks, agents, rules, templates) remains valid and unchanged. This document covers only what is needed for THREE new artifacts:

1. **`package.json`** — npm package configuration (bin entry, files list, engines)
2. **`bin/install.js`** — Node.js installer script (--global, --local, --uninstall, settings.json merge)
3. **`README.md`** — Final documentation (no new technology, just content)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | `>=20.0.0` minimum; v24 Active LTS current | Runtime for installer script | v20 and v22 are Maintenance LTS; v24 is Active LTS as of 2026. `fs.cpSync` (added v16.7.0) and `fs.rmSync` (added v14.14.0) are both available across all supported LTS versions. Matches existing hook runtime. |
| npm | bundled with Node | Package registry and npx distribution | `npx domain-context-cc` downloads and runs the `bin` entry without a separate install step. Zero user friction. `files` whitelist controls what ships in the tarball. |

### Node.js Built-in APIs

All needed functionality is covered by Node.js built-ins. Verified functional in v24.14.0 (current dev environment).

| API | Module | Purpose | Notes |
|-----|--------|---------|-------|
| `fs.cpSync(src, dest, opts)` | `fs` | Recursive directory copy for installer | Added v16.7.0. Use `{recursive: true, force: true}`. `force: true` overwrites on reinstall. |
| `fs.rmSync(path, opts)` | `fs` | Remove installed directories on uninstall | Added v14.14.0. Use `{recursive: true, force: true}`. |
| `fs.existsSync(path)` | `fs` | Check if settings.json or install dir exists before reading | Available since Node.js 0.x. |
| `fs.readFileSync(path, enc)` | `fs` | Read settings.json for merge | Synchronous I/O is correct here — installer is a one-shot CLI, not a server. |
| `fs.writeFileSync(path, data)` | `fs` | Write merged settings.json | Pair with `JSON.stringify(obj, null, 2)` to keep file human-readable. |
| `fs.mkdirSync(path, opts)` | `fs` | Create target directories if missing | Use `{recursive: true}` to create nested dirs without checking intermediate existence. |
| `path.join(...parts)` | `path` | Construct platform-safe file paths | Use for all path construction. Never string concatenation. |
| `path.dirname(p)` | `path` | Resolve directory from `__filename` or a path | Used to locate source files relative to the installed script. |
| `os.homedir()` | `os` | Resolve `~/.claude` for global install target | More reliable than `process.env.HOME` which can be unset in some environments. |
| `process.argv` | built-in | CLI flag parsing (--global, --local, --uninstall) | A `for` loop over `process.argv.slice(2)` handles all 3 flags with 5 lines of code. |
| `process.exit(code)` | built-in | Exit with error code on failure | Use `process.exit(1)` on hard errors; `process.exit(0)` on success or expected early exit. |
| `JSON.parse` / `JSON.stringify` | built-in | Parse and re-serialize settings.json | `JSON.stringify(obj, null, 2)` produces 2-space-indented output consistent with Claude Code's own format. |

### Supporting Libraries

**None.** Zero runtime dependencies. This is a hard project constraint — and the right architectural choice for an installer:

- Installers that pull transitive deps break when npm registry is unreachable or slow
- All needed APIs are built-in to Node.js (verified above)
- Existing hooks use zero deps — installer must match this pattern

---

## package.json Configuration

The complete set of fields needed for npm distribution:

```json
{
  "name": "domain-context-cc",
  "version": "1.3.0",
  "description": "Claude Code extension for Domain Context specification — skills, hooks, agents, and installer",
  "type": "commonjs",
  "bin": {
    "domain-context-cc": "./bin/install.js"
  },
  "files": [
    "bin/",
    "commands/",
    "hooks/",
    "agents/",
    "rules/",
    "templates/"
  ],
  "engines": {
    "node": ">=20.0.0"
  },
  "keywords": ["claude", "claude-code", "domain-context"],
  "license": "MIT"
}
```

**`bin` field:** Maps the package name to the installer entry point. When a user runs `npx domain-context-cc`, npm downloads the package and executes `bin/install.js`. The file must have `#!/usr/bin/env node` as its first line. npm automatically sets the executable bit during install.

**`files` field:** Whitelist of what ships in the tarball. Omitting `.planning/`, `.context/`, `.git/`, `tools/`, root `.md` files keeps the tarball small and avoids shipping development artifacts. Note: `README.md`, `package.json`, and `LICENSE` are always included by npm regardless of `files`.

**`engines` field:** `>=20.0.0` targets the Maintenance LTS minimum. This is a soft advisory — npm warns if violated but does not block install. The installer can add a hard runtime check: `if (parseInt(process.version.slice(1)) < 20) { process.exit(1); }`.

**`type: "commonjs"`:** Explicit declaration prevents Node.js module resolution ambiguity. Existing hooks use `require()` — this must match.

**No `main` field needed:** The package is not a library. `bin` is the entry point.

---

## Node.js Patterns for Installer

### CLI flag parsing

```javascript
const args = process.argv.slice(2);
const flags = {};
for (const arg of args) {
  if (arg.startsWith('--')) flags[arg.slice(2)] = true;
}

// Default: global install (no flags = --global behavior)
const isGlobal  = flags.global || (!flags.local && !flags.uninstall);
const isLocal   = flags.local;
const isUninstall = flags.uninstall;
```

Default to global install because `npx domain-context-cc` (no flags) is the primary use case.

### Install target paths

```javascript
const path = require('path');
const os   = require('os');

const GLOBAL_DIR = path.join(os.homedir(), '.claude');
const LOCAL_DIR  = path.join(process.cwd(), '.claude');

const installDir   = isGlobal ? GLOBAL_DIR : LOCAL_DIR;
const commandsDir  = path.join(installDir, 'commands', 'dc');
const hooksDir     = path.join(installDir, 'hooks');
const agentsDir    = path.join(installDir, 'agents');
const rulesDir     = path.join(installDir, 'rules');
// Templates namespaced to avoid collision with other tools' templates
const templatesDir = path.join(installDir, 'domain-context', 'templates');
const settingsPath = path.join(installDir, 'settings.json');
```

The `domain-context/templates/` subdirectory namespacing is already established in existing skills (they look up templates from `~/.claude/domain-context/templates/`). Keep this consistent.

### File copy (install)

```javascript
const fs   = require('fs');

const srcRoot = path.join(__dirname, '..');  // package root

fs.mkdirSync(commandsDir,  { recursive: true });
fs.mkdirSync(hooksDir,     { recursive: true });
fs.mkdirSync(agentsDir,    { recursive: true });
fs.mkdirSync(rulesDir,     { recursive: true });
fs.mkdirSync(templatesDir, { recursive: true });

fs.cpSync(path.join(srcRoot, 'commands', 'dc'), commandsDir,  { recursive: true, force: true });
fs.cpSync(path.join(srcRoot, 'hooks'),          hooksDir,     { recursive: true, force: true });
fs.cpSync(path.join(srcRoot, 'agents'),         agentsDir,    { recursive: true, force: true });
fs.cpSync(path.join(srcRoot, 'rules'),          rulesDir,     { recursive: true, force: true });
fs.cpSync(path.join(srcRoot, 'templates'),      templatesDir, { recursive: true, force: true });
```

`force: true` enables idempotent reinstall — existing files are overwritten with the new version.

### settings.json merge

The actual `~/.claude/settings.json` structure (observed directly) uses arrays of hook entry objects. The merge must append without duplicating, and use absolute paths for global installs.

```javascript
function mergeSettings(settingsPath, hookEvent, entry) {
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      // Malformed settings.json — start fresh rather than corrupt it further
      settings = {};
    }
  }
  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks[hookEvent]) settings.hooks[hookEvent] = [];

  // Idempotency: skip if this command is already registered
  const newCommand = entry.hooks[0].command;
  const alreadyRegistered = settings.hooks[hookEvent].some(
    e => e.hooks && e.hooks.some(h => h.command === newCommand)
  );
  if (!alreadyRegistered) {
    settings.hooks[hookEvent].push(entry);
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
}

// Build entries using absolute paths (prevents breakage across cwd changes)
const sessionStartEntry = {
  hooks: [{
    type: 'command',
    command: `node "${path.join(hooksDir, 'dc-freshness-check.js')}"`
  }]
};

const postToolUseEntry = {
  matcher: 'Edit|Write|MultiEdit',
  hooks: [{
    type: 'command',
    command: `node "${path.join(hooksDir, 'dc-context-reminder.js')}"`
  }]
};

mergeSettings(settingsPath, 'SessionStart', sessionStartEntry);
mergeSettings(settingsPath, 'PostToolUse',  postToolUseEntry);
```

**Why absolute paths:** The observed `~/.claude/settings.json` uses absolute quoted paths for global hooks (e.g., `node "/Users/alevine/.claude/hooks/gsd-check-update.js"`). Relative paths break when Claude Code changes working directory between sessions.

### Uninstall

```javascript
function uninstall(installDir, settingsPath) {
  // Remove only the files this installer placed — never touch .context/
  const dirsToRemove = [
    path.join(installDir, 'commands', 'dc'),
    path.join(installDir, 'domain-context', 'templates'),
  ];
  const filesToRemove = [
    path.join(installDir, 'hooks', 'dc-freshness-check.js'),
    path.join(installDir, 'hooks', 'dc-context-reminder.js'),
    path.join(installDir, 'agents', 'dc-domain-validator.md'),
    path.join(installDir, 'rules',  'dc-context-editing.md'),
  ];

  for (const dir of dirsToRemove) {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  }
  for (const file of filesToRemove) {
    if (fs.existsSync(file)) fs.rmSync(file);
  }

  // Remove hook entries from settings.json
  if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const commandsToRemove = ['dc-freshness-check.js', 'dc-context-reminder.js'];
    for (const event of Object.keys(settings.hooks || {})) {
      settings.hooks[event] = (settings.hooks[event] || []).filter(
        entry => !entry.hooks || !entry.hooks.some(
          h => commandsToRemove.some(cmd => h.command && h.command.includes(cmd))
        )
      );
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  }
}
```

**Critical:** Never remove `.context/` directories. Those are user data created by dc:init in target projects, not installer artifacts.

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `chalk`, `ora`, `kleur` | Runtime dep violates constraint; installer output is minimal | `process.stdout.write()` with plain text |
| `commander`, `yargs`, `minimist` | Deps for 3 boolean flags is wasteful | `process.argv.slice(2)` loop (5 lines) |
| `fs-extra` | Wraps `fs` — no benefit now that `fs.cpSync` exists natively | `fs.cpSync` with `{recursive: true}` |
| `glob` / `fast-glob` | Only needed for dynamic file discovery — installer copies a known static directory layout | Hardcoded `fs.cpSync` calls per directory |
| `rimraf` | `fs.rmSync(dir, {recursive: true})` added in Node 14.14.0 covers the need natively | `fs.rmSync` built-in |
| `shelljs` | Shell command wrapper — no shell commands needed | Direct `fs` API calls |
| `json-merge-patch`, `deepmerge` | settings.json merge is shallow (append to arrays) — no deep-merge needed | `Array.prototype.some` + `Array.prototype.push` |
| `semver` | Engine version check is a single integer comparison | `parseInt(process.version.slice(1))` |
| ESM / `import`/`export` | Hooks use CommonJS `require()` — mixing module systems creates confusion | `require()` throughout, `"type": "commonjs"` in package.json |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `fs.cpSync` | Manual recursive walk with `fs.readdirSync` + `fs.copyFileSync` | If targeting Node < 16.7 (not needed — LTS minimum is 20) |
| Manual `process.argv` parsing | `commander` or `minimist` | If CLI needed >5 flags, subcommands, `--help` generation, or value-bearing flags — overkill for 3 boolean flags |
| `JSON.parse` / `JSON.stringify` | `json5`, `jsonc-parser` | If settings.json had comments — Claude Code's settings.json is strict JSON with no comments |
| `os.homedir()` | `process.env.HOME` | If targeting Windows explicitly — `os.homedir()` works on all platforms |
| Array-append merge | Full JSON deep-merge library | If settings had arbitrary nested structures to merge — only hook arrays need appending |
| Absolute hook paths in settings.json | Relative paths | If the installer only supported local install — global install requires absolute paths for cross-session reliability |

---

## Development Workflow

| Tool | Purpose | Command |
|------|---------|---------|
| `npm pack` | Test package before publish; verify `files` list | `npm pack` → produces `domain-context-cc-X.Y.Z.tgz` |
| `npx ./domain-context-cc-*.tgz` | Simulate end-user `npx domain-context-cc` invocation locally | Run after `npm pack` |
| `npm publish --dry-run` | Verify what would be uploaded to registry | Run before first publish |

---

## Version Compatibility

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js 20 (Maintenance LTS) | `fs.cpSync`, `fs.rmSync` | cpSync added v16.7.0, rmSync added v14.14.0 — both available. |
| Node.js 22 (Maintenance LTS) | All APIs used | No compatibility issues. |
| Node.js 24 (Active LTS) | All APIs used | Verified locally in dev environment. |
| npm 10+ | `files` whitelist, `bin` entry | No special npm version requirements for these fields. |
| Claude Code | current (2026) | settings.json hook format verified from live `~/.claude/settings.json`. |

---

## Sources

- https://nodejs.org/docs/latest-v24.x/api/fs.html — `fs.cpSync` verified: added v16.7.0, supports `{recursive: true, force: true}` options. HIGH confidence.
- https://nodejs.org/en/about/previous-releases — Node.js 24 is Active LTS, 22 and 20 are Maintenance LTS as of 2026-03-17. HIGH confidence.
- `/Users/alevine/.claude/settings.json` (read directly) — Verified settings.json structure: hooks arrays with `{hooks: [{type, command}]}` entries, absolute quoted paths for global hooks. HIGH confidence.
- Local `node -e` verification — `fs.cpSync` with `{recursive: true}` functional in Node 24.14.0; `typeof fs.cpSync === 'function'` confirmed. HIGH confidence.
- Existing hooks in this repo (`hooks/dc-freshness-check.js`) — Confirmed `require()` / CommonJS pattern, `process.stdin` / `process.stdout` usage. HIGH confidence.

---
*Stack research for: npm packaging and Node.js installer (domain-context-cc v1.3)*
*Researched: 2026-03-17*
