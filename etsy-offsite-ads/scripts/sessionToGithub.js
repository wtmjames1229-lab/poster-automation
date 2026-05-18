#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const { loadEnv, paths } = require('../src/config');
loadEnv();

const sessionPath =
  process.env.PRINTIFY_SESSION_FILE || paths.getSessionPath();
const repo = process.env.GITHUB_REPO || 'wtmjames1229-lab/poster-automation';

function findGh() {
  if (process.env.GH_PATH && fs.existsSync(process.env.GH_PATH)) {
    return process.env.GH_PATH;
  }
  const win = 'C:\\Program Files\\GitHub CLI\\gh.exe';
  if (process.platform === 'win32' && fs.existsSync(win)) return win;
  return 'gh';
}

if (!fs.existsSync(sessionPath)) {
  console.error('Missing session file:', sessionPath);
  console.error('Run: npm run login && npm run session:export');
  process.exit(1);
}

const { readSessionFile, validateSessionState, minifySession } = require('../src/lib/sessionState');

const state = readSessionFile(sessionPath);
const check = validateSessionState(state);
if (!check.ok) {
  console.error('Session validation failed:', check.issues.join('; '));
  console.error('Run: npm run session:prepare');
  process.exit(1);
}
if (check.issues.length) {
  console.warn('[session] Warnings:', check.issues.join('; '));
}

const json = minifySession(state);
const gh = findGh();

console.log(`Session JSON: ${json.length} chars, ${state.cookies?.length || 0} cookies, uploading to ${repo}...`);

// Do not use `-b -`: that stores the literal "-" character, not stdin.
const r = spawnSync(gh, ['secret', 'set', 'PRINTIFY_SESSION_JSON', '--repo', repo], {
  input: json,
  encoding: 'utf8',
  maxBuffer: 15 * 1024 * 1024,
});

if (r.status !== 0) {
  console.error('gh secret set failed:', r.stderr || r.stdout || r.error);
  process.exit(1);
}

console.log('Secret PRINTIFY_SESSION_JSON updated.');
console.log('Re-run workflow: Etsy Ads Watch');
