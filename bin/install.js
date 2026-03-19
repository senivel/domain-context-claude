#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PKG_ROOT = path.resolve(__dirname, '..');

const INSTALL_MAP = [
  { src: 'commands/dc', dest: 'commands/dc' },
  { src: 'hooks', dest: 'hooks', filter: (f) => f.startsWith('dc-') },
  { src: 'agents', dest: 'agents', filter: (f) => f.startsWith('dc-') },
  { src: 'rules', dest: 'rules', filter: (f) => f.startsWith('dc-') },
  { src: 'templates', dest: 'templates' },
  { src: 'tools', dest: 'tools', filter: (f) => f.startsWith('validate-') },
];

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Parse CLI arguments.
 * @param {string[]} argv - Arguments (typically process.argv.slice(2))
 * @returns {{ isLocal: boolean, isUninstall: boolean }}
 */
function parseArgs(argv) {
  return {
    isLocal: argv.includes('--local'),
    isUninstall: argv.includes('--uninstall'),
  };
}

/**
 * Check whether a hook entry belongs to domain-context.
 * Matches entries whose command string contains 'dc-'.
 * @param {object} entry - A hook group object from settings.json
 * @returns {boolean}
 */
function isDcHook(entry) {
  if (!entry.hooks || !Array.isArray(entry.hooks)) return false;
  return entry.hooks.some((h) => h.command && h.command.includes('dc-'));
}

/**
 * Merge dc hook entries into settings, replacing any existing dc entries.
 * Non-dc entries are preserved. Filter-then-append for idempotency.
 * @param {object} settings - The settings.json object (mutated in place)
 * @param {object} dcEntries - Map of event name to array of hook entries
 * @returns {object} The mutated settings object
 */
function mergeHooks(settings, dcEntries) {
  settings.hooks = settings.hooks || {};
  for (const [event, entries] of Object.entries(dcEntries)) {
    const existing = settings.hooks[event] || [];
    const cleaned = existing.filter((e) => !isDcHook(e));
    settings.hooks[event] = [...cleaned, ...entries];
  }
  return settings;
}

/**
 * Build the dc hook entries for settings.json.
 * Global installs use absolute quoted paths; local installs use relative paths.
 * @param {string} targetDir - The target .claude/ directory path
 * @param {boolean} isLocal - Whether this is a local install
 * @returns {object} Map of event name to array of hook entries
 */
function getDcHookEntries(targetDir, isLocal) {
  const hooksDir = isLocal ? '.claude/hooks' : path.join(targetDir, 'hooks');
  const quote = isLocal ? '' : '"';

  return {
    SessionStart: [
      {
        hooks: [
          {
            type: 'command',
            command: `node ${quote}${path.join(hooksDir, 'dc-freshness-check.js')}${quote}`,
          },
        ],
      },
    ],
    PostToolUse: [
      {
        matcher: 'Edit|Write|MultiEdit',
        hooks: [
          {
            type: 'command',
            command: `node ${quote}${path.join(hooksDir, 'dc-context-reminder.js')}${quote}`,
          },
        ],
      },
    ],
  };
}

/**
 * Determine the target .claude/ directory.
 * @param {boolean} isLocal - If true, use cwd; otherwise use home directory
 * @returns {string} Absolute path to the target .claude/ directory
 */
function getTargetDir(isLocal) {
  if (isLocal) {
    return path.join(process.cwd(), '.claude');
  }
  return path.join(os.homedir(), '.claude');
}

// ---------------------------------------------------------------------------
// Side-effect functions
// ---------------------------------------------------------------------------

/**
 * Copy distributable files from package source to target directory.
 * Entries without a filter use fs.cpSync recursive; entries with a filter
 * copy only matching files.
 * @param {string} targetDir - The target .claude/ directory path
 */
function copyFiles(targetDir) {
  for (const mapping of INSTALL_MAP) {
    const srcDir = path.join(PKG_ROOT, mapping.src);
    const destDir = path.join(targetDir, mapping.dest);

    if (!fs.existsSync(srcDir)) {
      continue;
    }

    fs.mkdirSync(destDir, { recursive: true });

    if (mapping.filter) {
      // Copy only matching files
      const files = fs.readdirSync(srcDir);
      for (const file of files) {
        if (mapping.filter(file)) {
          const srcFile = path.join(srcDir, file);
          const destFile = path.join(destDir, file);
          const stat = fs.statSync(srcFile);
          if (stat.isDirectory()) {
            fs.cpSync(srcFile, destFile, { recursive: true });
          } else {
            fs.copyFileSync(srcFile, destFile);
          }
        }
      }
    } else {
      // Copy entire directory recursively
      fs.cpSync(srcDir, destDir, { recursive: true });
    }

    // Ensure shell scripts have execute permission
    chmodShellScripts(destDir);
  }
}

/**
 * Recursively chmod any .sh files to 755.
 * @param {string} dir - Directory to scan
 */
function chmodShellScripts(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      chmodShellScripts(fullPath);
    } else if (entry.name.endsWith('.sh')) {
      fs.chmodSync(fullPath, 0o755);
    }
  }
}

