# Phase 17: Package Configuration - Research

**Researched:** 2026-03-17
**Domain:** npm package configuration (package.json, files whitelist, bin entry)
**Confidence:** HIGH

## Summary

Phase 17 is a greenfield package.json creation for an npm package that distributes markdown skills, Node.js hooks, and shell scripts -- no compiled code, no runtime dependencies. The project currently has no package.json at all, and the `bin/` directory does not yet exist (created in Phase 18).

The npm `files` field acts as a whitelist: only listed directories/files are included in the tarball. The `bin` field entries are always included automatically regardless of the `files` list, but since `bin/` is one of our 7 distributable directories, listing it explicitly in `files` is cleaner and more obvious. The `package.json`, `README.md`, `LICENSE`, and `CHANGELOG.md` are always included by npm regardless of the `files` field.

**Primary recommendation:** Create a minimal package.json with `files` whitelist (7 directories), `bin` mapping, zero dependencies, `type: "commonjs"`, and `engines: ">=20.0.0"`. Use `npm pack --dry-run` as the verification command.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PKG-01 | package.json has correct name (`domain-context-cc`), version, and description | Standard npm package.json fields -- see Code Examples section |
| PKG-02 | package.json bin entry maps package name to `./bin/install.js` | npm bin field documentation -- see Architecture Patterns |
| PKG-03 | package.json files whitelist includes all 7 distributable directories | npm files whitelist behavior -- see Architecture Patterns |
| PKG-04 | package.json engines constraint set to `>=20.0.0` | STATE.md decision from project research |
| PKG-05 | package.json has zero runtime dependencies and `type: "commonjs"` | Confirmed by hook file analysis -- CommonJS style, no imports |
</phase_requirements>

## Standard Stack

### Core

No libraries needed. This phase creates configuration only.

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| npm | 10+ | Package manager | Ships with Node.js; `npm pack` and `npm init` are the standard tools |

### Supporting

None -- zero dependencies is an explicit requirement (PKG-05).

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `files` whitelist | `.npmignore` | `files` is safer -- explicit inclusion vs. fragile exclusion. Whitelist approach prevents accidentally shipping dev artifacts |

## Architecture Patterns

### package.json Structure

The complete package.json for this phase:

```json
{
  "name": "domain-context-cc",
  "version": "1.3.0",
  "description": "Domain Context tooling for Claude Code — skills, hooks, agents, and installer",
  "type": "commonjs",
  "bin": {
    "domain-context-cc": "./bin/install.js"
  },
  "files": [
    "commands/",
    "agents/",
    "hooks/",
    "rules/",
    "templates/",
    "tools/",
    "bin/"
  ],
  "engines": {
    "node": ">=20.0.0"
  },
  "keywords": [
    "claude-code",
    "domain-context",
    "ai",
    "context",
    "documentation"
  ],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/senivel/domain-context-claude"
  }
}
```

### How npm `files` Whitelist Works

**Always included (regardless of `files`):**
- `package.json`
- `README.md` (case-insensitive)
- `LICENSE` / `LICENCE`
- `CHANGELOG.md`
- The file referenced in `main`
- Files referenced in `bin`

**Always excluded (regardless of `files`):**
- `.git/`
- `node_modules/`
- `.npmrc`
- Files matching `.gitignore` patterns (when no `.npmignore` exists)

**With `files` whitelist set:**
- Only listed paths are included (plus the always-included files above)
- Directory entries (e.g., `"commands/"`) include all contents recursively
- `.planning/`, `.context/`, `.claude/`, `PLAN.md`, `ARCHITECTURE.md`, `AGENTS.md`, `CLAUDE.md` are excluded automatically because they are not in the whitelist

### How `bin` Entry Works

The `bin` field creates a symlink in `node_modules/.bin/` when installed, and makes the command available globally for `npx` invocation:

```json
"bin": {
  "domain-context-cc": "./bin/install.js"
}
```

- The key (`domain-context-cc`) becomes the CLI command name
- The value (`./bin/install.js`) must be a relative path from package root
- The referenced file MUST have a `#!/usr/bin/env node` shebang (Phase 18 concern, INST-08)
- The file MUST have executable permissions (`chmod +x`)
- npm automatically adds the file to the tarball even if not in `files` -- but we include `bin/` in `files` for clarity

### Anti-Patterns to Avoid
- **Using `.npmignore` instead of `files`:** Exclusion lists are fragile -- new dev files get shipped if you forget to add them. Whitelist is safer.
- **Omitting `type` field:** Without explicit `"type": "commonjs"`, Node.js defaults to CommonJS, but being explicit prevents confusion and satisfies PKG-05.
- **Setting version to 0.x.x:** This project has shipped v1.0-v1.2 milestones. Version 1.3.0 matches the milestone number and signals stability.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File inclusion control | Custom build script to copy files | `files` field in package.json | npm handles this natively; build scripts add maintenance burden |
| CLI entry point | Custom shell wrapper | `bin` field in package.json | npm creates symlinks/shims automatically on install |

## Common Pitfalls

### Pitfall 1: bin/ Directory Doesn't Exist Yet
**What goes wrong:** `npm pack` may warn or fail if `bin/install.js` doesn't exist
**Why it happens:** Phase 18 creates the installer; Phase 17 only configures package.json
**How to avoid:** Create a minimal placeholder `bin/install.js` with shebang and a "not yet implemented" message, OR accept that `npm pack --dry-run` won't list bin/ until Phase 18
**Warning signs:** `npm pack --dry-run` output missing bin/ entries
**Recommendation:** Create a stub `bin/install.js` so the package is valid and testable after this phase

