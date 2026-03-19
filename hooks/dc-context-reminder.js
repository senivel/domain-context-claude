#!/usr/bin/env node
// Domain Context Reminder - PostToolUse hook
// When a file is edited in a directory containing CONTEXT.md (or whose parent
// contains one), emits a reminder to update it. Debounces per directory per
// session so only the first edit triggers a reminder.
//
// Exits silently (code 0, no output) when:
//   - Tool is not Edit, Write, or MultiEdit
//   - No CONTEXT.md found in edited file's directory or parent
//   - Already reminded for this directory in this session
//   - Any error occurs (graceful degradation)
//
// Output: JSON with hookSpecificOutput.additionalContext containing
// a reminder message with the relative path to CONTEXT.md.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

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

    // Extract file path from tool input
    let filePath = data.tool_input && data.tool_input.file_path;
    if (
      !filePath &&
      data.tool_input &&
      Array.isArray(data.tool_input.edits) &&
      data.tool_input.edits.length > 0
    ) {
      filePath = data.tool_input.edits[0].file_path;
    }
    if (!filePath) {
      process.exit(0);
    }

    // CONTEXT.md proximity detection: same directory, then parent
    const editedDir = path.dirname(filePath);
    let contextPath = null;

    const sameDir = path.join(editedDir, 'CONTEXT.md');
    const parentDir = path.join(path.dirname(editedDir), 'CONTEXT.md');

    if (fs.existsSync(sameDir)) {
      contextPath = sameDir;
    } else if (fs.existsSync(parentDir)) {
      contextPath = parentDir;
    }

    if (!contextPath) {
      process.exit(0);
    }

    // Session-scoped debounce: one reminder per directory per session
    const sessionId = data.session_id || 'unknown';
    const dirHash = crypto
      .createHash('md5')
      .update(editedDir)
      .digest('hex')
      .slice(0, 8);
    const debounceFile = path.join(
      os.tmpdir(),
      'dc-reminder-' + sessionId + '-' + dirHash + '.json',
    );

    if (fs.existsSync(debounceFile)) {
      process.exit(0);
    }

    // Write debounce marker (non-fatal if it fails)
    try {
      fs.writeFileSync(debounceFile, JSON.stringify({ reminded: Date.now() }));
    } catch (_) {
      // Proceed with reminder even if debounce write fails
    }

    // Build reminder message with relative path
    const cwd = data.cwd || process.cwd();
    const relPath = path.relative(cwd, contextPath);
    const message = `CONTEXT.md may need updating: ${relPath} \u2014 you just edited files in this area`;

    const output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: message,
      },
    };

    process.stdout.write(JSON.stringify(output));
  } catch (e) {
    // Silent fail -- never block tool use
    process.exit(0);
  }
});
