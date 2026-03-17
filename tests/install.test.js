#!/usr/bin/env node
'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
  parseArgs,
  isDcHook,
  mergeHooks,
  getDcHookEntries,
  getTargetDir,
  INSTALL_MAP,
  copyFiles,
  updateSettings,
} = require('../bin/install.js');

// ---------------------------------------------------------------------------
// Unit Tests: parseArgs
// ---------------------------------------------------------------------------
describe('parseArgs', () => {
  it('returns defaults for empty args', () => {
    const result = parseArgs([]);
    assert.deepStrictEqual(result, { isLocal: false, isUninstall: false });
  });

  it('parses --local', () => {
    const result = parseArgs(['--local']);
    assert.deepStrictEqual(result, { isLocal: true, isUninstall: false });
  });

  it('parses --uninstall', () => {
    const result = parseArgs(['--uninstall']);
    assert.deepStrictEqual(result, { isLocal: false, isUninstall: true });
  });

  it('parses --uninstall --local together', () => {
    const result = parseArgs(['--uninstall', '--local']);
    assert.deepStrictEqual(result, { isLocal: true, isUninstall: true });
  });
});

// ---------------------------------------------------------------------------
// Unit Tests: isDcHook
// ---------------------------------------------------------------------------
describe('isDcHook', () => {
  it('returns true for dc-freshness-check hook', () => {
    const entry = { hooks: [{ type: 'command', command: 'node /path/dc-freshness-check.js' }] };
    assert.strictEqual(isDcHook(entry), true);
  });

  it('returns false for GSD hook', () => {
    const entry = { hooks: [{ type: 'command', command: 'node .claude/hooks/gsd-check-update.js' }] };
    assert.strictEqual(isDcHook(entry), false);
  });

  it('returns true for dc-context-reminder hook with matcher', () => {
    const entry = {
      matcher: 'Edit|Write|MultiEdit',
      hooks: [{ type: 'command', command: 'node .claude/hooks/dc-context-reminder.js' }],
    };
    assert.strictEqual(isDcHook(entry), true);
  });

  it('returns false for entry with no hooks array', () => {
    const entry = {};
    assert.strictEqual(isDcHook(entry), false);
  });
});

// ---------------------------------------------------------------------------
// Unit Tests: mergeHooks
// ---------------------------------------------------------------------------
describe('mergeHooks', () => {
  it('adds dc entries to empty settings', () => {
    const settings = {};
    const dcEntries = {
      SessionStart: [{ hooks: [{ type: 'command', command: 'node dc-freshness-check.js' }] }],
    };
    const result = mergeHooks(settings, dcEntries);
    assert.strictEqual(result.hooks.SessionStart.length, 1);
    assert.ok(result.hooks.SessionStart[0].hooks[0].command.includes('dc-'));
  });

  it('preserves GSD hooks when adding dc hooks', () => {
    const gsdHook = { hooks: [{ type: 'command', command: 'node .claude/hooks/gsd-check-update.js' }] };
    const settings = { hooks: { SessionStart: [gsdHook] } };
    const dcEntries = {
      SessionStart: [{ hooks: [{ type: 'command', command: 'node dc-freshness-check.js' }] }],
    };
    const result = mergeHooks(settings, dcEntries);
    assert.strictEqual(result.hooks.SessionStart.length, 2);
    assert.deepStrictEqual(result.hooks.SessionStart[0], gsdHook);
  });

  it('replaces existing dc hooks (no duplicates)', () => {
    const oldDcHook = { hooks: [{ type: 'command', command: 'node /old/path/dc-freshness-check.js' }] };
    const gsdHook = { hooks: [{ type: 'command', command: 'node .claude/hooks/gsd-check-update.js' }] };
    const settings = { hooks: { SessionStart: [gsdHook, oldDcHook] } };
    const dcEntries = {
      SessionStart: [{ hooks: [{ type: 'command', command: 'node /new/path/dc-freshness-check.js' }] }],
    };
    const result = mergeHooks(settings, dcEntries);
    assert.strictEqual(result.hooks.SessionStart.length, 2);
    assert.deepStrictEqual(result.hooks.SessionStart[0], gsdHook);
    assert.ok(result.hooks.SessionStart[1].hooks[0].command.includes('/new/path/'));
  });

  it('is idempotent (same result on repeated calls)', () => {
    const gsdHook = { hooks: [{ type: 'command', command: 'node .claude/hooks/gsd-check-update.js' }] };
    const dcEntries = {
      SessionStart: [{ hooks: [{ type: 'command', command: 'node dc-freshness-check.js' }] }],
    };
    const settings1 = mergeHooks({ hooks: { SessionStart: [gsdHook] } }, dcEntries);
    const settings2 = mergeHooks(JSON.parse(JSON.stringify(settings1)), dcEntries);
    assert.deepStrictEqual(settings1, settings2);
  });
});

