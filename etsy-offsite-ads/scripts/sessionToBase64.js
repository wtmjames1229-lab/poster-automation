#!/usr/bin/env node
'use strict';

/**
 * Encode printify_session.json for GitHub secret PRINTIFY_SESSION_B64
 *
 *   node scripts/sessionToBase64.js
 *   node scripts/sessionToBase64.js path/to/session.json
 */

const fs = require('fs');
const path = require('path');
const { loadEnv, paths } = require('../src/config');
loadEnv();

const sessionPath =
  process.argv[2] || process.env.PRINTIFY_SESSION_FILE || paths.getSessionPath();

if (!fs.existsSync(sessionPath)) {
  console.error('Session file not found:', sessionPath);
  console.error('Run: npm run login && npm run session:export');
  process.exit(1);
}

const b64 = fs.readFileSync(sessionPath).toString('base64');
console.log('\nAdd this value as GitHub secret: PRINTIFY_SESSION_B64\n');
console.log(b64);
console.log('\nLength:', b64.length, 'chars\n');
