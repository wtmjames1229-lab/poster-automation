#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { loadEnv } = require('../src/config');
loadEnv();

const {
  CONFIG,
  getContext,
  closeBrowser,
  warmSession,
  isLoggedIn,
  setContextMode,
} = require('../src/offsiteAds');

const productId = (process.env.VERIFY_PRODUCT_ID || '').trim();

async function main() {
  const mode = process.env.PLAYWRIGHT_VERIFY_MODE;
  if (mode === 'session' || mode === 'profile') setContextMode(mode);

  if (mode === 'session' && !fs.existsSync(CONFIG.sessionFile)) {
    console.log('NO_SESSION_FILE');
    process.exit(2);
  }
  if (mode === 'profile' && !fs.existsSync(CONFIG.userDataDir)) {
    console.log('NO_PROFILE');
    process.exit(2);
  }

  const context = await getContext();
  const page = await context.newPage();
  try {
    await warmSession(page);
    let ok = await isLoggedIn(page);

    await page.goto('https://printify.com/app/products', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    ok = ok && (await isLoggedIn(page)) && !page.url().includes('login');

    if (productId) {
      const productUrl = `https://printify.com/app/product-details/${productId}`;
      await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await new Promise((r) => setTimeout(r, 3000));
      const onProduct =
        page.url().includes('product-details') && !page.url().includes('login');
      if (!onProduct) {
        console.log('PRODUCT_CHECK_FAILED', productId);
        console.log('URL:', page.url());
      }
      ok = ok && onProduct;
    }

    console.log(ok ? 'SESSION_OK' : 'SESSION_EXPIRED');
    if (!ok && !productId) console.log('URL:', page.url());
    process.exit(ok ? 0 : 3);
  } finally {
    await page.close().catch(() => null);
    await closeBrowser();
  }
}

main().catch(() => process.exit(1));