### Pitfall 2: Missing Executable Permission on bin File
**What goes wrong:** `npx domain-context-cc` fails with permission denied
**Why it happens:** Git doesn't always preserve executable bits; new files default to 644
**How to avoid:** Run `chmod +x bin/install.js` after creating it
**Warning signs:** Works locally but fails after clone/install

### Pitfall 3: Trailing Slash Semantics in files Array
**What goes wrong:** Confusion about whether `"commands"` vs `"commands/"` matters
**Why it happens:** npm treats both the same -- directories are included recursively either way
**How to avoid:** Use trailing slash for clarity (signals "this is a directory"), but both work

### Pitfall 4: .gitignore Interaction with npm pack
**What goes wrong:** Files listed in `.gitignore` may be excluded from the tarball
**Why it happens:** When no `.npmignore` exists, npm uses `.gitignore` as a fallback exclusion list
**How to avoid:** The current `.gitignore` excludes `.claude/**` which is fine (we don't ship that). All 7 distributable directories are NOT in `.gitignore`, so they will be included. No `.npmignore` needed.
**Warning signs:** `npm pack --dry-run` missing expected files

### Pitfall 5: `main` Field Not Needed
**What goes wrong:** Adding a `main` field pointing to a non-existent index.js
**Why it happens:** Habit from library packages
**How to avoid:** This is a CLI tool, not a library. No `main` field needed. The `bin` field is sufficient.

## Code Examples

### Verification Command (Primary)
```bash
# List all files that would be in the tarball
npm pack --dry-run 2>&1
```

Expected output should show:
- `package.json`
- `README.md`
- All files under `commands/`, `agents/`, `hooks/`, `rules/`, `templates/`, `tools/`, `bin/`
- Should NOT show `.planning/`, `.context/`, `.claude/`, `PLAN.md`, `ARCHITECTURE.md`, etc.

### Stub bin/install.js (for Phase 17 testability)
```javascript
#!/usr/bin/env node
// bin/install.js — Domain Context for Claude Code installer
// Full implementation in Phase 18
'use strict';

console.log('domain-context-cc installer');
console.log('Full implementation coming in Phase 18.');
process.exit(0);
```

### Verifying npx Invocation
```bash
# Pack and test
npm pack
npx ./domain-context-cc-1.3.0.tgz
# Should print the stub message
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.npmignore` exclusion | `files` whitelist | npm 5+ (2017) | Whitelist is now the recommended approach |
| No `type` field | Explicit `"type": "commonjs"` or `"type": "module"` | Node.js 12+ (2019) | Being explicit prevents ambiguity |
| `engines` as advisory | `engines` still advisory by default | Unchanged | Use `engine-strict` in `.npmrc` to enforce; npm warns but doesn't block by default |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Shell commands (npm pack --dry-run, npx) |
| Config file | none -- uses npm built-in commands |
| Quick run command | `npm pack --dry-run 2>&1` |
| Full suite command | `npm pack && npx ./domain-context-cc-*.tgz` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PKG-01 | name, version, description correct | smoke | `node -e "const p=require('./package.json'); console.assert(p.name==='domain-context-cc'); console.assert(p.version==='1.3.0')"` | N/A (checks package.json) |
| PKG-02 | bin entry maps to ./bin/install.js | smoke | `node -e "const p=require('./package.json'); console.assert(p.bin['domain-context-cc']==='./bin/install.js')"` | N/A |
| PKG-03 | files whitelist has 7 directories | smoke | `npm pack --dry-run 2>&1 \| grep -c '/'` (verify expected dirs present) | N/A |
| PKG-04 | engines >= 20.0.0 | smoke | `node -e "const p=require('./package.json'); console.assert(p.engines.node==='>=20.0.0')"` | N/A |
| PKG-05 | zero deps, type commonjs | smoke | `node -e "const p=require('./package.json'); console.assert(!p.dependencies); console.assert(p.type==='commonjs')"` | N/A |

### Sampling Rate
- **Per task commit:** `npm pack --dry-run 2>&1`
- **Per wave merge:** `npm pack && npx ./domain-context-cc-*.tgz`
- **Phase gate:** All 5 PKG requirements verified via smoke commands

### Wave 0 Gaps
- [ ] `bin/install.js` -- stub needed for npm pack to include bin/ (created as part of this phase)
- No test framework needed -- all verification is via npm built-in commands

## Open Questions

1. **Version number: 1.3.0 or 0.1.0?**
   - What we know: Previous milestones were v1.0, v1.1, v1.2. This is v1.3.
   - Recommendation: Use `1.3.0` to match milestone versioning. This is the first npm publish, but the project is mature.

2. **License file**
   - What we know: No LICENSE file exists in the repo. package.json can declare `"license": "MIT"` but npm will warn if no LICENSE file exists.
   - Recommendation: Note this for Phase 19 (README & Publishing) or handle in this phase as a minor addition.

3. **repository URL**
   - What we know: CLAUDE.md references `github.com/senivel/domain-context-claude` but this should be verified.
   - Recommendation: Include repository field; can be corrected in Phase 19 if needed.

## Sources

### Primary (HIGH confidence)
- npm official docs: package.json `files`, `bin`, `engines`, `type` fields -- stable API, documented since npm v5+
- Project file analysis: hooks use CommonJS (`#!/usr/bin/env node`, `require()` style), zero external imports
- STATE.md: `>=20.0.0` engine constraint decided during project research

### Secondary (MEDIUM confidence)
- [npm package.json docs](https://docs.npmjs.com/cli/v10/configuring-npm/package-json/) -- fetched but content extraction failed; claims based on well-established npm behavior verified across multiple projects

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- npm package.json is extremely well-documented and stable
- Architecture: HIGH -- straightforward configuration, no ambiguity in requirements
- Pitfalls: HIGH -- common npm packaging issues are well-known

**Research date:** 2026-03-17
**Valid until:** Indefinite -- npm package.json format is stable
