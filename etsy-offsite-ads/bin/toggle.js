#!/usr/bin/env node
'use strict';

const path = require('path');
const { loadEnv, validateForPlaywright } = require('../src/config');
loadEnv();

const USAGE = `
Etsy off-site ads toggle (Printify UI)

  node bin/toggle.js on <productId>     Enable ads for one product
  node bin/toggle.js off <productId>    Disable ads for one product
  node bin/toggle.js sync --on|--off    Full Etsy store (resumable)
  node bin/toggle.js status             Job progress

Setup:
  npm run login
  npm run preflight
`;

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('--help') || args.includes('-h')) {
    console.log(USAGE);
    process.exit(0);
  }

  const cmd = args[0].toLowerCase();

  if (cmd === 'status') {
    const jobStore = require('../src/adsJobStore');
    const job = jobStore.loadJob();
    if (!job) {
      console.log('No job file. Run: node bin/toggle.js sync --on --fresh');
      process.exit(0);
    }
    console.log(JSON.stringify(job.stats, null, 2));
    console.log('Target ads:', job.targetEnable ? 'ON' : 'OFF');
    return;
  }

  if (cmd === 'sync') {
    const rest = args.slice(1);
    const { spawnSync } = require('child_process');
    const r = spawnSync(process.execPath, [path.join(__dirname, '../src/adsSync.js'), ...rest], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    process.exit(r.status ?? 1);
  }

  if (cmd !== 'on' && cmd !== 'off') {
    console.error('Unknown command:', cmd);
    console.log(USAGE);
    process.exit(1);
  }

  const productId = args[1];
  if (!productId) {
    console.error('Product ID required. Example: node bin/toggle.js off 6a08463f315e8641c5061426');
    process.exit(1);
  }

  validateForPlaywright();
  const { ensureSession, setOffsiteAds, closeBrowser } = require('../src/offsiteAds');

  const enable = cmd === 'on';
  console.log(`\n[toggle] Product ${productId} → ads ${enable ? 'ON' : 'OFF'}\n`);

  await ensureSession();
  try {
    const result = await setOffsiteAds(productId, enable);
    console.log('\n[toggle] Result:', JSON.stringify(result, null, 2));
    if (result.changed) {
      console.log(`[toggle] ✓ Ads ${result.newState ? 'enabled' : 'disabled'}`);
    } else {
      console.log('[toggle] ✓ Already in desired state');
    }
  } finally {
    await closeBrowser();
  }
}

main().catch((err) => {
  console.error('[toggle] ✗', err.message);
  process.exit(1);
});