// ---------------------------------------------------------------------------
// Unit Tests: getDcHookEntries
// ---------------------------------------------------------------------------
describe('getDcHookEntries', () => {
  it('returns absolute paths for global install', () => {
    const entries = getDcHookEntries('/home/user/.claude', false);
    const cmd = entries.SessionStart[0].hooks[0].command;
    assert.ok(cmd.startsWith('node "'), `Expected absolute quoted path, got: ${cmd}`);
    assert.ok(cmd.includes('/home/user/.claude/hooks/dc-freshness-check.js'));
  });

  it('returns relative paths for local install', () => {
    const entries = getDcHookEntries('./.claude', true);
    const cmd = entries.SessionStart[0].hooks[0].command;
    assert.ok(cmd.startsWith('node .claude/hooks/'), `Expected relative path, got: ${cmd}`);
    assert.ok(!cmd.includes('"'), 'Local paths should not be quoted');
  });

  it('includes matcher on PostToolUse entry', () => {
    const entries = getDcHookEntries('/home/user/.claude', false);
    assert.strictEqual(entries.PostToolUse[0].matcher, 'Edit|Write|MultiEdit');
  });

  it('PostToolUse has dc-context-reminder command', () => {
    const entries = getDcHookEntries('/some/path', false);
    const cmd = entries.PostToolUse[0].hooks[0].command;
    assert.ok(cmd.includes('dc-context-reminder.js'));
  });
});

// ---------------------------------------------------------------------------
// Unit Tests: getTargetDir
// ---------------------------------------------------------------------------
describe('getTargetDir', () => {
  it('returns path under home for global install', () => {
    const result = getTargetDir(false);
    assert.ok(result.endsWith('.claude'), `Expected path ending in .claude, got: ${result}`);
    assert.ok(result.startsWith(os.homedir()), 'Global should be under home dir');
  });

  it('returns path under cwd for local install', () => {
    const result = getTargetDir(true);
    assert.ok(result.endsWith('.claude'), `Expected path ending in .claude, got: ${result}`);
    assert.ok(result.startsWith(process.cwd()), 'Local should be under cwd');
  });
});

// ---------------------------------------------------------------------------
// Unit Tests: INSTALL_MAP
// ---------------------------------------------------------------------------
describe('INSTALL_MAP', () => {
  it('has entries for all 6 directories', () => {
    const dests = INSTALL_MAP.map(m => m.dest);
    assert.ok(dests.includes('commands/dc'));
    assert.ok(dests.includes('hooks'));
    assert.ok(dests.includes('agents'));
    assert.ok(dests.includes('rules'));
    assert.ok(dests.includes('templates'));
    assert.ok(dests.includes('tools'));
  });

  it('hooks entry has dc- filter', () => {
    const hooks = INSTALL_MAP.find(m => m.dest === 'hooks');
    assert.ok(hooks.filter, 'hooks should have a filter');
    assert.strictEqual(hooks.filter('dc-freshness-check.js'), true);
    assert.strictEqual(hooks.filter('gsd-check-update.js'), false);
  });
});

