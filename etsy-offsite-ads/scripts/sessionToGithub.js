#!/usr/bin/env node
'use strict';

/**
 * Upload printify_session.json to GitHub secret PRINTIFY_SESSION_JSON (minified one line).
 * Requires: gh CLI logged in, repo wtmjames1229-lab/poster-automation
 *
 *   node scripts/sessionToGithub.js
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const { loadEnv, paths } = require('../src/config');
loadEnv();

const sessionPath =
  process.env.PRINTIFY_SESSION_FILE || paths.getSessionPath();
const repo = process.env.GITHUB_REPO || 'wtmjames1229-lab/poster-automation';

if (!fs.existsSync(sessionPath)) {
  console.error('Missing session file:', sessionPath);
  console.error('Run: npm run login && npm run session:export');
  process.exit(1);
}

const json = JSON.stringify(JSON.parse(fs.readFileSync(sessionPath, 'utf8')));
console.log(`Session JSON: ${json.length} chars, uploading to ${repo}...`);

const gh = process.env.GH_PATH || 'gh';
const r = spawnSync(
  gh,
  ['secret', 'set', 'PRINTIFY_SESSION_JSON', '--repo', repo, '-b', '-'],
  { input: json, encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'] }
);

if (r.status !== 0) {
  console.error('gh secret set failed');
  process.exit(1);
}

console.log('Secret PRINTIFY_SESSION_JSON updated.');
console.log('Re-run workflow: Etsy Ads Watch');
