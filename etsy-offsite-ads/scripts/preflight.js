#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { loadEnv, validateForPlaywright, pkgRoot } = require('../src/config');
loadEnv();
const { fetchAllShopProducts, filterEtsyPublished, SHOP_ID } = require('../src/printifyShop');

async function main() {
  console.log('\n── Preflight ──\n');
  validateForPlaywright();

  const sessionFile = process.env.PRINTIFY_SESSION_FILE || './printify_session.json';
  const profileDir = process.env.PLAYWRIGHT_USER_DATA_DIR || path.join(__dirname, '..', 'data', 'chrome-profile');

  console.log('  API key        : OK');
  console.log('  Shop ID        :', SHOP_ID);
  console.log('  Session file   :', fs.existsSync(sessionFile) ? 'found' : 'MISSING');
  console.log('  Chrome profile :', fs.existsSync(profileDir) ? 'found' : 'optional');

  const all = await fetchAllShopProducts();
  const etsy = filterEtsyPublished(all);
  console.log('  Etsy listings  :', etsy.length);

  if (!fs.existsSync(sessionFile) && !fs.existsSync(profileDir)) {
    console.log('\n  ✗ No session. Run: npm run login:headed\n');
    process.exit(2);
  }

  const { ensureSession } = require('../src/offsiteAds');
  try {
    const mode = await ensureSession({ strict: true });
    console.log('  Browser session: OK (' + mode + ')');
    console.log('\n  Ready: npm run sync:off  or  node bin/toggle.js off <productId>\n');
    process.exit(0);
  } catch {
    console.log('\n  ✗ Session invalid. Run: npm run login:headed && node scripts/exportSession.js\n');
    process.exit(3);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
