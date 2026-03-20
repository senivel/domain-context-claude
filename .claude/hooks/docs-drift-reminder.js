#!/usr/bin/env node
// Docs Drift Reminder - PostToolUse hook (contributor-only)
// When a source-of-truth file is edited, reminds the contributor that
// corresponding docs/README sections may need updating.
//
// Exits silently (code 0, no output) when:
//   - Tool is not Edit, Write, or MultiEdit
//   - Edited file doesn't map to any doc page
//   - Already reminded for this mapping in this session
//   - Any error occurs (graceful degradation)
//
// Output: JSON with hookSpecificOutput.additionalContext containing
// a reminder with the specific doc pages to check.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const EDIT_TOOLS = ['Edit', 'Write', 'MultiEdit'];

// Map source patterns to the doc pages they affect.
// Keys are path segments to match against; values are human-readable targets.
const DRIFT_MAP = [
  {
    pattern: 'commands/dc/',
    docs: [
      'README.md (Commands table)',
      'docs/src/content/docs/reference/cli.mdx',
    ],
  },
  {
    pattern: 'bin/install.js',
    docs: [
      'README.md (Installation / What Gets Installed)',
      'docs/src/content/docs/getting-started/quickstart.mdx',
      'docs/src/content/docs/guides/contributing.mdx',
    ],
  },
  {
    pattern: 'hooks/',
    docs: [
      'README.md (What Gets Installed)',
      'docs/src/content/docs/guides/architecture.mdx',
    ],
  },
  {
    pattern: 'templates/',
    docs: ['docs/src/content/docs/guides/user-guide.mdx'],
  },
  {
    pattern: 'agents/',
    docs: [
      'README.md (What Gets Installed)',
      'docs/src/content/docs/guides/architecture.mdx',
    ],
  },
  {
    pattern: 'rules/',
    docs: ['README.md (What Gets Installed)'],
  },
];

// Stdin timeout guard: if stdin doesn't close within 3s, exit silently.
let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);

    // Tool scoping
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

    // Normalize to relative path from project root
    const cwd = data.cwd || process.cwd();
    const relPath = path.relative(cwd, filePath);

    // Skip edits to docs themselves (avoid circular reminders)
    if (relPath.startsWith('docs/') || relPath === 'README.md') {
      process.exit(0);
    }

    // Find all matching drift mappings
    const matchedDocs = new Set();
    for (const entry of DRIFT_MAP) {
      if (relPath.includes(entry.pattern)) {
        for (const doc of entry.docs) {
          matchedDocs.add(doc);
        }
      }
    }

    if (matchedDocs.size === 0) {
      process.exit(0);
    }

    // Session-scoped debounce: one reminder per matched-set per session
    const sessionId = data.session_id || 'unknown';
    const docsKey = [...matchedDocs].sort().join('|');
    const setHash = crypto
      .createHash('md5')
      .update(docsKey)
      .digest('hex')
      .slice(0, 8);
    const debounceFile = path.join(
      os.tmpdir(),
      'docs-drift-' + sessionId + '-' + setHash + '.json',
    );

    if (fs.existsSync(debounceFile)) {
      process.exit(0);
    }

    // Write debounce marker
    try {
      fs.writeFileSync(debounceFile, JSON.stringify({ reminded: Date.now() }));
    } catch (_) {
      // Proceed even if debounce write fails
    }

    const docList = [...matchedDocs].map((d) => '  - ' + d).join('\n');
    const message = `Docs may need updating after editing ${relPath}. Check:\n${docList}\nRun /sync-docs for a full comparison.`;

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