/**
 * Remove dc-owned files from the target directory.
 * Uses INSTALL_MAP to determine which files belong to dc. For entries with
 * a filter, only matching files are removed. For entries without a filter
 * (commands/dc, templates), all files are removed.
 * @param {string} targetDir - The target .claude/ directory path
 * @returns {string[]} Array of absolute paths of removed files
 */
function removeDcFiles(targetDir) {
  const removed = [];

  for (const mapping of INSTALL_MAP) {
    const dir = path.join(targetDir, mapping.dest);
    if (!fs.existsSync(dir)) continue;

    if (mapping.dest === 'commands/dc') {
      // dc-owned directory: remove all contents then the directory itself
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of files) {
        const filePath = path.join(dir, entry.name);
        fs.rmSync(filePath, { recursive: true, force: true });
        removed.push(filePath);
        console.log(`  removed: ${filePath}`);
      }
      // Remove the dc/ subdirectory itself
      fs.rmdirSync(dir);
    } else {
      // For filtered dirs, remove only matching files; for unfiltered (templates), remove all
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const shouldRemove = mapping.filter ? mapping.filter(file) : true;
        if (shouldRemove) {
          const filePath = path.join(dir, file);
          fs.rmSync(filePath, { force: true });
          removed.push(filePath);
          console.log(`  removed: ${filePath}`);
        }
      }
    }
  }

  return removed;
}

/**
 * Remove dc hook entries from settings.json.
 * Filters out entries where isDcHook returns true from SessionStart
 * and PostToolUse arrays. Removes empty arrays.
 * @param {string} settingsPath - Path to settings.json
 * @returns {number} Count of removed hook entries
 */
function removeHooks(settingsPath) {
  if (!fs.existsSync(settingsPath)) return 0;

  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch {
    return 0;
  }

  if (!settings.hooks) return 0;

  let removedCount = 0;

  for (const event of Object.keys(settings.hooks)) {
    const entries = settings.hooks[event];
    if (!Array.isArray(entries)) continue;

    const cleaned = entries.filter((e) => {
      if (isDcHook(e)) {
        removedCount++;
        return false;
      }
      return true;
    });

    if (cleaned.length === 0) {
      delete settings.hooks[event];
    } else {
      settings.hooks[event] = cleaned;
    }
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  return removedCount;
}

/**
 * Print success message after install.
 * @param {string} targetDir - The target directory path
 */
function printInstallSuccess(targetDir) {
  console.log(`\ndomain-context-cc installed to ${targetDir}\n`);
  console.log('Next steps:');
  console.log('  1. Start a Claude Code session');
  console.log('  2. Run /dc:init in your project to set up domain context');
}

/**
 * Print success message after uninstall.
 * @param {string} targetDir - The target directory path
 * @param {number} fileCount - Number of files removed
 * @param {number} hookCount - Number of hook entries removed
 */
function printUninstallSuccess(targetDir, fileCount, hookCount) {
  console.log(`\ndomain-context-cc uninstalled from ${targetDir}`);
  console.log(`Removed ${fileCount} files and ${hookCount} hook entries`);
}

/**
 * Read-modify-write settings.json with dc hook entries.
 * Creates settings.json if it does not exist. On parse failure, backs up
 * the existing file and warns.
 * @param {string} settingsPath - Path to settings.json
 * @param {object} dcEntries - Hook entries from getDcHookEntries
 */
function updateSettings(settingsPath, dcEntries) {
  let settings = {};

  if (fs.existsSync(settingsPath)) {
    const raw = fs.readFileSync(settingsPath, 'utf8');
    try {
      settings = JSON.parse(raw);
    } catch (err) {
      // Back up corrupt file and warn
      const bakPath = settingsPath + '.bak';
      fs.copyFileSync(settingsPath, bakPath);
      console.warn(
        `Warning: Could not parse ${settingsPath}. Backed up to ${bakPath}`,
      );
      settings = {};
    }
  }

  mergeHooks(settings, dcEntries);
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const { isLocal, isUninstall } = parseArgs(process.argv.slice(2));
  const targetDir = getTargetDir(isLocal);
  const settingsPath = path.join(targetDir, 'settings.json');

  if (isUninstall) {
    console.log(`Uninstalling domain-context-cc from ${targetDir}`);
    const removed = removeDcFiles(targetDir);
    const hookCount = removeHooks(settingsPath);
    printUninstallSuccess(targetDir, removed.length, hookCount);
    return;
  }

  console.log(`Installing domain-context-cc to ${targetDir}`);

  copyFiles(targetDir);

  const dcEntries = getDcHookEntries(targetDir, isLocal);
  updateSettings(settingsPath, dcEntries);

  printInstallSuccess(targetDir);
}

// ---------------------------------------------------------------------------
// Module exports & entry point
// ---------------------------------------------------------------------------

if (typeof module !== 'undefined') {
  module.exports = {
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
    printInstallSuccess,
    printUninstallSuccess,
  };
}

if (require.main === module) {
  main();
}
