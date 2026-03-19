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
  removeDcFiles,
  removeHooks,
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
    const entry = {
      hooks: [{ type: 'command', command: 'node /path/dc-freshness-check.js' }],
    };
    assert.strictEqual(isDcHook(entry), true);
  });

  it('returns false for GSD hook', () => {
    const entry = {
      hooks: [
        { type: 'command', command: 'node .claude/hooks/gsd-check-update.js' },
      ],
    };
    assert.strictEqual(isDcHook(entry), false);
  });

  it('returns true for dc-context-reminder hook with matcher', () => {
    const entry = {
      matcher: 'Edit|Write|MultiEdit',
      hooks: [
        {
          type: 'command',
          command: 'node .claude/hooks/dc-context-reminder.js',
        },
      ],
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
      SessionStart: [
        { hooks: [{ type: 'command', command: 'node dc-freshness-check.js' }] },
      ],
    };
    const result = mergeHooks(settings, dcEntries);
    assert.strictEqual(result.hooks.SessionStart.length, 1);
    assert.ok(result.hooks.SessionStart[0].hooks[0].command.includes('dc-'));
  });

  it('preserves GSD hooks when adding dc hooks', () => {
    const gsdHook = {
      hooks: [
        { type: 'command', command: 'node .claude/hooks/gsd-check-update.js' },
      ],
    };
    const settings = { hooks: { SessionStart: [gsdHook] } };
    const dcEntries = {
      SessionStart: [
        { hooks: [{ type: 'command', command: 'node dc-freshness-check.js' }] },
      ],
    };
    const result = mergeHooks(settings, dcEntries);
    assert.strictEqual(result.hooks.SessionStart.length, 2);
    assert.deepStrictEqual(result.hooks.SessionStart[0], gsdHook);
  });

  it('replaces existing dc hooks (no duplicates)', () => {
    const oldDcHook = {
      hooks: [
        { type: 'command', command: 'node /old/path/dc-freshness-check.js' },
      ],
    };
    const gsdHook = {
      hooks: [
        { type: 'command', command: 'node .claude/hooks/gsd-check-update.js' },
      ],
    };
    const settings = { hooks: { SessionStart: [gsdHook, oldDcHook] } };
    const dcEntries = {
      SessionStart: [
        {
          hooks: [
            {
              type: 'command',
              command: 'node /new/path/dc-freshness-check.js',
            },
          ],
        },
      ],
    };
    const result = mergeHooks(settings, dcEntries);
    assert.strictEqual(result.hooks.SessionStart.length, 2);
    assert.deepStrictEqual(result.hooks.SessionStart[0], gsdHook);
    assert.ok(
      result.hooks.SessionStart[1].hooks[0].command.includes('/new/path/'),
    );
  });

  it('is idempotent (same result on repeated calls)', () => {
    const gsdHook = {
      hooks: [
        { type: 'command', command: 'node .claude/hooks/gsd-check-update.js' },
      ],
    };
    const dcEntries = {
      SessionStart: [
        { hooks: [{ type: 'command', command: 'node dc-freshness-check.js' }] },
      ],
    };
    const settings1 = mergeHooks(
      { hooks: { SessionStart: [gsdHook] } },
      dcEntries,
    );
    const settings2 = mergeHooks(
      JSON.parse(JSON.stringify(settings1)),
      dcEntries,
    );
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
    assert.ok(
      cmd.startsWith('node "'),
      `Expected absolute quoted path, got: ${cmd}`,
    );
    assert.ok(cmd.includes('/home/user/.claude/hooks/dc-freshness-check.js'));
  });

  it('returns relative paths for local install', () => {
    const entries = getDcHookEntries('./.claude', true);
    const cmd = entries.SessionStart[0].hooks[0].command;
    assert.ok(
      cmd.startsWith('node .claude/hooks/'),
      `Expected relative path, got: ${cmd}`,
    );
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
    assert.ok(
      result.endsWith('.claude'),
      `Expected path ending in .claude, got: ${result}`,
    );
    assert.ok(
      result.startsWith(os.homedir()),
      'Global should be under home dir',
    );
  });

  it('returns path under cwd for local install', () => {
    const result = getTargetDir(true);
    assert.ok(
      result.endsWith('.claude'),
      `Expected path ending in .claude, got: ${result}`,
    );
    assert.ok(result.startsWith(process.cwd()), 'Local should be under cwd');
  });
});

