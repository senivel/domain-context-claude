#!/usr/bin/env node
// Domain Context Lint Check - PostToolUse hook
// When a JS file is edited in Claude Code, runs ESLint and surfaces any
// violations as additionalContext. Gives Claude immediate lint feedback
// after editing JS files, catching violations before they accumulate.
//
// Exits silently (code 0, no output) when:
//   - Tool is not Edit, Write, or MultiEdit
//   - Edited file is not a .js file
//   - ESLint binary is not found (ENOENT)
//   - ESLint reports no violations (exit 0)
//   - Any error occurs (graceful degradation)
//
// Output: JSON with hookSpecificOutput.additionalContext containing
// the ESLint stylish-formatted violation report.

const { execFileSync } = require('child_process');
const path = require('path');

const EDIT_TOOLS = ['Edit', 'Write', 'MultiEdit'];

// Stdin timeout guard: if stdin doesn't close within 3s, exit silently.
let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);

    // Tool scoping (defense-in-depth with settings.json matcher)
    if (!EDIT_TOOLS.includes(data.tool_name)) {
      process.exit(0);
    }

    // Extract file path(s) from tool input
    let filePaths = [];
    if (data.tool_input && data.tool_input.file_path) {
      filePaths = [data.tool_input.file_path];
    } else if (
      data.tool_input &&
      Array.isArray(data.tool_input.edits) &&
      data.tool_input.edits.length > 0
    ) {
      filePaths = [
        ...new Set(
          data.tool_input.edits.map((e) => e.file_path).filter(Boolean),
        ),
      ];
    }

    // JS file filter: only lint .js files
    filePaths = filePaths.filter((fp) => fp.endsWith('.js'));
    if (filePaths.length === 0) {
      process.exit(0);
    }

    // Resolve ESLint binary from the project's node_modules
    const cwd = data.cwd || process.cwd();
    const eslintBin = path.join(cwd, 'node_modules', '.bin', 'eslint');

    // Run ESLint
    let eslintOutput;
    try {
      execFileSync(
        eslintBin,
        [...filePaths, '--format', 'stylish', '--no-warn-ignored'],
        {
          timeout: 5000,
          encoding: 'utf8',
          cwd: cwd,
        },
      );
      // If execFileSync returns normally, ESLint exited 0 (no violations)
      process.exit(0);
    } catch (err) {
      if (err.status === 1) {
        // ESLint found violations -- stdout contains the report
        eslintOutput = err.stdout;
      } else if (err.code === 'ENOENT') {
        // ESLint binary not found
        process.exit(0);
      } else {
        // Any other error (timeout, etc.)
        process.exit(0);
      }
    }

    if (!eslintOutput || !eslintOutput.trim()) {
      process.exit(0);
    }

    // Output violations as additionalContext
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: eslintOutput.trim(),
      },
    };

    process.stdout.write(JSON.stringify(output));
  } catch (_e) {
    // Silent fail -- never block tool use
    process.exit(0);
  }
});
