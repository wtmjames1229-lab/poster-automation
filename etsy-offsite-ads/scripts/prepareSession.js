#!/usr/bin/env node
'use strict';

/**
 * One-shot: headed login (if needed) → warm session → verify → upload to GitHub.
 *
 *   npm run session:prepare
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { loadEnv, validateForPlaywright, paths } = require('../src/config');

loadEnv();

const sessionFile = process.env.PRINTIFY_SESSION_FILE || paths.getSessionPath();
const pkgRoot = paths.getResourceRoot();

function runNode(script, extraEnv = {}) {
  const scriptPath = path.join(pkgRoot, script);
  const r = spawnSync(process.execPath, [scriptPath], {
    cwd: pkgRoot,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', ...extraEnv },
    stdio: 'inherit',
    encoding: 'utf8',
  });
  return r.status ?? 1;
}

async function fetchSampleProductId() {
  const key = process.env.PRINTIFY_API_KEY;
  const shopId = process.env.PRINTIFY_SHOP_ID || '18634010';
  if (!key) return '';
  try {
    const res = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/products.json?limit=1&page=1`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) return '';
    const data = await res.json();
    return data.data?.[0]?.id || '';
  } catch {
    return '';
  }
}

async function main() {
  validateForPlaywright();
  const productId = (await fetchSampleProductId()) || '';
  if (productId) process.env.VERIFY_PRODUCT_ID = productId;

  console.log('\n=== Step 1/4: Headed login (complete captcha if shown) ===\n');
  if (runNode('scripts/headedLogin.js') !== 0) {
    process.exit(1);
  }

  console.log('\n=== Step 2/4: Warm + export session file ===\n');
  if (runNode('scripts/exportSession.js') !== 0) {
    process.exit(1);
  }

  if (!fs.existsSync(sessionFile)) {
    console.error('Session file missing after export:', sessionFile);
    process.exit(1);
  }

  console.log('\n=== Step 3/4: Verify session locally ===\n');
  if (runNode('scripts/verifySession.js', { PLAYWRIGHT_VERIFY_MODE: 'session' }) !== 0) {
    console.error('Session verify failed — fix login and run again.');
    process.exit(1);
  }

  console.log('\n=== Step 4/4: Upload to GitHub secret PRINTIFY_SESSION_JSON ===\n');
  if (runNode('scripts/sessionToGithub.js') !== 0) {
    process.exit(1);
  }

  console.log('\n✓ Session ready for GitHub Actions. Re-run workflow: Etsy Ads Watch\n');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