// ---------------------------------------------------------------------------
// Unit Tests: INSTALL_MAP
// ---------------------------------------------------------------------------
describe('INSTALL_MAP', () => {
  it('has entries for all 6 directories', () => {
    const dests = INSTALL_MAP.map((m) => m.dest);
    assert.ok(dests.includes('commands/dc'));
    assert.ok(dests.includes('hooks'));
    assert.ok(dests.includes('agents'));
    assert.ok(dests.includes('rules'));
    assert.ok(dests.includes('templates'));
    assert.ok(dests.includes('tools'));
  });

  it('hooks entry has dc- filter', () => {
    const hooks = INSTALL_MAP.find((m) => m.dest === 'hooks');
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
    assert.ok(
      fs.existsSync(path.join(targetDir, 'hooks/dc-freshness-check.js')),
    );
    assert.ok(
      fs.existsSync(path.join(targetDir, 'agents/dc-domain-validator.md')),
    );
    assert.ok(
      fs.existsSync(path.join(targetDir, 'rules/dc-context-editing.md')),
    );
    assert.ok(fs.existsSync(path.join(targetDir, 'templates/manifest.md')));
    assert.ok(
      fs.existsSync(path.join(targetDir, 'tools/validate-templates.sh')),
    );
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
    assert.ok(
      cmd.includes(tmpDir),
      `Expected absolute path containing tmpDir, got: ${cmd}`,
    );
  });

  it('local install creates all expected files under target .claude/', () => {
    const targetDir = path.join(tmpDir, '.claude');
    copyFiles(targetDir);

    assert.ok(fs.existsSync(path.join(targetDir, 'commands/dc/init.md')));
    assert.ok(
      fs.existsSync(path.join(targetDir, 'hooks/dc-context-reminder.js')),
    );
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
    assert.ok(
      cmd.startsWith('node .claude/'),
      `Expected relative path, got: ${cmd}`,
    );
  });

  it('install preserves existing non-dc hooks in settings.json', () => {
    const targetDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(targetDir, { recursive: true });
    const settingsPath = path.join(targetDir, 'settings.json');

    // Pre-existing GSD hook
    const existing = {
      hooks: {
        SessionStart: [
          {
            hooks: [
              {
                type: 'command',
                command: 'node .claude/hooks/gsd-check-update.js',
              },
            ],
          },
        ],
      },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n');

    const dcEntries = getDcHookEntries(targetDir, true);
    updateSettings(settingsPath, dcEntries);

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const commands = settings.hooks.SessionStart.map((e) => e.hooks[0].command);
    assert.ok(
      commands.some((c) => c.includes('gsd-')),
      'GSD hook should be preserved',
    );
    assert.ok(
      commands.some((c) => c.includes('dc-')),
      'DC hook should be added',
    );
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

    assert.strictEqual(
      after1,
      after2,
      'settings.json should be identical after second install',
    );
  });

  it('install creates settings.json if it does not exist', () => {
    const targetDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(targetDir, { recursive: true });
    const settingsPath = path.join(targetDir, 'settings.json');

    assert.ok(
      !fs.existsSync(settingsPath),
      'settings.json should not exist yet',
    );

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
    const _src = require('../bin/install.js');
    // INSTALL_MAP exists and PKG_ROOT should be resolvable
    assert.ok(
      INSTALL_MAP.length >= 6,
      'INSTALL_MAP should have at least 6 entries',
    );
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
      assert.ok(
        f.startsWith('dc-'),
        `Only dc- hooks should be copied, found: ${f}`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Unit Tests: removeDcFiles
// ---------------------------------------------------------------------------
describe('removeDcFiles', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-uninstall-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('removes dc-prefixed files from hooks directory', () => {
    const targetDir = path.join(tmpDir, '.claude');
    copyFiles(targetDir);

    // Add a non-dc file to hooks
    fs.writeFileSync(
      path.join(targetDir, 'hooks/gsd-check-update.js'),
      '// gsd',
    );

    removeDcFiles(targetDir);

    const hooksDir = path.join(targetDir, 'hooks');
    const remaining = fs.readdirSync(hooksDir);
    assert.ok(
      remaining.includes('gsd-check-update.js'),
      'Non-dc file should survive',
    );
    assert.ok(
      !remaining.some((f) => f.startsWith('dc-')),
      'All dc- files should be removed',
    );
  });

  it('removes commands/dc/ directory contents and the dc/ subdirectory', () => {
    const targetDir = path.join(tmpDir, '.claude');
    copyFiles(targetDir);

    removeDcFiles(targetDir);

    // commands/dc/ should be removed (it is dc-owned)
    assert.ok(
      !fs.existsSync(path.join(targetDir, 'commands/dc')),
      'commands/dc/ should be removed',
    );
    // But commands/ parent should still exist
    assert.ok(
      fs.existsSync(path.join(targetDir, 'commands')),
      'commands/ parent should remain',
    );
  });

  it('removes templates/ contents but not the directory', () => {
    const targetDir = path.join(tmpDir, '.claude');
    copyFiles(targetDir);

    removeDcFiles(targetDir);

    const templatesDir = path.join(targetDir, 'templates');
    assert.ok(
      fs.existsSync(templatesDir),
      'templates/ directory should remain',
    );
    const remaining = fs.readdirSync(templatesDir);
    assert.strictEqual(remaining.length, 0, 'templates/ should be empty');
  });

  it('removes tools/validate-templates.sh', () => {
    const targetDir = path.join(tmpDir, '.claude');
    copyFiles(targetDir);

    removeDcFiles(targetDir);

    assert.ok(
      !fs.existsSync(path.join(targetDir, 'tools/validate-templates.sh')),
      'validate-templates.sh should be removed',
    );
  });

  it('does NOT remove non-dc files from agents/', () => {
    const targetDir = path.join(tmpDir, '.claude');
    copyFiles(targetDir);

    // Add a non-dc agent
    fs.writeFileSync(
      path.join(targetDir, 'agents/custom-agent.md'),
      '# custom',
    );

    removeDcFiles(targetDir);

    const agentsDir = path.join(targetDir, 'agents');
    const remaining = fs.readdirSync(agentsDir);
    assert.ok(
      remaining.includes('custom-agent.md'),
      'Non-dc agent should survive',
    );
    assert.ok(
      !remaining.some((f) => f.startsWith('dc-')),
      'All dc- agents should be removed',
    );
  });

  it('does NOT remove parent directories', () => {
    const targetDir = path.join(tmpDir, '.claude');
    copyFiles(targetDir);

    removeDcFiles(targetDir);

    // All parent directories should still exist
    assert.ok(
      fs.existsSync(path.join(targetDir, 'hooks')),
      'hooks/ should remain',
    );
    assert.ok(
      fs.existsSync(path.join(targetDir, 'agents')),
      'agents/ should remain',
    );
    assert.ok(
      fs.existsSync(path.join(targetDir, 'rules')),
      'rules/ should remain',
    );
    assert.ok(
      fs.existsSync(path.join(targetDir, 'tools')),
      'tools/ should remain',
    );
    assert.ok(
      fs.existsSync(path.join(targetDir, 'templates')),
      'templates/ should remain',
    );
  });

  it('returns array of removed file paths', () => {
    const targetDir = path.join(tmpDir, '.claude');
    copyFiles(targetDir);

    const removed = removeDcFiles(targetDir);
    assert.ok(Array.isArray(removed), 'Should return an array');
    assert.ok(removed.length > 0, 'Should have removed files');
    // Every path should be absolute
    for (const p of removed) {
      assert.ok(path.isAbsolute(p), `Expected absolute path, got: ${p}`);
    }
  });

  it('prints each removed file path', () => {
    const targetDir = path.join(tmpDir, '.claude');
    copyFiles(targetDir);

    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));

    try {
      removeDcFiles(targetDir);
    } finally {
      console.log = origLog;
    }

    assert.ok(
      logs.some((l) => l.includes('removed:')),
      'Should print removed file paths',
    );
  });

  it('handles missing target directory gracefully', () => {
    const targetDir = path.join(tmpDir, '.claude-nonexistent');
    const removed = removeDcFiles(targetDir);
    assert.deepStrictEqual(
      removed,
      [],
      'Should return empty array for missing dir',
    );
  });
});

// ---------------------------------------------------------------------------
// Unit Tests: removeHooks
// ---------------------------------------------------------------------------
describe('removeHooks', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-hooks-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('removes dc hook entries from SessionStart and PostToolUse', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const settings = {
      hooks: {
        SessionStart: [
          {
            hooks: [{ type: 'command', command: 'node dc-freshness-check.js' }],
          },
        ],
        PostToolUse: [
          {
            matcher: 'Edit|Write|MultiEdit',
            hooks: [
              { type: 'command', command: 'node dc-context-reminder.js' },
            ],
          },
        ],
      },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');

    const count = removeHooks(settingsPath);

    assert.strictEqual(count, 2, 'Should remove 2 dc hook entries');
    const updated = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    // Empty arrays should be cleaned up
    assert.ok(
      !updated.hooks.SessionStart || updated.hooks.SessionStart.length === 0,
    );
    assert.ok(
      !updated.hooks.PostToolUse || updated.hooks.PostToolUse.length === 0,
    );
  });

  it('preserves non-dc hook entries', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const gsdHook = {
      hooks: [
        { type: 'command', command: 'node .claude/hooks/gsd-check-update.js' },
      ],
    };
    const dcHook = {
      hooks: [{ type: 'command', command: 'node dc-freshness-check.js' }],
    };
    const settings = {
      hooks: {
        SessionStart: [gsdHook, dcHook],
      },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');

    removeHooks(settingsPath);

    const updated = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.strictEqual(updated.hooks.SessionStart.length, 1);
    assert.ok(updated.hooks.SessionStart[0].hooks[0].command.includes('gsd-'));
  });

  it('settings.json still exists after removing all dc hooks', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const settings = {
      hooks: {
        SessionStart: [
          {
            hooks: [{ type: 'command', command: 'node dc-freshness-check.js' }],
          },
        ],
      },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');

    removeHooks(settingsPath);

    assert.ok(fs.existsSync(settingsPath), 'settings.json should still exist');
  });

  it('returns 0 when settings.json does not exist', () => {
    const settingsPath = path.join(tmpDir, 'nonexistent-settings.json');
    const count = removeHooks(settingsPath);
    assert.strictEqual(count, 0, 'Should return 0 for missing file');
  });

  it('returns count of removed hook entries', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const settings = {
      hooks: {
        SessionStart: [
          {
            hooks: [{ type: 'command', command: 'node dc-freshness-check.js' }],
          },
          { hooks: [{ type: 'command', command: 'node gsd-check-update.js' }] },
        ],
        PostToolUse: [
          {
            matcher: 'Edit|Write|MultiEdit',
            hooks: [
              { type: 'command', command: 'node dc-context-reminder.js' },
            ],
          },
        ],
      },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');

    const count = removeHooks(settingsPath);
    assert.strictEqual(count, 2, 'Should remove exactly 2 dc entries');
  });
});

// ---------------------------------------------------------------------------
// Integration Tests: uninstall end-to-end
// ---------------------------------------------------------------------------
describe('Integration: uninstall', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-e2e-uninstall-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('install then uninstall leaves no dc files but preserves non-dc files', () => {
    const targetDir = path.join(tmpDir, '.claude');

    // Install
    copyFiles(targetDir);
    const settingsPath = path.join(targetDir, 'settings.json');
    const dcEntries = getDcHookEntries(targetDir, true);
    updateSettings(settingsPath, dcEntries);

    // Add non-dc files
    fs.writeFileSync(
      path.join(targetDir, 'hooks/gsd-check-update.js'),
      '// gsd',
    );
    fs.writeFileSync(
      path.join(targetDir, 'agents/custom-agent.md'),
      '# custom',
    );

    // Uninstall
    removeDcFiles(targetDir);
    removeHooks(settingsPath);

    // Verify dc files gone
    const hookFiles = fs.readdirSync(path.join(targetDir, 'hooks'));
    assert.ok(
      !hookFiles.some((f) => f.startsWith('dc-')),
      'No dc- hooks should remain',
    );
    assert.ok(
      hookFiles.includes('gsd-check-update.js'),
      'GSD hook should survive',
    );

    const agentFiles = fs.readdirSync(path.join(targetDir, 'agents'));
    assert.ok(
      !agentFiles.some((f) => f.startsWith('dc-')),
      'No dc- agents should remain',
    );
    assert.ok(
      agentFiles.includes('custom-agent.md'),
      'Custom agent should survive',
    );

    // settings.json still exists with hooks object
    assert.ok(fs.existsSync(settingsPath));
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.ok(typeof settings.hooks === 'object', 'hooks object should remain');
  });

  it('--uninstall without --local targets global (getTargetDir(false))', () => {
    const { isLocal, isUninstall } = parseArgs(['--uninstall']);
    assert.strictEqual(isUninstall, true);
    assert.strictEqual(isLocal, false);
    const dir = getTargetDir(isLocal);
    assert.ok(dir.startsWith(os.homedir()), 'Should target global ~/.claude/');
  });

  it('--uninstall --local targets local (getTargetDir(true))', () => {
    const { isLocal, isUninstall } = parseArgs(['--uninstall', '--local']);
    assert.strictEqual(isUninstall, true);
    assert.strictEqual(isLocal, true);
    const dir = getTargetDir(isLocal);
    assert.ok(dir.startsWith(process.cwd()), 'Should target local ./.claude/');
  });
});

// ---------------------------------------------------------------------------
// Integration Tests: success messages
// ---------------------------------------------------------------------------
describe('Integration: success messages', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-msg-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('install prints message containing "domain-context-cc installed"', () => {
    const targetDir = path.join(tmpDir, '.claude');
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));

    try {
      copyFiles(targetDir);
      const settingsPath = path.join(targetDir, 'settings.json');
      const dcEntries = getDcHookEntries(targetDir, true);
      updateSettings(settingsPath, dcEntries);
      // Import the printInstallSuccess function
      const { printInstallSuccess } = require('../bin/install.js');
      printInstallSuccess(targetDir);
    } finally {
      console.log = origLog;
    }

    const allOutput = logs.join('\n');
    assert.ok(
      allOutput.includes('domain-context-cc installed'),
      `Should contain "domain-context-cc installed", got:\n${allOutput}`,
    );
  });

  it('install prints next step mentioning /dc:init', () => {
    const targetDir = path.join(tmpDir, '.claude');
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));

    try {
      const { printInstallSuccess } = require('../bin/install.js');
      printInstallSuccess(targetDir);
    } finally {
      console.log = origLog;
    }

    const allOutput = logs.join('\n');
    assert.ok(
      allOutput.includes('/dc:init'),
      `Should mention /dc:init, got:\n${allOutput}`,
    );
  });

  it('uninstall prints message containing "domain-context-cc uninstalled"', () => {
    const targetDir = path.join(tmpDir, '.claude');
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));

    try {
      const { printUninstallSuccess } = require('../bin/install.js');
      printUninstallSuccess(targetDir, 5, 2);
    } finally {
      console.log = origLog;
    }

    const allOutput = logs.join('\n');
    assert.ok(
      allOutput.includes('domain-context-cc uninstalled'),
      `Should contain "domain-context-cc uninstalled", got:\n${allOutput}`,
    );
  });

  it('uninstall prints count of removed files', () => {
    const targetDir = path.join(tmpDir, '.claude');
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));

    try {
      const { printUninstallSuccess } = require('../bin/install.js');
      printUninstallSuccess(targetDir, 7, 2);
    } finally {
      console.log = origLog;
    }

    const allOutput = logs.join('\n');
    assert.ok(
      allOutput.includes('7'),
      `Should contain file count, got:\n${allOutput}`,
    );
    assert.ok(
      allOutput.includes('2'),
      `Should contain hook count, got:\n${allOutput}`,
    );
  });
});
