#!/usr/bin/env node
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const HOOK_PATH = path.resolve(__dirname, '..', 'hooks', 'dc-lint-check.js');
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Helper: run the hook with given stdin data and return stdout.
 * Returns empty string if the process exits with code 0 and no output.
 */
function runHook(stdinData, cwd) {
  try {
    const result = execFileSync('node', [HOOK_PATH], {
      input: JSON.stringify(stdinData),
      encoding: 'utf8',
      timeout: 10000,
      cwd: cwd || PROJECT_ROOT,
    });
    return result;
  } catch (err) {
    // If hook exits with non-zero, treat as error
    if (err.status !== 0) {
      throw err;
    }
    return err.stdout || '';
  }
}

// ---------------------------------------------------------------------------
// Test 1: JS file with ESLint violations surfaces additionalContext
// ---------------------------------------------------------------------------
describe('dc-lint-check hook', () => {
  let tmpDir;

  it('surfaces ESLint violations for edited JS files', () => {
    // Create a temp dir with a JS file that has a lint violation
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-lint-test-'));
    const jsFile = path.join(tmpDir, 'bad.js');
    fs.writeFileSync(jsFile, 'var unused_var = 1;\n');

    // Create a minimal eslint config in the temp dir
    fs.writeFileSync(
      path.join(tmpDir, 'eslint.config.js'),
      `const { defineConfig } = require('eslint/config');
const js = require('@eslint/js');
module.exports = defineConfig([
  { files: ['**/*.js'], extends: [js.configs.recommended] },
]);
`,
    );

    // Symlink node_modules from the project root so eslint is available
    fs.symlinkSync(
      path.join(PROJECT_ROOT, 'node_modules'),
      path.join(tmpDir, 'node_modules'),
    );

    const stdout = runHook(
      {
        tool_name: 'Edit',
        tool_input: { file_path: jsFile },
        cwd: tmpDir,
      },
      PROJECT_ROOT,
    );

    assert.ok(stdout.length > 0, 'Should produce output for lint violations');
    const output = JSON.parse(stdout);
    assert.ok(output.hookSpecificOutput, 'Should have hookSpecificOutput');
    assert.strictEqual(output.hookSpecificOutput.hookEventName, 'PostToolUse');
    assert.ok(
      output.hookSpecificOutput.additionalContext.length > 0,
      'Should have additionalContext with violation text',
    );

    // Clean up
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ---------------------------------------------------------------------------
  // Test 2: Non-JS file exits silently
  // ---------------------------------------------------------------------------
  it('exits silently for non-JS files (.css)', () => {
    const stdout = runHook({
      tool_name: 'Edit',
      tool_input: { file_path: '/some/path/styles.css' },
      cwd: PROJECT_ROOT,
    });

    assert.strictEqual(stdout, '', 'Should produce no output for non-JS files');
  });

  // ---------------------------------------------------------------------------
  // Test 3: Non-edit tool exits silently
  // ---------------------------------------------------------------------------
  it('exits silently for non-edit tools (Read)', () => {
    const stdout = runHook({
      tool_name: 'Read',
      tool_input: { file_path: '/some/path/file.js' },
      cwd: PROJECT_ROOT,
    });

    assert.strictEqual(
      stdout,
      '',
      'Should produce no output for non-edit tools',
    );
  });

  // ---------------------------------------------------------------------------
  // Test 4: MultiEdit extracts file_path from first edit
  // ---------------------------------------------------------------------------
  it('extracts file_path from MultiEdit edits array', () => {
    const stdout = runHook({
      tool_name: 'MultiEdit',
      tool_input: {
        edits: [
          {
            file_path: '/some/path/styles.css',
            old_string: 'a',
            new_string: 'b',
          },
        ],
      },
      cwd: PROJECT_ROOT,
    });

    // .css file so should be silent
    assert.strictEqual(
      stdout,
      '',
      'Should extract file_path from edits and exit silently for non-JS',
    );
  });

  // ---------------------------------------------------------------------------
  // Test 5: Missing ESLint binary exits silently
  // ---------------------------------------------------------------------------
  it('exits silently when ESLint binary does not exist', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-lint-no-eslint-'));
    const jsFile = path.join(tmpDir, 'file.js');
    fs.writeFileSync(jsFile, 'var x = 1;\n');

    // No node_modules symlink -> no eslint binary
    const stdout = runHook(
      {
        tool_name: 'Edit',
        tool_input: { file_path: jsFile },
        cwd: tmpDir,
      },
      PROJECT_ROOT,
    );

    assert.strictEqual(
      stdout,
      '',
      'Should produce no output when ESLint is missing',
    );

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ---------------------------------------------------------------------------
  // Test 6: ESLint exits 0 (no violations) -> silent
  // ---------------------------------------------------------------------------
  it('exits silently when ESLint finds no violations', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-lint-clean-'));
    const jsFile = path.join(tmpDir, 'clean.js');
    fs.writeFileSync(jsFile, "'use strict';\n");

    // Create a minimal eslint config
    fs.writeFileSync(
      path.join(tmpDir, 'eslint.config.js'),
      `const { defineConfig } = require('eslint/config');
const js = require('@eslint/js');
module.exports = defineConfig([
  { files: ['**/*.js'], extends: [js.configs.recommended] },
]);
`,
    );

    fs.symlinkSync(
      path.join(PROJECT_ROOT, 'node_modules'),
      path.join(tmpDir, 'node_modules'),
    );

    const stdout = runHook(
      {
        tool_name: 'Write',
        tool_input: { file_path: jsFile },
        cwd: tmpDir,
      },
      PROJECT_ROOT,
    );

    assert.strictEqual(
      stdout,
      '',
      'Should produce no output when ESLint finds no violations',
    );

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ---------------------------------------------------------------------------
  // Test 7: Malformed JSON stdin exits silently
  // ---------------------------------------------------------------------------
  it('exits silently on malformed JSON stdin', () => {
    let stdout;
    try {
      stdout = execFileSync('node', [HOOK_PATH], {
        input: 'not valid json{{{',
        encoding: 'utf8',
        timeout: 10000,
      });
    } catch (err) {
      // Should exit 0 even on bad input
      assert.strictEqual(
        err.status,
        null,
        'Should not exit with non-zero code',
      );
      stdout = err.stdout || '';
    }

    assert.strictEqual(
      stdout,
      '',
      'Should produce no output on malformed JSON',
    );
  });
});