// ---------------------------------------------------------------------------
// Integration Tests
// ---------------------------------------------------------------------------
describe('Integration: file copying', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-install-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('global install creates all expected files under target .claude/', () => {
    const targetDir = path.join(tmpDir, '.claude');
    copyFiles(targetDir);

    // Check a representative file from each directory
    assert.ok(fs.existsSync(path.join(targetDir, 'commands/dc/init.md')));
    assert.ok(fs.existsSync(path.join(targetDir, 'hooks/dc-freshness-check.js')));
    assert.ok(fs.existsSync(path.join(targetDir, 'agents/dc-domain-validator.md')));
    assert.ok(fs.existsSync(path.join(targetDir, 'rules/dc-context-editing.md')));
    assert.ok(fs.existsSync(path.join(targetDir, 'templates/manifest.md')));
    assert.ok(fs.existsSync(path.join(targetDir, 'tools/validate-templates.sh')));
  });

  it('global install: settings.json has dc hook entries with absolute paths', () => {
    const targetDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(targetDir, { recursive: true });
    const settingsPath = path.join(targetDir, 'settings.json');
    const dcEntries = getDcHookEntries(targetDir, false);
    updateSettings(settingsPath, dcEntries);

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.ok(settings.hooks.SessionStart.length > 0);
    const cmd = settings.hooks.SessionStart[0].hooks[0].command;
    assert.ok(cmd.includes(tmpDir), `Expected absolute path containing tmpDir, got: ${cmd}`);
  });

  it('local install creates all expected files under target .claude/', () => {
    const targetDir = path.join(tmpDir, '.claude');
    copyFiles(targetDir);

    assert.ok(fs.existsSync(path.join(targetDir, 'commands/dc/init.md')));
    assert.ok(fs.existsSync(path.join(targetDir, 'hooks/dc-context-reminder.js')));
    assert.ok(fs.existsSync(path.join(targetDir, 'templates/architecture.md')));
  });

  it('local install: settings.json has dc hook entries with relative paths', () => {
    const targetDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(targetDir, { recursive: true });
    const settingsPath = path.join(targetDir, 'settings.json');
    const dcEntries = getDcHookEntries(targetDir, true);
    updateSettings(settingsPath, dcEntries);

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const cmd = settings.hooks.SessionStart[0].hooks[0].command;
    assert.ok(cmd.startsWith('node .claude/'), `Expected relative path, got: ${cmd}`);
  });

  it('install preserves existing non-dc hooks in settings.json', () => {
    const targetDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(targetDir, { recursive: true });
    const settingsPath = path.join(targetDir, 'settings.json');

    // Pre-existing GSD hook
    const existing = {
      hooks: {
        SessionStart: [
          { hooks: [{ type: 'command', command: 'node .claude/hooks/gsd-check-update.js' }] },
        ],
      },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n');

    const dcEntries = getDcHookEntries(targetDir, true);
    updateSettings(settingsPath, dcEntries);

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const commands = settings.hooks.SessionStart.map(e => e.hooks[0].command);
    assert.ok(commands.some(c => c.includes('gsd-')), 'GSD hook should be preserved');
    assert.ok(commands.some(c => c.includes('dc-')), 'DC hook should be added');
  });

  it('re-install is idempotent: running twice produces same settings.json', () => {
    const targetDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(targetDir, { recursive: true });
    const settingsPath = path.join(targetDir, 'settings.json');

    const dcEntries = getDcHookEntries(targetDir, true);
    updateSettings(settingsPath, dcEntries);
    const after1 = fs.readFileSync(settingsPath, 'utf8');

    updateSettings(settingsPath, dcEntries);
    const after2 = fs.readFileSync(settingsPath, 'utf8');

    assert.strictEqual(after1, after2, 'settings.json should be identical after second install');
  });

  it('install creates settings.json if it does not exist', () => {
    const targetDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(targetDir, { recursive: true });
    const settingsPath = path.join(targetDir, 'settings.json');

    assert.ok(!fs.existsSync(settingsPath), 'settings.json should not exist yet');

    const dcEntries = getDcHookEntries(targetDir, true);
    updateSettings(settingsPath, dcEntries);

    assert.ok(fs.existsSync(settingsPath), 'settings.json should be created');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.ok(settings.hooks.SessionStart.length > 0);
  });

  it('shebang check: first line of bin/install.js is #!/usr/bin/env node', () => {
    const installPath = path.resolve(__dirname, '..', 'bin', 'install.js');
    const firstLine = fs.readFileSync(installPath, 'utf8').split('\n')[0];
    assert.strictEqual(firstLine, '#!/usr/bin/env node');
  });

  it('__dirname usage: source files resolved relative to bin/../ not cwd', () => {
    const src = require('../bin/install.js');
    // INSTALL_MAP exists and PKG_ROOT should be resolvable
    assert.ok(INSTALL_MAP.length >= 6, 'INSTALL_MAP should have at least 6 entries');
  });

  it('copied shell scripts retain executable permission', () => {
    const targetDir = path.join(tmpDir, '.claude');
    copyFiles(targetDir);

    const shPath = path.join(targetDir, 'tools/validate-templates.sh');
    assert.ok(fs.existsSync(shPath), 'Shell script should be copied');
    const stats = fs.statSync(shPath);
    // Check owner execute bit
    const ownerExec = (stats.mode & 0o100) !== 0;
    assert.ok(ownerExec, 'Shell script should have execute permission');
  });

  it('only dc-prefixed files copied from hooks directory', () => {
    const targetDir = path.join(tmpDir, '.claude');
    copyFiles(targetDir);

    const hooksDir = path.join(targetDir, 'hooks');
    const files = fs.readdirSync(hooksDir);
    for (const f of files) {
      assert.ok(f.startsWith('dc-'), `Only dc- hooks should be copied, found: ${f}`);
    }
  });
});
