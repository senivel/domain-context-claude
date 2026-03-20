#!/usr/bin/env node
// Domain Context Freshness Check - SessionStart hook
// Parses .context/MANIFEST.md and warns about stale entries (not verified
// within THRESHOLD_DAYS). Exits silently (code 0, no output) when:
//   - No .context/ directory exists
//   - No stale entries found
//   - Any error occurs (graceful degradation)
//
// Output: JSON with hookSpecificOutput.additionalContext containing
// a human-readable warning listing stale entries.

const fs = require('fs');
const path = require('path');

const THRESHOLD_DAYS = 90;

// Stdin timeout guard: if stdin doesn't close within 3s (e.g. pipe issues),
// exit silently instead of hanging until Claude Code kills the process.
let input = ''; // drain stdin (content unused — hook uses cwd instead)
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const cwd = process.cwd();
    const manifestPath = path.join(cwd, '.context', 'MANIFEST.md');

    // No .context/MANIFEST.md -- exit silently
    if (!fs.existsSync(manifestPath)) {
      process.exit(0);
    }

    const content = fs.readFileSync(manifestPath, 'utf8');
    const lines = content.split('\n');
    const now = new Date();
    const staleEntries = [];

    // Match entry lines: lines starting with "- [EntryName]"
    const entryPattern = /^-\s*\[([^\]]+)\]/;
    const verifiedPattern = /\[verified:\s*(\d{4})-(\d{2})-(\d{2})\]/;

    for (const line of lines) {
      const entryMatch = line.match(entryPattern);
      if (!entryMatch) continue;

      const entryName = entryMatch[1];
      const verifiedMatch = line.match(verifiedPattern);

      if (!verifiedMatch) {
        // No verified date -- flag as never verified
        staleEntries.push(`${entryName} (never verified)`);
      } else {
        // Parse date using local midnight to avoid UTC timezone issues
        const year = parseInt(verifiedMatch[1], 10);
        const month = parseInt(verifiedMatch[2], 10) - 1;
        const day = parseInt(verifiedMatch[3], 10);
        const verifiedDate = new Date(year, month, day);
        const daysSince = Math.floor(
          (now - verifiedDate) / (1000 * 60 * 60 * 24),
        );

        if (daysSince > THRESHOLD_DAYS) {
          const overdue = daysSince - THRESHOLD_DAYS;
          staleEntries.push(`${entryName} (${overdue} days overdue)`);
        }
      }
    }

    // No stale entries -- exit silently
    if (staleEntries.length === 0) {
      process.exit(0);
    }

    // Build warning message
    const header = `Domain Context: ${staleEntries.length} stale entries`;
    const list = staleEntries.map((e) => `  - ${e}`).join('\n');
    const action = 'Run /dc:refresh to review and update verified dates.';
    const message = `${header}\n${list}\n${action}`;

    const output = {
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: message,
      },
    };

    process.stdout.write(JSON.stringify(output));
  } catch (_e) {
    // Silent fail -- never block session start
    process.exit(0);
  }
});
